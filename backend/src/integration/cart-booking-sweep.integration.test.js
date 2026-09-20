import { before, after, it } from "node:test";
import assert from "node:assert/strict";
import { applyTestEnv, startMongoHarness, stopMongoHarness, startHttpServer, stopHttpServer, mintAccessToken } from "../test_helpers/mongoTestHarness.js";

applyTestEnv();
process.env.SEPAY_WEBHOOK_API_KEY = "cart-test-webhook";
process.env.MAIL_USER = "";
process.env.MAIL_PASS = "";
process.env.UPSTASH_REDIS_REST_URL = "";
process.env.UPSTASH_REDIS_REST_TOKEN = "";
process.env.COURSE_PLATFORM_FEE_RATE = "0.35";
let harness, http, models, sweep;
before(async () => {
  harness = await startMongoHarness();
  models = await import("../models/index.js");
  await Promise.all([models.Cart.init(), models.CartOrder.init(), models.Enrollment.init(), models.Payment.init(), models.Booking.init()]);
  const { createApp } = await import("../app.js");
  http = await startHttpServer(createApp());
  ({ runStaleSweep: sweep } = await import("../jobs/bookingStaleSweepJob.js"));
});
after(async () => {
  if (http) await stopHttpServer(http.server);
  if (harness) await stopMongoHarness(harness);
});

async function request(user, path, method = "GET", body) {
  const response = await fetch(http.baseUrl + path, { method,
    headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${mintAccessToken(user._id)}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, ...await response.json() };
}
async function fixture(prices = [100000, 200000], plan = "free") {
  const unique = `${Date.now()}-${Math.random()}`;
  const customer = await models.User.create({ name: "Cart customer", email: `cart-${unique}@test.local`, role: "customer", plan, planExpiresAt: new Date(Date.now() + 86400000) });
  const mentorUser = await models.User.create({ name: "Cart mentor", email: `mentor-${unique}@test.local`, role: "mentor" });
  const mentor = await models.Mentor.findOneAndUpdate({ userId: mentorUser._id },
    { $set: { name: "Cart mentor", isActive: true, isVerified: true }, $setOnInsert: { publicId: `cart-${unique}` } }, { upsert: true, new: true });
  const courses = [];
  for (const [index, price] of prices.entries()) courses.push(await models.Course.create({ mentorId: mentor._id, title: `Cart course ${index}`, price, level: "basic", status: "published" }));
  return { customer, mentorUser, mentor, courses };
}
async function fillCart(f) {
  for (const course of f.courses) {
    const response = await request(f.customer, "/api/cart/items", "POST", { courseId: String(course._id), price: 1, quantity: 100 });
    assert.equal(response.status, 200, JSON.stringify(response));
  }
}
async function checkout(f, body = {}) {
  await fillCart(f);
  const result = await request(f.customer, "/api/cart/checkout", "POST", body);
  assert.equal(result.status, 200, JSON.stringify(result));
  return result.order;
}
async function webhook(order, amount = order.totalAmount, id = `sepay-${Math.random()}`) {
  const response = await fetch(http.baseUrl + "/api/payments/webhook/sepay", { method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Apikey cart-test-webhook" },
    body: JSON.stringify({ id, transferType: "in", transferAmount: amount, content: order.orderRef }),
  });
  return { status: response.status, ...await response.json() };
}

it("persists a unique course cart per user, prices on the server and enforces ownership", async () => {
  const f = await fixture([100000, 200000], "starter_pro");
  assert.equal((await request(null, "/api/cart")).status, 401);
  await fillCart(f);
  await fillCart(f);
  const result = await request(f.customer, "/api/cart");
  assert.equal(result.cart.items.length, 2);
  assert.equal(result.cart.totalAmount, 285000);
  assert.equal((await models.Cart.findOne({ userId: f.customer._id })).courseIds.length, 2);
  assert.equal((await request(f.mentorUser, "/api/cart/items", "POST", { courseId: f.courses[0]._id })).status, 400);
  await models.Course.updateOne({ _id: f.courses[1]._id }, { $set: { status: "archived" } });
  assert.equal((await request(f.customer, "/api/cart/checkout", "POST", {})).status, 400);
  await request(f.customer, `/api/cart/items/${f.courses[1]._id}`, "DELETE");
  assert.equal((await request(f.customer, "/api/cart")).cart.items.length, 1);
});

it("creates one immutable order and confirms every course from a single exact transfer", async () => {
  const f = await fixture([100000, 200000], "elite_pro");
  const order = await checkout(f);
  assert.equal(order.totalAmount, 270000);
  await models.Course.updateOne({ _id: f.courses[0]._id }, { $set: { price: 900000 } });
  const retry = await request(f.customer, "/api/cart/checkout", "POST", {});
  assert.equal(retry.order.id, order.id);
  assert.equal(retry.order.totalAmount, order.totalAmount);
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id, paymentStatus: "paid" }), 0);
  await webhook(order, 1);
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id, paymentStatus: "paid" }), 0);
  await webhook(order, order.totalAmount, `exact-${order.id}`);
  const saved = await models.CartOrder.findById(order.id);
  assert.equal(saved.status, "paid");
  assert.ok(saved.fulfilledAt);
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id, paymentStatus: "paid" }), 2);
  await webhook(order, order.totalAmount, `exact-${order.id}`);
  await webhook(order, order.totalAmount, `duplicate-${order.id}`);
  const payments = await models.Payment.find({ userId: f.customer._id, status: "success" });
  assert.equal(payments.length, 2);
  assert.equal(payments.reduce((sum, p) => sum + p.amount, 0), 270000);
  assert.equal((await models.Mentor.findById(f.mentor._id)).finance.clearingBalance, 195000);
  for (const course of f.courses) assert.equal((await models.Course.findById(course._id)).stats.enrollmentCount, 1);
  assert.equal((await request(f.customer, "/api/cart")).cart.items.length, 0);
  const poll = await request(f.customer, `/api/payments/transfer-status?orderRef=${order.orderRef}`);
  assert.equal(poll.status, "paid");
  assert.equal(poll.redirectTo, "/my-courses");
});

