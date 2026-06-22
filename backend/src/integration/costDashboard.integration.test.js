/**
 * Integration: cost ledger (Sprint 1 — Task 1.2/1.3) — recordCostEvent + aggregation +
 * GET /api/admin/cost-dashboard*.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  applyTestEnv,
  startMongoHarness,
  stopMongoHarness,
  mintAccessToken,
  startHttpServer,
  stopHttpServer,
} from "../test_helpers/mongoTestHarness.js";

applyTestEnv();

let harness;
let http;
let User;
let CostEvent;
let createApp;
let recordCostEvent;
let getCostDashboard;
let getCacheMetrics;

before(async () => {
  harness = await startMongoHarness();
  ({ User } = await import("../models/User.js"));
  ({ CostEvent } = await import("../models/CostEvent.js"));
  ({ createApp } = await import("../app.js"));
  ({ recordCostEvent, getCostDashboard, getCacheMetrics } = await import(
    "../services/costLedgerService.js"
  ));
  http = await startHttpServer(createApp());
});

after(async () => {
  if (http?.server) await stopHttpServer(http.server);
  if (harness) await stopMongoHarness(harness);
});

function bearer(userId) {
  return {
    Authorization: `Bearer ${mintAccessToken(userId)}`,
    Accept: "application/json",
  };
}

async function createAdmin() {
  return User.create({
    name:  "Cost Admin",
    email: `cost-admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`,
    role:  "admin",
    plan:  "free",
  });
}

/** Insert trực tiếp qua driver (bỏ qua Mongoose timestamps hook) để backdate createdAt. */
async function insertCostEventAt(daysAgo, fields) {
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  await CostEvent.collection.insertOne({
    kind:      fields.kind,
    tags:      fields.tags ?? [],
    userId:    fields.userId ?? null,
    model:     fields.model ?? null,
    costUsd:   fields.costUsd ?? 0,
    costVnd:   fields.costVnd ?? 0,
    fromCache: fields.fromCache ?? false,
    metadata:  fields.metadata ?? {},
    createdAt,
    updatedAt: createdAt,
  });
}

describe("costLedgerService — recordCostEvent + aggregation", () => {
  it("recordCostEvent() ghi đúng document vào MongoDB", async () => {
    await CostEvent.deleteMany({});
    await recordCostEvent({
      kind:      "llm_call",
      tags:      ["question_generation"],
      userId:    "user-1",
      model:     "claude-sonnet",
      costUsd:   0.01,
      costVnd:   254,
      fromCache: false,
      metadata:  { name: "question_gen" },
    });
    const docs = await CostEvent.find({}).lean();
    assert.equal(docs.length, 1);
    assert.equal(docs[0].kind, "llm_call");
    assert.equal(docs[0].costUsd, 0.01);
  });

  it("getCostDashboard() group theo ngày + kind, phát hiện spike >2x", async () => {
    await CostEvent.deleteMany({});
    await insertCostEventAt(1, { kind: "llm_call", costUsd: 1, costVnd: 25400 }); // hôm qua: $1
    await insertCostEventAt(0, { kind: "llm_call", costUsd: 2, costVnd: 50800 }); // hôm nay: $3 (>2x)
    await insertCostEventAt(0, { kind: "avatar_video_did", costUsd: 1, costVnd: 25400 });

    const result = await getCostDashboard({ days: 14 });
    assert.equal(result.ok, true);
    assert.ok(result.todayCostUsd >= 3 - 1e-9, `todayCostUsd=${result.todayCostUsd}`);
    assert.ok(result.yesterdayCostUsd >= 1 - 1e-9, `yesterdayCostUsd=${result.yesterdayCostUsd}`);
    assert.equal(result.spike, true);
  });

  it("getCacheMetrics() tính hit/miss + alert khi baseline render > 6/tháng", async () => {
    await CostEvent.deleteMany({});
    for (let i = 0; i < 5; i++) {
      await insertCostEventAt(0, { kind: "avatar_video_did", fromCache: true });
    }
    for (let i = 0; i < 2; i++) {
      await insertCostEventAt(0, {
        kind: "avatar_video_did", fromCache: false, metadata: { persistVideo: false },
      });
    }
    for (let i = 0; i < 7; i++) {
      await insertCostEventAt(0, {
        kind: "avatar_video_did", fromCache: false, metadata: { persistVideo: true },
      });
    }

    const result = await getCacheMetrics({ days: 30 });
    assert.equal(result.ok, true);
    assert.equal(result.cacheHits, 5);
    assert.equal(result.cacheMisses, 9);
    assert.equal(result.baselineRendersThisMonth, 7);
    assert.equal(result.baselineRenderAlert, true);
  });
});

describe("GET /api/admin/cost-dashboard*", () => {
  it("403 khi không phải admin", async () => {
    const customer = await User.create({
      name:  "Not Admin",
      email: `not-admin-${Date.now()}@test.local`,
      role:  "customer",
    });
    const res = await fetch(`${http.baseUrl}/api/admin/cost-dashboard`, {
      headers: bearer(customer._id),
    });
    assert.equal(res.status, 403);
  });

  it("200 + dữ liệu hợp lệ khi là admin", async () => {
    await CostEvent.deleteMany({});
    await insertCostEventAt(0, { kind: "llm_call", costUsd: 0.5, costVnd: 12700 });
    const admin = await createAdmin();

    const res = await fetch(`${http.baseUrl}/api/admin/cost-dashboard?days=7`, {
      headers: bearer(admin._id),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.byDayAndKind));
  });

  it("cache-metrics endpoint trả cacheHits/cacheMisses", async () => {
    await CostEvent.deleteMany({});
    await insertCostEventAt(0, { kind: "avatar_video_did", fromCache: true });
    const admin = await createAdmin();

    const res = await fetch(`${http.baseUrl}/api/admin/cost-dashboard/cache-metrics`, {
      headers: bearer(admin._id),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.cacheHits, 1);
  });
});
