import React from "react";
import { FileText } from "lucide-react";
import {
  CvAnalysisScoreBreakdown,
  CV_HUB_DEMO_MATCH,
  CV_HUB_DEMO_SCORE_ROWS,
  CV_HOME_DEMO_JD_KEYWORDS,
} from "../cv/CvAnalysisScoreBreakdown";

const DEMO_MATCH = CV_HUB_DEMO_MATCH;

function ScoreCard({
  title,
  score,
  scoreClass,
  scoreBg,
  scoreBorder,
  children,
  className = "",
}) {
  return (
    <div
      className={`cv-analysis-glass-card rounded-3xl border border-[#ccc3d8] bg-white px-5 py-3.5 shadow-xl transition-all duration-300 hover:scale-[1.02] sm:px-6 sm:py-4 ${className}`}
    >
      <div className={`flex items-center justify-between gap-3 ${children ? "mb-3 sm:mb-3.5" : ""}`}>
        <h3 className="font-headline text-lg font-bold text-[#1a1b23] md:text-xl">{title}</h3>
        <span
          className={`shrink-0 rounded-2xl border px-4 py-1.5 text-sm font-bold ${scoreBg} ${scoreClass} ${scoreBorder}`}
        >
          {score}
        </span>
      </div>
      {children ? <ul className="space-y-2">{children}</ul> : null}
    </div>
  );
}

function MascotSparkle({ className }) {
  return (
    <span
      className={`pointer-events-none absolute block h-3 w-3 rotate-45 rounded-[2px] bg-[#FACC15] shadow-sm ${className}`}
      aria-hidden
    />
  );
}

function CardReveal({ delayMs = 0, className = "", children }) {
  return (
    <div
      className={`cv-score-card-reveal w-full ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/** Showcase phân tích CV — màn riêng trên Home; navbar vẫn active Lộ trình (#features). */
export function CvAnalysisFeatureShowcase({ onCtaClick }) {
  return (
    <section
      id="cv-analysis"
      className="relative z-10 flex h-screen max-h-screen flex-col justify-center overflow-hidden px-0 py-4 sm:py-6"
    >
      <style>{`
        .cv-analysis-glass-card {
          background-color: #ffffff;
        }
        @keyframes cv-score-card-grow {
          0% {
            opacity: 0;
            transform: scale(0.88);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .cv-score-card-reveal {
          transform-origin: center top;
          animation: cv-score-card-grow 0.6s cubic-bezier(0.22, 1.12, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .cv-score-card-reveal {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center overflow-visible px-5 py-2">
        <div className="grid w-full origin-center scale-[0.92] grid-cols-1 items-center gap-4 overflow-visible sm:scale-[0.96] lg:grid-cols-2 lg:scale-[0.99] lg:gap-8 xl:scale-[1.02] xl:gap-9">
          <article className="relative z-10 flex flex-col items-start gap-2.5 pl-3 sm:gap-3 sm:pl-5 lg:pl-8 xl:pl-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-semibold text-violet-700 sm:text-xs">
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
              So CV với JD
            </span>
            <h2 className="font-headline font-extrabold leading-[1.1] tracking-tight">
              <span
                className="block whitespace-nowrap text-gray-900"
                style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.3rem)" }}
              >
                CV có khớp JD không?
              </span>
              <span
                className="mt-0.5 block whitespace-nowrap font-headline text-[#5F00F0]"
                style={{ fontSize: "clamp(1.8rem, 2.9vw, 2.5rem)" }}
              >
                biết ngay, không đoán mò
              </span>
            </h2>
            <p className="max-w-lg text-[0.9375rem] font-medium leading-relaxed text-gray-600 sm:text-base">
              Tải CV và JD, AI chấm độ khớp, liệt kê từ khóa đủ/thiếu và gợi ý sửa — ứng tuyển đúng việc, không nộp CV lung tung.
            </p>
            {onCtaClick ? (
              <button
                type="button"
                onClick={onCtaClick}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0f172a] transition-all hover:brightness-110 sm:text-base"
                style={{
                  background: "linear-gradient(135deg, #B4F500, #93D600)",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                }}
              >
                So CV với JD ngay
              </button>
            ) : null}
          </article>

          <section className="relative z-10 flex flex-col items-center justify-center overflow-visible lg:justify-self-center">
            <div className="relative mx-auto w-full max-w-md overflow-visible">
              <div className="pointer-events-none absolute left-1/2 top-0 z-0 w-[11.2rem] -translate-x-1/2 -translate-y-[1.14rem] sm:w-[13.2rem] sm:-translate-y-[1.39rem] lg:w-[14.7rem] lg:-translate-y-[1.64rem]">
                <div className="relative">
                  <MascotSparkle className="left-[14%] top-[18%] h-2 w-2 sm:left-[16%]" />
                  <MascotSparkle className="left-[10%] top-[34%] h-1.5 w-1.5 opacity-90 sm:left-[12%]" />
                  <img
                    src="/mascot-cv-analysis.png?v=2"
                    alt=""
                    aria-hidden
                    className="block h-auto w-full object-contain"
                  />
                </div>
              </div>

              <div className="relative z-10 flex w-full flex-col -space-y-3 pt-[7.75rem] sm:pt-[8.5rem] lg:pt-[9rem]">
                <CardReveal delayMs={0} className="relative z-10 translate-x-4 lg:translate-x-8">
                  <ScoreCard
                    className="rotate-1 scale-95 transform"
                    title="Độ khớp CV–JD"
                    score={`${DEMO_MATCH.percent}% Khá tốt`}
                    scoreBg="bg-[#e6f7ed]"
                    scoreClass="text-[#2e7d32]"
                    scoreBorder="border-[#c8e6c9]"
                  />
                </CardReveal>

                <CardReveal delayMs={140} className="relative z-20 lg:-translate-x-4">
                  <div className="cv-analysis-glass-card -rotate-1 scale-100 transform rounded-3xl border border-[#ccc3d8] bg-white px-5 py-3.5 shadow-xl transition-all duration-300 hover:scale-[1.02] sm:px-6 sm:py-4">
                    <div className="mb-3 flex items-center gap-2.5 sm:mb-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 sm:h-9 sm:w-9">
                        <FileText className="h-4 w-4 text-[#630ed4] sm:h-[1.125rem] sm:w-[1.125rem]" />
                      </div>
                      <h3 className="font-headline text-lg font-bold text-[#1a1b23] md:text-xl">
                        Từ khóa khớp với JD
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CV_HOME_DEMO_JD_KEYWORDS.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border border-lime-400/70 bg-lime-50 px-2.5 py-1 text-sm font-semibold lowercase text-emerald-900"
                        >
                          {kw} ✓
                        </span>
                      ))}
                    </div>
                  </div>
                </CardReveal>

                <CardReveal delayMs={280} className="relative z-30">
                  <div className="cv-analysis-glass-card relative rotate-1 scale-[1.03] transform overflow-hidden rounded-3xl border border-[#ccc3d8] bg-white shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CvAnalysisScoreBreakdown
                      overallScore={DEMO_MATCH.percent}
                      rows={CV_HUB_DEMO_SCORE_ROWS}
                      compact
                      homePreview
                      showHeader={false}
                      className="!rounded-none !border-0 !shadow-none"
                    />
                  </div>
                </CardReveal>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
