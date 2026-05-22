import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, RefreshCw, User, Clock, CheckCircle } from "lucide-react";
import { toastApiError, tryApi } from "../../utils/apiToast";
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
  const [busyId, setBusyId] = useState("");
  const [overrideModal, setOverrideModal] = useState({
    open: false,
    paymentId: "",
    forceNote: "Đã đối soát thủ công qua sao kê ngân hàng.",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getPendingSubscriptionPayments(), {
      fallback: "Không tải được danh sách gói cước chờ CK.",
    });
    if (res.success) setRows(res.payments || []);
    setLoading(false);
  }, []);

  const executeConfirm = async (paymentId, needsOverride, forceNote) => {
    setBusyId(paymentId);
    const res = await tryApi(
      () =>
        adminApi.confirmSubscriptionTransferPayment(
          paymentId,
          needsOverride ? { force: true, forceNote } : {},
        ),
      {
        fallback: "Không xác nhận được thanh toán gói.",
        successMessage: "Đã kích hoạt gói cước cho học viên.",
      },
    );
    setBusyId("");
    if (res.success) setRows((prev) => prev.filter((r) => String(r.id) !== String(paymentId)));
  };

  const confirmRow = async (row) => {
    const id = row?.id;
    if (!id) return;
    if (!row?.transferSubmittedAt) {
      setOverrideModal({
        open: true,
        paymentId: String(id),
        forceNote: "Đã đối soát thủ công qua sao kê ngân hàng.",
      });
      return;
    }
    await executeConfirm(String(id), false, "");
  };

  const confirmOverride = async () => {
    const paymentId = String(overrideModal.paymentId || "").trim();
    const forceNote = String(overrideModal.forceNote || "").trim();
    if (!paymentId || forceNote.length < 3) {
      toastApiError("Cần nhập lý do ngoại lệ tối thiểu 3 ký tự.");
      return;
    }
    setOverrideModal((prev) => ({ ...prev, open: false, paymentId: "" }));
    await executeConfirm(paymentId, true, forceNote);
  };

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
            Học viên nâng cấp Pro/Elite qua CK. Đối soát theo{" "}
            <strong>số tiền + nội dung mã đơn (PI…)</strong>, sau đó bấm xác nhận để kích hoạt gói trên tài khoản.
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
          <p className="text-xs font-semibold text-amber-900/80">Đang chờ xác nhận</p>
          <p className="mt-2 text-2xl font-black text-amber-950">{rows.length} giao dịch</p>
          <p className="mt-1 text-sm font-semibold text-amber-900">{vnd(totalPending)}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-950 leading-relaxed">
          <p className="font-bold">Quy trình</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-violet-900/90">
            <li>Học viên CK + bấm «Tôi đã chuyển khoản»</li>
            <li>Admin kiểm tra sao kê ngân hàng</li>
            <li>Bấm «Xác nhận thanh toán» → plan Pro/Elite có hiệu lực 1 tháng</li>
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
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const submitted = Boolean(row.transferSubmittedAt);
                return (
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
                      {submitted ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          <CheckCircle className="h-3 w-3" />
                          Đã báo CK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                          <Clock className="h-3 w-3" />
                          Chưa báo CK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void confirmRow(row)}
                        className="rounded-xl bg-violet-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {busyId === row.id ? "Đang xử lý…" : "Xác nhận thanh toán"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {overrideModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900">Xác nhận ngoại lệ</h3>
            <p className="mt-2 text-sm text-slate-600">
              Học viên chưa bấm «Tôi đã chuyển khoản». Chỉ xác nhận khi bạn đã thấy tiền trên sao kê.
            </p>
            <textarea
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm"
              rows={3}
              value={overrideModal.forceNote}
              onChange={(e) => setOverrideModal((p) => ({ ...p, forceNote: e.target.value }))}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOverrideModal((p) => ({ ...p, open: false, paymentId: "" }))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmOverride()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black uppercase text-white"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
