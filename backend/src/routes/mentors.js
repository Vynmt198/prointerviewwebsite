import express from "express";
import { MentorsController } from "../controllers/mentorsController.js";
import { authJwt } from "../middleware/authJwt.js";
import { requireMentor } from "../middleware/requireMentor.js";
import { MentorMeController } from "../controllers/mentorMeController.js";

export const mentorsRouter = express.Router();

mentorsRouter.get("/", MentorsController.list);
mentorsRouter.post("/apply", authJwt, MentorsController.apply);
/** Đọc hồ sơ mentor của chính mình (kể cả customer đang chờ duyệt) — không dùng requireMentor. */
mentorsRouter.get("/me", authJwt, MentorMeController.getMe);
mentorsRouter.patch("/me", authJwt, requireMentor, MentorMeController.patchMe);
mentorsRouter.patch("/me/availability", authJwt, requireMentor, MentorMeController.patchAvailability);
mentorsRouter.patch("/me/availability/block", authJwt, requireMentor, MentorMeController.blockDates);
mentorsRouter.get("/:id/availability", MentorsController.getAvailability);
mentorsRouter.get("/:id/reviews", MentorsController.getReviews);
mentorsRouter.get("/:id", MentorsController.getById);
