import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { Payment } from "../models/Payment.js";
import { Booking } from "../models/Booking.js";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Mentor } from "../models/Mentor.js";
import { User } from "../models/User.js";
import { planKeyFromSubscriptionMeta } from "../utils/planKeys.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** pdfkit dùng Standard 14 fonts (WinAnsi) không hiển thị đúng dấu tiếng Việt — nhúng DejaVu Sans (full Unicode). */
const FONT_REGULAR_PATH = path.join(__dirname, "../assets/fonts/DejaVuSans.ttf");
const FONT_BOLD_PATH = path.join(__dirname, "../assets/fonts/DejaVuSans-Bold.ttf");

const SESSION_TYPE_LABELS = {
  mock_interview: "Phỏng vấn thử",
  cv_review: "Review CV",
  career_consulting: "Tư vấn định hướng",
  custom: "Buổi tư vấn",
};

const PLAN_LABELS = {
  free: "Free",
  starter_pro: "Pro",
  elite_pro: "Elite",
};

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function vnDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

async function loadReferenceDescription(payment) {
  const t = payment.type;
  if (t === "booking") {
    const booking = await Booking.findById(payment.referenceId).lean();
    if (!booking) return { description: "Buổi mentor", subtotal: payment.amount, vat: 0 };
    const mentor = await Mentor.findById(booking.mentorId).select("name").lean();
    const label = SESSION_TYPE_LABELS[booking.sessionType] || "Buổi mentor";
    const description = `${label} với ${mentor?.name || "mentor"} — ${booking.date} ${booking.timeSlot}`;
    const total = Math.round(Number(booking.totalAmount ?? payment.amount) || 0);
    const vat = Math.round(Number(booking.vat) || 0);
    return { description, subtotal: total - vat, vat };
  }
  if (t === "course") {
    const enrollment = await Enrollment.findById(payment.referenceId).select("courseId").lean();
    const course = enrollment ? await Course.findById(enrollment.courseId).select("title").lean() : null;
    const description = `Khóa học — ${course?.title || "Khóa học"}`;
    return { description, subtotal: payment.amount, vat: 0 };
  }
  if (t === "subscription") {
    const plan = planKeyFromSubscriptionMeta(payment.providerResponse?.plan) || "starter_pro";
    const billing = payment.providerResponse?.billing === "yearly" ? "Hàng năm" : "Hàng tháng";
    const description = `Gói ${PLAN_LABELS[plan] || plan} (${billing})`;
    return { description, subtotal: payment.amount, vat: 0 };
  }
  return { description: "Giao dịch", subtotal: payment.amount, vat: 0 };
}

/**
 * Tìm payment + xác thực quyền xem hóa đơn, trả về context đủ để render PDF.
 * Chỉ giao dịch `status: "success"` mới có hóa đơn.
 */
export async function resolveInvoiceContext({
  paymentId,
  type,
  referenceId,
  requesterUserId,
  requesterIsAdmin,
}) {
  if (!isMongoReady()) return { ok: false, status: 503, error: "MongoDB chưa kết nối." };

  let payment;
  if (paymentId) {
    if (!mongoose.isValidObjectId(paymentId)) return { ok: false, status: 400, error: "paymentId không hợp lệ." };
    payment = await Payment.findById(paymentId).lean();
  } else {
    if (!mongoose.isValidObjectId(referenceId)) return { ok: false, status: 400, error: "id không hợp lệ." };
    payment = await Payment.findOne({ type, referenceId, status: "success" })
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();
  }

  if (!payment) return { ok: false, status: 404, error: "Không tìm thấy giao dịch." };
  if (payment.status !== "success") {
    return { ok: false, status: 400, error: "Giao dịch chưa thanh toán thành công." };
  }
  if (!requesterIsAdmin && String(payment.userId) !== String(requesterUserId)) {
    return { ok: false, status: 403, error: "Bạn không có quyền xem hóa đơn này." };
  }

  if (payment.invoiceSnapshot) return { ok: true, payment, ...payment.invoiceSnapshot };

  const buyerUser = await User.findById(payment.userId).select("name email").lean();
  const buyer = {
    name: payment.invoiceName || buyerUser?.name || "",
    email: payment.invoiceEmail || buyerUser?.email || "",
    address: payment.invoiceAddress || "",
  };

  const { description, subtotal, vat } = await loadReferenceDescription(payment);
  const total = Math.round(Number(payment.amount) || 0);

  const context = {
    buyer,
    description,
    subtotal: Math.max(0, subtotal),
    vat: Math.max(0, vat),
    total,
    paidAt: payment.paidAt || payment.createdAt,
  };
  const saved = await Payment.findOneAndUpdate({ _id: payment._id, invoiceSnapshot: null },
    { $set: { invoiceSnapshot: context } }, { returnDocument: "after" }).lean();
  const snapshot = saved?.invoiceSnapshot || (await Payment.findById(payment._id).select("invoiceSnapshot").lean())?.invoiceSnapshot || context;
  return { ok: true, payment, ...snapshot };
}

