import { Achievement } from "../models/index.js";

export const AchievementsController = {
  // Public: get all published
  getAll: async (req, res, next) => {
    try {
      // If admin, they might want to see unpublished as well. 
      // For simplicity, let's allow a query param `all=true` if req.user?.role === 'admin'
      const filter = {};
      if (req.query.all !== "true") {
        filter.isPublished = true;
      } else if (!req.user || req.user.role !== "admin") {
        filter.isPublished = true; // fallback security
      }

      const achievements = await Achievement.find(filter).sort({ date: -1 });
      res.json({ success: true, achievements });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const achievement = await Achievement.findById(id);
      if (!achievement) return res.status(404).json({ success: false, error: "Không tìm thấy thành tựu" });
      res.json({ success: true, achievement });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const newAchievement = await Achievement.create(req.body);
      res.status(201).json({ success: true, achievement: newAchievement });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await Achievement.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, error: "Không tìm thấy thành tựu" });
      res.json({ success: true, achievement: updated });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await Achievement.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, error: "Không tìm thấy thành tựu" });
      res.json({ success: true, message: "Đã xóa thành tựu" });
    } catch (err) {
      next(err);
    }
  }
};
