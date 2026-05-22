import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { Search, Clock, User, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { adminApi } from "../../utils/adminApi";
import { toastApiError, toastApiSuccess, tryApi } from "../../utils/apiToast";

function vnd(n) {
  return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
}

function paymentStatusOf(b) {
  return String(b?.paymentStatus || "").toLowerCase();
}

function bookingAmount(b) {
  return Number(b?.totalAmount ?? b?.price ?? 0);
}

export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [normalizeBusy, setNormalizeBusy] = useState(false);
  const [normalizeModalOpen, setNormalizeModalOpen] = useState(false);
  const [overrideModal, setOverrideModal] = useState({
    open: false,
    bookingId: "",
    forceNote: "Đã đối soát thủ công qua sao kê ngân hàng.",
  });
  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: "",
    previousStatus: "pending",
    reason: "",
  });

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getBookings(), {
      fallback: "Không thể tải danh sách lịch hẹn.",
    });
    if (res.success) setBookings(res.bookings);
    setLoading(false);
  }, []);

  const confirmBankTransfer = async (booking) => {
    const bookingId = booking?._id;
    if (!bookingId) return;

    const needsOverride = !booking?.transferSubmittedAt;
    if (needsOverride) {
      setOverrideModal({
        open: true,
        bookingId: String(bookingId),
        forceNote: "Đã đối soát thủ công qua sao kê ngân hàng.",
      });
      return;
    }
    await executeConfirmBankTransfer(String(bookingId), false, "");
  };

  const executeConfirmBankTransfer = async (bookingId, force, forceNote) => {
    setBusyId(bookingId);
    const res = await tryApi(
      () =>
        adminApi.confirmBookingTransferPayment(bookingId, force ? { force: true, forceNote } : {}),
      {
        fallback: "Không xác nhận được thanh toán.",
        successMessage: "Đã xác nhận đã nhận chuyển khoản.",
      },
    );
    setBusyId("");
    if (!res.success) return;
    setBookings((prev) =>
      prev.map((b) =>
        String(b._id) === String(bookingId)
          ? {
              ...b,
              paymentStatus: "paid",
              status: res.booking?.status || "confirmed",
              paidAt: res.booking?.paidAt || new Date().toISOString(),
              paymentRef: res.booking?.paymentRef ?? b.paymentRef,
              transferConfirmedAt: res.booking?.transferConfirmedAt ?? new Date().toISOString(),
              transferForceConfirm: Boolean(res.booking?.transferForceConfirm),
              transferForceNote: String(res.booking?.transferForceNote || ""),
            }
          : b,
      ),
    );
  };

  const confirmBookingRefund = async (booking) => {
    const bookingId = booking?._id;
    if (!bookingId) return;
    const amt = Number(booking.cancelRefundAmountVnd || 0);
    if (
      !window.confirm(
        `Xác nhận đã chuyển khoản hoàn ${amt.toLocaleString("vi-VN")}₫ cho học viên?\n\nChỉ bấm sau khi đã CK thật vào STK trên đơn.`,
      )
    ) {
      return;
    }
    setBusyId(bookingId);
    const res = await tryApi(() => adminApi.confirmBookingRefund(String(bookingId)), {
      fallback: "Không xác nhận được hoàn tiền.",
      successMessage: "Đã đánh dấu hoàn tiền xong.",
    });
    setBusyId("");
    if (!res.success) return;
    setBookings((prev) =>
      prev.map((b) =>
        String(b._id) === String(bookingId)
          ? {
              ...b,
              paymentStatus: res.booking?.paymentStatus || b.paymentStatus,
              refundCompletedAt: res.booking?.refundCompletedAt ?? new Date().toISOString(),
            }
          : b,
      ),
    );
  };

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const summary = useMemo(() => {
    const ck = bookings.filter((b) => b.paymentMethod === "transfer");
    const pending = ck.filter((b) => paymentStatusOf(b) === "pending");
    const paid = ck.filter((b) => paymentStatusOf(b) === "paid");
    const refundPending = bookings.filter((b) => paymentStatusOf(b) === "refund_pending");
    return {
      pendingTransferCount: pending.length,
      pendingTransferAmount: pending.reduce((s, b) => s + bookingAmount(b), 0),
      paidCollectedCount: paid.length,
      paidCollectedAmount: paid.reduce((s, b) => s + bookingAmount(b), 0),
      refundPendingCount: refundPending.length,
      refundPendingAmount: refundPending.reduce((s, b) => s + Number(b.cancelRefundAmountVnd || 0), 0),
    };
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bookings.filter((b) => {
      const pst = paymentStatusOf(b);
      if (filter === "pending" && pst !== "pending") return false;
      if (filter === "paid" && pst !== "paid") return false;
      if (filter === "refund_pending" && pst !== "refund_pending") return false;
      if (!q) return true;
      const student = String(b.userId?.name || b.userId?.email || "").toLowerCase();
      const mentor = String(b.mentorId?.name || "").toLowerCase();
      const ref = String(b.paymentRef || "").toLowerCase();
      return student.includes(q) || mentor.includes(q) || ref.includes(q);
    });
  }, [bookings, searchTerm, filter]);

  const handleNormalizeTransferRefs = async () => {
    setNormalizeModalOpen(false);
    setNormalizeBusy(true);
    const res = await tryApi(() => adminApi.normalizeTransferRefs({ dryRun: false }), {
      fallback: "Không thể chuẩn hóa mã chuyển khoản.",
    });
    setNormalizeBusy(false);
    if (!res.success) return;
    const changed = Number(res.totalChanged || 0);
    const scanned = Number(res.totalScanned || 0);
    toastApiSuccess(`Chuẩn hóa xong: ${changed}/${scanned} bản ghi đã được cập nhật.`);
    await loadBookings();
  };

  const confirmOverrideTransfer = async () => {
    const bookingId = String(overrideModal.bookingId || "").trim();
    const forceNote = String(overrideModal.forceNote || "").trim();
    if (!bookingId) return;
    if (forceNote.length < 3) {
      toastApiError("Cần nhập lý do ngoại lệ tối thiểu 3 ký tự.");
      return;
    }
    setOverrideModal((prev) => ({ ...prev, open: false }));
    await executeConfirmBankTransfer(bookingId, true, forceNote);
  };

  const handleStatusChange = async (bookingId, nextStatus, previousStatus = "pending") => {
    if (!bookingId || !nextStatus) return;
    if (nextStatus === "cancelled") {
      setCancelModal({
        open: true,
        bookingId,
        previousStatus,
        reason: "",
      });
      return;
    }
    setBusyId(bookingId);
    const res = await tryApi(() => adminApi.updateBookingStatus(bookingId, nextStatus, ""), {
      fallback: "Không thể cập nhật trạng thái lịch hẹn.",
      successMessage: "Đã cập nhật trạng thái lịch hẹn.",
    });
    setBusyId("");
    if (!res.success) return;
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)));
  };

  const confirmCancelBooking = async () => {
    const bookingId = cancelModal.bookingId;
    if (!bookingId) return;
    setBusyId(bookingId);
    const res = await tryApi(
      () => adminApi.updateBookingStatus(bookingId, "cancelled", cancelModal.reason || ""),
      { fallback: "Không thể hủy lịch hẹn.", successMessage: "Đã hủy lịch hẹn." },
    );
    setBusyId("");
    if (!res.success) return;
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)));
    setCancelModal({ open: false, bookingId: "", previousStatus: "pending", reason: "" });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-800">
            <CheckCircle size={10} /> Đã xác nhận
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-800">
            <Clock size={10} /> Chờ duyệt
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">
            <XCircle size={10} /> Đã hủy
          </span>
        );
      case "in_progress":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-800">
            <AlertCircle size={10} /> Đang diễn ra
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-800">
            <CheckCircle size={10} /> Hoàn thành
          </span>
        );
      case "no_show":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-rose-800">
            <XCircle size={10} /> Không tham gia
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (pst) => {
    if (pst === "paid") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-800">
          <CheckCircle size={10} /> Đã thanh toán
        </span>
      );
    }
    if (pst === "refund_pending") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-900">
          <Clock size={10} /> Chờ hoàn CK
        </span>
      );
    }
    if (pst === "refunded") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-800">
          <CheckCircle size={10} /> Đã hoàn tiền
        </span>
      );
    }
    if (pst === "partial_refund") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-800">
          <AlertCircle size={10} /> Hoàn một phần
        </span>
      );
    }
    if (pst === "pending") {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-800">
          <Clock size={10} /> Chờ xác nhận
        </span>
      );
    }
    return (
      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
        {pst || "—"}
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
        <div className="min-w-0 flex-1">
          <h2 className="font-headline mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">
            <span className="text-violet-700">Lịch hẹn</span> &amp; thanh toán
          </h2>
          <p className="max-w-2xl text-sm font-medium text-slate-600">
            Lịch hẹn cố vấn và đối soát chuyển khoản từng phiên — cùng kiểu bảng như học phí khóa học. Học phí khóa học
            nằm ở menu riêng.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setNormalizeModalOpen(true)}
            disabled={normalizeBusy}
            className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-violet-800 hover:bg-violet-100 disabled:opacity-50 sm:px-4 sm:py-3"
            title="Dọn dữ liệu mã chuyển khoản cũ bị nối dài"
          >
            {normalizeBusy ? "Đang chuẩn hóa..." : "Chuẩn hóa mã CK"}
          </button>
          <div className="relative min-w-0 flex-1 sm:flex-none sm:w-72">
            <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm học viên, cố vấn, mã CK..."
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
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Chờ xác nhận CK</p>
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
          className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-900">Chờ CK hoàn HV</p>
          <p className="mt-1 text-2xl font-black text-sky-950">{summary.refundPendingCount}</p>
          <p className="mt-1 text-sm font-semibold text-sky-900">{vnd(summary.refundPendingAmount)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-900">Tổng trên bảng</p>
          <p className="mt-1 text-2xl font-black text-violet-950">{bookings.length} lịch hẹn</p>
          <p className="mt-1 text-xs text-violet-900">Lọc: {filtered.length} dòng</p>
        </motion.div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Tất cả" },
          { id: "pending", label: "Chờ xác nhận" },
          { id: "paid", label: "Đã thanh toán" },
          { id: "refund_pending", label: "Chờ hoàn CK" },
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
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className={thCell}>Học viên</th>
                <th className={thCell}>Cố vấn</th>
                <th className={thCell}>Thời gian</th>
                <th className={`${thCell} text-center`}>Trạng thái</th>
                <th className={`${thCell} text-right`}>Chi phí</th>
                <th className={`${thCell} text-center`}>Thanh toán</th>
                <th className={`${thCell} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className={`${tdCell} py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500`}>
                    Đang tải lịch sử đặt lịch...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`${tdCell} py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500`}>
                    {bookings.length === 0
                      ? "Chưa có lịch hẹn — dữ liệu sẽ hiện khi có booking."
                      : "Không có dòng phù hợp bộ lọc / từ khóa."}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const pst = paymentStatusOf(b);
                  return (
                  <tr key={b._id} className="group transition-colors hover:bg-violet-50/40">
                    <td className={`${tdCell} max-w-[11rem]`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-900" title={b.userId?.name || ""}>
                            {b.userId?.name || "Người dùng ẩn"}
                          </p>
                          <p className="truncate text-xs text-slate-500" title={b.userId?.email || ""}>
                            {b.userId?.email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdCell} max-w-[10rem]`}>
                      <p className="truncate font-medium text-slate-700" title={b.mentorId?.name || ""}>
                        {b.mentorId?.name || "Cố vấn chưa xác định"}
                      </p>
                    </td>
                    <td className={`${tdCell} whitespace-nowrap`}>
                      <p className="font-black text-slate-900">{b.date}</p>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
                        <Clock size={10} /> {b.timeSlot || b.time}
                      </p>
                      {b.transferSubmittedAt ? (
                        <p className="mt-1 max-w-[12rem] text-[9px] font-semibold leading-snug text-emerald-700">
                          HV báo CK: {new Date(b.transferSubmittedAt).toLocaleString("vi-VN")}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdCell}>
                      <div className="flex flex-col items-center gap-2">
                        {getStatusBadge(b.status)}
                        {b.paymentMethod === "transfer" ? getPaymentStatusBadge(pst) : null}
                      </div>
                    </td>
                    <td className={`${tdCell} whitespace-nowrap text-right font-black text-violet-700`}>
                      {(b.totalAmount ?? b.price ?? 0).toLocaleString("vi-VN")}{" "}
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
                    </td>
                    <td className={`${tdCell} max-w-[11rem] text-center align-top`}>
                      <div className="mx-auto flex max-w-[11rem] flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        <span>{b.paymentMethod === "transfer" ? "Chuyển khoản" : b.paymentMethod || "—"}</span>
                        <span
                          className={
                            pst === "paid"
                              ? "text-emerald-700"
                              : pst === "pending"
                                ? "text-amber-700"
                                : "text-slate-500"
                          }
                        >
                          {b.paymentStatus || "—"}
                        </span>
                        {String(b.mentorCancelResolution || "") === "awaiting_user" ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-800">
                            Chờ HV chọn
                          </span>
                        ) : null}
                        {String(b.mentorCancelResolution || "") === "late_cancel_refund" ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900">
                            Hủy gấp → hoàn 100%
                          </span>
                        ) : null}
                        {String(b.mentorCancelResolution || "") === "no_show_refund" ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-800">
                            No-show → hoàn 100%
                          </span>
                        ) : null}
                        {b.paymentRef ? (
                          <span className="max-w-[160px] truncate font-mono text-[9px] font-semibold normal-case text-slate-500" title={b.paymentRef}>
                            {b.paymentRef}
                          </span>
                        ) : null}
                        {b.transferConfirmedAt ? (
                          <span className="max-w-full break-words text-center text-[9px] font-semibold leading-snug normal-case text-slate-500">
                            Admin xác nhận: {new Date(b.transferConfirmedAt).toLocaleString("vi-VN")}
                          </span>
                        ) : b.paidAt ? (
                          <span className="max-w-full break-words text-center text-[9px] font-semibold leading-snug normal-case text-slate-500">
                            Đã thanh toán: {new Date(b.paidAt).toLocaleString("vi-VN")}
                          </span>
                        ) : null}
                        {b.transferForceConfirm ? (
                          <span
                            className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-800"
                            title={String(b.transferForceNote || "Xác nhận ngoại lệ")}
                          >
                            Override
                          </span>
                        ) : null}
                        {b.paymentMethod === "transfer" && b.paymentStatus === "pending" ? (
                          <button
                            type="button"
                            disabled={busyId === b._id}
                            onClick={() => void confirmBankTransfer(b)}
                            className="mt-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Xác nhận đã thanh toán
                          </button>
                        ) : null}
                        {pst === "refund_pending" && Number(b.cancelRefundAmountVnd) > 0 ? (
                          <div className="mt-2 w-full max-w-[220px] rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-left">
                            <p className="text-[9px] font-black uppercase tracking-wider text-sky-900">Cần CK hoàn</p>
                            <p className="mt-1 text-[11px] font-bold text-sky-950">{vnd(b.cancelRefundAmountVnd)}</p>
                            {b.refundReceiveBankName ? (
                              <div className="mt-2 space-y-0.5 text-[10px] font-semibold leading-snug text-sky-950 normal-case">
                                <p>NH: {b.refundReceiveBankName}</p>
                                <p className="font-mono">STK: {b.refundReceiveAccountNumber}</p>
                                <p>Chủ TK: {b.refundReceiveAccountHolder}</p>
                              </div>
                            ) : (
                              <p className="mt-1 text-[10px] text-amber-800">Chưa có TK nhận hoàn.</p>
                            )}
                            <button
                              type="button"
                              disabled={busyId === b._id}
                              onClick={() => void confirmBookingRefund(b)}
                              className="mt-2 w-full rounded-lg border border-sky-400 bg-sky-100 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-950 hover:bg-sky-200 disabled:opacity-50"
                            >
                              Xác nhận đã hoàn tiền
                            </button>
                          </div>
                        ) : null}
                        {pst === "refunded" && b.refundCompletedAt ? (
                          <span className="mt-1 max-w-full text-center text-[9px] font-semibold leading-snug normal-case text-sky-700">
                            Hoàn xong: {new Date(b.refundCompletedAt).toLocaleString("vi-VN")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={tdCell}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/bookings/${b._id}`}
                          title="Chi tiết"
                          className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye size={16} />
                        </Link>
                        <select
                          value={b.status || "pending"}
                          disabled={busyId === b._id}
                          onChange={(e) => handleStatusChange(b._id, e.target.value, b.status || "pending")}
                          className="max-w-[9.5rem] rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none transition hover:border-violet-300 focus:border-violet-400 disabled:opacity-50 sm:max-w-none sm:px-3"
                        >
                          <option value="pending">Chờ duyệt</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="in_progress">Đang diễn ra</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                          <option value="no_show">Không tham gia</option>
                        </select>
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

      <AnimatePresence>
        {normalizeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setNormalizeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Chuẩn hóa mã chuyển khoản</h4>
              <p className="mt-2 text-sm text-slate-600">
                Hệ thống sẽ dọn dữ liệu <span className="font-semibold">paymentRef / providerRef</span> cũ bị nối nhiều
                đoạn để bảng thanh toán dễ đối soát hơn.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNormalizeModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-wider text-slate-800"
                >
                  Không chạy
                </button>
                <button
                  type="button"
                  onClick={() => void handleNormalizeTransferRefs()}
                  disabled={normalizeBusy}
                  className="rounded-xl border border-violet-300 bg-violet-50 py-3 text-xs font-black uppercase tracking-wider text-violet-700 disabled:opacity-50"
                >
                  {normalizeBusy ? "Đang xử lý..." : "Xác nhận chạy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {overrideModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setOverrideModal((prev) => ({ ...prev, open: false, bookingId: "" }))}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Xác nhận ngoại lệ chuyển khoản</h4>
              <p className="mt-2 text-sm text-slate-600">
                Người dùng chưa bấm <span className="font-semibold">“Tôi đã chuyển khoản”</span>. Hãy nhập lý do để lưu
                audit trước khi xác nhận.
              </p>
              <textarea
                value={overrideModal.forceNote}
                onChange={(e) => setOverrideModal((prev) => ({ ...prev, forceNote: e.target.value }))}
                className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Ví dụ: Đã đối soát thủ công theo sao kê ngân hàng."
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOverrideModal((prev) => ({ ...prev, open: false, bookingId: "" }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-wider text-slate-800"
                >
                  Không xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => void confirmOverrideTransfer()}
                  disabled={busyId === overrideModal.bookingId}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 py-3 text-xs font-black uppercase tracking-wider text-emerald-700 disabled:opacity-50"
                >
                  {busyId === overrideModal.bookingId ? "Đang xử lý..." : "Xác nhận ngoại lệ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {cancelModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setCancelModal((prev) => ({ ...prev, open: false, bookingId: "", reason: "" }))}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Xác nhận hủy lịch hẹn</h4>
              <p className="mt-2 text-sm text-slate-600">
                Bạn sắp đổi trạng thái sang <span className="font-semibold text-red-600">Đã hủy</span>. Có thể nhập lý
                do để lưu lại lịch sử xử lý.
              </p>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="mt-4 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Ví dụ: Học viên xin dời lịch, admin hủy phiên hiện tại."
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCancelModal((prev) => ({
                      ...prev,
                      open: false,
                      bookingId: "",
                      reason: "",
                    }))
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-wider text-slate-800"
                >
                  Không hủy
                </button>
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  disabled={busyId === cancelModal.bookingId}
                  className="rounded-xl border border-red-300 bg-red-50 py-3 text-xs font-black uppercase tracking-wider text-red-700 disabled:opacity-50"
                >
                  {busyId === cancelModal.bookingId ? "Đang xử lý..." : "Xác nhận hủy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
