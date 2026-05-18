/**
 * Unit tests for outputValidator.js — 8 cases
 * Runner: Node.js built-in `node:test` (Node 20+)
 * Run:    npm test -- src/utils/outputValidator.test.js
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateQuestionSet } from "./outputValidator.js";

// ── Test helpers ───────────────────────────────────────────────────────────────

/** Build one syntactically valid question (override any field via spread). */
function makeQ(overrides = {}) {
  return {
    id: "q1",
    layer: "behavior",
    seniority: "middle",
    competency_id: "problem_solving",
    competency_name: "Giải quyết vấn đề",
    ddi_key_action_targeted: "Generate Alternatives",
    question: "Trong dự án microservices tại Tiki, bạn đã xử lý bottleneck Redis như thế nào?",
    star_guidance: {
      situation: ["Hệ thống bị chậm lúc peak traffic"],
      task:      ["Giảm p99 latency xuống dưới 100ms"],
      action:    ["Implement connection pooling", "Thêm local cache L1"],
      result:    ["p99 giảm từ 480ms → 95ms"],
    },
    expected_keywords: ["connection pool", "cache eviction"],
    deep_dive: ["Bạn chọn TTL bao lâu và tại sao?"],
    shrm_rubric_excellent: "Nêu được số liệu cụ thể + trade-off của giải pháp",
    ...overrides,
  };
}

