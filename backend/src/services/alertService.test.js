/**
 * Unit test: Slack alert — dedup theo key, skip khi chưa cấu hình webhook.
 */
import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sendSlackAlert, isSlackAlertEnabled } from "./alertService.js";

const ORIGINAL_ENV = { ...process.env };
const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...ORIGINAL_ENV };
});

describe("alertService", () => {
  beforeEach(() => {
    process.env.SLACK_ALERT_WEBHOOK_URL = "https://hooks.slack.com/services/fake/test/webhook";
  });

  it("isSlackAlertEnabled() = false khi thiếu SLACK_ALERT_WEBHOOK_URL", () => {
    delete process.env.SLACK_ALERT_WEBHOOK_URL;
    assert.equal(isSlackAlertEnabled(), false);
  });

  it("isSlackAlertEnabled() = true khi có webhook url", () => {
    assert.equal(isSlackAlertEnabled(), true);
  });

  it("gửi alert gọi đúng 1 lần fetch tới webhook URL", async () => {
    let callCount = 0;
    let lastBody;
    globalThis.fetch = async (url, opts) => {
      callCount++;
      lastBody = JSON.parse(opts.body);
      return { ok: true };
    };

    sendSlackAlert("test message");
    await new Promise((r) => setTimeout(r, 20)); // fire-and-forget — chờ microtask flush

    assert.equal(callCount, 1);
    assert.equal(lastBody.text, "test message");
  });

  it("dedupKey chặn gửi lặp trong cửa sổ thời gian", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      return { ok: true };
    };

    const key = `dedup-test-${Date.now()}`;
    sendSlackAlert("first", { dedupKey: key, dedupMs: 60_000 });
    sendSlackAlert("second (should be skipped)", { dedupKey: key, dedupMs: 60_000 });
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(callCount, 1, "lần gửi thứ 2 phải bị chặn bởi dedup");
  });
});
