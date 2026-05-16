import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Video as VideoIcon,
  Phone,
  Mic,
  MicOff,
  VideoOff,
  LogOut,
  Clock,
  User,
  ShieldCheck,
  Zap,
  Target,
  Sparkles,
  Maximize,
  Settings
} from "lucide-react";
import { motion } from "motion/react";
import { getUser } from "../../utils/auth";
import { getMeetingBySession, joinMeeting, createMeetingSession } from "../../utils/meetings";
import { fetchBookingById, fetchMentorBookingById, completeMentorBooking } from "../../utils/bookingsApi";


export function MeetingRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [meeting, setMeeting] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [jitsiUrl, setJitsiUrl] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u || !sessionId) {
      navigate("/");
      return;
    }

    let active = true;

    async function loadMeeting() {
      // 1. Thử lấy từ local
      let m = getMeetingBySession(sessionId);
      
      // 2. Nếu không có, thử lấy từ backend
      if (!m) {
        const fetchFn = u.role === "mentor" ? fetchMentorBookingById : fetchBookingById;
        const res = await fetchFn(sessionId);
        if (active && res.success && res.booking) {
          const b = res.booking;
          m = createMeetingSession({
            sessionId: b.id || b._id,
            mentorEmail: b.mentorEmail,
            customerEmail: b.customerEmail,
            mentorName: b.mentorName,
            customerName: b.customerName,
            scheduledTime: b.timeSlot,
            scheduledDate: b.date,
          });
        }
      }

      if (!active) return;

      if (m) {
        setMeeting(m);
        // Tự động join nếu là người trong cuộc
        const role = u.role === "mentor" ? "mentor" : "customer";
        const userEmail = String(u.email || "").toLowerCase();
        const mentorEmail = String(m.mentorEmail || "").toLowerCase();
        const customerEmail = String(m.customerEmail || "").toLowerCase();

        // Quyền truy cập: 
        // 1. Khớp email trực tiếp
        // 2. Hoặc nếu đã load được session này từ API (đã qua middleware auth) 
        //    và role khớp với đối tượng trong booking.
        let isAuthorized = (mentorEmail && mentorEmail === userEmail) || 
                           (customerEmail && customerEmail === userEmail);
        
        // Dự phòng cho học viên/mentor nếu email chưa load kịp nhưng role khớp
        if (!isAuthorized) {
          if (role === "mentor" && u.role === "mentor") isAuthorized = true;
          if (role === "customer" && u.role === "customer") isAuthorized = true;
        }
        
        if (isAuthorized) {
          // Ghi nhận việc tham gia (nếu cần cho thống kê) nhưng không chặn việc mở phòng
          joinMeeting(sessionId, m.joinCode, u.email, role);
          
          setJoined(true);
          setJitsiUrl(`https://meet.jit.si/ProInterview-${sessionId}#userInfo.displayName="${encodeURIComponent(u.name)}"`);
        } else {
          setError(
            `Quyền truy cập bị từ chối.\n` +
            `• Email của bạn: ${userEmail}\n` +
            `• Email Mentor: ${mentorEmail}\n` +
            `• Email Học viên: ${customerEmail}`
          );
        }
      } else {
        setError("Phòng họp không tồn tại hoặc bạn không có quyền truy cập.");
      }
    }

    loadMeeting();
    return () => { active = false; };
  }, [sessionId, user?.email, user?.role, navigate]);


  useEffect(() => {
    if (joined) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [joined]);

  const handleEndCall = () => {
    navigate(user?.role === "mentor" ? "/mentor/dashboard" : "/dashboard");
  };
  
  const handleCompleteSession = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc và hoàn thành buổi học này?")) return;
    const res = await completeMentorBooking(sessionId);
    if (res.success) {
      navigate("/mentor/dashboard");
    } else {
      alert(res.error || "Không thể kết thúc buổi học.");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f4ff] flex items-center justify-center text-slate-900 p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <VideoOff size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Lỗi kết nối</h2>
          <p className="text-slate-600 font-medium mb-8">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!joined || !meeting) {
    return (
      <div className="min-h-screen bg-[#f8f4ff] flex items-center justify-center text-slate-900">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
             <Sparkles size={48} className="text-violet-500 mb-6 opacity-40" />
          </motion.div>
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Đang chuẩn bị phòng họp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060E] flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-0 w-full h-[600px] bg-gradient-to-b from-violet-600/20 to-transparent blur-[100px]" />
      </div>

      {/* Header Info */}
      <div className="relative z-20 flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-md border-b border-white/5">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#c4ff47] flex items-center justify-center text-slate-900">
               <VideoIcon size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Session ID</p>
               <p className="text-xs font-bold text-[#c4ff47] uppercase tracking-tighter">#{sessionId.slice(-8)}</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
             {/* Student Info */}
             {meeting && (
               <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-xl border border-white/10">
                 <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 overflow-hidden">
                    {meeting.customerAvatar ? (
                      <img src={meeting.customerAvatar} alt={meeting.customerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-violet-400">{meeting.customerName?.charAt(0)}</span>
                    )}
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Đang học cùng</p>
                    <p className="text-[11px] font-bold text-white leading-none">{meeting.customerName}</p>
                 </div>
               </div>
             )}

             <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Live Meeting</span>
             </div>
             <div className="flex items-center gap-3 text-white">
                <Clock size={14} className="text-violet-400" />
                <span className="text-sm font-black font-mono tracking-tighter">{formatTime(elapsedTime)}</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <Settings size={18} />
             </button>
             
             {user?.role === "mentor" ? (
               <div className="flex items-center gap-3">
                  <button onClick={handleEndCall} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                     Rời phòng
                  </button>
                  <button onClick={handleCompleteSession} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#c4ff47] text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#c4ff47]/20">
                     <ShieldCheck size={16} /> Kết thúc buổi học
                  </button>
               </div>
             ) : (
               <button onClick={handleEndCall} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20">
                  <LogOut size={16} /> Rời phòng
               </button>
             )}
          </div>
      </div>

      {/* Main View Area (Jitsi Iframe) */}
      <div className="relative z-10 p-1 sm:p-2 h-[82vh] min-h-[600px]">
        <div className="w-full h-full rounded-xl overflow-hidden bg-black border border-white/5 shadow-2xl relative">
           <iframe
             allow="camera; microphone; display-capture; autoplay; clipboard-write"
             src={`${jitsiUrl}${jitsiUrl.includes('#') ? '&' : '#'}config.prejoinPageEnabled=false`}
             style={{ width: '100%', height: '100%', border: '0' }}
             title="Jitsi Meeting Room"
           />
           
           {/* Simple Status Label */}
           <div className="absolute top-4 left-4 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#c4ff47] shadow-[0_0_8px_#c4ff47]" />
                 <span className="text-[9px] font-bold text-white uppercase tracking-widest opacity-80">
                    {user?.role === "mentor" ? "Mentor" : "Student"}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* Atmospheric Particles Overlay */}
      <div className="fixed inset-0 pointer-events-none -z-0">
         <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-500/10 blur-sm rounded-full animate-pulse" />
         <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-lime-500/5 blur-sm rounded-full animate-pulse delay-700" />
      </div>
    </div>
  );
}

