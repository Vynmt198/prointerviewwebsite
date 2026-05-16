import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  Star,
  MessageSquareText as ChatText,
  FileText,
  Sparkles,
  Bell,
  BellRing as BellRinging,
  ShieldCheck,
  ExternalLink,
  Timer,
  StickyNote as Notepad,
  CheckCircle,
  ChevronRight as CaretRight,
  Chrome as GoogleLogo,
  Trophy,
  ThumbsUp,
  PartyPopper,
  AlertCircle as WarningCircle,
  Zap,
  User,
  X,
  CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { getBookingById, getReview } from "../../utils/bookings";
import { isLoggedIn } from "../../utils/auth";
import { cancelBooking, fetchBookingById } from "../../utils/bookingsApi";
import { apiBookingToLocal } from "../../utils/bookingMappers";

/* ─── Types ────────────────────────────────────────────── */

function isMongoObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());
}

/* ─── Helpers ──────────────────────────────────────────── */
function CopyBtn({ text, label = "Sao chép" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
      style={{
        background: copied ? "rgba(180,240,0,0.12)" : "#F3F4F6",
        color: copied ? "#4A7A00" : "#6B7280",
      }}
    >
      {copied ? <Check className="w-3 h-3" strokeWidth={3} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
      {copied ? "Đã sao chép!" : label}
    </button>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className="w-9 h-9"
            fill={i <= (hover || value) ? "#FFD600" : "none"}
            style={{ color: i <= (hover || value) ? "#FFD600" : "#D1D5DB" }}
          />
        </button>
      ))}
      {(hover || value) > 0 && (
        <span className="text-sm font-semibold text-gray-600 ml-2">
          {["", "Chưa hài lòng", "Tạm ổn", "Khá tốt", "Tốt", "Xuất sắc!"][hover || value]}
        </span>
      )}
    </div>
  );
}

function getPaymentMeta(paymentStatus) {
  if (paymentStatus === "refunded") {
    return {
      title: "Đã hoàn tiền",
      titleClass: "text-sky-600",
      note: "Khoản thanh toán đã được hoàn về ví/tài khoản theo chính sách.",
      noteClass: "text-sky-600",
      iconClass: "text-sky-500",
    };
  }
  if (paymentStatus === "paid") {
    return {
      title: "Đã thanh toán",
      titleClass: "text-gray-500",
      note: "Hoàn tiền 100% nếu mentor không tham gia đúng giờ.",
      noteClass: "text-gray-400",
      iconClass: "",
    };
  }
  return {
    title: "Chờ xử lý thanh toán",
    titleClass: "text-amber-600",
    note: "Đơn đang chờ xác nhận thanh toán.",
    noteClass: "text-amber-600",
    iconClass: "text-amber-500",
  };
}

/* ─── Countdown ────────────────────────────────────────── */
function useCountdown(targetDate, targetTime) {
  const target = useMemo(() => {
    try {
      // Remove day name prefix if present (e.g., "Thứ 2, 27/02" -> "27/02")
      const cleaned = targetDate.includes(",") 
        ? targetDate.split(",")[1].trim() 
        : targetDate;
      
      const parts = cleaned.split("/").map(Number);
      const [h, min] = targetTime.split(":").map(Number);
      
      if (parts.length === 3) {
        // Format: DD/MM/YYYY
        const [d, m, y] = parts;
        return new Date(y, m - 1, d, h, min, 0).getTime();
      } else if (parts.length === 2) {
        // Format: DD/MM (no year) - assume 2026
        const [d, m] = parts;
        return new Date(2026, m - 1, d, h, min, 0).getTime();
      }
      
      // Fallback: parse as is
      return new Date(`${cleaned} ${targetTime}`).getTime();
    } catch (err) {
      console.error("Countdown parse error:", err, "date:", targetDate, "time:", targetTime);
      // Fallback to 1 hour from now
      return Date.now() + 3600000;
    }
  }, [targetDate, targetTime]);

  const [diff, setDiff] = useState(target - Date.now());

  useEffect(() => {
    const iv = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(iv);
  }, [target]);

  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalSec };
}

