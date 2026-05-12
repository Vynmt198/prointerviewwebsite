import mongoose from "mongoose";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { enrollmentAccessGranted } from "../helpers/enrollmentAccess.js";

function genOrderRef() {
  return `PI${Math.floor(Math.random() * 900000 + 100000)}`;
}

function mergePaymentRef(orderPart, refRaw) {
  const order = String(orderPart || "").trim();
  const raw = String(refRaw || "").trim();
  let paymentRef = order.slice(0, 120);
  if (raw.length > 0 && raw !== order) {
    if (raw.startsWith(`${order} |`)) {
      paymentRef = raw.slice(0, 120);
    } else {
      paymentRef = `${order} | ${raw}`.slice(0, 120);
    }
  }
  return paymentRef;
}

export const EnrollmentController = {
  enroll: async (req, res) => {
    try {
      const { id: courseId } = req.params;
      const userId = req.userId;

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy khóa học" });

      const price = Number(course.price || 0);
      const existing = await Enrollment.findOne({ userId, courseId });

      if (existing) {
        if (enrollmentAccessGranted(existing)) {
          return res.json({ success: true, message: "Bạn đã ghi danh khóa học này rồi", enrollment: existing });
        }
        const bodyPm = String(req.body?.paymentMethod || "").trim();
        if (price > 0 && bodyPm === "transfer") {
          return res.json({
            success: true,
            enrollment: existing,
            orderNum: String(existing.paymentRef || "").trim(),
            awaitingPayment: true,
          });
        }
        return res.status(400).json({
          success: false,
          error: "Ghi danh đang chờ thanh toán. Mở lại trang thanh toán để hoàn tất chuyển khoản.",
        });
      }

      if (price <= 0) {
        const enrollment = await Enrollment.create({
          userId,
          courseId,
          pricePaid: 0,
          paymentStatus: "paid",
          paymentMethod: "",
          lastAccessedAt: new Date(),
        });
        return res.status(201).json({ success: true, enrollment });
      }

      const pm = String(req.body?.paymentMethod || "").trim();
      if (pm !== "transfer") {
        return res.status(400).json({
          success: false,
          error: "Khóa học có phí. Vui lòng thanh toán chuyển khoản qua trang thanh toán.",
          requiresPayment: true,
          price,
        });
      }

      const clientOrder = String(req.body?.orderNum || "").trim().slice(0, 120);
      const orderRef = clientOrder || genOrderRef();

      const enrollment = await Enrollment.create({
        userId,
        courseId,
        pricePaid: price,
        paymentStatus: "pending",
        paymentMethod: "transfer",
        paymentRef: orderRef,
        lastAccessedAt: new Date(),
      });

      return res.status(201).json({ success: true, enrollment, orderNum: enrollment.paymentRef });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  submitTransfer: async (req, res) => {
    try {
      const { id: enrollmentId } = req.params;
      const userId = req.userId;
      if (!mongoose.isValidObjectId(enrollmentId)) {
        return res.status(400).json({ success: false, error: "id ghi danh không hợp lệ." });
      }

      const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
      if (!enrollment) return res.status(404).json({ success: false, error: "Không tìm thấy ghi danh." });
      if (enrollment.paymentStatus === "paid" || enrollmentAccessGranted(enrollment)) {
        return res.status(400).json({ success: false, error: "Thanh toán đã được xử lý." });
      }
      if (enrollment.paymentMethod !== "transfer") {
        return res.status(400).json({ success: false, error: "Ghi danh này không dùng chuyển khoản." });
      }

      const refRaw = String(req.body?.reference ?? req.body?.transferReference ?? "").trim();
      const orderPart = String(enrollment.paymentRef || "").trim() || String(enrollment._id).slice(-8);
      enrollment.paymentRef = mergePaymentRef(orderPart, refRaw);
      enrollment.transferSubmittedAt = new Date();
      await enrollment.save();
      res.json({ success: true, enrollment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getMyEnrollments: async (req, res) => {
    try {
      const enrollments = await Enrollment.find({ userId: req.userId })
        .populate({
          path: "courseId",
          populate: {
            path: "mentorId",
            populate: { path: "userId", select: "name avatar" },
          },
        })
        .sort({ updatedAt: -1 });

      res.json({ success: true, enrollments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateProgress: async (req, res) => {
    try {
      const { id: enrollmentId } = req.params;
      const { lessonId, isCompleted } = req.body;
      const userId = req.userId;

      const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
      if (!enrollment) return res.status(404).json({ success: false, error: "Hồ sơ ghi danh không tồn tại" });
      if (!enrollmentAccessGranted(enrollment)) {
        return res.status(403).json({ success: false, error: "Hoàn tất thanh toán khóa học để cập nhật tiến độ." });
      }

      if (isCompleted) {
        if (!enrollment.completedLessons.includes(lessonId)) {
          enrollment.completedLessons.push(lessonId);
        }
      } else {
        enrollment.completedLessons = enrollment.completedLessons.filter(
          (id) => id.toString() !== lessonId.toString(),
        );
      }

      enrollment.lastLessonId = lessonId;
      enrollment.lastAccessedAt = new Date();

      const course = await Course.findById(enrollment.courseId);
      if (course) {
        let totalLessons = 0;
        if (Array.isArray(course.modules) && course.modules.length > 0) {
          course.modules.forEach((m) => {
            totalLessons += m.lessons?.length || 0;
          });
        } else if (Array.isArray(course.sections) && course.sections.length > 0) {
          course.sections.forEach((s) => {
            totalLessons += s.lessons?.length || 0;
          });
        }
        if (totalLessons > 0) {
          enrollment.progressPercent = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
        }
      }

      await enrollment.save();
      res.json({ success: true, enrollment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getCertificate: async (req, res) => {
    try {
      const { id: enrollmentId } = req.params;
      const userId = req.userId;

      const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId })
        .populate("courseId")
        .populate("userId", "name");

      if (!enrollment) return res.status(404).json({ success: false, error: "Hồ sơ ghi danh không tồn tại" });
      if (!enrollmentAccessGranted(enrollment)) {
        return res.status(403).json({ success: false, error: "Hoàn tất thanh toán khóa học để nhận chứng chỉ." });
      }

      const course = enrollment.courseId;
      if (!course) return res.status(404).json({ success: false, error: "Không tìm thấy thông tin khóa học" });

      if (course.settings && course.settings.certificateEnabled === false) {
        return res.status(400).json({ success: false, error: "Khóa học này không cấp chứng chỉ" });
      }

      if (enrollment.progressPercent < 100 && !enrollment.isCompleted) {
        return res.status(400).json({ success: false, error: "Bạn cần hoàn thành 100% khóa học để nhận chứng chỉ" });
      }

      if (!enrollment.certificateUrl) {
        const certCode = `CERT-${enrollmentId.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        enrollment.certificateUrl = `https://prointerview.vn/certificates/${certCode}.pdf`;
        enrollment.certificateIssuedAt = new Date();
        enrollment.isCompleted = true;
        if (!enrollment.completedAt) enrollment.completedAt = new Date();

        await enrollment.save();
      }

      res.json({
        success: true,
        certificate: {
          url: enrollment.certificateUrl,
          issuedAt: enrollment.certificateIssuedAt,
          courseTitle: course.title,
          studentName: enrollment.userId?.name || "Học viên",
          code: enrollment.certificateUrl.split("/").pop().replace(".pdf", ""),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
