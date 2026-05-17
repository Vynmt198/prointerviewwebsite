import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  PlayCircle,
  BookOpen,
  CheckCircle,
  Lock,
  BadgeCheck as SealCheck,
  GraduationCap,
  Zap as Lightning,
  ChevronDown as CaretDown,
  ChevronUp as CaretUp,
  ShoppingCart,
  Heart,
  Share2 as ShareNetwork,
  Calendar as CalendarBlank,
  Trophy,
  Award as Certificate,
  BarChart3 as ChartBar,
  AlertCircle as WarningCircle,
  Sparkles as Sparkle,
  ArrowRight,
  Target,
  Video,
  ListChecks,
  User as UserCircle,
  ThumbsUp,
  MessageCircle,
  Pencil,
  X,
} from "lucide-react";
import { fetchCourseById, submitReview } from "../../utils/courseApi";
import { enrollmentApi } from "../../utils/enrollmentApi";
import { getUser } from "../../utils/auth";
import { toast } from "sonner";
import { requireLoginNavigate } from "../../utils/authGate";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { normalizeCourseStats } from "../../utils/courseStats";
import { enrollmentAccessGranted } from "../../utils/enrollmentAccess.js";
import { mediaSrc, DEFAULT_COURSE_THUMB, avatarSrc } from "../../utils/mediaUrl";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

const formatPrice = (price) => {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};
const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
};
const getLevelLabel = (level) =>
  level === "Beginner" ? "Cơ bản" : level === "Intermediate" ? "Trung cấp" : "Nâng cao";
const getLevelColor = (level) => {
  if (level === "Beginner")
    return { bg: "rgba(224, 242, 254, 0.98)", text: "#0369a1", border: "rgba(14, 165, 233, 0.35)" };
  if (level === "Intermediate")
    return { bg: "rgba(237, 233, 254, 0.98)", text: "#5b21b6", border: "rgba(139, 92, 246, 0.35)" };
  return { bg: "rgba(255, 237, 213, 0.98)", text: "#c2410c", border: "rgba(251, 146, 60, 0.4)" };
};

const getRelatedCourses = (currentId, category, limit) => {
  // Trả về mảng rỗng tạm thời hoặc logic lọc nếu có danh sách
  return [];
};

