import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ShoppingCart, Trash2, ArrowRight, CheckCircle2, Copy } from "lucide-react";
import { useCart } from "../../hooks/useCart.jsx";
import { cartApi } from "../../api/cartApi.js";
import { formatVnd } from "../../utils/shared/formatVnd.js";
import { mediaSrc } from "../../utils/shared/mediaUrl.js";
import { BANK_TRANSFER, displayBankName, inferVietQrBankId, buildVietQrImageUrl } from "../../utils/shared/bankTransfer.js";

export function Cart() {
  const { cart, loading, error: cartError, refresh, remove } = useCart();
  const [params, setParams] = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [coupon, setCoupon] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState("");
  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    const result = await cartApi.order(orderId);
    setOrder(result.order);
    setError("");
    return result.order;
  }, [orderId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    let cancelled = false;
    let timer;
    setOrder(null);
    const poll = async () => {
      try {
        const result = await cartApi.order(orderId);
        if (cancelled) return;
        setOrder(result.order); setError("");
        if (result.order.status === "paid") { void refresh(); return; }
        if (result.order.status === "expired") return;
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
      }
      timer = setTimeout(poll, 5000);
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [orderId, refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkout = async () => {
    setBusy("checkout"); setError("");
    try { const result = await cartApi.checkout(coupon); setParams({ order: result.order.id }); setOrder(result.order); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusy(""); }
  };
  const removeItem = async (id) => {
    setBusy(id); setError("");
    try { await remove(id); } catch (err) { setError(err.message); } finally { setBusy(""); }
  };
  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); setCopied(value); }
    catch { setError("Không sao chép được. Bạn có thể chọn và sao chép thông tin chuyển khoản."); }
  };
  const items = order?.items || cart.items;
  const total = order?.totalAmount ?? cart.totalAmount;
  const remaining = Math.max(0, Math.ceil((new Date(order?.paymentExpiresAt).getTime() - now) / 1000)) || 0;
  const expired = order?.status === "expired" || (order?.status === "pending" && remaining === 0);
  const paid = order?.status === "paid";
  const processing = order?.status === "processing";
  const qr = order && !expired && !paid && !processing
    ? buildVietQrImageUrl(inferVietQrBankId(), BANK_TRANSFER.accountNumber, order.totalAmount, order.orderRef) : null;
  const buttonClass = "flex w-full items-center justify-center gap-2 rounded-xl bg-[#8037f4] px-5 py-3 text-sm font-bold text-white hover:bg-[#630ed4] disabled:opacity-50";

  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <Link to="/courses" className="text-sm font-semibold text-violet-700">← Khám phá khóa học</Link>
    <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">{orderId ? "Thanh toán khóa học" : "Giỏ hàng của bạn"}</h1>
    <p className="mt-3 text-sm text-slate-500">{orderId ? "Chuyển khoản một lần cho toàn bộ khóa học trong đơn." : "Chọn các khóa học và thanh toán cùng lúc. Giỏ hàng được lưu theo tài khoản của bạn."}</p>
    {(error || cartError) && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error || cartError}
      <button type="button" onClick={() => (orderId ? loadOrder().catch((err) => setError(err.message)) : refresh())} className="ml-3 font-bold underline">Thử lại</button>
    </div>}
    {paid ? <section className="mt-8 rounded-2xl border border-emerald-200 bg-white p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" /><h2 className="mt-4 text-2xl font-bold">Thanh toán thành công</h2>
      <p className="mt-2 text-slate-600">Bạn đã có thể học tất cả {order.items.length} khóa học trong đơn {order.orderRef}.</p>
      <Link to="/my-courses" className={`${buttonClass} mx-auto mt-6 max-w-xs`}>Vào khóa học của tôi <ArrowRight className="size-4" /></Link>
      <Link to="/payment-history" className="mt-4 inline-block text-sm font-semibold text-violet-700">Xem lịch sử và tải hóa đơn PDF</Link>
    </section> : orderId && !order ? <p className="py-12 text-slate-500" role="status">Đang tải đơn hàng…</p>
      : loading && !items.length ? <p className="py-12 text-slate-500" role="status">Đang tải giỏ hàng…</p>
      : !items.length && !cart.pendingOrder ? <section className="mt-8 rounded-2xl border border-violet-100 bg-white py-16 text-center">
        <ShoppingCart className="mx-auto size-12 text-violet-300" /><h2 className="mt-4 text-xl font-bold">Giỏ hàng đang trống</h2>
        <Link to="/courses" className="mt-4 inline-block font-semibold text-violet-700">Tìm khóa học phù hợp →</Link>
      </section> : <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white" aria-label="Khóa học trong đơn">
          <div className="border-b border-slate-100 px-5 py-4 text-sm font-bold">{items.length} khóa học{order ? ` · ${order.orderRef}` : ""}</div>
          {items.map((item) => <article key={String(item.courseId)} className="flex gap-4 border-b border-slate-100 p-5 last:border-b-0">
            {item.thumbnail && <img src={mediaSrc(item.thumbnail)} alt="" className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block" />}
            <div className="min-w-0 flex-1"><Link to={`/courses/${item.courseId}`} className="font-bold text-slate-900 hover:text-violet-700">{item.title}</Link>
              {item.mentorName && <p className="mt-1 text-sm text-slate-500">{item.mentorName}</p>}
              {!order && !item.available && <p className="mt-2 text-sm text-rose-600">Khóa học không còn mở bán. Vui lòng xóa khỏi giỏ.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><strong className="text-violet-700">{formatVnd(item.price)}</strong>
                {item.originalPrice > item.price && <del className="text-slate-400">{formatVnd(item.originalPrice)}</del>}</div>
            </div>
            {!order && <button type="button" disabled={Boolean(busy)} onClick={() => removeItem(item.courseId)} aria-label={`Xóa ${item.title} khỏi giỏ hàng`} className="self-start rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"><Trash2 className="size-4" /></button>}
          </article>)}
        </section>
        <aside className="rounded-2xl border border-violet-100 bg-white p-6">
          <h2 className="text-lg font-bold">{order ? "Thông tin thanh toán" : "Tổng đơn hàng"}</h2>
          <div className="my-5 flex justify-between gap-3"><span className="text-slate-600">Tổng thanh toán</span><strong className="text-xl text-violet-700">{formatVnd(total)}</strong></div>
          {!order && cart.items.some((i) => i.discountAmount > 0) && <p className="mb-4 text-sm text-violet-700">Đã áp dụng ưu đãi gói Pro/Elite.</p>}
          {!order && cart.pendingOrder ? <><p className="mb-4 text-sm text-slate-600">Bạn có một đơn đang chờ thanh toán. Các khóa mới thêm vào giỏ sẽ được mua trong đơn tiếp theo.</p><Link className={buttonClass} to={`/cart?order=${cart.pendingOrder.id}`}>Tiếp tục đơn đang chờ</Link></>
            : !order ? <><label className="block text-sm font-medium">Mã giảm giá<input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Nhập mã nếu có" className="mb-4 mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500" /></label>
              <button type="button" disabled={Boolean(busy) || !items.length || items.some((i) => !i.available)} onClick={checkout} className={buttonClass}>{busy === "checkout" ? "Đang tạo đơn…" : "Thanh toán giỏ hàng"}<ArrowRight className="size-4" /></button>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Giá và mã giảm giá được xác nhận khi tạo đơn thanh toán.</p></>
              : expired ? <div role="status"><p className="mb-4 text-sm text-amber-800">Đơn đã hết hạn. Vui lòng tạo đơn mới trước khi chuyển khoản.</p><button type="button" onClick={() => { setParams({}); setOrder(null); void refresh(); }} className={buttonClass}>Quay lại giỏ hàng</button></div>
                : processing ? <p role="status" className="text-sm text-violet-700">Đã nhận thanh toán. Đang mở quyền học cho các khóa trong đơn…</p>
                  : <><p className="text-center text-sm text-slate-500" role="timer">Còn {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} để chuyển khoản</p>
                    {qr && <img src={qr} alt={`Mã QR chuyển khoản ${formatVnd(total)} cho đơn ${order.orderRef}`} className="mx-auto my-4 w-60 max-w-full rounded-xl" />}
                    {!BANK_TRANSFER.accountNumber ? <p className="my-4 text-sm text-amber-800">Thanh toán chuyển khoản tạm thời chưa khả dụng. Vui lòng liên hệ hỗ trợ.</p> : <dl className="mt-4 space-y-3 text-sm">
                      <div><dt className="text-slate-500">Ngân hàng</dt><dd className="mt-1 font-semibold">{displayBankName(BANK_TRANSFER.bankName) || BANK_TRANSFER.bankName}</dd></div>
                      {[['Số tài khoản', BANK_TRANSFER.accountNumber], ['Chủ tài khoản', BANK_TRANSFER.accountOwner], ['Nội dung chuyển khoản', order.orderRef]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 flex items-center justify-between gap-2"><strong className="break-all">{value || "—"}</strong>{value && <button type="button" onClick={() => copy(value)} aria-label={`Sao chép ${label}`} className="rounded p-2 text-violet-700">{copied === value ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}</button>}</dd></div>)}
                    </dl>}
                    <p className="mt-5 text-xs leading-relaxed text-slate-500">Chuyển đúng tổng tiền và nội dung trên. Hệ thống tự cập nhật sau khi nhận thanh toán; bạn có thể quay lại đơn này từ giỏ hàng.</p></>}
        </aside>
      </div>}
  </main>;
}
