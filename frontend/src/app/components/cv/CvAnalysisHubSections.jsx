import React from "react";
import { FileText, Briefcase } from "lucide-react";
import {
  CvAnalysisScoreBreakdown,
  CV_HUB_DEMO_SCORE_ROWS,
  CV_HUB_DEMO_MATCH,
} from "./CvAnalysisScoreBreakdown";
import { CV_HUB_HERO_COPY } from "../../constants/brandVoice";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../layout/customerShellLayout";

const HUB_STYLES = `
  .cv-hub-enter {
    animation: cvHubIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes cvHubIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .cv-hub-cta {
    transition: transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1), box-shadow 0.28s ease, filter 0.2s ease;
  }
  .cv-hub-cta:hover {
    transform: scale(1.045) translateY(-2px);
  }
  .cv-hub-cta:active {
    transform: scale(0.98) translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    .cv-hub-enter { animation: none; opacity: 1; transform: none; }
    .cv-hub-cta { transition: none; }
    .cv-hub-cta:hover,
    .cv-hub-cta:active { transform: none; }
  }
`;

function MascotSparkle({ className }) {
  return (
    <span
      className={`pointer-events-none absolute block h-2.5 w-2.5 rotate-45 rounded-[3px] bg-[#FACC15] shadow-sm ${className}`}
      aria-hidden
    />
  );
}

