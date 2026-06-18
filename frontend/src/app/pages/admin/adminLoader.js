import { redirect } from "react-router";
import {
  authFetch,
  hasAuthCredentials,
  setLoggedIn,
} from "../../utils/auth/auth.js";

function isRouterRedirect(error) {
  return error instanceof Response;
}

/** Chỉ user đã đăng nhập với role `admin` (xác minh qua /api/auth/me). */
export async function adminLoader() {
  if (!hasAuthCredentials()) {
    throw redirect("/login?redirect=/admin");
  }
  try {
    const res = await authFetch("/api/auth/me", { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success || body.user?.role !== "admin") {
      throw redirect("/login?redirect=/admin");
    }
    setLoggedIn(body.user);
    return null;
  } catch (err) {
    if (isRouterRedirect(err)) throw err;
    throw redirect("/login?redirect=/admin");
  }
}
