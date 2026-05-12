import { useState, useEffect } from "react";
import { Search, Clock, User, CheckCircle, XCircle, AlertCircle, BookOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { adminApi } from "../../utils/adminApi";
import { toast } from "sonner";

export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyId, setBusyId] = useState("");
  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: "",
    previousStatus: "pending",
    reason: "",
  });

  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [enrollBusyId, setEnrollBusyId] = useState("");
  /** mentor = bảng lịch hẹn + CK booking; course = học phí khóa CK */
  const [moneyTab, setMoneyTab] = useState("mentor");

  const loadPendingEnrollments = async () => {
    const res = await adminApi.getPendingEnrollmentTransfers();
    if (res.success) {
      setPendingEnrollments(res.enrollments || []);
    } else {
      toast.error(res.error || "Không tải được ghi danh chờ CK.");
    }
  };

  const confirmEnrollmentTransfer = async (enrollmentId) => {
    if (!enrollmentId) return;
    setEnrollBusyId(enrollmentId);
    const res = await adminApi.confirmEnrollmentTransferPayment(enrollmentId);
    setEnrollBusyId("");
    if (!res.success) {
      toast.error(res.error || "Không xác nhận được thanh toán ghi danh.");
      return;
    }
    toast.success("Đã kích hoạt ghi danh khóa học.");
    setPendingEnrollments((prev) => prev.filter((e) => String(e._id) !== String(enrollmentId)));
  };

  const loadBookings = async () => {
    setLoading(true);
    const res = await adminApi.getBookings();
    if (res.success) {
      setBookings(res.bookings);
    } else {
      toast.error(res.error || "Không thể tải danh sách lịch hẹn.");
    }
    setLoading(false);
  };

  const confirmBankTransfer = async (bookingId) => {
    if (!bookingId) return;
    setBusyId(bookingId);
    const res = await adminApi.confirmBookingTransferPayment(bookingId);
    setBusyId("");
    if (!res.success) {
      toast.error(res.error || "Không xác nhận được thanh toán.");
      return;
    }
    toast.success("Đã xác nhận đã nhận chuyển khoản.");
    setBookings((prev) =>
      prev.map((b) =>
        String(b._id) === String(bookingId)
          ? {
              ...b,
              paymentStatus: "paid",
              status: res.booking?.status || "confirmed",
              paidAt: res.booking?.paidAt || new Date().toISOString(),
              paymentRef: res.booking?.paymentRef ?? b.paymentRef,
            }
          : b,
      ),
    );
  };

  useEffect(() => {
    void loadBookings();
    void loadPendingEnrollments();
  }, []);

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
    const res = await adminApi.updateBookingStatus(bookingId, nextStatus, "");
    setBusyId("");
    if (!res.success) {
      toast.error(res.error || "Không thể cập nhật trạng thái lịch hẹn.");
      return;
    }
    toast.success("Đã cập nhật trạng thái lịch hẹn.");
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)));
  };

  const confirmCancelBooking = async () => {
    const bookingId = cancelModal.bookingId;
    if (!bookingId) return;
    setBusyId(bookingId);
    const res = await adminApi.updateBookingStatus(bookingId, "cancelled", cancelModal.reason || "");
    setBusyId("");
    if (!res.success) {
      toast.error(res.error || "Không thể hủy lịch hẹn.");
      return;
    }
    toast.success("Đã hủy lịch hẹn.");
    setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)));
    setCancelModal({ open: false, bookingId: "", previousStatus: "pending", reason: "" });
  };

  const filtered = bookings.filter(
    (b) =>
      b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mentorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-headline mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">
            <span className="text-violet-700">Lịch hẹn</span> &amp; duyệt CK
          </h2>
          <p className="text-sm font-medium text-slate-600">
            Tab <span className="font-semibold text-slate-800">Đặt lịch mentor</span>: lịch hẹn và nút xác nhận CK buổi cố vấn.
            Tab <span className="font-semibold text-slate-800">Học phí khóa học</span>: ghi danh khóa có phí — chờ đối soát chuyển khoản.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm người dùng, cố vấn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-6 text-sm text-slate-900 outline-none transition-all focus:border-violet-400 md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5">
        <button
          type="button"
          onClick={() => setMoneyTab("mentor")}
          className={`rounded-xl px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider transition ${
            moneyTab === "mentor"
              ? "bg-white text-violet-900 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
          }`}
        >
          Đặt lịch mentor / CK lịch hẹn
        </button>
        <button
          type="button"
          onClick={() => setMoneyTab("course")}
          className={`inline-flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider transition ${
            moneyTab === "course"
              ? "bg-white text-violet-900 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
          }`}
        >
          Học phí khóa học (CK)
          {pendingEnrollments.length > 0 ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white tabular-nums">
              {pendingEnrollments.length}
            </span>
          ) : null}
        </button>
      </div>

      {moneyTab === "mentor" && (
      <div className="glass-card overflow-hidden border-slate-200/90">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Học viên</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Cố vấn</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Thời gian</th>
                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Trạng thái
                </th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Chi phí
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Thanh toán
                </th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Đang tải lịch sử đặt lịch...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Không có lịch hẹn nào.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b._id} className="group transition-colors hover:bg-violet-50/40">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                          <User size={14} />
                        </div>
                        <p className="font-black text-slate-900">{b.userId?.name || "User ẩn"}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-700">{b.mentorId?.name || "Cố vấn ẩn"}</td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900">{b.date}</p>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-500">
                        <Clock size={10} /> {b.timeSlot || b.time}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">{getStatusBadge(b.status)}</div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-violet-700">
                      {(b.totalAmount ?? b.price ?? 0).toLocaleString()}{" "}
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
                    </td>
                    <td className="px-8 py-6 text-center align-top">
                      <div className="flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        <span>{b.paymentMethod === "transfer" ? "CK" : b.paymentMethod || "—"}</span>
                        <span
                          className={
                            b.paymentStatus === "paid"
                              ? "text-emerald-700"
                              : b.paymentStatus === "pending"
                                ? "text-amber-700"
                                : "text-slate-500"
                          }
                        >
                          {b.paymentStatus || "—"}
                        </span>
                        {b.paymentRef ? (
                          <span className="max-w-[160px] truncate font-mono text-[9px] font-semibold normal-case text-slate-500" title={b.paymentRef}>
                            {b.paymentRef}
                          </span>
                        ) : null}
                        {b.paymentMethod === "transfer" && b.paymentStatus === "pending" ? (
                          <button
                            type="button"
                            disabled={busyId === b._id}
                            onClick={() => void confirmBankTransfer(b._id)}
                            className="mt-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Xác nhận đã CK
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end">
                        <select
                          value={b.status || "pending"}
                          disabled={busyId === b._id}
                          onChange={(e) => handleStatusChange(b._id, e.target.value, b.status || "pending")}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-800 outline-none transition hover:border-violet-300 focus:border-violet-400 disabled:opacity-50"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {moneyTab === "course" && (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-violet-600" />
          <div>
            <h3 className="font-headline text-xl font-black uppercase tracking-tighter text-slate-900">
              Ghi danh khóa học — chờ CK
            </h3>
            <p className="text-sm font-medium text-slate-600">
              Xác nhận sau khi đối soát chuyển khoản (cùng luồng với lịch hẹn CK).
            </p>
          </div>
        </div>
        <div className="glass-card overflow-hidden border-slate-200/90">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Học viên</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Khóa học</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Số tiền</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Mã / nội dung CK</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pendingEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                      Không có ghi danh chờ xác nhận CK.
                    </td>
                  </tr>
                ) : (
                  pendingEnrollments.map((row) => (
                    <tr key={row._id} className="transition-colors hover:bg-violet-50/40">
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-900">{row.userId?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{row.userId?.email || ""}</p>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-800">{row.courseId?.title || "—"}</td>
                      <td className="px-8 py-4 text-right font-black text-violet-700">
                        {(row.pricePaid ?? row.courseId?.price ?? 0).toLocaleString("vi-VN")}{" "}
                        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="max-w-[220px] truncate font-mono text-xs text-slate-600" title={row.paymentRef}>
                          {row.paymentRef || "—"}
                        </span>
                        {row.transferSubmittedAt ? (
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-700">
                            Đã báo CK: {new Date(row.transferSubmittedAt).toLocaleString("vi-VN")}
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] text-amber-700">Chưa báo đã chuyển</p>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          type="button"
                          disabled={enrollBusyId === row._id}
                          onClick={() => void confirmEnrollmentTransfer(row._id)}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {enrollBusyId === row._id ? "Đang xử lý…" : "Xác nhận đã CK"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      <AnimatePresence>
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
