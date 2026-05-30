import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Video,
  Users,
  X,
  PlusCircle,
  Trash2,
  Save,
  Clock3,
  Globe
} from "lucide-react";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { listMentorBookings } from "../../utils/bookingsApi";
import { fetchMentorAvailability, updateMyMentorAvailability } from "../../utils/mentorApi";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";

const DEFAULT_AVATAR = "https://i.pravatar.cc/120?img=22";

function toMeetingItem(booking) {
  return {
    id: booking.id || booking._id || "",
    status: booking.status || "",
    date: booking.date || "",
    scheduledTime: booking.timeSlot || "--:--",
    position: booking.sessionType || "Mentoring session",
    mentee: {
      name: booking.customerName || "Học viên",
      avatar: booking.customerAvatar || DEFAULT_AVATAR,
    },
  };
}

function bookingOnDate(bookingDate, selectedDate) {
  const normalized = String(bookingDate || "").trim();
  if (!normalized) return false;
  const parts = normalized.split("/");
  if (parts.length < 2) return false;
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  const y = parts.length >= 3 ? Number(parts[2]) : null;
  if (!Number.isFinite(d) || !Number.isFinite(m)) return false;
  if (y && y !== selectedDate.getFullYear()) return false;
  return d === selectedDate.getDate() && m === selectedDate.getMonth() + 1;
}

function parseBookingDate(bookingDate) {
  const normalized = String(bookingDate || "").trim();
  if (!normalized) return null;
  const parts = normalized.split("/");
  if (parts.length < 2) return null;
  const d = Number(parts[0]);
  const m = Number(parts[1]);
  const y = parts.length >= 3 ? Number(parts[2]) : new Date().getFullYear();
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

const MENTOR_SCHEDULE_EXTRA_CSS = `
        .calendar-cell {
           aspect-ratio: 1;
           min-height: 0;
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           border-radius: 12px;
           transition: all 0.2s;
           cursor: pointer;
           position: relative;
        }
        .calendar-cell:hover { background: rgba(15, 23, 42, 0.04); }
        .calendar-cell.active {
           background: #93f72b;
           color: black;
           box-shadow: 0 6px 18px rgba(180, 245, 0, 0.28);
           font-weight: 900;
        }
        .calendar-cell.dot::after {
           content: '';
           position: absolute;
           bottom: 4px;
           width: 4px;
           height: 4px;
           border-radius: 50%;
           background: #8037f4;
        }
`;

/* ── Manage Availability Modal ────────────────────────────────────────── */
const DAY_ROWS = [
  { key: 0, label: "Thứ 2" },
  { key: 1, label: "Thứ 3" },
  { key: 2, label: "Thứ 4" },
  { key: 3, label: "Thứ 5" },
  { key: 4, label: "Thứ 6" },
  { key: 5, label: "Thứ 7" },
  { key: 6, label: "Chủ nhật" },
];

const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 7; // 07:00 -> 22:00
  return `${String(hour).padStart(2, "0")}:00`;
});

function toOneHourRange(start) {
  const [h, m] = String(start || "09:00").split(":").map(Number);
  const safeH = Number.isFinite(h) ? h : 9;
  const safeM = Number.isFinite(m) ? m : 0;
  const end = `${String(Math.min(safeH + 1, 23)).padStart(2, "0")}:${String(safeM).padStart(2, "0")}`;
  return `${String(safeH).padStart(2, "0")}:${String(safeM).padStart(2, "0")} - ${end}`;
}

function toRowSlots(slots = []) {
  return slots
    .filter(Boolean)
    .map((s) => {
      const [h, m] = String(s).split(":").map(Number);
      const endHour = Math.min((Number.isFinite(h) ? h : 0) + 1, 23);
      const end = `${String(endHour).padStart(2, "0")}:${String(Number.isFinite(m) ? m : 0).padStart(2, "0")}`;
      return `${s} - ${end}`;
    });
}

function toStartSlots(rangeSlots = []) {
  return rangeSlots
    .map((s) => String(s).split("-")[0]?.trim())
    .filter((v) => /^\d{2}:\d{2}$/.test(v));
}

