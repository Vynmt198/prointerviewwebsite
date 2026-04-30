import React from "react";
import { useParams, Link } from "react-router";
import { AdminPanel } from "./AdminPanel.jsx";
import { useEffect, useState } from "react";
import { adminApi } from "../../utils/adminApi.js";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";

function vnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

export function AdminUsers() {
  return (
    <AdminPanel
      title="Quản lý người dùng"
      description="Bảng users: email, tên, ngày đăng ký, gói, trạng thái — lọc theo gói / ngày / trạng thái, tìm theo email hoặc tên."
      bullets={[
        "Pagination server-side",
        "Chi tiết user: profile, lịch sử gói, AI interview & CV usage, booking mentor, biểu đồ hoạt động",
        "Actions: khóa/mở khóa, reset password, đổi gói thủ công, activity logs",
      ]}
    />
  );
}

export function AdminUserDetail() {
  const { id } = useParams();
  return (
    <AdminPanel
      title={`Chi tiết user · ${id ?? "—"}`}
      description="Thông tin cá nhân, lịch sử nâng cấp gói, usage AI/CV, booking mentor, usage stats."
      bullets={["Khóa / mở khóa", "Reset mật khẩu", "Manual upgrade/downgrade", "Xem activity logs"]}
    >
      <Link to="/admin/users" className="text-sm font-semibold text-[#c4ff47] hover:underline">
        ← Quay lại danh sách
      </Link>
    </AdminPanel>
  );
}

export function AdminMentors() {
  return (
    <AdminPanel
      title="Quản lý mentor"
      description="Danh sách: tên, chuyên môn, giá giờ, rating, tổng buổi, thu nhập — lọc & tìm kiếm."
      bullets={[
        "Duyệt đơn pending tại /admin/mentors/pending",
        "Chi tiết: profile, buổi đã dạy, thu nhập, reviews, lịch, biểu đồ",
        "Khóa mentor, commission rate, lịch sử rút tiền",
      ]}
    />
  );
}

export function AdminMentorDetail() {
  const { id } = useParams();
  return (
    <AdminPanel title={`Mentor · ${id ?? "—"}`} description="Hồ sơ đầy đủ và thống kê hiệu suất.">
      <Link to="/admin/mentors" className="text-sm font-semibold text-[#c4ff47] hover:underline">
        ← Danh sách mentor
      </Link>
    </AdminPanel>
  );
}

export function AdminMentorsPending() {
  return (
    <AdminPanel
      title="Duyệt đăng ký mentor"
      description="Đơn chờ duyệt — Approve / Reject kèm lý do, xem chứng chỉ & kinh nghiệm."
    />
  );
}

