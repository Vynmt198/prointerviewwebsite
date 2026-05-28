import React, { useState, useEffect } from "react";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { useNavigate, useLocation } from "react-router";
import {
  Star,
  TrendingUp as TrendUp,
  Check,
  AlertCircle as Warning,
  ChevronDown as CaretDown,
  ChevronUp as CaretUp,
  Mic as Microphone,
  LayoutGrid as SquaresFour,
  Lightbulb,
  Calendar,
  BookOpen,
  Eye,
  Volume2 as SpeakerHigh,
  MessageSquareText as ChatTeardropDots,
  Quote as Quotes,
  GraduationCap,
  Lock,
  Zap as Lightning,
  Activity,
  Smile,
  Focus,
  Wind,
} from "lucide-react";
import { CourseRecommendations } from "../../components/courses/CourseRecommendations";
import { BehavioralRadarChart, behaviorScoreColor, emotionLabel } from "../../components/interview/BehavioralRadarChart";
import { getPlans } from "../../utils/auth";
import { evaluateInterviewSession } from "../../utils/interviewsApi";
import { CUSTOMER_SHELL_GUTTER } from "../../components/layout/customerShellLayout";

const IS = { strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

const CTA_LIME =
  "bg-gradient-to-r from-[#93f72b] to-[#93f72b] text-violet-950 shadow-[0_6px_20px_rgba(196,255,71,0.2)] transition-all hover:brightness-105";

const CTA_PURPLE =
  "bg-gradient-to-r from-[#8037f4] to-[#a66ff8] text-white shadow-[0_6px_20px_rgba(128,55,244,0.2)] transition-all hover:brightness-105";

const FREE_LIMIT = 3;

/** Dùng chung InterviewRoom (lưu lịch sử) — điểm mẫu khớp trang feedback */
export const QUESTIONS_FEEDBACK = [
  {
    q: "Hãy giới thiệu về bản thân và điểm mạnh nổi bật nhất của bạn?",
    scores: { clarity: 4, structure: 4, relevance: 4.5, credibility: 3.5 },
    overall: 4.0,
    strengths: ["Giới thiệu rõ ràng, có cấu trúc", "Nêu được điểm mạnh liên quan đến JD"],
    improvements: ["Cần cụ thể hơn về thành tích có số liệu", "Phần kết luận chưa impact"],
    suggestion: "Thay vì nói 'tôi là người chăm chỉ', hãy nói: 'Trong 2 năm tại [Công ty X], tôi đã hoàn thành 95% sprint đúng deadline và được đánh giá performance 'Exceeds Expectations' 2 quý liên tiếp.'",
  },
  {
    q: "Tại sao bạn muốn ứng tuyển vào vị trí này tại công ty chúng tôi?",
    scores: { clarity: 4.5, structure: 3.5, relevance: 5, credibility: 4 },
    overall: 4.2,
    strengths: ["Nghiên cứu kỹ về công ty và vị trí", "Kết nối tốt giữa kinh nghiệm và yêu cầu JD"],
    improvements: ["Thêm ví dụ cụ thể về sản phẩm của công ty bạn đã dùng", "Phần 'tôi có thể đóng góp gì' còn sơ sài"],
    suggestion: "Thêm: 'Tôi đã dùng [Sản phẩm] trong 2 năm và nhận thấy [vấn đề X]. Với background frontend của mình, tôi có thể đóng góp vào cải thiện trải nghiệm [Y].'",
  },
  {
    q: "Hãy kể về một tình huống khó khăn nhất bạn đã gặp phải và cách bạn giải quyết nó?",
    scores: { clarity: 3.5, structure: 3, relevance: 3.5, credibility: 3 },
    overall: 3.3,
    strengths: ["Kể câu chuyện có thực tế", "Thể hiện được kỹ năng giải quyết vấn đề"],
    improvements: ["Chưa rõ STAR (Situation-Task-Action-Result)", "Kết quả chưa có số liệu cụ thể", "Câu chuyện hơi lan man"],
    suggestion: "Cấu trúc lại theo STAR: S - Bối cảnh dự án bị delay 2 sprint. T - Nhiệm vụ của bạn là gì. A - 3 hành động cụ thể bạn đã làm. R - Kết quả: dự án hoàn thành đúng deadline, team đạt KPI.",
  },
  {
    q: "Bạn thấy điểm yếu lớn nhất của mình là gì và bạn đang làm gì để cải thiện?",
    scores: { clarity: 4, structure: 3.5, relevance: 4, credibility: 3.5 },
    overall: 3.8,
    strengths: ["Trả lời thành thật và tự nhận thức tốt", "Có kế hoạch cải thiện cụ thể"],
    improvements: ["Điểm yếu nêu ra quá 'safe', nghe giả tạo", "Cần thêm ví dụ về cách bạn đang cải thiện"],
    suggestion: "Chọn điểm yếu thật nhưng không ảnh hưởng core của vị trí. Ví dụ: 'Tôi hay perfectionist nên đôi khi mất thêm thời gian. Gần đây tôi đang luyện timeboxing - đặt deadline cứng cho mỗi task.'",
  },
  {
    q: "Trong 5 năm tới, bạn muốn phát triển theo hướng nào?",
    scores: { clarity: 4.5, structure: 4, relevance: 4, credibility: 4.5 },
    overall: 4.3,
    strengths: ["Có vision rõ ràng và realistic", "Kết nối tốt với lộ trình phát triển của công ty"],
    improvements: ["Thêm milestone cụ thể theo từng năm", "Đề cập đến cách công ty này giúp đạt được mục tiêu"],
    suggestion: "Năm 1-2: Master [kỹ năng X] và contribute vào [project Y]. Năm 3-4: Lead một team nhỏ. Năm 5: Tech Lead hoặc Engineering Manager. Và đây là lý do công ty này là bước đi đúng nhất.",
  },
];

const STAR_LABELS = ["clarity", "structure", "relevance", "credibility"];
const STAR_NAMES = {
  clarity: "Clarity (Rõ ràng)",
  structure: "Structure (STAR)",
  relevance: "Relevance (JD)",
  credibility: "Credibility (Thuyết phục)",
};

// Từ đệm phổ biến trong tiếng Việt và tiếng Anh
const FILLER_PATTERNS = [
  /\bừm+\b/gi, /\bừ+\b/gi, /\bà+\b/gi, /\bờ+\b/gi, /\bơ+\b/gi,
  /kiểu là/gi, /kiểu như/gi, /tức là/gi, /ý là/gi, /\bý kiến là\b/gi,
  /\bum+\b/gi, /\buh+\b/gi, /\blike,?\s/gi, /you know/gi,
  /thì là/gi, /\bnhỉ\b/gi, /\bnhé\b/gi,
];

function computeTranscriptMetrics(transcript = "", durationSeconds = 0) {
  const trimmed = transcript.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

  let fillerCount = 0;
  for (const p of FILLER_PATTERNS) {
    const m = trimmed.match(p);
    if (m) fillerCount += m.length;
  }
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

  // Score filler words: 5 = rất ít (<2%), 1 = nhiều (>15%)
  const fillerScore =
    fillerRatio < 0.02 ? 5.0 :
    fillerRatio < 0.05 ? 4.0 :
    fillerRatio < 0.10 ? 3.0 :
    fillerRatio < 0.15 ? 2.0 : 1.0;

  // Score pace: ideal 120–160 wpm; 0 nếu không có duration
  const paceScore = wpm === 0 ? 0 :
    (wpm >= 120 && wpm <= 160) ? 5.0 :
    (wpm >= 100 && wpm <= 180) ? 4.0 :
    (wpm >= 80  && wpm <= 200) ? 3.0 : 2.0;

  // Score answer length: ideal 100–250 words
  const lengthScore = wordCount === 0 ? 0 :
    (wordCount >= 100 && wordCount <= 250) ? 5.0 :
    (wordCount >= 60  && wordCount <= 300) ? 4.0 :
    (wordCount >= 30  && wordCount <= 350) ? 3.0 : 2.0;

  return { wordCount, wpm, fillerCount, fillerRatio, fillerScore, paceScore, lengthScore };
}

export function InterviewFeedback() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [expandedQ, setExpandedQ] = useState(null);
  const plans = getPlans();
  const isPro = plans.starterPro || plans.elitePro;

  // Read transcripts recorded in InterviewRoom
  const [transcripts] = useState(() => {
    try {
      const raw = sessionStorage.getItem("prointerview_transcripts");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  });

  // Read question objects (for question text mapping)
  const [questionObjects] = useState(() => {
    try {
      const raw = sessionStorage.getItem("prointerview_question_objects");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  });

  // Real AI evaluation state
  const [evaluating,           setEvaluating]           = useState(false);
  const [realFeedback,         setRealFeedback]         = useState(null);
  const [sessionMeta,          setSessionMeta]          = useState({ position: "", duration: 0, overallComment: "" });
  const [behavioralSummary,    setBehavioralSummary]    = useState(null);
  const [behavioralPerQuestion, setBehavioralPerQuestion] = useState([]);

  useEffect(() => {
    const sessionId = location.state?.sessionId
      ?? sessionStorage.getItem("prointerview_sessionId");
    if (!sessionId) return;

    setEvaluating(true);

    // Kèm questionText để backend dùng làm fallback khi session không có questions
    const answers = transcripts.map((t, i) => ({
      questionIndex: i,
      transcript: t || "",
      questionText: questionObjects?.[i]?.question || `Câu hỏi ${i + 1}`,
    }));

    // Gửi kèm question objects nếu có (từ LLM); session.questions là fallback phía backend
    const questionsPayload = questionObjects
      ? questionObjects.map(q => ({
          question:       q.question,
          layer:          q.layer,
          competencyName: q.competencyName,
          ddiKeyActionTargeted: q.ddiKeyActionTargeted,
          shrmRubricExcellent:  q.shrmRubricExcellent,
        }))
      : [];

    evaluateInterviewSession(sessionId, answers, questionsPayload)
      .then(res => {
        if (!res.success || !res.evaluation?.perQuestion?.length) {
          return;
        }
        // Map sang format mà UI đang dùng: { q, scores, overall, strengths, improvements, suggestion }
        const mapped = res.evaluation.perQuestion.map(evalQ => ({
          q:            questionObjects?.[evalQ.questionIndex]?.question
                          ?? QUESTIONS_FEEDBACK[evalQ.questionIndex]?.q
                          ?? `Câu ${evalQ.questionIndex + 1}`,
          scores:       evalQ.scores,
          overall:      evalQ.overall,
          shrmLevel:    evalQ.shrmLevel || "proficient",
          strengths:    evalQ.strengths,
          improvements: evalQ.improvements,
          suggestion:   evalQ.suggestion,
        }));
        setRealFeedback(mapped);
        setSessionMeta({
          position:       res.inferredRole || "",
          duration:       res.totalDurationSeconds
                            ? Math.max(1, Math.round(res.totalDurationSeconds / 60))
                            : 0,
          overallComment: res.generalComment || "",
        });
        if (res.behavioralSummary) setBehavioralSummary(res.behavioralSummary);
        if (res.behavioralPerQuestion?.length) setBehavioralPerQuestion(res.behavioralPerQuestion);
      })
      .catch(() => {})
      .finally(() => setEvaluating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dùng real feedback nếu có, fallback về mock
  const allQuestions = realFeedback ?? QUESTIONS_FEEDBACK;
  const visibleQuestions = isPro ? allQuestions : allQuestions.slice(0, FREE_LIMIT);

  const hasAnyTranscript = transcripts.some((t) => t && t.trim().length > 0);

  // Compute real speaking metrics from transcript text
  const allMetrics = transcripts.map(t => computeTranscriptMetrics(t));
  const answeredMetrics = allMetrics.filter((_, i) => transcripts[i]?.trim().length > 0);
  const hasSpeakingData = answeredMetrics.length > 0;
  const avgWpm   = hasSpeakingData ? Math.round(answeredMetrics.reduce((s, m) => s + m.wpm, 0) / answeredMetrics.length) : 0;
  const avgFillerScore  = hasSpeakingData ? answeredMetrics.reduce((s, m) => s + m.fillerScore, 0) / answeredMetrics.length : 0;
  const avgLengthScore  = hasSpeakingData ? answeredMetrics.reduce((s, m) => s + m.lengthScore, 0) / answeredMetrics.length : 0;
  const totalFillers    = hasSpeakingData ? answeredMetrics.reduce((s, m) => s + m.fillerCount, 0) : 0;
  const avgWordCount    = hasSpeakingData ? Math.round(answeredMetrics.reduce((s, m) => s + m.wordCount, 0) / answeredMetrics.length) : 0;

  // Derive speaking tips from actual metrics
  const speakingTips = [];
  if (hasSpeakingData) {
    if (avgWpm > 160) speakingTips.push(`Giảm tốc độ nói xuống 130–150 từ/phút (hiện tại: ~${avgWpm} từ/phút)`);
    else if (avgWpm > 0 && avgWpm < 100) speakingTips.push(`Tăng tốc độ nói lên 120–140 từ/phút (hiện tại: ~${avgWpm} từ/phút)`);
    else if (avgWpm >= 100) speakingTips.push(`Tốc độ nói ổn định ~${avgWpm} từ/phút — duy trì trong khoảng 120–160`);
    if (totalFillers > 5) speakingTips.push(`Luyện bỏ từ đệm (phát hiện ${totalFillers} lần) — thay bằng cách dừng ngắn`);
    if (avgWordCount < 60) speakingTips.push(`Mở rộng câu trả lời hơn — mục tiêu 100–200 từ mỗi câu (trung bình: ${avgWordCount} từ)`);
    else if (avgWordCount > 300) speakingTips.push(`Câu trả lời hơi dài (tb. ${avgWordCount} từ) — tập trung vào điểm chính, tránh lan man`);
  }
  if (speakingTips.length === 0) speakingTips.push("Luyện cấu trúc STAR để câu trả lời rõ ràng và thuyết phục hơn");

  // SHRM level distribution from real evaluation
  const shrmDistribution = realFeedback
    ? {
        excellent:  allQuestions.filter(q => q.shrmLevel === "excellent").length,
        proficient: allQuestions.filter(q => q.shrmLevel === "proficient").length,
        developing: allQuestions.filter(q => q.shrmLevel === "developing").length,
      }
    : null;

  const avgScores = STAR_LABELS.reduce((acc, key) => {
    acc[key] = visibleQuestions.reduce((sum, q) => sum + q.scores[key], 0) / visibleQuestions.length;
    return acc;
  }, {});

  const overallAvg = visibleQuestions.reduce((sum, q) => sum + q.overall, 0) / visibleQuestions.length;

  const weakAreas = realFeedback
    ? STAR_LABELS
        .map(key => ({ label: STAR_NAMES[key], avg: allQuestions.reduce((s, q) => s + (q.scores[key] || 0), 0) / allQuestions.length }))
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3)
        .map(a => `${a.label} — ${a.avg.toFixed(1)}/5`)
    : ["Structure (STAR) — 3.2/5", "Credibility — 3.4/5", "Từ đệm"];

  const renderStars = (score, max = 5, onDark = false) => (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(score)
              ? onDark
                ? "fill-[#b5e636] text-[#b5e636]"
                : "fill-[#b5e636] text-[#b5e636]"
              : i < score
                ? onDark
                  ? "fill-[#b5e636]/50 text-[#b5e636]"
                  : "fill-[#b5e636]/40 text-[#b5e636]"
                : onDark
                  ? "fill-white/15 text-white/25"
                  : "fill-violet-100 text-violet-200"
          }`}
        />
      ))}
      <span className={`ml-1.5 text-sm font-semibold ${onDark ? "text-white" : "text-violet-950"}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );

  const scoreColor = (s) =>
    s >= 4 ? "bg-[#b5e636]" : s >= 3 ? "bg-violet-400" : "bg-violet-300";

  const scoreBadge = (s) =>
    s >= 4
      ? { cls: "bg-lime-50 text-violet-900 ring-1 ring-lime-200/80", label: "Tốt" }
      : s >= 3
        ? { cls: "bg-violet-100 text-violet-800", label: "Khá" }
        : { cls: "bg-violet-50 text-violet-700", label: "Cần cải thiện" };

  return (
    <MentorPageShell bottomPad="pb-16">
      {evaluating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="text-sm font-semibold text-violet-950">Đang phân tích câu trả lời của bạn...</p>
          <p className="text-xs text-violet-600">AI đang đánh giá theo chuẩn SHRM/DDI</p>
        </div>
      )}

      <div className={`relative z-10 pb-8 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-6">
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-violet-950 sm:text-3xl">
              Kết quả phỏng vấn của bạn
            </h1>
            <p className="mt-1.5 text-sm text-violet-600">
              {sessionMeta.position || "Phỏng vấn AI"}
              {sessionMeta.duration > 0 ? ` · ${sessionMeta.duration} phút` : ""} ·{" "}
              {isPro ? allQuestions.length : FREE_LIMIT}/{allQuestions.length} câu hỏi
              {!isPro && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2 py-0.5 text-xs font-semibold text-[#6d2fd6]">
                  <Lock className="h-3 w-3" /> 2 câu bị khóa
                </span>
              )}
            </p>
          </header>

      {/* ── Overall Score Banner ─────────────────────────── */}
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ background: "#8037f4" }}>
        {/* Top: big score + STAR */}
        <div className="p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className="mb-1 text-sm text-white/80">
                Tổng điểm{!isPro && <span className="ml-1 text-xs text-white/55">({FREE_LIMIT} câu)</span>}
              </div>
              <div style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>{overallAvg.toFixed(1)}</div>
              <div className="text-sm text-white/80">/5 sao</div>
              <div className="mt-2 flex justify-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(overallAvg) ? "fill-[#b5e636] text-[#b5e636]" : "fill-white/15 text-white/30"}`}
                  />
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px h-24 bg-white/20 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {STAR_LABELS.map((key) => (
                <div key={key} className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="mb-1 text-xs text-white/80">{STAR_NAMES[key]}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${(avgScores[key] / 5) * 100}%` }} />
                    </div>
                    <span className="text-white font-bold text-sm">{avgScores[key].toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: SHRM Distribution + Speaking Metrics */}
        <div className="bg-white/10 border-t border-white/10 px-6 py-4 grid sm:grid-cols-2 gap-4">
          {/* SHRM Level Distribution */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
              <Eye className="h-3.5 w-3.5" /> Phân bổ chất lượng SHRM/DDI
            </p>
            {shrmDistribution ? (
              <div className="space-y-2">
                {[
                  { key: "excellent", label: "Xuất sắc", color: "bg-[#b5e636]", cls: "bg-lime-50 text-violet-900" },
                  { key: "proficient", label: "Đạt yêu cầu", color: "bg-violet-300", cls: "bg-violet-100 text-violet-800" },
                  { key: "developing", label: "Cần cải thiện", color: "bg-violet-500/70", cls: "bg-violet-50 text-violet-700" },
                ].map(({ key, label, color, cls }) => {
                  const count = shrmDistribution[key];
                  const total = allQuestions.length || 1;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/92">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{count}/{total} câu</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 opacity-60">
                <p className="text-xs text-white/70 italic">Hoàn thành phỏng vấn với AI để xem phân tích SHRM.</p>
              </div>
            )}
          </div>

          {/* Real Speaking Metrics from Transcript */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
              <SpeakerHigh className="h-3.5 w-3.5" /> Phân tích lời nói (từ transcript)
            </p>
            {hasSpeakingData ? (
              <div className="space-y-2">
                {[
                  { label: "Tốc độ nói (wpm)", score: avgFillerScore > 0 ? Math.min(5, (avgWpm / 160) * 5) : 0, detail: avgWpm > 0 ? `~${avgWpm} từ/phút` : "—" },
                  { label: "Từ đệm",            score: avgFillerScore, detail: totalFillers > 0 ? `${totalFillers} lần phát hiện` : "Không phát hiện" },
                  { label: "Độ dài câu trả lời",score: avgLengthScore, detail: `TB ${avgWordCount} từ/câu` },
                ].map((item) => {
                  const badge = scoreBadge(item.score);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/92">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          <span className="text-white font-bold text-xs">{item.detail}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(item.score)}`} style={{ width: `${(item.score / 5) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/60 italic">Trả lời bằng giọng nói để xem phân tích lời nói.</p>
            )}

            {/* Dynamic tips from real metrics */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white/90">
                <ChatTeardropDots className="h-3.5 w-3.5" /> Gợi ý cải thiện
              </p>
              <ul className="space-y-1">
                {speakingTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/82">
                    <span className="mt-0.5 flex-shrink-0 text-[#b5e636]">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* AI overall comment */}
      {sessionMeta.overallComment && (
        <div className="mb-6 rounded-md border border-violet-200/80 bg-violet-50/50 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <ChatTeardropDots className="h-4 w-4 text-violet-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Nhận xét tổng quan từ AI</p>
          </div>
          <p className="text-sm leading-relaxed text-violet-900">{sessionMeta.overallComment}</p>
        </div>
      )}

      {/* ── Behavioral Analysis Section ──────────────────────── */}
      {behavioralSummary && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-violet-100 bg-violet-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#6E35E8]" />
              <h2 className="text-sm font-bold text-violet-950">Phân tích hành vi &amp; Ngôn ngữ cơ thể</h2>
              <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-[#630ed4]">
                Tin cậy tổng hợp: {behavioralSummary.overallConfidenceScore?.toFixed(1) ?? "—"}/5
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:grid-cols-2">
            {/* Left: Radar chart */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-500">
                Biểu đồ 6 chiều hành vi
              </p>
              <BehavioralRadarChart summary={behavioralSummary} />
            </div>

            {/* Right: Metric cards */}
            <div className="flex flex-col gap-3">
              {/* 6 dimension cards */}
              {[
                {
                  icon: <Eye className="h-3.5 w-3.5" />,
                  label: "Giao tiếp mắt",
                  value: behavioralSummary.avgEyeContactScore,
                  display: `${((behavioralSummary.avgEyeContactScore ?? 0) * 100).toFixed(0)}%`,
                  tip: "Tỷ lệ thời gian nhìn vào camera (MediaPipe FaceMesh)",
                },
                {
                  icon: <Focus className="h-3.5 w-3.5" />,
                  label: "Tư thế đầu",
                  value: behavioralSummary.avgHeadStabilityScore,
                  display: `${((behavioralSummary.avgHeadStabilityScore ?? 0) * 100).toFixed(0)}%`,
                  tip: "Mức độ ổn định vị trí đầu trong suốt buổi",
                },
                {
                  icon: <SpeakerHigh className="h-3.5 w-3.5" />,
                  label: "Sự lưu loát",
                  value: (behavioralSummary.avgSilenceRatio ?? 0) < 0.10 ? 0.9
                       : (behavioralSummary.avgSilenceRatio ?? 0) < 0.25 ? 0.65 : 0.3,
                  display: `${((1 - (behavioralSummary.avgSilenceRatio ?? 0)) * 100).toFixed(0)}%`,
                  tip: `Trung bình ${((behavioralSummary.avgSilenceRatio ?? 0) * 100).toFixed(0)}% thời gian im lặng`,
                },
                {
                  icon: <Microphone className="h-3.5 w-3.5" />,
                  label: "Tự tin giọng nói",
                  value: (behavioralSummary.avgAmplitudeVariance ?? 0) > 0.07 ? 0.9
                       : (behavioralSummary.avgAmplitudeVariance ?? 0) > 0.03 ? 0.65 : 0.3,
                  display: (behavioralSummary.avgAmplitudeVariance ?? 0) > 0.07 ? "Biểu cảm"
                         : (behavioralSummary.avgAmplitudeVariance ?? 0) > 0.03 ? "Bình thường" : "Đơn điệu",
                  tip: "Độ biến thiên âm lượng — cao = giọng biểu cảm",
                },
                {
                  icon: <Wind className="h-3.5 w-3.5" />,
                  label: "Phản xạ trả lời",
                  value: (behavioralSummary.avgResponseLatencyMs ?? 0) < 3000 ? 0.9
                       : (behavioralSummary.avgResponseLatencyMs ?? 0) < 7000 ? 0.6 : 0.25,
                  display: behavioralSummary.avgResponseLatencyMs
                    ? `${(behavioralSummary.avgResponseLatencyMs / 1000).toFixed(1)}s`
                    : "—",
                  tip: "Thời gian bắt đầu trả lời sau khi HR hỏi xong",
                },
                {
                  icon: <ChatTeardropDots className="h-3.5 w-3.5" />,
                  label: "Từ dè dặt (hedge)",
                  value: (behavioralSummary.totalHedgeWords ?? 0) === 0 ? 0.9
                       : (behavioralSummary.totalHedgeWords ?? 0) < 5 ? 0.65 : 0.3,
                  display: `${behavioralSummary.totalHedgeWords ?? 0} lần`,
                  tip: "Số lần dùng \"có lẽ\", \"hình như\", \"chưa chắc\"…",
                },
              ].map(({ icon, label, value, display, tip }) => {
                const c = behaviorScoreColor(value * 5);
                return (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${c.bg} ${c.ring} ${c.text}`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-violet-900">{label}</p>
                      <p className="truncate text-[10px] text-violet-500">{tip}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-bold text-violet-950">{display}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${c.bg} ${c.ring} ${c.text}`}>
                        {c.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Dominant emotion (Google Vision) */}
              {behavioralSummary.dominantEmotion && behavioralSummary.dominantEmotion !== "neutral" && (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2">
                  <Smile className="h-4 w-4 shrink-0 text-violet-500" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-violet-900">Cảm xúc chủ đạo</p>
                    <p className="text-[10px] text-violet-500">Phân tích từ Google Cloud Vision</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ring-1 ${
                    behavioralSummary.dominantEmotion === "joy"
                      ? "bg-lime-50 text-violet-900 ring-lime-200"
                      : behavioralSummary.dominantEmotion === "surprise"
                        ? "bg-amber-50 text-amber-800 ring-amber-200"
                        : "bg-orange-50 text-orange-800 ring-orange-200"
                  }`}>
                    {behavioralSummary.dominantEmotion === "joy" ? "Tự tin"
                     : behavioralSummary.dominantEmotion === "surprise" ? "Ngạc nhiên"
                     : behavioralSummary.dominantEmotion === "sorrow" ? "Lo lắng"
                     : "Căng thẳng"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vocabulary diversity */}
          {(behavioralSummary.avgVocabularyDiversity ?? 0) > 0 && (
            <div className="border-t border-violet-100 bg-violet-50/30 px-5 py-3">
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold text-violet-700">Sự đa dạng từ vựng (TTR)</p>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-violet-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6E35E8] to-[#8B4DFF] transition-all"
                    style={{ width: `${(behavioralSummary.avgVocabularyDiversity ?? 0) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-violet-900">
                  {((behavioralSummary.avgVocabularyDiversity ?? 0) * 100).toFixed(0)}%
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                  behaviorScoreColor((behavioralSummary.avgVocabularyDiversity ?? 0) * 5).bg
                } ${behaviorScoreColor((behavioralSummary.avgVocabularyDiversity ?? 0) * 5).ring} ${
                  behaviorScoreColor((behavioralSummary.avgVocabularyDiversity ?? 0) * 5).text
                }`}>
                  {behaviorScoreColor((behavioralSummary.avgVocabularyDiversity ?? 0) * 5).label}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-question feedback */}
      <div className="mb-6">
        <h2 className="mb-4 text-base font-bold text-violet-950">B. Phân tích từng câu hỏi</h2>
        <div className="space-y-3">
          {/* ── Câu hỏi đã mở khóa ─── */}
          {visibleQuestions.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-md border border-violet-200/80 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-violet-50/50"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8037f4] to-[#a66ff8]">
                    <span className="text-xs font-bold text-white">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate pr-4 text-sm font-medium leading-relaxed text-violet-950">{item.q}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {renderStars(item.overall)}
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scoreBadge(item.overall).cls}`}>
                        {scoreBadge(item.overall).label}
                      </div>
                    </div>
                  </div>
                </div>
                {expandedQ === i ? (
                  <CaretUp className="h-4 w-4 flex-shrink-0 text-violet-500" />
                ) : (
                  <CaretDown className="h-4 w-4 flex-shrink-0 text-violet-500" />
                )}
              </button>

              {expandedQ === i && (
                <div className="border-t border-violet-100 px-5 pb-5">
                  {/* Voice transcript */}
                  {transcripts[i] && transcripts[i].trim().length > 0 ? (
                    <div className="mb-4 mt-4 overflow-hidden rounded-md border border-violet-200/80">
                      <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/60 px-4 py-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
                          <Microphone className="h-3 w-3 text-violet-600" />
                        </div>
                        <span className="text-xs font-semibold text-violet-800">
                          Câu trả lời của bạn — được ghi nhận từ giọng nói
                        </span>
                        <span className="ml-auto text-xs tabular-nums text-violet-500">
                          {transcripts[i].trim().split(/\s+/).filter(Boolean).length} từ
                        </span>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Quotes className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                          <p className="flex-1 text-sm leading-relaxed text-black">
                            {transcripts[i].trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 mt-4 flex items-center gap-2.5 rounded-md border border-dashed border-violet-200 bg-violet-50/30 px-4 py-3">
                      <Microphone className="h-4 w-4 text-violet-400" />
                      <p className="text-xs text-violet-600">
                        Chưa có ghi âm cho câu này — trả lời bằng giọng nói trong lần phỏng vấn tiếp theo để xem transcript tại đây.
                      </p>
                    </div>
                  )}

                  {/* Behavioral data per question (if available) */}
                  {(() => {
                    const bq = behavioralPerQuestion.find((b) => b?.questionIndex === i);
                    const bd = bq?.behavioralData;
                    if (!bd) return null;
                    const emotion = bd.emotion ? emotionLabel(bd.emotion) : null;
                    return (
                      <div className="mb-4 mt-3 grid grid-cols-2 gap-2 rounded-lg border border-violet-100 bg-violet-50/30 p-3 sm:grid-cols-4">
                        {[
                          { label: "Phản xạ", value: bd.responseLatencyMs ? `${(bd.responseLatencyMs / 1000).toFixed(1)}s` : "—" },
                          { label: "Im lặng", value: `${((bd.silenceRatio ?? 0) * 100).toFixed(0)}%` },
                          { label: "Từ dè dặt", value: `${bd.hedgeWordCount ?? 0} lần` },
                          { label: "Eye contact", value: bd.eyeContactScore ? `${(bd.eyeContactScore * 100).toFixed(0)}%` : "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex flex-col gap-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">{label}</p>
                            <p className="text-sm font-bold text-violet-900">{value}</p>
                          </div>
                        ))}
                        {emotion && (
                          <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
                            <Smile className="h-3.5 w-3.5 text-violet-400" />
                            <span className="text-[10px] text-violet-500">Cảm xúc (Vision AI):</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emotion.cls}`}>{emotion.text}</span>
                            {!bd.emotion?.lightingOk && (
                              <span className="text-[10px] text-orange-600">· Ánh sáng kém</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
                    {STAR_LABELS.map((key) => (
                      <div key={key} className="rounded-md border border-violet-100 bg-violet-50/40 p-2 text-center">
                        <p className="mb-1 text-xs capitalize text-violet-600">{key}</p>
                        <div className="flex justify-center">{renderStars(item.scores[key])}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-950">
                        <Check className="h-3.5 w-3.5 text-violet-600" /> Điểm mạnh
                      </h4>
                      <ul className="space-y-1.5">
                        {item.strengths.map((s, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-violet-700">
                            <span className="mt-0.5 flex-shrink-0 text-[#b5e636]">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-950">
                        <Warning className="h-3.5 w-3.5 text-violet-500" /> Cần cải thiện
                      </h4>
                      <ul className="space-y-1.5">
                        {item.improvements.map((s, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-violet-700">
                            <span className="mt-0.5 flex-shrink-0 text-violet-400">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-md border border-violet-200/80 bg-violet-50/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-violet-600" {...IS} />
                      <p className="text-xs font-semibold text-violet-800">Gợi ý câu trả lời tốt hơn</p>
                    </div>
                    <p className="text-xs leading-relaxed text-violet-900">{item.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── Câu hỏi bị khóa (non-Pro) ─── */}
          {!isPro && allQuestions.slice(FREE_LIMIT).map((item, idx) => {
            const i = FREE_LIMIT + idx;
            return (
              <div
                key={`locked-${i}`}
                className="relative overflow-hidden rounded-md border border-violet-200/80 bg-white shadow-sm"
              >
                <div
                  className="flex items-center gap-4 p-5"
                  style={{ filter: "blur(2px)", userSelect: "none", pointerEvents: "none" }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100">
                    <span className="text-xs font-bold text-violet-400">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate pr-4 text-sm font-medium leading-relaxed text-violet-400">{item.q}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} className="h-3.5 w-3.5 fill-violet-100 text-violet-100" />
                      ))}
                      <span className="ml-1 text-xs text-violet-300">—</span>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/92 px-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-violet-600" {...IS} />
                    Câu hỏi {i + 1} · Chỉ dành cho gói Pro
                  </div>

                  <div className="text-center">
                    <p className="mb-1 text-sm font-semibold text-violet-950">Phân tích chi tiết bị khóa</p>
                    <p className="max-w-xs text-xs leading-relaxed text-violet-600">
                      Nâng cấp Pro để xem điểm số, điểm mạnh, điểm yếu và gợi ý cải thiện cho câu hỏi này.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className={`flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold ${CTA_PURPLE}`}
                  >
                    <Lightning className="h-4 w-4 shrink-0" {...IS} />
                    Nâng cấp Pro để mở khóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Banner nâng cấp sau danh sách câu hỏi (non-Pro) ── */}
        {!isPro && (
          <div className="mt-5 flex flex-col items-center gap-4 rounded-md border border-violet-200/80 bg-violet-50/50 p-5 sm:flex-row">
            <div className="flex-1 text-center sm:text-left">
              <p className="mb-1 text-sm font-bold text-violet-950">Mở khóa phân tích đầy đủ 5/5 câu hỏi</p>
              <p className="text-xs leading-relaxed text-violet-600">
                Nâng cấp gói Pro để xem toàn bộ phản hồi, điểm số chi tiết và gợi ý cải thiện cho tất cả câu hỏi trong buổi phỏng vấn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-6 py-3 text-sm font-bold ${CTA_PURPLE}`}
            >
              <Lightning className="h-4 w-4 shrink-0" {...IS} />
              Nâng cấp ngay
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mb-6 rounded-md border border-violet-200/80 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 text-sm font-bold text-violet-950">Tiếp tục luyện tập</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/interview")}
            className={`flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold ${CTA_LIME}`}
          >
            <Microphone className="h-4 w-4 shrink-0" {...IS} />
            Phỏng vấn lại
          </button>

          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 rounded-md border border-violet-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50"
          >
            <BookOpen className="h-4 w-4 shrink-0 text-violet-700" {...IS} />
            Khóa học
          </button>

          <button
            type="button"
            onClick={() => navigate("/mentors")}
            className="flex items-center gap-2 rounded-md border border-violet-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50"
          >
            <Calendar className="h-4 w-4 shrink-0 text-violet-700" {...IS} />
            Tìm mentor
            <span className="shrink-0 rounded-full border border-lime-200/80 bg-lime-50 px-2 py-0.5 text-[10px] font-bold text-violet-900">
              Cải thiện 3×
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-md border border-violet-200/80 bg-white px-5 py-2.5 text-sm font-medium text-violet-700 shadow-sm transition-all hover:bg-violet-50"
          >
            <SquaresFour className="h-4 w-4 shrink-0 text-violet-600" {...IS} />
            Trang chủ
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-md border border-violet-200/80 bg-white p-4 shadow-sm sm:p-5">
        <CourseRecommendations
          tags={["star-method", "behavioral-interview", "interview-skills"]}
          title="Khóa học giúp bạn cải thiện điểm yếu"
          subtitle="Dựa trên kết quả phỏng vấn, chúng tôi gợi ý các khóa học phù hợp nhất"
          variant="banner"
          maxCourses={3}
          weakAreas={weakAreas}
        />
      </div>
        </div>
      </div>
    </MentorPageShell>
  );
}