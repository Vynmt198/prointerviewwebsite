import { useNavigate } from "react-router";
import { Search, RotateCcw as History } from "lucide-react";

export const CV_JD_ANALYSIS_PATH = "/cv-analysis/jd";
export const CV_JD_HISTORY_PATH = "/cv-analysis/history";

const TABS = [
  { id: "analysis", label: "Phân tích", icon: Search, path: CV_JD_ANALYSIS_PATH },
  { id: "history", label: "Lịch sử", icon: History, path: CV_JD_HISTORY_PATH },
];

/**
 * Tab chuyển giữa phân tích mới và lịch sử CV+JD (full width shell).
 * @param {"analysis"|"history"} activeTab
 * @param {React.ReactNode} [trailing] — ví dụ badge lượt miễn phí
 */
export function CvJdAnalysisTabs({ activeTab, trailing = null }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-100 px-6 py-4 sm:px-8 sm:py-5">
      <div className="inline-flex rounded-xl bg-violet-100/70 p-1" role="tablist" aria-label="Phân tích CV và JD">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (!active) navigate(tab.path);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 sm:py-2 sm:text-sm ${
                active
                  ? "bg-white text-[#630ed4] shadow-sm ring-1 ring-violet-200/80"
                  : "text-violet-600 hover:bg-violet-50/80 hover:text-violet-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
      {trailing}
    </div>
  );
}
