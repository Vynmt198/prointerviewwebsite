import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, RefreshCw, User, Clock } from "lucide-react";
import { tryApi } from "../../utils/apiToast";
import { adminApi } from "../../utils/adminApi";

function vnd(n) {
  return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
}

function planLabel(plan) {
  if (plan === "elite_pro") return "Elite Pro";
  if (plan === "starter_pro") return "Starter Pro";
  return plan || "—";
}

export function AdminSubscriptionPayments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getPendingSubscriptionPayments(), {
      fallback: "Không tải được danh sách gói cước chờ CK.",
    });
    if (res.success) setRows(res.payments || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const totalPending = useMemo(
    () => rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gói cước — Chờ chuyển khoản</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Học viên nâng cấp Pro/Elite qua CK. <strong>SePay</strong> tự đối soát theo số tiền + mã đơn{" "}
            <span className="font-mono">PI…</span> và kích hoạt gói — admin không cần bấm xác nhận thu tiền.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-5">
          <p className="text-xs font-semibold text-amber-900/80">Đang chờ SePay</p>
          <p className="mt-2 text-2xl font-black text-amber-950">{rows.length} giao dịch</p>
          <p className="mt-1 text-sm font-semibold text-amber-900">{vnd(totalPending)}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-950 leading-relaxed">
          <p className="font-bold">Quy trình tự động</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-violet-900/90">
            <li>Học viên quét QR / CK đúng mã PI và số tiền</li>
            <li>SePay gửi webhook → hệ thống kích hoạt gói</li>
            <li>Đơn biến mất khỏi danh sách chờ sau khi paid</li>
          </ol>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Không có gói cước nào chờ đối soát</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3">Mã CK</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-violet-500" />
                      <div>
                        <p className="font-bold text-slate-900">{row.user?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{row.user?.email}</p>
                        <p className="text-[10px] text-slate-400">Hiện tại: {row.user?.plan || "free"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-violet-700">{planLabel(row.plan)}</td>
                  <td className="px-4 py-4 font-mono text-xs font-bold text-slate-800">
                    {row.providerRef || row.paymentRef || "—"}
                  </td>
                  <td className="px-4 py-4 font-black text-slate-900">{vnd(row.amount)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                      <Clock className="h-3 w-3" />
                      Chờ SePay
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
