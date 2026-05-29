import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Mic as Microphone,
  MicOff as MicrophoneSlash,
  PhoneOff as PhoneDisconnect,
  Clock,
  ChevronRight as CaretRight,
  ChevronDown,
  Lock,
  Zap as Lightning,
  CheckCircle,
  AlertCircle as WarningCircle,
  User,
  MessageCircle as ChatCircle,
  Star,
} from "lucide-react";
import { getPlans, hasAuthCredentials } from "../../utils/auth";
import { addInterviewRecord } from "../../utils/history";
import {
  saveAnswer,
  completeInterviewSession,
  analyzeFaceSnapshot,
} from "../../utils/interviewsApi";
import { useDIDStream } from "../../hooks/useDIDStream";
import { useFaceAnalysis } from "../../hooks/useFaceAnalysis";
import { AILipSyncAvatar } from "../../components/interview/AILipSyncAvatar";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { InterviewStepBar } from "../../components/interview/InterviewStepBar";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";
import { CustomerPageHeader } from "../../components/layout/CustomerPageHeader";

/* ── Session storage keys ────────────────────────────────── */
const TRANSCRIPT_KEY = "prointerview_transcripts";

/* ── Free limit ──────────────────────────────────────────── */
const FREE_LIMIT = 3;

/* ── HR assets ───────────────────────────────────────────── */
const HR_IDLE_URLS = {
  male:   "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336646/Male_jioqsx.mp4",
  female: "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4",
};

const HR_QUESTION_URLS = {
  female: [
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340828/FQ1vid_rdw1xo.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340833/FQ2vid_vmp7ae.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340829/FQ3vid_glpon5.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1775044177/T%E1%BA%A1o_Video_T%C6%B0%C6%A1ng_T%C3%A1c_Theo_Y%C3%AAu_C%E1%BA%A7u_ijplpc.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340829/FQ3vid_glpon5.mp4",
  ],
  male: [
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340828/MQ1vid_hngp8o.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340832/MQ2vid_xaioj6.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340829/MQ3vid_h7t02k.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340832/MQ2vid_xaioj6.mp4",
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774340829/MQ3vid_h7t02k.mp4",
  ],
};

const HR_NAMES  = { male: "David",                female: "Sarah" };
const HR_TITLES = { male: "HR AI Nam · ProInterview", female: "HR AI Nữ · ProInterview" };

/* ── D-ID config ─────────────────────────────────────────── */
const DID_API_KEY = import.meta.env.VITE_DID_API_KEY ?? "";

const DID_VOICES = {
  male:   "vi-VN-NamMinhNeural",
  female: "vi-VN-HoaiMyNeural",
};

const DID_AVATAR_URLS = {
  female: "https://res.cloudinary.com/dee4bvivu/image/upload/v1778910708/AI-female_gxbcf1.png",
  male:   "https://res.cloudinary.com/dee4bvivu/image/upload/v1778910708/AI-male_sdrvje.png",
};

/* ── Hedge word patterns (Vietnamese) ───────────────────── */
const HEDGE_PATTERNS = [
  /tôi nghĩ là/gi, /có lẽ/gi, /hình như/gi, /đại khái/gi,
  /ở mức nào đó/gi, /cũng được/gi,
  /không biết có đúng không/gi, /chưa chắc/gi,
  /tạm thời/gi, /thật ra là/gi,
  /không chắc lắm/gi, /có thể là/gi,
];

function detectHedgeWords(text) {
  if (!text) return { hedgeWordCount: 0, hedgeWords: [] };
  const found = [];
  for (const p of HEDGE_PATTERNS) {
    const m = text.match(p);
    if (m) found.push(...m);
  }
  return {
    hedgeWordCount: found.length,
    hedgeWords: [...new Set(found.map((h) => h.toLowerCase()))],
  };
}

function computeVocabularyDiversity(text) {
  if (!text?.trim()) return 0;
  const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length < 5) return 0;
  return Math.round((new Set(words).size / words.length) * 100) / 100;
}