function AvailabilityModal({ onClose, availability, onSaved }) {
  const [workingHours, setWorkingHours] = useState(() => {
    const hasData = availability && Array.isArray(availability.recurringSchedule);
    const recurring = hasData ? availability.recurringSchedule : [];
    
    const rows = recurring
      .filter((r) => Number.isFinite(Number(r?.dayOfWeek)))
      .map((r) => ({
        dayOfWeek: Number(r.dayOfWeek),
        day: DAY_ROWS.find((d) => d.key === Number(r.dayOfWeek))?.label || `Thứ ${Number(r.dayOfWeek) + 2}`,
        slots: toRowSlots(Array.isArray(r.slots) ? r.slots : []),
      }));

    if (rows.length > 0) return rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return [];
  });
  const [saving, setSaving] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState(0);
  const [newSlotRange, setNewSlotRange] = useState(toOneHourRange("09:00"));

  const addSlot = (dayOfWeek, value) => {
    const [h, m] = value.split(":").map(Number);
    const end = `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const range = `${value} - ${end}`;
    setWorkingHours((prev) =>
      (prev.some((row) => row.dayOfWeek === dayOfWeek)
        ? prev.map((row) => {
            if (row.dayOfWeek !== dayOfWeek) return row;
            if (row.slots.includes(range)) return row;
            const nextSlots = [...row.slots, range].sort((a, b) => a.localeCompare(b));
            return { ...row, slots: nextSlots };
          })
        : [
            ...prev,
            {
              dayOfWeek,
              day: DAY_ROWS.find((d) => d.key === dayOfWeek)?.label || "Thứ 2",
              slots: [range],
            },
          ])
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    );
  };

  const removeSlot = (dayOfWeek, slot) => {
    setWorkingHours((prev) =>
      prev
        .map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, slots: row.slots.filter((s) => s !== slot) } : row))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const recurringSchedule = workingHours
      .map((row) => ({ dayOfWeek: row.dayOfWeek, slots: toStartSlots(row.slots) }))
      .filter((row) => row.slots.length > 0)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    try {
      const result = await updateMyMentorAvailability({ recurringSchedule });
      if (!result.success) {
        toastApiError(result.error, "Không lưu được lịch rảnh.");
        return;
      }
      toastApiSuccess("Đã lưu lịch rảnh.");
      onSaved?.(result.availability);
      onClose();
    } catch {
      toastApiError("Lỗi kết nối khi lưu lịch rảnh.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/35"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="glass-card w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Cài đặt Thời gian rảnh</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 text-violet-700">Quản lý lịch làm việc định kỳ hàng tuần</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-zinc-500 hover:text-slate-900 transition-all">
              <X size={18} />
           </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
           <div className="p-6 rounded-3xl bg-primary-fixed/5 border border-primary-fixed/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 flex items-center justify-center text-violet-700">
                 <Globe size={20} />
              </div>
              <div>
                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Múi giờ hệ thống</p>
                 <p className="text-xs font-medium text-zinc-500">(GMT+07:00) Asia/Ho_Chi_Minh</p>
              </div>
           </div>

           <div className="space-y-4">
              {workingHours.map((row, idx) => (
                <div key={idx} className="p-6 rounded-[32px] bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                   <div className="w-24 shrink-0">
                      <p className="text-sm font-black text-slate-900 group-hover:text-violet-700 transition-colors">{row.day}</p>
                   </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                       {row.slots.map((s, i) => (
                         <div key={i} className="group/item relative px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3 transition-all hover:border-red-200 hover:bg-red-50/30">
                            <span className="group-hover/item:text-slate-900 transition-colors">{s}</span>
                            <button 
                               onClick={() => removeSlot(row.dayOfWeek, s)}
                               className="p-1 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-600 transition-all flex items-center justify-center"
                               title="Xóa khung giờ này"
                            >
                               <X size={14} />
                            </button>
                         </div>
                       ))}
                       {row.slots.length === 0 && (
                          <p className="text-[10px] italic text-zinc-400 font-medium py-2">Chưa có khung giờ nào cho ngày này.</p>
                       )}
                    </div>
                </div>
              ))}

               <div className="mt-8 p-6 rounded-[32px] bg-slate-50/50 border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Thêm khung giờ mới</p>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                     <div className="flex-1 w-full grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest ml-3">Ngày trong tuần</p>
                           <select
                              value={newSlotDay}
                              onChange={(e) => setNewSlotDay(Number(e.target.value))}
                              className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 transition-all"
                           >
                              {DAY_ROWS.map((d) => (
                                 <option key={d.key} value={d.key}>{d.label}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest ml-3">Bắt đầu từ</p>
                           <select
                              value={newSlotRange}
                              onChange={(e) => setNewSlotRange(e.target.value)}
                              className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 transition-all"
                           >
                              {SLOT_OPTIONS.map((start) => {
                                 const range = toOneHourRange(start);
                                 return (
                                    <option key={range} value={range}>{range}</option>
                                 )
                              })}
                           </select>
                        </div>
                     </div>
                     <div className="md:pt-5 w-full md:w-auto">
                        <button
                           onClick={() => addSlot(newSlotDay, String(newSlotRange).split("-")[0].trim())}
                           className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
                        >
                           <Plus size={14} /> Thêm vào lịch
                        </button>
                     </div>
                  </div>
               </div>
           </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
           <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4">Lưu ý: Thay đổi sẽ áp dụng từ tuần kế tiếp</p>
           <div className="flex gap-4">
              <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-slate-900 transition-all">Hủy</button>
              <button disabled={saving} onClick={handleSave} className="px-8 py-3 rounded-2xl bg-primary-fixed text-black text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Schedule Component ────────────────────────────────────────── */
export function MentorSchedule() {
  const navigate = useNavigate();
  const user = getUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAvailability, setShowAvailability] = useState(false);
  const [mentorMeetings, setMentorMeetings] = useState([]);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "mentor") {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await listMentorBookings();
      if (!active) return;
      if (!result.success) {
        toastApiError(result.error, "Không tải được lịch hẹn mentor.");
        return;
      }
      const rows = Array.isArray(result.bookings) ? result.bookings : [];
      setMentorMeetings(rows.map(toMeetingItem));
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const mentorLookupId = user?.id || user?._id;
      if (!mentorLookupId) return;
      try {
        const data = await fetchMentorAvailability(mentorLookupId);
        if (!active) return;
        if (data) setAvailability(data);
      } catch {
        if (active) toastApiError("Lỗi kết nối khi tải lịch trống.");
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?._id]);

  useEffect(() => {
    if (!mentorMeetings.length) return;
    const activeStatuses = new Set(["pending", "confirmed", "in_progress"]);
    const activeRows = mentorMeetings.filter((m) => activeStatuses.has(String(m.status || "").toLowerCase()));
    const rows = activeRows.length ? activeRows : mentorMeetings;

    const sortedDates = rows
      .map((m) => parseBookingDate(m.date || m.scheduledDate))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());
    if (!sortedDates.length) return;

    const now = new Date();
    const next = sortedDates.find((d) => d.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) || sortedDates[0];
    setSelectedDate((prev) => {
      if (prev.toDateString() === next.toDateString()) return prev;
      return next;
    });
    setCurrentDate((prev) => {
      if (prev.getMonth() === next.getMonth() && prev.getFullYear() === next.getFullYear()) return prev;
      return new Date(next.getFullYear(), next.getMonth(), 1);
    });
  }, [mentorMeetings]);

  if (!user || user.role !== "mentor") return null;

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = (getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) + 6) % 7; // ISO week start

  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), -firstDayOfMonth + i + 1);
    return { date: d, currentMonth: false };
  });

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    return { date: d, currentMonth: true };
  });

  const calendarDays = [...prevMonthDays, ...currentMonthDays];
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const paddingDays = Array.from({ length: totalCells - calendarDays.length }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1);
    return { date: d, currentMonth: false };
  });

  const finalDays = [...calendarDays, ...paddingDays];
  const activeStatuses = new Set(["pending", "confirmed", "in_progress"]);
  const sourceMeetings = mentorMeetings;
  const selectedDayMeetings = sourceMeetings.filter((m) => bookingOnDate(m.date, selectedDate) || bookingOnDate(m.scheduledDate, selectedDate));

  return (
    <MentorPageShell
      bottomPad="pb-4"
      fillHeight
      className="!min-h-0 !overflow-hidden !pb-4"
      extraStyles={MENTOR_SCHEDULE_EXTRA_CSS}
    >
      <div className="relative z-10 mx-auto flex h-[calc(100svh-6rem)] max-h-[calc(100svh-6rem)] min-h-0 max-w-7xl flex-col px-6 lg:px-8">
        {/* Header — compact */}
        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
               Lịch trình <span className="text-violet-700 tracking-tighter">Hệ thống</span>
            </h1>
            <p className="text-xs font-medium text-zinc-500 sm:text-sm">Bố trí thời gian rảnh và quản lý các buổi hẹn mentor</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAvailability(true)}
            className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#93f72b] to-[#7fe015] px-5 py-2.5 text-xs font-bold text-[#0a0814] shadow-[0_6px_18px_rgba(196,255,71,0.2)] transition-all hover:brightness-110 sm:px-6 sm:py-3"
          >
            <Clock size={15} /> Cài đặt làm việc
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
           {/* Calendar */}
           <div className="glass-card flex min-h-0 flex-col p-4 sm:p-5 lg:col-span-7">
              <div className="mb-3 flex shrink-0 items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-violet-700">
                       <CalendarIcon size={18} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black tracking-tighter text-slate-900 italic sm:text-xl">
                          {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                       </h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lịch trình khả dụng</p>
                    </div>
                 </div>
                 <div className="flex gap-1.5">
                    <button onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-zinc-500 transition-all hover:text-slate-900"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-zinc-500 transition-all hover:text-slate-900"><ChevronRight size={16} /></button>
                 </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-1 sm:gap-1.5">
                 {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
                   <div key={d} className="py-1 text-center text-[9px] font-black uppercase tracking-widest text-zinc-600 sm:text-[10px]">{d}</div>
                 ))}
                 {finalDays.map((cell, i) => {
                   const isSelected = selectedDate.toDateString() === cell.date.toDateString();
                   const isToday = new Date().toDateString() === cell.date.toDateString();
                   const hasMeetings = sourceMeetings.some((m) => bookingOnDate(m.date, cell.date) || bookingOnDate(m.scheduledDate, cell.date));
                   return (
                     <div 
                        key={i} 
                        onClick={() => setSelectedDate(cell.date)}
                        className={`calendar-cell ${isSelected ? 'active' : ''} ${cell.currentMonth ? 'text-slate-900' : 'text-zinc-700 opacity-30'} ${hasMeetings ? 'dot' : ''}`}
                     >
                        <span className="text-[11px] font-semibold sm:text-xs">{cell.date.getDate()}</span>
                        {isToday && !isSelected && <div className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-primary-fixed" />}
                     </div>
                   );
                 })}
              </div>
              <div className="mt-3 flex shrink-0 items-center gap-5 border-t border-slate-200 pt-3">
                 <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary-fixed" /> Hôm nay
                 </div>
                 <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#8037f4]" /> Có lịch hẹn
                 </div>
              </div>
           </div>

           {/* Daily schedule */}
           <div className="flex min-h-0 flex-col lg:col-span-5">
              <div className="glass-card flex h-full min-h-0 flex-col p-4 sm:p-5">
                 <div className="mb-3 flex shrink-0 items-center justify-between">
                    <h4 className="text-base font-black uppercase tracking-tighter text-slate-900 sm:text-lg">
                      Ngày {selectedDate.getDate()} thg {selectedDate.getMonth() + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAvailability(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-violet-700 transition-all hover:bg-slate-100"
                    >
                      <Plus size={16} />
                    </button>
                 </div>

                 <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5 custom-scrollbar">
                    {selectedDayMeetings.map((meeting, i) => (
                      <div
                         key={meeting.id || i}
                         onClick={() => meeting.id && navigate(`/mentor/meeting-detail/${meeting.id}`)}
                         className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100"
                      >
                         <div className="absolute left-0 top-0 h-full w-1 scale-y-0 bg-primary-fixed transition-transform origin-top group-hover:scale-y-100" />
                         <div className="mb-2.5 flex items-center gap-3">
                            <img src={meeting.mentee.avatar} alt="" className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/5" />
                            <div className="min-w-0">
                               <p className="truncate text-sm font-black text-slate-900">{meeting.mentee.name}</p>
                               <p className="truncate text-[10px] font-black uppercase tracking-widest text-zinc-600">{meeting.position}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-violet-700">
                               <Clock3 size={13} /> {meeting.scheduledTime}
                            </div>
                            <span
                              className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                String(meeting.status || "").toLowerCase() === "confirmed"
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                                  : String(meeting.status || "").toLowerCase() === "pending"
                                    ? "border-violet-300 bg-violet-100 text-violet-900"
                                    : String(meeting.status || "").toLowerCase() === "completed"
                                      ? "border-sky-300 bg-sky-100 text-sky-900"
                                      : String(meeting.status || "").toLowerCase() === "cancelled"
                                        ? "border-red-300 bg-red-100 text-red-900"
                                        : "border-slate-200 bg-slate-100 text-slate-700"
                              }`}
                            >
                              {meeting.status || "online"}
                            </span>
                         </div>
                      </div>
                    ))}
                    {selectedDayMeetings.length === 0 && (
                      <div className="flex min-h-[72px] flex-col items-center justify-center rounded-2xl border border-slate-200 p-4 text-zinc-500">
                        <p className="text-[10px] font-black uppercase tracking-widest">Không có lịch hẹn trong ngày này</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAvailability(true)}
                      className="flex min-h-[72px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-zinc-700 transition-all hover:border-violet-200 hover:text-violet-700"
                    >
                       <PlusCircle size={24} className="mb-1 opacity-25" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Thêm slot trống mới</p>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showAvailability && (
          <AvailabilityModal
            availability={availability}
            onSaved={setAvailability}
            onClose={() => setShowAvailability(false)}
          />
        )}
      </AnimatePresence>
    </MentorPageShell>
  );
}