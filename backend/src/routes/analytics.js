import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AnalyticsController } from "../controllers/analyticsController.js";

export const analyticsRouter = Router();

analyticsRouter.use(authJwt);
analyticsRouter.post("/events", asyncHandler(AnalyticsController.recordEvents));
