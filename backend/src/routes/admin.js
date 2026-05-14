import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { AdminController } from "../controllers/adminController.js";

export const adminRouter = Router();

// Tất cả các route admin đều yêu cầu Đăng nhập + Quyền Admin
adminRouter.use(authJwt, requireAdmin);

adminRouter.get("/stats", AdminController.getStats);
adminRouter.get("/mentors", AdminController.getAllMentors);
adminRouter.patch("/mentors/:id/status", AdminController.toggleMentorStatus);
adminRouter.patch("/mentors/:id/reject", AdminController.rejectMentorApplication);

adminRouter.get("/users", AdminController.getAllUsers);
adminRouter.patch("/users/:id/status", AdminController.toggleUserStatus);

adminRouter.get("/bookings", AdminController.getAllBookings);
adminRouter.get("/system/transaction-support", AdminController.getTransactionSupport);
adminRouter.get("/finance/courses", AdminController.getCourseFinanceSummary);
adminRouter.patch("/bookings/:id/confirm-transfer-payment", AdminController.confirmBookingTransferPayment);
adminRouter.get("/enrollments/pending-transfer", AdminController.getPendingEnrollmentTransfers);
adminRouter.patch("/enrollments/:id/confirm-transfer-payment", AdminController.confirmEnrollmentTransferPayment);
adminRouter.post("/payments/normalize-transfer-refs", AdminController.normalizeTransferReferences);
adminRouter.patch("/bookings/:id/status", AdminController.updateBookingStatus);
adminRouter.get("/payouts", AdminController.getPayoutRequests);
adminRouter.patch("/payouts/:id/approve", AdminController.approvePayoutRequest);
adminRouter.patch("/payouts/:id/reject", AdminController.rejectPayoutRequest);
adminRouter.get("/courses/pending", AdminController.getPendingCourses);
adminRouter.patch("/courses/:id/approve", AdminController.approveCourse);
adminRouter.patch("/courses/:id/reject", AdminController.rejectCourse);
