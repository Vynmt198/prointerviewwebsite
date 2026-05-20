import React from "react";
import { FileText } from "lucide-react";

function StatusRow({ ok, children, faded = false }) {
  return (
    <li className={`flex items-start gap-2 ${faded ? "opacity-40" : ""}`}>
      <span className={`mt-px shrink-0 text-xs font-bold ${ok ? "text-[#2e7d32]" : "text-[#d32f2f]"}`}>
        {ok ? "✓" : "✕"}
      </span>
      <p className="text-sm font-medium leading-snug text-[#1a1b23]">
        {children}
      </p>
    </li>
  );
}

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
            <h2
              className="max-w-xl font-headline font-extrabold leading-[1.08] tracking-tight text-gray-900"
              style={{ fontSize: "clamp(1.45rem, 2.8vw, 2.15rem)" }}
            >
              <span className="block">CV có khớp JD không?</span>
              <span className="block font-headline text-[#5F00F0]">biết ngay, không đoán mò</span>
            </h2>
            <p className="max-w-lg text-[0.9375rem] font-medium leading-relaxed text-gray-600 sm:text-base">
              Tải CV và mô tả công việc, AI chấm độ khớp, liệt kê từ khóa đủ/thiếu và gợi ý sửa — ứng tuyển đúng việc, không nộp CV lung tung.
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
              <div className="pointer-events-none absolute left-1/2 top-0 z-0 w-[15rem] -translate-x-1/2 -translate-y-5 sm:w-[17rem] sm:-translate-y-6 lg:w-[18.5rem] lg:-translate-y-7">
                <div className="relative">
                  <MascotSparkle className="left-[14%] top-[18%] h-2 w-2 sm:left-[16%]" />
                  <MascotSparkle className="left-[10%] top-[34%] h-1.5 w-1.5 opacity-90 sm:left-[12%]" />
                  <img
                    src="/mascot-cv-analysis.png"
                    alt=""
                    aria-hidden
                    className="block h-auto w-full object-contain drop-shadow-[0_8px_18px_rgba(110,53,232,0.12)]"
                  />
                </div>
              </div>

              <div className="relative z-10 flex w-full flex-col -space-y-3 pt-[7.75rem] sm:pt-[8.5rem] lg:pt-[9rem]">
                <CardReveal delayMs={0} className="relative z-10 translate-x-4 lg:translate-x-8">
                  <ScoreCard
                    className="rotate-1 scale-95 transform"
                    title="Độ khớp CV–JD"
                    score="78% Khá ổn"
                    scoreBg="bg-[#e6f7ed]"
                    scoreClass="text-[#2e7d32]"
                    scoreBorder="border-[#c8e6c9]"
                  />
                </CardReveal>

                <CardReveal delayMs={140} className="relative z-20 lg:-translate-x-4">
                  <ScoreCard
                    className="-rotate-1 scale-100 transform"
                    title="Kỹ năng & từ khóa"
                    score="55% Khá ổn"
                    scoreBg="bg-[#e3f2fd]"
                    scoreClass="text-[#1976d2]"
                    scoreBorder="border-[#bbdefb]"
                  >
                    <StatusRow ok>
                      Khớp 6/10 keyword kỹ thuật trong JD: React, TypeScript, REST API, Git, Node.js, Agile.
                    </StatusRow>
                    <StatusRow ok={false}>
                      Thiếu Docker, AWS, CI/CD — JD ghi rõ là yêu cầu bắt buộc cho vị trí này.
                    </StatusRow>
                  </ScoreCard>
                </CardReveal>

                <CardReveal delayMs={280} className="relative z-30">
                  <ScoreCard
                    className="relative rotate-1 scale-[1.03] transform overflow-hidden"
                    title="Kinh nghiệm & STAR"
                    score="25% Cần cải thiện"
                    scoreBg="bg-[#ffebee]"
                    scoreClass="text-[#d32f2f]"
                    scoreBorder="border-[#ffcdd2]"
                  >
                    <StatusRow ok>Có mô tả dự án FE với tech stack trùng phần lớn JD.</StatusRow>
                    <StatusRow ok={false}>Bullet kinh nghiệm chưa theo STAR, thiếu số liệu KPI cụ thể.</StatusRow>
                    <StatusRow ok={false}>
                      Chưa đề cập thiết lập CI/CD pipeline — trong khi JD nhấn mạnh điểm này.
                    </StatusRow>
                    <StatusRow ok={false} faded>
                      Gợi ý: bổ sung PostgreSQL vào mục Database và nhắc lại trong kinh nghiệm gần nhất.
                    </StatusRow>
                  </ScoreCard>
                </CardReveal>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
