/**
 * Cỡ chữ thống nhất — các section Home (showcase, how-it-works, testimonials).
 * Hero headline riêng (lớn hơn section).
 */
// Hero headline — tăng lại 1 bậc so với bản trước
export const HOME_HERO_TITLE_CLAMP = "clamp(2.0rem, 7vw, 8.5rem)";
/** Tiêu đề section Home (how-it-works, CV, Mentor, Khóa học, testimonials). */
export const HOME_SECTION_TITLE_CLAMP = "clamp(2.25rem, 3.5vw, 3.25rem)";

/** Mô tả / bullet section Home — một cỡ chữ cho CV, Khóa học, Mentor, How-it-works, testimonials */
const HOME_SECTION_BODY =
  "text-pretty text-lg font-medium leading-relaxed text-slate-600 sm:text-xl";

export const homeSectionClasses = {
  badge:
    "inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-sm font-semibold text-violet-700 sm:text-base",
  /** gap-[0.25rem] = khoảng cách cố định giữa 2 dòng tiêu đề */
  title:
    "flex max-w-2xl flex-col gap-[0.25rem] font-headline font-extrabold leading-none tracking-tight text-[#1a1b23]",
  titleLineDark: "block w-full text-slate-900",
  titleLineAccent: "block w-full text-[#6d2fd6]",
  titleLineSecond: "block w-full",
  body: `max-w-2xl ${HOME_SECTION_BODY}`,
  cvShowcaseBadge:
    "inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 font-semibold text-violet-700 text-[0.975rem] sm:text-[1.1rem]",
  cvShowcaseBody:
    "max-w-2xl text-pretty text-base font-medium leading-relaxed text-slate-600 sm:text-xl",
  coursesBody:
    "max-w-2xl text-pretty text-base font-medium leading-relaxed text-slate-600 sm:text-xl",
  coursesBulletList:
    "max-w-2xl space-y-3 text-pretty text-base font-medium leading-relaxed text-slate-600 sm:text-xl",
  bulletList: `max-w-2xl space-y-3 ${HOME_SECTION_BODY}`,
  bulletIcon: "mt-0.5 h-5 w-5 shrink-0 text-[#6d2fd6]",
  cta: "inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-8 sm:py-3 sm:text-xl",
  cardTitle: "font-headline text-xl font-bold text-[#1a1b23] md:text-2xl",
  cardScore: "shrink-0 rounded-2xl border px-4 py-1.5 text-base font-bold sm:text-lg",
  stepCardTitle:
    "font-headline text-lg font-extrabold leading-snug text-[#1a1b23] sm:text-xl",
  stepCardBody:
    "text-pretty text-base font-medium leading-relaxed text-slate-600 sm:text-xl",
  howItWorksTitle:
    "cute-heading text-pretty font-headline font-black leading-[1.06] tracking-tighter text-slate-900",
  howItWorksStepTitle:
    "mb-2 font-headline text-sm font-extrabold leading-snug tracking-tight text-slate-900 sm:text-base lg:text-[0.9375rem] xl:text-base",
  howItWorksStepBody:
    "flex-1 text-left text-pretty text-sm font-medium leading-relaxed text-slate-600 sm:text-base lg:min-h-[5.1rem]",
  howItWorksStepBadge:
    "inline-flex px-2 py-1 text-[10px] font-bold tracking-wide rounded-md border sm:text-[11px]",
};
