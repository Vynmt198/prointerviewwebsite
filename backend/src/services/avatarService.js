/**
 * avatarService.js
 * D-ID Express API (async REST) — avatar lipsync video generation.
 *
 * Flow per question:
 *   1. Check Redis cache (nếu đã render câu hỏi này trước → return instantly)
 *   2. ElevenLabs TTS → audio buffer (qua ttsService.js)
 *   3. Upload audio buffer → Cloudinary → public audio URL
 *   4. POST /talks → D-ID job ID
 *   5. Poll GET /talks/:id until status=done
 *   6. Save result_url → Redis (180 ngày)
 *
 * Env vars:
 *   D_ID_API_KEY=<raw key>          — format: Basic base64(key:)
 *   HR_AVATAR_IMAGE_URL=<URL>        — ảnh tĩnh HR avatar (mặc định: Cloudinary PNG cũ)
 *   AVATAR_PROVIDER=did | tavus      — provider switch (mặc định: did)
 */

import crypto from "crypto";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { synthesizeSpeech } from "./ttsService.js";
import { cacheGet, cacheSet } from "./cacheService.js";
import { logger } from "../config/logger.js";

const DID_BASE = "https://api.d-id.com";

// Cloudinary PNG portrait dùng làm base image cho D-ID
const DEFAULT_AVATAR_FEMALE_URL =
  "https://res.cloudinary.com/dee4bvivu/image/upload/v1778910708/AI-female_gxbcf1.png";
const DEFAULT_AVATAR_MALE_URL =
  "https://res.cloudinary.com/dee4bvivu/image/upload/v1778910708/AI-male_sdrvje.png";
/** @deprecated use DEFAULT_AVATAR_FEMALE_URL */
const DEFAULT_AVATAR_URL = DEFAULT_AVATAR_FEMALE_URL;

// Cache TTL 180 ngày (video URLs D-ID CDN không expire sớm)
const VIDEO_CACHE_TTL = 180 * 24 * 3600;

// ── Config ───────────────────────────────────────────────────────────────────

function cfg() {
  return {
    apiKey:    process.env.D_ID_API_KEY       ?? "",
    avatarUrl: process.env.HR_AVATAR_IMAGE_URL ?? DEFAULT_AVATAR_FEMALE_URL,
    maleUrl:   process.env.HR_AVATAR_MALE_URL  ?? DEFAULT_AVATAR_MALE_URL,
  };
}

