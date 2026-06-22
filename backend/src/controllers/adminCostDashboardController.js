import { getCostDashboard, getCacheMetrics } from "../services/costLedgerService.js";

/**
 * Epic 1 (Task 1.2 / 1.3) — cost dashboard & cache metrics cho admin.
 * Dữ liệu nguồn: CostEvent (MongoDB), được ghi dual-write từ langfuseService.js.
 */
export const AdminCostDashboardController = {
  /** GET /api/admin/cost-dashboard?days=14 */
  getCostDashboard: async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
    const result = await getCostDashboard({ days });
    if (!result.ok) return res.status(503).json({ success: false, error: result.error });
    res.json({ success: true, ...result });
  },

  /** GET /api/admin/cost-dashboard/cache-metrics?days=30 */
  getCacheMetrics: async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
    const result = await getCacheMetrics({ days });
    if (!result.ok) return res.status(503).json({ success: false, error: result.error });
    res.json({ success: true, ...result });
  },
};
