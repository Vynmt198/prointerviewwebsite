import {
  CUSTOMER_SHELL_GUTTER,
  CUSTOMER_SHELL_MAX,
  CV_JD_PAGE_WRAP,
} from "../layout/customerShellLayout";
import { MentorPageShell } from "../mentor/MentorPageShell";
import { CvJdAnalysisTabs } from "./CvJdAnalysisTabs";

export const CV_JD_CARD_CLASS =
  "w-full overflow-hidden rounded-[1.75rem] border border-violet-200/80 bg-white shadow-[0_16px_40px_rgba(99,14,212,0.1)]";

/** Field upload + dropdown ngành — cần overflow visible để list không bị cắt */
export const CV_JD_CARD_FIELD_CLASS =
  "w-full overflow-visible rounded-[1.75rem] border border-violet-200/80 bg-white shadow-[0_16px_40px_rgba(99,14,212,0.1)]";

const JD_SUBTITLE =
  "Tải CV và Job Description — so khớp từ khóa, chấm điểm và gợi ý chỉnh sửa theo đúng vị trí tuyển dụng.";

const FIELD_SUBTITLE =
  "Tải CV, chọn nhóm ngành nghề — AI đánh giá cấu trúc, nội dung và gợi ý cải thiện theo chuẩn ngành.";

const FIELD_SUBTITLE_CLASS =
  "mt-2 max-w-2xl text-sm font-medium leading-relaxed text-violet-800/90 sm:text-[0.9375rem]";

/** Header cố định theo tính năng — tab Phân tích / Lịch sử dùng chung, không đổi tiêu đề khi chuyển tab */
export function cvAnalysisPageHeader(mode) {
  if (mode === "field") {
    return {
      badge: "Phân tích theo ngành",
      title: (
        <>
          Phân tích CV <span className="text-[#630ed4]">theo ngành</span>
        </>
      ),
      subtitle: FIELD_SUBTITLE,
      subtitleClassName: FIELD_SUBTITLE_CLASS,
    };
  }
  return {
    badge: "Phân tích CV + JD",
    title: (
      <>
        Phân tích CV <span className="text-[#630ed4]">với JD</span>
      </>
    ),
    subtitle: JD_SUBTITLE,
    subtitleClassName: "mt-3 max-w-3xl text-base font-medium leading-relaxed text-violet-800/90",
  };
}

/**
 * Khung chung: header + card trắng + tab Phân tích mới / Lịch sử (CV+JD).
 * Dùng cho /cv-analysis/jd, /cv-analysis/field và trang lịch sử tương ứng.
 */
export function CvJdAnalysisPage({
  activeTab,
  tabTrailing = null,
  tabAnalysisPath,
  tabHistoryPath,
  children,
  badge = "Phân tích CV + JD",
  title = (
    <>
      Phân tích CV <span className="text-[#630ed4]">với JD</span>
    </>
  ),
  subtitle = JD_SUBTITLE,
  subtitleClassName = "mt-3 max-w-3xl text-base font-medium leading-relaxed text-violet-800/90",
  showTabs = true,
  showHeader = true,
  cardVariant = "default",
}) {
  const cardClass = cardVariant === "field" ? CV_JD_CARD_FIELD_CLASS : CV_JD_CARD_CLASS;

  return (
    <MentorPageShell bottomPad="pb-12">
      <div className={`relative z-[1] flex flex-col pb-10 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className={CUSTOMER_SHELL_MAX}>
          <div className={CV_JD_PAGE_WRAP}>
            {showHeader ? (
              <header className="w-full">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/90 px-3 py-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#630ed4]" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700 sm:text-[11px]">
                    {badge}
                  </span>
                </div>
                <h1 className="font-headline text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-tight text-violet-950">
                  {title}
                </h1>
                {subtitle ? (
                  <p className={subtitleClassName}>{subtitle}</p>
                ) : null}
              </header>
            ) : null}

            <div className={cardClass}>
              {showTabs ? (
                <CvJdAnalysisTabs
                  activeTab={activeTab}
                  trailing={tabTrailing}
                  analysisPath={tabAnalysisPath}
                  historyPath={tabHistoryPath}
                />
              ) : tabTrailing ? (
                <div className="flex justify-end border-b border-violet-100 px-4 py-3 sm:px-6">
                  {tabTrailing}
                </div>
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
