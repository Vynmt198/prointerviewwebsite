import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Mentor } from "../models/Mentor.js";
import { enrollmentAccessGranted } from "../helpers/enrollmentAccess.js";
import { serializeCourseForApi } from "../utils/resolveStoredUploadUrl.js";

function normalizeCoursePayload(body = {}) {
  const chapters = Array.isArray(body.chapters) ? body.chapters : [];
  const modules = chapters.map((ch, idx) => ({
    title: String(ch.title || `Chương ${idx + 1}`).trim(),
    order: idx + 1,
    lessons: (Array.isArray(ch.lessons) ? ch.lessons : []).map((lesson, lidx) => ({
      title: String(lesson.title || `Bài ${lidx + 1}`).trim(),
      type: "video",
      videoUrl: String(lesson.videoUrl || lesson.videoFileName || "").trim(),
      durationMinutes: Number(lesson.duration || lesson.durationMinutes || 0),
      order: lidx + 1,
      isFree: Boolean(lesson.isPreview || lesson.isFree),
    })),
  }));

  const tags =
    typeof body.tags === "string"
      ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : Array.isArray(body.tags)
        ? body.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];

  const whatYoullLearn = Array.isArray(body.whatYoullLearn)
    ? body.whatYoullLearn.map((s) => String(s).trim()).filter(Boolean)
    : Array.isArray(body.outcomes)
      ? body.outcomes.map((s) => String(s).trim()).filter(Boolean)
      : [];

  const topicMap = {
    "behavioral-interview": "Behavioral",
    "technical-interview": "Technical",
    "career-development": "Other",
  };
  const topic = topicMap[String(body.category || "").trim()] || "Other";

  return {
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    thumbnail: String(body.thumbnail || "").trim(),
    level: ["basic", "intermediate", "advanced"].includes(String(body.level))
      ? String(body.level)
      : "basic",
    price: Number(body.price || 0),
    isFree: Number(body.price || 0) <= 0,
    tags,
    topics: [topic],
    whatYoullLearn,
    modules,
  };
}

export const CoursesController = {
  /** Danh sách khóa học */
  list: async (req, res) => {
    try {
      const courses = await Course.find({ status: { $in: ["published", "pending_update"] } })
        .populate({
          path: "mentorId",
          select: "userId stats",
          populate: { path: "userId", select: "name avatar desiredPosition currentCompany" }
        })
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        courses: courses.map((c) => serializeCourseForApi(c)),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Chi tiết khóa học */
  getById: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id)
        .populate({
          path: "mentorId",
          select: "userId stats",
          populate: { path: "userId", select: "name avatar desiredPosition currentCompany" }
        });
      if (!course) {
        return res.status(404).json({ success: false, error: "Khóa học không tồn tại" });
      }
      res.json({ success: true, course: serializeCourseForApi(course) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Danh sách khóa học của mentor hiện tại */
  listMine: async (req, res) => {
    try {
      const mentor = await Mentor.findOne({ userId: req.userId }).select("_id").lean();
      if (!mentor) return res.status(403).json({ success: false, error: "Tài khoản chưa là mentor." });
      const courses = await Course.find({ mentorId: mentor._id }).sort({ updatedAt: -1 }).lean();
      return res.json({ success: true, courses });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Nội dung bài học */
  getLessonContent: async (req, res) => {
    try {
      const { id: courseId, lessonId } = req.params;
      const userId = req.userId;

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, error: "Khóa học không tồn tại" });

      // Tìm bài học trong các modules
      let lesson = null;
      if (course.modules) {
        for (const module of course.modules) {
          const found = module.lessons.find((l) => l._id.toString() === lessonId);
          if (found) {
            lesson = found;
            break;
          }
        }
      }

      if (!lesson) return res.status(404).json({ success: false, error: "Bài học không tồn tại" });

      // Kiểm tra quyền truy cập (nếu không miễn phí thì phải có ghi danh)
      if (!lesson.isFree) {
        const enrolled = await Enrollment.findOne({ userId, courseId });
        if (!enrolled) {
          return res.status(403).json({ success: false, error: "Bạn chưa ghi danh khóa học này để xem nội dung" });
        }
        if (!enrollmentAccessGranted(enrolled)) {
          return res.status(403).json({
            success: false,
            error: "Khóa học có phí — hoàn tất thanh toán chuyển khoản để xem bài học.",
          });
        }
      }

      res.json({ success: true, lesson });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Tạo khóa học (Mentor) */
  create: async (req, res) => {
    try {
      const userId = req.userId;
      const mentor = await Mentor.findOne({ userId });
      if (!mentor) return res.status(403).json({ success: false, error: "Tài khoản chưa được thiết lập hồ sơ Mentor" });

      const payload = normalizeCoursePayload(req.body ?? {});
      if (!payload.title) {
        return res.status(400).json({ success: false, error: "Thiếu tiêu đề khóa học." });
      }

      const course = await Course.create({
        ...payload,
        mentorId: mentor._id,
        status: "draft"
      });

      res.status(201).json({ success: true, course });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Cập nhật khóa học */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });

      // Xác thực chủ sở hữu
      const mentor = await Mentor.findOne({ userId: req.userId });
      if (!mentor || course.mentorId.toString() !== mentor._id.toString()) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền chỉnh sửa khóa học này" });
      }

      const payload = normalizeCoursePayload(req.body ?? {});
      const updated = await Course.findByIdAndUpdate(id, payload, { new: true });
      res.json({ success: true, course: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Mentor gửi khóa học chờ admin duyệt */
  publish: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });

      // Xác thực chủ sở hữu
      const mentor = await Mentor.findOne({ userId: req.userId });
      if (!mentor || course.mentorId.toString() !== mentor._id.toString()) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" });
      }

      // Published -> lưu bản chỉnh sửa vào pendingUpdate, không làm khóa public biến mất.
      if (course.status === "published" || course.status === "pending_update") {
        const pendingPayload = normalizeCoursePayload(req.body ?? {});
        if (!pendingPayload.title || !pendingPayload.modules?.length) {
          return res.status(400).json({
            success: false,
            error: "Bản cập nhật chưa đủ thông tin để gửi duyệt.",
          });
        }
        course.pendingUpdate = pendingPayload;
        course.status = "pending_update";
        await course.save();
        return res.json({
          success: true,
          course,
          message: "Đã gửi bản cập nhật khóa học để admin duyệt.",
        });
      }

      // Draft -> gửi duyệt khóa mới.
      if (!course.title || !course.modules?.length) {
        return res.status(400).json({
          success: false,
          error: "Khóa học chưa đủ thông tin để đăng (thiếu tiêu đề hoặc nội dung bài học).",
        });
      }
      course.status = "pending_review";
      course.publishedAt = null;
      await course.save();

      return res.json({ success: true, course, message: "Đã gửi khóa học để admin duyệt." });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Lưu trữ / Xóa mềm */
  archive: async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });

      const mentor = await Mentor.findOne({ userId: req.userId });
      if (!mentor || course.mentorId.toString() !== mentor._id.toString()) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền thực hiện thao tác này" });
      }

      course.status = "archived";
      await course.save();

      res.json({ success: true, message: "Đã lưu trữ khóa học" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
