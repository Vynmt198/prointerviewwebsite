import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
   Plus,
   Search,
   Users,
   Star,
   BookOpen,
   Edit3,
   Trash2,
   Shapes,
   ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { ArchiveCourseDialog } from "../../components/courses/ArchiveCourseDialog";
import { archiveCourse, fetchMyMentorCourses } from "../../utils/courseApi";
import { mapCourseAdminModerationNote } from "../../utils/courseAdminReview";
import { mediaSrc, DEFAULT_COURSE_THUMB } from "../../utils/mediaUrl";
import { normalizeCourseStats } from "../../utils/courseStats.js";

const STATUS_LABELS = {
   published: "Đã đăng",
   pending_review: "Chờ duyệt mới",
   pending_update: "Chờ duyệt cập nhật",
   draft: "Bản nháp",
   archived: "Đã lưu trữ",
};

const LEVEL_LABELS = {
   basic: "Cơ bản",
   intermediate: "Trung cấp",
   advanced: "Nâng cao",
};

function formatCourseLevel(level) {
   const key = String(level || "").toLowerCase();
   return LEVEL_LABELS[key] || "Chưa rõ";
}

function mapCourseRow(c) {
   const { rating, reviewsCount } = normalizeCourseStats(c?.stats);
   const thumb = String(c?.thumbnail || "").trim();
   return {
      id: c._id,
      title: c.title,
      status: c.status || "draft",
      adminModerationNote: mapCourseAdminModerationNote(c),
      students: c.stats?.enrollmentCount || 0,
      rating: rating ?? 0,
      reviewsCount,
      cover: mediaSrc(c.thumbnail, DEFAULT_COURSE_THUMB),
      hasCustomThumb: Boolean(thumb),
      level: formatCourseLevel(c.level),
   };
}

/** Khi API chưa trả summary.avgRating — tính từ stats từng khóa (cùng logic backend). */
function weightedAvgRatingFromCourses(courses) {
   const active = (courses || []).filter((c) => c.status !== "archived");
   let weighted = 0;
   let totalReviews = 0;
   for (const c of active) {
      const n = Number(c.reviewsCount) || 0;
      const r = c.rating;
      if (n > 0 && r != null && Number.isFinite(Number(r)) && Number(r) > 0) {
         weighted += Number(r) * n;
         totalReviews += n;
      }
   }
   if (!totalReviews) return null;
   return Number((weighted / totalReviews).toFixed(1));
}

