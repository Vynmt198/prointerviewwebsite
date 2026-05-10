import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
   Plus,
   Search,
   Users,
   Star,
   ArrowLeft,
   BookOpen,
   CircleDollarSign,
   ArrowRight,
   PlusCircle,
   ExternalLink,
   Edit3,
   Trash2,
   CheckCircle2,
   Clock,
   ChevronRight,
   Shapes
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMyMentorCourses } from "../../utils/courseApi";

function formatCompactNumber(value) {
   const n = Number(value) || 0;
   if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
   return String(n);
}

export function MentorCourseManagement() {
   const navigate = useNavigate();
   const user = getUser();
   const [activeTab, setActiveTab] = useState("all");
   const [search, setSearch] = useState("");
  const [myCourses, setMyCourses] = useState([]);

   useEffect(() => {
      if (!user || user.role !== "mentor") {
         navigate("/");
         return;
      }
      fetchMyMentorCourses().then((res) => {
         if (!res.success || !Array.isArray(res.courses)) {
            setMyCourses([]);
            return;
         }
         const mapped = res.courses.map((c) => ({
            id: c._id,
            title: c.title,
            status: c.status || "draft",
            students: c.stats?.enrollmentCount || 0,
            rating: c.stats?.rating || 0,
            earnings: c.stats?.totalRevenue || 0,
            cover: c.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
            level:
               c.level === "basic"
                  ? "Basic"
                  : c.level === "intermediate"
                    ? "Intermediate"
                    : "Advanced",
         }));
         setMyCourses(mapped);
      });
   }, [navigate, user]);

   if (!user || user.role !== "mentor") return null;

   const filtered = myCourses.filter(c => {
      const matchesTab = activeTab === "all" || c.status === activeTab;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
   });
   const totalCourses = myCourses.length;
   const totalStudents = myCourses.reduce((sum, c) => sum + (Number(c.students) || 0), 0);
   const totalRevenue = myCourses.reduce((sum, c) => sum + (Number(c.earnings) || 0), 0);
   const ratedCourses = myCourses.filter((c) => Number(c.rating) > 0);
   const avgRating = ratedCourses.length
      ? (ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length).toFixed(1)
      : "0.0";

   return (
      <MentorPageShell bottomPad="pb-32">
         <div className="relative z-10 p-8 max-w-7xl mx-auto pt-16">
            {/* Header Unit */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
               <div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-primary-fixed uppercase tracking-[0.3em] mb-4">
                     <Shapes size={14} /> Hệ thống Đào tạo
                  </div>
                  <h1 className="mb-4 text-5xl font-black uppercase leading-none tracking-tighter text-slate-900 sm:text-6xl md:text-7xl">
                     Khóa học <span className="text-violet-700">của tôi</span>
                  </h1>
                  <p className="text-slate-600 text-lg font-medium">Xây dựng nội dung, theo dõi doanh thu và học viên của bạn</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => navigate("/mentor/courses/new/edit")} className="px-10 py-5 rounded-3xl bg-primary-fixed text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_40px_rgba(196, 255, 71,0.3)] flex items-center gap-3">
                     <Plus size={20} /> Tạo khóa học mới
                  </button>

               </div>
            </div>

            {/* Course Analytics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-14">
               {[
                  { label: "Tổng khóa học", value: totalCourses, icon: BookOpen, color: "#6E35E8" },
                  { label: "Tổng học viên", value: formatCompactNumber(totalStudents), icon: Users, color: "#c4ff47" },
                  { label: "Rating trung bình", value: avgRating, icon: Star, color: "#f59e0b" },
                  { label: "Doanh thu tạm tính", value: formatCompactNumber(totalRevenue), icon: CircleDollarSign, color: "#d946ef" }
               ].map((stat, i) => (
                  <div key={i} className="glass-card p-7 group overflow-hidden">
                     <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <stat.icon size={22} style={{ color: stat.color }} />
                        </div>
                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 leading-none">{stat.value}</h3>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.label}</p>
                     </div>
                     <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-full" />
                  </div>
               ))}
            </div>

            {/* Controls & Grid */}
            <div className="space-y-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-2">
                     {["all", "published", "pending_review", "pending_update", "draft"].map(t => (
                        <button
                           key={t}
                           onClick={() => setActiveTab(t)}
                           className={`rounded-[18px] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all sm:px-8 ${activeTab === t ? "bg-violet-600 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-slate-900"
                              }`}
                        >
                           {t === "all"
                              ? "Tất cả"
                              : t === "published"
                                 ? "Đã đăng"
                                 : t === "pending_review"
                                    ? "Chờ duyệt mới"
                                    : t === "pending_update"
                                       ? "Chờ duyệt cập nhật"
                                       : "Bản nháp"}
                        </button>
                     ))}
                  </div>
                  <div className="group relative max-w-lg flex-1">
                     <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-violet-600" size={20} />
                     <input
                        type="text"
                        placeholder="Tìm kiếm nội dung khóa học..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-[20px] border border-slate-200 bg-white py-3.5 pl-16 pr-5 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-200/80"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filtered.map((course) => (
                     <div key={course.id} className="glass-card flex flex-col group h-full">
                        <div className="relative h-60 overflow-hidden">
                           <img src={course.cover} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                           <div className="absolute top-6 left-6 flex gap-2">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                 course.status === 'published'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                    : course.status === 'pending_review'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                      : course.status === 'pending_update'
                                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                                      : 'bg-zinc-500/20 text-zinc-500 border-zinc-500/20'
                                 }`}>
                                 {course.status === "published"
                                    ? "Đã đăng"
                                    : course.status === "pending_review"
                                      ? "Chờ duyệt mới"
                                      : course.status === "pending_update"
                                        ? "Chờ duyệt cập nhật"
                                        : "Bản nháp"}
                              </span>
                              <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 backdrop-blur-md">
                                 {course.level}
                              </span>
                           </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                           <h4 className="text-xl font-black text-slate-900 tracking-tighter mb-4 group-hover:text-primary-fixed transition-colors leading-tight">
                              {course.title}
                           </h4>
                           <div className="grid grid-cols-2 gap-6 mb-10 mt-auto">
                              <div className="flex items-center gap-3">
                                 <Users size={16} className="text-zinc-600" />
                                 <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Học viên</p>
                                    <p className="text-sm font-black text-slate-900">{course.students.toLocaleString()}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Star size={16} className="text-[#FFD600]" />
                                 <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Đánh giá</p>
                                    <p className="text-sm font-black text-slate-900">{course.rating > 0 ? course.rating : 'N/A'}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <button
                                 onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                                 className="flex-1 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                 <Edit3 size={14} /> Chỉnh sửa
                              </button>
                              <button
                                 onClick={() => course.status === "published" && navigate(`/courses/${course.id}`)}
                                 title={course.status === "published" ? "Xem trang khóa học" : "Chỉ xem được khi khóa học đã đăng"}
                                 className="w-14 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:text-primary-fixed hover:bg-slate-100 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                 disabled={course.status !== "published"}
                              >
                                 <ExternalLink size={16} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
                  <div
                     onClick={() => navigate("/mentor/courses/new/edit")}
                     className="glass-card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-zinc-700 hover:border-primary-fixed hover:text-primary-fixed transition-all cursor-pointer group min-h-[360px]">
                     <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <PlusCircle size={32} className="opacity-40 group-hover:opacity-100" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-[0.3em]">Thiết kế khóa học mới</p>
                  </div>
               </div>
               {!myCourses.length && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                     <p className="text-sm font-semibold text-zinc-300">
                        Bạn chưa có khóa học nào trên hệ thống.
                     </p>
                     <p className="mt-2 text-xs text-zinc-500">
                        Hãy bấm "Tạo khóa học mới" để bắt đầu, sau đó gửi admin duyệt.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </MentorPageShell>
   );
}