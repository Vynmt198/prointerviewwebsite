import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  ArrowLeft,
  Search as MagnifyingGlass,
  Calendar,
  BarChart3 as ChartBar,
  Check,
  X,
  Sparkles as Sparkle,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  RefreshCw as ArrowsClockwise,
  Download,
  Eye,
  Trash2 as Trash,
  Filter as FunnelSimple,
  ChevronDown as CaretDown,
  CalendarDays as CalendarBlank,
  Users,
} from "lucide-react";
import { CV_ANALYSIS_HISTORY } from "../../data/mockData";
import { fetchCvAnalyses } from "../../utils/cvApi";
import { hasAuthCredentials } from "../../utils/auth";

function mapRow(item) {
  return {
    id: item.analysisId || item.id,
    mode: item.mode || (item.jdFileName ? "jd" : "field"),
    cvFile: item.cvFileName || item.cvFile || "cv",
    jdFile: item.jdFileName || item.jdFile || null,
    matchScore: item.matchScore ?? 0,
    date: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
      : item.date || "",
    company: item.company || null,
    position: item.position || item.cvFileName || null,
    field: item.field || null,
  };
}

export function AnalysisHistory() {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [rows, setRows] = useState(() => CV_ANALYSIS_HISTORY.map(mapRow));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasAuthCredentials()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetchCvAnalyses();
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.analyses?.length) {
        setRows(res.analyses.map((a) => mapRow(a)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter and sort logic
  const filteredData = rows
    .filter(item => {
      if (filterMode !== "all" && item.mode !== filterMode) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.cvFile.toLowerCase().includes(query) ||
          (item.jdFile?.toLowerCase().includes(query)) ||
          (item.company?.toLowerCase().includes(query)) ||
          (item.position?.toLowerCase().includes(query)) ||
          (item.field?.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.matchScore - a.matchScore;
      }
    });

  const selectedAnalysis = selectedId
    ? rows.find((item) => item.id === selectedId)
    : null;

  // Stats
  const totalAnalyses = rows.length;
  const avgScore = totalAnalyses
    ? Math.round(rows.reduce((sum, item) => sum + item.matchScore, 0) / totalAnalyses)
    : 0;
  const jdAnalyses = rows.filter((item) => item.mode === "jd").length;
  const fieldAnalyses = rows.filter((item) => item.mode === "field").length;

  return (
    <MentorPageShell bottomPad="pb-8">
      <div className="relative z-[1] mx-auto w-full max-w-7xl px-6 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6">
        <div className="mb-8">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#6E35E8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <FileText
                  className="size-6 shrink-0 text-lime-900"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 sm:text-[11px]">
                  Phân tích CV/JD
                </span>
              </div>
              <h1 className="app-page-title mb-3">
                Lịch sử phân tích{" "}
                <span className="text-[#6E35E8]">CV/JD</span>
              </h1>
              <p className="app-page-subtitle">
                Xem lại các kết quả phân tích đã thực hiện
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-violet-50 shadow-sm sm:mt-1">
              <FileText className="h-7 w-7 text-[#6E35E8]" strokeWidth={2.25} />
            </div>
          </div>
        </div>
        </div>

        <div className="w-full rounded-[28px] border border-slate-200 bg-white/90 px-5 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:py-8">
        {/* Stats Cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/80 bg-violet-100">
                <ChartBar className="h-5 w-5 text-violet-700" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {totalAnalyses}
                </p>
                <p className="text-xs font-semibold text-slate-500">Tổng phân tích</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-200/90 bg-lime-100">
                <Sparkle className="h-5 w-5 text-emerald-800" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{avgScore}</p>
                <p className="text-xs font-semibold text-slate-500">Điểm TB</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/80 bg-violet-100">
                <FileText className="h-5 w-5 text-violet-700" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {jdAnalyses}
                </p>
                <p className="text-xs font-semibold text-slate-500">Phân tích CV+JD</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/90 bg-amber-100">
                <Users className="h-5 w-5 text-amber-900" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {fieldAnalyses}
                </p>
                <p className="text-xs font-semibold text-slate-500">Phân tích theo ngành</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo CV, JD, công ty, vị trí..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#6E35E8] transition-colors"
              />
            </div>

            {/* Filter by mode */}
            <div className="flex gap-2">
              {[
                { value: "all", label: "Tất cả" },
                { value: "jd", label: "CV+JD" },
                { value: "field", label: "Theo ngành" },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilterMode(option.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    filterMode === option.value
                      ? "text-white shadow-md"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    filterMode === option.value
                      ? { background: "#6E35E8" }
                      : {}
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              {[
                { value: "date", label: "Ngày", icon: CalendarBlank },
                { value: "score", label: "Điểm", icon: ChartBar },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    sortBy === option.value
                      ? "text-[#6E35E8] bg-[#6E35E8]/10"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Hiển thị {filteredData.length} / {totalAnalyses} phân tích
          </p>
        </div>

        {/* Analysis List */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <MagnifyingGlass
              className="w-16 h-16 mx-auto mb-4 text-gray-200"
            />
            <p className="text-gray-400 font-medium mb-1">
              Không tìm thấy kết quả
            </p>
            <p className="text-sm text-gray-300">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredData.map(item => {
              const scoreColor =
                item.matchScore >= 75
                  ? "#4A7A00"
                  : item.matchScore >= 55
                  ? "#6E35E8"
                  : "#CC5C00";
              const scoreBg =
                item.matchScore >= 75
                  ? "rgba(180,240,0,0.12)"
                  : item.matchScore >= 55
                  ? "rgba(110, 53, 232,0.08)"
                  : "rgba(255,140,66,0.1)";

              const isExpanded = selectedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${
                    isExpanded
                      ? "border-[#6E35E8] shadow-lg"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  {/* Main Row */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() =>
                      setSelectedId(isExpanded ? null : item.id)
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Tags & Date */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{
                              background:
                                item.mode === "jd"
                                  ? "rgba(110, 53, 232,0.08)"
                                  : "rgba(255,214,0,0.15)",
                              color:
                                item.mode === "jd" ? "#6E35E8" : "#997F00",
                            }}
                          >
                            {item.mode === "jd"
                              ? "CV+JD"
                              : item.field ?? "Theo ngành"}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="mb-2">
                          {item.company && item.position ? (
                            <div>
                              <h3 className="text-lg font-bold text-[#1F1F1F] mb-1">
                                {item.position}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {item.company}
                              </p>
                            </div>
                          ) : (
                            <h3 className="text-lg font-bold text-[#1F1F1F]">
                              {item.cvFile}
                            </h3>
                          )}
                        </div>

                        {/* Files */}
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {item.cvFile}
                          </span>
                          {item.jdFile && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {item.jdFile}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div
                        className="flex-shrink-0 text-center px-4 py-3 rounded-xl"
                        style={{ background: scoreBg }}
                      >
                        <span
                          className="font-bold text-2xl block"
                          style={{ color: scoreColor }}
                        >
                          {item.matchScore}
                        </span>
                        <p
                          className="text-xs font-medium"
                          style={{ color: scoreColor, opacity: 0.7 }}
                        >
                          điểm
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && selectedAnalysis && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div>
                          {/* Keywords Match */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
                              <Check
                                className="w-4 h-4 text-[#6E9900]"
                              />
                              Từ khóa khớp ({selectedAnalysis.matchedKeywords.length}/
                              {selectedAnalysis.totalKeywords})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAnalysis.matchedKeywords.map(kw => (
                                <span
                                  key={kw}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                  style={{
                                    background: "rgba(180,240,0,0.15)",
                                    color: "#4A7A00",
                                  }}
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Missing Keywords */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
                              <X
                                className="w-4 h-4 text-[#CC5C00]"
                              />
                              Từ khóa thiếu ({selectedAnalysis.missingKeywords.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedAnalysis.missingKeywords.map(kw => (
                                <span
                                  key={kw}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                  style={{
                                    background: "rgba(255,140,66,0.1)",
                                    color: "#CC5C00",
                                  }}
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Score Breakdown */}
                          <div>
                            <h4 className="text-sm font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
                              <ChartBar
                                className="w-4 h-4 text-[#6E35E8]"
                              />
                              Chi tiết điểm số
                            </h4>
                            <div className="space-y-2">
                              {[
                                {
                                  label: "Clarity",
                                  score: selectedAnalysis.scores.clarity,
                                },
                                {
                                  label: "Structure",
                                  score: selectedAnalysis.scores.structure,
                                },
                                {
                                  label: "Relevance",
                                  score: selectedAnalysis.scores.relevance,
                                },
                                {
                                  label: "Credibility",
                                  score: selectedAnalysis.scores.credibility,
                                },
                              ].map(({ label, score }) => (
                                <div key={label}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-600">
                                      {label}
                                    </span>
                                    <span className="text-xs font-bold text-[#1F1F1F]">
                                      {score}/10
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${(score / 10) * 100}%`,
                                        background:
                                          score >= 8
                                            ? "#6E9900"
                                            : score >= 6
                                            ? "#6E35E8"
                                            : "#CC5C00",
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div>
                          {/* Strengths */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
                              <TrendUp
                                className="w-4 h-4 text-[#6E9900]"
                               
                              />
                              Điểm mạnh ({selectedAnalysis.strengths.length})
                            </h4>
                            <ul className="space-y-2">
                              {selectedAnalysis.strengths.map((str, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-[#6E9900] before:font-bold"
                                >
                                  {str}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div>
                            <h4 className="text-sm font-bold text-[#1F1F1F] mb-3 flex items-center gap-2">
                              <TrendDown
                                className="w-4 h-4 text-[#CC5C00]"
                               
                              />
                              Điểm yếu ({selectedAnalysis.weaknesses.length})
                            </h4>
                            <ul className="space-y-2">
                              {selectedAnalysis.weaknesses.map((weak, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 pl-4 relative before:content-['!'] before:absolute before:left-0 before:text-[#CC5C00] before:font-bold"
                                >
                                  {weak}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Suggestions Count */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#CC5C00" }}
                              />
                              <span className="text-xs text-gray-600">
                                {
                                  selectedAnalysis.suggestions.filter(
                                    s => s.priority === "high"
                                  ).length
                                }{" "}
                                ưu tiên cao
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#6E35E8" }}
                              />
                              <span className="text-xs text-gray-600">
                                {
                                  selectedAnalysis.suggestions.filter(
                                    s => s.priority === "medium"
                                  ).length
                                }{" "}
                                trung bình
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: "#6E9900" }}
                              />
                              <span className="text-xs text-gray-600">
                                {
                                  selectedAnalysis.suggestions.filter(
                                    s => s.priority === "low"
                                  ).length
                                }{" "}
                                thấp
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => navigate("/cv-analysis")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-105"
                            style={{ background: "#6E35E8" }}
                          >
                            <ArrowsClockwise className="w-4 h-4" />
                            Phân tích lại
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </MentorPageShell>
  );
}
