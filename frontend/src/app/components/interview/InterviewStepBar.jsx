import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Nguồn CV" },
  { n: 2, label: "Chọn HR" },
  { n: 3, label: "Phỏng vấn" },
];

/** Thanh 3 bước — setup (#/interview) và phòng chờ (#/interview/room) */
export function InterviewStepBar({ current = 1, className = "" }) {
  const items = [];

  STEPS.forEach((s, index) => {
    if (index > 0) {
      const lineDone = s.n <= current;
      items.push(
        <li
          key={`line-${s.n}`}
          aria-hidden
          className={`mx-1 mt-[1.125rem] h-0.5 w-10 shrink-0 rounded-full sm:mx-2 sm:w-14 ${
            lineDone ? "bg-violet-500" : "bg-violet-200"
          }`}
        />
      );
    }

    const done = s.n < current;
    const active = s.n === current;

    items.push(
      <li key={s.n} className="flex shrink-0 flex-col items-center gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            active || done
              ? "bg-[#630ed4] text-white shadow-[0_4px_14px_rgba(110,53,232,0.28)]"
              : "border-2 border-violet-200 bg-white text-violet-400"
          }`}
        >
          {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : s.n}
        </span>
        <span
          className={`whitespace-nowrap text-center text-[11px] font-bold uppercase tracking-wide sm:text-xs ${
            active ? "text-[#630ed4]" : done ? "text-violet-800" : "text-violet-400"
          }`}
        >
          {s.label}
        </span>
      </li>
    );
  });

  return (
    <ol
      className={`mb-8 flex w-full list-none items-start justify-center ${className}`.trim()}
      aria-label="Tiến trình phỏng vấn"
    >
      {items}
    </ol>
  );
}
