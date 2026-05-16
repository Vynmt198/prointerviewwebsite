import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { 
  Star, 
  Send, 
  Trophy, 
  Target, 
  Lightbulb, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Clock
} from "lucide-react";
import { fetchMentorBookingById, updateMentorNotes } from "../../utils/bookingsApi";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";

export function MentorSessionFeedback() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(null);
  
  // Feedback States
  const [rating, setRating] = useState(5);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [advice, setAdvice] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  useEffect(() => {
    const loadBooking = async () => {
      const res = await fetchMentorBookingById(sessionId);
      if (res.success) {
        setBooking(res.booking);
        // Pre-fill if exists
        if (res.booking.mentorNotes) {
           setGeneralNotes(res.booking.mentorNotes);
        }
      } else {
        alert("Không tìm thấy thông tin buổi học.");
        navigate("/mentor/dashboard");
      }
      setLoading(false);
    };
    loadBooking();
  }, [sessionId, navigate]);

  const handleSubmit = async () => {
    setSaving(true);
    
    // Combine fields into one notes block for backend
    const combinedNotes = `
🎯 Đánh giá chung: ${rating}/5 sao
💪 Điểm mạnh: ${strengths || "N/A"}
🚀 Cần cải thiện: ${weaknesses || "N/A"}
💡 Lời khuyên: ${advice || "N/A"}

📝 Nhận xét chi tiết:
${generalNotes || "Không có ghi chú thêm."}
    `.trim();

    const res = await updateMentorNotes(sessionId, { notes: combinedNotes });
    
    if (res.success) {
      alert("Đã gửi đánh giá thành công! Học viên sẽ nhận được thông báo ngay lập tức.");
      navigate("/mentor/dashboard");
    } else {
      alert(res.error || "Gửi đánh giá thất bại.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Sparkles className="text-violet-600" size={40} />
       </motion.div>
    </div>
  );

  return (
    <MentorPageShell>
      <div className="max-w-4xl mx-auto p-6 pt-12 pb-32">
        {/* Header Navigation */}
        <button 
          onClick={() => navigate("/mentor/dashboard")}
          className="flex items-center gap-2 text-zinc-500 hover:text-slate-900 transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Quay lại Dashboard</span>
        </button>

        <div className="relative mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Đánh giá <span className="text-violet-600">Học viên</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-2">Gửi nhận xét và hướng dẫn để học viên phát triển tốt hơn sau buổi phỏng vấn.</p>
        </div>

        {/* Student Mini Card */}
        {booking && (
          <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm mb-10 flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {booking.customerAvatar ? (
                  <img src={booking.customerAvatar} alt={booking.customerName} className="w-full h-full object-cover" />
                ) : (
                  <User size={30} className="text-violet-400" />
                )}
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{booking.customerName}</h3>
                <div className="flex items-center gap-4 text-zinc-500">
                   <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={14} className="text-violet-500" /> {booking.date} · {booking.time}
                   </p>
                   <span className="w-1 h-1 rounded-full bg-slate-300" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                      {booking.sessionType === "mock_interview" ? "Phỏng vấn giả định" : "Tư vấn lộ trình"}
                   </p>
                </div>
             </div>
             <div className="ml-auto">
                <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                   <ShieldCheck size={14} /> Đã hoàn thành
                </span>
             </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Overall Rating */}
          <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Trophy size={140} className="text-yellow-500" />
             </div>
             <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8">Đánh giá năng lực tổng quát</h5>
             <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className="group/star relative transition-all"
                  >
                    <Star 
                      size={48} 
                      className={`${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"} transition-all group-hover/star:scale-110`} 
                    />
                    {s <= rating && (
                      <motion.div 
                        layoutId="star-glow"
                        className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"
                      />
                    )}
                  </button>
                ))}
                <span className="ml-4 text-3xl font-black text-slate-900 tracking-tighter">{rating}.0 / 5</span>
             </div>
          </section>

          {/* Detailed Feedback Sections */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 text-emerald-600">
                   <Trophy size={20} />
                   <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Điểm mạnh</h5>
                </div>
                <textarea 
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Học viên đã làm tốt điều gì? (vd: Kiến thức nền tảng, Kỹ năng giao tiếp...)"
                  className="w-full h-40 bg-slate-50 rounded-3xl p-6 text-sm font-medium border-none focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:opacity-50"
                />
             </div>

             <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 text-rose-500">
                   <Target size={20} />
                   <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Cần cải thiện</h5>
                </div>
                <textarea 
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="Những lỗ hổng kiến thức hoặc kỹ năng cần khắc phục ngay..."
                  className="w-full h-40 bg-slate-50 rounded-3xl p-6 text-sm font-medium border-none focus:ring-2 focus:ring-rose-200 outline-none transition-all placeholder:opacity-50"
                />
             </div>
          </div>

          <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-6 text-violet-600">
                <Lightbulb size={20} />
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Lời khuyên & Lộ trình</h5>
             </div>
             <textarea 
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Lời khuyên để học viên phát triển tốt hơn trong tương lai..."
                className="w-full h-40 bg-slate-50 rounded-3xl p-6 text-sm font-medium border-none focus:ring-2 focus:ring-violet-200 outline-none transition-all placeholder:opacity-50"
             />
          </section>

          <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm border-dashed">
             <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Ghi chú thêm (Tùy chọn)</h5>
             <textarea 
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Bất kỳ thông tin bổ sung nào khác..."
                className="w-full h-32 bg-transparent text-sm font-medium border-none focus:ring-0 outline-none transition-all"
             />
          </section>

          {/* Action Button */}
          <div className="pt-8">
             <button 
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-6 rounded-[30px] bg-slate-900 text-[#c4ff47] text-[12px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
             >
                {saving ? (
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Sparkles size={20} />
                   </motion.div>
                ) : (
                   <Send size={20} />
                )}
                {saving ? "Đang gửi đánh giá..." : "Hoàn thành & Gửi đánh giá cho học viên"}
             </button>
             <p className="text-center text-[10px] font-medium text-zinc-400 mt-6 uppercase tracking-widest">
                Thông tin này sẽ được gửi đến tài khoản & email của học viên
             </p>
          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
