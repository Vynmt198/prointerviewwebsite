import { formatApiError } from "../utils/apiErrors.js";
import { Sentry, isSentryEnabled } from "../config/sentry.js";
import { recordServerError } from "../services/errorRateMonitor.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Không tìm thấy API ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
export function globalErrorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }
  const { status, error } = formatApiError(err);
  if (status >= 500) {
    console.error("[API]", req.method, req.originalUrl, err);
    if (isSentryEnabled()) Sentry.captureException(err);
    recordServerError();
  }
  res.status(status).json({ success: false, error });
}
