import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Eye,
  EyeOff as EyeSlash,
  Check,
  AlertCircle as WarningCircle,
  Info,
  Brain,
  Star,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { registerUser, getBrandClickPath } from "../../utils/auth";
import { GoogleSignInBlock } from "../../components/auth/GoogleSignInBlock";
import { BrandLogo } from "../../components/brand/BrandLogo";

const PERKS = [
  "3 buổi phỏng vấn AI miễn phí ngay sau đăng ký",
  "Phân tích CV/JD không giới hạn",
  "Truy cập 500+ câu hỏi phỏng vấn theo ngành",
  "Bảng điều khiển theo dõi tiến bộ cá nhân",
];

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
}
const STRENGTH_COLORS = ["#FF8C42", "#FFB800", "#22c55e"];
const STRENGTH_LABELS = ["Yếu", "Trung bình", "Mạnh"];

const INPUT_CLS =
  "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base outline-none transition-all " +
  "focus:border-[#6E35E8] focus:ring-2 focus:ring-[#6E35E8]/15 text-gray-900 placeholder-gray-400 " +
  "bg-white hover:bg-gray-50/50";
const AUTH_STICKS = [
  { x: 5, y: 9, size: 18, color: "#5B21B6", glow: "rgba(91,33,182,0.34)", opacity: 0.62 },
  { x: 72, y: 8, size: 16, color: "#9EDB00", glow: "rgba(158,219,0,0.42)", opacity: 0.56 },
  { x: 6, y: 88, size: 20, color: "#5B21B6", glow: "rgba(91,33,182,0.36)", opacity: 0.58 },
  { x: 58, y: 10, size: 30, color: "#9EDB00", glow: "rgba(158,219,0,0.52)", opacity: 0.66 },
  { x: 52, y: 34, size: 18, color: "#5B21B6", glow: "rgba(91,33,182,0.32)", opacity: 0.52 },
  { x: 96, y: 8, size: 44, color: "#9EDB00", glow: "rgba(158,219,0,0.56)", opacity: 0.7 },
  { x: 96, y: 90, size: 22, color: "#5B21B6", glow: "rgba(91,33,182,0.36)", opacity: 0.58 },
];

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: "customer", adminInviteCode: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = pwStrength(form.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError("");
    if (form.role === "admin" && !form.adminInviteCode.trim()) {
      setError("Vui lòng nhập mã mời quản trị.");
      setLoading(false);
      return;
    }
    const result = await registerUser({
      name: form.name.trim(), email: form.email.trim(), password: form.password,
      role: form.role,
      ...(form.role === "admin" ? { adminInviteCode: form.adminInviteCode.trim() } : {}),
    });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    navigate(searchParams.get("redirect") || "/login?registered=1");
  };

  const handleChange = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
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
      {/* ── LEFT ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full bg-[#fcfaff]">
        <div className="pointer-events-none absolute inset-0 z-20">
          {AUTH_STICKS.map((s, i) => (
            <Sparkles
              key={`register-stick-${i}`}
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
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "#6E35E8" }}>
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Form — centered within panel */}
        <div className="flex-1 flex items-center justify-center px-10 overflow-y-auto py-4">
          <div className="w-full max-w-sm">

            <h1 className="text-gray-900 mb-1"
              style={{ fontSize: "1.875rem", fontWeight: 750, letterSpacing: "-0.025em" }}>
              Tạo tài khoản
            </h1>
            <p className="text-gray-500 text-sm mb-2">
              Miễn phí · Không cần thẻ tín dụng · 3 buổi AI ngay lập tức
            </p>

            {/* Error */}
            {error && (
              <div className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${errorIsGoogleEnvHint
                  ? "border-amber-400/25 bg-amber-50 text-amber-800"
                  : "border-red-300/40 bg-red-50 text-red-700"
                }`}>
                {errorIsGoogleEnvHint
                  ? <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />
                  : <WarningCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />}
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-2">
              {/* Name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                <input id="reg-name" type="text" placeholder="Nguyễn Văn A"
                  value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                  required className={INPUT_CLS} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input id="reg-email" type="email" placeholder="email@example.com"
                  value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                  required className={INPUT_CLS} />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input id="reg-password" type={showPass ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                    required minLength={6} className={`${INPUT_CLS} pr-12`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPass ? "Ẩn" : "Hiện"}>
                    {showPass ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-2 flex gap-1.5 items-center">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: strength >= lvl ? STRENGTH_COLORS[strength - 1] : "#E5E7EB" }} />
                    ))}
                    <span className="text-xs font-semibold ml-1" style={{ color: STRENGTH_COLORS[strength - 1] }}>
                      {STRENGTH_LABELS[strength - 1]}
                    </span>
                  </div>
                )}
              </div>


              {form.role === "admin" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã mời quản trị</label>
                  <input type="password" autoComplete="off" placeholder="ADMIN_INVITE_CODE"
                    value={form.adminInviteCode} onChange={(e) => handleChange("adminInviteCode", e.target.value)}
                    className={INPUT_CLS} />
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <button type="button" onClick={() => setAgreed(!agreed)}
                  className="flex items-center justify-center flex-shrink-0 rounded-md border-2 transition-all mt-0.5"
                  style={{
                    width: "18px", height: "18px",
                    background: agreed ? "linear-gradient(135deg,#6E35E8,#8B4DFF)" : "transparent",
                    borderColor: agreed ? "rgba(110,53,232,0.6)" : "#D1D5DB",
                  }}>
                  {agreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
                <span className="text-sm text-gray-500 leading-relaxed">
                  Tôi đồng ý với{" "}
                  <a href="#" className="font-semibold text-[#6E35E8] hover:underline">Điều khoản</a>{" "}và{" "}
                  <a href="#" className="font-semibold text-[#6E35E8] hover:underline">Chính sách bảo mật</a>.
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading || !agreed}
                className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6E35E8, #9B6DFF)",
                  boxShadow: agreed ? "0 4px 20px rgba(110,53,232,0.3)" : "none",
                }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </span>
                  : "Tạo tài khoản miễn phí"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <GoogleSignInBlock onError={setError} />

            {/* Privacy */}
            <div className="mt-3 rounded-xl p-3 flex gap-3"
              style={{ background: "rgba(110,53,232,0.04)", border: "1px solid rgba(110,53,232,0.1)" }}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#6E35E8] mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-bold text-gray-700 mb-1.5">Cam kết bảo vệ dữ liệu</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {["Mã hóa dữ liệu an toàn", "Không chia sẻ bên thứ ba", "Xóa tài khoản bất cứ lúc", "Tuân thủ GDPR"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Check className="w-3 h-3 flex-shrink-0 text-[#6E35E8]" strokeWidth={3} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── RIGHT ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col flex-1 h-full relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #F3EEFF 0%, #EEF4FF 40%, #FFFBF0 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #6E35E8 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #B4F500 0%, transparent 70%)" }} />

        {/* Badge */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-lg"
            style={{ border: "1px solid rgba(180,245,0,0.35)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#B4F500" }}>
              <Check className="w-3 h-3 text-gray-900" strokeWidth={3} />
            </div>
            <span className="text-gray-700 text-sm font-semibold">Miễn phí hoàn toàn</span>
          </div>
        </div>

        {/* Main card + social proof */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 relative z-10">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl mb-6"
            style={{ border: "1px solid rgba(110,53,232,0.08)" }}>
            <div className="flex items-center gap-3 mb-5 pb-5"
              style={{ borderBottom: "1px solid rgba(110,53,232,0.08)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6E35E8, #9B6DFF)" }}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 font-bold">ProInterview Free</p>
                <p className="text-xs font-semibold" style={{ color: "#B4F500" }}>✦ Bắt đầu ngay hôm nay</p>
              </div>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Bạn nhận được:</p>
            <ul className="space-y-3 mb-5">
              {PERKS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(110,53,232,0.1)" }}>
                    <Check className="w-3 h-3 text-[#6E35E8]" strokeWidth={3} />
                  </div>
                  <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <button type="button"
              onClick={() => document.getElementById("reg-name")?.focus()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6E35E8, #9B6DFF)",
                boxShadow: "0 4px 16px rgba(110,53,232,0.3)",
              }}>
              Bắt đầu miễn phí →
            </button>
          </div>

          {/* Social proof */}
          <div className="text-center">
            <p className="text-gray-700 mb-3 font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
              <span style={{ color: "#6E35E8" }}>10,000+</span> ứng viên đã tin dùng
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {[["#6E35E8", "N"], ["#ec4899", "T"], ["#3b82f6", "A"], ["#f97316", "M"]].map(([bg, l], i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: bg }}>{l}</div>
                ))}
              </div>
              <div className="flex gap-0.5 ml-1">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "#FFB800" }} />)}
              </div>
              <span className="text-gray-600 text-sm font-semibold">4.8</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-10 pb-6 relative z-10 text-center" />
      </div>
    </div>
  );
}
