import React, { useState, useEffect } from "react";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { useNavigate } from "react-router";
import {
  BrowserCompatibilityWarning,
  checkSTTSupport,
} from "../../components/interview/BrowserCompatibilityWarning";
import { InterviewLoadingState } from "../../components/interview/InterviewLoadingState";
import {
  Upload,
  ChevronDown,
  Check,
  Mars,
  Venus,
  Building2,
  BriefcaseBusiness,
  LayoutGrid,
  Users,
  Brain,
  Timer,
  BarChart3,
  ArrowRight,
  BadgeCheck,
  Video,
  Mic,
  CloudUpload,
  FileStack,
  AlertCircle,
  CalendarDays,
  Award,
  MousePointerClick,
} from "lucide-react";
import { getLatestCVAnalysis, getUploadedCV, saveUploadedCV } from "../../utils/history";
import { hasAuthCredentials, isLoggedIn } from "../../utils/auth";
import { buildLoginPath } from "../../utils/authGate";
import { generateInterviewQuestions, extractCvTextFromFile, createInterviewSession } from "../../utils/interviewsApi";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";

const INPUT_LIGHT =
  "w-full rounded-xl border border-violet-200/80 bg-white px-4 py-2.5 text-sm text-violet-900 outline-none transition placeholder:text-violet-400 focus:border-[#630ed4]/45 focus:ring-2 focus:ring-violet-100";
const SELECT_TRIGGER =
  "flex w-full items-center justify-between rounded-xl border border-violet-200/80 bg-white px-3.5 py-2.5 text-sm text-violet-900 outline-none transition focus:border-[#630ed4]/45 focus:ring-2 focus:ring-violet-100";
const SELECT_MENU =
  "absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-violet-200 bg-white py-1 shadow-[0_12px_32px_rgba(99,14,212,0.12)]";
const SELECT_ITEM = "w-full px-4 py-2.5 text-left text-sm text-violet-800 hover:bg-violet-50";
const CTA_LIME =
  "bg-gradient-to-r from-[#c4ff47] to-[#d4ff00] text-violet-950 shadow-[0_8px_28px_rgba(196,255,71,0.25)] hover:brightness-110";

const LEVELS = ["Thực tập sinh", "Mới ra trường", "Junior", "Trung cấp", "Senior"];
const FIELDS_LIST = [
  "IT / Công nghệ", "Marketing", "Finance", "HR",
  "Product", "Design", "Sales", "Operations",
];

