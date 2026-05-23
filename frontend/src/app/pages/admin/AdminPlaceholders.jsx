import React from "react";
import { useParams, Link } from "react-router";
import { AdminPanel } from "./AdminPanel.jsx";
import { useEffect, useState } from "react";
import { adminApi } from "../../utils/adminApi.js";
import { toastApiError, toastApiSuccess, tryApi } from "../../utils/apiToast";
import { AnimatePresence, motion } from "motion/react";

function vnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

function copyAdminText(text, successMsg = "Đã sao chép.") {
  const t = String(text || "").trim();
  if (!t) {
    toastApiError("Không có nội dung để sao chép.");
    return;
  }
  void navigator.clipboard.writeText(t).then(
    () => toastApiSuccess(successMsg),
    () => toastApiError("Trình duyệt không cho phép sao chép."),
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

export function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getUserById(id), {
        fallback: "Không tải được người dùng.",
        silent: true,
      });
      if (cancelled) return;
      if (!res.success) {
        const msg = res.error || "Không tải được";
        setError(msg);
        toastApiError(msg);
      } else {
        setUser(res.user || null);
        if (!res.user) setError("Không tìm thấy người dùng.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleActive = async () => {
    if (!user) return;
    const res = await tryApi(() => adminApi.updateUserStatus(user._id, user.isActive === false), {
      fallback: "Không cập nhật được trạng thái.",
      successMessage: user.isActive !== false ? "Đã khóa" : "Đã mở khóa",
    });
    if (res.success) setUser({ ...user, isActive: user.isActive === false });
  };

  return (
    <AdminPanel title="Chi tiết người dùng" description="Thông tin tài khoản và quota.">
      <Link to="/admin/users" className="mb-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
        ← Danh sách người dùng
      </Link>
      {loading && <p className="text-sm text-slate-500">Đang tải…</p>}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}
      {user && (
        <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <p className="text-xl font-black text-slate-900">{user.name}</p>
          <p className="text-sm text-slate-600">{user.email}</p>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <p><span className="font-semibold">Vai trò:</span> {user.role}</p>
            <p><span className="font-semibold">Gói:</span> {user.plan || "free"}</p>
            <p><span className="font-semibold">CV đã dùng:</span> {user.quota?.cvAnalysisUsed ?? 0} / {user.quota?.cvAnalysisLimit ?? 3}</p>
            <p><span className="font-semibold">Phỏng vấn AI:</span> {user.quota?.interviewUsed ?? 0} / {user.quota?.interviewLimit ?? user.quota?.interviewQuestionsAllowed ?? 1}</p>
            <p><span className="font-semibold">Lịch hẹn:</span> {user.stats?.bookingsCount ?? 0}</p>
            <p><span className="font-semibold">Khóa học:</span> {user.stats?.enrollmentsCount ?? 0}</p>
            <p><span className="font-semibold">Trạng thái:</span> {user.isActive === false ? "Đã khóa" : "Hoạt động"}</p>
            <p><span className="font-semibold">Đăng ký:</span> {user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : "—"}</p>
          </div>
          <button
            type="button"
            onClick={toggleActive}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            {user.isActive === false ? "Mở khóa" : "Khóa tài khoản"}
          </button>
        </motion.div>
      )}
    </AdminPanel>
  );
}

