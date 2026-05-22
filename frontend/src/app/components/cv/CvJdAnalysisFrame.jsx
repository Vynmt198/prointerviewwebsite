import {
  CUSTOMER_SHELL_GUTTER,
  CUSTOMER_SHELL_MAX,
  CV_JD_PAGE_WRAP,
} from "../layout/customerShellLayout";
import { MentorPageShell } from "../mentor/MentorPageShell";
import { CvJdAnalysisTabs } from "./CvJdAnalysisTabs";

export const CV_JD_CARD_CLASS =
  "w-full overflow-hidden rounded-[1.75rem] border border-violet-200/80 bg-white shadow-[0_16px_40px_rgba(99,14,212,0.1)]";

const JD_SUBTITLE =
  "Tải CV và Job Description — so khớp từ khóa, chấm điểm và gợi ý chỉnh sửa theo đúng vị trí tuyển dụng.";

/**
 * Khung chung: header + card trắng + tab Phân tích mới / Lịch sử (CV+JD).
 * Dùng cho /cv-analysis/jd và /cv-analysis/history.
 */
export function CvJdAnalysisPage({
  activeTab,
  tabTrailing = null,
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
}) {
  return (
    <MentorPageShell bottomPad="pb-12">
      <div className={`relative z-[1] flex flex-col pb-10 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className={CUSTOMER_SHELL_MAX}>
          <div className={CV_JD_PAGE_WRAP}>
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

            <div className={CV_JD_CARD_CLASS}>
              {showTabs ? (
                <CvJdAnalysisTabs activeTab={activeTab} trailing={tabTrailing} />
              ) : null}
              {children}
            </div>
          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
