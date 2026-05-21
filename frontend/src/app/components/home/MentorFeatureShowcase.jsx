import React from "react";
import { Users, Star, Search, CircleCheck } from "lucide-react";
import { SparkleGlyph } from "../decor/SparkleGlyph.jsx";
import { MENTORS } from "../../data/mockData";

const HOME_MENTORS = MENTORS.slice(0, 2);
const FEATURED = HOME_MENTORS[0];
const FEATURED_ALT = HOME_MENTORS[1];

/** Linh vật mentor — 3 pose riêng, chia nhau các ô trên Home */
export const HOME_MENTOR_MASCOTS = {
  cv: "/mascot-mentor-avatar-cv.png?v=1",
  headset: "/mascot-mentor-avatar-headset.png?v=1",
  pro: "/mascot-mentor-avatar-pro.png?v=1",
  fallback: "/mascot-courses-ready.png?v=7",
};

const MENTOR_CARD_MASCOTS = {
  primary: HOME_MENTOR_MASCOTS.headset,
  secondary: HOME_MENTOR_MASCOTS.pro,
  fallback: HOME_MENTOR_MASCOTS.fallback,
};

/** Mỗi ô một con — composite gốc (không đổi khi chỉ swap avatar thẻ) */
const PANEL_MASCOTS = [
  {
    src: "/mascot-mentor-find.png?v=4",
    fallback: HOME_MENTOR_MASCOTS.fallback,
    className:
      "mentor-sticker-glow max-h-[8.25rem] w-auto max-w-[88%] translate-x-[6.6rem] object-contain object-bottom sm:max-h-[9.25rem]",
  },
  {
    src: "/mascot-mentor-booking.png?v=3",
    fallback: HOME_MENTOR_MASCOTS.fallback,
    className:
      "mentor-sticker-glow max-h-[8.25rem] w-auto max-w-[92%] -translate-y-[9.8rem] object-contain object-bottom sm:max-h-[9.25rem] sm:-translate-y-[10.3rem]",
  },
  {
    src: "/mascot-mentor-feedback.png?v=3",
    fallback: HOME_MENTOR_MASCOTS.fallback,
    className:
      "mentor-sticker-glow max-h-[8.75rem] w-auto max-w-full -translate-x-[0.4rem] -translate-y-[0.8rem] object-contain object-bottom sm:max-h-[9.5rem]",
  },
];

const UPZI_STEPS = [
  {
    step: "01",
    title: "Tìm đúng mentor",
    description: "Lọc ngành, kinh nghiệm, giá, rating — xem profile và review trước khi book.",
  },
  {
    step: "02",
    title: "Đặt buổi mock 1:1",
    description: "Chọn slot, thanh toán dễ dàng — thao tác đơn giản.",
  },
  {
    step: "03",
    title: "Nhận góp ý cụ thể",
    description: "Góp ý rõ, tự tin hơn — báo cáo buổi mock lưu trên nền tảng.",
  },
];

function PanelMascot({ panelIndex }) {
  const asset = PANEL_MASCOTS[panelIndex];
  if (!asset) return null;

  const slotClass =
    panelIndex === 0
      ? "h-[52%] min-h-[10.5rem] max-h-none items-end justify-center overflow-visible"
      : "h-[40%] max-h-[7.75rem] items-end justify-center overflow-hidden";
  const slotZ = "z-[3]";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${slotZ} flex ${slotClass}`}
      aria-hidden
    >
      <img
        src={asset.src}
        alt=""
        className={asset.className}
        onError={(e) => {
          if (e.currentTarget.src !== asset.fallback) {
            e.currentTarget.src = asset.fallback;
          }
        }}
      />
    </div>
  );
}

function MentorMascotAvatar({ src, className = "h-8 w-8" }) {
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-violet-200/80 bg-violet-50/90`}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        className="h-[88%] w-[88%] object-contain object-bottom"
        onError={(e) => {
          if (e.currentTarget.src !== MENTOR_CARD_MASCOTS.fallback) {
            e.currentTarget.src = MENTOR_CARD_MASCOTS.fallback;
          }
        }}
      />
    </span>
  );
}

function MentorMiniCard({ mentor, mascotSrc, className }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <MentorMascotAvatar src={mascotSrc} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold text-slate-900">{mentor.name}</p>
          <p className="text-[8px] text-slate-500">{mentor.company}</p>
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-bold text-[#630ed4]">
          <Star className="h-3 w-3 fill-[#9B6DFF] text-[#630ed4]" />
          {mentor.rating}
        </span>
      </div>
    </div>
  );
}

