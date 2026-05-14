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
} from "../../utils/courseApi";
import { fetchMyMentorProfile } from "../../utils/mentorApi";
import { uploadFile } from "../../utils/uploadApi";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { toast } from "sonner";

const MENTOR_COURSE_EDIT_EXTRA_CSS = `
        .tab-btn { position: relative; padding: 16px 24px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.4); transition: all 0.3s; }
        .tab-btn.active { color: #fff; }
        .tab-indicator { position: absolute; bottom: 0; left: 24px; right: 24px; height: 3px; background: #c4ff47; box-shadow: 0 0 15px #c4ff47; border-radius: 10px; }
`;

/* ── Helpers ─────────────────────────────────────────────────── */
const formatDuration = (minutes) => {
   const h = Math.floor(minutes / 60);
   const m = minutes % 60;
   return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
};
const formatPrice = (price) =>
   new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

/* ── Mock data persists from legacy implementation ─────────── */
const MOCK_STUDENTS = [
   { id: "s1", name: "Nguyễn Văn An", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80", progress: 92, completedLessons: 11, lastActive: "2 giờ trước", enrolled: "10/03/2024", status: "active" },
   { id: "s2", name: "Trần Thị Bích", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80", progress: 100, completedLessons: 12, lastActive: "1 ngày trước", enrolled: "05/03/2024", status: "completed" },
   { id: "s3", name: "Lê Minh Châu", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80", progress: 42, completedLessons: 5, lastActive: "3 ngày trước", enrolled: "12/03/2024", status: "active" },
   { id: "s4", name: "Phạm Thu Dung", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", progress: 67, completedLessons: 8, lastActive: "5 giờ trước", enrolled: "08/03/2024", status: "active" },
   { id: "s5", name: "Hoàng Văn Em", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80", progress: 8, completedLessons: 1, lastActive: "7 ngày trước", enrolled: "15/03/2024", status: "inactive" },
   { id: "s6", name: "Vũ Thị Phương", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=80", progress: 100, completedLessons: 12, lastActive: "2 ngày trước", enrolled: "01/03/2024", status: "completed" },
   { id: "s7", name: "Đỗ Quang Hùng", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80", progress: 58, completedLessons: 7, lastActive: "12 giờ trước", enrolled: "18/03/2024", status: "active" },
   { id: "s8", name: "Ngô Bảo Châu", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80", progress: 25, completedLessons: 3, lastActive: "4 ngày trước", enrolled: "20/03/2024", status: "inactive" },
];

const MOCK_QA = [
   { id: "q1", lessonIdx: 0, student: "Nguyễn Văn An", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80", question: "Trong phần Situation, nên mô tả bao nhiêu context là đủ?", answer: null, time: "2 giờ trước", likes: 5 },
   { id: "q2", lessonIdx: 2, student: "Lê Minh Châu", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80", question: "Khi kể về Task, tôi nên phân biệt rõ task của team và task của cá nhân không?", answer: "Nên focus vào task của CÁ NHÂN bạn...", time: "1 ngày trước", likes: 12 },
];

const MENTOR_STUDENT_REVIEWS = [
   { id: "msr1", name: "Nguyễn Minh Khoa", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80", role: "Backend Developer", rating: 5, comment: "Khóa học cực kỳ thực tế và chi tiết.", date: "2024-03-15", helpful: 24, lessonRef: "Bài 2: Cấu trúc STAR", verified: true, responded: true, response: "Cảm ơn Khoa rất nhiều!" },
];

const generateLessonStats = (count) =>
   Array.from({ length: count }, (_, i) => ({
      views: Math.floor(400 - i * 25 + Math.random() * 50),
      completionRate: Math.max(55, Math.floor(95 - i * 3.5 + Math.random() * 10)),
      avgWatchTime: Math.max(60, Math.floor(85 - i * 2 + Math.random() * 15)),
      dropoffRate: Math.min(45, Math.floor(5 + i * 2.5 + Math.random() * 8)),
      questions: Math.floor(Math.random() * 8),
   }));

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

function ReviewsTab({ mentorAvatar, mentorName }) {
   return (
      <div className="space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
               { label: "Rating TB", value: "4.9", color: "#c4ff47" },
               { label: "Tổng đánh giá", value: 124, color: "#6E35E8" },
               { label: "Chờ phản hồi", value: 3, color: "#FF8C42" },
               { label: "Tỷ lệ hữu ích", value: "98%", color: "#secondary" }
            ].map((s, i) => (
               <div key={i} className="glass-card p-8">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{s.value}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
               </div>
            ))}
         </div>
         <div className="space-y-6">
            {MENTOR_STUDENT_REVIEWS.map(review => (
               <div key={review.id} className="glass-card p-10">
                  <div className="flex items-start gap-6 mb-8">
                     <img src={review.avatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/5" />
                     <div>
                        <h5 className="text-lg font-black text-slate-900 tracking-tight">{review.name}</h5>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{review.role} · {review.date}</p>
                     </div>
                  </div>
                  <p className="text-base font-medium text-zinc-300 italic">"{review.comment}"</p>
               </div>
            ))}
         </div>
      </div>
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
      const res = await uploadFile(file, "course-video");
      toast.dismiss(loadingToast);

      if (res.success) {
         toast.success("Upload video thành công!");
         commit((prev) =>
            prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, videoFileName: file.name, videoUrl: res.url } : lesson)),
         );
      } else {
         toast.error(res.error || "Upload video thất bại.");
      }
   };

   return (
      <div className="space-y-8">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Cấu trúc bài giảng</h3>
            <button
               type="button"
               onClick={handleAddLesson}
               className="px-6 py-3 rounded-2xl bg-primary-fixed text-black text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
            >
               <Plus size={16} /> Thêm bài học mới
            </button>
         </div>
         <div className="space-y-4">
            {editList.map((lesson, idx) => (
               <div key={lesson.id} className={`glass-card p-6 group transition-all`}>
                  <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-6 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:text-primary-fixed">
                        {idx + 1}
                        </div>
                        <div className="flex-1">
                           {editingId === lesson.id ? (
                              <input
                                 value={draftTitle}
                                 onChange={(e) => setDraftTitle(e.target.value)}
                                 className="w-[380px] max-w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                              />
                           ) : (
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-primary-fixed transition-colors">{lesson.title}</h4>
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
                                       ? "bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30"
                                       : "bg-slate-50 border border-slate-200 text-zinc-400"
                                 }`}
                              >
                                 {lesson.isPreview ? "Preview" : "Ẩn"}
                              </button>
                              <label className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-zinc-300 cursor-pointer">
                                 Upload video
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
               </div>
            ))}
         </div>
      </div>
   );
}

function StudentsTab({ students }) {
   return (
      <div className="space-y-10">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
               { label: "Đang hoạt động", value: students.filter(s => s.status === 'active').length, color: "#c4ff47" },
               { label: "Hoàn thành", value: students.filter(s => s.status === 'completed').length, color: "#6E35E8" },
               { label: "Tiến độ trung bình", value: "68%", color: "#f59e0b" },
               { label: "Drop-off Rate", value: "4.2%", color: "#secondary" }
            ].map((s, i) => (
               <div key={i} className="glass-card p-8">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{s.value}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
               </div>
            ))}
         </div>
         <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                     <th className="px-8 py-6">Học viên</th>
                     <th className="px-8 py-6">Tiến độ</th>
                     <th className="px-8 py-6 text-right">Lần cuối</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {students.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" />
                              <span className="text-sm font-black text-slate-900">{s.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4 w-40">
                              <MiniBar value={s.progress} color={s.progress === 100 ? "#c4ff47" : "#6E35E8"} />
                              <span className="text-[10px] font-black text-slate-900">{s.progress}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right text-[10px] font-bold text-zinc-500 uppercase">{s.lastActive}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}

function QATab({ qa }) {
   return (
      <div className="space-y-6">
         {qa.map(item => (
            <div key={item.id} className="glass-card p-10">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <img src={item.avatar} className="w-10 h-10 rounded-xl object-cover" />
                     <div>
                        <p className="text-sm font-black text-slate-900">{item.student}</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hỏi lúc {item.time} · Bài {item.lessonIdx + 1}</p>
                     </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">Chờ phản hồi</span>
               </div>
               <p className="text-base font-medium text-slate-700 leading-relaxed mb-10">"{item.question}"</p>
               <div className="flex gap-4">
                  <textarea
                     placeholder="Nhập câu trả lời của bạn..."
                     className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:border-primary-fixed transition-all resize-none"
                     rows={2}
                  />
                  <button className="px-8 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl">Gửi</button>
               </div>
            </div>
         ))}
      </div>
   );
}

function AnalyticsTab({ lessonStats }) {
   return (
      <div className="space-y-10">
         <div className="glass-card p-10 h-[400px] flex items-center justify-center text-zinc-500 italic">
            [ Biểu đồ dữ liệu Recharts sẽ hiển thị ở đây giống như Dashboard ]
         </div>
         <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
               <thead className="border-b border-slate-200 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <tr>
                     <th className="px-8 py-6">Bài học</th>
                     <th className="px-8 py-6">Lượt xem</th>
                     <th className="px-8 py-6">Hoàn thành</th>
                     <th className="px-8 py-6 text-right">Dropout</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {lessonStats.map((s, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 text-sm font-black text-slate-900">Bài số {i + 1}</td>
                        <td className="px-8 py-6 text-sm font-black text-zinc-400">{s.views}</td>
                        <td className="px-8 py-6">
                           <span className="text-primary-fixed font-black text-sm">{s.completionRate}%</span>
                        </td>
                        <td className="px-8 py-6 text-right text-orange-400 font-black text-sm">{s.dropoffRate}%</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
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
      const res = await uploadFile(file, "course-video");
      toast.dismiss(loadingToast);

      if (res.success) {
         toast.success("Upload video thành công!");
         setChapters(prev =>
            prev.map(ch =>
               ch.id !== chapterId
                  ? ch
                  : {
                        ...ch,
                        lessons: ch.lessons.map(lesson =>
                           lesson.id === lessonId ? { ...lesson, videoFileName: file.name, videoUrl: res.url } : lesson,
                        ),
                     },
            ),
         );
      } else {
         toast.error(res.error || "Upload video thất bại.");
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
         <div className="relative z-10 p-10 max-w-6xl mx-auto pt-16">
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
                  className="text-[10px] font-black text-primary-fixed uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
               >
                  <ArrowLeft size={14} /> Quay lại quản lý khóa học
               </button>
            </div>

            <div className="glass-card p-10">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Tạo khóa học mới</h1>

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
                           <span className="px-4 py-2 rounded-xl bg-primary-fixed/20 text-primary-fixed text-xs font-black uppercase tracking-widest">
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
                                                      ? "bg-primary-fixed/20 text-primary-fixed"
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
                                    const res = await uploadFile(file, "course-thumbnail");
                                    setIsUploadingThumbnail(false);
                                    if (res.success) {
                                       setThumbnailUrl(res.url);
                                       setThumbnailFileName(file.name);
                                       toast.success("Đã upload ảnh bìa!");
                                    } else {
                                       toast.error(res.error || "Upload ảnh thất bại.");
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
                                 const payload = buildCoursePayloadFromForm(form, chapters, thumbnailUrl);
                                 const r = await createCourseDraft(payload);
                                 if (!r.success) {
                                    toast.error(r.error || "Không thể lưu nháp.");
                                    return;
                                 }
                                 toast.success("Đã lưu nháp khóa học.");
                                 navigate(`/mentor/courses/${r.course?._id}/edit`);
                              }}
                              className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm font-black"
                           >
                              Lưu nháp
                           </button>
                           <button
                              onClick={async () => {
                                 const payload = buildCoursePayloadFromForm(form, chapters, thumbnailUrl);
                                 const r = await createCourseDraft(payload);
                                 if (!r.success) {
                                    toast.error(r.error || "Không thể tạo khóa học.");
                                    return;
                                 }
                                 const pub = await publishCourse(r.course?._id);
                                 if (!pub.success) {
                                    toast.error(pub.error || "Tạo nháp thành công nhưng chưa đăng được.");
                                    navigate(`/mentor/courses/${r.course?._id}/edit`);
                                    return;
                                 }
                                 toast.success("Đã gửi khóa học chờ admin duyệt.");
                                 navigate("/mentor/courses");
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


   useEffect(() => {
      fetchMyMentorProfile().then((res) => {
         if (!res?.success || !res?.mentor) return;
         const review = res.mentor.adminReview || {};
         if (review.status === "rejected" && String(review.reason || "").trim()) {
            setMentorRejectReason(String(review.reason || "").trim());
         }
      });
   }, []);

   useEffect(() => {
      if (isCreateMode) return;
      setLoading(true);
      fetchCourseById(id || "").then((res) => {
         if (!res.success || !res.course) {
            setCourse(null);
            setLoading(false);
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
            thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
            studentsCount: c.stats?.enrollmentCount || 0,
            rating: c.stats?.rating || 0,
            mentorAvatar: c.mentorId?.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
            mentorName: c.mentorId?.userId?.name || "Mentor",
            lessons: mappedLessons,
            raw: c,
         });
         setEditableLessons(mappedLessons);
         setLoading(false);
      });
   }, [id, isCreateMode]);

   if (isCreateMode) {
      return <CreateCourseForm navigate={navigate} mentorRejectReason={mentorRejectReason} />;
   }
   const lessons = editableLessons.length ? editableLessons : course?.lessons || [];
   const lessonStats = generateLessonStats(lessons.length);

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
               <BookOpen size={64} className="mx-auto mb-6 text-primary-fixed opacity-20" />
               <h2 className="text-4xl font-black mb-10 tracking-tighter">Không tìm thấy khóa học</h2>
               <button onClick={() => navigate("/mentor/courses")} className="px-10 py-4 rounded-3xl bg-primary-fixed text-black text-xs font-black uppercase tracking-widest shadow-xl">Quay lại quản lý</button>
            </div>
         </div>
      );
   }

   const TABS = [
      { key: "lessons", label: "Bài học", icon: Layout },
      { key: "students", label: "Học viên", icon: Users },
      { key: "qa", label: "Hỏi & Đáp", icon: ChatCircle },
      { key: "reviews", label: "Đánh giá", icon: Star },
      { key: "analytics", label: "Phân tích", icon: ChartBar },
   ];

   return (
      <MentorPageShell bottomPad="pb-40" extraStyles={MENTOR_COURSE_EDIT_EXTRA_CSS}>
         <div className="relative z-10 p-10 max-w-7xl mx-auto pt-20">
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
            {/* Navigation Hero */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
               <div className="flex items-center gap-10">
                  <div className="relative group/thumb">
                     <img src={thumbnailUrl || course.thumbnail} className="w-40 h-28 rounded-3xl object-cover ring-8 ring-white/5 shadow-2xl" />
                     <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-3xl cursor-pointer">
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
                              const res = await uploadFile(file, "course-thumbnail");
                              setIsUploadingThumbnail(false);
                              if (res.success) {
                                 setThumbnailUrl(res.url);
                                 toast.success("Đã upload ảnh mới!");
                              } else {
                                 toast.error(res.error || "Upload thất bại");
                              }
                           }}
                        />
                     </label>
                  </div>

                  <div>
                     <button onClick={() => navigate("/mentor/courses")} className="text-[10px] font-black text-primary-fixed uppercase tracking-widest mb-4 flex items-center gap-2 hover:translate-x-1 transition-transform">
                        <ArrowLeft size={14} /> Quản lý khóa học
                     </button>
                     <h1 className="text-5xl font-black text-slate-900 font-headline tracking-tighter mb-4 leading-none uppercase">
                        {course.title}
                     </h1>
                     <div className="flex items-center gap-6 mt-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                           <Users size={14} /> {course.studentsCount} Students
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                           <Star size={14} className="text-[#FFD600]" /> {course.rating} Rating
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => navigate(`/courses/${id}`)} className="px-8 py-4 rounded-3xl bg-slate-50 border border-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                     <Eye size={16} /> Xem bản nháp
                  </button>
               </div>
            </div>

            {/* Tab Interface */}
            <div className="glass-card mb-12 p-2 bg-slate-50 border border-slate-200 flex gap-2 overflow-x-auto custom-scrollbar">
               {TABS.map(tab => (
                  <button
                     key={tab.key}
                     onClick={() => setActiveTab(tab.key)}
                     className={`tab-btn ${activeTab === tab.key ? 'active' : ''} flex items-center gap-3 whitespace-nowrap`}
                  >
                     <tab.icon size={16} /> {tab.label}
                     {activeTab === tab.key && <motion.div layoutId="tab-underline" className="tab-indicator" />}
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
                  {activeTab === "students" && <StudentsTab students={MOCK_STUDENTS} />}
                  {activeTab === "qa" && <QATab qa={MOCK_QA} />}
                  {activeTab === "reviews" && <ReviewsTab mentorAvatar={course.mentorAvatar} mentorName={course.mentorName} />}
                  {activeTab === "analytics" && <AnalyticsTab lessonStats={lessonStats} />}
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Floating Action Bar */}
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-card px-10 py-5 bg-slate-900/40 border-primary-fixed/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center gap-10">
               <div className="hidden sm:block">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lần lưu cuối</p>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">vừa xong</p>
               </div>
               <div className="flex gap-4">
                  <button
                     onClick={async () => {
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
                           toast.error(saved.error || "Không thể lưu thay đổi trước khi gửi duyệt.");
                           return;
                        }
                        const pub = await publishCourse(course.id, payload);
                        if (!pub.success) {
                           toast.error(pub.error || "Không thể gửi bản cập nhật.");
                           return;
                        }
                        toast.success("Đã gửi bản cập nhật để admin duyệt. Khóa hiện tại vẫn đang public.");
                        navigate("/mentor/courses");
                     }}
                     className="px-10 py-4 rounded-2xl bg-primary-fixed text-black text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                  >
                     Lưu & Gửi duyệt
                  </button>
                  <button
                     onClick={() => window.location.reload()}
                     className="px-8 py-4 rounded-2xl border border-slate-200 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-slate-900 transition-all"
                  >
                     Hủy thay đổi
                  </button>
               </div>
            </div>
         </div>
      </MentorPageShell>
   );
}
