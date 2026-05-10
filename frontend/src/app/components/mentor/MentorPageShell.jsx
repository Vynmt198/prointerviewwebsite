import React from "react";

/**
 * Vỏ trang mentor — nền sáng, thẻ trắng, chữ slate (cùng họ với `Dashboard.jsx` / `Interview.jsx` user).
 * @param {string} [extraStyles] — CSS bổ sung (vd. calendar-cell, tab-btn).
 * @param {string} [bottomPad] — padding đáy, mặc định `pb-20`.
 */
const MENTOR_LIGHT_STYLES = `
        .glass-card {
           background: #ffffff;
           backdrop-filter: none;
           border-radius: 20px;
           border: 1px solid rgba(148, 163, 184, 0.28);
           transition: transform 0.3s ease, border-color 0.25s ease, box-shadow 0.3s ease;
           position: relative;
           overflow: hidden;
           box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }
        .glass-card::before {
           content: none;
        }
        .glass-card:hover {
           border-color: rgba(99, 102, 241, 0.32);
           transform: translateY(-2px);
           box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
        }
        .glow-halo {
           position: relative;
           display: flex;
           align-items: center;
           justify-content: center;
        }
        .glow-halo::after {
           content: none;
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
        .pricing-grid {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          opacity: 1;
          background-image:
            linear-gradient(rgba(148,71,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,71,255,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
        }
`;

export function MentorPageShell({ children, className = "", extraStyles = "", bottomPad = "pb-20" }) {
  return (
    <div
      className={`mentor-surface relative min-h-screen overflow-x-hidden font-sans text-slate-900 selection:bg-[rgba(122,35,229,0.18)] selection:text-slate-900 bg-[#f8f4ff] ${bottomPad} ${className}`.trim()}
    >
      <style>{`${MENTOR_LIGHT_STYLES}${extraStyles || ""}`}</style>
      <div className="pricing-grid" aria-hidden />
      <div className="fixed inset-0 pointer-events-none -z-[3]" style={{ background: "#f8f4ff" }} aria-hidden />
      <div className="fixed top-[-22%] left-[-12%] w-[760px] h-[760px] rounded-full pointer-events-none -z-0 bg-[#d4ff00]/48 blur-[135px]" aria-hidden />
      <div className="fixed bottom-[-22%] right-[-10%] w-[820px] h-[820px] rounded-full pointer-events-none -z-0 bg-[#9447ff]/34 blur-[150px]" aria-hidden />
      <div
        className="fixed left-0 right-0 top-[38%] h-[180px] pointer-events-none -z-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(212,255,0,0.14) 0%, rgba(148,71,255,0.22) 55%, rgba(148,71,255,0.1) 100%)",
          filter: "blur(32px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-[1] opacity-90"
        style={{ animation: "shimmer-bg 14s ease-in-out infinite" }}
        aria-hidden
      />
      {children}
    </div>
  );
}