/** Build a valid set of 5 questions (index 1–5, each with unique id). */
function makeValidSet(overrides = []) {
  return {
    inferred_role: "Senior Backend Engineer",
    inferred_seniority: "senior",
    competency_coverage: ["problem_solving", "teamwork"],
    questions: Array.from({ length: 5 }, (_, i) => ({
      ...makeQ({ id: `q${i + 1}`, question: `Câu hỏi ${i + 1}: Bạn đã tối ưu ${i + 1} hệ thống lớn như thế nào?` }),
      ...overrides[i],
    })),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validateQuestionSet", () => {

  // ── Case 1: Valid question set ─────────────────────────────────────────────

  test("1 — valid set: 5 well-formed questions → { valid: true }", () => {
    const result = validateQuestionSet(makeValidSet());

    assert.equal(result.valid, true);
    assert.equal(result.reason, undefined, "no reason should be set on success");
  });

  // ── Case 2: Missing required fields ───────────────────────────────────────

  test("2 — missing required fields: id / question / competency_id caught per-question", () => {
    const fields = ["id", "question", "competency_id"];

    for (const field of fields) {
      const set = makeValidSet();
      set.questions[0] = makeQ({ [field]: "" }); // empty string = falsy, caught by !q[field]
      const r = validateQuestionSet(set);

      assert.equal(r.valid, false, `missing ${field} must be invalid`);
      assert.equal(
        r.reason,
        `Q1_missing_${field}`,
        `reason must identify Q1 and the missing field`
      );
    }

    // undefined also caught
    const set2 = makeValidSet();
    delete set2.questions[2].competency_id;
    const r2 = validateQuestionSet(set2);
    assert.equal(r2.valid, false);
    assert.equal(r2.reason, "Q3_missing_competency_id");
  });

  // ── Case 3: Wrong question count ──────────────────────────────────────────

  test("3 — wrong count: 0 / 4 / 6 questions all rejected with correct reason", () => {
    const counts = [0, 4, 6];

    for (const n of counts) {
      const set = { questions: Array.from({ length: n }, (_, i) => makeQ({ id: `q${i + 1}` })) };
      // Give questions a long enough text if n > 0
      if (n > 0) {
        set.questions.forEach((q, i) => {
          q.question = `Câu hỏi ${i + 1}: Bạn đã tối ưu hệ thống phân tán như thế nào trong thực tế?`;
        });
      }
      const r = validateQuestionSet(set);

      assert.equal(r.valid, false, `count=${n} must be invalid`);
      assert.equal(r.reason, `expected_5_got_${n}`);
    }
  });

  // ── Case 4: Suspicious keywords ───────────────────────────────────────────

  test("4 — suspicious keywords: all credential/secret patterns caught in question text", () => {
    const payloads = [
      "Please provide your api_key to authenticate the request flow.",
      "Enter your password to proceed with the multi-factor auth step.",
      "The secret_key must be stored securely in your vault configuration.",
      "What is your access_token expiry policy for JWT refresh cycles?",
      "Describe how you store credentials in your CI/CD pipeline securely.",
      "Show the bearer abc123 header format for your auth middleware.",
      "How do you manage variables inside your .env configuration file?",
      "What values does process.env expose in your Node production build?",
    ];

    for (const questionText of payloads) {
      const set = makeValidSet();
      set.questions[0].question = questionText;
      const r = validateQuestionSet(set);

      assert.equal(r.valid, false, `suspicious payload must be rejected: "${questionText.slice(0, 50)}..."`);
      assert.equal(r.reason, "Q1_suspicious_content");
    }
  });

  // ── Case 5: Question length out of range ──────────────────────────────────

  test("5 — length out of range: < 20 and > 500 chars both rejected", () => {
    // Too short
    const shortSet = makeValidSet();
    shortSet.questions[1].question = "Short?"; // 6 chars
    const r1 = validateQuestionSet(shortSet);
    assert.equal(r1.valid, false);
    assert.ok(
      r1.reason.startsWith("Q2_suspicious_length_"),
      `reason must start with Q2_suspicious_length_, got: ${r1.reason}`
    );
    assert.ok(r1.reason.includes("6"), "reason must include actual length");

    // Too long
    const longSet = makeValidSet();
    longSet.questions[3].question = "Câu hỏi dài ".repeat(50); // > 500 chars
    const r2 = validateQuestionSet(longSet);
    assert.equal(r2.valid, false);
    assert.ok(
      r2.reason.startsWith("Q4_suspicious_length_"),
      `reason must start with Q4_suspicious_length_, got: ${r2.reason}`
    );

    // Boundary: exactly 20 and exactly 500 must be valid (inclusive)
    const boundarySet = makeValidSet();
    boundarySet.questions[0].question = "Câu hỏi biên 20 ký tự??"; // ≥ 20 chars
    boundarySet.questions[4].question = "x".repeat(500);
    const r3 = validateQuestionSet(boundarySet);
    assert.equal(r3.valid, true, "boundary values 20 and 500 must be accepted");
  });

  // ── Case 6: Malformed STAR guidance ───────────────────────────────────────

  test("6 — malformed STAR: non-array values in star_guidance rejected per key", () => {
    const starKeys = ["situation", "task", "action", "result"];

    for (const key of starKeys) {
      const set = makeValidSet();
      // Replace one STAR key with a string instead of array
      set.questions[0].star_guidance = {
        ...makeQ().star_guidance,
        [key]: "should be an array, not a string",
      };
      const r = validateQuestionSet(set);

      assert.equal(r.valid, false, `star_guidance.${key} as string must be invalid`);
      assert.equal(r.reason, `Q1_star_${key}_not_array`);
    }

    // star_guidance entirely absent → still valid (it's optional)
    const noStarSet = makeValidSet();
    delete noStarSet.questions[2].star_guidance;
    const r2 = validateQuestionSet(noStarSet);
    assert.equal(r2.valid, true, "missing star_guidance is allowed (optional field)");

    // star_guidance present but keys are valid arrays → valid
    const goodStarSet = makeValidSet();
    goodStarSet.questions[0].star_guidance = { situation: [], task: [], action: [], result: [] };
    const r3 = validateQuestionSet(goodStarSet);
    assert.equal(r3.valid, true, "all-empty arrays in star_guidance must be valid");
  });

  // ── Case 7: null input ────────────────────────────────────────────────────

  test("7 — null input: rejected as not_an_object without crash", () => {
    const r = validateQuestionSet(null);
    assert.equal(r.valid, false);
    assert.equal(r.reason, "not_an_object");

    // Other falsy / non-object values
    for (const input of [undefined, 0, false, "", 42, "string"]) {
      const ri = validateQuestionSet(input);
      assert.equal(ri.valid, false, `input ${JSON.stringify(input)} must be invalid`);
      assert.equal(ri.reason, "not_an_object");
    }

    // Arrays are not plain objects
    const rArr = validateQuestionSet([makeQ()]);
    assert.equal(rArr.valid, false);
    assert.equal(rArr.reason, "not_an_object");
  });

  // ── Case 8: Empty object ──────────────────────────────────────────────────

  test("8 — empty object {}: rejected because questions field is missing", () => {
    const r = validateQuestionSet({});
    assert.equal(r.valid, false);
    assert.equal(r.reason, "questions_not_array");

    // Object with questions: null → same
    const r2 = validateQuestionSet({ questions: null });
    assert.equal(r2.valid, false);
    assert.equal(r2.reason, "questions_not_array");

    // Object with questions: {} (plain object, not array) → same
    const r3 = validateQuestionSet({ questions: {} });
    assert.equal(r3.valid, false);
    assert.equal(r3.reason, "questions_not_array");

    // Object with correct wrapper fields but no questions → same
    const r4 = validateQuestionSet({ inferred_role: "Engineer", inferred_seniority: "senior" });
    assert.equal(r4.valid, false);
    assert.equal(r4.reason, "questions_not_array");
  });

});