/** Ô 1 — thẻ xếp chồng (kiểu Upzi trái) */
function FindMentorVisual() {
  if (!FEATURED) return null;
  return (
    <div className="relative z-[1] flex h-full flex-col px-3 pb-2 pt-8 sm:px-3.5 sm:pt-9">
      <div className="relative mx-auto w-[88%] flex-1 -translate-y-[1.15rem] pb-[5.75rem] sm:pb-[6.5rem]">
        <div className="absolute left-0 right-4 top-0 z-[1] rotate-[-2deg] rounded-2xl bg-white p-2 shadow-lg">
          <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1">
            <Search className="h-3 w-3 text-[#630ed4]" />
            <span className="text-[8px] font-semibold text-slate-600">IT · 4.5+ · dưới 400k</span>
          </div>
        </div>
        <div className="absolute left-2 right-1 top-8 z-[2]">
          <MentorMiniCard
            mentor={FEATURED}
            mascotSrc={MENTOR_CARD_MASCOTS.primary}
            className="rotate-[1deg] rounded-2xl border border-violet-100 bg-white p-2 shadow-xl"
          />
        </div>
        <div className="absolute right-0 top-[4.5rem] z-[10] rounded-xl bg-white px-2.5 py-1.5 shadow-md ring-1 ring-violet-100">
          <p className="whitespace-nowrap text-[8px] font-bold leading-none text-[#630ed4]">
            {FEATURED.reviews} review
          </p>
        </div>
        {FEATURED_ALT ? (
          <>
            <div className="absolute left-4 right-0 top-[5.2rem] z-[3]">
              <MentorMiniCard
                mentor={FEATURED_ALT}
                mascotSrc={MENTOR_CARD_MASCOTS.secondary}
                className="rotate-[-1.5deg] rounded-2xl border border-violet-100/80 bg-white p-2 shadow-lg"
              />
            </div>
            <div className="absolute right-0 top-[7.75rem] z-[10] rounded-xl bg-white px-2.5 py-1.5 shadow-md ring-1 ring-violet-100">
              <p className="whitespace-nowrap text-[8px] font-bold leading-none text-[#630ed4]">
                {FEATURED_ALT.reviews} review
              </p>
            </div>
          </>
        ) : null}
      </div>
      <PanelMascot panelIndex={0} />
    </div>
  );
}

