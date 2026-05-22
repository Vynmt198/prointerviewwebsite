import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Star, 
  Trophy, 
  Calendar, 
  Quote, 
  Search,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Award
} from "lucide-react";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMentorReviews } from "../../utils/mentorApi";
import { toastApiError } from "../../utils/apiToast";

export function MentorReviews() {
  const navigate = useNavigate();
  const userAuth = getUser();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewedMeetings, setReviewedMeetings] = useState([]);

  useEffect(() => {
    if (!userAuth || userAuth.role !== "mentor") {
      navigate("/");
      return;
    }
    fetchMentorReviews().then((res) => {
      if (!res.success || !Array.isArray(res.items)) {
        setReviewedMeetings([]);
        if (!res.success) toastApiError(res.error, "Không tải được đánh giá.");
        return;
      }
      const mapped = res.items.map((r) => ({
        id: r.id,
        mentee: {
          name: r.mentee?.name || "Học viên",
          avatar: r.mentee?.avatar || "https://i.pravatar.cc/120?img=12",
        },
        position: r.position || "Mentee",
        company: r.company || "ProInterview",
        menteeReview: {
          rating: Number(r.rating || 0),
          comment: r.comment || "",
          wouldRecommend: Boolean(r.wouldRecommend),
          reviewDate: r.reviewDate,
          reply: r.reply || null,
        },
      }));
      setReviewedMeetings(mapped);
    });
  }, [navigate, userAuth?.role]);

  if (!userAuth || userAuth.role !== "mentor") return null;

  // Filter by rating
  const filtered = reviewedMeetings.filter((m) => {
    if (filter === "all") return true;
    return m.menteeReview.rating === parseInt(filter);
  });

  // Filter by search
  const searched = filtered.filter((m) =>
    m.mentee.name.toLowerCase().includes(search.toLowerCase()) ||
    m.menteeReview.comment.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviewedMeetings.length > 0
    ? reviewedMeetings.reduce((sum, m) => sum + m.menteeReview.rating, 0) / reviewedMeetings.length
    : 0;

  const recommendCount = reviewedMeetings.filter((m) => m.menteeReview.wouldRecommend).length;

  return (
    <MentorPageShell bottomPad="pb-32">
      <div className="relative z-10 p-8 max-w-7xl mx-auto pt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
               Đánh giá <span className="text-violet-700">từ Mentees</span>
            </h1>
            <p className="text-slate-600 text-lg font-medium">Lắng nghe ý kiến và xây dựng uy tín Mentor của bạn</p>
          </div>
        </div>

        {/* Aggregate Feedback Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-7 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
               <Star size={120} className="text-primary-fixed" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Điểm trung bình</p>
            <div className="flex items-end gap-3 mb-6">
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{avgRating.toFixed(1)}</h3>
              <p className="text-xl font-bold text-zinc-600 mb-2">/5.0</p>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={20} className={i <= Math.round(avgRating) ? "text-[#FFD600] fill-[#FFD600]" : "text-slate-200"} />
              ))}
            </div>
          </div>

          <div className="glass-card p-7 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
               <MessageCircle size={120} className="text-secondary" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Tổng số nhận xét</p>
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">{reviewedMeetings.length}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-700 flex items-center gap-2">
               <TrendingUp size={14} className="text-violet-600" /> +2 tuần qua
            </p>
          </div>

          <div className="glass-card group relative overflow-hidden border-violet-200/80 p-7 sm:p-8">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-10">
               <Award size={120} className="text-violet-400" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Tỷ lệ hài lòng</p>
            <h3 className="mb-4 text-5xl font-black tracking-tighter text-violet-800 sm:text-6xl">
              {reviewedMeetings.length > 0 ? Math.round((recommendCount / reviewedMeetings.length) * 100) : 0}%
            </h3>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Dựa trên recommend của mentee</p>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-col md:flex-row items-center gap-5 mb-9">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-violet-600" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên mentee hoặc nội dung review..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[20px] border border-slate-200 bg-white py-3.5 pl-16 pr-5 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-200/80"
            />
          </div>
          <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-[24px]">
            {["all", "5", "4", "3"].map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === v ? "bg-violet-600 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {v === "all" ? "Tất cả" : `${v}★`}
              </button>
            ))}
          </div>
        </div>

        {/* Feed of Review Cards */}
        <div className="space-y-5">
          {searched.length === 0 ? (
            <div className="glass-card p-14 text-center">
              <MessageCircle size={60} className="mx-auto mb-6 text-zinc-700 opacity-20" />
              <p className="text-lg font-bold text-zinc-500">Chúng tôi không tìm thấy nhận xét phù hợp</p>
            </div>
          ) : (
            searched.map((meeting) => (
              <div
                key={meeting.id}
                className="glass-card p-10 group overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                       <img
                         src={meeting.mentee.avatar}
                         alt={meeting.mentee.name}
                         className="w-20 h-20 rounded-[30px] object-cover ring-4 ring-slate-200 transition-transform group-hover:scale-105"
                       />
                       <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary-fixed text-black flex items-center justify-center shadow-lg">
                          <Trophy size={14} />
                       </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 group-hover:text-primary-fixed transition-colors">
                        {meeting.mentee.name}
                      </h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
                        {meeting.position} · {meeting.company}
                      </p>
                      <div className="flex items-center gap-3">
                         <div className="flex gap-1">
                           {[1, 2, 3, 4, 5].map((i) => (
                             <Star key={i} size={14} className={i <= meeting.menteeReview.rating ? "text-[#FFD600] fill-[#FFD600]" : "text-slate-200"} />
                           ))}
                         </div>
                         <span className="text-xs font-black text-slate-900">{meeting.menteeReview.rating}.0 Score</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 text-right">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> {new Date(meeting.menteeReview.reviewDate).toLocaleDateString("vi-VN")}
                     </p>
                     <div className="flex gap-2">
                        {meeting.menteeReview.wouldRecommend && (
                           <span className="px-4 py-1.5 rounded-lg bg-primary-fixed/10 text-primary-fixed text-[10px] font-black uppercase tracking-widest border border-primary-fixed/20">Recommend</span>
                        )}
                         <span className="px-4 py-1.5 rounded-lg bg-slate-50 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">Public</span>
                     </div>
                  </div>
                </div>

                <div className="mt-8 relative p-7 rounded-[32px] bg-slate-50 border border-slate-200">
                  <Quote size={80} className="absolute -top-4 -left-4 text-primary-fixed opacity-[0.08] -rotate-12" />
                  <p className="text-xl font-medium text-slate-700 leading-relaxed italic z-10 relative">
                    "{meeting.menteeReview.comment}"
                  </p>
                  <div className="absolute bottom-6 right-8">
                     {meeting.menteeReview.reply ? (
                        <p className="text-[10px] font-black text-primary-fixed uppercase tracking-widest">
                          Đã phản hồi
                        </p>
                     ) : (
                        <button className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-primary-fixed transition-colors">
                           Phản hồi nhận xét <ArrowRight size={14} />
                        </button>
                     )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MentorPageShell>
  );
}
