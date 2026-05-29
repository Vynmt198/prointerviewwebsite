import { fetchBookedSlots } from "./bookingsApi";
import { fetchMentorAvailability } from "./mentorApi";

function toBookingDateFormat(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  if (s.includes(",")) {
    const tail = s.split(",").pop().trim();
    const parts = tail.split("/").map((p) => p.trim());
    if (parts.length === 3) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
    if (parts.length === 2) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
    return tail;
  }
  const parts = s.split("/").map((p) => p.trim());
  if (parts.length === 3) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
  if (parts.length === 2) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  return s;
}

/**
 * Danh sách slot trống của mentor cho form đổi lịch.
 * @param {string} mentorId
 * @param {{ excludeBookingId?: string }} [opts] — bỏ qua slot của chính booking đang đổi (nếu API trả booked)
 */
export async function loadMentorRescheduleSlotOptions(mentorId, opts = {}) {
  if (!mentorId) return [];

  const [availability, bookedRes] = await Promise.all([
    fetchMentorAvailability(mentorId),
    fetchBookedSlots(mentorId),
  ]);

  if (!availability?.availableSlots) return [];

  const bookedMap = bookedRes.success ? bookedRes.booked || {} : {};
  const options = [];

  for (const [date, slots] of Object.entries(availability.availableSlots || {})) {
    const bookingDate = toBookingDateFormat(date);
    for (const slot of Array.isArray(slots) ? slots : []) {
      const taken = Array.isArray(bookedMap[date]) ? bookedMap[date].includes(slot) : false;
      if (!taken) {
        options.push({ date: bookingDate, slot, label: `${bookingDate} • ${slot}` });
      }
    }
  }

  options.sort((a, b) => `${a.date} ${a.slot}`.localeCompare(`${b.date} ${b.slot}`));
  return options;
}
