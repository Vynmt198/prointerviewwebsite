/**
 * Chẩn đoán user + payment subscription
 * node src/scripts/diagnoseUserPlan.js tram23749@gmail.com
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const email = (process.argv[2] || "tram23749@gmail.com").toLowerCase().trim();
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prointerview";

await mongoose.connect(uri);
const user = await User.findOne({ email }).lean();
if (!user) {
  console.log("Không tìm thấy user:", email);
  process.exit(1);
}
console.log("\n=== USER ===");
console.log({
  id: String(user._id),
  email: user.email,
  plan: user.plan,
  planExpiresAt: user.planExpiresAt,
  quota: user.quota,
});

const payments = await Payment.find({ userId: user._id })
  .sort({ createdAt: -1 })
  .limit(15)
  .lean();
console.log("\n=== PAYMENTS (15 mới nhất) ===");
for (const p of payments) {
  console.log({
    id: String(p._id),
    type: p.type,
    status: p.status,
    amount: p.amount,
    provider: p.provider,
    providerRef: p.providerRef,
    referenceId: String(p.referenceId),
    plan: p.providerResponse?.plan,
    submittedAt: p.providerResponse?.submittedAt,
    confirmedAt: p.providerResponse?.confirmedAt,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  });
}

await mongoose.disconnect();
