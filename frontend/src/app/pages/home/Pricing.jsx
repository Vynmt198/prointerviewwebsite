import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  CheckCircle2, 
  Sparkles as Sparkle, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Brain,
  Video,
  FileText,
  Users
} from "lucide-react";
import { Footer } from "../../components/layout/Footer";
import { TopNavShell } from "../../components/layout/TopNavShell";
import { requireLoginNavigate } from "../../utils/authGate";
import { isLoggedIn } from "../../utils/auth";
import { BrandLogo } from "../../components/brand/BrandLogo";

const FAQ_DATA = [
  {
    q: "Gói Phổ thông (Pro) và Cao cấp (Elite) khác nhau như thế nào?",
    a: "Gói Chuyên nghiệp (Pro) cung cấp 10 buổi phỏng vấn AI mỗi tháng và các tính năng phân tích cơ bản. Gói Thượng hạng (Elite) cung cấp số buổi không giới hạn, phân tích hành vi nâng cao qua camera và ưu tiên kết nối với các mentor hàng đầu."
  },
  {
    q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
    a: "Có, bạn có thể hủy gia hạn gói bất cứ lúc nào trong phần Cài đặt tài khoản. Bạn vẫn sẽ giữ được quyền lợi của gói cho đến hết chu kỳ thanh toán hiện tại."
  },
  {
    q: "Mentor của ProInterview là ai?",
    a: "Đội ngũ Mentor của chúng tôi là các chuyên gia HR, Senior Engineer và Manager đang làm việc tại các tập đoàn hàng đầu như Shopee, Vingroup, FPT, và các công ty Big 4."
  },
  {
    q: "Làm sao để nhận được hoàn tiền?",
    a: "Chúng tôi cam kết hoàn tiền 100% trong vòng 7 ngày nếu bạn không hài lòng với chất lượng dịch vụ và chưa sử dụng quá 2 buổi phỏng vấn AI."
  }
];

