import { authFetch, hasAuthCredentials } from "./auth.js";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const ERROR_MESSAGES = {
  UNAUTHENTICATED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  NETWORK: "Không thể kết nối máy chủ. Vui lòng thử lại.",
};

function normalizeApiError(body, status) {
  const raw = String(body?.error || "").trim();
  if (raw) return raw;
  if (status === 401 || status === 403) return ERROR_MESSAGES.UNAUTHENTICATED;
  return `Yêu cầu thất bại (mã ${status}). Vui lòng thử lại.`;
}

function authedFetch(path, options = {}) {
  if (!hasAuthCredentials()) {
    return Promise.resolve({ success: false, error: ERROR_MESSAGES.UNAUTHENTICATED });
  }
  return authFetch(path, {
    ...options,
    headers: { ...jsonHeaders, ...options.headers },
  })
    .then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: normalizeApiError(body, res.status) };
      return { success: true, ...body };
    })
    .catch(() => ({ success: false, error: ERROR_MESSAGES.NETWORK }));
}

export const adminApi = {
  getStats: () => authedFetch("/api/admin/stats"),
  getMentors: () => authedFetch("/api/admin/mentors"),
  updateMentorStatus: (id, isActive) =>
    authedFetch(`/api/admin/mentors/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  rejectMentorApplication: (id, reason) =>
    authedFetch(`/api/admin/mentors/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
  getUsers: () => authedFetch("/api/admin/users"),
  updateUserStatus: (id, isActive) =>
    authedFetch(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  getBookings: () => authedFetch("/api/admin/bookings"),
  getTransactionSupport: () => authedFetch("/api/admin/system/transaction-support"),
  updateBookingStatus: (id, status, reason = "") =>
    authedFetch(`/api/admin/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  confirmBookingTransferPayment: (id, body = {}) =>
    authedFetch(`/api/admin/bookings/${id}/confirm-transfer-payment`, {
      method: "PATCH",
      body: JSON.stringify(body ?? {}),
    }),
  confirmBookingRefund: (id) =>
    authedFetch(`/api/admin/bookings/${id}/confirm-refund`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  getPendingEnrollmentTransfers: () => authedFetch("/api/admin/enrollments/pending-transfer"),
  getCoursePaymentEnrollments: () => authedFetch("/api/admin/enrollments/course-payments"),
  getCourseFinanceSummary: () => authedFetch("/api/admin/finance/courses"),
  confirmEnrollmentTransferPayment: (id, body = {}) =>
    authedFetch(`/api/admin/enrollments/${id}/confirm-transfer-payment`, {
      method: "PATCH",
      body: JSON.stringify(body ?? {}),
    }),
  normalizeTransferRefs: (body = {}) =>
    authedFetch("/api/admin/payments/normalize-transfer-refs", {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  getPayouts: () => authedFetch("/api/admin/payouts"),
  approvePayout: (id, note = "") =>
    authedFetch(`/api/admin/payouts/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    }),
  rejectPayout: (id, reason = "") =>
    authedFetch(`/api/admin/payouts/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
  markPayoutPaid: (id, body = {}) =>
    authedFetch(`/api/admin/payouts/${id}/mark-paid`, {
      method: "PATCH",
      body: JSON.stringify(body ?? {}),
    }),
  getPendingCourses: () => authedFetch("/api/admin/courses/pending"),
  approveCourse: (id) =>
    authedFetch(`/api/admin/courses/${id}/approve`, {
      method: "PATCH",
    }),
  rejectCourse: (id) =>
    authedFetch(`/api/admin/courses/${id}/reject`, {
      method: "PATCH",
    }),
};
