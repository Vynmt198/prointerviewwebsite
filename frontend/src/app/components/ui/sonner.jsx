"use client";

import { Toaster as Sonner } from "sonner";

const TOAST_CLASS =
  "group toast !rounded-2xl !border-2 !border-violet-200/70 !bg-white !text-slate-900 !shadow-lg !shadow-violet-500/12";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          icon: "[&_svg]:!text-[#93f72b] group-data-[type=error]:[&_svg]:!text-[#8037f4]",
          toast: TOAST_CLASS,
          title: "!font-bold !text-[#1a1b23]",
          description: "!text-slate-600",
          actionButton: "!bg-[#6d2fd6] !text-white",
          cancelButton: "!bg-violet-50 !text-[#6d2fd6]",
          closeButton:
            "!border-violet-200 !bg-violet-50 !text-[#6d2fd6] hover:!bg-violet-100",
          success: "!border-[#93f72b]/45 !bg-[#93f72b]/12 !text-slate-900 !shadow-[#93f72b]/15",
          error: "!border-violet-300/80",
          warning: "!border-amber-200/80",
          info: "!border-l-4 !border-l-[#6d2fd6] !from-violet-50/95 !to-white !bg-gradient-to-r",
        },
      }}
      style={{
        "--normal-bg": "#ffffff",
        "--normal-text": "#1a1b23",
        "--normal-border": "rgba(128, 55, 244, 0.22)",
        "--success-bg": "rgba(147, 247, 43, 0.12)",
        "--success-border": "rgba(147, 247, 43, 0.45)",
        "--success-text": "#1a1b23",
        "--error-bg": "#faf5ff",
        "--error-border": "rgba(128, 55, 244, 0.35)",
        "--error-text": "#8037f4",
        "--warning-bg": "#fffbeb",
        "--warning-border": "rgba(245, 158, 11, 0.35)",
        "--warning-text": "#92400e",
        "--info-bg": "#f5f3ff",
        "--info-border": "rgba(99, 14, 212, 0.35)",
        "--info-text": "#8037f4",
      }}
      {...props}
    />
  );
};

export { Toaster };
