import React, { useEffect } from "react";
import { motion } from "motion/react";
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
  CheckCircle2,
  BarChart3 as ChartBar,
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
import { RecommendedJourney } from "../../components/home/RecommendedJourney";
import { CvAnalysisFeatureShowcase } from "../../components/home/CvAnalysisFeatureShowcase";
import { SparkleGlyph } from "../../components/decor/SparkleGlyph.jsx";
import {
  LandingReveal,
  LandingStagger,
  LandingItem,
} from "../../components/home/landing/LandingReveal";

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    accentClass: "from-[#B4F500] to-[#8fbc24]",
    bgClass: "bg-lime-50 dark:bg-lime-950/30",
    dotColor: "#B4F500",
    borderHover: "rgba(196, 255, 71,0.5)",
    bgHover: "rgba(196, 255, 71,0.07)",
    title: "So CV với JD",
    desc: "Tải lên, biết ngay khớp hay trượt — có gợi ý sửa từng vị trí.",
    route: "/cv-analysis",
    cta: "So ngay",
  },
  {
    icon: Brain,
    accentClass: "from-[#6E35E8] to-[#9B6DFF]",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    dotColor: "#6E35E8",
    borderHover: "rgba(110, 53, 232,0.5)",
    bgHover: "rgba(110, 53, 232,0.08)",
    title: "Phỏng vấn thử với AI",
    desc: "Câu hỏi sát thực tế, góp ý STAR từng câu — không chém gió.",
    route: "/interview",
    cta: "Vào phòng thử",
  },
  {
    icon: Users,
    accentClass: "from-[#FFB800] to-[#FF8C42]",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    dotColor: "#FFB800",
    borderHover: "rgba(255,184,0,0.5)",
    bgHover: "rgba(255,184,0,0.07)",
    title: "Mentor 1:1 thật",
    desc: "Đặt lịch với HR/Manager công ty lớn — kinh nghiệm nội bộ, chuẩn gu.",
    route: "/mentors",
    cta: "Chọn mentor",
  },
  {
    icon: TrendUp,
    accentClass: "from-sky-400 to-blue-600",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    dotColor: "#38BDF8",
    borderHover: "rgba(167,139,250,0.)",
    bgHover: "rgba(167,139,250,0.)",
    title: "Theo dõi tiến độ",
    desc: "Biểu đồ tiến bộ, lịch sử luyện — biết mình đang ở đâu.",
    route: "/dashboard",
    cta: "Xem tiến độ",
  },
];

const STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "So CV với JD",
    desc: "Có điểm khớp và danh sách cần sửa cho từng vị trí.",
    color: "#7000ff",
  },
  {
    step: "02",
    icon: Brain,
    title: "Phỏng vấn thử AI",
    desc: "Luyện trả lời, chấm STAR ngay — giống phòng phỏng vấn thật.",
    color: "#b8f600",
  },
  {
    step: "03",
    icon: Users,
    title: "Mentor 1:1",
    desc: "Gặp HR/Manager thật — mẹo nội bộ, không tìm trên mạng được.",
    color: "#7000ff",
  },
  {
    step: "04",
    icon: GraduationCap,
    title: "Khóa học",
    desc: "Video + bài tập mentor duyệt — học xong ứng tuyển được luôn.",
    color: "#7000ff",
  },
];

const TESTIMONIALS = [
  {
    name: "Phạm Anh Tuấn",
    role: "Software Engineer @ Shopee",
    avatar: "PA",
    grad: "from-[#6E35E8] to-[#9B6DFF]",
    text: "Ba buổi phỏng vấn thử với AI và một buổi mentor Shopee — mình tự tin hơn hẳn. Câu hỏi sát thực tế, góp ý đúng chỗ cần sửa.",
    stars: 5,
    tag: "Đã nhận việc",
  },
  {
    name: "Nguyễn Thị Hoa",
    role: "Marketing Executive @ Unilever",
    avatar: "NH",
    grad: "from-pink-500 to-rose-600",
    text: "So CV với JD xong mới biết CV thiếu từ khóa quan trọng. Điểm STAR từ 2.4 lên 4.1 sau ba tuần — tiến bộ có thật.",
    stars: 5,
    tag: "STAR +70%",
  },
  {
    name: "Trần Minh Đức",
    role: "Business Analyst @ KPMG",
    avatar: "TM",
    grad: "from-emerald-500 to-teal-600",
    text: "So khớp CV–JD chỉ đúng điểm yếu. Mentor KPMG chia sẻ kinh nghiệm thật — khác hẳn đọc blog cho có.",
    stars: 5,
    tag: "Mentor 5 sao",
  },
];

