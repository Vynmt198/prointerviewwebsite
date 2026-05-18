import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Zap,
  AlertTriangle as Warning,
  Mic,
  Users,
  Briefcase,
  ArrowLeft,
  Lock,
  Percent as SealPercent,
  PlusCircle,
  Wrench,
  Trash2 as Trash,
  BarChart3,
  Lightbulb,
  Loader2,
  Upload,
  CloudUpload,
  Download as DownloadSimple,
  Eye,
  RotateCcw as History,
  Search,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";
import {
  getPlans,
  getCVRemaining,
  incrementCVCount,
  CV_FREE_LIMIT,
} from "../../utils/auth";
import { apiUrl as expressApiUrl, isExpressBackendConfigured } from "../../utils/api";
import {
  CVDocumentPreview,
  DocPanel,
} from "../../components/cv/CVDocumentPreview";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { addCVAnalysisRecord } from "../../utils/history";
import { projectId, publicAnonKey } from "/utils/supabase/info.js";

// ─── API base ─────────────────────────────────────────────────────────────────
const EDGE_FN = "make-server-64a0c849";
const USE_EXPRESS_CV = isExpressBackendConfigured();
const SUPABASE_CONFIGURED = Boolean(String(import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "").trim());
const API_BASE = SUPABASE_CONFIGURED
  ? `https://${projectId}.supabase.co/functions/v1/${EDGE_FN}`
  : "";

