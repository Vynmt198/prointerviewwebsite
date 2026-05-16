import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { getUser, isLoggedIn, getDisplayName, getInitials } from "../../utils/auth";
import { toast } from "sonner";
import { getAllBookings, parseDateMs } from "../../utils/bookings";
import { listBookings, cancelBooking } from "../../utils/bookingsApi";
import { fetchDashboardStats } from "../../utils/dashboardApi";
import { apiBookingToLocal } from "../../utils/bookingMappers";
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
  if (hoursUntil <= 2) return { feePercent: 100, refundPercent: 0 };
  if (hoursUntil <= 24) return { feePercent: 50, refundPercent: 50 };
  return { feePercent: 0, refundPercent: 100 };
}

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

  const reasons = [
    "Trùng lịch đột xuất",
    "Muốn đổi Mentor khác",
    "Không còn nhu cầu",
    "Khác"
  ];

  const handleConfirm = async () => {
    const finalReason = reason === "Khác" ? customReason : reason;
    if (!finalReason) {
      toast.error("Vui lòng chọn hoặc nhập lý do hủy.");
      return;
    }
    setLoading(true);
    await onConfirm(booking.backendId, finalReason);
    setLoading(false);
  };

  if (!booking) return null;
  const policy = getCancellationPolicy(booking.date, booking.time);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/45 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[28px] bg-white border border-slate-200 p-6 sm:p-7 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
      >
        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Hủy lịch hẹn</h3>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
          Buổi hẹn với <span className="text-violet-700 font-bold">{booking.mentorName}</span> vào {booking.date} lúc {booking.time} sẽ bị hủy.
        </p>
        <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-red-600">Cảnh báo</p>
          <p className="mt-1 text-sm font-semibold text-red-700">
            {policy.feePercent === 100
              ? "Hủy trong vòng 2 giờ trước lịch hẹn: mất 100% phí đã thanh toán (không hoàn tiền)."
              : policy.feePercent === 50
                ? "Hủy trong vòng 24 giờ trước lịch hẹn: mất 50% phí đã thanh toán."
                : "Hủy trước 24 giờ: được hoàn lại 100% phí đã thanh toán."}
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Lý do của bạn</p>
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border ${
                reason === r 
                  ? "bg-violet-50 border-violet-300 text-violet-700" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-300 transition-all resize-none mt-2"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-2 px-8 h-12 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận Hủy"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function getPaymentBadge(paymentStatus, status) {
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

function LearningStreakCard({ days, loading }) {
  const streakLabel = loading ? "—" : `${days} ngày`;

  return (
    <div className="dashboard-glass-soft flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl p-4 sm:max-w-[240px] sm:p-5 lg:shrink-0">
      <div className="min-w-0">
        <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500/60">
          Hành trình học
        </p>
        <h3 className="text-lg font-black text-slate-900 sm:text-xl">{streakLabel}</h3>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#bff365]">
        <MsIcon name="local_fire_department" filled size={18} className="text-[#131f00]" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const fullName = getDisplayName(user);
  const initials = getInitials(fullName);

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [streakStats, setStreakStats] = useState(null);
  const [streakLoading, setStreakLoading] = useState(false);

  const loadData = async () => {
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
      setStreakStats(null);
      setStreakLoading(false);
      setUpcomingSessions(upcomingFromLocal);
      return;
    }

    setStreakLoading(true);
    const [listRes, statsRes] = await Promise.all([listBookings(), fetchDashboardStats()]);
    setStreakLoading(false);
    setStreakStats(statsRes.success ? statsRes.stats : null);

    const mergeKey = (b) => String(b?.backendId || b?.paymentRef || b?.orderNum || "");
    const map = new Map();
    if (listRes.success && Array.isArray(listRes.bookings)) {
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
  };

  useEffect(() => {
    void loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, []);

  const handleCancelConfirm = async (id, reason) => {
    const res = await cancelBooking(id, { reason });
    if (res.success) {
      const fee = Number(res.cancellationPolicy?.feePercent ?? 0);
      if (fee >= 100) {
        toast.success("Đã hủy lịch. Phí giữ lại: 100%.");
      } else if (fee >= 50) {
        toast.success("Đã hủy lịch. Phí giữ lại: 50%.");
      } else {
        toast.success("Đã hủy lịch. Hoàn phí 100%.");
      }
      setCancellingBooking(null);
      loadData(); // Tải lại dữ liệu sau khi hủy
    } else {
      toast.error(res.error || "Không thể hủy lịch.");
    }
  };

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
        .dashboard-glass-soft {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(204, 195, 216, 0.35);
        }
      `}</style>

      <motion.div className="relative z-10 mx-auto max-w-6xl space-y-5 px-4 py-4 sm:px-6 sm:py-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="dashboard-glass-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#6E35E8]/20 shadow-md shadow-[#6E35E8]/5 sm:h-16 sm:w-16">
              <span className="text-lg font-black tracking-tight text-[#6E35E8] sm:text-xl">{initials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                Chào, <span className="text-[#6E35E8]">{fullName}!</span>
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600/90">
                Sẵn sàng chinh phục mục tiêu phỏng vấn hôm nay?
              </p>
            </div>
          </div>
          <LearningStreakCard
            days={streakStats?.learningStreakDays ?? 0}
            loading={streakLoading}
          />
        </motion.div>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate("/interview")}
          className="group relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl bg-[#6E35E8] p-5 text-left shadow-xl shadow-[#6E35E8]/25 transition-transform hover:scale-[1.005] sm:p-6 md:flex-row md:gap-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex-1">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bfff3f] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#bfff3f]" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Live AI Coach</span>
            </div>
            <h2 className="mb-2 text-xl font-black leading-snug text-white sm:text-2xl">
              Luyện tập phỏng vấn thông minh với AI
            </h2>
            <p className="mb-4 max-w-xl text-sm leading-relaxed text-white/80">
              Giả lập phỏng vấn 1-1, nhận đánh giá chi tiết và cải thiện kỹ năng cùng trợ lý ảo.
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#bfff3f] px-5 py-2 text-sm font-black text-[#131f00] shadow-md transition-all group-hover:scale-105">
              Luyện tập ngay
              <MsIcon name="play_circle" size={20} className="text-[#131f00]" />
            </span>
          </div>
          <div className="relative z-10 hidden shrink-0 items-center justify-center lg:flex">
            <div className="flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-white/10">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <MsIcon name="mic" size={48} className="text-white" />
              </div>
            </div>
          </div>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <FeatureCard
            title="Phân tích CV/JD"
            desc="Tối ưu hồ sơ cho mọi vị trí tuyển dụng."
            icon="description"
            iconWellClass="bg-violet-100 text-[#6E35E8]"
            hoverBorder="hover:border-[#6E35E8]/50"
            onClick={() => navigate("/cv-analysis")}
          />
          <FeatureCard
            title="Khóa học"
            desc="Lộ trình học kỹ năng chuyên môn."
            icon="school"
            iconWellClass="bg-[#bff365] text-[#131f00]"
            hoverBorder="hover:border-[#3b5700]/50"
            onClick={() => navigate("/courses")}
          />
          <FeatureCard
            title="Tìm Mentor"
            desc="Kết nối với chuyên gia đầu ngành."
            icon="group"
            iconWellClass="bg-violet-100 text-[#5b598c]"
            hoverBorder="hover:border-[#5b598c]/50"
            onClick={() => navigate("/mentors")}
          />
        </motion.div>

        <motion.div className="grid grid-cols-12 gap-4 items-start lg:gap-5">
          <div className="col-span-12">
            <div
              className={`glass-card p-5 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200 flex flex-col overflow-hidden ${
                upcomingSessions.length === 0
                  ? "min-h-0 h-auto"
                  : "h-[220px] lg:h-[240px]"
              }`}
            >
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.14em] flex items-center gap-3">
                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-violet-300/90 bg-violet-100 shadow-sm">
                        <MsIcon name="calendar_month" size={18} className="text-violet-700" />
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
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          Chưa có lịch hẹn nào
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
          </div>

        </motion.div>
      </motion.div>

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

function FeatureCard({ title, desc, icon, iconWellClass, hoverBorder, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${hoverBorder}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconWellClass}`}>
        <MsIcon name={icon} size={20} />
      </div>
      <div>
        <h3 className="mb-0.5 text-sm font-black text-slate-900 sm:text-base">{title}</h3>
        <p className="text-xs text-slate-500 leading-snug">{desc}</p>
      </div>
    </button>
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
