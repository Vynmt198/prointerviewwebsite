import React from "react";
import { useNavigate } from "react-router";
import { CvAnalysisHubHero } from "../../components/cv/CvAnalysisHubSections";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";
import { requireLoginNavigate } from "../../utils/authGate";

const HUB_VIEWPORT_STYLES = `
  @media (min-width: 1024px) {
    .cv-hub-viewport {
      --cv-hub-scale: 1;
      min-height: calc(100svh - 4.75rem);
      height: auto;
      max-height: none;
      overflow: visible;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-top: 2rem;
      padding-bottom: 4rem;
    }
    .cv-hub-fit {
      width: 100%;
      max-width: none;
      transform: translateY(-2rem) scale(1);
      transform-origin: left center;
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
