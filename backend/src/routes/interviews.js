import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middleware/authJwt.js";
import { InterviewsController } from "../controllers/interviewsController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const interviewsRouter = Router();

// Session lifecycle
interviewsRouter.post("/sessions", authJwt, InterviewsController.createSession);
interviewsRouter.patch("/sessions/:id", authJwt, InterviewsController.updateAnswer);
interviewsRouter.post("/sessions/:id/complete", authJwt, InterviewsController.completeSession);
interviewsRouter.post("/sessions/:id/evaluate", authJwt, InterviewsController.evaluateSession);
interviewsRouter.get("/sessions", authJwt, InterviewsController.list);
interviewsRouter.get("/sessions/:id", authJwt, InterviewsController.getById);

// AI question generation
interviewsRouter.post("/generate-questions", authJwt, InterviewsController.generateQuestions);
interviewsRouter.post("/extract-cv-text", authJwt, upload.single("file"), InterviewsController.extractCvText);
