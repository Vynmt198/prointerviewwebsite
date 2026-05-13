import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
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
  Tag,
} from "lucide-react";
import { COURSES_DATA } from "../../data/coursesData";
import { navigateToInterview, requireLoginNavigate } from "../../utils/authGate";
import { Footer } from "../../components/layout/Footer";
import { TopNavShell } from "../../components/layout/TopNavShell";
import { RecommendedJourney } from "../../components/home/RecommendedJourney";
import { BrandLogo } from "../../components/brand/BrandLogo";

function SparkleGlyph({ className = "", style, tone = "brand" }) {
  const mainStart = "#5F00F0";
  const mainEnd = "#4B18CC";
  const coreStart = "#99FF00";
  const coreEnd = "#63D800";
  const accentColor = "#C7ADFF";

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkle-main-${tone}`} x1="7" y1="8" x2="55" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mainStart} />
          <stop offset="1" stopColor={mainEnd} />
        </linearGradient>
        <linearGradient id={`sparkle-core-${tone}`} x1="24" y1="23" x2="40" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={coreStart} />
          <stop offset="1" stopColor={coreEnd} />
        </linearGradient>
      </defs>
      <path
        d="M32 1.5C31.4 12.9 30 21.4 26.7 26.7C21.4 30 12.9 31.4 1.5 32C12.9 32.6 21.4 34 26.7 37.3C30 42.6 31.4 51.1 32 62.5C32.6 51.1 34 42.6 37.3 37.3C42.6 34 51.1 32.6 62.5 32C51.1 31.4 42.6 30 37.3 26.7C34 21.4 32.6 12.9 32 1.5Z"
        fill={`url(#sparkle-main-${tone})`}
      />
      <path
        d="M32 9.3C31 17.2 29.5 23.8 26.2 26.2C23.8 29.5 17.2 31 9.3 32C17.2 33 23.8 34.5 26.2 37.8C29.5 40.2 31 46.8 32 54.7C33 46.8 34.5 40.2 37.8 37.8C40.2 34.5 46.8 33 54.7 32C46.8 31 40.2 29.5 37.8 26.2C34.5 23.8 33 17.2 32 9.3Z"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M32 21.6C31.55 26.55 30.74 28.97 29.46 30.12C28.31 31.4 25.89 32.21 22.54 32.66C25.89 33.11 28.31 33.92 29.46 35.2C30.74 36.35 31.55 38.77 32 42.12C32.45 38.77 33.26 36.35 34.54 35.2C35.69 33.92 38.11 33.11 41.46 32.66C38.11 32.21 35.69 31.4 34.54 30.12C33.26 28.97 32.45 26.55 32 21.6Z"
        fill={`url(#sparkle-core-${tone})`}
      />
      <path
        d="M52.2 12.8V19.2M49 16H55.4"
        stroke={accentColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M8.6 38.4H13.4"
        stroke={accentColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
    borderHover: "rgba(167,139,250,0.)",
    bgHover: "rgba(167,139,250,0.)",
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

/** Hero: video + viền tím mỏng + khoảng cách giữa viền và video + thẻ feedback. */
function HeroInterviewVideoCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,240px)] sm:max-w-[270px] lg:max-w-[300px] lg:justify-self-end">
      <div
        className="rounded-[22px] p-2 sm:p-2.5"
        style={{
          border: "1.5px solid rgba(95, 0, 240, 0.4)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.1)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[16px] sm:rounded-[18px] bg-slate-100"
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
            className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border-2 border-white bg-white py-2 pl-2 pr-3 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.35)] sm:bottom-4 sm:left-4 sm:gap-2.5 sm:py-2.5 sm:pl-2.5 sm:pr-3.5"
            role="status"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200/90 sm:size-8">
              <Check className="size-3.5 stroke-[2.5]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black leading-tight text-slate-900 sm:text-[12px]">Bạn làm tốt lắm!</p>
              <p className="text-[9px] font-medium text-slate-500 sm:text-[10px]">Phản hồi AI vừa xong</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mock cửa sổ phỏng vấn AI + video + overlay (section Interview Preview). */
function InterviewDemoMockup() {
  const glow = "-inset-4 blur-3xl";
  const shell = "p-1 sm:p-1.5 rounded-[24px]";
  const inner = "rounded-[20px]";
  const chrome = "flex items-center justify-between px-4 py-3";
  const titleSz = "text-xs";
  const topBar = "p-3";
  const bottomWrap = "p-4";
  const bubble = "p-3";
  const qLead = "text-[11px] mb-1";
  const qBody = "text-xs leading-relaxed";
  const statsGrid = "grid grid-cols-3 gap-1.5 mt-2";
  const statCell = "flex items-center gap-1.5 px-2 py-1.5 rounded-lg";
  const statIcon = "w-3.5 h-3.5";
  const statTxt = "text-[11px] font-medium";

  return (
    <div className="relative mx-auto w-full max-w-[560px] scale-[0.96] origin-center lg:max-w-[620px] lg:scale-[0.92]">
      <div
        className={`absolute ${glow} rounded-[32px] opacity-0 pointer-events-none`}
        style={{
          background:
            "radial-gradient(circle, rgba(167,139,250,0.) 0%, rgba(110, 53, 232,0.35) 45%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className={`glass-card ${shell}`}>
        <div
          className={`relative ${inner} overflow-hidden border-0 bg-[#ffffff]/95`}
          style={{
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.) inset",
          }}
        >
          <div
            className={chrome}
            style={{
              background: "#ffffff",
              borderBottom: "1px solid rgba(0,0,0,0.03)",
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

          <div className="relative bg-[#ffffff]" style={{ aspectRatio: "16/10" }}>
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
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full sm:h-2 sm:w-2" style={{ background: "#FF5F57" }} />
                  <span className="font-semibold text-foreground text-xs">
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
                  background: "linear-gradient(to top, rgba(255,255,255,0.8), transparent)",
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
                      <SparkleGlyph className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-foreground/50 ${qLead}`}>Câu hỏi 2/5</p>
                      <p className={`text-foreground ${qBody}`}>
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
                        background: "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.03)",
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
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  const handleFeatureClick = (route) => requireLoginNavigate(navigate, route);
  const renderSectionSticks = (sticks) => (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block" aria-hidden>
      {sticks.map((s, idx) => (
        <SparkleGlyph
          key={`section-stick-${idx}`}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 1,
            filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.12)) drop-shadow(0 0 8px rgba(95,0,240,0.35))",
            transform: `rotate(${typeof s.tilt === "number" ? s.tilt : idx % 4 === 0 ? 0 : idx % 4 === 1 ? -18 : idx % 4 === 2 ? 24 : -30
              }deg)`,
          }}
        />
      ))}
    </div>
  );

  useEffect(() => {
    const sectionIds = ["features", "courses", "mentors", "pricing"];

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);

      if (y < 300) {
        setActiveSection("");
        return;
      }

      // Find the section whose top is closest above the viewport midpoint
      const mid = window.innerHeight * 0.5;
      let found = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= mid) found = "#" + id;
      }
      setActiveSection(found);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Check for scrollTo param
    const params = new URLSearchParams(window.location.search);
    const scrollTarget = params.get("scrollTo");
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }, 500);
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen selection:bg-violet-100 selection:text-violet-900 font-sans overflow-x-hidden relative bg-[#f3f0f9] text-slate-900"
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
          background: linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03));
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.28);
        }
        .cute-pill {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.03);
        }
        .cute-card {
          position: relative;
          border-radius: 24px;
          border: 1px solid rgba(0,0,0,0.03);
          background: linear-gradient(180deg, rgba(0,0,0,0.03), rgba(255,255,255,0.025));
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
        .home-section-violet-wash {
          background-color: #f6f3fb;
          background-image:
            radial-gradient(ellipse 125% 85% at 92% 0%, rgba(110, 53, 232, 0.19), transparent 52%),
            radial-gradient(ellipse 95% 78% at 0% 100%, rgba(95, 0, 240, 0.13), transparent 50%),
            radial-gradient(ellipse 72% 52% at 50% 108%, rgba(155, 109, 255, 0.1), transparent 58%),
            radial-gradient(ellipse 50% 40% at 72% 45%, rgba(110, 53, 232, 0.075), transparent 55%);
        }
        .sticker-badge {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.24);
          background: rgba(255,255,255,0.8);
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
          text-shadow: none;
        }
        .glass-card {
          background: #ffffff;
          backdrop-filter: none;
          border-radius: 28px;
          border: 2px solid rgba(95, 0, 240, 0.32);
          transition: transform 0.35s ease, border-color 0.25s ease, box-shadow 0.35s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none;
          opacity: 0;
        }
        .glass-card:hover {
          border-color: rgba(95, 0, 240, 0.48);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }
        #pricing > .max-w-7xl > .grid > .glass-card {
          overflow: visible !important;
        }
      `}</style>

      {/* ═══ NAVBAR ════════════════════════════════════════ */}
      {/* ═══ NAVBAR ════════════════════════════════════════ */}
      <TopNavShell variant="light" scrolled={scrolled}>

        {/* Logo */}
        <div
          className="flex shrink-0 cursor-pointer items-center gap-2"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <BrandLogo />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="relative py-1 text-sm transition-all duration-300 cursor-pointer whitespace-nowrap"
              style={{ 
                color: activeSection === l.href ? "#6E35E8" : "rgb(71,85,105)",
                fontWeight: activeSection === l.href ? "800" : "600"
              }}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {l.label}
              <span
                className={`absolute -bottom-1 left-0 w-full h-[3px] rounded-full transition-all duration-300 ${
                  activeSection === l.href ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                }`}
                style={{ 
                  background: "#C4FF47",
                  boxShadow: "0 0 12px rgba(196, 255, 71, 0.8)" 
                }}
              />
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Đăng nhập */}
          <button
            onClick={() => navigate("/login")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 whitespace-nowrap"
          >
            <SignIn className="w-3.5 h-3.5" />
            Đăng nhập
          </button>

          {/* Đăng ký */}
          <button
            onClick={() => navigate("/register")}
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{
              background: "#fff",
              color: "#6E35E8",
              border: "1.5px solid #6E35E8",
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Đăng ký
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        </div>


        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden absolute top-[72px] left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <SignIn className="w-4 h-4" /> Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); navigateToInterview(navigate); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #B4F500, #8fbc24)", color: "#120B2E" }}
                >
                  <Lightning className="w-4 h-4" /> Trải nghiệm thử miễn phí
                </button>
              </div>
            </div>
          </div>
        )}
      </TopNavShell>

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative flex h-screen max-h-screen flex-col justify-start overflow-hidden home-section-violet-wash px-10 sm:px-16 lg:px-24 pt-36">
        {renderSectionSticks([
          { x: 5, y: 11, size: 38, opacity: 0.48 },
          { x: 93, y: 13, size: 44, opacity: 0.55 },
          { x: 3, y: 50, size: 32, opacity: 0.4 },
          { x: 92, y: 80, size: 36, opacity: 0.46 },
        ])}

        {/* Hero content — 2 cột lg: copy trái + video/mockup phải */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(200px,300px)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-6 lg:gap-y-3">
            <div className="order-1 text-left lg:col-start-1 lg:row-start-1">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold bg-white"
                style={{
                  borderColor: "rgba(95, 0, 240, 0.42)",
                  color: "#5B21B6",
                }}
              >
                <SparkleGlyph className="w-3.5 h-3.5" />
                Nền tảng luyện phỏng vấn với AI
              </div>

              <h1
                className="mb-2 font-headline text-slate-900 leading-[1.08] tracking-tighter cute-heading"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                }}
              >
                <span className="text-slate-900">
                  Phỏng vấn{" "}
                </span>
                <span
                  className="hero-title-animated hero-orbit-text"
                  style={{
                    background: "linear-gradient(135deg, #5F00F0 0%, #6E35E8 45%, #9B6DFF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    padding: "0.1em 0",
                  }}
                >
                  1:1 với AI
                </span>
                <span className="text-slate-900"> qua mô phỏng hội thoại thông minh</span>
              </h1>

              <p
                className="mb-4 max-w-2xl leading-relaxed text-slate-600 font-medium"
                style={{ fontSize: "0.9rem" }}
              >
                ProInterview phân tích CV/JD, tạo câu hỏi phỏng vấn
                cá nhân hóa, và kết nối bạn với Mentor HR thực tế từ
                Shopee, Vingroup, FPT và hơn 200 công ty hàng đầu.
              </p>

              <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:justify-start">
                <button
                  type="button"
                  onClick={() => navigateToInterview(navigate)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black transition-all hover:brightness-105 active:scale-[0.98] hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #B4F500, #93D600)",
                    color: "#0f172a",
                    fontSize: "0.875rem",
                    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.1)",
                  }}
                >
                  <Lightning className="w-5 h-5" />
                  Phỏng vấn thử miễn phí
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:bg-violet-50 active:scale-95 bg-white text-slate-800"
                  style={{
                    border: "1px solid rgba(95, 0, 240, 0.38)",
                    boxShadow: "none",
                  }}
                >
                  <Tag className="w-4 h-4 text-[#6E35E8]" />
                  Xem giá
                </button>
              </div>
            </div>

            {/* Cột phải: căn đáy hàng 1 để video không “bay” quá cao so với copy */}
            <div className="order-3 flex w-full justify-start lg:order-2 lg:col-start-2 lg:row-start-1 lg:flex lg:justify-end lg:self-center">
              <HeroInterviewVideoCard />
            </div>

            {/* Thanh stats — full width, căn giữa; khoảng cách trên lg gọn để còn trong 1 màn */}
            <div className="order-2 mt-5 flex w-full justify-center lg:order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mt-5">
              <div
                className="glass-card w-full max-w-xl p-2.5 sm:max-w-3xl sm:p-3 lg:max-w-4xl"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(95, 0, 240, 0.32)",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div className="relative z-[1] grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                  {STATS.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-2 py-2 text-center sm:px-3 sm:py-2.5 bg-white"
                      style={{
                        border: "1px solid rgba(95, 0, 240, 0.22)",
                        boxShadow: "none",
                      }}
                    >
                      <div
                        className="mb-1 font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#9B6DFF]"
                        style={{
                          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {s.value}
                      </div>
                      <div className="text-[11px] font-semibold leading-snug text-slate-600">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>



      {/* ═══ HOW IT WORKS ════════════════════════════════════ */}
      <section
        id="features"
        className="relative h-screen max-h-screen flex flex-col justify-center overflow-hidden border-t border-slate-100 home-section-violet-wash"
      >
        {renderSectionSticks([
          { x: 10, y: 16, size: 34, opacity: 0.45 },
          { x: 88, y: 20, size: 40, opacity: 0.55 },
          { x: 82, y: 78, size: 32, opacity: 0.44 },
        ])}
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-2">
          <div className="text-center mb-6 pt-5">
            <div className="flex justify-center mb-5">
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF]" />
            </div>
            <h2 className="text-3xl md:text-5xl text-slate-900 mb-3 leading-[1.1] py-1 cute-heading font-headline tracking-tighter font-black">
              Quy trình tinh gọn,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#7A35FF]">kết quả đột phá</span>
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              Sẵn sàng chinh phục mọi nhà tuyển dụng với lộ trình chuẩn bị được cá nhân hóa bởi trí tuệ nhân tạo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`glass-card group p-4 sm:p-5 relative overflow-hidden transition-[border-color,box-shadow] duration-300 ${i === 1
                  ? "border-[#6E35E8]/35 shadow-[0_0_0_1px_rgba(167,139,250,0.12)_inset]"
                  : i === 2
                    ? "border-violet-400/35 shadow-[0_0_0_1px_rgba(167,139,250,0.15)_inset]"
                    : "border-black/[0.05]"
                  }`}
                style={i === 1 ? {
                  background: "linear-gradient(180deg, rgba(244,238,255,0.98) 0%, rgba(237,228,255,0.96) 100%)",
                  borderColor: "rgba(95,0,240,0.42)",
                  boxShadow: "0 18px 36px rgba(95,0,240,0.24), 0 2px 12px rgba(15,23,42,0.1), 0 0 0 1px rgba(95,0,240,0.18) inset",
                } : {
                  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,245,255,0.97) 100%)",
                  boxShadow: "0 12px 26px rgba(15,23,42,0.09), 0 2px 10px rgba(95,0,240,0.08)",
                }}
              >
                <div className="relative z-[1]">
                  {/* Hàng nhãn cố định — tránh absolute đè lên icon */}
                  <div className="mb-3 min-h-[30px] flex items-center justify-start">
                    {(i === 1 || i === 2) && (
                    <span
                        className={`inline-flex px-2 py-1 text-[10px] sm:text-[11px] font-bold tracking-wide rounded-md border ${i === 1
                          ? "border-[#6E35E8]/60 bg-[#6E35E8]/24 text-[#5F00F0] shadow-[0_0_14px_rgba(95,0,240,0.22)]"
                          : "border-violet-200 bg-violet-100 text-violet-800 shadow-sm"
                          }`}
                      >
                        {i === 1 ? "Nổi bật" : "Gợi ý mentor"}
                      </span>
                    )}
                  </div>
                  <div className={`absolute top-0 right-0 p-4 transition-opacity pointer-events-none ${i === 1 ? "opacity-[0.2]" : "opacity-[0.08] group-hover:opacity-[0.14]"}`}>
                    <span className={`text-6xl font-black italic ${i === 1 ? "text-[#5F00F0]/35" : "text-slate-200/90"}`}>{s.step}</span>
                  </div>

                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 shadow-lg ${i % 2 === 0
                      ? "bg-[#6E35E8] text-[#ffffff] shadow-[0_0_24px_rgba(167,139,250,0.)]"
                      : "bg-white/5 text-[#6E35E8] border border-white/10 group-hover:bg-[#6E35E8]/15 group-hover:border-[#6E35E8]/35"
                      }`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-extrabold mb-1.5 text-slate-900 font-headline tracking-tight">{s.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={() => handleFeatureClick("/dashboard")}
              className="group relative px-8 py-3 rounded-full font-black text-base tracking-tight uppercase transition-all duration-500 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #B4F500, #8FBC24)",
                color: "#1F2937",
                boxShadow: "0 10px 24px rgba(143,188,36,0.42), 0 2px 10px rgba(15,23,42,0.1)",
              }}
            >
              Bắt đầu ngay
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            <div className="mt-6 flex items-center gap-4">
              <span className="w-12 h-px bg-slate-200" />
              <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Không cần thẻ tín dụng</span>
              <span className="w-12 h-px bg-slate-200" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTERVIEW PREVIEW ═══════════════════════════════ */}
      <section
        className="border-t border-slate-100 relative h-screen max-h-screen flex flex-col justify-center home-section-violet-wash"
        style={{ overflow: "hidden" }}
      >
        {renderSectionSticks([
          { x: 14, y: 24, size: 32, opacity: 0.42 },
          { x: 91, y: 16, size: 42, opacity: 0.56 },
          { x: 88, y: 72, size: 34, opacity: 0.46 },
        ])}
        <div className="max-w-7xl mx-auto px-5 relative z-10 w-full py-2">
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-8 items-center">
            {/* Left copy */}
            <div className="glass-card p-4 sm:p-5 lg:p-6">
              <div className="relative z-[1]">
                <div className="mb-4 h-1 w-10 rounded-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF]" aria-hidden />
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-semibold mb-4 border border-violet-400/30 bg-violet-500/10 text-violet-700"
                >
                  <Microphone
                    className="w-3.5 h-3.5"
                  />
                  Phòng phỏng vấn ảo
                </span>
                <h2
                  className="text-slate-900 mb-2 leading-tight cute-heading"
                  style={{
                    fontSize: "clamp(1.35rem, 2.6vw, 1.9rem)",
                  }}
                >
                  Trải nghiệm phỏng vấn{" "}
                  <span className="inline-block bg-gradient-to-r from-[#5F00F0] via-[#6E35E8] to-[#9B6DFF] bg-clip-text text-transparent">
                    như thật
                  </span>
                </h2>
                <p
                  className="mb-6 leading-relaxed"
                  style={{
                    color: "#475569",
                    fontSize: "0.98rem",
                  }}
                >
                  Phòng phỏng vấn ảo với AI phỏng vấn viên, phản
                  hồi trực quan khi bạn đang nói, và đánh giá chi
                  tiết từng câu trả lời theo mô hình STAR.
                </p>

                <ul className="space-y-2 mb-5">
                  {[
                    "AI hỏi 5 câu hỏi cá nhân hóa theo JD",
                    "Nhận diện giọng nói tự động",
                    "Phản hồi tức thì sau mỗi câu trả lời",
                    "Phân tích chi tiết theo mô hình STAR",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5"
                      style={{ color: "#334155" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(110, 53, 232,0.08)",
                        }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: "#6E35E8" }}
                        />
                      </div>
                      <span className="text-[13px]">{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigateToInterview(navigate)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #B4F500, #93D600)",
                    color: "#0f172a",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
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
        className="relative h-screen max-h-screen flex flex-col justify-center overflow-hidden border-t border-slate-100 home-section-violet-wash"
      >
        {renderSectionSticks([
          { x: 90, y: 8, size: 32, opacity: 0.44 },
          { x: 94, y: 38, size: 36, opacity: 0.5 },
          { x: 6, y: 86, size: 28, opacity: 0.38 },
          { x: 82, y: 78, size: 34, opacity: 0.46 },
        ])}

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-4">
          <div className="flex flex-col md:flex-row items-end gap-4 mb-5">
            <div className="md:w-2/3">
              <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF] mb-4" aria-hidden />
              <span className="font-bold uppercase tracking-[0.2em] text-[10px] mb-3 block text-[#6E35E8] drop-shadow-[0_0_12px_rgba(167,139,250,0.)]">
                Nền tảng học
              </span>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-[0.95] text-slate-900 mb-3">
                Học từ chuyên gia,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#9B6DFF]">
                  sửa lỗi ngay.
                </span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
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
                  <span className="pr-4 pl-1 text-[11px] font-bold text-[#6E35E8]">10k+ Học viên</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
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
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-black/55 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {course.category}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {Math.floor(course.duration / 60)}h {course.duration % 60}m
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-4 right-4 rounded-full bg-[#6E35E8] px-2.5 py-1 text-[10px] font-black tracking-wide uppercase text-white shadow-md">
                        New
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform transition-transform border-2 border-white/90 float-icon-delay parallax-layer"
                        style={{ background: "linear-gradient(135deg, #B4F500, #93D600)" }}
                      >
                        <PlayCircle className="w-7 h-7 text-slate-900 translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-bold mb-3 text-slate-900 transition-colors leading-tight line-clamp-2 group-hover:text-[#6E35E8]">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={course.mentorAvatar}
                        alt={course.mentorName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{course.mentorName}</p>
                        <span className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500">
                          Mentor duyệt
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-bold text-slate-800 text-sm">{course.rating}</span>
                        <span className="text-slate-500 text-xs">({(course.reviewsCount || 0) + 700})</span>
                      </div>
                      <div className="text-lg font-black text-[#5F00F0]">
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
              className="group relative px-10 py-3.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #B4F500, #8FBC24)",
                color: "#120B2E",
                boxShadow: "0 10px 24px rgba(143,188,36,0.42), 0 2px 10px rgba(15,23,42,0.1)",
              }}
            >
              Xem tất cả khóa học
              <span className="pointer-events-none absolute inset-0 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-20" aria-hidden />
            </button>
          </div>
        </div>
      </section>



      {/* ═══ TESTIMONIALS ═══════════════════════════════════ */}
      <section
        id="mentors"
        className="h-screen max-h-screen relative overflow-hidden border-t border-slate-100 home-section-violet-wash"
      >
        {renderSectionSticks([
          { x: 10, y: 20, size: 36, opacity: 0.5 },
          { x: 86, y: 18, size: 42, opacity: 0.54 },
          { x: 16, y: 80, size: 30, opacity: 0.38 },
        ])}
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-0 h-full flex flex-col justify-center relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-6 items-center">
            <div className="lg:col-span-5">
              <h2 className="text-slate-900 mb-0 cute-heading text-2xl md:text-3xl flex flex-col items-start gap-0 leading-none">
                <span className="block leading-[1] tracking-tight">Người dùng nói gì về</span>
                <img
                  src="/Logo.png"
                  alt="ProInterview"
                  className="-ml-1.5 -mt-3 block h-[4.6rem] w-auto max-w-[min(100%,26rem)] object-contain object-left object-top contrast-[1.06] sm:-ml-2 sm:h-[5.1rem] sm:-mt-3.5 md:h-[5.95rem] md:-ml-2.5 md:-mt-4 lg:h-[6.5rem] lg:-ml-3 lg:-mt-[1.15rem]"
                  decoding="async"
                />
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xl mt-1.5">
                Kết hợp AI thông minh và mạng lưới Mentor thực chiến để giúp bạn bứt tốc qua mọi vòng phỏng vấn.
                Đây là phản hồi thật từ học viên đã nhận offer.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {TESTIMONIALS.map((t) => (
                    <div
                      key={`avatar-${t.name}`}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.grad} border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm`}
                    >
                      {t.avatar}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  <span className="text-[#6E35E8] font-black">500+</span> ứng viên đã thành công
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-[10px] uppercase tracking-[0.2em] text-[#5B21B6] font-black">
                  <SparkleGlyph className="size-3" />
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
                      <div key={`row1-${t.name}`} className="min-w-0 sm:min-w-[230px] flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.grad} flex items-center justify-center`}>
                            <CheckCircle2 className="size-4 text-white" />
                          </div>
                          <p className="text-[10px] uppercase tracking-widest text-[#6E35E8] font-black">{t.tag}</p>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">"{t.text}"</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:translate-x-8">
                    {TESTIMONIALS.map((t) => (
                      <div key={`row2-${t.role}`} className="min-w-0 sm:min-w-[230px] flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex gap-1 mb-2">
                          {[...Array(t.stars)].map((_, j) => (
                            <Star key={`${t.name}-s-${j}`} className="size-3.5 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2 mb-2">"{t.text}"</p>
                        <p className="text-[11px] text-slate-600 font-semibold">{t.name}</p>
                      </div>
                    ))}
                  </div>

                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#ffffff] via-[#ffffff]/70 to-transparent blur-md" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#ffffff] via-[#ffffff]/70 to-transparent blur-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═════════════════════════════════════ */}
      <section
        id="pricing"
        className="h-screen max-h-screen flex flex-col justify-center relative overflow-hidden home-section-violet-wash border-t border-slate-100"
      >
        {renderSectionSticks([
          { x: 10, y: 20, size: 30, opacity: 0.44 },
          { x: 82, y: 28, size: 32, opacity: 0.5 },
          { x: 78, y: 74, size: 32, opacity: 0.46 },
        ])}

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <header className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter mb-2 leading-tight text-slate-900">
              Bảng giá <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#9B6DFF]">linh hoạt</span>
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm">
              Chọn gói giải pháp phù hợp với lộ trình sự nghiệp của bạn.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            {/* Free Tier */}
            <div className="glass-card p-5 !rounded-[20px] flex flex-col h-full group">
              <div className="relative z-[1] flex flex-col flex-1">
                <div className="mb-3">
                  <h3 className="font-headline font-bold text-lg mb-1 text-slate-900">Cơ bản (Free)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-headline text-slate-900">0đ</span>
                    <span className="text-zinc-500 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 flex-grow">
                  {["2 buổi AI Interview thử nghiệm", "3 lần phân tích CV/JD", "10 câu hỏi mẫu theo ngành"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="size-4 shrink-0 text-secondary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => requireLoginNavigate(navigate, "/dashboard")}
                  className="w-full py-3 rounded-full border border-slate-200 bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all mt-auto"
                >
                  Bắt đầu ngay
                </button>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="relative glass-card p-5 !rounded-[20px] flex flex-col h-full border-2 border-primary-fixed z-10 !overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-fixed text-on-primary-fixed px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase z-[2] shadow-[0_0_20px_rgba(167,139,250,0.)]">
                PHỔ BIẾN NHẤT
              </div>
              <div className="relative z-[1] flex flex-col flex-1 pt-1">
                <div className="mb-3">
                  <h3 className="font-headline font-bold text-lg mb-1 text-slate-900">Chuyên nghiệp (Pro)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-headline text-slate-900">79.000đ</span>
                    <span className="text-slate-500 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 flex-grow">
                  {["10 buổi AI Interview/tháng", "Nhận diện giọng nói AI", "20 lần phân tích CV/JD", "Phản hồi chi tiết từng câu"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-800">
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
                  className="w-full py-3 rounded-full font-black text-sm transition-all mt-auto hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #B4F500, #93D600)",
                    color: "#0f172a",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.1)",
                  }}
                >
                  Nâng cấp Pro
                </button>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="glass-card p-5 !rounded-[20px] flex flex-col h-full border border-secondary/40 group !overflow-visible">
              <div className="relative z-[1] flex flex-col flex-1">
                <div className="mb-3">
                  <h3 className="font-headline font-bold text-lg mb-1 text-secondary-fixed">Thượng hạng (Elite)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-headline text-slate-900">99.000đ</span>
                    <span className="text-zinc-500 text-xs">/tháng</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4 flex-grow">
                  {["AI Interview KHÔNG GIỚI HẠN", "Phân tích hành vi & tư thế", "Nhận diện giọng nói Turbo", "Hỗ trợ ưu tiên 24/7"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-800">
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
                  className="w-full py-3 rounded-full font-bold text-sm transition-all mt-auto hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #B4F500, #93D600)",
                    color: "#0f172a",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.1)",
                  }}
                >
                  Nâng cấp Elite
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-4 glass-card py-3 px-4 sm:py-3.5 sm:px-5 !rounded-[20px] text-center relative overflow-hidden">
            <div className="relative z-[1]">
              <h2 className="text-base sm:text-lg font-headline font-black mb-0.5 text-slate-900">Bạn vẫn còn băn khoăn?</h2>
              <p className="text-slate-600 mb-2 text-sm max-w-xl mx-auto leading-snug">Thử gói Free để trải nghiệm sức mạnh của AI.</p>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => requireLoginNavigate(navigate, "/dashboard")}
                  className="font-black px-7 py-2 rounded-full text-sm hover:scale-105 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #B4F500, #93D600)",
                    color: "#0f172a",
                    boxShadow: "0 8px 20px rgba(15,23,42,0.1)",
                  }}
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