/** Stroke Lucide chuẩn UI — đồng bộ toàn trang */
const IS = { strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

const PREVIEW_ITEMS = [
  { icon: Brain, title: "5 câu hỏi cá nhân hóa", desc: "AI tạo câu hỏi dựa trên JD & CV của bạn" },
  { icon: Video, title: "Phân tích hành vi theo thời gian thực", desc: "AI đánh giá ánh mắt, biểu cảm, ngôn ngữ cơ thể" },
  { icon: BarChart3, title: "Phân tích lời nói & diễn đạt", desc: "Nội dung STAR, tốc độ nói, từ đệm" },
  { icon: BadgeCheck, title: "Phản hồi chi tiết từng câu", desc: "Điểm số + gợi ý câu trả lời mẫu tốt hơn" },
];

/** Thẻ preview — tím (lime chỉ dùng cho nút CTA) */
const PREVIEW_PASTEL = [
  {
    shell: "border-violet-200/95 bg-violet-50/90 shadow-[0_4px_16px_rgba(99,14,212,0.06)]",
    iconWell: "border-violet-300/90 bg-violet-100",
    iconClass: "text-violet-800",
    title: "text-violet-950",
    body: "text-violet-800",
  },
  {
    shell: "border-violet-300/50 bg-violet-100/50 shadow-[0_4px_16px_rgba(99,14,212,0.08)]",
    iconWell: "border-violet-400/40 bg-violet-200/60",
    iconClass: "text-violet-900",
    title: "text-violet-950",
    body: "text-violet-800",
  },
  {
    shell: "border-violet-200/95 bg-violet-50/90 shadow-[0_4px_16px_rgba(99,14,212,0.06)]",
    iconWell: "border-violet-300/90 bg-violet-100",
    iconClass: "text-violet-800",
    title: "text-violet-950",
    body: "text-violet-800",
  },
  {
    shell: "border-violet-300/50 bg-violet-100/50 shadow-[0_4px_16px_rgba(99,14,212,0.08)]",
    iconWell: "border-violet-400/40 bg-violet-200/60",
    iconClass: "text-violet-900",
    title: "text-violet-950",
    body: "text-violet-800",
  },
];

const SELECTED_BADGE =
  "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-violet-300/60 bg-[#630ed4] shadow-[0_2px_12px_rgba(99,14,212,0.28)]";

function SelectOptionRing({ selected }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        selected
          ? "border-[#630ed4] bg-[#630ed4] shadow-[0_2px_10px_rgba(99,14,212,0.35)]"
          : "border-violet-400 bg-white group-hover:border-[#630ed4]/70"
      }`}
      aria-hidden
    >
      {selected ? (
        <Check className="h-4 w-4 text-white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full bg-violet-200/90 group-hover:bg-violet-300" />
      )}
    </div>
  );
}

const HR_PREVIEWS = {
  male: {
    name: "HR Nam",
    subtitle: "David · Người phỏng vấn AI",
    video: "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336646/Male_jioqsx.mp4",
  },
  female: {
    name: "HR Nữ",
    subtitle: "Sarah · AI Interviewer",
    video: "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4",
  },
};

/** Khung icon — cùng họ glass như Dashboard metric */
function IconFrame({ size = "md", tone = "neutral", className = "", children }) {
  const sz = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const tones = {
    neutral:
      "border-violet-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
    violet:
      "border-violet-300/60 bg-gradient-to-br from-violet-200/70 to-violet-100/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border ${sz} ${tones[tone]} ${className}`}
      aria-hidden
    >
      {children}
    </div>
  );
}