/* ─── Main Component ───────────────────────────────────── */
export function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ── Resolve session data (localStorage / mock trước, rồi GET /api/bookings/:id khi đã đăng nhập) ── */
  const [apiBooking, setApiBooking] = useState(undefined);
  useEffect(() => {
    if (!id) {
      setApiBooking(null);
      return;
    }
    const local = getBookingById(id);
    if (local) {
      setApiBooking(null);
      return;
    }
    if (!isLoggedIn()) {
      setApiBooking(null);
      return;
    }
    let cancelled = false;
    setApiBooking(undefined);
    void fetchBookingById(id).then((r) => {
      if (cancelled) return;
      if (r.success && r.booking) setApiBooking(r.booking);
      else setApiBooking(null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sessionData = useMemo(() => {
    const local = getBookingById(id);
    if (local) return local;
    if (apiBooking && typeof apiBooking === "object") return apiBookingToLocal(apiBooking);
    return null;
  }, [id, apiBooking]);

  const mongoBookingId = useMemo(() => {
    if (!sessionData) return "";
    const raw = sessionData.backendId || sessionData.sessionId;
    return isMongoObjectId(raw) ? String(raw).trim() : "";
  }, [sessionData]);

  const sessionLoading =
    isLoggedIn() && apiBooking === undefined && !getBookingById(id);

  /* ── Demo state switcher (for demo purposes) ── */
  const [demoState, setDemoState] = useState("upcoming");

  /* ── Countdown ── */
  const { days, hours, minutes, seconds, totalSec } = useCountdown(
    sessionData?.date ?? "02/03/2026",
    sessionData?.time ?? "14:00"
  );
  const hoursLeft = totalSec / 3600;

  /* ── Session state logic ── */
  const autoState = totalSec <= 0 ? "done" : totalSec <= 3600 ? "live" : "upcoming";
  
  // Trạng thái thực tế: Ưu tiên status từ server, nếu không có mới dùng autoState theo thời gian
  const state = sessionData?.status === "done" ? "done" : autoState;
  const paymentMeta = getPaymentMeta(sessionData?.paymentStatus);

  /* ── Checklist ── */
  const [checklist, setChecklist] = useState([
    { id: "quiet", label: "Tìm nơi yên tĩnh, ít tiếng ồn", done: false },
    { id: "headset", label: "Chuẩn bị tai nghe và microphone", done: false },
    { id: "camera", label: "Kiểm tra camera hoạt động", done: false },
    { id: "cv-review", label: "Đọc lại CV một lần trước buổi hẹn", done: false },
    { id: "jd-review", label: "Nghiên cứu kỹ JD và công ty target", done: false },
    { id: "questions", label: "Chuẩn bị 3–5 câu hỏi muốn hỏi mentor", done: false },
    { id: "wifi", label: "Kiểm tra kết nối Internet ổn định", done: false },
  ]);
  const checklistDone = checklist.filter((c) => c.done).length;

  /* ── Notes ── */
  const [notes, setNotes] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  /* ── Rating / Feedback ── */
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const HIGHLIGHT_OPTIONS = [
    "Câu hỏi thực tế và chuyên sâu",
    "Feedback rõ ràng, dễ hiểu",
    "Chia sẻ kinh nghiệm insider",
    "Phong thái chuyên nghiệp",
    "Đúng giờ, chuẩn bị kỹ",
    "Gợi ý cải thiện cụ thể",
    "Tốc độ phù hợp, không áp lực",
  ];

  const canCancelOnServer = Boolean(
    mongoBookingId &&
      isLoggedIn() &&
      sessionData &&
      !["cancelled", "done", "no_show", "completed"].includes(String(sessionData.status || "")),
  );

  const handleConfirmCancelBooking = async () => {
    if (!mongoBookingId) return;
    setCancelBusy(true);
    const res = await cancelBooking(mongoBookingId, {
      reason: String(cancelReason || "").trim(),
    });
    setCancelBusy(false);
    if (!res.success) {
      toast.error(res.error || "Không hủy được lịch.");
      return;
    }
    const refund = res.cancellationPolicy?.refundPercent;
    const paid = sessionData?.paymentStatus === "paid";
    const extra =
      paid && typeof refund === "number"
        ? ` Hoàn tiền dự kiến: ${refund}% theo chính sách hệ thống.`
        : "";
    toast.success(`Đã hủy lịch.${extra}`);
    setCancelModalOpen(false);
    setCancelReason("");
    navigate("/dashboard");
  };

  if (sessionLoading) {
    return (
      <div className="p-12 text-center text-sm text-gray-500 antialiased">
        Đang tải thông tin buổi phỏng vấn…
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="p-8 text-center text-gray-400 antialiased">
        <WarningCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Không tìm thấy thông tin buổi phỏng vấn.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#6E35E8" }}
        >
          Về Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 pb-12 antialiased">
      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="group -ml-3 mb-6 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Quay lại
      </button>

      {/* ══════════════════════════════════════════════ */}
      {/*              STATE: UPCOMING                  */}
      {/* ══════════════════════════════════════════════ */}
      {state === "upcoming" && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT COL */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Status header ── */}
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, #1F1B2E 0%, #2D2640 100%)", border: "1px solid rgba(180,240,0,0.15)" }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(180,240,0,0.12)" }}>
                <Calendar className="w-6 h-6" style={{ color: "#B4F000" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold" style={{ fontSize: "1.05rem" }}>Buổi phỏng vấn đã được xác nhận</p>
                <p className="text-white/50 text-sm mt-0.5">{sessionData.date} · {sessionData.time}–{sessionData.endTime} · Zoom / Google Meet</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-semibold" style={{ color: "rgba(180,240,0,0.7)" }}>MÃ ĐẶT LỊCH</p>
                <p className="text-white font-bold text-sm">#{sessionData.orderNum}</p>
              </div>
            </div>

            {/* ── Countdown ── */}
            <div className="card-premium overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "rgba(110, 53, 232,0.03)" }}>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" style={{ color: "#6E35E8" }} />
                  <span className="font-semibold text-gray-800 text-sm">Đếm ngược đến buổi phỏng vấn</span>
                </div>
                <span className="text-xs text-gray-400">{sessionData.date} lúc {sessionData.time}</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Ngày", val: String(days).padStart(2, "0") },
                    { label: "Giờ", val: String(hours).padStart(2, "0") },
                    { label: "Phút", val: String(minutes).padStart(2, "0") },
                    { label: "Giây", val: String(seconds).padStart(2, "0") },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div
                        className="rounded-2xl py-4 mb-2 font-black tabular-nums"
                        style={{
                          background: "linear-gradient(135deg, #1F1B2E, #2D2640)",
                          color: "#B4F000",
                          fontSize: "2.25rem",
                          letterSpacing: "-0.05em",
                          lineHeight: 1,
                        }}
                      >
                        {item.val}
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Google Meet link ── */}
            <div className="card-premium overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2" style={{ background: "rgba(110, 53, 232,0.03)" }}>
                <Video className="w-4 h-4" style={{ color: "#6E35E8" }} />
                <span className="font-semibold text-gray-800 text-sm">Link tham gia phòng họp</span>
              </div>
              <div className="p-5">
                {/* Meet link card */}
                <div
                  className="rounded-2xl p-4 mb-4 flex items-center gap-4"
                  style={{ background: "rgba(66,133,244,0.05)", border: "1.5px solid rgba(66,133,244,0.2)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#4285F4" }}
                  >
                    <GoogleLogo className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm">Google Meet</p>
                    <p
                      className="font-mono text-xs mt-0.5 truncate"
                      style={{ color: "#4285F4" }}
                    >
                      {sessionData.meetLink}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={sessionData.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white transition-all hover:opacity-90"
                      style={{ background: "#4285F4" }}
                    >
                      Mở Meet <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <CopyBtn text={sessionData.meetLink} label="Sao chép liên kết" />
                  </div>
                </div>

                {/* Add to calendar */}
                <div className="flex items-center gap-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 border card-premium animate-fade-in" style={{ color: "#374151" }}
                  >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Thêm vào Google Calendar
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border card-premium animate-fade-in" style={{ color: "#374151" }}
                  >
                    <Bell className="w-4 h-4 text-gray-500" />
                    Đặt nhắc nhở
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#6E35E8" }} />
                  Link sẽ chỉ hoạt động đúng giờ phỏng vấn. Email xác nhận đã được gửi.
                </p>
              </div>
            </div>

            {/* ── Checklist ── */}
            <div className="card-premium overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "rgba(110, 53, 232,0.03)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: "#6E35E8" }} />
                  <span className="font-semibold text-gray-800 text-sm">Checklist chuẩn bị trước buổi</span>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: checklistDone === checklist.length ? "rgba(180,240,0,0.15)" : "rgba(110, 53, 232,0.08)",
                    color: checklistDone === checklist.length ? "#4A7A00" : "#6E35E8",
                  }}
                >
                  {checklistDone}/{checklist.length} hoàn thành
                </span>
              </div>
              <div className="p-5">
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(checklistDone / checklist.length) * 100}%`,
                      background: checklistDone === checklist.length
                        ? "linear-gradient(90deg, #B4F000, #8CC700)"
                        : "linear-gradient(90deg, #6E35E8, #8B4DFF)",
                    }}
                  />
                </div>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setChecklist((prev) =>
                          prev.map((c) => c.id === item.id ? { ...c, done: !c.done } : c)
                        )
                      }
                      className="w-full flex items-center gap-3 text-left transition-all"
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: item.done ? "#6E35E8" : "#fff",
                          border: item.done ? "2px solid #6E35E8" : "2px solid #D1D5DB",
                        }}
                      >
                        {item.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span
                        className="text-sm transition-all"
                        style={{
                          color: item.done ? "#9CA3AF" : "#374151",
                          textDecoration: item.done ? "line-through" : "none",
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
                {checklistDone === checklist.length && (
                  <div
                    className="mt-4 rounded-xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(180,240,0,0.1)", border: "1px solid rgba(180,240,0,0.3)" }}
                  >
                    <PartyPopper className="w-5 h-5" style={{ color: "#4A7A00" }} />
                    <p className="text-sm font-semibold" style={{ color: "#4A7A00" }}>
                      Bạn đã sẵn sàng 100%! Chúc buổi phỏng vấn thành công.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tips ── */}
            <div className="card-premium p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: "#FFD600" }} />
                <span className="font-semibold text-gray-800 text-sm">Tips từ mentor cho buổi phỏng vấn</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "💬", tip: "Trả lời theo cấu trúc STAR: Tình huống → Nhiệm vụ → Hành động → Kết quả" },
                  { icon: "⏱", tip: "Giữ mỗi câu trả lời trong 2–3 phút, đừng quá ngắn hoặc quá dài" },
                  { icon: "👁", tip: "Nhìn thẳng camera để tạo giao tiếp bằng mắt ảo, không nhìn màn hình" },
                  { icon: "📝", tip: "Chuẩn bị sẵn giấy để ghi chú những điểm mentor nhận xét" },
                  { icon: "🎯", tip: "Hỏi mentor về những gì thực sự diễn ra trong quy trình tuyển dụng" },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                    <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-4">
            {/* ── Mentor card ── */}
            <div className="card-premium p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Mentor của bạn</p>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={sessionData.mentorAvatar}
                  alt={sessionData.mentorName}
                  className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-gray-900 font-bold">{sessionData.mentorName}</p>
                  <p className="text-gray-500 text-xs">{sessionData.mentorTitle}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#6E35E8" }}>{sessionData.mentorCompany}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/mentors/${sessionData.mentorId}`)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 transition-all border border-gray-200 hover:border-[#6E35E8]/40 hover:text-[#6E35E8]"
              >
                Xem hồ sơ mentor
              </button>
            </div>

            {/* ── Session info ── */}
            <div className="card-premium p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chi tiết buổi hẹn</p>
              <div className="space-y-3">
                {[
                  { icon: Calendar, label: "Ngày", value: sessionData.date },
                  { icon: Clock, label: "Thời gian", value: `${sessionData.time} – ${sessionData.endTime}` },
                  { icon: Timer, label: "Thời lượng", value: "60 phút" },
                  { icon: Video, label: "Hình thức", value: "Google Meet" },
                  { icon: User, label: "Vị trí", value: sessionData.position },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(110, 53, 232,0.07)" }}>
                      <row.icon className="w-3.5 h-3.5" style={{ color: "#6E35E8" }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="text-sm font-medium text-gray-800">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Uploaded files ── */}
            <div className="card-premium p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tài liệu đã gửi mentor</p>
              <div className="space-y-2">
                {sessionData.cvFile && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#6E35E8" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{sessionData.cvFile}</p>
                      <p className="text-xs text-gray-400">CV đính kèm</p>
                    </div>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#4A7A00" }} />
                  </div>
                )}
                {sessionData.jdFile && (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#FF8C42" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{sessionData.jdFile}</p>
                      <p className="text-xs text-gray-400">JD đính kèm</p>
                    </div>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#4A7A00" }} />
                  </div>
                )}
                {!sessionData.jdFile && (
                  <p className="text-xs text-gray-400 italic">Không có JD kèm theo.</p>
                )}
              </div>
            </div>

            {/* ── Price & refund ── */}
            <div className="card-premium p-5">
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-semibold ${paymentMeta.titleClass}`}>{paymentMeta.title}</span>
                <span className="font-bold text-gray-900">{sessionData.price.toLocaleString("vi")}đ</span>
              </div>
              <div className="flex items-start gap-2 pt-3 border-t border-gray-100 mb-4">
                <ShieldCheck
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${paymentMeta.iconClass}`}
                  style={paymentMeta.iconClass ? undefined : { color: "#6E35E8" }}
                />
                <p className={`text-xs ${paymentMeta.noteClass}`}>{paymentMeta.note}</p>
              </div>

              {/* Cancel booking (API) + refund policy — khớp backend bookingsService.cancelMyBooking */}
              <div className="space-y-3">
                {canCancelOnServer ? (
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-2 card-premium animate-fade-in"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#EF4444";
                      e.currentTarget.style.color = "#EF4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E7EB";
                      e.currentTarget.style.color = "#6B7280";
                    }}
                  >
                    <X className="w-4 h-4" />
                    Hủy buổi phỏng vấn
                  </button>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
                    {isLoggedIn()
                      ? "Chỉ lịch đặt trên tài khoản (từ trang cố vấn) mới hủy được tự động qua hệ thống."
                      : "Đăng nhập và mở lịch từ mục Đặt lịch để hủy online."}
                  </p>
                )}

                <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-center gap-2">
                    <CircleDollarSign
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color: hoursLeft > 24 ? "#10b981" : hoursLeft > 2 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color: hoursLeft > 24 ? "#10b981" : hoursLeft > 2 ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {hoursLeft > 24
                        ? "Hoàn 100% (nếu đã thanh toán) nếu hủy ngay"
                        : hoursLeft > 2
                          ? "Hoàn 50% (nếu đã thanh toán) nếu hủy ngay"
                          : "Không hoàn tiền nếu đã thanh toán"}
                    </p>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-0.5 ml-6">
                    <li className={hoursLeft > 24 ? "text-emerald-600" : ""}>
                      • Trước hơn 24 giờ so với giờ hẹn: hoàn 100%
                    </li>
                    <li className={hoursLeft > 2 && hoursLeft <= 24 ? "text-amber-600" : ""}>
                      • Trong khoảng 2–24 giờ trước giờ hẹn: hoàn 50%
                    </li>
                    <li className={hoursLeft <= 2 ? "text-red-600" : ""}>
                      • Trong 2 giờ trước giờ hẹn: không hoàn
                    </li>
                  </ul>
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                    Liên hệ <strong className="text-gray-600">support@prointerview.vn</strong> để đổi lịch miễn phí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*                STATE: LIVE                    */}
      {/* ══════════════════════════════════════════════ */}
      {state === "live" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Live banner */}
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, #1F1B2E, #2D2640)", border: "1px solid rgba(180,240,0,0.2)" }}
            >
              <div className="relative">
                <div className="w-4 h-4 rounded-full" style={{ background: "#B4F000" }} />
                <div
                  className="absolute inset-0 w-4 h-4 rounded-full animate-ping"
                  style={{ background: "rgba(180,240,0,0.4)" }}
                />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold" style={{ fontSize: "1.05rem" }}>
                  Buổi phỏng vấn đang diễn ra
                </p>
                <p className="text-white/50 text-sm">
                  Với {sessionData.mentorName} · {sessionData.time} – {sessionData.endTime}
                </p>
              </div>
            </div>

            {/* Join button */}
            <button
              onClick={() => navigate(`/meeting/${id}`)}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-bold transition-all hover:opacity-95 active:scale-[0.98]"
              style={{
                background: "#6E35E8",
                boxShadow: "0 8px 32px rgba(110, 53, 232, 0.35)",
                fontSize: "1.1rem",
              }}
            >
              <Video className="w-6 h-6" />
              Vào phòng phỏng vấn ngay
              <ExternalLink className="w-5 h-5" />
            </button>


            <div className="flex items-center gap-3 py-2 text-sm text-gray-500">
              <div className="flex-1 h-px bg-gray-200" />
              <span>hoặc sao chép liên kết dưới đây</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Link copy */}
            <div
              className="flex items-center gap-3 p-4 rounded-2xl border"
              style={{ borderColor: "rgba(66,133,244,0.25)", background: "rgba(66,133,244,0.04)" }}
            >
              <p className="flex-1 font-mono text-sm text-gray-700 truncate">{sessionData.meetLink}</p>
              <CopyBtn text={sessionData.meetLink} label="Copy" />
            </div>

            {/* Notes area */}
            <div className="card-premium overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2" style={{ background: "rgba(110, 53, 232,0.03)" }}>
                <Notebook className="w-4 h-4" style={{ color: "#6E35E8" }} />
                <span className="font-semibold text-gray-800 text-sm">Ghi chú trong buổi phỏng vấn</span>
              </div>
              <div className="p-5">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm text-gray-700 resize-none focus:outline-none leading-relaxed"
                  style={{ minHeight: "200px", background: "transparent" }}
                  placeholder="Ghi lại những điểm quan trọng, feedback của mentor, những gì cần cải thiện...&#10;&#10;Ví dụ:&#10;- Câu trả lời về system design cần bổ sung phần scalability&#10;- Nên dùng số liệu cụ thể hơn khi kể về kinh nghiệm&#10;- Mentor gợi ý học thêm về distributed systems"
                />
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">{notes.length} ký tự</p>
                  <button
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "rgba(110, 53, 232,0.08)", color: "#6E35E8" }}
                  >
                    Lưu ghi chú
                  </button>
                </div>
              </div>
            </div>

            {/* Quick tips live */}
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(255,214,0,0.07)", border: "1px solid rgba(255,214,0,0.2)" }}
            >
              <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#997F00" }} />
              <div className="text-sm" style={{ color: "#7A6200" }}>
                <p className="font-semibold mb-1">Nhớ trong lúc phỏng vấn:</p>
                <p>Lắng nghe kỹ câu hỏi trước khi trả lời · Hỏi lại nếu không rõ · Ghi chú feedback để xem lại sau</p>
              </div>
            </div>
          </div>

          {/* Right col — mentor + session info */}
          <div className="space-y-4">
            <div className="card-premium p-5">
              <img
                src={sessionData.mentorAvatar}
                alt={sessionData.mentorName}
                className="w-16 h-16 rounded-2xl object-cover mb-3"
              />
              <p className="text-gray-900 font-bold">{sessionData.mentorName}</p>
              <p className="text-gray-500 text-xs">{sessionData.mentorTitle}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#6E35E8" }}>{sessionData.mentorCompany}</p>
              <div
                className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs"
                style={{ color: "#4A7A00" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: "#B4F000" }} />
                Đang trong phòng họp
              </div>
            </div>

            <div className="card-premium p-5 space-y-3">
              {[
                { label: "Ngày", value: sessionData.date },
                { label: "Thời gian", value: `${sessionData.time} – ${sessionData.endTime}` },
                { label: "Vị trí", value: sessionData.position },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-xs text-gray-400">{r.label}</p>
                  <p className="text-sm font-medium text-gray-800">{r.value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDemoState("done")}
              className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-[#6E35E8]/40 hover:text-[#6E35E8] transition-all"
            >
              Kết thúc buổi phỏng vấn →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*               STATE: DONE                     */}
      {/* ══════════════════════════════════════════════ */}
      {state === "done" && (() => {
        const existingReview = getReview(sessionData.sessionId);
        return (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* Done header */}
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, #0E0922 0%, #1a0d35 100%)", border: "1px solid rgba(180,240,0,0.2)" }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(180,240,0,0.12)" }}>
                <Trophy className="w-6 h-6 text-[#B4F000]" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold" style={{ fontSize: "1.05rem" }}>Buổi phỏng vấn đã hoàn thành 🎉</p>
                <p className="text-white/50 text-sm">{sessionData.date} · {sessionData.time} – {sessionData.endTime} · với {sessionData.mentorName}</p>
              </div>
            </div>

            {/* Review CTA */}
            {sessionData?.isReviewed ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[2.5rem] p-12 shadow-[0_30px_70px_rgba(0,0,0,0.03)] border border-slate-100 text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/40 to-violet-50/20 blur-[100px] -z-10 group-hover:scale-125 transition-transform duration-1000" />
                
                <div className="w-24 h-24 rounded-[2rem] bg-indigo-50/50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-12 h-12 text-indigo-500" />
                  </motion.div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Cảm ơn bạn đã đóng góp! ✨</h3>
                <p className="text-slate-500 text-base font-medium mb-10 leading-relaxed max-w-md mx-auto">
                  Đánh giá của bạn đã được gửi thành công. Những chia sẻ này giúp cộng đồng ngày càng phát triển hơn.
                </p>
                
                <div className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-50/80 rounded-[1.5rem] w-fit mx-auto border border-slate-100 transition-colors hover:bg-slate-100">
                  <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Đã hoàn thành đánh giá</span>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-12 shadow-[0_30px_70px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/40 to-violet-50/20 blur-[100px] -z-10" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center mb-8 shadow-lg shadow-amber-900/5 bg-white border border-amber-50"
                    style={{ background: "linear-gradient(135deg,rgba(255,214,0,0.08),rgba(255,214,0,0.02))" }}>
                    <Star className="w-10 h-10" style={{ color: "#FFD600" }} fill="#FFD600" />
                  </div>
                  
                  <div className="mb-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                      Bạn thấy buổi phỏng vấn thế nào?
                    </h3>
                    <p className="text-slate-500 text-base font-medium leading-relaxed max-w-md">
                      Chia sẻ trải nghiệm giúp <span className="text-indigo-600 font-bold">{sessionData.mentorName}</span> và cộng đồng.
                    </p>
                  </div>

                  {/* Interactive Star Picker */}
                  <div className="flex gap-4 mb-12">
                    {[1,2,3,4,5].map(i => (
                      <button
                        key={i}
                        onClick={() => navigate(`/review/${sessionData.sessionId}`, { state: { initialRating: i } })}
                        className="transition-all hover:scale-125 active:scale-90 group"
                      >
                        <Star 
                          className="w-14 h-14 transition-all duration-300" 
                          fill="none" 
                          style={{ color: "#F1F5F9" }} 
                          onMouseEnter={(e) => {
                            const siblings = e.currentTarget.parentElement.parentElement.querySelectorAll('svg');
                            siblings.forEach((s, idx) => {
                              if (idx < i) {
                                s.style.color = "#FFD600";
                                s.setAttribute('fill', '#FFD600');
                                s.style.filter = "drop-shadow(0 0 8px rgba(255,214,0,0.4))";
                              }
                            });
                          }}
                          onMouseLeave={(e) => {
                            const siblings = e.currentTarget.parentElement.parentElement.querySelectorAll('svg');
                            siblings.forEach((s) => {
                              s.style.color = "#F1F5F9";
                              s.setAttribute('fill', 'none');
                              s.style.filter = "none";
                            });
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/review/${sessionData.sessionId}`)}
                    className="w-full py-6 rounded-[2rem] font-black text-lg text-white shadow-2xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                    style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)" }}
                  >
                    Viết đánh giá ngay <CaretRight className="w-5 h-5" />
                  </button>
                  
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-8">
                    Chỉ mất 1 phút · Đánh giá của bạn rất quan trọng
                  </p>
                </div>
              </div>
            )}

            {/* Luxury Minimalist Mentor Feedback */}
            <div className="space-y-10">
              <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 blur-3xl -z-10" />
                
                <div className="mb-10">
                  <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3">KẾT QUẢ ĐÁNH GIÁ</h5>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nhận xét từ chuyên gia</h2>
                </div>
                
                <div className="space-y-1">
                  {(() => {
                    const raw = sessionData.mentorNotes || "";
                    if (!raw) return (
                      <div className="py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-400 font-semibold tracking-tight">Mentor đang hoàn thiện bản đánh giá chuyên sâu cho bạn...</p>
                      </div>
                    );
                    
                    const sections = raw.split(/\n/);
                    return sections.map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      
                      const cleanLine = trimmed.replace(/^[🎯💪🚀💡📝]\s*/, "");
                      
                      if (cleanLine.includes(":")) {
                         const [title, ...contentParts] = cleanLine.split(":");
                         const content = contentParts.join(":").trim();
                         return (
                           <div key={idx} className="group py-6 first:pt-0 last:pb-0 border-b border-slate-50 last:border-0">
                             <div className="flex items-baseline gap-5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" />
                                <div className="flex-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                                  <p className="text-base font-bold text-slate-800 leading-relaxed tracking-tight">{content}</p>
                                </div>
                             </div>
                           </div>
                         );
                      }

                      return (
                        <div key={idx} className="py-4 first:pt-0 last:pb-0">
                          <p className="text-sm font-semibold text-slate-600 leading-relaxed">{cleanLine}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div className="card-premium p-5">
              <p className="font-semibold text-gray-800 text-sm mb-4">Tiếp theo sau buổi phỏng vấn</p>
              <div className="space-y-3">
                {[
                  { icon: Sparkles, color: "#6E35E8", bg: "rgba(110, 53, 232,0.08)",
                    title: "Luyện tập với AI Interview", desc: "Áp dụng feedback vào mock interview AI",
                    action: () => navigate("/interview"), label: "Bắt đầu →" },
                  { icon: FileText, color: "#FF8C42", bg: "rgba(255,140,66,0.08)",
                    title: "Tối ưu lại CV", desc: "Phân tích CV với keyword mentor vừa đề xuất",
                    action: () => navigate("/cv-analysis"), label: "Phân tích →" },
                  { icon: Calendar, color: "#B4F000", bg: "rgba(180,240,0,0.10)",
                    title: "Đặt lịch buổi tiếp theo", desc: "Tiếp tục luyện tập để chinh phục phỏng vấn",
                    action: () => navigate("/mentors"), label: "Tìm mentor →" },
                ].map(item => (
                  <div key={item.title} onClick={item.action}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-sm"
                    style={{ border: "1.5px solid #F3F4F6" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-sm">{item.title}</p>
                      <p className="text-gray-400 text-xs">{item.desc}</p>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: item.color }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => navigate("/dashboard")}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#6E35E8,#8B4DFF)", boxShadow: "0 6px 20px rgba(110, 53, 232,0.3)" }}>
              Về Dashboard <CaretRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right col */}
          <div className="space-y-4">
            <div className="card-premium p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tóm tắt buổi phỏng vấn</p>
              <div className="flex items-center gap-3 mb-4">
                <img src={sessionData.mentorAvatar} alt={sessionData.mentorName}
                  className="w-12 h-12 rounded-2xl object-cover" />
                <div>
                  <p className="text-gray-900 font-bold text-sm">{sessionData.mentorName}</p>
                  <p className="text-gray-500 text-xs">{sessionData.mentorTitle}</p>
                </div>
              </div>
              <div className="space-y-2.5 pt-3 border-t border-gray-100">
                {[
                  { label: "Ngày",       value: sessionData.date },
                  { label: "Giờ",        value: `${sessionData.time} – ${sessionData.endTime}` },
                  { label: "Thời lượng", value: "60 phút" },
                  { label: "Vị trí",     value: sessionData.position },
                  { label: "Phí",        value: `${sessionData.price.toLocaleString("vi")}đ` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{r.label}</span>
                    <span className="text-gray-700 font-medium text-right max-w-[140px]">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-premium p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Trạng thái đánh giá</p>
              {existingReview ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#B4F000" }} />
                    <span className="text-xs font-semibold" style={{ color: "#4a7a00" }}>Đã đánh giá</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} style={{ width:18, height:18, color: i <= existingReview.overallRating ? "#FFD600" : "#E5E7EB" }}
                        fill={i <= existingReview.overallRating ? "#FFD600" : "none"} />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-semibold text-amber-600">Chờ đánh giá</span>
                  </div>
                  <button onClick={() => navigate(`/review/${sessionData.sessionId}`)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "linear-gradient(135deg,#6E35E8,#8B4DFF)", color: "#fff" }}>
                    Đánh giá ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      <AnimatePresence>
        {cancelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!cancelBusy) setCancelModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 16, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-black text-slate-900">Hủy lịch phỏng vấn?</h4>
              <p className="mt-2 text-sm text-slate-600">
                {hoursLeft > 24
                  ? "Theo chính sách hiện tại: nếu đã thanh toán, bạn được hoàn 100%."
                  : hoursLeft > 2
                    ? "Trong khoảng 2–24 giờ trước giờ hẹn: nếu đã thanh toán, hoàn 50%."
                    : "Trong 2 giờ trước giờ hẹn: không hoàn tiền nếu đã thanh toán."}
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-violet-400"
                placeholder="Lý do hủy (tuỳ chọn)"
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancelReason("");
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-wider text-slate-800 disabled:opacity-50"
                >
                  Giữ lịch
                </button>
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => void handleConfirmCancelBooking()}
                  className="rounded-xl border border-red-300 bg-red-50 py-3 text-xs font-black uppercase tracking-wider text-red-700 disabled:opacity-50"
                >
                  {cancelBusy ? "Đang xử lý…" : "Xác nhận hủy"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}