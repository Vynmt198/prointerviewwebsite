import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router";
import {
  FileText,
  Users,
  TrendingUp as TrendUp,
  Star,
  ChevronRight as CaretRight,
  Brain,
  Target as Crosshair,
  Award as Medal,
  ArrowRight,
  Zap as Lightning,
  Upload as UploadSimple,
  Video as VideoCamera,
  BadgeCheck as SealCheck,
  GraduationCap
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { RecommendedJourney } from "../../components/home/RecommendedJourney";
import { CvAnalysisFeatureShowcase } from "../../components/home/CvAnalysisFeatureShowcase";
import {
  MentorFeatureShowcase,
  HOME_MENTOR_MASCOTS,
} from "../../components/home/MentorFeatureShowcase";
import { CoursesFeatureShowcase } from "../../components/home/CoursesFeatureShowcase";
import { HeroInterviewVideoCard } from "../../components/home/HeroInterviewVideoCard";
import { SparkleGlyph } from "../../components/decor/SparkleGlyph.jsx";
import {
  SectionReveal,
  LandingReveal,
  LandingStagger,
  LandingItem,
} from "../../components/home/landing/LandingReveal";
import {
  HOME_SHELL_MAX,
  HOME_SECTION_INNER,
} from "../../components/layout/customerShellLayout";
import { HOME_COPY, HOME_SECTION_COPY } from "../../constants/brandVoice";
import {
  HOME_HERO_TITLE_CLAMP,
  HOME_SECTION_TITLE_CLAMP,
  homeSectionClasses as homeTy,
} from "../../constants/homeTypography";
/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    accentClass: "from-[#93f72b] to-[#8fbc24]",
    bgClass: "bg-lime-50 dark:bg-lime-950/30",
    dotColor: "#93f72b",
    borderHover: "rgba(196, 255, 71,0.5)",
    bgHover: "rgba(196, 255, 71,0.07)",
    title: HOME_SECTION_COPY.features[0].title,
    desc: HOME_SECTION_COPY.features[0].desc,
    route: "/cv-analysis",
    cta: HOME_SECTION_COPY.features[0].cta,
  },
  {
    icon: Brain,
    accentClass: "from-[#8037f4] to-[#a66ff8]",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    dotColor: "#8037f4",
    borderHover: "rgba(128, 55, 244,0.5)",
    bgHover: "rgba(128, 55, 244,0.08)",
    title: HOME_SECTION_COPY.features[1].title,
    desc: HOME_SECTION_COPY.features[1].desc,
    route: "/interview",
    cta: HOME_SECTION_COPY.features[1].cta,
  },
  {
    icon: Users,
    accentClass: "from-[#FFB800] to-[#FF8C42]",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    dotColor: "#FFB800",
    borderHover: "rgba(255,184,0,0.5)",
    bgHover: "rgba(255,184,0,0.07)",
    title: HOME_SECTION_COPY.features[2].title,
    desc: HOME_SECTION_COPY.features[2].desc,
    route: "/mentors",
    cta: HOME_SECTION_COPY.features[2].cta,
  },
  {
    icon: TrendUp,
    accentClass: "from-sky-400 to-blue-600",
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    dotColor: "#38BDF8",
    borderHover: "rgba(167,139,250,0.)",
    bgHover: "rgba(167,139,250,0.)",
    title: HOME_SECTION_COPY.features[3].title,
    desc: HOME_SECTION_COPY.features[3].desc,
    route: "/my-bookings",
    cta: HOME_SECTION_COPY.features[3].cta,
  },
];

const STEP_ICONS = [FileText, Brain, Users, GraduationCap];
const STEP_COLORS = ["#7000ff", "#b8f600", "#7000ff", "#7000ff"];

const STEPS = HOME_SECTION_COPY.steps.map((s, i) => ({
  ...s,
  icon: STEP_ICONS[i],
  color: STEP_COLORS[i],
}));

const TESTIMONIAL_MASCOTS = [
  HOME_MENTOR_MASCOTS.pro,
  HOME_MENTOR_MASCOTS.cv,
  HOME_MENTOR_MASCOTS.headset,
];

const TESTIMONIALS = HOME_SECTION_COPY.testimonials.items.map((t, i) => ({
  ...t,
  mascot: TESTIMONIAL_MASCOTS[i],
  stars: 5,
}));

const HERO_SPARKLE_MIN_MOVE_PX = 18;
const HERO_SPARKLE_MAX_ON_SCREEN = 55;
const HERO_SPARKLE_FADE_DURATION_S = 4.0;
/** Bán kính bung sao quanh đầu chuột khi di chuyển */
const HERO_SPARKLE_MOVE_SPREAD_PX = 42;
/** Phần chiều cao video (từ mép trên) được tính vào vùng bling */
const HERO_VIDEO_SPARKLE_FRACTION = 1 / 3;

function getSparkleZoneTopBound(fallbackTop) {
  const candidates = [fallbackTop];
  const heroSection = document.getElementById("home-hero-section");
  const navShell = document.querySelector(".top-nav-shell-outer");
  if (heroSection) candidates.push(heroSection.getBoundingClientRect().top);
  if (navShell) candidates.push(navShell.getBoundingClientRect().top);
  return Math.min(...candidates);
}

