import mongoose from "mongoose";

const { Schema } = mongoose;
const itemSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  originalPrice: { type: Number, required: true },
  price: { type: Number, required: true },
  discountRate: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponDiscountAmount: { type: Number, default: 0 },
  platformFeeRate: { type: Number, required: true },
  platformFee: { type: Number, required: true },
}, { _id: false });

// An immutable price snapshot owns the shared bank-transfer reference. Enrollment keeps
// its unique paymentRef index; individual ledger rows remain compatible with admin finance.
const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orderRef: { type: String, required: true, unique: true },
  items: { type: [itemSchema], required: true },
  totalAmount: { type: Number, required: true },
  couponCode: { type: String, default: "" },
  status: { type: String, enum: ["preparing", "pending", "paid", "expired"], default: "preparing" },
  active: { type: Boolean, default: true },
  paymentExpiresAt: { type: Date, required: true },
  paidAt: Date,
  invoiceSnapshot: { type: Schema.Types.Mixed },
  fulfilledAt: Date,
  fulfillmentLockUntil: Date,
  paymentNote: String,
  confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { collection: "cart_orders", timestamps: true });
schema.index({ userId: 1 }, { unique: true, partialFilterExpression: { active: true } });

export const CartOrder = mongoose.models.CartOrder ?? mongoose.model("CartOrder", schema);
