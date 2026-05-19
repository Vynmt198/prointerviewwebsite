import { CVAnalysis } from "../models/CVAnalysis.js";
import { User } from "../models/User.js";

export const CVController = {
  /** Lấy quota còn lại */
  getQuota: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("quota");
      if (!user) return res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
      res.json({ success: true, quota: user.quota });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Lưu bản phân tích CV (kết quả từ Python / FE — không mock) */
  createAnalysis: async (req, res) => {
    try {
      const {
        cvText,
        jdText = "",
        analysisType = "basic",
        cvFileName = "",
        jdFileName = "",
        result,
        geminiModel,
      } = req.body;
      const userId = req.userId;

      if (!cvText || !String(cvText).trim()) {
        return res.status(400).json({ success: false, error: "cvText là bắt buộc" });
      }
      if (!result || typeof result !== "object") {
        return res.status(400).json({ success: false, error: "result là bắt buộc" });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, error: "Người dùng không tồn tại" });

      if (user.quota.cvAnalysisUsed >= user.quota.cvAnalysisLimit) {
        return res.status(403).json({
          success: false,
          error: "Bạn đã hết lượt phân tích CV miễn phí. Vui lòng nâng cấp gói.",
        });
      }

      const analysis = await CVAnalysis.create({
        userId,
        cvText: String(cvText).trim(),
        jdText: String(jdText || ""),
        cvFileName: cvFileName || "",
        jdFileName: jdFileName || "",
        analysisType,
        result,
        geminiModel: geminiModel || "python-cv-matcher",
      });

      user.quota.cvAnalysisUsed += 1;
      await user.save();

      res.status(201).json({ success: true, analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Danh sách lịch sử */
  list: async (req, res) => {
    try {
      const list = await CVAnalysis.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.json({ success: true, list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Chi tiết 1 bản ghi */
  getById: async (req, res) => {
    try {
      const analysis = await CVAnalysis.findOne({ _id: req.params.id, userId: req.userId });
      if (!analysis) return res.status(404).json({ success: false, error: "Không tìm thấy" });
      res.json({ success: true, analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** Xóa bản ghi */
  delete: async (req, res) => {
    try {
      const deleted = await CVAnalysis.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!deleted) return res.status(404).json({ success: false, error: "Không tìm thấy để xóa" });
      res.json({ success: true, message: "Đã xóa bản tích CV" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
