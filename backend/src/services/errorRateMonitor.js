/**
 * Theo dõi tốc độ lỗi 5xx trong process hiện tại — alert Slack khi vượt ngưỡng.
 * In-memory, per-instance — đủ cho 1 Render instance (cùng giả định với bookingReminderJob.js).
 */
import { sendSlackAlert } from "./alertService.js";

const WINDOW_MS = 5 * 60 * 1000;
const THRESHOLD = 10; // 10 lỗi 5xx / 5 phút coi là bất thường

let timestamps = [];

export function recordServerError() {
  const now = Date.now();
  timestamps.push(now);
  timestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= THRESHOLD) {
    sendSlackAlert(
      `🚨 *Error rate cao*: ${timestamps.length} lỗi 5xx trong ${WINDOW_MS / 60_000} phút qua. Kiểm tra Sentry/logs.`,
      { dedupKey: "error_rate_high", dedupMs: 15 * 60 * 1000 },
    );
  }
}
