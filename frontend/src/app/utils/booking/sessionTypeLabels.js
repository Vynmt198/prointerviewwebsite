/** Nhãn loại buổi mentor — đồng bộ toàn app mentor/booking. */
const SESSION_TYPE_LABELS = {
  mock_interview: "Phỏng vấn giả lập",
  "mock-interview": "Phỏng vấn giả lập",
  cv_review: "Xem xét CV",
  "cv-review": "Xem xét CV",
  career_consulting: "Tư vấn nghề nghiệp",
  "career-consulting": "Tư vấn nghề nghiệp",
  custom: "Buổi mentor",
};

/** Tuỳ chọn loại buổi khi đặt lịch — khớp backend SESSION_TYPES. */
export const BOOKING_SESSION_TYPE_OPTIONS = [
  {
    value: "mock_interview",
    label: "Phỏng vấn giả lập",
    hint: "Luyện phỏng vấn 1:1, nhận feedback thực chiến",
  },
  {
    value: "cv_review",
    label: "Xem xét CV",
    hint: "Mentor review CV và gợi ý chỉnh sửa cụ thể",
  },
  {
    value: "career_consulting",
    label: "Tư vấn nghề nghiệp",
    hint: "Định hướng lộ trình, chiến lược apply và đàm phán offer",
  },
  {
    value: "custom",
    label: "Buổi mentor",
    hint: "Chủ đề linh hoạt theo thỏa thuận với mentor",
  },
];

export function resolveMentorSessionTypeOptions(mentor) {
  const fromApi = Array.isArray(mentor?.sessionTypes) ? mentor.sessionTypes : [];
  if (!fromApi.length) return BOOKING_SESSION_TYPE_OPTIONS;
  const allowed = new Set(fromApi.map((s) => s?.type).filter(Boolean));
  const filtered = BOOKING_SESSION_TYPE_OPTIONS.filter((o) => allowed.has(o.value));
  return filtered.length ? filtered : BOOKING_SESSION_TYPE_OPTIONS;
}

export function resolveSessionTypePrice(mentor, sessionType) {
  const st = Array.isArray(mentor?.sessionTypes)
    ? mentor.sessionTypes.find((s) => s?.type === sessionType)
    : null;
  if (st && Number(st.price) > 0) return Math.round(Number(st.price));
  return Math.round(Number(mentor?.price ?? mentor?.pricePerHour ?? 0));
}

export function sessionTypeLabel(sessionType, fallback = "Buổi mentor") {
  const raw = String(sessionType || "").trim();
  if (!raw) return fallback;
  if (SESSION_TYPE_LABELS[raw]) return SESSION_TYPE_LABELS[raw];
  const norm = raw.toLowerCase().replace(/-/g, "_");
  return SESSION_TYPE_LABELS[norm] ?? fallback;
}

export function parseMentorNotesSections(notes) {
  const text = String(notes || "");
  const strengths = [];
  const weaknesses = [];
  const mStrong = text.match(/Điểm mạnh:\s*([^\n]+)/i);
  const mWeak = text.match(/Cần cải thiện:\s*([^\n]+)/i);
  if (mStrong?.[1]?.trim()) strengths.push(mStrong[1].trim());
  if (mWeak?.[1]?.trim()) weaknesses.push(mWeak[1].trim());
  const feedback = text
    .replace(/Điểm mạnh:\s*[^\n]+/gi, "")
    .replace(/Cần cải thiện:\s*[^\n]+/gi, "")
    .trim();
  return { strengths, weaknesses, feedback };
}
