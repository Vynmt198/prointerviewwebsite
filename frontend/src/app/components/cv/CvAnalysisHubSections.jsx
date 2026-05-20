import React from "react";
import {
  FileText,
  Briefcase,
  Users,
  ChevronRight,
  History,
  Upload,
  Sparkles,
  BarChart3,
  Lightbulb,
  Target,
  CheckCircle2,
  Mic,
} from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    title: "So khớp từ khóa CV–JD",
    desc: "Liệt kê kỹ năng đã có, còn thiếu so với mô tả công việc — không đoán mò trước khi nộp hồ sơ.",
    accent: "violet",
  },
  {
    icon: BarChart3,
    title: "Chấm 4 tiêu chí chuẩn HR",
    desc: "Clarity, Structure (STAR), Relevance, Credibility — điểm rõ ràng kèm nhận xét từng mục.",
    accent: "violet",
  },
  {
    icon: Lightbulb,
    title: "Gợi ý chỉnh sửa cụ thể",
    desc: "Viết lại bullet theo STAR, bổ sung kỹ năng thiếu và lộ trình học ngắn gọn.",
    accent: "lime",
  },
  {
    icon: History,
    title: "Lưu lịch sử phân tích",
    desc: "Xem lại kết quả cũ, so sánh tiến độ sau mỗi lần chỉnh CV.",
    accent: "violet",
  },
  {
    icon: Mic,
    title: "Nối sang Phỏng vấn AI",
    desc: "Sau khi chỉnh CV, luyện phỏng vấn với câu hỏi sát vị trí bạn nhắm tới.",
    accent: "lime",
  },
  {
    icon: Users,
    title: "Đặt lịch Mentor",
    desc: "HR/Manager review CV thật — phù hợp khi cần góc nhìn người tuyển dụng.",
    accent: "violet",
  },
];

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "Tải CV (và JD nếu có)",
    desc: "Upload file PDF. Có JD thì so khớp trực tiếp; chưa có JD thì chọn ngành nghề.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "AI phân tích",
    desc: "Hệ thống đọc nội dung, trích kỹ năng, chấm điểm và tạo gợi ý trong vài phút.",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Nhận báo cáo chi tiết",
    desc: "Điểm khớp, từ khóa, điểm mạnh/yếu và checklist chỉnh sửa — sẵn sàng ứng tuyển.",
  },
];

function SectionLabel({ children }) {
  return (
    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6E35E8]">
      {children}
    </span>
  );
}

export function CvAnalysisHubHero({ onJd, onField, onHistory }) {
  return (
    <>
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#6E35E8]">
          <FileText className="h-3.5 w-3.5" />
          Phân tích CV
        </div>
        <h1 className="app-page-title mb-3">Bạn đã có Job Description chưa?</h1>
        <p className="app-page-subtitle mx-auto max-w-2xl">
          Chọn cách phân tích phù hợp. Có JD thì so khớp trực tiếp; chưa có JD thì đánh giá theo chuẩn ngành nghề — cùng
          bộ công cụ AI và gợi ý chỉnh sửa.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onJd}
          className="group rounded-[28px] border-2 border-violet-200 bg-white p-8 text-left shadow-[0_18px_40px_rgba(110,53,232,0.08)] transition-all hover:border-[#6E35E8] hover:shadow-[0_22px_48px_rgba(110,53,232,0.14)]"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6E35E8] shadow-lg shadow-[#6E35E8]/25 transition group-hover:scale-105">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-black tracking-tight text-slate-900">Phân tích với JD có sẵn</h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">
            Upload CV + file JD (PDF). So khớp từ khóa, chấm điểm và gợi ý chỉnh sửa theo đúng vị trí tuyển dụng.
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#6E35E8]">
            Bắt đầu
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={onField}
          className="group rounded-[28px] border-2 border-lime-200 bg-white p-8 text-left shadow-[0_18px_40px_rgba(180,245,0,0.12)] transition-all hover:border-[#B4F500] hover:shadow-[0_22px_48px_rgba(180,245,0,0.18)]"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B4F500] shadow-lg shadow-[#B4F500]/30 transition group-hover:scale-105">
            <Users className="h-7 w-7 text-[#4A7A00]" />
          </div>
          <h2 className="mb-2 text-xl font-black tracking-tight text-slate-900">Phân tích theo ngành nghề</h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">
            Chọn nhóm ngành (IT, Marketing, Tài chính…). Đánh giá CV khi bạn chưa có JD cụ thể.
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#4A7A00]">
            Bắt đầu
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#6E35E8]/40 hover:text-[#6E35E8]"
        >
          <History className="h-4 w-4" />
          Xem lịch sử phân tích
        </button>
      </div>
    </>
  );
}

