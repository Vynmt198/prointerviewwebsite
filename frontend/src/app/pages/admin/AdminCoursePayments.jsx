import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Clock, User, CheckCircle, BookOpen, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { tryApi } from "../../utils/apiToast";
import { adminApi } from "../../utils/adminApi";

function vnd(n) {
  return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
}

function amountOf(row) {
  return Number(row?.pricePaid ?? row?.courseId?.price ?? 0);
}

function paymentStatusOf(row) {
  return String(row?.paymentStatus || "").toLowerCase();
}

export function AdminCoursePayments() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    pendingTransferCount: 0,
    pendingTransferAmount: 0,
    paidCollectedCount: 0,
    paidCollectedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [listRes, financeRes] = await Promise.all([
      tryApi(() => adminApi.getCoursePaymentEnrollments(), {
        fallback: "Không tải được danh sách học phí khóa học.",
      }),
      tryApi(() => adminApi.getCourseFinanceSummary(), { silent: true }),
    ]);
    if (listRes.success) setRows(listRes.enrollments || []);
    if (financeRes.success && financeRes.courseFinance) {
      const cf = financeRes.courseFinance;
      setSummary({
        pendingTransferCount: cf.pendingTransferCount ?? 0,
        pendingTransferAmount: cf.pendingTransferAmount ?? 0,
        paidCollectedCount: cf.paidCollectedCount ?? 0,
        paidCollectedAmount: cf.paidCollectedAmount ?? 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      const st = paymentStatusOf(r);
      if (filter === "pending" && st !== "pending") return false;
      if (filter === "paid" && st !== "paid") return false;
      if (!q) return true;
      const student = String(r.userId?.name || r.userId?.email || "").toLowerCase();
      const course = String(r.courseId?.title || "").toLowerCase();
      const mentor = String(r.courseId?.mentorId?.name || "").toLowerCase();
      const ref = String(r.paymentRef || "").toLowerCase();
      return student.includes(q) || course.includes(q) || mentor.includes(q) || ref.includes(q);
    });
  }, [rows, searchTerm, filter]);

  const getPaymentBadge = (status) => {
    if (status === "paid") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-800">
          <CheckCircle size={10} /> Đã thanh toán
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-800">
          <Clock size={10} /> Chờ SePay
        </span>
      );
    }
    return (
      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
        {status || "—"}
      </span>
    );
  };

  const thCell =
    "px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:px-5 sm:py-5 lg:px-6";
  const tdCell = "px-4 py-4 sm:px-5 sm:py-5 lg:px-6";

  return (
    <div className="min-w-0 max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-start lg:gap-6"
      >
        <div>
          <h2 className="font-headline mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">
            <span className="text-violet-700">Học phí</span> khóa học
          </h2>
          <p className="max-w-2xl text-sm font-medium text-slate-600">
            Danh sách ghi danh có phí qua chuyển khoản — SePay tự xác nhận khi CK đúng mã PI và số tiền. Trang này chỉ
            theo dõi trạng thái, không cần admin bấm xác nhận thu tiền.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <div className="relative min-w-0 flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm học viên, khóa học, mã CK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-6 text-sm text-slate-900 outline-none transition-all focus:border-violet-400"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Chờ SePay (CK)</p>
          <p className="mt-1 text-2xl font-black text-amber-950">{summary.pendingTransferCount}</p>
          <p className="mt-1 text-sm font-semibold text-amber-900">{vnd(summary.pendingTransferAmount)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Đã thu (đã xác nhận)</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">{summary.paidCollectedCount}</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">{vnd(summary.paidCollectedAmount)}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 sm:col-span-2"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-900">Tổng trên bảng</p>
          <p className="mt-1 text-2xl font-black text-violet-950">{rows.length} ghi danh có học phí CK</p>
          <p className="mt-1 text-xs text-violet-900">Lọc: {filtered.length} dòng đang hiển thị</p>
        </motion.div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Tất cả" },
          { id: "pending", label: "Chờ xác nhận" },
          { id: "paid", label: "Đã thanh toán" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${
              filter === t.id
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card min-w-0 max-w-full overflow-hidden border-slate-200/90 [&:hover]:transform-none [&:hover]:shadow-[0_8px_18px_rgba(110,53,232,0.07)]">
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className={thCell}>Học viên</th>
                <th className={thCell}>Khóa học</th>
                <th className={thCell}>Thời gian</th>
                <th className={`${thCell} text-center`}>Trạng thái</th>
                <th className={`${thCell} text-right`}>Chi phí</th>
                <th className={`${thCell} text-center`}>Thanh toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className={`${tdCell} py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500`}>
                    Đang tải học phí khóa học...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`${tdCell} py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500`}>
                    {rows.length === 0
                      ? "Chưa có ghi danh CK — học viên cần mua khóa có phí qua Checkout."
                      : "Không có dòng phù hợp bộ lọc / từ khóa."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const st = paymentStatusOf(r);
                  return (
                    <tr key={r._id} className="group transition-colors hover:bg-violet-50/40">
                      <td className="px-8 py-6">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                            <User size={14} />
                          </div>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p className="font-black text-slate-900">{r.userId?.name || "Học viên"}</p>
                            <p className="text-xs text-slate-500">{r.userId?.email || ""}</p>
                          </motion.div>
                        </motion.div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-start gap-2">
                          <BookOpen size={14} className="mt-0.5 shrink-0 text-violet-600" />
                          <div>
                            <p className="font-medium text-slate-800">{r.courseId?.title || "—"}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              Mentor: {r.courseId?.mentorId?.name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
                          <Clock size={10} />
                          {r.createdAt ? new Date(r.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                        {r.transferSubmittedAt ? (
                          <p className="mt-1 text-[9px] font-semibold text-emerald-700">
                            HV báo CK: {new Date(r.transferSubmittedAt).toLocaleString("vi-VN")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">{getPaymentBadge(st)}</div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-violet-700">
                        {amountOf(r).toLocaleString("vi-VN")}{" "}
                        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
                      </td>
                      <td className="px-8 py-6 text-center align-top">
                        <div className="flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                          <span>Chuyển khoản</span>
                          <span className={st === "paid" ? "text-emerald-700" : st === "pending" ? "text-amber-700" : ""}>
                            {st || "—"}
                          </span>
                          {r.paymentRef ? (
                            <span
                              className="max-w-[160px] truncate font-mono text-[9px] font-semibold normal-case text-slate-500"
                              title={r.paymentRef}
                            >
                              {r.paymentRef}
                            </span>
                          ) : null}
                          {r.transferConfirmedAt ? (
                            <span className="text-[9px] font-semibold normal-case text-slate-500">
                              Admin xác nhận: {new Date(r.transferConfirmedAt).toLocaleString("vi-VN")}
                            </span>
                          ) : r.paidAt ? (
                            <span className="text-[9px] font-semibold normal-case text-slate-500">
                              Đã thanh toán: {new Date(r.paidAt).toLocaleString("vi-VN")}
                            </span>
                          ) : null}
                          {r.transferForceConfirm ? (
                            <span
                              className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-800"
                              title={r.transferForceNote || ""}
                            >
                              Override
                            </span>
                          ) : null}
                          {st === "pending" ? (
                            <span className="mt-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-violet-800">
                              SePay tự động
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