/* ── Lesson Row ───────────────────────────────────────────── */
function LessonRow({ lesson, index }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 transition-all ${lesson.isPreview ? "bg-violet-50/50" : ""}`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
        style={{
          background: lesson.isPreview ? "rgba(110, 53, 232, 0.2)" : "rgba(110, 53, 232,0.08)",
          color: lesson.isPreview ? "#e9d5ff" : "#6E35E8",
        }}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{formatDuration(lesson.duration)}</p>
      </div>
      {lesson.isPreview ? (
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0"
          style={{ background: "rgba(110, 53, 232, 0.22)", color: "#ede9fe", border: "1px solid rgba(167, 139, 250, 0.35)" }}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Preview
        </span>
      ) : (
        <Lock className="h-4 w-4 shrink-0 text-slate-300" />
      )}
    </div>
  );
}

/* ── Star Rating ──────────────────────────────────────────── */
function StarRating({ rating, size = "sm" }) {
  const s = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const n = rating == null ? NaN : Number(rating);
  const filled = Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          fill={i <= filled ? "#FFD600" : "none"}
          className={s}
          style={{ color: "#FFD600" }}
        />
      ))}
    </div>
  );
}

/* ── Mock Student Reviews ─────────────────────────────────── */
const STUDENT_REVIEWS = [
  {
    id: "sr1",
    name: "Nguyễn Minh Khoa",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80",
    role: "Backend Developer tại Tiki",
    rating: 5,
    comment: "Khóa học cực kỳ thực tế và chi tiết. Sau khi hoàn thành, mình đã pass phỏng vấn vòng behavioral tại Shopee. Cảm ơn mentor rất nhiều Phương pháp STAR được giải thích rõ ràng và có nhiều ví dụ thực tế từ ngành IT.",
    date: "2024-03-15",
    helpful: 24,
    verified: true,
  },
  {
    id: "sr2",
    name: "Trần Thị Lan Anh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    role: "Product Manager",
    rating: 5,
    comment: "Nội dung rất bổ ích, đặc biệt phần về cách đo lường impact trong câu trả lời. Trước đây mình hay trả lời chung chung, giờ đã biết cách nêu số liệu cụ thể. Phỏng vấn tự tin hơn hẳn!",
    date: "2024-03-10",
    helpful: 18,
    verified: true,
  },
  {
    id: "sr3",
    name: "Lê Quốc Hùng",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80",
    role: "Frontend Engineer",
    rating: 4,
    comment: "Khóa học tốt, nội dung có chiều sâu. Mình chỉ muốn có thêm ví dụ về câu hỏi conflict resolution cụ thể hơn trong môi trư���ng tech. Nhìn chung rất đáng tiền đầu tư.",
    date: "2024-03-05",
    helpful: 11,
    verified: true,
  },
  {
    id: "sr4",
    name: "Phạm Thu Hà",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    role: "Data Analyst",
    rating: 5,
    comment: "Mentor giải thích rất tốt, cách trình bày dễ hiểu. Mình đã áp dụng ngay vào phỏng vấn thực và nhận được offer từ VNG. Chứng chỉ sau khi hoàn thành cũng rất chuyên nghiệp.",
    date: "2024-02-28",
    helpful: 32,
    verified: true,
  },
  {
    id: "sr5",
    name: "Hoàng Đức Anh",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    role: "DevOps Engineer",
    rating: 4,
    comment: "Nội dung chất lượng cao, phù hợp cho cả fresher lẫn senior. Mình đặc biệt thích phần về cách chuẩn bị portfolio câu hỏi và các mẫu trả lời. Rất recommend!",
    date: "2024-02-20",
    helpful: 15,
    verified: false,
  },
];

/* ── Reviews Section ──────────────────────────────────────── */
function ReviewsSection({ course, enrolled }) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewRating || reviewComment.trim().length < 30) return;
    setSubmitting(true);
    
    const res = await submitReview({
      targetType: "course",
      targetId: course.id,
      rating: reviewRating,
      comment: reviewComment,
    });

    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
      setShowReviewDialog(false);
      // Reset form
      setReviewRating(0);
      setReviewComment("");
      setHoverRating(0);
    } else {
      alert(res.error || "Gửi đánh giá thất bại.");
    }
  };

  const handleCloseDialog = () => {
    setShowReviewDialog(false);
    setReviewRating(0);
    setReviewComment("");
    setHoverRating(0);
  };

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      <div className="glass-card p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="text-center sm:min-w-[140px]">
            <p
              className="mb-1 font-bold"
              style={{ fontSize: "3rem", lineHeight: 1, color: "#6E35E8" }}
            >
              {course.rating != null ? course.rating.toFixed(1) : "—"}
            </p>
            <StarRating rating={course.rating} size="lg" />
            <p className="mt-1 text-xs text-slate-500">{course.reviewsCount} đánh giá</p>
          </div>
          <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            {course.reviewsCount > 0 ? (
              <p>
                Điểm trung bình từ <span className="font-semibold text-slate-800">{course.reviewsCount}</span> đánh giá
                học viên (đã duyệt). Phân bổ chi tiết theo từng mức sao sẽ được bổ sung khi có đủ dữ liệu.
              </p>
            ) : (
              <p>Chưa có đánh giá từ học viên. Hãy là người đầu tiên chia sẻ trải nghiệm sau khi hoàn thành khóa học.</p>
            )}
          </div>
        </div>

        {/* Add review button if enrolled - Prominent at top */}
        {enrolled && !submitted && (
          <button
            onClick={() => setShowReviewDialog(true)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-105"
            style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)", color: "#fff" }}
          >
            <Pencil className="w-4 h-4" />
            Viết đánh giá cho khóa học này
          </button>
        )}

        {/* Success message */}
        {submitted && (
          <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-[#6E35E8]" />
            <div>
              <p className="text-sm font-bold text-violet-950">Đánh giá đã được gửi thành công</p>
              <p className="mt-0.5 text-xs text-slate-600">Cảm ơn bạn đã chia sẻ trải nghiệm. Đánh giá sẽ hiển thị sau khi được kiểm duyệt.</p>
            </div>
          </div>
        )}
      </div>

      {/* Peer reviews from mentors */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkle className="w-5 h-5 text-[#6E35E8]" />
          <h3 className="font-bold text-slate-900">Đánh giá từ Mentor chuyên nghiệp</h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: "rgba(110, 53, 232, 0.12)", color: "#5b21b6", border: "1px solid rgba(167, 139, 250, 0.35)" }}
          >
            Peer Review
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Các khóa học được đánh giá chéo bởi các mentor khác trong hệ thống, đảm bảo chất lượng và độ chính xác.
        </p>

        <div className="space-y-4">
          {(course.reviews || []).map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-violet-200"
            >
              <div className="flex items-start gap-4">
                <img
                  src={review.mentorAvatar}
                  alt={review.mentorName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{review.mentorName}</span>
                    {review.verified && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{ background: "rgba(110, 53, 232,0.1)", color: "#6E35E8" }}
                      >
                        <SealCheck className="h-3 w-3" />
                        Verified Mentor
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs text-slate-500">{review.mentorTitle}</p>
                  <StarRating rating={review.rating} />
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student reviews */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="w-5 h-5 text-[#6E35E8]" />
          <h3 className="font-bold text-slate-900">Đánh giá từ Học viên</h3>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Những đánh giá chân thật từ học viên đã hoàn thành khóa học.
        </p>

        <div className="space-y-4">
          {STUDENT_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-violet-200"
            >
              <div className="flex items-start gap-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{review.name}</span>
                    {review.verified && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{ background: "rgba(110, 53, 232,0.1)", color: "#6E35E8" }}
                      >
                        <SealCheck className="h-3 w-3" />
                        Verified Student
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs text-slate-500">{review.role}</p>
                  <StarRating rating={review.rating} />
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(review.date).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to add review if enrolled */}
        {enrolled && !submitted && (
          <div
            className="mt-5 cursor-pointer rounded-3xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-6 transition-all hover:border-violet-300"
            onClick={() => setShowReviewDialog(true)}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)" }}
              >
                <Pencil className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-bold text-slate-900">Chia sẻ trải nghiệm của bạn</p>
                <p className="text-sm text-slate-600">
                  Bạn đã hoàn thành khóa học? Hãy viết đánh giá để giúp học viên khác đưa ra quyết định đúng đắn.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[#6E35E8]" />
            </div>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="border border-slate-200 bg-white text-slate-900 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-[#6E35E8]" />
              Đánh giá khóa học
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Chia sẻ trải nghiệm của bạn để giúp học viên khác có cái nhìn đúng đắn hơn về khóa học.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Course info quick reference */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <ImageWithFallback
                src={course.thumbnail}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{course.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">Bởi {course.mentorName}</p>
              </div>
            </div>

            {/* Star rating picker */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-800">
                Bạn đánh giá khóa học này mấy sao?
                <span className="ml-1 text-red-500">*</span>
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviewRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      fill={s <= (hoverRating || reviewRating) ? "#FFD600" : "none"}
                      className="h-10 w-10"
                      style={{ color: s <= (hoverRating || reviewRating) ? "#FFD600" : "rgb(203 213 225)" }}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-sm mt-2 font-bold" style={{ color: "#6E35E8" }}>
                  {reviewRating === 5 
                    ? "⭐ Xuất sắc Khóa học vượt mong đợi" 
                    : reviewRating === 4 
                    ? "😊 Rất tốt Khóa học chất lượng cao" 
                    : reviewRating === 3 
                    ? "🙂 Tốt Khóa học đáp ứng được" 
                    : reviewRating === 2 
                    ? "😐 Chưa tốt, cần cải thiện" 
                    : "😞 Không đạt mong đợi"}
                </p>
              )}
            </div>

            {/* Comment textarea */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Chia sẻ trải nghiệm của bạn
                <span className="ml-1 text-red-500">*</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Khóa học đã giúp bạn cải thiện điều gì? Điểm nổi bật nhất là gì? Bạn có đề xuất gì cho mentor không?..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#6E35E8] focus:ring-2 focus:ring-violet-500/20"
                maxLength={800}
              />
              <div className="mt-1.5 flex justify-between">
                <p
                  className="text-xs"
                  style={{
                    color: reviewComment.length >= 30 ? "#15803d" : reviewComment.length > 0 ? "#c2410c" : "rgb(100 116 139)",
                  }}
                >
                  {reviewComment.length >= 30 
                    ? "✓ Đủ độ dài để gửi" 
                    : "Tối thiểu 30 ký tự để đánh giá được chấp thuận"}
                </p>
                <p className="text-xs text-slate-500">{reviewComment.length}/800</p>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCloseDialog}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!reviewRating || reviewComment.trim().length < 30 || submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)", color: "#fff" }}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-700" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Gửi đánh giá
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [enrollmentRow, setEnrollmentRow] = useState(null); 
  const [wishlisted, setWishlisted] = useState(false);
  const currentUser = getUser();

  useEffect(() => {
    if (!id) return;
    fetchCourseById(id).then((res) => {
      if (res.success) {
        const c = res.course;
        const allLessons = (c.modules || []).flatMap((module) =>
          (module.lessons || []).map((lesson) => ({
            id: lesson._id,
            title: lesson.title,
            duration: lesson.durationMinutes || 0,
            isPreview: !!lesson.isFree,
          })),
        );
        const stats = normalizeCourseStats(c.stats);
        setCourse({
          id: c._id,
          title: c.title,
          description: c.description,
          thumbnail: mediaSrc(c.thumbnail, DEFAULT_COURSE_THUMB),
          category: c.topics?.[0] || "Kỹ năng khác",
          level: c.level === "basic" ? "Beginner" : c.level === "intermediate" ? "Intermediate" : "Advanced",
          mentorId: c.mentorId?._id,
          mentorUserId: c.mentorId?.userId?._id || "",
          mentorName: c.mentorId?.userId?.name || "Khuất danh",
          mentorAvatar: avatarSrc(c.mentorId?.userId?.avatar),
          mentorTitle: c.mentorId?.userId?.desiredPosition || "Chuyên gia",
          mentorCompany: c.mentorId?.userId?.currentCompany || "ProInterview",
          rating: stats.rating,
          reviewsCount: stats.reviewsCount,
          studentsCount: c.stats?.enrollmentCount || 0,
          duration: c.totalDurationMinutes || 120,
          lessonsCount: c.totalLessons || 0,
          price: c.price || 0,
          lessons: allLessons,
          learningOutcomes: c.whatYoullLearn || [],
          requirements: c.requirements || [],
          targetAudience: c.targetAudience || [],
          tags: c.tags || [],
          updatedAt: c.updatedAt || new Date().toISOString(),
          reviews: [] 
        });
      }
      setLoading(false);
    });

    enrollmentApi.getMyEnrollments().then((res) => {
      if (res.success) {
        const row = res.enrollments.find(
          (e) => String(e.courseId?._id || e.courseId || "") === String(id),
        );
        setEnrollmentRow(row || null);
      }
    });
  }, [id]);

  const hasPaidEnrollment = enrollmentAccessGranted(enrollmentRow);
  const hasPendingPayment = !!enrollmentRow && !enrollmentAccessGranted(enrollmentRow);

  const handleEnroll = async () => {
    if (!id || !course) return;
    if (course.price > 0) {
      navigate(`/checkout?type=course&courseId=${id}&price=${course.price}`);
      return;
    }
    const res = await enrollmentApi.enroll(id);
    if (res.success) {
      setEnrollmentRow(res.enrollment || enrollmentRow);
      toast.success("Đăng ký khóa học thành công!");
    } else {
      if (res.error === "Chưa đăng nhập.") {
        requireLoginNavigate(navigate, `/courses/${id}`);
        return;
      }
      toast.error(res.error || "Không thể đăng ký khóa học.");
    }
  };

  if (loading) {
    return (
      <MentorPageShell bottomPad="pb-24">
        <div className="flex min-h-[50vh] w-full items-center justify-center px-6 py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300 border-t-violet-700" />
        </div>
      </MentorPageShell>
    );
  }

  if (!course) {
    return (
      <MentorPageShell bottomPad="pb-24">
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center px-6 py-20 text-center font-sans text-slate-600">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h2 className="mb-2 text-xl font-bold text-slate-900">Không tìm thấy khóa học</h2>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="rounded-xl bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] px-6 py-3 font-semibold text-white transition-colors hover:opacity-95"
          >
            Quay lại danh sách
          </button>
        </div>
      </MentorPageShell>
    );
  }

  const relatedCourses = []; // Tạm thời để trống hoặc lấy từ danh sách nếu có
  const levelColor = getLevelColor(course.level);
  const displayedLessons = showAllLessons ? (course.lessons || []) : (course.lessons || []).slice(0, 5);
  const isMentorViewer = currentUser?.role === "mentor";
  const isOwnerMentor = isMentorViewer && String(currentUser?.id || "") === String(course.mentorUserId || "");
  const canTakeStudentActions = !isMentorViewer || isOwnerMentor;
  const isReadOnlyMentorView = isMentorViewer && !isOwnerMentor;

  const TABS = [
    { key: "overview", label: "Tổng quan", icon: ListChecks },
    { key: "curriculum", label: "Nội dung", icon: BookOpen },
    { key: "instructor", label: "Giảng viên", icon: UserCircle },
    { key: "reviews", label: `Đánh giá (${(course.reviews || []).length + STUDENT_REVIEWS.length})`, icon: Star },
  ];

  return (
    <MentorPageShell bottomPad="pb-24">
      <div className="relative z-10 min-h-full w-full font-sans text-slate-900 antialiased selection:bg-[rgba(122,35,229,0.18)] selection:text-slate-900">
      <header className="relative border-b border-slate-200/80 pb-12 pt-6 sm:pb-14 sm:pt-8">
        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-slate-900 active:scale-[0.97]"
            aria-label="Quay lại trang trước"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          </button>

          <div className="grid items-start gap-10 lg:grid-cols-[1fr_380px]">
            {/* Left: Course Info */}
            <div>
              {/* Category + Level badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-900">
                  {course.category}
                </span>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: levelColor.bg, color: levelColor.text, border: `1px solid ${levelColor.border}` }}
                >
                  {getLevelLabel(course.level)}
                </span>
              </div>

              <h1 className="app-page-title mb-3">
                {course.title}
              </h1>
              <p className="app-page-subtitle mb-6">
                {course.description}
              </p>

              {/* Rating row */}
              <div className="mb-6 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <StarRating rating={course.rating} />
                  <span className="font-bold text-amber-600">
                    {course.rating != null ? course.rating.toFixed(1) : "—"}
                  </span>
                  <span className="text-sm text-slate-500">({course.reviewsCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>{course.studentsCount.toLocaleString()} học viên</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessonsCount} bài học</span>
                </div>
              </div>

              {/* Mentor info */}
              <div className="flex items-center gap-3">
                <img
                  src={course.mentorAvatar}
                  alt={course.mentorName}
                  className="h-12 w-12 rounded-full border-2 border-slate-200 object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{course.mentorName}</span>
                    <SealCheck className="h-4 w-4 text-[#6E35E8]" />
                  </div>
                  <p className="text-sm text-slate-600">{course.mentorTitle} · {course.mentorCompany}</p>
                </div>
              </div>
            </div>

            {/* Right: Sticky Enrollment Card */}
            <div className="glass-card overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              {/* Thumbnail preview */}
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xl"
                    style={{ background: "rgba(110, 53, 232,0.9)" }}
                  >
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute left-3 top-3 rounded-full bg-[#6E35E8]/95 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-[2px]">
                  Xem trước miễn phí
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/90 p-6">
                {/* Price */}
                <div className="mb-4 flex items-end gap-2">
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(course.price)}</span>
                  {course.price > 0 && (
                    <span className="mb-1 text-xs text-slate-400 line-through">
                      {formatPrice(Math.round(course.price * 1.4))}
                    </span>
                  )}
                  {course.price > 0 && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-lg mb-1"
                      style={{ background: "rgba(255,140,66,0.12)", color: "#CC5C00" }}
                    >
                      -28%
                    </span>
                  )}
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 mb-4">
                  {hasPaidEnrollment && !isReadOnlyMentorView ? (
                    <button
                      onClick={() => navigate(`/courses/${course.id}/learn`)}
                      className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)", color: "#fff" }}
                    >
                      <PlayCircle className="w-4.5 h-4.5" />
                      Tiếp tục học
                    </button>
                  ) : hasPaidEnrollment && isReadOnlyMentorView ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all opacity-50 cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)", color: "#fff" }}
                    >
                      <Lock className="w-4.5 h-4.5" />
                      Mentor chỉ được xem khóa học
                    </button>
                  ) : hasPendingPayment && canTakeStudentActions ? (
                    <div className="space-y-2">
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
                        Đã ghi danh — đang chờ admin xác nhận chuyển khoản trước khi vào học đầy đủ.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/checkout?type=course&courseId=${course.id}&price=${course.price}`)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300 bg-white py-3 text-sm font-bold text-violet-900 shadow-sm transition-all hover:bg-violet-50 active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-4.5 h-4.5" />
                        Tiếp tục thanh toán
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={canTakeStudentActions ? handleEnroll : undefined}
                      disabled={!canTakeStudentActions}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(110,53,232,0.35)] transition-all hover:shadow-[0_12px_36px_rgba(110,53,232,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4.5 h-4.5" />
                      {canTakeStudentActions
                        ? course.price === 0
                          ? "Đăng ký miễn phí"
                          : "Thanh toán & ghi danh"
                        : "Mentor chỉ được xem khóa học"}
                    </button>
                  )}
                  {isReadOnlyMentorView && (
                    <p className="text-center text-[10px] font-semibold text-slate-500">Khóa học này không thuộc bạn nên không thể thao tác đăng ký/đặt lịch.</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWishlisted(!wishlisted)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                        wishlisted
                          ? "border-violet-300 bg-violet-50 text-violet-900"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Heart
                        fill={wishlisted ? "#a78bfa" : "none"}
                        className="h-3.5 w-3.5"
                      />
                      Yêu thích
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
                    >
                      <ShareNetwork className="h-3.5 w-3.5" />
                      Chia sẻ
                    </button>
                  </div>
                </div>

                {/* Course stats */}
                <div className="space-y-2.5 border-t border-slate-200 pt-5">
                  {[
                    { icon: Clock, label: "Thời lượng", value: formatDuration(course.duration) },
                    { icon: BookOpen, label: "Số bài học", value: `${course.lessonsCount} bài` },
                    { icon: Video, label: "Video chất lượng", value: "HD 1080p" },
                    { icon: Certificate, label: "Chứng chỉ hoàn thành", value: "Có" },
                    { icon: CalendarBlank, label: "Truy cập mãi mãi", value: "Không giới hạn" },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                    );
                  })}
                </div>

                {/* Book Mentor CTA */}
                {hasPaidEnrollment && canTakeStudentActions && (
                  <div
                    className="mt-5 cursor-pointer rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 transition-all hover:border-violet-300"
                    onClick={() => navigate(`/mentors/${course.mentorId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <img src={course.mentorAvatar} alt={course.mentorName} className="h-10 w-10 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="mb-0.5 text-xs font-bold text-[#6E35E8]">Sau khi học xong →</p>
                        <p className="text-sm font-semibold text-slate-900">Book 1-1 với {course.mentorName}</p>
                        <p className="text-xs text-slate-600">Confirm kiến thức & nhận feedback cá nhân</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-violet-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-7xl px-6 sm:px-8">
        <div className="-mx-6 mt-8 flex gap-1 overflow-x-auto border-b border-slate-200 px-6">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "border-[#6E35E8] text-[#6E35E8]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-10 py-10">
          {/* Main content */}
          <div>
            {/* ── Overview Tab ─────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Learning outcomes */}
                <div className="glass-card p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Trophy className="h-5 w-5 text-[#6E35E8]" />
                    Bạn sẽ học được gì?
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {course.learningOutcomes.map((outcome, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#6E35E8]" />
                        <span className="text-sm text-slate-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="glass-card p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Target className="h-5 w-5 text-[#FF8C42]" />
                    Yêu cầu
                  </h2>
                  <div className="space-y-2">
                    {course.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8C42]" />
                        <span className="text-sm text-slate-700">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target audience */}
                <div className="glass-card p-6">
                  <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Users className="h-5 w-5 text-amber-500" />
                    Dành cho ai?
                  </h2>
                  <div className="space-y-2">
                    {course.targetAudience.map((aud, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <span className="text-sm text-slate-700">{aud}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-600">Tags khóa học</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: "rgba(110, 53, 232,0.08)", color: "#5b21b6", border: "1px solid rgba(139, 77, 255, 0.25)" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Curriculum Tab ───────────────────────────── */}
            {activeTab === "curriculum" && (
              <div className="glass-card overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/80 p-6">
                  <h2 className="mb-1 text-xl font-bold text-slate-900">Nội dung khóa học</h2>
                  <p className="text-sm text-slate-600">
                    {course.lessonsCount} bài học · {formatDuration(course.duration)} · Cập nhật{" "}
                    {new Date(course.updatedAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {displayedLessons.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} index={i} />
                  ))}
                </div>

                {(course.lessons || []).length > 5 && (
                  <div className="border-t border-slate-200 p-4">
                    <button
                      onClick={() => setShowAllLessons(!showAllLessons)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 py-3 text-sm font-semibold text-[#6E35E8] transition-all hover:bg-violet-100"
                    >
                      {showAllLessons ? (
                        <>
                          <CaretUp className="w-4 h-4" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <CaretDown className="w-4 h-4" />
                          Xem thêm {(course.lessons || []).length - 5} bài học
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Instructor Tab ──────────────────────────── */}
            {activeTab === "instructor" && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="mb-6 flex items-start gap-5">
                    <img
                      src={course.mentorAvatar}
                      alt={course.mentorName}
                      className="h-20 w-20 rounded-2xl border-2 border-slate-200 object-cover shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{course.mentorName}</h2>
                        <SealCheck className="h-5 w-5 text-[#6E35E8]" />
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ background: "rgba(110, 53, 232,0.1)", color: "#6E35E8" }}
                        >
                          Mentor xác thực
                        </span>
                      </div>
                      <p className="mb-1 text-slate-700">{course.mentorTitle}</p>
                      <p className="text-sm text-slate-500">{course.mentorCompany}</p>
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-3 gap-4 border-b border-slate-200 pb-6">
                    {[
                      { icon: Star, value: course.rating != null ? course.rating.toFixed(1) : "—", label: "Rating", color: "#FFD600" },
                      { icon: Users, value: `${course.studentsCount}+`, label: "Học viên", color: "#6E35E8" },
                      { icon: BookOpen, value: "3", label: "Khóa học", color: "#a78bfa" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div
                          className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: `${stat.color}15` }}
                        >
                          <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                        </div>
                        <p className="font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mb-5 text-sm leading-relaxed text-slate-700">
                    {course.mentorName} là chuyên gia với hơn 10 năm kinh nghiệm trong ngành. Tại {course.mentorCompany}, 
                    {course.mentorName} đã dẫn dắt team và phỏng vấn hàng trăm ứng viên mỗi năm. 
                    Với niềm đam mê chia sẻ kiến thức, {course.mentorName} đã tạo ra các khóa học thực tế 
                    giúp học viên tự tin hơn trong hành trình phát triển sự nghiệp.
                  </p>

                  <button
                    onClick={() => canTakeStudentActions && navigate(`/mentors/${course.mentorId}`)}
                    disabled={!canTakeStudentActions}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-105"
                    style={{ background: "linear-gradient(135deg, #6E35E8, #8B4DFF)", color: "#fff", opacity: canTakeStudentActions ? 1 : 0.5 }}
                  >
                    <CalendarBlank className="w-4 h-4" />
                    Book 1-1 với {course.mentorName}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Reviews Tab ──────────────────────────────── */}
            {activeTab === "reviews" && (
              <ReviewsSection course={course} enrolled={hasPaidEnrollment} />
            )}
          </div>

          {/* Right sidebar (sticky on desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Related courses */}
              {relatedCourses.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="mb-4 font-bold text-slate-900">Khóa học liên quan</h3>
                  <div className="space-y-4">
                    {relatedCourses.map((related) => (
                      <div
                        key={related.id}
                        className="group flex cursor-pointer gap-3"
                        onClick={() => navigate(`/courses/${related.id}`)}
                      >
                        <img
                          src={related.thumbnail}
                          alt={related.title}
                          className="h-12 w-16 shrink-0 rounded-xl object-cover transition-opacity group-hover:opacity-90"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#6E35E8]">
                            {related.title}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#6E35E8]">{formatPrice(related.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/courses")}
                    className="mt-4 w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-semibold text-violet-900 transition-all hover:bg-violet-100"
                  >
                    Xem tất cả khóa học
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Book Mentor Banner ───────────────────────────────── */}
      <div className="mx-auto mb-10 max-w-7xl overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-slate-50 px-6 py-10 shadow-sm sm:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#6E35E8]" />
              <span className="text-sm font-bold tracking-wide text-[#6E35E8]">BƯỚC TIẾP THEO</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Sau khi học xong, book 1-1 với mentor
            </h2>
            <p className="max-w-xl text-sm text-slate-600">
              Áp dụng kiến thức vào thực tế với phiên mentor 1-1: confirm những gì bạn đã học, 
              giải quyết câu hỏi còn thắc mắc, và nhận insider tips từ người trong ngành.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <img src={course.mentorAvatar} alt={course.mentorName} className="h-14 w-14 shrink-0 rounded-full border-2 border-slate-200 object-cover" />
            <div>
              <p className="font-bold text-slate-900">{course.mentorName}</p>
              <p className="text-sm text-slate-600">{course.mentorTitle}</p>
              <button
                onClick={() => canTakeStudentActions && navigate(`/mentors/${course.mentorId}`)}
                disabled={!canTakeStudentActions}
                className="mt-2 rounded-xl bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] px-5 py-2 text-sm font-bold text-white shadow-[0_6px_20px_rgba(110,53,232,0.3)] transition-all hover:shadow-[0_8px_26px_rgba(110,53,232,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {canTakeStudentActions ? "Đặt lịch ngay →" : "Mentor chỉ xem thông tin"}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </MentorPageShell>
  );
}