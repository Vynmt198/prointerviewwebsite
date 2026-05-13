import React, { useState } from "react";
import { Zap as Lightning } from "lucide-react";

const BRAND_LOGO_SRC = "/Logo.png";

export function BrandLogo({ className = "", compact = false }) {
  const [loadError, setLoadError] = useState(false);

  const frame =
    compact
      ? "h-[56px] md:h-[72px]"
      : "h-[80px] md:h-[130px]";
  const fallbackFrame =
    compact
      ? "w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-[1.75rem]"
      : "w-[80px] h-[80px] md:w-[130px] md:h-[130px] rounded-[2.5rem]";

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className={`${frame} w-auto flex items-center justify-center transition-all duration-300 hover:scale-[1.03]`}
      >
        {loadError ? (
          <div
            className={`${fallbackFrame} flex items-center justify-center shadow-2xl`}
            style={{ background: "linear-gradient(135deg, #6E35E8, #9B6DFF)" }}
          >
            <Lightning className="w-6 h-6 text-white" />
          </div>
        ) : (
          <img
            src={BRAND_LOGO_SRC}
            alt="ProInterview logo"
            className="h-full w-auto object-contain contrast-[1.12] brightness-[0.94]"
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </div>
  );
}
