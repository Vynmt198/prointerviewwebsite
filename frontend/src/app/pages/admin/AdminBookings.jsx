import { useState, useEffect } from "react";
import { 
  Search, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
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
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)),
    );
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
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? { ...b, ...res.booking } : b)),
    );
    setCancelModal({ open: false, bookingId: "", previousStatus: "pending", reason: "" });
  };

  const filtered = bookings.filter(b => 
    b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.mentorId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return <span className="flex items-center gap-1.5 text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-400/25"><CheckCircle size={10} /> Đã xác nhận</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/20"><Clock size={10} /> Chờ duyệt</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20"><XCircle size={10} /> Đã hủy</span>;
      case 'in_progress':
        return <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-500/20"><AlertCircle size={10} /> Đang diễn ra</span>;
      case 'completed':
        return <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20"><CheckCircle size={10} /> Hoàn thành</span>;
      case 'no_show':
        return <span className="flex items-center gap-1.5 text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/20"><XCircle size={10} /> Không tham gia</span>;
      default:
        return <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-zinc-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Quản lý <span className="text-primary-fixed">Lịch hẹn</span></h2>
          <p className="text-zinc-500 text-sm font-medium">Theo dõi toàn bộ các phiên cố vấn và phỏng vấn trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Tìm người dùng, cố vấn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:border-primary-fixed outline-none transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Học viên</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cố vấn</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thời gian</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Chi phí</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-zinc-500 italic uppercase text-[10px] tracking-widest">Đang tải lịch sử đặt lịch...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-zinc-500 italic uppercase text-[10px] tracking-widest">Không có lịch hẹn nào.</td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b._id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500">
                          <User size={14} />
                        </div>
                        <p className="font-black text-white">{b.userId?.name || 'User ẩn'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-zinc-400 font-medium">
                      {b.mentorId?.name || 'Cố vấn ẩn'}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-white font-black">{b.date}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase tracking-widest"><Clock size={10} /> {b.timeSlot || b.time}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {getStatusBadge(b.status || b.paymentStatus)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-primary-fixed">
                      {(b.price || 0).toLocaleString()} <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">đ</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-end">
                        <select
                          value={b.status || "pending"}
                          disabled={busyId === b._id}
                          onChange={(e) => handleStatusChange(b._id, e.target.value, b.status || "pending")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 outline-none hover:border-primary-fixed focus:border-primary-fixed disabled:opacity-50"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() =>
              setCancelModal((prev) => ({ ...prev, open: false, bookingId: "", reason: "" }))
            }
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0618] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-white">Xác nhận hủy lịch hẹn</h4>
              <p className="text-sm text-zinc-400 mt-2">
                Bạn sắp đổi trạng thái sang <span className="text-red-300 font-semibold">Đã hủy</span>.
                Có thể nhập lý do để lưu lại lịch sử xử lý.
              </p>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="mt-4 w-full min-h-28 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white outline-none focus:border-primary-fixed"
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
                  className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white"
                >
                  Không hủy
                </button>
                <button
                  type="button"
                  onClick={confirmCancelBooking}
                  disabled={busyId === cancelModal.bookingId}
                  className="rounded-xl border border-red-400/25 bg-red-500/10 py-3 text-xs font-black uppercase tracking-wider text-red-200 disabled:opacity-50"
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
