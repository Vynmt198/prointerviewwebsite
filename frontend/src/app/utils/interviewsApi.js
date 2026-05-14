import { authFetch, hasAuthCredentials } from "./auth.js";
import { apiUrl } from "./api.js";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * Tạo phiên phỏng vấn AI, attach competencyProfile + questions vào session ngay khi tạo.
 * @param {string} hrGender
 * @param {{ questions?, inferredRole?, inferredSeniority?, competencyProfile?, coverageScore? }} sessionData
 */
export async function createInterviewSession(hrGender = "female", sessionData = {}) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/interviews/sessions", {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify({
        hrGender: hrGender === "male" ? "male" : "female",
        ...sessionData,
      }),
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
 * Sinh 5 câu hỏi phỏng vấn cá nhân hóa từ CV + JD qua LLM.
 * @param {{ cvText?, jdText?, position?, field?, level? }} params
 * @returns {{ success, questions, inferredRole, inferredSeniority, coverageScore }}
 */
export async function generateInterviewQuestions({ cvText = "", jdText = "", position = "", field = "", level = "" } = {}) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const res = await authFetch("/api/interviews/generate-questions", {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify({ cvText, jdText, position, field, level }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    return { success: true, questions: body.questions, inferredRole: body.inferredRole, inferredSeniority: body.inferredSeniority, coverageScore: body.coverageScore };
  } catch {
    return { success: false, error: "Không kết nối được backend." };
  }
}

/**
 * Trích xuất text thuần từ file PDF CV qua Python service.
 * @param {File} file - File object từ input[type=file]
 * @returns {{ success, text, pageCount }}
 */
export async function extractCvTextFromFile(file) {
  if (!hasAuthCredentials()) return { success: false, error: "Chưa đăng nhập." };
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await authFetch("/api/interviews/extract-cv-text", {
      method: "POST",
      body: formData,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    return { success: true, text: body.text, pageCount: body.pageCount };
  } catch {
    return { success: false, error: "Không kết nối được backend." };
  }
}

/**
 * Gửi transcripts lên backend để LLM đánh giá theo chuẩn SHRM/DDI.
 * @param {string} sessionId
 * @param {{ questionIndex: number, transcript: string }[]} answers
 * @returns {{ success, evaluation, overallScore, generalComment, inferredRole, totalDurationSeconds }}
 */
export async function evaluateInterviewSession(sessionId, answers = []) {
  if (!hasAuthCredentials() || !sessionId) return { success: false, error: "Thiếu phiên." };
  try {
    const res = await authFetch(`/api/interviews/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
      method: "POST",
      headers: { ...jsonHeaders },
      body: JSON.stringify({ answers }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    return {
      success:        true,
      evaluation:     body.evaluation,
      overallScore:   body.overallScore,
      generalComment: body.generalComment,
      inferredRole:   body.inferredRole,
      totalDurationSeconds: body.totalDurationSeconds,
    };
  } catch {
    return { success: false, error: "Không kết nối được backend." };
  }
}

/**
 * Lưu câu trả lời cho 1 câu hỏi vào session đang diễn ra.
 * Gọi sau mỗi lần user chuyển câu. Fire-and-forget từ client.
 * Route: PATCH /api/interviews/sessions/:id
 */
export async function saveAnswer(sessionId, { questionIndex, questionText, transcript, durationSeconds }) {
  if (!hasAuthCredentials() || !sessionId) return { success: false };
  try {
    const res = await authFetch(`/api/interviews/sessions/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: { ...jsonHeaders },
      body: JSON.stringify({ questionIndex, questionText, transcript, durationSeconds }),
    });
    const body = await res.json().catch(() => ({}));
    return res.ok && body.success ? { success: true } : { success: false };
  } catch {
    return { success: false };
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
