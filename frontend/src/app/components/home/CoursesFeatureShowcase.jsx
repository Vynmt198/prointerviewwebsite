import React from "react";
import { HOME_SECTION_INNER } from "../layout/customerShellLayout";
import {
  GraduationCap,
  Lock,
  BookOpen,
  CircleCheck,
  PlayCircle,
  Video,
} from "lucide-react";
import { HOME_DEMO_COURSES } from "../../data/homeLandingDemo";

/** Một khóa mẫu cố định (STAR) — tab lọc chỉ minh họa UI. */
const DEMO_COURSE = HOME_DEMO_COURSES[0];
const DEMO_FILTER_LABELS = ["Phỏng vấn", "Viết CV", "Technical", "Soft skills"];

/** Avatar mentor trên thẻ khóa (mock) — linh vật, không dùng ảnh stock */
const COURSE_CARD_MENTOR_AVATAR = "/mascot-course-card-avatar.png?v=1";
const COURSE_CARD_AVATAR_FALLBACK = "/mascot-courses-ready.png?v=7";

const DEMO_PROGRESS = (() => {
  const a = HOME_DEMO_COURSES[0];
  const b = HOME_DEMO_COURSES[1];
  const aTotal = a?.lessonsCount ?? 12;
  const bTotal = b?.lessonsCount ?? 10;
  const aDone = 3;
  const bDone = 1;
  return [
    {
      id: "1",
      title: a?.title,
      done: aDone,
      total: aTotal,
      pct: Math.round((aDone / aTotal) * 100),
      category: a?.category,
    },
    {
      id: "2",
      title: b?.title,
      done: bDone,
      total: bTotal,
      pct: Math.round((bDone / bTotal) * 100),
      category: b?.category,
    },
  ];
})();

