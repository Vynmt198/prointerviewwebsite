import mongoose from "mongoose";
import { Payment, Booking, Enrollment, CartOrder } from "../models/index.js";
import { getAccountImpact, closeAccount } from "../services/accountClosureService.js";
import { createMentorPayout, transitionPayout } from "../services/payoutService.js";
import { releaseEligibleEarnings, reconcileMentorClearingBalances } from "../services/mentorEarningsService.js";

export const AdminAccountController = {
  impact: async (req, res) => res.json({ success: true, impact: await getAccountImpact(req.params.id) }),
  close: async (req, res) => {
    if (String(req.body?.confirmUserId) !== req.params.id || String(req.body?.reason || "").trim().length < 3)
      return res.status(400).json({ success: false, error: "Cần xác nhận đúng tài khoản và nhập lý do đóng." });
    const result = await closeAccount(req.params.id, { closedBy: req.userId });
    res.status(result.status || 200).json({ ...result, success: result.ok });
  },
  payout: async (req, res) => res.status(201).json({ success: true,
    payout: await createMentorPayout(req.params.id, req.body?.amount, { adminId: req.userId, reason: req.body?.reason }) }),
  approve: async (req, res) => res.json({ success: true, payout: await transitionPayout(req.params.id, "approve", req.userId, req.body) }),
  reject: async (req, res) => res.json({ success: true, payout: await transitionPayout(req.params.id, "reject", req.userId, req.body) }),
  paid: async (req, res) => res.json({ success: true, payout: await transitionPayout(req.params.id, "paid", req.userId, req.body) }),
  reconciliation: async (req, res) => res.json({ success: true, report: await reconcileMentorClearingBalances() }),
  release: async (req, res) => res.json({ success: true, result: await releaseEligibleEarnings() }),
  held: async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const filter = { status: "held_inactive_account" };
    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ heldAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25).populate("userId", "name email").lean(),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, payments, pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / 25)) } });
  },
  refundHeld: async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ success: false, error: "Mã giao dịch không hợp lệ." });
    const transferRef = String(req.body?.transferRef || "").trim().slice(0, 500);
    const reason = String(req.body?.reason || "").trim().slice(0, 2000);
    if (transferRef.length < 3 || reason.length < 3) return res.status(400).json({ success: false, error: "Cần mã chuyển khoản hoàn và lý do đối soát." });
    const pay = await Payment.findOneAndUpdate({ _id: req.params.id, status: "held_inactive_account", amount: Number(req.body?.amount) },
      { $set: { status: "refunded", refundedAt: new Date(), refundAmount: Number(req.body.amount),
        "providerResponse.refundTransferRef": transferRef, "providerResponse.refundReason": reason, "providerResponse.refundConfirmedBy": req.userId } }, { returnDocument: "after" });
    if (!pay) return res.status(409).json({ success: false, error: "Trạng thái hoặc số tiền không khớp; vui lòng tải lại." });
    if (pay.type === "booking") await Booking.updateOne({ _id: pay.referenceId, paymentStatus: { $ne: "paid" } },
      { $set: { status: "cancelled", paymentStatus: "refunded" } });
    if (pay.type === "course") {
      const enrollment = await Enrollment.findOne({ _id: pay.referenceId, paymentStatus: "pending" });
      if (enrollment?.cartOrderId) await CartOrder.updateOne({ _id: enrollment.cartOrderId, status: "pending" },
        { $set: { status: "expired", active: false } });
      await Enrollment.deleteOne({ _id: pay.referenceId, paymentStatus: "pending" });
    }
    res.json({ success: true, payment: pay });
  },
};
