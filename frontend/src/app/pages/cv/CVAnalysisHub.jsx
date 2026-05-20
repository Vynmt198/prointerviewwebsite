import React from "react";
import { useNavigate } from "react-router";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { CvAnalysisHubHero, CvAnalysisHubIntroSections } from "../../components/cv/CvAnalysisHubSections";

export function CVAnalysisHub() {
  const navigate = useNavigate();

  return (
    <MentorPageShell bottomPad="pb-16">
      <div className="relative z-[1] mx-auto w-full max-w-6xl px-6 pb-12 pt-6 sm:px-8 sm:pt-10">
        <CvAnalysisHubHero
          onJd={() => navigate("/cv-analysis/jd")}
          onField={() => navigate("/cv-analysis/field")}
          onHistory={() => navigate("/cv-analysis/history")}
        />
        <CvAnalysisHubIntroSections
          onJd={() => navigate("/cv-analysis/jd")}
          onField={() => navigate("/cv-analysis/field")}
        />
      </div>
    </MentorPageShell>
  );
}
