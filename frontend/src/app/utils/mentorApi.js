import { apiUrl } from "./api";
import { authFetch, hasAuthCredentials } from "./auth";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * Danh sách mentor — fetch từ Express + MongoDB (GET /api/mentors).
 */
export async function fetchMentors() {
  const res = await fetch(apiUrl("/api/mentors"), { headers: jsonHeaders });
  if (!res.ok) {
    console.error(`fetchMentors: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  if (data.success && Array.isArray(data.mentors)) {
    return data.mentors;
  }
  console.error("fetchMentors: response không hợp lệ", data);
  return [];
}

/**
 * Một mentor theo id — GET /api/mentors/:id
 */
export async function fetchMentor(id) {
  const res = await fetch(apiUrl(`/api/mentors/${encodeURIComponent(id)}`), {
    headers: jsonHeaders,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`fetchMentor: HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  if (data.success && data.mentor) return data.mentor;
  return null;
}

export async function fetchMentorAvailability(id) {
  const res = await fetch(apiUrl(`/api/mentors/${encodeURIComponent(id)}/availability`), {
    headers: jsonHeaders,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`fetchMentorAvailability: HTTP ${res.status}`);
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (data.success && data.availability) return data.availability;
  return null;
}
/**
 * Đăng ký làm mentor mới — POST /api/mentors/apply
 */
export async function applyAsMentor(data) {
  try {
    const res = await fetch(apiUrl("/api/mentors/apply"), {
      method: "POST",
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${localStorage.getItem("prointerview_access_token")}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: result.error || `Lỗi ${res.status}` };
    }
    return { success: true, message: result.message };
  } catch (err) {
    console.error("applyAsMentor error:", err);
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function updateMyMentorAvailability(payload) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/mentors/me/availability", {
      method: "PATCH",
      headers: {
        ...jsonHeaders,
      },
      body: JSON.stringify(payload ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || `Lỗi ${res.status}` };
    return { success: true, availability: data.availability };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function fetchMyMentorProfile() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", mentor: null };
  try {
    const res = await authFetch("/api/mentors/me", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, mentor: null };
    return { success: true, mentor: body.mentor || null };
  } catch {
    return { success: false, error: "Không kết nối được server.", mentor: null };
  }
}

export async function updateMyMentorProfile(payload) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", mentor: null };
  try {
    const res = await authFetch("/api/mentors/me", {
      method: "PATCH",
      headers: { ...jsonHeaders },
      body: JSON.stringify(payload ?? {}),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, mentor: null };
    return { success: true, mentor: body.mentor || null };
  } catch {
    return { success: false, error: "Không kết nối được server.", mentor: null };
  }
}

export async function fetchMentorDashboard() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/mentor/dashboard", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}` };
    return { success: true, dashboard: body.dashboard || null };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function fetchMentorAnalytics() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", analytics: null };
  try {
    const res = await authFetch("/api/mentor/analytics", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, analytics: null };
    return { success: true, analytics: body.analytics || null };
  } catch {
    return { success: false, error: "Không kết nối được server.", analytics: null };
  }
}

export async function fetchMentorFinance() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", finance: null };
  try {
    const res = await authFetch("/api/mentor/finance", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, finance: null };
    return { success: true, finance: body.finance || null };
  } catch {
    return { success: false, error: "Không kết nối được server.", finance: null };
  }
}

export async function requestMentorPayout(amount) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/mentor/payout", {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify({ amount }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}` };
    return { success: true, payout: body.payout };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function updateMentorPayoutAccount(payload) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/mentor/payout-account", {
      method: "PATCH",
      headers: { ...jsonHeaders },
      body: JSON.stringify(payload ?? {}),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}` };
    return { success: true, payoutAccount: body.payoutAccount || null };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function fetchMentorPeerReviews() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", items: [] };
  try {
    const res = await authFetch("/api/mentor/peer-reviews", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, items: [] };
    return { success: true, items: body.items || [] };
  } catch {
    return { success: false, error: "Không kết nối được server.", items: [] };
  }
}

export async function submitMentorPeerReview(courseId, payload) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch(`/api/mentor/peer-reviews/${encodeURIComponent(courseId)}`, {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify(payload ?? {}),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}` };
    return { success: true, review: body.review || null };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function fetchMentorReviews() {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập.", items: [] };
  try {
    const res = await authFetch("/api/mentor/reviews", {
      method: "GET",
      headers: { ...jsonHeaders },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error || `Lỗi ${res.status}`, items: [] };
    return { success: true, items: body.items || [] };
  } catch {
    return { success: false, error: "Không kết nối được server.", items: [] };
  }
}