/** Tính behavioral summary toàn session từ mảng per-question data */
function computeBehavioralSummary(perQ) {
  // Chỉ tính với câu có ít nhất 1 giá trị thực (user thực sự trả lời)
  const valid = perQ.filter(
    (d) => d && typeof d.responseLatencyMs === "number" &&
    (d.responseLatencyMs > 0 || d.wordCount > 0 || d.silenceEvents > 0)
  );
  if (!valid.length) return null;
  const avg = (key) => valid.reduce((s, d) => s + (d[key] ?? 0), 0) / valid.length;

  const avgResponseLatencyMs   = Math.round(avg("responseLatencyMs"));
  const avgSilenceRatio        = Math.round(avg("silenceRatio") * 100) / 100;
  const avgEyeContactScore     = Math.round(avg("eyeContactScore") * 100) / 100;
  const avgHeadStabilityScore  = Math.round(avg("headStabilityScore") * 100) / 100;
  const totalHedgeWords        = valid.reduce((s, d) => s + (d.hedgeWordCount ?? 0), 0);
  const avgVocabularyDiversity = Math.round(avg("vocabularyDiversity") * 100) / 100;
  const avgAmplitudeVariance   = Math.round(avg("amplitudeVariance") * 100) / 100;

  // hedgeRatio: hedge words / tổng số từ thực tế (không phải ước lượng)
  const totalWords = valid.reduce((s, d) => s + (d.wordCount ?? 0), 0);
  const hedgeRatio = totalWords > 0 ? totalHedgeWords / totalWords : 0;

  // Composite confidence (0–5)
  // Nếu thiết bị không hỗ trợ face analysis → bỏ qua dimension eye/head (redistribute weight)
  const hasEyeData  = avgEyeContactScore > 0;
  const hasHeadData = avgHeadStabilityScore > 0;
  const latencyScore = avgResponseLatencyMs < 3000 ? 1 : avgResponseLatencyMs < 7000 ? 0.6 : 0.2;
  const fluencyScore = avgSilenceRatio < 0.10 ? 1 : avgSilenceRatio < 0.25 ? 0.6 : 0.2;
  const exprScore    = avgAmplitudeVariance > 0.07 ? 1 : avgAmplitudeVariance > 0.03 ? 0.6 : 0.2;
  const hedgeScore   = hedgeRatio < 0.02 ? 1 : hedgeRatio < 0.05 ? 0.7 : 0.3;

  // Trọng số điều chỉnh theo data có sẵn
  const w = {
    eye:       hasEyeData  ? 0.20 : 0,
    head:      hasHeadData ? 0.15 : 0,
    fluency:   0.15,
    expr:      0.15,
    hedge:     0.15,
    vocab:     0.10,
    latency:   0.10,
  };
  const missingWeight = (hasEyeData ? 0 : 0.20) + (hasHeadData ? 0 : 0.15);
  // Redistribute missing weight proportionally to remaining dimensions
  const totalW = 1 - missingWeight;
  const composite = totalW > 0 ? (
    (hasEyeData  ? avgEyeContactScore    * w.eye   : 0) +
    (hasHeadData ? avgHeadStabilityScore * w.head  : 0) +
    fluencyScore             * w.fluency +
    exprScore                * w.expr +
    hedgeScore               * w.hedge +
    avgVocabularyDiversity   * w.vocab +
    latencyScore             * w.latency
  ) / totalW : 0;

  const overallConfidenceScore = Math.round(composite * 50) / 10;

  // Dominant emotion từ Google Vision snapshots
  const emotions = valid.map((d) => d.emotion).filter(Boolean);
  let dominantEmotion = "neutral";
  if (emotions.length > 0) {
    const totals = { joy: 0, sorrow: 0, anger: 0, surprise: 0 };
    for (const e of emotions) {
      totals.joy      += e.joy      ?? 0;
      totals.sorrow   += e.sorrow   ?? 0;
      totals.anger    += e.anger    ?? 0;
      totals.surprise += e.surprise ?? 0;
    }
    const max = Math.max(...Object.values(totals));
    if (max > emotions.length * 2) {
      dominantEmotion = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  return {
    avgResponseLatencyMs,
    avgSilenceRatio,
    avgEyeContactScore,
    avgHeadStabilityScore,
    totalHedgeWords,
    avgVocabularyDiversity,
    avgAmplitudeVariance,
    overallConfidenceScore,
    dominantEmotion,
  };
}

/* ── Location state helpers ─────────────────────────────── */
function interviewMetaFromLocationState(state) {
  if (!state || typeof state !== "object") return { position: "Phỏng vấn AI", company: "—" };
  if (state.form?.position)        return { position: String(state.form.position), company: state.form.company ? String(state.form.company) : "—" };
  if (state.latestCV?.position)    return { position: String(state.latestCV.position), company: state.latestCV.company ? String(state.latestCV.company) : "—" };
  if (state.storedCV?.position)    return { position: String(state.storedCV.position), company: state.storedCV.company ? String(state.storedCV.company) : "—" };
  return { position: "Phỏng vấn AI", company: "—" };
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatTimer(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ── Waveform bars ───────────────────────────────────────── */
function Waveform({ active, color = "#9B6DFF" }) {
  const heights = [4, 10, 16, 12, 20, 14, 8, 18, 12, 6, 15, 10, 19, 9, 13];
  return (
    <div className="flex items-end gap-0.5 h-7">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            height: active ? `${h}px` : "3px",
            background: color,
            animation: active ? `pulse ${0.5 + (i % 3) * 0.2}s ease-in-out infinite alternate` : "none",
            animationDelay: `${i * 0.07}s`,
            opacity: active ? 0.85 + (i % 2) * 0.15 : 0.25,
            transition: "height 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ── Full-panel HR Video ─────────────────────────────────── */
function HRVideoPanel({ questionVideoUrl, hrPhase, onAskingDone, isListening }) {
  const videoRef  = useRef(null);
  const [videoState, setVideoState] = useState("loading");
  const doneRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    doneRef.current = false;
    setVideoState("loading");
    const onCanPlay = () => { setVideoState("playing"); v.play().catch(() => {}); };
    const onError   = () => setVideoState("error");
    v.addEventListener("canplay", onCanPlay, { once: true });
    v.addEventListener("error",   onError,   { once: true });
    v.load();
    return () => { v.removeEventListener("canplay", onCanPlay); v.removeEventListener("error", onError); v.pause(); };
  }, [questionVideoUrl]);

  useEffect(() => {
    if (hrPhase !== "asking") return;
    const t = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; setVideoState("done"); onAskingDone(); }
    }, 8000);
    return () => clearTimeout(t);
  }, [hrPhase, onAskingDone]);

  const handleEnded = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setVideoState("done");
    onAskingDone();
  };

  const isVisible = videoState === "playing" || videoState === "done";

  return (
    <div className="relative w-full h-full bg-[#0a0a18]">
      <video
        ref={videoRef}
        src={questionVideoUrl}
        playsInline
        preload="auto"
        onEnded={handleEnded}
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ display: isVisible ? "block" : "none" }}
      />
      {(videoState === "loading" || videoState === "error") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: "linear-gradient(160deg,#120d2b 0%,#1a1040 100%)" }}>
          {videoState === "error" ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(110,53,232,0.2)", border: "2px solid rgba(110,53,232,0.3)" }}>
                <User className="w-10 h-10 text-[#9B6DFF]" />
              </div>
              <p className="text-white/40 text-sm">HR đang chuẩn bị câu hỏi...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <p className="text-white/40 text-sm">Đang tải câu hỏi...</p>
            </>
          )}
        </div>
      )}
      {videoState === "done" && isListening && (
        <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="absolute right-3 top-3">
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: "rgba(110,53,232,0.92)", backdropFilter: "blur(8px)" }}>
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b5e636]" />
              Đang ghi âm câu trả lời...
            </div>
          </div>
        </div>
      )}
      {hrPhase === "asking" && videoState === "playing" && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(110,53,232,0.85)", backdropFilter: "blur(8px)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#b5e636] animate-pulse" />
            <span className="text-white">HR đang hỏi...</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(10,10,24,0.85) 0%, transparent 100%)" }} />
    </div>
  );
}

/* ── User camera tile ─────────────────────────────────────────────────────────
   forwardRef: exposes video element to InterviewRoom for FaceMesh sampling.
   onAudioTrack: passes audio MediaStreamTrack so InterviewRoom can build its
   AudioContext without a second getUserMedia call (avoids double permission).
 */
