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
  Minus,
  X,
  Search,
  Filter,
  Calendar,
  ArrowRight
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import {
  mentorPageTitle,
  mentorPageSubtitle,
  mentorStatValue,
  mentorSectionTitle,
  mentorAccentText,
  mentorSearchInput,
} from "../../components/mentor/mentorTypography";
import { avatarSrc } from "../../utils/mediaUrl";

const RADAR_SKILLS = [
  { subject: "Tình huống", A: 120, fullMark: 150 },
  { subject: "Nhiệm vụ", A: 98, fullMark: 150 },
  { subject: "Hành động", A: 86, fullMark: 150 },
  { subject: "Kết quả", A: 99, fullMark: 150 },
  { subject: "Phản hồi", A: 85, fullMark: 150 },
];

const TREND_LABELS = {
  improving: "Cải thiện",
  declining: "Giảm dần",
  stable: "Ổn định",
};

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
  };

  // Prepare chart data
  const weeklyChartData = (analytics?.weeklyStats || []).map((w) => ({
    week: w.week,
    "Điểm TB": parseFloat(w.avgStarScore.toFixed(2)),
    "Số buổi": w.totalMeetings,
  }));

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <TrendUp className="w-5 h-5 text-violet-700" />;
      case "declining":
        return <TrendDown className="w-5 h-5 text-orange-500" />;
      default:
        return <Minus className="w-5 h-5 text-zinc-500" />;
    }
  };

  const mentees = analytics?.mentees || [];
  const filteredMentees = mentees.filter(m => 
    m.menteeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MentorPageShell bottomPad="pb-32">
      <div className="relative z-10 mx-auto max-w-7xl px-10 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div>
            <h1 className={`mb-3 ${mentorPageTitle}`}>
              <span>Phân tích</span>{" "}
              <span className={mentorAccentText}>& Thống kê</span>
            </h1>
            <p className={mentorPageSubtitle}>
              Theo dõi dữ liệu thực tế và tiến độ của học viên
            </p>
          </div>
        </div>

        {/* Global Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
           {[
             { label: "Buổi mentor", value: stats.totalSessions, trend: "+12", icon: ChartLineIcon, color: "#8037f4" },
             { label: "Tổng mentee", value: stats.totalMentees, trend: "Ổn định", icon: Users, color: "#93f72b" },
             { label: "Đang cải thiện", value: stats.improvingCount, trend: "Theo dõi", icon: Target, color: "#f59e0b" },
             { label: "Điểm trung bình", value: Number(stats.topAvgScore || 0).toFixed(1), trend: "/ 5.0", icon: Star, color: "#8037f4" }
           ].map((stat, i) => (
             <div key={i} className="glass-card p-8 group">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <stat.icon size={18} style={{ color: stat.color }} />
                   </div>
                   <span className="text-xs font-medium text-slate-500">{stat.trend}</span>
                </div>
                <h3 className={`mb-1 ${mentorStatValue}`}>{stat.value}</h3>
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
             </div>
           ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid lg:grid-cols-12 gap-10">
           {/* Weekly Trends Chart */}
           <div className="lg:col-span-8">
              <div className="glass-card p-10 h-full">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                       <h4 className={`${mentorSectionTitle} flex items-center gap-3 mb-2`}>
                          <ChartLineIcon className="text-violet-700" size={20} /> Hiệu suất đào tạo tuần
                       </h4>
                       <p className="text-xs font-medium text-slate-500">
                         Dữ liệu hoàn thành các buổi phỏng vấn thử
                       </p>
                    </div>
                    <div className="flex gap-2">
                       <button
                         type="button"
                         className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                       >
                         Toàn thời gian
                       </button>
                    </div>
                 </div>

                 <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={weeklyChartData}>
                          <defs>
                             <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8037f4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8037f4" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis 
                             dataKey="week" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }} 
                             dy={10}
                          />
                          <YAxis 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }} 
                          />
                          <Tooltip 
                             contentStyle={{ background: "#0E0922", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "12px" }}
                             itemStyle={{ color: "#fff", fontSize: "12px", fontWeight: "800" }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="Số buổi" 
                             stroke="#8037f4" 
                             strokeWidth={4}
                             fillOpacity={1} 
                             fill="url(#purpleGradient)" 
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Performance Radar Example or Sidebar Stats */}
           <div className="lg:col-span-4">
              <div className="glass-card p-10 h-full">
                 <h4 className={`${mentorSectionTitle} mb-8`}>Kỹ năng tập trung</h4>
                 <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadarChart cx="50%" cy="50%" outerRadius="72%" data={RADAR_SKILLS}>
                          <PolarGrid stroke="rgba(148, 163, 184, 0.25)" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                          />
                          <Radar name="Skills" dataKey="A" stroke="#93f72b" fill="#93f72b" fillOpacity={0.2} strokeWidth={2} />
                       </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                       <span className="text-xs font-semibold text-slate-500">Trung bình STAR</span>
                       <span className="text-sm font-bold text-violet-700">4.2 / 5.0</span>
                    </div>
                    <p className="text-center text-xs font-medium text-slate-500">
                      Phân tích dựa trên dữ liệu buổi mentor
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Mentees Management List */}
        <div className="mt-16 glass-card overflow-hidden">
           <div className="p-10 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-violet-700">
                    <Users size={20} />
                 </div>
                 <div>
                    <h4 className={mentorSectionTitle}>Chi tiết mentee</h4>
                    <p className="text-xs font-medium text-slate-500">
                      Danh sách học viên và tiến trình STAR
                    </p>
                 </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="relative w-full sm:w-64">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <input
                      type="search"
                      placeholder="Tìm kiếm học viên…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={mentorSearchInput}
                      aria-label="Tìm kiếm học viên trong danh sách"
                    />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                       <th className="px-10 py-6">Học viên</th>
                       <th className="px-10 py-6">Số buổi</th>
                       <th className="px-10 py-6">Điểm TB</th>
                       <th className="px-10 py-6">Xu hướng</th>
                       <th className="px-10 py-6 text-right">Thao tác</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {filteredMentees.map((mentee) => (
                      <tr key={mentee.menteeId} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                               <img
                                 src={avatarSrc(mentee.menteeAvatar)}
                                 alt=""
                                 className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/5"
                                 onError={(e) => {
                                   e.currentTarget.onerror = null;
                                   e.currentTarget.src = avatarSrc("");
                                 }}
                               />
                               <div>
                                  <p className="text-sm font-semibold text-slate-900">{mentee.menteeName}</p>
                                  <p className="text-xs text-slate-500">
                                    Cập nhật: {new Date(mentee.lastSessionDate).toLocaleDateString("vi-VN")}
                                  </p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <span className="text-xs font-black text-slate-900">{mentee.totalSessions} buổi</span>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                               <Star size={12} className="text-[#FFD600] fill-current" />
                               <span className="text-sm font-black text-slate-900">{mentee.avgStarScore.toFixed(1)}</span>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                               {getTrendIcon(mentee.progressTrend)}
                               <span
                                 className={`text-xs font-semibold ${
                                   mentee.progressTrend === "improving" ? "text-violet-700" : "text-slate-500"
                                 }`}
                               >
                                  {TREND_LABELS[mentee.progressTrend] || TREND_LABELS.stable}
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <button 
                               onClick={() => setSelectedMentee(mentee)}
                               className="ml-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                             >
                               Chi tiết <CaretRight size={14} />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Simplified Mentee Detail View (Same logic as Dashboard Modal but within Analytics context) */}
      <AnimatePresence>
        {selectedMentee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/35"
            onClick={() => setSelectedMentee(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <img
                       src={avatarSrc(selectedMentee.menteeAvatar)}
                       alt=""
                       className="h-16 w-16 rounded-[24px] object-cover ring-4 ring-white/5"
                       onError={(e) => {
                         e.currentTarget.onerror = null;
                         e.currentTarget.src = avatarSrc("");
                       }}
                     />
                     <div>
                        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{selectedMentee.menteeName}</h2>
                        <p className="mt-1 text-sm font-medium text-violet-700">
                          Phân tích hành vi & STAR
                        </p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedMentee(null)} className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-zinc-500">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar">
                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <h5 className="text-sm font-semibold text-slate-700">Tiến trình STAR theo thời gian</h5>
                        <div className="h-[250px] glass-card p-6 bg-white/[0.01]">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={selectedMentee.starHistory}>
                                 <XAxis dataKey="date" hide />
                                 <YAxis domain={[0, 5]} hide />
                                 <Tooltip contentStyle={{ background: "#0E0922", borderRadius: "12px", border: "1px solid #333" }} />
                                 <Line type="monotone" dataKey="situation" stroke="#8037f4" strokeWidth={3} dot={false} />
                                 <Line type="monotone" dataKey="task" stroke="#93f72b" strokeWidth={3} dot={false} />
                                 <Line type="monotone" dataKey="action" stroke="#f59e0b" strokeWidth={3} dot={false} />
                                 <Line type="monotone" dataKey="result" stroke="#FF8C42" strokeWidth={3} dot={false} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <h5 className="text-sm font-semibold text-slate-700">Ưu điểm & hạn chế</h5>
                        <div className="space-y-4">
                           <div className="p-6 rounded-3xl bg-primary-fixed/5 border border-primary-fixed/10">
                              <h6 className="mb-4 flex items-center gap-2 text-xs font-semibold text-violet-700">
                                <Lightning size={12} /> Điểm mạnh
                              </h6>
                              <ul className="space-y-2">
                                 {selectedMentee.strengths.map((s, i) => (
                                   <li key={i} className="text-xs font-medium text-slate-600 flex gap-2"><span className="text-violet-700">•</span> {s}</li>
                                 ))}
                              </ul>
                           </div>
                           <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
                              <h6 className="mb-4 flex items-center gap-2 text-xs font-semibold text-orange-600">
                                <Target size={12} /> Cần lưu ý
                              </h6>
                              <ul className="space-y-2">
                                 {selectedMentee.weaknesses.map((w, i) => (
                                   <li key={i} className="text-xs font-medium text-slate-600 flex gap-2"><span className="text-orange-400">•</span> {w}</li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="p-6 border-t border-slate-200 bg-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedMentee(null)}
                    className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
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