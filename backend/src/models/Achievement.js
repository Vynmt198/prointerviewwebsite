import mongoose from "mongoose";

const { Schema } = mongoose;

const achievementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    images: [{ type: String }],
    category: { type: String, enum: ["Tin tức", "Hoạt động", "Sự kiện"], default: "Hoạt động" },
    isPublished: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
  },
  { collection: "achievements", timestamps: true }
);

achievementSchema.index({ isPublished: 1, date: -1 });

export const Achievement = mongoose.models.Achievement ?? mongoose.model("Achievement", achievementSchema);
