import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Star,
  Quote,
  Search,
  MessageCircle,
  Heart,
  Reply,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { getUser } from "../../utils/auth/auth.js";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { MentorStatPanel, MentorStatFrame } from "../../components/mentor/MentorStatFrames";
import { fetchMentorReviews } from "../../api/mentorApi.js";
import { replyToReview } from "../../api/reviewsApi.js";
import { toastApiError, tryApi } from "../../utils/shared/apiToast.js";
import { avatarSrc, DEFAULT_AVATAR } from "../../utils/shared/mediaUrl.js";

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

function StarRow({ count, max = 5, size = 13, filledClass = "fill-amber-400 text-amber-400" }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < count ? filledClass : "text-slate-300"}
          strokeWidth={i < count ? 0 : 2}
        />
      ))}
    </div>
  );
}

function AutoGrowTextarea({ value, onChange, className = "", placeholder }) {
  const ref = useRef(null);

  const syncHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    syncHeight();
  }, [value, syncHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        requestAnimationFrame(syncHeight);
      }}
      rows={1}
      placeholder={placeholder}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

function ReviewCard({ meeting, replyId, replyText, replyBusy, onReplyOpen, onReplyCancel, onReplyChange, onReplySubmit }) {
  const review = meeting.menteeReview;
  const hasAvatar = meeting.mentee.avatar && meeting.mentee.avatar !== DEFAULT_AVATAR;

  return (
    <article className="border-b border-slate-100 px-4 py-6 last:border-b-0 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {hasAvatar ? (
            <img
              src={meeting.mentee.avatar}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              <ImageIcon size={22} className="text-slate-300" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{meeting.mentee.name}</p>
            <p className="truncate text-xs text-slate-500">
              {meeting.position}
              {meeting.company ? ` · ${meeting.company}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <StarRow count={review.rating} size={14} />
          <p className="text-xs text-slate-400">{formatReviewDate(review.reviewDate)}</p>
        </div>
      </div>

      <blockquote className="font-headline text-lg font-medium italic leading-relaxed text-slate-700 sm:text-xl">
        &ldquo;{review.comment || "Không có nội dung nhận xét."}&rdquo;
      </blockquote>

      {review.reply?.content ? (
        <div className="mt-5 rounded-xl border border-[#8037f4]/15 bg-[#8037f4]/5 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8037f4]">Phản hồi của bạn</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{review.reply.content}</p>
        </div>
      ) : replyId === meeting.id ? (
        <div className="mt-5 space-y-2.5">
          <AutoGrowTextarea
            value={replyText}
            onChange={onReplyChange}
            placeholder="Viết phản hồi cho học viên…"
            className="min-h-[2.75rem] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#8037f4]/40 focus:bg-white focus:ring-2 focus:ring-[#8037f4]/15"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={replyBusy}
              onClick={() => void onReplySubmit(meeting.id)}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-[#8037f4] disabled:opacity-50"
            >
              {replyBusy ? "Đang gửi…" : "Gửi phản hồi"}
            </button>
            <button
              type="button"
              disabled={replyBusy}
              onClick={onReplyCancel}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onReplyOpen(meeting.id)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8037f4]"
          >
            <Reply size={15} />
            Phản hồi nhận xét
          </button>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{review.rating}</span>
            <span>/5 sao</span>
          </div>
        </div>
      )}
    </article>
  );
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
    <MentorPageShell bottomPad="pb-20" showAmbient={false} className="!bg-[#f8f9fc]">
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 pb-12 sm:px-6 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 pt-2 sm:mb-8"
        >
          <h1 className="font-headline text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-slate-900">
            Đánh giá <span className="text-[#8037f4]">từ học viên</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Phản hồi sau buổi mentor — tìm kiếm và trả lời.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <MentorStatPanel>
            <MentorStatFrame
              index={1}
              accent="lime"
              value={`${avgRating.toFixed(1)}/5`}
              title="Điểm trung bình"
              cornerIcon={Star}
              footer={
                <div className="mt-3">
                  <StarRow count={Math.round(avgRating)} size={12} />
                </div>
              }
            />
            <MentorStatFrame
              index={2}
              accent="purple"
              value={String(summary.reviewCount || reviewedMeetings.length)}
              title="Tổng nhận xét"
              cornerIcon={Quote}
              footer={
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#8037f4]">
                  Hiển thị trên hồ sơ
                  <ArrowRight size={12} />
                </p>
              }
            />
            <MentorStatFrame
              index={3}
              accent="purple"
              value={`${satisfactionPct}%`}
              title="Tỷ lệ hài lòng"
              cornerIcon={Heart}
              footer={
                <p className="mt-3 text-xs text-violet-500/80">Đánh giá từ 4 sao trở lên</p>
              }
            />
          </MentorStatPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Lọc theo số sao">
              {STAR_FILTERS.map(({ value, stars }) => {
                const active = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    aria-label={filterAriaLabel(value, stars)}
                    aria-pressed={active}
                    className={`relative shrink-0 whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:text-sm ${
                      active
                        ? "font-bold text-slate-900"
                        : "font-medium text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {stars === 0 ? (
                      "Tất cả"
                    ) : (
                      <span className="flex items-center gap-px" aria-hidden>
                        {Array.from({ length: stars }, (_, i) => (
                          <Star key={i} size={13} className="fill-amber-400 text-amber-400" strokeWidth={0} />
                        ))}
                      </span>
                    )}
                    {active && (
                      <motion.span
                        layoutId="mentorReviewTabUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#8037f4]"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full shrink-0 lg:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Tìm theo tên hoặc nội dung…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#8037f4]/40 focus:bg-white focus:ring-2 focus:ring-[#8037f4]/15"
                aria-label="Tìm theo tên hoặc nội dung nhận xét"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">Đang tải nhận xét…</div>
          ) : searched.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageCircle size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Chưa có nhận xét phù hợp</p>
              <p className="mt-1 text-xs text-slate-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            searched.map((meeting) => (
              <ReviewCard
                key={meeting.id}
                meeting={meeting}
                replyId={replyId}
                replyText={replyText}
                replyBusy={replyBusy}
                onReplyOpen={(id) => {
                  setReplyId(id);
                  setReplyText("");
                }}
                onReplyCancel={() => {
                  setReplyId("");
                  setReplyText("");
                }}
                onReplyChange={setReplyText}
                onReplySubmit={submitReply}
              />
            ))
          )}
        </motion.div>
      </div>
    </MentorPageShell>
  );
}
