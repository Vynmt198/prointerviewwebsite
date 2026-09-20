import { User, Payment, CartOrder } from "../models/index.js";

/** Preserve incoming money for an inactive payer instead of silently granting access. */
export async function holdIfPayerInactive(target, { sepayId, amount }) {
  const user = await User.findById(target.userId).select("isActive accountClosedAt").lean();
  if (user && user.isActive !== false && !user.accountClosedAt) return false;
  let filter;
  if (target.entityType === "cart") {
    const order = await CartOrder.findById(target.entityId).lean();
    filter = { type: "course", referenceId: { $in: order?.items.map((item) => item.enrollmentId) || [] } };
  } else if (target.entityType === "booking_group") filter = { type: "booking", referenceId: { $in: target.entityIds } };
  else if (target.entityType === "subscription") filter = { _id: target.entityId };
  else filter = { type: target.entityType === "enrollment" ? "course" : target.entityType, referenceId: target.entityId };
  await Payment.updateMany({ ...filter, provider: "transfer", status: "pending" }, { $set: {
    status: "held_inactive_account", heldAt: new Date(), heldReason: `SePay #${sepayId}: tài khoản ngừng hoạt động`,
    "providerResponse.heldReceipt": { sepayId, amount },
  } });
  return true;
}