export function Pricing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const loggedIn = isLoggedIn();

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="min-h-screen bg-[#f8f4ff] text-[#1d1a26] selection:bg-[#9447FF]/20 selection:text-[#1d1a26]">
      <style>{`
        .glass-card {
           background: rgba(255, 255, 255, 0.72);
           backdrop-filter: blur(18px);
           border-radius: 24px;
           border: 1px solid rgba(148, 71, 255, 0.16);
           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
           box-shadow: 0 18px 45px rgba(107, 70, 193, 0.1);
        }
        .glass-card:hover {
           border-color: rgba(148, 71, 255, 0.3);
           background: rgba(255, 255, 255, 0.86);
           transform: translateY(-8px);
        }
        .glow-purple {
          box-shadow: 0 0 40px rgba(148, 71, 255, 0.18);
        }
        .glow-lime {
          box-shadow: 0 0 45px rgba(212, 255, 0, 0.3);
        }
        .pricing-grid {
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          opacity: 1;
          background-image:
            linear-gradient(rgba(148,71,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,71,255,0.06) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .blob-card-1 { border-radius: 58% 42% 36% 64% / 54% 38% 62% 46%; }
        .blob-card-3 { border-radius: 34% 66% 44% 56% / 58% 50% 50% 42%; }
        .vessel-glow {
          box-shadow: 0 20px 46px rgba(148, 71, 255, 0.11);
          transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.45s;
        }
        .vessel-glow:hover {
          transform: translateY(-10px) rotate(0.6deg);
          box-shadow: 0 26px 54px rgba(148, 71, 255, 0.18), 0 0 44px rgba(212,255,0,0.22);
        }
      `}</style>

      {/* Atmospheric Background Glows */}
      <div className="pricing-grid" aria-hidden />
      <div className="fixed inset-0 pointer-events-none -z-[3]" style={{ background: "#f8f4ff" }} />
      <div className="fixed top-[-22%] left-[-12%] w-[760px] h-[760px] rounded-full pointer-events-none -z-0 bg-[#d4ff00]/48 blur-[135px]" />
      <div className="fixed bottom-[-22%] right-[-10%] w-[820px] h-[820px] rounded-full pointer-events-none -z-0 bg-[#9447ff]/34 blur-[150px]" />
      <div className="fixed left-0 right-0 top-[38%] h-[180px] pointer-events-none -z-0" style={{ background: "linear-gradient(90deg, rgba(212,255,0,0.14) 0%, rgba(148,71,255,0.22) 55%, rgba(148,71,255,0.1) 100%)", filter: "blur(32px)" }} />

      {/* ── Navbar ── */}
      <TopNavShell variant="light" scrolled={true}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <button
            className={`flex items-center ${loggedIn ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => {
              if (!loggedIn) navigate("/");
            }}
            aria-label={loggedIn ? "ProInterview" : "Về trang chủ"}
          >
            <BrandLogo />
          </button>

          {loggedIn && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#1d1a26]/70 hover:text-[#1d1a26] hover:bg-[#9447ff]/10 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Quay lại
            </button>
          )}
        </div>
      </TopNavShell>

      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-6 px-5 z-10 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.2]" style={{
          backgroundImage: "linear-gradient(rgba(148,71,255,0.14) 1px,transparent 1px),linear-gradient(90deg,rgba(148,71,255,0.14) 1px,transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <Sparkle className="text-[#9447FF] size-5" />
            <span className="text-[#6b5ca4] font-bold uppercase tracking-[0.2em] text-xs">Gói dịch vụ</span>
            </div>
            <h1 className="text-[2rem] md:text-[3.25rem] font-black tracking-tighter leading-[0.98] text-[#1d1a26] mb-3">
            Đầu tư cho sự nghiệp <span className="text-[#9447FF]">Xứng đáng.</span>
            </h1>
            <p className="text-[15px] text-[#4f4768] max-w-2xl lg:max-w-xl mx-auto lg:mx-0 leading-relaxed mb-0">
            Chọn gói dịch vụ phù hợp để mở khóa toàn bộ tính năng phân tích CV,
            phỏng vấn AI không giới hạn và kết nối trực tiếp với Mentor.
            </p>
          </div>
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <div className="relative w-52 h-52 bg-white/55 rounded-[1.5rem] border border-[#9447FF]/20 shadow-2xl p-4.5 rotate-6">
              <div className="w-full h-full rounded-2xl bg-[#9447FF]/10 border border-dashed border-[#9447FF]/25 flex items-center justify-center">
                <Sparkles className="size-12 text-[#9447FF]/60" />
              </div>
              <div className="absolute -top-8 -left-8 w-28 h-28 bg-[#d4ff00]/30 blur-2xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Grid ── */}
      <section className="px-5 pb-12 md:pb-16 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            
            {/* Free Tier */}
            <div className="glass-card vessel-glow blob-card-1 p-6.5 flex flex-col h-full border-white group md:mt-7">
              <div className="mb-7">
                <div className="w-11 h-11 rounded-2xl bg-[#9447ff]/10 flex items-center justify-center mb-5 group-hover:bg-[#9447ff]/15 transition-colors">
                  <Brain className="w-5 h-5 text-[#9447FF]" />
                </div>
                <h3 className="text-[1.15rem] font-black mb-2 text-[#1d1a26]">Cơ bản (Free)</h3>
                <p className="text-[#6b5ca4] text-xs font-bold uppercase tracking-widest mb-6">Trải nghiệm miễn phí</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[2.2rem] font-black text-[#1d1a26]">0đ</span>
                  <span className="text-[#7a7197] text-sm font-bold">/tháng</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {[
                  "2 buổi AI Interview trải nghiệm",
                  "3 lần phân tích CV/JD chi tiết",
                  "10 câu hỏi mẫu theo ngành nghề",
                  "Truy cập cộng đồng Career Hub"
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#4f4768]">
                    <CheckCircle2 className="w-4 h-4 text-[#9447FF] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => requireLoginNavigate(navigate, "/dashboard")}
                className="w-full py-3.5 rounded-2xl border border-[#9447FF]/25 text-[#9447FF] font-black text-xs uppercase tracking-widest hover:bg-[#9447FF]/8 transition-all active:scale-[0.98]"
              >
                Bắt đầu ngay
              </button>
            </div>

            {/* Pro Tier (Popular) */}
            <div className="glass-card vessel-glow p-6.5 md:p-7 flex flex-col h-full border-2 border-[#d4ff00]/80 bg-white/95 glow-lime relative scale-[1.01] z-20 overflow-hidden rounded-[2.2rem]">
              <div className="absolute top-0 right-0 py-2 px-8 bg-[#d4ff00] text-[#1d1a26] text-[10px] font-black uppercase tracking-widest translate-x-[30%] translate-y-[100%] rotate-45">
                Phổ biến nhất
              </div>
              
              <div className="mb-7">
                <div className="w-11 h-11 rounded-2xl bg-[#9447FF] flex items-center justify-center mb-5 shadow-lg shadow-[#9447FF]/25">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[1.15rem] font-black mb-2 text-[#9447FF]">Chuyên nghiệp (Pro)</h3>
                <p className="text-[#6b5ca4] text-xs font-bold uppercase tracking-widest mb-6">Dành cho ứng viên chủ động</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[2.2rem] font-black text-[#1d1a26]">79.000đ</span>
                  <span className="text-[#7a7197] text-sm font-bold">/tháng</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {[
                  "10 buổi AI Interview / tháng",
                  "Công nghệ nhận diện giọng nói AI",
                  "20 lượt phân tích CV/JD chuyên sâu",
                  "Phản hồi AI chi tiết từng câu trả lời",
                  "Lịch sử luyện tập 12 tháng"
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1d1a26] font-bold">
                    <CheckCircle2 className="w-5 h-5 text-[#9447FF] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  requireLoginNavigate(
                    navigate,
                    "/checkout?plan=starterPro&billing=monthly&planPrice=79000",
                  )
                }
                className="w-full py-4 rounded-2xl bg-[#d4ff00] text-[#1d1a26] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#d4ff00]/30 hover:brightness-95 transition-all active:scale-[0.98]"
              >
                Nâng cấp Pro
              </button>
            </div>

            {/* Elite Tier */}
            <div className="glass-card vessel-glow blob-card-3 p-6.5 flex flex-col h-full border-[#9447FF]/20 shadow-xl shadow-[#9447FF]/10 group md:mt-3">
              <div className="mb-7">
                <div className="w-11 h-11 rounded-2xl bg-[#d4ff00]/30 flex items-center justify-center mb-5 border border-[#d4ff00]/45">
                  <ShieldCheck className="w-5 h-5 text-[#566600]" />
                </div>
                <h3 className="text-[1.15rem] font-black mb-2 text-[#9447FF]">Thượng hạng (Elite)</h3>
                <p className="text-[#6b5ca4] text-xs font-bold uppercase tracking-widest mb-6">Chinh phục tập đoàn lớn</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[2.2rem] font-black text-[#1d1a26]">99.000đ</span>
                  <span className="text-[#7a7197] text-sm font-bold">/tháng</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {[
                  "AI Interview KHÔNG GIỚI HẠN",
                  "Phân tích hành vi & tư thế qua Camera",
                  "Nhận diện giọng nói Turbo (độ trễ thấp)",
                  "Mentor ưu tiên hỗ trợ 24/7",
                  "Tải báo cáo bản PDF chuyên nghiệp"
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-[#1d1a26] font-bold">
                    <CheckCircle2 className="w-5 h-5 text-[#9447FF] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  requireLoginNavigate(
                    navigate,
                    "/checkout?plan=elitePro&billing=monthly&planPrice=99000",
                  )
                }
                className="w-full py-3.5 rounded-2xl border border-[#9447FF]/35 text-[#9447FF] font-black text-xs uppercase tracking-widest hover:bg-[#9447FF]/8 transition-all active:scale-[0.98]"
              >
                Nâng cấp Elite
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="px-5 py-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4 text-[#1d1a26]">Câu hỏi thường gặp</h2>
            <p className="text-[#5a5174]">Mọi thứ bạn cần biết về gói và quyền lợi của mình.</p>
          </div>

          <div className="space-y-4">
            {FAQ_DATA.map((item, i) => (
              <div 
                key={i} 
                className={`glass-card p-6 cursor-pointer transition-all ${openFaq === i ? "bg-white/90 border-[#9447FF]/25" : ""}`}
                onClick={() => toggleFaq(i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-lg text-[#1d1a26]">{item.q}</h4>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-[#9447FF]" /> : <ChevronDown className="w-5 h-5 text-[#6b5ca4]" />}
                </div>
                {openFaq === i && (
                  <div className="mt-4 pt-4 border-t border-[#9447FF]/15 text-[#5a5174] leading-relaxed text-sm animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer variant="dark" />
    </div>
  );
}
