import mongoose from "mongoose";

// Adapted from BookingMentorPlatform: one persistent cart per customer; courses have quantity 1.
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
}, { collection: "carts", timestamps: true });

export const Cart = mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);
