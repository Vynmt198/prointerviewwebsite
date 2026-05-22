import { getPublicBaseUrl } from "../utils/publicBaseUrl.js";

export const UploadController = {
  /** Upload ảnh đại diện */
  uploadAvatar: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Không tìm thấy file" });
      }
      const baseUrl = getPublicBaseUrl(req);
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        url: fileUrl,
        message: "Upload ảnh đại diện thành công" 
      });
    } catch (error) {
      next(error);
    }
  },

  /** Upload CV */
  uploadCV: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Không tìm thấy file" });
      }
      const baseUrl = getPublicBaseUrl(req);
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        url: fileUrl,
        fileName: req.file.originalname,
        message: "Upload CV thành công" 
      });
    } catch (error) {
      next(error);
    }
  },

  /** Upload thumbnail khóa học */
  uploadCourseThumbnail: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Không tìm thấy file" });
      }
      const baseUrl = getPublicBaseUrl(req);
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        url: fileUrl,
        message: "Upload ảnh bìa khóa học thành công" 
      });
    } catch (error) {
      next(error);
    }
  },

  /** Upload video bài học */
  uploadCourseVideo: async (req, res, next) => {
    try {
      console.log("[UploadController] Received video upload request");
      if (!req.file) {
        console.error("[UploadController] No file found in request");
        return res.status(400).json({ success: false, error: "Không tìm thấy file" });
      }
      console.log(`[UploadController] File saved: ${req.file.filename}`);

      const baseUrl = getPublicBaseUrl(req);
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      res.json({ 
        success: true, 
        url: fileUrl,
        message: "Upload video bài học thành công" 
      });
    } catch (error) {
      next(error);
    }
  }
};
