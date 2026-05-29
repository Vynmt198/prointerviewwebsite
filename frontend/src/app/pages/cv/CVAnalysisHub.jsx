import React from "react";
import { useNavigate } from "react-router";
import { CvAnalysisHubHero } from "../../components/cv/CvAnalysisHubSections";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";
import { requireLoginNavigate } from "../../utils/authGate";

const HUB_VIEWPORT_STYLES = `
  @media (min-width: 1024px) {
    .cv-hub-viewport {
      --cv-hub-scale: min(1, calc((100svh - 4.25rem) / 49.5rem));
      height: calc(100svh - 4.75rem);
      max-height: calc(100svh - 4.75rem);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Scale theo chiều cao; bù width để mép trái/phải trùng shell navbar */
    .cv-hub-fit {
      width: calc(100% / var(--cv-hub-scale));
      max-width: none;
      transform: scale(var(--cv-hub-scale)) translateY(-2rem);
      transform-origin: center center;
    }
  }
`;

export function CVAnalysisHub() {
  const navigate = useNavigate();

  return (
    <div className={`cv-hub-viewport flex min-h-0 flex-col ${CUSTOMER_SHELL_GUTTER}`}>
      <style>{HUB_VIEWPORT_STYLES}</style>
      <div className={`cv-hub-fit min-h-0 ${CUSTOMER_SHELL_MAX}`}>
        <CvAnalysisHubHero
          navShellAligned
          onJd={() => requireLoginNavigate(navigate, "/cv-analysis/jd")}
          onField={() => requireLoginNavigate(navigate, "/cv-analysis/field")}
        />
      </div>
    </div>
  );
}
