/**
 * useDIDStream — D-ID Streaming API (WebRTC)
 * ─────────────────────────────────────────────────────────
 * Luồng:
 *  1. POST /talks/streams       → tạo stream, nhận WebRTC offer + ICE servers
 *  2. RTCPeerConnection setup   → addTransceiver video/audio recvonly
 *  3. POST /talks/streams/{id}/sdp → gửi SDP answer
 *  4. POST /talks/streams/{id}/ice → forward ICE candidates
 *  5. ontrack → attach video stream lên <video> element
 *  6. POST /talks/streams/{id} → gửi script (audio_url hoặc text) để avatar nói
 *  7. DELETE /talks/streams/{id} → dọn stream khi xong
 *
 * Avatar video từ D-ID đã sync miệng với audio — KHÔNG cần play audio riêng.
 * ─────────────────────────────────────────────────────────
 * Đăng ký API key miễn phí tại: https://studio.d-id.com
 * Basic auth: base64(YOUR_KEY + ":")
 */

import { useRef, useState, useCallback } from "react";

export const DID_API = "https://api.d-id.com";

/** Fallback nếu caller không truyền sourceImageUrl */
const FALLBACK_AVATAR =
  "https://res.cloudinary.com/dee4bvivu/image/upload/v1778910708/AI-female_gxbcf1.png";

