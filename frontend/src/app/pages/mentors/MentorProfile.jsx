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
import { fetchMentor, fetchMentorPublicReviews } from "../../utils/mentorApi";
import { ReportMentorModal } from "../../components/modals/ReportMentorModal";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { toastApiError } from "../../utils/apiToast";

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
        else toastApiError("Không tìm thấy mentor hoặc không tải được hồ sơ.");
      })
      .catch(() => toastApiError("Lỗi kết nối khi tải hồ sơ mentor."))
      .finally(() => setLoadingMentor(false));
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    fetchMentorPublicReviews(id).then((res) => {
      if (res.success) setRealReviews(res.reviews);
    });
  }, [id]);

  if (loadingMentor && !mentor) return (
    <MentorPageShell bottomPad="pb-32">
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-300 border-t-violet-700" aria-hidden />
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
  const ratingDisplay = Number(mentor.rating || 0).toFixed(1);
  const reviewCount = mentor.reviews ?? 0;
  const sessionCount = mentor.sessionsDone ?? 0;
  const bioText = (mentor.bio || "").trim();
  const avatarUrl = mentor.avatar?.trim();
  const initials = (mentor.name || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <MentorPageShell bottomPad="pb-24">
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        {/* Navigation */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-slate-900 active:scale-[0.97]"
          aria-label="Quay lại trang trước"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
        </button>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* ── Left Column: Bio & Experience ── */}
          <div className="space-y-5 lg:col-span-8">
            {/* Main Identity Card */}
            <div className="glass-card relative p-5 sm:p-6 overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-[0.06] rotate-12 transition-all duration-1000 group-hover:rotate-0">
                  <Medal size={72} className="text-[#6E35E8]" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row gap-3 md:gap-6">
                  <div className="relative shrink-0">
                     {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={mentor.name}
                          className="h-24 w-24 rounded-2xl object-cover ring-4 ring-violet-100 shadow-md"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6E35E8] to-violet-400 text-2xl font-black text-white shadow-md ring-4 ring-violet-100">
                          {initials}
                        </div>
                      )}
                     {mentor.available && (
                        <div className="absolute -bottom-2 right-0 rounded-lg bg-[#c4ff47] px-2 py-0.5 text-[9px] font-black text-[#1a1035] shadow-xl flex items-center gap-2">
                           <div className="hidden animate-pulse" /> SẴN SÀNG
                        </div>
                     )}
                  </div>
                  <div className="flex-1">
                     {mentor.company ? (
                       <div className="mb-2 flex flex-wrap items-center gap-2">
                         <span className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                           {mentor.company}
                         </span>
                       </div>
                     ) : null}
                     <h1 className="font-headline mb-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{mentor.name}</h1>
                     <p className="mb-4 text-sm font-medium text-violet-700">{mentor.title}</p>
                     <div className="grid grid-cols-3 gap-4 border-t border-violet-100 pt-4">
                        <div>
                           <div className="mb-1 flex items-center gap-2 text-amber-600">
                              <Star size={14} className="fill-current" />
                              <span className="text-base font-black">{ratingDisplay}</span>
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{reviewCount} đánh giá</p>
                        </div>
                        <div>
                           <p className="mb-1 text-base font-black text-slate-900">{sessionCount > 0 ? `${sessionCount}+` : "0"}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buổi mentor</p>
                        </div>
                        <div>
                           <p className="mb-1 text-sm font-bold text-slate-900">{mentor.responseTime || "< 24 giờ"}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phản hồi</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Specialties & Bio */}
            <div className="glass-card p-5 sm:p-6">
               <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  <Lightning size={14} className="text-[#6E35E8]" /> Giới chuyên môn & Kỹ năng
               </h3>
               {(mentor.tags?.length > 0 || mentor.specialties?.length > 0) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {(mentor.tags?.length ? mentor.tags : mentor.specialties || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
               <div className="space-y-3">
                  <h4 className="text-base font-bold text-slate-900">Về Mentor</h4>
                  {bioText ? (
                    <p className="border-l-2 border-[#6E35E8] py-1 pl-4 text-sm leading-relaxed text-slate-600">
                      {bioText}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-500">Mentor chưa cập nhật phần giới thiệu.</p>
                  )}
               </div>
            </div>

            {/* Work Experience */}
            <div className="glass-card p-5 sm:p-6">
               <h3 className="mb-4 text-[10px] font-black uppercase tracking-wider text-slate-600">Kinh nghiệm phát triển</h3>
               <div className="space-y-4">
                  {(mentor.companies?.length ? mentor.companies : mentor.company ? [mentor.company] : []).map((company, i) => (
                    <div key={i} className="group flex items-center gap-6">
                       <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 transition-colors group-hover:border-[#6E35E8]/30 group-hover:text-[#6E35E8]">
                          <Briefcase size={18} />
                       </div>
                       <div>
                          <p className="mb-2 text-sm font-black leading-none text-slate-900">{company}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{i === 0 ? "💼 CURRENT POSITION" : "💼 PAST EXPERIENCE"}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Reviews Section */}
            <div className="glass-card p-5 sm:p-6">
               <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Đánh giá <span className="text-[#6E35E8] tracking-tighter">Học viên</span></h3>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                     <Star className="fill-current text-amber-500" size={16} />
                     <span className="text-base font-black text-slate-900">{ratingDisplay}</span>
                  </div>
               </div>
               <div className="space-y-3">
                  {realReviews.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-violet-100 bg-violet-50/50 p-8 text-center">
                       <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Chưa có đánh giá nào cho mentor này.</p>
                    </div>
                  )}
                  {realReviews.map((review, i) => (
                    <div key={i} className="group rounded-xl border border-violet-100 bg-white p-4 transition-all hover:border-slate-300 hover:bg-white">
                       <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6E35E8] to-[#c4ff47] text-[10px] font-black text-slate-900">
                                {(review.userName || "H").charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900">{review.userName || "Học viên"}</p>
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
                       <p className="text-sm text-slate-600">"{review.comment}"</p>
                       <p className="mt-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                          📅 {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                       </p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* ── Right Column: Booking Widget ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-6">
             <div className="glass-card sticky top-10 overflow-hidden border-[#6E35E8]/20 p-5 shadow-[0_12px_40px_rgba(110,53,232,0.08)]">
                <div className="absolute top-0 right-0 translate-x-10 -translate-y-10 -rotate-12 p-8 opacity-[0.07]">
                   <Target size={96} className="text-[#6E35E8]" />
                </div>
                <div className="relative z-10">
                   <div className="mb-5 border-b border-violet-100 pb-5 text-center">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Chi phí Mentor</p>
                      <h2 className="mb-1 text-3xl font-black tracking-tighter text-slate-900">{mentor.price.toLocaleString("vi")}₫</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#4d6600]">/ 60 PHÚT ĐÀO TẠO 1-1</p>
                   </div>
                   
                   <div className="mb-5 space-y-3">
                      {[
                        { icon: VideoCamera, text: "Hỗ trợ Zoom / Google Meet" },
                        { icon: CalendarBlank, text: "Tự chọn lịch trình linh hoạt" },
                        { icon: ShieldCheck, text: "Cam kết Roadmap đầu ra" },
                        { icon: Lightning, text: "Feedback gửi sau 24h" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-violet-50 text-[#6E35E8]">
                              <item.icon size={15} />
                           </div>
                           <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">{item.text}</p>
                        </div>
                      ))}
                   </div>

                   <button 
                      onClick={() => navigate(bookingHref)}
                      className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[#c4ff47] py-3 text-[10px] font-bold uppercase tracking-wide text-slate-900 shadow-lg transition-all hover:brightness-95 active:scale-[0.99]">
                      Đặt lịch ngay <ArrowRight size={18} />
                   </button>
                   <button 
                      onClick={() => navigate(bookingHref)}
                      className="w-full rounded-xl border border-violet-100 bg-white py-3 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                      Xem toàn bộ lịch trống
                   </button>

                   <div className="mt-5 space-y-3 border-t border-violet-100 pt-5">
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