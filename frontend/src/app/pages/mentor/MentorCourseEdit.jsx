import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
   ArrowLeft,
   BookOpen,
   Users,
   MessageCircle as ChatCircle,
   BarChart as ChartBar,
   Pencil as PencilSimple,
   Trash2 as Trash,
   Plus,
   Layout,
   Eye,
   PlayCircle,
   Clock,
   CheckCircle,
   AlertTriangle as Warning,
   Upload,
   Video,
   GraduationCap,
   Star,
   TrendingUp as TrendUp,
   ArrowUp,
   ArrowDown,
   BadgeCheck as SealCheck,
   Zap as Lightning,
   ToggleLeft,
   ToggleRight,
   X,
   Check,
   Video as FileVideo,
   User,
   Calendar as CalendarBlank,
   PieChart as ChartPie,
   LineChart as ChartLineIcon,
   CircleDollarSign as CurrencyCircleDollar,
   ChevronRight as CaretRight,
   Search as MagnifyingGlass,
   Filter as Funnel,
   Share as Export,
   Medal,
   AlertCircle as WarningCircle,
   Sparkles as Sparkle,
   ThumbsUp,
   Target,
   ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
   fetchCourseById,
   createCourseDraft,
   publishCourse,
   updateCourseDraft,
   archiveCourse,
   fetchCourseMentorStudents,
   fetchCourseMentorQA,
   answerCourseMentorQA,
   fetchCourseMentorReviews,
   fetchCourseMentorAnalytics,
} from "../../utils/courseApi";
import { ArchiveCourseDialog } from "../../components/courses/ArchiveCourseDialog";
import { fetchMyMentorProfile } from "../../utils/mentorApi";
import { uploadFile } from "../../utils/uploadApi";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { toast } from "sonner";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";
import { mediaSrc, DEFAULT_COURSE_THUMB, avatarSrc } from "../../utils/mediaUrl";

const COURSE_STATUS_META = {
   published: { label: "Đã đăng", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
   pending_review: { label: "Chờ duyệt mới", className: "bg-amber-50 text-amber-800 border-amber-200" },
   pending_update: { label: "Chờ duyệt cập nhật", className: "bg-sky-50 text-sky-800 border-sky-200" },
   draft: { label: "Bản nháp", className: "bg-slate-100 text-slate-600 border-slate-200" },
   archived: { label: "Đã lưu trữ", className: "bg-red-50 text-red-700 border-red-200" },
};

const MENTOR_COURSE_EDIT_EXTRA_CSS = "";

/* ── Helpers ─────────────────────────────────────────────────── */
const formatDuration = (minutes) => {
   const h = Math.floor(minutes / 60);
   const m = minutes % 60;
   return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
};
const formatPrice = (price) =>
   new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

function TabPanelState({ loading, error, empty, emptyMessage, children }) {
   if (loading) {
      return (
         <div className="glass-card flex min-h-[200px] items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
         </div>
      );
   }
   if (error) {
      return <div className="glass-card p-8 text-center text-sm text-red-600">{error}</div>;
   }
   if (empty) {
      return (
         <div className="glass-card p-12 text-center text-sm text-slate-500">
            {emptyMessage || "Chưa có dữ liệu."}
         </div>
      );
   }
   return children;
}

/* ── UI Components ─────────────────────────────────────────── */

function MiniBar({ value, max = 100, color }) {
   return (
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden flex-1">
         <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(value / max) * 100}%` }}
            className="h-full rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${color}40` }}
         />
      </div>
   );
}

/* ── Tabs Content ──────────────────────────────────────────── */

function ReviewsTab({ reviews, summary }) {
   const stats = [
      { label: "Rating TB", value: summary?.avgRating ?? "0.0" },
      { label: "Tổng đánh giá", value: summary?.total ?? reviews.length },
      { label: "Chờ phản hồi", value: summary?.pendingReply ?? 0 },
      { label: "Đã xác minh", value: reviews.filter((r) => r.verified).length },
   ];
   return (
      <motion.div className="space-y-8">
         <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
               <motion.div key={i} className="glass-card p-6">
                  <h3 className="text-xl font-black sm:text-2xl text-slate-900 tracking-tighter mb-1">{s.value}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
               </motion.div>
            ))}
         </motion.div>
         <motion.div className="space-y-4">
            {reviews.map((review) => (
               <motion.div key={review.id} className="glass-card p-8">
                  <motion.div className="mb-4 flex items-start gap-4">
                     <img src={avatarSrc(review.avatar)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                     <motion.div>
                        <h5 className="text-base font-bold text-slate-900">{review.name}</h5>
                        <p className="text-xs text-slate-500">
                           {review.role ? `${review.role} · ` : ""}
                           {review.date}
                           {" · "}
                           {"★".repeat(review.rating)}
                           {"☆".repeat(Math.max(0, 5 - review.rating))}
                        </p>
                     </motion.div>
                  </motion.div>
                  <p className="text-sm leading-relaxed text-slate-700 italic">"{review.comment}"</p>
                  {review.response ? (
                     <motion.div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm text-slate-700">
                        <span className="font-bold text-violet-700">Phản hồi của bạn: </span>
                        {review.response}
                     </motion.div>
                  ) : null}
               </motion.div>
            ))}
         </motion.div>
      </motion.div>
   );
}

