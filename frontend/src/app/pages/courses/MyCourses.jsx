import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { enrollmentApi } from "../../api/enrollmentApi.js";
import { toastApiError } from "../../utils/shared/apiToast.js";
import { normalizeCourseStats } from "../../utils/course/courseStats.js";
import { enrollmentAccessGranted } from "../../utils/course/enrollmentAccess.js";
import { mediaSrc, DEFAULT_COURSE_THUMB, avatarSrc } from "../../utils/shared/mediaUrl.js";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import {
  CustomerPageHeader,
  CustomerPageSplitTitle,
} from "../../components/layout/CustomerPageHeader";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";

function ProgressBar({ pct, completed }) {
  const value = Math.min(100, Math.max(0, Number(pct) || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className={completed ? "text-emerald-700" : "text-slate-500"}>
          {completed ? "Đã hoàn thành" : "Tiến độ học"}
        </span>
        <span className={`tabular-nums ${completed ? "text-emerald-800" : "text-[#8037f4]"}`}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-violet-100/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            completed
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-gradient-to-r from-violet-400 to-[#8037f4]"
          }`}
          style={{ width: `${Math.max(value, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function CourseCard({ item, onContinue, onDetails }) {
  const { course, progressPct, isCompleted, hasPaidAccess } = item;
  const description =
    course.description?.trim() ||
    `Khóa học từ ${course.mentorName || "mentor"} — học theo lộ trình video ngắn, dễ áp dụng.`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-violet-200/60 bg-white shadow-[0_4px_24px_rgba(128,55,244,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-[0_12px_40px_rgba(128,55,244,0.12)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-violet-50">
        <ImageWithFallback
          src={course.thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
        {isCompleted ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
            <CheckCircle2 className="size-3" />
            Hoàn thành
          </span>
        ) : progressPct > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-[#8037f4] shadow-sm">
            {progressPct}%
          </span>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          {course.mentorAvatar ? (
            <img
              src={course.mentorAvatar}
              alt=""
              className="size-8 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-xs font-bold text-white shadow-sm">
              {(course.mentorName || "M").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-white drop-shadow-sm">{course.mentorName}</p>
            <p className="flex items-center gap-1 text-[10px] font-medium text-white/90">
              <Clock className="size-3" />
              {course.lessonsCount} bài học
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 font-headline text-base font-black leading-snug text-slate-900 transition-colors group-hover:text-[#8037f4]">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>

        <div className="mt-4">
          <ProgressBar pct={progressPct} completed={isCompleted} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasPaidAccess ? (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8037f4] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(128,55,244,0.35)] transition-all hover:bg-[#6d2fd6] sm:text-sm"
            >
              <PlayCircle className="size-4 shrink-0" />
              {isCompleted ? "Xem lại" : progressPct > 0 ? "Tiếp tục học" : "Bắt đầu học"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDetails}
            className={`inline-flex items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-2.5 text-xs font-bold text-[#8037f4] transition-colors hover:bg-violet-100 sm:text-sm ${
              hasPaidAccess ? "" : "flex-1"
            }`}
          >
            Chi tiết
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryStat({ icon: Icon, label, value, tintClass, iconClass }) {
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md ${tintClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-black tabular-nums leading-none text-slate-900 sm:text-[1.75rem]">{value}</p>
          <p className="mt-2 text-xs font-medium leading-snug text-slate-500">{label}</p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm ${iconClass}`}
        >
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
}

function SummaryStrip({ total, completed, remaining, avgPct }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <SummaryStat
        icon={BookOpen}
        label="Khóa đã mua"
        value={total}
        tintClass="border-violet-100/90 from-violet-50/70 to-white"
        iconClass="text-[#8037f4]"
      />
      <SummaryStat
        icon={CheckCircle2}
        label="Đã hoàn thành"
        value={completed}
        tintClass="border-emerald-100/90 from-emerald-50/60 to-white"
        iconClass="text-emerald-600"
      />
      <SummaryStat
        icon={PlayCircle}
        label="Còn lại"
        value={remaining}
        tintClass="border-amber-100/80 from-amber-50/50 to-white"
        iconClass="text-amber-600"
      />
      <SummaryStat
        icon={TrendingUp}
        label="Tiến độ trung bình"
        value={`${avgPct}%`}
        tintClass="border-slate-200/80 from-slate-50/80 to-white"
        iconClass="text-slate-600"
      />
    </div>
  );
}

function EmptyCourses({ onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <div className="relative mb-8 flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-100 to-violet-50" />
        <div className="absolute -right-2 top-4 flex size-11 items-center justify-center rounded-2xl bg-[#8037f4] text-white shadow-lg">
          <Sparkles className="size-5" />
        </div>
        <div className="relative flex size-28 items-center justify-center rounded-3xl border-2 border-dashed border-violet-200 bg-white shadow-md">
          <GraduationCap className="size-14 text-violet-300" strokeWidth={1.25} />
        </div>
      </div>
      <h2 className="font-headline text-xl font-black text-slate-900 sm:text-2xl">Bạn chưa mua khóa học nào</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Khám phá khóa học từ mentor — luyện kỹ năng phỏng vấn, CV và soft skills theo lộ trình video ngắn.
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#8037f4] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(128,55,244,0.35)] transition-all hover:bg-[#6d2fd6] hover:shadow-[0_12px_32px_rgba(128,55,244,0.4)]"
      >
        <BookOpen className="size-4" />
        Khám phá khóa học
      </button>
    </div>
  );
}

export function MyCourses() {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentApi.getMyEnrollments();
      if (res.success) {
        const mapped = res.enrollments
          .filter((e) => e.courseId)
          .map((e) => {
            const c = e.courseId;
            const lessons = (c.modules || []).flatMap((module) =>
              (module.lessons || []).map((lesson) => ({
                id: String(lesson._id),
                title: lesson.title,
                duration: lesson.durationMinutes || 0,
              })),
            );
            const completedLessonIds = (e.completedLessons || []).map((id) => String(id));
            const totalCount = lessons.length || c.totalLessons || 1;
            const pct = Math.round((completedLessonIds.length / totalCount) * 100);
            const { rating } = normalizeCourseStats(c.stats);

            return {
              course: {
                id: c._id,
                title: c.title,
                description: c.description || c.shortDescription || "",
                thumbnail: mediaSrc(c.thumbnail, DEFAULT_COURSE_THUMB),
                mentorName: c.mentorId?.userId?.name || "Mentor",
                mentorAvatar: avatarSrc(c.mentorId?.userId?.avatar),
                rating,
                lessonsCount: totalCount,
                lessons,
              },
              progressPct: pct,
              isCompleted: pct === 100,
              hasPaidAccess: enrollmentAccessGranted(e),
              coursePrice: Number(c.price ?? 0),
            };
          });
        setEnrolledCourses(mapped);
      } else {
        toastApiError(res.error, "Không thể tải danh sách khóa học.");
      }
    } catch {
      toastApiError("Lỗi kết nối khi tải khóa học của bạn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const total = enrolledCourses.length;
    const completed = enrolledCourses.filter((c) => c.isCompleted).length;
    const remaining = total - completed;
    const avgPct =
      total > 0
        ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progressPct, 0) / total)
        : 0;
    return { total, completed, remaining, avgPct };
  }, [enrolledCourses]);

  return (
    <MentorPageShell bottomPad="pb-20">
      <div className={`relative z-10 flex flex-col pb-10 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className={`${CUSTOMER_SHELL_MAX} w-full`}>
          <CustomerPageHeader
            title={<CustomerPageSplitTitle accent="Khóa học" rest="của bạn" />}
            subtitle="Tiếp tục xem lại bài cũ và theo dõi tiến độ trong các khóa đã mua."
            className="mb-5"
          />

          {!loading && enrolledCourses.length > 0 ? <SummaryStrip {...summary} /> : null}

          <div className="overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-b from-violet-50/40 via-white to-white p-4 shadow-[0_8px_32px_rgba(128,55,244,0.06)] sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
                <div className="size-11 animate-spin rounded-full border-4 border-[#8037f4] border-t-transparent" />
                <p className="text-sm font-semibold text-slate-500">Đang tải khóa học của bạn…</p>
              </div>
            ) : enrolledCourses.length === 0 ? (
              <EmptyCourses onBrowse={() => navigate("/courses")} />
            ) : (
              <div className="grid grid-cols-1 gap-5 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[1100px]:gap-6">
                {enrolledCourses.map((item) => (
                  <CourseCard
                    key={item.course.id}
                    item={item}
                    onContinue={() => navigate(`/courses/${item.course.id}/learn`)}
                    onDetails={() => navigate(`/courses/${item.course.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
