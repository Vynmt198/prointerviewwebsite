import React from "react";
import { useParams, Link } from "react-router";
import { AdminPanel } from "./AdminPanel.jsx";
import { useEffect, useState } from "react";
import { adminApi } from "../../utils/adminApi.js";

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
  return (
    <AdminPanel
      title="Tài chính — Tổng quan"
      description="Doanh thu tháng, tổng doanh thu, platform fee, pending payouts mentor."
      bullets={["Biểu đồ doanh thu theo thời gian", "Phân bổ subscription vs booking", "Top mentor theo thu nhập"]}
    />
  );
}

export function AdminTransactions() {
  return (
    <AdminPanel
      title="Giao dịch"
      description="Subscription Pro/Elite, booking payments, mentor payouts, refunds — lọc theo loại, ngày, trạng thái."
    />
  );
}

export function AdminPayouts() {
  return (
    <AdminPanel
      title="Rút tiền mentor"
      description="Danh sách yêu cầu rút tiền — Approve / Reject payout, lịch sử đã thanh toán."
    />
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