function LessonsTab({ lessons, onLessonsChange }) {
   const [editList, setEditList] = useState([]);
   const [editingId, setEditingId] = useState(null);
   const [draftTitle, setDraftTitle] = useState("");

   useEffect(() => {
      setEditList(
         (lessons || []).map((lesson) => ({
            ...lesson,
            duration: Number(lesson.duration || 10),
            isPreview: Boolean(lesson.isPreview),
            videoFileName: lesson.videoFileName || "",
         })),
      );
   }, [lessons]);

   const commit = (updater) => {
      const next = typeof updater === "function" ? updater(editList) : updater;
      setEditList(next);
      onLessonsChange?.(next);
   };


   const handleAddLesson = () => {
      const nextIndex = editList.length + 1;
      const newLesson = {
         id: `new-${Date.now()}-${nextIndex}`,
         title: `Bài ${nextIndex}: Nội dung mới`,
         duration: 10,
         isPreview: false,
         videoFileName: "",
      };
      // Thêm lên đầu danh sách để người dùng thấy ngay lập tức.
      commit((prev) => [newLesson, ...prev]);
      setEditingId(newLesson.id);
      setDraftTitle(newLesson.title);
   };

   const startEdit = (lesson) => {
      setEditingId(lesson.id);
      setDraftTitle(lesson.title || "");
   };

   const saveEdit = (lessonId) => {
      const t = draftTitle.trim();
      if (!t) return;
      commit((prev) => prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, title: t } : lesson)));
      setEditingId(null);
      setDraftTitle("");
   };

   const removeLessonItem = (lessonId) => {
      commit((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      if (editingId === lessonId) {
         setEditingId(null);
         setDraftTitle("");
      }
   };

   const updateLessonDuration = (lessonId, value) => {
      commit((prev) =>
         prev.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, duration: Math.max(1, Number(value || 1)) } : lesson,
         ),
      );
   };

   const toggleLessonPreview = (lessonId) => {
      commit((prev) =>
         prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, isPreview: !lesson.isPreview } : lesson)),
      );
   };

   const setLessonVideo = async (lessonId, file) => {
      if (!file) return;
      const loadingToast = toast.loading(`Đang upload video: ${file.name}...`);
      try {
         const res = await uploadFile(file, "course-video");
         if (res.success) {
            toastApiSuccess("Upload video thành công!");
            commit((prev) =>
               prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, videoFileName: file.name, videoUrl: res.url } : lesson)),
            );
         } else {
            toastApiError(res.error, "Upload video thất bại.");
         }
      } catch {
         toastApiError("Lỗi kết nối khi upload video.");
      } finally {
         toast.dismiss(loadingToast);
      }
   };

   return (
      <div className="glass-card overflow-hidden">
         <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-slate-50/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h3 className="app-page-title">Nội dung bài giảng</h3>
               <p className="app-page-subtitle mt-1">{editList.length} bài học</p>
            </div>
            <button
               type="button"
               onClick={handleAddLesson}
               className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-violet-600/20 hover:bg-violet-700"
            >
               <Plus size={16} /> Thêm bài học
            </button>
         </div>
         <ul className="divide-y divide-slate-100">
            {editList.map((lesson, idx) => (
               <li key={lesson.id} className="px-4 py-5 transition-colors hover:bg-violet-50/30 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-6 flex-1">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-black text-violet-700">
                        {idx + 1}
                        </span>
                        <div className="flex-1">
                           {editingId === lesson.id ? (
                              <input
                                 value={draftTitle}
                                 onChange={(e) => setDraftTitle(e.target.value)}
                                 className="w-[380px] max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                              />
                           ) : (
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-violet-700 transition-colors">{lesson.title}</h4>
                           )}
                           <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                 type="number"
                                 min={1}
                                 value={lesson.duration}
                                 onChange={(e) => updateLessonDuration(lesson.id, e.target.value)}
                                 className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-primary-fixed"
                              />
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">phút</span>
                              <button
                                 type="button"
                                 onClick={() => toggleLessonPreview(lesson.id)}
                                 className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                    lesson.isPreview
                                       ? "bg-primary-fixed/20 text-violet-700 border border-primary-fixed/30"
                                       : "bg-slate-50 border border-slate-200 text-zinc-400"
                                 }`}
                              >
                                 {lesson.isPreview ? "Preview" : "Ẩn"}
                              </button>
                              <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:border-violet-300 hover:text-violet-700">
                                 Tải video
                                 <input
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                                    className="hidden"
                                    onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) setLessonVideo(lesson.id, file);

                                    }}
                                 />
                              </label>
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[280px]">
                                 {lesson.videoFileName || "Chưa chọn video"}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                        {editingId === lesson.id ? (
                           <>
                              <button
                                 type="button"
                                 onClick={() => saveEdit(lesson.id)}
                                 className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-500 hover:text-emerald-300 transition-all"
                              >
                                 <Check size={16} />
                              </button>
                              <button
                                 type="button"
                                 onClick={() => {
                                    setEditingId(null);
                                    setDraftTitle("");
                                 }}
                                 className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-500 hover:text-orange-300 transition-all"
                              >
                                 <X size={16} />
                              </button>
                           </>
                        ) : (
                        <button
                           type="button"
                           onClick={() => startEdit(lesson)}
                           className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-500 hover:text-slate-900 transition-all"
                        >
                           <PencilSimple size={16} />
                        </button>
                        )}
                        <button
                           type="button"
                           onClick={() => removeLessonItem(lesson.id)}
                           className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-500 hover:text-red-500 transition-all"
                        >
                           <Trash size={16} />
                        </button>
                     </div>
                  </div>
               </li>
            ))}
         </ul>
      </div>
   );
}

function StudentsTab({ students, summary }) {
   const statCards = [
      { label: "Đang hoạt động", value: summary?.active ?? students.filter((s) => s.status === "active").length },
      { label: "Hoàn thành", value: summary?.completed ?? students.filter((s) => s.status === "completed").length },
      { label: "Tiến độ TB", value: summary?.avgProgress ?? "0%" },
      { label: "Drop-off", value: summary?.dropoffRate ?? "0%" },
   ];
   return (
      <div className="space-y-8">
         <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {statCards.map((s, i) => (
               <div key={i} className="glass-card p-6">
                  <h3 className="text-xl font-black sm:text-2xl text-slate-900 tracking-tighter mb-1">{s.value}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
               </div>
            ))}
         </div>
         <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                     <th className="px-6 py-4">Học viên</th>
                     <th className="px-6 py-4">Tiến độ</th>
                     <th className="px-6 py-4 text-right">Lần cuối</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                     <tr key={s.id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <img src={avatarSrc(s.avatar)} alt="" className="h-10 w-10 rounded-xl object-cover" />
                              <div>
                                 <span className="text-sm font-bold text-slate-900">{s.name}</span>
                                 {!s.hasAccess ? (
                                    <p className="text-[10px] text-amber-600">Chờ thanh toán</p>
                                 ) : null}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex w-40 items-center gap-3">
                              <MiniBar value={s.progress} color={s.progress === 100 ? "#10b981" : "#6E35E8"} />
                              <span className="text-xs font-bold text-slate-900">{s.progress}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">{s.lastActive}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}

function QATab({ courseId, items, onAnswered }) {
   const [drafts, setDrafts] = useState({});
   const [sending, setSending] = useState(null);

   const handleSend = async (qaId) => {
      const content = String(drafts[qaId] || "").trim();
      if (!content) return;
      setSending(qaId);
      try {
         const res = await answerCourseMentorQA(courseId, qaId, content);
         if (!res.success) {
            toastApiError(res.error, "Không gửi được câu trả lời.");
            return;
         }
         toastApiSuccess(res.message || "Đã gửi câu trả lời.");
         setDrafts((prev) => ({ ...prev, [qaId]: "" }));
         onAnswered?.();
      } catch {
         toastApiError("Lỗi kết nối khi gửi câu trả lời.");
      } finally {
         setSending(null);
      }
   };

   return (
      <div className="space-y-4">
         {items.map((item) => (
            <motion.div key={item.id} className="glass-card p-6 sm:p-8">
               <motion.div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <motion.div className="flex min-w-0 items-center gap-3">
                     <img src={avatarSrc(item.avatar)} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                     <motion.div>
                        <p className="text-sm font-bold text-slate-900">{item.student}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                           {item.lessonTitle || `Bài ${(item.lessonIdx ?? 0) + 1}`} · {item.time}
                        </p>
                     </motion.div>
                  </motion.div>
                  {item.isAnswered ? (
                     <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
                        Đã trả lời
                     </span>
                  ) : (
                     <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700">
                        Chờ trả lời
                     </span>
                  )}
               </motion.div>
               <p className="text-sm leading-relaxed text-slate-800">{item.question}</p>
               {item.answer ? (
                  <motion.div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4 text-sm text-slate-700">
                     <span className="font-bold text-violet-700">Câu trả lời của bạn: </span>
                     {item.answer}
                  </motion.div>
               ) : (
                  <motion.div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                     <textarea
                        value={drafts[item.id] || ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Nhập câu trả lời cho học viên..."
                        rows={3}
                        className="min-h-[80px] flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                     />
                     <button
                        type="button"
                        onClick={() => handleSend(item.id)}
                        disabled={sending === item.id || !String(drafts[item.id] || "").trim()}
                        className="shrink-0 rounded-xl bg-violet-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
                     >
                        {sending === item.id ? "Đang gửi..." : "Gửi trả lời"}
                     </button>
                  </motion.div>
               )}
            </motion.div>
         ))}
      </div>
   );
}

function AnalyticsTab({ lessonStats }) {
   return (
      <div className="space-y-8">
         <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
               <thead className="border-b border-slate-200 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <tr>
                     <th className="px-6 py-4">Bài học</th>
                     <th className="px-6 py-4">Đã hoàn thành</th>
                     <th className="px-6 py-4">Tỷ lệ hoàn thành</th>
                     <th className="px-6 py-4 text-right">Câu hỏi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {lessonStats.map((s) => (
                     <tr key={s.lessonIndex} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                           {s.title || `Bài ${s.lessonIndex}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{s.views}</td>
                        <td className="px-6 py-4">
                           <span className="text-sm font-bold text-violet-700">{s.completionRate}%</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-500">{s.questions}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <p className="text-xs text-slate-500">
            Phân tích dựa trên tiến độ ghi danh đã thanh toán và câu hỏi Q&amp;A thực tế trên hệ thống.
         </p>
      </div>
   );
}

function buildCoursePayloadFromForm(form, chapters, thumbnailUrl) {
   return {
      title: form.title,
      description: form.description,
      category: form.category,
      level: form.level,
      price: Number(form.price || 0),
      outcomes: form.outcomes,
      tags: form.tags,
      thumbnail: thumbnailUrl || "",
      chapters: chapters.map((chapter) => ({
         title: chapter.title,
         lessons: (chapter.lessons || []).map((lesson) => ({
            title: lesson.title,
            duration: Number(lesson.duration || 0),
            isPreview: Boolean(lesson.isPreview),
            videoFileName: lesson.videoFileName || "",
            videoUrl: lesson.videoUrl || "",
         })),
      })),
   };
}


function mapTopicToCategory(topics = []) {
   const first = String(Array.isArray(topics) ? topics[0] || "" : "").toLowerCase();
   if (first === "behavioral") return "behavioral-interview";
   if (first === "technical") return "technical-interview";
   return "career-development";
}

function CreateCourseForm({ navigate, mentorRejectReason = "" }) {
   const [step, setStep] = useState(1);
   const [form, setForm] = useState({
      title: "",
      description: "",
      category: "",
      level: "basic",
      price: 0,
      outcomes: ["", "", ""],
      tags: "",
   });
   const [chapters, setChapters] = useState([]);
   const [thumbnailUrl, setThumbnailUrl] = useState("");
   const [thumbnailFileName, setThumbnailFileName] = useState("");
   const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);


   const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
   const updateOutcome = (index, value) =>
      setForm(prev => {
         const next = [...prev.outcomes];
         next[index] = value;
         return { ...prev, outcomes: next };
      });
   const addOutcome = () => setForm(prev => ({ ...prev, outcomes: [...prev.outcomes, ""] }));
   const addChapter = () =>
      setChapters(prev => [
         ...prev,
         {
            id: `ch-${Date.now()}-${prev.length + 1}`,
            title: `Chương ${prev.length + 1}`,
            lessons: [{ id: `l-${Date.now()}-1`, title: "Bài 1: Giới thiệu", duration: 15, isPreview: true, videoFileName: "" }],
         },
      ]);
   const updateChapterTitle = (id, value) =>
      setChapters(prev => prev.map(ch => (ch.id === id ? { ...ch, title: value } : ch)));
   const addLessonToChapter = (chapterId) =>
      setChapters(prev =>
         prev.map(ch => {
            if (ch.id !== chapterId) return ch;
            const nextLessonIndex = ch.lessons.length + 1;
            return {
               ...ch,
               lessons: [
                  ...ch.lessons,
                  {
                     id: `l-${Date.now()}-${nextLessonIndex}`,
                     title: `Bài ${nextLessonIndex}: Nội dung mới`,
                     duration: 15,
                     isPreview: false,
                     videoFileName: "",
                  },
               ],
            };
         }),
      );
   const updateLessonTitle = (chapterId, lessonId, value) =>
      setChapters(prev =>
         prev.map(ch =>
            ch.id !== chapterId
               ? ch
               : {
                    ...ch,
                    lessons: ch.lessons.map(lesson => (lesson.id === lessonId ? { ...lesson, title: value } : lesson)),
                 },
         ),
      );
   const updateLessonDuration = (chapterId, lessonId, value) =>
      setChapters(prev =>
         prev.map(ch =>
            ch.id !== chapterId
               ? ch
               : {
                    ...ch,
                    lessons: ch.lessons.map(lesson =>
                       lesson.id === lessonId ? { ...lesson, duration: Math.max(1, Number(value || 1)) } : lesson,
                    ),
                 },
         ),
      );
   const toggleLessonPreview = (chapterId, lessonId) =>
      setChapters(prev =>
         prev.map(ch =>
            ch.id !== chapterId
               ? ch
               : {
                    ...ch,
                    lessons: ch.lessons.map(lesson =>
                       lesson.id === lessonId ? { ...lesson, isPreview: !lesson.isPreview } : lesson,
                    ),
                 },
         ),
      );
   const updateLessonVideo = async (chapterId, lessonId, file) => {
      if (!file) return;
      const loadingToast = toast.loading(`Đang upload video: ${file.name}...`);
      try {
         const res = await uploadFile(file, "course-video");
         if (res.success) {
            toastApiSuccess("Upload video thành công!");
            setChapters((prev) =>
               prev.map((ch) =>
                  ch.id !== chapterId
                     ? ch
                     : {
                          ...ch,
                          lessons: ch.lessons.map((lesson) =>
                             lesson.id === lessonId ? { ...lesson, videoFileName: file.name, videoUrl: res.url } : lesson,
                          ),
                       },
               ),
            );
         } else {
            toastApiError(res.error, "Upload video thất bại.");
         }
      } catch {
         toastApiError("Lỗi kết nối khi upload video.");
      } finally {
         toast.dismiss(loadingToast);
      }
   };
   const removeLesson = (chapterId, lessonId) =>
      setChapters(prev =>
         prev.map(ch =>
            ch.id !== chapterId
               ? ch
               : {
                    ...ch,
                    lessons: ch.lessons.filter(lesson => lesson.id !== lessonId),
                 },
         ),
      );
   const removeChapter = (id) => setChapters(prev => prev.filter(ch => ch.id !== id));


   const filledOutcomes = form.outcomes.filter(o => o.trim().length > 0).length;
   const validationMessages = [];
   if (form.title.trim().length <= 2) validationMessages.push("Nhập tiêu đề khóa học (ít nhất 3 ký tự).");
   if (form.description.trim().length <= 20) validationMessages.push("Nhập mô tả khóa học (ít nhất 21 ký tự).");
   if (!form.category.trim()) validationMessages.push("Chọn danh mục khóa học.");
   if (filledOutcomes < 3) validationMessages.push("Điền ít nhất 3 mục 'Học viên sẽ học được gì'.");
   const canContinueStep1 = validationMessages.length === 0;
   const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
   const lessonsWithVideo = chapters.reduce(
      (acc, ch) => acc + ch.lessons.filter((lesson) => lesson.videoFileName && lesson.videoFileName.trim()).length,
      0,
   );
   const canContinueStep2 = totalLessons > 0 && lessonsWithVideo > 0;

   return (
      <MentorPageShell bottomPad="pb-24" extraStyles={MENTOR_COURSE_EDIT_EXTRA_CSS}>
         <div className="relative z-10 mx-auto max-w-6xl px-10 pb-10">
            {mentorRejectReason ? (
               <div className="mb-8 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-5">
                  <div className="flex items-start gap-3">
                     <WarningCircle size={18} className="mt-0.5 shrink-0 text-orange-300" />
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">
                           Góp ý từ lần duyệt trước
                        </p>
                        <p className="mt-2 text-sm text-slate-800">{mentorRejectReason}</p>
                     </div>
                  </div>
               </div>
            ) : null}
            <div className="flex items-center justify-between mb-8">
               <button
                  onClick={() => navigate("/mentor/courses")}
                  className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
               >
                  <ArrowLeft size={14} /> Quay lại quản lý khóa học
               </button>
            </div>

            <div className="glass-card p-10">
               <h1 className="mb-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Tạo khóa học mới</h1>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                     { i: 1, label: "Thông tin cơ bản" },
                     { i: 2, label: "Nội dung khóa học" },
                     { i: 3, label: "Xem trước & Đăng" },
                  ].map((s) => (
                     <div key={s.i} className="flex items-center gap-3">
                        <div
                           className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                              step >= s.i ? "bg-[#6E35E8] text-white" : "bg-slate-100 text-zinc-500"
                           }`}
                        >
                           {s.i}
                        </div>
                        <p className={`text-sm font-bold ${step >= s.i ? "text-slate-900" : "text-zinc-500"}`}>{s.label}</p>
                     </div>
                  ))}
               </div>

               {step === 1 && (
                  <div className="space-y-7">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề khóa học *</label>
                        <input
                           value={form.title}
                           onChange={(e) => updateField("title", e.target.value)}
                           placeholder="VD: Làm chủ STAR Method trong phỏng vấn hành vi"
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả khóa học *</label>
                        <textarea
                           rows={4}
                           value={form.description}
                           onChange={(e) => updateField("description", e.target.value)}
                           placeholder="Mô tả chi tiết nội dung, giá trị và những gì học viên sẽ đạt được..."
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed resize-none"
                        />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Danh mục *</label>
                           <select
                              value={form.category}
                              onChange={(e) => updateField("category", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed"
                           >
                              <option value="">Chọn danh mục</option>
                              <option value="behavioral-interview">Behavioral Interview</option>
                              <option value="technical-interview">Technical Interview</option>
                              <option value="career-development">Career Development</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Cấp độ</label>
                           <select
                              value={form.level}
                              onChange={(e) => updateField("level", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed"
                           >
                              <option value="basic">Cơ bản</option>
                              <option value="intermediate">Trung cấp</option>
                              <option value="advanced">Nâng cao</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Giá khóa học (VND)</label>
                        <div className="flex items-center gap-3">
                           <input
                              type="number"
                              min={0}
                              value={form.price}
                              onChange={(e) => updateField("price", Number(e.target.value || 0))}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed"
                           />
                           <span className="px-4 py-2 rounded-xl bg-primary-fixed/20 text-violet-700 text-xs font-black uppercase tracking-widest">
                              {Number(form.price) > 0 ? "Trả phí" : "Miễn phí"}
                           </span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                           Học viên sẽ học được gì? (tối thiểu 3 mục)
                        </label>
                        <div className="space-y-3">
                           {form.outcomes.map((outcome, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-full bg-white/10 text-zinc-400 flex items-center justify-center text-xs font-black">
                                    {idx + 1}
                                 </div>
                                 <input
                                    value={outcome}
                                    onChange={(e) => updateOutcome(idx, e.target.value)}
                                    placeholder={`Kết quả học tập ${idx + 1}...`}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 outline-none focus:border-primary-fixed"
                                 />
                                 {idx === form.outcomes.length - 1 && (
                                    <button
                                       type="button"
                                       onClick={addOutcome}
                                       className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-zinc-300 hover:text-slate-900"
                                    >
                                       +
                                    </button>
                                 )}
                              </div>
                           ))}
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tags (phân cách bởi dấu phẩy)</label>
                        <input
                           value={form.tags}
                           onChange={(e) => updateField("tags", e.target.value)}
                           placeholder="star-method, behavioral-interview, interview-skills"
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:border-primary-fixed"
                        />
                     </div>
                     <div className="flex justify-between items-start pt-2 gap-6">
                        <button
                           onClick={() => navigate("/mentor/courses")}
                           className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-zinc-300 hover:text-slate-900 transition-all"
                        >
                           Hủy
                        </button>
                        <div className="text-right">
                           {!canContinueStep1 && (
                              <p className="text-xs text-orange-300 mb-2 max-w-[420px]">
                                 {validationMessages[0]}
                              </p>
                           )}
                           <button
                              disabled={!canContinueStep1}
                              onClick={() => setStep(2)}
                              className="px-8 py-3 rounded-2xl bg-[#6E35E8] text-white text-sm font-bold disabled:opacity-40"
                           >
                              Tiếp theo
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               {step === 2 && (
                  <div className="space-y-6">
                     <div className="glass-card p-8 border border-dashed border-slate-200">
                        <h3 className="text-lg font-black text-slate-900 mb-3">Nội dung khóa học</h3>
                        <p className="text-sm text-zinc-400 mb-5">
                           Thêm bài học, đánh dấu Preview và upload video cho từng bài.
                        </p>
                        <button
                           type="button"
                           onClick={addChapter}
                           className="px-6 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-900"
                        >
                           + Thêm chương đầu tiên
                        </button>
                     </div>
                     {chapters.length > 0 && (
                        <div className="space-y-4">
                           {chapters.map((chapter, chapterIdx) => (
                              <div key={chapter.id} className="glass-card p-6">
                                 <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Chương {chapterIdx + 1}</span>
                                    <input
                                       value={chapter.title}
                                       onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                                       className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                                    />
                                    <button
                                       type="button"
                                       onClick={() => removeChapter(chapter.id)}
                                       className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-zinc-300 hover:text-red-300"
                                    >
                                       Xóa
                                    </button>
                                 </div>
                                 <div className="space-y-3">
                                    {chapter.lessons.map((lesson, lessonIdx) => (
                                       <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                                          <div className="flex items-center gap-3">
                                          <span className="w-6 h-6 rounded-full bg-white/10 text-[10px] font-black text-zinc-400 flex items-center justify-center">
                                             {lessonIdx + 1}
                                          </span>
                                          <input
                                             value={lesson.title}
                                             onChange={(e) => updateLessonTitle(chapter.id, lesson.id, e.target.value)}
                                             className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                                          />
                                             <input
                                                type="number"
                                                min={1}
                                                value={lesson.duration}
                                                onChange={(e) => updateLessonDuration(chapter.id, lesson.id, e.target.value)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                                             />
                                             <span className="text-xs text-zinc-400">phút</span>
                                             <button
                                                type="button"
                                                onClick={() => toggleLessonPreview(chapter.id, lesson.id)}
                                                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                                                   lesson.isPreview
                                                      ? "bg-primary-fixed/20 text-violet-700"
                                                      : "bg-slate-50 border border-slate-200 text-zinc-300"
                                                }`}
                                             >
                                                {lesson.isPreview ? "Preview" : "Ẩn"}
                                             </button>
                                             <button
                                                type="button"
                                                onClick={() => removeLesson(chapter.id, lesson.id)}
                                                className="px-2 py-2 rounded-lg border border-slate-200 text-zinc-300 hover:text-red-300"
                                             >
                                                <X size={14} />
                                             </button>
                                          </div>
                                          <div className="flex items-center gap-3">
                                             <label className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-zinc-200 cursor-pointer hover:text-slate-900">
                                                Upload video
                                                <input
                                                   type="file"
                                                   accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                                                   className="hidden"
                                                   onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) updateLessonVideo(chapter.id, lesson.id, file);
                                                   }}
                                                />
                                             </label>
                                             <p className="text-xs text-zinc-400 truncate">
                                                {lesson.videoFileName || "Chưa chọn file video"}
                                             </p>
                                          </div>
                                       </div>
                                    ))}
                                    <button
                                       type="button"
                                       onClick={() => addLessonToChapter(chapter.id)}
                                       className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-zinc-200"
                                    >
                                       + Thêm bài học
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                     <div className="glass-card p-6">
                        <h4 className="text-sm font-black text-slate-900 mb-3">Ảnh đại diện khóa học</h4>
                        <div className="border border-dashed border-slate-200 rounded-2xl p-6">
                           <label className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-zinc-200 cursor-pointer hover:text-slate-900">
                              Chọn file ảnh
                              <input
                                 type="file"
                                 accept="image/png,image/jpeg,image/webp"
                                 className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setIsUploadingThumbnail(true);
                                    try {
                                       const res = await uploadFile(file, "course-thumbnail");
                                       if (res.success) {
                                          setThumbnailUrl(res.url);
                                          setThumbnailFileName(file.name);
                                          toastApiSuccess("Đã upload ảnh bìa!");
                                       } else {
                                          toastApiError(res.error, "Upload ảnh thất bại.");
                                       }
                                    } catch {
                                       toastApiError("Lỗi kết nối khi upload ảnh bìa.");
                                    } finally {
                                       setIsUploadingThumbnail(false);
                                    }
                                 }}
                              />
                           </label>
                           <p className="text-xs text-zinc-400 mt-3">
                              {thumbnailFileName || "Chưa chọn ảnh đại diện (PNG, JPG, WEBP — tối đa 5MB)."}
                           </p>
                        </div>
                        <div className="mt-4 rounded-xl bg-primary-fixed/10 border border-primary-fixed/25 p-3 text-xs text-zinc-300">
                           Upload video bài học: hỗ trợ MP4, MOV, AVI, WEBM. Tối đa 2GB mỗi video.
                        </div>
                     </div>
                     <div className="flex justify-between">
                        <button onClick={() => setStep(1)} className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-zinc-300">
                           Quay lại
                        </button>
                        <div className="text-right">
                           {!canContinueStep2 && (
                              <p className="text-xs text-orange-300 mb-2">
                                 Cần ít nhất 1 bài học và 1 video đã chọn để tiếp tục.
                              </p>
                           )}
                           <button
                              disabled={!canContinueStep2}
                              onClick={() => setStep(3)}
                              className="px-8 py-3 rounded-2xl bg-[#6E35E8] text-white text-sm font-bold disabled:opacity-40"
                           >
                           Tiếp theo
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               {step === 3 && (
                  <div className="space-y-6">
                     <div className="glass-card p-8">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Xem trước thông tin khóa học</h3>
                        <p className="text-sm text-zinc-400 mb-2">Tiêu đề: <span className="text-slate-900">{form.title || "(chưa nhập)"}</span></p>
                        <p className="text-sm text-zinc-400 mb-2">Danh mục: <span className="text-slate-900">{form.category || "(chưa chọn)"}</span></p>
                        <p className="text-sm text-zinc-400 mb-2">Cấp độ: <span className="text-slate-900">{form.level}</span></p>
                        <p className="text-sm text-zinc-400 mb-2">Giá: <span className="text-slate-900">{formatPrice(Number(form.price || 0))}</span></p>
                        <p className="text-sm text-zinc-400 mb-2">Số chương: <span className="text-slate-900">{chapters.length}</span></p>
                        <p className="text-sm text-zinc-400 mb-2">Số bài học: <span className="text-slate-900">{totalLessons}</span></p>
                        <p className="text-sm text-zinc-400">Video đã upload: <span className="text-slate-900">{lessonsWithVideo}</span></p>
                     </div>
                     <div className="flex justify-between">
                        <button onClick={() => setStep(2)} className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-zinc-300">
                           Quay lại
                        </button>
                        <div className="flex gap-3">
                           <button
                              onClick={async () => {
                                 try {
                                    const payload = buildCoursePayloadFromForm(form, chapters, thumbnailUrl);
                                    const r = await createCourseDraft(payload);
                                    if (!r.success) {
                                       toastApiError(r.error, "Không thể lưu nháp.");
                                       return;
                                    }
                                    toastApiSuccess("Đã lưu nháp khóa học.");
                                    navigate(`/mentor/courses/${r.course?._id}/edit`);
                                 } catch {
                                    toastApiError("Lỗi kết nối khi lưu nháp khóa học.");
                                 }
                              }}
                              className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm font-black"
                           >
                              Lưu nháp
                           </button>
                           <button
                              onClick={async () => {
                                 try {
                                    const payload = buildCoursePayloadFromForm(form, chapters, thumbnailUrl);
                                    const r = await createCourseDraft(payload);
                                    if (!r.success) {
                                       toastApiError(r.error, "Không thể tạo khóa học.");
                                       return;
                                    }
                                    const pub = await publishCourse(r.course?._id);
                                    if (!pub.success) {
                                       toastApiError(pub.error, "Tạo nháp thành công nhưng chưa đăng được.");
                                       navigate(`/mentor/courses/${r.course?._id}/edit`);
                                       return;
                                    }
                                    toastApiSuccess("Đã gửi khóa học chờ admin duyệt.");
                                    navigate("/mentor/courses");
                                 } catch {
                                    toastApiError("Lỗi kết nối khi gửi khóa học duyệt.");
                                 }
                              }}
                              className="px-8 py-3 rounded-2xl bg-primary-fixed text-black text-sm font-black"
                           >
                              Gửi admin duyệt
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </MentorPageShell>
   );
}

