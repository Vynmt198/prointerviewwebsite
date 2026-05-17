import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { requireMentor } from "../middleware/requireMentor.js";
import { BookingsController } from "../controllers/bookingsController.js";

export const bookingsRouter = Router();

bookingsRouter.get("/", authJwt, BookingsController.list);
bookingsRouter.post("/", authJwt, BookingsController.create);
bookingsRouter.get("/mentor/list", authJwt, requireMentor, BookingsController.listForMentor);
bookingsRouter.get("/mentor/:id", authJwt, requireMentor, BookingsController.getByIdForMentor);
bookingsRouter.patch("/mentor/:id/reschedule", authJwt, requireMentor, BookingsController.rescheduleForMentor);
bookingsRouter.patch("/mentor/:id/cancel", authJwt, requireMentor, BookingsController.cancelForMentor);
bookingsRouter.patch("/:id/submit-transfer", authJwt, BookingsController.submitTransfer);
bookingsRouter.patch("/:id/confirm", authJwt, requireMentor, BookingsController.confirmForMentor);
bookingsRouter.patch("/:id/complete", authJwt, requireMentor, BookingsController.completeForMentor);
bookingsRouter.patch("/:id/notes", authJwt, requireMentor, BookingsController.updateNotesForMentor);
bookingsRouter.patch("/:id/reschedule", authJwt, BookingsController.reschedule);
bookingsRouter.patch("/:id/refund-destination", authJwt, BookingsController.updateRefundDestination);
bookingsRouter.patch("/:id/mentor-cancel-resolution", authJwt, BookingsController.resolveMentorCancel);
bookingsRouter.post("/:id/report-no-show", authJwt, BookingsController.reportNoShow);
bookingsRouter.get("/:id/rebook-credit", authJwt, BookingsController.getRebookCredit);
bookingsRouter.post("/:id/review", authJwt, BookingsController.createReviewForBooking);
bookingsRouter.get("/:id", authJwt, BookingsController.getById);
bookingsRouter.delete("/:id", authJwt, BookingsController.cancel);
bookingsRouter.get("/mentor/:id/booked-slots", BookingsController.getBookedSlots);