export function useDIDStream({ apiKey, sourceImageUrl } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError]   = useState("");

  const pcRef              = useRef(null);
  const streamIdRef        = useRef("");
  const sessionIdRef       = useRef("");
  const videoElRef         = useRef(null);
  const endTimerRef        = useRef();
  const connectTimerRef    = useRef();
  const sourceImageUrlRef  = useRef(sourceImageUrl || FALLBACK_AVATAR);

  const isConfigured = Boolean(apiKey && apiKey !== "YOUR_DID_API_KEY");

  // ── Build auth headers ────────────────────────────────────
  const getHeaders = useCallback(() => ({
    Authorization: `Basic ${btoa(apiKey + ":")}`,
    "Content-Type": "application/json",
  }), [apiKey]);

  // ── Attach video element ──────────────────────────────────
  const attachVideo = useCallback((el) => {
    videoElRef.current = el;
  }, []);

  // ── Connect ───────────────────────────────────────────────
  const connect = useCallback(async (sourceUrl = sourceImageUrlRef.current) => {
    if (!isConfigured) {
      setStatus("error");
      setError("D-ID API key chưa được cấu hình");
      return;
    }
    if (status === "connecting" || status === "connected") return;

    setStatus("connecting");
    setError("");

    try {
      // Dọn stream cũ còn sót từ session trước (page refresh / unexpected unmount)
      // Fetch với keepalive để không bị cancel khi unload — nhưng ở đây ta đang connect
      // nên dùng fire-and-forget bình thường
      const prevId  = sessionStorage.getItem("did_stream_id");
      const prevSid = sessionStorage.getItem("did_session_id");
      if (prevId && prevSid) {
        fetch(`${DID_API}/talks/streams/${prevId}`, {
          method:  "DELETE",
          headers: getHeaders(),
          body:    JSON.stringify({ session_id: prevSid }),
        }).catch(() => {});
        sessionStorage.removeItem("did_stream_id");
        sessionStorage.removeItem("did_session_id");
      }

      // 1. Tạo D-ID stream
      const res = await fetch(`${DID_API}/talks/streams`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ source_url: sourceUrl }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.description || e.message || `HTTP ${res.status}`);
      }

      const { id, session_id, offer, ice_servers } = await res.json();
      streamIdRef.current  = id;
      sessionIdRef.current = session_id;

      // Lưu vào sessionStorage để cleanup khi trang unload bất ngờ
      sessionStorage.setItem("did_stream_id",  id);
      sessionStorage.setItem("did_session_id", session_id);

      // 2. RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: ice_servers });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      // 3. Video/audio track → attach lên <video> + gọi play() để bypass autoplay policy
      pc.ontrack = (event) => {
        if (videoElRef.current && event.streams[0]) {
          videoElRef.current.srcObject = event.streams[0];
          videoElRef.current.play().catch(() => {});
        }
      };

      // 4. ICE candidates → forward tới D-ID
      pc.onicecandidate = async ({ candidate }) => {
        if (!candidate || !streamIdRef.current) return;
        try {
          await fetch(`${DID_API}/talks/streams/${streamIdRef.current}/ice`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              candidate:     candidate.candidate,
              sdpMid:        candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
              session_id:    sessionIdRef.current,
            }),
          });
        } catch {
          // ICE lỗi lẻ là bình thường
        }
      };

      // 5. Theo dõi connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          clearTimeout(connectTimerRef.current);
          setStatus("connected");
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          clearTimeout(connectTimerRef.current);
          setStatus("error");
          setError("WebRTC kết nối thất bại");
        }
      };

      // 6. SDP exchange
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const sdpRes = await fetch(`${DID_API}/talks/streams/${id}/sdp`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ answer, session_id }),
      });

      if (!sdpRes.ok) {
        throw new Error(`SDP exchange thất bại: ${sdpRes.status}`);
      }

      // Timeout 15s: nếu WebRTC không vào "connected" → fallback sang pre-recorded video
      connectTimerRef.current = setTimeout(() => {
        if (pcRef.current && pcRef.current.connectionState !== "connected") {
          console.warn("[D-ID] connection timeout → fallback");
          setStatus("error");
          setError("Kết nối D-ID timeout");
        }
      }, 15000);
    } catch (err) {
      console.error("[D-ID] connect():", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Kết nối thất bại");
    }
  }, [isConfigured, status, getHeaders]);

  // ── Nói với audio URL (FPT TTS) ──────────────────────────
  const speakWithAudio = useCallback(async (
    audioUrl,
    text,
    onEnd,
  ) => {
    if (!streamIdRef.current || !sessionIdRef.current) {
      onEnd?.();
      return;
    }

    clearTimeout(endTimerRef.current);
    setStatus("speaking");

    // Azure TTS vi-VN HoaiMy ≈ 80ms/ký tự; +2000ms overhead D-ID
    const estimatedMs = Math.max(4000, text.length * 80 + 2000);

    try {
      await fetch(`${DID_API}/talks/streams/${streamIdRef.current}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          script: {
            type:      "audio",
            audio_url: audioUrl,
          },
          config: {
            fluent:               true,
            pad_audio:            0.5,
            align_driver:         true,
            align_expand_factor:  0,
            stitch:               true,
          },
          session_id: sessionIdRef.current,
        }),
      });

      // D-ID không có callback khi nói xong → dùng timer
      endTimerRef.current = setTimeout(() => {
        setStatus("connected");
        onEnd?.();
      }, estimatedMs);
    } catch (err) {
      console.warn("[D-ID] speakWithAudio():", err);
      setStatus("connected");
      onEnd?.();
    }
  }, [getHeaders]);

  // ── Nói với text (Azure TTS vi-VN) ───────────────────────
  const speakWithText = useCallback(async (
    text,
    onEnd,
    voiceId = "vi-VN-HoaiMyNeural",
  ) => {
    if (!streamIdRef.current || !sessionIdRef.current) {
      onEnd?.();
      return;
    }

    clearTimeout(endTimerRef.current);
    setStatus("speaking");

    const estimatedMs = Math.max(4000, text.length * 80 + 2000);

    try {
      await fetch(`${DID_API}/talks/streams/${streamIdRef.current}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          script: {
            type:  "text",
            input: text,
            provider: {
              type:     "microsoft",
              voice_id: voiceId,
            },
          },
          config: {
            fluent:     true,
            pad_audio:  0.5,
            stitch:     true,
          },
          session_id: sessionIdRef.current,
        }),
      });

      endTimerRef.current = setTimeout(() => {
        setStatus("connected");
        onEnd?.();
      }, estimatedMs);
    } catch (err) {
      console.warn("[D-ID] speakWithText():", err);
      setStatus("connected");
      onEnd?.();
    }
  }, [getHeaders]);

  // ── Disconnect & cleanup ──────────────────────────────────
  const disconnect = useCallback(async () => {
    clearTimeout(endTimerRef.current);
    clearTimeout(connectTimerRef.current);

    if (streamIdRef.current && sessionIdRef.current) {
      try {
        // keepalive: true → request hoàn thành ngay cả khi trang đang unload
        await fetch(`${DID_API}/talks/streams/${streamIdRef.current}`, {
          method:    "DELETE",
          headers:   getHeaders(),
          body:      JSON.stringify({ session_id: sessionIdRef.current }),
          keepalive: true,
        });
      } catch {
        // ignore
      }
    }

    // Xóa sessionStorage — stream đã được dọn sạch
    sessionStorage.removeItem("did_stream_id");
    sessionStorage.removeItem("did_session_id");

    pcRef.current?.close();
    pcRef.current        = null;
    streamIdRef.current  = "";
    sessionIdRef.current = "";
    setStatus("idle");
  }, [getHeaders]);

  return { status, error, connect, disconnect, speakWithAudio, speakWithText, attachVideo };
}
