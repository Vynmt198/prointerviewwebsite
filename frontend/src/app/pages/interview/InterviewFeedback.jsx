import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Star,
  TrendingUp as TrendUp,
  Check,
  AlertCircle as Warning,
  ChevronDown as CaretDown,
  ChevronUp as CaretUp,
  Download as DownloadSimple,
  Share2 as ShareNetwork,
  Mic as Microphone,
  LayoutGrid as SquaresFour,
  Lightbulb,
  Calendar,
  BookOpen,
  ArrowLeft,
  Eye,
  Volume2 as SpeakerHigh,
  MessageSquareText as ChatTeardropDots,
  Quote as Quotes,
  GraduationCap,
  Lock,
  Zap as Lightning,
} from "lucide-react";
import { CourseRecommendations } from "../../components/courses/CourseRecommendations";
import { getPlans } from "../../utils/auth";
import { evaluateInterviewSession } from "../../utils/interviewsApi";

const IS = { strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

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
  const [evaluating,   setEvaluating]   = useState(false);
  const [evalError,    setEvalError]     = useState("");
  const [realFeedback, setRealFeedback]  = useState(null);   // null = not loaded
  const [sessionMeta,  setSessionMeta]   = useState({ position: "", duration: 0, overallComment: "" });

  useEffect(() => {
    const sessionId = location.state?.sessionId;
    if (!sessionId) return;

    setEvaluating(true);
    const answers = transcripts.map((t, i) => ({ questionIndex: i, transcript: t || "" }));

    evaluateInterviewSession(sessionId, answers)
      .then(res => {
        if (!res.success || !res.evaluation?.perQuestion?.length) {
          setEvalError("Không thể tạo phản hồi AI. Đang hiển thị kết quả mẫu.");
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
      })
      .catch(() => setEvalError("Lỗi kết nối. Đang hiển thị kết quả mẫu."))
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

  const renderStars = (score, max = 5) => (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.floor(score) ? "fill-amber-400 text-amber-400" : i < score ? "fill-amber-200 text-amber-400" : "fill-white/15 text-white/20"}`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-foreground">{score.toFixed(1)}</span>
    </div>
  );

  const scoreColor = (s) =>
    s >= 4 ? "bg-emerald-500" : s >= 3 ? "bg-amber-400" : "bg-red-400";

  const scoreBadge = (s) =>
    s >= 4
      ? { cls: "bg-emerald-100 text-emerald-700", label: "Tốt" }
      : s >= 3
      ? { cls: "bg-amber-100 text-amber-700", label: "Khá" }
      : { cls: "bg-red-100 text-red-600", label: "Cần cải thiện" };

  return (
    <div className="pi-page-dashboard-bg relative min-h-full w-full overflow-hidden antialiased text-foreground">
      {/* Loading overlay */}
      {evaluating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#070510]/85 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-400/30 border-t-violet-400" />
          <p className="text-sm font-semibold text-white">Đang phân tích câu trả lời của bạn...</p>
          <p className="text-xs text-white/55">AI đang đánh giá theo chuẩn SHRM/DDI</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#d4ff00]/45 blur-[130px]" />
        <div className="absolute -right-20 top-24 h-[22rem] w-[22rem] rounded-full bg-[#9447ff]/32 blur-[150px]" />
        <div className="absolute left-1/2 top-[30%] h-44 w-[55rem] -translate-x-1/2 bg-gradient-to-r from-[#d4ff00]/20 via-[#d4ff00]/8 to-[#9447ff]/20 blur-[95px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl p-6">
      {/* Error banner */}
      {evalError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Warning className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{evalError}</span>
        </div>
      )}
      {/* Header */}
      <div className="mb-8 flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition-all hover:border-white/35 hover:bg-white/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 active:scale-[0.97]"
          aria-label="Quay lại trang trước"
          title="Quay lại trang trước"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" {...IS} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
            <Check className="h-3.5 w-3.5" /> Hoàn thành phỏng vấn
          </div>
          <h1 className="mb-1 text-foreground" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Kết quả phỏng vấn của bạn
          </h1>
          <p className="text-sm text-muted-foreground">
            {sessionMeta.position || "Phỏng vấn AI"}{sessionMeta.duration > 0 ? ` · ${sessionMeta.duration} phút` : ""} ·{" "}
            {isPro ? allQuestions.length : FREE_LIMIT}/{allQuestions.length} câu hỏi
            {!isPro && (
              <span
                className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-[#8B4DFF]"
                style={{ background: "rgba(139, 77, 255,0.08)", border: "1px solid rgba(139, 77, 255,0.2)" }}
              >
                <Lock className="h-3 w-3" /> 2 câu bị khóa
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Overall Score Banner ─────────────────────────── */}
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #6E35E8 0%, #9B6DFF 100%)" }}>
        {/* Top: big score + STAR */}
        <div className="p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className="mb-1 text-sm text-white/80">
                Tổng điểm{!isPro && <span className="ml-1 text-xs text-white/55">({FREE_LIMIT} câu)</span>}
              </div>
              <div style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>{overallAvg.toFixed(1)}</div>
              <div className="text-sm text-white/80">/5 sao</div>
              <div className="flex gap-0.5 justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(overallAvg) ? "text-amber-400 fill-amber-400" : "text-white/30 fill-white/20"}`} />
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
                  { key: "excellent",  label: "Xuất sắc",      color: "bg-emerald-400", cls: "bg-emerald-100 text-emerald-700" },
                  { key: "proficient", label: "Đạt yêu cầu",   color: "bg-amber-400",   cls: "bg-amber-100 text-amber-700" },
                  { key: "developing", label: "Cần cải thiện",  color: "bg-red-400",     cls: "bg-red-100 text-red-600" },
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
                    <span className="text-[#B4F500] flex-shrink-0 mt-0.5">•</span>
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
        <div className="mb-6 rounded-2xl border border-violet-300/25 bg-violet-500/10 px-5 py-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <ChatTeardropDots className="h-4 w-4 text-violet-200" />
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-100">Nhận xét tổng quan từ AI</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{sessionMeta.overallComment}</p>
        </div>
      )}

      {/* Per-question feedback */}
      <div className="mb-6">
        <h2 className="mb-4 text-foreground" style={{ fontSize: "1rem", fontWeight: 600 }}>
          B. Phân tích từng câu hỏi
        </h2>
        <div className="space-y-3">
          {/* ── Câu hỏi đã mở khóa ─── */}
          {visibleQuestions.map((item, i) => (
            <div key={i} className="card-premium overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#6E35E8]/20 ring-1 ring-[#6E35E8]/35">
                    <span className="text-xs font-bold text-violet-200">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate pr-4 text-sm font-medium leading-relaxed text-foreground">{item.q}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {renderStars(item.overall)}
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scoreBadge(item.overall).cls}`}>
                        {scoreBadge(item.overall).label}
                      </div>
                    </div>
                  </div>
                </div>
                {expandedQ === i ? (
                  <CaretUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <CaretDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
              </button>

              {expandedQ === i && (
                <div className="border-t border-white/10 px-5 pb-5">
                  {/* Voice transcript */}
                  {transcripts[i] && transcripts[i].trim().length > 0 ? (
                    <div
                      className="mt-4 mb-4 rounded-2xl overflow-hidden"
                      style={{ border: "1.5px solid rgba(110, 53, 232,0.15)" }}
                    >
                      <div
                        className="px-4 py-2.5 flex items-center gap-2"
                        style={{ background: "rgba(110, 53, 232,0.06)", borderBottom: "1px solid rgba(110, 53, 232,0.1)" }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(110, 53, 232,0.15)" }}>
                          <Microphone className="w-3 h-3" style={{ color: "#6E35E8" }} />
                        </div>
                        <span className="text-xs font-semibold text-violet-100">
                          Câu trả lời của bạn — được ghi nhận từ giọng nói
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {transcripts[i].trim().split(/\s+/).filter(Boolean).length} từ
                        </span>
                      </div>
                      <div className="px-4 py-3" style={{ background: "rgba(110, 53, 232,0.03)" }}>
                        <div className="flex items-start gap-2">
                          <Quotes className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "rgba(110, 53, 232,0.3)" }} />
                          <p className="flex-1 leading-relaxed text-foreground/95" style={{ fontSize: "0.82rem" }}>
                            {transcripts[i].trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="mt-4 mb-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
                      style={{ background: "rgba(107,114,128,0.05)", border: "1px dashed rgba(107,114,128,0.2)" }}
                    >
                      <Microphone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Chưa có ghi âm cho câu này — trả lời bằng giọng nói trong lần phỏng vấn tiếp theo để xem transcript tại đây.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
                    {STAR_LABELS.map((key) => (
                      <div key={key} className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-center">
                        <p className="mb-1 text-xs text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                        <div className="flex justify-center">{renderStars(item.scores[key])}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Điểm mạnh
                      </h4>
                      <ul className="space-y-1.5">
                        {item.strengths.map((s, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Warning className="h-3.5 w-3.5 text-amber-400" /> Cần cải thiện
                      </h4>
                      <ul className="space-y-1.5">
                        {item.improvements.map((s, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-violet-200" {...IS} />
                      <p className="text-xs font-semibold text-violet-100">Gợi ý câu trả lời tốt hơn</p>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/95">{item.suggestion}</p>
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
                className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"
              >
                {/* Question header — hiện câu hỏi nhưng mờ */}
                <div
                  className="flex items-center gap-4 p-5"
                  style={{ filter: "blur(2px)", userSelect: "none", pointerEvents: "none" }}
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/15">
                    <span className="text-xs font-bold text-violet-200">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate pr-4 text-sm font-medium leading-relaxed text-white/50">{item.q}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} className="h-3.5 w-3.5 fill-white/10 text-white/10" />
                      ))}
                      <span className="ml-1 text-xs text-white/25">—</span>
                    </div>
                  </div>
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#070510]/90 px-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-500/25 px-3 py-1.5 text-xs font-bold text-white">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-violet-200" {...IS} />
                    Câu hỏi {i + 1} · Chỉ dành cho gói Pro
                  </div>

                  <div className="text-center">
                    <p className="mb-1 text-sm font-semibold text-white">Phân tích chi tiết bị khóa</p>
                    <p className="max-w-xs text-xs leading-relaxed text-white/85">
                      Nâng cấp Pro để xem điểm số, điểm mạnh, điểm yếu và gợi ý cải thiện cho câu hỏi này.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6E35E8, #8B4DFF)",
                      boxShadow: "0 4px 20px rgba(110, 53, 232,0.4)",
                    }}
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
          <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-violet-300/35 bg-gradient-to-br from-violet-950/70 to-[#0a0618]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:flex-row">
            <div className="flex-1 text-center sm:text-left">
              <p className="mb-1 text-sm font-bold text-white">Mở khóa phân tích đầy đủ 5/5 câu hỏi</p>
              <p className="text-xs leading-relaxed text-white/88">
                Nâng cấp gói Pro để xem toàn bộ phản hồi, điểm số chi tiết và gợi ý cải thiện cho tất cả câu hỏi trong buổi phỏng vấn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #6E35E8, #8B4DFF)",
                boxShadow: "0 4px 20px rgba(110, 53, 232,0.35)",
              }}
            >
              <Lightning className="h-4 w-4 shrink-0" {...IS} />
              Nâng cấp ngay
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mb-6 rounded-2xl border border-violet-200/55 bg-white/88 p-4 shadow-[0_10px_30px_rgba(76,29,149,0.08)] backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">Tiếp tục luyện tập</h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate("/interview")}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #6E35E8, #9B6DFF)", boxShadow: "0 4px 16px rgba(110, 53, 232,0.3)" }}
        >
          <Microphone className="h-4 w-4 shrink-0" {...IS} />
          Phỏng vấn lại
        </button>

        <button
          type="button"
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 rounded-xl border border-violet-300/45 bg-white/90 px-5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:border-violet-400/65 hover:bg-violet-50"
        >
          <BookOpen className="h-4 w-4 shrink-0 text-violet-700" {...IS} />
          <span className="min-w-0">Khóa học</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/mentors")}
          className="flex items-center gap-2 rounded-xl border border-[#c4ff47]/50 bg-zinc-950/55 px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-white/5 transition-all hover:border-[#c4ff47]/65 hover:bg-zinc-950/75"
        >
          <Calendar className="h-4 w-4 shrink-0 text-[#d4ff6a]" {...IS} />
          <span className="min-w-0 text-white">Tìm mentor</span>
          <span className="shrink-0 rounded-full border border-[#c4ff47]/25 bg-[#c4ff47]/12 px-2 py-0.5 text-[10px] font-bold text-[#c4ff47]">
            Cải thiện 3×
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.1] px-5 py-2.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.14]"
        >
          <SquaresFour className="h-4 w-4 shrink-0 text-white" {...IS} />
          Bảng điều khiển
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.1] px-5 py-2.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.14]"
        >
          <DownloadSimple className="h-4 w-4 shrink-0 text-white" {...IS} />
          Tải PDF
        </button>
      </div>
      </div>

      {/* ── Course Recommendations ─────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-violet-200/55 bg-white/88 p-4 shadow-[0_10px_30px_rgba(76,29,149,0.08)] backdrop-blur-sm">
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
  );
}