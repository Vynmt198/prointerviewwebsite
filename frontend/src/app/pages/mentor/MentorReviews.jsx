import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Star, Calendar, Quote, Search, MessageCircle, TrendingUp } from "lucide-react";
import { getUser } from "../../utils/auth";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { fetchMentorReviews } from "../../utils/mentorApi";
import { replyToReview } from "../../utils/reviewsApi";
import { toastApiError, tryApi } from "../../utils/apiToast";
import { avatarSrc, DEFAULT_AVATAR } from "../../utils/mediaUrl";
import {
  mentorPageTitle,
  mentorPageSubtitle,
  mentorStatValue,
  mentorAccentText,
  mentorSearchInput,
} from "../../components/mentor/mentorTypography";

const STAR_FILTERS = [
  { value: "all", stars: 0 },
  { value: "5", stars: 5 },
  { value: "4", stars: 4 },
  { value: "3", stars: 3 },
];

function filterAriaLabel(value, stars) {
  if (value === "all") return "Tất cả đánh giá";
  return `Lọc đánh giá ${stars} sao`;
}


function formatReviewDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

export function MentorReviews() {
  const navigate = useNavigate();
  const userAuth = getUser();
  const isMentor = userAuth?.role === "mentor";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewedMeetings, setReviewedMeetings] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const loadReviews = useCallback(() => {
    setLoading(true);
    fetchMentorReviews()
      .then((res) => {
        if (!res.success || !Array.isArray(res.items)) {
          setReviewedMeetings([]);
          setSummary({ avgRating: 0, reviewCount: 0 });
          if (!res.success) toastApiError(res.error, "Không tải được đánh giá.");
          return;
        }
        const mapped = res.items.map((r) => ({
          id: r.id,
          mentee: {
            name: r.mentee?.name || "Học viên",
            avatar: avatarSrc(r.mentee?.avatar) || DEFAULT_AVATAR,
          },
          position: r.position || "Học viên",
          company: r.company || "",
          menteeReview: {
            rating: Number(r.rating || 0),
            comment: r.comment || "",
            wouldRecommend: Boolean(r.wouldRecommend),
            reviewDate: r.reviewDate,
            reply: r.reply || null,
          },
        }));
        setReviewedMeetings(mapped);
        const s = res.summary || {};
        setSummary({
          avgRating: Number(s.avgRating ?? 0),
          reviewCount: Number(s.reviewCount ?? mapped.length),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isMentor) {
      navigate("/");
      return;
    }
    loadReviews();
  }, [navigate, isMentor, loadReviews]);

  const submitReply = async (reviewId) => {
    const content = replyText.trim();
    if (!content || content.length < 3) {
      toastApiError("Phản hồi cần ít nhất 3 ký tự.");
      return;
    }
    setReplyBusy(true);
    const res = await tryApi(() => replyToReview(reviewId, content), {
      fallback: "Không gửi được phản hồi.",
      successMessage: "Đã gửi phản hồi.",
    });
    setReplyBusy(false);
    if (!res.success) return;
    setReplyId("");
    setReplyText("");
    loadReviews();
  };

  if (!isMentor) return null;

  const filtered = reviewedMeetings.filter((m) => {
    if (filter === "all") return true;
    return m.menteeReview.rating === parseInt(filter, 10);
  });

  const searched = filtered.filter(
    (m) =>
      m.mentee.name.toLowerCase().includes(search.toLowerCase()) ||
      m.menteeReview.comment.toLowerCase().includes(search.toLowerCase()),
  );

  const avgRating =
    summary.reviewCount > 0
      ? summary.avgRating
      : reviewedMeetings.length > 0
        ? reviewedMeetings.reduce((sum, m) => sum + m.menteeReview.rating, 0) /
          reviewedMeetings.length
        : 0;

  const highRatingCount = reviewedMeetings.filter((m) => m.menteeReview.rating >= 4).length;
  const satisfactionPct =
    reviewedMeetings.length > 0
      ? Math.round((highRatingCount / reviewedMeetings.length) * 100)
      : 0;

  return (
    <MentorPageShell bottomPad="pb-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">

        {/* ── Header ── */}
        <div className="mb-7">
          <p className="mentor-eyebrow mb-1 flex items-center gap-2">
            <Star size={12} /> Phản hồi học viên
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Đánh giá <span className="text-violet-600">từ học viên</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Phản hồi sau buổi mentor — tìm kiếm và trả lời nhận xét.</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Điểm trung bình — dark */}
          <div className="flex items-center gap-4 rounded-2xl bg-slate-900 p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFD600]/15">
              <Star size={20} className="text-[#FFD600]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-normal uppercase tracking-widest text-slate-400">Điểm trung bình</p>
              <p className="mentor-stat-num mentor-stat-num--hero mentor-stat-num--on-dark">
                {avgRating.toFixed(1)} <span className="text-base font-bold text-slate-500">/ 5</span>
              </p>
              <div className="mt-1.5 flex gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={13} className={i <= Math.round(avgRating) ? "fill-[#FFD600] text-[#FFD600]" : "text-slate-700"} />
                ))}
              </div>
            </div>
          </div>

          {/* Tổng nhận xét — white */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <MessageCircle size={20} className="text-violet-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-normal uppercase tracking-widest text-slate-400">Tổng nhận xét</p>
              <p className="mentor-stat-num mentor-stat-num--hero">{summary.reviewCount || reviewedMeetings.length}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-normal text-violet-600">
                <TrendingUp size={11} /> Hiển thị trên hồ sơ mentor
              </p>
            </div>
          </div>

          {/* Tỷ lệ hài lòng — lime */}
          <div className="flex items-center gap-4 rounded-2xl bg-[#c4ff47] p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/10">
              <TrendingUp size={20} className="text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-normal uppercase tracking-widest text-slate-600">Tỷ lệ hài lòng</p>
              <p className="mentor-stat-num mentor-stat-num--hero">{satisfactionPct}%</p>
              <p className="mt-1 text-[11px] font-normal text-slate-600">Đánh giá từ 4 sao trở lên</p>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              placeholder="Tìm theo tên hoặc nội dung…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              aria-label="Tìm theo tên hoặc nội dung nhận xét"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo số sao">
            {STAR_FILTERS.map(({ value, stars }) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-label={filterAriaLabel(value, stars)}
                  aria-pressed={active}
                  className={`inline-flex items-center justify-center rounded-lg border px-3.5 py-1.5 text-xs font-normal transition-all ${
                    active
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
                  }`}
                >
                  {stars === 0 ? "Tất cả" : (
                    <span className="flex items-center gap-px" aria-hidden>
                      {Array.from({ length: stars }, (_, i) => (
                        <Star key={i} size={13} className="fill-[#FFD600] text-[#FFD600]" />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Review list ── */}
        <div className="space-y-4 pb-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              Đang tải nhận xét…
            </div>
          ) : searched.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <MessageCircle size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-normal text-slate-500">Chưa có nhận xét phù hợp</p>
              <p className="mt-1 text-xs text-slate-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            searched.map((meeting) => (
              <article key={meeting.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
                {/* Review header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={meeting.mentee.avatar}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{meeting.mentee.name}</p>
                      <p className="text-xs text-slate-400">
                        {meeting.position}{meeting.company ? ` · ${meeting.company}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-lg bg-[#c4ff47] px-3 py-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} size={11} className={i <= meeting.menteeReview.rating ? "fill-[#1a1a1a] text-[#1a1a1a]" : "text-slate-400"} />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-900">{meeting.menteeReview.rating}.0</span>
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={11} />
                      {formatReviewDate(meeting.menteeReview.reviewDate)}
                    </p>
                  </div>
                </div>

                {/* Comment body */}
                <div className="px-5 py-4">
                  <div className="relative rounded-xl bg-slate-50 px-4 py-3">
                    <Quote size={40} className="pointer-events-none absolute -left-1 -top-1.5 text-violet-500/10" aria-hidden />
                    <p className="relative text-sm font-medium italic leading-relaxed text-slate-700">
                      &ldquo;{meeting.menteeReview.comment}&rdquo;
                    </p>
                  </div>

                  {/* Reply section */}
                  {meeting.menteeReview.reply?.content ? (
                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                      <p className="text-[11px] font-normal uppercase tracking-wider text-violet-500">Phản hồi của bạn</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-800">{meeting.menteeReview.reply.content}</p>
                    </div>
                  ) : replyId === meeting.id ? (
                    <div className="mt-3 space-y-2.5">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        placeholder="Viết phản hồi cho học viên…"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={replyBusy}
                          onClick={() => void submitReply(meeting.id)}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                        >
                          {replyBusy ? "Đang gửi…" : "Gửi phản hồi"}
                        </button>
                        <button
                          type="button"
                          disabled={replyBusy}
                          onClick={() => { setReplyId(""); setReplyText(""); }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-normal text-slate-600 transition hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setReplyId(meeting.id); setReplyText(""); }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
                      >
                        <MessageCircle size={13} /> Phản hồi nhận xét
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </MentorPageShell>
  );
}