function formatDurationMinutes(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} phút`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function LessonRow({ title, active, preview, locked }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full sm:h-[1.375rem] sm:w-[1.375rem] ${
          active
            ? "bg-[#630ed4] text-white"
            : preview
              ? "bg-lime-100 text-lime-700"
              : locked
                ? "bg-slate-100 text-slate-400"
                : "bg-violet-50 text-violet-400"
        }`}
      >
        {locked ? (
          <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
        ) : preview ? (
          <PlayCircle className="h-2.5 w-2.5" strokeWidth={2.5} />
        ) : (
          <BookOpen className="h-2.5 w-2.5" strokeWidth={2.5} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[11px] font-semibold leading-snug sm:text-xs ${
            active ? "text-[#630ed4]" : locked ? "text-slate-400" : "text-slate-700"
          }`}
        >
          {title}
          {preview ? (
            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-lime-700 sm:text-[10px]">
              · Xem trước
            </span>
          ) : null}
        </span>
      </span>
    </li>
  );
}

function CoursesLearningMockup() {
  if (!DEMO_COURSE) return null;

  const previewLessons = (DEMO_COURSE.lessons || []).filter((l) => l.isPreview).length;
  const displayLessons = (DEMO_COURSE.lessons || []).slice(0, 4);
  const moreLessons = Math.max(0, (DEMO_COURSE.lessonsCount ?? 0) - displayLessons.length);

  return (
    <div className="courses-mock-panel relative w-full overflow-visible rounded-[1.75rem] px-4 pb-5 pt-[5rem] sm:rounded-[2rem] sm:px-5 sm:pb-6 sm:pt-[5.5rem]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-[2] w-[14rem] -translate-x-[calc(50%+12.8rem)] translate-y-[calc(-50%+2.575rem)] sm:w-[16rem]"
        aria-hidden
      >
        <div className="courses-mascot-sticker relative mx-auto w-fit">
          <img
            src="/mascot-courses-ready.png?v=7"
            alt=""
            className="courses-mascot-img block h-auto w-[9.5rem] object-contain sm:w-[11rem]"
          />
          <div className="absolute -right-[3.84rem] top-[0.55rem] z-[1] sm:-right-[4.59rem] sm:top-[0.8rem]">
            <div className="courses-speech-bubble px-2.5 py-1.5 sm:px-3 sm:py-2">
              <p className="whitespace-nowrap font-headline text-[10px] font-bold leading-none text-[#630ed4] sm:text-[11px]">
                Sẵn sàng học chưa?
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none relative z-[1] flex flex-wrap justify-center gap-1.5 rounded-2xl bg-white/70 p-1.5 shadow-sm backdrop-blur-sm sm:gap-2"
        aria-hidden
      >
        {DEMO_FILTER_LABELS.map((label, idx) => (
          <span
            key={label}
            className={`inline-flex items-center rounded-xl px-2.5 py-1.5 text-[11px] font-bold sm:px-3 sm:py-2 sm:text-xs ${
              idx === 0
                ? "bg-[#630ed4] text-white shadow-md shadow-violet-500/25"
                : "text-slate-600"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="relative z-[1] mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-[1.05fr_0.95fr] sm:items-stretch sm:gap-4">
        <div className="flex flex-col rounded-2xl border border-violet-100/80 bg-white p-3.5 shadow-[0_10px_28px_rgba(99,14,212,0.08)] sm:p-4">
          <div className="mb-2 flex items-start gap-2 border-b border-slate-100 pb-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-100 bg-violet-50/90 sm:h-10 sm:w-10">
              <img
                src={COURSE_CARD_MENTOR_AVATAR}
                alt=""
                className="h-[90%] w-[90%] object-contain object-bottom"
                onError={(e) => {
                  if (e.currentTarget.src !== COURSE_CARD_AVATAR_FALLBACK) {
                    e.currentTarget.src = COURSE_CARD_AVATAR_FALLBACK;
                  }
                }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold leading-snug text-[#1a1b23] sm:text-sm">
                {DEMO_COURSE.title}
              </p>
              <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                {DEMO_COURSE.mentorName} · {DEMO_COURSE.mentorCompany}
              </p>
            </div>
          </div>
          <p className="mb-2 text-xs font-bold text-[#630ed4] sm:text-sm">
            Gồm {DEMO_COURSE.lessonsCount} bài video · {formatDurationMinutes(DEMO_COURSE.duration)}
          </p>
          <ul className="space-y-2 border-l-2 border-violet-100 pl-3">
            {displayLessons.map((lesson, idx) => (
              <LessonRow
                key={lesson.id}
                title={lesson.title}
                active={idx === 0}
                preview={!!lesson.isPreview}
                locked={idx > 0 && !lesson.isPreview}
              />
            ))}
          </ul>
          {moreLessons > 0 ? (
            <p className="mt-2 border-l-2 border-transparent pl-3 text-[10px] font-medium text-slate-400 sm:text-[11px]">
              +{moreLessons} bài khác trong khóa
            </p>
          ) : null}
        </div>

        <div className="flex h-full flex-col justify-between gap-2.5 sm:gap-3">
          <div className="rounded-2xl border border-violet-100/80 bg-white px-3.5 py-2.5 shadow-sm sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 sm:text-xs">
              <Video className="h-4 w-4 shrink-0 text-[#630ed4]" />
              Học bằng video từng bài
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-slate-600 sm:text-xs">
              <span className="font-bold text-lime-700">{previewLessons} bài xem trước</span> — thử trước khi
              ghi danh
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Ghi chú theo bài · tiếp tục đúng chỗ đang học
            </p>
          </div>

          {DEMO_PROGRESS.map((mod) => (
            <div
              key={mod.id}
              className="rounded-2xl border border-violet-100/80 bg-white px-3.5 py-2.5 shadow-sm sm:px-4 sm:py-3"
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-800 sm:text-xs">
                  {mod.title}
                </p>
                <span className="shrink-0 text-[11px] font-bold text-[#630ed4]">
                  {mod.done}/{mod.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#630ed4] to-[#9B6DFF]"
                  style={{ width: `${mod.pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">{mod.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Showcase khóa học — layout Upzi, nội dung khớp feature ProInterview. */
export function CoursesFeatureShowcase({ onCtaClick }) {
  return (
    <section
      id="courses"
      className="relative z-10 flex h-screen max-h-screen flex-col justify-center overflow-hidden px-0 py-4 sm:py-6"
    >
      <style>{`
        .courses-mock-panel {
          background: linear-gradient(165deg, #f0ebf8 0%, #ebe4f6 50%, #e6ddf3 100%);
          border: 2px solid rgba(95, 0, 240, 0.4);
          box-shadow: 0 12px 32px rgba(99, 14, 212, 0.1);
        }
        .courses-mascot-img {
          filter: none;
        }
        .courses-speech-bubble {
          position: relative;
          background: #ffffff;
          border-radius: 1.25rem;
          box-shadow: 0 8px 18px -4px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.1);
        }
        .courses-speech-bubble::after {
          content: "";
          position: absolute;
          left: -7px;
          bottom: 10px;
          width: 16px;
          height: 16px;
          background: #ffffff;
          transform: skewX(-20deg);
          border-radius: 4px;
          border-left: 1px solid rgba(124, 58, 237, 0.1);
          border-bottom: 1px solid rgba(124, 58, 237, 0.1);
        }
      `}</style>
      <div className={`relative z-10 flex w-full items-center overflow-visible py-2 ${HOME_SECTION_INNER}`}>
        <div className="mx-auto grid w-full max-w-6xl origin-center scale-x-[1] scale-y-[1.06] grid-cols-1 items-center gap-5 overflow-visible sm:scale-x-[1.02] sm:scale-y-[1.08] lg:grid-cols-[1.12fr_0.88fr] lg:scale-x-[1.05] lg:scale-y-[1.1] lg:items-center lg:gap-5 xl:max-w-[68rem] xl:scale-x-[1.07] xl:scale-y-[1.12]">
          <div className="relative z-10 flex w-full min-w-0 justify-center px-1 sm:px-2">
            <CoursesLearningMockup />
          </div>

          <article className="relative z-10 flex flex-col items-start gap-2.5 pl-1 sm:gap-3 sm:pl-3 lg:pl-0 lg:pr-0 xl:pl-1 xl:pr-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-semibold text-violet-800 sm:text-xs">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Khóa học từ mentor
            </span>
            <h2
              className="max-w-2xl font-headline font-extrabold leading-[1.12] tracking-tight text-[#1a1b23] text-balance"
              style={{ fontSize: "clamp(1.65rem, 3.2vw, 2.45rem)" }}
            >
              <span className="block">Học từ mentor thật</span>
              <span className="block font-headline text-[#5F00F0]">Sửa lỗi liền tay</span>
            </h2>
            <p className="max-w-2xl text-pretty text-[0.9375rem] font-medium leading-relaxed text-slate-600 sm:text-base">
              STAR, viết CV, technical interview… Mỗi khóa do mentor thật biên soạn — xem trước miễn phí, ghi danh qua
              chuyển khoản, học và theo dõi tiến độ trên ProInterview.
            </p>
            <ul className="max-w-2xl space-y-2 text-pretty text-sm font-medium text-slate-600">
              {[
                "Video từng bài + bài preview — học thử trước khi trả phí",
                "Theo dõi % hoàn thành — vào lại đúng bài đang dở",
                "Khóa STAR, viết CV, technical — chọn đúng kỹ năng cần luyện",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#630ed4]" strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {onCtaClick ? (
              <button
                type="button"
                onClick={onCtaClick}
                className="courses-cta-primary mt-1 inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-8 sm:py-3 sm:text-base"
              >
                Xem tất cả khóa học
              </button>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
