import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Eye,
  EyeOff as EyeSlash,
  Check,
  AlertCircle as WarningCircle,
  Info,
  Brain,
  Mic as Microphone,
  Star,
  Sparkles,
} from "lucide-react";
import {
  loginUser,
  getUser,
  getPostLoginPath,
  getBrandClickPath,
} from "../../utils/auth";
import { GoogleSignInBlock } from "../../components/auth/GoogleSignInBlock";
import { BrandLogo } from "../../components/brand/BrandLogo";

const INPUT_CLS =
  "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base outline-none transition-all " +
  "focus:border-[#6E35E8] focus:ring-2 focus:ring-[#6E35E8]/15 text-gray-900 placeholder-gray-400 " +
  "bg-white hover:bg-gray-50/50";

const TESTIMONIALS = [
  {
    avatar: "PA",
    gradFrom: "#6E35E8",
    gradTo: "#9B6DFF",
    quote: "Sau 3 buổi mock interview với AI, mình tự tin hơn hẳn và nhận được offer từ Shopee chỉ sau 2 tuần luyện tập.",
    name: "Phạm Anh Tuấn",
    role: "Software Engineer @ Shopee",
    tag: "Đã nhận offer ✨",
    tagColor: "#6E35E8",
  },
  {
    avatar: "NH",
    gradFrom: "#ec4899",
    gradTo: "#f43f5e",
    quote: "Điểm STAR của mình tăng từ 2.4 lên 4.1 sau 3 tuần. Phân tích CV/JD cực kỳ chi tiết và hữu ích.",
    name: "Nguyễn Thị Hoa",
    role: "Marketing @ Unilever",
    tag: "Tăng STAR +70% 📈",
    tagColor: "#FF8C42",
  },
];
const AUTH_STICKS = [
  { x: 5, y: 9, size: 18, color: "#5B21B6", glow: "rgba(91,33,182,0.34)", opacity: 0.62 },
  { x: 72, y: 8, size: 16, color: "#9EDB00", glow: "rgba(158,219,0,0.42)", opacity: 0.56 },
  { x: 6, y: 88, size: 20, color: "#5B21B6", glow: "rgba(91,33,182,0.36)", opacity: 0.58 },
  { x: 58, y: 10, size: 30, color: "#9EDB00", glow: "rgba(158,219,0,0.52)", opacity: 0.66 },
  { x: 52, y: 34, size: 18, color: "#5B21B6", glow: "rgba(91,33,182,0.32)", opacity: 0.52 },
  { x: 96, y: 8, size: 44, color: "#9EDB00", glow: "rgba(158,219,0,0.56)", opacity: 0.7 },
  { x: 96, y: 90, size: 22, color: "#5B21B6", glow: "rgba(91,33,182,0.36)", opacity: 0.58 },
];

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegistered = searchParams.get("registered") === "1";
  const t = TESTIMONIALS[0];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginUser(email.trim(), typeof password === "string" ? password.trim() : password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    const user = getUser();
    navigate(getPostLoginPath(user, searchParams.get("redirect")));
  };

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError("");
  };

  const errorIsGoogleEnvHint = Boolean(
    error && /VITE_GOOGLE|Google chưa được bật|thiếu.*CLIENT_ID/i.test(error),
  );

  return (
    <div
      className="h-screen overflow-hidden flex relative"
      style={{ fontFamily: "'Lexend', 'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── LEFT: Form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full bg-[#fcfaff]">
        <div className="pointer-events-none absolute inset-0 z-20">
          {AUTH_STICKS.map((s, i) => (
            <Sparkles
              key={`login-stick-${i}`}
              className="absolute hidden md:block"
              strokeWidth={1.45}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit={12}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                color: s.color,
                opacity: s.opacity,
                filter: `drop-shadow(0 0 8px ${s.glow})`,
              }}
            />
          ))}
        </div>

        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-10 h-20 border-b relative"
          style={{ borderColor: "rgba(110,53,232,0.1)" }}
        >
          <button onClick={() => navigate(getBrandClickPath())} className="flex items-center gap-2.5 group">
            <BrandLogo />
          </button>
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: "#6E35E8" }}>
              Đăng ký
            </Link>
          </p>
        </div>

        {/* Form — centered */}
        <div className="flex-1 flex items-center justify-center px-10 overflow-hidden">
          <div className="w-full max-w-sm">

            <h1 className="text-gray-900 mb-1"
              style={{ fontSize: "1.875rem", fontWeight: 750, letterSpacing: "-0.025em" }}>
              Đăng nhập
            </h1>
            <p className="text-gray-500 text-sm mb-4">Chào mừng trở lại! Hãy tiếp tục luyện tập.</p>

            {/* Success banner */}
            {isRegistered && (
              <div className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 border"
                style={{ background: "rgba(110,53,232,0.06)", borderColor: "rgba(110,53,232,0.2)" }}>
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#6E35E8" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#6E35E8" }}>Đăng ký thành công! 🎉</p>
                  <p className="text-xs text-gray-500 mt-0.5">Vui lòng đăng nhập để tiếp tục sử dụng ProInterview.</p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${errorIsGoogleEnvHint
                  ? "border-amber-400/25 bg-amber-50 text-amber-800"
                  : "border-red-300/40 bg-red-50 text-red-700"
                }`}>
                {errorIsGoogleEnvHint
                  ? <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />
                  : <WarningCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />}
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  id="login-email" type="email" autoComplete="email"
                  placeholder="email@example.com"
                  value={email} onChange={handleFieldChange(setEmail)}
                  required className={INPUT_CLS}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: "#6E35E8" }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password" type={showPass ? "text" : "password"}
                    autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={handleFieldChange(setPassword)}
                    required className={`${INPUT_CLS} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    {showPass ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-base text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #6E35E8, #9B6DFF)",
                  boxShadow: "0 4px 20px rgba(110,53,232,0.3)",
                }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </span>
                  : "Đăng nhập"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <GoogleSignInBlock onError={setError} />

            <p className="mt-5 text-center text-xs text-gray-400 leading-relaxed">
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <a href="#" className="font-semibold text-[#6E35E8] hover:underline">Điều khoản dịch vụ</a>
              {" "}và{" "}
              <a href="#" className="font-semibold text-[#6E35E8] hover:underline">Chính sách bảo mật</a>.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Visual panel ─────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col flex-1 h-full relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #F3EEFF 0%, #EEF4FF 40%, #FFF5EC 100%)" }}
      >
        {/* Blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #6E35E8 0%, transparent 70%)" }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #FFB800 0%, transparent 70%)" }} />

        {/* Rating badge */}
        <div className="absolute top-8 right-8">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-lg"
            style={{ border: "1px solid rgba(110,53,232,0.1)" }}>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "#f59e0b" }} />)}
            </div>
            <span className="text-gray-700 font-black text-sm">4.8</span>
            <span className="text-gray-400 text-xs">/ 5.0</span>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 relative z-10">

          {/* Testimonial card */}
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl mb-4"
            style={{ border: "1px solid rgba(110,53,232,0.08)" }}>
            <div className="text-4xl leading-none mb-3" style={{ color: "#9B6DFF", fontFamily: "Georgia, serif" }}>"</div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium mb-5">{t.quote}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                style={{ background: `linear-gradient(135deg, ${t.gradFrom}, ${t.gradTo})` }}>
                {t.avatar}
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>

          {/* Tag bubble */}
          <div className="self-end mr-4 mb-8">
            <div className="rounded-2xl px-4 py-2 text-white text-sm font-bold shadow-lg"
              style={{ background: `linear-gradient(135deg, ${t.tagColor}, ${t.tagColor}cc)` }}>
              {t.tag}
            </div>
          </div>

          {/* Stats */}
          <p className="text-gray-700 mb-5 font-bold text-center" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
            Tham gia cùng <span style={{ color: "#6E35E8" }}>10,000+</span> ứng viên<br />
            đã thành công với ProInterview
          </p>
          <div className="flex gap-8">
            {[
              { Icon: Brain, value: "24/7", label: "Phỏng vấn AI thử" },
              { Icon: Microphone, value: "500+", label: "Mentor thực tế" },
              { Icon: Check, value: "85%", label: "Tỷ lệ nhận việc" },
            ].map(({ Icon, value, label }) => (
              <div key={value} className="text-center">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: "rgba(110,53,232,0.08)", border: "1px solid rgba(110,53,232,0.12)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#6E35E8" }} />
                </div>
                <p className="text-sm font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex-shrink-0 px-10 pb-6 relative z-10 text-center" />
      </div>
    </div>
  );
}