const UserCameraTile = forwardRef(function UserCameraTile({ isRecording, onAudioTrack }, faceVideoRef) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [camState, setCamState] = useState("loading");
  const [camError, setCamError] = useState("Camera không khả dụng");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stream = null;
      try {
        // Request camera + audio together — single permission dialog
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: true,
        });
      } catch (_) {
        // Fallback: video-only (some devices lack mic or user denied audio)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false,
          });
        } catch (err) {
          if (cancelled) return;
          const msg =
            err?.name === "NotAllowedError" ? "Bạn chưa cấp quyền camera"
            : err?.name === "NotFoundError" ? "Không tìm thấy camera"
            : "Camera không khả dụng";
          setCamError(msg);
          setCamState("error");
          return;
        }
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      // Pass audio track to parent for Web Audio analysis (no second getUserMedia needed)
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && onAudioTrack) onAudioTrack(audioTrack);

      setCamState("active");
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (camState !== "active") return;
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
    // Expose video element to parent (for FaceMesh sampling)
    if (faceVideoRef) faceVideoRef.current = video;
  }, [camState, faceVideoRef]);

  return (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-2xl bg-[#0f0f1a]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ transform: "scaleX(-1)", display: camState === "active" ? "block" : "none" }}
      />
      {camState !== "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(110,53,232,0.2)", border: "2px solid rgba(110,53,232,0.3)" }}>
            <User className="w-7 h-7 text-[#9B6DFF]" />
          </div>
          <p className="text-white/40 text-xs text-center px-3">
            {camState === "loading" ? "Đang kết nối camera..." : camError}
          </p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.6)" }}>
        <span className="text-white text-xs font-medium">Bạn</span>
        {isRecording && <div className="w-1.5 h-1.5 rounded-full bg-[#b5e636] animate-pulse" />}
      </div>
    </div>
  );
});

