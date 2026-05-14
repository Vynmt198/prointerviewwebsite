import { Router } from "express";
import multer from "multer";
import { authJwt } from "../middleware/authJwt.js";

export const cvMatchRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

const CV_ANALYZER_URL = process.env.CV_ANALYZER_URL || "http://localhost:8000";

async function proxyToAnalyzer(path, files, res) {
  const form = new FormData();
  for (const [field, file] of Object.entries(files)) {
    const blob = new Blob([file.buffer], { type: "application/pdf" });
    form.append(field, blob, file.originalname);
  }

  let response;
  try {
    response = await fetch(`${CV_ANALYZER_URL}${path}`, { method: "POST", body: form });
  } catch (err) {
    console.error("[cvMatch] fetch failed:", CV_ANALYZER_URL, err?.message);
    return res.status(503).json({
      success: false,
      error:
        "Không kết nối được service phân tích CV (Python). Trong thư mục cv_jd_matching chạy: python -m uvicorn main:app --reload --port 8000 (hoặc cài uvicorn vào PATH). Kiểm tra biến CV_ANALYZER_URL trong backend/.env.",
    });
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    console.error("[cvMatch] analyzer non-JSON body:", response.status, text?.slice(0, 400), parseErr?.message);
    return res.status(502).json({
      success: false,
      error:
        "Service phân tích CV trả về dữ liệu không hợp lệ. Xem log terminal của FastAPI (cv_jd_matching) — thường do lỗi PDF, thiếu Ollama/API LLM, hoặc exception trong Python.",
    });
  }

  res.status(response.status).json(data);
}

// POST /api/cv/analyze — skill matching (không cần Ollama)
cvMatchRouter.post(
  "/analyze",
  authJwt,
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "jd", maxCount: 1 }]),
  async (req, res) => {
    const resume = req.files?.["resume"]?.[0];
    const jd = req.files?.["jd"]?.[0];
    if (!resume || !jd) return res.status(400).json({ success: false, error: "Cần upload cả resume và jd (PDF)" });
    await proxyToAnalyzer("/analyze", { resume, jd }, res);
  }
);

// POST /api/cv/analyze/full — skill matching + Ollama scoring
cvMatchRouter.post(
  "/analyze/full",
  authJwt,
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "jd", maxCount: 1 }]),
  async (req, res) => {
    const resume = req.files?.["resume"]?.[0];
    const jd = req.files?.["jd"]?.[0];
    if (!resume || !jd) return res.status(400).json({ success: false, error: "Cần upload cả resume và jd (PDF)" });
    await proxyToAnalyzer("/analyze/full", { resume, jd }, res);
  }
);

// POST /api/cv/analyze/suggestions — full pipeline + suggestions
cvMatchRouter.post(
  "/analyze/suggestions",
  authJwt,
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "jd", maxCount: 1 }]),
  async (req, res) => {
    const resume = req.files?.["resume"]?.[0];
    const jd = req.files?.["jd"]?.[0];
    if (!resume || !jd) return res.status(400).json({ success: false, error: "Cần upload cả resume và jd (PDF)" });
    await proxyToAnalyzer("/analyze/suggestions", { resume, jd }, res);
  }
);
