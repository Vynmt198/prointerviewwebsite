/**
 * CV analyses — Express `/api/cv/*`
 */
import { authFetch, hasAuthCredentials } from "./auth.js";
import {
  mapAnalysisDocToHistoryItem,
  mapAnalysisDocToUiResult,
} from "./cvMappers.js";

export {
  mapAnalysisDocToHistoryItem,
  mapAnalysisDocToUiResult,
  buildCvAnalysisSavePayload,
  mapPythonCvPipelineToAnalysis,
  filterHighlightKeywords,
  computeCvRemainingFromQuota,
} from "./cvMappers.js";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

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
