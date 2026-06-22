/**
 * Sentry error tracking — optional, env-gated (SENTRY_DSN).
 * Phải init càng sớm càng tốt trong entry point (server.js), trước khi import app.js.
 */
import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;
  if (initialized) return true;

  Sentry.init({
    dsn,
    environment:       process.env.NODE_ENV || "development",
    tracesSampleRate:  Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  });
  initialized = true;
  return true;
}

export function isSentryEnabled() {
  return initialized;
}

export { Sentry };
