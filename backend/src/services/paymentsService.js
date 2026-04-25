import crypto from "node:crypto";
import qs from "node:querystring";
import mongoose from "mongoose";
import { Payment } from "../models/Payment.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";

const MONGO_ERR = "MongoDB chưa kết nối. Kiểm tra MONGO_URI trong .env.";

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function webhookSecret() {
  return typeof process.env.PAYMENT_WEBHOOK_SECRET === "string" ? process.env.PAYMENT_WEBHOOK_SECRET.trim() : "";
}

/**
 * Khởi tạo thanh toán: tạo bản ghi Payment + trả URL cổng thanh toán.
 * @param {string} userId
 * @param {object} body { type, provider, amount, bookingId, planKey, ipAddr }
 */
export async function initiatePayment(userId, body) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  if (!mongoose.isValidObjectId(userId)) return { ok: false, status: 401, error: "Phiên không hợp lệ." };

  const type = String(body?.type ?? "booking").toLowerCase();
  const provider = String(body?.provider ?? "momo").toLowerCase();
  if (!["momo", "zalopay", "vnpay", "card"].includes(provider)) {
    return { ok: false, status: 400, error: "provider không hợp lệ (momo, zalopay, vnpay, card)." };
  }

  const providerEnum = provider === "zalopay" ? "zalopay" : provider === "vnpay" ? "vnpay" : provider === "card" ? "card" : "momo";

  let amount = Number(body?.amount);
  let referenceId;
  let referenceModel = "Booking";
  let providerResponse;

  if (type === "booking") {
    const bid = body?.bookingId;
    if (!bid || !mongoose.isValidObjectId(bid)) {
      return { ok: false, status: 400, error: "bookingId (ObjectId) bắt buộc khi type=booking." };
    }
    const b = await Booking.findOne({ _id: bid, userId }).lean();
    if (!b) return { ok: false, status: 404, error: "Không tìm thấy booking." };
    amount = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : Math.round(b.totalAmount ?? b.price ?? 0);
    referenceId = b._id;
  } else if (type === "subscription") {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, status: 400, error: "amount bắt buộc khi type=subscription." };
    }
    amount = Math.round(amount);
    referenceId = new mongoose.Types.ObjectId(String(userId));
    referenceModel = "Subscription";
    const rawPlan = String(body?.planKey ?? body?.plan ?? "starter_pro").toLowerCase();
    const subscriptionPlan = rawPlan.includes("elite") ? "elite_pro" : "starter_pro";
    providerResponse = { plan: subscriptionPlan };
  } else {
    return { ok: false, status: 400, error: "type phải là booking hoặc subscription." };
  }

  // Tạo mã tham chiếu ngắn gọn (10 ký tự) để đảm bảo VNPay Sandbox không bị lỗi không tìm thấy đơn hàng
  const providerRef = crypto.randomBytes(5).toString('hex').toUpperCase();

  const pay = await Payment.create({
    userId,
    type,
    referenceId,
    referenceModel,
    amount,
    currency: "VND",
    provider: providerEnum,
    providerRef,
    status: "pending",
    ...(providerResponse ? { providerResponse } : {}),
  });

  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173";
  let payUrl = `${base}/#/checkout?paymentId=${pay._id.toString()}&mock=1`;
  let isMock = true;

  // Xử lý VNPay thật (Sandbox)
  if (providerEnum === "vnpay" && process.env.VNP_TMN_CODE && process.env.VNP_HASH_SECRET) {
    const ipAddr = body?.ipAddr || "127.0.0.1";
    // Sử dụng providerRef (UUID) thay vì ObjectId để đảm bảo định dạng linh hoạt cho VNPay
    payUrl = createVnpayUrl(pay.providerRef, amount, ipAddr);
    isMock = false;
  }

  return {
    ok: true,
    paymentId: pay._id.toString(),
    providerRef,
    payUrl,
    qrBase64: null,
    deepLink: null,
    mock: isMock,
    message: isMock 
      ? "Sandbox: chưa gọi provider API thật. Dùng payUrl để giả lập."
      : "Redirecting to VNPay gateway.",
  };
}

/** ─── VNPay Helpers ─── */

