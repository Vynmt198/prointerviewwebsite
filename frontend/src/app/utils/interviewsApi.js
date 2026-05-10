import { authFetch, hasAuthCredentials } from "./auth.js";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * Tạo phiên phỏng vấn AI (tăng quota interviewUsed trên user).
 */
export async function createInterviewSession(hrGender = "female") {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/interviews/sessions", {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify({ hrGender: hrGender === "male" ? "male" : "female" }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    const id = body.session?._id;
    if (!id) return { success: false, error: "Không nhận được id phiên." };
    return { success: true, sessionId: String(id) };
  } catch {
    return { success: false, error: "Không kết nối được backend." };
  }
}

/**
 * Đánh dấu hoàn thành + feedback (dashboard-stats đếm status completed).
 */
export async function completeInterviewSession(sessionId) {
  if (!hasAuthCredentials() || !sessionId) return { success: false, error: "Thiếu phiên." };
  try {
    const res = await authFetch(`/api/interviews/sessions/${encodeURIComponent(sessionId)}/complete`, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Không kết nối được backend." };
  }
}
