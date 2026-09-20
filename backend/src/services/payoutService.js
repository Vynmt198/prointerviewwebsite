import mongoose from "mongoose";
import { Mentor } from "../models/Mentor.js";
import { PayoutRequest } from "../models/PayoutRequest.js";
import { runInTransaction } from "../helpers/dbHelper.js";

function fail(message, status = 409) { throw Object.assign(new Error(message), { statusCode: status }); }
export async function createMentorPayout(mentorId, amount, { adminId, reason = "" } = {}) {
  if (!mongoose.isObjectIdOrHexString(mentorId)) fail("Mã mentor không hợp lệ.", 400);
  amount = Number(amount);
  if (!Number.isSafeInteger(amount) || amount < (adminId ? 1 : 100000)) fail("Số tiền rút không hợp lệ.", 400);
  if (adminId && String(reason).trim().length < 3) fail("Cần ghi lý do giải ngân thay mentor.", 400);
  const mentor = await Mentor.findById(mentorId).lean();
  if (!mentor || mentor.status === "closed") fail("Hồ sơ mentor không còn khả dụng.", 404);
  const account = mentor.finance?.bankAccount;
  if (!account?.bankName || !account?.accountNumber || !account?.accountName) fail("Mentor chưa có tài khoản ngân hàng nhận tiền hợp lệ.", 400);
  const id = new mongoose.Types.ObjectId();
  return runInTransaction(async (session) => {
    const debited = await Mentor.updateOne({ _id: mentorId, status: { $ne: "closed" }, "finance.availableBalance": { $gte: amount } },
      { $inc: { "finance.availableBalance": -amount, "finance.pendingBalance": amount } }, { session });
    if (!debited.modifiedCount) fail("Số dư khả dụng không đủ.");
    try {
      const [payout] = await PayoutRequest.create([{ _id: id, mentorId, amount, payoutAccount: account,
        ...(adminId ? { createdByAdmin: adminId, adminReason: String(reason).trim().slice(0, 2000) } : {}) }], { session });
      return payout;
    } catch (error) {
      if (!session) await Mentor.updateOne({ _id: mentorId }, { $inc: { "finance.availableBalance": amount, "finance.pendingBalance": -amount } });
      throw error;
    }
  });
}

export async function transitionPayout(id, action, adminId, body = {}) {
  if (!mongoose.isObjectIdOrHexString(id)) fail("Mã rút tiền không hợp lệ.", 400);
  const nextStatus = { approve: "approved", reject: "rejected", paid: "paid" }[action];
  if (!nextStatus) fail("Thao tác không hợp lệ.", 400);
  const previous = action === "paid" ? "approved" : "pending";
  const transferRef = String(body.transferRef || "").trim().slice(0, 500);
  if (action === "paid" && transferRef.length < 3) fail("Cần mã giao dịch ngân hàng để xác nhận đã chi.", 400);
  if (action === "reject" && String(body.reason || "").trim().length < 3) fail("Cần lý do từ chối.", 400);
  return runInTransaction(async (session) => {
    const now = new Date();
    const payout = await PayoutRequest.findOneAndUpdate({ _id: id, status: previous }, { $set: {
      status: nextStatus, reviewedAt: now, reviewedBy: adminId, note: String(body.note || "").slice(0, 2000),
      ...(action === "paid" ? { paidAt: now, transferRef } : {}),
      ...(action === "reject" ? { rejectReason: String(body.reason).slice(0, 2000) } : {}),
    } }, { returnDocument: "after", session });
    if (!payout) fail("Yêu cầu không ở trạng thái cho phép thao tác.");
    if (action === "approve") return payout;
    try {
      const settled = await Mentor.updateOne({ _id: payout.mentorId, "finance.pendingBalance": { $gte: payout.amount } },
        { $inc: { "finance.pendingBalance": -payout.amount, ...(action === "reject" ? { "finance.availableBalance": payout.amount } : {}) } }, { session });
      if (!settled.modifiedCount) fail("Số dư chờ rút không khớp. Cần đối soát trước khi xử lý.");
      return payout;
    } catch (error) {
      if (!session) await PayoutRequest.updateOne({ _id: id, status: nextStatus }, { $set: { status: previous }, $unset: { paidAt: 1, transferRef: 1 } });
      throw error;
    }
  });
}