export function AdminMentorDetail() {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getMentorById(id), {
        fallback: "Không tải được cố vấn.",
        silent: true,
      });
      if (cancelled) return;
      if (!res.success) {
        setError(res.error || "Không tải được cố vấn.");
      } else {
        setMentor(res.mentor || null);
        if (!res.mentor) setError("Không tìm thấy cố vấn.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleActive = async () => {
    if (!mentor) return;
    const next = !mentor.isActive;
    const res = await tryApi(() => adminApi.updateMentorStatus(mentor._id, next), {
      fallback: "Không cập nhật được trạng thái.",
      successMessage: next ? "Đã kích hoạt cố vấn" : "Đã khóa cố vấn",
    });
    if (res.success) setMentor({ ...mentor, isActive: next, isVerified: next ? true : mentor.isVerified });
  };

  return (
    <AdminPanel title="Chi tiết cố vấn" description="Hồ sơ mentor trên hệ thống.">
      <Link to="/admin/mentors" className="mb-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
        ← Danh sách cố vấn
      </Link>
      {loading && <p className="text-sm text-slate-500">Đang tải…</p>}
      {error && !loading && <p className="text-sm text-red-600">{error}</p>}
      {mentor && (
        <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-sm">
          <p className="text-xl font-black">{mentor.name || mentor.userId?.name}</p>
          <p className="text-slate-600">{mentor.userId?.email}</p>
          <p><span className="font-semibold">Chuyên môn:</span> {(mentor.expertise || []).join(", ") || mentor.title || "—"}</p>
          <p><span className="font-semibold">Giá/giờ:</span> {vnd(mentor.pricePerHour || mentor.hourlyRate)}</p>
          <p><span className="font-semibold">Rating:</span> {mentor.rating ?? "—"} · Buổi: {mentor.stats?.sessionsCount ?? mentor.totalSessions ?? 0}</p>
          <p><span className="font-semibold">Duyệt:</span> {mentor.isVerified ? "Đã duyệt" : "Chờ / chưa duyệt"} · {mentor.isActive ? "Đang hoạt động" : "Tạm khóa"}</p>
          {mentor.bio && <p className="text-slate-600 whitespace-pre-wrap">{mentor.bio}</p>}
          <button
            type="button"
            onClick={toggleActive}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
          >
            {mentor.isActive ? "Khóa cố vấn" : "Kích hoạt cố vấn"}
          </button>
        </motion.div>
      )}
    </AdminPanel>
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
    const res = await tryApi(() => adminApi.getPayouts(), {
      fallback: "Không tải được danh sách payout.",
    });
    if (res.success) setRows(res.payouts || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const handleApprove = async (id) => {
    setBusyId(id);
    const res = await tryApi(() => adminApi.approvePayout(id), {
      fallback: "Không duyệt được yêu cầu.",
      successMessage: "Đã duyệt. Hãy chuyển khoản cho cố vấn rồi bấm “Đã chuyển khoản”.",
    });
    setBusyId("");
    if (res.success) await loadRows();
  };

  const confirmMarkPaid = async () => {
    const id = markPaidModal.payoutId;
    if (!id) return;
    setBusyId(id);
    const res = await tryApi(
      () =>
        adminApi.markPayoutPaid(id, {
          transferRef: String(markPaidModal.transferRef || "").trim(),
          note: String(markPaidModal.note || "").trim(),
        }),
      {
        fallback: "Không ghi nhận được đã chi.",
        successMessage: "Đã ghi nhận đã chuyển khoản cho cố vấn.",
      },
    );
    setBusyId("");
    if (!res.success) return;
    setMarkPaidModal({ open: false, payoutId: "", transferRef: "", note: "" });
    await loadRows();
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
    const res = await tryApi(() => adminApi.rejectPayout(rejectModal.payoutId, mergedReason), {
      fallback: "Không từ chối được yêu cầu.",
      successMessage: "Đã từ chối yêu cầu rút tiền.",
    });
    setBusyId("");
    if (!res.success) return;
    setRejectModal({ open: false, payoutId: "", reasonKey: "account_invalid", note: "" });
    await loadRows();
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
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getBookingById(id), {
      fallback: "Không tải được booking.",
    });
    if (res.success) setBooking(res.booking || null);
    else setBooking(null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const confirmCk = async () => {
    if (!booking) return;
    setBusy(true);
    const res = await tryApi(
      () => adminApi.confirmBookingTransferPayment(booking._id || booking.id, {}),
      {
        fallback: "Không xác nhận được chuyển khoản.",
        successMessage: "Đã xác nhận chuyển khoản.",
      },
    );
    setBusy(false);
    if (res.success) await load();
  };

  return (
    <AdminPanel title="Chi tiết lịch hẹn" description="Thông tin booking và xác nhận CK.">
      <Link to="/admin/bookings" className="mb-4 inline-block text-sm font-semibold text-violet-700 hover:underline">
        ← Danh sách booking
      </Link>
      {loading && <p className="text-sm text-slate-500">Đang tải…</p>}
      {!loading && !booking && <p className="text-sm text-red-600">Không tìm thấy booking.</p>}
      {booking && (
        <motion.div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-sm">
          <p className="text-lg font-black">{booking.position || booking.sessionType || "Buổi mentor"}</p>
          <p>Trạng thái: <strong>{statusLabel(booking.status)}</strong> · TT: {statusLabel(booking.paymentStatus)}</p>
          <p>Học viên: {booking.userId?.name || "—"} ({booking.userId?.email || "—"})</p>
          <p>Cố vấn: {booking.mentorId?.name || booking.mentorId?.userId?.name || "—"}</p>
          <p>Ngày: {booking.date} · {booking.timeSlot}</p>
          <p>Tổng: {vnd(booking.totalAmount || booking.price)}</p>
          <p>Mã CK: {booking.paymentRef || booking.orderNum || "—"}</p>
          {booking.notes && <p className="text-slate-600 whitespace-pre-wrap">Ghi chú: {booking.notes}</p>}
          {booking.paymentMethod === "transfer" && booking.paymentStatus === "pending" && (
            <button
              type="button"
              disabled={busy}
              onClick={confirmCk}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Xác nhận đã nhận CK
            </button>
          )}
        </motion.div>
      )}
    </AdminPanel>
  );
}

export function AdminContentQuestions() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getContentStats(), {
        fallback: "Không tải được thống kê nội dung.",
        silent: true,
      });
      if (res.success) setStats(res.content || null);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminPanel
      title="Nội dung — Câu hỏi phỏng vấn AI"
      description="Câu hỏi được sinh động theo CV/JD khi học viên bắt đầu phiên."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Phiên phỏng vấn AI", value: stats?.interviewSessions ?? 0 },
              { label: "Đã hoàn thành", value: stats?.completedInterviews ?? 0 },
              { label: "Phân tích CV", value: stats?.cvAnalyses ?? 0 },
              { label: "Khóa đã xuất bản", value: stats?.publishedCourses ?? 0 },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-violet-700">{card.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
            <p>
              <span className="font-semibold">Nguồn câu hỏi:</span>{" "}
              {stats?.aiQuestionSource || "POST /api/interviews/generate-questions"}
            </p>
            <p>
              Mỗi phiên tạo bộ câu hỏi riêng qua LLM (OpenAI-compatible). Không dùng ngân hàng câu hỏi tĩnh
              — phù hợp JD/CV thực tế của từng học viên.
            </p>
            <p className="text-xs text-slate-500">
              CRUD câu hỏi mẫu theo ngành có thể bổ sung sau; hiện ưu tiên chất lượng phỏng vấn cá nhân hoá.
            </p>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}

export function AdminContentVideos() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getCourseMediaOverview(), {
        fallback: "Không tải được danh sách video khóa học.",
      });
      if (res.success) setCourses(res.courses || []);
      setLoading(false);
    })();
  }, []);

  const totals = courses.reduce(
    (acc, c) => {
      acc.lessons += Number(c.lessonCount || 0);
      acc.videos += Number(c.videoCount || 0);
      return acc;
    },
    { lessons: 0, videos: 0 },
  );

  return (
    <AdminPanel
      title="Nội dung — Video khóa học"
      description="Video bài học do mentor upload qua POST /api/upload/course-video."
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tổng: <strong>{courses.length}</strong> khóa · <strong>{totals.videos}</strong> bài có video /{" "}
            <strong>{totals.lessons}</strong> bài học
          </p>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có khóa học xuất bản với video.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <p className="font-bold text-slate-900">{c.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Mentor: {c.mentorName} · Trạng thái: {statusLabel(c.status)} · Video: {c.videoCount}/
                    {c.lessonCount}
                  </p>
                  {c.thumbnail ? (
                    <p className="mt-2 text-xs text-slate-500 truncate">Thumbnail: {c.thumbnail}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Avatar phỏng vấn AI (D-ID) cấu hình trong mã nguồn phòng phỏng vấn; route demo: /avatar-demo.
          </p>
        </div>
      )}
    </AdminPanel>
  );
}

