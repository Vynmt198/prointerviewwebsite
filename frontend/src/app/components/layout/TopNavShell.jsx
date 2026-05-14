import React from "react";

export function TopNavShell({ variant = "light", scrolled = true, children }) {
  const isDark = variant === "dark";

  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[100] flex justify-between items-center px-8 h-12 transition-all duration-500"
      style={
        isDark
          ? {
              background: "rgba(18, 10, 38, 0.78)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(148, 120, 255, 0.28)",
              borderRadius: "40px 10px 40px 10px",
              boxShadow: "0 4px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(110, 53, 232, 0.15) inset",
            }
          : {
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "2px solid rgba(186, 165, 255, 0.55)",
              borderRadius: "40px 10px 40px 10px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.9) inset, 0 4px 28px rgba(110, 53, 232, 0.12), 0 2px 10px rgba(0,0,0,0.04)",
            }
      }
    >
      {children}
    </nav>
  );
}
