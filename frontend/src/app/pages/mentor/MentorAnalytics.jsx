import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart as ChartLineIcon,
  Star,
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Users,
  Target,
  Zap as Lightning,
  ChevronRight as CaretRight,
  Equal,
  X,
  Search,
} from "lucide-react";
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMentorAnalytics } from "../../utils/mentorApi";
import { toastApiError } from "../../utils/apiToast";
import { avatarSrc } from "../../utils/mediaUrl";

const MENTEE_TREND_STYLES = {
  improving: {
    icon: TrendUp,
    label: "Cải thiện",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  declining: {
    icon: TrendDown,
    label: "Giảm dần",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
  stable: {
    icon: Equal,
    label: "Ổn định",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  unknown: {
    icon: null,
    label: "Chưa đủ dữ liệu",
    className: "border-slate-100 bg-slate-50 text-slate-500",
  },
};

/** Căn nhãn radar theo vị trí để không bị cắt ở mép trái/phải */
function RadarSubjectTick({ payload, x, y, cx, cy }) {
  const label = String(payload?.value ?? "");
  const centerX = Number(cx);
  const dx = Number(x) - centerX;
  let textAnchor = "middle";
  let dxOffset = 0;
  if (dx < -8) {
    textAnchor = "end";
    dxOffset = -6;
  } else if (dx > 8) {
    textAnchor = "start";
    dxOffset = 6;
  }
  return (
    <text
      x={Number(x) + dxOffset}
      y={Number(y)}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="#64748b"
      fontSize={11}
      fontWeight={600}
    >
      {label}
    </text>
  );
}

function MenteeScoreCell({ mentee }) {
  if (mentee.scoreSource === "review" && mentee.avgStarScore != null) {
    return (
      <div className="flex items-center gap-1.5" title="Đánh giá sao trung bình sau buổi mentor">
        <Star size={14} className="shrink-0 fill-[#FFD600] text-[#FFD600]" aria-hidden />
        <span className="text-sm font-bold text-slate-900">{mentee.avgStarScore.toFixed(1)}</span>
      </div>
    );
  }
  if (mentee.scoreSource === "interview" && mentee.avgInterviewScore != null) {
    return (
      <div className="flex items-center gap-1.5" title="Điểm STAR trung bình từ phỏng vấn AI">
        <span className="text-sm font-bold text-violet-700">{mentee.avgInterviewScore.toFixed(1)}</span>
        <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
          AI
        </span>
      </div>
    );
  }
  return (
    <span className="text-xs font-semibold text-slate-600" title="Chưa có đánh giá sao hoặc điểm phỏng vấn AI">
      Chưa có
    </span>
  );
}

function MenteeTrendBadge({ trend }) {
  const key = MENTEE_TREND_STYLES[trend] ? trend : "unknown";
  const { icon: Icon, label, className } = MENTEE_TREND_STYLES[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
      title={
        key === "unknown"
          ? "Cần thêm đánh giá hoặc buổi phỏng vấn AI để so sánh tiến bộ"
          : undefined
      }
    >
      {Icon ? <Icon size={14} strokeWidth={2.5} aria-hidden /> : null}
      {label}
    </span>
  );
}

export function MentorAnalytics() {
  const navigate = useNavigate();
  const user = getUser();
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "mentor") {
      navigate("/");
      return;
    }
    fetchMentorAnalytics().then((res) => {
      if (res.success && res.analytics) setAnalytics(res.analytics);
      else if (!res.success) toastApiError(res.error, "Không tải được dữ liệu phân tích.");
    }).catch(() => toastApiError("Lỗi kết nối khi tải phân tích."));
  }, [navigate, user?.role, user?.id]);

  if (!user || user.role !== "mentor") return null;

  const stats = analytics?.stats || {
    totalSessions: 0,
    totalMentees: 0,
    improvingCount: 0,
    topAvgScore: 0,
    trends: {},
  };
  const trends = stats.trends || {};
  const radarSkills =
    Array.isArray(stats.radarSkills) && stats.radarSkills.length > 0
      ? stats.radarSkills
      : [];
  const overallAvg = stats.overallAvgRating;
  const radarHasValues =
    radarSkills.length > 0 && radarSkills.some((r) => Number(r.value) > 0);
  const formatScoreOfFive = (value) =>
    value != null && Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} / 5.0` : null;
  const trendOrDash = (key, fallback = "—") => {
    const v = trends[key];
    return v != null && v !== "" ? v : fallback;
  };

  const statCards = [
    {
      label: "Buổi mentor",
      value: stats.totalSessions,
      trend: trendOrDash("sessionsTrendLabel"),
      trendTitle: "So với 7 ngày trước",
      icon: ChartLineIcon,
      color: "#8037f4",
    },
    {
      label: "Tổng mentee",
      value: stats.totalMentees,
      trend: trendOrDash("menteesTrendLabel"),
      trendTitle: "Mentee hoạt động: 30 ngày gần nhất so với 30 ngày trước",
      icon: Users,
      color: "#93f72b",
    },
    {
      label: "Đang cải thiện",
      value: stats.improvingCount,
      trend: trendOrDash("improvingTrendLabel"),
      trendTitle: "Số mentee đang cải thiện: so sánh 30 ngày",
      icon: Target,
      color: "#f59e0b",
    },
    {
      label: "Điểm trung bình",
      value: Number(stats.topAvgScore || 0).toFixed(1),
      trend: trends.scoreTrendLabel || trends.scoreScaleLabel || "/ 5.0",
      trendTitle: trends.scoreTrendLabel
        ? "Điểm đánh giá trung bình: 30 ngày gần nhất so với 30 ngày trước"
        : "Thang điểm tối đa",
      icon: Star,
      color: "#8037f4",
    },
  ];

  // Prepare chart data
  const weeklyChartData = (analytics?.weeklyStats || []).map((w) => ({
    week: w.week,
    "Điểm TB": parseFloat(w.avgStarScore.toFixed(2)),
    "Số buổi": w.totalMeetings,
  }));

  const mentees = analytics?.mentees || [];
  const filteredMentees = mentees.filter(m => 
    m.menteeName.toLowerCase().includes(search.toLowerCase())
  );

  const cardSchemes = [
    { cardCls: "bg-white border border-slate-100", iconBg: "#8037f418", iconColor: "#8037f4", onDark: false, trendCls: "text-slate-500" },
    { cardCls: "bg-[#c4ff47]", iconBg: "#1a1a1a18", iconColor: "#1a1a1a", onDark: false, trendCls: "text-slate-700" },
    { cardCls: "bg-violet-600", iconBg: "#ffffff20", iconColor: "#fff", onDark: true, trendCls: "text-violet-200" },
    { cardCls: "bg-[#1a1a2e]", iconBg: "#f59e0b22", iconColor: "#f59e0b", onDark: true, trendCls: "text-slate-400" },
  ];

  return (
    <MentorPageShell bottomPad="pb-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">

        {/* ── Hero banner ── */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6d28d9] via-[#8037f4] to-[#7c3aed] px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 right-24 h-28 w-28 rounded-full bg-white/5" aria-hidden />
          <div className="pointer-events-none absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#93f72b]/10" aria-hidden />
          <div className="pointer-events-none absolute right-8 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full border border-white/10 sm:block" aria-hidden />
          <div className="relative max-w-3xl">
            <p className="mentor-eyebrow mentor-eyebrow--on-dark mb-2 flex items-center gap-2">
              <TrendUp size={12} /> Phân tích
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-white sm:text-3xl">
              Phân tích{" "}
              <span className="text-[#93f72b]">&amp; thống kê</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-violet-100">
              Theo dõi tiến bộ mentee của bạn — số liệu buổi mentor, kỹ năng STAR và xu hướng cải thiện theo thời gian.
            </p>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat, i) => {
            const s = cardSchemes[i] || cardSchemes[0];
            return (
              <div key={i} className={`flex items-center gap-4 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${s.cardCls}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: s.iconBg }}>
                  <stat.icon size={22} style={{ color: s.iconColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`mentor-stat-num mentor-stat-num--hero ${s.onDark ? "mentor-stat-num--on-dark" : ""}`}>{stat.value}</p>
                  <p className={`mentor-label mt-1 ${s.onDark ? "mentor-label--on-dark" : ""}`}>{stat.label}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold ${s.trendCls}`} title={stat.trendTitle}>
                  {stat.trend}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Charts grid ── */}
        <div className="mb-6 grid gap-5 lg:grid-cols-12">

          {/* Area chart — dark bg */}
          <div className="lg:col-span-7 overflow-hidden rounded-2xl bg-[#1a1a2e] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#93f72b]/20">
                  <ChartLineIcon size={15} className="text-[#93f72b]" />
                </div>
                <span className="text-sm font-bold text-white">Hiệu suất đào tạo tuần</span>
              </div>
              <span className="rounded-lg bg-[#93f72b]/15 px-3 py-1 text-[11px] font-normal text-[#93f72b]">
                6 tuần gần nhất
              </span>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#93f72b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#93f72b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="Số buổi" stroke="#93f72b" strokeWidth={3} fillOpacity={1} fill="url(#limeGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar chart — white card */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="mb-2 flex items-center gap-2">
              <Star size={15} className="text-violet-600" />
              <span className="text-sm font-bold text-slate-900">Kỹ năng tập trung</span>
            </div>
            <div className="flex-1" style={{ minHeight: 260 }}>
              {radarHasValues ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" margin={{ top: 24, right: 32, bottom: 24, left: 32 }} data={radarSkills}>
                    <PolarGrid stroke="rgba(148,163,184,0.25)" />
                    <PolarAngleAxis dataKey="subject" tick={RadarSubjectTick} />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar name="Skills" dataKey="value" stroke="#8037f4" fill="#8037f4" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#c4ff47] px-4 py-2.5">
              <span className="text-xs font-bold text-slate-700">Điểm TB</span>
              <span
                className="text-sm font-black text-slate-900"
                title={
                  stats.radarScoreSource === "interview"
                    ? "Trung bình 5 trục STAR từ phỏng vấn AI"
                    : stats.radarScoreSource === "review"
                      ? "Trung bình đánh giá sao của học viên"
                      : undefined
                }
              >
                {formatScoreOfFive(overallAvg) ?? "Chưa có"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mentee table ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8037f418]">
                <Users size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-slate-900">Chi tiết mentee</p>
                <p className="text-xs font-bold text-slate-700">Danh sách học viên đang được mentor</p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                placeholder="Tìm kiếm học viên…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                aria-label="Tìm kiếm học viên"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-3">Học viên</th>
                  <th className="px-6 py-3">Số buổi</th>
                  <th className="px-6 py-3" title="Đánh giá sao hoặc điểm phỏng vấn AI">Đánh giá</th>
                  <th className="px-6 py-3">Xu hướng</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMentees.map((mentee) => (
                  <tr key={mentee.menteeId} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarSrc(mentee.menteeAvatar)}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatarSrc(""); }}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{mentee.menteeName}</p>
                          <p className="text-xs font-semibold text-slate-500">Cập nhật: {new Date(mentee.lastSessionDate).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{mentee.totalSessions} buổi</span>
                    </td>
                    <td className="px-6 py-4">
                      <MenteeScoreCell mentee={mentee} />
                    </td>
                    <td className="px-6 py-4">
                      <MenteeTrendBadge trend={mentee.progressTrend} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedMentee(mentee)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
                      >
                        Chi tiết <CaretRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredMentees.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm font-medium text-slate-500">
                      Không tìm thấy mentee phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Mentee detail modal ── */}
      <AnimatePresence>
        {selectedMentee && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setSelectedMentee(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="my-6 flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-[#8037f4]/15 bg-white shadow-[0_24px_64px_rgba(128,55,244,0.12)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header — gradient */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#630ed4] to-[#8037f4] px-5 py-5 text-white sm:px-6">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" aria-hidden />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={avatarSrc(selectedMentee.menteeAvatar)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white/30"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatarSrc(""); }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black tracking-tight text-white sm:text-xl">
                        {selectedMentee.menteeName}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-violet-100">
                        Chi tiết tiến độ học viên
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMentee(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm">
                  <p className="mentor-label mb-1">Số buổi</p>
                  <p className="mentor-stat-num mentor-stat-num--card">{selectedMentee.totalSessions}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm">
                  <p className="mentor-label mb-1">Đánh giá</p>
                  <div className="flex justify-center">
                    <MenteeScoreCell mentee={selectedMentee} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm">
                  <p className="mentor-label mb-1">Xu hướng</p>
                  <div className="flex justify-center">
                    <MenteeTrendBadge trend={selectedMentee.progressTrend} />
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto p-5 sm:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  {/* STAR chart */}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="mentor-label flex items-center gap-2">
                        <ChartLineIcon size={12} className="text-violet-600" />
                        Tiến trình STAR · 4 tuần
                      </p>
                    </div>
                    <div className="flex h-56 flex-col justify-center p-4">
                      {(() => {
                        const starChartRows = (selectedMentee.starHistory || []).filter((row) =>
                          [row.situation, row.task, row.action, row.result].some((v) => v != null && Number.isFinite(Number(v))),
                        );
                        if (!selectedMentee.hasBehaviorData || starChartRows.length === 0) {
                          return (
                            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-200/80 bg-violet-50/40 px-4 text-center">
                              <ChartLineIcon size={28} className="mb-3 text-violet-400" />
                              <p className="text-sm font-bold text-slate-700">
                                {selectedMentee.hasInterviewSessions ? "Chưa đủ điểm STAR để vẽ biểu đồ" : "Chưa có dữ liệu"}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Cần thêm buổi phỏng vấn AI hoặc đánh giá sau mentor
                              </p>
                            </div>
                          );
                        }
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={starChartRows}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
                              <YAxis domain={[0, 5]} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} width={24} />
                              <Tooltip contentStyle={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: 600 }} />
                              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                              <Line type="monotone" dataKey="situation" name="Tình huống" stroke="#8037f4" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                              <Line type="monotone" dataKey="task" name="Nhiệm vụ" stroke="#93f72b" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                              <Line type="monotone" dataKey="action" name="Hành động" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                              <Line type="monotone" dataKey="result" name="Kết quả" stroke="#FF8C42" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                            </LineChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Strengths & weaknesses */}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="mentor-label flex items-center gap-2">
                        <Star size={12} className="text-violet-600" />
                        Ưu điểm &amp; hạn chế
                      </p>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-black text-violet-700">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8037f4]/15">
                            <Lightning size={14} className="text-violet-600" />
                          </span>
                          Điểm mạnh
                        </p>
                        <ul className="space-y-2">
                          {(selectedMentee.strengths?.length ? selectedMentee.strengths : ["Chưa có dữ liệu"]).map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm font-semibold text-slate-700">
                              <span className="text-[#93f72b]">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-white p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-black text-orange-700">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                            <Target size={14} className="text-orange-600" />
                          </span>
                          Cần lưu ý
                        </p>
                        <ul className="space-y-2">
                          {(selectedMentee.weaknesses?.length ? selectedMentee.weaknesses : ["Chưa có dữ liệu"]).map((w, i) => (
                            <li key={i} className="flex gap-2 text-sm font-semibold text-slate-700">
                              <span className="text-orange-400">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSelectedMentee(null)}
                  className="rounded-xl bg-[#93f72b] px-8 py-2.5 text-sm font-bold text-slate-900 shadow-[0_8px_24px_rgba(147,247,43,0.35)] transition hover:brightness-105 active:scale-[0.98]"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MentorPageShell>
  );
}