export { AdminContentCourses } from "./AdminContentCourses.jsx";

export function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sRes, uRes] = await Promise.all([adminApi.getStats(), adminApi.getUsers()]);
      if (sRes.success) setStats(sRes.stats);
      if (uRes.success) setUsers(uRes.users || []);
      setLoading(false);
    })();
  }, []);

  const planCounts = users.reduce(
    (acc, u) => {
      const p = u.plan || "free";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    },
    { free: 0, starter_pro: 0, elite_pro: 0 },
  );

  return (
    <AdminPanel title="Thống kê & báo cáo" description="Tổng quan nền tảng từ API admin.">
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Khách hàng", value: stats?.users ?? 0 },
            { label: "Cố vấn", value: stats?.mentors ?? 0 },
            { label: "Lịch hẹn", value: stats?.bookings ?? 0 },
            { label: "Gói Pro", value: planCounts.starter_pro ?? 0 },
            { label: "Gói Elite", value: planCounts.elite_pro ?? 0 },
            { label: "Free", value: planCounts.free ?? 0 },
          ].map((card) => (
            <motion.div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-black text-violet-700">{card.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AdminPanel>
  );
}

export function AdminSystemSettings() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getSystemOverview(), {
        fallback: "Không tải được cấu hình hệ thống.",
        silent: true,
      });
      if (res.success) setOverview(res.overview || null);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminPanel title="Cài đặt hệ thống" description="Tổng quan cấu hình auth, gói cước và dịch vụ.">
      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : overview ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-bold text-slate-900">Xác thực & phiên</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>Access token TTL: <code>{overview.auth?.accessTokenTtl}</code></li>
              <li>Refresh token: <code>{overview.auth?.refreshTokenDays}</code> ngày</li>
              <li>Blacklist JTI khi logout: {overview.auth?.jtiBlacklistOnLogout ? "Bật" : "Tắt"}</li>
              <li>Blacklist JTI khi refresh: {overview.auth?.jtiBlacklistOnRefresh ? "Bật" : "Tắt"}</li>
              <li>Fingerprint phiên (prod strict): {overview.auth?.sessionFingerprintEnforced ? "Bật" : "Tắt"}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-bold text-slate-900">Gói cước & quota</p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4">Gói</th>
                    <th className="py-2 pr-4">CV/tháng</th>
                    <th className="py-2">Phỏng vấn AI</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview.plans || []).map((p) => (
                    <tr key={p.key} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium">{p.label || p.key}</td>
                      <td className="py-2 pr-4">{p.cvAnalysisLimit}</td>
                      <td className="py-2">{p.interviewLimit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-bold text-slate-900">Thanh toán</p>
            <p className="mt-1">{overview.payments?.note}</p>
            <p className="mt-2 text-xs">Kênh chính: {overview.payments?.primaryChannel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-bold text-slate-900">Dịch vụ tích hợp</p>
            <p className="mt-1">CV analyzer: {overview.services?.cvAnalyzer}</p>
            <p>LLM phỏng vấn: {overview.services?.llm}</p>
            <p className="mt-2 font-bold text-slate-900">MongoDB</p>
            <pre className="mt-1 overflow-auto text-xs">{JSON.stringify(overview.mongo, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-600">Không tải được cấu hình.</p>
      )}
    </AdminPanel>
  );
}

export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await tryApi(() => adminApi.getReviews(), {
        fallback: "Không tải được danh sách đánh giá.",
      });
      if (res.success) setReviews(res.reviews || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminPanel title="Đánh giá cố vấn" description="Danh sách review công khai trên hệ thống.">
      {loading && <p className="text-sm text-slate-500">Đang tải…</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-sm text-slate-500">Chưa có đánh giá.</p>
      )}
      <div className="space-y-3">
        {reviews.map((r) => (
          <motion.div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-bold text-slate-900">★ {r.rating}/5</p>
            <p className="mt-1 text-slate-700">{r.comment || "(Không có nội dung)"}</p>
            <p className="mt-2 text-xs text-slate-500">
              User: {r.userId?.name || r.userId} · Mentor: {r.mentorId?.name || r.mentorId}
            </p>
          </motion.div>
        ))}
      </div>
    </AdminPanel>
  );
}