const STATS = [
  { value: "10,000+", label: "Bạn đã luyện phỏng vấn" },
  { value: "500+", label: "Mentor thật, không ảo" },
  { value: "85%", label: "Tỉ lệ nhận việc" },
  { value: "4.8/5", label: "Hài lòng 4.8★" },
];

/** Clip demo phỏng vấn AI — dùng chung hero (cột phải) và mock màn hình khu tính năng. */
const HOME_AI_DEMO_VIDEO =
  "https://res.cloudinary.com/dee4bvivu/video/upload/v1774336640/Female_delxmy.mp4";

/** Hero: video phỏng vấn + sticker gấu góc phải. */
function HeroInterviewVideoCard() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,268px)] overflow-visible sm:max-w-[300px] lg:max-w-[332px] lg:justify-self-end">
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
        </div>
      </div>

      <img
        src="/mascot-features-hero.png?v=21"
        alt=""
        aria-hidden
        className="hero-home-mascot-sticker pointer-events-none absolute -bottom-8 -right-8 z-20 hidden h-[7.25rem] w-[7.25rem] object-contain drop-shadow-[0_14px_32px_rgba(110,53,232,0.22)] sm:block sm:-bottom-9 sm:-right-9 sm:h-[8.25rem] sm:w-[8.25rem] lg:-bottom-10 lg:-right-10 lg:h-[9rem] lg:w-[9rem]"
      />
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
  const qLead =
    "text-[12px] mb-1.5 font-bold tracking-wide text-[#5F00F0] [text-shadow:0_1px_0_rgba(255,255,255,0.92)]";
  const qBody =
    "text-[13px] sm:text-sm font-semibold leading-snug text-slate-900 [text-shadow:0_1px_0_rgba(255,255,255,0.95),0_0_18px_rgba(255,255,255,0.65)]";
  const statsGrid = "grid grid-cols-3 gap-1.5 mt-2";
  const statCell = "flex items-center gap-1.5 px-2 py-1.5 rounded-lg";
  const statIcon = "w-3.5 h-3.5";
  const statTxt = "text-[12px] font-semibold";

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col lg:max-w-[620px] lg:mx-auto">
      <div
        className={`absolute ${glow} rounded-[32px] opacity-0 pointer-events-none`}
        style={{
          background:
            "radial-gradient(circle, rgba(167,139,250,0.) 0%, rgba(110, 53, 232,0.35) 45%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className={`glass-card flex h-full min-h-0 flex-1 flex-col ${shell}`}>
        <div
          className={`relative flex min-h-0 flex-1 flex-col ${inner} overflow-hidden border-0 bg-[#ffffff]/95`}
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
              <span className={`truncate font-medium ${titleSz}`} style={{ color: "rgba(15,23,42,0.5)" }}>
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

          <div className="relative min-h-[200px] flex-1 bg-[#ffffff] sm:min-h-[240px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              >
                <source src={HOME_AI_DEMO_VIDEO} type="video/mp4" />
              </video>
            </div>

            <div className="pointer-events-none absolute inset-0">
              {/* Che watermark góc phải dưới video (HeyGen) */}
              <div
                className="absolute bottom-0 right-0 z-[1] h-[24%] w-[40%] max-w-[11rem] min-h-[3.25rem] sm:max-w-[13rem]"
                style={{
                  background:
                    "linear-gradient(to top left, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.72) 35%, rgba(255,255,255,0.2) 72%, transparent 100%)",
                }}
                aria-hidden
              />
              <div
                className={`absolute left-0 right-0 top-0 z-[3] flex items-center justify-between ${topBar}`}
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, transparent 100%)",
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
                className={`absolute bottom-0 left-0 right-0 z-[2] ${bottomWrap}`}
                style={{
                  background:
                    "linear-gradient(to top, rgba(248,250,252,0.72) 0%, rgba(255,255,255,0.18) 38%, transparent 68%)",
                }}
              >
                <div
                  className={bubble}
                  style={{
                    background: "rgba(255,255,255,0.52)",
                    border: "1px solid rgba(255,255,255,0.55)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.12)",
                  }}
                >
                  <div className="min-w-0">
                    <p className={qLead}>Câu hỏi 2/5</p>
                    <p className={qBody}>
                      Hãy kể về một lần bạn phải giải quyết xung đột trong nhóm. Bạn đã xử lý như thế nào?
                    </p>
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
                        background: "rgba(255,255,255,0.94)",
                        border: "1px solid rgba(15,23,42,0.12)",
                        boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                      }}
                    >
                      <item.icon className={`${statIcon} shrink-0`} style={{ color: item.color }} />
                      <span className={statTxt} style={{ color: "rgb(15, 23, 42)" }}>
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
  const navigate = useNavigate();

  const handleFeatureClick = (route) => navigate(route);
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
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      document.documentElement.style.setProperty("--landing-scroll", String(progress));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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
      className="min-h-screen selection:bg-violet-100 selection:text-violet-900 font-sans overflow-x-hidden relative bg-transparent text-slate-900"
    >
      <style>{`
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
        .landing-scroll-ambient {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(
              55% 35% at 15% calc(var(--landing-scroll, 0) * 100%),
              rgba(99, 14, 212, 0.14),
              transparent 65%
            ),
            radial-gradient(
              45% 30% at 88% calc(var(--landing-scroll, 0) * 85% + 8%),
              rgba(191, 243, 101, 0.1),
              transparent 60%
            );
          transition: opacity 0.4s ease;
        }
        .landing-section-flow {
          position: relative;
        }
        .landing-section-flow::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -3rem;
          width: 1px;
          height: 3rem;
          transform: translateX(-50%);
          background: linear-gradient(to bottom, transparent, rgba(124, 58, 237, 0.35));
          opacity: 0;
          animation: landingConnectorIn 0.8s ease forwards;
          animation-timeline: view();
          animation-range: entry 0% cover 25%;
        }
        @keyframes landingConnectorIn {
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-section-flow::before { animation: none; opacity: 0.4; }
          .hero-orbit-text { animation: none !important; }
          .float-icon, .float-icon-delay, .float-icon-slow { animation: none !important; }
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
        .glass-card.interview-preview-card {
          overflow: visible !important;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .glass-card.interview-preview-card:hover {
          transform: none;
        }
        .courses-glass-card {
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.08);
          transition: border-color 0.25s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .courses-glass-card:hover {
          border-color: rgba(124, 58, 237, 0.22);
          box-shadow: 0 12px 40px rgba(124, 58, 237, 0.14);
          transform: translateY(-2px);
        }
        .courses-cta-primary {
          background: #bff365;
          color: #131f00;
          box-shadow: 0 10px 24px rgba(164, 214, 76, 0.35);
        }
        .courses-cta-primary:hover {
          box-shadow: 0 14px 32px rgba(164, 214, 76, 0.45);
        }
        .courses-mascot-lean {
          object-fit: contain;
          object-position: left bottom;
        }
        @keyframes testimonial-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes testimonial-marquee-rev {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .testimonial-marquee-row {
          overflow: hidden;
          width: 100%;
        }
        .testimonial-marquee-row:hover .testimonial-marquee-track {
          animation-play-state: paused;
        }
        .testimonial-marquee-track {
          display: flex;
          width: max-content;
          gap: 1.25rem;
          animation: testimonial-marquee 44s linear infinite;
        }
        .testimonial-marquee-track--alt {
          animation: testimonial-marquee-rev 56s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .testimonial-marquee-track,
          .testimonial-marquee-track--alt {
            animation: none !important;
          }
        }
      `}</style>

      <motion.div className="landing-scroll-ambient" aria-hidden />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="relative z-10 flex h-screen max-h-screen flex-col justify-start overflow-hidden px-10 sm:px-16 lg:px-24 pt-6 sm:pt-8 md:pt-10">
        {renderSectionSticks([
          { x: 5, y: 11, size: 38, opacity: 0.48 },
          { x: 93, y: 13, size: 44, opacity: 0.55 },
          { x: 3, y: 50, size: 32, opacity: 0.4 },
          { x: 92, y: 80, size: 36, opacity: 0.46 },
        ])}

        {/* Hero content — 2 cột lg: copy trái + video/mockup phải */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(200px,300px)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-6 lg:gap-y-4">
            <div className="order-1 text-left lg:col-start-1 lg:row-start-1">
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold bg-white"
                style={{
                  borderColor: "rgba(95, 0, 240, 0.42)",
                  color: "#5B21B6",
                }}
              >
                <SparkleGlyph className="w-3.5 h-3.5" />
                Bạn đồng hành luyện phỏng vấn
              </div>

              <h1
                className="mb-3 font-headline text-slate-900 leading-[1.1] tracking-tighter cute-heading"
                style={{
                  fontSize: "clamp(2.55rem, 5.6vw, 3.85rem)",
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
                <span className="block text-slate-900">qua mô phỏng hội thoại thông minh</span>
              </h1>

              <p
                className="mb-5 max-w-2xl leading-relaxed text-slate-600 font-medium"
                style={{ fontSize: "0.9rem" }}
              >
                So CV với JD, luyện trả lời với AI, gặp mentor từ Shopee, Vingroup, FPT…
                Mở app là thấy tiến bộ rõ — không còn phải tự lo một mình trên hành trình tìm việc.
              </p>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-start">
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
                  Thử phỏng vấn miễn phí
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
                  Xem giá nè
                </button>
              </div>
            </div>

            {/* Cột phải: căn đáy hàng 1 để video không “bay” quá cao so với copy */}
            <div className="order-3 flex w-full justify-start lg:order-2 lg:col-start-2 lg:row-start-1 lg:flex lg:justify-end lg:self-center">
              <HeroInterviewVideoCard />
            </div>

            {/* Thanh stats — full width trong cột hero, căn với navbar */}
            <div className="order-2 mt-6 w-full lg:order-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mt-6">
              <div
                className="glass-card w-full px-2.5 py-3 sm:px-3 sm:py-3.5"
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
                      className="rounded-xl bg-white px-2 py-2.5 text-center sm:px-3 sm:py-3.5"
                      style={{
                        border: "1px solid rgba(95, 0, 240, 0.22)",
                        boxShadow: "none",
                      }}
                    >
                      <div
                        className="mb-1.5 font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#9B6DFF]"
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
        className="landing-section-flow relative z-10 h-screen max-h-screen flex flex-col justify-center overflow-hidden pt-6 md:pt-8 lg:pt-10"
      >
        {renderSectionSticks([
          { x: 10, y: 16, size: 34, opacity: 0.45 },
          { x: 88, y: 20, size: 40, opacity: 0.55 },
          { x: 82, y: 78, size: 32, opacity: 0.44 },
        ])}
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full py-2">
          <LandingReveal className="mb-6 pt-5" y={24}>
            <div className="mx-auto mb-5 flex max-w-4xl flex-col items-center">
              <div className="flex items-center justify-center">
                <img
                  src="/mascot-features.png?v=4"
                  alt="Gấu Piupiu"
                  className="relative z-10 h-auto w-[9.5rem] shrink-0 -translate-x-[0.5rem] -translate-y-[0.65rem] drop-shadow-[0_16px_32px_rgba(110,53,232,0.18)] sm:w-[10.5rem] sm:-translate-y-[0.9rem] md:w-[11rem]"
                />
                <div className="relative z-0 -ml-[3.15rem] text-left sm:-ml-[3.4rem] md:-ml-[3.65rem]">
                  <span className="mb-3 block h-1.5 w-12 rounded-full bg-[#6E35E8]/40" />
                  <h2 className="cute-heading font-headline text-3xl font-black leading-[1.08] tracking-tighter text-slate-900 md:text-5xl">
                    Chuẩn bị phỏng vấn
                    <br />
                    <span className="text-[#7c3aed]">tự tin hơn rõ rệt</span>
                  </h2>
                </div>
              </div>
            </div>
            <p className="mx-auto max-w-md text-center text-sm font-semibold text-slate-500">Bốn bước nối liền — lướt xuống là hiểu ngay</p>
          </LandingReveal>

          <LandingStagger className="grid grid-cols-1 md:grid-cols-4 gap-4" stagger={0.1}>
            {STEPS.map((s, i) => (
              <LandingItem key={i}>
              <div
                className={`glass-card group min-h-[11.25rem] p-5 sm:min-h-[11.75rem] sm:p-6 relative overflow-hidden h-full transition-[border-color,box-shadow] duration-300 ${i === 1
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
                  <div className="mb-3.5 min-h-[32px] flex items-center justify-start">
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
                  <div className={`absolute top-0 right-0 p-4 transition-opacity pointer-events-none ${i === 1 ? "opacity-[0.22]" : "opacity-[0.18] group-hover:opacity-[0.26]"}`}>
                    <span className={`text-7xl font-black italic ${i === 1 ? "text-[#5F00F0]/40" : "text-[#5F00F0]/30"}`}>{s.step}</span>
                  </div>

                  <div
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 shadow-lg ${i % 2 === 0
                      ? "bg-[#6E35E8] text-[#ffffff] shadow-[0_0_24px_rgba(167,139,250,0.)]"
                      : "bg-white/5 text-[#6E35E8] border border-white/10 group-hover:bg-[#6E35E8]/15 group-hover:border-[#6E35E8]/35"
                      }`}
                  >
                    <s.icon className="h-[1.35rem] w-[1.35rem]" />
                  </div>

                  <h3 className="text-lg font-extrabold mb-2 text-slate-900 font-headline tracking-tight">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">
                    {s.desc}
                  </p>
                </div>
              </div>
              </LandingItem>
            ))}
          </LandingStagger>

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
              Bắt đầu luyện
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
        className="landing-section-flow relative z-10 h-screen max-h-screen flex flex-col justify-center overflow-x-hidden overflow-y-visible"
      >
        {renderSectionSticks([
          { x: 14, y: 24, size: 32, opacity: 0.42 },
          { x: 91, y: 16, size: 42, opacity: 0.56 },
          { x: 88, y: 72, size: 34, opacity: 0.46 },
        ])}
        <div className="max-w-7xl mx-auto px-5 relative z-10 w-full py-2">
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-8 items-stretch">
            {/* Left copy + gấu Upzi (mock HTML) */}
            <div className="relative h-full min-h-0 overflow-visible">
              <div className="glass-card interview-preview-card relative flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
              <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                <div>
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
                  className="mb-2 text-slate-900 leading-tight cute-heading"
                  style={{
                    fontSize: "clamp(1.35rem, 2.6vw, 2.05rem)",
                  }}
                >
                  <span className="block">Phỏng vấn như thật</span>
                  <span className="block font-headline text-[#5F00F0]">AI hỏi, bạn đỡ lo hơn</span>
                </h2>
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                <p
                  className="mb-6 leading-relaxed"
                  style={{
                    color: "#475569",
                    fontSize: "0.98rem",
                  }}
                >
                  AI phỏng vấn hỏi sát JD, góp ý trực quan — chấm STAR từng câu, biết ngay chỗ cần chỉnh.
                </p>

                <ul className="space-y-2 mb-5">
                  {[
                    "Năm câu hỏi riêng theo JD — không hỏi chung chung",
                    "Nhận diện giọng, không cần gõ từng chữ",
                    "Chấm STAR chi tiết — biết điểm yếu ở đâu",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5"
                      style={{ color: "#334155" }}
                    >
                      <div
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "rgba(110, 53, 232,0.08)",
                        }}
                      >
                        <Check
                          className="h-3 w-3 shrink-0"
                          style={{ color: "#6E35E8" }}
                        />
                      </div>
                      <span className="min-w-0 flex-1 text-[13px] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative z-[1] mt-auto sm:pr-[calc(6rem+1cm+1.75rem)]">
                  <button
                    type="button"
                    onClick={() => navigateToInterview(navigate)}
                    className="inline-flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all hover:brightness-110 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #B4F500, #93D600)",
                      color: "#0f172a",
                      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                    }}
                  >
                    Thử miễn phí ngay
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                </div>
              </div>
              </div>
              <img
                src="/mascot-interview-preview.png?v=4"
                alt=""
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-[calc(2.25rem+1rem)] z-30 hidden h-auto w-[calc(5.25rem+1cm)] object-contain object-bottom drop-shadow-[0_8px_18px_rgba(110,53,232,0.16)] sm:block sm:right-[calc(2.5rem+1rem)] sm:w-[calc(5.75rem+1cm)] md:right-[calc(2.75rem+1rem)] md:w-[calc(6rem+1cm)]"
              />
            </div>

            <div className="flex h-full min-h-0 flex-col">
              <InterviewDemoMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CV ANALYSIS — vẫn trong nhóm Lộ trình (navbar #features) ═══ */}
      <div className="landing-section-flow">
        <CvAnalysisFeatureShowcase
          onCtaClick={() => requireLoginNavigate(navigate, "/cv-analysis")}
        />
      </div>

      {/* ═══ COURSES SECTION ═════════════════════════════════ */}
      <section
        id="courses"
        className="landing-section-flow relative isolate z-20 flex h-screen max-h-screen flex-col justify-center overflow-x-hidden overflow-y-visible pt-2 md:pt-3 lg:pt-4"
      >
        {renderSectionSticks([
          { x: 90, y: 8, size: 32, opacity: 0.44 },
          { x: 94, y: 38, size: 36, opacity: 0.5 },
          { x: 6, y: 86, size: 28, opacity: 0.38 },
          { x: 82, y: 78, size: 34, opacity: 0.46 },
        ])}

        <div className="relative z-10 mx-auto w-full max-w-7xl translate-x-[0.4rem] px-5 py-3 sm:px-10 sm:py-4">
          <div className="relative z-10 mb-4 md:pl-[1.58rem] lg:pl-[2.08rem]">
              <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-[#630ed4] to-[#7c3aed]" aria-hidden />
              <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.05em] text-[#630ed4]">
                Học kỹ năng
              </span>
              <h2 className="mb-2 -translate-y-[0.45rem] translate-x-[0.1rem] font-headline text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1b23] sm:text-[2rem]">
                Học từ mentor thật
                <span className="mt-0 block translate-x-[0.31rem] text-[#7c3aed]">sửa lỗi liền tay</span>
              </h2>
          </div>

          <div className="relative mb-5 mt-8 overflow-visible">
            <img
              src="/mascot-courses.png?v=8"
              alt=""
              aria-hidden
              className="pointer-events-none absolute z-0 hidden object-contain md:block md:h-[10.5rem] md:w-[10.5rem] md:left-0 md:-top-[7.5rem] md:-translate-x-[6.3rem] md:translate-y-[2.81rem] lg:h-[13.5rem] lg:w-[13.5rem] lg:-left-2 lg:-top-[9rem] xl:h-[15rem] xl:w-[15rem] xl:-left-3 xl:-top-[10rem]"
            />
            <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {COURSES_DATA.slice(0, 3).map((course, idx) => (
              <div
                key={course.id}
                onClick={() =>
                  handleFeatureClick(`/courses/${course.id}`)
                }
                className="group courses-glass-card flex h-full min-h-0 cursor-pointer flex-col overflow-hidden"
              >
                <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-[7.25rem] shrink-0 overflow-hidden sm:h-[7.5rem]">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wider text-white backdrop-blur-md rounded-full">
                        {course.category}
                      </span>
                      <span className="inline-flex items-center justify-center gap-1 bg-black/60 px-2.5 py-1 text-[10px] font-medium leading-none text-white backdrop-blur-md rounded-full">
                        <span className="material-symbols-outlined text-[13px] leading-none">schedule</span>
                        {Math.floor(course.duration / 60)}h {course.duration % 60}m
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-3.5 right-3.5 inline-flex items-center justify-center rounded-full bg-[#7c3aed] px-2 py-1 text-[10px] font-black uppercase leading-none tracking-wide text-white shadow-md">
                        New
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                      <div className="w-[3.35rem] h-[3.35rem] rounded-full flex items-center justify-center shadow-2xl transform transition-transform border-2 border-white/90 float-icon-delay parallax-layer"
                        style={{ background: "#bff365" }}
                      >
                        <PlayCircle className="w-[1.4rem] h-[1.4rem] text-[#131f00] translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-[1.125rem]">
                    <h3 className="mb-2.5 min-h-[2.5rem] line-clamp-2 break-words text-base font-bold leading-snug text-[#1a1b23] transition-colors sm:min-h-[2.6rem] group-hover:text-[#7c3aed]">
                      {course.title}
                    </h3>

                    <div className="mb-2.5 flex min-h-[2.5rem] shrink-0 items-center gap-2">
                      <img
                        src={course.mentorAvatar}
                        alt={course.mentorName}
                        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                      <div className="flex min-w-0 flex-col justify-center gap-0.5">
                        <p className="text-sm font-bold leading-tight text-[#1a1b23]">{course.mentorName}</p>
                        <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.05em] text-[#4a4455]">
                          Mentor thật
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#ccc3d8]/60 pt-3">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span
                          className="material-symbols-outlined shrink-0 text-[1.125rem] leading-none text-amber-500"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="text-sm font-bold leading-none text-slate-800">{course.rating}</span>
                        <span className="truncate text-xs leading-none text-slate-500">
                          ({(course.reviewsCount || 0) + 700})
                        </span>
                      </div>
                      <div className="shrink-0 text-lg font-black leading-none tabular-nums text-[#630ed4]">
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
          </div>

          <div className="relative z-0 text-center">
            <button
              type="button"
              onClick={() => navigate("/courses")}
              className="courses-cta-primary group relative rounded-full px-10 py-3.5 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] sm:px-11 sm:py-4 sm:text-base"
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
        className="landing-section-flow relative z-10 h-screen max-h-screen overflow-hidden"
      >
        {renderSectionSticks([
          { x: 78, y: 12, size: 34, opacity: 0.46 },
          { x: 92, y: 52, size: 36, opacity: 0.5 },
          { x: 10, y: 86, size: 30, opacity: 0.38 },
        ])}
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-0 h-full flex flex-col justify-center relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-6 items-start">
            <div className="lg:col-span-5">
              <h2 className="text-slate-900 mb-0 cute-heading flex flex-col items-start gap-0 text-[1.65rem] leading-none sm:text-3xl md:text-4xl lg:text-[2.55rem]">
                <span className="block leading-none tracking-tight">Mọi người nói gì về</span>
                <img
                  src="/Logo.png"
                  alt="ProInterview"
                  className="mt-2 block h-10 w-auto max-w-[min(100%,16rem)] object-contain object-left contrast-[1.06] sm:mt-2.5 sm:h-11 sm:max-w-[min(100%,18rem)] md:h-12 md:max-w-[min(100%,20rem)] lg:h-14"
                  decoding="async"
                />
              </h2>
              <p className="mt-0 text-slate-600 text-[0.9375rem] leading-relaxed max-w-xl">
                AI + mentor thật chiến — giúp bạn bứt tốc qua mọi vòng PV.
                Lời thật từ bạn đã nhận việc — không phải câu quảng cáo đâu nhé.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {TESTIMONIALS.map((t) => (
                    <div
                      key={`avatar-${t.name}`}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.grad} border-2 border-white flex items-center justify-center text-[11px] font-black text-white shadow-sm`}
                    >
                      {t.avatar}
                    </div>
                  ))}
                </div>
                <p className="text-[0.9375rem] text-slate-600">
                  <span className="text-[#6E35E8] font-black">500+</span> bạn đã nhận việc
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-[11px] uppercase tracking-[0.18em] text-[#5B21B6] font-black">
                  <SparkleGlyph className="size-3.5" />
                  Đánh giá nổi bật
                </div>
              </div>
              <div
                className="relative overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                }}
              >
                <div className="space-y-5">
                  <div className="testimonial-marquee-row">
                    <div className="testimonial-marquee-track">
                      {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div
                          key={`marq1-${i}-${t.name}`}
                          className="shrink-0 w-[min(17.5rem,calc(100vw-3rem))] sm:w-[15.5rem] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${t.grad} flex items-center justify-center`}>
                              <CheckCircle2 className="size-[1.125rem] text-white" />
                            </div>
                            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[#6E35E8] font-black leading-tight">{t.tag}</p>
                          </div>
                          <p className="text-[0.9375rem] sm:text-base text-slate-700 leading-snug line-clamp-2">"{t.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="testimonial-marquee-row">
                    <div className="testimonial-marquee-track testimonial-marquee-track--alt">
                      {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div
                          key={`marq2-${i}-${t.name}`}
                          className="shrink-0 w-[min(17.5rem,calc(100vw-3rem))] sm:w-[15.5rem] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                        >
                          <div className="flex gap-1 mb-2.5">
                            {[...Array(t.stars)].map((_, j) => (
                              <Star key={`${t.name}-s-${i}-${j}`} className="size-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <p className="text-[0.9375rem] sm:text-base text-slate-700 leading-snug line-clamp-2 mb-2.5">"{t.text}"</p>
                          <p className="text-sm text-slate-600 font-semibold">{t.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#f3f0f9] via-[#f3f0f9]/70 to-transparent blur-md" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#f3f0f9] via-[#f3f0f9]/70 to-transparent blur-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <Footer variant="light" />
    </div>
  );
}