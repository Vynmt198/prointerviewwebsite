import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
   Users,
   Star,
   Search,
   CheckCircle2,
   Clock,
   FileBadge,
   ChevronRight,
   ShieldCheck,
   TrendingUp,
   BookOpen,
   PlayCircle,
   Sparkles,
   ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMentorPeerReviews, submitMentorPeerReview } from "../../utils/mentorApi";
import { toastApiError, tryApi } from "../../utils/apiToast";
import { toast } from "sonner";
import { mediaSrc, DEFAULT_COURSE_THUMB } from "../../utils/mediaUrl";

const CATEGORY_LABELS = {
   all: "Tất cả lĩnh vực",
   technical: "Kỹ thuật",
   behavioral: "Hành vi",
   negotiation: "Đàm phán",
   other: "Khác",
};

function formatCategory(cat) {
   if (!cat || cat === "all") return CATEGORY_LABELS.all;
   const key = String(cat).toLowerCase();
   return CATEGORY_LABELS[key] || String(cat);
}

function PeerReviewStarRating({ value, onChange, label }) {
   return (
      <div className="flex items-center gap-0.5" role="group" aria-label={`${label}: ${value} sao`}>
         {[1, 2, 3, 4, 5].map((n) => (
            <button
               key={n}
               type="button"
               onClick={() => onChange(n)}
               className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
               aria-label={`${n} sao`}
               aria-pressed={n <= value}
            >
               <Star
                  size={22}
                  className={
                     n <= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                  }
               />
            </button>
         ))}
      </div>
   );
}