it("requires whole-order admin confirmation, protects other users and resumes a pending order", async () => {
  const f = await fixture();
  const order = await checkout(f);
  const other = (await fixture([])).customer;
  assert.equal((await request(other, `/api/cart/orders/${order.id}`)).status, 404);
  assert.equal((await request(other, `/api/admin/cart-orders/${order.id}/confirm-transfer`, "POST", {})).status, 403);
  const admin = await models.User.create({ name: "Cart admin", email: `admin-${Math.random()}@test.local`, role: "admin" });
  const partial = await request(admin, `/api/admin/enrollments/${order.items[0].enrollmentId}/confirm-transfer-payment`, "PATCH", { force: true, forceNote: "Manual test" });
  assert.equal(partial.status, 409);
  const data = { force: true, forceNote: "Matched full statement", amount: order.totalAmount };
  const wrong = await request(admin, `/api/admin/cart-orders/${order.id}/confirm-transfer`, "POST", { ...data, amount: 1 });
  assert.equal(wrong.status, 400);
  assert.equal((await request(admin, `/api/admin/cart-orders/${order.id}/confirm-transfer`, "POST", data)).status, 200);
  assert.equal((await request(admin, `/api/admin/cart-orders/${order.id}/confirm-transfer`, "POST", data)).status, 200);
});

