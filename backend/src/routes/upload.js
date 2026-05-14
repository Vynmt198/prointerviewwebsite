import { Router } from "express";
import { authJwt } from "../middleware/authJwt.js";
import { requireMentor } from "../middleware/requireMentor.js";
import { UploadController } from "../controllers/uploadController.js";
import { upload } from "../middleware/upload.js";
import multer from "multer";

export const uploadRouter = Router();

const handleMulterError = (handler) => (req, res, next) => {
  console.log(`[Upload] Request for: ${req.path}`);
  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error(`[Upload] Multer Error:`, err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File quá lớn (tối đa 2GB)" });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      console.error(`[Upload] Server Error:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
    next();
  });
};


uploadRouter.post("/avatar", authJwt, handleMulterError(upload.single("file")), UploadController.uploadAvatar);
uploadRouter.post("/cv", authJwt, handleMulterError(upload.single("file")), UploadController.uploadCV);
uploadRouter.post("/course-thumbnail", authJwt, requireMentor, handleMulterError(upload.single("file")), UploadController.uploadCourseThumbnail);
uploadRouter.post("/course-video", authJwt, requireMentor, handleMulterError(upload.single("file")), UploadController.uploadCourseVideo);