export function AdminSupport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadReports = async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getReports(), {
      fallback: "Không tải được danh sách báo cáo.",
    });
    if (res.success) setReports(res.reports || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const updateStatus = async (reportId, status) => {
    setBusyId(reportId);
    const res = await tryApi(
      () => adminApi.updateReportStatus(reportId, { status }),
      {
        fallback: "Không cập nhật được báo cáo.",
        successMessage: status === "resolved" ? "Đã xử lý báo cáo" : status === "dismissed" ? "Đã bác bỏ báo cáo" : "Đã cập nhật",
      },
    );
    setBusyId("");
    if (res.success) {
      setReports((prev) =>
        prev.map((r) => (String(r._id) === String(reportId) ? { ...r, ...(res.report || {}), status } : r)),
      );
    }
  };

  const reasonLabel = {
    late: "Trễ hẹn",
    unprofessional: "Thiếu chuyên nghiệp",
    inappropriate: "Không phù hợp",
    no_show: "Không tham gia",
    fraud: "Gian lận",
    other: "Khác",
  };

  const statusBadge = (status) => {
    if (status === "resolved") return "bg-emerald-500/10 text-emerald-800 border border-emerald-400/25";
    if (status === "dismissed") return "bg-slate-100 text-slate-600 border border-slate-200";
    if (status === "reviewing") return "bg-amber-500/10 text-amber-900 border border-amber-400/25";
    return "bg-orange-500/10 text-orange-900 border border-orange-400/25";
  };

  return (
    <AdminPanel title="Hỗ trợ & khiếu nại" description="Báo cáo từ người dùng (mentor, booking, khóa học…).">
      {loading && <p className="text-sm text-slate-500">Đang tải…</p>}
      {!loading && reports.length === 0 && (
        <p className="text-sm text-slate-500">Chưa có báo cáo nào.</p>
      )}
      <motion.div className="space-y-3">
        {reports.map((rep) => {
          const pending = rep.status === "pending" || rep.status === "reviewing";
          const busy = busyId === rep._id;
          return (
            <motion.div key={rep._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-bold text-slate-900">
                  {reasonLabel[rep.reason] || rep.reason} · {rep.targetType}
                </p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(rep.status)}`}>
                  {rep.status || "pending"}
                </span>
              </div>
              <p className="mt-1 text-slate-600 whitespace-pre-wrap">{rep.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Người gửi: {rep.reportedBy?.name || "—"} ({rep.reportedBy?.email || ""}) ·{" "}
                {rep.createdAt ? new Date(rep.createdAt).toLocaleString("vi-VN") : ""}
              </p>
              {rep.resolution && (
                <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  Xử lý: {rep.resolution}
                </p>
              )}
              {pending && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(rep._id, "reviewing")}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900 disabled:opacity-50"
                  >
                    Đang xử lý
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(rep._id, "resolved")}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 disabled:opacity-50"
                  >
                    Đã xử lý
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(rep._id, "dismissed")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 disabled:opacity-50"
                  >
                    Bác bỏ
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </AdminPanel>
  );
}