it("expires the whole unpaid order, preserves the cart, and allows a fresh checkout", async () => {
  const f = await fixture();
  const order = await checkout(f);
  await models.CartOrder.updateOne({ _id: order.id }, { $set: { paymentExpiresAt: new Date(Date.now() - 1000) } });
  const expired = await request(f.customer, `/api/cart/orders/${order.id}`);
  assert.equal(expired.order.status, "expired");
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id }), 0);
  assert.equal(await models.Payment.countDocuments({ userId: f.customer._id, status: "cancelled" }), 2);
  assert.equal((await request(f.customer, "/api/cart")).cart.items.length, 2);
  const newOrder = await request(f.customer, "/api/cart/checkout", "POST", {});
  assert.equal(newOrder.status, 200, JSON.stringify(newOrder));
  assert.notEqual(newOrder.order.orderRef, order.orderRef);
  await webhook(order);
  assert.equal(await models.Enrollment.countDocuments({ userId: f.customer._id, paymentStatus: "paid" }), 0);
});

it("applies a coupon once across the total, includes free courses and supports zero-total orders", async () => {
  const f = await fixture([100001, 200003, 0]);
  const { Coupon } = await import("../models/Coupon.js");
  const coupon = await Coupon.create({ code: `CART${Date.now()}`, discountType: "fixed", discountValue: 10001, applicableTo: ["enrollment"] });
  const order = await checkout(f, { couponCode: coupon.code });
  assert.equal(order.totalAmount, 290003);
  assert.equal(order.items.reduce((sum, i) => sum + i.couponDiscountAmount, 0), 10001);
  assert.equal((await Coupon.findById(coupon._id)).usedBy.length, 0);
  await webhook(order);
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id, paymentStatus: "paid" }), 3);
  assert.equal((await Coupon.findById(coupon._id)).usedBy.length, 1);
  const free = await fixture([0, 0]);
  assert.equal((await checkout(free)).status, "paid");
});

it("blocks single-course checkout from changing a reserved cart order", async () => {
  const f = await fixture();
  const order = await checkout(f);
  const single = await request(f.customer, `/api/courses/${f.courses[0]._id}/enroll`, "POST", { paymentMethod: "transfer", orderNum: "PI123456" });
  assert.equal(single.status, 409);
  const row = await models.Enrollment.findById(order.items[0].enrollmentId);
  assert.ok(row.paymentRef.startsWith(order.orderRef));
  const isolated = await fixture([50000]);
  const pending = await request(isolated.customer, `/api/courses/${isolated.courses[0]._id}/enroll`, "POST", { paymentMethod: "transfer" });
  assert.equal(pending.status, 201, JSON.stringify(pending));
  await fillCart(isolated);
  assert.equal((await request(isolated.customer, "/api/cart/checkout", "POST", {})).status, 409);
});

it("retries interrupted fulfillment using the original total without double-crediting", async () => {
  const f = await fixture();
  const order = await checkout(f);
  const lost = await models.Enrollment.findById(order.items[1].enrollmentId).lean();
  await models.Enrollment.deleteOne({ _id: lost._id });
  const id = `retry-${order.id}`;
  await webhook(order, order.totalAmount, id);
  assert.equal((await models.CartOrder.findById(order.id)).status, "paid");
  assert.equal(await models.Enrollment.countDocuments({ cartOrderId: order.id, paymentStatus: "paid" }), 1);
  await models.Enrollment.create(lost);
  await models.CartOrder.updateOne({ _id: order.id }, { $set: { paymentExpiresAt: new Date(Date.now() - 1000) } });
  const resumed = await request(f.customer, `/api/cart/orders/${order.id}`);
  assert.equal(resumed.order.status, "paid");
  await webhook(order, order.totalAmount, id);
  assert.ok((await models.CartOrder.findById(order.id)).fulfilledAt);
  assert.equal((await models.Mentor.findById(f.mentor._id)).finance.clearingBalance, 195000);
});

