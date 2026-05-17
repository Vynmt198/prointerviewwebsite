import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Star,
  Clock,
  CheckCircle,
  ArrowLeft,
  Calendar as CalendarBlank,
  MessageCircle as ChatCircle,
  Briefcase,
  Medal,
  Video as VideoCamera,
  Users,
  ArrowRight,
  ShieldCheck,
  Zap as Lightning,
  AlertTriangle as Warning,
  ChevronRight,
  Play,
  Trophy,
  History,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchMentor } from "../../utils/mentorApi";
import { fetchCourseReviews } from "../../utils/courseApi";
import { ReportMentorModal } from "../../components/modals/ReportMentorModal";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";

export function MentorProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const rebookFrom =
    searchParams.get("rebookFrom") ||
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("prointerview_rebook_from") : "") ||
    "";
  const bookingHref = rebookFrom
    ? `/booking/${id}?rebookFrom=${encodeURIComponent(rebookFrom)}`
    : `/booking/${id}`;
  const [mentor, setMentor] = React.useState(null);
  const [loadingMentor, setLoadingMentor] = React.useState(true);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [realReviews, setRealReviews] = React.useState([]);

  React.useEffect(() => {
    if (!id) {
      setMentor(null);
      setLoadingMentor(false);
      return;
    }
    setLoadingMentor(true);
    setMentor(null);
    fetchMentor(id)
      .then((m) => {
        if (m) setMentor(m);
      })
      .finally(() => setLoadingMentor(false));
  }, [id]);

  React.useEffect(() => {
    if (mentor) {
      fetchCourseReviews(mentor.id).then((res) => {
        if (res.success) setRealReviews(res.reviews);
      });
    }
  }, [mentor?.id]);

  if (loadingMentor && !mentor) return (
    <MentorPageShell bottomPad="pb-32">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-300 border-t-violet-700" aria-hidden />
        <span className="sr-only">Đang tải…</span>
      </div>
    </MentorPageShell>
  );

  if (!mentor) {
    return (
      <MentorPageShell bottomPad="pb-32">
        <div className="px-6 py-20 text-center text-sm font-medium text-slate-600">
          Không tìm thấy mentor.
        </div>
      </MentorPageShell>
    );
  }
  return (
    <MentorPageShell bottomPad="pb-32">
      <div className="relative z-10 mx-auto max-w-7xl px-10 pb-10 pt-8 sm:pt-10">
        {/* Navigation */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-slate-900 active:scale-[0.97]"
          aria-label="Quay lại trang trước"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
        </button>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* ── Left Column: Bio & Experience ── */}
          <div className="lg:col-span-8 space-y-10">
            {/* Main Identity Card */}
            <div className="glass-card p-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-[0.06] rotate-12 transition-all duration-1000 group-hover:rotate-0">
                  <Medal size={160} className="text-[#6E35E8]" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row gap-10">
                  <div className="relative shrink-0">
                     <img src={mentor.avatar} className="w-40 h-40 rounded-[48px] object-cover ring-8 ring-slate-200/80 shadow-2xl" />
                     {mentor.available && (
                        <div className="absolute -bottom-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> SẴN SÀNG
                        </div>
                     )}
                  </div>
                  <div className="flex-1">
                     <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700">{mentor.company}</span>
                     </div>
                     <h1 className="font-headline mb-4 text-5xl font-black leading-none tracking-tighter text-slate-900 sm:text-6xl">{mentor.name}</h1>
                     <p className="mb-8 text-xl font-medium text-slate-600">{mentor.title}</p>
                     <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 md:grid-cols-3">
                        <div>
                           <div className="mb-1 flex items-center gap-2 text-amber-600">
                              <Star size={16} className="fill-current" />
                              <span className="text-lg font-black">{mentor.rating}</span>
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{mentor.reviews} Đánh giá</p>
                        </div>
                        <div>
                           <p className="mb-1 text-lg font-black text-slate-900">{mentor.sessionsDone}+</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buổi Mentor</p>
                        </div>
                        <div>
                           <p className="mb-1 text-lg font-black text-slate-900">{mentor.responseTime}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phản hồi</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Specialties & Bio */}
            <div className="glass-card p-12">
               <h3 className="mb-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                  <Lightning size={14} className="text-[#6E35E8]" /> Giới chuyên môn & Kỹ năng
               </h3>
               <div className="mb-12 flex flex-wrap gap-3">
                  {mentor.tags.map(tag => (
                    <span key={tag} className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-700 transition-colors hover:border-[#6E35E8]/35">{tag}</span>
                  ))}
               </div>
               <div className="space-y-6">
                  <h4 className="text-2xl font-black tracking-tight text-slate-900">Về Mentor</h4>
                  <p className="border-l-4 border-[#6E35E8] py-2 pl-8 text-lg font-medium italic leading-relaxed text-slate-600">
                     "{mentor.bio}"
                  </p>
               </div>
            </div>

            {/* Work Experience */}
            <div className="glass-card p-12">
               <h3 className="mb-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Kinh nghiệm phát triển</h3>
               <div className="space-y-8">
                  {mentor.companies.map((company, i) => (
                    <div key={i} className="group flex items-center gap-6">
                       <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors group-hover:border-[#6E35E8]/30 group-hover:text-[#6E35E8]">
                          <Briefcase size={24} />
                       </div>
                       <div>
                          <p className="mb-2 text-xl font-black leading-none text-slate-900">{company}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{i === 0 ? "💼 CURRENT POSITION" : "💼 PAST EXPERIENCE"}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Reviews Section */}
            <div className="glass-card p-12">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Đánh giá <span className="text-[#6E35E8] tracking-tighter">Học viên</span></h3>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3">
                     <Star className="fill-current text-amber-500" size={20} />
                     <span className="text-2xl font-black text-slate-900">{mentor.rating}</span>
                  </div>
               </div>
               <div className="space-y-6">
                  {realReviews.length === 0 && (
                    <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-slate-50/80 p-12 text-center">
                       <p className="text-xs font-black uppercase tracking-widest text-slate-500">Chưa có đánh giá nào cho mentor này.</p>
                    </div>
                  )}
                  {realReviews.map((review, i) => (
                    <div key={i} className="group rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 transition-all hover:border-slate-300 hover:bg-white">
                       <div className="mb-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6E35E8] to-[#c4ff47] text-[10px] font-black text-slate-900">
                                {review.userId?.name?.charAt(0) || "U"}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{review.userId?.name || "Học viên"}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Đã tham gia đào tạo</p>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             {[...Array(5)].map((_, j) => (
                               <Star 
                                 key={j} 
                                 size={14} 
                                 className={`${j < review.rating ? "fill-current text-amber-500" : "text-slate-300"}`} 
                               />
                             ))}
                          </div>
                       </div>
                       <p className="text-base font-medium italic text-slate-600">"{review.comment}"</p>
                       <p className="mt-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                          📅 {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* ── Right Column: Booking Widget ── */}
          <div className="lg:col-span-4">
             <div className="glass-card sticky top-10 overflow-hidden border-[#6E35E8]/20 p-10 shadow-[0_20px_80px_rgba(110,53,232,0.08)]">
                <div className="absolute top-0 right-0 translate-x-10 -translate-y-10 -rotate-12 p-8 opacity-[0.07]">
                   <Target size={180} className="text-[#6E35E8]" />
                </div>
                <div className="relative z-10">
                   <div className="mb-10 border-b border-slate-200 pb-10 text-center">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Chi phí Mentor</p>
                      <h2 className="mb-1 text-5xl font-black tracking-tighter text-slate-900">{mentor.price.toLocaleString("vi")}₫</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4d6600]">/ 60 PHÚT ĐÀO TẠO 1-1</p>
                   </div>
                   
                   <div className="mb-12 space-y-6">
                      {[
                        { icon: VideoCamera, text: "Hỗ trợ Zoom / Google Meet" },
                        { icon: CalendarBlank, text: "Tự chọn lịch trình linh hoạt" },
                        { icon: ShieldCheck, text: "Cam kết Roadmap đầu ra" },
                        { icon: Lightning, text: "Feedback gửi sau 24h" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-5">
                           <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-violet-50 text-[#6E35E8]">
                              <item.icon size={18} />
                           </div>
                           <p className="text-xs font-black uppercase tracking-widest text-slate-700">{item.text}</p>
                        </div>
                      ))}
                   </div>

                   <button 
                      onClick={() => navigate(bookingHref)}
                      className="mb-4 flex w-full items-center justify-center gap-3 rounded-3xl bg-[#c4ff47] py-5 text-xs font-black uppercase tracking-widest text-slate-900 shadow-lg transition-all hover:brightness-95 active:scale-[0.99]">
                      Đặt lịch ngay <ArrowRight size={18} />
                   </button>
                   <button 
                      onClick={() => navigate(bookingHref)}
                      className="w-full rounded-3xl border border-slate-200 bg-white py-5 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                      Xem toàn bộ lịch trống
                   </button>

                   <div className="mt-10 space-y-4 border-t border-slate-200 pt-10">
                      <div className="flex items-center gap-3 text-emerald-700">
                         <ShieldCheck size={14} />
                         <p className="text-[9px] font-black uppercase tracking-widest">Hoàn tiền 100% nếu không hài lòng</p>
                      </div>
                      <button 
                        onClick={() => setShowReportModal(true)}
                        className="flex w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-red-600">
                        <Warning size={14} /> Báo cáo Mentor
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReportModal && (
          <ReportMentorModal
            mentorId={mentor.id}
            mentorName={mentor.name}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </MentorPageShell>
  );
}