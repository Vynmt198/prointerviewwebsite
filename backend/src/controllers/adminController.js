import mongoose from "mongoose";
import * as bookingsService from "../services/bookingsService.js";
import * as paymentsService from "../services/paymentsService.js";
import { tryCreditMentorForPaidEnrollment, tryCreditMentorForCompletedBooking } from "../services/mentorEarningsService.js";
import { normalizeTransferRefs } from "../services/normalizeTransferRefsService.js";
import { PayoutRequest } from "../models/PayoutRequest.js";
import { Enrollment } from "../models/Enrollment.js";
const User = mongoose.model("User");
const Mentor = mongoose.model("Mentor");
const Booking = mongoose.model("Booking");
const Course = mongoose.model("Course");

export const AdminController = {
  // Lấy danh sách mentor (có cả ứng viên chờ duyệt role customer) — admin UI lọc theo ngữ cảnh.
  getAllMentors: async (req, res) => {
    try {
      // Ép hệ thống kiểm tra và tạo hồ sơ mới nếu bạn vừa sửa ở Compass
      const { ensureMentorProfilesForAllMentorUsers } = await import("../services/mentorProfileService.js");
      await ensureMentorProfilesForAllMentorUsers();

      const mentors = await Mentor.find()
        .populate("userId", "name email avatar role isActive")
        .sort({ createdAt: -1 })
        .lean();
      
      // Có userId: gồm cố vấn đã duyệt (role mentor) và ứng viên đang chờ (role customer).
      const filtered = mentors.filter((m) => m.userId);
      
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
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, error: "isActive phải là boolean." });
      }

      const update = isActive
        ? {
            isActive: true,
            isVerified: true,
            verifiedAt: new Date(),
            "adminReview.status": "approved",
            "adminReview.reason": "",
            "adminReview.reviewedAt": new Date(),
            "adminReview.reviewedBy": req.userId || null,
          }
        : { isActive: false };

      const mentor = await Mentor.findByIdAndUpdate(id, update, { new: true });

      if (!mentor) return res.status(404).json({ success: false, error: "Không tìm thấy mentor" });

      if (mentor.userId) {
        if (isActive) {
          await User.updateOne({ _id: mentor.userId }, { $set: { role: "mentor" } });
        }
      }

      res.json({ success: true, mentor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  rejectMentorApplication: async (req, res) => {
    try {
      const { id } = req.params;
      const reason = String(req.body?.reason || "").trim();
      if (!reason) {
        return res.status(400).json({ success: false, error: "Vui lòng nhập lý do từ chối hồ sơ." });
      }

      const mentor = await Mentor.findByIdAndUpdate(
        id,
        {
          isActive: false,
          isVerified: false,
          verifiedAt: null,
          "adminReview.status": "rejected",
          "adminReview.reason": reason,
          "adminReview.reviewedAt": new Date(),
          "adminReview.reviewedBy": req.userId || null,
        },
        { new: true },
      );

      if (!mentor) return res.status(404).json({ success: false, error: "Không tìm thấy cố vấn." });

      if (mentor.userId) {
        await User.updateOne({ _id: mentor.userId }, { $set: { role: "customer" } });
      }

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

  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const nextStatus = String(req.body?.status || "").trim();
      const reason = String(req.body?.reason || "").trim();
      const ALLOWED = new Set(["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]);

      if (!ALLOWED.has(nextStatus)) {
        return res.status(400).json({ success: false, error: "Trạng thái booking không hợp lệ." });
      }

      if (nextStatus === "no_show") {
        const result = await bookingsService.processBookingNoShow(id, { note: reason }, {
          markedBy: "admin",
          actorUserId: req.userId,
        });
        if (!result.ok) {
          return res.status(result.status).json({ success: false, error: result.error });
        }
        return res.json({ success: true, booking: result.booking, refundAmountVnd: result.refundAmountVnd });
      }

      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ success: false, error: "Không tìm thấy lịch hẹn." });

      booking.status = nextStatus;

      if (nextStatus === "completed") {
        booking.completedAt = new Date();
      }
      if (nextStatus === "cancelled") {
        booking.cancelledAt = new Date();
        booking.cancelledBy = "system";
        booking.cancelReason = reason || booking.cancelReason || "Admin cập nhật trạng thái.";
      }

      await booking.save();

      if (nextStatus === "completed") {
        const credit = await tryCreditMentorForCompletedBooking(booking._id);
        if (!credit.ok) {
          console.error("[updateBookingStatus] mentor earnings:", credit.error || credit);
        }
      }

      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Xác nhận đã nhận tiền chuyển khoản (booking paymentMethod = transfer, paymentStatus = pending). */
  confirmBookingTransferPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const force = Boolean(req.body?.force || req.body?.override);
      const forceNote = String(req.body?.forceNote || req.body?.note || "").trim();
      const result = await bookingsService.confirmBankTransferPaymentByAdmin(id, {
        force,
        forceNote,
        adminUserId: req.userId || "",
      });
      if (!result.ok) {
        return res.status(result.status).json({ success: false, error: result.error });
      }
      res.json({ success: true, booking: result.booking });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Admin xác nhận đã CK hoàn cho HV (booking paymentStatus = refund_pending). */
  confirmBookingRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await bookingsService.confirmBankRefundByAdmin(id, {
        adminUserId: req.userId || "",
      });
      if (!result.ok) {
        return res.status(result.status).json({ success: false, error: result.error });
      }
      res.json({ success: true, booking: result.booking });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getPendingEnrollmentTransfers: async (_req, res) => {
    try {
      const enrollments = await Enrollment.find({
        paymentMethod: "transfer",
        paymentStatus: "pending",
      })
        .populate("userId", "name email")
        .populate("courseId", "title price")
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();
      res.json({ success: true, enrollments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Danh sách ghi danh có học phí (CK) — chờ + đã xác nhận, cho màn admin Học phí khóa học */
  getCoursePaymentEnrollments: async (_req, res) => {
    try {
      const enrollments = await Enrollment.find({
        pricePaid: { $gt: 0 },
        paymentMethod: "transfer",
      })
        .populate("userId", "name email")
        .populate({
          path: "courseId",
          select: "title price mentorId",
          populate: { path: "mentorId", select: "name" },
        })
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();
      res.json({ success: true, enrollments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Tổng quan học phí khóa học (CK) cho admin Tài chính / Giao dịch */
  getCourseFinanceSummary: async (_req, res) => {
    try {
      const pendAgg = await Enrollment.aggregate([
        { $match: { paymentMethod: "transfer", paymentStatus: "pending", pricePaid: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$pricePaid" }, count: { $sum: 1 } } },
      ]);
      const paidAgg = await Enrollment.aggregate([
        { $match: { paymentStatus: "paid", pricePaid: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$pricePaid" }, count: { $sum: 1 } } },
      ]);

      const pendingList = await Enrollment.find({
        paymentMethod: "transfer",
        paymentStatus: "pending",
        pricePaid: { $gt: 0 },
      })
        .populate("userId", "name email")
        .populate("courseId", "title price")
        .sort({ updatedAt: -1 })
        .limit(40)
        .lean();

      const recentPaidRows = await Enrollment.find({ paymentStatus: "paid", pricePaid: { $gt: 0 } })
        .populate("userId", "name email")
        .populate("courseId", "title")
        .sort({ paidAt: -1, updatedAt: -1 })
        .limit(50)
        .lean();

      res.json({
        success: true,
        courseFinance: {
          pendingTransferCount: pendAgg[0]?.count || 0,
          pendingTransferAmount: pendAgg[0]?.total || 0,
          paidCollectedCount: paidAgg[0]?.count || 0,
          paidCollectedAmount: paidAgg[0]?.total || 0,
          pendingList,
          recentPaidRows,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  confirmEnrollmentTransferPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const force = Boolean(req.body?.force || req.body?.override);
      const forceNote = String(req.body?.forceNote || req.body?.note || "").trim();
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, error: "id ghi danh không hợp lệ." });
      }
      const enrollment = await Enrollment.findById(id);
      if (!enrollment) return res.status(404).json({ success: false, error: "Không tìm thấy ghi danh." });
      if (enrollment.paymentMethod !== "transfer") {
        return res.status(400).json({ success: false, error: "Ghi danh này không dùng chuyển khoản." });
      }
      if (enrollment.paymentStatus !== "pending") {
        return res.status(400).json({ success: false, error: "Trạng thái thanh toán không cho phép xác nhận." });
      }
      if (force && forceNote.length < 3) {
        return res.status(400).json({ success: false, error: "Xác nhận ngoại lệ cần lý do rõ ràng (ít nhất 3 ký tự)." });
      }
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const row = await Enrollment.findById(id).session(session);
          if (!row) throw new Error("ERR_404");
          if (row.paymentMethod !== "transfer") throw new Error("ERR_METHOD");
          if (row.paymentStatus !== "pending") throw new Error("ERR_STATUS");
          if (!force && !row.transferSubmittedAt) throw new Error("ERR_NO_SUBMIT");

          const courseAmt = Math.round(Number(row.pricePaid ?? 0));
          if (courseAmt > 0) {
            const ledger = await paymentsService.recordAdminTransferSuccess({
              userId: row.userId,
              type: "course",
              referenceModel: "Enrollment",
              referenceId: row._id,
              amount: courseAmt,
              adminUserId: req.userId || "",
              forceConfirm: force,
              forceNote,
              session,
            });
            if (!ledger.ok && !ledger.idempotent) {
              throw new Error(`ERR_LEDGER:${ledger.error || "unknown"}`);
            }
          }

          row.paymentStatus = "paid";
          row.paidAt = new Date();
          row.transferConfirmedAt = row.paidAt;
          row.transferConfirmedBy = req.userId && mongoose.isValidObjectId(String(req.userId)) ? req.userId : undefined;
          row.transferForceConfirm = force;
          row.transferForceNote = force ? forceNote.slice(0, 500) : "";
          await row.save({ session });
        });
      } catch (error) {
        await session.endSession();
        const msg = String(error?.message || "");
        if (msg.includes("Transaction numbers are only allowed")) {
          return res.status(503).json({
            success: false,
            error: "Hạ tầng MongoDB chưa hỗ trợ transaction (cần replica set).",
          });
        }
        if (msg === "ERR_404") return res.status(404).json({ success: false, error: "Không tìm thấy ghi danh." });
        if (msg === "ERR_METHOD") {
          return res.status(400).json({ success: false, error: "Ghi danh này không dùng chuyển khoản." });
        }
        if (msg === "ERR_STATUS") {
          return res.status(400).json({ success: false, error: "Trạng thái thanh toán không cho phép xác nhận." });
        }
        if (msg === "ERR_NO_SUBMIT") {
          return res.status(400).json({
            success: false,
            error: "User chưa báo đã chuyển khoản. Bật override để xác nhận ngoại lệ.",
          });
        }
        if (msg.startsWith("ERR_LEDGER:")) {
          console.error("[confirmEnrollmentTransferPayment]", msg);
          return res.status(500).json({
            success: false,
            error: "Không thể ghi nhận giao dịch thanh toán. Vui lòng thử lại.",
          });
        }
        console.error("[confirmEnrollmentTransferPayment]", error?.message || error);
        return res.status(500).json({ success: false, error: "Không thể xác nhận thanh toán lúc này." });
      }
      await session.endSession();

      const credit = await tryCreditMentorForPaidEnrollment(enrollment._id);
      if (!credit.ok) {
        console.error("[confirmEnrollmentTransferPayment] mentor earnings:", credit.error || credit);
      }

      const populated = await Enrollment.findById(enrollment._id)
        .populate("userId", "name email")
        .populate("courseId", "title price");
      res.json({ success: true, enrollment: populated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  normalizeTransferReferences: async (req, res) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const result = await normalizeTransferRefs({ dryRun });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getTransactionSupport: async (_req, res) => {
    try {
      const hello = await mongoose.connection.db.admin().command({ hello: 1 });
      const setName = String(hello?.setName || "").trim();
      const msg = String(hello?.msg || "").trim();
      const supported = Boolean(setName) || msg === "isdbgrid";
      res.json({
        success: true,
        mongo: {
          transactionSupported: supported,
          topology: msg === "isdbgrid" ? "sharded-cluster" : setName ? "replica-set" : "standalone",
          setName: setName || null,
        },
      });
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
  },

  getPayoutRequests: async (_req, res) => {
    try {
      const payouts = await PayoutRequest.find()
        .populate({
          path: "mentorId",
          select: "name userId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      res.json({ success: true, payouts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  approvePayoutRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const payout = await PayoutRequest.findById(id);
      if (!payout) return res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu rút tiền." });
      if (payout.status !== "pending") {
        return res.status(400).json({ success: false, error: "Yêu cầu đã được xử lý trước đó." });
      }

      payout.status = "approved";
      payout.reviewedAt = new Date();
      payout.reviewedBy = req.userId || null;
      payout.note = String(req.body?.note || "").trim();
      await payout.save();

      res.json({ success: true, payout });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Sau khi admin chuyển khoản thủ công cho mentor — chỉ từ trạng thái `approved`. */
  markPayoutPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const transferRef = String(req.body?.transferRef || "").trim().slice(0, 500);
      const noteExtra = String(req.body?.note || "").trim().slice(0, 2000);
      const payout = await PayoutRequest.findById(id);
      if (!payout) return res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu rút tiền." });
      if (payout.status !== "approved") {
        return res.status(400).json({
          success: false,
          error: "Chỉ xác nhận đã chuyển khoản khi yêu cầu đã được duyệt (chưa ghi nhận chi).",
        });
      }
      payout.status = "paid";
      payout.paidAt = new Date();
      payout.transferRef = transferRef;
      if (noteExtra) {
        const prev = String(payout.note || "").trim();
        payout.note = prev ? `${prev}\n${noteExtra}` : noteExtra;
      }
      await payout.save();

      await Mentor.updateOne(
        { _id: payout.mentorId },
        { $inc: { "finance.pendingBalance": -Number(payout.amount || 0) } },
      );

      res.json({ success: true, payout });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  rejectPayoutRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const reason = String(req.body?.reason || "").trim();
      const payout = await PayoutRequest.findById(id);
      if (!payout) return res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu rút tiền." });
      if (payout.status !== "pending") {
        return res.status(400).json({ success: false, error: "Yêu cầu đã được xử lý trước đó." });
      }

      payout.status = "rejected";
      payout.reviewedAt = new Date();
      payout.reviewedBy = req.userId || null;
      payout.rejectReason = reason;
      await payout.save();

      await Mentor.updateOne(
        { _id: payout.mentorId },
        {
          $inc: {
            "finance.availableBalance": Number(payout.amount || 0),
            "finance.pendingBalance": -Number(payout.amount || 0),
          },
        },
      );

      res.json({ success: true, payout });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
