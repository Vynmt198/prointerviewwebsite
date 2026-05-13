import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollmentController.js";
import { authJwt } from "../middleware/authJwt.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.use(authJwt);

enrollmentsRouter.get("/my", EnrollmentController.getMyEnrollments);
enrollmentsRouter.patch("/:id/submit-transfer", EnrollmentController.submitTransfer);
enrollmentsRouter.get("/:id/certificate", EnrollmentController.getCertificate);
enrollmentsRouter.patch("/:id/progress", EnrollmentController.updateProgress);