function didHeaders() {
  const { apiKey } = cfg();
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

export function isDIDEnabled() {
  return Boolean(cfg().apiKey);
}

export function getAvatarProvider() {
  const explicit = process.env.AVATAR_PROVIDER?.toLowerCase();
  if (explicit === "did" || explicit === "tavus") return explicit;
  return "did"; // default: D-ID Express API
}

// ── Azure TTS voice map (fallback khi không có ElevenLabs) ───────────────────

const AZURE_VOICES = {
  female: "vi-VN-HoaiMyNeural",
  male:   "vi-VN-NamMinhNeural",
};

// ── Cache key ─────────────────────────────────────────────────────────────────

function buildCacheKey(questionText, avatarImageUrl, voiceId) {
  const raw = `${questionText.trim()}::${avatarImageUrl}::${voiceId ?? "default"}`;
  return `did:v2:${crypto.createHash("md5").update(raw).digest("hex")}`;
}

// ── Audio: ElevenLabs TTS → Cloudinary CDN ───────────────────────────────────

/**
 * Sinh audio từ ElevenLabs rồi upload lên Cloudinary.
 * Trả về public audio URL (D-ID cần URL HTTP accessible).
 * Fallback: nếu ElevenLabs không có key → trả null → D-ID dùng text script thay thế.
 */
async function generateAndUploadAudio(text, ttsOpts = {}) {
  try {
    const ttsResult = await synthesizeSpeech(text, ttsOpts);
    if (!ttsResult) return null; // ElevenLabs not configured

    // Upload audio buffer → Cloudinary (resource_type: "video" cho audio files)
    const cdn = await uploadToCloudinary(ttsResult.buffer, {
      folder:        "prointerview/tts-audio",
      resource_type: "video",
      format:        "mp3",
      overwrite:     false,
    });

    if (!cdn) return null; // Cloudinary not configured
    return cdn.url;
  } catch (err) {
    logger.warn("avatar_audio_upload_failed", { error: err.message });
    return null;
  }
}

// ── D-ID Express API ──────────────────────────────────────────────────────────

/**
 * Tạo D-ID talk job.
 * @param {string} avatarImageUrl - URL ảnh tĩnh (portrait)
 * @param {string|null} audioUrl - Public audio URL từ ElevenLabs/Cloudinary
 * @param {string} questionText - Fallback khi không có audioUrl (D-ID Azure TTS)
 * @param {object} opts
 * @param {string} [opts.voiceId="vi-VN-HoaiMyNeural"] - Azure voice (dùng khi không có ElevenLabs)
 * @returns {string} D-ID talk job ID
 */
async function createDIDTalk(avatarImageUrl, audioUrl, questionText, opts = {}) {
  const voiceId = opts.voiceId ?? "vi-VN-HoaiMyNeural";

  const script = audioUrl
    ? { type: "audio", audio_url: audioUrl }
    : {
        type:     "text",
        input:    questionText,
        provider: { type: "microsoft", voice_id: voiceId },
      };

  const body = {
    source_url: avatarImageUrl,
    script,
    config: {
      stitch:        true,
      result_format: "mp4",
      fluent:        true,
      pad_audio:     0.5,
    },
  };

  const res = await fetch(`${DID_BASE}/talks`, {
    method:  "POST",
    headers: didHeaders(),
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`D-ID create talk failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Poll D-ID talk job đến khi status=done.
 * @param {string} talkId
 * @param {number} [timeoutMs=120000]
 * @returns {string} result_url (MP4 video URL)
 */
async function pollDIDTalk(talkId, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let interval   = 2000;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval));
    interval = Math.min(interval * 1.3, 8000); // exponential backoff, max 8s

    const res = await fetch(`${DID_BASE}/talks/${talkId}`, {
      headers: didHeaders(),
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) continue;
    const data = await res.json();

    if (data.status === "done") return data.result_url;
    if (data.status === "error") {
      throw new Error(`D-ID talk ${talkId} error: ${JSON.stringify(data.error ?? data)}`);
    }
    // status: "created" | "started" → tiếp tục poll
  }

  throw new Error(`D-ID talk ${talkId} timed out after ${timeoutMs}ms`);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Trả về 1 MP4 video URL cho câu hỏi đã cho.
 * Cache → generate audio → D-ID render → cache result.
 *
 * @param {string} questionText
 * @param {object} [opts]
 * @param {string} [opts.gender="female"] - "female" | "male"
 * @param {string} [opts.voiceId]         - ElevenLabs voice ID override
 * @param {string} [opts.avatarImageUrl]  - Override avatar image
 * @returns {Promise<{videoUrl: string, fromCache: boolean, talkId?: string}>}
 */
export async function generateVideoForQuestion(questionText, opts = {}) {
  if (!isDIDEnabled()) {
    throw new Error("D_ID_API_KEY chưa được cấu hình.");
  }

  const { gender = "female", voiceId, avatarImageUrl } = opts;
  const { avatarUrl, maleUrl } = cfg();
  const resolvedAvatarUrl = avatarImageUrl ?? (gender === "male" ? maleUrl : avatarUrl);
  // Derive Azure TTS voice from gender when no explicit voiceId provided
  const resolvedVoiceId = voiceId ?? AZURE_VOICES[gender] ?? AZURE_VOICES.female;

  // 1. Cache lookup
  const cacheKey = buildCacheKey(questionText, resolvedAvatarUrl, resolvedVoiceId);
  const cached   = await cacheGet(cacheKey);
  if (cached) {
    return { videoUrl: cached, fromCache: true };
  }

  // 2. TTS audio (optional — if ElevenLabs not configured, D-ID uses its own Azure TTS)
  const audioUrl = await generateAndUploadAudio(questionText, { voiceId: resolvedVoiceId });

  // 3. Create D-ID talk
  const talkId = await createDIDTalk(resolvedAvatarUrl, audioUrl, questionText, { voiceId: resolvedVoiceId });

  // 4. Poll until done
  const videoUrl = await pollDIDTalk(talkId);

  // 5. Cache result
  await cacheSet(cacheKey, videoUrl, VIDEO_CACHE_TTL);

  logger.info("avatar_video_generated", { talkId, fromCache: false, textLen: questionText.length });

  return { videoUrl, fromCache: false, talkId };
}

/**
 * Pre-generate videos cho nhiều câu hỏi song song.
 * Trả mảng kết quả theo thứ tự questions[].
 *
 * @param {string[]} questions - Danh sách câu hỏi text
 * @param {object} [opts]     - Shared options (gender, voiceId, avatarImageUrl)
 * @param {Function} [onProgress] - Callback(done, total) khi mỗi video xong
 * @returns {Promise<Array<{videoUrl: string, fromCache: boolean, error?: string}>>}
 */
export async function pregenerateVideos(questions, opts = {}, onProgress) {
  const total   = questions.length;
  let   done    = 0;

  const tasks = questions.map(async (questionText) => {
    try {
      const result = await generateVideoForQuestion(questionText, opts);
      done++;
      onProgress?.(done, total);
      return result;
    } catch (err) {
      done++;
      onProgress?.(done, total);
      logger.error("pregen_video_failed", { questionText: questionText.slice(0, 80), error: err.message });
      return { videoUrl: null, fromCache: false, error: err.message };
    }
  });

  // Parallel execution — tất cả task chạy đồng thời
  return Promise.all(tasks);
}

/**
 * Lấy thông tin usage của D-ID account.
 */
export async function getDIDUsage() {
  if (!isDIDEnabled()) return null;
  const res = await fetch(`${DID_BASE}/credits`, {
    headers: didHeaders(),
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Danh sách presenters (stock avatars) từ D-ID.
 */
export async function listDIDPresenters() {
  if (!isDIDEnabled()) return [];
  const res = await fetch(`${DID_BASE}/presenters`, {
    headers: didHeaders(),
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.presenters ?? [];
}
