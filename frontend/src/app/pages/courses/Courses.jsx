import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Star,
  Clock,
  Users,
  PlayCircle,
  BookOpen,
  Zap,
  Briefcase,
  GraduationCap,
  BarChart3,
  FileText,
  BadgeCheck,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Award,
  Compass,
  RotateCcw,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";

import { fetchCourses } from "../../utils/courseApi";
import { enrollmentApi } from "../../utils/enrollmentApi";
import { normalizeCourseStats } from "../../utils/courseStats";
import { enrollmentAccessGranted } from "../../utils/enrollmentAccess.js";

const LEVEL_OPTIONS = [
  { label: "Tất cả", value: "Tất cả" },
  { label: "Người mới", value: "Beginner" },
  { label: "Trung cấp", value: "Intermediate" },
  { label: "Nâng cao", value: "Advanced" },
];

function CoursesExploreFilters({
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  resultCount,
}) {
  const levelLabel =
    LEVEL_OPTIONS.find((o) => o.value === selectedLevel)?.label ?? selectedLevel;
  const hasLevelFilter = selectedLevel !== "Tất cả";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-violet-200/55 bg-white shadow-[0_10px_28px_rgba(76,29,149,0.07)]">
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#6E35E8]" />
            <input
              type="search"
              placeholder="Tìm theo tên khóa học, kỹ năng, tag..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E35E8]/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/80 hover:text-slate-700"
                aria-label="Xóa từ khóa"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="mb-2.5 text-xs font-semibold text-slate-700">Cấp độ</p>
          <div
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100/90 p-1 sm:grid-cols-4"
            role="group"
            aria-label="Lọc theo cấp độ"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onLevelChange(opt.value)}
                className={`rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all ${
                  selectedLevel === opt.value
                    ? "bg-white text-[#6E35E8] shadow-sm ring-1 ring-violet-200/70"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasLevelFilter ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-violet-100/80 bg-violet-50/50 px-4 py-2.5 sm:px-5">
            <span className="text-[11px] font-medium text-slate-500">Đang lọc</span>
            <button
              type="button"
              onClick={() => onLevelChange("Tất cả")}
              className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-2.5 pr-1.5 text-xs font-medium text-[#6E35E8] ring-1 ring-violet-200/80"
            >
              {levelLabel}
              <X className="size-3 opacity-70" />
            </button>
            <button
              type="button"
              onClick={() => onLevelChange("Tất cả")}
              className="ml-auto text-xs font-semibold text-slate-500 transition-colors hover:text-[#6E35E8]"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : null}
      </div>

      <p className="px-0.5 text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{resultCount}</span> khóa học
        {searchQuery ? (
          <>
            {" "}
            · &quot;<span className="font-medium text-[#6E35E8]">{searchQuery}</span>&quot;
          </>
        ) : null}
      </p>
    </div>
  );
}

/* ── Enrolled Course helpers ───────────────────────────────────── */

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0
    ? `${h}h ${m > 0 ? m + "m" : ""}`.trim()
    : `${m}m`;
};

const getLevelBadge = (level) => {
  const configs = {
    Beginner: {
      bg: "rgba(180,240,0,0.92)",
      text: "#1a3300",
      shadow: "0 2px 8px rgba(0,0,0,0.25)",
      label: "Cơ bản",
    },
    Intermediate: {
      bg: "rgba(110, 53, 232,0.92)",
      text: "#ffffff",
      shadow: "0 2px 8px rgba(110, 53, 232,0.45)",
      label: "Trung cấp",
    },
    Advanced: {
      bg: "rgba(255,140,66,0.92)",
      text: "#1F1F1F",
      shadow: "0 2px 8px rgba(255,140,66,0.45)",
      label: "Nâng cao",
    },
  };
  const cfg = configs[level] || configs.Intermediate;
  return (
    <span
      className="text-xs font-bold px-2.5 py-1 rounded-lg"
      style={{
        background: cfg.bg,
        color: cfg.text,
        boxShadow: cfg.shadow,
        backdropFilter: "blur(6px)",
        letterSpacing: "0.01em",
      }}
    >
      {cfg.label}
    </span>
  );
};

/* ── Progress Ring ──────────────────────────────────────────── */
function ProgressRing({
  pct,
  size = 52,
}) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const isCompleted = pct === 100;
  return (
    <div
      className="relative flex items-center justify-center p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
      style={{ width: size, height: size }}
    >
      <svg width={size - 12} height={size - 12} className="-rotate-90">
        <circle
          cx={(size - 12) / 2}
          cy={(size - 12) / 2}
          r={r - 6}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={4}
        />
        <circle
          cx={(size - 12) / 2}
          cy={(size - 12) / 2}
          r={r - 6}
          fill="none"
          stroke={isCompleted ? "#BFFF00" : "#7000ff"}
          strokeWidth={4}
          strokeDasharray={2 * Math.PI * (r - 6)}
          strokeDashoffset={2 * Math.PI * (r - 6) - (pct / 100) * 2 * Math.PI * (r - 6)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <span
        className="absolute text-[10px] font-black"
        style={{ color: isCompleted ? "#BFFF00" : "white" }}
      >
        {pct}%
      </span>
    </div>
  );
}

/* ── Enrolled Course Card ───────────────────────────────────── */
function EnrolledCourseCard({
  item,
  onContinue,
}) {
  const { course, completedLessons, progressPct, isCompleted } = item;
  const totalLessons = course.lessons?.length || course.lessonsCount;
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden group transition-all duration-500 hover:border-secondary/30 flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Completion badge */}
        {isCompleted && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-fixed/20">
            <Trophy className="size-3.5" />
            Hoàn thành
          </div>
        )}

        {/* Progress ring overlay */}
        <div className="absolute top-4 right-4">
          <ProgressRing pct={progressPct} size={48} />
        </div>

        {/* Lesson count bottom left */}
        <div className="absolute bottom-4 left-4">
          <span className="text-white/90 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <CheckCircle2 className={`size-3.5 ${isCompleted ? 'text-primary-fixed' : 'text-zinc-500'}`} />
            {completedLessons.length}/{totalLessons} Bài học
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <span className="text-secondary font-black uppercase tracking-[0.2em] text-[9px] mb-2 block">{course.category}</span>
        
        <h3 className="font-bold text-white mb-6 line-clamp-2 leading-tight group-hover:text-primary-fixed transition-colors">
          {course.title}
        </h3>

        {/* Mentor */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src={course.mentorAvatar}
            alt={course.mentorName}
            className="w-8 h-8 rounded-lg object-cover border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{course.mentorName}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">{course.mentorTitle}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tiến độ</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-primary-fixed' : 'text-secondary'}`}>
              {progressPct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${isCompleted ? 'bg-primary-fixed glow-neon-sm' : 'bg-secondary'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          {isCompleted ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onContinue}
                className="py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-3.5" />
                Ôn lại
              </button>
              <button className="py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-primary-fixed text-on-primary-fixed hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <Award className="size-3.5" />
                Chứng chỉ
              </button>
            </div>
          ) : (
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] bg-secondary text-white hover:brightness-110 transition-all flex items-center justify-center gap-3 group/btn"
            >
                {progressPct === 0 ? <Play className="size-4.5" /> : <Zap className="size-4.5" />}
              {progressPct === 0 ? 'Bắt đầu học' : 'Tiếp tục học'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Recent Activity ────────────────────────────────────────── */
function RecentActivity({
  items,
}) {
  const navigate = useNavigate();
  const inProgress = items.filter(
    (i) => i.hasPaidAccess && i.progressPct > 0 && !i.isCompleted,
  );
  if (inProgress.length === 0) return null;

  return (
    <div className="glass-card rounded-3xl p-8 border border-white/5 mb-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <Zap className="size-6 text-secondary" />
          <h2 className="text-xl font-bold text-white tracking-tight">Tiếp tục từ chỗ bỏ dở</h2>
        </div>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
          {inProgress.length} Khóa học đang học
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        {inProgress.slice(0, 2).map(({ course, progressPct, completedLessons }) => {
          const nextLesson = course.lessons?.find(
            (l) => !completedLessons.includes(l.id),
          );
          return (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}/learn`)}
              className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/30 transition-all cursor-pointer flex items-center gap-6"
            >
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="text-white size-8" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-primary-fixed transition-colors mb-1">
                  {course.title}
                </p>
                {nextLesson && (
                  <p className="text-[10px] text-zinc-500 truncate mb-4">
                    Tiếp theo: <span className="text-zinc-300">{nextLesson.title}</span>
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{progressPct}%</span>
                </div>
              </div>

              <ChevronRight className="text-zinc-700 group-hover:text-secondary translate-x-0 group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Courses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "explore";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Load all courses and enrolled courses
  useEffect(() => {
    // 1. Fetch marketplace courses
    fetchCourses().then((res) => {
      if (res.success) {
        const mapped = res.courses.map((c) => {
          const { rating } = normalizeCourseStats(c.stats);
          return {
            id: c._id,
            title: c.title,
            description: c.description,
            thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
            category: c.topics?.[0] || "Kỹ năng khác",
            level: c.level === "basic" ? "Beginner" : c.level === "intermediate" ? "Intermediate" : "Advanced",
            mentorName: c.mentorId?.userId?.name || "Khuất danh",
            mentorAvatar: c.mentorId?.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
            mentorTitle: c.mentorId?.userId?.desiredPosition || "Chuyên gia",
            mentorCompany: c.mentorId?.userId?.currentCompany || "ProInterview",
            rating,
            duration: c.totalDurationMinutes || 120,
            price: c.price || 0,
            tags: c.tags || [],
          };
        });
        setCourses(mapped);
      }
      setLoading(false);
    });

    // 2. Fetch enrolled courses
    enrollmentApi.getMyEnrollments().then((res) => {
      if (res.success) {
        const mapped = res.enrollments
          .filter(e => e.courseId)
          .map(e => {
            const c = e.courseId;
            const lessons = c.modules?.[0]?.lessons || [];
            const totalCount = lessons.length || c.totalLessons || 1;
            const pct = Math.round((e.completedLessons?.length / totalCount) * 100);
            return {
              course: {
                id: c._id,
                title: c.title,
                thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                category: c.topics?.[0] || "Khóa học",
                mentorName: c.mentorId?.userId?.name || "Giảng viên",
                mentorAvatar: c.mentorId?.userId?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
                mentorTitle: c.mentorId?.userId?.desiredPosition || "Chuyên gia",
                lessons: lessons
              },
              completedLessons: e.completedLessons || [],
              progressPct: pct,
              isCompleted: pct === 100,
              hasPaidAccess: enrollmentAccessGranted(e),
              coursePrice: Number(c.price ?? 0),
            };
          });
        setEnrolledCourses(mapped);
      }
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  // My Courses state
  const [myCoursesTab, setMyCoursesTab] = useState("Tất cả");
  const [myCoursesSearch, setMyCoursesSearch] = useState("");


  // Filter marketplace courses
  const filteredCourses = courses.filter((course) => {
    const matchSearch =
      searchQuery === "" ||
      course.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      course.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      course.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchLevel =
      selectedLevel === "Tất cả" ||
      course.level === selectedLevel;
    return matchSearch && matchLevel;
  });

  // Filter my courses
  const filteredMyCourses = enrolledCourses.filter((item) => {
    const matchSearch =
      myCoursesSearch === "" ||
      item.course.title
        .toLowerCase()
        .includes(myCoursesSearch.toLowerCase()) ||
      item.course.category
        .toLowerCase()
        .includes(myCoursesSearch.toLowerCase()) ||
      item.course.mentorName
        .toLowerCase()
        .includes(myCoursesSearch.toLowerCase());
    const matchTab =
      myCoursesTab === "Tất cả" ||
      (myCoursesTab === "Đang học" &&
        item.progressPct > 0 &&
        !item.isCompleted) ||
      (myCoursesTab === "Đã hoàn thành" && item.isCompleted);
    return matchSearch && matchTab;
  });

  // Compute my courses stats
  const totalEnrolled = enrolledCourses.length;
  const totalCompleted = enrolledCourses.filter(
    (e) => e.isCompleted,
  ).length;
  const totalInProgress = enrolledCourses.filter(
    (e) => e.progressPct > 0 && !e.isCompleted,
  ).length;
  const totalMinutesLearned = enrolledCourses.reduce(
    (sum, { course, completedLessons }) => {
      if (!course.lessons) return sum;
      return (
        sum +
        course.lessons
          .filter((l) => completedLessons.includes(l.id))
          .reduce((s, l) => s + l.duration, 0)
      );
    },
    0,
  );
  const totalHoursLearned =
    Math.round((totalMinutesLearned / 60) * 10) / 10;

  const formatPrice = (price) => {
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="courses-light pi-page-dashboard-bg relative min-h-full w-full overflow-hidden font-sans antialiased text-slate-900 selection:bg-[rgba(196,255,71,0.28)] selection:text-slate-900">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="fixed top-[-22%] left-[-12%] h-[760px] w-[760px] rounded-full bg-[#d4ff00]/48 blur-[135px]" />
        <div className="fixed bottom-[-22%] right-[-10%] h-[820px] w-[820px] rounded-full bg-[#9447ff]/34 blur-[150px]" />
      </div>
      <style>{`
        .courses-light.pi-page-dashboard-bg {
          background: linear-gradient(165deg, #f8f4ff 0%, #f5f8ff 45%, #f7f4ff 100%);
        }
        .courses-light .glass-card,
        .courses-light .card-premium {
          background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(246,248,255,0.95) 100%) !important;
          border-color: rgba(148,71,255,0.16) !important;
          box-shadow: 0 14px 30px rgba(15,23,42,0.1) !important;
        }
        .courses-light .text-white { color: #0f172a !important; }
        .courses-light .text-zinc-300,
        .courses-light .text-zinc-200 { color: #334155 !important; }
        .courses-light .text-white\\/65,
        .courses-light .text-white\\/60,
        .courses-light .text-white\\/55,
        .courses-light .text-white\\/50,
        .courses-light .text-white\\/45,
        .courses-light .text-zinc-500,
        .courses-light .text-zinc-700 { color: #64748b !important; }
        .courses-light .text-zinc-400 { color: #475569 !important; }
        .courses-light .border-white\\/12,
        .courses-light .border-white\\/10,
        .courses-light .border-white\\/8,
        .courses-light .border-white\\/5 { border-color: rgba(148,71,255,0.14) !important; }
        .courses-light header { border-bottom-color: rgba(148,71,255,0.16) !important; }
        .courses-light header .absolute.inset-0 {
          opacity: .05 !important;
          background-image: linear-gradient(rgba(148,71,255,0.16) 1px,transparent 1px),linear-gradient(90deg,rgba(148,71,255,0.16) 1px,transparent 1px) !important;
        }
      `}</style>
      <header className="relative z-10 pb-2 pt-8 sm:pb-4 sm:pt-10">
        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <GraduationCap
                className="size-6 shrink-0 text-lime-900"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 sm:text-[11px]">
                Thư viện kiến thức
              </span>
            </div>
            <h1 className="mb-4 text-3xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Luyện tập cùng{" "}
              <span className="text-[#6E35E8]">
                Chuyên gia.
              </span>
            </h1>
            <p className="max-w-2xl text-base font-semibold leading-relaxed text-slate-600 sm:text-lg">
              Trang bị kiến thức cốt lõi qua các video bài giảng ngắn gọn. Áp dụng ngay vào buổi phỏng vấn 1-1 với Mentor để được đánh giá trực tiếp.
            </p>
          </div>
          <div
            className={`w-full border border-violet-200/75 bg-[#f4f2ff]/95 px-6 py-5 shadow-[0_16px_36px_rgba(76,29,149,0.09)] sm:px-8 sm:py-6 ${
              activeTab === "explore" ? "rounded-t-[28px] rounded-b-none border-b-0" : "rounded-[28px]"
            }`}
          >
            <div className="p-0 sm:p-0">
              <div className="mb-5 inline-flex rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "explore" })}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "explore"
                      ? "bg-[#6E35E8] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Compass className="size-4" />
                  Khám phá
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "my-courses" })}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "my-courses"
                      ? "bg-[#6E35E8] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="size-4" />
                  Khóa học của tôi
                </button>
              </div>

              {activeTab === "explore" && (
                <div>
                  <CoursesExploreFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedLevel={selectedLevel}
                    onLevelChange={setSelectedLevel}
                    resultCount={filteredCourses.length}
                  />

                  <div className="my-4 h-px bg-slate-200/80" />

                  <div className="pb-2 pt-1">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          onClick={() => navigate(`/courses/${course.id}`)}
                          className="group glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-secondary/30"
                        >
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute top-4 left-4 flex items-center gap-2">
                              <span className="inline-flex items-center justify-center bg-secondary/90 px-3 py-1 text-[10px] font-bold uppercase leading-none tracking-wider text-white backdrop-blur-md rounded-full">
                                {course.category}
                              </span>
                            </div>

                            <div className="absolute top-4 right-4">
                              <span className="inline-flex items-center justify-center border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase leading-none text-white/90 backdrop-blur-md rounded-full">
                                {course.level}
                              </span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                              <div className="w-14 h-14 rounded-full bg-primary-fixed/90 flex items-center justify-center shadow-2xl shadow-primary-fixed/30 transform transition-transform border border-white/20">
                                <Play className="text-on-primary-fixed size-7 translate-x-0.5" />
                              </div>
                            </div>
                          </div>

                          <div className="p-7">
                            <h3 className="text-xl font-bold mb-5 text-white group-hover:text-primary-fixed transition-colors leading-tight line-clamp-2">
                              {course.title}
                            </h3>

                            <div className="flex items-center gap-3 mb-6">
                              <img
                                src={course.mentorAvatar}
                                alt={course.mentorName}
                                className="w-10 h-10 rounded-xl object-cover border border-white/10"
                              />
                              <div>
                                <p className="text-sm font-bold text-white">{course.mentorName}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/50">{course.mentorTitle}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <Star className="text-primary-fixed size-4.5" />
                                  <span className="font-bold text-white text-sm">
                                    {course.rating != null ? course.rating.toFixed(1) : "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                  <Clock className="size-4.5" />
                                  <span className="text-sm font-medium">{Math.floor(course.duration / 60)}h</span>
                                </div>
                              </div>
                              <div className="text-xl font-black text-primary-fixed">
                                {formatPrice(course.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredCourses.length === 0 && (
                      <div className="mt-4 text-center py-24 glass-card rounded-3xl border border-white/5">
                        <Search className="mb-6 size-16 text-white/25" />
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy khóa học</h3>
                        <p className="mb-10 text-white/55">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("Tất cả");
                            setSelectedLevel("Tất cả");
                          }}
                          className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-violet-500"
                        >
                          Xóa tất cả bộ lọc
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "my-courses" && (
                <div>
                  <div className="mt-2 mb-6 flex flex-col justify-between gap-8 md:flex-row md:items-end">
                    <div>
                      <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900">Lộ trình của bạn</h2>
                      <p className="max-w-xl text-slate-600">
                        Theo dõi tiến độ học tập và các chứng chỉ bạn đã đạt được trên hành trình chinh phục sự nghiệp.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      {[
                        { label: "Hoàn thành", value: totalCompleted, icon: <ShieldCheck className="text-primary-fixed size-5" /> },
                        { label: "Giờ học", value: `${totalHoursLearned}h`, icon: <Clock className="size-5" /> },
                      ].map((stat, i) => (
                        <div key={i} className="glass-card flex items-center gap-4 rounded-2xl border border-white/5 px-6 py-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-fixed/20 bg-primary-fixed/10">
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-xl font-black text-white">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <RecentActivity items={enrolledCourses} />

                  <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex rounded-xl border border-white/5 bg-white/5 p-1">
                      {["Tất cả", "Đang học", "Đã hoàn thành"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setMyCoursesTab(t)}
                          className={`rounded-lg px-6 py-2.5 text-xs font-bold transition-all ${
                            myCoursesTab === t ? "bg-white/10 text-white shadow-lg" : "text-white/50 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="group relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-[#c4ff47]" />
                      <input
                        type="text"
                        placeholder="Tìm trong khóa học của tôi..."
                        value={myCoursesSearch}
                        onChange={(e) => setMyCoursesSearch(e.target.value)}
                        className="w-full rounded-2xl border border-white/12 bg-white/[0.06] py-3.5 pl-11 pr-5 text-sm text-white placeholder:text-white/45 transition-all focus:outline-none focus:ring-2 focus:ring-[#6E35E8]/35"
                      />
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMyCourses.map((item) => (
                      <EnrolledCourseCard
                        key={item.course.id}
                        item={item}
                        onContinue={() => {
                          if (item.hasPaidAccess) {
                            navigate(`/courses/${item.course.id}/learn`);
                          } else {
                            navigate(
                              `/checkout?type=course&courseId=${item.course.id}&price=${Math.round(item.coursePrice || 0)}`,
                            );
                          }
                        }}
                      />
                    ))}
                  </div>

                  {filteredMyCourses.length === 0 && (
                    <div className="mt-4 rounded-3xl border border-white/5 py-24 text-center glass-card">
                      <span className="material-symbols-outlined mb-6 text-6xl text-white/25">menu_book</span>
                      <h3 className="mb-2 text-2xl font-black text-slate-900">Chưa có khóa học nào</h3>
                      <p className="mb-10 text-white/55">Khám phá các khóa học mới để bắt đầu hành trình của bạn.</p>
                      <button
                        onClick={() => setSearchParams({ tab: "explore" })}
                        className="rounded-full bg-primary-fixed px-10 py-4 font-black text-on-primary-fixed transition-all hover:scale-105"
                      >
                        Khám phá ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

    </div>
  );
}