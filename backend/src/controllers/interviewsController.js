import { InterviewSession } from "../models/InterviewSession.js";
import { User } from "../models/User.js";
import {
  generateQuestionsFromText,
  computeCoverage,
  extractPDFText,
  evaluateTranscripts,
} from "../services/interviewQuestionService.js";

// ── Accumulation helper ───────────────────────────────────────────────────────
/**
 * Lấy few-shot examples từ MongoDB: câu hỏi chất lượng cao từ sessions cùng role/competency.
 * Trả về mảng string câu hỏi — inject vào LLM prompt để "học" từ data thực tế.
 * Ban đầu trả [] (chưa có data), tự cải thiện khi user dùng nhiều.
 */
async function getFewShotExamples(roleCategory, competencyIds, limit = 3) {
  try {
    const sessions = await InterviewSession.find({
      "competencyProfile.roleCategory": roleCategory,
      "competencyProfile.competencyIds": { $in: competencyIds },
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("questions competencyProfile")
      .lean();

    if (!sessions.length) return [];

    // Lấy behavior questions từ completed sessions — đây là câu hỏi đã được dùng thực tế
    const candidates = sessions
      .flatMap(s => s.questions ?? [])
      .filter(q =>
        q.layer === "behavior" &&
        q.question?.length > 20 &&
        competencyIds.includes(q.competencyId)
      );

    // Deduplicate và shuffle nhẹ để tránh lặp lại
    const seen = new Set();
    const unique = candidates.filter(q => {
      const key = q.question.slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique
      .slice(0, limit)
      .map(q =>
        `[${q.competencyName || q.competencyId}] ${q.question}` +
        (q.ddiKeyActionTargeted ? ` (DDI: ${q.ddiKeyActionTargeted})` : "")
      );
  } catch {
    return [];
  }
}

// ── Controller ────────────────────────────────────────────────────────────────
export const InterviewsController = {

  /** POST /api/interviews/sessions — Tạo buổi phỏng vấn mới */
  createSession: async (req, res) => {
    try {
      const { hrGender = "female", competencyProfile, questions, inferredRole, inferredSeniority, coverageScore } = req.body;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (user.quota.interviewUsed >= user.quota.interviewLimit) {
        return res.status(403).json({ success: false, error: "Bạn đã hết lượt phỏng vấn thử miễn phí." });
      }

      const session = await InterviewSession.create({
        userId,
        hrGender,
        questionsAllowed: user.quota.interviewQuestionsAllowed || 3,
        status: "in_progress",
        planAtTime: user.plan,
        // Lưu competency data từ generate step (passed from frontend)
        ...(competencyProfile && { competencyProfile }),
        ...(questions?.length  && { questions }),
        ...(inferredRole       && { inferredRole }),
        ...(inferredSeniority  && { inferredSeniority }),
        ...(coverageScore      && { coverageScore }),
      });

      user.quota.interviewUsed += 1;
      await user.save();

      res.status(201).json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** POST /api/interviews/sessions/:id/answers — Cập nhật câu trả lời */
  updateAnswer: async (req, res) => {
    try {
      const { id } = req.params;
      const { questionIndex, questionText, transcript, durationSeconds } = req.body;

      const session = await InterviewSession.findOne({ _id: id, userId: req.userId });
      if (!session) return res.status(404).json({ success: false, error: "Phiên phỏng vấn không tồn tại" });
      if (session.status !== "in_progress") {
        return res.status(400).json({ success: false, error: "Phiên phỏng vấn này đã kết thúc" });
      }

      session.answers.push({ questionIndex, questionText, transcript, durationSeconds, recordedAt: new Date() });
      await session.save();
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** POST /api/interviews/sessions/:id/complete — Hoàn thành */
  completeSession: async (req, res) => {
    try {
      const { id } = req.params;
      const session = await InterviewSession.findOne({ _id: id, userId: req.userId });
      if (!session) return res.status(404).json({ success: false, error: "Không tìm thấy phiên phỏng vấn" });

      session.status = "completed";
      session.completedAt = new Date();
      session.totalDurationSeconds = session.answers.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);

      session.feedback = {
        overallScore: Math.floor(Math.random() * 30) + 60,
        communication: 75, confidence: 80, structure: 70, content: 65, timing: 90,
        generalComment: "Bạn có phong thái tự tin và trả lời đúng trọng tâm. Hãy chú ý hơn vào việc cấu trúc câu trả lời theo mô hình STAR.",
        perQuestion: session.answers.map((a, idx) => ({
          questionIndex: a.questionIndex,
          score: Math.floor(Math.random() * 40) + 50,
          badge: idx % 2 === 0 ? "Tốt" : "Cần cải thiện",
          strengths: ["Phát âm rõ ràng", "Thông tin chính xác"],
          improvements: ["Nên giải thích sâu hơn về kết quả", "Giảm bớt từ đệm"],
        })),
      };

      session.feedbackGeneratedAt = new Date();
      await session.save();
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** GET /api/interviews/sessions — Lịch sử phỏng vấn */
  list: async (req, res) => {
    try {
      const list = await InterviewSession.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.json({ success: true, list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /** GET /api/interviews/sessions/:id — Chi tiết 1 phiên */
  getById: async (req, res) => {
    try {
      const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.userId });
      if (!session) return res.status(404).json({ success: false, error: "Không tìm thấy" });
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/interviews/generate-questions
   * Body: { cvText?, jdText?, position?, field?, level? }
   *
   * Flow:
   *  1. getFewShotExamples — query MongoDB (trả [] nếu chưa có data)
   *  2. generateQuestionsFromText — SHRM/DDI competency-grounded generation
   *  3. Trả về questions + competencyProfile (frontend lưu sessionStorage để attach vào session)
   */
  generateQuestions: async (req, res) => {
    try {
      const { cvText = "", jdText = "", position = "", field = "", level = "" } = req.body;
      console.log("[generateQuestions] position=%s field=%s cvText_len=%d", position, field, cvText.length);

      // Layer 3: Accumulation — lấy few-shot từ MongoDB (sẽ giàu dần theo thời gian)
      // Detect role sơ bộ để query đúng collection
      const { resolveTopCompetencies } = await import("../services/competencyFramework.js");
      const { roleCategory, competencyIds: preIds } = resolveTopCompetencies(position, field, cvText, jdText, 4);
      const fewShotExamples = await getFewShotExamples(roleCategory, preIds);

      if (fewShotExamples.length > 0) {
        console.log("[generateQuestions] few-shot examples loaded: %d", fewShotExamples.length);
      }

      // Layer 1+2: SHRM/DDI grounded generation
      const result = await generateQuestionsFromText({ cvText, jdText, position, field, level, fewShotExamples });

      const combined = `${cvText} ${jdText}`;
      const coverage = computeCoverage(result.questions, combined);

      console.log(
        "[generateQuestions] OK — %d questions, role=%s, competencies=%s, fewShot=%d",
        result.questions.length,
        result.inferredRole,
        result.competencyProfile.competencyIds.join(","),
        fewShotExamples.length,
      );

      res.json({
        success: true,
        questions:          result.questions,
        inferredRole:       result.inferredRole,
        inferredSeniority:  result.inferredSeniority,
        competencyProfile:  result.competencyProfile,
        coverageScore:      coverage,
      });
    } catch (error) {
      console.error("[generateQuestions] ERROR:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/interviews/extract-cv-text
   * multipart/form-data: field "file" (PDF)
   */
  extractCvText: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Không có file được gửi lên" });
      }
      const { text, pageCount } = await extractPDFText(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );
      res.json({ success: true, text, pageCount });
    } catch (error) {
      res.status(502).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/interviews/sessions/:id/evaluate
   * Body: { answers: [{questionIndex, transcript}] }
   *
   * Đánh giá transcript bằng LLM theo SHRM/DDI rubric.
   * Frontend gửi answers trực tiếp (tránh race condition với PATCH fire-and-forget).
   * Kết quả được lưu vào session.feedback.perQuestion.
   */
  evaluateSession: async (req, res) => {
    try {
      const { id } = req.params;
      const { answers = [], questions: bodyQuestions = [] } = req.body;

      const session = await InterviewSession.findOne({ _id: id, userId: req.userId });
      if (!session) return res.status(404).json({ success: false, error: "Không tìm thấy phiên" });

      // Ưu tiên answers từ request body (tránh race condition với saveAnswer fire-and-forget)
      const answersToEval = answers.length > 0 ? answers : session.answers;

      // Resolve questions: session > body > build từ questionText trong answers
      let questionsToUse = session.questions;
      if (!questionsToUse?.length) {
        if (bodyQuestions.length) {
          questionsToUse = bodyQuestions;
        } else if (answersToEval.some(a => a.questionText)) {
          questionsToUse = answersToEval.map((a, i) => ({
            question:        a.questionText || `Câu hỏi ${i + 1}`,
            layer:           "behavior",
            competencyName:  "Năng lực tổng quát",
          }));
        } else {
          return res.status(400).json({ success: false, error: "Phiên không có câu hỏi" });
        }
      }

      console.log("[evaluateSession] id=%s questions=%d answers=%d",
        id, questionsToUse.length, answersToEval.length);

      const evalResult = await evaluateTranscripts({
        questions: questionsToUse,
        answers:   answersToEval,
      });

      // Persist to MongoDB
      const BADGE_MAP = { excellent: "Xuất sắc", proficient: "Tốt", developing: "Cần cải thiện" };
      session.feedback = {
        overallScore:   Math.round(
          evalResult.perQuestion.reduce((s, q) => s + q.overall, 0)
          / (evalResult.perQuestion.length || 1) * 20
        ),
        generalComment: evalResult.overallComment,
        perQuestion: evalResult.perQuestion.map(q => ({
          questionIndex: q.questionIndex,
          score:         Math.round(q.overall * 20),
          badge:         BADGE_MAP[q.shrmLevel] ?? "Tốt",
          strengths:     q.strengths,
          improvements:  q.improvements,
          scores:        q.scores,
          shrmLevel:     q.shrmLevel,
          suggestion:    q.suggestion,
          overall5:      q.overall,
        })),
        isLockedForFree: false,
      };
      session.feedbackGeneratedAt = new Date();
      await session.save();

      console.log("[evaluateSession] OK — overallScore=%d", session.feedback.overallScore);

      res.json({
        success:        true,
        evaluation:     evalResult,
        overallScore:   session.feedback.overallScore,
        generalComment: evalResult.overallComment,
        inferredRole:   session.inferredRole,
        totalDurationSeconds: session.totalDurationSeconds,
      });
    } catch (error) {
      console.error("[evaluateSession] ERROR:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
