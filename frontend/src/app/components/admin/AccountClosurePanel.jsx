import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { financeRequest } from "../../api/financeOperationsApi.js";
import { formatVnd } from "../../utils/shared/formatVnd.js";

export function AccountClosurePanel({ userId }) {
  const [impact, setImpact] = useState(null); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [reason, setReason] = useState(""); const [confirm, setConfirm] = useState(""); const [amount, setAmount] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setError(""); try { setImpact((await financeRequest(`/api/admin/users/${userId}/impact`)).impact); } catch (err) { setError(err.message); } }, [userId]);
  useEffect(() => { void load(); }, [load]);
  const act = async (kind) => {
    setBusy(true); setError(""); setMessage("");
    try {
      if (kind === "close") {
        await financeRequest(`/api/admin/users/${userId}/close`, "POST", { confirmUserId: userId, reason });
        setMessage("Đã đóng tài khoản và vô hiệu phiên đăng nhập.");
      } else {
        await financeRequest(`/api/admin/mentors/${impact.mentor.mentorId}/payouts`, "POST", { amount: Number(amount), reason });
        setMessage("Đã tạo yêu cầu giải ngân. Mở mục Rút tiền cố vấn để duyệt và ghi nhận chuyển khoản."); setAmount("");
      }
      await load();
    } catch (err) { setError(err.message); await load(); setError(err.message); } finally { setBusy(false); }
  };
  return <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-6"><div className="flex justify-between gap-3"><h2 className="text-xl font-bold">Tác động khi đóng tài khoản</h2><button className="text-sm text-violet-700" onClick={load}>Cập nhật</button></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="text-emerald-700">{message}</p>}
    {!impact && !error && <p>Đang kiểm tra các ràng buộc…</p>}
    {impact && <><p className="text-sm text-slate-600">Đóng tài khoản sẽ ngừng đăng nhập và ẩn danh thông tin cơ bản. Lịch sử giao dịch được giữ lại để đối soát.</p>
      <p className="text-sm">{impact.asStudent.activeEnrollments} khóa đã mua · {impact.asStudent.unusedPaidBookings} buổi chưa kết thúc · {impact.asStudent.heldPayments} giao dịch còn vướng</p>
      {impact.mentor && <div className="space-y-3 rounded-xl bg-slate-50 p-4"><p>Đang giữ: <strong>{formatVnd(impact.mentor.finance.clearingBalance)}</strong> · Khả dụng: <strong>{formatVnd(impact.mentor.finance.availableBalance)}</strong> · Chờ rút: <strong>{formatVnd(impact.mentor.finance.pendingBalance)}</strong></p>
        <p className="text-sm">{impact.mentor.payoutAccount ? `${impact.mentor.payoutAccount.bankName} · ${impact.mentor.payoutAccount.maskedNumber} · ${impact.mentor.payoutAccount.accountName}` : "Mentor chưa lưu tài khoản nhận tiền."}</p>
        {impact.mentor.finance.availableBalance > 0 && <div className="flex flex-wrap gap-3"><input aria-label="Số tiền giải ngân" type="number" min="1" max={impact.mentor.finance.availableBalance} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền giải ngân" className="rounded-lg border p-2" />
          <button disabled={busy || reason.trim().length < 3 || !Number(amount)} onClick={() => act("payout")} className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:opacity-40">Tạo yêu cầu giải ngân</button></div>}
        <Link className="inline-block text-sm text-violet-700" to="/admin/payouts">Xem yêu cầu rút tiền →</Link></div>}
      {impact.blockers.length > 0 && <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">{impact.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>}
      {impact.user.accountClosedAt ? <p className="font-bold text-slate-600">Tài khoản đã đóng.</p> : <>
        <label className="block text-sm">Lý do đóng tài khoản / giải ngân<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" /></label>
        <label className="block text-sm">Nhập email <strong>{impact.user.email}</strong> để xác nhận đóng<input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 block w-full rounded-xl border p-3" autoComplete="off" /></label>
        <button disabled={busy || !impact.canClose || impact.user.role === "admin" || reason.trim().length < 3 || confirm.trim().toLowerCase() !== impact.user.email} onClick={() => act("close")} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-40">Đóng tài khoản</button>
      </>}
    </>}
  </section>;
}
