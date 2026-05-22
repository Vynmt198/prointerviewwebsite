/**
 * Integration: CV analyses API + MongoDB (memory server).
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
let CVAnalysis;
let createApp;

const FIELD_UI = {
  mode: "field",
  field: "IT / Công nghệ",
  matchScore: 65,
  matchedKeywords: ["react", "python"],
  missingKeywords: ["docker"],
  summary: "CV IT khá ổn",
  cvText: "Senior React developer với Python",
  jdText: "",
};

const SAVE_BODY = {
  cvText: FIELD_UI.cvText,
  jdText: "",
  analysisType: "basic",
  cvFileName: "cv-test.pdf",
  cvFileUrl: "http://localhost:5000/uploads/cv-test.pdf",
  geminiModel: "python-cv-matcher",
  result: {
    _ui: FIELD_UI,
    matchScore: 65,
    overallSummary: FIELD_UI.summary,
    matchStrengths: ["react"],
    missingKeywords: ["docker"],
  },
};

before(async () => {
  harness = await startMongoHarness();
  ({ User } = await import("../models/User.js"));
  ({ CVAnalysis } = await import("../models/CVAnalysis.js"));
  ({ createApp } = await import("../app.js"));
  http = await startHttpServer(createApp());
});

after(async () => {
  if (http?.server) await stopHttpServer(http.server);
  if (harness) await stopMongoHarness(harness);
});

async function authHeaders(user) {
  const token = mintAccessToken(user._id);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

describe("CV API integration (MongoDB)", () => {
  it("POST /api/cv/analyses lưu result._ui và tăng quota", async () => {
    const user = await User.create({
      name: "CV Test",
      email: `cv-int-${Date.now()}@test.local`,
      role: "customer",
      quota: { cvAnalysisUsed: 0, cvAnalysisLimit: 3 },
    });

    const res = await fetch(`${http.baseUrl}/api/cv/analyses`, {
      method: "POST",
      headers: await authHeaders(user),
      body: JSON.stringify(SAVE_BODY),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.analysis?._id);

    const stored = await CVAnalysis.findById(body.analysis._id).lean();
    assert.ok(stored.result?._ui);
    assert.equal(stored.result._ui.mode, "field");
    assert.equal(stored.result._ui.field, "IT / Công nghệ");
    assert.equal(stored.analysisType, "basic");
    assert.equal(stored.jdText, "");
    assert.equal(stored.cvFileUrl, "http://localhost:5000/uploads/cv-test.pdf");

    const refreshed = await User.findById(user._id);
    assert.equal(refreshed.quota.cvAnalysisUsed, 1);
  });

  it("GET list + GET by id + DELETE", async () => {
    const user = await User.create({
      name: "CV List",
      email: `cv-list-${Date.now()}@test.local`,
      quota: { cvAnalysisUsed: 0, cvAnalysisLimit: 5 },
    });

    const created = await CVAnalysis.create({
      userId: user._id,
      cvText: "text",
      analysisType: "basic",
      result: { _ui: { mode: "field", matchScore: 50 } },
    });

    const listRes = await fetch(`${http.baseUrl}/api/cv/analyses`, {
      headers: await authHeaders(user),
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.list.some((d) => String(d._id) === String(created._id)));

    const getRes = await fetch(`${http.baseUrl}/api/cv/analyses/${created._id}`, {
      headers: await authHeaders(user),
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.analysis.result._ui.mode, "field");

    const delRes = await fetch(`${http.baseUrl}/api/cv/analyses/${created._id}`, {
      method: "DELETE",
      headers: await authHeaders(user),
    });
    assert.equal(delRes.status, 200);
    const gone = await CVAnalysis.findById(created._id);
    assert.equal(gone, null);
  });

  it("403 khi hết quota", async () => {
    const user = await User.create({
      name: "CV Quota",
      email: `cv-quota-${Date.now()}@test.local`,
      quota: { cvAnalysisUsed: 3, cvAnalysisLimit: 3 },
    });

    const res = await fetch(`${http.baseUrl}/api/cv/analyses`, {
      method: "POST",
      headers: await authHeaders(user),
      body: JSON.stringify(SAVE_BODY),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /hết lượt/i);
  });

  it("401 không có token", async () => {
    const res = await fetch(`${http.baseUrl}/api/cv/analyses`, {
      method: "GET",
    });
    assert.equal(res.status, 401);
  });

  it("user B không đọc/xóa bản ghi của user A → 404", async () => {
    const userA = await User.create({
      name: "CV Owner",
      email: `cv-owner-${Date.now()}@test.local`,
      quota: { cvAnalysisUsed: 0, cvAnalysisLimit: 5 },
    });
    const userB = await User.create({
      name: "CV Other",
      email: `cv-other-${Date.now()}@test.local`,
      quota: { cvAnalysisUsed: 0, cvAnalysisLimit: 5 },
    });

    const createRes = await fetch(`${http.baseUrl}/api/cv/analyses`, {
      method: "POST",
      headers: await authHeaders(userA),
      body: JSON.stringify(SAVE_BODY),
    });
    assert.equal(createRes.status, 201);
    const { analysis } = await createRes.json();
    const id = analysis._id;

    const getAsB = await fetch(`${http.baseUrl}/api/cv/analyses/${id}`, {
      headers: await authHeaders(userB),
    });
    assert.equal(getAsB.status, 404);

    const delAsB = await fetch(`${http.baseUrl}/api/cv/analyses/${id}`, {
      method: "DELETE",
      headers: await authHeaders(userB),
    });
    assert.equal(delAsB.status, 404);

    const still = await CVAnalysis.findById(id);
    assert.ok(still);
    assert.equal(String(still.userId), String(userA._id));
  });
});
