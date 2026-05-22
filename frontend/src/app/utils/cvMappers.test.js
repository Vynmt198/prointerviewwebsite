import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterHighlightKeywords,
  mapAnalysisDocToHistoryItem,
  mapAnalysisDocToUiResult,
  mapPythonCvPipelineToAnalysis,
  buildCvAnalysisSavePayload,
  computeCvRemainingFromQuota,
} from "./cvMappers.js";

const FIELD_PIPELINE_RAW = {
  match: {
    matching: ["react", "python"],
    missing: ["docker", "aws"],
    match_score: 40,
    summary: { cv_total: 5, jd_total: 4 },
  },
  scores: {
    clarity: { score: 7, reason: "Rõ ràng" },
    structure: { score: 6, reason: "OK" },
    relevance: { score: 8, reason: "IT" },
    credibility: { score: 5, reason: "Thiếu số liệu" },
    overall: 6.5,
    summary: "Tóm tắt field",
  },
  suggestions: {
    executive_summary: "Tóm tắt field",
    missing_skill_suggestions: [
      {
        skill: "docker",
        priority: "high",
        reframe_tip: "Học Docker",
        acquisition_path: "Khóa online",
        estimated_effort: "1 tháng",
      },
    ],
    rewritten_bullets: [],
  },
  resume_text: "CV body text",
  jd_text: "",
  field: "IT / Công nghệ",
};

describe("filterHighlightKeywords", () => {
  it("loại bỏ từ 1 ký tự", () => {
    assert.deepEqual(filterHighlightKeywords(["React", "r", "node.js"]), [
      "React",
      "node.js",
    ]);
  });

  it("trả [] khi input null", () => {
    assert.deepEqual(filterHighlightKeywords(null), []);
  });
});

describe("mapPythonCvPipelineToAnalysis", () => {
  it("map pipeline field (không JD)", () => {
    const a = mapPythonCvPipelineToAnalysis(FIELD_PIPELINE_RAW, {
      usedFallback: true,
      field: "IT / Công nghệ",
    });
    assert.equal(a.matchScore, 40);
    assert.equal(a.jdText, "");
    assert.equal(a.field, "IT / Công nghệ");
    assert.equal(a.matchedKeywords.length, 2);
    assert.equal(a.missingKeywords.length, 2);
    assert.ok(a.suggestions.length >= 1);
    assert.equal(a.scoreNotes.clarity, "Rõ ràng");
  });

  it("company luôn null (field mode)", () => {
    const a = mapPythonCvPipelineToAnalysis(FIELD_PIPELINE_RAW, { field: "Marketing" });
    assert.equal(a.company, null);
  });

  it("usedFallback: ghi chú phân tích cơ bản khi không có scores từ LLM", () => {
    const raw = {
      match: { matching: [], missing: [], match_score: 10, summary: {} },
      scores: null,
      suggestions: {},
      resume_text: "",
    };
    const a = mapPythonCvPipelineToAnalysis(raw, { usedFallback: true });
    assert.ok(a.scoreNotes.clarity.includes("cơ bản"));
  });
});

describe("buildCvAnalysisSavePayload", () => {
  it("field mode: basic, jdSource rỗng", () => {
    const analysis = mapPythonCvPipelineToAnalysis(FIELD_PIPELINE_RAW, {
      field: "IT / Công nghệ",
    });
    const payload = buildCvAnalysisSavePayload({
      analysis,
      cvFileName: "cv.pdf",
      jdFileName: "",
      analyzeMode: "field",
      selectedField: "IT / Công nghệ",
    });
    assert.equal(payload.analysisType, "basic");
    assert.equal(payload.jdSource, "");
    assert.equal(payload.jdText, "");
    assert.equal(payload.result._ui.mode, "field");
    assert.equal(payload.result._ui.field, "IT / Công nghệ");
    assert.ok(payload.result._ui.matchScore === 40);
  });

  it("jd mode: match + jdSource", () => {
    const payload = buildCvAnalysisSavePayload({
      analysis: {
        matchScore: 80,
        summary: "ok",
        cvText: "c",
        jdText: "j",
        matchedKeywords: ["a"],
        suggestions: [{ title: "tip" }],
      },
      cvFileName: "c.pdf",
      jdFileName: "j.pdf",
      analyzeMode: "jd",
      jdSource: "file",
    });
    assert.equal(payload.analysisType, "match");
    assert.equal(payload.jdSource, "file");
  });
});

describe("mapAnalysisDocToHistoryItem / mapAnalysisDocToUiResult", () => {
  it("giữ mode field khi không có jdText", () => {
    const doc = {
      _id: "abc123",
      cvText: "text",
      jdText: "",
      cvFileName: "cv.pdf",
      createdAt: "2026-01-01T00:00:00.000Z",
      result: {
        _ui: {
          mode: "field",
          field: "Marketing",
          matchScore: 55,
          matchedKeywords: ["seo"],
        },
        matchScore: 55,
      },
    };
    const item = mapAnalysisDocToHistoryItem(doc);
    assert.equal(item.mode, "field");
    assert.equal(item.field, "Marketing");
    assert.equal(item.analysisId, "abc123");
    assert.equal(item.hasJdFile, false);

    const ui = mapAnalysisDocToUiResult(doc);
    assert.equal(ui.mode, "field");
    assert.equal(ui.matchScore, 55);
    assert.deepEqual(ui.matchedKeywords, ["seo"]);
  });

  it("round-trip: save payload _ui đọc lại được", () => {
    const analysis = mapPythonCvPipelineToAnalysis(FIELD_PIPELINE_RAW, {
      field: "IT / Công nghệ",
    });
    const payload = buildCvAnalysisSavePayload({
      analysis,
      cvFileName: "cv.pdf",
      analyzeMode: "field",
      selectedField: "IT / Công nghệ",
    });
    const doc = {
      _id: "id1",
      cvText: payload.cvText,
      jdText: payload.jdText,
      cvFileName: payload.cvFileName,
      result: payload.result,
    };
    const ui = mapAnalysisDocToUiResult(doc);
    assert.equal(ui.matchScore, 40);
    assert.equal(ui.cvText, "CV body text");
  });
});

describe("computeCvRemainingFromQuota", () => {
  it("returns limit minus used for free plan", () => {
    assert.equal(
      computeCvRemainingFromQuota(
        { cvAnalysisLimit: 3, cvAnalysisUsed: 1 },
        "free",
      ),
      2,
    );
  });

  it("returns Infinity for elite_pro", () => {
    assert.equal(
      computeCvRemainingFromQuota(
        { cvAnalysisLimit: 3, cvAnalysisUsed: 3 },
        "elite_pro",
      ),
      Number.POSITIVE_INFINITY,
    );
  });

  it("returns 0 when used equals limit on free plan", () => {
    assert.equal(
      computeCvRemainingFromQuota(
        { cvAnalysisLimit: 3, cvAnalysisUsed: 3 },
        "free",
      ),
      0,
    );
  });

  it("never returns negative remaining", () => {
    assert.equal(
      computeCvRemainingFromQuota(
        { cvAnalysisLimit: 2, cvAnalysisUsed: 99 },
        "free",
      ),
      0,
    );
  });
});
