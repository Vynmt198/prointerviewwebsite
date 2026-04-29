import React from "react";

export function TopNavShell({ variant = "dark", scrolled = true, children }) {
  const isDark = variant === "dark";

  const navStyle = isDark
    ? {
        background: scrolled ? "rgba(7, 6, 14, 0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }
    : {
        background: scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(148,71,255,0.12)" : "none",
        boxShadow: scrolled ? "0 8px 24px rgba(148,71,255,0.08)" : "none",
      };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-5 transition-all duration-300" style={navStyle}>
      {children}
    </nav>
  );
}
