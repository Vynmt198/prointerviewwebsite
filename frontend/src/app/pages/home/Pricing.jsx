import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { requireLoginNavigate } from "../../utils/authGate";
import { getUser, isLoggedIn } from "../../utils/auth";
import { fetchCurrentPlan } from "../../utils/plansApi";

const FAQ_DATA = [
  {
    q: "Gói Pro và Elite khác nhau như thế nào?",
    a: "Gói Pro gồm 10 buổi phỏng vấn AI mỗi tháng và 20 lượt phân tích CV/JD. Gói Elite mở không giới hạn phỏng vấn AI, quota phân tích cao hơn và ưu tiên hỗ trợ.",
  },
  {
    q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
    a: "Có. Vào Cài đặt để hủy gia hạn. Bạn vẫn dùng được quyền lợi gói đến hết chu kỳ đã thanh toán.",
  },
  {
    q: "Thanh toán qua kênh nào?",
    a: "Hiện hỗ trợ chuyển khoản ngân hàng. Sau khi chuyển khoản, admin xác nhận và gói được kích hoạt trên tài khoản.",
  },
  {
    q: "Chính sách hoàn tiền?",
    a: "Hoàn 100% trong 7 ngày nếu chưa hài lòng và chưa dùng quá 2 buổi phỏng vấn AI.",
  },
];

const PLANS = [
  {
    id: "free",
    title: "Free",
    subtitle: "Trải nghiệm miễn phí",
    price: "0đ",
    features: [
      "3/5 câu hỏi phỏng vấn cùng AI",
      "1 lần phân tích CV/JD",
      "Bộ câu hỏi phỏng vấn theo ngành nghề",
    ],
    cta: "Bắt đầu ngay",
    checkout: "/dashboard",
    variant: "outline",
    popular: false,
  },
  {
    id: "starter_pro",
    title: "Pro",
    subtitle: "Dành cho ứng viên chủ động",
    price: "79.000đ",
    features: [
      "10 buổi AI Interview/tháng",
      "Nhận diện giọng nói AI",
      "20 lần phân tích CV/JD",
      "Phản hồi chi tiết từng câu",
    ],
    cta: "Nâng cấp Pro",
    checkout: "/checkout?plan=starterPro&billing=monthly&planPrice=79000",
    variant: "lime",
    popular: false,
  },
  {
    id: "elite_pro",
    title: "Elite",
    subtitle: "Chinh phục tập đoàn lớn",
    price: "99.000đ",
    features: [
      "AI Interview KHÔNG GIỚI HẠN",
      "Phân tích hành vi & tư thế",
      "Nhận diện giọng nói Turbo",
      "Hỗ trợ ưu tiên 24/7",
    ],
    cta: "Nâng cấp Elite",
    checkout: "/checkout?plan=elitePro&billing=monthly&planPrice=99000",
    variant: "elite",
    popular: true,
  },
];

function normalizePlanKey(plan) {
  const k = String(plan ?? "").trim();
  if (k === "starterPro" || k === "starter_pro") return "starter_pro";
  if (k === "elitePro" || k === "elite_pro") return "elite_pro";
  return "free";
}

export function Pricing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(() =>
    normalizePlanKey(getUser()?.plan),
  );

  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;
    fetchCurrentPlan().then((res) => {
      if (!cancelled && res.success) {
        setCurrentPlan(normalizePlanKey(res.plan));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const handleCta = (plan) => {
    if (plan.id === "free") {
      requireLoginNavigate(navigate, "/dashboard");
      return;
    }
    if (currentPlan === plan.id) return;
    requireLoginNavigate(navigate, plan.checkout);
  };

  return (
    <MentorPageShell className="pricing-page" bottomPad="pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="text-center mb-8 sm:mb-10">
          <div className="flex justify-center mb-3">
            <span className="h-1 w-10 rounded-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tighter text-slate-900 mb-2">
            Sẵn sàng hơn cho{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5F00F0] to-[#9B6DFF]">
              mọi buổi phỏng vấn
            </span>
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Chọn gói phù hợp để luyện tập, cải thiện và sẵn sàng chinh phục nhà tuyển dụng.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch mb-12 sm:mb-14">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`glass-card p-5 !rounded-[20px] flex flex-col h-full group relative ${
                  isPopular ? "border-2 border-primary-fixed z-10 !overflow-visible" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-fixed text-on-primary-fixed px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase z-[2]">
                    PHỔ BIẾN NHẤT
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-3 right-3 z-[2] rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
                    Gói hiện tại
                  </div>
                )}

                <div className={`relative z-[1] flex flex-col flex-1 ${isPopular ? "pt-1" : ""}`}>
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      {plan.subtitle}
                    </p>
                    <h3
                      className={`font-headline font-bold text-lg mb-1 ${
                        plan.variant === "elite" ? "text-secondary-fixed" : "text-slate-900"
                      }`}
                    >
                      {plan.title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-headline text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-zinc-500 text-xs">/tháng</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4 flex-grow">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        {plan.variant === "elite" ? (
                          <ShieldCheck className="size-4 shrink-0 text-secondary-fixed" />
                        ) : (
                          <CheckCircle2
                            className={`size-4 shrink-0 ${
                              plan.variant === "lime" ? "text-primary-fixed" : "text-secondary"
                            }`}
                          />
                        )}
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleCta(plan)}
                    className={`w-full py-3 rounded-full font-bold text-sm transition-all mt-auto ${
                      isCurrent
                        ? "border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : plan.variant === "outline"
                          ? "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                          : "font-black hover:brightness-105"
                    }`}
                    style={
                      isCurrent || plan.variant === "outline"
                        ? undefined
                        : {
                            background: "linear-gradient(135deg, #B4F500, #93D600)",
                            color: "#0f172a",
                            boxShadow: "0 8px 20px rgba(15,23,42,0.1)",
                          }
                    }
                  >
                    {isCurrent ? "Đang dùng" : plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black font-headline text-slate-900 mb-2">
              Câu hỏi thường gặp
            </h2>
            <p className="text-slate-600 text-sm">Mọi thứ bạn cần biết về gói và quyền lợi.</p>
          </div>

          <div className="space-y-3">
            {FAQ_DATA.map((item, i) => (
              <button
                key={i}
                type="button"
                className={`glass-card w-full text-left p-5 transition-all ${
                  openFaq === i ? "border-violet-300/50" : ""
                }`}
                onClick={() => toggleFaq(i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">{item.q}</h4>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-primary-fixed shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>
                {openFaq === i && (
                  <p className="mt-3 pt-3 border-t border-violet-100 text-slate-600 text-sm leading-relaxed">
                    {item.a}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>
    </MentorPageShell>
  );
}
