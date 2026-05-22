import { redirect } from "react-router";
import { hasAuthCredentials } from "./auth.js";

/** Lấy path hash hiện tại từ request (createHashRouter), giữ query string. */
function redirectPathFromRequest(request) {
  try {
    const url = new URL(request.url);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    if (hash) return hash.startsWith("/") ? hash : `/${hash}`;
    if (url.pathname && url.pathname !== "/") return url.pathname;
  } catch {
    /* fall through */
  }
  return "/dashboard";
}

/**
 * React Router loader: chặn route cần đăng nhập.
 * App.jsx đã gọi restoreSession() trước khi mount router → token hết hạn đã bị xóa.
 */
export function requireAuthLoader({ request }) {
  if (!hasAuthCredentials()) {
    const path = redirectPathFromRequest(request);
    throw redirect(`/login?redirect=${encodeURIComponent(path)}`);
  }
  return null;
}