function StepBar({ current = 1 }) {
  const steps = [
    { n: 1, label: "Thiết lập" },
    { n: 2, label: "Chọn HR" },
    { n: 3, label: "Phỏng vấn" },
  ];
  return (
    <div className="mb-8 flex select-none flex-wrap items-center gap-0 sm:mb-10">
      {steps.map((s, i) => (
        <span key={s.n} className="contents">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                s.n === current
                  ? "bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_0_0_3px_rgba(99,14,212,0.18)]"
                  : s.n < current
                    ? "bg-violet-200 text-violet-800"
                    : "border border-violet-200/90 bg-white text-violet-500"
              }`}
            >
              {s.n < current ? <Check className="h-3.5 w-3.5" {...IS} strokeWidth={2.25} /> : s.n}
            </div>
            <span
              className={`text-sm font-semibold ${
                s.n === current ? "text-[#630ed4]" : s.n < current ? "text-violet-800" : "text-violet-500"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-3 h-0.5 min-w-[2rem] flex-1 rounded-full ${
                s.n < current ? "bg-violet-400/70" : "bg-violet-200/80"
              }`}
            />
          )}
        </span>
      ))}
    </div>
  );
}

function FInput({ placeholder, value, onChange }) {
  return (
    <input
      className={INPUT_LIGHT}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Interview() {
  const navigate = useNavigate();

  const [option, setOption] = useState(null);
  const [inputMethod, setInputMethod] = useState(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [hrGender, setHrGender] = useState(null);
  const [flowStep, setFlowStep] = useState(1);
  const [form, setForm] = useState({ company: "", position: "", field: "", level: "" });
  const [fieldOpen, setFieldOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null); // null | "extracting_cv" | "generating_questions" | "creating_session"
  const [extractWarning, setExtractWarning] = useState("");
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  // Option A: bổ sung role/level khi CV không có position (Python không extract field này)
  const [optionAPosition, setOptionAPosition] = useState("");
  const [optionALevel,    setOptionALevel]    = useState("");
  const [optionALevelOpen, setOptionALevelOpen] = useState(false);

  useEffect(() => {
    if (!checkSTTSupport()) setShowBrowserWarning(true);
  }, []);

  const latestCV = getLatestCVAnalysis();
  const storedCV = getUploadedCV();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setCvUploaded(true);
      saveUploadedCV({ name: file.name, size: file.size, type: file.type });
    }
  };

  const canProceedSetup =
    (option === "A" && Boolean(latestCV)) ||
    (option === "B" &&
      ((inputMethod === "cv" && cvUploaded) ||
        (inputMethod === "form" &&
          form.company && form.position && form.field && form.level)));
  const canStart = canProceedSetup && Boolean(hrGender);

  const handleContinueToHr = () => {
    if (!canProceedSetup) return;
    setFlowStep(2);
  };

  const handleStart = async () => {
    if (!canStart || loadingStep) return;
    if (!isLoggedIn()) {
      navigate(buildLoginPath("/interview"));
      return;
    }
    setExtractWarning("");

    // Clear stale session data from previous interview before starting new one
    sessionStorage.removeItem("prointerview_questions");
    sessionStorage.removeItem("prointerview_sessionId");
    sessionStorage.removeItem("prointerview_transcripts");
    sessionStorage.removeItem("prointerview_question_objects");

    let questions = null;
    let result = null;
    try {
      let cvText = "";
      let jdText = "";

      if (option === "A" && latestCV) {
        // Xây context có cấu trúc từ kết quả phân tích CV — chất lượng tốt hơn JSON dump
        const parts = [
          latestCV.position && `Vị trí ứng tuyển: ${latestCV.position}`,
          latestCV.company  && `Công ty: ${latestCV.company}`,
          latestCV.matchedKeywords?.length
            && `Kỹ năng phù hợp với JD: ${latestCV.matchedKeywords.join(", ")}`,
          latestCV.missingKeywords?.length
            && `Kỹ năng còn thiếu: ${latestCV.missingKeywords.join(", ")}`,
          latestCV.strengths?.length
            && `Điểm mạnh:\n${latestCV.strengths.slice(0, 3).map(s => `- ${s}`).join("\n")}`,
          latestCV.weaknesses?.length
            && `Cần cải thiện:\n${latestCV.weaknesses.slice(0, 2).map(w => `- ${w}`).join("\n")}`,
        ];
        cvText = parts.filter(Boolean).join("\n\n");
      } else if (option === "B" && inputMethod === "cv" && uploadedFile) {
        setLoadingStep("extracting_cv");
        const extracted = await extractCvTextFromFile(uploadedFile);
        if (extracted.success && extracted.text) {
          cvText = extracted.text;
        } else {
          // Python service down hoặc file lỗi — offer switch to form
          const proceed = window.confirm(
            "Không thể đọc CV (dịch vụ phân tích đang bảo trì).\n" +
            "Bạn có muốn chuyển sang nhập thông tin thủ công không?"
          );
          if (proceed) {
            setInputMethod("form");
            setFlowStep(1);
            setLoadingStep(null);
            return;
          }
          // User declined → continue with filename as minimal context
          setExtractWarning(
            extracted.error ||
            "Không thể trích xuất text từ CV. AI sẽ tạo câu hỏi dựa trên tên file — chất lượng cá nhân hoá thấp hơn."
          );
          cvText = `Tên file CV: ${uploadedFile.name}`;
        }
      } else if (option === "B" && inputMethod === "form") {
        jdText = [
          form.position && `Vị trí: ${form.position}.`,
          form.company  && `Công ty: ${form.company}.`,
          form.field    && `Lĩnh vực: ${form.field}.`,
          form.level    && `Level kinh nghiệm: ${form.level}.`,
        ].filter(Boolean).join(" ");
      }

      setLoadingStep("generating_questions");
      result = await generateInterviewQuestions({
        cvText,
        jdText,
        // Option A: ưu tiên position từ CV phân tích; nếu null thì dùng input bổ sung
        position: option === "A"
          ? (latestCV?.position || optionAPosition || "")
          : form.position,
        field: option === "A" ? "" : form.field,
        level: option === "A"
          ? (optionALevel || "")
          : form.level,
      });

      if (result?.success && result.questions?.length) {
        questions = result.questions;
      } else if (result && !result.success) {
        setExtractWarning(`AI không thể tạo câu hỏi cá nhân hóa (${result.error || "lỗi không xác định"}).`);
        setLoadingStep(null);
        return;
      }
    } catch (err) {
      setExtractWarning(`Không thể kết nối tới máy chủ để tạo câu hỏi. Vui lòng thử lại.`);
      setLoadingStep(null);
      return;
    }

    // Tạo session ngay sau khi có questions — trước khi vào phòng
    // sessionId được truyền vào InterviewRoom để lưu từng câu trả lời
    setLoadingStep("creating_session");
    let sessionId = null;
    if (hasAuthCredentials()) {
      try {
        const created = await createInterviewSession(hrGender, {
          ...(questions                  && { questions }),
          ...(result?.inferredRole       && { inferredRole: result.inferredRole }),
          ...(result?.inferredSeniority  && { inferredSeniority: result.inferredSeniority }),
          ...(result?.competencyProfile  && { competencyProfile: result.competencyProfile }),
          ...(result?.coverageScore      && { coverageScore: result.coverageScore }),
        });
        if (created.success) sessionId = created.sessionId;
      } catch {
        // graceful degradation — phỏng vấn vẫn chạy, không lưu MongoDB
      }
    }

    setLoadingStep(null);

    const interviewData = {
      option,
      inputMethod,
      hrGender,
      questions,
      sessionId,
      ...(option === "A" && { useLatestAnalysis: true, latestCV }),
      ...(option === "B" && inputMethod === "cv" && { storedCV }),
      ...(option === "B" && inputMethod === "form" && { form }),
    };

    sessionStorage.setItem("prointerview_hr_gender", hrGender);
    navigate("/interview/room", { state: interviewData });
  };

  const optBase =
    "group relative w-full rounded-2xl border-2 p-6 text-left transition-all duration-200 sm:p-8";
  const optIdle =
    "cursor-pointer border-dashed border-violet-300 bg-white hover:border-violet-400 hover:bg-violet-50/90 hover:shadow-[0_8px_24px_rgba(99,14,212,0.1)] active:scale-[0.99]";
  const optOn =
    "border-solid border-[#630ed4] bg-violet-50/95 shadow-[0_10px_32px_rgba(99,14,212,0.16)] ring-4 ring-violet-200/70";

  return (
    <MentorPageShell bottomPad="pb-24">
      {/* ── Browser STT compatibility warning ─────────────────── */}
      {showBrowserWarning && (
        <BrowserCompatibilityWarning
          onProceed={() => setShowBrowserWarning(false)}
          onCancel={() => navigate("/")}
        />
      )}

      {/* ── Loading step overlay ───────────────────────────────── */}
      {loadingStep && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-violet-950/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <p className="mb-6 text-center text-base font-bold text-violet-800">
              Đang chuẩn bị phỏng vấn...
            </p>
            <InterviewLoadingState currentStep={loadingStep} />
          </div>
        </div>
      )}

      <style>{`
        .interview-setup-panel {
          background: #ffffff;
          border: 2px solid rgba(95, 0, 240, 0.28);
          border-radius: 1.75rem;
          box-shadow: 0 12px 32px rgba(99, 14, 212, 0.08);
        }
      `}</style>

      <div className={`relative flex min-h-0 flex-col bg-transparent pb-8 pt-10 sm:pt-12 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className={`${CUSTOMER_SHELL_MAX} flex flex-col`}>
          <div className="mb-6 sm:mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#630ed4]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600 sm:text-[11px]">
                ProInterview · Phỏng vấn AI
              </span>
            </div>
            <h1 className="max-w-3xl font-headline tracking-tight">
              <span className="block text-[clamp(1.65rem,3.5vw,2.35rem)] font-extrabold leading-[1.12] text-violet-950">
                Thiết lập{" "}
                <span className="text-[#630ed4]">Phỏng vấn AI</span>
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] font-medium leading-relaxed text-violet-600 sm:text-base">
              Khởi động không gian phỏng vấn mô phỏng. Cung cấp thông tin để AI tối ưu bộ câu hỏi cá nhân hoá dành riêng cho bạn.
            </p>
          </div>

        <div className="interview-setup-panel w-full px-5 pb-8 pt-6 sm:px-7 sm:pb-10 sm:pt-8">
        <StepBar current={flowStep} />

        {flowStep === 1 && (
        <section className="mb-8 rounded-2xl border border-violet-100/90 bg-violet-50/30 p-6 sm:p-9">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] text-xs font-bold text-white shadow-lg">
              1
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-violet-900">Chọn nguồn thông tin</h2>
          </div>

          <p className="mb-4 flex items-center justify-center gap-2 text-center text-xs font-bold text-violet-700 sm:text-sm">
            <MousePointerClick className="h-4 w-4 shrink-0 text-[#630ed4]" {...IS} />
            Chọn một trong hai thẻ bên dưới
          </p>

          <div className="mb-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <button
              type="button"
              aria-pressed={option === "A"}
              onClick={() => { if (latestCV) { setOption("A"); setInputMethod(null); } }}
              disabled={!latestCV}
              className={`${optBase} ${option === "A" ? optOn : optIdle} ${!latestCV ? "cursor-not-allowed opacity-55" : ""}`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <SelectOptionRing selected={option === "A"} />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    option === "A" ? "bg-[#630ed4] text-white" : "bg-violet-100 text-violet-700"
                  }`}
                >
                  Tùy chọn 1
                </span>
              </div>
              <div
                className={`mb-4 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border py-6 sm:min-h-[8rem] ${
                  option === "A"
                    ? "border-violet-300/80 bg-white"
                    : "border-violet-200/80 bg-violet-50/60"
                }`}
              >
                <FileStack
                  className={`h-11 w-11 ${option === "A" ? "text-[#630ed4]" : "text-violet-500"}`}
                  {...IS}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-center text-base font-extrabold text-violet-950">CV/JD có sẵn</p>
              <p className="mt-1 text-center text-[11px] leading-relaxed text-violet-600">
                Dùng kết quả phân tích đã lưu
              </p>
              {latestCV ? (
                <div className="mt-3 w-full rounded-xl border border-violet-200/80 bg-violet-50/90 p-3 text-left">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-violet-700">
                    Phân tích gần nhất
                  </p>
                  <p className="truncate text-xs font-bold text-violet-800">{latestCV.position || "—"}</p>
                  {latestCV.company && (
                    <p className="text-[11px] text-violet-500">{latestCV.company}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {latestCV.matchScore != null && (
                      <span className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                        <Award className="h-2.5 w-2.5" />
                        {latestCV.matchScore}% phù hợp
                      </span>
                    )}
                    {latestCV.date && (
                      <span className="flex items-center gap-1 text-[10px] text-violet-400">
                        <CalendarDays className="h-2.5 w-2.5" />
                        {latestCV.date}
                      </span>
                    )}
                  </div>
                  {latestCV.matchedKeywords?.length > 0 && (
                    <p className="mt-2 text-[10px] text-violet-500 leading-relaxed">
                      <span className="font-semibold text-violet-600">Skills: </span>
                      {latestCV.matchedKeywords.slice(0, 5).join(", ")}
                      {latestCV.matchedKeywords.length > 5 && ` +${latestCV.matchedKeywords.length - 5}`}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="mt-3 w-full rounded-xl border border-violet-200/80 bg-violet-50/80 p-3 text-left"
                >
                  <p className="text-[11px] text-violet-700">
                    Chưa có phân tích CV nào. Hãy dùng tính năng{" "}
                    <span className="font-bold">CV Analysis</span> trước.
                  </p>
                </div>
              )}
            </button>

            <button
              type="button"
              aria-pressed={option === "B"}
              onClick={() => { setOption("B"); setInputMethod(null); }}
              className={`${optBase} ${option === "B" ? optOn : optIdle}`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <SelectOptionRing selected={option === "B"} />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    option === "B" ? "bg-[#630ed4] text-white" : "bg-violet-100 text-violet-700"
                  }`}
                >
                  Tùy chọn 2
                </span>
              </div>
              <div
                className={`mb-4 flex min-h-[7rem] flex-col items-center justify-center rounded-xl border py-6 sm:min-h-[8rem] ${
                  option === "B"
                    ? "border-violet-300/80 bg-white"
                    : "border-violet-200/80 bg-violet-50/60"
                }`}
              >
                <CloudUpload
                  className={`h-11 w-11 ${option === "B" ? "text-[#630ed4]" : "text-violet-500"}`}
                  {...IS}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-center text-base font-extrabold text-violet-950">Tải mới</p>
              <p className="mt-1 text-center text-[11px] leading-relaxed text-violet-600">
                Upload CV hoặc nhập tay
              </p>
            </button>
          </div>

          {/* Bổ sung position + level khi Option A nhưng CV không có — Python không extract fields này */}
          {option === "A" && latestCV && !latestCV.position && (
            <div className="border-t border-violet-200/70 pt-4">
              <div className="space-y-2 rounded-xl border border-violet-200/60 bg-violet-50/70 p-3">
                <p className="text-[10px] font-semibold text-violet-700">
                  Thêm thông tin để AI cá nhân hóa câu hỏi tốt hơn
                </p>
                <input
                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs text-violet-800 placeholder:text-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  placeholder="Vị trí ứng tuyển (vd: Frontend Developer)"
                  value={optionAPosition}
                  onChange={(e) => setOptionAPosition(e.target.value)}
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOptionALevelOpen(!optionALevelOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                  >
                    <span className={optionALevel ? "text-violet-800" : "text-violet-400"}>
                      {optionALevel || "Level kinh nghiệm (tùy chọn)"}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-violet-400 transition-transform ${optionALevelOpen ? "rotate-180" : ""}`} {...IS} />
                  </button>
                  {optionALevelOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-violet-200 bg-white shadow-lg">
                      {["", ...LEVELS].map((l) => (
                        <button
                          key={l || "none"}
                          type="button"
                          onClick={() => { setOptionALevel(l); setOptionALevelOpen(false); }}
                          className="w-full px-3 py-2 text-left text-xs text-violet-700 hover:bg-violet-50"
                        >
                          {l || "Không chọn"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {option === "B" && (
            <div className="border-t border-violet-200/70 pt-6">
              <div className="mb-5 flex flex-wrap gap-2">
                {([
                  { id: "cv", icon: Upload, label: "Tải lên CV" },
                  { id: "form", icon: LayoutGrid, label: "Điền thông tin" },
                ]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInputMethod(t.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      inputMethod === t.id
                        ? "border border-[#630ed4]/35 bg-violet-100 text-[#630ed4] shadow-sm"
                        : "border border-violet-200/80 bg-white text-violet-600 hover:border-violet-300 hover:bg-violet-50/50"
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-white">
                      <t.icon className="h-4 w-4 text-[#630ed4]" {...IS} />
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>

              {inputMethod === "cv" && (
                <div
                  className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                    cvUploaded
                      ? "border-violet-300/70 bg-violet-50/80"
                      : "border-violet-200/80 bg-white hover:border-violet-300/80 hover:bg-violet-50/30"
                  }`}
                >
                  {cvUploaded ? (
                    <div className="flex flex-col items-center">
                      <IconFrame size="lg" tone="violet" className="mb-3 rounded-2xl">
                        <Check className="h-6 w-6 text-violet-700" {...IS} strokeWidth={2.25} />
                      </IconFrame>
                      <p className="text-sm font-black text-violet-900">CV đã được tải lên thành công</p>
                      <p className="mt-1 text-xs text-violet-500">
                        {uploadedFile?.name} · {(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCvUploaded(false); }}
                        className="mt-3 text-xs font-semibold text-violet-700 underline underline-offset-2 hover:text-[#630ed4]"
                      >
                        Tải lại
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center">
                      <IconFrame size="lg" tone="violet" className="mb-3 rounded-2xl">
                        <FileStack className="h-6 w-6 text-violet-900" {...IS} strokeWidth={2.25} />
                      </IconFrame>
                      <p className="text-sm font-black text-violet-900">Kéo & thả CV hoặc click để chọn</p>
                      <p className="mt-1 text-xs text-violet-500">PDF, DOC, DOCX · Tối đa 5 MB</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                </div>
              )}

              {inputMethod === "form" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-200/70 bg-violet-50">
                        <Building2 className="h-3.5 w-3.5 text-[#630ed4]" {...IS} />
                      </span>
                      Tên công ty
                    </label>
                    <FInput
                      placeholder="Shopee, Vingroup, FPT..."
                      value={form.company}
                      onChange={(v) => setForm({ ...form, company: v })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-200/70 bg-violet-50">
                        <BriefcaseBusiness className="h-3.5 w-3.5 text-[#630ed4]" {...IS} />
                      </span>
                      Vị trí ứng tuyển
                    </label>
                    <FInput
                      placeholder="Frontend Developer..."
                      value={form.position}
                      onChange={(v) => setForm({ ...form, position: v })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-200/70 bg-violet-50">
                        <LayoutGrid className="h-3.5 w-3.5 text-[#630ed4]" {...IS} />
                      </span>
                      Lĩnh vực / Ngành nghề
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setFieldOpen(!fieldOpen); setLevelOpen(false); }}
                        className={`${SELECT_TRIGGER} ${fieldOpen ? "ring-2 ring-violet-100" : ""} ${
                          form.field ? "" : "text-violet-500"
                        }`}
                      >
                        <span>{form.field || "Chọn ngành..."}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-violet-400 transition-transform ${fieldOpen ? "rotate-180" : ""}`}
                          {...IS}
                        />
                      </button>
                      {fieldOpen && (
                        <div className={SELECT_MENU}>
                          {FIELDS_LIST.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => { setForm({ ...form, field: f }); setFieldOpen(false); }}
                              className={SELECT_ITEM}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-violet-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-violet-200/70 bg-violet-50">
                        <Users className="h-3.5 w-3.5 text-[#630ed4]" {...IS} />
                      </span>
                      Level kinh nghiệm
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setLevelOpen(!levelOpen); setFieldOpen(false); }}
                        className={`${SELECT_TRIGGER} ${levelOpen ? "ring-2 ring-violet-100" : ""} ${
                          form.level ? "" : "text-violet-500"
                        }`}
                      >
                        <span>{form.level || "Chọn level..."}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-violet-400 transition-transform ${levelOpen ? "rotate-180" : ""}`}
                          {...IS}
                        />
                      </button>
                      {levelOpen && (
                        <div className={SELECT_MENU}>
                          {LEVELS.map((l) => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => { setForm({ ...form, level: l }); setLevelOpen(false); }}
                              className={SELECT_ITEM}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
        )}

        {flowStep === 2 && (
        <>
        <section className="mb-5 rounded-2xl border border-violet-100/90 bg-violet-50/30 p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <IconFrame tone="violet">
              <Users className="h-5 w-5 text-violet-700" {...IS} />
            </IconFrame>
            <div>
              <h2 className="font-semibold text-violet-900" style={{ fontSize: "1.125rem" }}>
                Chọn giới tính HR AI
              </h2>
              <p className="mt-0.5 text-xs text-violet-500">Chọn 1 trong 2 tùy chọn bên dưới</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setHrGender("male")}
              className={`${optBase} ${hrGender === "male" ? optOn : optIdle}`}
            >
              {hrGender === "male" && (
                <div className={SELECTED_BADGE}>
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
                </div>
              )}
              <div className="mb-3 flex justify-center">
                <IconFrame tone="violet" size="lg">
                  <Mars className="h-10 w-10 text-violet-700" {...IS} />
                </IconFrame>
              </div>
              <p className="mb-1 text-sm font-black text-violet-900">{HR_PREVIEWS.male.name}</p>
              <p className="text-xs leading-relaxed text-violet-600">{HR_PREVIEWS.male.subtitle}</p>
            </button>

            <button
              type="button"
              onClick={() => setHrGender("female")}
              className={`${optBase} ${hrGender === "female" ? optOn : optIdle}`}
            >
              {hrGender === "female" && (
                <div className={SELECTED_BADGE}>
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
                </div>
              )}
              <div className="mb-3 flex justify-center">
                <IconFrame tone="violet" size="lg">
                  <Venus className="h-10 w-10 text-violet-700" {...IS} />
                </IconFrame>
              </div>
              <p className="mb-1 text-sm font-black text-violet-900">{HR_PREVIEWS.female.name}</p>
              <p className="text-xs leading-relaxed text-violet-600">{HR_PREVIEWS.female.subtitle}</p>
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-violet-300/35 bg-violet-100/70 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <IconFrame tone="violet" className="flex-shrink-0">
              <Video className="h-5 w-5 text-violet-700" {...IS} />
            </IconFrame>
            <div>
              <p className="mb-1.5 text-sm font-bold text-violet-700">Xem video giới thiệu</p>
              <p className="text-sm leading-relaxed text-violet-600">
                Mỗi HR AI có video giới thiệu ngắn giúp bạn làm quen trước khi phỏng vấn. Bạn cũng có thể bỏ qua và vào phòng ngay.
              </p>
            </div>
          </div>
          {hrGender && (
            <div className="mt-4 mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-violet-200/65 bg-violet-950 aspect-[5/4]">
              <video
                src={HR_PREVIEWS[hrGender].video}
                autoPlay
                loop
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </section>
        </>
        )}

        {flowStep === 1 && (
        <section className="mb-8 rounded-2xl border border-violet-100/90 bg-violet-50/30 p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <IconFrame size="sm" tone="violet" className="rounded-lg">
              <Timer className="h-4 w-4 text-violet-700" {...IS} strokeWidth={2.25} />
            </IconFrame>
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-violet-900">Những gì sẽ xảy ra trong buổi phỏng vấn</h2>
            <span className="ml-auto text-xs font-semibold text-violet-500">~30–45 phút</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {PREVIEW_ITEMS.map((item, i) => {
              const p = PREVIEW_PASTEL[i] ?? PREVIEW_PASTEL[0];
              return (
                <div
                  key={i}
                  className={`flex gap-3.5 rounded-[1.35rem] border-2 p-4 transition-shadow hover:shadow-lg sm:p-5 ${p.shell}`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm ${p.iconWell}`}
                  >
                    <item.icon className={`h-5 w-5 ${p.iconClass}`} {...IS} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-black leading-snug ${p.title}`}>{item.title}</p>
                    <p className={`mt-2 text-xs leading-relaxed sm:text-sm ${p.body}`}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-violet-200/70 pt-5">
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-violet-500">
              Quy trình buổi phỏng vấn
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {["AI giới thiệu", "→", "AI đặt câu hỏi", "→", "Bạn trả lời", "→", "AI hỏi thêm", "→", "Nhận kết quả"].map(
                (step, i) =>
                  step === "→" ? (
                    <ArrowRight key={i} className="h-3.5 w-3.5 text-violet-400" {...IS} />
                  ) : (
                    <span
                      key={i}
                      className="rounded-lg border border-violet-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-violet-600"
                    >
                      {step}
                    </span>
                  ),
              )}
            </div>
          </div>
        </section>
        )}

        {flowStep === 1 && (
          <>
            <button
              type="button"
              onClick={handleContinueToHr}
              disabled={!canProceedSetup}
              className={`flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.99] ${
                canProceedSetup
                  ? CTA_LIME
                  : "cursor-not-allowed border border-violet-100 bg-violet-50 text-violet-400"
              }`}
            >
              Tiếp tục: Chọn HR AI
              <ArrowRight className="h-5 w-5" {...IS} strokeWidth={2} />
            </button>

            {!canProceedSetup && (
              <p className="mt-3 text-center text-xs font-medium text-violet-500">
                Vui lòng chọn nguồn thông tin để tiếp tục
              </p>
            )}
          </>
        )}

        {flowStep === 2 && (
          <>
            {extractWarning && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/90 p-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-violet-700 mt-0.5" />
                <p className="text-xs text-violet-800 leading-relaxed">{extractWarning}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart || Boolean(loadingStep)}
              className={`flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.99] ${
                canStart && !loadingStep
                  ? CTA_LIME
                  : "cursor-not-allowed border border-violet-100 bg-violet-50 text-violet-400"
              }`}
            >
              {loadingStep ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {loadingStep === "extracting_cv"       && "Đang đọc CV..."}
                  {loadingStep === "generating_questions" && "AI đang tạo câu hỏi... (15–40 giây)"}
                  {loadingStep === "creating_session"    && "Đang chuẩn bị phiên..."}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" {...IS} strokeWidth={2} />
                  {canStart ? "Bắt đầu Phỏng vấn AI →" : "Chọn HR AI để bắt đầu"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFlowStep(1)}
              className="mt-3 w-full rounded-2xl border border-violet-200/70 bg-white/80 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              Quay lại bước thiết lập
            </button>
          </>
        )}
        </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
