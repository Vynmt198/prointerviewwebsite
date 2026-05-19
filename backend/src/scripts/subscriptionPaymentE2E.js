/**
 * E2E HTTP — luồng CK gói Pro/Elite qua API thật (port 5000).
 * Run: node src/scripts/subscriptionPaymentE2E.js
 * Cần backend đang chạy + seed users (customer@dev.local, admin@dev.local).
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const BASE = (process.env.E2E_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL || "customer@dev.local";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@dev.local";
const PASSWORD = process.env.E2E_PASSWORD || "Dev123456";

function log(step, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function api(method, path, { token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}

async function login(email) {
  const res = await api("POST", "/api/auth/login", {
    body: { email, password: PASSWORD },
  });
  if (!res.ok || !res.data?.token) {
    throw new Error(`Login ${email} failed: ${res.data?.error || res.status}`);
  }
  return res.data.token;
}

async function main() {
  console.log(`\nE2E subscription CK → ${BASE}\n`);
  let passed = 0;
  let failed = 0;

  const health = await api("GET", "/api/health");
  if (!health.ok) {
    console.error("Backend không phản hồi. Chạy: npm run dev (backend port 5000)");
    process.exit(1);
  }
  log("Health", true);

  const customerToken = await login(CUSTOMER_EMAIL);
  log("Login customer", true, CUSTOMER_EMAIL);
  passed++;

  const orderNum = `PIE2E${Date.now()}`;
  const create = await api("POST", "/api/payments/subscription/transfer-pending", {
    token: customerToken,
    body: { amount: 79000, planKey: "starter_pro", orderNum },
  });
  if (!create.ok || !create.data?.paymentId) {
    log("Tạo pending CK", false, create.data?.error || String(create.status));
    process.exit(1);
  }
  const paymentId = create.data.paymentId;
  log("Tạo pending CK", true, `paymentId=${paymentId} ref=${create.data.providerRef}`);
  passed++;

  const submit = await api("PATCH", `/api/payments/subscription/${paymentId}/submit-transfer`, {
    token: customerToken,
    body: { reference: orderNum },
  });
  if (!submit.ok) {
    log("Submit đã CK", false, submit.data?.error);
    failed++;
  } else {
    log("Submit đã CK", true);
    passed++;
  }

  const adminToken = await login(ADMIN_EMAIL);
  log("Login admin", true, ADMIN_EMAIL);
  passed++;

  const pendingList = await api("GET", "/api/admin/payments/subscription-pending", {
    token: adminToken,
  });
  const inList = pendingList.data?.payments?.some((p) => p.id === paymentId);
  if (!pendingList.ok || !inList) {
    log("Admin list pending", false, inList ? "" : "không thấy paymentId trong danh sách");
    failed++;
  } else {
    log("Admin list pending", true);
    passed++;
  }

  const confirm = await api("PATCH", `/api/admin/payments/${paymentId}/confirm-subscription-transfer`, {
    token: adminToken,
    body: {},
  });
  if (!confirm.ok) {
    log("Admin confirm", false, confirm.data?.error);
    failed++;
  } else {
    log("Admin confirm", true);
    passed++;
  }

  const me = await api("GET", "/api/auth/me", { token: customerToken });
  const plan = me.data?.user?.plan;
  if (me.ok && plan === "starter_pro") {
    log("User plan sau duyệt", true, plan);
    passed++;
  } else {
    log("User plan sau duyệt", false, `plan=${plan}`);
    failed++;
  }

  const orderNum2 = `PIE2E2${Date.now()}`;
  const renew = await api("POST", "/api/payments/subscription/transfer-pending", {
    token: customerToken,
    body: { amount: 79000, planKey: "starter_pro", orderNum: orderNum2 },
  });
  if (!renew.ok || renew.data.paymentId === paymentId) {
    log("Gia hạn lần 2 — pending mới", false, renew.data?.error || "cùng paymentId");
    failed++;
  } else {
    log("Gia hạn lần 2 — pending mới", true, `paymentId=${renew.data.paymentId}`);
    passed++;
  }

  console.log(`\nKết quả: ${passed} pass, ${failed} fail\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