/* ── Upgrade Modal ───────────────────────────────────────── */
function UpgradeModal({ completedCount, totalCount, onUpgrade, onFinish }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(8,6,20,0.93)", backdropFilter: "blur(16px)" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(110,53,232,0.25) 0%, transparent 70%)" }} />
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 text-center"
        style={{ background: "linear-gradient(160deg,#120d2b 0%,#1a1040 100%)", border: "1.5px solid rgba(139,77,255,0.3)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(110,53,232,0.2),rgba(139,77,255,0.1))", border: "2px solid rgba(139,77,255,0.4)" }}>
            <Lock className="w-9 h-9 text-[#8B4DFF]" />
          </div>
        </div>
        <div className="flex justify-center gap-1 mb-5">
          {[...Array(completedCount)].map((_, i) => <Star key={i} className="w-5 h-5 text-[#8B4DFF]" />)}
          {[...Array(totalCount - completedCount)].map((_, i) => <Star key={i} className="w-5 h-5 text-white/15" />)}
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Bạn đã hoàn thành {completedCount} câu hỏi miễn phí!</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Còn <span className="text-[#8B4DFF] font-semibold">{totalCount - completedCount} câu hỏi</span> nữa.
          Nâng cấp <span className="text-[#8B4DFF] font-semibold">Pro</span> để trả lời đầy đủ và nhận phân tích hành vi toàn diện.
        </p>
        <div className="rounded-2xl p-4 mb-6 text-left"
          style={{ background: "rgba(110,53,232,0.1)", border: "1px solid rgba(139,77,255,0.2)" }}>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Gói Pro bao gồm</p>
          {[
            "Phỏng vấn đầy đủ 5 câu hỏi mỗi buổi",
            "Phân tích eye contact & cảm xúc qua AI",
            "Phản hồi chi tiết từng câu với điểm số SHRM/DDI",
            "Không giới hạn số buổi phỏng vấn AI",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(110,53,232,0.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#b5e636]" />
              </div>
              <p className="text-white/70 text-xs">{item}</p>
            </div>
          ))}
        </div>
        <button onClick={onUpgrade}
          className="w-full py-3.5 rounded-2xl font-bold text-sm mb-3 transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg,#6E35E8,#8B4DFF)", color: "#fff", boxShadow: "0 8px 32px rgba(110,53,232,0.45)" }}>
          <Lightning className="inline w-4 h-4 mr-2 mb-0.5" />
          Nâng cấp Pro — tiếp tục phỏng vấn
        </button>
        <button onClick={onFinish}
          className="w-full py-3 rounded-2xl text-sm transition-all hover:bg-white/8"
          style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Kết thúc và xem kết quả {completedCount} câu
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function InterviewRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const plans = getPlans();
  const isPro = plans.starterPro || plans.elitePro;

  const hrGender =
    location.state?.hrGender ||
    sessionStorage.getItem("prointerview_hr_gender") ||
    "male";

  /* ── D-ID lipsync ─────────────────────────────────────── */
  const { status: didStatus, connect: didConnect, disconnect: didDisconnect,
          speakWithText, attachVideo } = useDIDStream({
    apiKey: DID_API_KEY,
    sourceImageUrl: DID_AVATAR_URLS[hrGender],
  });
  const isDIDActive = Boolean(DID_API_KEY) && didStatus !== "error";

  /* ── Resolve questions & session ID ──────────────────── */
  const apiQuestions = location.state?.questions ?? (() => {
    try { return JSON.parse(sessionStorage.getItem("prointerview_questions") ?? "null"); }
    catch { return null; }
  })();

  const resolvedSessionId = location.state?.sessionId
    ?? sessionStorage.getItem("prointerview_sessionId")
    ?? null;

  const QUESTIONS = apiQuestions?.length
    ? apiQuestions.map((q) => (typeof q === "string" ? q : q.question))
    : [];
  const QUESTION_OBJECTS = apiQuestions?.length ? apiQuestions : null;

  /* ── UI state ─────────────────────────────────────────── */
  const [phase,             setPhase]             = useState("ready");
  const [currentQ,          setCurrentQ]          = useState(0);
  const [isListening,       setIsListening]       = useState(false);
  const [transcript,        setTranscript]        = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [timerSeconds,      setTimerSeconds]      = useState(0);
  const [sttSupported,      setSttSupported]      = useState(true);
  const [sttError,          setSttError]          = useState("");
  const [allTranscripts,    setAllTranscripts]    = useState(Array(QUESTIONS.length).fill(""));
  const [hrPhase,           setHrPhase]           = useState("asking");
  const [showUpgradeModal,  setShowUpgradeModal]  = useState(false);
  const [showStarHints,     setShowStarHints]     = useState(false);

  /* ── Core refs ────────────────────────────────────────── */
  const recognitionRef     = useRef(null);
  const isListeningRef     = useRef(false);
  const transcriptRef      = useRef("");
  const timerRef           = useRef(null);
  const isNavigatingRef    = useRef(false);
  const questionStartTimeRef = useRef(Date.now());
  const lastSpokenQRef     = useRef(-1);

  /* ── Camera video ref (shared with FaceMesh hook) ─────── */
  const cameraVideoRef = useRef(null);

  /* ── Web Audio refs ───────────────────────────────────── */
  const audioCtxRef        = useRef(null);
  const analyserRef        = useRef(null);
  // audioStreamRef removed — audio track is now managed by UserCameraTile
  const audioSampleRef     = useRef([]);   // amplitude samples (0–1) current question
  const silenceStartRef    = useRef(null); // timestamp when silence started
  const silenceEventsRef   = useRef(0);    // count of >2 s silences
  const lastSilentRef      = useRef(false);
  const audioIntervalRef   = useRef(null);
  // Auto-calibration: session-level threshold derived from env noise floor
  const calibSamplesRef    = useRef([]);   // first 30 samples → set threshold
  const silenceThreshRef   = useRef(0.10); // updated after calibration

  /* ── Response latency refs ────────────────────────────── */
  const latencyStartRef    = useRef(null); // set when HR finishes asking
  const latencyMsRef       = useRef(0);    // ms until first speech
  const firstSpeechRef     = useRef(false);

  /* ── Per-question behavioral storage ─────────────────── */
  const behavioralPerQRef  = useRef(Array(QUESTIONS.length).fill(null));

  /* ── Google Vision emotion results per question ───────── */
  const emotionsRef        = useRef(Array(QUESTIONS.length).fill(null));

  /* ── Face analysis hook ───────────────────────────────── */
  const { resetMetrics: resetFace, getMetrics: getFaceMetrics } = useFaceAnalysis({
    videoRef: cameraVideoRef,
    isActive: isListening && phase === "question",
  });

  /* ── Guards: sessionStorage recovery ──────────────────── */
  useEffect(() => {
    if (!apiQuestions?.length || !resolvedSessionId) {
      navigate("/interview", { replace: true });
      return;
    }
    sessionStorage.setItem("prointerview_questions", JSON.stringify(apiQuestions));
    sessionStorage.setItem("prointerview_sessionId", resolvedSessionId);
    if (location.state?.hrGender) {
      sessionStorage.setItem("prointerview_hr_gender", location.state.hrGender);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Web Audio setup — nhận audio track từ UserCameraTile (không mở getUserMedia riêng) */
  const handleAudioTrack = useCallback((track) => {
    try {
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const source   = ctx.createMediaStreamSource(new MediaStream([track]));
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
    } catch (_) { /* browser không hỗ trợ Web Audio — bỏ qua, không crash */ }
  }, []);

  /* ── Audio sampling interval (100 ms, while isListening) ─ */
  useEffect(() => {
    clearInterval(audioIntervalRef.current);
    if (!isListening || !analyserRef.current) return;
    const data = new Float32Array(analyserRef.current.fftSize);
    audioIntervalRef.current = setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      analyser.getFloatTimeDomainData(data);
      const rms       = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
      const amplitude = Math.min(1, rms * 4);
      audioSampleRef.current.push(amplitude);

      // Auto-calibrate silence threshold from first 30 samples (~3 s of actual recording)
      // Runs once per session — calibSamplesRef is NOT reset between questions
      if (calibSamplesRef.current.length < 30) {
        calibSamplesRef.current.push(amplitude);
        if (calibSamplesRef.current.length === 30) {
          const avgNoise = calibSamplesRef.current.reduce((s, v) => s + v, 0) / 30;
          // threshold = 3× noise floor, bounded [0.05, 0.30]
          silenceThreshRef.current = Math.max(0.05, Math.min(0.30, avgNoise * 3));
        }
      }

      const isSilent = amplitude < silenceThreshRef.current;
      if (isSilent && !lastSilentRef.current) {
        silenceStartRef.current = Date.now();
      } else if (!isSilent && lastSilentRef.current && silenceStartRef.current) {
        if (Date.now() - silenceStartRef.current > 2000) silenceEventsRef.current += 1;
        silenceStartRef.current = null;
      }
      lastSilentRef.current = isSilent;
    }, 100);
    return () => clearInterval(audioIntervalRef.current);
  }, [isListening]);

  /* ── Timer ────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "question") return;
    timerRef.current = setInterval(() => setTimerSeconds((p) => p + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  /* ── Reset per-question state ─────────────────────────── */
  useEffect(() => {
    setHrPhase("asking");
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    setShowStarHints(false);
    questionStartTimeRef.current = Date.now();
    // Reset behavioral accumulators
    audioSampleRef.current   = [];
    silenceEventsRef.current = 0;
    silenceStartRef.current  = null;
    lastSilentRef.current    = false;
    latencyStartRef.current  = null;
    latencyMsRef.current     = 0;
    firstSpeechRef.current   = false;
    resetFace();
  }, [currentQ, resetFace]);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  /* ── Cleanup on unmount ───────────────────────────────── */
  useEffect(() => {
    return () => {
      isNavigatingRef.current = true;
      isListeningRef.current = false;
      recognitionRef.current?.abort();
      clearInterval(timerRef.current);
      clearInterval(audioIntervalRef.current);
      // Close AudioContext (audio track itself managed by UserCameraTile)
      audioCtxRef.current?.close().catch(() => {});
      didDisconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── D-ID preconnect ──────────────────────────────────── */
  const didConnectAttemptsRef = useRef(0);
  useEffect(() => {
    if (!DID_API_KEY) return;
    didConnectAttemptsRef.current = 1;
    didConnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "question" || !DID_API_KEY) return;
    if (didStatus === "connected" || didStatus === "connecting") return;
    if (didConnectAttemptsRef.current >= 2) return;
    didConnectAttemptsRef.current += 1;
    didConnect();
  }, [phase, didStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── D-ID speak ───────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "question" || didStatus !== "connected") return;
    if (lastSpokenQRef.current === currentQ) return;
    if (hrPhase !== "asking") return;
    lastSpokenQRef.current = currentQ;
    speakWithText(
      QUESTIONS[currentQ],
      () => {
        setHrPhase("listening");
        latencyStartRef.current = Date.now();
        isListeningRef.current = true;
        setIsListening(true);
        try { recognitionRef.current?.start(); } catch (_) {}
      },
      DID_VOICES[hrGender],
    );
  }, [phase, didStatus, currentQ, hrPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── STT setup ────────────────────────────────────────── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSttSupported(false); return; }
    const recognition = new SR();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interimText += event.results[i][0].transcript;
      }
      if (finalText) {
        // Track response latency on first speech of this question
        if (!firstSpeechRef.current && latencyStartRef.current) {
          latencyMsRef.current = Date.now() - latencyStartRef.current;
          firstSpeechRef.current = true;
        }
        setTranscript((prev) => {
          const j = prev ? prev + " " + finalText.trim() : finalText.trim();
          transcriptRef.current = j;
          return j;
        });
      }
      setInterimTranscript(interimText);
    };
    recognition.onend = () => {
      if (isListeningRef.current) { try { recognition.start(); } catch (_) {} }
      else setInterimTranscript("");
    };
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setSttSupported(false);
        setSttError("Trình duyệt chưa cấp quyền microphone.");
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    recognitionRef.current = recognition;
    return () => { isListeningRef.current = false; recognitionRef.current?.abort(); };
  }, []);

  /* ── Toggle mic ───────────────────────────────────────── */
  const toggleListening = () => {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setSttError("");
      if (!firstSpeechRef.current && !latencyStartRef.current) {
        latencyStartRef.current = Date.now();
      }
      isListeningRef.current = true;
      setIsListening(true);
      try { recognitionRef.current?.start(); } catch (_) {}
    }
  };

  /* ── Compute audio + text behavioral data for current Q ─ */
  const buildBehavioralData = (qIndex) => {
    // Audio
    const samples = audioSampleRef.current;
    const thresh  = silenceThreshRef.current;
    let avgAmplitude = 0, amplitudeVariance = 0, silenceRatio = 0;
    if (samples.length > 0) {
      avgAmplitude = samples.reduce((s, v) => s + v, 0) / samples.length;
      amplitudeVariance = Math.sqrt(
        samples.reduce((s, v) => s + (v - avgAmplitude) ** 2, 0) / samples.length
      );
      const silentCount = samples.filter((v) => v < thresh).length;
      silenceRatio = silentCount / samples.length;
    }
    // Text
    const text = (
      transcriptRef.current +
      (interimTranscript ? " " + interimTranscript : "")
    ).trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const { hedgeWordCount, hedgeWords } = detectHedgeWords(text);
    const vocabularyDiversity = computeVocabularyDiversity(text);
    // Face (MediaPipe)
    const faceMetrics = getFaceMetrics();
    // Emotion will be filled in by Google Vision callback
    const emotion = emotionsRef.current[qIndex] ?? null;

    return {
      responseLatencyMs:   latencyMsRef.current,
      silenceRatio:        Math.round(silenceRatio * 100) / 100,
      silenceEvents:       silenceEventsRef.current,
      avgAmplitude:        Math.round(avgAmplitude * 1000) / 1000,
      amplitudeVariance:   Math.round(amplitudeVariance * 1000) / 1000,
      wordCount,
      hedgeWordCount,
      hedgeWords,
      vocabularyDiversity,
      ...faceMetrics,
      ...(emotion ? { emotion } : {}),
    };
  };

  /* ── Capture frame & call Google Vision (fire-and-forget) ─ */
  const captureAndAnalyzeFace = (qIndex) => {
    const sessionId = resolvedSessionId;
    if (!sessionId || !hasAuthCredentials()) return;
    const video = cameraVideoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    const W = Math.min(video.videoWidth, 640);
    const H = Math.min(video.videoHeight, 480);
    canvas.width  = W;
    canvas.height = H;
    canvas.getContext("2d")?.drawImage(video, 0, 0, W, H);
    const base64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
    if (!base64) return;

    analyzeFaceSnapshot(sessionId, base64, qIndex)
      .then((res) => {
        if (res?.emotion) {
          emotionsRef.current[qIndex] = res.emotion;
        }
      })
      .catch(() => {});
  };

  /* ── Save transcript state ────────────────────────────── */
  const saveCurrentTranscript = () => {
    const full = (
      transcriptRef.current + (interimTranscript ? " " + interimTranscript : "")
    ).trim();
    const updated = [...allTranscripts];
    updated[currentQ] = full;
    setAllTranscripts(updated);
    return updated;
  };

  /* ── Persist answer to backend ────────────────────────── */
  const persistAnswer = (qIndex, updatedTranscripts) => {
    const sessionId = resolvedSessionId;
    if (!sessionId || !hasAuthCredentials()) return;
    const durationSeconds = Math.max(0, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const behavioralData  = buildBehavioralData(qIndex);
    behavioralPerQRef.current[qIndex] = behavioralData;
    saveAnswer(sessionId, {
      questionIndex: qIndex,
      questionText:  QUESTIONS[qIndex] ?? "",
      transcript:    updatedTranscripts[qIndex] ?? "",
      durationSeconds,
      behavioralData,
    }).catch(() => {});
  };

  /* ── Navigate to feedback ─────────────────────────────── */
  const goToFeedback = async (transcripts) => {
    isNavigatingRef.current = true;
    isListeningRef.current  = false;
    recognitionRef.current?.abort();
    clearInterval(timerRef.current);
    clearInterval(audioIntervalRef.current);
    sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(transcripts));
    if (QUESTION_OBJECTS) {
      sessionStorage.setItem("prointerview_question_objects", JSON.stringify(QUESTION_OBJECTS));
    }

    // Merge any still-pending emotions into behavioralPerQ
    const finalBehavioral = behavioralPerQRef.current.map((bd, i) => {
      if (!bd) return bd;
      const emotion = emotionsRef.current[i];
      return emotion ? { ...bd, emotion } : bd;
    });

    // Backup answers payload
    const backupAnswers = transcripts
      .map((t, i) => ({
        questionIndex:   i,
        questionText:    QUESTIONS[i] ?? "",
        transcript:      t ?? "",
        durationSeconds: 0,
        behavioralData:  finalBehavioral[i] ?? undefined,
      }))
      .filter((a) => a.transcript.trim().length > 0);

    // Compute session-level behavioral summary
    const behavioralSummary = computeBehavioralSummary(finalBehavioral.filter(Boolean));

    const sessionId = resolvedSessionId;
    if (hasAuthCredentials() && sessionId) {
      try {
        await completeInterviewSession(sessionId, {
          answers:              backupAnswers,
          totalDurationSeconds: timerSeconds,
          behavioralSummary:    behavioralSummary ?? undefined,
        });
      } catch { /* still navigate on fail */ }
    }

    const { position, company } = interviewMetaFromLocationState(location.state);
    addInterviewRecord({
      id:       `ai-${Date.now()}`,
      type:     "ai",
      date:     new Date().toISOString().slice(0, 10),
      position,
      company,
      scores:   { clarity: 0, structure: 0, relevance: 0, credibility: 0 },
      overall:  0,
      duration: Math.max(1, Math.round(timerSeconds / 60)),
      sessionId,
      pending:  true,
    });

    navigate("/interview/feedback", { state: { sessionId } });
  };

  /* ── Next / end handlers ──────────────────────────────── */
  const handleNextQuestion = () => {
    isListeningRef.current = false;
    recognitionRef.current?.abort();
    setIsListening(false);
    const updated = saveCurrentTranscript();
    persistAnswer(currentQ, updated);
    // Fire-and-forget Vision snapshot BEFORE moving question
    captureAndAnalyzeFace(currentQ);

    if (currentQ >= QUESTIONS.length - 1) {
      goToFeedback(updated);
      return;
    }
    if (!isPro && currentQ >= FREE_LIMIT - 1) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentQ((prev) => prev + 1);
  };

  const handleEndSession = () => {
    const updated = saveCurrentTranscript();
    persistAnswer(currentQ, updated);
    captureAndAnalyzeFace(currentQ);
    goToFeedback(updated);
  };

  const hasTranscript = transcript.trim().length > 0;
  const wordCount     = transcript.trim().split(/\s+/).filter(Boolean).length;

  const hrName     = HR_NAMES[hrGender];
  const hrTitle    = HR_TITLES[hrGender];
  const hrVideoUrl = HR_IDLE_URLS[hrGender];

  /* ══ RENDER — Ready lobby ════════════════════════════════ */
  if (phase === "ready") {
    return (
      <MentorPageShell bottomPad="pb-16">
        <div className={`relative z-10 pb-8 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
          <div className={`${CUSTOMER_SHELL_MAX} mx-auto w-full max-w-3xl`}>
            <CustomerPageHeader
              className="mb-5 w-full"
              title={
                <>
                  <span className="font-extrabold text-[#6d2fd6]">Luyện phỏng vấn với AI</span>{" "}
                  <span className="font-extrabold text-[#1a1b23]">Từ CV của bạn</span>
                </>
              }
              subtitle="Từ CV của bạn, ProInterview tạo buổi phỏng vấn thử với HR AI (~30 phút), phân tích hành vi và góp ý sau từng câu trả lời để bạn tự tin hơn trước buổi thật."
              subtitleClassName="mt-3 max-w-2xl text-base font-medium leading-relaxed text-violet-700/90"
            />

            <div className="w-full rounded-md border border-violet-200/80 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
              <InterviewStepBar current={3} />
              <div className="mb-6">
                <h2 className="text-base font-bold text-violet-950">Bước 3 — Phỏng vấn</h2>
                <p className="mt-0.5 text-sm text-violet-600">
                  Xác nhận HR và danh sách câu hỏi trước khi bắt đầu với {hrName}.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-x-10">
                <div className="relative mx-auto w-[300px] shrink-0 lg:mx-0">
                  <div className="h-[420px] overflow-hidden rounded-2xl border-2 border-violet-200/80 shadow-[0_12px_32px_rgba(110,53,232,0.12)]">
                    <video src={hrVideoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-[#630ed4]/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b5e636]" />
                    LIVE
                  </div>
                  <div className="absolute right-3 bottom-3 left-3 rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
                    <p className="text-sm font-semibold text-white">{hrName}</p>
                    <p className="text-xs text-white/65">{hrTitle}</p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Sẵn sàng</p>
                    <h3 className="mt-1 text-xl font-bold leading-tight text-violet-950 sm:text-2xl">
                      Phỏng vấn với <span className="text-[#630ed4]">{hrName}</span>
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-violet-600">
                      Buổi phỏng vấn gồm{" "}
                      <span className="font-semibold text-violet-900">{QUESTIONS.length} câu hỏi</span>
                      {!isPro && <span className="text-violet-700"> · 3 câu miễn phí, 2 câu sau cần Pro</span>}.
                      AI sẽ phân tích giọng nói, ánh mắt và ngôn ngữ cơ thể.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2">
                    {QUESTIONS.map((q, i) => {
                      const isLocked = !isPro && i >= FREE_LIMIT;
                      return (
                        <li key={i}
                          className={`flex min-h-[2.5rem] items-center gap-3 rounded-md border px-3 py-2 ${
                            isLocked ? "border-violet-100 bg-violet-50/40 opacity-65" : "border-violet-200/70 bg-violet-50/30"
                          }`}>
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isLocked ? "bg-violet-100 text-violet-300" : "bg-violet-200/80 text-[#630ed4]"
                          }`}>
                            {isLocked ? <Lock className="h-3 w-3" /> : i + 1}
                          </span>
                          <p className={`min-w-0 flex-1 text-xs leading-snug ${isLocked ? "text-violet-400" : "text-violet-800"}`}>
                            {isLocked ? "Yêu cầu gói Pro" : q}
                          </p>
                          {isLocked && (
                            <span className="shrink-0 rounded-full border border-violet-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#630ed4]">Pro</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-1 flex flex-col gap-2.5 pt-1">
                    <button type="button" onClick={() => setPhase("question")}
                      className="w-full rounded-md bg-gradient-to-r from-[#c4ff47] to-[#d4ff00] py-3.5 text-sm font-bold text-violet-950 shadow-[0_8px_24px_rgba(196,255,71,0.22)] transition-all hover:brightness-105">
                      Bắt đầu phỏng vấn →
                    </button>
                    <button type="button" onClick={() => navigate(-1)}
                      className="text-center text-sm font-medium text-violet-600 hover:text-[#630ed4]">
                      ← Quay lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MentorPageShell>
    );
  }

  if (!apiQuestions?.length || !resolvedSessionId) return null;

  /* ══ RENDER — Interview room ═════════════════════════════ */
  return (
    <MentorPageShell bottomPad="pb-0" fillHeight className="!min-h-0 !pb-0">
      <div className="relative flex h-svh max-h-svh flex-col overflow-hidden antialiased">

        {showUpgradeModal && (
          <UpgradeModal
            completedCount={FREE_LIMIT}
            totalCount={QUESTIONS.length}
            onUpgrade={() => navigate("/pricing")}
            onFinish={() => { setShowUpgradeModal(false); goToFeedback(allTranscripts); }}
          />
        )}

        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-violet-200/80 bg-white/85 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b5e636]" />
              <span className="text-xs font-semibold text-violet-800">REC</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-1">
              <Clock className="h-3 w-3 text-violet-500" />
              <span className="text-xs tabular-nums text-violet-800">{formatTimer(timerSeconds)}</span>
            </div>
            {isListening && (
              <div className="flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b5e636]" />
                <span className="text-xs font-medium text-violet-800">Ghi âm</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border-2 border-violet-300/80">
              <video src={hrVideoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            </div>
            <span className="hidden text-sm font-medium text-violet-900 sm:block">{hrName}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => {
                const locked = !isPro && i >= FREE_LIMIT;
                return (
                  <div key={i} className={`h-1.5 w-7 rounded-full transition-all duration-500 ${
                    locked ? "bg-violet-200"
                    : i < currentQ ? "bg-[#b5e636]/55"
                    : i === currentQ ? "bg-[#b5e636]"
                    : "bg-violet-100"
                  }`} />
                );
              })}
            </div>
            <span className="text-xs font-medium text-violet-600">{currentQ + 1}/{QUESTIONS.length}</span>
          </div>
        </div>

        {/* Question banner */}
        <div className="shrink-0 border-b border-violet-100 bg-white/70 px-4 py-2">
          <div className="flex items-start gap-2.5 rounded-md border border-violet-200/80 bg-violet-50/50 px-3 py-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] text-xs font-bold text-white">
              {currentQ + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug text-violet-950">{QUESTIONS[currentQ]}</p>
              {QUESTION_OBJECTS && (() => {
                const layer = QUESTION_OBJECTS[currentQ]?.layer;
                const layerMap = {
                  theory:   { label: "Lý thuyết",     color: "#630ed4", bg: "rgba(110,53,232,0.12)", border: "rgba(110,53,232,0.28)" },
                  project:  { label: "Dự án",          color: "#8B4DFF", bg: "rgba(139,77,255,0.12)", border: "rgba(139,77,255,0.28)" },
                  behavior: { label: "Hành vi · STAR", color: "#630ed4", bg: "rgba(110,53,232,0.1)",  border: "rgba(110,53,232,0.22)" },
                };
                const lm = layerMap[layer];
                if (!lm) return null;
                return (
                  <span className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ background: lm.bg, border: `1px solid ${lm.border}`, color: lm.color }}>
                    {lm.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* STAR guidance */}
        {QUESTION_OBJECTS && QUESTION_OBJECTS[currentQ]?.layer === "behavior" && (() => {
          const sg = QUESTION_OBJECTS[currentQ]?.starGuidance;
          const hasContent = sg && (sg.situation?.length || sg.task?.length || sg.action?.length || sg.result?.length);
          if (!hasContent) return null;
          return (
            <div className="shrink-0 border-b border-violet-100 bg-white/60 px-4 py-1.5">
              <div className="overflow-hidden rounded-md border border-violet-200/70 bg-violet-50/40">
                <button type="button"
                  onClick={() => setShowStarHints((p) => !p)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-violet-100/50">
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-[#630ed4]" />
                    <span className="text-xs font-semibold text-violet-950">Gợi ý STAR</span>
                    <span className="text-xs text-violet-600/70">— nhấn để {showStarHints ? "ẩn" : "xem"}</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-violet-500/60 transition-transform duration-200 ${showStarHints ? "rotate-180" : ""}`} />
                </button>
                {showStarHints && (
                  <div className="grid max-h-24 grid-cols-2 gap-2 overflow-y-auto px-4 pb-2 sm:grid-cols-4">
                    {[
                      { key: "situation", label: "S · Tình huống", color: "#630ed4", border: "border-violet-200" },
                      { key: "task",      label: "T · Nhiệm vụ",   color: "#8B4DFF", border: "border-violet-200" },
                      { key: "action",    label: "A · Hành động",  color: "#8B4DFF", border: "border-violet-200" },
                      { key: "result",    label: "R · Kết quả",    color: "#630ed4", border: "border-violet-300" },
                    ].map(({ key, label, color, border }) => {
                      const hints = sg[key] ?? [];
                      if (!hints.length) return null;
                      return (
                        <div key={key} className={`rounded border bg-white p-2.5 ${border}`}>
                          <p className="mb-1 text-xs font-semibold" style={{ color }}>{label}</p>
                          {hints.slice(0, 2).map((h, i) => (
                            <p key={i} className="text-xs leading-relaxed text-violet-700">· {h}</p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Main video panels */}
        <div className="grid min-h-0 flex-1 gap-2 px-3 pb-2 max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_4.5rem] lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_4.5rem]">
          {/* HR panel */}
          <div className={`relative min-h-0 h-full overflow-hidden rounded-xl border-2 bg-[#0a0a18] ${
            isDIDActive ? "border-violet-300/80 shadow-[0_8px_32px_rgba(110,53,232,0.12)]" : "border-violet-200/70"
          }`}>
            {isDIDActive ? (
              <>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(110,53,232,0.22) 0%, transparent 68%)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <AILipSyncAvatar isSpeaking={didStatus === "speaking"} didStatus={didStatus} attachVideo={attachVideo} size={220} />
                </div>
                {hrPhase === "asking" && didStatus === "speaking" && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(110,53,232,0.85)", backdropFilter: "blur(8px)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#b5e636] animate-pulse" />
                      <span className="text-white">HR đang hỏi...</span>
                    </div>
                  </div>
                )}
                {hrPhase === "listening" && isListening && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: "rgba(110,53,232,0.92)", backdropFilter: "blur(8px)" }}>
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#b5e636]" />
                      Đang ghi âm câu trả lời...
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(10,10,24,0.75) 0%, transparent 100%)" }} />
              </>
            ) : (
              <HRVideoPanel
                questionVideoUrl={HR_QUESTION_URLS[hrGender][currentQ]}
                hrPhase={hrPhase}
                onAskingDone={() => {
                  setHrPhase("listening");
                  latencyStartRef.current = Date.now();
                  isListeningRef.current  = true;
                  setIsListening(true);
                  try { recognitionRef.current?.start(); } catch (_) {}
                }}
                isListening={isListening}
              />
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
              <span className="text-white text-xs font-medium">{hrName}</span>
              <span className="text-white/40 text-xs">· HR AI</span>
            </div>
          </div>

          {/* User camera panel — UserCameraTile exposes video to cameraVideoRef */}
          <div className={`relative min-h-0 h-full overflow-hidden rounded-xl border-2 ${
            isListening ? "border-violet-400 shadow-[0_0_20px_rgba(110,53,232,0.15)]" : "border-violet-200/80 shadow-[0_8px_24px_rgba(110,53,232,0.1)]"
          }`}>
            <UserCameraTile ref={cameraVideoRef} isRecording={isListening} onAudioTrack={handleAudioTrack} />
            {isListening && (
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-violet-400/50" />
            )}
          </div>

          {/* Transcript panel */}
          <div className={`flex h-[4.5rem] max-h-[4.5rem] shrink-0 flex-col overflow-hidden rounded-md border bg-white transition-all lg:col-span-2 ${
            isListening ? "border-violet-300" : hasTranscript ? "border-violet-300/80" : "border-violet-200/80"
          }`}>
            <div className="flex shrink-0 items-center justify-between border-b border-violet-100 bg-violet-50/60 px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#b5e636]" />
                    <span className="text-xs font-semibold text-violet-800">Đang ghi âm...</span>
                    <Waveform active={true} color="#9B6DFF" />
                  </>
                ) : hasTranscript ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-xs font-semibold text-violet-900">Đã ghi nhận</span>
                  </>
                ) : (
                  <>
                    <ChatCircle className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs text-violet-600">Câu trả lời của bạn</span>
                  </>
                )}
              </div>
              {(hasTranscript || isListening) && (
                <span className="text-xs tabular-nums text-violet-500">{wordCount} từ</span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-1.5">
              {!sttSupported ? (
                <div className="flex h-full flex-col gap-2">
                  <p className="text-xs text-violet-700">
                    Trình duyệt không nhận diện được giọng nói — hãy gõ câu trả lời bên dưới.
                  </p>
                  <textarea
                    value={transcript}
                    onChange={(e) => { setTranscript(e.target.value); transcriptRef.current = e.target.value; }}
                    placeholder="Gõ câu trả lời của bạn vào đây..."
                    rows={2}
                    className="w-full flex-1 resize-none rounded-xl border border-violet-200 bg-white p-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>
              ) : !hasTranscript && !interimTranscript && !isListening ? null : (
                <div>
                  {hasTranscript && <p className="line-clamp-2 text-xs leading-snug text-black">{transcript}</p>}
                  {interimTranscript && (
                    <p className="line-clamp-2 text-xs leading-snug text-black italic">
                      {interimTranscript}
                      {isListening && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#b5e636] align-middle" />}
                    </p>
                  )}
                  {isListening && !hasTranscript && !interimTranscript && (
                    <span className="inline-block h-5 w-0.5 animate-pulse bg-[#b5e636]" />
                  )}
                </div>
              )}
              {sttError && (
                <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
                  <WarningCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                  <p className="text-xs text-violet-800">{sttError}</p>
                </div>
              )}
            </div>

            {hasTranscript && !isListening && sttSupported && (
              <div className="hidden shrink-0 border-t border-violet-100 px-2 py-1 sm:block">
                <button type="button"
                  onClick={() => {
                    isListeningRef.current = false;
                    recognitionRef.current?.abort();
                    setTranscript("");
                    setInterimTranscript("");
                    transcriptRef.current = "";
                    setTimeout(() => {
                      isListeningRef.current = true;
                      setIsListening(true);
                      try { recognitionRef.current?.start(); } catch (_) {}
                    }, 150);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-700 transition-all hover:bg-violet-50">
                  <Microphone className="w-3.5 h-3.5" />
                  Ghi lại
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Control bar */}
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-violet-200/80 bg-white/90 px-4 py-2 backdrop-blur-sm">
          <button type="button" onClick={handleEndSession} title="Kết thúc phỏng vấn"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-200 bg-violet-50 transition-all hover:bg-violet-100">
            <PhoneDisconnect className="h-5 w-5 text-violet-700" />
          </button>

          <div className="relative">
            {isListening && <div className="absolute inset-0 rounded-full bg-[#b5e636]/32 animate-ping" />}
            <button onClick={toggleListening} disabled={!sttSupported}
              title={isListening ? "Dừng ghi âm" : "Bắt đầu trả lời"}
              className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#6E35E8,#8B4DFF)",
                boxShadow: isListening ? "0 0 24px rgba(110,53,232,0.55)" : "0 0 24px rgba(110,53,232,0.5)",
              }}>
              {isListening
                ? <Microphone className="h-7 w-7 text-white" />
                : <MicrophoneSlash className="h-7 w-7 text-white" />}
            </button>
          </div>

          {currentQ < QUESTIONS.length - 1 ? (
            <button type="button" onClick={handleNextQuestion}
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#c4ff47] to-[#d4ff00] px-4 py-2 text-sm font-bold text-violet-950 shadow-[0_6px_20px_rgba(196,255,71,0.2)] transition-all hover:brightness-105">
              {!isPro && currentQ === FREE_LIMIT - 1 ? <><Lock className="h-4 w-4" /> Câu tiếp theo</> : <>Câu tiếp theo <CaretRight className="h-4 w-4" /></>}
            </button>
          ) : (
            <button type="button" onClick={handleNextQuestion}
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#c4ff47] to-[#d4ff00] px-4 py-2 text-sm font-bold text-violet-950 shadow-[0_6px_20px_rgba(196,255,71,0.2)] transition-all hover:brightness-105">
              Hoàn thành <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </MentorPageShell>
  );
}