export function CvAnalysisHubIntroSections({ onJd, onField }) {
  return (
    <div className="mt-16 space-y-20 border-t border-violet-100/80 pt-16">
      {/* Bạn nhận được gì */}
      <section>
        <div className="mb-8 text-center">
          <SectionLabel>Tính năng</SectionLabel>
          <h2 className="font-headline text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Một lần phân tích — đủ thông tin để chỉnh CV
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Không chỉ điểm số: bạn biết thiếu gì, sửa chỗ nào và ưu tiên việc nào trước khi nộp hồ sơ.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                  accent === "lime" ? "bg-lime-100 text-lime-900" : "bg-violet-100 text-[#6E35E8]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cách hoạt động */}
      <section className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-lime-50/50 px-6 py-10 sm:px-10">
        <div className="mb-8 text-center">
          <SectionLabel>Quy trình</SectionLabel>
          <h2 className="font-headline text-2xl font-black tracking-tight text-slate-900">3 bước đơn giản</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative text-center md:text-left">
              <span className="mb-3 inline-block font-headline text-4xl font-black text-violet-200">{step}</span>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6E35E8] text-white md:mx-0">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* So sánh 2 loại */}
      <section>
        <div className="mb-6 text-center">
          <SectionLabel>Chọn đúng luồng</SectionLabel>
          <h2 className="font-headline text-2xl font-black text-slate-900">JD có sẵn hay theo ngành?</h2>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#6E35E8]" />
                <h3 className="font-bold text-slate-900">Với JD có sẵn</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  So khớp % từ khóa trực tiếp với mô tả công việc
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  Gợi ý bổ sung đúng stack JD yêu cầu
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  Phù hợp khi đã có tin tuyển dụng cụ thể
                </li>
              </ul>
              <button
                type="button"
                onClick={onJd}
                className="mt-5 text-sm font-bold text-[#6E35E8] hover:underline"
              >
                Bắt đầu phân tích CV + JD →
              </button>
            </div>
            <div className="bg-slate-50/80 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#4A7A00]" />
                <h3 className="font-bold text-slate-900">Theo ngành nghề</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  Chuẩn đánh giá theo nhóm ngành (IT, MKT, Tài chính…)
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  Không cần file JD — chỉ cần CV
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />
                  Hữu ích khi đang tìm hướng hoặc chưa có tin cụ thể
                </li>
              </ul>
              <button
                type="button"
                onClick={onField}
                className="mt-5 text-sm font-bold text-[#4A7A00] hover:underline"
              >
                Bắt đầu theo ngành →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA cuối */}
      <section className="rounded-[28px] bg-gradient-to-r from-[#6E35E8] to-[#8B4DFF] px-6 py-10 text-center text-white sm:px-10">
        <h2 className="font-headline mb-2 text-xl font-black sm:text-2xl">Sẵn sàng chỉnh CV cho đúng việc?</h2>
        <p className="mx-auto mb-6 max-w-lg text-sm text-white/85">
          Bắt đầu miễn phí với gói cơ bản — lưu lịch sử và xem lại mỗi lần cập nhật hồ sơ.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onJd}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B4F500] px-6 py-3 text-sm font-bold text-[#1a1035] transition hover:brightness-95"
          >
            Phân tích với JD
          </button>
          <button
            type="button"
            onClick={onField}
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Phân tích theo ngành
          </button>
        </div>
      </section>
    </div>
  );
}
