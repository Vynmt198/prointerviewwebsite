import { useEffect, useState } from "react";
import { Receipt, Download } from "lucide-react";
import { Link } from "react-router";
import { financeRequest, downloadInvoice } from "../../api/financeOperationsApi.js";
import { formatVnd } from "../../utils/shared/formatVnd.js";

const types = { booking: "Buổi mentor", course: "Khóa học", subscription: "Gói Pro/Elite" };
const statuses = { pending: "Chờ thanh toán", success: "Đã thanh toán", failed: "Thất bại", cancelled: "Đã hủy",
  refund_pending: "Chờ hoàn tiền", refunded: "Đã hoàn tiền", partial_refund: "Hoàn một phần", held_inactive_account: "Đang đối soát" };

export function PaymentHistory() {
  const [type, setType] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const [data, setData] = useState(null); const [error, setError] = useState(""); const [busy, setBusy] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false; setData(null); setError("");
    financeRequest(`/api/payments/history?${new URLSearchParams({ page, limit: 20, type, status })}`)
      .then((res) => { if (!cancelled) setData(res); }).catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [type, status, page, revision]);
  const download = async (row, grouped = false) => {
    setBusy(row.id); setError("");
    try { await downloadInvoice(grouped ? `/api/cart/orders/${row.cartOrderId}/invoice` : `/api/payments/${row.id}/invoice`, `hoa-don-${grouped ? row.cartOrderId : row.id}.pdf`); }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  };
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
    <div><Receipt className="mb-3 size-8 text-violet-600" /><h1 className="text-3xl font-black">Lịch sử thanh toán</h1>
      <p className="mt-2 text-slate-500">Tra cứu giao dịch và tải hóa đơn của bạn.</p></div>
    <div className="flex flex-wrap gap-3">
      <select aria-label="Loại giao dịch" className="rounded-xl border bg-white p-3" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
        <option value="">Tất cả loại giao dịch</option>{Object.entries(types).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
      <select aria-label="Trạng thái thanh toán" className="rounded-xl border bg-white p-3" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
      <button className="px-3 font-semibold text-violet-700" onClick={() => setRevision((n) => n + 1)}>Tải lại</button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!data && !error && <p role="status">Đang tải lịch sử…</p>}
    {data?.payments.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">Chưa có giao dịch phù hợp.</p>}
    <div className="space-y-3">{data?.payments.map((row) => <article key={row.id} className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="font-bold">{types[row.type] || row.type}</p><p className="mt-1 break-all text-xs text-slate-500">{row.providerRef || row.id}</p>
        <p className="mt-1 text-xs text-slate-500">{new Date(row.paidAt || row.createdAt).toLocaleString("vi-VN")}</p>
        {row.cartOrderId && <Link className="mt-2 inline-block text-sm text-violet-700" to={`/cart?order=${row.cartOrderId}`}>Xem đơn nhiều khóa</Link>}</div>
      <div><strong className="text-lg">{formatVnd(row.amount)}</strong><p className="mt-1 text-sm text-slate-600">{statuses[row.status] || row.status}</p></div>
      {row.status === "success" && <div className="flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => download(row)} className="flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2 text-sm text-violet-700 disabled:opacity-50"><Download className="size-4" />{busy === row.id ? "Đang tải…" : "Hóa đơn PDF"}</button>
        {row.cartOrderId && <button disabled={Boolean(busy)} onClick={() => download(row, true)} className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50">PDF toàn đơn</button>}</div>}
    </article>)}</div>
    {data && <div className="flex items-center justify-between gap-3"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border bg-white px-4 py-2 disabled:opacity-40">Trang trước</button>
      <span className="text-sm">Trang {page}/{data.pagination?.totalPages || 1}</span><button disabled={page >= (data.pagination?.totalPages || 1)} onClick={() => setPage(page + 1)} className="rounded-xl border bg-white px-4 py-2 disabled:opacity-40">Trang sau</button></div>}
  </main>;
}