export function CvAnalysisHubHero({ onJd, onField, navShellAligned = false }) {
  const { percent, matched, missing, summary } = CV_HUB_DEMO_MATCH;

  const outerClass = navShellAligned
    ? "relative flex min-h-0 flex-col bg-transparent pb-2 pt-2 sm:pb-3 lg:pb-1 lg:pt-0"
    : `relative flex min-h-0 flex-col bg-transparent pb-4 pt-12 sm:pb-5 ${CUSTOMER_SHELL_GUTTER}`;

  const innerClass = navShellAligned
    ? "cv-hub-enter flex w-full flex-col overflow-visible lg:flex-row lg:items-center lg:gap-3 xl:gap-4"
    : `cv-hub-enter ${CUSTOMER_SHELL_MAX} flex flex-col overflow-visible lg:flex-row lg:items-stretch lg:gap-3 xl:gap-4`;

  return (
    <div className="cv-hub-page relative min-h-0 bg-transparent">
      <style>{HUB_STYLES}</style>

      <div className={outerClass}>
        <div className={innerClass}>
          {/* Trái — hero + linh vật */}
          <div
            className={`relative flex shrink-0 flex-col justify-center py-3 sm:py-4 lg:min-w-[28rem] lg:max-w-[36rem] lg:flex-[0.92] xl:max-w-[37rem] ${navShellAligned ? "lg:py-0" : "lg:py-2"
              }`}
          >
            <div className={`relative z-10 flex flex-col gap-2.5 sm:gap-3 ${navShellAligned ? "lg:translate-x-4" : ""}`}>
              <h1 className="max-w-[min(100%,32rem)] font-headline tracking-tight lg:max-w-[36rem]">
                <span className="block text-[clamp(2.1rem,4.8vw,3rem)] font-extrabold leading-[1.12]">
                  {/* Desktop Layout */}
                  <span className="hidden lg:block">
                    <span className="block text-[#630ed4] whitespace-nowrap">
                      {CV_HUB_HERO_COPY.titleAccent}
                    </span>
                    <span className="mt-0.5 block text-[#1a1b23] whitespace-nowrap">
                      {CV_HUB_HERO_COPY.titleRest}
                    </span>
                  </span>

                  {/* Mobile Layout - 3 lines */}
                  <span className="block lg:hidden text-[clamp(1.75rem,7.5vw,2.1rem)]">
                    <span className="block text-[#630ed4] whitespace-nowrap">Làm sao để CV</span>
                    <span className="mt-0.5 block whitespace-nowrap">
                      <span className="text-[#630ed4]">ấn tượng </span>
                      <span className="text-[#1a1b23]">trong mắt</span>
                    </span>
                    <span className="mt-0.5 block text-[#1a1b23] whitespace-nowrap">nhà tuyển dụng?</span>
                  </span>
                </span>
                <p className="mt-2 max-w-[min(100%,30rem)] text-[clamp(0.9375rem,2vw,1.0625rem)] font-medium leading-snug text-slate-600 lg:max-w-[36rem]">
                  {/* Desktop Layout */}
                  <span className="hidden lg:block">
                    <span className="block">{CV_HUB_HERO_COPY.bodyLine1}</span>
                    <span className="mt-0.5 block whitespace-nowrap">
                      {CV_HUB_HERO_COPY.bodyLine2}
                    </span>
                  </span>

                  {/* Mobile Layout */}
                  <span className="block text-pretty lg:hidden">
                    {CV_HUB_HERO_COPY.bodyLine1} {CV_HUB_HERO_COPY.bodyLine2}
                  </span>
                </p>
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5 sm:justify-start lg:justify-start">
                <button
                  type="button"
                  onClick={onJd}
                  className="cv-hub-cta inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#630ed4] to-[#7c3aed] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 hover:brightness-105 hover:shadow-xl hover:shadow-violet-500/30 sm:text-sm"
                >
                  {CV_HUB_HERO_COPY.ctaJd}
                </button>
                <button
                  type="button"
                  onClick={onField}
                  className="cv-hub-cta inline-flex items-center gap-2 rounded-2xl border-2 border-violet-200/80 bg-white/90 px-5 py-2.5 text-xs font-bold text-[#630ed4] shadow-sm backdrop-blur-sm hover:border-violet-300 hover:bg-white hover:shadow-md sm:text-sm"
                >
                  {CV_HUB_HERO_COPY.ctaField}
                </button>
              </div>
            </div>
          </div>

          {/* Phải — demo: banner + 2 ô + card cùng full width */}
          <div
            className={`flex min-w-0 w-full flex-1 flex-col gap-2.5 sm:gap-3 lg:ml-auto lg:min-w-0 lg:max-w-[32rem] lg:flex-[1.08] xl:max-w-[33rem] ${navShellAligned ? "lg:translate-x-12" : ""
              }`}
          >
            <div className="flex items-center justify-between gap-2 px-0.5 lg:-translate-x-20 lg:translate-y-16">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-800 sm:text-xs">
                Kết quả phân tích
              </span>
            </div>

            {/* Demo KQ: banner tím + 2 ô + bảng — scale chung, origin-top (không đè nhau) */}
            <div className="cv-hub-demo-stack flex w-full flex-col gap-2.5 sm:gap-3 lg:origin-top lg:-translate-x-20 lg:translate-y-16 lg:scale-[1.06] lg:gap-3">
              <div
                className="w-full shrink-0 overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem]"
                style={{ background: "linear-gradient(135deg,#6E35E8 0%,#9B6DFF 55%,#B794FF 100%)" }}
              >
                <div className="relative px-4 py-3.5 text-white sm:px-5 sm:py-4">
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"
                    aria-hidden
                  />
                  <p className="relative mb-1.5 text-[11px] font-medium text-indigo-100/90 sm:text-xs">
                    Mức độ phù hợp CV
                  </p>
                  <div className="relative flex flex-wrap items-end gap-2.5">
                    <span className="font-headline text-[2rem] font-extrabold leading-none tracking-tight sm:text-[2.5rem]">
                      {percent}%
                    </span>
                    <div className="mb-1 flex flex-col gap-1">
                      <span className="text-[11px] text-indigo-200/90 sm:text-xs">keyword match</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-3.5 rounded-full sm:w-4"
                            style={{
                              background:
                                i < Math.round(percent / 10)
                                  ? "rgba(255,255,255,0.9)"
                                  : "rgba(255,255,255,0.22)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="relative mt-2 line-clamp-2 text-[11px] leading-snug text-indigo-50/95 sm:text-xs">
                    {summary}
                  </p>
                </div>
              </div>

              <div className="relative z-10 grid w-full shrink-0 grid-cols-10 gap-2">
                <div className="col-span-6 rounded-md border border-emerald-100/90 bg-white/95 p-3 shadow-sm backdrop-blur-sm sm:p-3.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100">
                      <FileText className="h-4 w-4 text-emerald-700" />
                    </div>
                    <h3 className="text-[11px] font-semibold text-slate-900 sm:text-xs">Từ khóa khớp</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matched.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md border border-emerald-400/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:text-[11px]"
                      >
                        {kw} ✓
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-4 rounded-md border border-orange-100/90 bg-white/95 p-3 shadow-sm backdrop-blur-sm sm:p-3.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-100">
                      <Briefcase className="h-4 w-4 text-orange-700" />
                    </div>
                    <h3 className="text-[11px] font-semibold text-slate-900 sm:text-xs">Cần bổ sung</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md border border-orange-300/70 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-900 sm:text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card đánh giá — hubPreview; gấu căn đáy card (desktop) */}
              <div className="relative hidden w-full shrink-0 overflow-visible lg:block">
                <div
                  className="pointer-events-none absolute bottom-0 left-0 z-20 -translate-x-[16.65rem] translate-y-[2.35rem] xl:-translate-x-[17.4rem] xl:translate-y-[2.25rem]"
                  aria-hidden
                >
                  <MascotSparkle className="left-[27%] top-[8%] h-2.5 w-2.5" />
                  <MascotSparkle className="right-[17%] top-[4.5%] h-2 w-2 opacity-80" />
                  <img
                    src="/mascot-cv-hub-knowledge.png?v=11"
                    alt=""
                    className="block h-[23rem] w-[23rem] max-w-none object-contain object-bottom drop-shadow-[0_20px_50px_rgba(99,14,212,0.18)] xl:h-[24rem] xl:w-[24rem]"
                  />
                </div>
                <CvAnalysisScoreBreakdown
                  overallScore={percent}
                  rows={CV_HUB_DEMO_SCORE_ROWS}
                  compact
                  hubPreview
                  showHeader={false}
                  className="relative z-10 w-full !rounded-md border-violet-100/60 bg-white/95 shadow-sm backdrop-blur-sm [&>div:last-child]:pl-[3.65rem] [&>div:last-child]:xl:pl-[4.15rem]"
                />
              </div>

              <div className="w-full shrink-0 lg:hidden">
                <CvAnalysisScoreBreakdown
                  overallScore={percent}
                  rows={CV_HUB_DEMO_SCORE_ROWS}
                  compact
                  hubPreview
                  showHeader={false}
                  className="w-full !rounded-md border-violet-100/60 bg-white/95 shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