/* ── Main MentorCourseEdit Component ────────────────────────── */
export function MentorCourseEdit() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState("lessons");
   const isCreateMode = id === "new";
   const [course, setCourse] = useState(null);
   const [loading, setLoading] = useState(!isCreateMode);
   const [editableLessons, setEditableLessons] = useState([]);
   const [thumbnailUrl, setThumbnailUrl] = useState("");
   const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
   const [mentorRejectReason, setMentorRejectReason] = useState("");
   const [showArchiveDialog, setShowArchiveDialog] = useState(false);
   const [archiving, setArchiving] = useState(false);
   const [tabLoading, setTabLoading] = useState(false);
   const [tabError, setTabError] = useState("");
   const [students, setStudents] = useState([]);
   const [studentsSummary, setStudentsSummary] = useState(null);
   const [qaItems, setQaItems] = useState([]);
   const [reviews, setReviews] = useState([]);
   const [reviewsSummary, setReviewsSummary] = useState(null);
   const [analyticsStats, setAnalyticsStats] = useState([]);

   const loadTabData = async (tab) => {
      if (!id || isCreateMode || tab === "lessons") return;
      setTabLoading(true);
      setTabError("");
      try {
         if (tab === "students") {
            const res = await fetchCourseMentorStudents(id);
            if (!res.success) {
               setTabError(res.error || "Không tải được danh sách học viên.");
               setStudents([]);
               setStudentsSummary(null);
            } else {
               setStudents(res.students || []);
               setStudentsSummary(res.summary || null);
            }
         } else if (tab === "qa") {
            const res = await fetchCourseMentorQA(id);
            if (!res.success) {
               setTabError(res.error || "Không tải được Q&A.");
               setQaItems([]);
            } else {
               setQaItems(res.items || []);
            }
         } else if (tab === "reviews") {
            const res = await fetchCourseMentorReviews(id);
            if (!res.success) {
               setTabError(res.error || "Không tải được đánh giá.");
               setReviews([]);
               setReviewsSummary(null);
            } else {
               setReviews(res.reviews || []);
               setReviewsSummary(res.summary || null);
            }
         } else if (tab === "analytics") {
            const res = await fetchCourseMentorAnalytics(id);
            if (!res.success) {
               setTabError(res.error || "Không tải được phân tích.");
               setAnalyticsStats([]);
            } else {
               setAnalyticsStats(res.lessonStats || []);
            }
         }
      } catch {
         setTabError("Lỗi kết nối khi tải dữ liệu tab.");
      } finally {
         setTabLoading(false);
      }
   };

   useEffect(() => {
      loadTabData(activeTab);
   }, [activeTab, id, isCreateMode]);

   useEffect(() => {
      void (async () => {
         try {
            const res = await fetchMyMentorProfile();
            if (!res?.success || !res?.mentor) return;
            const review = res.mentor.adminReview || {};
            if (review.status === "rejected" && String(review.reason || "").trim()) {
               setMentorRejectReason(String(review.reason || "").trim());
            }
         } catch {
            /* im lặng — chỉ hiển thị banner từ chối khi có dữ liệu */
         }
      })();
   }, []);

   useEffect(() => {
      if (isCreateMode) return;
      let cancelled = false;
      void (async () => {
         setLoading(true);
         try {
         const res = await fetchCourseById(id || "");
         if (cancelled) return;
         if (!res.success || !res.course) {
            if (!res.success) toastApiError(res.error, "Không tải được khóa học.");
            setCourse(null);
            return;
         }
         const c = res.course;
         const mappedLessons =
            c.modules?.flatMap((m) =>
               (m.lessons || []).map((lesson, idx) => ({
                  id: lesson._id || `${m._id || m.title}-${idx}`,
                  title: lesson.title,
                  duration: lesson.durationMinutes || 10,
                  isPreview: Boolean(lesson.isFree),
                  videoFileName: lesson.videoUrl || "",
               })),
            ) || [];
         setCourse({
            id: c._id,
            title: c.title,
            status: c.status || "draft",
            thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
            studentsCount: c.stats?.enrollmentCount || 0,
            rating: c.stats?.rating || 0,
            mentorAvatar: c.mentorId?.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
            mentorName: c.mentorId?.userId?.name || "Mentor",
            lessons: mappedLessons,
            raw: c,
         });
         setEditableLessons(mappedLessons);
         } catch {
            if (!cancelled) {
               toastApiError("Lỗi kết nối khi tải khóa học.");
               setCourse(null);
            }
         } finally {
            if (!cancelled) setLoading(false);
         }
      })();
      return () => {
         cancelled = true;
      };
   }, [id, isCreateMode]);

   if (isCreateMode) {
      return <CreateCourseForm navigate={navigate} mentorRejectReason={mentorRejectReason} />;
   }
   const lessons = editableLessons.length ? editableLessons : course?.lessons || [];
   const isArchived = course?.status === "archived";
   const refreshQA = () => loadTabData("qa");

   const handleArchiveConfirm = async () => {
      if (!id) return;
      setArchiving(true);
      try {
         const res = await archiveCourse(id);
         if (!res.success) {
            toastApiError(res.error, "Không thể lưu trữ khóa học.");
            return;
         }
         toastApiSuccess(res.message || "Đã lưu trữ khóa học.");
         setShowArchiveDialog(false);
         navigate("/mentor/courses");
      } catch {
         toastApiError("Lỗi kết nối khi lưu trữ khóa học.");
      } finally {
         setArchiving(false);
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-[#f8f4ff] flex items-center justify-center text-slate-900">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-fixed border-t-transparent" />
         </div>
      );
   }

   if (!course) {
      return (
         <div className="min-h-screen bg-[#f8f4ff] flex items-center justify-center text-slate-900">
            <div className="text-center">
               <BookOpen size={64} className="mx-auto mb-6 text-violet-700 opacity-20" />
               <h2 className="mb-8 text-xl font-black tracking-tight sm:text-2xl">Không tìm thấy khóa học</h2>
               <button onClick={() => navigate("/mentor/courses")} className="px-10 py-4 rounded-3xl bg-primary-fixed text-black text-xs font-black uppercase tracking-widest shadow-xl">Quay lại quản lý</button>
            </div>
         </div>
      );
   }

   const statusMeta = COURSE_STATUS_META[course.status] || COURSE_STATUS_META.draft;
   const coverSrc = mediaSrc(thumbnailUrl || course.thumbnail, DEFAULT_COURSE_THUMB);

   const TABS = [
      { key: "lessons", label: "Bài học", icon: Layout },
      { key: "students", label: "Học viên", icon: Users },
      { key: "qa", label: "Hỏi & Đáp", icon: ChatCircle },
      { key: "reviews", label: "Đánh giá", icon: Star },
      { key: "analytics", label: "Phân tích", icon: ChartBar },
   ];

   return (
      <MentorPageShell bottomPad="pb-36">
         <div className="relative z-10 mx-auto max-w-6xl px-6 pb-8 sm:px-8">
            {mentorRejectReason ? (
               <div className="mb-8 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-5">
                  <div className="flex items-start gap-3">
                     <WarningCircle size={18} className="mt-0.5 shrink-0 text-orange-300" />
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">
                           Lý do từ chối gần nhất từ admin
                        </p>
                        <p className="mt-2 text-sm text-slate-800">{mentorRejectReason}</p>
                     </div>
                  </div>
               </div>
            ) : null}
            {isArchived ? (
               <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                  Khóa học này đã được lưu trữ và không còn hiển thị trên trang Khám phá.
               </div>
            ) : null}
            <button
               type="button"
               onClick={() => navigate("/mentor/courses")}
               className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700 transition hover:text-violet-900"
            >
               <ArrowLeft size={14} /> Quản lý khóa học
            </button>

            <div className="glass-card mb-8 overflow-hidden">
               <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start">
                  <div className="group/thumb relative mx-auto shrink-0 lg:mx-0">
                     <img
                        src={coverSrc}
                        alt=""
                        className="h-36 w-full max-w-[220px] rounded-2xl object-cover shadow-md ring-1 ring-slate-200/80 sm:h-40"
                     />
                     <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover/thumb:opacity-100">
                        <div className="text-center">
                           {isUploadingThumbnail ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
                           ) : (
                              <>
                                 <Upload size={20} className="text-white mx-auto mb-1" />
                                 <span className="text-[8px] font-black text-white uppercase tracking-widest">Đổi ảnh</span>
                              </>
                           )}
                        </div>
                        <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           disabled={isUploadingThumbnail}
                           onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingThumbnail(true);
                              try {
                                 const res = await uploadFile(file, "course-thumbnail");
                                 if (res.success) {
                                    setThumbnailUrl(res.url);
                                    toastApiSuccess("Đã upload ảnh mới!");
                                 } else {
                                    toastApiError(res.error, "Upload thất bại");
                                 }
                              } catch {
                                 toastApiError("Lỗi kết nối khi upload ảnh.");
                              } finally {
                                 setIsUploadingThumbnail(false);
                              }
                           }}
                        />
                     </label>
                  </div>

                  <div className="min-w-0 flex-1">
                     <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusMeta.className}`}>
                        {statusMeta.label}
                     </span>
                     <h1 className="app-page-title mt-3">{course.title}</h1>
                     <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                           <Users size={15} className="text-violet-600" />
                           <strong className="text-slate-900">{course.studentsCount}</strong> học viên
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                           <Star size={15} className="text-amber-500" />
                           <strong className="text-slate-900">{course.rating > 0 ? course.rating : "—"}</strong> đánh giá
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                           <Layout size={15} className="text-violet-600" />
                           <strong className="text-slate-900">{lessons.length}</strong> bài học
                        </span>
                     </div>
                     <div className="mt-6 flex flex-wrap gap-3">
                        {course.status === "published" ? (
                           <button
                              type="button"
                              onClick={() => navigate(`/courses/${id}`)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
                           >
                              <Eye size={15} /> Xem trang công khai
                           </button>
                        ) : null}
                        {!isArchived ? (
                           <button
                              type="button"
                              onClick={() => setShowArchiveDialog(true)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
                           >
                              <Trash size={15} /> Xóa khóa học
                           </button>
                        ) : null}
                     </div>
                  </div>
               </div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5">
               {TABS.map((tab) => (
                  <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                        activeTab === tab.key
                           ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                           : "text-slate-600 hover:bg-white hover:text-slate-900"
                     }`}
                  >
                     <tab.icon size={15} />
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* Dynamic Tab Body */}
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
               >
                  {activeTab === "lessons" && <LessonsTab lessons={lessons} onLessonsChange={setEditableLessons} />}
                  {activeTab === "students" && (
                     <TabPanelState
                        loading={tabLoading}
                        error={tabError}
                        empty={!students.length}
                        emptyMessage="Chưa có học viên ghi danh."
                     >
                        <StudentsTab students={students} summary={studentsSummary} />
                     </TabPanelState>
                  )}
                  {activeTab === "qa" && (
                     <TabPanelState
                        loading={tabLoading}
                        error={tabError}
                        empty={!qaItems.length}
                        emptyMessage="Chưa có câu hỏi từ học viên."
                     >
                        <QATab courseId={id} items={qaItems} onAnswered={refreshQA} />
                     </TabPanelState>
                  )}
                  {activeTab === "reviews" && (
                     <TabPanelState
                        loading={tabLoading}
                        error={tabError}
                        empty={!reviews.length}
                        emptyMessage="Chưa có đánh giá nào."
                     >
                        <ReviewsTab reviews={reviews} summary={reviewsSummary} />
                     </TabPanelState>
                  )}
                  {activeTab === "analytics" && (
                     <TabPanelState
                        loading={tabLoading}
                        error={tabError}
                        empty={!analyticsStats.length}
                        emptyMessage="Chưa có dữ liệu phân tích (cần ít nhất một bài học)."
                     >
                        <AnalyticsTab lessonStats={analyticsStats} />
                     </TabPanelState>
                  )}
               </motion.div>
            </AnimatePresence>
         </div>

         <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-4 shadow-xl shadow-violet-900/10 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
               <p className="text-center text-xs font-medium text-slate-500 sm:text-left">
                  Lưu thay đổi trước khi gửi admin duyệt
               </p>
               <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                     type="button"
                     onClick={() => window.location.reload()}
                     className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                  >
                     Hủy thay đổi
                  </button>
                  <button
                     type="button"
                     onClick={async () => {
                        try {
                           const chapters = [
                              {
                                 title: "Chương 1",
                                 lessons: lessons.map((l) => ({
                                    title: l.title,
                                    duration: Number(l.duration || 0),
                                    isPreview: Boolean(l.isPreview),
                                    videoUrl: l.videoUrl || l.videoFileName || "",
                                 })),
                              },
                           ];
                           const payload = {
                              title: course.raw?.title || course.title,
                              description: course.raw?.description || "",
                              category: mapTopicToCategory(course.raw?.topics),
                              level: course.raw?.level || "basic",
                              price: course.raw?.price || 0,
                              outcomes: course.raw?.whatYoullLearn || [],
                              tags: course.raw?.tags || [],
                              thumbnail: thumbnailUrl || course.raw?.thumbnail || "",
                              chapters,
                           };

                           const saved = await updateCourseDraft(course.id, payload);
                           if (!saved.success) {
                              toastApiError(saved.error, "Không thể lưu thay đổi trước khi gửi duyệt.");
                              return;
                           }
                           const pub = await publishCourse(course.id, payload);
                           if (!pub.success) {
                              toastApiError(pub.error, "Không thể gửi bản cập nhật.");
                              return;
                           }
                           toastApiSuccess("Đã gửi bản cập nhật để admin duyệt. Khóa hiện tại vẫn đang public.");
                           navigate("/mentor/courses");
                        } catch {
                           toastApiError("Lỗi kết nối khi gửi bản cập nhật.");
                        }
                     }}
                     className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-violet-600/25 hover:bg-violet-700"
                  >
                     Lưu & gửi duyệt
                  </button>
               </div>
            </div>
         </div>

         <ArchiveCourseDialog
            open={showArchiveDialog}
            courseTitle={course.title}
            archiving={archiving}
            onOpenChange={(open) => {
               if (!archiving) setShowArchiveDialog(open);
            }}
            onConfirm={handleArchiveConfirm}
         />
      </MentorPageShell>
   );
}
