import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Mentor } from "../models/Mentor.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { Payment } from "../models/Payment.js";
import { ensureMentorProfilesForAllMentorUsers } from "./mentorProfileService.js";
import { recordAdminTransferSuccess, recordTransferPending, recordTransferSubmitted } from "./paymentsService.js";
import { tryCreditMentorForCompletedBooking } from "./mentorEarningsService.js";
import { runInTransaction } from "../helpers/dbHelper.js";

const MONGO_ERR = "MongoDB chưa kết nối. Kiểm tra MONGO_URI trong .env.";
const MENTOR_CANCEL_MIN_HOURS = 2;

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function parseFeeRate(envVal, fallback) {
  const n = Number(String(envVal ?? "").trim());
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

/** Chuẩn hóa chuỗi ngày từ Booking.jsx (vd. "Thứ 4, 01/03" hoặc "01/03/2026"). */
export function normalizeBookingDate(raw) {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  const tail = s.includes(",") ? s.split(",").pop().trim() : s;
  const parts = tail.split("/").map((p) => p.trim());
  if (parts.length === 3) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
  if (parts.length === 2) return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  return tail;
}

function parseBookingDateTime(dateRaw, timeRaw) {
  const dateNorm = normalizeBookingDate(dateRaw);
  const parts = dateNorm.split("/").map((p) => Number(p));
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  const day = parts[0];
  const month = parts[1];
  const year = parts.length >= 3 && Number.isFinite(parts[2]) ? parts[2] : new Date().getFullYear();
  const [hour, minute] = String(timeRaw || "00:00").split(":").map((p) => Number(p));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

async function notifyBookingOwner(userId, payload) {
  if (!mongoose.isValidObjectId(String(userId || ""))) return;
  await Notification.create({
    userId,
    type: payload.type || "system",
    title: payload.title || "Cập nhật lịch hẹn",
    body: payload.body || "",
    metadata: payload.metadata || {},
  });
}

async function refundBookingPaymentIfNeeded(booking) {
  // Chỉ hoàn tiền khi booking đã paid.
  if (String(booking.paymentStatus || "").toLowerCase() !== "paid") {
    return { refunded: false, amount: 0 };
  }

  const pay = await Payment.findOne({
    type: "booking",
    referenceModel: "Booking",
    referenceId: booking._id,
    status: { $in: ["success", "pending"] },
  }).sort({ createdAt: -1 });

  if (!pay) {
    // Không có bản ghi payment thì vẫn chuyển booking về refunded để phản ánh nghiệp vụ.
    booking.paymentStatus = "refunded";
    return { refunded: true, amount: Number(booking.totalAmount || booking.price || 0) };
  }

  const refundAmount = Number(pay.amount || booking.totalAmount || booking.price || 0);
  pay.status = "refunded";
  pay.refundedAt = new Date();
  pay.refundAmount = refundAmount;
  await pay.save();

  booking.paymentStatus = "refunded";
  return { refunded: true, amount: refundAmount };
}

function parseDateParts(dateRaw) {
  const norm = normalizeBookingDate(dateRaw);
  const parts = norm.split("/").map((p) => Number(p));
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  return {
    day: parts[0],
    month: parts[1],
    year: parts.length >= 3 && Number.isFinite(parts[2]) ? parts[2] : new Date().getFullYear(),
  };
}

function toIsoDate(dateRaw) {
  const p = parseDateParts(dateRaw);
  if (!p) return "";
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function normalizeDateKey(raw, fallbackYear) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split("/").map((p) => Number(p));
  if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    const year = parts.length >= 3 && Number.isFinite(parts[2]) ? parts[2] : fallbackYear;
    return `${String(year).padStart(4, "0")}-${String(parts[1]).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
  }
  return "";
}

function getMentorSlotsForDate(mentor, dateRaw) {
  const iso = toIsoDate(dateRaw);
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));

  const blocked = Array.isArray(mentor?.blockedDates) ? mentor.blockedDates : [];
  const blockedSet = new Set(blocked.map((d) => normalizeDateKey(d, year)).filter(Boolean));
  if (blockedSet.has(iso)) return [];

  const availableSlots = mentor?.availableSlots && typeof mentor.availableSlots === "object" ? mentor.availableSlots : {};
  const entries = Object.entries(availableSlots);
  const explicit = entries.find(([k]) => normalizeDateKey(k, year) === iso);
  if (explicit) {
    return Array.isArray(explicit[1]) ? explicit[1].map((x) => String(x).trim()).filter(Boolean) : [];
  }

  const recurring = Array.isArray(mentor?.recurringSchedule) ? mentor.recurringSchedule : [];
  if (recurring.length) {
    const [y, m, d] = iso.split("-").map(Number);
    const jsDay = new Date(y, m - 1, d).getDay(); // 0=Sun
    const mentorDay = (jsDay + 6) % 7; // 0=Mon
    const row = recurring.find((r) => Number(r?.dayOfWeek) === mentorDay);
    return row && Array.isArray(row.slots) ? row.slots.map((x) => String(x).trim()).filter(Boolean) : [];
  }

  return null;
}

function buildNotes(body) {
  const direct = typeof body.notes === "string" ? body.notes.trim() : "";
  if (direct) return direct.slice(0, 8000);

  const parts = [];
  const position = typeof body.position === "string" ? body.position.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const cvFile = typeof body.cvFile === "string" ? body.cvFile.trim() : "";
  const jdFile = typeof body.jdFile === "string" ? body.jdFile.trim() : "";

  if (position) parts.push(`Vị trí ứng tuyển: ${position}`);
  if (note) parts.push(`Ghi chú: ${note}`);
  if (cvFile) parts.push(`CV: ${cvFile}`);
  if (jdFile) parts.push(`JD: ${jdFile}`);
  return parts.join("\n").slice(0, 8000);
}

function mapPaymentMethod(method) {
  const m = String(method ?? "").toLowerCase();
  if (m === "momo") return "momo";
  if (m === "zalopay") return "zalopay";
  if (m === "vnpay") return "vnpay";
  if (m === "visa" || m === "card") return "card";
  if (m === "transfer" || m === "bank" || m === "bank_transfer" || m === "ck") return "transfer";
  return "card";
}

function extractOrderPart(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.split("|")[0].trim().slice(0, 120);
}

const SESSION_TYPES = new Set(["mock_interview", "cv_review", "career_consulting", "custom"]);

/**
 * @param {string} userId - JWT sub (User _id)
 * @param {object} body - Khớp payload từ Booking.jsx / Checkout
 */
export async function createBooking(userId, body) {
  if (!isMongoReady()) {
    return { ok: false, status: 503, error: MONGO_ERR };
  }

  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid || !mongoose.isValidObjectId(uid)) {
    return { ok: false, status: 401, error: "Phiên đăng nhập không hợp lệ." };
  }

  const user = await User.findById(uid).lean();
  if (!user) {
    return { ok: false, status: 401, error: "Không tìm thấy người dùng." };
  }

  const mentorKey = typeof body.mentorId === "string" ? body.mentorId.trim() : "";
  if (!mentorKey) {
    return { ok: false, status: 400, error: "Thiếu mentorId." };
  }

  await ensureMentorProfilesForAllMentorUsers().catch((e) =>
    console.error("[createBooking] ensureMentorProfilesForAllMentorUsers:", e?.message || e),
  );

  const or = [{ publicId: mentorKey }];
  if (mongoose.isValidObjectId(mentorKey)) or.push({ _id: mentorKey });

  let mentor = await Mentor.findOne({ $or: or }).lean();
  if (!mentor) {
    return { ok: false, status: 404, error: "Không tìm thấy mentor." };
  }
  if (!mentor.userId) {
    return { ok: false, status: 404, error: "Mentor chưa có tài khoản đăng nhập — không thể đặt lịch." };
  }
  const mentorAccount = await User.findById(mentor.userId).select("role isActive").lean();
  if (!mentorAccount || mentorAccount.role !== "mentor" || mentorAccount.isActive === false) {
    return { ok: false, status: 404, error: "Mentor không khả dụng để đặt lịch." };
  }
  if (mentor.isActive === false || mentor.isVerified !== true) {
    return {
      ok: false,
      status: 400,
      error: "Mentor chưa được duyệt hoặc đang tạm ngưng. Liên hệ quản trị để kích hoạt.",
    };
  }
  // Mentor đã duyệt nhưng còn available=false (đăng ký cũ / chưa sync) — tự bật lại.
  if (mentor.available === false) {
    await Mentor.updateOne({ _id: mentor._id }, { $set: { available: true } });
    mentor = { ...mentor, available: true };
  }

  const timeSlot = String(body.timeSlot ?? body.time ?? "").trim();
  if (!timeSlot || !/^\d{1,2}:\d{2}$/.test(timeSlot)) {
    return { ok: false, status: 400, error: "Thiếu hoặc sai định dạng timeSlot (vd. 09:00)." };
  }
  const [th, tm] = timeSlot.split(":").map(Number);
  const timeNormalized = `${String(th).padStart(2, "0")}:${String(tm || 0).padStart(2, "0")}`;

  const rawDate = typeof body.date === "string" ? body.date.trim() : "";
  if (!rawDate) {
    return { ok: false, status: 400, error: "Thiếu date." };
  }
  const dateNormalized = normalizeBookingDate(rawDate);
  const allowedSlots = getMentorSlotsForDate(mentor, dateNormalized);
  if (Array.isArray(allowedSlots)) {
    if (allowedSlots.length === 0) {
      return { ok: false, status: 400, error: "Mentor không mở lịch cho ngày này." };
    }
    if (!allowedSlots.includes(timeNormalized)) {
      return { ok: false, status: 400, error: "Khung giờ này không nằm trong lịch mentor mở." };
    }
  }
  const requestedAt = parseBookingDateTime(dateNormalized, timeNormalized);
  if (!requestedAt || Number.isNaN(requestedAt.getTime())) {
    return { ok: false, status: 400, error: "Ngày/giờ đặt lịch không hợp lệ." };
  }
  if (requestedAt.getTime() <= Date.now()) {
    return { ok: false, status: 400, error: "Không thể đặt lịch trong quá khứ." };
  }

  let sessionType = typeof body.sessionType === "string" ? body.sessionType.trim() : "mock_interview";
  if (!SESSION_TYPES.has(sessionType)) sessionType = "mock_interview";

  const durationMinutes =
    Number.isFinite(Number(body.durationMinutes)) && Number(body.durationMinutes) > 0
      ? Math.min(480, Math.round(Number(body.durationMinutes)))
      : 60;

  let basePrice = Number(mentor.pricePerHour);
  const st = Array.isArray(mentor.sessionTypes)
    ? mentor.sessionTypes.find((x) => x && x.type === sessionType)
    : null;
  if (st && typeof st.price === "number" && st.price > 0) basePrice = st.price;

  const bodyPrice = Number(body.price);
  if (Number.isFinite(bodyPrice) && bodyPrice > 0 && basePrice > 0) {
    const drift = Math.abs(bodyPrice - basePrice) / basePrice;
    if (drift > 0.15) {
      return {
        ok: false,
        status: 400,
        error: `Giá mentor đã đổi (hiện ${Math.round(basePrice).toLocaleString("vi-VN")}đ). Vui lòng tải lại trang đặt lịch.`,
      };
    }
  }

  const platformRate = parseFeeRate(process.env.BOOKING_PLATFORM_FEE_RATE, 0.15);
  const vatRate = parseFeeRate(process.env.BOOKING_VAT_RATE, 0.1);

  const price = Math.round(basePrice);
  const platformFee = Math.round(price * platformRate);
  const vat = Math.round(price * vatRate);
  const totalAmount = price + vat;

  const dup = await Booking.findOne({
    mentorId: mentor._id,
    date: dateNormalized,
    timeSlot: timeNormalized,
    status: { $in: ["pending", "confirmed", "in_progress"] },
  });

  if (dup) {
    // Nếu là chính user này đang đặt lại khung giờ cũ (ví dụ: quay lại trang Checkout hoặc tải lại)
    // và booking cũ vẫn đang ở trạng thái chờ thanh toán
    if (String(dup.userId) === uid && dup.status === "pending" && dup.paymentStatus === "pending") {
      return { ok: true, booking: toPublicBooking(dup, mentor) };
    }
    return { ok: false, status: 409, error: "Khung giờ này đã được đặt. Chọn giờ khác." };
  }

  const paymentStatusRaw = String(body.paymentStatus ?? "pending").toLowerCase();
  const paymentStatus = paymentStatusRaw === "paid" ? "paid" : "pending";

  let status = "pending";
  if (paymentStatus === "paid") {
    status = "confirmed";
  }

  const meetingLink = typeof body.meetingLink === "string" ? body.meetingLink.trim().slice(0, 2000) : "";
  const timezone =
    typeof body.timezone === "string" && body.timezone.trim()
      ? body.timezone.trim()
      : "Asia/Ho_Chi_Minh";

  const paymentRefCandidate =
    typeof body.orderNum === "string"
      ? body.orderNum
      : typeof body.paymentRef === "string"
        ? body.paymentRef
        : "";
  const paymentRef = extractOrderPart(paymentRefCandidate);

  const doc = await Booking.create({
    userId: uid,
    mentorId: mentor._id,
    date: dateNormalized,
    timeSlot: timeNormalized,
    durationMinutes,
    timezone,
    sessionType,
    notes: buildNotes(body),
    meetingLink,
    status,
    price,
    platformFee,
    vat,
    totalAmount,
    paymentStatus,
    paymentMethod: mapPaymentMethod(body.paymentMethod ?? body.method),
    paymentRef,
    paidAt: paymentStatus === "paid" ? new Date() : undefined,
  });

  // Nếu user chọn CK, tạo ledger pending ngay (để admin/finance nhìn thấy và đồng bộ về sau)
  if (doc.paymentStatus === "pending" && doc.paymentMethod === "transfer") {
    const ledgerAmt = Math.round(Number(doc.totalAmount ?? doc.price ?? 0));
    if (ledgerAmt > 0) {
      const ledger = await recordTransferPending({
        userId: doc.userId,
        type: "booking",
        referenceModel: "Booking",
        referenceId: doc._id,
        amount: ledgerAmt,
      });
      if (!ledger.ok && !ledger.idempotent) {
        console.error("[createBooking] ledger:", ledger.error);
      }
    }
  }

  return {
    ok: true,
    booking: toPublicBooking(doc, mentor),
  };
}

/**
 * @param {object} doc - Mongoose doc hoặc plain (populate mentorId tuỳ chọn)
 * @param {object | null} mentorLean - mentor plain khi create (chưa populate)
 */
export function toPublicBooking(doc, mentorLean) {
  const b = doc.toObject ? doc.toObject() : { ...doc };
  
  // Mentor info extraction
  let m = mentorLean;
  if (!m && b.mentorId && typeof b.mentorId === "object" && ("name" in b.mentorId || "userId" in b.mentorId)) {
    m = b.mentorId;
  }

  const mentorPublicId = m?.publicId ?? (m?._id ? String(m._id) : (typeof b.mentorId === "string" ? b.mentorId : String(b.mentorId || "")));
  
  // Robust mentor email extraction
  let mentorEmail = "";
  if (m?.userId && typeof m.userId === "object" && m.userId.email) {
    mentorEmail = m.userId.email;
  } else if (m?.email) {
    mentorEmail = m.email;
  } else if (m?.userId && typeof m.userId === "string" && m.userId.includes("@")) {
    mentorEmail = m.userId;
  }

  const cust = b.userId && typeof b.userId === "object" && (b.userId.email || b.userId.name) ? b.userId : null;

  return {
    id: String(b._id),
    userId: cust?._id ? String(cust._id) : String(b.userId || ""),
    customerName: cust?.name || "",
    customerEmail: cust?.email || "",
    customerAvatar: cust?.avatar || "",
    mentorId: mentorPublicId,
    mentorName: m?.name ?? "",
    mentorTitle: m?.title ?? "",
    mentorCompany: m?.company ?? "",
    mentorAvatar: m?.avatar ?? "",
    mentorEmail: mentorEmail,
    date: b.date,
    timeSlot: b.timeSlot,
    durationMinutes: b.durationMinutes,
    timezone: b.timezone,
    sessionType: b.sessionType,
    notes: b.notes,
    mentorNotes: b.mentorNotes ?? "",
    reviewId: b.reviewId ? String(b.reviewId) : "",
    meetingLink: b.meetingLink ?? "",
    status: b.status,
    price: b.price,
    platformFee: b.platformFee,
    vat: b.vat,
    totalAmount: b.totalAmount,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    paymentRef: b.paymentRef ?? "",
    transferSubmittedAt: b.transferSubmittedAt ?? null,
    transferConfirmedAt: b.transferConfirmedAt ?? null,
    transferConfirmedBy: b.transferConfirmedBy ? String(b.transferConfirmedBy) : "",
    transferForceConfirm: Boolean(b.transferForceConfirm),
    transferForceNote: b.transferForceNote ?? "",
    rescheduleHistory: Array.isArray(b.rescheduleHistory) ? b.rescheduleHistory : [],
    cancelReason: b.cancelReason ?? "",
    cancelledBy: b.cancelledBy ?? "",
    cancelledAt: b.cancelledAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function bookingQueryForUser(rawId) {
  const id = typeof rawId === "string" ? rawId.trim() : "";
  if (!id) return null;
  if (mongoose.isValidObjectId(id)) return { _id: id };
  return { paymentRef: id };
}

async function getMentorByUserId(userId) {
  const uid = String(userId ?? "").trim();
  if (!mongoose.isValidObjectId(uid)) return null;
  return Mentor.findOne({ userId: uid }).lean();
}

export async function listMyBookings(userId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const uid = String(userId).trim();
  if (!mongoose.isValidObjectId(uid)) return { ok: false, status: 401, error: "Phiên đăng nhập không hợp lệ." };

  const rows = await Booking.find({ userId: uid })
    .sort({ createdAt: -1 })
    .populate({ path: "userId", select: "name email avatar" })
    .populate({ 
      path: "mentorId", 
      select: "name title company avatar publicId userId",
      populate: { path: "userId", select: "email" }
    })
    .lean();


  return { ok: true, bookings: rows.map((row) => toPublicBooking(row)) };
}

export async function listMentorBookings(mentorUserId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) {
    return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  }
  const rows = await Booking.find({ mentorId: mentor._id })
    .sort({ createdAt: -1 })
    .populate({ 
      path: "mentorId", 
      select: "name title company avatar publicId userId",
      populate: { path: "userId", select: "email" }
    })
    .populate({ path: "userId", select: "name email avatar" })
    .lean();

  return { ok: true, bookings: rows.map((row) => toPublicBooking(row)) };
}

export async function getMyBooking(userId, rawId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const uid = String(userId).trim();
  const q = bookingQueryForUser(rawId);
  if (!q) return { ok: false, status: 400, error: "Thiếu id booking." };

  const row = await Booking.findOne({ userId: uid, ...q })
    .populate({ path: "userId", select: "name email avatar" })
    .populate({ 
      path: "mentorId", 
      select: "name title company avatar publicId userId",
      populate: { path: "userId", select: "email" }
    })
    .lean();

  if (!row) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  return { ok: true, booking: toPublicBooking(row) };
}

export async function getMentorBooking(mentorUserId, rawId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const row = await Booking.findOne({ _id: rawId, mentorId: mentor._id })
    .populate({ path: "userId", select: "name email avatar" })
    .populate({ 
      path: "mentorId", 
      select: "name title company avatar publicId userId",
      populate: { path: "userId", select: "email" }
    })
    .lean();

  if (!row) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  return { ok: true, booking: toPublicBooking(row) };
}

/**
 * Khách xác nhận đã chuyển khoản. `reference` tuỳ chọn (FT…); có thể gửi trùng mã đơn (nội dung QR) — không lưu trùng lặp trong paymentRef.
 */
export async function submitBankTransferReference(userId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const uid = String(userId).trim();
  if (!mongoose.isValidObjectId(uid)) return { ok: false, status: 401, error: "Phiên đăng nhập không hợp lệ." };
  const q = bookingQueryForUser(rawId);
  if (!q) return { ok: false, status: 400, error: "Thiếu id booking." };

  const refRaw = String(body?.reference ?? body?.transferReference ?? "").trim();

  const booking = await Booking.findOne({ userId: uid, ...q });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  if (booking.paymentMethod !== "transfer") {
    return { ok: false, status: 400, error: "Booking này không dùng hình thức chuyển khoản." };
  }
  if (booking.paymentStatus !== "pending") {
    return { ok: false, status: 400, error: "Thanh toán đã được xử lý." };
  }

  // Chuẩn mới: mỗi giao dịch chỉ giữ một nội dung chuyển khoản duy nhất (mã đơn gốc).
  const orderPart = extractOrderPart(booking.paymentRef) || extractOrderPart(refRaw) || String(booking._id).slice(-8);
  booking.paymentRef = orderPart.slice(0, 120);
  booking.transferSubmittedAt = new Date();
  await booking.save();

  // Đồng bộ ledger (payments) để admin/finance không phải nhìn 2 nguồn.
  // Nếu chưa có pending vì data cũ, cố gắng tạo lại rồi mới cập nhật metadata.
  const ledgerAmt = Math.round(Number(booking.totalAmount ?? booking.price ?? 0));
  if (ledgerAmt > 0) {
    const ensure = await recordTransferPending({
      userId: booking.userId,
      type: "booking",
      referenceModel: "Booking",
      referenceId: booking._id,
      amount: ledgerAmt,
    });
    if (!ensure.ok && !ensure.idempotent) {
      console.error("[submitBankTransferReference] ensure ledger:", ensure.error);
    } else {
      const meta = await recordTransferSubmitted({
        userId: booking.userId,
        type: "booking",
        referenceId: booking._id,
        paymentRef: booking.paymentRef,
        submittedAt: booking.transferSubmittedAt,
      });
      if (!meta.ok) {
        console.error("[submitBankTransferReference] ledger meta:", meta.error);
      }
    }
  }

  await booking.populate({ path: "userId", select: "name email avatar" });
  const mentor = await Mentor.findById(booking.mentorId).select("name title company avatar publicId").lean();
  return { ok: true, booking: toPublicBooking(booking, mentor) };
}

/**
 * Admin xác nhận đã nhận tiền CK — giống thanh toán thành công qua cổng.
 */
export async function confirmBankTransferPaymentByAdmin(bookingId, options = {}) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  if (!mongoose.isValidObjectId(bookingId)) {
    return { ok: false, status: 400, error: "id booking không hợp lệ." };
  }
  const force = Boolean(options?.force);
  const forceNote = String(options?.forceNote || "").trim();
  if (force && forceNote.length < 3) {
    return { ok: false, status: 400, error: "Xác nhận ngoại lệ cần lý do rõ ràng (ít nhất 3 ký tự)." };
  }

  try {
    await runInTransaction(async (session) => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw new Error("ERR_404");
      if (booking.paymentMethod !== "transfer") throw new Error("ERR_METHOD");
      if (booking.paymentStatus === "paid") throw new Error("ERR_ALREADY_PAID");
      if (booking.paymentStatus !== "pending") throw new Error("ERR_STATUS");
      if (!force && !booking.transferSubmittedAt) throw new Error("ERR_NO_SUBMIT");

      const ledgerAmt = Math.round(Number(booking.totalAmount ?? booking.price ?? 0));
      if (ledgerAmt > 0) {
        const ledger = await recordAdminTransferSuccess({
          userId: booking.userId,
          type: "booking",
          referenceModel: "Booking",
          referenceId: booking._id,
          amount: ledgerAmt,
          adminUserId: options?.adminUserId || "",
          forceConfirm: force,
          forceNote,
          session,
        });
        if (!ledger.ok && !ledger.idempotent) {
          throw new Error(`ERR_LEDGER:${ledger.error || "unknown"}`);
        }
      }

      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.paidAt = new Date();
      booking.transferConfirmedAt = booking.paidAt;
      booking.transferConfirmedBy =
        options?.adminUserId && mongoose.isValidObjectId(String(options.adminUserId)) ? options.adminUserId : undefined;
      booking.transferForceConfirm = force;
      booking.transferForceNote = force ? forceNote.slice(0, 500) : "";
      await booking.save({ session });
    });
  } catch (error) {
    const msg = String(error?.message || "");
    if (msg === "ERR_404") return { ok: false, status: 404, error: "Không tìm thấy booking." };
    if (msg === "ERR_METHOD") return { ok: false, status: 400, error: "Chỉ áp dụng cho booking thanh toán chuyển khoản." };
    if (msg === "ERR_ALREADY_PAID") return { ok: false, status: 400, error: "Booking đã được đánh dấu đã thanh toán." };
    if (msg === "ERR_STATUS") return { ok: false, status: 400, error: "Trạng thái thanh toán không cho phép xác nhận." };
    if (msg === "ERR_NO_SUBMIT") {
      return { ok: false, status: 400, error: "User chưa báo đã chuyển khoản. Bật override để xác nhận ngoại lệ." };
    }
    if (msg.startsWith("ERR_LEDGER:")) {
      console.error("[confirmBankTransferPaymentByAdmin]", msg);
      return { ok: false, status: 500, error: "Không thể ghi nhận giao dịch thanh toán. Vui lòng thử lại." };
    }
    console.error("[confirmBankTransferPaymentByAdmin]", error?.message || error);
    return { ok: false, status: 500, error: "Không thể xác nhận thanh toán lúc này." };
  }


  const booking = await Booking.findById(bookingId)
    .populate({ 
      path: "mentorId", 
      select: "name title company avatar publicId userId",
      populate: { path: "userId", select: "email" }
    })
    .populate({ path: "userId", select: "name email avatar" });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  return { ok: true, booking: toPublicBooking(booking) };
}

export async function confirmMentorBooking(mentorUserId, rawId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const booking = await Booking.findOne({ _id: rawId, mentorId: mentor._id });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể xác nhận booking ở trạng thái này." };
  }
  if (booking.status === "confirmed" || booking.status === "in_progress") {
    await booking.populate([
      { path: "userId", select: "name email avatar" },
      { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
    ]);
    return { ok: true, booking: toPublicBooking(booking) };

  }
  if (booking.status !== "pending") {
    return { ok: false, status: 400, error: "Chỉ xác nhận khi booking đang chờ duyệt (pending)." };
  }

  booking.status = "confirmed";
  await booking.save();
  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);
  return { ok: true, booking: toPublicBooking(booking) };

}

export async function completeMentorBooking(mentorUserId, rawId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const booking = await Booking.findOne({ _id: rawId, mentorId: mentor._id });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể hoàn thành booking ở trạng thái này." };
  }
  if (!["confirmed", "in_progress"].includes(booking.status)) {
    return {
      ok: false,
      status: 400,
      error: "Chỉ đánh dấu hoàn thành khi booking đã xác nhận hoặc đang diễn ra.",
    };
  }

  booking.status = "completed";
  booking.completedAt = new Date();
  await booking.save();

  const credit = await tryCreditMentorForCompletedBooking(booking._id);
  if (!credit.ok) {
    console.error("[completeMentorBooking] mentor earnings:", credit.error || credit);
  }

  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);
  return { ok: true, booking: toPublicBooking(booking) };
}

export async function updateMentorNotes(mentorUserId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 8000) : "";
  if (!notes) return { ok: false, status: 400, error: "Thiếu notes." };

  const booking = await Booking.findOne({ _id: rawId, mentorId: mentor._id });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };

  booking.mentorNotes = notes;
  await booking.save();
  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);

  // Gửi thông báo & email cho học viên
  const student = booking.userId;
  const mentorData = booking.mentorId;
  
  if (student && student.email) {
    // 1. Tạo thông báo trên Web
    try {
      await Notification.create({
        userId: student._id,
        title: "Nhận xét mới từ Mentor",
        body: `Mentor ${mentorData?.name || "của bạn"} đã gửi nhận xét cho buổi học ${booking.sessionType === "mock_interview" ? "Phỏng vấn giả định" : "Tư vấn lộ trình"}.`,
        type: "feedback",
        metadata: {
          bookingId: booking._id,
          mentorId: mentorData?._id,
          actionUrl: `/session/${booking._id}`
        },
        isRead: false
      });
    } catch (err) {
      console.error("[updateMentorNotes] Notification error:", err.message);
    }

    // 2. Gửi Email
    try {
      await sendMentorFeedbackEmail(
        student.email,
        student.name || "Bạn",
        mentorData?.name || "Mentor",
        booking.sessionType,
        notes
      );
    } catch (err) {
      console.error("[updateMentorNotes] Email error:", err.message);
    }
  }

  return { ok: true, booking: toPublicBooking(booking) };

}

export async function cancelMyBooking(userId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const uid = String(userId).trim();
  const q = bookingQueryForUser(rawId);
  if (!q) return { ok: false, status: 400, error: "Thiếu id booking." };

  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";

  const booking = await Booking.findOne({ userId: uid, ...q });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể hủy booking ở trạng thái này." };
  }

  const sessionAt = parseBookingDateTime(booking.date, booking.timeSlot);
  const hoursUntilStart = sessionAt instanceof Date ? (sessionAt.getTime() - Date.now()) / 3_600_000 : Number.POSITIVE_INFINITY;
  let feePercent = 0;
  if (!Number.isFinite(hoursUntilStart) || hoursUntilStart <= 2) {
    feePercent = 100;
  } else if (hoursUntilStart <= 24) {
    feePercent = 50;
  }

  // Chỉ cập nhật trạng thái thanh toán khi booking đã thanh toán.
  if (booking.paymentStatus === "paid" || booking.paymentStatus === "partial_refund" || booking.paymentStatus === "refunded") {
    if (feePercent >= 100) {
      booking.paymentStatus = "paid";
    } else if (feePercent >= 50) {
      booking.paymentStatus = "partial_refund";
    } else {
      booking.paymentStatus = "refunded";
    }
  }

  booking.status = "cancelled";
  booking.cancelledBy = "user";
  booking.cancelReason = reason || "Người dùng hủy";
  booking.cancelledAt = new Date();
  await booking.save();

  const mentor = await Mentor.findById(booking.mentorId).lean();
  return {
    ok: true,
    booking: toPublicBooking(booking, mentor),
    cancellationPolicy: {
      hoursUntilStart: Number.isFinite(hoursUntilStart) ? Number(hoursUntilStart.toFixed(2)) : null,
      feePercent,
      refundPercent: Math.max(0, 100 - feePercent),
    },
  };
}

export async function rescheduleMyBooking(userId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const uid = String(userId).trim();
  const q = bookingQueryForUser(rawId);
  if (!q) return { ok: false, status: 400, error: "Thiếu id booking." };

  const newDateRaw = typeof body?.newDate === "string" ? body.newDate.trim() : "";
  const newTime = String(body?.newTimeSlot ?? body?.newTime ?? "").trim();
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  const changedBy = body?.changedBy === "mentor" ? "mentor" : "user";

  if (!newDateRaw || !newTime || !/^\d{1,2}:\d{2}$/.test(newTime)) {
    return { ok: false, status: 400, error: "Thiếu newDate hoặc newTimeSlot (HH:mm)." };
  }

  const booking = await Booking.findOne({ userId: uid, ...q });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  if (Array.isArray(booking.rescheduleHistory) && booking.rescheduleHistory.length >= 1) {
    return { ok: false, status: 400, error: "Mỗi lịch hẹn chỉ được dời 1 lần." };
  }

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể đổi lịch booking ở trạng thái này." };
  }

  const newDateNorm = normalizeBookingDate(newDateRaw);
  const [th, tm] = newTime.split(":").map(Number);
  const newSlot = `${String(th).padStart(2, "0")}:${String(tm || 0).padStart(2, "0")}`;
  const mentorDoc = await Mentor.findById(booking.mentorId).select("availableSlots recurringSchedule blockedDates").lean();
  const allowedSlots = getMentorSlotsForDate(mentorDoc, newDateNorm);
  if (Array.isArray(allowedSlots)) {
    if (allowedSlots.length === 0) {
      return { ok: false, status: 400, error: "Mentor không mở lịch cho ngày này." };
    }
    if (!allowedSlots.includes(newSlot)) {
      return { ok: false, status: 400, error: "Khung giờ mới không nằm trong lịch mentor mở." };
    }
  }
  const rescheduleAt = parseBookingDateTime(newDateNorm, newSlot);
  if (!rescheduleAt || Number.isNaN(rescheduleAt.getTime())) {
    return { ok: false, status: 400, error: "Ngày/giờ đổi lịch không hợp lệ." };
  }
  if (rescheduleAt.getTime() <= Date.now()) {
    return { ok: false, status: 400, error: "Không thể đổi lịch sang thời điểm trong quá khứ." };
  }

  const dup = await Booking.findOne({
    mentorId: booking.mentorId,
    date: newDateNorm,
    timeSlot: newSlot,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    _id: { $ne: booking._id },
  })
    .select("_id")
    .lean();
  if (dup) {
    return { ok: false, status: 409, error: "Khung giờ mới đã có người đặt." };
  }

  const entry = {
    oldDate: booking.date,
    oldTimeSlot: booking.timeSlot,
    newDate: newDateNorm,
    newTimeSlot: newSlot,
    reason,
    changedBy,
    changedAt: new Date(),
  };
  booking.rescheduleHistory = [...(booking.rescheduleHistory || []), entry];
  booking.date = newDateNorm;
  booking.timeSlot = newSlot;
  if (booking.status !== "pending") booking.status = "confirmed";
  await booking.save();

  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);
  return { ok: true, booking: toPublicBooking(booking) };

}

export async function cancelMentorBooking(mentorUserId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if (!reason) {
    return { ok: false, status: 400, error: "Vui lòng nhập lý do hủy lịch." };
  }
  const booking = await Booking.findOne({ _id: rawId, mentorId: mentor._id });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };

  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể hủy booking ở trạng thái này." };
  }

  const startAt = parseBookingDateTime(booking.date, booking.timeSlot);
  if (startAt && Number.isFinite(startAt.getTime())) {
    const diffMs = startAt.getTime() - Date.now();
    const minMs = MENTOR_CANCEL_MIN_HOURS * 60 * 60 * 1000;
    if (diffMs > 0 && diffMs < minMs) {
      return {
        ok: false,
        status: 400,
        error: `Không thể hủy khi còn dưới ${MENTOR_CANCEL_MIN_HOURS} giờ trước buổi hẹn.`,
      };
    }
  }

  booking.status = "cancelled";
  booking.cancelledBy = "mentor";
  booking.cancelReason = reason;
  booking.cancelledAt = new Date();
  const refund = await refundBookingPaymentIfNeeded(booking);
  await booking.save();
  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);

  await notifyBookingOwner(booking.userId?._id || booking.userId, {
    type: "booking_cancelled",
    title: "Mentor đã hủy lịch hẹn",
    body: `Buổi hẹn ngày ${booking.date} lúc ${booking.timeSlot} đã bị hủy. Lý do: ${reason}`,
    metadata: {
      bookingId: booking._id,
      mentorId: booking.mentorId?._id || booking.mentorId,
      actionUrl: `/session/${booking._id}`,
    },
  });
  if (refund.refunded) {
    await notifyBookingOwner(booking.userId?._id || booking.userId, {
      type: "system",
      title: "Hoàn tiền lịch hẹn",
      body: `Bạn đã được hoàn ${Math.round(refund.amount).toLocaleString("vi-VN")} VND do mentor hủy lịch.`,
      metadata: {
        bookingId: booking._id,
        mentorId: booking.mentorId?._id || booking.mentorId,
        actionUrl: `/session/${booking._id}`,
      },
    });
  }
  return { ok: true, booking: toPublicBooking(booking) };
}

export async function rescheduleMentorBooking(mentorUserId, rawId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const mentor = await getMentorByUserId(mentorUserId);
  if (!mentor?._id) return { ok: false, status: 404, error: "Không tìm thấy hồ sơ mentor." };
  if (!mongoose.isValidObjectId(rawId)) return { ok: false, status: 400, error: "id booking không hợp lệ." };

  const newDateRaw = typeof body?.newDate === "string" ? body.newDate.trim() : "";
  const newTime = String(body?.newTimeSlot ?? body?.newTime ?? "").trim();
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if (!newDateRaw || !newTime || !/^\d{1,2}:\d{2}$/.test(newTime)) {
    return { ok: false, status: 400, error: "Thiếu newDate hoặc newTimeSlot (HH:mm)." };
  }

  const booking = await Booking.findOne({ _id: rawId, mentorId: mentor._id });
  if (!booking) return { ok: false, status: 404, error: "Không tìm thấy booking." };
  if (Array.isArray(booking.rescheduleHistory) && booking.rescheduleHistory.length >= 1) {
    return { ok: false, status: 400, error: "Mỗi lịch hẹn chỉ được dời 1 lần." };
  }
  if (["cancelled", "completed", "no_show"].includes(booking.status)) {
    return { ok: false, status: 400, error: "Không thể đổi lịch booking ở trạng thái này." };
  }

  const newDateNorm = normalizeBookingDate(newDateRaw);
  const [th, tm] = newTime.split(":").map(Number);
  const newSlot = `${String(th).padStart(2, "0")}:${String(tm || 0).padStart(2, "0")}`;
  const mentorDoc = await Mentor.findById(booking.mentorId).select("availableSlots recurringSchedule blockedDates").lean();
  const allowedSlots = getMentorSlotsForDate(mentorDoc, newDateNorm);
  if (Array.isArray(allowedSlots)) {
    if (allowedSlots.length === 0) return { ok: false, status: 400, error: "Mentor không mở lịch cho ngày này." };
    if (!allowedSlots.includes(newSlot)) return { ok: false, status: 400, error: "Khung giờ mới không nằm trong lịch mentor mở." };
  }
  const rescheduleAt = parseBookingDateTime(newDateNorm, newSlot);
  if (!rescheduleAt || Number.isNaN(rescheduleAt.getTime()) || rescheduleAt.getTime() <= Date.now()) {
    return { ok: false, status: 400, error: "Ngày/giờ đổi lịch không hợp lệ." };
  }
  const dup = await Booking.findOne({
    mentorId: booking.mentorId,
    date: newDateNorm,
    timeSlot: newSlot,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    _id: { $ne: booking._id },
  }).select("_id").lean();
  if (dup) return { ok: false, status: 409, error: "Khung giờ mới đã có người đặt." };

  booking.rescheduleHistory = [
    ...(booking.rescheduleHistory || []),
    { oldDate: booking.date, oldTimeSlot: booking.timeSlot, newDate: newDateNorm, newTimeSlot: newSlot, reason, changedBy: "mentor", changedAt: new Date() },
  ];
  booking.date = newDateNorm;
  booking.timeSlot = newSlot;
  if (booking.status !== "pending") booking.status = "confirmed";
  await booking.save();
  await booking.populate([
    { path: "userId", select: "name email avatar" },
    { path: "mentorId", select: "name title company avatar publicId userId", populate: { path: "userId", select: "email" } }
  ]);

  await notifyBookingOwner(booking.userId?._id || booking.userId, {
    type: "system",
    title: "Lịch hẹn đã được mentor dời",
    body: `Mentor đã dời lịch sang ${booking.date} lúc ${booking.timeSlot}.${reason ? ` Lý do: ${reason}` : ""}`,
    metadata: {
      bookingId: booking._id,
      mentorId: booking.mentorId?._id || booking.mentorId,
      actionUrl: `/session/${booking._id}`,
    },
  });
  return { ok: true, booking: toPublicBooking(booking) };
}

export async function getMentorBookedSlots(mentorKey) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  
  const or = [{ publicId: mentorKey }];
  if (mongoose.isValidObjectId(mentorKey)) or.push({ _id: mentorKey });

  const mentor = await Mentor.findOne({ $or: or }).select("_id").lean();
  if (!mentor) return { ok: false, status: 404, error: "Không tìm thấy mentor." };

  const rows = await Booking.find({
    mentorId: mentor._id,
    status: { $in: ["pending", "confirmed", "in_progress"] },
  })
    .select("date timeSlot")
    .lean();

  const booked = {};
  for (const r of rows) {
    if (!booked[r.date]) booked[r.date] = [];
    booked[r.date].push(r.timeSlot);
  }

  return { ok: true, booked };
}