export function MentorPeerReview() {
   const navigate = useNavigate();
   const user = getUser();
   const [filter, setFilter] = useState("all");
   const [search, setSearch] = useState("");
   const [category, setCategory] = useState("all");
   const [coursesForReview, setCoursesForReview] = useState([]);
   const [selectedCourse, setSelectedCourse] = useState(null);
   const [submitting, setSubmitting] = useState(false);
   const [reviewForm, setReviewForm] = useState({
      contentRating: 5,
      qualityRating: 5,
      priceValueRating: 5,
      feedback: "",
   });

   useEffect(() => {
      if (!user || user.role !== "mentor") {
         navigate("/");
         return;
      }
      void (async () => {
         const res = await tryApi(() => fetchMentorPeerReviews(), {
            fallback: "Không tải được danh sách đánh giá chéo.",
         });
         if (!res.success || !Array.isArray(res.items)) {
            setCoursesForReview([]);
            return;
         }
         setCoursesForReview(
            res.items.map((item) => ({
               ...item,
               cover: item.cover || "",
            })),
         );
      })();
   }, []);

   if (!user || user.role !== "mentor") return null;

   const filtered = coursesForReview.filter(c => {
      const matchesFilter = filter === "all" || c.status === filter;
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.mentor.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || c.category === category;
      return matchesFilter && matchesSearch && matchesCategory;
   });
   const pendingCount = coursesForReview.filter((c) => c.status === "pending").length;
   const reviewedCount = coursesForReview.filter((c) => c.status === "reviewed").length;
   const highScoreCount = coursesForReview.filter((c) => c.status === "reviewed" && Number(c.rating) >= 4.5).length;
   const reviewedRows = coursesForReview.filter((c) => c.status === "reviewed" && Number(c.rating) > 0);
   const avgRating = reviewedRows.length
      ? (reviewedRows.reduce((sum, c) => sum + Number(c.rating || 0), 0) / reviewedRows.length).toFixed(1)
      : "0.0";
   const categories = ["all", "other", "behavioral", "technical", "negotiation"];

   const thumbThemes = [
      { gradient: "from-sky-400 to-blue-600" },
      { gradient: "from-fuchsia-400 to-pink-600" },
      { gradient: "from-teal-400 to-cyan-600" },
      { gradient: "from-[#8037f4] to-[#6d28d9]" },
   ];

   const startReview = (course) => {
      if (course.status === "reviewed") {
         toast.info("Khóa học này đã được bạn đánh giá rồi.");
         return;
      }
      setSelectedCourse(course);
      setReviewForm({ contentRating: 5, qualityRating: 5, priceValueRating: 5, feedback: "" });
   };

   const submitReview = async () => {
      if (!selectedCourse?.id) return;
      setSubmitting(true);
      const res = await tryApi(() => submitMentorPeerReview(selectedCourse.id, reviewForm), {
         fallback: "Không gửi được đánh giá.",
         successMessage: "Đã gửi đánh giá chéo.",
      });
      setSubmitting(false);
      if (!res.success) return;
      setCoursesForReview((prev) =>
         prev.map((item) =>
            item.id === selectedCourse.id
               ? { ...item, status: "reviewed", rating: Number(res.review?.rating || item.rating || 0) }
               : item,
         ),
      );
      setSelectedCourse(null);
   };

   const statCards = [
      { label: "Cần đánh giá", value: pendingCount, icon: Clock, cardCls: "bg-white border border-slate-100", iconColor: "#8037f4", iconBg: "#8037f418", onDark: false },
      { label: "Đã hoàn thành", value: reviewedCount, icon: CheckCircle2, cardCls: "bg-[#c4ff47]", iconColor: "#1a1a1a", iconBg: "#1a1a1a18", onDark: false },
      { label: "Đánh giá điểm cao", value: highScoreCount, icon: TrendingUp, cardCls: "bg-white border border-slate-100", iconColor: "#2563eb", iconBg: "#2563eb18", onDark: false },
      { label: "Điểm trung bình", value: avgRating, icon: Star, cardCls: "bg-[#1a1a2e]", iconColor: "#f59e0b", iconBg: "#f59e0b22", onDark: true },
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
                     <FileBadge size={12} /> Đánh giá chuyên môn
                  </p>
                  <h1 className="font-headline text-2xl font-black tracking-tight text-white sm:text-3xl">
                     Đánh giá{" "}
                     <span className="text-[#93f72b]">chéo khóa học</span>
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-violet-100">
                     Với tư cách mentor trong hệ thống ProInterview, bạn có hành quyền đánh giá chuyên môn các khóa học của đồng nghiệp để đảm bảo chất lượng nội dung toàn hệ thống.
                  </p>
               </div>
            </section>

            {/* ── Stat strip ── */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
               {statCards.map((stat, i) => (
                  <div key={i} className={`flex items-center gap-4 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${stat.cardCls}`}>
                     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: stat.iconBg }}>
                        <stat.icon size={22} style={{ color: stat.iconColor }} />
                     </div>
                     <div>
                        <p className={`mentor-stat-num mentor-stat-num--hero ${stat.onDark ? "mentor-stat-num--on-dark" : ""}`}>{stat.value}</p>
                        <p className={`mentor-label mt-1 ${stat.onDark ? "mentor-label--on-dark" : ""}`}>{stat.label}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* ── Info banner ── */}
            <div className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-2xl bg-[#c4ff47] px-5 py-4 sm:px-6 sm:py-5">
               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                  <Sparkles size={18} className="text-[#c4ff47]" />
               </div>
               <div className="relative z-10 min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-800/70">Hướng dẫn</p>
                  <p className="text-sm font-bold text-slate-900">Quy tắc đánh giá chuyên môn</p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-800/80">
                     Hãy đánh giá khách quan và chuyên nghiệp dựa trên kiến thức của bạn. Đánh giá của bạn giúp học viên tin tưởng hơn vào nội dung và nhận điểm thưởng từ nền tảng.
                  </p>
               </div>
               <ShieldCheck size={72} className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-slate-900/10 sm:block" strokeWidth={1.25} />
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
               <div className="relative w-full flex-1 lg:max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Tìm kiếm khóa học hoặc mentor..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
               </div>
               <div className="flex flex-wrap gap-1.5 lg:shrink-0">
                  {["all", "pending", "reviewed"].map((v) => (
                     <button
                        key={v}
                        type="button"
                        onClick={() => setFilter(v)}
                        className={`rounded-full px-4 py-2 text-xs transition-all ${
                           filter === v
                              ? "bg-violet-600 font-bold text-white shadow-sm"
                              : "border border-slate-200 bg-white font-semibold text-slate-800 hover:border-violet-300 hover:text-violet-800"
                        }`}
                     >
                        {v === "all" ? "Tất cả" : v === "pending" ? "Chưa đánh giá" : "Đã đánh giá"}
                     </button>
                  ))}
               </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-1.5">
               {categories.map((cat) => (
                  <button
                     key={cat}
                     type="button"
                     onClick={() => setCategory(cat)}
                     className={`rounded-full px-4 py-2 text-xs transition-all ${
                        category === cat
                           ? "bg-violet-600 font-bold text-white shadow-sm"
                           : "border border-slate-200 bg-white font-semibold text-slate-800 hover:border-violet-300 hover:text-violet-800"
                     }`}
                  >
                     {formatCategory(cat)}
                  </button>
               ))}
            </div>

            {/* ── Course grid ── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
               {filtered.map((course, idx) => {
                  const reviewed = course.status === "reviewed";
                  const statusPill = reviewed
                     ? { pill: "bg-[#c4ff47] text-slate-900 shadow-sm", dot: "bg-slate-900", label: "Đã đánh giá" }
                     : { pill: "bg-violet-600 text-white shadow-sm", dot: "bg-white", label: "Chưa đánh giá" };
                  const hasCustomThumb = Boolean(String(course.cover || "").trim());
                  const theme = thumbThemes[idx % thumbThemes.length];
                  return (
                  <div
                     key={course.id}
                     className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_32px_rgba(128,55,244,0.12)]"
                  >
                     {/* Thumbnail */}
                     <div className={`relative h-44 overflow-hidden ${hasCustomThumb ? "bg-slate-100" : `bg-gradient-to-br ${theme.gradient}`}`}>
                        {hasCustomThumb ? (
                           <img
                              src={mediaSrc(course.cover, DEFAULT_COURSE_THUMB)}
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
                        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                           {formatCategory(course.category)}
                        </span>
                        <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold ${statusPill.pill}`}>
                           <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusPill.dot}`} />
                           {statusPill.label}
                        </span>
                     </div>

                     {/* Body */}
                     <div className="flex flex-1 flex-col p-5">
                        <h4 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-violet-700">
                           {course.title}
                        </h4>
                        <p className="mb-4 text-xs font-semibold text-slate-500">
                           Tác giả: <span className="text-slate-700">{course.mentor}</span>
                        </p>

                        {/* Footer */}
                        <div className="mt-auto flex items-center justify-between gap-3">
                           <div className="flex items-center gap-1.5 text-slate-500">
                              <Users size={15} className="shrink-0 text-slate-400" strokeWidth={2} />
                              <span className="text-sm font-bold text-slate-700">{course.participants}</span>
                           </div>
                           <button
                              type="button"
                              onClick={() => startReview(course)}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition active:scale-[0.98] ${
                                 reviewed
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-violet-600 text-white hover:bg-violet-700"
                              }`}
                           >
                              {reviewed ? (
                                 <><CheckCircle2 size={13} /> Đã đánh giá</>
                              ) : (
                                 <>Bắt đầu đánh giá <ChevronRight size={13} /></>
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
                  );
               })}
            </div>

            {!coursesForReview.length && (
               <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-normal text-slate-400">Hiện chưa có khóa học nào khả dụng để đánh giá chéo.</p>
               </div>
            )}
         </div>

         {/* ── Review modal ── */}
         <AnimatePresence>
            {selectedCourse && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/50"
                  onClick={() => setSelectedCourse(null)}
               >
                  <motion.div
                     initial={{ scale: 0.96, y: 20, opacity: 0 }}
                     animate={{ scale: 1, y: 0, opacity: 1 }}
                     exit={{ scale: 0.96, y: 20, opacity: 0 }}
                     className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                     onClick={(e) => e.stopPropagation()}
                  >
                     {/* Modal header */}
                     <div className="border-b border-slate-100 px-6 py-5">
                        <h3 className="text-base font-bold text-slate-900">Đánh giá chéo khóa học</h3>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{selectedCourse.title}</p>
                     </div>

                     <div className="p-6">
                        {/* Course info */}
                        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                           <p className="line-clamp-3 text-xs text-slate-600">
                              {selectedCourse.description || "Chưa có mô tả chi tiết cho khóa học này."}
                           </p>
                           <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-slate-500">
                              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">{selectedCourse.level || "Chưa rõ"}</span>
                              <span>{selectedCourse.isFree ? "Miễn phí" : `${Number(selectedCourse.price || 0).toLocaleString("vi-VN")} ₫`}</span>
                              <span>{Number(selectedCourse.lessonCount || 0)} bài học</span>
                           </div>
                           <div className="flex flex-wrap gap-3 pt-1">
                              <button
                                 type="button"
                                 onClick={() => navigate(`/courses/${selectedCourse.id}?peerReview=1`)}
                                 className="inline-flex items-center gap-1.5 text-xs font-normal text-violet-700 hover:opacity-80"
                              >
                                 <BookOpen size={12} /> Chi tiết đề cương
                              </button>
                              <button
                                 onClick={() => window.open(selectedCourse.videoUrl || "", "_blank")}
                                 disabled={!selectedCourse.videoUrl}
                                 className="inline-flex items-center gap-1.5 text-xs font-normal text-emerald-700 hover:opacity-80"
                              >
                                 <PlayCircle size={13} /> Xem bài học
                              </button>
                           </div>
                        </div>

                        {/* Rating fields */}
                        <div className="space-y-3 mb-4">
                           {[
                              ["contentRating", "Nội dung"],
                              ["qualityRating", "Chất lượng"],
                              ["priceValueRating", "Giá trị / Chi phí"],
                           ].map(([field, label]) => (
                              <div key={field} className="flex items-center justify-between gap-4">
                                 <span className="text-sm font-semibold text-slate-700">{label}</span>
                                 <PeerReviewStarRating
                                    label={label}
                                    value={reviewForm[field]}
                                    onChange={(n) => setReviewForm((prev) => ({ ...prev, [field]: n }))}
                                 />
                              </div>
                           ))}
                        </div>

                        <textarea
                           value={reviewForm.feedback}
                           onChange={(e) => setReviewForm((prev) => ({ ...prev, feedback: e.target.value }))}
                           placeholder="Nhận xét chi tiết (không bắt buộc)"
                           className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                     </div>

                     {/* Modal footer */}
                     <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
                        <button
                           onClick={() => setSelectedCourse(null)}
                           className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                           Hủy
                        </button>
                        <button
                           onClick={submitReview}
                           disabled={submitting}
                           className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                        >
                           {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </MentorPageShell>
   );
}