function getSparkleZoneHorizontalBounds(...rects) {
  const valid = rects.filter(Boolean);
  if (!valid.length) return { left: 0, width: 0 };
  const left = Math.min(...valid.map((r) => r.left));
  const right = Math.max(...valid.map((r) => r.right));
  return { left, width: right - left };
}

function getHeroSparkleZoneBounds() {
  const heroSection = document.getElementById("home-hero-section");
  if (!heroSection) return null;
  return heroSection.getBoundingClientRect();
}

/** Cả mockup video (title bar + viền + ô phát), không spawn / không giữ sao */
function isPointOverHeroVideoCard(clientX, clientY) {
  const card = document.getElementById("home-hero-video-card");
  if (!card) return false;
  const rect = card.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function isPointOverNavPill(clientX, clientY) {
  const pill = document.querySelector(".top-nav-pill");
  if (!pill) return false;
  const rect = pill.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function isPointOverHeroIntroBadge(clientX, clientY) {
  const badge = document.querySelector(".hero-intro-badge");
  if (!badge) return false;
  const rect = badge.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function isPointOverHeroIntroCta(clientX, clientY) {
  const cta = document.querySelector(".hero-intro-cta");
  if (!cta) return false;
  const rect = cta.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

/** Không spawn / giữ sao trôi trên headline hero (tránh sao “dính” cạnh chữ thông minh). */
function isPointOverHeroHeadline(clientX, clientY) {
  const headline = document.querySelector(".hero-intro-copy");
  if (!headline) return false;
  const rect = headline.getBoundingClientRect();
  const pad = 12;
  return (
    clientX >= rect.left - pad &&
    clientX <= rect.right + pad &&
    clientY >= rect.top - pad &&
    clientY <= rect.bottom + pad
  );
}

function shouldSkipSparkleTarget(target, clientX, clientY) {
  if (target.closest(".top-nav-pill, #home-hero-video-card, video")) return true;
  if (isPointOverNavPill(clientX, clientY)) return true;
  if (isPointOverHeroVideoCard(clientX, clientY)) return true;
  if (target.closest(".hero-intro-badge") || isPointOverHeroIntroBadge(clientX, clientY)) return true;
  if (target.closest(".hero-intro-cta") || isPointOverHeroIntroCta(clientX, clientY)) return true;
  if (target.closest(".hero-intro-copy, .home-hero-title") || isPointOverHeroHeadline(clientX, clientY)) return true;
  if (target.closest("a, h1, p, .aspect-video")) return true;
  return false;
}

function isPointInSparkleZone(clientX, clientY, bounds) {
  if (isPointOverNavPill(clientX, clientY)) return false;
  if (isPointOverHeroVideoCard(clientX, clientY)) return false;
  if (isPointOverHeroIntroBadge(clientX, clientY)) return false;
  if (isPointOverHeroIntroCta(clientX, clientY)) return false;
  if (isPointOverHeroHeadline(clientX, clientY)) return false;
  return (
    clientX >= bounds.left &&
    clientX <= bounds.left + bounds.width &&
    clientY >= bounds.top &&
    clientY <= bounds.top + bounds.height
  );
}

function filterSparklesOutsideBlockedAreas(items, bounds) {
  return items.filter((item) => {
    const clientX = bounds.left + item.x;
    const clientY = bounds.top + item.y;
    return (
      !isPointOverNavPill(clientX, clientY) &&
      !isPointOverHeroVideoCard(clientX, clientY) &&
      !isPointOverHeroIntroBadge(clientX, clientY) &&
      !isPointOverHeroIntroCta(clientX, clientY) &&
      !isPointOverHeroHeadline(clientX, clientY)
    );
  });
}

function isSparkleZoneOnScreen(bounds) {
  return bounds.bottom > 0 && bounds.top < window.innerHeight;
}

function sparklesAtCursor(localX, localY, vx = 0, vy = 0) {
  const count = Math.random() > 0.35 ? 3 : 2;
  const stamp = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * HERO_SPARKLE_MOVE_SPREAD_PX;
    const driftAngle = angle + (Math.random() - 0.5);
    const driftSpeed = Math.random() * 20 + 10;
    
    // Add strong momentum based on mouse velocity
    const momentumX = vx * 2.5; 
    const momentumY = vy * 2.5;
    
    return {
      id: `${stamp}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: localX + Math.cos(angle) * r,
      y: localY + Math.sin(angle) * r,
      dx: momentumX + Math.cos(driftAngle) * driftSpeed,
      dy: momentumY + Math.sin(driftAngle) * driftSpeed,
      rotate: Math.random() * 60 - 30,
    };
  });
}

function HeroAtmosphere() {
  // Use a fallback for SSR/initial render
  const initX = typeof window !== 'undefined' ? window.innerWidth / 2 : 1000;
  const initY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
  
  const mouseX = useMotionValue(initX);
  const mouseY = useMotionValue(initY);
  
  const pX1 = useTransform(mouseX, [0, 2000], [50, -50]);
  const pY1 = useTransform(mouseY, [0, 1000], [50, -50]);
  
  const pX2 = useTransform(mouseX, [0, 2000], [-35, 35]);
  const pY2 = useTransform(mouseY, [0, 1000], [-35, 35]);
  
  const pX3 = useTransform(mouseX, [0, 2000], [25, -25]);
  const pY3 = useTransform(mouseY, [0, 1000], [25, -25]);

  const [arrows, setArrows] = useState([]);
  const [sparklePortalReady, setSparklePortalReady] = useState(false);
  const [heroBounds, setHeroBounds] = useState(null);

  const pushSparkles = (items) => {
    if (!items.length) return;
    setArrows((prev) => {
      const next = [...prev, ...items];
      return next.length > HERO_SPARKLE_MAX_ON_SCREEN
        ? next.slice(next.length - HERO_SPARKLE_MAX_ON_SCREEN)
        : next;
    });
  };

  useEffect(() => {
    setSparklePortalReady(true);
  }, []);

  useEffect(() => {
    let lastX = -1000;
    let lastY = -1000;

    const syncHeroBounds = () => {
      const bounds = getHeroSparkleZoneBounds();
      if (!bounds || !isSparkleZoneOnScreen(bounds)) {
        setHeroBounds(null);
        setArrows([]);
        return;
      }
      setHeroBounds(bounds);
    };

    syncHeroBounds();
    window.addEventListener("scroll", syncHeroBounds, { passive: true });
    window.addEventListener("resize", syncHeroBounds);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const bounds = getHeroSparkleZoneBounds();
      if (!bounds || !isSparkleZoneOnScreen(bounds)) {
        setArrows([]);
        return;
      }
      if (!isPointInSparkleZone(e.clientX, e.clientY, bounds)) {
        return;
      }
      if (shouldSkipSparkleTarget(e.target, e.clientX, e.clientY)) return;

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist >= HERO_SPARKLE_MIN_MOVE_PX) {
        const localX = e.clientX - bounds.left;
        const localY = e.clientY - bounds.top;
        const vx = e.clientX - lastX;
        const vy = e.clientY - lastY;
        pushSparkles(filterSparklesOutsideBlockedAreas(sparklesAtCursor(localX, localY, vx, vy), bounds));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseClick = (e) => {
      const bounds = getHeroSparkleZoneBounds();
      if (!bounds || !isPointInSparkleZone(e.clientX, e.clientY, bounds)) return;
      if (shouldSkipSparkleTarget(e.target, e.clientX, e.clientY)) return;

      const burstCount = 14;
      const burstRadius = 130;
      const localX = e.clientX - bounds.left;
      const localY = e.clientY - bounds.top;
      const now = Date.now();
      const burst = Array.from({ length: burstCount }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * burstRadius;
        const driftSpeed = Math.random() * 60 + 30;
        return {
          id: `${now}-${i}`,
          x: localX + Math.cos(angle) * r,
          y: localY + Math.sin(angle) * r,
          dx: Math.cos(angle) * driftSpeed,
          dy: Math.sin(angle) * driftSpeed,
          rotate: Math.random() * 360,
        };
      });
      pushSparkles(filterSparklesOutsideBlockedAreas(burst, bounds));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseClick);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseClick);
      window.removeEventListener("scroll", syncHeroBounds);
      window.removeEventListener("resize", syncHeroBounds);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {sparklePortalReady &&
        heroBounds &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[60] overflow-hidden"
            style={{
              top: heroBounds.top,
              left: heroBounds.left,
              width: heroBounds.width,
              height: heroBounds.height,
            }}
          >
            {arrows.map((arrow) => (
              <motion.div
                key={arrow.id}
                className="pointer-events-none absolute will-change-transform"
                style={{ left: arrow.x, top: arrow.y }}
                initial={{ x: "-50%", y: "-50%", opacity: 0.92, scale: 0.86, rotate: arrow.rotate }}
                animate={{ x: `calc(-50% + ${arrow.dx || 0}px)`, y: `calc(-50% + ${arrow.dy || 0}px)`, opacity: 0, scale: 0.38, rotate: arrow.rotate + 18 }}
                transition={{ duration: HERO_SPARKLE_FADE_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={() =>
                  setArrows((prev) => prev.filter((a) => a.id !== arrow.id))
                }
              >
                <SparkleGlyph className="h-6 w-6" />
              </motion.div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

import { achievementsApi } from "../../api/achievementsApi.js";

export function Home() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    // Fetch achievements
    const fetchAchievements = async () => {
      try {
        const res = await achievementsApi.getAll();
        if (res.data?.success) {
          setAchievements(res.data.achievements || []);
        }
      } catch (err) {
        console.error("Failed to load achievements", err);
      }
    };
    fetchAchievements();
  }, []);

  const renderSectionSticks = (sticks, sparkleTone = "brand") => (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block" aria-hidden>
      {sticks.map((s, idx) => (
        <SparkleGlyph
          key={`section-stick-${idx}`}
          tone={sparkleTone}
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

  }, []);

  return (
    <div
      className="min-h-screen selection:bg-[rgba(147,247,43,0.42)] selection:text-slate-900 font-sans relative bg-transparent text-slate-900 -mt-[12rem] pt-[12rem]"
    >
      <HeroAtmosphere />

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
        .hero-title-stack {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          line-height: 1.08;
        }
        .hero-title-line {
          display: block;
          line-height: 1.08;
          white-space: nowrap;
        }
        @media (max-width: 1023px) {
          .hero-title-line {
            white-space: normal;
            overflow-wrap: break-word;
          }
          .home-how-title {
            font-size: clamp(1.35rem, 5vw, 1.65rem) !important;
            line-height: 1.15 !important;
          }
          .home-hero-section .hero-title-stack {
            gap: 0;
          }
          .home-mobile-gutter {
            padding-left: 0.875rem;
            padding-right: 0.875rem;
          }
          .glass-card {
            border-radius: 14px;
            border-width: 1px;
          }
          .home-mobile-tight .cv-analysis-glass-card {
            border-radius: 12px;
          }
        }
        .cute-heading {
          letter-spacing: -0.03em;
          font-weight: 750;
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
        @keyframes heroWiggle {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          18% { transform: translate3d(0.5px,-0.8px,0) rotate(-1deg) scale(1.01); }
          36% { transform: translate3d(-0.6px,0.6px,0) rotate(1.2deg) scale(1.02); }
          54% { transform: translate3d(0.4px,-0.4px,0) rotate(-0.8deg) scale(1.01); }
          72% { transform: translate3d(-0.4px,0.4px,0) rotate(0.8deg) scale(1.01); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
        }
        .hero-title-highlight {
          display: inline-block;
          transform-origin: 40% 70%;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-title-highlight { animation: none; }
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
        .landing-section-flow {
          position: relative;
        }
        @media (max-width: 639px) {
        }
        @media (prefers-reduced-motion: reduce) {
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
          border: 2px solid #8037f4;
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
          border-color: #630ed4;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }
        /* 4 ô How it works, trắng ngà sáng, không #fff tinh / không đục */
        .home-how-step-card {
          background: linear-gradient(180deg, #fefeff 0%, #faf8fc 100%) !important;
          border: 2px solid #8037f4 !important;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
        }
        .home-how-step-card:hover {
          border-color: #630ed4 !important;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.07);
        }
        /* Bước Nổi bật, giữ nhãn lime */
        .home-step-featured-dots {
          background: linear-gradient(180deg, #f0ebf8 0%, #ebe4f6 100%);
          border-color: rgba(128, 55, 244, 0.42) !important;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(128, 55, 244, 0.14) inset;
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
          gap: 1.5rem;
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

        /* ── ATMOSPHERIC CLOUD BACKGROUND (Hero Only) ── */
        .codex-mesh-bg {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 130vh;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          background-color: transparent;
          mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 55%, transparent 100%);
        }

        /* Soft lavender-white base */
        .cloud-base-wash {
          position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(155deg, #efe6fa 0%, #e8ddf5 18%, #f5f0fc 40%, #faf8fe 58%, #f0e9f8 78%, #e5dbf3 100%);
        }

        .cloud-layer { position: absolute; inset: 0; will-change: transform; }
        .cb { position: absolute; border-radius: 50%; }

        /* ═══════ DEPTH 1: FAR HAZE (most blur, lowest opacity) ═══════ */
        .cb-far-1 {
          width: 80vw; height: 65vh; top: -20%; left: -15%;
          background: radial-gradient(ellipse at 40% 40%, rgba(128,55,244,0.45) 0%, rgba(128,55,244,0) 70%);
          filter: blur(55px);
          animation: fog-a 14s ease-in-out infinite;
        }
        .cb-far-2 {
          width: 65vw; height: 55vh; bottom: -15%; right: -10%;
          background: radial-gradient(ellipse at 55% 60%, rgba(147,87,245,0.4) 0%, rgba(147,87,245,0) 70%);
          filter: blur(60px);
          animation: fog-b 16s ease-in-out infinite;
        }
        .cb-far-3 {
          width: 50vw; height: 45vh; top: 10%; right: 20%;
          background: radial-gradient(ellipse at center, rgba(183,148,255,0.35) 0%, rgba(183,148,255,0) 65%);
          filter: blur(50px);
          animation: fog-c 12s ease-in-out infinite;
        }

        /* ═══════ DEPTH 2: DEEP MID-CLOUDS ═══════ */
        .cb-deep-1 {
          width: 50vw; height: 40vh; top: -5%; left: 5%;
          background: radial-gradient(ellipse at 35% 45%, rgba(110,53,232,0.5) 0%, rgba(110,53,232,0) 65%);
          filter: blur(40px);
          animation: fog-d 11s ease-in-out infinite;
        }
        .cb-deep-2 {
          width: 40vw; height: 35vh; top: 30%; right: -5%;
          background: radial-gradient(ellipse at 60% 40%, rgba(128,55,244,0.45) 0%, rgba(128,55,244,0) 60%);
          filter: blur(35px);
          animation: fog-a 12s ease-in-out infinite reverse;
        }
        .cb-deep-3 {
          width: 45vw; height: 38vh; bottom: 5%; left: 15%;
          background: radial-gradient(ellipse at 40% 55%, rgba(163,112,247,0.42) 0%, rgba(163,112,247,0) 65%);
          filter: blur(45px);
          animation: fog-b 15s ease-in-out infinite;
        }
        .cb-deep-4 {
          width: 30vw; height: 28vh; top: 15%; left: 35%;
          background: radial-gradient(ellipse at center, rgba(99,14,212,0.38) 0%, rgba(99,14,212,0) 60%);
          filter: blur(32px);
          animation: fog-c 10s ease-in-out infinite;
        }

        /* ═══════ DEPTH 3: MID FORMATIONS (main visible masses) ═══════ */
        .cb-mid-1 {
          width: 38vw; height: 32vh; top: 8%; left: 0%;
          background: radial-gradient(ellipse at 45% 50%, rgba(128,55,244,0.55) 0%, rgba(128,55,244,0) 60%);
          filter: blur(25px);
          animation: fog-d 9s ease-in-out infinite;
        }
        .cb-mid-2 {
          width: 32vw; height: 28vh; top: 25%; left: 28%;
          background: radial-gradient(ellipse at 50% 45%, rgba(110,53,232,0.52) 0%, rgba(110,53,232,0) 58%);
          filter: blur(20px);
          animation: fog-a 11s ease-in-out infinite;
        }
        .cb-mid-3 {
          width: 35vw; height: 30vh; top: 5%; right: 10%;
          background: radial-gradient(ellipse at 55% 40%, rgba(147,87,245,0.48) 0%, rgba(147,87,245,0) 62%);
          filter: blur(22px);
          animation: fog-b 12s ease-in-out infinite reverse;
        }
        .cb-mid-4 {
          width: 28vw; height: 25vh; bottom: 18%; right: 20%;
          background: radial-gradient(ellipse at center, rgba(163,112,247,0.45) 0%, rgba(163,112,247,0) 58%);
          filter: blur(18px);
          animation: fog-c 8s ease-in-out infinite;
        }
        .cb-mid-5 {
          width: 25vw; height: 22vh; bottom: 30%; left: 10%;
          background: radial-gradient(ellipse at 40% 55%, rgba(128,55,244,0.42) 0%, rgba(128,55,244,0) 55%);
          filter: blur(15px);
          animation: fog-d 11s ease-in-out infinite reverse;
        }

        /* ═══════ DEPTH 4: UPPER-RIGHT DARKER MASS ═══════ */
        .cb-dark-1 {
          width: 45vw; height: 40vh; top: -10%; right: -5%;
          background: radial-gradient(ellipse at 60% 35%, rgba(79,20,180,0.6) 0%, rgba(79,20,180,0) 65%);
          filter: blur(30px);
          animation: fog-b 14s ease-in-out infinite;
        }
        .cb-dark-2 {
          width: 30vw; height: 28vh; top: 5%; right: 8%;
          background: radial-gradient(ellipse at 55% 40%, rgba(99,14,212,0.55) 0%, rgba(99,14,212,0) 60%);
          filter: blur(22px);
          animation: fog-c 12s ease-in-out infinite;
        }
        .cb-dark-3 {
          width: 22vw; height: 20vh; top: 18%; right: 18%;
          background: radial-gradient(ellipse at center, rgba(67,10,160,0.5) 0%, rgba(67,10,160,0) 55%);
          filter: blur(15px);
          animation: fog-d 10s ease-in-out infinite reverse;
        }

        /* ═══════ DEPTH 5: NEAR FOREGROUND WISPS (least blur) ═══════ */
        .cb-near-1 {
          width: 30vw; height: 25vh; bottom: 10%; left: 0%;
          background: radial-gradient(ellipse at 35% 55%, rgba(163,112,247,0.48) 0%, rgba(163,112,247,0) 55%);
          filter: blur(15px);
          animation: fog-a 7s ease-in-out infinite;
        }
        .cb-near-2 {
          width: 25vw; height: 20vh; top: 40%; left: 50%;
          background: radial-gradient(ellipse at center, rgba(183,148,255,0.45) 0%, rgba(183,148,255,0) 50%);
          filter: blur(12px);
          animation: fog-b 8s ease-in-out infinite;
        }
        .cb-near-3 {
          width: 20vw; height: 18vh; top: 15%; left: 55%;
          background: radial-gradient(ellipse at 45% 45%, rgba(128,55,244,0.4) 0%, rgba(128,55,244,0) 50%);
          filter: blur(10px);
          animation: fog-c 6s ease-in-out infinite reverse;
        }
        .cb-near-4 {
          width: 22vw; height: 20vh; bottom: 25%; right: 5%;
          background: radial-gradient(ellipse at 50% 50%, rgba(147,87,245,0.42) 0%, rgba(147,87,245,0) 52%);
          filter: blur(12px);
          animation: fog-d 8s ease-in-out infinite;
        }

        /* ═══════ DEPTH 6: ILLUMINATION & GLOW ═══════ */
        .cb-glow-1 {
          width: 50vw; height: 45vh; top: 12%; left: 18%;
          background: radial-gradient(ellipse at 45% 45%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 55%);
          filter: blur(45px);
          animation: fog-glow 11s ease-in-out infinite;
        }
        .cb-glow-2 {
          width: 35vw; height: 30vh; top: 30%; left: 35%;
          background: radial-gradient(ellipse at center, rgba(248,244,253,0.65) 0%, rgba(248,244,253,0) 50%);
          filter: blur(35px);
          animation: fog-glow 14s ease-in-out infinite reverse;
        }
        .cb-glow-3 {
          width: 28vw; height: 24vh; bottom: 20%; left: 25%;
          background: radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%);
          filter: blur(30px);
          animation: fog-glow 10s ease-in-out infinite;
        }

        /* Vignette */
        .cloud-vignette {
          position: absolute; inset: 0; z-index: 6;
          background: radial-gradient(
            ellipse 70% 60% at 45% 45%,
            transparent 0%, transparent 35%,
            rgba(110,53,232,0.06) 65%,
            rgba(79,20,180,0.13) 100%
          );
          pointer-events: none;
        }

        /* Breathing, slow, subtle autonomous movement */
        @keyframes fog-a {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(6%, 8%); }
          66% { opacity: 0.8; transform: scale(1.1) translate(-4%, 5%); }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes fog-b {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.08) translate(-8%, 5%); }
          66% { opacity: 0.82; transform: scale(1.15) translate(5%, -6%); }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes fog-c {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          33% { transform: scale(0.95) translate(9%, -8%); }
          66% { opacity: 0.75; transform: scale(0.9) translate(-6%, -3%); }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes fog-d {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-6%, -9%); }
          66% { opacity: 0.85; transform: scale(1.1) translate(8%, 5%); }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        @keyframes fog-glow {
          0% { opacity: 1; transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.1) translate(5%, 5%); }
          66% { opacity: 0.7; transform: scale(1.15) translate(-3%, -3%); }
          100% { opacity: 1; transform: scale(1) translate(0, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cb { animation: none !important; }
        }
      `}</style>

      {/* ═══ HERO (chỉ copy + CTA, clip bling ~1 màn; video section riêng bên dưới) ═══ */}
      <section
        id="home-hero-section"
        className="home-hero-section relative z-10 flex min-h-[100svh] flex-col justify-center px-6 pb-8 pt-24 sm:px-10 sm:pt-28 lg:px-16 lg:pb-10 lg:pt-32 -mb-[17rem] lg:mb-0"
      >
        
        {/* Interactive Mouse Particles */}
        {/* Note: HeroAtmosphere now handles both the background mesh and the mouse particles */}

        <div
          id="home-hero-sparkle-zone"
          className={`home-hero-sparkle-zone relative z-10 mx-auto flex w-full -translate-y-40 lg:-translate-y-8 flex-col items-center px-4 py-6 text-center sm:px-8 sm:py-10 ${HOME_SHELL_MAX}`}
        >
          <div className="hero-intro-badge mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#630ed4] bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.03em] text-[#630ed4] shadow-[0_2px_12px_rgba(99,14,212,0.1)] backdrop-blur-sm sm:text-xs">
              <SparkleGlyph className="h-3.5 w-3.5 shrink-0" tone="violet" />
              {HOME_COPY.badge}
            </div>
          </div>

          <div className="hero-intro-copy max-w-5xl">
            <h1
              className="home-hero-title hero-title-stack cute-heading mx-auto mb-5 text-slate-900"
              style={{ fontSize: HOME_HERO_TITLE_CLAMP }}
            >
              {/* Line 1: "Phỏng vấn" + chip */}
              <span className="hero-title-line inline-flex flex-wrap items-center gap-x-[0.28em] gap-y-1 text-slate-900">
                {HOME_COPY.titleLine1}{" "}
                <span
                  className="hero-title-highlight"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #630ed4 0%, #8037f4 100%)",
                    color: "#ffffff",
                    borderRadius: "6px",
                    padding: "0.02em 0.4em 0.1em",
                    fontWeight: 800,
                  }}
                >
                  {HOME_COPY.titleHighlight}
                </span>
              </span>
              <span className="hero-title-line text-slate-900">qua mô phỏng hội thoại</span>
              <span className="hero-title-line text-slate-900">thông minh</span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Câu hỏi cá nhân hoá theo CV & JD, phản hồi chi tiết sau mỗi buổi.
            </p>

            <div className="hero-intro-cta mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={() => navigate("/interview")}
                className="group inline-flex items-center gap-3 rounded-full py-3 pl-6 pr-3 text-sm font-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] hover:brightness-105 active:scale-[0.98] sm:text-base"
                style={{
                  background: "#a3ff3d",
                  color: "#0f172a",
                  boxShadow: "0 8px 24px -6px rgba(147,247,43,0.45)",
                }}
              >
                {HOME_COPY.cta}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>

          </div>
        </div>
      </section>




      {/* ═══ CV ANALYSIS (navbar #features) ═══ */}
      <div className="landing-section-flow">
        <SectionReveal variant="cv">
          <CvAnalysisFeatureShowcase/>
        </SectionReveal>
      </div>

      {/* ═══ AI INTERVIEW SHOWCASE ═══ */}
      <div className="landing-section-flow">
        <SectionReveal variant="interview">
          <section
            id="ai-interview"
            aria-label="Luyện phỏng vấn với AI"
            className="relative z-10 flex min-h-screen flex-col justify-center overflow-x-hidden overflow-y-visible px-0 py-16 sm:px-10 lg:px-16 max-lg:min-h-0 max-lg:py-8 max-lg:px-0"
          >
            <div className={`${HOME_SECTION_INNER} home-mobile-gutter relative z-10 py-2 lg:!pr-6`}>
              <div className="flex flex-col-reverse items-center gap-10 lg:flex-row lg:items-center lg:gap-2">

                <div className="relative mx-auto w-full flex-1 lg:flex-[3.75] lg:-ml-16 lg:-translate-y-8">
                  {/* Mascot peeking from bottom-right corner of card */}
                  <div className="pointer-events-none absolute -bottom-[1.5rem] right-[-5.25rem] z-20 hidden lg:block">
                    <img
                      src="/mascot-features.png"
                      alt=""
                      aria-hidden
                      className="h-[15rem] w-auto object-contain drop-shadow-xl"
                    />
                  </div>
                  <HeroInterviewVideoCard overlap={true} />
                </div>

                <div className="w-full flex-1 lg:flex-[2] flex flex-col items-start gap-3 sm:gap-3.5 lg:-translate-y-[6rem] lg:translate-x-[1.1rem] relative">
                  <span className={homeTy.cvShowcaseBadge}>
                    <Brain className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Luyện PV với AI
                  </span>
                  <h2
                    className={`max-w-full ${homeTy.title} sm:max-w-none max-lg:flex-row max-lg:flex-wrap`}
                    style={{ fontSize: HOME_SECTION_TITLE_CLAMP }}
                  >
                    <span className="lg:block text-slate-900">Luyện phỏng vấn </span>
                    <span className="lg:block text-slate-900">với AI sẵn sàng </span>
                    <span className="lg:block text-[#630ed4]">cho cơ hội thật</span>
                  </h2>
                  <p className={`mt-2 max-w-[22rem] ${homeTy.body}`}>
                    Thực chiến phỏng vấn 1-1 cùng AI với bộ câu hỏi được cá nhân hoá theo CV & JD.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </SectionReveal>
      </div>

      <div className="landing-section-flow" style={{ perspective: "1400px" }}>
        <SectionReveal variant="mentor">
          <MentorFeatureShowcase/>
        </SectionReveal>
      </div>

      <div className="landing-section-flow">
        <SectionReveal variant="courses" delay={0.05}>
          <CoursesFeatureShowcase/>
        </SectionReveal>
      </div>



      {/* ═══ TESTIMONIALS ═══════════════════════════════════ */}
      <section
        id="mentors"
        className="landing-section-flow relative z-10 -mt-[5rem] h-[calc(100vh+3rem)] max-h-[calc(100vh+3rem)] min-h-[calc(100vh+3rem)] overflow-x-hidden max-lg:mt-0 max-lg:h-auto max-lg:max-h-none max-lg:min-h-0 max-lg:py-4 lg:overflow-x-visible"
      >
        {renderSectionSticks([
          { x: 78, y: 12, size: 34, opacity: 0.46 },
          { x: 92, y: 52, size: 36, opacity: 0.5 },
          { x: 10, y: 86, size: 30, opacity: 0.38 },
        ])}
        <div className={`${HOME_SECTION_INNER} home-mobile-gutter relative z-10 flex h-full w-full flex-col justify-center py-4 sm:py-6 max-lg:h-auto max-lg:py-0`}>
          <div className="flex min-w-0 w-full flex-col items-start gap-8 overflow-visible lg:flex-row lg:items-center lg:gap-16">
            <div className="relative z-20 w-full shrink-0 lg:w-fit lg:max-w-[min(100%,40rem)] lg:-translate-x-[2rem]">
              <div className={`${homeTy.badge} mb-4`}>
                <SparkleGlyph className="size-3.5" />
                {HOME_SECTION_COPY.testimonials.badge}
              </div>
              <h2
                className={`mb-0 flex w-full max-w-none flex-col items-start gap-0 ${homeTy.title}`}
                style={{ fontSize: HOME_SECTION_TITLE_CLAMP }}
              >
                <span className="block max-w-full leading-none lg:whitespace-nowrap">
                  {HOME_SECTION_COPY.testimonials.titleLine}
                </span>
                <span
                  className="mt-2 block h-[1.95rem] w-fit shrink-0 sm:mt-2.5 sm:h-[2.2rem] md:h-[2.45rem] lg:h-[3.2rem]"
                  aria-hidden
                >
                  <img
                    src="/Logo.png"
                    alt="ProInterview"
                    className="block h-full w-auto shrink-0 object-contain object-left contrast-[1.12] brightness-[0.94]"
                    width={537}
                    height={91}
                    decoding="sync"
                  />
                </span>
              </h2>
              <p className={`mt-1 lg:max-w-none ${homeTy.body}`}>
                {HOME_SECTION_COPY.testimonials.body}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {TESTIMONIALS.map((t) => (
                    <div
                      key={`avatar-${t.name}`}
                      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-violet-50 shadow-sm"
                    >
                      <img
                        src={t.mascot}
                        alt=""
                        className="h-[85%] w-[85%] object-contain object-bottom"
                        onError={(e) => {
                          if (e.currentTarget.src !== HOME_MENTOR_MASCOTS.fallback) {
                            e.currentTarget.src = HOME_MENTOR_MASCOTS.fallback;
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className={homeTy.body}>
                  <span className="font-black text-[#8037f4]">500+</span>{" "}
                  {HOME_SECTION_COPY.testimonials.socialProof}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-visible py-[0.9rem] lg:min-h-[22rem] lg:min-w-0 lg:pl-0">
              <div
                className="relative w-full overflow-hidden lg:-mx-[3rem] lg:w-[calc(100%+6rem)]"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
                }}
              >
                <div className="space-y-6">
                  <div className="testimonial-marquee-row">
                    <div className="testimonial-marquee-track">
                      {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div
                          key={`marq1-${i}-${t.name}`}
                          className="shrink-0 w-[min(100%,17.5rem)] sm:w-[17.5rem] lg:w-[18.5rem] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sm:p-6 max-lg:rounded-lg max-lg:p-4"
                        >
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-violet-100 bg-violet-50">
                              <img
                                src={t.mascot}
                                alt=""
                                className="h-[88%] w-[88%] object-contain object-bottom"
                                onError={(e) => {
                                  if (e.currentTarget.src !== HOME_MENTOR_MASCOTS.fallback) {
                                    e.currentTarget.src = HOME_MENTOR_MASCOTS.fallback;
                                  }
                                }}
                              />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-[#8037f4] font-black leading-tight sm:text-xs lg:text-[0.8rem]">{t.tag}</p>
                          </div>
                          <p className="text-xs text-slate-700 leading-snug line-clamp-2 sm:text-sm lg:text-base">"<em className="not-italic">{t.text}</em>"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="testimonial-marquee-row">
                    <div className="testimonial-marquee-track testimonial-marquee-track--alt">
                      {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                        <div
                          key={`marq2-${i}-${t.name}`}
                          className="shrink-0 w-[min(100%,17.5rem)] sm:w-[17.5rem] lg:w-[18.5rem] bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sm:p-6 max-lg:rounded-lg max-lg:p-4"
                        >
                          <div className="flex gap-1 mb-3">
                            {[...Array(t.stars)].map((_, j) => (
                              <Star key={`${t.name}-s-${i}-${j}`} className="size-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <p className="mb-2.5 text-xs leading-snug text-slate-700 line-clamp-2 sm:text-sm lg:text-base">"<em className="not-italic">{t.text}</em>"</p>
                          <p className="text-[10px] font-bold text-slate-900 sm:text-xs lg:text-sm">{t.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-14 bg-gradient-to-r from-[#ebe4f6] via-[#ebe4f6]/80 to-transparent sm:w-16 lg:w-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-14 bg-gradient-to-l from-[#ebe4f6] via-[#ebe4f6]/80 to-transparent sm:w-16 lg:w-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ACHIEVEMENTS / NEWS SECTION ═══ */}
      <section className="relative z-10 mx-auto max-w-[84.35rem] px-4 py-16 sm:px-6 sm:py-24">
        {/* Decorative blur orbs */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#8037f4]/8 blur-[140px]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-[300px] w-[400px] rounded-full bg-[#a3ff3d]/6 blur-[100px]" aria-hidden />

        {/* Section header */}
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className={homeTy.badge}>
            <Medal className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Tin tức & Hoạt động
          </span>
          <h2
            className={`${homeTy.title} max-w-none`}
            style={{ fontSize: HOME_SECTION_TITLE_CLAMP }}
          >
            <span className={homeTy.titleLineDark}>Thành tựu nổi bật{" "}
              <span className="text-[#630ed4]">từ ProInterview</span>
            </span>
          </h2>
          <p className={homeTy.body}>
            Cập nhật những tin tức, sự kiện và cột mốc phát triển mới nhất của chúng tôi.
          </p>
        </div>

        {achievements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mx-auto max-w-[24rem] md:max-w-none">
            {achievements.slice(0, 3).map((item) => (
              <article
                key={item._id}
                onClick={() => navigate(`/achievements/${item._id}`)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_-8px_rgba(99,14,212,0.15)]"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-violet-100 to-violet-50" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3 p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-violet-500">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>

                  <h3 className="text-base font-bold leading-snug tracking-[-0.02em] text-slate-900 line-clamp-2 transition-colors duration-300 group-hover:text-[#630ed4] sm:text-[1.05rem]">
                    {item.title}
                  </h3>

                  {/* Footer */}
                  <div className="mt-1 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <img
                        src="/logo-mark-circle.png"
                        alt="ProInterview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold leading-none text-slate-800">ProInterview Team</span>
                      <span className="mt-0.5 text-[11px] text-slate-400">prointerview.vn</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA button with button-in-button pattern */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => navigate("/achievements")}
            className="group inline-flex items-center gap-3 rounded-full py-3 pl-6 pr-3 text-sm sm:text-base font-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #a3ff3d 0%, #8ae819 100%)",
              color: "#0f172a",
              boxShadow: "0 10px 30px -8px rgba(147,247,43,0.5), 0 4px 12px -4px rgba(147,247,43,0.3)",
            }}
          >
            Xem tất cả
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}