/** Ô 2 — mock đặt lịch thành công + gấu giữa */
function BookingVisual() {
  if (!FEATURED) return null;
  return (
    <div className="relative z-[1] flex h-full flex-col items-center px-3 pb-8 pt-4 sm:px-4 sm:pb-10">
      <SparkleGlyph className="absolute right-3 top-8 z-[2] h-8 w-8 opacity-80" />
      <SparkleGlyph className="absolute left-2 top-14 z-[2] h-7 w-7 opacity-60" />
      <div className="relative mt-auto flex min-h-[11rem] w-[86%] flex-col justify-end translate-y-[2rem] sm:min-h-[12rem]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end justify-center"
          aria-hidden
        >
          <img
            src={PANEL_MASCOTS[1].src}
            alt=""
            className={PANEL_MASCOTS[1].className}
            onError={(e) => {
              const fb = PANEL_MASCOTS[1].fallback;
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
            }}
          />
        </div>
        <div className="relative z-[5] mb-1 w-full rounded-lg bg-white p-2.5 shadow-xl sm:p-3">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100">
            <CircleCheck className="h-5 w-5 text-[#630ed4]" strokeWidth={2.5} />
          </div>
          <p className="mt-1.5 text-[10px] font-extrabold leading-snug text-[#630ed4]">
            Đặt lịch thành công!
          </p>
          <span className="mt-1 rounded-md bg-violet-50 px-2.5 py-0.5 text-[7px] font-bold text-[#630ed4]">
            Mã BK-2847
          </span>
        </div>

        <div className="mt-2.5 space-y-1.5 rounded-md border border-violet-200 bg-violet-50/90 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[7px] font-semibold text-slate-500">Thời gian</span>
            <span className="text-[8px] font-bold text-slate-900">Thứ 5, 22/05 · 19:00</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[7px] font-semibold text-slate-500">Mentor</span>
            <span className="truncate text-[8px] font-bold text-slate-900">{FEATURED.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[7px] font-semibold text-slate-500">Buổi học</span>
            <span className="text-[8px] font-bold text-slate-900">Mock online · 60 phút</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-violet-200/80 pt-1">
            <span className="text-[7px] font-semibold text-slate-500">Trạng thái</span>
            <span className="rounded-md bg-[#630ed4] px-2 py-0.5 text-[7px] font-bold text-white">
              Đã đặt
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

const AFTER_MOCK_POINTS = [
  { title: "Góp ý dễ hiểu", detail: "Mentor chỉ rõ điểm mạnh và phần cần chỉnh" },
  { title: "Tự tin hơn", detail: "Biết cách trả lời khi bước vào vòng phỏng vấn thật" },
  { title: "Lưu trên app", detail: "Báo cáo buổi mock gửi về — xem lại bất cứ lúc nào" },
  { title: "Biết bước tiếp", detail: "Rõ nên ôn gì trước và luyện tiếp  " },
];

/** Ô 3 — gấu đè lên khung trắng (z cao hơn card) */
function FeedbackVisual() {
  const mascot = PANEL_MASCOTS[2];

  return (
    <div className="relative z-[1] flex h-full flex-col px-2 pb-4 pt-6 sm:px-2.5 sm:pb-5 sm:pt-7">
      <div className="relative flex h-full min-h-0 flex-1 translate-x-[0.4rem] flex-col overflow-visible">
        <div className="relative z-[1] ml-auto flex h-full min-h-0 w-[72%] min-w-0 max-w-[12.25rem] flex-1 -translate-x-[0.9rem] flex-col pb-0.5 pr-0.5 sm:w-[70%] sm:max-w-[13rem]">
          <p className="mb-1.5 shrink-0 text-[11px] font-bold leading-snug text-[#630ed4] sm:text-[12px]">
            Sau buổi mock, bạn nhận được
          </p>
          <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-3 shadow-xl sm:p-3.5">
            <ul className="flex flex-1 flex-col justify-center gap-2.5 py-0.5 sm:gap-3">
              {AFTER_MOCK_POINTS.map((item) => (
                <li key={item.title} className="flex items-start gap-2">
                  <CircleCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#630ed4] sm:h-[1.125rem] sm:w-[1.125rem]"
                    strokeWidth={2.5}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold leading-snug text-slate-900 sm:text-[11px]">
                      {item.title}
                    </p>
                    <p className="text-[9px] font-medium leading-snug text-slate-600 sm:text-[10px]">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex items-end justify-start overflow-visible pl-1 sm:pl-0.5"
          aria-hidden
        >
          <img
            src={mascot.src}
            alt=""
            className={mascot.className}
            onError={(e) => {
              if (e.currentTarget.src !== mascot.fallback) {
                e.currentTarget.src = mascot.fallback;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

const VISUALS = [FindMentorVisual, BookingVisual, FeedbackVisual];

function UpziStepCard({ step, index }) {
  const Visual = VISUALS[index];

  return (
    <div
      className="mentor-upzi-step flex min-w-0 flex-1 flex-col"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div
        className={`mentor-upzi-panel relative aspect-[1/0.92] w-full rounded-[1.35rem] shadow-[0_12px_32px_rgba(99,14,212,0.1)] sm:rounded-[1.5rem] sm:aspect-[1/0.88] ${
          index === 0 || index === 1 || index === 2 ? "overflow-visible" : "overflow-hidden"
        }`}
      >
        <Visual />
      </div>
      <h3 className="mt-2.5 font-headline text-sm font-extrabold leading-snug text-[#1a1b23] sm:text-[15px]">
        {step.title}
      </h3>
      <p className="mt-1 text-pretty text-[11px] font-medium leading-relaxed text-slate-600">
        {step.description}
      </p>
    </div>
  );
}

/** Showcase mentor — Upzi layout, tím chấm bi, CTA lime. */
export function MentorFeatureShowcase({ onCtaClick }) {
  return (
    <section
      id="find-mentor"
      className="relative z-10 flex h-screen max-h-screen flex-col justify-center overflow-x-hidden overflow-y-visible px-0 py-4 sm:py-6"
    >
      <style>{`
        .mentor-upzi-panel {
          background-color: #cfc0f5;
          background-image:
            radial-gradient(circle at 50% 0%, rgba(99, 14, 212, 0.18) 0%, transparent 52%),
            radial-gradient(circle, rgba(255, 255, 255, 0.38) 1.75px, transparent 2px),
            radial-gradient(circle, rgba(99, 14, 212, 0.08) 1.75px, transparent 2px),
            linear-gradient(165deg, #e4d8fc 0%, #d8caf8 42%, #cfc0f5 100%);
          background-size: 100% 100%, 20px 20px, 20px 20px, 100% 100%;
          background-position: center top, 0 0, 10px 10px, 0 0;
          border: 2px solid rgba(95, 0, 240, 0.4);
        }
        @keyframes mentor-upzi-rise {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .mentor-upzi-step {
          animation: mentor-upzi-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mentor-sticker-glow {
          filter: drop-shadow(0 14px 28px rgba(99, 14, 212, 0.22));
        }
        .mentor-showcase-uniform {
          --mentor-scale: 1.05;
          width: calc(100% / var(--mentor-scale));
          max-width: calc(72rem / var(--mentor-scale));
          margin-inline: auto;
          transform: scale(var(--mentor-scale));
          transform-origin: center center;
        }
        @media (min-width: 640px) {
          .mentor-showcase-uniform {
            --mentor-scale: 1.06;
          }
        }
        @media (min-width: 1024px) {
          .mentor-showcase-uniform {
            --mentor-scale: 1.065;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mentor-upzi-step {
            animation: none;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-7xl overflow-visible px-5 py-2">
        <div className="mentor-showcase-uniform flex w-full flex-col gap-4 sm:gap-5">
          <article className="flex flex-col items-start gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-[11px] font-semibold text-violet-800 sm:text-xs">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Mentor 1:1 thật
            </span>
            <h2
              className="max-w-2xl font-headline font-extrabold leading-[1.1] tracking-tight text-[#1a1b23]"
              style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.55rem)" }}
            >
              <span className="block">Luyện AI xong rồi?</span>
              <span className="block font-headline text-[#5F00F0]">gặp mentor chiến tiếp</span>
            </h2>
          </article>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
            {UPZI_STEPS.map((step, idx) => (
              <UpziStepCard key={step.title} step={step} index={idx} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
