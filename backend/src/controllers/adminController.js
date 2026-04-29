import mongoose from "mongoose";
const User = mongoose.model("User");
const Mentor = mongoose.model("Mentor");
const Booking = mongoose.model("Booking");
const Course = mongoose.model("Course");

export const AdminController = {
  // Lấy danh sách toàn bộ mentor (chỉ hiện những người vẫn còn role mentor ở bảng User)
  getAllMentors: async (req, res) => {
    try {
      // Ép hệ thống kiểm tra và tạo hồ sơ mới nếu bạn vừa sửa ở Compass
      const { ensureMentorProfilesForAllMentorUsers } = await import("../services/mentorProfileService.js");
      await ensureMentorProfilesForAllMentorUsers();

      const mentors = await Mentor.find()
        .populate("userId", "name email avatar role isActive")
        .sort({ createdAt: -1 })
        .lean();
      
      // Lọc bỏ những ai đã bị đổi role ở bảng User nhưng vẫn còn record ở bảng Mentor
      const filtered = mentors.filter(m => m.userId && m.userId.role === "mentor");
      
      res.json({ success: true, mentors: filtered });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Duyệt/Kích hoạt mentor
  toggleMentorStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const mentor = await Mentor.findByIdAndUpdate(
        id, 
        { isActive }, 
        { new: true }
      );
      
      if (!mentor) return res.status(404).json({ success: false, error: "Không tìm thấy mentor" });
      
      res.json({ success: true, mentor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Lấy danh sách toàn bộ User
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Khóa/Mở khóa User — khóa: vô hiệu JWT + xóa refresh (tokenVersion++, authSessions [])
  toggleUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      let user;
      if (isActive === false) {
        user = await User.findByIdAndUpdate(
          id,
          { $set: { isActive: false, authSessions: [] }, $inc: { tokenVersion: 1 } },
          { new: true },
        );
      } else {
        user = await User.findByIdAndUpdate(id, { $set: { isActive: true } }, { new: true });
      }
      if (!user) return res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Lấy danh sách toàn bộ Booking
  getAllBookings: async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate("mentorId", "name email")
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
      res.json({ success: true, bookings });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Danh sách khóa học chờ duyệt
  getPendingCourses: async (_req, res) => {
    try {
      const courses = await Course.find({ status: { $in: ["pending_review", "pending_update"] } })
        .populate({
          path: "mentorId",
          select: "userId",
          populate: { path: "userId", select: "name email avatar" },
        })
        .sort({ updatedAt: -1 });
      res.json({ success: true, courses });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Duyệt khóa học
  approveCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });
      if (course.status === "pending_update" && course.pendingUpdate) {
        const next = course.pendingUpdate;
        course.title = next.title ?? course.title;
        course.description = next.description ?? course.description;
        course.thumbnail = next.thumbnail ?? course.thumbnail;
        course.level = next.level ?? course.level;
        course.price = Number.isFinite(Number(next.price)) ? Number(next.price) : course.price;
        course.isFree = typeof next.isFree === "boolean" ? next.isFree : course.isFree;
        course.tags = Array.isArray(next.tags) ? next.tags : course.tags;
        course.topics = Array.isArray(next.topics) ? next.topics : course.topics;
        course.whatYoullLearn = Array.isArray(next.whatYoullLearn) ? next.whatYoullLearn : course.whatYoullLearn;
        course.modules = Array.isArray(next.modules) ? next.modules : course.modules;
      }
      course.pendingUpdate = null;
      course.status = "published";
      course.publishedAt = new Date();
      await course.save();
      res.json({ success: true, course });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Từ chối khóa học: trả lại nháp để mentor sửa
  rejectCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });
      if (course.status === "pending_update") {
        // Giữ khóa hiện tại vẫn public, chỉ bỏ bản cập nhật đang chờ.
        course.pendingUpdate = null;
        course.status = "published";
      } else {
        // pending_review (khóa mới) -> trả lại nháp.
        course.status = "draft";
      }
      await course.save();
      res.json({ success: true, course });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Thống kê nhanh cho Dashboard
  getStats: async (req, res) => {
    try {
      const [userCount, mentorCount, bookingCount, recentBookings] = await Promise.all([
        User.countDocuments({ role: "customer" }),
        Mentor.countDocuments(),
        Booking.countDocuments(),
        Booking.find().sort({ createdAt: -1 }).limit(5).populate("mentorId userId")
      ]);

      res.json({
        success: true,
        stats: {
          users: userCount,
          mentors: mentorCount,
          bookings: bookingCount,
          recentBookings
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
