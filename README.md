# ProInterview

> Nền tảng SaaS luyện phỏng vấn xin việc với AI avatar, đặt lịch mentor, phân tích CV/JD và khóa học trực tuyến.

[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-green)](https://mongoosejs.com/)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688)](https://fastapi.tiangolo.com/)

---

## Tổng quan

**ProInterview** là ứng dụng web giúp ứng viên chuẩn bị phỏng vấn xin việc thông qua:

- **Phỏng vấn AI** — avatar D-ID đặt câu hỏi, nhận diện khuôn mặt, đánh giá phản hồi
- **Đặt lịch mentor** — booking 1-1 với mentor, thanh toán, đánh giá sau buổi
- **Phân tích CV/JD** — matching CV với mô tả công việc, trích xuất kỹ năng
- **Khóa học** — mua và học khóa học video do mentor tạo
- **Dashboard** — theo dõi tiến trình, lịch sử phỏng vấn, thống kê

---

## Kiến trúc Monorepo

```
ProInterview/
├── frontend/          # Vite + React 18 + Tailwind CSS + shadcn/ui   (port 5173)
├── backend/           # Express 5 + MongoDB (Mongoose 9) + JWT        (port 5000)
└── cv_jd_matching/    # Python FastAPI + Uvicorn                      (port 8000)
```

---

## Yêu cầu

| Công cụ | Phiên bản |
|:--------|:----------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| MongoDB | ≥ 6 (local hoặc Atlas) |
| Python | ≥ 3.10 (chỉ cho CV/JD service) |

---

## Cài đặt & Chạy Dev

### 1. Clone repo

```bash
git clone https://github.com/<your-org>/prointerview.git
cd prointerview
```

### 2. Cấu hình môi trường

**Backend** — tạo `backend/.env` từ template:

```bash
cp backend/.env.example backend/.env
```

Điền các biến bắt buộc:

```env
MONGO_URI=mongodb://127.0.0.1:27017/prointerview
JWT_SECRET=<chuỗi ngẫu nhiên dài ≥ 32 ký tự>
CORS_ORIGIN=http://localhost:5173
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<từ Google Cloud Console>
LLM_API_KEY=<OpenAI hoặc compatible>
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
CV_ANALYZER_URL=http://localhost:8000   # Python service (dev)
```

**Frontend** — tạo `frontend/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=<giống backend>
```

### 3. Cài dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Seed dữ liệu dev

```bash
cd backend
npm run seed:all
```

### 5. Khởi động

**Chạy đồng thời toàn bộ stack (khuyến nghị):**

```bash
cd frontend
npm run dev:full
```

Hoặc chạy riêng từng service:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — CV/JD Service (tuỳ chọn)
cd cv_jd_matching
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Tài khoản dev mặc định (sau seed)

Mật khẩu: **`Dev123456`**

| Email | Role |
|:------|:-----|
| `customer@dev.local` | Customer (plan: free) |
| `mentor@dev.local` | Mentor |
| `admin@dev.local` | Admin |

---

## Tính năng chính

### Người dùng (Customer)
- Đăng ký / đăng nhập email, Google OAuth
- Luyện phỏng vấn với AI avatar (D-ID streaming)
- Upload CV, phân tích và đối chiếu với JD
- Tìm kiếm và đặt lịch mentor
- Mua và học khóa học video
- Lịch sử phỏng vấn, dashboard cá nhân

### Mentor
- Quản lý lịch, booking, thu nhập
- Tạo và quản lý khóa học
- Peer review với mentor khác
- Analytics buổi tư vấn

### Admin
- Quản lý người dùng, mentor, bookings
- Xét duyệt mentor mới
- Dashboard thống kê toàn hệ thống

---

## Core Flow: AI Interview Room Virtual

Đây là tính năng trung tâm của sản phẩm. Luồng đầy đủ từ khi user nhấn "Bắt đầu phỏng vấn" đến khi nhận kết quả phân tích chi tiết.

### Sơ đồ tổng quan

```
/interview          /interview/room              /interview/feedback
[Setup]     ──────► [Phòng phỏng vấn]   ──────► [Kết quả & Phân tích]
   │                       │                              │
   ▼                       ▼                              ▼
Chọn CV            HR AI đặt câu hỏi            SHRM/DDI scores
Chọn HR AI         User trả lời (giọng nói)     Behavioral radar chart
Sinh câu hỏi       Phân tích hành vi realtime   Emotion timeline
Tạo session        Lưu transcript + metrics      Gợi ý cải thiện LLM
```

---

### Giai đoạn 1 — Thiết lập phỏng vấn (`/interview`)

```
User truy cập /interview  →  Interview.jsx
        │
        ├─► BƯỚC 1: Chọn nguồn CV
        │     • Upload PDF mới  →  extractCvTextFromFile()  →  POST /api/interviews/extract-cv-text
        │     • Dùng CV đã phân tích gần nhất  →  đọc từ LocalStorage
        │     • Nhập thủ công: vị trí + công ty + cấp bậc
        │
        ├─► BƯỚC 2: Chọn HR AI  →  Sarah (Nữ) / David (Nam)
        │     Video idle từ Cloudinary; giọng TTS tiếng Việt qua D-ID
        │
        └─► BƯỚC 3: Sinh câu hỏi  →  POST /api/interviews/generate-questions
              │
              │  LLM Pipeline 3 lớp:
              │  ┌─────────────────────────────────────────────────────────┐
              │  │ Layer 1: resolveTopCompetencies()  (không tốn LLM)     │
              │  │   Keyword matching → Top 4 SHRM competency IDs         │
              │  │   → roleCategory (frontend, backend, product, ...)     │
              │  ├─────────────────────────────────────────────────────────┤
              │  │ Layer 2: getFewShotExamples()  (tự cải thiện theo data)│
              │  │   Query MongoDB: sessions cùng role + competencies      │
              │  │   → Behavior questions chất lượng cao từ quá khứ       │
              │  │   → Inject vào prompt (ban đầu rỗng, giàu dần)         │
              │  ├─────────────────────────────────────────────────────────┤
              │  │ Layer 3: callLLM()  (SHRM/DDI grounded generation)     │
              │  │   System prompt: SHRM definitions + DDI Key Actions     │
              │  │   Output: 5 câu hỏi (1 theory + 2 project + 2 behavior)│
              │  │   Mỗi câu có: layer, competencyId, starGuidance{S,T,A,R}│
              │  └─────────────────────────────────────────────────────────┘
              │
              └─► POST /api/interviews/sessions  →  Tạo InterviewSession (MongoDB)
                    Lưu: userId, hrGender, questions[], competencyProfile
                    Trả về: sessionId  →  Navigate /interview/room
```

---

### Giai đoạn 2 — Phòng phỏng vấn thực tế (`/interview/room`)

```
Mount InterviewRoom  →  3 hệ thống khởi tạo song song
  │
  ├─► [A] D-ID WebRTC  (nếu có VITE_DID_API_KEY)
  │       useDIDStream → connect → ICE/SDP → lip-sync tiếng Việt
  │       Fallback: pre-recorded Cloudinary HR videos (Q1–Q5)
  │
  ├─► [B] Web Audio API  (phân tích giọng nói)
  │       getUserMedia({ audio }) → AudioContext + AnalyserNode
  │       Sampling 100ms khi mic bật  →  RMS amplitude 0–1
  │
  └─► [C] MediaPipe FaceMesh  (phân tích khuôn mặt, CDN lazy-load)
          cdn.jsdelivr.net/npm/@mediapipe/face_mesh  (~3MB WASM)
          useFaceAnalysis hook  →  sampling 500ms khi đang trả lời


VÒng LẶP MỖI CÂU HỎI (Q1 → Q5)
══════════════════════════════════════════════════════

  [①] HR đặt câu hỏi
      D-ID: speakWithText(question)  →  avatar nói + lip-sync
      Video: play HR_QUESTION_URLS[gender][qIndex]
      ─── latencyStartRef = Date.now() ───────────────────────────► BẮT ĐẦU ĐO

  [②] User trả lời  (isListening = true)
      │
      ├─ STT (Web Speech API, vi-VN, continuous):
      │    onresult → accumulate transcript
      │    First result → responseLatencyMs = now − latencyStart  ◄─ ĐO XONG
      │
      ├─ Web Audio (100ms):
      │    getFloatTimeDomainData → RMS amplitude
      │    Tích lũy: avgAmplitude, amplitudeVariance
      │              silenceRatio (<10% = silent), silenceEvents (>2s)
      │
      └─ MediaPipe FaceMesh (500ms):
           drawImage(cameraVideo) → canvas → mesh.send()
           468 landmarks → tính:
             eyeContactScore    (mũi cân giữa 2 mắt = nhìn camera)
             headStabilityScore (variance vị trí trung tâm khuôn mặt)
             facePresenceRatio  (% frames detect được mặt)
             distractionEvents  (số lần eye contact < 0.35)

  [③] User nhấn "Câu tiếp theo"
      │
      ├─ buildBehavioralData(qIndex):
      │    Tổng hợp tất cả metrics đã thu thập → object behavioralData
      │
      ├─ PATCH /api/interviews/sessions/:id
      │    { transcript, durationSeconds, behavioralData }   [fire & forget]
      │
      └─ captureAndAnalyzeFace(qIndex):                       [fire & forget]
           canvas.toDataURL(JPEG 0.75) → base64
           POST /api/interviews/sessions/:id/analyze-face
           Backend → Google Cloud Vision API:
             joyLikelihood, sorrowLikelihood, angerLikelihood, surpriseLikelihood
             panAngle, tiltAngle, underExposedLikelihood
           → Lưu emotion (1–5 scale) vào session.answers[i].behavioralData


KẾT THÚC PHỎNG VẤN  →  goToFeedback()
══════════════════════════════════════════════════════

  computeBehavioralSummary(perQuestionData):
    avgResponseLatencyMs, avgSilenceRatio, avgEyeContactScore
    avgHeadStabilityScore, totalHedgeWords, avgVocabularyDiversity
    avgAmplitudeVariance
    overallConfidenceScore (0–5):
      eyeContact×0.20 + headStability×0.15 + fluency×0.15
      + expression×0.15 + hedgeScore×0.15 + vocabulary×0.10 + latency×0.10
    dominantEmotion  (joy / sorrow / anger / surprise / neutral)

  POST /api/interviews/sessions/:id/complete
    { answers[], totalDurationSeconds, behavioralSummary }
    → MongoDB: status = "completed", lưu behavioralSummary
    → Navigate /interview/feedback
```

---

### Giai đoạn 3 — Đánh giá LLM (`POST /api/interviews/sessions/:id/evaluate`)

Được gọi tự động khi Feedback page load. Idempotent — kết quả cache trong DB sau lần đầu.

```
evaluateTranscripts({ questions, answers })
  │
  ├─ LLM System Prompt bao gồm:
  │    SHRM competency definitions  +  DDI Key Actions
  │    shrmRubricExcellent (tiêu chí xuất sắc từng competency)
  │    Yêu cầu output JSON cấu trúc chặt
  │
  └─ Output per question:
       scores:  { clarity, structure, relevance, credibility }  (0–5)
       overall: float 0–5
       shrmLevel: "excellent" | "proficient" | "developing"
       strengths[]:    điểm mạnh cụ thể
       improvements[]: điểm cần cải thiện
       suggestion:     câu trả lời mẫu tốt hơn từ LLM

Response trả về Frontend:
  evaluation.perQuestion[], overallScore, generalComment, inferredRole
  behavioralSummary        ← đọc từ MongoDB (lưu lúc complete)
  behavioralPerQuestion[]  ← emotion + metrics từng câu từ MongoDB
```

---

### Giai đoạn 4 — Trang kết quả Feedback (`/interview/feedback`)

```
┌──────────────────────────────────────────────────────────────────┐
│ A. Overall Score Banner                                          │
│    Điểm tổng (0–5 sao)  +  4 thanh STAR                        │
│    SHRM Distribution: Xuất sắc / Đạt yêu cầu / Cần cải thiện  │
│    Speaking metrics (WPM, filler words, độ dài TB)             │
├──────────────────────────────────────────────────────────────────┤
│ B. Nhận xét tổng quan từ AI  (generalComment)                   │
├──────────────────────────────────────────────────────────────────┤
│ C. Phân tích hành vi & Ngôn ngữ cơ thể  [khi có data]         │
│                                                                  │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │  Radar Chart 6 chiều│    │  6 Metric Cards                │  │
│  │  (Recharts)         │    │  Giao tiếp mắt  XX%   [Tốt]   │  │
│  │   Giao tiếp mắt     │    │  Tư thế đầu     XX%   [Tốt]   │  │
│  │ Phản xạ  Tư thế đầu │    │  Sự lưu loát    XX%   [Khá]   │  │
│  │  Vốn từ Tự tin giọng│    │  Tự tin giọng   Biểu cảm      │  │
│  │     Sự lưu loát     │    │  Phản xạ        X.Xs  [Tốt]   │  │
│  └─────────────────────┘    │  Từ dè dặt      X lần [Khá]   │  │
│                              │  Cảm xúc:   [Tự tin/Lo lắng] │  │
│                              └────────────────────────────────┘  │
│  Vocabulary Diversity: ████████░░  XX%  [Tốt]                  │
├──────────────────────────────────────────────────────────────────┤
│ D. Phân tích từng câu (accordion — mỗi câu mở ra gồm):        │
│    • Transcript giọng nói                                       │
│    • Behavioral mini-card: Phản xạ | Im lặng | Từ dè dặt      │
│                             Eye contact | Cảm xúc Vision AI    │
│    • SHRM scores (Clarity / Structure / Relevance / Credibility)│
│    • Điểm mạnh  +  Cần cải thiện  +  Gợi ý câu trả lời LLM   │
├──────────────────────────────────────────────────────────────────┤
│ E. Nút hành động + Gợi ý khóa học (dựa trên điểm yếu thực)    │
└──────────────────────────────────────────────────────────────────┘
```

---

### Behavioral Analysis — Chi tiết kỹ thuật

| Nguồn | Metrics | Tần suất | Xử lý |
|:------|:--------|:---------|:------|
| Web Audio API | avgAmplitude, amplitudeVariance, silenceRatio, silenceEvents | 100ms | In-browser |
| Web Speech API | responseLatencyMs, hedgeWordCount (12 patterns VN), vocabularyDiversity (TTR) | Mỗi câu | In-browser |
| MediaPipe FaceMesh | eyeContactScore, headStabilityScore, facePresenceRatio, distractionEvents | 500ms | In-browser WASM |
| Google Cloud Vision | joy/sorrow/anger/surprise (1–5), headPanAngle, lightingOk | 1x/câu hỏi | API call qua backend |

**Chi phí Google Vision:** ~$0.0075/session · Free tier: 1,000 ảnh/tháng ≈ 200 sessions.  
**Privacy:** Không lưu video. Chỉ lưu analytics metrics vào MongoDB.

---

## API

Base URL: `/api` · Auth: `Authorization: Bearer <jwt>`

| Nhóm | Endpoint |
|:-----|:---------|
| Auth | `/api/auth/*` |
| Mentors | `/api/mentors/*` |
| Bookings | `/api/bookings/*` |
| Courses | `/api/courses/*`, `/api/enrollments/*` |
| CV & JD | `/api/cv/*` |
| Interviews | `/api/interviews/*` |
| Payments | `/api/payments/*` |
| Admin | `/api/admin/*` |
| Health | `GET /api/health` |

Xem toàn bộ contract tại [API_INDEX.md](./API_INDEX.md).  
Docs CV/JD service (khi chạy local): `http://127.0.0.1:8000/docs`

---

## Tài liệu

| File | Nội dung |
|:-----|:---------|
| [API_INDEX.md](./API_INDEX.md) | Contract đầy đủ tất cả endpoints (đang chạy + roadmap) |
| [ROADMAP.md](./ROADMAP.md) | Lộ trình theo phase, trạng thái từng endpoint |
| [backend/DATABASE.md](./backend/DATABASE.md) | Schema MongoDB chi tiết, seed scripts |
| [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) | Hướng dẫn test API với Postman |

---

## Deployment

| Service | Platform | Ghi chú |
|:--------|:---------|:--------|
| Backend | Render | `render.yaml` có sẵn; region: Singapore |
| Frontend | Vercel | `vercel.json` có sẵn; cần set `VITE_API_URL` |
| CV Service | Heroku / Render | `Procfile` + `runtime.txt` có sẵn |

Sau khi deploy, đặt `CV_ANALYZER_URL` trong backend env trỏ về URL Python service.

---

## Tech Stack

| Layer | Công nghệ |
|:------|:----------|
| Frontend | React 18, Vite, React Router v7, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Express 5 (ESM), Node ≥ 20, Mongoose 9, JWT, bcrypt, Multer |
| Database | MongoDB |
| AI / CV | Python FastAPI, pdf parsing, NLP |
| Avatar AI | D-ID Streaming API |
| Auth | Google Identity Services (FedCM), JWT refresh sessions |
| Payments | Chuyển khoản ngân hàng (chính); MoMo / ZaloPay (sandbox) |

---

## Đóng góp

1. Fork repo và tạo branch từ `main`
2. Khi thêm API mới: cập nhật [API_INDEX.md](./API_INDEX.md) và [ROADMAP.md](./ROADMAP.md)
3. Dùng `apiUrl()` từ `frontend/src/app/utils/api.js`, không hardcode URL
4. Response shape chuẩn: `{ success: true, <key>: data }` / `{ success: false, error: "msg" }`
5. Tạo Pull Request vào `main` với mô tả rõ ràng

---

## Giấy phép

Dự án thuộc sở hữu nội bộ. Liên hệ nhóm phát triển để biết thêm thông tin.
