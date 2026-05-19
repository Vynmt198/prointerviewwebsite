/** Pure mappers — testable without Vite import.meta.env */

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

export function mapAnalysisDocToUiResult(doc) {
  if (!doc) return null;
  const r = doc.result || {};
  if (r._ui && typeof r._ui === "object") {
    return { ...r._ui, cvText: r._ui.cvText ?? doc.cvText ?? "", jdText: r._ui.jdText ?? doc.jdText ?? "" };
  }
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

export function buildCvAnalysisSavePayload({
  analysis,
  cvFileName,
  jdFileName,
  analyzeMode,
  selectedField,
  cvStoragePath,
  jdStoragePath,
}) {
  const ui = {
    ...analysis,
    mode: analyzeMode,
    field: selectedField || null,
    cvFileName,
    jdFileName,
    cvStoragePath,
    jdStoragePath,
  };
  return {
    cvText: analysis.cvText || analysis.summary || " ",
    jdText: analysis.jdText || "",
    analysisType: analyzeMode === "jd" ? "match" : "basic",
    cvFileName: cvFileName || "cv",
    jdFileName: jdFileName || "",
    result: { _ui: ui, matchScore: analysis.matchScore, overallSummary: analysis.summary || "" },
  };
}
