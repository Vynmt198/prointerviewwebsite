/**
 * Unit test: fail-fast Redis ở production (Sprint 1 — Task 2B.1.c).
 * Mock global.fetch để giả lập Upstash REST API thành công/thất bại.
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { cacheGet, cacheSet, cacheIncr, getCacheMode, isRedisEnabled } from "./cacheService.js";

const ORIGINAL_ENV = { ...process.env };
const originalFetch = globalThis.fetch;

function setRedisConfigured(configured) {
  if (configured) {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake-test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  } else {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
}

function mockFetchSuccess(result) {
  globalThis.fetch = async () => ({
    ok:   true,
    json: async () => ({ result }),
  });
}

function mockFetchFailure() {
  globalThis.fetch = async () => {
    throw new Error("ECONNREFUSED (mock Upstash down)");
  };
}

after(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...ORIGINAL_ENV };
});

describe("cacheService — Redis fail-fast (production)", () => {
  beforeEach(() => {
    setRedisConfigured(true);
  });

  it("dev: Redis lỗi → fallback sang memory, không throw, getCacheMode() = memory", async () => {
    process.env.NODE_ENV = "development";
    mockFetchFailure();

    const result = await cacheGet("test-key-dev-fallback");
    assert.equal(result, null); // chưa có gì trong memory map cho key này
    assert.equal(getCacheMode(), "memory");
  });

  it("production: Redis lỗi → throw, KHÔNG fallback sang memory", async () => {
    process.env.NODE_ENV = "production";
    mockFetchFailure();

    await assert.rejects(
      () => cacheGet("test-key-prod-failfast"),
      /Redis cache GET thất bại ở production/,
    );
  });

  it("production: cacheSet lỗi cũng throw (fail-fast áp dụng mọi operation)", async () => {
    process.env.NODE_ENV = "production";
    mockFetchFailure();

    await assert.rejects(
      () => cacheSet("test-key-prod-set", "value", 60),
      /Redis cache SET thất bại ở production/,
    );
  });

  it("Redis hoạt động bình thường → trả giá trị, getCacheMode() = redis", async () => {
    process.env.NODE_ENV = "production";
    mockFetchSuccess("cached-value-123");

    const result = await cacheGet("test-key-ok");
    assert.equal(result, "cached-value-123");
    assert.equal(getCacheMode(), "redis");
  });

  it("isRedisEnabled() = false khi thiếu UPSTASH_REDIS_REST_URL/TOKEN", () => {
    setRedisConfigured(false);
    assert.equal(isRedisEnabled(), false);
  });
});

describe("cacheService — cacheIncr (counter cho cache metrics)", () => {
  it("dev, Redis chưa cấu hình → tăng dần đúng bằng memory fallback", async () => {
    setRedisConfigured(false);
    process.env.NODE_ENV = "development";

    const key = `test-counter-${Date.now()}`;
    const first  = await cacheIncr(key, 60);
    const second = await cacheIncr(key, 60);
    const third  = await cacheIncr(key, 60);

    assert.equal(first, 1);
    assert.equal(second, 2);
    assert.equal(third, 3);
  });
});
