import { useEffect, useState } from "react";
import { AdminPanel } from "./AdminPanel.jsx";
import { adminApi } from "../../utils/adminApi.js";

function fmt(n, decimals = 0) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toFixed(decimals);
}

function fmtMs(ms) {
  if (ms == null || isNaN(ms)) return "—";
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(0)}s` : `${(s / 60).toFixed(1)}m`;
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const STATUS_VI = {
  in_progress: "Đang diễn ra",
  completed:   "Hoàn thành",
  abandoned:   "Bỏ dở",
};

const STATUS_COLOR = {
  in_progress: "bg-amber-100 text-amber-700",
  completed:   "bg-emerald-100 text-emerald-700",
  abandoned:   "bg-red-100 text-red-600",
};

export function AdminInterviewMetrics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    adminApi.getInterviewMetrics().then((res) => {
      if (res.success) setData(res);
      else setError(res.error || "Không thể tải dữ liệu");
      setLoading(false);
    });
  }, []);

  const completedCount = data?.sessionsByStatus?.find(s => s._id === "completed")?.count ?? 0;
  const totalCount     = data?.sessionsByStatus?.reduce((a, s) => a + s.count, 0) ?? 0;
  const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(0) : "—";

  return (
    <AdminPanel
      title="Interview Metrics"
      description="Snapshot 7 ngày qua — session volume, LLM eval latency, score distribution, few-shot pool."
    >
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* ── KPI Cards ─────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Sessions (7d)"
              value={totalCount}
              sub={`All-time: ${data.totalAllTime}`}
            />
            <MetricCard
              label="Tỷ lệ hoàn thành"
              value={`${completionRate}%`}
              sub={`${completedCount} / ${totalCount} phiên`}
            />
            <MetricCard
              label="Avg LLM eval time"
              value={fmtMs(data.evalDuration?.avgMs)}
              sub={`Trên ${data.evalDuration?.count ?? 0} phiên đã đánh giá`}
            />
            <MetricCard
              label="Avg score (7d)"
              value={data.scoreStats?.avgScore != null ? `${fmt(data.scoreStats.avgScore, 1)}/100` : "—"}
              sub={`${data.scoreStats?.count ?? 0} phiên có feedback`}
            />
          </div>

          {/* ── Sessions by status + Few-shot pool ───────────── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-800">Sessions theo trạng thái (7d)</h2>
              <div className="space-y-2">
                {data.sessionsByStatus.length === 0 && (
                  <p className="text-sm text-slate-400">Không có session nào trong 7 ngày qua.</p>
                )}
                {data.sessionsByStatus.map((s) => {
                  const pct = totalCount > 0 ? ((s.count / totalCount) * 100).toFixed(0) : 0;
                  return (
                    <div key={s._id} className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[s._id] ?? "bg-slate-100 text-slate-600"}`}>
                        {STATUS_VI[s._id] ?? s._id}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">Few-shot pool (all-time, score ≥ 80)</p>
                <p className="text-2xl font-black text-violet-700">{data.fewShotReadyCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {data.fewShotReadyCount < 20
                    ? "Chưa đủ — few-shot chưa có nhiều giá trị. Cần ~20 để bắt đầu có tác động."
                    : "Đủ để few-shot có tác động tốt đến chất lượng câu hỏi."}
                </p>
              </div>
            </div>

            {/* ── Daily volume ───────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-800">Volume theo ngày (7d)</h2>
              {data.sessionsByDay.length === 0 ? (
                <p className="text-sm text-slate-400">Không có session nào trong 7 ngày qua.</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const maxCount = Math.max(...data.sessionsByDay.map(d => d.count), 1);
                    return data.sessionsByDay.map((d) => (
                      <div key={d._id} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-24 flex-shrink-0">{d._id}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-400 transition-all"
                            style={{ width: `${(d.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-6 text-right">{d.count}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ── Top role categories ───────────────────────────── */}
          {data.topRoles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-slate-800">Top role categories (completed, 7d)</h2>
              <div className="flex flex-wrap gap-2">
                {data.topRoles.map((r) => (
                  <span
                    key={r._id}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
                  >
                    {r._id} <span className="ml-1 text-violet-400">×{r.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPanel>
  );
}
