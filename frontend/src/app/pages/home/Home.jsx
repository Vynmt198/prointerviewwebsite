import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Sparkles as Sparkle,
  Sparkles,
  Mic as Microphone,
  FileText,
  Users,
  TrendingUp as TrendUp,
  Star,
  ChevronRight as CaretRight,
  Check,
  Brain,
  Target as Crosshair,
  Award as Medal,
  ArrowRight,
  Zap as Lightning,
  ShieldCheck,
  CheckCircle2,
  BarChart3 as ChartBar,
  Menu as List,
  X,
  LogIn as SignIn,
  UserPlus,
  Lock,
  Upload as UploadSimple,
  Video as VideoCamera,
  BadgeCheck as SealCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import { COURSES_DATA } from "../../data/coursesData";
import { navigateToInterview, requireLoginNavigate } from "../../utils/authGate";
import { Footer } from "../../components/layout/Footer";
import { TopNavShell } from "../../components/layout/TopNavShell";
import { RecommendedJourney } from "../../components/home/RecommendedJourney";
import { BrandLogo } from "../../components/brand/BrandLogo";

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    accentClass: "from-[#B4F500] to-[#8fbc24]",
    bgClass: "bg-lime-50 dark:bg-lime-950/30",
    dotColor: "#B4F500",
    borderHover: "rgba(196, 255, 71,0.5)",
    bgHover: "rgba(196, 255, 71,0.07)",
    title: "Phân tích CV/JD",
    desc: "AI phân tích mức độ phù hợp giữa CV và JD, đưa ra gợi ý tối ưu cụ thể cho từng vị trí.",
    route: "/cv-analysis",
    cta: "Phân tích ngay",
  },
  {
    icon: Brain,
    accentClass: "from-[#6E35E8] to-[#9B6DFF]",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    dotColor: "#6E35E8",
    borderHover: "rgba(110, 53, 232,0.5)",
    bgHover: "rgba(110, 53, 232,0.08)",
    title: "Phỏng vấn thử với AI",
    desc: "Luyện tập với các câu hỏi HR phổ biến, nhận phản hồi chi tiết theo mô hình STAR sau mỗi câu trả lời.",
    route: "/interview",
    cta: "Phỏng vấn thử",
  },
  {
    icon: Users,
    accentClass: "from-[#FFB800] to-[#FF8C42]",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    dotColor: "#FFB800",
    borderHover: "rgba(255,184,0,0.5)",
    bgHover: "rgba(255,184,0,0.07)",
    title: "Mentor 1:1 Thực tế",
    desc: "Đặt lịch phỏng vấn chuyên ngành 1-1 với HR/Manager từ Shopee, Vingroup, FPT và 200+ công ty hàng đầu.",
    route: "/mentors",
    cta: "Tìm Mentor",
  },
  {
    icon: TrendUp,
    accentClass: "from-sky-400 to-blue-600",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    dotColor: "#38BDF8",
    borderHover: "rgba(56,189,248,0.5)",
    bgHover: "rgba(56,189,248,0.07)",
    title: "Theo Dõi Tiến Bộ",
    desc: "Bảng điều khiển cá nhân hóa với biểu đồ tiến bộ, lịch sử phỏng vấn và lộ trình kỹ năng cụ thể.",
    route: "/dashboard",
    cta: "Xem bảng điều khiển",
  },
];

const STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "Phân tích CV/JD",
    desc: "AI phân tích mức độ phù hợp giữa CV và JD, đưa ra gợi ý tối ưu cụ thể cho từng vị trí.",
    color: "#7000ff",
  },
  {
    step: "02",
    icon: Brain,
    title: "Phỏng vấn thử với AI",
    desc: "Luyện tập trả lời với AI chuyên gia, nhận phản hồi chi tiết theo mô hình STAR.",
    color: "#b8f600",
  },
  {
    step: "03",
    icon: Users,
    title: "Mentor 1:1 thực tế",
    desc: "Kết nối và phỏng vấn trực tiếp với các chuyên gia/HR từ những tập đoàn lớn.",
    color: "#7000ff",
  },
  {
    step: "04",
    icon: TrendUp,
    title: "Theo dõi tiến độ",
    desc: "Hệ thống hóa lộ trình phát triển và đo lường sự thăng tiến qua từng buổi tập.",
    color: "#b8f600",
  },
];

const TESTIMONIALS = [
  {
    name: "Phạm Anh Tuấn",
    role: "Software Engineer @ Shopee",
    avatar: "PA",
    grad: "from-[#6E35E8] to-[#9B6DFF]",
    text: "Sau 3 buổi phỏng vấn thử với AI và 1 buổi với mentor từ Shopee, mình tự tin hơn hẳn. Câu hỏi AI đặt ra rất sát thực tế, phản hồi chi tiết giúp mình biết chính xác điểm cần cải thiện.",
    stars: 5,
    tag: "Đã nhận offer",
  },
  {
    name: "Nguyễn Thị Hoa",
    role: "Marketing Executive @ Unilever",
    avatar: "NH",
    grad: "from-pink-500 to-rose-600",
    text: "Phần phân tích CV/JD của ProInterview giúp mình nhận ra CV thiếu nhiều keyword quan trọng. Điểm STAR của mình tăng từ 2.4 lên 4.1 sau 3 tuần luyện tập.",
    stars: 5,
    tag: "Tăng STAR +70%",
  },
  {
    name: "Trần Minh Đức",
    role: "Business Analyst @ KPMG",
    avatar: "TM",
    grad: "from-emerald-500 to-teal-600",
    text: "Tính năng matching CV-JD rất hay, chỉ ra đúng điểm yếu của CV. Mentor từ KPMG chia sẻ insider tips rất thực tế, khác hẳn các tài liệu trên mạng.",
    stars: 5,
    tag: "Mentor 5 sao",
  },
];

const STATS = [
  { value: "10,000+", label: "Ứng viên đã luyện tập" },
  { value: "500+", label: "Mentor chuyên nghiệp" },
  { value: "85%", label: "Tỷ lệ được nhận việc" },
  { value: "4.8/5", label: "Điểm hài lòng" },
];

