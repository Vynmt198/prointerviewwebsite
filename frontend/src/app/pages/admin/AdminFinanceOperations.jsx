import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { financeRequest } from "../../api/financeOperationsApi.js";
import { formatVnd } from "../../utils/shared/formatVnd.js";

export function AdminFinanceOperations() {
  const [report, setReport] = useState(null); const [held, setHeld] = useState(null); const [page, setPage] = useState(1);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [refund, setRefund] = useState(null); const [reference, setReference] = useState(""); const [reason, setReason] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { const [r, h] = await Promise.all([financeRequest("/api/admin/finance/reconciliation"), financeRequest(`/api/admin/payments/held?page=${page}`)]); setReport(r.report); setHeld(h); }
    catch (err) { setError(err.message); }
  }, [page]);
  useEffect(() => { void load(); }, [load]);
  const release = async () => {
    setBusy(true); setMessage("");
    try { const { result } = await financeRequest("/api/admin/finance/release-earnings", "POST", {});
      setMessage(`Đã giải phóng ${result.releasedCount} khoản; ${result.heldCount} khoản tiếp tục giữ; ${result.failedCount} khoản cần đối soát.`); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const confirmRefund = async () => {
    setBusy(true);
    try { await financeRequest(`/api/admin/payments/${refund._id}/refund-held`, "PATCH", { transferRef: reference, reason, amount: refund.amount });
      setRefund(null); setMessage("Đã ghi nhận chuyển khoản hoàn tiền."); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="space-y-6"><h1 className="text-3xl font-black">Giải ngân & đối soát</h1>
    <p className="text-slate-600">Thu nhập mới được giữ 3 ngày từ lúc hoàn tất buổi mentor hoặc thanh toán khóa học. Khoản có khiếu nại mở tiếp tục được giữ.</p>
    <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={release} className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white disabled:opacity-40">Giải phóng khoản đủ hạn</button><button onClick={load} className="rounded-xl border bg-white px-5 py-3">Đối soát lại</button><Link to="/admin/payouts" className="px-3 py-3 text-violet-700">Yêu cầu rút tiền →</Link></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{message}</p>}
    <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Đối chiếu số dư đang giữ</h2>
      {!report && <p>Đang tải…</p>}{report && <><p className="text-sm text-slate-500">Đã kiểm tra {report.checked} mentor. Đối soát chỉ báo cáo chênh lệch, không tự sửa số dư.</p>
        {report.mismatches.length === 0 ? <p className="text-emerald-700">Số dư đang giữ khớp với các khoản chưa giải phóng.</p> : report.mismatches.map((m) => <div key={m.mentorId} className="rounded-lg bg-amber-50 p-3 text-sm"><Link to={`/admin/mentors/${m.mentorId}`} className="font-bold text-violet-700">{m.name}</Link><p>Trong ví: {formatVnd(m.actual)} · Theo giao dịch: {formatVnd(m.expected)} · Chênh lệch: {formatVnd(m.diff)}</p></div>)}
        <p className="text-sm">Khoản giải phóng lỗi quá 24 giờ: {report.alerts?.staleFailedClearances || 0} · Giao dịch đang giữ: {report.alerts?.heldPayments || 0}</p>
        <h3 className="font-bold">Đối chiếu tiền chờ rút</h3>
        {report.payoutMismatches?.length === 0 && <p className="text-sm text-emerald-700">Khớp với các yêu cầu rút chưa hoàn tất.</p>}
        {report.payoutMismatches?.map((m) => <p key={m.mentorId} className="text-sm text-amber-800">{m.name}: trong ví {formatVnd(m.actual)}, theo yêu cầu rút {formatVnd(m.expected)}.</p>)}
        {report.alerts?.suspendedMentorsWithBalance.map((m) => <p key={m.mentorId} className="text-sm text-amber-800">{m.name} đang ngừng hoạt động và còn {formatVnd(m.availableBalance)} cần giải ngân. Mở chi tiết người dùng để tạo yêu cầu.</p>)}
      </>}</section>
    <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Tiền nhận khi tài khoản bị khóa</h2><p className="text-sm text-slate-500">Chỉ xác nhận hoàn sau khi đã chuyển tiền qua ngân hàng; ghi đúng mã giao dịch và số tiền của từng khoản.</p>
      {held?.payments.length === 0 && <p>Không có khoản tiền đang chờ xử lý.</p>}
      {held?.payments.map((p) => <article key={p._id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div><Link className="font-bold text-violet-700" to={`/admin/users/${p.userId?._id}`}>{p.userId?.name || "Tài khoản đã đóng"}</Link><p className="text-sm">{formatVnd(p.amount)} · {p.type}</p><p className="text-xs text-slate-500">{p.heldReason}</p></div><button className="rounded-xl border px-4 py-2 text-sm" onClick={() => { setRefund(p); setReference(""); setReason(""); }}>Ghi nhận hoàn tiền</button></article>)}
      {held && <div className="flex gap-4 text-sm"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Trang trước</button><span>{page}/{held.pagination.totalPages}</span><button disabled={page >= held.pagination.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Trang sau</button></div>}
    </section>
    {refund && <section role="dialog" aria-modal="false" aria-label="Ghi nhận hoàn tiền" className="space-y-4 rounded-2xl border-2 border-violet-300 bg-white p-6"><h2 className="text-lg font-bold">Xác nhận đã hoàn {formatVnd(refund.amount)}</h2>
      <label className="block text-sm">Mã giao dịch ngân hàng<input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Lý do / ghi chú đối soát<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" /></label>
      <div className="flex gap-3"><button disabled={busy || reference.trim().length < 3 || reason.trim().length < 3} onClick={confirmRefund} className="rounded-xl bg-violet-600 px-5 py-3 text-white disabled:opacity-40">Xác nhận đã chuyển hoàn</button><button disabled={busy} onClick={() => setRefund(null)} className="px-4">Hủy</button></div>
    </section>}
  </div>;
}
