import { API_BASE_URL } from "./api.js";

export const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=ProInterview";

/**
 * Chuẩn hóa URL ảnh/upload từ API (full URL, /uploads/..., hoặc chỉ tên file).
 */
const LOCAL_BACKEND = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i;

export function resolveMediaUrl(src) {
  const raw = typeof src === "string" ? src.trim() : "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) {
    const base = (API_BASE_URL || "").replace(/\/$/, "");
    if (base && LOCAL_BACKEND.test(raw)) {
      return raw.replace(LOCAL_BACKEND, base);
    }
    return raw;
  }
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE_URL || ""}${raw}`;
  }
  if (raw.startsWith("uploads/")) {
    return `${API_BASE_URL || ""}/${raw}`;
  }
  if (/\.(png|jpe?g|gif|webp|mov|mp4)$/i.test(raw) || raw.startsWith("file-")) {
    return `${API_BASE_URL || ""}/uploads/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

/** Avatar an toàn: resolve URL + fallback khi rỗng. */
export function avatarSrc(src, fallback = DEFAULT_AVATAR) {
  const url = resolveMediaUrl(src);
  return url || fallback;
}

/** Ảnh/video khóa học — fallback placeholder khi rỗng. */
export function mediaSrc(src, fallback = "") {
  return resolveMediaUrl(src) || fallback;
}

export const DEFAULT_COURSE_THUMB =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80";
