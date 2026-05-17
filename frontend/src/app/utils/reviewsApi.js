import { authFetch } from "./auth";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export async function submitReview(payload) {
  try {
    const res = await authFetch("/api/reviews", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || `Lỗi ${res.status}` };
    return { success: true, review: data.review };
  } catch (err) {
    return { success: false, error: "Lỗi kết nối máy chủ" };
  }
}

export async function fetchTargetReviews(targetType, targetId) {
  try {
    const res = await authFetch(`/api/reviews?targetType=${targetType}&targetId=${targetId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || `Lỗi ${res.status}` };
    return { success: true, reviews: data.reviews || [] };
  } catch (err) {
    return { success: false, error: "Lỗi kết nối máy chủ" };
  }
}
