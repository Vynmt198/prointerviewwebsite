import React from "react";
import { Star } from "lucide-react";
import {
  INTERVIEW_HERO_HUD_DEMO,
  INTERVIEW_SCORE_MAX,
} from "../../constants/interviewHeroDemo";

export const HOME_AI_DEMO_VIDEO =
  "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4";

const WAVEFORM = [42, 68, 52, 82, 58, 90, 48, 76, 55, 88, 50, 72, 46, 80];

function DimBar({ label, score }) {
  const pct = (score / INTERVIEW_SCORE_MAX) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[3.35rem] shrink-0 truncate text-[7px] font-medium leading-tight text-slate-600 sm:w-[3.65rem] sm:text-[8px]">
        {label}
      </span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-violet-100">
        <div className="h-full rounded-full bg-[#8037f4]" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[8px] font-bold text-[#6d2fd6] sm:text-[9px]">{score.toFixed(1)}</span>
    </div>
  );
}

/** Hero: video + HUD góc — cùng logic chấm điểm /interview/feedback. */
export function HeroInterviewVideoCard() {
  const { overall, dimensions } = INTERVIEW_HERO_HUD_DEMO;
  const filledStars = Math.round(overall);
  const [clarity, structure, relevance, credibility] = dimensions;

  return (
    <>
      <style>{`
        .hero-video-glass {
          border: 1px solid rgba(255, 255, 255, 0.82);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 26px rgba(99, 14, 212, 0.14);
        }
        .hero-video-wave {
          animation: heroVideoWave 1.35s ease-in-out infinite;
        }
        .hero-video-wave:nth-child(odd) {
          animation-delay: 0.12s;
        }
        .hero-video-wave:nth-child(4n) {
          animation-delay: 0.28s;
        }
        @keyframes heroVideoWave {
          0%,
          100% {
            transform: scaleY(0.7);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-video-wave {
            animation: none !important;
          }
        }
      `}</style>
      <div className="relative mx-auto mt-6 w-full max-w-full translate-x-4 -translate-y-8 overflow-visible sm:mt-8 lg:mt-0 lg:ml-auto lg:max-w-[28rem]">
        <div className="@container relative overflow-visible rounded-[1.65rem] bg-white p-2 shadow-[0_16px_44px_rgba(99,14,212,0.14)] sm:rounded-[1.85rem] sm:p-2.5">
          <div className="relative w-full min-h-[calc(100cqw*3.51/4+1.5rem)]">
            <div className="absolute inset-0 overflow-hidden rounded-[1.2rem] bg-slate-100 sm:rounded-[1.35rem]">
              <video autoPlay loop muted playsInline className="h-full w-full object-cover object-[center_18%]">
                <source src={HOME_AI_DEMO_VIDEO} type="video/mp4" />
              </video>
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-violet-900/10"
                aria-hidden
              />
            </div>

            <div className="pointer-events-none absolute inset-0 z-10">
              {/* Tổng điểm — giống banner feedback */}
              <div className="hero-video-glass absolute left-2 top-2 rounded-xl px-2.5 py-2 sm:left-3 sm:top-3 sm:rounded-2xl sm:px-3 sm:py-2">
                <p className="text-[8px] font-semibold text-slate-500 sm:text-[9px]">Tổng điểm</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-extrabold leading-none text-slate-900 sm:text-xl">
                    {overall.toFixed(1)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 sm:text-[10px]">/{INTERVIEW_SCORE_MAX} sao</span>
                </div>
                <div className="mt-1 flex gap-px">
                  {[...Array(INTERVIEW_SCORE_MAX)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                        i < filledStars ? "fill-[#b5e636] text-[#b5e636]" : "fill-violet-100 text-violet-200"
                      }`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>

              {/* Đang nghe — waveform */}
              <div className="hero-video-glass absolute left-1/2 top-[40%] flex h-9 w-[min(88%,12rem)] -translate-x-1/2 items-end justify-center gap-[2px] rounded-xl px-2 py-1.5 sm:h-10 sm:rounded-2xl sm:px-2.5 sm:py-2">
                {WAVEFORM.map((h, i) => (
                  <span
                    key={i}
                    className="hero-video-wave w-[2.5px] rounded-full bg-gradient-to-t from-[#8037f4] to-[#b794f6] sm:w-[3px]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* 4 tiêu chí STAR — thanh như feedback */}
              <div className="hero-video-glass absolute bottom-3 left-2 flex w-[7.25rem] flex-col gap-1 rounded-xl px-2 py-2 sm:bottom-4 sm:left-3 sm:w-[7.75rem] sm:rounded-2xl sm:px-2.5 sm:py-2.5">
                <p className="mb-0.5 text-[7px] font-bold uppercase tracking-wide text-[#6d2fd6] sm:text-[8px]">
                  Chấm STAR
                </p>
                <DimBar label={clarity.label} score={clarity.score} />
                <DimBar label={structure.label} score={structure.score} />
                <DimBar label={relevance.label} score={relevance.score} />
                <DimBar label={credibility.label} score={credibility.score} />
              </div>

              {/* 3 tiêu chí nổi bật — /5 sao */}
              <div className="hero-video-glass absolute bottom-3 right-2 min-w-[6.75rem] space-y-1 rounded-xl px-2 py-2 text-[9px] font-semibold text-slate-700 sm:bottom-4 sm:right-3 sm:min-w-[7.25rem] sm:rounded-2xl sm:px-2.5 sm:py-2.5 sm:text-[10px]">
                {[relevance, clarity, credibility].map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{d.label}</span>
                    <span className="shrink-0 font-bold text-[#6d2fd6]">{d.score.toFixed(1)}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
