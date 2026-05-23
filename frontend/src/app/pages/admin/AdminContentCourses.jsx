import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Film,
  GraduationCap,
  ImageIcon,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";
import { AdminPanel } from "./AdminPanel.jsx";
import { adminApi } from "../../utils/adminApi.js";
import { toastApiError, toastApiSuccess, tryApi } from "../../utils/apiToast.js";
import { mediaSrc, DEFAULT_COURSE_THUMB, avatarSrc } from "../../utils/mediaUrl.js";
import { getInitials } from "../../utils/auth.js";

const LEVEL_LABELS = {
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const STATUS_META = {
  pending_review: {
    label: "Khóa mới",
    className: "bg-amber-100 text-amber-900 ring-amber-200",
    hint: "Mentor gửi khóa lần đầu — duyệt để xuất bản công khai.",
  },
  pending_update: {
    label: "Cập nhật",
    className: "bg-sky-100 text-sky-900 ring-sky-200",
    hint: "Khóa đang public — chỉ áp dụng bản chỉnh sửa khi bạn duyệt.",
  },
};

function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  if (m <= 0) return "—";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0) return r > 0 ? `${h}h ${r} phút` : `${h}h`;
  return `${r} phút`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function AdminModal({ onClose, children, maxWidth = "max-w-3xl" }) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} max-h-[min(92vh,100dvh-1rem)] overflow-y-auto rounded-2xl border border-violet-200/80 bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function MentorBlock({ mentor }) {
  const name = mentor?.name || "Cố vấn";
  const avatar = mentor?.avatar || "";
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = avatar && !imgFailed;

  return (
    <div className="flex items-center gap-3">
      {showImg ? (
        <img
          src={avatarSrc(avatar)}
          alt=""
          className="size-12 shrink-0 rounded-xl object-cover ring-2 ring-violet-100"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">
          {getInitials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-bold text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">{mentor?.email || "—"}</p>
        {(mentor?.title || mentor?.company) && (
          <p className="mt-0.5 truncate text-xs text-violet-700">
            {[mentor.title, mentor.company].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5 text-violet-600" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ChapterList({ chapters, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!chapters?.length) {
    return <p className="text-sm text-slate-500">Chưa có chương / bài học.</p>;
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-600" />
          Nội dung ({chapters.length} chương)
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {chapters.map((ch, ci) => (
            <li key={ci} className="px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Chương {ci + 1}: {ch.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {(ch.lessons || []).map((lesson, li) => (
                  <li
                    key={li}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {li + 1}. {lesson.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {lesson.hasVideo ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Film className="h-3 w-3" /> Có video
                        </span>
                      ) : (
                        <span className="text-amber-700">Chưa có video</span>
                      )}
                      {lesson.durationMinutes > 0 ? (
                        <span>{lesson.durationMinutes} phút</span>
                      ) : null}
                      {lesson.isPreview ? (
                        <span className="rounded bg-lime-100 px-1.5 py-0.5 font-semibold text-lime-900">
                          Xem thử
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PendingChangesBanner({ changes }) {
  if (!changes?.length) return null;
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Thay đổi so với bản đang public</p>
      <ul className="mt-2 space-y-2">
        {changes.map((c) => (
          <li key={c.label} className="text-sm text-slate-800">
            <span className="font-semibold text-sky-900">{c.label}:</span>{" "}
            <span className="text-slate-500 line-through">{c.from}</span>
            <span className="mx-1 text-slate-400">→</span>
            <span className="font-medium text-slate-900">{c.to}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CourseReviewCard({ course, busy, onApprove, onReject, onPreview }) {
  const meta = STATUS_META[course.status] || STATUS_META.pending_review;
  const r = course.review || {};
  const thumb = mediaSrc(r.thumbnail, DEFAULT_COURSE_THUMB);
  const topic = Array.isArray(r.topics) && r.topics.length ? r.topics[0] : "—";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white p-5 sm:flex-row">
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 sm:h-32 sm:w-44">
          <img src={thumb} alt="" className="h-full w-full object-cover" />
          {!r.thumbnail ? (
            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              Chưa có ảnh bìa
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${meta.className}`}>
              {meta.label}
            </span>
            <span className="text-[10px] font-medium text-slate-500">Gửi lúc {formatDate(course.updatedAt)}</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">{r.title || "(Không có tiêu đề)"}</h2>
          <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-violet-700">Cố vấn</p>
            <MentorBlock mentor={course.mentor} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <StatPill icon={GraduationCap} label="Giá" value={r.priceLabel || "—"} />
            <StatPill icon={BookOpen} label="Chủ đề" value={topic} />
            <StatPill icon={User} label="Cấp độ" value={LEVEL_LABELS[r.level] || r.level || "—"} />
            <StatPill icon={Clock} label="Thời lượng" value={formatDuration(r.durationMinutes)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill icon={BookOpen} label="Chương" value={String(r.chapterCount ?? 0)} />
          <StatPill icon={Film} label="Bài có video" value={`${r.videoCount ?? 0}/${r.lessonCount ?? 0}`} />
          <StatPill icon={Eye} label="Bài xem thử" value={String(r.previewCount ?? 0)} />
          <StatPill icon={ImageIcon} label="Loại" value={r.isFree ? "Miễn phí" : "Trả phí"} />
        </div>

        {course.status === "pending_update" ? (
          <PendingChangesBanner changes={course.pendingChanges} />
        ) : null}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Mô tả</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 line-clamp-4">
            {r.description || "(Không có mô tả)"}
          </p>
        </div>

        {Array.isArray(r.whatYoullLearn) && r.whatYoullLearn.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Học viên sẽ học được</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {r.whatYoullLearn.slice(0, 5).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
              {r.whatYoullLearn.length > 5 ? (
                <li className="list-none text-xs text-slate-500">+{r.whatYoullLearn.length - 5} mục khác…</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <ChapterList chapters={r.chapters} />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-red-800 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {busy ? "Đang xử lý…" : "Từ chối"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {busy ? "Đang xử lý…" : "Duyệt & xuất bản"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CourseDetailModal({ course, onClose, onApprove, onReject, busy }) {
  const r = course?.review || {};
  const thumb = mediaSrc(r.thumbnail, DEFAULT_COURSE_THUMB);

  return (
    <AdminModal onClose={onClose} maxWidth="max-w-4xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-violet-600">Chi tiết khóa chờ duyệt</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">{r.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Đóng
        </button>
      </div>

      <img src={thumb} alt="" className="mb-4 h-48 w-full rounded-xl object-cover border border-slate-200" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <MentorBlock mentor={course.mentor} />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p>
            <span className="font-semibold text-slate-700">Giá:</span> {r.priceLabel}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-700">Cấp độ:</span> {LEVEL_LABELS[r.level] || r.level}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-700">Video:</span> {r.videoCount}/{r.lessonCount} bài ·{" "}
            {formatDuration(r.durationMinutes)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Cập nhật: {formatDate(course.updatedAt)}</p>
        </div>
      </div>

      {course.pendingChanges?.length ? <PendingChangesBanner changes={course.pendingChanges} /> : null}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase text-violet-700">Mô tả đầy đủ</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{r.description || "—"}</p>
        </div>

        {r.whatYoullLearn?.length ? (
          <div>
            <p className="text-xs font-bold uppercase text-violet-700">Học viên sẽ học được</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {r.whatYoullLearn.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <ChapterList chapters={r.chapters} defaultOpen />

        {r.chapters?.some((ch) => ch.lessons?.some((l) => l.videoUrl)) ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs font-bold text-slate-600">Liên kết video (mở tab mới)</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
              {r.chapters.flatMap((ch, ci) =>
                (ch.lessons || [])
                  .filter((l) => l.videoUrl)
                  .map((l, li) => (
                    <li key={`${ci}-${li}`}>
                      <a
                        href={l.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-violet-700 hover:underline"
                      >
                        {ch.title} — {l.title}
                      </a>
                    </li>
                  )),
              )}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase text-red-800 disabled:opacity-50"
        >
          Từ chối
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          Duyệt & xuất bản
        </button>
      </div>
    </AdminModal>
  );
}

export function AdminContentCourses() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pendingReview: 0, pendingUpdate: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [previewCourse, setPreviewCourse] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    const res = await tryApi(() => adminApi.getPendingCourses(), {
      fallback: "Không tải được khóa học chờ duyệt.",
    });
    if (res.success) {
      setItems(res.courses || []);
      setCounts(res.counts || { total: (res.courses || []).length, pendingReview: 0, pendingUpdate: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Duyệt khóa học này và xuất bản (hoặc áp dụng bản cập nhật)?")) return;
    setBusyId(id);
    const res = await tryApi(() => adminApi.approveCourse(id), {
      fallback: "Không duyệt được khóa học.",
      successMessage: "Đã duyệt khóa học.",
    });
    setBusyId("");
    if (res.success) {
      setPreviewCourse(null);
      await loadPending();
    }
  };

  const handleReject = async (course) => {
    const isUpdate = course.status === "pending_update";
    const msg = isUpdate
      ? "Từ chối bản cập nhật? Khóa vẫn giữ nguyên trên marketplace, mentor sửa và gửi lại."
      : "Từ chối khóa mới? Khóa trả về bản nháp để mentor chỉnh sửa.";
    if (!window.confirm(msg)) return;
    setBusyId(course._id);
    const res = await tryApi(() => adminApi.rejectCourse(course._id), {
      fallback: "Không từ chối được khóa học.",
      successMessage: isUpdate ? "Đã bỏ bản cập nhật." : "Đã từ chối — trả về nháp.",
    });
    setBusyId("");
    if (res.success) {
      setPreviewCourse(null);
      await loadPending();
    }
  };

  return (
    <AdminPanel
      title="Nội dung — Khóa học"
      description="Xem đầy đủ thông tin, nội dung chương/bài và video trước khi duyệt hoặc từ chối."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!loading && counts.total > 0 ? (
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{counts.total}</strong> khóa chờ duyệt ·{" "}
              <span className="text-amber-800">{counts.pendingReview} mới</span>
              {counts.pendingUpdate > 0 ? (
                <>
                  {" "}
                  · <span className="text-sky-800">{counts.pendingUpdate} cập nhật</span>
                </>
              ) : null}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => void loadPending()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80">
            <p className="text-sm text-slate-500">Đang tải danh sách chờ duyệt…</p>
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-violet-300" />
            <p className="mt-4 text-lg font-bold text-slate-800">Không có khóa học chờ duyệt</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Khi mentor gửi khóa mới hoặc cập nhật khóa đang public, thông tin chi tiết sẽ hiển thị tại đây để bạn
              duyệt.
            </p>
          </div>
        ) : null}

        {!loading &&
          items.map((course) => (
            <CourseReviewCard
              key={course._id}
              course={course}
              busy={busyId === course._id}
              onApprove={() => handleApprove(course._id)}
              onReject={() => handleReject(course)}
              onPreview={() => setPreviewCourse(course)}
            />
          ))}
      </div>

      {previewCourse ? (
        <CourseDetailModal
          course={previewCourse}
          busy={busyId === previewCourse._id}
          onClose={() => setPreviewCourse(null)}
          onApprove={() => handleApprove(previewCourse._id)}
          onReject={() => handleReject(previewCourse)}
        />
      ) : null}
    </AdminPanel>
  );
}
