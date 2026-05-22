/** Pure mappers — testable without Vite import.meta.env */

/** Bỏ từ khóa 1 ký tự (vd. "r") — tránh highlight sai trong PDF */
export function filterHighlightKeywords(list) {
  if (!list) return [];
  const arr = Array.isArray(list) ? list : [];
  return arr.map((k) => String(k ?? "").trim()).filter((k) => k.length >= 2);
}

/** Số lượt CV còn lại từ quota API (elite = không giới hạn). */
export function computeCvRemainingFromQuota(quota, planKey) {
  if (planKey === "elite_pro") return Number.POSITIVE_INFINITY;
  if (!quota) return 0;
  const limit = Number(quota.cvAnalysisLimit) || 3;
  const used = Number(quota.cvAnalysisUsed) || 0;
  return Math.max(0, limit - used);
}

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

/** Map response Python (/analyze/*) → object analysis cho UI */
export function mapPythonCvPipelineToAnalysis(raw, { usedFallback = false, field = null } = {}) {
  const m = raw.match ?? {};
  const s = raw.scores ?? null;
  const sugg = raw.suggestions ?? {};

  const matchedSkills = m.matching ?? [];
  const missingSkills = m.missing ?? [];

  const strengths =
    sugg.strengths ??
    matchedSkills.slice(0, 6).map((sk) => `Có kỹ năng "${sk}" phù hợp với yêu cầu`);
  const weaknesses =
    sugg.weaknesses ??
    missingSkills.slice(0, 6).map((sk) => `Thiếu kỹ năng "${sk}" cần bổ sung`);

  const bulletSuggestions = (sugg.rewritten_bullets ?? []).map((b) => ({
    type: "fix",
    priority: b.confidence === "high" ? "high" : b.confidence === "low" ? "low" : "medium",
    title: `Cải thiện bullet: "${(b.original ?? "").slice(0, 65)}${(b.original ?? "").length > 65 ? "…" : ""}"`,
    reason: b.changes_made?.length ? b.changes_made.join(" · ") : "Viết lại theo chuẩn STAR.",
    before: b.original ?? "",
    after: b.rewritten ?? "",
    keywordsAdded: b.keywords_added ?? [],
    starCheck: b.star_check ?? {},
    confidence: b.confidence ?? "medium",
  }));

  const missSuggestions = (sugg.missing_skill_suggestions ?? []).map((item) => ({
    type: "add",
    priority: item.priority,
    title: `Bổ sung kỹ năng "${item.skill}"`,
    reason:
      item.reframe_tip && item.reframe_tip !== "N/A" ? item.reframe_tip : item.acquisition_path,
    before: `Chưa có trong CV — ước tính ${item.estimated_effort ?? "không rõ"}`,
    after: item.acquisition_path,
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  }));

  const jdTotal = m.summary?.jd_total ?? matchedSkills.length + missingSkills.length;

  return {
    matchScore: Math.round(m.match_score ?? 0),
    overallScore: Math.round((s?.overall ?? 0) * 10),
    totalKeywords: m.summary?.jd_total ?? jdTotal,
    matchedKeywords: matchedSkills,
    missingKeywords: missingSkills,
    scores: {
      clarity: s?.clarity?.score ?? 0,
      structure: s?.structure?.score ?? 0,
      relevance: s?.relevance?.score ?? Math.round((m.match_score ?? 0) / 10),
      credibility: s?.credibility?.score ?? 0,
    },
    scoreNotes: {
      clarity:
        s?.clarity?.reason ??
        (usedFallback ? "Phân tích cơ bản — không có điểm AI chi tiết." : ""),
      structure:
        s?.structure?.reason ??
        (usedFallback ? "Phân tích cơ bản — không có điểm AI chi tiết." : ""),
      relevance:
        s?.relevance?.reason ??
        (usedFallback ? `Ước tính từ kỹ năng ngành: ${Math.round(m.match_score ?? 0)}%` : ""),
      credibility:
        s?.credibility?.reason ??
        (usedFallback ? "Phân tích cơ bản — không có điểm AI chi tiết." : ""),
    },
    strengths,
    weaknesses,
    suggestions: [...bulletSuggestions, ...missSuggestions],
    summary: sugg.executive_summary ?? s?.summary ?? "",
    cvText: raw.resume_text ?? "",
    jdText: raw.jd_text ?? "",
    position: raw.position ?? null,
    company: null,
    field: field ?? raw.field ?? null,
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
