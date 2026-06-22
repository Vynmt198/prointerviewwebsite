import { useEffect, useRef, useState } from "react";

const MASCOT_VIDEO_SRC = "/watingvid.mp4";
// Video nguồn pillarbox 1280x720, mascot chỉ chiếm vùng giữa ~766x718 (viền đen 2 bên).
const MASCOT_CROP = { x: 257, y: 0, w: 766, h: 718 };

// Video nguồn, ở 1 vài thời điểm trong vòng loop, đôi lúc render ra 1 frame lỗi
// (đường line đen mảnh dọc giữa khung) -- không tái hiện được khi trích từng
// frame tĩnh nên nhiều khả năng là glitch lúc loop lại (seam) của trình duyệt,
// không phải lỗi crop/scale. Vẽ qua <canvas> + tự kiểm tra từng frame, bỏ qua
// (giữ nguyên frame tốt trước đó) nếu phát hiện artifact, để không bao giờ hiện
// đường lỗi này ra UI.
function MascotVideo({ className }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stagingRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (!stagingRef.current) stagingRef.current = document.createElement("canvas");
    const staging = stagingRef.current;
    const stagingCtx = staging.getContext("2d", { willReadFrequently: true });
    stagingCtx.imageSmoothingEnabled = true;
    stagingCtx.imageSmoothingQuality = "high";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      canvas.width = w;
      canvas.height = h;
      staging.width = w;
      staging.height = h;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // Quét vài cột mỏng toàn đen, chạy suốt >=40% chiều cao -> dấu hiệu của
    // glitch (mascot thật không có cột nào tối như vậy trên diện rộng vậy).
    const hasArtifactLine = () => {
      const w = staging.width, h = staging.height;
      if (w < 6 || h < 6) return false;
      const data = stagingCtx.getImageData(0, 0, w, h).data;
      const rowStep = Math.max(1, Math.floor(h / 60));
      let run = 0;
      for (let x = 2; x < w - 2; x++) {
        let dark = 0, total = 0;
        for (let y = 0; y < h; y += rowStep) {
          const idx = (y * w + x) * 4;
          const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          if (lum < 40) dark++;
          total++;
        }
        if (dark / total > 0.6) {
          run++;
        } else {
          if (run > 0 && run <= 12) return true;
          run = 0;
        }
      }
      return run > 0 && run <= 12;
    };

    let rafId;
    const draw = () => {
      if (video.readyState >= 2) {
        stagingCtx.drawImage(
          video,
          MASCOT_CROP.x, MASCOT_CROP.y, MASCOT_CROP.w, MASCOT_CROP.h,
          0, 0, staging.width, staging.height,
        );
        if (!hasArtifactLine()) {
          ctx.drawImage(staging, 0, 0);
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        src={MASCOT_VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        className="hidden"
      />
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

// "weight" ~ tỉ trọng thời gian tương đối giữa các bước, dùng để tính % progress bar.
// Không cần khớp tuyệt đối với thời gian thực tế của backend, chỉ cần đủ để
// thanh progress di chuyển hợp lý qua các giai đoạn.
const STEPS = [
  { key: "extracting_cv",        message: "AI đang đọc và hiểu hồ sơ của bạn...",                         weight: 3 },
  { key: "analyzing_role",       message: "Đang phân tích vai trò & năng lực cần có cho vị trí này...",   weight: 5 },
  { key: "generating_questions", message: "Đang soạn câu hỏi phỏng vấn được cá nhân hóa riêng cho bạn...", weight: 30 },
  { key: "creating_session",     message: "Đang chuẩn bị phòng phỏng vấn...",                              weight: 3 },
  { key: "pregenerating_videos", message: "Đang dựng hình ảnh & giọng nói cho HR ảo, bước này hơi lâu nhưng rất đáng chờ!", weight: 70 },
];

// Map real loadingStep values (từ Interview.jsx) sang vị trí hiển thị.
// "analyzing_role" không bao giờ được set trực tiếp, nó tự "hoàn thành" âm thầm
// khi chuyển từ extracting_cv → generating_questions.
const STEP_INDEX = {
  extracting_cv:        0,
  extracting_jd:        0,
  generating_questions: 2,
  creating_session:     3,
  pregenerating_videos: 4,
};

const TIPS = [
  "Mẹo nhỏ: trả lời theo cấu trúc STAR (Tình huống – Nhiệm vụ – Hành động – Kết quả) sẽ thuyết phục hơn đấy.",
  "Đây là cơ hội để bạn luyện tập trước buổi phỏng vấn thật — trả lời chưa hoàn hảo cũng không sao cả!",
  "Hãy ngồi thẳng, hít thở sâu và mỉm cười — sự tự tin luôn là điểm cộng lớn nhất.",
  "Đừng quên chuẩn bị vài câu chuyện thực tế từ kinh nghiệm của bạn, HR rất thích những ví dụ cụ thể.",
  "Chúc bạn may mắn! Chúng tôi sẽ đồng hành cùng bạn trong suốt buổi phỏng vấn này.",
];

const TOTAL_WEIGHT = STEPS.reduce((sum, s) => sum + s.weight, 0);

function cumulativeWeight(uptoIdx) {
  return STEPS.slice(0, uptoIdx).reduce((sum, s) => sum + s.weight, 0);
}

export function InterviewLoadingState({ currentStep }) {
  const currentIdx = STEP_INDEX[currentStep] ?? 0;
  const step = STEPS[currentIdx];

  const segmentStart = (cumulativeWeight(currentIdx) / TOTAL_WEIGHT) * 100;
  const segmentEnd = (cumulativeWeight(currentIdx + 1) / TOTAL_WEIGHT) * 100;

  // "Creep": trong lúc đứng ở 1 step (đặc biệt step cuối có thể tốn tới ~3 phút),
  // tự nhích thanh progress lên dần để không tạo cảm giác bị đứng/treo,
  // nhưng luôn dừng lại trước ranh giới của step kế tiếp.
  const [creepPct, setCreepPct] = useState(0);
  useEffect(() => {
    setCreepPct(0);
    const interval = setInterval(() => {
      setCreepPct((prev) => Math.min(prev + 1, 92));
    }, 1200);
    return () => clearInterval(interval);
  }, [currentStep]);

  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const segmentSpan = Math.max(segmentEnd - segmentStart, 0);
  const progress = segmentStart + (segmentSpan * creepPct) / 100;

  return (
    <div className="flex flex-col items-center">
      <MascotVideo className="mb-4 mx-auto h-36 aspect-[766/718] overflow-hidden rounded-md sm:h-44" />

      <p className="text-center text-sm font-semibold text-violet-800">
        {step.message}
      </p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#630ed4] to-[#93f72b] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 w-full rounded-md bg-violet-50 px-3 py-2.5 text-center text-xs text-violet-700">
        {TIPS[tipIdx]}
      </div>
    </div>
  );
}
