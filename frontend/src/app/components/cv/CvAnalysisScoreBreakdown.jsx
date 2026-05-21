import React from "react";
import { BarChart3 } from "lucide-react";

/** Cùng logic badge/thanh tiến độ như CVAnalysis.jsx (kết quả phân tích). */
export function scoreStatusFromValue(score, max = 10) {
  const ratio = score / max;
  if (ratio >= 0.8) return "good";
  if (ratio >= 0.6) return "ok";
  return "warn";
}

function badgeClass(status) {
  if (status === "good") return "bg-lime-100 text-lime-900";
  if (status === "ok") return "bg-violet-100 text-violet-900";
  return "bg-orange-100 text-orange-900";
}

function barColor(status) {
  if (status === "good") return "#84cc16";
  if (status === "ok") return "#8B4DFF";
  return "#f97316";
}

/**
 * Khối «Đánh giá chi tiết» — vòng Điểm AI + 4 tiêu chí (dùng trên trang kết quả & hub preview).
 */
export function CvAnalysisScoreBreakdown({
  overallScore = 73,
  rows = [],
  compact = false,
  dense = false,
  /** Home showcase — thu nhỏ cột tiêu chí bên phải, giữ vòng điểm */
  homePreview = false,
  showHeader = true,
  className = "",
}) {
  const ring = dense ? 72 : compact ? 88 : 112;
  const dash = overallScore * 2.51;
  const rowsTight = dense || homePreview;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {showHeader && (
        <div
          className={`flex items-center gap-2 border-b border-slate-200 bg-violet-50/80 ${
            dense ? "px-3 py-1.5" : "px-4 py-2.5 sm:px-5 sm:py-3"
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-lg bg-violet-100 ${
              dense ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8 sm:rounded-xl"
            }`}
          >
            <BarChart3 className={`text-[#6E35E8] ${dense ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4"}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-slate-900 ${dense ? "text-[11px]" : "text-xs sm:text-sm"}`}>
              Đánh giá chi tiết
            </h3>
            {!dense && <p className="text-[10px] text-slate-600 sm:text-xs">4 tiêu chí theo chuẩn tuyển dụng</p>}
          </div>
        </div>
      )}

      <div className={dense ? "p-2" : compact ? "p-3 sm:p-4" : "p-5 sm:p-6"}>
        <div className={`flex flex-wrap items-start ${dense ? "gap-2" : compact ? "gap-3" : "gap-6"}`}>
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative" style={{ width: ring, height: ring }}>
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#cv-hub-sg)"
                  strokeWidth="10"
                  strokeDasharray={`${dash} 251`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="cv-hub-sg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6E35E8" />
                    <stop offset="100%" stopColor="#8B4DFF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-bold text-slate-900"
                  style={{ fontSize: dense ? "1.1rem" : compact ? "1.25rem" : "1.6rem" }}
                >
                  {overallScore}
                </span>
                <span className="text-[10px] text-slate-500 sm:text-xs">/ 100</span>
              </div>
            </div>
            <p className={`mt-0.5 font-medium text-slate-700 ${dense ? "text-[9px]" : "mt-1 text-[10px] sm:text-xs"}`}>
              Điểm AI
            </p>
            {!dense && (
              <p className="mt-0.5 text-center text-[9px] leading-tight text-slate-500 sm:text-[0.65rem]">
                Clarity · Structure
                <br />
                Relevance · Credibility
              </p>
            )}
          </div>

          <div
            className={`min-w-0 flex-1 ${
              homePreview
                ? "space-y-1.5"
                : dense
                  ? "space-y-1"
                  : "space-y-2 sm:space-y-2.5"
            }`}
          >
            {rows.map((row) => {
              const status = row.status ?? scoreStatusFromValue(row.score, row.max ?? 10);
              const max = row.max ?? 10;
              return (
                <div key={row.criteria}>
                  <div
                    className={`flex items-center justify-between gap-2 ${
                      homePreview ? "mb-0.5" : rowsTight ? "mb-0" : "mb-0.5"
                    }`}
                  >
                    <span
                      className={`font-medium text-slate-800 ${
                        homePreview
                          ? "text-[11px] leading-snug"
                          : rowsTight
                            ? "text-[10px] leading-tight"
                            : "text-[11px] sm:text-sm"
                      }`}
                    >
                      {row.criteria}
                    </span>
                    <span
                      className={`shrink-0 rounded-lg font-bold ${
                        homePreview
                          ? "px-1.5 py-0.5 text-[10px]"
                          : rowsTight
                            ? "px-1 py-0 text-[9px]"
                            : "px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-xs"
                      } ${badgeClass(status)}`}
                    >
                      {row.score}/{max}
                    </span>
                  </div>
                  <div
                    className={`overflow-hidden rounded-full bg-slate-200 ${
                      homePreview ? "h-1.5" : rowsTight ? "h-1" : "h-1.5 sm:h-2"
                    }`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.score / max) * 100}%`,
                        background: barColor(status),
                      }}
                    />
                  </div>
                  {row.note ? (
                    <p
                      className={`leading-snug text-slate-600 ${
                        homePreview
                          ? "mt-0.5 line-clamp-2 text-[10px]"
                          : rowsTight
                            ? "mt-0 line-clamp-1 text-[8.5px]"
                            : "mt-0.5 line-clamp-2 text-[10px] sm:text-[0.72rem]"
                      }`}
                    >
                      {row.note}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dữ liệu minh họa hub — khớp UI trang kết quả */
export const CV_HUB_DEMO_SCORE_ROWS = [
  {
    criteria: "Clarity (Rõ ràng)",
    score: 8,
    max: 10,
    status: "good",
    note: "Văn phong trong CV rõ ràng và súc tích, không dùng từ ngữ mơ hồ.",
  },
  {
    criteria: "Structure (STAR)",
    score: 7,
    max: 10,
    status: "ok",
    note: "Cấu trúc CV rõ ràng, nhưng một số bullet point chưa có kết quả đo lường được.",
  },
  {
    criteria: "Relevance (Liên quan JD)",
    score: 6.5,
    max: 10,
    status: "ok",
    note: "CV có một số kỹ năng trùng khớp với yêu cầu công việc, nhưng vẫn thiếu một số kỹ năng quan trọng.",
  },
  {
    criteria: "Credibility (Thuyết phục)",
    score: 7.5,
    max: 10,
    status: "ok",
    note: "Các tuyên bố trong CV cụ thể và kiểm chứng được, nhưng vẫn cần thêm thông tin về kinh nghiệm và thành tựu.",
  },
];

export const CV_HUB_DEMO_MATCH = {
  percent: 73,
  matched: ["React", "TypeScript", "Node.js", "REST API"],
  missing: ["AWS", "Docker", "Kubernetes"],
  summary: "Khá tốt — bổ sung từ khóa còn thiếu có thể nâng điểm đáng kể.",
};

/** Từ khóa minh họa section So CV trên Home (khác preview hub). */
export const CV_HOME_DEMO_JD_KEYWORDS = [
  "ci/cd",
  "css",
  "docker",
  "git",
  "html",
  "javascript",
  "postgresql",
];
