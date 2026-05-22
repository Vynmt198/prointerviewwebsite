import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  Pencil as NotePencil,
  MessageCircle as ChatCircle,
  X,
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  Award as Certificate,
  Download,
  Share2 as Share,
  List,
  ExternalLink as ArrowSquareOut,
  PartyPopper as Confetti,
  BadgeCheck as SealCheck,
  Zap as Lightning,
  PauseCircle,
  RotateCcw as ArrowCounterClockwise,
  Volume2 as SpeakerHigh,
  Captions as Subtitles,
  Maximize2 as CornersOut,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import {
  fetchCourseById,
  fetchLessonContent,
  fetchLessonQA,
  submitLessonQuestion,
  fetchLessonNotes,
  saveLessonNotes,
} from "../../utils/courseApi";
import { enrollmentApi } from "../../utils/enrollmentApi";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";
import { avatarSrc, mediaSrc } from "../../utils/mediaUrl";
import { enrollmentAccessGranted } from "../../utils/enrollmentAccess.js";

/* ── Helpers ────────────────────────────────────────────────── */
const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
};

/* ── Video Player ────────────────────────────────────────────── */
function VideoPlayer({ lesson, thumbnail }) {
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPct = x / rect.width;
    const newTime = clickedPct * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div 
      className="relative w-full bg-black overflow-hidden rounded-2xl group shadow-2xl" 
      style={{ aspectRatio: "16/9" }}
      onMouseMove={() => {
        setShowControls(true);
        clearTimeout(window.controlsTimeout);
        window.controlsTimeout = setTimeout(() => isPlaying && setShowControls(false), 3000);
      }}
    >
      <video
        ref={videoRef}
        src={mediaSrc(lesson.videoUrl)}
        poster={thumbnail}
        className="w-full h-full object-contain"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Overlay controls */}
      <div 
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%)" }}
      >
        {/* Play center button (only when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={togglePlay}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[#6E35E8] text-white shadow-2xl scale-100 hover:scale-110 transition-transform"
            >
              <PlayCircle className="w-12 h-12" />
            </button>
          </div>
        )}

        {/* Bottom controls bar */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Progress Bar */}
          <div 
            className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer relative group/progress"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-[#c4ff47] rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#c4ff47] rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-[#c4ff47] transition-colors">
                {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center gap-2 group/volume relative">
                <button 
                   onClick={() => {
                     setIsMuted(!isMuted);
                     videoRef.current.muted = !isMuted;
                   }}
                   className="text-white/80 hover:text-white"
                >
                  {isMuted || volume === 0 ? <SpeakerHigh className="w-5 h-5 opacity-50" /> : <SpeakerHigh className="w-5 h-5" />}
                </button>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    videoRef.current.volume = v;
                    videoRef.current.muted = v === 0;
                    setIsMuted(v === 0);
                  }}
                  className="w-0 group-hover/volume:w-20 transition-all h-1 accent-[#c4ff47]"
                />
              </div>

              <span className="text-white/80 text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => videoRef.current.requestFullscreen()}
                className="text-white/80 hover:text-white transition-colors"
              >
                <CornersOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Certificate Modal ────────────────────────────────────────── */