export function MentorCourseManagement() {
   const navigate = useNavigate();
   const user = getUser();
   const [activeTab, setActiveTab] = useState("all");
   const [search, setSearch] = useState("");
  const [myCourses, setMyCourses] = useState([]);
  const [courseSummary, setCourseSummary] = useState(null);
   const [archiveTarget, setArchiveTarget] = useState(null);
   const [archiving, setArchiving] = useState(false);

   const loadCourses = useCallback(() => {
      fetchMyMentorCourses().then((res) => {
         if (!res.success || !Array.isArray(res.courses)) {
            setMyCourses([]);
            setCourseSummary(null);
            if (!res.success) toastApiError(res.error, "Không tải được khóa học của bạn.");
            return;
         }
         setMyCourses(res.courses.map(mapCourseRow));
         setCourseSummary(res.summary || null);
      });
   }, []);

   useEffect(() => {
      if (!user || user.role !== "mentor") {
         navigate("/");
         return;
      }
      loadCourses();
   }, [navigate, user, loadCourses]);

   const handleArchiveConfirm = async (courseId) => {
      const idToArchive = courseId || archiveTarget?.id;
      if (!idToArchive) return;
      setArchiving(true);
      try {
      const res = await archiveCourse(idToArchive);
      if (!res.success) {
         toastApiError(res.error, "Không thể lưu trữ khóa học.");
         return;
      }
      toastApiSuccess(res.message || "Đã lưu trữ khóa học.");
      setArchiveTarget(null);
      loadCourses();
      } catch {
         toastApiError("Lỗi kết nối khi lưu trữ khóa học.");
      } finally {
         setArchiving(false);
      }
   };

   if (!user || user.role !== "mentor") return null;

   const activeCourses = myCourses.filter((c) => c.status !== "archived");
   const filtered = myCourses.filter((c) => {
      const matchesTab =
         activeTab === "all"
            ? c.status !== "archived"
            : c.status === activeTab;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
   });
   const totalCourses = courseSummary?.totalCourses ?? activeCourses.length;
   const totalStudents = courseSummary?.totalStudents ?? activeCourses.reduce(
      (sum, c) => sum + (Number(c.students) || 0),
      0,
   );
   const avgRatingValue =
      courseSummary?.avgRating != null && Number.isFinite(Number(courseSummary.avgRating))
         ? Number(courseSummary.avgRating)
         : weightedAvgRatingFromCourses(myCourses);
   const hasAvgRating = avgRatingValue != null && Number.isFinite(avgRatingValue);
   const avgRatingDisplay = hasAvgRating ? avgRatingValue.toFixed(1) : null;

   const statCards = [
      {
         label: "Tổng khóa học",
         value: totalCourses,
         icon: BookOpen,
         iconColor: "#8037f4",
         iconBg: "#8037f418",
         cardCls: "bg-white border border-slate-100",
         valueCls: "text-slate-900",
         labelCls: "",
      },
      {
         label: "Tổng học viên",
         value: Number(totalStudents || 0).toLocaleString("vi-VN"),
         icon: Users,
         iconColor: "#1a1a1a",
         iconBg: "#1a1a1a18",
         cardCls: "bg-[#c4ff47]",
         valueCls: "text-slate-900",
         labelCls: "",
      },
      {
         label: "Đánh giá trung bình",
         value: avgRatingDisplay,
         emptyLabel: "Chưa có đánh giá",
         icon: Star,
         iconColor: "#f59e0b",
         iconBg: "#f59e0b22",
         cardCls: "bg-slate-900",
         valueCls: "text-white",
         labelCls: "mentor-label--on-dark",
      },
   ];

   const statusStyle = {
      published:      { pill: "bg-[#c4ff47] text-slate-900 shadow-sm", dot: "bg-slate-900" },
      pending_review: { pill: "bg-white/95 text-amber-800 shadow-sm backdrop-blur-sm", dot: "bg-amber-400" },
      pending_update: { pill: "bg-white/95 text-sky-800 shadow-sm backdrop-blur-sm", dot: "bg-sky-500" },
      archived:       { pill: "bg-white/95 text-zinc-600 shadow-sm backdrop-blur-sm", dot: "bg-zinc-400" },
      draft:          { pill: "bg-white/95 text-slate-600 shadow-sm backdrop-blur-sm", dot: "bg-slate-400" },
   };

   const thumbThemes = [
      { gradient: "from-[#8037f4] to-[#6d28d9]" },
      { gradient: "from-teal-500 to-cyan-700" },
   ];

   return (
      <MentorPageShell bottomPad="pb-32">
         <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">

            {/* ── Header ── */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <p className="mentor-eyebrow mb-1 flex items-center gap-2">
                     <Shapes size={12} /> Hệ thống đào tạo
                  </p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                     Khóa học <span className="text-violet-600">của tôi</span>
                  </h1>
               </div>
               <button
                  type="button"
                  onClick={() => navigate("/mentor/courses/new/edit")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#c4ff47] px-5 py-2.5 text-sm font-bold text-slate-900 shadow-md shadow-lime-300/40 transition hover:bg-[#b8f030] active:scale-95"
               >
                  <Plus size={16} strokeWidth={2.5} /> Tạo khóa học mới
               </button>
            </div>

            {/* ── Stat strip ── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
               {statCards.map((stat, i) => (
                  <div key={i} className={`flex items-center gap-4 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${stat.cardCls}`}>
                     <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: stat.iconBg }}
                     >
                        <stat.icon size={22} style={{ color: stat.iconColor }} />
                     </div>
                     <div>
                        {stat.value != null ? (
                           <p className={`mentor-stat-num mentor-stat-num--hero ${stat.valueCls === "text-white" ? "mentor-stat-num--on-dark" : ""}`}>{stat.value}</p>
                        ) : (
                           <p className={`mentor-label ${stat.labelCls}`}>{stat.emptyLabel}</p>
                        )}
                        <p className={`mentor-label mt-1 ${stat.labelCls}`}>{stat.label}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
               <div className="flex flex-wrap gap-1.5">
                  {["all", "published", "pending_review", "pending_update", "draft", "archived"].map((t) => (
                     <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`rounded-full px-4 py-2 text-xs transition-all ${
                           activeTab === t
                              ? "bg-violet-600 font-bold text-white shadow-sm"
                              : "border border-slate-200 bg-white font-semibold text-slate-800 hover:border-violet-300 hover:text-violet-800"
                        }`}
                     >
                        {t === "all" ? "Tất cả" : STATUS_LABELS[t] || t}
                     </button>
                  ))}
               </div>
               <div className="relative w-full max-w-sm lg:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Tìm kiếm nội dung khóa học..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
               </div>
            </div>

            {/* ── Course grid ── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
               {filtered.map((course, idx) => {
                  const st = statusStyle[course.status] || statusStyle.draft;
                  const theme = thumbThemes[idx % thumbThemes.length];
                  const statusLabel = STATUS_LABELS[course.status] || "Bản nháp";
                  return (
                     <div
                        key={course.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_32px_rgba(128,55,244,0.12)]"
                     >
                        {/* Thumbnail */}
                        <div className={`relative h-44 overflow-hidden ${course.hasCustomThumb ? "bg-slate-100" : `bg-gradient-to-br ${theme.gradient}`}`}>
                           {course.hasCustomThumb ? (
                              <img
                                 src={course.cover}
                                 alt=""
                                 className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                           ) : (
                              <>
                                 <div
                                    className="absolute inset-0 opacity-25"
                                    style={{
                                       backgroundImage:
                                          "repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(255,255,255,0.18) 14px, rgba(255,255,255,0.18) 28px)",
                                    }}
                                    aria-hidden
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                       <ImageIcon size={28} className="text-white/90" strokeWidth={1.5} />
                                    </div>
                                 </div>
                              </>
                           )}
                           {/* Status — top left */}
                           <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold ${st.pill}`}>
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
                              {statusLabel}
                           </span>
                           {/* Level — top right */}
                           <span className="absolute right-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                              {course.level}
                           </span>
                        </div>

                        {/* Body */}
                        <div className="flex flex-1 flex-col p-5">
                           <h4 className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-violet-700">
                              {course.title}
                           </h4>

                           {course.adminModerationNote && (
                              <div
                                 className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
                                    course.adminModerationNote.tone === "amber"
                                       ? "border-amber-200 bg-amber-50 text-amber-800"
                                       : "border-red-200 bg-red-50 text-red-800"
                                 }`}
                              >
                                 <p className="font-semibold">{course.adminModerationNote.title}</p>
                                 <p className="mt-0.5 leading-relaxed">{course.adminModerationNote.reason}</p>
                              </div>
                           )}

                           {/* Metrics */}
                           <div className="mt-auto mb-4 grid grid-cols-2 gap-2.5">
                              <div className="rounded-2xl bg-[#f3f1f8] px-4 py-3">
                                 <p className="mentor-label mb-2">Học viên</p>
                                 <div className="flex items-center gap-2">
                                    <Users size={18} className="shrink-0 text-violet-600" strokeWidth={2} />
                                    <p className="mentor-stat-num mentor-stat-num--card">
                                       {course.students.toLocaleString("vi-VN")}
                                    </p>
                                 </div>
                              </div>
                              <div className="rounded-2xl bg-[#f3f1f8] px-4 py-3">
                                 <p className="mentor-label mb-2">Đánh giá</p>
                                 <div className="flex items-center gap-2">
                                    <Star size={18} className="shrink-0 fill-amber-400 text-amber-400" strokeWidth={0} />
                                    <p className="mentor-stat-num mentor-stat-num--card">
                                       {course.rating > 0 ? course.rating.toFixed(1) : "—"}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                                 disabled={course.status === "archived"}
                                 className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                 <Edit3 size={13} /> Chỉnh sửa
                              </button>
                              {course.status !== "archived" && (
                                 <button
                                    type="button"
                                    onClick={() => setArchiveTarget({ id: course.id, title: course.title })}
                                    title="Lưu trữ khóa học"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                 >
                                    <Trash2 size={15} />
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}

               {/* Create card */}
               <button
                  type="button"
                  onClick={() => navigate("/mentor/courses/new/edit")}
                  className="group flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-5 rounded-[28px] border-2 border-dashed border-[#baa5ff]/70 bg-gradient-to-b from-white to-violet-50/80 transition hover:border-[#8037f4]/50 hover:from-white hover:to-violet-50"
               >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c4ff47] shadow-[0_10px_24px_rgba(196,255,71,0.35)] transition group-hover:scale-105">
                     <Plus size={26} className="text-slate-900" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                     Thiết kế khóa học mới
                  </p>
               </button>
            </div>

            {!activeCourses.length && activeTab !== "archived" && (
               <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-normal text-slate-400">Bạn chưa có khóa học nào trên hệ thống.</p>
                  <p className="mt-1 text-xs text-slate-400">Hãy bấm "Tạo khóa học mới" để bắt đầu, sau đó gửi admin duyệt.</p>
               </div>
            )}
         </div>

         <ArchiveCourseDialog
            open={Boolean(archiveTarget)}
            courseTitle={archiveTarget?.title}
            archiving={archiving}
            onOpenChange={(open) => {
               if (!open && !archiving) setArchiveTarget(null);
            }}
            onConfirm={() => handleArchiveConfirm(archiveTarget?.id)}
         />
      </MentorPageShell>
   );
}