function getSessionId() {
  const key = "prointerview_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// This server does NOT list "apikey" in Access-Control-Allow-Headers,
// so sending it as a header causes CORS preflight to fail with
// "Failed to fetch". Only Authorization is safe to include.
function apiHeaders(userToken) {
  const t = userToken ?? "";
  const hasToken = !!(t && t !== "null" && t !== "undefined" && t.length > 20);
  if (!hasToken) return {};
  return { Authorization: `Bearer ${t}` };
}

function supabaseApiUrl(path) {
  if (!SUPABASE_CONFIGURED) return "";
  return `${API_BASE}/${path}`;
}

/**
 * JWT từ backend (/api/auth). Edge function Supabase có thể không chấp nhận token này —
 * khi đó CV vẫn chạy ở chế độ demo (không gửi Bearer).
 */
async function getForceRefreshedToken() {
  try {
    const { getFreshAccessToken } = await import("../../utils/auth");
    return await getFreshAccessToken();
  } catch {
    return "";
  }
}

/** Rebuild FormData for retry requests */
function buildFd(
  cvFile,
  reuseCV,
  jdFile,
  reuseJD,
  analyzeModeParam,
  selectedField,
) {
  const fd = new FormData();
  if (cvFile) fd.append("cv", cvFile);
  else if (reuseCV) fd.append("cvPath", reuseCV.path);
  if (jdFile && analyzeModeParam === "jd") fd.append("jd", jdFile);
  else if (reuseJD && analyzeModeParam === "jd")
    fd.append("jdPath", reuseJD.path);
  fd.append("mode", analyzeModeParam);
  if (selectedField) fd.append("field", selectedField);
  return fd;
}

/** FastAPI trả `detail` (string hoặc mảng validation); Express dùng `error`. */
function formatCvAnalyzerHttpError(status, body) {
  const e = body ?? {};
  if (typeof e.detail === "string" && e.detail.trim()) return e.detail.trim();
  if (Array.isArray(e.detail)) {
    const parts = e.detail
      .map((d) =>
        d && typeof d === "object" && d.msg
          ? String(d.msg)
          : typeof d === "string"
            ? d
            : "",
      )
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  if (typeof e.error === "string" && e.error.trim()) return e.error.trim();
  return `CV Analyzer lỗi ${status}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FIELDS = [
  "IT / Công nghệ",
  "Marketing",
  "Tài chính / Kế toán",
  "Nhân sự",
  "Quản lý sản phẩm",
  "Thiết kế / UX",
  "Kinh doanh",
  "Vận hành",
];

const DEMO_MATCHED = [
  "React",
  "TypeScript",
  "Node.js",
  "REST API",
  "Agile",
  "Git",
];
const DEMO_JD_KWS = [
  "React",
  "TypeScript",
  "Node.js",
  "Docker",
  "AWS",
  "CI/CD",
  "REST API",
  "PostgreSQL",
  "Agile",
  "Git",
];
const DEMO_SCORES = [
  {
    criteria: "Clarity (Rõ ràng)",
    score: 7,
    max: 10,
    status: "good",
    note: "CV có cấu trúc khá rõ, các mục được trình bày logic.",
  },
  {
    criteria: "Structure (STAR)",
    score: 6,
    max: 10,
    status: "ok",
    note: "Phần kinh nghiệm chưa theo format STAR đầy đủ.",
  },
  {
    criteria: "Relevance (Liên quan JD)",
    score: 8,
    max: 10,
    status: "good",
    note: "6/10 từ khóa kỹ thuật trong JD có trong CV.",
  },
  {
    criteria: "Credibility (Thuyết phục)",
    score: 5,
    max: 10,
    status: "warn",
    note: "Thiếu số liệu KPI cụ thể.",
  },
];
const DEMO_SUGGESTIONS = [
  {
    type: "fix",
    priority: "high",
    title: 'Cải thiện bullet: "Tối ưu hiệu năng React cho trang chủ…"',
    reason:
      "Thêm STAR format · Nhúng từ khóa JD: performance, load time · Thêm số liệu KPI",
    before: "• Tối ưu hiệu năng React cho trang chủ",
    after:
      "• Phân tích bottleneck trang chủ (LCP 4.2s), áp dụng lazy loading + code splitting, cải thiện Lighthouse 65→92 và giảm 40% load time.",
    keywordsAdded: ["lazy loading", "code splitting", "Lighthouse"],
    starCheck: { situation: true, action: true, result: true },
    confidence: "high",
  },
  {
    type: "fix",
    priority: "high",
    title: 'Cải thiện bullet: "Xây dựng REST API với Node.js…"',
    reason: "Thiếu Result đo lường · Thêm từ khóa: scalability, uptime",
    before: "• Xây dựng REST API với Node.js",
    after:
      "• Thiết kế và triển khai 12 RESTful endpoints (Node.js/Express), xử lý 50k req/day với 99.9% uptime.",
    keywordsAdded: ["RESTful", "scalability", "uptime"],
    starCheck: { situation: false, action: true, result: true },
    confidence: "medium",
  },
  {
    type: "add",
    priority: "high",
    title: "Thêm Docker & AWS vào Kỹ năng",
    reason: "JD yêu cầu Docker & AWS bắt buộc.",
    before: "Tools: Git, Webpack, Vite",
    after: "Tools: Git, Webpack, Docker, AWS (EC2, S3)",
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  },
  {
    type: "add",
    priority: "high",
    title: "Đề cập CI/CD trong Kinh nghiệm",
    reason: "JD yêu cầu CI/CD pipeline.",
    before: "• Quản lý source code qua Git",
    after: "• Quản lý Git, thiết lập CI/CD với GitHub Actions",
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  },
  {
    type: "add",
    priority: "medium",
    title: "Thêm PostgreSQL vào Database",
    reason: "JD đề cập PostgreSQL là DB chính.",
    before: "Database: MySQL, MongoDB",
    after: "Database: MySQL, MongoDB, PostgreSQL",
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  },
  {
    type: "remove",
    priority: "low",
    title: "Loại bỏ kỹ năng không liên quan JD",
    reason: "Photoshop/Illustrator làm phân tán khỏi vai trò FE.",
    before: "Others: Photoshop, Illustrator",
    after: "Others: Figma, Storybook, Jest",
    keywordsAdded: [],
    starCheck: {},
    confidence: null,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────
export function CVAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans] = useState(getPlans());
  const [cvRemaining, setCvRemaining] = useState(getCVRemaining());

  // Page-level view
  const [pageView, setPageView] = useState("analysis");

  // Upload / analysis flow
  const [step, setStep] = useState("upload");
  const [cvUploaded, setCvUploaded] = useState(false);
  const [jdUploaded, setJdUploaded] = useState(false);
  const [selectedField, setSelectedField] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);
  const [dragOverCV, setDragOverCV] = useState(false);
  const [dragOverJD, setDragOverJD] = useState(false);

  // Real file state
  const [cvFile, setCvFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const cvInputRef = useRef(null);
  const jdInputRef = useRef(null);

  // Results
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedFileInfo, setSavedFileInfo] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Re-analysis from stored paths
  const [reuseCV, setReuseCV] = useState(null);
  const [reuseJD, setReuseJD] = useState(null);

  // History
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState(null);

  const [activeWord, setActiveWord] = useState(null);
  const [popoverInfo, setPopoverInfo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  // NEW: Optional JD/Field checkboxes
  const [enableJD, setEnableJD] = useState(USE_EXPRESS_CV);
  const [enableField, setEnableField] = useState(false);

  const canAnalyze = plans.starterPro || plans.elitePro || cvRemaining > 0;
  const isFreeTier = !plans.starterPro && !plans.elitePro;

  // Derived mode based on checkboxes
  const derivedMode = enableJD ? "jd" : enableField ? "field" : "cv-only";

  // ── Derived result data ─────────────────────────────────────────────────
  const R = analysisResult;
  const matchScore = R?.matchScore ?? 72;
  const overallScore = R?.overallScore ?? matchScore;
  const matchedSet = new Set(R ? R.matchedKeywords : DEMO_MATCHED);
  const cvDisplayKWs = R ? R.matchedKeywords : DEMO_MATCHED;
  const jdDisplayKWs = R
    ? [...R.matchedKeywords, ...R.missingKeywords]
    : DEMO_JD_KWS;
  const scoreTableData = R
    ? [
        {
          criteria: "Clarity (Rõ ràng)",
          score: R.scores.clarity,
          max: 10,
          status:
            R.scores.clarity >= 8
              ? "good"
              : R.scores.clarity >= 6
                ? "ok"
                : "warn",
          note: R.scoreNotes?.clarity ?? "",
        },
        {
          criteria: "Structure (STAR)",
          score: R.scores.structure,
          max: 10,
          status:
            R.scores.structure >= 8
              ? "good"
              : R.scores.structure >= 6
                ? "ok"
                : "warn",
          note: R.scoreNotes?.structure ?? "",
        },
        {
          criteria: "Relevance (Liên quan JD)",
          score: R.scores.relevance,
          max: 10,
          status:
            R.scores.relevance >= 8
              ? "good"
              : R.scores.relevance >= 6
                ? "ok"
                : "warn",
          note: R.scoreNotes?.relevance ?? "",
        },
        {
          criteria: "Credibility (Thuyết phục)",
          score: R.scores.credibility,
          max: 10,
          status:
            R.scores.credibility >= 8
              ? "good"
              : R.scores.credibility >= 6
                ? "ok"
                : "warn",
          note: R.scoreNotes?.credibility ?? "",
        },
      ]
    : DEMO_SCORES;
  const suggestionsData = R?.suggestions ?? DEMO_SUGGESTIONS;
  const strengthsData = R?.strengths ?? [
    "React & TypeScript — khớp hoàn toàn với JD",
    "Node.js + REST API phù hợp",
    "Agile/Scrum đã có trong CV",
    "Dự án e-commerce liên quan",
  ];
  const weaknessesData = R?.weaknesses ?? [
    "Thiếu Docker, AWS, CI/CD",
    "Không có PostgreSQL",
    "Mô tả thiếu số liệu KPI",
    "Kinh nghiệm chưa theo STAR",
  ];
  const highCount = suggestionsData.filter((s) => s.priority === "high").length;
  const mediumCount = suggestionsData.filter(
    (s) => s.priority === "medium",
  ).length;
  const lowCount = suggestionsData.filter((s) => s.priority === "low").length;

  // ── Reset handler (currently not triggered) ────────────────────────────
  const resetForm = () => {
    setStep("upload");
    setCvUploaded(false);
    setJdUploaded(false);
    setCvFile(null);
    setJdFile(null);
    setSelectedField("");
    setProgress(0);
    setAnalysisResult(null);
    setSavedFileInfo(null);
    setAnalyzeError(null);
    setReuseCV(null);
    setReuseJD(null);
    setEnableJD(USE_EXPRESS_CV);
    setEnableField(false);
  };

  // ── Load history when switching to history tab ──────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      if (!SUPABASE_CONFIGURED) {
        setHistoryList([]);
        setHistoryError("Lịch sử CV cần cấu hình Supabase (VITE_SUPABASE_PROJECT_ID). Phân tích CV+JD vẫn hoạt động qua backend.");
        return;
      }
      const token = await getForceRefreshedToken();
      const res = await fetch(supabaseApiUrl("cv/analyses"), {
        headers: apiHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải lịch sử");
      setHistoryList(data.analyses ?? []);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pageView === "history") loadHistory();
  }, [pageView, loadHistory]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPopoverInfo(null);
        setActiveWord(null);
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── File change handlers ────────────────────────────────────────────────
  const handleCVFile = (file) => {
    setCvFile(file);
    setCvUploaded(true);
    setReuseCV(null);
  };
  const handleJDFile = (file) => {
    setJdFile(file);
    setJdUploaded(true);
    setReuseJD(null);
    setEnableJD(true);
    setEnableField(false);
  };

  // ── Main analyze handler ────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const hasCVInput = cvUploaded || !!reuseCV;
    if (!hasCVInput) return;
    if (!canAnalyze) return;

    if (!plans.starterPro && !plans.elitePro) {
      setCvRemaining((prev) => Math.max(0, prev - 1));
      incrementCVCount();
    }

    setStep("loading");
    setAnalyzeError(null);
    setProgress(0);
    setLoadingStage(0);

    // Use derivedMode instead of mode
    const analyzeMode = derivedMode === "cv-only" ? "field" : derivedMode;

    if (cvFile || reuseCV) {
      // ── Real API path ──────────────────────────────────────────────────
      let pct = 0;
      const timer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 5 + 1.5, 88);
        setProgress(pct);
        if (pct > 15) setLoadingStage(1);
        if (pct > 40) setLoadingStage(2);
        if (pct > 65) setLoadingStage(3);
      }, 700);

      try {
        // Storage paths: set by Supabase flow; null for Python-service path
        let cvStoragePath = null;
        let jdStoragePath = null;

        // ── Helpers ────────────────────────────────────────────────────────
        const applyResult = (d) => {
          setAnalysisResult(d.analysis);
          setSavedFileInfo({
            analysisId: d.analysisId,
            cvSignedUrl: d.cvSignedUrl,
            jdSignedUrl: d.jdSignedUrl,
            cvFileName: cvFile?.name ?? reuseCV?.name ?? "cv",
            jdFileName: jdFile?.name ?? reuseJD?.name ?? null,
            cvStoragePath,
            jdStoragePath,
          });
          addCVAnalysisRecord({
            id: `cv-${Date.now()}`,
            date: new Date().toLocaleDateString("vi-VN"),
            mode: analyzeMode,
            cvFile: cvFile?.name ?? reuseCV?.name ?? "cv",
            jdFile: jdFile?.name ?? reuseJD?.name ?? null,
            field:
              analyzeMode === "field"
                ? selectedField || "IT / Công nghệ"
                : null,
            company: d.analysis.company ?? null,
            position: d.analysis.position ?? null,
            matchScore: d.analysis.matchScore,
            totalKeywords: d.analysis.totalKeywords,
            matchedKeywords: d.analysis.matchedKeywords,
            missingKeywords: d.analysis.missingKeywords,
            scores: d.analysis.scores,
            strengths: d.analysis.strengths,
            weaknesses: d.analysis.weaknesses,
            suggestions: d.analysis.suggestions,
          });
        };

        const applyMockResult = () => {
          setAnalysisResult({
            _isMocked: true,
            matchScore: derivedMode === "jd" ? 72 : 68,
            totalKeywords: DEMO_JD_KWS.length,
            matchedKeywords,
            missingKeywords: DEMO_JD_KWS.filter(
              (k) => !DEMO_MATCHED.includes(k),
            ),
            scores: { clarity: 7, structure: 6, relevance: 8, credibility: 5 },
            scoreNotes: {
              clarity: DEMO_SCORES[0].note,
              structure: DEMO_SCORES[1].note,
              relevance: DEMO_SCORES[2].note,
              credibility: DEMO_SCORES[3].note,
            },
            position: "Frontend Developer",
            company: derivedMode === "jd" ? "Tech Corp" : null,
            strengths: [
              "CV có cấu trúc rõ ràng, dễ đọc và logic.",
              "Kỹ năng React & TypeScript phù hợp JD.",
              "Đã có kinh nghiệm làm việc thực tế với REST API.",
            ],
            weaknesses: [
              "Thiếu kỹ năng Docker & AWS mà JD yêu cầu bắt buộc.",
              "Không đề cập CI/CD pipeline trong kinh nghiệm.",
              "Thiếu số liệu KPI cụ thể trong các mô tả thành tích.",
            ],
            suggestions,
          });
          setSavedFileInfo(null);
        };

        // Force-refresh the session BEFORE sending so we always have the
        // freshest JWT — avoids the "Invalid JWT" 401 caused by stale tokens.
        // We deliberately do NOT send "apikey" as a header because this server's
        // CORS config blocks it (causes FunctionsFetchError / "Failed to fetch").
        const token = await getForceRefreshedToken();

        // If no token (not authenticated), use demo mode immediately
        if (!token) {
          console.info("📋 CV Analysis: No authentication — using demo mode");
          clearInterval(timer);
          applyMockResult();
          setProgress(100);
          await new Promise((r) => setTimeout(r, 350));
          setStep("result");
          return;
        }

        console.log("✅ CV Analysis — authenticated, token ready");

        let data;

        if (analyzeMode === "jd") {
          // ── Python CV Matcher (qua Express proxy /api/cv/analyze) ──────
          const form = new FormData();
          if (cvFile) form.append("resume", cvFile);
          if (jdFile) form.append("jd", jdFile);

          // Cascade: suggestions (full) → full (scores only) → analyze (basic)
          const ollamaDown = (s) => s === 503 || s === 504;

          let pyRes = await fetch(
            expressApiUrl("/api/cv/analyze/suggestions"),
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form,
            },
          );

          // Tier-2: Ollama có nhưng suggestions thất bại → thử scoring only
          if (ollamaDown(pyRes.status)) {
            const form2 = new FormData();
            if (cvFile) form2.append("resume", cvFile);
            if (jdFile) form2.append("jd", jdFile);
            pyRes = await fetch(expressApiUrl("/api/cv/analyze/full"), {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form2,
            });
          }

          // Tier-3: Ollama hoàn toàn không chạy → basic skill-matching (không LLM)
          let usedFallback = false;
          if (ollamaDown(pyRes.status)) {
            const form3 = new FormData();
            if (cvFile) form3.append("resume", cvFile);
            if (jdFile) form3.append("jd", jdFile);
            pyRes = await fetch(expressApiUrl("/api/cv/analyze"), {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form3,
            });
            usedFallback = true;
          }

          clearInterval(timer);
          setProgress(95);
          setLoadingStage(4);

          if (!pyRes.ok) {
            const errBody = await pyRes.json().catch(() => ({}));
            throw new Error(formatCvAnalyzerHttpError(pyRes.status, errBody));
          }

          const raw = await pyRes.json();
          const m = raw.match ?? {};
          const s = raw.scores ?? null;
          const sugg = raw.suggestions ?? {};

          const matchedSkills = m.matching ?? [];
          const missingSkills = m.missing ?? [];

          // Strengths từ matched skills, weaknesses từ missing
          const strengths = matchedSkills
            .slice(0, 6)
            .map((sk) => `Có kỹ năng "${sk}" phù hợp với yêu cầu JD`);
          const weaknesses = missingSkills
            .slice(0, 6)
            .map((sk) => `Thiếu kỹ năng "${sk}" mà JD yêu cầu`);

          // Map rewritten_bullets → "fix" suggestions (hiển thị trước — high value)
          const bulletSuggestions = (sugg.rewritten_bullets ?? []).map((b) => ({
            type: "fix",
            priority:
              b.confidence === "high"
                ? "high"
                : b.confidence === "low"
                  ? "low"
                  : "medium",
            title: `Cải thiện bullet: "${(b.original ?? "").slice(0, 65)}${(b.original ?? "").length > 65 ? "…" : ""}"`,
            reason: b.changes_made?.length
              ? b.changes_made.join(" · ")
              : "Viết lại theo chuẩn STAR + nhúng từ khóa JD.",
            before: b.original ?? "",
            after: b.rewritten ?? "",
            keywordsAdded: b.keywords_added ?? [],
            starCheck: b.star_check ?? {},
            confidence: b.confidence ?? "medium",
          }));

          // Map missing_skill_suggestions → "add" suggestions
          const missSuggestions = (sugg.missing_skill_suggestions ?? []).map(
            (item) => ({
              type: "add",
              priority: item.priority,
              title: `Bổ sung kỹ năng "${item.skill}"`,
              reason:
                item.reframe_tip && item.reframe_tip !== "N/A"
                  ? item.reframe_tip
                  : item.acquisition_path,
              before: `Chưa có trong CV — ước tính ${item.estimated_effort ?? "không rõ"}`,
              after: item.acquisition_path,
              keywordsAdded: [],
              starCheck: {},
              confidence: null,
            }),
          );

          // Bullet rewrites trước, rồi mới skill gaps
          const suggestions = [...bulletSuggestions, ...missSuggestions];

          data = {
            success: true,
            analysis: {
              matchScore: Math.round(m.match_score ?? 0),
              overallScore: Math.round((s?.overall ?? 0) * 10),
              totalKeywords: m.summary?.jd_total ?? 0,
              matchedKeywords: matchedSkills,
              missingKeywords: missingSkills,
              scores: {
                clarity: s?.clarity?.score ?? 0,
                structure: s?.structure?.score ?? 0,
                relevance:
                  s?.relevance?.score ?? Math.round((m.match_score ?? 0) / 10),
                credibility: s?.credibility?.score ?? 0,
              },
              scoreNotes: {
                clarity:
                  s?.clarity?.reason ??
                  (usedFallback
                    ? "Chỉ phân tích cơ bản — không có điểm AI chi tiết."
                    : ""),
                structure:
                  s?.structure?.reason ??
                  (usedFallback
                    ? "Chỉ phân tích cơ bản — không có điểm AI chi tiết."
                    : ""),
                relevance:
                  s?.relevance?.reason ??
                  (usedFallback
                    ? `Ước tính từ tỷ lệ khớp từ khóa: ${Math.round(m.match_score ?? 0)}%`
                    : ""),
                credibility:
                  s?.credibility?.reason ??
                  (usedFallback
                    ? "Chỉ phân tích cơ bản — không có điểm AI chi tiết."
                    : ""),
              },
              strengths,
              weaknesses,
              suggestions,
              summary: sugg.executive_summary ?? s?.summary ?? "",
              cvText: raw.resume_text ?? "",
              jdText: raw.jd_text ?? "",
            },
          };
        } else {
          // ── Supabase Edge Function (field mode / cv-only) ───────────────
          const fd = buildFd(
            cvFile,
            reuseCV,
            jdFile,
            reuseJD,
            analyzeMode,
            selectedField,
          );
          const headers = apiHeaders(token);
          const url = apiUrl("cv-analysis");

          const res = await fetch(url, { method: "POST", headers, body: fd });

          clearInterval(timer);
          setProgress(95);
          setLoadingStage(4);

          if (!res.ok) {
            if (res.status === 401) {
              console.info(
                "📋 Server authentication issue — using demo result",
              );
              applyMockResult();
              setProgress(100);
              await new Promise((r) => setTimeout(r, 350));
              setStep("result");
              return;
            }
            const errJson = await res.json().catch(() => ({}));
            throw new Error(
              errJson.message || errJson.error || `Server ${res.status}`,
            );
          }

          data = await res.json();
          if (!data?.success)
            throw new Error(data?.error || "Phân tích thất bại");
        }

        applyResult(data);

        setProgress(100);
        await new Promise((r) => setTimeout(r, 350));
        setStep("result");
      } catch (err) {
        clearInterval(timer);
        console.error("CV analysis error:", err);
        setAnalyzeError(err.message ?? "Lỗi phân tích");
        setStep("upload");
      }
    } else {
      // ── Demo path ──────────────────────────────────────────────────────
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) {
          p = 100;
          clearInterval(iv);
          setTimeout(() => setStep("result"), 400);
        }
        setProgress(Math.min(p, 100));
        if (p > 20) setLoadingStage(1);
        if (p > 50) setLoadingStage(2);
        if (p > 75) setLoadingStage(3);
      }, 400);
    }
  };

  // ── Load a history item as the current result ───────────────────────────
  const loadHistoryItem = async (id) => {
    setLoadingAnalysisId(id);
    try {
      const token = await getForceRefreshedToken();
      const res = await fetch(supabaseApiUrl(`cv/analyses/${id}`), {
        headers: apiHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Lỗi tải phân tích");

      setAnalysisResult(data.record.analysis);
      setSavedFileInfo({
        analysisId: data.record.analysisId,
        cvSignedUrl: data.cvSignedUrl,
        jdSignedUrl: data.jdSignedUrl,
        cvFileName: data.record.cvFileName,
        jdFileName: data.record.jdFileName,
      });
      setPageView("analysis");
      setStep("result");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoadingAnalysisId(null);
    }
  };

  // ── Re-analyze from stored paths ────────────────────────────────────────
  const reAnalyze = (item) => {
    navigate(`/cv-analysis`);
    if (item.cvStoragePath)
      setReuseCV({ path: item.cvStoragePath, name: item.cvFileName });
    if (item.jdStoragePath && item.jdFileName) {
      setReuseJD({ path: item.jdStoragePath, name: item.jdFileName });
      setEnableJD(true);
    }
    if (item.field) {
      setSelectedField(item.field);
      setEnableField(true);
    }
    // Pre-mark as uploaded so button activates
    setCvUploaded(true);
    if (item.hasJdFile) setJdUploaded(true);
    setPageView("analysis");
  };

  // ── Delete history item ─────────────────────────────────────────────────
  const deleteAnalysis = async (id) => {
    if (!confirm("Xóa phân tích này và các file đính kèm?")) return;
    setDeletingId(id);
    try {
      const token = await getForceRefreshedToken();
      const res = await fetch(supabaseApiUrl(`cv/analyses/${id}`), {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      setHistoryList((prev) => prev.filter((a) => a.analysisId !== id));
    } catch (err) {
      alert(`Lỗi xóa: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const loadingSteps =
    derivedMode === "jd"
      ? [
          "Đọc và xử lý file CV...",
          "Đọc và xử lý file JD...",
          "Gemini AI phân tích...",
          "Tạo gợi ý chi tiết...",
        ]
      : [
          "Đọc và xử lý file CV...",
          "Gemini AI phân tích...",
          "Chấm điểm tiêu chí...",
          "Tạo gợi ý chi tiết...",
        ];

  const missingKwsData =
    R?.missingKeywords ?? DEMO_JD_KWS.filter((k) => !DEMO_MATCHED.includes(k));

  const handleWordClick = (word, type, e) => {
    e.stopPropagation();
    const markEl = e.target?.closest?.("mark") ?? e.currentTarget;
    const rect = markEl.getBoundingClientRect();
    const lc = word.toLowerCase();
    if (activeWord === lc) {
      setActiveWord(null);
      setPopoverInfo(null);
      return;
    }
    const relatedSug = suggestionsData.find(
      (s) =>
        s.title?.toLowerCase().includes(lc) ||
        s.keywordsAdded?.some((k) => k.toLowerCase().includes(lc)),
    );
    setActiveWord(lc);
    setPopoverInfo({
      word,
      type,
      x: Math.max(8, Math.min(rect.left, window.innerWidth - 344)),
      y: Math.min(rect.bottom + 8, window.innerHeight - 300),
      relatedSug,
    });
  };

  const handleCardClick = (word) => {
    const lc = word.toLowerCase();
    setActiveWord((p) => (p === lc ? null : lc));
    setPopoverInfo(null);
  };

  const toggleCard = (id) =>
    setExpandedCards((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const highlightText = (text, matched, missing) => {
    if (!text?.trim()) return null;
    const kwList = [
      ...matched.map((k) => ({ kw: k, type: "matched" })),
      ...missing.map((k) => ({ kw: k, type: "missing" })),
    ].sort((a, b) => b.kw.length - a.kw.length);
    if (!kwList.length)
      return (
        <span className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {text}
        </span>
      );
    const pattern = kwList
      .map(({ kw }) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const parts = text.split(new RegExp(`(${pattern})`, "gi"));
    return (
      <span className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {parts.map((part, i) => {
          const kwObj = kwList.find(
            ({ kw }) => kw.toLowerCase() === part.toLowerCase(),
          );
          if (!kwObj) return part;
          const isActive = activeWord === kwObj.kw.toLowerCase();
          const isM = kwObj.type === "matched";
          return (
            <mark
              key={i}
              onClick={(e) => handleWordClick(kwObj.kw, kwObj.type, e)}
              title={
                isM
                  ? "✓ Từ khóa khớp JD — click để xem"
                  : "⚠ Thiếu trong JD — click để xem gợi ý"
              }
              style={{
                background: isActive
                  ? isM
                    ? "rgba(180,240,0,0.42)"
                    : "rgba(255,100,30,0.38)"
                  : isM
                    ? "rgba(180,240,0,0.17)"
                    : "rgba(255,140,66,0.14)",
                color: isM ? "#1d4700" : "#7a2e00",
                padding: "1px 4px",
                borderRadius: 4,
                fontWeight: 700,
                cursor: "pointer",
                outline: isActive
                  ? `2px solid ${isM ? "rgba(180,240,0,0.8)" : "rgba(255,100,30,0.8)"}`
                  : "none",
                outlineOffset: 1,
                boxShadow: isActive
                  ? `0 0 10px ${isM ? "rgba(180,240,0,0.45)" : "rgba(255,100,30,0.45)"}`
                  : "none",
                transition: "all 0.15s",
              }}
            >
              {part}
            </mark>
          );
        })}
      </span>
    );
  };

  // Inline keyword highlight for a single text string
  const hlInline = (text) => {
    if (!text) return text;
    const kwList = [
      ...cvDisplayKWs.map((k) => ({ kw: k, type: "matched" })),
      ...missingKwsData.map((k) => ({ kw: k, type: "missing" })),
    ].sort((a, b) => b.kw.length - a.kw.length);
    if (!kwList.length) return text;
    const pattern = kwList
      .map(({ kw }) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const parts = text.split(new RegExp(`(${pattern})`, "gi"));
    return parts.map((part, i) => {
      const kwObj = kwList.find(
        ({ kw }) => kw.toLowerCase() === part.toLowerCase(),
      );
      if (!kwObj) return part;
      const isActive = activeWord === kwObj.kw.toLowerCase();
      const isM = kwObj.type === "matched";
      return (
        <mark
          key={i}
          onClick={(e) => handleWordClick(kwObj.kw, kwObj.type, e)}
          title={isM ? "✓ Khớp JD" : "⚠ Thiếu trong JD"}
          style={{
            background: isActive
              ? isM
                ? "rgba(180,240,0,0.45)"
                : "rgba(255,100,30,0.4)"
              : isM
                ? "rgba(180,240,0,0.22)"
                : "rgba(255,140,66,0.2)",
            color: isM ? "#1d4700" : "#7a2e00",
            padding: "1px 4px",
            borderRadius: 4,
            fontWeight: 600,
            cursor: "pointer",
            border: `1px solid ${isM ? "rgba(130,200,0,0.55)" : "rgba(255,100,30,0.45)"}`,
            outline: isActive
              ? `2px solid ${isM ? "rgba(180,240,0,0.8)" : "rgba(255,100,30,0.8)"}`
              : "none",
            outlineOffset: 1,
            transition: "all 0.15s",
          }}
        >
          {part}
        </mark>
      );
    });
  };

  // Parse plain text into formatted document JSX with structural detection
  const renderDocLines = (text) => {
    if (!text?.trim())
      return <p className="text-sm italic text-slate-400">Không có nội dung</p>;
    const lines = text.split(/\r?\n/);
    let nameShown = false;
    let inHeader = true;
    return lines.map((rawLine, i) => {
      const trimmed = rawLine.trimEnd().trim();
      if (!trimmed) return <div key={i} className="h-2" />;

      // ALL_CAPS section header (Vietnamese + English)
      const letters = [...trimmed].filter((c) => /\p{L}/u.test(c));
      const isSection =
        letters.length >= 2 &&
        letters.every((c) => c === c.toUpperCase()) &&
        !/^\d/.test(trimmed) &&
        trimmed.length <= 70 &&
        !/^[•·\-–—*►]/.test(trimmed);

      if (isSection) {
        inHeader = false;
        return (
          <div key={i} className="mt-4 mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-slate-500">
              {trimmed}
            </span>
            <div className="mt-1 h-px bg-slate-200" />
          </div>
        );
      }

      // Bullet / list item
      if (/^[•·\-–—*►▸]\s/.test(trimmed)) {
        const content = trimmed.replace(/^[•·\-–—*►▸]\s+/, "");
        return (
          <div key={i} className="flex gap-2 py-0.5 pl-0.5">
            <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
            <span className="text-[13px] leading-[1.65] text-slate-700">
              {hlInline(content)}
            </span>
          </div>
        );
      }

      // Numbered list item
      if (/^\d+[.)]\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+[.)]\s+/, "");
        return (
          <div key={i} className="flex gap-2 py-0.5 pl-0.5">
            <span className="mt-0.5 w-3 flex-shrink-0 text-[11px] font-bold text-slate-400">
              {trimmed.match(/^\d+/)[0]}.
            </span>
            <span className="text-[13px] leading-[1.65] text-slate-700">
              {hlInline(content)}
            </span>
          </div>
        );
      }

      // First non-empty line = Name
      if (!nameShown) {
        nameShown = true;
        return (
          <div
            key={i}
            className="mb-0.5 text-[15px] font-bold leading-snug text-slate-900"
          >
            {hlInline(trimmed)}
          </div>
        );
      }

      // Header area (before first section)
      if (inHeader) {
        return (
          <div key={i} className="mb-0.5 text-[12px] leading-5 text-slate-500">
            {hlInline(trimmed)}
          </div>
        );
      }

      return (
        <div
          key={i}
          className="py-0.5 text-[13px] leading-[1.65] text-slate-700"
        >
          {hlInline(trimmed)}
        </div>
      );
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <MentorPageShell bottomPad="pb-8">
      <div className="relative z-[1] mx-auto w-full max-w-7xl px-6 pb-4 pt-4 sm:px-8 sm:pb-6 sm:pt-6">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <FileText
              className="size-6 shrink-0 text-lime-900"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 sm:text-[11px]">
              Phân tích CV/JD
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Phân tích CV <span className="text-[#6E35E8]">& JD</span>
          </h1>
          <p className="max-w-2xl text-base font-semibold leading-relaxed text-slate-600 sm:text-lg">
            Hệ thống AI đa năng tự động phân tích CV, trích xuất kỹ năng chuyên
            môn từ JD và tạo đề xuất cải thiện hồ sơ phù hợp. Lưu trữ sẵn sàng
            cho Phỏng vấn AI thực tế.
          </p>
        </div>

        <div className="w-full rounded-[28px] border border-slate-200 bg-white/95 px-6 pb-10 pt-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:px-8">
          {/* Page tabs */}
          <div className="flex gap-2 mb-6">
            {[
              {
                val: "analysis",
                label: "Phân tích mới",
                icon: <Search className="w-4 h-4" />,
              },
              {
                val: "history",
                label: "Lịch sử",
                icon: <History className="w-4 h-4" />,
              },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() =>
                  t.val === "history"
                    ? navigate("/cv-analysis/history")
                    : setPageView(t.val)
                }
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${pageView === t.val ? "text-white shadow" : "border border-slate-300 bg-white text-slate-600 hover:border-[#6E35E8]/35"}`}
                style={pageView === t.val ? { background: "#6E35E8" } : {}}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* ═══════════════════════��═══════════════════════════════════════════
          HISTORY VIEW
      ════════════════════════════════════════════════════════════════════ */}
          {pageView === "history" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                  Các phân tích đã lưu trên cloud — file gốc có thể tải lại
                </p>
                <button
                  onClick={loadHistory}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6E35E8] hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </button>
              </div>

              {historyLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#6E35E8] animate-spin" />
                </div>
              )}

              {historyError && (
                <div
                  className="rounded-2xl px-5 py-4 text-sm"
                  style={{
                    background: "rgba(255,140,66,0.08)",
                    border: "1.5px solid rgba(255,140,66,0.3)",
                    color: "#c2550a",
                  }}
                >
                  {historyError}
                </div>
              )}

              {!historyLoading && !historyError && historyList.length === 0 && (
                <div className="text-center py-20">
                  <CloudUpload className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                  <p className="font-medium text-slate-700">
                    Chưa có phân tích nào được lưu
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tải lên CV và phân tích để kết quả được lưu tại đây
                  </p>
                  <button
                    onClick={() => setPageView("analysis")}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "#6E35E8" }}
                  >
                    <Upload className="w-4 h-4" /> Phân tích ngay
                  </button>
                </div>
              )}

              {!historyLoading && historyList.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {historyList.map((item) => {
                    const score = item.matchScore ?? 0;
                    const scoreColor =
                      score >= 75
                        ? "#4A7A00"
                        : score >= 55
                          ? "#6E35E8"
                          : "#CC5C00";
                    const scoreBg =
                      score >= 75
                        ? "rgba(180,240,0,0.12)"
                        : score >= 55
                          ? "rgba(110, 53, 232,0.08)"
                          : "rgba(255,140,66,0.1)";
                    return (
                      <div
                        key={item.analysisId}
                        className="card-premium p-5 hover:shadow-md transition-shadow"
                      >
                        {/* top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="text-xs px-2 py-0.5 rounded-md font-medium"
                                style={{
                                  background:
                                    item.mode === "jd"
                                      ? "rgba(110, 53, 232,0.08)"
                                      : "rgba(255,214,0,0.15)",
                                  color:
                                    item.mode === "jd" ? "#6E35E8" : "#997F00",
                                }}
                              >
                                {item.mode === "jd"
                                  ? "CV+JD"
                                  : (item.field ?? "Theo ngành")}
                              </span>
                              {item.company && (
                                <span className="truncate text-xs text-white/50">
                                  {item.company}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-sm font-semibold text-white">
                              {item.position ?? item.cvFileName}
                            </p>
                            <p className="mt-0.5 text-xs text-white/50">
                              {new Date(item.createdAt).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                          <div
                            className="flex-shrink-0 text-center px-3 py-1.5 rounded-xl"
                            style={{ background: scoreBg }}
                          >
                            <span
                              className="font-bold text-lg"
                              style={{ color: scoreColor }}
                            >
                              {score}
                            </span>
                            <p
                              className="text-xs"
                              style={{ color: scoreColor, opacity: 0.7 }}
                            >
                              điểm
                            </p>
                          </div>
                        </div>

                        {/* files row */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {item.hasCvFile && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: "rgba(110, 53, 232,0.07)",
                                color: "#6E35E8",
                              }}
                            >
                              <BadgeCheck className="w-3 h-3" />{" "}
                              {item.cvFileName}
                            </span>
                          )}
                          {item.hasJdFile && item.jdFileName && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: "rgba(110, 53, 232,0.07)",
                                color: "#6E35E8",
                              }}
                            >
                              <BadgeCheck className="w-3 h-3" />{" "}
                              {item.jdFileName}
                            </span>
                          )}
                        </div>

                        {/* actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadHistoryItem(item.analysisId)}
                            disabled={loadingAnalysisId === item.analysisId}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-105"
                            style={{
                              background:
                                "linear-gradient(135deg,#6E35E8,#8B4DFF)",
                            }}
                          >
                            {loadingAnalysisId === item.analysisId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            Xem kết quả
                          </button>
                          <button
                            onClick={() => reAnalyze(item)}
                            title="Phân tích lại với file đã lưu"
                            className="p-2 rounded-xl text-[#6E35E8] hover:bg-[#6E35E8]/10 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAnalysis(item.analysisId)}
                            disabled={deletingId === item.analysisId}
                            className="rounded-xl p-2 text-white/45 transition-colors hover:bg-red-500/15 hover:text-red-300"
                          >
                            {deletingId === item.analysisId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
          ANALYSIS VIEW
      ════════════════════════════════════════════════════════════════════ */}
          {pageView === "analysis" && (
            <div>
              {/* ── UPLOAD ───────────────────────��──────────────────────────── */}
              {step === "upload" && (
                <div>
                  {/* Error */}
                  {analyzeError && (
                    <div
                      className="flex items-start gap-3 rounded-2xl px-5 py-4 mb-6"
                      style={{
                        background: "rgba(255,140,66,0.08)",
                        border: "1.5px solid rgba(255,140,66,0.3)",
                      }}
                    >
                      <Warning className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FF8C42]" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#c2550a]">
                          Phân tích thất bại
                        </p>
                        <p className="text-xs mt-1 text-[#c2550a] opacity-80 leading-relaxed">
                          {analyzeError}
                        </p>
                        {(analyzeError.includes("billing") ||
                          analyzeError.includes("quota") ||
                          analyzeError.includes("limit")) && (
                          <div className="flex gap-4 mt-2 flex-wrap">
                            <a
                              href="https://console.cloud.google.com/billing"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold underline text-[#c2550a] hover:opacity-70"
                            >
                              → Bật billing Google Cloud
                            </a>
                            <a
                              href="https://aistudio.google.com/apikey"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold underline text-[#c2550a] hover:opacity-70"
                            >
                              → Lấy API key mới tại AI Studio
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAnalyzeError(null)}
                        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Đóng"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Usage */}
                  {!plans.starterPro && !plans.elitePro && (
                    <div
                      className="flex items-center justify-between rounded-2xl px-5 py-4 mb-6"
                      style={{
                        background:
                          cvRemaining === 0
                            ? "rgba(255,140,66,0.08)"
                            : "rgba(110, 53, 232,0.06)",
                        border: `1.5px solid ${cvRemaining === 0 ? "rgba(255,140,66,0.3)" : "rgba(110, 53, 232,0.15)"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{
                            background:
                              cvRemaining === 0
                                ? "rgba(255,140,66,0.15)"
                                : "rgba(110, 53, 232,0.12)",
                          }}
                        >
                          {cvRemaining === 0 ? (
                            <Lock className="w-4 h-4 text-[#FF8C42]" />
                          ) : (
                            <SealPercent className="w-4 h-4 text-[#6E35E8]" />
                          )}
                        </div>
                        <div>
                          {cvRemaining === 0 ? (
                            <>
                              <p className="text-sm font-semibold text-[#c2550a]">
                                Đã dùng hết {CV_FREE_LIMIT} lượt miễn phí
                              </p>
                              <p className="text-xs text-[#c2550a] opacity-70">
                                Nâng cấp để phân tích không giới hạn
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-violet-700">
                                {cvRemaining}/{CV_FREE_LIMIT} lượt miễn phí còn
                                lại
                              </p>
                              <p className="text-xs text-slate-500">
                                Nâng cấp để dùng không giới hạn
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
                        style={
                          cvRemaining === 0
                            ? { background: "#FF8C42", color: "#fff" }
                            : {
                                background: "rgba(110, 53, 232,0.1)",
                                color: "#6E35E8",
                              }
                        }
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {cvRemaining === 0 ? "Nâng cấp ngay" : "Xem gói CV Pro"}
                      </button>
                    </div>
                  )}

                  {/* Hidden inputs */}
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCVFile(f);
                    }}
                  />
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleJDFile(f);
                    }}
                  />

                  {/* CV Upload Zone - Always visible with modern full-width design */}
                  <div className="mb-8">
                    <div className="mb-6">
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900">
                        Upload CV của bạn
                      </h3>
                      <p className="text-sm text-slate-600">
                        Bắt đầu bằng việc tải lên CV để phân tích chất lượng
                      </p>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCV(true);
                      }}
                      onDragLeave={() => setDragOverCV(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCV(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleCVFile(f);
                      }}
                      onClick={() => cvInputRef.current?.click()}
                      className={`group relative cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center backdrop-blur-sm transition-all ${dragOverCV ? "border-[#6E35E8] bg-[#6E35E8]/10" : cvUploaded || reuseCV ? "border-[#c4ff47]/60 bg-[#c4ff47]/[0.08]" : "border-slate-300 bg-white hover:border-violet-400/45 hover:bg-violet-50/40"}`}
                      style={
                        cvUploaded || reuseCV
                          ? { background: "rgba(180,240,0,0.06)" }
                          : {}
                      }
                    >
                      {cvUploaded || reuseCV ? (
                        <div className="flex flex-col items-center">
                          <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                            style={{ background: "rgba(180,240,0,0.15)" }}
                          >
                            {reuseCV ? (
                              <BadgeCheck
                                className="w-10 h-10"
                                style={{ color: "#6E9900" }}
                              />
                            ) : (
                              <Check
                                className="w-10 h-10"
                                style={{ color: "#6E9900" }}
                              />
                            )}
                          </div>
                          <p className="font-bold text-lg mb-2 text-[#4A7A00]">
                            {reuseCV
                              ? "Dùng lại file đã lưu"
                              : "CV đã được tải lên"}
                          </p>
                          <p className="text-sm text-[#6E9900] mb-1 font-medium">
                            {cvFile?.name ?? reuseCV?.name}
                          </p>
                          {cvFile && (
                            <p className="text-sm text-slate-500">
                              {(cvFile.size / 1024).toFixed(0)} KB ·{" "}
                              {cvFile.name.split(".").pop()?.toUpperCase()}
                            </p>
                          )}
                          {reuseCV && (
                            <p className="text-sm text-slate-500">
                              Đã lưu trên cloud
                            </p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCvUploaded(false);
                              setCvFile(null);
                              setReuseCV(null);
                              if (cvInputRef.current)
                                cvInputRef.current.value = "";
                            }}
                            className="mt-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" /> Xóa và tải lại
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-3xl bg-[#6E35E8]/10 flex items-center justify-center mb-5 group-hover:bg-[#6E35E8]/20 transition-colors">
                            <FileText className="w-10 h-10 text-[#6E35E8]" />
                          </div>
                          <p className="mb-2 text-lg font-bold text-slate-900">
                            Kéo & thả CV vào đây
                          </p>
                          <p className="mb-6 max-w-md text-slate-600">
                            hoặc click vào vùng này để chọn file từ máy tính của
                            bạn
                          </p>
                          <div className="bg-[#6E35E8] text-white text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-[#6E35E8]/20 hover:shadow-xl hover:shadow-[#6E35E8]/30 hover:-translate-y-0.5 transition-all">
                            <Upload className="w-4 h-4" /> Chọn file CV
                          </div>
                          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                            <FileText className="w-4 h-4" /> PDF, DOC, DOCX, TXT
                            · tối đa 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional modes as modern button toggles */}
                  <div className="mb-8">
                    <div className="mb-4">
                      <h3 className="mb-2 text-base font-bold text-slate-900">
                        Tùy chọn phân tích nâng cao
                      </h3>
                      <p className="text-sm text-slate-600">
                        Chọn một trong các tùy chọn để phân tích chuyên sâu hơn
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Button: Upload JD */}
                      <button
                        onClick={() => {
                          setEnableJD(!enableJD);
                          if (!enableJD) setEnableField(false);
                        }}
                        className={`group relative rounded-2xl border-2 p-6 text-left backdrop-blur-sm transition-all hover:shadow-md ${
                          enableJD
                            ? "border-[#6E35E8] bg-violet-50 shadow-sm"
                            : "border-slate-300 bg-white hover:border-violet-400/35"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                              enableJD
                                ? "bg-[#6E35E8] shadow-lg shadow-[#6E35E8]/25"
                                : "bg-slate-100 group-hover:bg-[#6E35E8]/15"
                            }`}
                          >
                            <Briefcase
                              className={`h-6 w-6 ${enableJD ? "text-white" : "text-slate-500 group-hover:text-violet-500"}`}
                              fill={enableJD ? "currentColor" : "none"}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`font-bold ${enableJD ? "text-violet-950" : "text-slate-900"}`}
                              >
                                Có Job Description
                              </p>
                              {enableJD && (
                                <div className="w-5 h-5 rounded-full bg-[#B4F000] flex items-center justify-center">
                                  <Check className="w-3 h-3 text-[#4A7A00]" />
                                </div>
                              )}
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${enableJD ? "text-slate-700" : "text-slate-600"}`}
                            >
                              Upload JD để phân tích mức độ phù hợp CV với vị
                              trí tuyển dụng cụ thể
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Button: Select Field */}
                      <button
                        onClick={() => {
                          setEnableField(!enableField);
                          if (!enableField) setEnableJD(false);
                        }}
                        className={`group relative rounded-2xl border-2 p-6 text-left backdrop-blur-sm transition-all hover:shadow-md ${
                          enableField
                            ? "border-[#8B4DFF] bg-violet-50 shadow-sm"
                            : "border-slate-300 bg-white hover:border-violet-400/35"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                              enableField
                                ? "bg-[#8B4DFF] shadow-lg shadow-[#8B4DFF]/25"
                                : "bg-slate-100 group-hover:bg-[#8B4DFF]/15"
                            }`}
                          >
                            <Users
                              className={`h-6 w-6 ${enableField ? "text-white" : "text-slate-500 group-hover:text-violet-500"}`}
                              fill={enableField ? "currentColor" : "none"}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p
                                className={`font-bold ${enableField ? "text-violet-950" : "text-slate-900"}`}
                              >
                                Chọn theo ngành nghề
                              </p>
                              {enableField && (
                                <div className="w-5 h-5 rounded-full bg-[#B4F000] flex items-center justify-center">
                                  <Check className="w-3 h-3 text-[#4A7A00]" />
                                </div>
                              )}
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${enableField ? "text-slate-700" : "text-slate-600"}`}
                            >
                              Đánh giá và tinh chỉnh CV đạt chuẩn chuyên nghiệp
                              của từng nhóm ngành.
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* JD Upload zone - conditional */}
                  {enableJD && (
                    <div className="mb-8">
                      <div className="mb-4">
                        <h3 className="mb-1 text-base font-bold text-slate-900">
                          Upload Job Description
                        </h3>
                        <p className="text-sm text-slate-600">
                          Tải lên JD để so sánh với CV của bạn
                        </p>
                      </div>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverJD(true);
                        }}
                        onDragLeave={() => setDragOverJD(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverJD(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) handleJDFile(f);
                        }}
                        onClick={() => jdInputRef.current?.click()}
                        className={`group relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center backdrop-blur-sm transition-all ${dragOverJD ? "border-[#8B4DFF] bg-[#6E35E8]/10" : jdUploaded || reuseJD ? "border-[#c4ff47]/60 bg-[#c4ff47]/[0.08]" : "border-slate-300 bg-white hover:border-violet-400/45 hover:bg-violet-50/40"}`}
                        style={
                          jdUploaded || reuseJD
                            ? { background: "rgba(180,240,0,0.08)" }
                            : {}
                        }
                      >
                        {jdUploaded || reuseJD ? (
                          <div className="flex flex-col items-center">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                              style={{ background: "rgba(180,240,0,0.15)" }}
                            >
                              {reuseJD ? (
                                <BadgeCheck
                                  className="w-8 h-8"
                                  style={{ color: "#6E9900" }}
                                />
                              ) : (
                                <Check
                                  className="w-8 h-8"
                                  style={{ color: "#6E9900" }}
                                />
                              )}
                            </div>
                            <p className="font-bold mb-1 text-[#4A7A00]">
                              {reuseJD
                                ? "Dùng lại file đã lưu"
                                : "JD đã được tải lên"}
                            </p>
                            <p className="text-sm text-[#6E9900] mb-1 font-medium">
                              {jdFile?.name ?? reuseJD?.name}
                            </p>
                            {jdFile && (
                              <p className="text-sm text-slate-500">
                                {(jdFile.size / 1024).toFixed(0)} KB ·{" "}
                                {jdFile.name.split(".").pop()?.toUpperCase()}
                              </p>
                            )}
                            {reuseJD && (
                              <p className="text-sm text-slate-500">
                                Đã lưu trên cloud
                              </p>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setJdUploaded(false);
                                setJdFile(null);
                                setReuseJD(null);
                                if (jdInputRef.current)
                                  jdInputRef.current.value = "";
                              }}
                              className="mt-3 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <X className="w-4 h-4" /> Xóa
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#8B4DFF]/10 flex items-center justify-center mb-4 group-hover:bg-[#8B4DFF]/15 transition-colors">
                              <Briefcase className="w-8 h-8 text-[#8B4DFF]" />
                            </div>
                            <p className="mb-1 font-bold text-slate-900">
                              Upload Job Description
                            </p>
                            <p className="mb-4 text-sm text-slate-600">
                              Kéo & thả hoặc click để chọn
                            </p>
                            <div className="bg-[#8B4DFF] text-white text-sm font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              <Upload className="w-4 h-4" /> Chọn file JD
                            </div>
                            <p className="mt-4 text-sm text-slate-500">
                              PDF, DOC, DOCX, TXT
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Field selector - conditional */}
                  {enableField && (
                    <div className="mb-8">
                      <div className="mb-4">
                        <h3 className="mb-1 text-base font-bold text-slate-900">
                          Chọn ngành nghề
                        </h3>
                        <p className="text-sm text-slate-600">
                          CV sẽ được đánh giá theo tiêu chuẩn của ngành này
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-300 bg-white p-6 backdrop-blur-sm">
                        <div className="relative">
                          <button
                            onClick={() => setFieldOpen(!fieldOpen)}
                            className="group flex w-full items-center justify-between rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-sm transition-all hover:border-violet-400/40 hover:bg-violet-50/40"
                          >
                            <span
                              className={
                                selectedField
                                  ? "font-medium text-slate-900"
                                  : "text-slate-500"
                              }
                            >
                              {selectedField || "Chọn ngành nghề..."}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 transition-all group-hover:text-violet-500 ${fieldOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          {fieldOpen && (
                            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                              {FIELDS.map((f) => (
                                <button
                                  key={f}
                                  onClick={() => {
                                    setSelectedField(f);
                                    setFieldOpen(false);
                                  }}
                                  className="w-full border-b border-slate-100 px-5 py-3 text-left text-sm font-medium text-slate-700 transition-colors last:border-0 hover:bg-violet-50 hover:text-violet-700"
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gemini badge */}
                  <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-6">
                    <span
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-700"
                      style={{
                        background: "rgba(110, 53, 232,0.08)",
                        border: "1px solid rgba(139, 77, 255,0.25)",
                      }}
                    >
                      <CloudUpload className="h-3.5 w-3.5" /> Files được lưu vào
                      Supabase Storage · Phân tích bởi Gemini 1.5 Flash
                    </span>
                  </div>

                  {/* Large CTA Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleAnalyze}
                      disabled={!canAnalyze || !(cvUploaded || !!reuseCV)}
                      className={`flex items-center gap-3 rounded-2xl px-12 py-4 text-base font-bold transition-all ${canAnalyze && (cvUploaded || reuseCV) ? "text-white shadow-2xl shadow-[#6E35E8]/30 hover:-translate-y-1 hover:shadow-[#6E35E8]/40" : "cursor-not-allowed bg-slate-200 text-slate-400"}`}
                      style={
                        canAnalyze && (cvUploaded || reuseCV)
                          ? {
                              background:
                                "linear-gradient(135deg,#6E35E8,#9B6DFF)",
                            }
                          : {}
                      }
                    >
                      <Zap className="w-5 h-5" />
                      {cvUploaded || reuseCV
                        ? "Bắt đầu phân tích với Gemini AI"
                        : "Vui lòng chọn file CV trước"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── LOADING ─────────────────────────────────────────────────── */}
              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-24 max-w-md mx-auto text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-[#6E35E8]/30"
                    style={{
                      background: "linear-gradient(135deg,#6E35E8,#9B6DFF)",
                    }}
                  >
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <h2 className="mb-3 text-xl font-semibold text-slate-900">
                    Đang xử lý...
                  </h2>
                  <p className="mb-8 text-sm text-slate-600">
                    Hệ thống đang đọc file PDF và phân tích — vui lòng đợi.
                  </p>
                  <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg,#6E35E8,#9B6DFF)",
                      }}
                    />
                  </div>
                  <p className="text-[#6E35E8] text-sm font-medium mb-6">
                    {Math.round(progress)}%
                  </p>
                  <div className="space-y-2 text-left w-full">
                    {loadingSteps.map((t, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                          loadingStage > i
                            ? "text-slate-800"
                            : loadingStage === i
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {loadingStage > i ? (
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Loader2
                            className={`w-4 h-4 flex-shrink-0 text-[#6E35E8] ${loadingStage === i ? "animate-spin" : "opacity-40"}`}
                          />
                        )}
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── RESULT ──────────────────────────────────────────────────── */}
              {step === "result" && (
                <div
                  className="relative"
                  onClick={() => {
                    setPopoverInfo(null);
                    setActiveWord(null);
                  }}
                >
                  <style>{`
                @keyframes cvPopIn { from { opacity:0; transform:translateY(-6px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
                @keyframes cvSlideR { from { transform:translateX(100%); } to { transform:translateX(0); } }
                @keyframes cvFadeIn { from { opacity:0; } to { opacity:1; } }
              `}</style>

                  {/* Notices */}
                  {R?._isMocked && (
                    <div
                      className="mb-4 flex items-center gap-3 rounded-2xl px-5 py-3"
                      style={{
                        background: "rgba(255,214,0,0.08)",
                        border: "1.5px solid rgba(250,204,21,0.35)",
                      }}
                    >
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">
                          Kết quả Demo — Cần đăng nhập để phân tích thực tế
                        </p>
                        <p className="mt-0.5 text-xs text-amber-800/90">
                          Đây là kết quả mẫu — hãy đăng nhập lại để nhận phân
                          tích CV thực từ AI.
                        </p>
                      </div>
                    </div>
                  )}

                  {isFreeTier && (
                    <div
                      className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-4"
                      style={{
                        background:
                          "linear-gradient(135deg,rgba(110,53,232,0.08),rgba(139,77,255,0.05))",
                        border: "1.5px solid rgba(110,53,232,0.2)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(110,53,232,0.15)" }}
                      >
                        <Lock className="w-5 h-5 text-[#6E35E8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          Đang xem bản xem trước — Gói Free
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          Phần đánh giá chi tiết & gợi ý bị ẩn. Nâng cấp để xem
                          đầy đủ.
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#6E35E8,#8B4DFF)",
                        }}
                      >
                        <Zap className="w-3.5 h-3.5" /> Mở khoá
                      </button>
                    </div>
                  )}
                  {savedFileInfo && (
                    <div
                      className="rounded-2xl px-5 py-3 mb-4 flex items-center gap-3 flex-wrap"
                      style={{
                        background: "rgba(180,240,0,0.07)",
                        border: "1.5px solid rgba(180,240,0,0.25)",
                      }}
                    >
                      <BadgeCheck
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "#4A7A00" }}
                      />
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "#4A7A00" }}
                      >
                        Files đã lưu lên cloud
                      </p>
                      <div className="flex items-center gap-2 flex-wrap ml-auto">
                        {savedFileInfo.cvSignedUrl && (
                          <a
                            href={savedFileInfo.cvSignedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
                            style={{
                              background: "rgba(110,53,232,0.1)",
                              color: "#6E35E8",
                            }}
                          >
                            <DownloadSimple className="w-3 h-3" /> CV
                          </a>
                        )}
                        {savedFileInfo.jdSignedUrl && (
                          <a
                            href={savedFileInfo.jdSignedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
                            style={{
                              background: "rgba(110,53,232,0.1)",
                              color: "#6E35E8",
                            }}
                          >
                            <DownloadSimple className="w-3 h-3" /> JD
                          </a>
                        )}
                        <span className="text-xs text-slate-400">
                          ID: {savedFileInfo.analysisId?.slice(0, 8)}…
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Score Header ─────────────────────────────────── */}
                  <div
                    className="mb-3 overflow-hidden rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg,#0f0527 0%,#2d0e6e 35%,#5b21b6 70%,#7c3aed 100%)",
                      boxShadow:
                        "0 8px 32px rgba(110,53,232,0.45), 0 2px 8px rgba(0,0,0,0.3)",
                      position: "relative",
                    }}
                  >
                    {/* Decorative orbs */}
                    <div
                      style={{
                        position: "absolute",
                        top: -50,
                        right: -30,
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle,rgba(167,139,250,0.22) 0%,transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: -40,
                        left: 60,
                        width: 160,
                        height: 160,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle,rgba(196,100,255,0.18) 0%,transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "30%",
                        right: "35%",
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />

                    <div className="relative flex flex-wrap items-center gap-6 px-7 py-6">
                      {/* Score ring */}
                      <div
                        className="relative flex-shrink-0"
                        style={{
                          filter: "drop-shadow(0 0 20px rgba(167,139,250,0.6))",
                        }}
                      >
                        <svg
                          viewBox="0 0 120 120"
                          className="h-[104px] w-[104px] -rotate-90"
                        >
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="14"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            strokeWidth="8"
                            stroke="url(#scoreRingGrad)"
                            strokeDasharray={`${(derivedMode === "jd" ? matchScore : overallScore) * 3.016} 301.6`}
                            strokeLinecap="round"
                            style={{
                              transition:
                                "stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1)",
                            }}
                          />
                          <defs>
                            <linearGradient
                              id="scoreRingGrad"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop offset="0%" stopColor="#c084fc" />
                              <stop offset="60%" stopColor="#e0d0ff" />
                              <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                          <span className="text-[2.1rem] font-black leading-none tracking-tight text-white">
                            {derivedMode === "jd" ? matchScore : overallScore}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                            {derivedMode === "jd" ? "điểm khớp" : "/ 100"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="h-px w-8 flex-shrink-0 rounded-full bg-purple-400/40" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300">
                            {derivedMode === "jd"
                              ? "Kết quả phân tích CV · JD"
                              : "Kết quả phân tích CV"}
                          </p>
                        </div>
                        <p className="mb-3.5 text-[1.25rem] font-black leading-tight text-white">
                          {(() => {
                            const s =
                              derivedMode === "jd" ? matchScore : overallScore;
                            return s >= 75
                              ? "CV khớp rất tốt với vị trí này"
                              : s >= 55
                                ? "CV khớp một phần — cần bổ sung"
                                : "CV cần cải thiện đáng kể";
                          })()}
                        </p>
                        {/* Progress bar */}
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className="relative h-2.5 w-full max-w-[240px] overflow-hidden rounded-full"
                            style={{ background: "rgba(255,255,255,0.1)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${derivedMode === "jd" ? matchScore : overallScore}%`,
                                background:
                                  "linear-gradient(90deg,#a78bfa 0%,#e9d5ff 60%,#ffffff 100%)",
                                boxShadow: "0 0 8px rgba(196,150,255,0.7)",
                              }}
                            />
                          </div>
                          <span
                            className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                            style={{
                              background: (() => {
                                const s =
                                  derivedMode === "jd"
                                    ? matchScore
                                    : overallScore;
                                return s >= 75
                                  ? "rgba(16,185,129,0.25)"
                                  : s >= 55
                                    ? "rgba(251,191,36,0.2)"
                                    : "rgba(239,68,68,0.2)";
                              })(),
                              color: (() => {
                                const s =
                                  derivedMode === "jd"
                                    ? matchScore
                                    : overallScore;
                                return s >= 75
                                  ? "#6ee7b7"
                                  : s >= 55
                                    ? "#fcd34d"
                                    : "#fca5a5";
                              })(),
                              border: (() => {
                                const s =
                                  derivedMode === "jd"
                                    ? matchScore
                                    : overallScore;
                                return `1px solid ${s >= 75 ? "rgba(16,185,129,0.35)" : s >= 55 ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}`;
                              })(),
                            }}
                          >
                            {(() => {
                              const s =
                                derivedMode === "jd"
                                  ? matchScore
                                  : overallScore;
                              return s >= 75
                                ? "Tốt"
                                : s >= 55
                                  ? "Trung bình"
                                  : "Thấp";
                            })()}
                          </span>
                        </div>
                        {/* Stat chips */}
                        <div className="flex flex-wrap gap-2">
                          <div
                            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5"
                            style={{
                              background: "rgba(16,185,129,0.12)",
                              borderColor: "rgba(16,185,129,0.28)",
                            }}
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-300" />
                            <span className="text-sm font-black text-white">
                              {cvDisplayKWs.length}
                            </span>
                            <span className="text-xs text-emerald-200">
                              từ khóa khớp
                            </span>
                          </div>
                          {missingKwsData.length > 0 && (
                            <div
                              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5"
                              style={{
                                background: "rgba(239,68,68,0.12)",
                                borderColor: "rgba(239,68,68,0.28)",
                              }}
                            >
                              <X className="h-3.5 w-3.5 text-red-300" />
                              <span className="text-sm font-black text-white">
                                {missingKwsData.length}
                              </span>
                              <span className="text-xs text-red-200">
                                từ khóa thiếu
                              </span>
                            </div>
                          )}
                          {suggestionsData.filter((s) => s.priority === "high")
                            .length > 0 && (
                            <div
                              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5"
                              style={{
                                background: "rgba(251,146,60,0.12)",
                                borderColor: "rgba(251,146,60,0.28)",
                              }}
                            >
                              <Warning className="h-3.5 w-3.5 text-orange-300" />
                              <span className="text-sm font-black text-white">
                                {
                                  suggestionsData.filter(
                                    (s) => s.priority === "high",
                                  ).length
                                }
                              </span>
                              <span className="text-xs text-orange-200">
                                cần ưu tiên sửa
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawerOpen(true);
                        }}
                        className="group flex flex-shrink-0 flex-col items-center gap-2 rounded-2xl px-6 py-4 text-center transition-all duration-200 hover:scale-[1.05]"
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          backdropFilter: "blur(12px)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                        }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: "rgba(255,255,255,0.15)" }}
                        >
                          <Lightbulb className="h-5 w-5 text-yellow-300" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Tất cả nhận xét
                          </p>
                          <p className="text-[10px] text-purple-200">
                            {suggestionsData.length} gợi ý
                          </p>
                        </div>
                        <span
                          className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[11px] font-black text-[#5b21b6]"
                          style={{ background: "white" }}
                        >
                          {suggestionsData.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ── Overall Summary ─────────────────────────────────── */}
                  <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <BarChart3 className="h-4 w-4 text-[#6E35E8]" />
                      Nhận xét tổng quan
                    </h3>
                    {(R?.summary || derivedMode === "jd") && (
                      <p
                        className="mb-4 border-l-2 pl-3 text-sm leading-relaxed text-slate-600"
                        style={{ borderColor: "rgba(110,53,232,0.35)" }}
                      >
                        {R?.summary ||
                          "CV có nền tảng kỹ thuật tốt với các kỹ năng cốt lõi khớp JD. Tuy nhiên còn thiếu một số công nghệ quan trọng mà JD yêu cầu. Cần bổ sung số liệu KPI và cải thiện format STAR cho phần kinh nghiệm."}
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {scoreTableData.map((row) => (
                        <div key={row.criteria}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-slate-700">
                              {row.criteria}
                            </span>
                            <span
                              className="rounded-md px-1.5 py-0.5 text-[11px] font-bold"
                              style={{
                                background:
                                  row.status === "good"
                                    ? "rgba(34,197,94,0.12)"
                                    : row.status === "ok"
                                      ? "rgba(110,53,232,0.1)"
                                      : "rgba(245,158,11,0.12)",
                                color:
                                  row.status === "good"
                                    ? "#166534"
                                    : row.status === "ok"
                                      ? "#6E35E8"
                                      : "#92400e",
                              }}
                            >
                              {row.score}/{row.max}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(row.score / row.max) * 100}%`,
                                background:
                                  row.status === "good"
                                    ? "#22c55e"
                                    : row.status === "ok"
                                      ? "#6E35E8"
                                      : "#f59e0b",
                              }}
                            />
                          </div>
                          {row.note && (
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                              {row.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Legend Bar ────────────────────────────────────────── */}
                  {derivedMode === "jd" && (
                    <div className="mb-3 flex items-center justify-between text-xs text-slate-500 px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold">
                          i
                        </span>
                        Click vào từ được highlight để xem nhận xét chi tiết
                      </span>
                      <div className="hidden sm:flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{
                              background: "rgba(180,240,0,0.3)",
                              border: "1px solid rgba(130,200,0,0.6)",
                            }}
                          />
                          Khớp JD
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{
                              background: "rgba(255,140,66,0.25)",
                              border: "1px solid rgba(255,100,30,0.5)",
                            }}
                          />
                          Thiếu / Không khớp
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── CV/JD Document Panels ─────────────────────────────── */}
                  {derivedMode === "jd" && (
                    <div className="mb-5 grid gap-4 md:grid-cols-2">
                      {/* CV Panel */}
                      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
                          <span className="h-2 w-2 rounded-full bg-[#6E35E8]" />
                          <span className="text-sm font-semibold text-slate-800">
                            CV ứng viên
                          </span>
                          {(cvFile?.name || reuseCV?.name) && (
                            <span className="ml-auto max-w-[130px] truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                              {cvFile?.name ?? reuseCV?.name}
                            </span>
                          )}
                        </div>
                        {cvFile ? (
                          <div
                            onClick={(e) => {
                              const m = e.target?.closest?.("mark[data-kw]");
                              if (!m) return;
                              e.stopPropagation();
                              handleWordClick(
                                m.getAttribute("data-kw"),
                                m.getAttribute("data-kwtype"),
                                e,
                              );
                            }}
                          >
                            <DocPanel
                              file={cvFile}
                              matchedKws={cvDisplayKWs}
                              missingKws={missingKwsData}
                              side="cv"
                              showHeader={false}
                              maxHeight={460}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex-1 overflow-y-auto p-4"
                            style={{ maxHeight: 460 }}
                          >
                            {R?.cvText ? (
                              renderDocLines(R.cvText)
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                <FileText className="w-7 h-7 opacity-40" />
                                <span className="text-sm">
                                  Không có file CV
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* JD Panel */}
                      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
                          <span className="h-2 w-2 rounded-full bg-[#6E35E8]" />
                          <span className="text-sm font-semibold text-slate-800">
                            Job Description
                          </span>
                          {R?.company && (
                            <span className="ml-auto max-w-[130px] truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                              {R.company}
                            </span>
                          )}
                        </div>
                        {jdFile ? (
                          <div
                            onClick={(e) => {
                              const m = e.target?.closest?.("mark[data-kw]");
                              if (!m) return;
                              e.stopPropagation();
                              handleWordClick(
                                m.getAttribute("data-kw"),
                                m.getAttribute("data-kwtype"),
                                e,
                              );
                            }}
                          >
                            <DocPanel
                              file={jdFile}
                              matchedKws={cvDisplayKWs}
                              missingKws={missingKwsData}
                              side="jd"
                              showHeader={false}
                              maxHeight={460}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex-1 overflow-y-auto p-4"
                            style={{ maxHeight: 460 }}
                          >
                            {R?.jdText ? (
                              renderDocLines(R.jdText)
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                <Briefcase className="w-7 h-7 opacity-40" />
                                <span className="text-sm">
                                  Không có nội dung JD
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── CTAs ──────────────────────────────────────────────── */}
                  <div className="flex gap-3 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => navigate("/interview")}
                      className="flex items-center gap-2 rounded-xl bg-[#6E35E8] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#5C28D9]"
                    >
                      <Mic className="h-4 w-4 shrink-0" /> Phỏng vấn với AI
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/mentors")}
                      className="flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-emerald-100"
                    >
                      <Users className="h-4 w-4 shrink-0 text-emerald-800" />{" "}
                      Đặt lịch Mentor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("upload");
                        setAnalysisResult(null);
                        setSavedFileInfo(null);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
                    >
                      Phân tích lại
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/cv-analysis/history")}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
                    >
                      <History className="h-4 w-4 shrink-0 text-slate-600" />{" "}
                      Xem lịch sử
                    </button>
                  </div>

                  {/* ── Floating Popover ──────────────────────────────────── */}
                  {popoverInfo && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "fixed",
                        left: popoverInfo.x,
                        top: popoverInfo.y,
                        zIndex: 1000,
                        width: 336,
                        animation: "cvPopIn 0.18s ease",
                      }}
                      className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200"
                    >
                      <div
                        className="px-4 py-3 flex items-center gap-2.5"
                        style={{
                          background:
                            popoverInfo.type === "matched"
                              ? "rgba(180,240,0,0.12)"
                              : "rgba(255,120,50,0.1)",
                          borderBottom: `1.5px solid ${popoverInfo.type === "matched" ? "rgba(180,240,0,0.3)" : "rgba(255,120,50,0.25)"}`,
                        }}
                      >
                        <span
                          className="text-base"
                          style={{
                            color:
                              popoverInfo.type === "matched"
                                ? "#1d4700"
                                : "#7a2e00",
                          }}
                        >
                          {popoverInfo.type === "matched" ? "✓" : "⚠"}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              popoverInfo.type === "matched"
                                ? "#1d4700"
                                : "#7a2e00",
                          }}
                        >
                          {popoverInfo.word}
                        </span>
                        <span
                          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            background:
                              popoverInfo.type === "matched"
                                ? "rgba(180,240,0,0.2)"
                                : "rgba(255,120,50,0.15)",
                            color:
                              popoverInfo.type === "matched"
                                ? "#2d5900"
                                : "#7a2e00",
                          }}
                        >
                          {popoverInfo.type === "matched"
                            ? "Khớp JD"
                            : "Thiếu JD"}
                        </span>
                        <button
                          onClick={() => {
                            setPopoverInfo(null);
                            setActiveWord(null);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-4">
                        {popoverInfo.type === "matched" ? (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Từ khóa này xuất hiện trong cả CV và JD — điểm cộng
                            khi đánh giá hồ sơ.
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Từ khóa này có trong JD nhưng chưa thấy trong CV —
                            cần bổ sung để tăng điểm khớp.
                          </p>
                        )}
                        {popoverInfo.relatedSug && (
                          <div
                            className="mt-3 rounded-xl p-3"
                            style={{
                              background: "rgba(110,53,232,0.05)",
                              border: "1px solid rgba(110,53,232,0.12)",
                            }}
                          >
                            <p className="text-[11px] font-bold text-[#6E35E8] mb-1.5">
                              💡 {popoverInfo.relatedSug.title}
                            </p>
                            {popoverInfo.relatedSug.after && (
                              <p className="text-xs text-slate-700 leading-relaxed font-mono">
                                {popoverInfo.relatedSug.after.slice(0, 120)}
                                {popoverInfo.relatedSug.after.length > 120
                                  ? "…"
                                  : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Right Drawer ──────────────────────────────────────── */}
                  {drawerOpen && (
                    <>
                      <div
                        onClick={() => setDrawerOpen(false)}
                        style={{
                          position: "fixed",
                          inset: 0,
                          background: "rgba(0,0,0,0.42)",
                          zIndex: 40,
                          backdropFilter: "blur(2px)",
                          animation: "cvFadeIn 0.2s ease",
                        }}
                      />
                      <div
                        style={{
                          position: "fixed",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 420,
                          zIndex: 50,
                          background: "white",
                          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
                          animation: "cvSlideR 0.25s ease",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg,#6E35E8,#9B6DFF)",
                          }}
                        >
                          <Lightbulb className="w-5 h-5 text-white" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              Tất cả nhận xét
                            </p>
                            <p className="text-xs text-indigo-200">
                              {suggestionsData.length} gợi ý cải thiện
                            </p>
                          </div>
                          <button
                            onClick={() => setDrawerOpen(false)}
                            className="ml-auto p-1.5 rounded-lg hover:bg-white/20 text-white/80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                          {suggestionsData.map((item, i) => {
                            const isAdd = item.type === "add",
                              isFix = item.type === "fix";
                            const kw0 =
                              item.keywordsAdded?.[0] ??
                              (isAdd
                                ? (item.title.match(/"([^"]+)"/)?.[1] ?? "")
                                : "");
                            return (
                              <div
                                key={i}
                                className="p-4 hover:bg-slate-50/60 transition-colors"
                              >
                                <div className="flex items-start gap-2.5 mb-2">
                                  <span
                                    className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg mt-0.5"
                                    style={
                                      isAdd
                                        ? {
                                            background: "rgba(180,240,0,0.15)",
                                            color: "#2d5900",
                                          }
                                        : isFix
                                          ? {
                                              background:
                                                "rgba(110,53,232,0.1)",
                                              color: "#6E35E8",
                                            }
                                          : {
                                              background:
                                                "rgba(255,140,66,0.12)",
                                              color: "#CC5C00",
                                            }
                                    }
                                  >
                                    {isAdd && (
                                      <PlusCircle className="w-3 h-3" />
                                    )}
                                    {isFix && <Wrench className="w-3 h-3" />}
                                    {!isAdd && !isFix && (
                                      <Trash className="w-3 h-3" />
                                    )}
                                    {isAdd
                                      ? "Bổ sung"
                                      : isFix
                                        ? "Chỉnh sửa"
                                        : "Loại bỏ"}
                                  </span>
                                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                                    {item.title}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                  {item.reason}
                                </p>
                                {kw0 && (
                                  <button
                                    onClick={() => {
                                      handleCardClick(kw0);
                                      setDrawerOpen(false);
                                    }}
                                    className="text-[11px] font-semibold text-[#6E35E8] hover:underline flex items-center gap-1"
                                  >
                                    <Zap className="w-3 h-3" /> Highlight trên
                                    CV/JD
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MentorPageShell>
  );
}