function CertificateModal({
  enrollmentId,
  courseName,
  mentorName,
  onClose,
}) {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      try {
        const res = await enrollmentApi.getCertificate(enrollmentId);
        if (res.success) {
          setCertData(res.certificate);
        } else {
          toastApiError(res.error, "Không thể lấy chứng chỉ");
        }
      } catch {
        toastApiError("Lỗi kết nối khi lấy chứng chỉ");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [enrollmentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div
          className="relative p-8 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #2d1060 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: "#6E35E8" }} />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: "#c4ff47" }} />
          </div>
          <Confetti className="w-14 h-14 mx-auto mb-3" style={{ color: "#c4ff47" }} />
          <h2 className="text-2xl font-bold text-white mb-1">Chúc mừng</h2>
          <p className="text-white/60 text-sm">Bạn đã hoàn thành khóa học</p>
        </div>

        {/* Certificate preview */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6E35E8] border-t-transparent"></div>
              <p className="text-gray-400 text-sm">Đang tạo chứng chỉ...</p>
            </div>
          ) : certData ? (
            <>
              <div
                className="rounded-2xl p-6 mb-5 text-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #f9f4ff, #fff8e1)",
                  border: "2px solid rgba(110, 53, 232,0.15)",
                }}
              >
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[#6E35E8]/30 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-[#6E35E8]/30 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-[#6E35E8]/30 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-[#6E35E8]/30 rounded-br-lg" />

                <Certificate className="w-10 h-10 mx-auto mb-3" style={{ color: "#FFD600" }} />
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Chứng chỉ hoàn thành</p>
                <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{certData.courseTitle || courseName}</h3>
                <p className="text-sm text-gray-500 mb-3">Được chứng nhận cho <span className="font-semibold text-[#6E35E8]">{certData.studentName}</span></p>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <SealCheck className="w-4 h-4" style={{ color: "#c4ff47" }} />
                    <span className="text-xs text-gray-500">ProInterview Verified · {new Date(certData.issuedAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                  {certData.code && (
                    <span className="text-[10px] text-gray-400 font-mono">ID: {certData.code}</span>
                  )}
                </div>
              </div>

              {/* What's next */}
              <div
                className="rounded-2xl p-4 mb-5"
                style={{ background: "rgba(110, 53, 232,0.05)", border: "1px solid rgba(110, 53, 232,0.1)" }}
              >
                <p className="text-sm font-bold text-[#6E35E8] mb-2 flex items-center gap-1.5">
                  <Lightning className="w-4 h-4" />
                  Bước tiếp theo
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Chia sẻ chứng chỉ lên LinkedIn để tăng visibility",
                    "Book 1-1 với mentor để nhận feedback cá nhân",
                    "Áp dụng kiến thức vào Mock Interview thực tế",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-[#6E35E8] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={certData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: "#c4ff47", color: "#1F1F1F" }}
                >
                  <Download className="w-4 h-4" />
                  Tải chứng chỉ
                </a>
                <button
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all hover:bg-gray-50"
                  style={{ border: "1px solid rgba(110, 53, 232,0.2)", color: "#6E35E8" }}
                >
                  <Share className="w-4 h-4" />
                  Chia sẻ
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">Không thể tải thông tin chứng chỉ.</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── QA Section ──────────────────────────────────────────────── */
function QASection({
  courseId,
  lessonId,
  mentorAvatar,
  mentorName,
}) {
  const [items, setItems] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchLessonQA(courseId, lessonId);
        if (cancelled) return;
        if (!res.success) {
          toastApiError(res.error, "Không tải được câu hỏi.");
          setItems([]);
          return;
        }
        setItems(res.items || []);
      } catch {
        if (!cancelled) toastApiError("Lỗi kết nối khi tải câu hỏi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const addQuestion = async () => {
    const text = newQuestion.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitLessonQuestion(courseId, lessonId, text);
      if (!res.success) {
        toastApiError(res.error, "Không gửi được câu hỏi.");
        return;
      }
      toastApiSuccess(res.message || "Đã gửi câu hỏi.");
      setNewQuestion("");
      if (res.item) {
        setItems((prev) => [res.item, ...prev]);
      } else {
        const reload = await fetchLessonQA(courseId, lessonId);
        if (reload.success) setItems(reload.items || []);
      }
    } catch {
      toastApiError("Lỗi kết nối khi gửi câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-white/60 text-sm">Hỏi & Đáp với Mentor — đồng bộ trên hệ thống</p>
        <span className="text-xs text-white/30">{items.length} câu hỏi</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          disabled={submitting}
          className="flex-1 rounded-2xl p-4 text-sm outline-none transition-all disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
            lineHeight: "1.8",
          }}
          onFocus={(e) => (e.target.style.border = "1px solid rgba(110, 53, 232,0.4)")}
          onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.08)")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addQuestion();
            }
          }}
        />
        <button
          onClick={addQuestion}
          disabled={submitting || !newQuestion.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "rgba(110, 53, 232,0.2)", color: "#8B4DFF" }}
        >
          <ChatCircle className="w-3.5 h-3.5 inline mr-1.5" />
          {submitting ? "Đang gửi…" : "Gửi"}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-white/40 py-6 text-center">Đang tải câu hỏi…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/40 py-6 text-center">Chưa có câu hỏi nào. Hãy là người đầu tiên!</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl p-4 bg-gray-900">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={avatarSrc(item.student?.avatar)}
                  alt={item.student?.name || "Học viên"}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-white/90">{item.student?.name || "Học viên"}</p>
                  <p className="text-[10px] text-white/30">{item.time}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{item.question}</p>
              {item.mentorAnswer ? (
                <div
                  className="mt-3 rounded-xl p-3"
                  style={{ background: "rgba(110, 53, 232, 0.12)", border: "1px solid rgba(110, 53, 232, 0.2)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <img src={avatarSrc(mentorAvatar)} alt={mentorName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <p className="text-xs font-bold text-[#8B4DFF]">{mentorName}</p>
                    <span className="text-[10px] text-white/30 uppercase tracking-wide">Mentor</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{item.mentorAnswer}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-white/30">Chờ mentor trả lời…</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export function CourseLearning() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  /** Ghi danh CK đang chờ admin — không set vào `enrollment` để tránh coi như đã học được. */
  const [paymentPendingInfo, setPaymentPendingInfo] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [lessonContent, setLessonContent] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesSaveTimer = useRef(null);
  const notesLoadedFor = useRef("");

  // Load course and enrollment data
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      setEnrollment(null);
      setCompletedLessons([]);
      setPaymentPendingInfo(null);
      try {
      const courseRes = await fetchCourseById(id);
      if (!courseRes.success) {
        toastApiError(courseRes.error, "Không tải được khóa học.");
        setLoading(false);
        return;
      }
      
      const c = courseRes.course;
      const allLessons = (c.modules || []).flatMap((module) =>
        (module.lessons || []).map((lesson) => ({
          id: String(lesson._id),
          title: lesson.title,
          duration: lesson.durationMinutes || 0,
          isPreview: !!lesson.isFree,
          _id: String(lesson._id),
        })),
      );
      const flatCourse = {
        id: c._id,
        title: c.title,
        thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        mentorId: c.mentorId?._id,
        mentorName: c.mentorId?.userId?.name || "Khuất danh",
        mentorAvatar: c.mentorId?.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
        lessons: allLessons
      };
      setCourse(flatCourse);

      // Get enrollment data
      const enrollRes = await enrollmentApi.getMyEnrollments();
      if (enrollRes.success) {
        const found = enrollRes.enrollments.find(
          (e) => String(e.courseId?._id || e.courseId || "") === String(id),
        );
        if (found) {
          if (enrollmentAccessGranted(found)) {
            setEnrollment(found);
            setCompletedLessons((found.completedLessons || []).map((lessonId) => String(lessonId)));
            setPaymentPendingInfo(null);
          } else {
            setEnrollment(null);
            setCompletedLessons([]);
            setPaymentPendingInfo({
              courseId: String(id),
              price: Number(c.price || 0),
            });
          }
        } else {
          setEnrollment(null);
          setCompletedLessons([]);
          setPaymentPendingInfo(null);
        }
      }
      } catch {
        toastApiError("Lỗi kết nối khi tải khóa học.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const lessons = course?.lessons || [];
  const currentLesson = lessons[currentLessonIdx];
  const progressPct = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  // Reset play state on lesson change
  useEffect(() => {
    if (!currentLesson) return;
    setNotes("");
    setIsPlaying(false);
    setJustCompleted(false);
  }, [currentLessonIdx, currentLesson, id]);

  // Load notes from API
  useEffect(() => {
    if (!id || !currentLesson?.id) return;
    const key = `${id}:${currentLesson.id}`;
    notesLoadedFor.current = "";
    let cancelled = false;

    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const res = await fetchLessonNotes(id, currentLesson.id);
        if (cancelled) return;
        if (!res.success) {
          if (res.error !== "Chưa đăng nhập.") {
            toastApiError(res.error, "Không tải được ghi chú.");
          }
          setNotes("");
          return;
        }
        setNotes(res.content || "");
        notesLoadedFor.current = key;
      } catch {
        if (!cancelled) toastApiError("Lỗi kết nối khi tải ghi chú.");
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    };

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [id, currentLesson?.id]);

  // Autosave notes (debounced)
  useEffect(() => {
    if (!id || !currentLesson?.id || notesLoading) return;
    const key = `${id}:${currentLesson.id}`;
    if (notesLoadedFor.current !== key) return;

    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      setNotesSaving(true);
      try {
        const res = await saveLessonNotes(id, currentLesson.id, notes);
        if (!res.success && res.error !== "Chưa đăng nhập.") {
          toastApiError(res.error, "Không lưu được ghi chú.");
        }
      } catch {
        toastApiError("Lỗi kết nối khi lưu ghi chú.");
      } finally {
        setNotesSaving(false);
      }
    }, 800);

    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, [notes, id, currentLesson?.id, notesLoading]);

  // Load detailed lesson content
  useEffect(() => {
    if (!id || !currentLesson?.id) return;

    const loadLesson = async () => {
      setLessonLoading(true);
      try {
        const res = await fetchLessonContent(id, currentLesson.id);
        if (res.success) {
          setLessonContent(res.lesson);
        } else {
          toastApiError(res.error, "Không thể lấy nội dung bài học.");
        }
      } catch {
        toastApiError("Lỗi kết nối khi tải nội dung bài học.");
      } finally {
        setLessonLoading(false);
      }
    };

    loadLesson();
  }, [id, currentLesson?._id]);

  // Save progress
  const markComplete = async () => {
    if (!currentLesson || !enrollment || completedLessons.includes(currentLesson.id)) return;
    
    // Optimistic update
    const updated = [...completedLessons, currentLesson.id];
    setCompletedLessons(updated);
    
    try {
      const res = await enrollmentApi.updateProgress(enrollment._id, currentLesson.id, true);
      if (res.success) {
        setJustCompleted(true);
        if (updated.length === lessons.length) {
          setTimeout(() => setShowCertificate(true), 600);
        }
        setTimeout(() => setJustCompleted(false), 2800);
      } else {
        setCompletedLessons((prev) => prev.filter((lid) => lid !== currentLesson.id));
        toastApiError(res.error, "Không thể lưu tiến độ.");
      }
    } catch {
      setCompletedLessons((prev) => prev.filter((lid) => lid !== currentLesson.id));
      toastApiError("Lỗi kết nối khi lưu tiến độ.");
    }
  };

  const goToLesson = (idx) => {
    if (idx < 0 || idx >= lessons.length) return;
    setCurrentLessonIdx(idx);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-fixed border-t-transparent"></div>
      </div>
    );
  }

  if (!loading && paymentPendingInfo && course) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-amber-500/80 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Chờ xác nhận thanh toán</h2>
          <p className="text-sm text-white/55 mb-6 leading-relaxed">
            Ghi danh khóa học đã được tạo. Sau khi bạn chuyển khoản và admin xác nhận, bạn có thể vào học đầy đủ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/checkout?type=course&courseId=${paymentPendingInfo.courseId}&price=${paymentPendingInfo.price}`,
                )
              }
              className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110"
              style={{ background: "#6E35E8" }}
            >
              Tiếp tục thanh toán
            </button>
            <button
              type="button"
              onClick={() => navigate(`/courses/${id}`)}
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Về trang khóa học
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && course && !enrollment && !paymentPendingInfo && lessons.length > 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Chưa ghi danh</h2>
          <p className="text-sm text-white/50 mb-6">
            Vui lòng đăng ký (và thanh toán nếu khóa có phí) từ trang chi tiết khóa học.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/courses/${id}`)}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "#6E35E8" }}
          >
            Về trang khóa học
          </button>
        </div>
      </div>
    );
  }

  if (!course || (!currentLesson && lessons.length > 0)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy khóa học</h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 rounded-xl px-6 py-3 text-sm font-semibold"
            style={{ background: "#6E35E8", color: "#fff" }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 antialiased">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        className="flex items-center gap-1.5 px-2 py-0 shrink-0 z-30"
        style={{ background: "#111", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Logo + Back */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition-all hover:border-white/35 hover:bg-white/[0.18] active:scale-[0.97]"
            aria-label="Quay lại trang trước"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          </button>
          <div className="h-7 w-px shrink-0 self-center bg-white/10" aria-hidden />
          <div
            className="flex cursor-pointer items-center gap-0 p-0 leading-none"
            onClick={() => navigate("/")}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/");
            }}
            aria-label="Về trang chủ ProInterview"
          >
            <img
              src="/Logo.png"
              alt="ProInterview"
              className="block h-12 w-auto max-w-[min(280px,52vw)] object-contain object-left object-top brightness-[0.92] contrast-[1.12] sm:h-14 md:h-16"
            />
          </div>
        </div>

        {/* Course name */}
        <div className="flex-1 min-w-0 px-1.5 py-0">
          <p className="text-white/80 text-sm font-medium truncate">{course.title}</p>
          <p className="text-white/40 text-xs">
            Bài {currentLessonIdx + 1}/{lessons.length} · {currentLesson.title}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "#c4ff47" }}
              />
            </div>
            <span className="text-white/60 text-xs font-medium">{progressPct}%</span>
          </div>

          {progressPct === 100 && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
              style={{ background: "rgba(196, 255, 71,0.15)", color: "#c4ff47", border: "1px solid rgba(196, 255, 71,0.3)" }}
            >
              <Certificate className="w-3.5 h-3.5" />
              Chứng chỉ
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Video + Content Area ──────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0" style={{ background: "#0d0d0d" }}>
          {/* Video Player Container with padding */}
          <div className="p-4 md:p-6">
            {lessonLoading ? (
              <div className="w-full bg-black/40 rounded-lg flex flex-col items-center justify-center gap-3" style={{ aspectRatio: "16/9" }}>
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6E35E8] border-t-transparent"></div>
                <p className="text-white/40 text-sm">Đang tải bài học...</p>
              </div>
            ) : lessonContent ? (
              <VideoPlayer
                lesson={lessonContent}
                thumbnail={course.thumbnail}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
              />
            ) : (
              <div className="w-full bg-black/40 rounded-lg flex flex-col items-center justify-center gap-3" style={{ aspectRatio: "16/9" }}>
                <X className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">Không thể tải nội dung bài học.</p>
              </div>
            )}
          </div>

          {/* Content below video */}
          <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
            {/* Lesson title + complete btn */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(110, 53, 232,0.2)", color: "#8B4DFF" }}>
                    Bài {currentLessonIdx + 1}
                  </span>
                  {completedLessons.includes(currentLesson.id) && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(196, 255, 71,0.15)", color: "#4A7A00" }}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã hoàn thành
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white leading-tight">{currentLesson.title}</h1>
                <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(currentLesson.duration)}
                </p>
              </div>

              {/* Mark complete / completed */}
              {completedLessons.includes(currentLesson.id) ? (
                <div
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "rgba(196, 255, 71,0.1)", color: "#c4ff47", border: "1px solid rgba(196, 255, 71,0.2)" }}
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  Hoàn thành
                </div>
              ) : (
                <button
                  onClick={markComplete}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "#c4ff47", color: "#1F1F1F" }}
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>

            {/* Tabs: Ghi chú | Hỏi & Đáp */}
            <div className="flex gap-1 border-b mb-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {[
                { key: "notes", label: "Ghi chú", icon: NotePencil },
                { key: "qa", label: "Hỏi & Đáp", icon: ChatCircle },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap"
                  style={{
                    borderBottomColor: activeTab === tab.key ? "#6E35E8" : "transparent",
                    color: activeTab === tab.key ? "#8B4DFF" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Ghi chú */}
            {activeTab === "notes" && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-white/60 text-sm">
                    Ghi chú của bạn — đồng bộ trên hệ thống
                    {notesSaving && <span className="ml-2 text-white/30">· đang lưu…</span>}
                    {notesLoading && <span className="ml-2 text-white/30">· đang tải…</span>}
                  </p>
                  <span className="text-xs text-white/30">{notes.length} ký tự</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={notesLoading}
                  placeholder="Nhập ghi chú của bạn ở đây... Ví dụ: STAR method — S: mô tả bối cảnh rõ ràng trong 1-2 câu..."
                  rows={10}
                  className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: "1.8",
                  }}
                  onFocus={(e) => (e.target.style.border = "1px solid rgba(110, 53, 232,0.4)")}
                  onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.08)")}
                />
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => setNotes("")}
                    className="px-4 py-2 rounded-xl text-sm border text-white/40 hover:text-white/60 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Xóa ghi chú
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{ background: "rgba(110, 53, 232,0.2)", color: "#8B4DFF" }}
                  >
                    <Download className="w-3.5 h-3.5 inline mr-1.5" />
                    Xuất PDF
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Hỏi & Đáp */}
            {activeTab === "qa" && currentLesson && (
              <QASection
                courseId={id || ""}
                lessonId={currentLesson.id}
                mentorAvatar={course.mentorAvatar}
                mentorName={course.mentorName}
              />
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => goToLesson(currentLessonIdx - 1)}
                disabled={currentLessonIdx === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <CaretLeft className="w-4 h-4" />
                Bài trước
              </button>

              <div className="text-center">
                <span className="text-white/30 text-xs">
                  {currentLessonIdx + 1} / {lessons.length}
                </span>
              </div>

              <button
                onClick={() => {
                  if (!completedLessons.includes(currentLesson.id)) markComplete();
                  goToLesson(currentLessonIdx + 1);
                }}
                disabled={currentLessonIdx === lessons.length - 1}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: "#6E35E8", color: "#fff" }}
              >
                Bài tiếp theo
                <CaretRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar: Lesson List ────────────────────── */}
        <aside
          className={`shrink-0 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarOpen ? "w-80" : "w-0"
          }`}
          style={{ background: "#111", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-white font-semibold text-sm">Nội dung khóa học</p>
              <p className="text-white/40 text-xs mt-0.5">{completedLessons.length}/{lessons.length} bài hoàn thành</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/50 text-xs">Tiến độ học</span>
              <span className="text-xs font-bold" style={{ color: progressPct === 100 ? "#c4ff47" : "#8B4DFF" }}>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: progressPct === 100 ? "#c4ff47" : "#6E35E8" }}
              />
            </div>
          </div>

          {/* Lesson list */}
          <div className="flex-1 overflow-y-auto py-2">
            {lessons.map((lesson, idx) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isCurrent = idx === currentLessonIdx;

              return (
                <button
                  key={lesson.id}
                  onClick={() => goToLesson(idx)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5 relative"
                  style={{
                    background: isCurrent ? "rgba(110, 53, 232,0.12)" : "transparent",
                    borderLeft: isCurrent ? "2px solid #6E35E8" : "2px solid transparent",
                  }}
                >
                  {/* Index / check */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all"
                    style={{
                      background: isCompleted
                        ? "rgba(196, 255, 71,0.15)"
                        : isCurrent
                        ? "rgba(110, 53, 232,0.2)"
                        : "rgba(255,255,255,0.06)",
                      color: isCompleted ? "#4A7A00" : isCurrent ? "#8B4DFF" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium leading-snug"
                      style={{
                        color: isCurrent ? "#fff" : isCompleted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.65)",
                      }}
                    >
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {formatDuration(lesson.duration)}
                      </span>
                      {lesson.isPreview && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(196, 255, 71,0.12)", color: "#4A7A00" }}>
                          Preview
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrent && isPlaying && (
                    <div className="flex gap-0.5 shrink-0 mt-2.5">
                      {[1, 2, 3].map((b) => (
                        <div
                          key={b}
                          className="w-0.5 rounded-full"
                          style={{
                            height: `${8 + b * 3}px`,
                            background: "#6E35E8",
                            animation: `pulse ${0.5 + b * 0.15}s ease-in-out infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom CTA: Book mentor */}
          <div
            className="p-4 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => navigate(`/mentors/${course.mentorId}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:brightness-110"
              style={{ background: "rgba(110, 53, 232,0.12)", border: "1px solid rgba(110, 53, 232,0.2)" }}
            >
              <img src={course.mentorAvatar} alt={course.mentorName} className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold" style={{ color: "#8B4DFF" }}>Book 1-1 với Mentor</p>
                <p className="text-[11px] text-white/40 truncate">{course.mentorName}</p>
              </div>
              <ArrowSquareOut className="w-3.5 h-3.5 shrink-0" style={{ color: "#6E35E8" }} />
            </button>
          </div>
        </aside>
      </div>

      {/* ── Certificate Modal ──────────────────────────────── */}
      {showCertificate && enrollment && (
        <CertificateModal
          enrollmentId={enrollment._id}
          courseName={course.title}
          mentorName={course.mentorName}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Just completed toast */}
      {justCompleted && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-300"
          style={{ background: "rgba(196, 255, 71,0.95)", color: "#1F1F1F" }}
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-bold">Bài học đã hoàn thành 🎉</span>
        </div>
      )}
    </div>
  );
}