/** Clip demo phỏng vấn AI — dùng chung hero (cột phải) và mock màn hình khu tính năng. */
const HOME_AI_DEMO_VIDEO =
  "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4";
const NAV_LINKS = [
  { label: "Tính năng", href: "#features" },
  { label: "Khóa học", href: "#courses" },
  { label: "Đánh giá", href: "#mentors" },
  { label: "Bảng giá", href: "#pricing" },
];

/** Hero: video + viền trắng + thẻ feedback chồng góc (không lồng thêm khung tím bên ngoài). */
function HeroInterviewVideoCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,300px)] sm:max-w-[350px] lg:max-w-[380px] lg:justify-self-end">
      <div
        className="relative overflow-hidden rounded-[20px] border-[8px] border-white shadow-[0_20px_48px_-16px_rgba(15,23,42,0.4)] sm:rounded-[22px] sm:border-[10px]"
        style={{ aspectRatio: "19 / 20" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src={HOME_AI_DEMO_VIDEO} type="video/mp4" />
        </video>
        <div
          className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2.5 rounded-full border-2 border-white bg-white py-2.5 pl-2.5 pr-3.5 shadow-[0_10px_32px_-8px_rgba(15,23,42,0.4)] sm:bottom-4 sm:left-4 sm:gap-3 sm:py-3 sm:pl-3 sm:pr-4"
          role="status"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200/90 sm:size-9">
            <Check className="size-4 stroke-[2.5]" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-black leading-tight text-slate-900 sm:text-[13px]">Bạn làm tốt lắm!</p>
            <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">AI Feedback vừa xong</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mock cửa sổ phỏng vấn AI + video + overlay (section Interview Preview). */
function InterviewDemoMockup() {
  const glow = "-inset-6 blur-3xl";
  const shell = "p-1 sm:p-1.5 rounded-[28px]";
  const inner = "rounded-[24px]";
  const chrome = "flex items-center justify-between px-5 py-3.5";
  const titleSz = "text-xs";
  const topBar = "p-4";
  const bottomWrap = "p-5";
  const bubble = "p-4";
  const qLead = "text-xs mb-1.5";
  const qBody = "text-sm leading-relaxed";
  const statsGrid = "grid grid-cols-3 gap-2 mt-3";
  const statCell = "flex items-center gap-2 px-2.5 py-2 rounded-lg";
  const statIcon = "w-3.5 h-3.5";
  const statTxt = "text-xs font-medium";

  return (
    <div className="relative">
      <div
        className={`absolute ${glow} rounded-[32px] opacity-50 pointer-events-none`}
        style={{
          background:
            "radial-gradient(circle, rgba(196,255,71,0.2) 0%, rgba(110, 53, 232,0.35) 45%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className={`glass-card ${shell}`}>
        <div
          className={`relative ${inner} overflow-hidden border-0 bg-[#07060e]/95`}
          style={{
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,255,71,0.08) inset",
          }}
        >
          <div
            className={chrome}
            style={{
              background: "#0A0816",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "#FF5F57" }} />
              <div className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "#FEBC2E" }} />
              <div className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "#28C840" }} />
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2" style={{ background: "rgba(110, 53, 232,0.6)" }} />
              <span className={`truncate font-medium ${titleSz}`} style={{ color: "rgba(255,255,255,0.35)" }}>
                ProInterview — Phỏng vấn AI
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full sm:h-2 sm:w-2" style={{ background: "#FF5F57" }} />
              <span className={`font-semibold ${titleSz}`} style={{ color: "#FF5F57" }}>
                Đang ghi
              </span>
            </div>
          </div>

          <div className="relative bg-[#0A0816]" style={{ aspectRatio: "16/10" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
                style={{ opacity: 0.95 }}
              >
                <source src={HOME_AI_DEMO_VIDEO} type="video/mp4" />
              </video>
            </div>

            <div className="pointer-events-none absolute inset-0">
              <div
                className={`absolute left-0 right-0 top-0 flex items-center justify-between ${topBar}`}
                style={{
                  background: "linear-gradient(to bottom, rgba(18,11,46,0.92), transparent)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full sm:h-2 sm:w-2" style={{ background: "#FF5F57" }} />
                  <span className="font-semibold text-white text-xs">
                    Đang phỏng vấn
                  </span>
                </div>
                <div
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold sm:rounded-lg"
                  style={{
                    background: "rgba(110, 53, 232,0.25)",
                    borderColor: "rgba(110, 53, 232,0.4)",
                    color: "#B89DFF",
                  }}
                >
                  03:24 / 15:00
                </div>
              </div>

              <div
                className={`absolute bottom-0 left-0 right-0 ${bottomWrap}`}
                style={{
                  background: "linear-gradient(to top, rgba(18,11,46,0.95), transparent)",
                }}
              >
                <div
                  className={bubble}
                  style={{
                    background: "rgba(110, 53, 232,0.15)",
                    border: "1px solid rgba(110, 53, 232,0.35)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                  }}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, #6E35E8, #9B6DFF)",
                      }}
                    >
                      <Sparkle className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-white/50 ${qLead}`}>Câu hỏi 2/5</p>
                      <p className={`text-white ${qBody}`}>
                        Hãy kể về một lần bạn phải giải quyết xung đột trong nhóm. Bạn đã xử lý như thế nào?
                      </p>
                    </div>
                  </div>
                </div>

                <div className={statsGrid}>
                  {[
                    { icon: Microphone, label: "Đang nghe", color: "#B4F500" },
                    { icon: Brain, label: "Phân tích STAR", color: "#6E35E8" },
                    { icon: ChartBar, label: "Điểm: 3.8/5", color: "#FFB800" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={statCell}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <item.icon className={`${statIcon} shrink-0`} style={{ color: item.color }} />
                      <span className={statTxt} style={{ color: "rgba(255,255,255,0.6)" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleFeatureClick = (route) => requireLoginNavigate(navigate, route);
  const renderSectionSticks = (sticks) => (
    <div className="pointer-events-none absolute inset-0 z-[5] hidden lg:block" aria-hidden>
      {sticks.map((s, idx) => (
        <Sparkles
          key={`section-stick-${idx}`}
          className="absolute text-slate-400"
          strokeWidth={1.45}
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit={12}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            filter: "drop-shadow(0 0 8px rgba(148,163,184,0.24))",
            transform: `rotate(${
              typeof s.tilt === "number" ? s.tilt : idx % 4 === 0 ? 0 : idx % 4 === 1 ? -18 : idx % 4 === 2 ? 24 : -30
            }deg)`,
          }}
        />
      ))}
    </div>
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    // Check for scrollTo param
    const params = new URLSearchParams(window.location.search);
    const scrollTarget = params.get("scrollTo");
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }, 500);
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen selection:bg-[#B4F500]/30 selection:text-white font-sans overflow-x-hidden relative"
      style={{
        background: "#020202",
        color: "#fff",
      }}
    >
      <style>{`
        /* Lưới ô vuông cực nét từ ảnh mẫu */
        .premium-grid {
          position: fixed;
          inset: 0;
          z-index: -5;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
        }
        
        .cute-glass {
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.28);
        }
        .cute-pill {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
        }
        .cute-card {
          position: relative;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
          transform-style: preserve-3d;
          transition: transform .28s ease, border-color .25s ease, box-shadow .25s ease;
        }
        .cute-card:hover {
          transform: perspective(1000px) translateY(-7px) rotateX(2.5deg) rotateY(-2.5deg);
          border-color: rgba(196, 255, 71,0.42);
          box-shadow:
            0 16px 40px rgba(0,0,0,0.4),
            0 0 36px -8px rgba(196, 255, 71, 0.22),
            0 0 0 1px rgba(196, 255, 71, 0.1) inset;
        }
        .parallax-layer {
          transform: translateZ(18px);
        }
        .card-glow {
          position: absolute;
          inset: -30% -20% auto auto;
          width: 160px;
          height: 160px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(110,53,232,0.22), transparent 70%);
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
        }
        .cute-card:hover .card-glow {
          opacity: 1;
        }
        .card-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: inherit;
        }
        .card-shine::after {
          content: "";
          position: absolute;
          top: -120%;
          left: -45%;
          width: 35%;
          height: 300%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          transform: rotate(18deg) translateX(-180%);
          transition: transform .65s ease;
        }
        .cute-card:hover .card-shine::after {
          transform: rotate(18deg) translateX(480%);
        }
        .cute-heading {
          letter-spacing: -0.035em;
          font-weight: 850;
          line-height: 1.08;
        }
        .sticker-badge {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.24);
          background: rgba(18,11,46,0.78);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.25);
        }
        .float-icon {
          animation: cuteFloat 3.1s ease-in-out infinite;
        }
        .float-icon-delay {
          animation: cuteFloat 3.1s ease-in-out infinite;
          animation-delay: .4s;
        }
        .float-icon-slow {
          animation: cuteFloat 4.2s ease-in-out infinite;
          animation-delay: .2s;
        }
        .hero-badge-animated {
          animation: heroGlowPulse 2.8s ease-in-out infinite;
        }
        .hero-title-animated {
          background-size: 200% 200%;
          animation: heroGradientFlow 5s ease-in-out infinite;
        }
        .hero-orbit-text {
          display: inline-block;
          animation: heroOrbitPop 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center;
          will-change: transform, opacity, filter;
        }
        @keyframes cuteFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes heroGlowPulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(110,53,232,0.0), 0 0 0 rgba(196, 255, 71,0.0);
            transform: translateY(0px);
          }
          50% {
            box-shadow: 0 8px 28px rgba(110,53,232,0.2), 0 0 20px rgba(196, 255, 71,0.12);
            transform: translateY(-1px);
          }
        }
        @keyframes heroGradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes heroOrbitPop {
          0% {
            opacity: 1;
            transform: translate(0px, 0px) scale(1) rotate(0deg);
            filter: blur(0px);
          }
          25% {
            opacity: 1;
            transform: translate(5px, -3px) scale(1.02) rotate(2deg);
            filter: blur(0px);
          }
          50% {
            opacity: 1;
            transform: translate(-4px, 2px) scale(0.99) rotate(-2deg);
            filter: blur(0px);
          }
          75% {
            opacity: 1;
            transform: translate(3px, -2px) scale(1.01) rotate(1deg);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translate(0px, 0px) scale(1) rotate(0deg);
            filter: blur(0px);
          }
        }
        @keyframes shimmer-bg {
          0% { opacity: 0.4; transform: translate(0,0) scale(1); }
          50% { opacity: 0.7; transform: translate(2%, -2%) scale(1.05); }
          100% { opacity: 0.4; transform: translate(0,0) scale(1); }
        }
        .font-headline {
          letter-spacing: -0.045em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.35);
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(48px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.45s ease;
          position: relative;
          overflow: hidden;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg, rgba(236,72,153,0.08) 0%, transparent 42%, rgba(196, 255, 71,0.06) 100%);
          pointer-events: none;
          opacity: 0.85;
        }
        .glass-card:hover {
          border-color: rgba(196, 255, 71, 0.42);
          transform: translateY(-4px) rotate(-0.2deg);
          box-shadow:
            0 24px 48px rgba(0,0,0,0.45),
            0 0 0 1px rgba(196, 255, 71, 0.12) inset,
            0 0 48px -6px rgba(196, 255, 71, 0.28),
            0 0 36px -10px rgba(167, 139, 250, 0.22);
        }
        .section-ambient {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(120px);
          opacity: 0.85;
        }
        /* Loang nền toàn trang — mask loại vùng góc trên trái để không làm chìm logo */
        .home-global-ambient {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          overflow: hidden;
          mask-image: radial-gradient(
            ellipse 300px 96px at 0px 0px,
            transparent 0%,
            transparent 58%,
            rgba(255, 255, 255, 0.92) 100%
          );
          -webkit-mask-image: radial-gradient(
            ellipse 300px 96px at 0px 0px,
            transparent 0%,
            transparent 58%,
            rgba(255, 255, 255, 0.92) 100%
          );
          mask-mode: alpha;
          -webkit-mask-mode: alpha;
        }
        @media (min-width: 640px) {
          .home-global-ambient {
            mask-image: radial-gradient(
              ellipse 340px 104px at 0px 0px,
              transparent 0%,
              transparent 58%,
              rgba(255, 255, 255, 0.94) 100%
            );
            -webkit-mask-image: radial-gradient(
              ellipse 340px 104px at 0px 0px,
              transparent 0%,
              transparent 58%,
              rgba(255, 255, 255, 0.94) 100%
            );
          }
        }
      `}</style>

      {/* Nền loang toàn cục (trừ vùng logo nhờ .home-global-ambient) */}
      <div className="home-global-ambient" aria-hidden>
        <div
          className="absolute -top-[8%] right-[-14%] h-[min(92vw,780px)] w-[min(92vw,780px)] rounded-full opacity-[0.42] blur-[110px]"
          style={{
            background:
              "radial-gradient(circle at 38% 42%, rgba(110,53,232,0.55) 0%, rgba(139,92,246,0.18) 42%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[28%] right-[6%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full opacity-[0.28] blur-[100px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(196,255,71,0.22) 0%, rgba(180,245,0,0.08) 45%, transparent 72%)",
          }}
        />
        <div
          className="absolute bottom-[-12%] left-[8%] h-[min(85vw,640px)] w-[min(85vw,640px)] rounded-full opacity-[0.32] blur-[115px]"
          style={{
            background:
              "radial-gradient(circle at 45% 40%, rgba(56,189,248,0.16) 0%, rgba(110,53,232,0.12) 48%, transparent 74%)",
          }}
        />
        <div
          className="absolute bottom-[8%] right-[-8%] h-[min(75vw,560px)] w-[min(75vw,560px)] rounded-full opacity-[0.26] blur-[105px]"
          style={{
            background:
              "radial-gradient(circle at 55% 55%, rgba(244,114,182,0.14) 0%, rgba(110,53,232,0.1) 50%, transparent 72%)",
          }}
        />
        <div
          className="absolute top-[48%] left-[22%] h-[min(90vw,680px)] w-[min(90vw,680px)] -translate-x-1/2 rounded-full opacity-[0.18] blur-[130px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.2) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ═══ NAVBAR ════════════════════════════════════════ */}
      <TopNavShell variant="dark" scrolled={scrolled}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6">
          {/* Logo */}
          <div
            className="-ml-2 flex shrink-0 cursor-pointer items-center gap-2.5 sm:-ml-3"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <BrandLogo />
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-12">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/10 hover:bg-white/8 whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector(l.href)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2.5">
            {/* Try button — always visible */}
            <button
              type="button"
              onClick={() => navigateToInterview(navigate)}
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 shadow-[0_0_24px_rgba(180,245,0,0.3)] whitespace-nowrap"
              style={{
                background:
                  "linear-gradient(135deg, #B4F500, #80C800)",
                color: "#120B2E",
              }}
            >
              <Lightning className="w-4 h-4 text-[#120B2E]" fill="currentColor" />
              Trải nghiệm thử
            </button>

            {/* Auth buttons */}
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <SignIn className="w-4 h-4" />
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/register")}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <List className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: "rgba(18,11,46,0.97)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 py-4">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    document
                      .querySelector(l.href)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {l.label}
                </a>
              ))}
              <div
                className="mt-3 pt-3 border-t flex flex-col gap-2"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-white hover:bg-white/8 transition-colors"
                >
                  <SignIn className="w-4 h-4" />{" "}
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    navigateToInterview(navigate);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, #B4F500, #8fbc24)",
                    color: "#120B2E",
                  }}
                >
                  <Lightning className="w-4 h-4 text-[#120B2E]" />{" "}
                  Trải nghiệm thử miễn phí
                </button>
              </div>
            </div>
          </div>
        )}
      </TopNavShell>

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative flex min-h-[100dvh] flex-col justify-start overflow-hidden px-5 pb-10 pt-24 lg:min-h-screen lg:pb-12 lg:pt-28">
        {renderSectionSticks([
          { x: 5, y: 11, size: 34, opacity: 0.48 },
          { x: 93, y: 13, size: 40, opacity: 0.55 },
          { x: 3, y: 50, size: 28, opacity: 0.4 },
          { x: 92, y: 80, size: 32, opacity: 0.46 },
        ])}
        {/* BG gradient mesh — tránh loang mạnh góc trên trái (vùng logo/nav) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 88% 68% at 86% -8%, rgba(110,53,232,0.52) 0%, transparent 70%), radial-gradient(ellipse 72% 48% at 80% 84%, rgba(180,245,0,0.16) 0%, transparent 64%), radial-gradient(ellipse 62% 44% at 68% 32%, rgba(196,255,71,0.1) 0%, transparent 72%), #04050a",
          }}
        />
        {/* Ambient glows để nền hero bớt tối — lệch phải / giữa, không đặt trọng tâm gần góc trái */}
        <div
          className="absolute top-[30%] left-[58%] w-[min(92vw,680px)] max-w-[680px] -translate-x-1/2 h-[360px] rounded-full blur-[120px] pointer-events-none sm:left-[60%]"
          style={{
            background:
              "radial-gradient(circle, rgba(180,245,0,0.2) 0%, rgba(110,53,232,0.14) 52%, transparent 78%)",
          }}
          aria-hidden
        />
        <div
          className="absolute top-0 left-0 right-0 h-[160px] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(4,5,10,0.98) 0%, rgba(4,5,10,0.86) 40%, rgba(4,5,10,0) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute top-[18%] right-[8%] w-[420px] h-[420px] rounded-full blur-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.24) 0%, rgba(167,139,250,0.08) 48%, transparent 78%)",
          }}
          aria-hidden
        />
        {/* Noise grain */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "200px",
          }}
          aria-hidden
        />
        {/* Grid overlay từ snippet mẫu */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
          aria-hidden
        />

        {/* Hero content — 2 cột lg: copy trái + video/mockup phải */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,440px)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-14 lg:gap-y-5 xl:gap-x-16">
            <div className="order-1 text-left lg:col-start-1 lg:row-start-1">
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold cute-glass hero-badge-animated lg:mb-5"
                style={{
                  background: "rgba(110, 53, 232,0.15)",
                  borderColor: "rgba(110, 53, 232,0.35)",
                  color: "#B89DFF",
                }}
              >
                <Sparkle className="w-3.5 h-3.5" />
                Nền tảng luyện phỏng vấn với AI
              </div>

              <h1
                className="mb-4 py-2 font-headline text-white leading-[1.08] tracking-tighter cute-heading lg:mb-5"
                style={{
                  fontSize: "clamp(2rem, 5.5vw, 3.5rem)",
                }}
              >
                <span className="text-white">
                  Phỏng vấn{" "}
                </span>
                <span
                  className="hero-title-animated hero-orbit-text"
                  style={{
                    background: "linear-gradient(135deg, #B4F500 0%, #6E35E8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    padding: "0.1em 0",
                  }}
                >
                  1:1 với AI
                </span>
                <span className="text-white"> qua mô phỏng hội thoại thông minh</span>
              </h1>

              <p
                className="mb-6 max-w-2xl leading-relaxed text-white/55 lg:mb-7"
                style={{ fontSize: "1rem" }}
              >
                ProInterview phân tích CV/JD, tạo câu hỏi phỏng vấn
                cá nhân hóa, và kết nối bạn với Mentor HR thực tế từ
                Shopee, Vingroup, FPT và hơn 200 công ty hàng đầu.
              </p>

              <div className="mb-6 flex flex-col gap-3.5 sm:flex-row sm:justify-start lg:mb-0">
                <button
                  type="button"
                  onClick={() => navigateToInterview(navigate)}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-black transition-all hover:brightness-110 active:scale-[0.98] hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, #B4F500, #8fbc24)",
                    color: "#1a1a1a",
                    fontSize: "0.9375rem",
                    boxShadow:
                      "0 0 40px rgba(196, 255, 71,0.3), 0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <Lightning className="w-5 h-5" />
                  Phỏng vấn thử miễn phí
                </button>
                <button
                  type="button"
                  onClick={() => requireLoginNavigate(navigate, "/mentors")}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-semibold transition-all hover:bg-white/12 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "0.9375rem",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Users className="w-5 h-5" />
                  Tìm Mentor ngay
                </button>
              </div>
            </div>

            {/* Cột phải: căn đáy hàng 1 để video không “bay” quá cao so với copy */}
            <div className="order-3 mt-6 flex w-full justify-start lg:order-2 lg:col-start-2 lg:row-start-1 lg:mt-0 lg:flex lg:justify-end lg:self-end">
              <HeroInterviewVideoCard />
            </div>

            {/* Thanh stats — full width, căn giữa; khoảng cách trên lg gọn để còn trong 1 màn */}
            <div className="order-2 mt-6 flex w-full justify-center lg:order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mt-5">
              <div className="glass-card w-full max-w-xl p-2.5 sm:max-w-3xl sm:p-3 lg:max-w-4xl">
                <div className="relative z-[1] grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                  {STATS.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-3 text-center sm:px-3 sm:py-4 md:py-3.5"
                    >
                      <div
                        className="mb-1 font-black text-white"
                        style={{
                          fontSize: "clamp(1.25rem, 3.5vw, 1.5rem)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {s.value}
                      </div>
                      <div className="text-[11px] font-semibold leading-snug text-white/45">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade — hòa vào gradient trang */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #07060e, transparent)",
          }}
          aria-hidden
        />
      </section>



      {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
      <section
        id="features"
        className="relative min-h-screen flex flex-col justify-center py-12 overflow-hidden border-t border-white/[0.06]"
        style={{ background: "#080808" }}
      >
        <div className="section-ambient w-[520px] h-[520px] -top-32 left-[14%] bg-[#B4F500]/[0.14]" aria-hidden />
        <div className="section-ambient w-[560px] h-[560px] top-[38%] right-[-180px] bg-[#6E35E8]/[0.2]" aria-hidden />
        {renderSectionSticks([
          { x: 10, y: 16, size: 34, opacity: 0.45 },
          { x: 88, y: 20, size: 40, opacity: 0.55 },
          { x: 82, y: 78, size: 32, opacity: 0.44 },
        ])}
        {/* Nền phẳng (xen kẽ với section có lưới) */}
        <div className="absolute top-0 left-[18%] w-[500px] h-[500px] bg-[#B4F500]/[0.09] blur-[120px] rounded-full -translate-y-1/2" aria-hidden />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#6E35E8]/12 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" aria-hidden />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-8">
          <div className="text-center mb-14">
            <div className="flex justify-center mb-5">
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-[#B4F500] to-emerald-400" />
            </div>
            <h2 className="text-4xl md:text-6xl text-white mb-4 leading-[1.1] py-2 cute-heading font-headline tracking-tighter">
              Quy trình tinh gọn,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B4F500] via-fuchsia-300 to-violet-300">kết quả đột phá</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Sẵn sàng chinh phục mọi nhà tuyển dụng với lộ trình chuẩn bị được cá nhân hóa bởi trí tuệ nhân tạo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`glass-card group p-6 sm:p-8 relative overflow-hidden transition-[border-color,box-shadow] duration-300 ${i === 1
                  ? "border-[#B4F500]/35 shadow-[0_0_0_1px_rgba(196,255,71,0.12)_inset]"
                  : i === 2
                    ? "border-violet-400/35 shadow-[0_0_0_1px_rgba(167,139,250,0.15)_inset]"
                    : "border-white/[0.12]"
                  }`}
              >
                <div className="relative z-[1]">
                  {/* Hàng nhãn cố định — tránh absolute đè lên icon */}
                  <div className="mb-3 min-h-[30px] flex items-center justify-start">
                    {(i === 1 || i === 2) && (
                      <span
                        className={`inline-flex px-2 py-1 text-[10px] sm:text-[11px] font-bold tracking-wide rounded-md border ${i === 1
                          ? "border-[#B4F500]/55 bg-[#B4F500]/18 text-[#e8ffc4] shadow-[0_0_14px_rgba(196,255,71,0.22)]"
                          : "border-violet-400/55 bg-violet-950/95 text-violet-50 shadow-[0_0_14px_rgba(139,92,246,0.28)]"
                          }`}
                      >
                        {i === 1 ? "Nổi bật" : "Gợi ý mentor"}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-[0.14] transition-opacity pointer-events-none">
                    <span className="text-6xl font-black italic text-white">{s.step}</span>
                  </div>

                  <div
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 shadow-xl float-icon parallax-layer ${i % 2 === 0
                      ? "bg-[#B4F500] text-[#0a0a0c] shadow-[0_0_24px_rgba(196,255,71,0.25)]"
                      : "bg-white/5 text-[#B4F500] border border-white/10 group-hover:bg-[#B4F500]/15 group-hover:border-[#B4F500]/35"
                      }`}
                  >
                    <s.icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white parallax-layer font-headline tracking-tight">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 flex flex-col items-center">
            <button
              onClick={() => handleFeatureClick("/dashboard")}
              className="group relative bg-primary-fixed text-on-primary-fixed px-12 py-5 rounded-full font-black text-xl tracking-tight uppercase transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(196,255,71,0.22)]"
            >
              Bắt đầu ngay
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            <div className="mt-6 flex items-center gap-4">
              <span className="w-12 h-px bg-white/10"></span>
              <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Không cần thẻ tín dụng</span>
              <span className="w-12 h-px bg-white/10"></span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTERVIEW PREVIEW ═══════════════════════════════ */}
      <section
        className="border-t border-white/[0.07] bg-transparent relative"
        style={{
          padding: "64px 0",
          overflow: "hidden",
        }}
      >
        <div className="section-ambient w-[480px] h-[480px] -top-24 left-[-80px] bg-[#6E35E8]/[0.15]" aria-hidden />
        <div className="section-ambient w-[460px] h-[460px] bottom-[-140px] right-[0] bg-[#B4F500]/[0.1]" aria-hidden />
        {renderSectionSticks([
          { x: 14, y: 24, size: 32, opacity: 0.42 },
          { x: 91, y: 16, size: 42, opacity: 0.56 },
          { x: 88, y: 72, size: 34, opacity: 0.46 },
        ])}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left copy */}
            <div className="glass-card p-6 sm:p-8 lg:p-10">
              <div className="relative z-[1]">
                <div className="mb-5 h-1 w-10 rounded-full bg-gradient-to-r from-[#B4F500] to-fuchsia-400" aria-hidden />
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-violet-400/30 bg-violet-500/10 text-violet-200"
                >
                  <Microphone
                    className="w-3.5 h-3.5"
                  />
                  Phòng phỏng vấn ảo
                </span>
                <h2
                  className="text-white mb-5 leading-tight cute-heading"
                  style={{
                    fontSize: "clamp(1.875rem, 4vw, 2.5rem)",
                  }}
                >
                  Trải nghiệm phỏng vấn{" "}
                  <span style={{ color: "#B4F500" }}>
                    như thật
                  </span>
                </h2>
                <p
                  className="mb-8 leading-relaxed"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "1.05rem",
                  }}
                >
                  Phòng phỏng vấn ảo với AI phỏng vấn viên, phản
                  hồi trực quan khi bạn đang nói, và đánh giá chi
                  tiết từng câu trả lời theo mô hình STAR.
                </p>

                <ul className="space-y-3.5 mb-10">
                  {[
                    "AI hỏi 5 câu hỏi cá nhân hóa theo JD",
                    "Nhận diện giọng nói tự động",
                    "Phản hồi tức thì sau mỗi câu trả lời",
                    "Phân tích chi tiết theo mô hình STAR",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(196, 255, 71,0.15)",
                        }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: "#B4F500" }}
                        />
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigateToInterview(navigate)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, #B4F500, #8fbc24)",
                    color: "#1a1a1a",
                    boxShadow: "0 0 28px rgba(196, 255, 71,0.25)",
                  }}
                >
                  Thử ngay miễn phí
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <InterviewDemoMockup />
          </div>
        </div>
      </section>

      {/* ═══ COURSES SECTION ═════════════════════════════════ */}
      <section
        id="courses"
        className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden border-t border-white/[0.06]"
        style={{ background: "#080808" }}
      >
        <div className="section-ambient w-[620px] h-[620px] -top-44 right-[-180px] bg-[#6E35E8]/[0.18]" aria-hidden />
        <div className="section-ambient w-[540px] h-[540px] bottom-[-200px] left-[-160px] bg-[#B4F500]/[0.12]" aria-hidden />
        {renderSectionSticks([
          { x: 12, y: 14, size: 34, opacity: 0.44 },
          { x: 90, y: 26, size: 46, opacity: 0.58 },
          { x: 8, y: 76, size: 30, opacity: 0.4 },
          { x: 84, y: 84, size: 36, opacity: 0.5 },
        ])}
        <div className="absolute top-0 right-[-100px] w-[500px] h-[500px] bg-[#B4F500]/[0.06] blur-[130px] rounded-full" aria-hidden />
        <div className="absolute bottom-[-100px] left-[-100px] w-[600px] h-[600px] bg-[#6E35E8]/12 blur-[150px] rounded-full" aria-hidden />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-12">
          <div className="flex flex-col md:flex-row items-end gap-10 mb-12">
            <div className="md:w-2/3">
              <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[#B4F500] to-emerald-400 mb-4" aria-hidden />
              <span className="font-bold uppercase tracking-[0.2em] text-[10px] mb-3 block text-[#B4F500] drop-shadow-[0_0_12px_rgba(196,255,71,0.25)]">
                Nền tảng học
              </span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-white mb-6">
                Học từ chuyên gia,<br />
                <span className="text-primary-fixed">sửa lỗi ngay.</span>
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                Nâng tầm sự nghiệp với feedback trực tiếp từ Mentor hàng đầu. Hoàn thiện từng câu trả lời thông qua bài tập thực tế.
              </p>
            </div>
            <div className="w-full md:w-1/3 flex justify-end">
              <div className="glass-card !rounded-full px-2 py-1.5 flex items-center gap-3 min-w-0 max-w-full">
                <div className="relative z-[1] flex items-center gap-3 w-full">
                  <div className="flex -space-x-3 px-2">
                    {[1, 2, 3].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Student" className="w-8 h-8 rounded-full border-2 border-white/15 object-cover" />
                    ))}
                  </div>
                  <span className="pr-4 pl-1 text-[11px] font-bold text-[#B4F500]">10k+ Học viên</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {COURSES_DATA.slice(0, 3).map((course, idx) => (
              <div
                key={course.id}
                onClick={() =>
                  handleFeatureClick(`/courses/${course.id}`)
                }
                className="group glass-card overflow-hidden cursor-pointer !rounded-[28px]"
              >
                <div className="relative z-[1]">
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-secondary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {course.category}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {Math.floor(course.duration / 60)}h {course.duration % 60}m
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-4 right-4 px-2.5 py-1 text-[10px] font-black tracking-wide uppercase sticker-badge text-primary-fixed">
                        New
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                      <div className="w-14 h-14 rounded-full bg-primary-fixed/90 flex items-center justify-center shadow-2xl shadow-primary-fixed/30 transform transition-transform border border-white/20 float-icon-delay parallax-layer">
                        <PlayCircle className="w-7 h-7 text-on-primary-fixed translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-7">
                    <h3 className="text-xl font-bold mb-5 text-white group-hover:text-primary-fixed transition-colors leading-tight line-clamp-2 parallax-layer">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-3 mb-6">
                      <img
                        src={course.mentorAvatar}
                        alt={course.mentorName}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{course.mentorName}</p>
                        <span className="text-[9px] uppercase tracking-[0.15em] font-black text-zinc-400">
                          Mentor duyệt
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-white text-sm">{course.rating}</span>
                        <span className="text-white/35 text-xs">({(course.reviewsCount || 0) + 700})</span>
                      </div>
                      <div className="text-lg font-black text-primary-fixed">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(course.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => requireLoginNavigate(navigate, "/courses")}
              className="px-10 py-3.5 rounded-full border border-white/15 text-white font-bold hover:bg-white/[0.06] hover:border-[#B4F500]/35 transition-all text-sm"
            >
              Xem tất cả khóa học
            </button>
          </div>
        </div>
      </section>



      {/* ═══ TESTIMONIALS ═══════════════════════════════════ */}
      <section
        id="mentors"
        className="min-h-screen relative overflow-hidden border-t border-white/[0.07]"
        style={{ background: "#020202" }}
      >
        <div className="section-ambient w-[560px] h-[560px] top-[6%] left-[-180px] bg-[#B4F500]/[0.1]" aria-hidden />
        <div className="section-ambient w-[620px] h-[620px] bottom-[-220px] right-[-120px] bg-[#6E35E8]/[0.2]" aria-hidden />
        {renderSectionSticks([
          { x: 10, y: 20, size: 36, opacity: 0.5 },
          { x: 86, y: 18, size: 42, opacity: 0.54 },
          { x: 16, y: 80, size: 30, opacity: 0.38 },
        ])}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#B4F500]/[0.04] blur-[150px] rounded-full opacity-60 pointer-events-none" aria-hidden />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center lg:translate-y-5">
            <div className="lg:col-span-5">
              <h2 className="text-white mb-6 cute-heading text-3xl md:text-5xl leading-[1.08]">
                Người dùng nói gì về{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #6E35E8, #B4F500)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ProInterview
                </span>
              </h2>
              <p className="text-zinc-300/80 text-base md:text-lg leading-relaxed max-w-xl">
                Kết hợp AI thông minh và mạng lưới Mentor thực chiến để giúp bạn bứt tốc qua mọi vòng phỏng vấn.
                Đây là phản hồi thật từ học viên đã nhận offer.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {TESTIMONIALS.map((t) => (
                    <div
                      key={`avatar-${t.name}`}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.grad} border-2 border-[#020202] flex items-center justify-center text-[11px] font-black text-white`}
                    >
                      {t.avatar}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-300">
                  <span className="text-[#B4F500] font-black">500+</span> ứng viên đã thành công
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex justify-center mb-2 -mt-3">
                <div className="scale-[1.62] origin-center">
                  <BrandLogo />
                </div>
              </div>
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B4F500]/12 border border-[#B4F500]/35 text-[10px] uppercase tracking-[0.2em] text-[#e8ffc4] font-black shadow-[0_0_24px_rgba(196,255,71,0.18)]">
                  <Sparkles className="size-3 text-[#B4F500]" />
                  Bình luận nổi bật
                </div>
              </div>
              <div
                className="relative overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                }}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:-translate-x-6">
                    {TESTIMONIALS.map((t) => (
                      <div key={`row1-${t.name}`} className="min-w-0 sm:min-w-[230px] flex-1 bg-white/[0.08] border border-white/20 rounded-2xl p-4 backdrop-blur-sm shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.grad} flex items-center justify-center`}>
                            <CheckCircle2 className="size-4 text-white" />
                          </div>
                          <p className="text-[10px] uppercase tracking-widest text-[#B4F500] font-black">{t.tag}</p>
                        </div>
                        <p className="text-sm text-zinc-200 line-clamp-2">"{t.text}"</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:translate-x-8">
                    {TESTIMONIALS.map((t) => (
                      <div key={`row2-${t.role}`} className="min-w-0 sm:min-w-[230px] flex-1 bg-white/[0.08] border border-white/20 rounded-2xl p-4 backdrop-blur-sm shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
                        <div className="flex gap-1 mb-2">
                          {[...Array(t.stars)].map((_, j) => (
                            <Star key={`${t.name}-s-${j}`} className="size-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-zinc-200 line-clamp-2 mb-2">"{t.text}"</p>
                        <p className="text-[11px] text-zinc-400 font-semibold">{t.name}</p>
                      </div>
                    ))}
                  </div>

                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#020202] via-[#020202]/70 to-transparent blur-md" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#020202] via-[#020202]/70 to-transparent blur-md" />
              </div>
              <div className="hidden lg:block absolute right-4 top-14 opacity-30">
                <Sparkle className="size-10 text-[#B4F500]" />
              </div>
              <div className="hidden lg:block absolute right-24 bottom-10 opacity-25">
                <Sparkles className="size-12 text-violet-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═════════════════════════════════════ */}
      <section
        id="pricing"
        className="min-h-screen flex flex-col justify-center py-24 relative overflow-hidden bg-transparent border-t border-white/[0.06]"
      >
        <div className="section-ambient w-[620px] h-[620px] -top-44 left-[-180px] bg-[#6E35E8]/[0.16]" aria-hidden />
        <div className="section-ambient w-[560px] h-[560px] bottom-[-180px] right-[-160px] bg-[#B4F500]/[0.12]" aria-hidden />
        {renderSectionSticks([
          { x: 12, y: 16, size: 34, opacity: 0.44 },
          { x: 90, y: 22, size: 44, opacity: 0.58 },
          { x: 86, y: 78, size: 36, opacity: 0.48 },
        ])}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 w-[600px] h-[300px] bg-[#B4F500]/[0.08] blur-[120px] rounded-full pointer-events-none" aria-hidden />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-12">
          <header className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-[#B4F500] to-emerald-400" />
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B4F500]/12 border border-[#B4F500]/35 text-[#e8ffc4] text-[10px] font-black tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(196,255,71,0.12)]">
              <Sparkles className="size-3 text-[#B4F500]" />
              Đầu tư cho tương lai
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter mb-3 leading-tight text-white">
              Bảng giá <span className="text-primary-fixed">linh hoạt</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base">
              Chọn gói giải pháp phù hợp với lộ trình sự nghiệp của bạn.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Free Tier */}
            <div className="glass-card p-8 !rounded-[28px] flex flex-col h-full group">
              <div className="relative z-[1] flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="font-headline font-bold text-lg mb-1 text-white">Cơ bản (Free)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-headline text-white">0đ</span>
                    <span className="text-zinc-500 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {["2 buổi AI Interview thử nghiệm", "3 lần phân tích CV/JD", "10 câu hỏi mẫu theo ngành"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 className="size-4 shrink-0 text-secondary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => requireLoginNavigate(navigate, "/dashboard")}
                  className="w-full py-3 rounded-full border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all mt-auto"
                >
                  Bắt đầu ngay
                </button>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="relative glass-card p-8 !rounded-[28px] flex flex-col h-full border-2 border-primary-fixed md:scale-[1.04] z-10 shadow-[0_18px_45px_rgba(196,255,71,0.18)] !overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-fixed text-on-primary-fixed px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase z-[2] shadow-[0_0_20px_rgba(196,255,71,0.35)]">
                PHỔ BIẾN NHẤT
              </div>
              <div className="relative z-[1] flex flex-col flex-1 pt-2">
                <div className="mb-6">
                  <h3 className="font-headline font-bold text-lg mb-1 text-white">Chuyên nghiệp (Pro)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-headline text-white">79.000đ</span>
                    <span className="text-zinc-400 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {["10 buổi AI Interview/tháng", "Nhận diện giọng nói AI", "20 lần phân tích CV/JD", "Phản hồi chi tiết từng câu"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-white">
                      <CheckCircle2 className="size-4 shrink-0 text-primary-fixed" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    requireLoginNavigate(
                      navigate,
                      "/checkout?plan=starterPro&billing=monthly&planPrice=79000",
                    )
                  }
                  className="w-full py-3 rounded-full bg-primary-fixed text-on-primary-fixed font-black text-sm shadow-[0px_0px_20px_rgba(191,255,0,0.3)] hover:brightness-110 transition-all mt-auto"
                >
                  Nâng cấp Pro
                </button>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="glass-card p-8 !rounded-[28px] flex flex-col h-full border border-secondary/40 group !overflow-visible">
              <div className="relative z-[1] flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="font-headline font-bold text-lg mb-1 text-secondary-fixed">Thượng hạng (Elite)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-headline text-white">99.000đ</span>
                    <span className="text-zinc-500 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {["AI Interview KHÔNG GIỚI HẠN", "Phân tích hành vi & tư thế", "Nhận diện giọng nói Turbo", "Hỗ trợ ưu tiên 24/7"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-white">
                      <ShieldCheck className="size-4 shrink-0 text-secondary-fixed" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    requireLoginNavigate(
                      navigate,
                      "/checkout?plan=elitePro&billing=monthly&planPrice=99000",
                    )
                  }
                  className="w-full py-3 rounded-full border border-secondary/50 text-secondary-fixed font-bold text-sm hover:bg-secondary/10 transition-all mt-auto"
                >
                  Nâng cấp Elite
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-14 glass-card p-8 sm:p-10 !rounded-[28px] text-center relative overflow-hidden">
            <div className="relative z-[1]">
              <h2 className="text-3xl font-headline font-black mb-4 text-white">Bạn vẫn còn băn khoăn?</h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">Thử gói Free để trải nghiệm sức mạnh của AI. Không cần thẻ tín dụng.</p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => requireLoginNavigate(navigate, "/dashboard")}
                  className="bg-primary-fixed text-on-primary-fixed font-black px-10 py-3 rounded-full hover:scale-105 transition-all shadow-[0_0_28px_rgba(196,255,71,0.25)]"
                >
                  Bắt đầu miễn phí
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <Footer variant="dark" />
    </div>
  );
}