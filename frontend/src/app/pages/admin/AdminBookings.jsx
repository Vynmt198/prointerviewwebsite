import { useState, useEffect } from "react";
import { Search, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    loadBookings();
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
            Quản lý <span className="text-violet-700">Lịch hẹn</span>
          </h2>
          <p className="text-sm font-medium text-slate-600">
            Theo dõi toàn bộ các phiên cố vấn và phỏng vấn trên hệ thống.
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
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                    Đang tải lịch sử đặt lịch...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-[10px] font-black uppercase italic tracking-widest text-slate-500">
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
                      <div className="flex justify-center">{getStatusBadge(b.status || b.paymentStatus)}</div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-violet-700">
                      {(b.price || 0).toLocaleString()}{" "}
                      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">đ</span>
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
