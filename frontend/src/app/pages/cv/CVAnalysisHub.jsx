import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CvAnalysisHubHero } from "../../components/cv/CvAnalysisHubSections";
import { requireLoginNavigate } from "../../utils/authGate";

export function CVAnalysisHub() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CvAnalysisHubHero
        onJd={() => requireLoginNavigate(navigate, "/cv-analysis/jd")}
        onField={() =>
          toast.info("Sắp ra mắt", {
            description:
              "Phân tích CV theo ngành nghề đang được hoàn thiện. Bạn có thể dùng «Phân tích CV + JD có sẵn» trước nhé!",
            classNames: {
              icon: "!text-[#630ed4]",
            },
          })
        }
      />
    </div>
  );
}
