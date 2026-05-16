const LOCAL_BACKEND = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i;

function publicBase() {
  return (process.env.BACKEND_URL || "").replace(/\/$/, "");
}

/**
 * Chuẩn hóa đường dẫn upload lưu trong MongoDB → URL đầy đủ tới backend hiện tại.
 * - `file-xxx.png` → `https://api.../uploads/file-xxx.png`
 * - `http://localhost:5000/uploads/...` → BACKEND_URL (prod)
 */
export function resolveStoredUploadUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    const base = publicBase();
    if (base && LOCAL_BACKEND.test(raw)) {
      return raw.replace(LOCAL_BACKEND, base);
    }
    return raw;
  }

  const rel = raw.startsWith("/uploads/")
    ? raw
    : `/uploads/${raw.replace(/^uploads\//, "").replace(/^\/+/, "")}`;
  const base = publicBase();
  return base ? `${base}${rel}` : rel;
}

export function serializeCourseForApi(course) {
  if (!course) return course;
  const doc = course.toObject ? course.toObject({ getters: true }) : { ...course };
  if (doc.thumbnail) doc.thumbnail = resolveStoredUploadUrl(doc.thumbnail);
  if (Array.isArray(doc.modules)) {
    doc.modules = doc.modules.map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).map((lesson) => ({
        ...lesson,
        videoUrl: lesson.videoUrl ? resolveStoredUploadUrl(lesson.videoUrl) : lesson.videoUrl,
        documentUrl: lesson.documentUrl ? resolveStoredUploadUrl(lesson.documentUrl) : lesson.documentUrl,
      })),
    }));
  }
  const uid = doc.mentorId?.userId;
  if (uid && typeof uid === "object" && uid.avatar) {
    uid.avatar = resolveStoredUploadUrl(uid.avatar);
  }
  if (doc.mentorId && typeof doc.mentorId === "object" && doc.mentorId.avatar) {
    doc.mentorId.avatar = resolveStoredUploadUrl(doc.mentorId.avatar);
  }
  return doc;
}
