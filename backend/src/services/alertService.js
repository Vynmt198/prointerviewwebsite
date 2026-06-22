/**
 * alertService.js
 * Gửi alert vận hành (cost spike, error rate cao, ...) vào Slack qua Incoming Webhook.
 * Fire-and-forget — không bao giờ throw, không block flow chính.
 *
 * Env vars:
 *   SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
 */
import { logger } from "../config/logger.js";

function webhookUrl() {
  return process.env.SLACK_ALERT_WEBHOOK_URL?.trim() ?? "";
}

export function isSlackAlertEnabled() {
  return Boolean(webhookUrl());
}

// Tránh spam Slack: mỗi alert "key" tối đa 1 lần / cửa sổ thời gian (mặc định 1h).
const lastSentAt = new Map();
const DEFAULT_DEDUP_MS = 60 * 60 * 1000;

/**
 * @param {string} text - Nội dung alert (Markdown Slack)
 * @param {object} [opts]
 * @param {string} [opts.dedupKey] - Nếu set, chặn gửi lặp cùng key trong `dedupMs`
 * @param {number} [opts.dedupMs=3600000]
 */
export function sendSlackAlert(text, opts = {}) {
  if (!isSlackAlertEnabled()) {
    logger.warn("slack_alert_skip_not_configured", { text: text.slice(0, 200) });
    return;
  }

  const { dedupKey, dedupMs = DEFAULT_DEDUP_MS } = opts;
  if (dedupKey) {
    const last = lastSentAt.get(dedupKey);
    if (last && Date.now() - last < dedupMs) return;
    lastSentAt.set(dedupKey, Date.now());
  }

  fetch(webhookUrl(), {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text }),
    signal:  AbortSignal.timeout(10_000),
  })
    .then((res) => {
      if (!res.ok) logger.warn("slack_alert_send_failed", { status: res.status });
    })
    .catch((err) => logger.warn("slack_alert_send_failed", { error: err.message }));
}
