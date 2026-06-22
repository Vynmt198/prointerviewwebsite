import React from "react";
import { useNavigate } from "react-router";
import { CheckCircle, ArrowRight } from "lucide-react";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { CUSTOMER_SHELL_GUTTER, CUSTOMER_SHELL_MAX } from "../../components/layout/customerShellLayout";

const CTA_LIME =
  "bg-gradient-to-r from-[#93f72b] to-[#93f72b] text-violet-950 shadow-[0_8px_28px_rgba(196,255,71,0.25)] hover:brightness-110";

const IS = { strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

export function InterviewTrialDone() {
  const navigate = useNavigate();

  return (
    <MentorPageShell bottomPad="pb-24">
      <div className={`relative flex min-h-[70vh] flex-col items-center justify-center bg-transparent pb-8 pt-8 sm:pt-10 ${CUSTOMER_SHELL_GUTTER}`}>
        <div className={`${CUSTOMER_SHELL_MAX} mx-auto flex w-full max-w-xl flex-col items-center text-center`}>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <CheckCircle className="h-8 w-8 text-[#630ed4]" {...IS} />
          </div>

          <h1 className="font-headline text-[clamp(1.5rem,3vw,2rem)] font-extrabold leading-[1.15] text-[#1a1b23]">
            Cảm ơn bạn đã hoàn thành 3 câu hỏi!
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
            Đăng ký miễn phí để lưu lại kết quả buổi phỏng vấn này và mở khoá thêm{" "}
            <span className="font-semibold text-violet-900">2 câu hỏi cá nhân hoá</span>{" "}
            được tạo riêng dựa trên CV và câu trả lời của bạn.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-sm">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className={`flex w-full items-center justify-center gap-2 rounded-md py-3.5 text-sm font-bold transition-all ${CTA_LIME}`}
            >
              Đăng ký miễn phí để tiếp tục
              <ArrowRight className="h-4 w-4" {...IS} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-violet-200 bg-white py-3.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-50"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </MentorPageShell>
  );
}