it("serializes simultaneous checkouts into one order and leaves later cart additions intact", async () => {
  const f = await fixture();
  await fillCart(f);
  const results = await Promise.all([
    request(f.customer, "/api/cart/checkout", "POST", {}),
    request(f.customer, "/api/cart/checkout", "POST", {}),
  ]);
  assert.ok(results.some((r) => r.status === 200));
  assert.ok(results.every((r) => [200, 409].includes(r.status)), JSON.stringify(results));
  assert.equal(await models.CartOrder.countDocuments({ userId: f.customer._id, active: true }), 1);
  assert.equal(await models.Enrollment.countDocuments({ userId: f.customer._id }), 2);
  const order = results.find((r) => r.status === 200).order;
  const another = await models.Course.create({ mentorId: f.mentor._id, title: "Buy later", price: 70000, level: "basic", status: "published" });
  await request(f.customer, "/api/cart/items", "POST", { courseId: another._id });
  await webhook(order);
  const cart = (await request(f.customer, "/api/cart")).cart;
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].courseId, String(another._id));
});

it("sweeps unpaid past bookings, flags paid overdue bookings once and leaves other sessions alone", async () => {
  const f = await fixture([]);
  const now = new Date("2026-09-18T10:00:00Z");
  const rows = [];
  const cases = [
    ["pending", "pending", "01/01/2020", "08:00"],
    ["confirmed", "paid", "01/01/2020", "09:00"],
    ["pending", "paid", "01/01/2020", "10:00"],
    ["in_progress", "paid", "18/09/2026", "16:00"],
    ["completed", "paid", "01/01/2020", "11:00"],
    ["confirmed", "paid", "01/01/2030", "12:00"],
    ["cancelled", "paid", "01/01/2020", "13:00"],
  ];
  for (const [status, paymentStatus, date, timeSlot] of cases) rows.push(await models.Booking.create({
    userId: f.customer._id, mentorId: f.mentor._id, date, timeSlot, status, paymentStatus,
    durationMinutes: 60, sessionType: "mock_interview", price: 100000, totalAmount: 100000,
    vat: 0, platformFee: 30000,
  }));
  await Promise.all([sweep(now), sweep(now)]);
  await sweep(now);
  assert.equal((await models.Booking.findById(rows[0]._id)).status, "cancelled");
  for (const index of [1, 2]) {
    const b = await models.Booking.findById(rows[index]._id);
    assert.ok(b.staleFlaggedAt);
    assert.equal(b.status, cases[index][0]);
    assert.equal(b.paymentStatus, "paid");
    const count = await models.Notification.countDocuments({ userId: f.customer._id, "metadata.bookingId": b._id });
    assert.equal(count, 1);
  }
  for (const index of [3, 4, 5, 6]) assert.equal((await models.Booking.findById(rows[index]._id)).staleFlaggedAt, undefined);
});

it("does not cancel or flag bookings rescheduled while the sweep is running", async (t) => {
  const f = await fixture([]);
  const rows = [];
  for (const paymentStatus of ["pending", "paid"]) rows.push(await models.Booking.create({
    userId: f.customer._id, mentorId: f.mentor._id, date: "01/01/2020", timeSlot: paymentStatus === "pending" ? "08:00" : "09:00",
    status: "pending", paymentStatus, durationMinutes: 60, sessionType: "mock_interview",
    price: 100000, totalAmount: 100000, vat: 0, platformFee: 30000,
  }));
  const toReschedule = new Set(rows.map((row) => String(row._id)));
  const updateOne = models.Booking.updateOne.bind(models.Booking);
  t.mock.method(models.Booking, "updateOne", async (filter, ...args) => {
    if (toReschedule.delete(String(filter._id))) {
      await models.Booking.collection.updateOne({ _id: filter._id }, { $set: { date: "01/01/2030" } });
    }
    return updateOne(filter, ...args);
  });
  await sweep(new Date("2026-09-18T10:00:00Z"));
  assert.equal(toReschedule.size, 0);
  for (const row of rows) {
    const booking = await models.Booking.findById(row._id);
    assert.equal(booking.date, "01/01/2030");
    assert.equal(booking.status, "pending");
    assert.equal(booking.paymentStatus, row.paymentStatus);
    assert.equal(booking.staleFlaggedAt, undefined);
    assert.equal(await models.Notification.countDocuments({ "metadata.bookingId": row._id }), 0);
  }
});