export function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const [bookingRes, payoutRes] = await Promise.all([adminApi.getBookings(), adminApi.getPayouts()]);
      if (bookingRes.success) setBookings(bookingRes.bookings || []);
      if (payoutRes.success) setPayouts(payoutRes.payouts || []);
      setLoading(false);
    };
    run();
  }, []);

  const totalBookingRevenue = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const totalPayoutRequested = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingPayout = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const approvedPayout = payouts
    .filter((p) => p.status === "approved" || p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <AdminPanel
      title="Tài chính — Tổng quan"
      description="Doanh thu tháng, tổng doanh thu, platform fee, pending payouts mentor."
    >
      {loading ? (
        <p className="text-sm text-zinc-400">Đang tải dữ liệu tài chính...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-400">Tổng doanh thu booking</p>
            <p className="mt-2 text-2xl font-black text-white">{vnd(totalBookingRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-400">Tổng yêu cầu rút</p>
            <p className="mt-2 text-2xl font-black text-white">{vnd(totalPayoutRequested)}</p>
          </div>
          <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-5">
            <p className="text-xs text-orange-200/80">Rút tiền chờ duyệt</p>
            <p className="mt-2 text-2xl font-black text-orange-200">{vnd(pendingPayout)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
            <p className="text-xs text-emerald-200/80">Rút tiền đã duyệt</p>
            <p className="mt-2 text-2xl font-black text-emerald-200">{vnd(approvedPayout)}</p>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}

export function AdminTransactions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const [bookingRes, payoutRes] = await Promise.all([adminApi.getBookings(), adminApi.getPayouts()]);
      const bookingRows = bookingRes.success
        ? (bookingRes.bookings || []).map((b) => ({
            id: b._id,
            type: "booking",
            amount: Number(b.price || 0),
            status: b.status || b.paymentStatus || "unknown",
            date: b.createdAt || b.updatedAt || new Date().toISOString(),
            label: `${b.userId?.name || "User"} → ${b.mentorId?.name || "Mentor"}`,
          }))
        : [];
      const payoutRows = payoutRes.success
        ? (payoutRes.payouts || []).map((p) => ({
            id: p._id,
            type: "payout",
            amount: Number(p.amount || 0),
            status: p.status || "pending",
            date: p.requestedAt || p.createdAt || new Date().toISOString(),
            label: p.mentorId?.name || p.mentorId?.userId?.name || "Mentor",
          }))
        : [];
      setRows(
        [...bookingRows, ...payoutRows]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 80),
      );
      setLoading(false);
    };
    run();
  }, []);

  const filteredRows = rows.filter((r) => {
    const okType = typeFilter === "all" ? true : r.type === typeFilter;
    const okStatus = statusFilter === "all" ? true : r.status === statusFilter;
    return okType && okStatus;
  });

  const totalAmount = filteredRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const bookingCount = filteredRows.filter((r) => r.type === "booking").length;
  const payoutCount = filteredRows.filter((r) => r.type === "payout").length;

  const statusBadge = (status) => {
    if (["completed", "approved", "paid", "confirmed"].includes(status)) {
      return "bg-emerald-500/10 text-emerald-200 border border-emerald-400/25";
    }
    if (status === "pending") {
      return "bg-orange-500/10 text-orange-200 border border-orange-400/25";
    }
    if (["cancelled", "failed", "rejected"].includes(status)) {
      return "bg-red-500/10 text-red-200 border border-red-400/25";
    }
    return "bg-white/10 text-zinc-300 border border-white/20";
  };

  return (
    <AdminPanel
      title="Giao dịch"
      description="Subscription Pro/Elite, booking payments, mentor payouts, refunds — lọc theo loại, ngày, trạng thái."
    >
      {loading ? (
        <p className="text-sm text-zinc-400">Đang tải giao dịch...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-zinc-400">Tổng giá trị (đang lọc)</p>
              <p className="mt-1 text-2xl font-black text-white">{vnd(totalAmount)}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
              <p className="text-xs text-violet-200/80">Booking</p>
              <p className="mt-1 text-2xl font-black text-violet-200">{bookingCount}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4">
              <p className="text-xs text-cyan-200/80">Payout</p>
              <p className="mt-1 text-2xl font-black text-cyan-200">{payoutCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "booking", label: "Booking" },
              { id: "payout", label: "Payout" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTypeFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  typeFilter === item.id
                    ? "bg-primary-fixed text-black"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
            {[
              { id: "all", label: "Mọi trạng thái" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "completed", label: "Completed" },
              { id: "approved", label: "Approved" },
              { id: "cancelled", label: "Cancelled" },
              { id: "rejected", label: "Rejected" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  statusFilter === item.id
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white font-semibold">{r.type === "booking" ? "Booking" : "Payout"}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.label}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-bold">{vnd(r.amount)}</td>
                    <td className="px-4 py-3 text-zinc-400">{new Date(r.date).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      Không có giao dịch phù hợp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}

export function AdminPayouts() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [rejectModal, setRejectModal] = useState({ open: false, payoutId: "", reason: "" });

  const loadRows = async () => {
    setLoading(true);
    const res = await adminApi.getPayouts();
    if (res.success) setRows(res.payouts || []);
    else toast.error(res.error || "Không tải được danh sách payout.");
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const handleApprove = async (id) => {
    setBusyId(id);
    const res = await adminApi.approvePayout(id);
    setBusyId("");
    if (!res.success) return toast.error(res.error || "Không duyệt được yêu cầu.");
    toast.success("Đã duyệt yêu cầu rút tiền.");
    loadRows();
  };

  const handleReject = async (id) => {
    setRejectModal({ open: true, payoutId: id, reason: "" });
  };

  const confirmReject = async () => {
    if (!rejectModal.payoutId) return;
    setBusyId(rejectModal.payoutId);
    const res = await adminApi.rejectPayout(rejectModal.payoutId, rejectModal.reason || "");
    setBusyId("");
    if (!res.success) return toast.error(res.error || "Không từ chối được yêu cầu.");
    toast.success("Đã từ chối yêu cầu rút tiền.");
    setRejectModal({ open: false, payoutId: "", reason: "" });
    loadRows();
  };

  const filteredRows = rows.filter((r) => (filter === "all" ? true : r.status === filter));
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const approvedCount = rows.filter((r) => r.status === "approved" || r.status === "paid").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  const statusBadge = (status) => {
    if (status === "pending") {
      return "bg-orange-500/10 text-orange-200 border border-orange-400/25";
    }
    if (status === "approved" || status === "paid") {
      return "bg-emerald-500/10 text-emerald-200 border border-emerald-400/25";
    }
    if (status === "rejected") {
      return "bg-red-500/10 text-red-200 border border-red-400/25";
    }
    return "bg-white/10 text-zinc-300 border border-white/20";
  };

  return (
    <AdminPanel
      title="Rút tiền mentor"
      description="Danh sách yêu cầu rút tiền — Approve / Reject payout, lịch sử đã thanh toán."
    >
      {loading ? (
        <p className="text-sm text-zinc-400">Đang tải yêu cầu rút tiền...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4">
              <p className="text-xs text-orange-200/80">Chờ duyệt</p>
              <p className="text-2xl font-black text-orange-200 mt-1">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200/80">Đã duyệt</p>
              <p className="text-2xl font-black text-emerald-200 mt-1">{approvedCount}</p>
            </div>
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="text-xs text-red-200/80">Từ chối</p>
              <p className="text-2xl font-black text-red-200 mt-1">{rejectedCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  filter === item.id
                    ? "bg-primary-fixed text-black"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredRows.map((row) => {
            const mentorName = row?.mentorId?.name || row?.mentorId?.userId?.name || "Mentor";
            const isPending = row.status === "pending";
            const busy = busyId === row._id;
            return (
              <div key={row._id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-black">{mentorName}</p>
                    <p className="text-xs text-zinc-400">
                      {row.payoutAccount?.bankName} - ****{String(row.payoutAccount?.accountNumber || "").slice(-4)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(row.requestedAt || row.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{vnd(row.amount)}</p>
                    <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
                {!!row.rejectReason && (
                  <p className="mt-3 text-xs text-red-200/85 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2">
                    Lý do từ chối: {row.rejectReason}
                  </p>
                )}
                {isPending && (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => handleReject(row._id)}
                      className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-200 disabled:opacity-50"
                    >
                      {busy ? "..." : "Từ chối"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleApprove(row._id)}
                      className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-200 disabled:opacity-50"
                    >
                      {busy ? "..." : "Duyệt"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!filteredRows.length && <p className="text-sm text-zinc-500">Không có yêu cầu phù hợp bộ lọc hiện tại.</p>}
        </div>
      )}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setRejectModal({ open: false, payoutId: "", reason: "" })}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0618] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-white">Từ chối yêu cầu rút tiền</h4>
              <p className="text-sm text-zinc-400 mt-2">
                Nhập lý do để mentor nắm rõ nguyên nhân (không bắt buộc).
              </p>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="mt-4 w-full min-h-28 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white outline-none focus:border-primary-fixed"
                placeholder="Ví dụ: Thông tin tài khoản chưa xác minh..."
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, payoutId: "", reason: "" })}
                  className="rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={busyId === rejectModal.payoutId}
                  className="rounded-xl border border-red-400/25 bg-red-500/10 py-3 text-xs font-black uppercase tracking-wider text-red-200 disabled:opacity-50"
                >
                  {busyId === rejectModal.payoutId ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPanel>
  );
}

export function AdminBookings() {
  return (
    <AdminPanel
      title="Booking & sessions"
      description="User, mentor, ngày giờ, loại buổi, trạng thái, giá — filter & search."
      bullets={["Thống kê: booking tháng, tỷ lệ hoàn thành/hủy", "Trends & top mentor theo booking"]}
    />
  );
}

export function AdminBookingDetail() {
  const { id } = useParams();
  return (
    <AdminPanel title={`Booking · ${id ?? "—"}`} description="Chi tiết, review, lịch sử reschedule/cancel.">
      <Link to="/admin/bookings" className="text-sm font-semibold text-[#c4ff47] hover:underline">
        ← Danh sách booking
      </Link>
    </AdminPanel>
  );
}

export function AdminContentQuestions() {
  return (
    <AdminPanel
      title="Nội dung — Câu hỏi phỏng vấn mẫu"
      description="Theo ngành — CRUD câu hỏi, quản lý categories."
    />
  );
}

export function AdminContentVideos() {
  return (
    <AdminPanel
      title="Nội dung — Video HR (Cloudinary)"
      description="Danh sách video HR, upload/replace, quản lý URL."
    />
  );
}

export function AdminContentCourses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadPending = async () => {
    setLoading(true);
    const res = await adminApi.getPendingCourses();
    if (res.success) setItems(res.courses || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id) => {
    setBusyId(id);
    const res = await adminApi.approveCourse(id);
    setBusyId("");
    if (!res.success) return;
    await loadPending();
  };

  const handleReject = async (id) => {
    setBusyId(id);
    const res = await adminApi.rejectCourse(id);
    setBusyId("");
    if (!res.success) return;
    await loadPending();
  };

  return (
    <AdminPanel
      title="Nội dung — Khóa học"
      description="Duyệt khóa học mentor gửi lên: approve để xuất bản, reject để trả lại bản nháp."
    >
      <div className="space-y-4">
        {loading && <p className="text-sm text-zinc-400">Đang tải danh sách chờ duyệt...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-zinc-400">Hiện không có khóa học nào đang chờ duyệt.</p>
        )}
        {items.map((course) => {
          const mentorName = course?.mentorId?.userId?.name || "Mentor";
          const topic = Array.isArray(course.topics) && course.topics.length ? course.topics[0] : "Other";
          const totalLessons = Number(course.totalLessons || 0);
          const busy = busyId === course._id;
          return (
            <div
              key={course._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-white">{course.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Mentor: {mentorName} · Topic: {topic} · Lessons: {totalLessons}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300 line-clamp-2">
                    {course.description || "(Không có mô tả)"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReject(course._id)}
                    className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-200 disabled:opacity-50"
                  >
                    {busy ? "..." : "Từ chối"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(course._id)}
                    className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-200 disabled:opacity-50"
                  >
                    {busy ? "..." : "Duyệt"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminPanel>
  );
}

export function AdminAnalytics() {
  return (
    <AdminPanel
      title="Thống kê & báo cáo"
      description="Overview: users, mentors, doanh thu, AI interview runs, CV analyses, bookings hoàn thành."
      bullets={[
        "Biểu đồ: new users, revenue, pie Free/Pro/Elite, AI usage, booking trends",
        "Top mentor & top users",
        "Export CSV/PDF",
      ]}
    />
  );
}

export function AdminSystemSettings() {
  return (
    <AdminPanel
      title="Cài đặt hệ thống"
      description="Giá gói Pro/Elite, discount codes, % platform fee booking, Gemini quota, Cloudinary, email templates, roles, audit log."
    />
  );
}

export function AdminReviews() {
  return (
    <AdminPanel
      title="Reviews mentor"
      description="Danh sách review — ẩn/xóa, reply với tư cách admin."
    />
  );
}

export function AdminSupport() {
  return (
    <AdminPanel
      title="Hỗ trợ & khiếu nại"
      description="Support tickets (user/mentor/bug), disputes booking, refund requests."
    />
  );
}
