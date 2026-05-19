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

function copyAdminText(text, successMsg = "Đã sao chép.") {
  const t = String(text || "").trim();
  if (!t) {
    toast.error("Không có nội dung để sao chép.");
    return;
  }
  void navigator.clipboard.writeText(t).then(
    () => toast.success(successMsg),
    () => toast.error("Trình duyệt không cho phép sao chép."),
  );
}

function statusLabel(status) {
  const key = String(status || "").toLowerCase();
  if (key === "pending") return "Chờ duyệt";
  if (key === "course_pending_ck") return "Chờ xác nhận chuyển khoản";
  if (key === "confirmed") return "Đã xác nhận";
  if (key === "completed") return "Hoàn thành";
  if (key === "approved") return "Đã duyệt — chờ CK";
  if (key === "paid") return "Đã chuyển khoản";
  if (key === "cancelled") return "Đã hủy";
  if (key === "rejected") return "Đã từ chối";
  if (key === "failed") return "Thất bại";
  return key || "Không xác định";
}

export function AdminUsers() {
  return (
    <AdminPanel
      title="Quản lý người dùng"
      description="Bảng users: email, tên, ngày đăng ký, gói, trạng thái — lọc theo gói / ngày / trạng thái, tìm theo email hoặc tên."
      bullets={[
        "Pagination server-side",
        "Chi tiết user: hồ sơ, lịch sử gói, sử dụng AI/CV, lịch hẹn cố vấn, biểu đồ hoạt động",
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
      description="Thông tin cá nhân, lịch sử nâng cấp gói, sử dụng AI/CV, lịch hẹn cố vấn, thống kê mức sử dụng."
      bullets={["Khóa / mở khóa", "Reset mật khẩu", "Manual upgrade/downgrade", "Xem activity logs"]}
    >
      <Link to="/admin/users" className="text-sm font-semibold text-violet-700 hover:underline">
        ← Quay lại danh sách
      </Link>
    </AdminPanel>
  );
}

export function AdminMentors() {
  return (
    <AdminPanel
      title="Quản lý cố vấn"
      description="Danh sách: tên, chuyên môn, giá giờ, rating, tổng buổi, thu nhập — lọc & tìm kiếm."
      bullets={[
        "Duyệt đơn pending tại /admin/mentors/pending",
        "Chi tiết: profile, buổi đã dạy, thu nhập, reviews, lịch, biểu đồ",
        "Khóa cố vấn, tỉ lệ hoa hồng, lịch sử rút tiền",
      ]}
    />
  );
}

export function AdminMentorDetail() {
  const { id } = useParams();
  return (
    <AdminPanel title={`Cố vấn · ${id ?? "—"}`} description="Hồ sơ đầy đủ và thống kê hiệu suất.">
      <Link to="/admin/mentors" className="text-sm font-semibold text-violet-700 hover:underline">
        ← Danh sách cố vấn
      </Link>
    </AdminPanel>
  );
}

export function AdminMentorsPending() {
  return (
    <AdminPanel
      title="Duyệt đăng ký cố vấn"
      description="Đơn chờ duyệt — Approve / Reject kèm lý do, xem chứng chỉ & kinh nghiệm."
    />
  );
}

export function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [courseFinance, setCourseFinance] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const [bookingRes, payoutRes, courseRes] = await Promise.all([
        adminApi.getBookings(),
        adminApi.getPayouts(),
        adminApi.getCourseFinanceSummary(),
      ]);
      if (bookingRes.success) setBookings(bookingRes.bookings || []);
      if (payoutRes.success) setPayouts(payoutRes.payouts || []);
      if (courseRes.success) setCourseFinance(courseRes.courseFinance || null);
      setLoading(false);
    };
    run();
  }, []);

  const totalBookingRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount ?? b.price ?? 0), 0);
  const totalPayoutRequested = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingPayout = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const approvedPayout = payouts
    .filter((p) => p.status === "approved" || p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const cf = courseFinance;

  return (
    <AdminPanel
      title="Tài chính — Tổng quan"
      description="Doanh thu lịch hẹn cố vấn, học phí khóa học, phí nền tảng và rút tiền cố vấn. Đối soát chuyển khoản khóa học tại mục Học phí khóa học."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải dữ liệu tài chính...</p>
      ) : (
        <div className="space-y-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs text-slate-500">Tổng giá trị lịch hẹn (booking)</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{vnd(totalBookingRevenue)}</p>
              <p className="mt-2 text-[11px] text-slate-500">Theo tổng tiền phiên (totalAmount / price).</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs text-slate-500">Tổng yêu cầu rút</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{vnd(totalPayoutRequested)}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-5">
              <p className="text-xs text-orange-900/80">Rút tiền chờ duyệt</p>
              <p className="mt-2 text-2xl font-black text-orange-900">{vnd(pendingPayout)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
              <p className="text-xs text-emerald-800/80">Rút tiền đã duyệt</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{vnd(approvedPayout)}</p>
            </div>
          </div>

          {cf && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Học phí khóa học</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Ghi danh khóa có phí (chuyển khoản). Khoản chờ đối soát là giao dịch chưa được xác nhận trên sao kê; khoản đã thu là giao dịch đã được xác nhận thanh toán.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/admin/course-payments"
                    className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-violet-700"
                  >
                    Học phí khóa →
                  </Link>
                  <Link
                    to="/admin/subscription-payments"
                    className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-900 shadow-sm transition hover:bg-amber-400"
                  >
                    Gói Pro/Elite →
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5">
                  <p className="text-xs font-semibold text-violet-900/90">Đã thu (đã xác nhận thanh toán)</p>
                  <p className="mt-2 text-2xl font-black text-violet-950">{vnd(cf.paidCollectedAmount)}</p>
                  <p className="mt-2 text-[11px] text-violet-900/70">{cf.paidCollectedCount} ghi danh có học phí &gt; 0</p>
                </div>
                <div className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5">
                  <p className="text-xs font-semibold text-amber-950/90">Chờ đối soát chuyển khoản</p>
                  <p className="mt-2 text-2xl font-black text-amber-950">{vnd(cf.pendingTransferAmount)}</p>
                  <p className="mt-2 text-[11px] text-amber-950/75">{cf.pendingTransferCount} ghi danh đang pending</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs text-slate-500">Ghi chú</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    Khóa miễn phí không vào đây. Chia sẻ doanh thu mentor (nếu có) sẽ bổ sung ở phiên sau — hiện chỉ tổng hợp tiền học viên theo ghi danh.
                  </p>
                </div>
              </div>
            </div>
          )}
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
      const [bookingRes, payoutRes, courseRes] = await Promise.all([
        adminApi.getBookings(),
        adminApi.getPayouts(),
        adminApi.getCourseFinanceSummary(),
      ]);
      const bookingRows = bookingRes.success
        ? (bookingRes.bookings || []).map((b) => ({
            id: b._id,
            type: "booking",
            amount: Number(b.totalAmount ?? b.price ?? 0),
            status: b.status || b.paymentStatus || "unknown",
            date: b.createdAt || b.updatedAt || new Date().toISOString(),
            label: `${b.userId?.name || "Người dùng"} → ${b.mentorId?.name || "Cố vấn"}`,
          }))
        : [];
      const payoutRows = payoutRes.success
        ? (payoutRes.payouts || []).map((p) => ({
            id: p._id,
            type: "payout",
            amount: Number(p.amount || 0),
            status: p.status || "pending",
            date: p.requestedAt || p.createdAt || new Date().toISOString(),
            label: p.mentorId?.name || p.mentorId?.userId?.name || "Cố vấn",
          }))
        : [];
      const cf = courseRes.success ? courseRes.courseFinance : null;
      const courseRows = [];
      if (cf) {
        (cf.pendingList || []).forEach((e) => {
          courseRows.push({
            id: `enr-p-${e._id}`,
            type: "course_fee",
            amount: Number(e.pricePaid || 0),
            status: "course_pending_ck",
            date: e.transferSubmittedAt || e.updatedAt || e.createdAt || new Date().toISOString(),
            label: `${e.userId?.name || "Học viên"} · ${e.courseId?.title || "Khóa học"} (chờ xác nhận chuyển khoản)`,
          });
        });
        (cf.recentPaidRows || []).forEach((e) => {
          courseRows.push({
            id: `enr-paid-${e._id}`,
            type: "course_fee",
            amount: Number(e.pricePaid || 0),
            status: "paid",
            date: e.paidAt || e.updatedAt || e.createdAt || new Date().toISOString(),
            label: `${e.userId?.name || "Học viên"} · ${e.courseId?.title || "Khóa học"}`,
          });
        });
      }
      setRows(
        [...bookingRows, ...payoutRows, ...courseRows]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 120),
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
  const courseFeeCount = filteredRows.filter((r) => r.type === "course_fee").length;

  const statusBadge = (status) => {
    if (["completed", "approved", "paid", "confirmed"].includes(status)) {
      return "bg-emerald-500/10 text-emerald-800 border border-emerald-400/25";
    }
    if (status === "pending" || status === "course_pending_ck") {
      return "bg-orange-500/10 text-orange-900 border border-orange-400/25";
    }
    if (["cancelled", "failed", "rejected"].includes(status)) {
      return "bg-red-500/10 text-red-800 border border-red-400/25";
    }
    return "border-slate-200 bg-slate-100/90";
  };

  return (
    <AdminPanel
      title="Giao dịch"
      description="Lịch hẹn cố vấn, học phí khóa học và rút tiền cố vấn — lọc theo loại và trạng thái."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải giao dịch...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Tổng giá trị (đang lọc)</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{vnd(totalAmount)}</p>
            </div>
            <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
              <p className="text-xs text-violet-800/80">Lịch hẹn</p>
              <p className="mt-1 text-2xl font-black text-violet-800">{bookingCount}</p>
            </div>
            <div className="rounded-2xl border border-teal-400/25 bg-teal-500/10 p-4">
              <p className="text-xs text-teal-900/85">Học phí khóa</p>
              <p className="mt-1 text-2xl font-black text-teal-950">{courseFeeCount}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4">
              <p className="text-xs text-cyan-800/80">Rút tiền</p>
              <p className="mt-1 text-2xl font-black text-cyan-800">{payoutCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "booking", label: "Lịch hẹn" },
              { id: "course_fee", label: "Học phí khóa" },
              { id: "payout", label: "Rút tiền" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTypeFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  typeFilter === item.id
                    ? "bg-primary-fixed text-black"
                    : "border border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
            {[
              { id: "all", label: "Mọi trạng thái" },
              { id: "pending", label: "Chờ duyệt" },
              { id: "course_pending_ck", label: "Chờ xác nhận chuyển khoản khóa" },
              { id: "confirmed", label: "Đã xác nhận" },
              { id: "completed", label: "Hoàn thành" },
              { id: "approved", label: "Đã duyệt" },
              { id: "cancelled", label: "Đã hủy" },
              { id: "rejected", label: "Đã từ chối" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  statusFilter === item.id
                    ? "bg-white text-black"
                    : "border border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
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
                  <tr key={`${r.type}-${r.id}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      {r.type === "booking" ? "Lịch hẹn" : r.type === "course_fee" ? "Học phí khóa" : "Rút tiền"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.label}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-bold">{vnd(r.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.date).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
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
  const REJECT_REASON_OPTIONS = [
    { id: "account_mismatch", label: "Thông tin tài khoản nhận tiền không khớp hồ sơ" },
    { id: "account_invalid", label: "Số tài khoản/ngân hàng không hợp lệ" },
    { id: "risk_check", label: "Yêu cầu cần kiểm tra rủi ro bổ sung" },
    { id: "duplicate_request", label: "Yêu cầu trùng lặp với lệnh trước đó" },
    { id: "policy_violation", label: "Yêu cầu chưa đáp ứng chính sách thanh toán" },
    { id: "other", label: "Lý do khác" },
  ];
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [rejectModal, setRejectModal] = useState({
    open: false,
    payoutId: "",
    reasonKey: "account_invalid",
    note: "",
  });
  const [markPaidModal, setMarkPaidModal] = useState({
    open: false,
    payoutId: "",
    transferRef: "",
    note: "",
  });

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
    toast.success("Đã duyệt. Hãy chuyển khoản cho cố vấn rồi bấm “Đã chuyển khoản”.");
    loadRows();
  };

  const confirmMarkPaid = async () => {
    const id = markPaidModal.payoutId;
    if (!id) return;
    setBusyId(id);
    const res = await adminApi.markPayoutPaid(id, {
      transferRef: String(markPaidModal.transferRef || "").trim(),
      note: String(markPaidModal.note || "").trim(),
    });
    setBusyId("");
    if (!res.success) return toast.error(res.error || "Không ghi nhận được đã chi.");
    toast.success("Đã ghi nhận đã chuyển khoản cho cố vấn.");
    setMarkPaidModal({ open: false, payoutId: "", transferRef: "", note: "" });
    loadRows();
  };

  const handleReject = async (id) => {
    setRejectModal({ open: true, payoutId: id, reasonKey: "account_invalid", note: "" });
  };

  const confirmReject = async () => {
    if (!rejectModal.payoutId) return;
    const selected = REJECT_REASON_OPTIONS.find((item) => item.id === rejectModal.reasonKey);
    const standardizedReason = selected?.label || "Lý do khác";
    const note = String(rejectModal.note || "").trim();
    const mergedReason = note ? `${standardizedReason}. Ghi chú: ${note}` : standardizedReason;
    setBusyId(rejectModal.payoutId);
    const res = await adminApi.rejectPayout(rejectModal.payoutId, mergedReason);
    setBusyId("");
    if (!res.success) return toast.error(res.error || "Không từ chối được yêu cầu.");
    toast.success("Đã từ chối yêu cầu rút tiền.");
    setRejectModal({ open: false, payoutId: "", reasonKey: "account_invalid", note: "" });
    loadRows();
  };

  const filteredRows = rows.filter((r) => (filter === "all" ? true : r.status === filter));
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const approvedAwaitCkCount = rows.filter((r) => r.status === "approved").length;
  const paidCount = rows.filter((r) => r.status === "paid").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  const statusBadge = (status) => {
    if (status === "pending") {
      return "bg-orange-500/10 text-orange-900 border border-orange-400/25";
    }
    if (status === "approved") {
      return "bg-amber-500/10 text-amber-900 border border-amber-400/25";
    }
    if (status === "paid") {
      return "bg-emerald-500/10 text-emerald-800 border border-emerald-400/25";
    }
    if (status === "rejected") {
      return "bg-red-500/10 text-red-800 border border-red-400/25";
    }
    return "border-slate-200 bg-slate-100/90";
  };

  return (
    <AdminPanel
      title="Rút tiền cố vấn"
      description="Duyệt yêu cầu rút tiền → chuyển khoản thủ công cho cố vấn → ghi nhận đã chi (đồng bộ trạng thái với màn Tài chính mentor)."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải yêu cầu rút tiền...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4">
              <p className="text-xs text-orange-900/80">Chờ duyệt</p>
              <p className="text-2xl font-black text-orange-900 mt-1">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-900/80">Đã duyệt — chờ CK</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{approvedAwaitCkCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-800/80">Đã chuyển khoản</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{paidCount}</p>
            </div>
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4">
              <p className="text-xs text-red-800/80">Từ chối</p>
              <p className="text-2xl font-black text-red-800 mt-1">{rejectedCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "pending", label: "Chờ duyệt" },
              { id: "approved", label: "Chờ chuyển khoản" },
              { id: "paid", label: "Đã chi" },
              { id: "rejected", label: "Đã từ chối" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                  filter === item.id
                    ? "bg-primary-fixed text-black"
                    : "border border-slate-200 bg-white/5 text-slate-600 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredRows.map((row) => {
            const mentorName = row?.mentorId?.name || row?.mentorId?.userId?.name || "Cố vấn";
            const isPending = row.status === "pending";
            const isApproved = row.status === "approved";
            const busy = busyId === row._id;
            const acct = String(row.payoutAccount?.accountNumber || "").trim();
            const bankName = String(row.payoutAccount?.bankName || "").trim();
            const acctName = String(row.payoutAccount?.accountName || "").trim();
            const ckLine = [bankName, acct, acctName].filter(Boolean).join(" · ");
  return (
              <div key={row._id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-900 font-black">{mentorName}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Tài khoản nhận tiền (để chuyển khoản)
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{bankName || "—"}</p>
                    <p className="mt-1 font-mono text-sm font-black tracking-wide text-slate-900 break-all">
                      STK: {acct || "—"}
                    </p>
                    {acctName ? (
                      <p className="mt-0.5 text-xs text-slate-600">
                        Chủ TK: <span className="font-semibold text-slate-800">{acctName}</span>
                      </p>
                    ) : null}
                    {acct ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyAdminText(acct, "Đã sao chép số tài khoản.")}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                        >
                          Sao chép STK
                        </button>
                        <button
                          type="button"
                          onClick={() => copyAdminText(ckLine, "Đã sao chép dòng đối soát.")}
                          className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-900 hover:bg-violet-100"
                        >
                          Sao chép cả dòng
                        </button>
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-500 mt-2">
                      Yêu cầu: {new Date(row.requestedAt || row.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {row.status === "paid" && row.paidAt ? (
                      <p className="text-xs text-emerald-800 mt-1">
                        Đã chi: {new Date(row.paidAt).toLocaleString("vi-VN")}
                        {row.transferRef ? ` · ND: ${row.transferRef}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">{vnd(row.amount)}</p>
                    <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </div>
                </div>
                {!!row.rejectReason && (
                  <p className="mt-3 text-xs text-red-800/85 bg-red-500/10 border border-red-400/25 rounded-xl px-3 py-2">
                    Lý do từ chối: {row.rejectReason}
                  </p>
                )}
                {isPending && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() => handleReject(row._id)}
                      className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-800 disabled:opacity-50"
                    >
                      {busy ? "..." : "Từ chối"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleApprove(row._id)}
                      className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800 disabled:opacity-50"
                    >
                      {busy ? "..." : "Duyệt yêu cầu"}
                    </button>
                  </div>
                )}
                {isApproved && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() =>
                        setMarkPaidModal({
                          open: true,
                          payoutId: String(row._id),
                          transferRef: "",
                          note: "",
                        })
                      }
                      className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-900 disabled:opacity-50"
                    >
                      Đã chuyển khoản cho mentor
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!filteredRows.length && <p className="text-sm text-slate-500">Không có yêu cầu phù hợp bộ lọc hiện tại.</p>}
        </div>
      )}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setRejectModal({ open: false, payoutId: "", reasonKey: "account_invalid", note: "" })}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Từ chối yêu cầu rút tiền</h4>
              <p className="text-sm text-slate-500 mt-2">
                Chọn lý do chuẩn hóa và thêm ghi chú tự do (nếu cần) để cố vấn nắm rõ nguyên nhân.
              </p>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                Lý do từ chối
              </label>
              <select
                value={rejectModal.reasonKey}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reasonKey: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-primary-fixed"
              >
                {REJECT_REASON_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id} className="bg-white">
                    {item.label}
                  </option>
                ))}
              </select>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                Ghi chú bổ sung (không bắt buộc)
              </label>
              <textarea
                value={rejectModal.note}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, note: e.target.value }))}
                className="mt-4 w-full min-h-28 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-primary-fixed"
                placeholder="Ví dụ: Vui lòng cập nhật lại STK đúng với tài khoản ngân hàng đã xác minh."
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, payoutId: "", reasonKey: "account_invalid", note: "" })}
                  className="rounded-xl border border-slate-200 bg-white/5 py-3 text-xs font-black uppercase tracking-wider text-slate-900"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={busyId === rejectModal.payoutId}
                  className="rounded-xl border border-red-400/25 bg-red-500/10 py-3 text-xs font-black uppercase tracking-wider text-red-800 disabled:opacity-50"
                >
                  {busyId === rejectModal.payoutId ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {markPaidModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              if (busyId === markPaidModal.payoutId) return;
              setMarkPaidModal({ open: false, payoutId: "", transferRef: "", note: "" });
            }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Ghi nhận đã chuyển khoản</h4>
              <p className="text-sm text-slate-500 mt-2">
                Sau khi bạn đã CK thủ công cho cố vấn, xác nhận để mentor thấy trạng thái &quot;Đã chuyển khoản&quot; trên
                màn Tài chính.
              </p>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                Nội dung / mã tham chiếu CK (tuỳ chọn)
              </label>
              <input
                type="text"
                value={markPaidModal.transferRef}
                onChange={(e) => setMarkPaidModal((prev) => ({ ...prev, transferRef: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Ví dụ: FT… hoặc nội dung sao kê"
              />
              <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                Ghi chú nội bộ (tuỳ chọn)
              </label>
              <textarea
                value={markPaidModal.note}
                onChange={(e) => setMarkPaidModal((prev) => ({ ...prev, note: e.target.value }))}
                className="mt-2 w-full min-h-20 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Ghi chú cho lịch sử admin…"
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={Boolean(busyId)}
                  onClick={() => setMarkPaidModal({ open: false, payoutId: "", transferRef: "", note: "" })}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-wider text-slate-800 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void confirmMarkPaid()}
                  disabled={busyId === markPaidModal.payoutId}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 py-3 text-xs font-black uppercase tracking-wider text-emerald-800 disabled:opacity-50"
                >
                  {busyId === markPaidModal.payoutId ? "Đang xử lý..." : "Xác nhận đã chi"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPanel>
  );
}

export function AdminBookingDetail() {
  const { id } = useParams();
  return (
    <AdminPanel title={`Lịch hẹn · ${id ?? "—"}`} description="Chi tiết, review, lịch sử đổi lịch/hủy lịch.">
      <Link to="/admin/bookings" className="text-sm font-semibold text-violet-700 hover:underline">
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
      description="Duyệt khóa học cố vấn gửi lên: duyệt để xuất bản, từ chối để trả về bản nháp."
    >
      <div className="space-y-4">
        {loading && <p className="text-sm text-slate-500">Đang tải danh sách chờ duyệt...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">Hiện không có khóa học nào đang chờ duyệt.</p>
        )}
        {items.map((course) => {
          const mentorName = course?.mentorId?.userId?.name || "Cố vấn";
          const topic = Array.isArray(course.topics) && course.topics.length ? course.topics[0] : "Other";
          const totalLessons = Number(course.totalLessons || 0);
          const busy = busyId === course._id;
          return (
            <div
              key={course._id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-900">{course.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cố vấn: {mentorName} · Chủ đề: {topic} · Bài học: {totalLessons}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                    {course.description || "(Không có mô tả)"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReject(course._id)}
                    className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-800 disabled:opacity-50"
                  >
                    {busy ? "..." : "Từ chối"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(course._id)}
                    className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800 disabled:opacity-50"
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
      description="Tổng quan: người dùng, cố vấn, doanh thu, lượt phỏng vấn AI, lượt phân tích CV, lịch hẹn hoàn thành."
      bullets={[
        "Biểu đồ: new users, revenue, pie Free/Pro/Elite, AI usage, booking trends",
        "Top cố vấn và người dùng nổi bật",
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
      title="Đánh giá cố vấn"
      description="Danh sách review — ẩn/xóa, reply với tư cách admin."
    />
  );
}

export function AdminSupport() {
  return (
    <AdminPanel
      title="Hỗ trợ & khiếu nại"
      description="Phiếu hỗ trợ (người dùng/cố vấn/lỗi), tranh chấp lịch hẹn, yêu cầu hoàn tiền."
    />
  );
}