function createVnpayUrl(paymentId, amount, ipAddr) {
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  let vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNP_RETURN_URL;

  const date = new Date();
  const createDate = formatVnpDate(date);

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = paymentId; // Đây là providerRef
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan ProInterview';
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = Math.round(amount * 100);
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ? '127.0.0.1' : ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  const sortedKeys = Object.keys(vnp_Params).sort();
  let signData = "";
  let query = "";

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const val = vnp_Params[key];
    if (val !== undefined && val !== null && val !== "") {
      const encodedKey = encodeURIComponent(key);
      const encodedVal = encodeURIComponent(val).replace(/%20/g, "+");
      if (signData.length > 0) {
        signData += "&";
        query += "&";
      }
      signData += encodedKey + "=" + encodedVal;
      query += encodedKey + "=" + encodedVal;
    }
  }

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex").toUpperCase();
  
  return vnpUrl + "?" + query + "&vnp_SecureHash=" + signed;
}


function sortVnpObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}


function formatVnpDate(date) {
  const year = date.getFullYear();
  const month = (1 + date.getMonth()).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}


export async function listPaymentHistory(userId, limit = 50) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  const rows = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();
  return {
    ok: true,
    payments: rows.map((p) => ({
      id: String(p._id),
      type: p.type,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      referenceId: String(p.referenceId),
      providerRef: p.providerRef,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    })),
  };
}

async function finalizePaymentSuccess(paymentId) {
  const pay = await Payment.findById(paymentId);
  if (!pay || pay.status === "success") return { ok: pay ? true : false, already: pay?.status === "success" };

  pay.status = "success";
  pay.paidAt = new Date();
  await pay.save();

  if (pay.type === "booking" && pay.referenceModel === "Booking") {
    await Booking.findByIdAndUpdate(pay.referenceId, {
      $set: { paymentStatus: "paid", status: "confirmed", paidAt: new Date() },
    });
  }
  if (pay.type === "subscription") {
    const plan = pay.providerResponse?.plan === "elite_pro" ? "elite_pro" : "starter_pro";
    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
    const quota =
      plan === "elite_pro"
        ? { cvAnalysisLimit: 999, interviewLimit: 999 }
        : { cvAnalysisLimit: 20, interviewLimit: 10 };
    await User.findByIdAndUpdate(pay.userId, {
      $set: {
        plan,
        planExpiresAt,
        "quota.cvAnalysisLimit": quota.cvAnalysisLimit,
        "quota.interviewLimit": quota.interviewLimit,
      },
    });
  }
  return { ok: true };
}

export async function handleWebhookMomo(reqBody, headerSecret) {
  const secret = webhookSecret();
  if (!secret) return { ok: false, status: 503, error: "Chưa cấu hình PAYMENT_WEBHOOK_SECRET." };
  if (headerSecret !== secret) return { ok: false, status: 401, error: "Unauthorized" };

  const paymentId = reqBody?.paymentId || reqBody?.orderId;
  if (!paymentId || !mongoose.isValidObjectId(paymentId)) {
    return { ok: false, status: 400, error: "Thiếu paymentId hợp lệ." };
  }
  const r = await finalizePaymentSuccess(paymentId);
  if (!r.ok) return { ok: false, status: 404, error: "Không tìm thấy payment." };
  return { ok: true };
}

export async function handleWebhookZalopay(reqBody, headerSecret) {
  return handleWebhookMomo(reqBody, headerSecret);
}

export async function handleIpnVnpay(vnp_Params) {
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedKeys = Object.keys(vnp_Params).sort();
  let signData = "";
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const val = vnp_Params[key];
    if (val !== undefined && val !== null && val !== "") {
      if (signData.length > 0) signData += "&";
      signData += encodeURIComponent(key) + "=" + encodeURIComponent(val).replace(/%20/g, "+");
    }
  }

  const secretKey = process.env.VNP_HASH_SECRET;
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  if (secureHash.toUpperCase() === signed.toUpperCase()) {
    const txnRef = vnp_Params['vnp_TxnRef']; // Đây là providerRef
    const rspCode = vnp_Params['vnp_ResponseCode'];
    if (rspCode === "00") {
      const pay = await Payment.findOne({ providerRef: txnRef });
      if (pay) await finalizePaymentSuccess(pay._id);
      return { ok: true, data: { RspCode: '00', Message: 'Success' } };
    } else {
      return { ok: true, data: { RspCode: '00', Message: 'Confirm Success (Transaction Failed)' } };
    }
  } else {
    return { ok: false, status: 400, data: { RspCode: '97', Message: 'Checksum failed' } };
  }
}
