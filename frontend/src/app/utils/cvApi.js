/**
 * CV analyses — Express `/api/cv/*` (thay Supabase Edge cho lịch sử khi đã đăng nhập).
 */
import { authFetch, hasAuthCredentials } from "./auth.js";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/** Map document Mongo → item trong tab lịch sử CVAnalysis. */
export function mapAnalysisDocToHistoryItem(doc) {
  if (!doc) return null;
  const r = doc.result || {};
  const ui = r._ui && typeof r._ui === "object" ? r._ui : r;
  return {
    analysisId: String(doc._id || doc.id || ""),
    mode: doc.jdText ? "jd" : ui.mode || "field",
    field: ui.field || null,
    company: ui.company || null,
    position: ui.position || null,
    cvFileName: doc.cvFileName || ui.cvFileName || "cv",
    jdFileName: doc.jdFileName || ui.jdFileName || null,
    matchScore: ui.matchScore ?? r.matchScore ?? 0,
    createdAt: doc.createdAt || new Date().toISOString(),
    hasCvFile: !!(doc.cvFileName || doc.cvFileUrl),
    hasJdFile: !!(doc.jdFileName || doc.jdText),
    cvStoragePath: ui.cvStoragePath || null,
    jdStoragePath: ui.jdStoragePath || null,
  };
}

/** Map document Mongo → object hiển thị kết quả phân tích. */
export function mapAnalysisDocToUiResult(doc) {
  if (!doc) return null;
  const r = doc.result || {};
  if (r._ui && typeof r._ui === "object") return { ...r._ui };
  return {
    matchScore: r.matchScore ?? 0,
    totalKeywords: (r.missingKeywords?.length || 0) + (r.matchStrengths?.length || 0),
    matchedKeywords: r.matchStrengths || r.topStrengths || [],
    missingKeywords: r.missingKeywords || r.areasToImprove || [],
    strengths: r.matchStrengths || r.topStrengths || [],
    weaknesses: r.matchWeaknesses || r.areasToImprove || [],
    suggestions: r.recommendations?.map((t) => ({
      type: "add",
      priority: "medium",
      title: t,
      reason: "",
    })) || [],
    summary: r.overallSummary || "",
    cvText: doc.cvText || "",
    jdText: doc.jdText || "",
  };
}

/** Payload lưu sau phân tích Python / UI. */
export function buildCvAnalysisSavePayload({
  analysis,
  cvFileName,
  jdFileName,
  analyzeMode,
  selectedField,
  cvStoragePath,
  jdStoragePath,
}) {
  const ui = { ...analysis, mode: analyzeMode, field: selectedField || null, cvFileName, jdFileName, cvStoragePath, jdStoragePath };
  return {
    cvText: analysis.cvText || analysis.summary || " ",
    jdText: analysis.jdText || "",
    analysisType: analyzeMode === "jd" ? "match" : "basic",
    cvFileName: cvFileName || "cv",
    jdFileName: jdFileName || "",
    result: { _ui: ui, matchScore: analysis.matchScore, overallSummary: analysis.summary || "" },
  };
}

export async function fetchCvQuota() {
  if (!hasAuthCredentials()) return { success: false, quota: null };
  try {
    const res = await authFetch("/api/cv/quota", { method: "GET", headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.error, quota: null };
    return { success: true, quota: body.quota };
  } catch {
    return { success: false, quota: null };
  }
}

export async function fetchCvAnalyses() {
  if (!hasAuthCredentials()) {
    return { success: false, error: "Chưa đăng nhập.", analyses: [] };
  }
  try {
    const res = await authFetch("/api/cv/analyses", { method: "GET", headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: body.error || `Lỗi ${res.status}`, analyses: [] };
    }
    const raw = body.list || body.analyses || [];
    return {
      success: true,
      analyses: raw.map(mapAnalysisDocToHistoryItem).filter(Boolean),
    };
  } catch {
    return { success: false, error: "Không kết nối được server.", analyses: [] };
  }
}

export async function fetchCvAnalysisById(id) {
  if (!hasAuthCredentials()) {
    return { success: false, error: "Chưa đăng nhập." };
  }
  try {
    const res = await authFetch(`/api/cv/analyses/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    const doc = body.analysis;
    return {
      success: true,
      historyItem: mapAnalysisDocToHistoryItem(doc),
      analysis: mapAnalysisDocToUiResult(doc),
      analysisId: String(doc?._id || id),
    };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function saveCvAnalysis(payload) {
  if (!hasAuthCredentials()) {
    return { success: false, error: "Chưa đăng nhập." };
  }
  try {
    const res = await authFetch("/api/cv/analyses", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    const doc = body.analysis;
    return {
      success: true,
      analysisId: String(doc?._id || ""),
      historyItem: mapAnalysisDocToHistoryItem(doc),
    };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}

export async function deleteCvAnalysis(id) {
  if (!hasAuthCredentials()) {
    return { success: false, error: "Chưa đăng nhập." };
  }
  try {
    const res = await authFetch(`/api/cv/analyses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: body.error || `Lỗi ${res.status}` };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Không kết nối được server." };
  }
}
