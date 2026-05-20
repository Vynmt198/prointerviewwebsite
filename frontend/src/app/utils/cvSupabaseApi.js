/**
 * CV Analysis — Supabase Edge (`make-server-64a0c849`)
 * Phân tích + lịch sử qua Gemini, lưu KV + Storage (luồng gốc của team).
 */
import { projectId } from "/utils/supabase/info.js";

const EDGE_FN = "make-server-64a0c849";

export function isSupabaseCvConfigured() {
  return Boolean(projectId && String(projectId).trim());
}

export function supabaseEdgeUrl(path) {
  if (!isSupabaseCvConfigured()) {
    throw new Error("Thiếu VITE_SUPABASE_PROJECT_ID trong .env.local");
  }
  const base = `https://${projectId}.supabase.co/functions/v1/${EDGE_FN}`;
  return `${base}/${path.replace(/^\//, "")}`;
}

function getSessionId() {
  const key = "prointerview_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Chỉ Authorization (+ X-Session-Id). Không gửi apikey — CORS Edge chặn. */
export function supabaseApiHeaders(userToken) {
  const headers = { "X-Session-Id": getSessionId() };
  const t = userToken ?? "";
  if (t && t !== "null" && t !== "undefined" && t.length > 20) {
    headers.Authorization = `Bearer ${t}`;
  }
  return headers;
}

export function buildAnalyzeFormData({
  cvFile,
  reuseCV,
  jdFile,
  reuseJD,
  analyzeMode,
  selectedField,
}) {
  const fd = new FormData();
  if (cvFile) fd.append("cv", cvFile);
  else if (reuseCV?.path) fd.append("cvPath", reuseCV.path);
  if (analyzeMode === "jd") {
    if (jdFile) fd.append("jd", jdFile);
    else if (reuseJD?.path) fd.append("jdPath", reuseJD.path);
  }
  fd.append("mode", analyzeMode);
  if (selectedField) fd.append("field", selectedField);
  return fd;
}

export async function fetchCvAnalysesSupabase(token) {
  const res = await fetch(supabaseEdgeUrl("cv/analyses"), {
    headers: supabaseApiHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || `Lỗi ${res.status}`, analyses: [] };
  }
  return { success: true, analyses: data.analyses ?? [] };
}

export async function fetchCvAnalysisByIdSupabase(id, token) {
  const res = await fetch(supabaseEdgeUrl(`cv/analyses/${encodeURIComponent(id)}`), {
    headers: supabaseApiHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || `Lỗi ${res.status}` };
  }
  return {
    success: true,
    record: data.record,
    cvSignedUrl: data.cvSignedUrl,
    jdSignedUrl: data.jdSignedUrl,
  };
}

export async function deleteCvAnalysisSupabase(id, token) {
  const res = await fetch(supabaseEdgeUrl(`cv/analyses/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: supabaseApiHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || `Lỗi ${res.status}` };
  }
  return { success: true };
}

/** POST cv-analysis — Gemini + lưu KV/Storage trong một lần gọi */
export async function analyzeCvSupabase(formData, token) {
  const res = await fetch(supabaseEdgeUrl("cv-analysis"), {
    method: "POST",
    headers: supabaseApiHeaders(token),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
