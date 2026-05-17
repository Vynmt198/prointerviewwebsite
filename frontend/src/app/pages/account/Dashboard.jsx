import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { getUser, isLoggedIn, getDisplayName, getInitials } from "../../utils/auth";
import { getCVAnalysisHistory, getStoredInterviewHistory } from "../../utils/history";
import { toast } from "sonner";
import { getAllBookings, parseDateMs } from "../../utils/bookings";
import { listBookings, cancelBooking } from "../../utils/bookingsApi";
import { fetchDashboardStats } from "../../utils/dashboardApi";
import {
  apiBookingToLocal,
  buildMentorIssueAlerts,
  buildRefundPendingAlerts,
  groupMentorIssueAlerts,
} from "../../utils/bookingMappers";
import { SKILLS_DATA } from "../../data/mockData";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";

/** Google Material Symbols Outlined — same family as mock (index.html loads the font). */
function MsIcon({ name, className = "", filled = false, size = 24, style }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "ms-filled" : ""} ${className}`.trim()}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}

function getCancellationPolicy(dateStr, timeStr) {
  const [d, m, y] = String(dateStr || "").split("/").map(Number);
  const [hh, mm] = String(timeStr || "").split(":").map(Number);
  const startAt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  if (!Number.isFinite(startAt.getTime())) {
    return { feePercent: 100, refundPercent: 0 };
  }
  const hoursUntil = (startAt.getTime() - Date.now()) / 3_600_000;
  if (hoursUntil < 12) return { feePercent: 100, refundPercent: 0 };
  if (hoursUntil < 24) return { feePercent: 50, refundPercent: 50 };
  return { feePercent: 0, refundPercent: 100 };
}

/** Nhãn hiển thị cho skill seed (Dashboard). */
const SKILL_DISPLAY = {
  Clarity: "Clarity (Mạch lạc)",
  Structure: "Structure (Cấu trúc)",
  Relevance: "Relevance (Độ liên quan)",
  Credibility: "Credibility (Độ tin cậy)",
  Communication: "Communication (Giao tiếp)",
};

function getTimeUntilSessionLabel(dateStr, timeStr) {
  const [d, m, y] = String(dateStr || "").split("/").map(Number);
  const [hh, mm] = String(timeStr || "").split(":").map(Number);
  const startAt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  if (!Number.isFinite(startAt.getTime())) return "";

  const diffMs = startAt.getTime() - Date.now();
  if (diffMs <= 0) return "Đến giờ";

  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h <= 0) return `Còn ${min}m`;
  if (min === 0) return `Còn ${h}h`;
  return `Còn ${h}h ${min}m`;
}

// Modal Hủy Lịch Hẹn
function CancellationModal({ booking, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountHolder, setRefundAccountHolder] = useState("");

  const reasons = [
    "Trùng lịch đột xuất",
    "Muốn đổi Mentor khác",
    "Không còn nhu cầu",
    "Khác",
  ];

  const policy = booking ? getCancellationPolicy(booking.date, booking.time) : { feePercent: 100, refundPercent: 0 };
  const needsRefundBank = Boolean(
    booking &&
      policy.refundPercent > 0 &&
      ["paid", "partial_refund"].includes(String(booking.paymentStatus || "").toLowerCase()),
  );

  const handleConfirm = async () => {
    if (!booking) return;
    const finalReason = reason === "Khác" ? customReason : reason;
    if (!finalReason) {
      toast.error("Vui lòng chọn hoặc nhập lý do hủy.");
      return;
    }
    if (needsRefundBank) {
      const acct = String(refundAccountNumber || "").replace(/\D/g, "");
      if (!String(refundBankName || "").trim() || acct.length < 6 || !String(refundAccountHolder || "").trim()) {
        toast.error("Vui lòng điền đầy đủ ngân hàng, số tài khoản nhận hoàn và tên chủ tài khoản.");
        return;
      }
    }
    setLoading(true);
    await onConfirm(booking.backendId, finalReason, {
      refundReceiveBankName: needsRefundBank ? String(refundBankName || "").trim() : "",
      refundReceiveAccountNumber: needsRefundBank
        ? String(refundAccountNumber || "").replace(/\D/g, "")
        : "",
      refundReceiveAccountHolder: needsRefundBank ? String(refundAccountHolder || "").trim() : "",
    });
    setLoading(false);
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/45 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="grid w-full max-w-md max-h-[min(85dvh,calc(100vh-3rem))] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-2 pt-5 sm:px-7 sm:pt-7">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Hủy lịch hẹn</h3>
            <p className="mb-5 mt-2 text-sm font-medium leading-relaxed text-slate-600">
              Buổi hẹn với <span className="font-bold text-violet-700">{booking.mentorName}</span> vào {booking.date} lúc{" "}
              {booking.time} sẽ bị hủy.
            </p>
            <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-600">Cảnh báo</p>
              <p className="mt-1 text-sm font-semibold text-red-700">
                {policy.feePercent === 100
                  ? "Hủy trong vòng dưới 12 giờ trước buổi hẹn: không hoàn tiền (100% phí giữ lại)."
                  : policy.feePercent === 50
                    ? "Hủy từ 12 giờ đến dưới 24 giờ trước buổi: hoàn 50% phí đã thanh toán."
                    : "Hủy từ 24 giờ trở lên trước buổi: hoàn 100% phí đã thanh toán."}
              </p>
            </div>

            <div className="mb-4 space-y-2">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lý do của bạn</p>
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                    reason === r
                      ? "border-violet-300 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r}
                </button>
              ))}

              <AnimatePresence>
                {reason === "Khác" && (
                  <motion.textarea
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 80 }}
                    exit={{ opacity: 0, height: 0 }}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập lý do cụ thể..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-300"
                  />
                )}
              </AnimatePresence>
            </div>

            {needsRefundBank ? (
              <div className="mb-2 space-y-2 rounded-2xl border border-sky-200 bg-sky-50/90 p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-900">Tài khoản nhận hoàn tiền</p>
                <p className="text-xs leading-snug text-sky-950/80">
                  Tiền vào TK công ty — hệ thống không lưu STK nguồn. Điền STK nhận hoàn. Số tiền hoàn do hệ thống tính,
                  không nhập tay.
                </p>
                <input
                  type="text"
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                  placeholder="Tên ngân hàng (vd. Vietcombank)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                  placeholder="Số tài khoản nhận hoàn"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-violet-400"
                />
                <input
                  type="text"
                  autoComplete="name"
                  value={refundAccountHolder}
                  onChange={(e) => setRefundAccountHolder(e.target.value)}
                  placeholder="Tên chủ tài khoản (in hoa, không dấu)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                />
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-2xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="h-12 min-w-0 flex-1 rounded-2xl bg-red-500 px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-600 disabled:opacity-50 sm:flex-[1.2]"
              >
                {loading ? "Đang xử lý..." : "Xác nhận Hủy"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const ALERT_DOT = {
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
};

function MentorIssueRow({ alert, onOpen }) {
  const dot = ALERT_DOT[alert.tone] || ALERT_DOT.slate;
  return (
    <button
      type="button"
      onClick={() => onOpen(alert.sessionId)}
      className="flex w-full items-center gap-3 rounded-xl border border-violet-200/60 bg-white/90 px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-white"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-900">{alert.headline}</span>
        <span className="block truncate text-[11px] text-slate-500">
          {alert.date} {alert.time} · {alert.mentorName || "Mentor"}
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-violet-800">{alert.cta} →</span>
    </button>
  );
}

/** Một khung gọn: ưu tiên hành động trước, buổi chỉ xem gộp thành 1 dòng mở rộng. */
function MentorIssuesCompactPanel({ alerts, refundAlerts, onOpen }) {
  const { action, info, total } = useMemo(() => groupMentorIssueAlerts(alerts), [alerts]);
  const [infoOpen, setInfoOpen] = useState(false);
  const count = total + refundAlerts.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border-2 border-violet-300/80 bg-gradient-to-br from-violet-50 via-white to-violet-50/50 p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-violet-300 bg-violet-100">
          <MsIcon name="event_busy" size={20} className="text-violet-800" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-wider text-violet-950">
            Cần bạn xử lý ({count})
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-violet-950/70">
            {action.length > 0
              ? `${action.length} việc ưu tiên`
              : refundAlerts.length > 0
                ? "Điền STK để nhận hoàn"
                : "Theo dõi buổi đã hủy"}
            {info.length > 0 ? ` · ${info.length} buổi hủy` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {action.map((a) => (
          <MentorIssueRow key={a.alertId} alert={a} onOpen={onOpen} />
        ))}

        {refundAlerts.map((a) => (
          <MentorIssueRow key={a.alertId} alert={a} onOpen={onOpen} />
        ))}

        {info.length === 1 ? (
          <MentorIssueRow alert={info[0]} onOpen={onOpen} />
        ) : info.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
            >
              <span>
                {info.length} buổi mentor hủy — {infoOpen ? "thu gọn" : "xem danh sách"}
              </span>
              <MsIcon name={infoOpen ? "expand_less" : "expand_more"} size={20} className="text-slate-500" />
            </button>
            {infoOpen ? info.map((a) => <MentorIssueRow key={a.alertId} alert={a} onOpen={onOpen} />) : null}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

function getPaymentBadge(paymentStatus, status) {
  if (paymentStatus === "refund_pending") {
    return {
      text: "Chờ hoàn CK",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  }
  if (paymentStatus === "refunded") {
    return {
      text: "Đã hoàn tiền",
      className: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    };
  }
  if (status === "confirmed" || paymentStatus === "paid") {
    return {
      text: "Đã thanh toán",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }
  return {
    text: "Chờ xử lý",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };
}


export function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const fullName = getDisplayName(user);
  const initials = getInitials(fullName);

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [mentorIssueAlerts, setMentorIssueAlerts] = useState([]);
  const [refundPendingAlerts, setRefundPendingAlerts] = useState([]);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cvHistory, setCvHistory] = useState(() => getCVAnalysisHistory());
  const [interviewHistory, setInterviewHistory] = useState(() => getStoredInterviewHistory());
  const [serverStats, setServerStats] = useState(null);
  const [statsFetched, setStatsFetched] = useState(false);

  const loadData = async () => {
    setInterviewHistory(getStoredInterviewHistory());
    setCvHistory(getCVAnalysisHistory());
    const all = getAllBookings();
    const now = Date.now();
    const skipStatus = new Set(["cancelled", "completed", "no_show", "done"]);
    const upcomingFromLocal = all.filter((b) => {
      if (b.status === "rescheduled" || b.status === "cancelled" || b.status === "done") return false;
      if (skipStatus.has(b.status)) return false;
      const [d, m, y] = b.date.split("/").map(Number);
      const [h] = b.time.split(":").map(Number);
      const ts = new Date(y, m - 1, d, h).getTime();
      return ts >= now - 3600_000;
    });

    if (!isLoggedIn()) {
      setServerStats(null);
      setStatsFetched(false);
      setUpcomingSessions(upcomingFromLocal);
      setMentorIssueAlerts([]);
      setRefundPendingAlerts([]);
      return;
    }

    const [statsRes, listRes] = await Promise.all([fetchDashboardStats(), listBookings()]);
    setServerStats(statsRes.success ? statsRes.stats : null);
    setStatsFetched(true);

    const mergeKey = (b) => String(b?.backendId || b?.paymentRef || b?.orderNum || "");
    const map = new Map();
    let mentorAlerts = [];
    let refundAlerts = [];
    if (listRes.success && Array.isArray(listRes.bookings)) {
      mentorAlerts = buildMentorIssueAlerts(listRes.bookings);
      const mentorIds = new Set(mentorAlerts.map((a) => a.sessionId));
      refundAlerts = buildRefundPendingAlerts(listRes.bookings, mentorIds);
      const apiRows = listRes.bookings
        .map(apiBookingToLocal)
        .filter((b) => b && !skipStatus.has(b.status));
      for (const b of apiRows) {
        const k = mergeKey(b);
        if (k) map.set(k, b);
      }
    }
    for (const b of upcomingFromLocal) {
      const k = mergeKey(b);
      if (k && !map.has(k)) map.set(k, b);
    }
    const merged = Array.from(map.values()).sort((a, b) => {
      const ta = parseDateMs(a.date, a.time);
      const tb = parseDateMs(b.date, b.time);
      const aFuture = ta >= now;
      const bFuture = tb >= now;
      if (aFuture && bFuture) return ta - tb;
      if (!aFuture && !bFuture) return tb - ta;
      return aFuture ? -1 : 1;
    });
    const upcoming = merged.filter((b) => {
      // Chỉ hiển thị những lịch đã thanh toán thành công (confirmed) theo yêu cầu của bạn
      return b.status === "confirmed";
    });
    setUpcomingSessions(upcoming);
    setMentorIssueAlerts(mentorAlerts);
    setRefundPendingAlerts(refundAlerts);
  };

  useEffect(() => {
    void loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const handleCancelConfirm = async (id, reason, refundDest = {}) => {
    const res = await cancelBooking(id, { reason, ...refundDest });
    if (res.success) {
      const pol = res.cancellationPolicy;
      const refundAmt = Number(pol?.refundAmountVnd ?? 0);
      const retained = Number(pol?.retainedAmountVnd ?? 0);
      const pct = typeof pol?.refundPercent === "number" ? pol.refundPercent : null;
      if (pol?.ledger === "cancelled_pending_transfer") {
        toast.success("Đã hủy lịch. Giao dịch chờ chuyển khoản đã hủy — chưa thu tiền.");
      } else if (refundAmt > 0) {
        const tail = retained > 0 ? ` Giữ lại: ${Math.round(retained).toLocaleString("vi-VN")}₫.` : "";
        toast.success(
          `Đã hủy lịch. Yêu cầu hoàn ${Math.round(refundAmt).toLocaleString("vi-VN")}₫${pct != null ? ` (${pct}%)` : ""} đã ghi nhận.${tail} Admin sẽ CK hoàn — bạn được báo khi hoàn xong.`,
        );
      } else {
        toast.success(
          pct === 0
            ? "Đã hủy lịch. Theo chính sách, không hoàn tiền."
            : "Đã hủy lịch.",
        );
      }
      setCancellingBooking(null);
      loadData(); // Tải lại dữ liệu sau khi hủy
    } else {
      toast.error(res.error || "Không thể hủy lịch.");
    }
  };

  const useServerStats = statsFetched && serverStats != null;
  const totalInterviews = useServerStats ? serverStats.interviewSessionsCompleted : interviewHistory.length;
  const avgStar = useServerStats
    ? (Number(serverStats.interviewAverageScore) || 0).toFixed(1)
    : interviewHistory.length > 0
      ? (interviewHistory.reduce((a, i) => a + i.overall, 0) / interviewHistory.length).toFixed(1)
      : "0.0";
  const totalCVAnalyses = useServerStats ? serverStats.cvAnalysesCount : cvHistory.length;
  const bestMatch = useServerStats
    ? Math.round(Number(serverStats.cvBestMatchScore) || 0)
    : cvHistory.length > 0
      ? Math.max(...cvHistory.map((i) => i.matchScore))
      : 0;

  const skillStrengths = [...SKILLS_DATA].sort((a, b) => b.value - a.value).slice(0, 2);
  const skillWeaknesses = [...SKILLS_DATA].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <MentorPageShell bottomPad="pb-20">
      <style>{`
        .material-symbols-outlined {
          font-family: "Material Symbols Outlined";
          font-weight: normal;
          font-style: normal;
          font-size: 1.5rem;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          font-variation-settings: "FILL" 0, "wght" 600, "GRAD" 0, "opsz" 24;
          -webkit-font-smoothing: antialiased;
        }
        .material-symbols-outlined.ms-filled {
          font-variation-settings: "FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-2 sm:px-8 sm:pt-3">
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5"
          >
            <div className="relative shrink-0">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#6E35E8] bg-[#f8f5ff] text-lg font-black text-[#6E35E8] shadow-[0_8px_18px_rgba(110,53,232,0.18)] sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl">
                <span className="relative z-10 tracking-tight">{initials}</span>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="mb-1.5 font-headline text-2xl font-black tracking-tight text-slate-900 sm:text-3xl break-words">
                <span className="text-slate-900">Chào, </span>
                <span className="text-[#6E35E8]">{fullName}</span>
                <span className="text-slate-900">!</span>
              </h1>
              <p className="max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
                Sẵn sàng chinh phục mục tiêu phỏng vấn hôm nay?
              </p>
            </div>
          </motion.div>

          <div className="w-full max-w-[330px] shrink-0 rounded-[22px] border border-lime-200 bg-white p-4 shadow-[0_10px_20px_rgba(15,23,42,0.08)] sm:p-5 md:w-[min(100%,330px)]">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Learning streak</p>
                <p className="mt-1.5 text-[2rem] font-black text-slate-900">12 Days</p>
              </div>
              <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300/90 bg-amber-100 shadow-sm">
                <MsIcon name="local_fire_department" filled size={24} className="text-amber-800" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Giữ nhịp luyện tập liên tục</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-lime-300 to-violet-400" />
            </div>
            <p className="text-xs text-slate-500 mt-2">Còn 3 ngày để đạt mốc mới.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {mentorIssueAlerts.length > 0 || refundPendingAlerts.length > 0 ? (
              <MentorIssuesCompactPanel
                alerts={mentorIssueAlerts}
                refundAlerts={refundPendingAlerts}
                onOpen={(id) => navigate(`/session/${id}`)}
              />
            ) : null}
            <div
              className={`glass-card p-8 sm:p-10 bg-gradient-to-br from-white to-slate-50 border-slate-200 flex flex-col overflow-hidden ${
                upcomingSessions.length === 0
                  ? "min-h-0 h-auto"
                  : "h-[300px] lg:h-[320px]"
              }`}
            >
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.14em] flex items-center gap-3">
                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-violet-300/90 bg-violet-100 shadow-sm">
                        <MsIcon name="calendar_month" size={20} className="text-violet-700" />
                     </div>
                     Lịch trình hành trình
                  </h3>
                  {upcomingSessions.length > 0 && (
                    <span className="text-[10px] font-black text-secondary uppercase bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                       {upcomingSessions.length} Buổi hẹn sắp tới
                    </span>
                  )}
               </div>

               <div
                 className={`space-y-4 relative overflow-y-auto pr-1 ${
                   upcomingSessions.length === 0 ? "" : "flex-1 min-h-0"
                 }`}
               >
                 {upcomingSessions.length === 0 ? (
                    <div className="py-8 sm:py-9 text-center border-2 border-dashed border-slate-200 rounded-[28px] bg-slate-50/70">
                       <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300/90 bg-slate-100 shadow-sm">
                          <MsIcon name="event_busy" size={32} className="text-slate-700" />
                       </div>
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] leading-loose">
                          Sẵn sàng vận hành<br/>
                          <span className="text-zinc-700 italic font-medium">Chưa có lịch hẹn nào được ghi nhận</span>
                       </p>
                    </div>
                 ) : upcomingSessions.slice(0, 2).map((s, i) => (
                    <div key={i} className="group relative p-4 rounded-[24px] bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-500">
                       <div className="flex gap-3 items-center">
                          <div className="relative shrink-0">
                             <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-secondary/40 transition-colors bg-white flex items-center justify-center">
                                {s.mentorAvatar ? (
                                   <img src={s.mentorAvatar} alt={s.mentorName} className="w-full h-full object-cover" />
                                ) : (
                                   <span className="text-xl font-black text-slate-400">{s.mentorName[0]}</span>
                                )}
                             </div>
                             {s.status === "confirmed" && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0E0922] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                             )}
                          </div>

                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black text-secondary tracking-wider uppercase">{s.date} • {s.time}</p>
                                {(() => {
                                  const badge = getPaymentBadge(s.paymentStatus, s.status);
                                  return (
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase border ${badge.className}`}>
                                      {badge.text}
                                    </span>
                                  );
                                })()}
                             </div>
                             <p className="text-[10px] font-bold text-violet-600 mb-1.5">
                               {getTimeUntilSessionLabel(s.date, s.time)}
                             </p>
                             <h4 className="text-base font-black text-slate-900 truncate pr-4">{s.mentorName}</h4>
                             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1 truncate opacity-60">
                                {s.sessionType === "mock_interview" ? "Phỏng vấn giả định" : "Tư vấn lộ trình"}
                             </p>
                          </div>
                       </div>
                       
                       {s.status === "confirmed" && (
                         <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                            <button className="flex-1 h-10 rounded-xl bg-secondary text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(232,121,249,0.2)]">
                               Vào phòng phỏng vấn
                            </button>
                            <button 
                              onClick={() => setCancellingBooking(s)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-200 bg-red-50 transition-all hover:border-red-400 hover:bg-red-100"
                              title="Hủy lịch hẹn (không hoàn tiền)"
                            >
                               <MsIcon name="cancel" size={22} className="text-red-700" />
                            </button>
                         </div>
                       )}
                    </div>
                 ))}
               </div>
               
               {upcomingSessions.length > 2 && (
                 <button className="w-full mt-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] hover:text-slate-800 transition-colors">
                    Xem tất cả lịch hẹn ({upcomingSessions.length})
                 </button>
               )}
            </div>

            <div className="space-y-2 mt-1">
              <p className="text-[11px] font-black text-slate-700 px-1 leading-tight">Số liệu từ lịch sử trên máy bạn.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                <LushMetric
                  label="Phiên phỏng vấn AI"
                  value={totalInterviews}
                  icon="mic"
                  accent="violet"
                  color="#a78bfa"
                  caption="Số buổi PV thử với AI đã hoàn thành và được lưu."
                />
                <LushMetric
                  label="Điểm trung bình"
                  value={avgStar}
                  icon="track_changes"
                  accent="lime"
                  color="#84cc16"
                  caption="TB điểm AI chấm (≈0–5) qua các phiên đã lưu."
                />
                <LushMetric
                  label="Lượt phân tích CV"
                  value={totalCVAnalyses}
                  icon="description"
                  accent="cyan"
                  color="#06b6d4"
                  caption="Số lần chạy phân tích CV so với JD."
                />
                <LushMetric
                  label="Khớp JD (cao nhất)"
                  value={totalCVAnalyses === 0 ? "—" : `${bestMatch}%`}
                  icon="psychology"
                  accent="sunset"
                  color="#f97316"
                  caption="% khớp JD cao nhất trong các lần phân tích; chưa có lượt → “—”."
                />
              </div>
            </div>

            {/* INSIGHTS (Removed AI Advice as requested) */}
            <div className="glass-card p-8 sm:p-10 border-slate-200 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-secondary tracking-widest uppercase flex items-center gap-2">
                        <div className="w-1 h-3 bg-secondary"></div> Thế mạnh hiện tại
                     </h4>
                     <ul className="space-y-3">
                        {skillStrengths.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-3 text-sm font-bold text-slate-800 group hover:text-secondary transition-colors cursor-default"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                            <span className="min-w-0 flex-1">
                              {SKILL_DISPLAY[s.skill] || s.skill}{" "}
                              <span className="text-zinc-500 font-semibold">({s.value}%)</span>
                            </span>
                          </li>
                        ))}
                     </ul>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-primary-fixed tracking-widest uppercase flex items-center gap-2">
                        <div className="w-1 h-3 bg-primary-fixed"></div> Điểm cần cải thiện
                     </h4>
                     <ul className="space-y-3">
                        {skillWeaknesses.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-3 text-sm font-bold text-slate-800 group hover:text-primary-fixed transition-colors cursor-default"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed shrink-0" />
                            <span className="min-w-0 flex-1">
                              {SKILL_DISPLAY[s.skill] || s.skill}{" "}
                              <span className="text-zinc-500 font-semibold">({s.value}%)</span>
                            </span>
                          </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 space-y-10">
            <div className="space-y-4">
               <button
                  type="button"
                  onClick={() => navigate("/interview")}
                  className="w-full min-h-[300px] lg:min-h-[320px] text-left rounded-[30px] text-white p-7 sm:p-8 shadow-[0_18px_45px_rgba(124,58,237,0.3)] transition-transform hover:-translate-y-0.5 active:scale-[0.99] flex flex-col"
                  style={{ background: "#6f35ff" }}
               >
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
                  >
                    Live session available
                  </div>
                  <h3 className="mt-4 text-3xl font-black tracking-tight">Phỏng vấn với AI</h3>
                  <p className="mt-2 text-white/95 text-base max-w-md">
                    Luyện với coach AI theo ngữ cảnh thực tế. Nhận feedback ngay và điểm kỹ thuật cho từng câu trả lời.
                  </p>
                  <span
                    className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full font-black text-sm"
                    style={{ background: "#bfff3f", color: "#0f172a" }}
                  >
                    Bắt đầu phiên
                    <MsIcon
                      name="arrow_forward"
                      size={22}
                      className="text-[#0f172a]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}
                    />
                  </span>
               </button>
               
               <div className="grid grid-cols-2 gap-4">
                  <LushActionTile
                    title="Phân tích CV"
                    desc="So khớp CV với JD và gợi ý chỉnh sửa."
                    onClick={() => navigate("/cv-analysis")}
                    icon="description"
                    accent="#22d3ee"
                    iconWellClass="rounded-full border-2 border-cyan-300/90 bg-cyan-50 shadow-sm"
                    iconGlyphClass="text-cyan-900"
                  />
                  <LushActionTile
                    title="Tìm Mentor"
                    desc="Đặt lịch 1-1 với mentor trong nghề."
                    onClick={() => navigate("/mentors")}
                    icon="person_search"
                    accent="#c4ff47"
                    iconWellClass="rounded-full border-2 border-violet-300/90 bg-violet-100 shadow-sm"
                    iconGlyphClass="text-violet-700"
                  />
               </div>
            </div>
          </aside>
        </div>
    </div>

      <AnimatePresence>
        {cancellingBooking && (
          <CancellationModal 
            booking={cancellingBooking}
            onClose={() => setCancellingBooking(null)}
            onConfirm={handleCancelConfirm}
          />
        )}
      </AnimatePresence>
    </MentorPageShell>
  );
}

/** Pastel circle + saturated glyph (same hue), như mock UI. */
const metricIconPastel = {
  violet: {
    well: "rounded-full border-2 border-violet-300/90 bg-violet-100 shadow-sm",
    glyph: "text-violet-700",
  },
  lime: {
    well: "rounded-full border-2 border-lime-400/80 bg-lime-100 shadow-sm",
    glyph: "text-emerald-800",
  },
  cyan: {
    well: "rounded-full border-2 border-cyan-300/90 bg-cyan-50 shadow-sm",
    glyph: "text-cyan-900",
  },
  sunset: {
    well: "rounded-full border-2 border-orange-300/90 bg-orange-100 shadow-sm",
    glyph: "text-orange-800",
  },
};

function LushMetric({ label, value, icon, accent, color, caption }) {
  const pair = metricIconPastel[accent] || metricIconPastel.violet;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      title={caption}
      className="glass-card p-5 sm:p-6 group flex flex-col items-stretch text-left h-[252px]"
    >
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left w-full">
        <div className="glow-halo mb-4 mx-auto sm:mx-0">
          <div
            className={`flex h-14 w-14 items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-400 ${pair.well}`}
          >
            <MsIcon name={icon} size={28} className={pair.glyph} />
          </div>
        </div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.08em] mb-1 w-full leading-snug">{label}</p>
        <h4
          className="text-2xl sm:text-3xl font-black tracking-tighter transition-all group-hover:scale-[1.02] w-full text-slate-900"
          style={{
            backgroundImage: `linear-gradient(135deg, #0f172a 0%, ${color} 140%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {value}
        </h4>
      </div>
      {caption ? (
        <p className="mt-4 pt-3 border-t border-slate-200 text-xs leading-snug text-slate-600 font-medium">
          {caption}
        </p>
      ) : null}
    </motion.div>
  );
}

function LushActionTile({ title, desc, onClick, icon, accent, accent2, isLarge, iconWellClass, iconGlyphClass }) {
  const borderGlow = accent2 || accent;
  const well =
    iconWellClass ||
    "rounded-full border-2 border-slate-300/90 bg-slate-100 shadow-sm";
  const glyph = iconGlyphClass || "text-slate-800";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`glass-card text-left group relative border-slate-300 active:scale-[0.98] h-full ${isLarge ? "p-8 sm:p-10" : "p-5 sm:p-6 h-[252px]"}`}
      style={{
        borderColor: `${accent}55`,
        boxShadow: isLarge ? `0 0 0 1px ${borderGlow}22, 0 12px 24px rgba(15,23,42,0.08)` : undefined,
      }}
    >
      <div
        className={`flex items-center justify-center group-hover:scale-110 group-hover:-rotate-2 transition-all duration-500 ${isLarge ? "mb-8 h-16 w-16" : "mb-5 h-12 w-12"} ${well}`}
      >
        <MsIcon name={icon} size={isLarge ? 28 : 24} className={glyph} />
      </div>
      <div className="relative z-10">
        <h4
          className={`font-black flex items-center gap-2 sm:gap-3 leading-tight transition-colors ${isLarge ? "text-xl sm:text-2xl mb-3" : "text-sm mb-2"}`}
        >
          <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-violet-700 transition-all">
            {title}
          </span>
        </h4>
        <p
          className={`text-slate-600 font-semibold leading-relaxed group-hover:text-slate-700 transition-colors ${isLarge ? "text-sm" : "text-[11px] sm:text-xs"}`}
        >
          {desc}
        </p>
        {isLarge && (
          <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-indigo-600 group-hover:translate-x-1 transition-transform">
            Bắt đầu phiên -&gt;
          </p>
        )}
      </div>
    </motion.button>
  );
}