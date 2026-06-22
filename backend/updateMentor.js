import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').find({ role: 'mentor' }).toArray();
  for (const u of users) {
    console.log(`Updating ${u.name}...`);
    await db.collection('users').updateOne(
      { _id: u._id },
      { $set: { specialties: ["• QUẢN LÝ TRỰC TIẾP ĐỘI NGŨ HƠN 20 NHÂN SỰ VÀ 3 TEAM LEADER. • ĐẠT DANH HIỆU QUẢN LÝ KINH DOANH XUẤT SẮC NHẤT 3 NĂM LIÊN TIẾP (2023 - 2025). • TRỰC TIẾP TUYỂN DỤNG"] } }
    );
  }
  process.exit(0);
}

run().catch(console.error);
