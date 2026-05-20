/** Pure mappers — testable without Vite import.meta.env */

function extractSkillFromTitle(title) {
  const m = String(title || "").match(/Bổ sung kỹ năng "(.+?)"/);
  return m ? m[1] : String(title || "").trim();
}

/** Python scorer trả 0–10; API MongoDB/DTO dùng 0–5. */
function normalizeDimensionScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n > 5) return Math.min(5, Math.round((n / 10) * 5 * 10) / 10);
  return Math.min(5, Math.max(0, n));
}

export function mapAnalysisDocToHistoryItem(doc) {
  if (!doc) return null;
  const r = doc.result || {};
  const match = r.match || {};
  return {
    analysisId: String(doc._id || doc.id || ""),
    mode: doc.mode || (doc.jdFileName ? "jd" : "field"),
    field: doc.field || r._ui?.field || null,
    company: doc.company || r._ui?.company || null,
    position: doc.position || r._ui?.position || null,
    cvFileName: doc.cvFileName || "cv",
    jdFileName: doc.jdFileName || null,
    matchScore: match.score ?? r.matchScore ?? r._ui?.matchScore ?? 0,
    createdAt: doc.createdAt || new Date().toISOString(),
    hasCvFile: !!(doc.cvFileName || doc.cvFileUrl),
    hasJdFile: !!(doc.jdFileName || doc.jdText),
    cvStoragePath: r._ui?.cvStoragePath || null,
    jdStoragePath: r._ui?.jdStoragePath || null,
  };
}

export function mapAnalysisDocToUiResult(doc) {
  if (!doc) return null;
  const r = doc.result || {};
  if (r._ui && typeof r._ui === "object" && r._ui.matchedKeywords) {
    return { ...r._ui, cvText: r._ui.cvText ?? doc.cvText ?? "", jdText: r._ui.jdText ?? doc.jdText ?? "" };
  }

  const match = r.match || {};
  const matched = match.matchedKeywords || r.matchStrengths || [];
  const missing = match.missingKeywords || r.areasToImprove || [];
  const scores = r.scores || null;
  const sugg = r.suggestions || {};

  const strengths =
    matched.length > 0
      ? matched.slice(0, 8).map((sk) => `Có kỹ năng "${sk}" phù hợp với yêu cầu JD`)
      : r.matchStrengths || r.topStrengths || [];

  const weaknesses =
    missing.length > 0
      ? missing.slice(0, 8).map((sk) => `Thiếu kỹ năng "${sk}" mà JD yêu cầu`)
      : r.matchWeaknesses || r.areasToImprove || [];

  const bulletSuggestions = (sugg.rewrittenBullets || []).map((b) => ({
    type: "fix",
    priority: "medium",
    title: `Cải thiện bullet: "${String(b.original ?? "").slice(0, 65)}${String(b.original ?? "").length > 65 ? "…" : ""}"`,
    reason: b.reasoning || b.changes_made?.join?.(" · ") || "",
    before: b.original ?? "",
    after: b.rewritten ?? "",
    keywordsAdded: b.keywords_added || [],
    starCheck: b.star_check || b.starElements || {},
    confidence: b.confidence ?? "medium",
  }));

  const missSuggestions = (sugg.missingSkillSuggestions || []).map((item) => ({
    type: "add",
    priority: item.priority || "medium",
    title: `Bổ sung kỹ năng "${item.skill}"`,
    reason: item.reason || item.reframe_tip || "",
    before: `Chưa có trong CV${item.estimatedTimeWeeks ? ` — ~${item.estimatedTimeWeeks} tuần` : ""}`,
    after: item.resources?.[0] || item.acquisition_path || item.reason || "",
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  }));

  return {
    matchScore: match.score ?? r.matchScore ?? 0,
    overallScore: scores
      ? Math.round(
          ((Number(scores.clarity) + Number(scores.structure) + Number(scores.relevance) + Number(scores.credibility)) /
            4) *
            10,
        )
      : match.score ?? 0,
    totalKeywords: matched.length + missing.length,
    matchedKeywords: matched,
    missingKeywords: missing,
    scores: scores
      ? {
          clarity: normalizeDimensionScore(scores.clarity) * 2,
          structure: normalizeDimensionScore(scores.structure) * 2,
          relevance: normalizeDimensionScore(scores.relevance) * 2,
          credibility: normalizeDimensionScore(scores.credibility) * 2,
        }
      : {},
    scoreNotes: {},
    strengths,
    weaknesses,
    suggestions: [...bulletSuggestions, ...missSuggestions],
    summary: sugg.executiveSummary || r.overallSummary || "",
    cvText: doc.cvText || "",
    jdText: doc.jdText || "",
  };
}

/** Payload POST /api/cv/analyses — khớp cvAnalysis.dto.js */
export function buildCvAnalysisSavePayload({
  analysis,
  cvFileName,
  jdFileName,
  analyzeMode,
  tier = "suggestions",
  planAtTime = "free",
  meta = {},
}) {
  const matched = analysis.matchedKeywords || [];
  const missing = analysis.missingKeywords || [];
  const fixItems = (analysis.suggestions || []).filter((s) => s.type === "fix");
  const addItems = (analysis.suggestions || []).filter((s) => s.type === "add");

  const payload = {
    cvFileName: cvFileName || "cv.pdf",
    jdFileName: jdFileName || "",
    mode: analyzeMode === "jd" ? "jd" : "field",
    tier,
    planAtTime,
    meta: {
      llmProvider: "unknown",
      fallbackTriggered: false,
      ...meta,
    },
    result: {
      matchScore: Number(analysis.matchScore) || 0,
      matchedKeywords: matched,
      missingKeywords: missing,
      skills: {
        cv: matched.map((name) => ({ name: String(name) })),
        jd: [...matched, ...missing].map((name) => ({ name: String(name) })),
        matched,
        missing,
      },
    },
  };

  if (tier !== "basic" && analysis.scores && Object.keys(analysis.scores).length > 0) {
    payload.result.scores = {
      clarity: normalizeDimensionScore(analysis.scores.clarity),
      structure: normalizeDimensionScore(analysis.scores.structure),
      relevance: normalizeDimensionScore(analysis.scores.relevance),
      credibility: normalizeDimensionScore(analysis.scores.credibility),
    };
  }

  if (tier === "suggestions") {
    payload.result.suggestions = {
      rewrittenBullets: fixItems.map((s) => ({
        original: s.before || "",
        rewritten: s.after || "",
        reasoning: s.reason || "",
        starElements: {
          situation: !!s.starCheck?.situation,
          task: !!s.starCheck?.task,
          action: !!s.starCheck?.action,
          result: !!s.starCheck?.result,
        },
      })),
      missingSkillSuggestions: addItems.map((s) => ({
        skill: extractSkillFromTitle(s.title),
        priority: s.priority || "medium",
        reason: s.reason || "",
        resources: s.after ? [String(s.after)] : [],
      })),
      executiveSummary: analysis.summary || "",
    };
  }

  return payload;
}
