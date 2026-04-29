import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { requireMentor } from "../middleware/requireMentor.js";
import { MentorController } from "../controllers/mentorController.js";

export const mentorRouter = Router();

mentorRouter.get("/dashboard", authJwt, requireMentor, MentorController.dashboard);
mentorRouter.get("/finance", authJwt, requireMentor, MentorController.finance);
mentorRouter.get("/analytics", authJwt, requireMentor, MentorController.analytics);
mentorRouter.get("/peer-reviews", authJwt, requireMentor, MentorController.peerReviewQueue);
mentorRouter.post("/peer-reviews/:courseId", authJwt, requireMentor, MentorController.submitPeerReview);
mentorRouter.get("/reviews", authJwt, requireMentor, MentorController.reviews);
mentorRouter.post("/payout", authJwt, requireMentor, MentorController.payout);
mentorRouter.get("/payouts", authJwt, requireMentor, MentorController.payoutHistory);
mentorRouter.patch("/payout-account", authJwt, requireMentor, MentorController.payoutAccount);

