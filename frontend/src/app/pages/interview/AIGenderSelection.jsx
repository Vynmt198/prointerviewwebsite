import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  User,
  Venus as GenderFemale,
  Mars as GenderMale,
  Play,
  Pause,
  Volume2 as SpeakerHigh,
  VolumeX as SpeakerX,
  ArrowRight,
  Sparkles as Sparkle,
  Video as VideoCamera,
  Check,
  Lightbulb,
  PanelLeft,
} from "lucide-react";

const IS = { strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

function IconFrame({ size = "md", tone = "neutral", className = "", children }) {
  const sz = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const tones = {
    neutral:
      "border-violet-200 bg-gradient-to-br from-white to-violet-50 shadow-[0_2px_8px_rgba(15,23,42,0.08)]",
    lime: "border-[#a9d42d] bg-gradient-to-br from-[#d4ff6a] to-[#c4ff47] shadow-[0_4px_12px_rgba(169,212,45,0.35)]",
    violet:
      "border-violet-400/45 bg-gradient-to-br from-violet-200 to-violet-300 shadow-[0_4px_14px_rgba(110,53,232,0.28)]",
    fuchsia:
      "border-fuchsia-400/45 bg-gradient-to-br from-fuchsia-200 to-fuchsia-300 shadow-[0_4px_14px_rgba(217,70,239,0.25)]",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border ${sz} ${tones[tone]} ${className}`}
      aria-hidden
    >
      {children}
    </div>
  );
}

const P = {
  purple: "#6E35E8",
  purpleAlt: "#8B4DFF",
  lime: "#c4ff47",
  gold: "#FFD600",
  orange: "#FF8C42",
  bg: "transparent",
  card: "rgba(255,255,255,0.92)",
  text: "#0f172a",
  muted: "#64748b",
  border: "rgba(148,71,255,0.18)",
};

const VIDEO_URLS = {
  male: "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336646/Male_jioqsx.mp4",
  female:
    "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4",
};

function VideoPlayer({ src, isPlaying, onEnded }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((e) => console.warn("Video play error:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "#000",
        aspectRatio: "16/9",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-cover"
        onEnded={onEnded}
        playsInline
        preload="metadata"
      />

      {showControls && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          }}
        >
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg p-2 transition-all"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            {isMuted ? (
              <SpeakerX className="h-5 w-5 text-white" {...IS} />
            ) : (
              <SpeakerHigh className="h-5 w-5 text-white" {...IS} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StepBar({ current = 1 }) {
  const steps = [
    { n: 1, label: "Thiết lập" },
    { n: 2, label: "Phỏng vấn" },
    { n: 3, label: "Kết quả" },
  ];

  return (
    <div className="mb-6 flex select-none flex-wrap items-center gap-0 rounded-2xl border border-violet-200/70 bg-white/82 px-4 py-3 backdrop-blur-sm">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                s.n === current
                  ? "bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] text-white shadow-[0_0_0_3px_rgba(110,53,232,0.2)]"
                  : s.n < current
                    ? "bg-[#c4ff47] text-[#0a0814]"
                    : "border border-violet-200 bg-white text-slate-500"
              }`}
            >
              {s.n < current ? <Check className="h-3.5 w-3.5" {...IS} strokeWidth={2.25} /> : s.n}
            </div>
            <span
              className={`text-sm font-semibold ${
                s.n === current ? "text-[#6E35E8]" : s.n < current ? "text-[#5f7d00]" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`mx-3 h-0.5 min-w-[2rem] flex-1 rounded-full ${
                s.n < current ? "bg-[#c4ff47]/75" : "bg-violet-200/70"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function AIGenderSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedGender, setSelectedGender] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  const interviewData = location.state || {};

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setIsPlaying(true);
    setVideoWatched(false);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoWatched(true);
  };

  const handleContinue = () => {
    if (!selectedGender) return;
    sessionStorage.setItem("prointerview_hr_gender", selectedGender);
    navigate("/interview/room", {
      state: { ...interviewData, hrGender: selectedGender },
    });
  };

  const handleSkip = () => {
    const gender = selectedGender || "female";
    sessionStorage.setItem("prointerview_hr_gender", gender);
    navigate("/interview/room", {
      state: {
        ...interviewData,
        hrGender: gender,
      },
    });
  };

  return (
    <div className="ai-gender-light pi-page-dashboard-bg relative min-h-full w-full overflow-hidden px-6 pb-6 pt-3 font-sans antialiased sm:pt-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="fixed top-[-22%] left-[-12%] h-[760px] w-[760px] rounded-full bg-[#d4ff00]/48 blur-[135px]" />
        <div className="fixed bottom-[-22%] right-[-10%] h-[820px] w-[820px] rounded-full bg-[#9447ff]/34 blur-[150px]" />
      </div>
      <style>{`
        .ai-gender-light.pi-page-dashboard-bg {
          background: linear-gradient(165deg, #f8f4ff 0%, #f5f8ff 45%, #f7f4ff 100%);
        }
      `}</style>
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-violet-200 bg-white text-slate-700 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-all hover:border-violet-300 hover:bg-violet-50 active:scale-[0.97]"
            aria-label="Quay lại"
          >
            <ArrowLeft
              className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </button>

          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              background: "rgba(196, 255, 71, 0.22)",
              color: "#4b6400",
              border: "1px solid rgba(169, 212, 45, 0.45)",
            }}
          >
            <Sparkle className="h-3.5 w-3.5 text-[#6E35E8]" {...IS} />
            Thiết lập phỏng vấn AI
          </div>

          <h1
            className="mb-2"
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: P.text,
              lineHeight: 1.2,
            }}
          >
            Chọn HR AI của bạn
          </h1>
          <p className="text-base" style={{ color: P.muted, maxWidth: "600px" }}>
            Chọn giới tính HR AI và xem video giới thiệu trước khi bắt đầu phỏng vấn. Mỗi HR đều thân thiện và
            chuyên nghiệp
          </p>
        </div>

        <StepBar current={1} />

        <div className="grid items-start gap-8 lg:grid-cols-[1fr,1.2fr]">
          <div>
            <div
              className="rounded-2xl p-8"
              style={{
                background: P.card,
                border: `1px solid ${P.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="mb-6 flex items-center gap-3">
                <IconFrame tone="violet">
                  <User className="h-5 w-5 text-violet-700" {...IS} />
                </IconFrame>
                <div>
                  <h2 className="font-semibold" style={{ color: P.text, fontSize: "1.125rem" }}>
                    Chọn giới tính HR AI
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6b7280]" style={{ color: P.muted }}>
                    Chọn 1 trong 2 tùy chọn bên dưới
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={() => handleGenderSelect("male")}
                  className={`group relative rounded-2xl border-2 p-6 text-center backdrop-blur-sm transition-all ${
                    selectedGender === "male"
                      ? "scale-[1.02] border-[#8dc63f] bg-[#d4ff6a]/35 shadow-[0_0_0_1px_rgba(141,198,63,0.45),inset_0_1px_0_rgba(255,255,255,0.65)]"
                      : "border-white/12 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {selectedGender === "male" && (
                    <div
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        background: "#88c126",
                        boxShadow: "0 2px 8px rgba(136, 193, 38,0.45)",
                      }}
                    >
                      <Check className="h-3.5 w-3.5 text-white" {...IS} strokeWidth={2.25} />
                    </div>
                  )}
                  <div className="mx-auto mb-4 flex justify-center transition-transform group-hover:scale-105">
                    <IconFrame size="lg" tone="violet">
                      <GenderMale className="h-10 w-10 text-violet-700" {...IS} />
                    </IconFrame>
                  </div>
                  <p className="mb-1 text-base font-bold text-slate-900">HR Nam</p>
                  <p className="text-xs font-medium text-slate-500">David · Người phỏng vấn AI</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenderSelect("female")}
                  className={`group relative rounded-2xl border-2 p-6 text-center backdrop-blur-sm transition-all ${
                    selectedGender === "female"
                      ? "scale-[1.02] border-[#8dc63f] bg-[#d4ff6a]/35 shadow-[0_0_0_1px_rgba(141,198,63,0.45),inset_0_1px_0_rgba(255,255,255,0.65)]"
                      : "border-white/12 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {selectedGender === "female" && (
                    <div
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        background: "#88c126",
                        boxShadow: "0 2px 8px rgba(136, 193, 38,0.45)",
                      }}
                    >
                      <Check className="h-3.5 w-3.5 text-white" {...IS} strokeWidth={2.25} />
                    </div>
                  )}
                  <div className="mx-auto mb-4 flex justify-center transition-transform group-hover:scale-105">
                    <IconFrame size="lg" tone="fuchsia">
                      <GenderFemale className="h-10 w-10 text-fuchsia-700" {...IS} />
                    </IconFrame>
                  </div>
                  <p className="mb-1 text-base font-bold text-slate-900">HR Nữ</p>
                  <p className="text-xs font-medium text-slate-500">Sarah — AI Interviewer</p>
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-violet-300/35 bg-violet-100/70 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <IconFrame tone="violet" className="flex-shrink-0">
                  <VideoCamera className="h-5 w-5 text-violet-700" {...IS} />
                </IconFrame>
                <div>
                  <p className="mb-1.5 text-sm font-bold text-violet-700">Xem video giới thiệu</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Mỗi HR AI có video giới thiệu ngắn giúp bạn làm quen trước khi phỏng vấn. Bạn cũng có thể bỏ qua
                    và vào phòng ngay.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div
              className="rounded-2xl p-8"
              style={{
                background: P.card,
                border: `1px solid ${P.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div className="mb-5 flex items-center gap-3">
                <IconFrame tone="violet">
                  <VideoCamera className="h-5 w-5 text-violet-700" {...IS} />
                </IconFrame>
                <div className="flex-1">
                  <h2 className="font-semibold" style={{ color: P.text, fontSize: "1.125rem" }}>
                    Video giới thiệu HR AI
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: P.muted }}>
                    {selectedGender ? "Video đang sẵn sàng" : "Chọn HR để xem video"}
                  </p>
                </div>
                {videoWatched && (
                  <span className="rounded-full border border-[#c4ff47]/30 bg-[#c4ff47]/12 px-3 py-1.5 text-xs font-bold text-[#c4ff47]">
                    ✓ Đã xem
                  </span>
                )}
              </div>

              {selectedGender ? (
                <div>
                  <VideoPlayer src={VIDEO_URLS[selectedGender]} isPlaying={isPlaying} onEnded={handleVideoEnd} />

                  {!isPlaying && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${P.purple}, ${P.purpleAlt})`,
                        color: "#fff",
                        boxShadow: "0 4px 16px rgba(110, 53, 232,0.3)",
                        marginTop: "1.25rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(110, 53, 232,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(110, 53, 232,0.3)";
                      }}
                    >
                      <Play className="h-5 w-5" {...IS} />
                      {videoWatched ? "Xem lại video" : "Phát video"}
                    </button>
                  )}

                  {isPlaying && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(false)}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold transition-all"
                      style={{
                        background: "rgba(110, 53, 232,0.1)",
                        border: `2px solid ${P.purple}`,
                        color: P.purple,
                        marginTop: "1.25rem",
                      }}
                    >
                      <Pause className="h-5 w-5" {...IS} />
                      Tạm dừng
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/70 p-8 text-center backdrop-blur-sm">
                  <div>
                    <div className="mx-auto mb-5 flex justify-center">
                      <IconFrame size="lg" tone="neutral">
                        <VideoCamera className="h-10 w-10 text-slate-400" {...IS} />
                      </IconFrame>
                    </div>
                    <p className="mb-2 flex items-center justify-center gap-2 text-lg font-bold text-slate-900">
                      <PanelLeft className="h-5 w-5 text-slate-400" {...IS} />
                      Chọn HR AI
                    </p>
                    <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-slate-500">
                      Chọn giới tính HR AI bên trái để xem video giới thiệu và bắt đầu
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!videoWatched}
            className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-bold transition-all"
            style={
              videoWatched
                ? {
                    background: `linear-gradient(135deg, ${P.purple} 0%, ${P.purpleAlt} 100%)`,
                    color: "#fff",
                    boxShadow: "0 6px 24px rgba(110, 53, 232,0.35)",
                    fontSize: "1rem",
                  }
                : {
                    background: "rgba(148,163,184,0.14)",
                    color: "#94a3b8",
                    cursor: "not-allowed",
                    border: "2px solid rgba(148,163,184,0.32)",
                    fontSize: "1rem",
                  }
            }
            onMouseEnter={(e) => {
              if (videoWatched) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(110, 53, 232,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (videoWatched) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(110, 53, 232,0.35)";
              }
            }}
          >
            {videoWatched ? (
              <>
                Tiếp tục vào phòng phỏng vấn
                <ArrowRight className="h-5 w-5" {...IS} />
              </>
            ) : (
              <span className="inline-flex items-center gap-2">
                <VideoCamera className="h-5 w-5 opacity-70" {...IS} />
                Xem video giới thiệu để tiếp tục
              </span>
            )}
          </button>

          {!videoWatched && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold transition-all"
              style={{
                background: "transparent",
                color: "#64748b",
                border: "2px solid rgba(148,163,184,0.3)",
                fontSize: "0.95rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = P.purple;
                e.currentTarget.style.color = P.purple;
                e.currentTarget.style.background = "rgba(110, 53, 232,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(148,163,184,0.3)";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="inline-flex items-center gap-2">
                Bỏ qua, vào phòng phỏng vấn ngay
                <ArrowRight className="h-4 w-4" {...IS} />
              </span>
            </button>
          )}

          {!videoWatched && selectedGender && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-center text-sm text-slate-600 backdrop-blur-sm">
              <span className="inline-flex items-start justify-center gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" {...IS} />
                <span>
                  <strong className="text-slate-800">Mẹo:</strong> Xem hết video để mở khóa nút tiếp tục, hoặc nhấn
                  &quot;Bỏ qua&quot; để vào ngay.
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