const SELLER_NAME = process.env.INVOICE_SELLER_NAME || "ProInterview";
const SELLER_ADDRESS = process.env.INVOICE_SELLER_ADDRESS || "";
const SELLER_EMAIL = process.env.INVOICE_SELLER_EMAIL || "";

function invoiceNumberFor(payment) {
  return `INV-${String(payment._id).toUpperCase()}`;
}

const PROVIDER_LABELS = {
  momo: "MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
  card: "Thẻ",
  transfer: "Chuyển khoản ngân hàng",
};

function vnd(n) {
  return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
}

/** Flow layout lets Vietnamese names and long course titles wrap without overlapping. */
export function buildInvoicePdfBuffer(ctx) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("App", FONT_REGULAR_PATH).registerFont("Bold", FONT_BOLD_PATH);
    doc.font("Bold").fontSize(24).fillColor("#352064").text("HÓA ĐƠN THANH TOÁN");
    doc.moveDown().font("App").fontSize(10).fillColor("#333");
    doc.text(`Số hóa đơn: ${invoiceNumberFor(ctx.payment)}`);
    doc.text(`Ngày thanh toán: ${vnDate(ctx.paidAt)}`);
    doc.text(`Mã tham chiếu: ${ctx.payment.providerRef || ctx.payment._id}`);
    doc.text(`Phương thức: ${PROVIDER_LABELS[ctx.payment.provider] || ctx.payment.provider}`);
    doc.moveDown().font("Bold").text("Bên bán");
    doc.font("App").text(SELLER_NAME);
    if (SELLER_ADDRESS) doc.text(SELLER_ADDRESS);
    if (SELLER_EMAIL) doc.text(SELLER_EMAIL);
    doc.moveDown().font("Bold").text("Bên mua");
    doc.font("App").text(ctx.buyer.name || "Khách hàng");
    if (ctx.buyer.email) doc.text(ctx.buyer.email);
    if (ctx.buyer.address) doc.text(ctx.buyer.address);
    doc.moveDown().font("Bold").text("Nội dung thanh toán");
    const items = ctx.items || [{ title: ctx.description, price: ctx.total }];
    for (const [index, item] of items.entries()) {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.5).font("App").text(`${index + 1}. ${item.title}`);
      doc.text(vnd(item.price), { align: "right" });
    }
    if (doc.y > 620) doc.addPage();
    doc.moveDown().font("App").text(`Tạm tính: ${vnd(ctx.subtotal)}`, { align: "right" });
    doc.text(`VAT: ${vnd(ctx.vat)}`, { align: "right" });
    doc.moveDown(0.5).font("Bold").fontSize(14).text(`Tổng đã thanh toán: ${vnd(ctx.total)}`, { align: "right" });
    doc.moveDown(2).font("App").fontSize(8).fillColor("#666")
      .text("Chứng từ xác nhận thanh toán trên ProInterview. Thông tin được lưu phục vụ tra cứu và đối soát.", { align: "left" });
    doc.end();
  });
}
