import mongoose from "mongoose";
import { User, CartOrder } from "../models/index.js";
import { resolveInvoiceContext, buildInvoicePdfBuffer } from "../services/invoiceService.js";

export function invoiceHandler(type = "payment") {
  return async (req, res) => {
    const user = await User.findById(req.userId).select("role").lean();
    let ctx;
    if (type === "cart") {
      if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ success: false, error: "Mã đơn không hợp lệ." });
      const order = await CartOrder.findOne({ _id: req.params.id, ...(user?.role === "admin" ? {} : { userId: req.userId }) });
      if (!order) return res.status(404).json({ success: false, error: "Không tìm thấy đơn." });
      if (order.status !== "paid" || !order.fulfilledAt) return res.status(409).json({ success: false, error: "Đơn chưa hoàn tất thanh toán." });
      if (!order.invoiceSnapshot) {
        const buyer = await User.findById(order.userId).select("name email").lean();
        const snapshot = { buyer: { name: buyer?.name, email: buyer?.email }, items: order.items.map((i) => ({ title: i.title, price: i.price })),
          total: order.totalAmount, subtotal: order.totalAmount, vat: 0, paidAt: order.paidAt };
        await CartOrder.updateOne({ _id: order._id, invoiceSnapshot: null }, { $set: { invoiceSnapshot: snapshot } });
        order.invoiceSnapshot = (await CartOrder.findById(order._id).select("invoiceSnapshot")).invoiceSnapshot;
      }
      ctx = { ...order.invoiceSnapshot, payment: { _id: order._id, provider: "transfer", providerRef: order.orderRef } };
    } else {
      ctx = await resolveInvoiceContext({ ...(type === "payment" ? { paymentId: req.params.id } : { type, referenceId: req.params.id }),
        requesterUserId: req.userId, requesterIsAdmin: user?.role === "admin" });
      if (!ctx.ok) return res.status(ctx.status).json({ success: false, error: ctx.error });
    }
    const buffer = await buildInvoicePdfBuffer(ctx);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="invoice-${ctx.payment._id}.pdf"`, "Cache-Control": "private, no-store" });
    res.send(buffer);
  };
}
