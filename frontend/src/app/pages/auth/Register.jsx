import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Eye,
  EyeOff as EyeSlash,
  Check,
  AlertCircle as WarningCircle,
  Info,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { registerUser, getBrandClickPath } from "../../utils/auth";
import { toastApiError } from "../../utils/apiToast";
import { GoogleSignInBlock } from "../../components/auth/GoogleSignInBlock";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { SparkleGlyph } from "../../components/decor/SparkleGlyph.jsx";
import { AUTH_COPY } from "../../constants/brandVoice";
import { AuthPurpleBackdrop } from "../../components/auth/AuthPurpleBackdrop";

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

/** Form đăng ký: ô hơi thấp hơn Login để vừa một màn hình */
const INPUT_REG_CLS =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-base outline-none transition-all " +
  "focus:border-[#8037f4] focus:ring-2 focus:ring-[#8037f4]/15 text-gray-900 placeholder-gray-400 " +
  "bg-white hover:bg-gray-50/50";
/** % = tâm sticker; kích thước lệch — nằm trong vùng inset của lớp nền */
const AUTH_STICKS = [
  { x: 14, y: 22, size: 26 },
  { x: 82, y: 20, size: 36 },
  { x: 18, y: 72, size: 22 },
  { x: 80, y: 74, size: 30 },
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
      const msg = "Vui lòng nhập mã mời quản trị.";
      setError(msg);
      toastApiError(msg);
      setLoading(false);
      return;
    }
    const result = await registerUser({
      name: form.name.trim(), email: form.email.trim(), password: form.password,
      role: form.role,
      ...(form.role === "admin" ? { adminInviteCode: form.adminInviteCode.trim() } : {}),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      toastApiError(result.error, "Đăng ký thất bại.");
      return;
    }
    setRegisteredEmail(form.email.trim());
  };

  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const errorIsGoogleEnvHint = Boolean(
    error && /VITE_GOOGLE|Google chưa được bật|thiếu.*CLIENT_ID/i.test(error),
  );

  if (registeredEmail) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[#dcd2eb] px-6 text-center">
        <AuthPurpleBackdrop />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-violet-100/80 bg-white p-8 shadow-[0_12px_40px_rgba(128,55,244,0.08)]">
          <div className="h-20 w-20 bg-[#8037f4]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Mail className="h-10 w-10 text-[#8037f4]" />
          </div>
          <h1 className="text-3xl font-black mb-4 tracking-tight">Kiểm tra email của bạn</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {AUTH_COPY.verifyEmailLead}{" "}
            <strong className="text-gray-900">{registeredEmail}</strong>
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-black text-white transition-all active:scale-[0.98]"
              style={{ background: "#8037f4" }}
            >
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-[#dcd2eb]"
      style={{ fontFamily: "'Lexend', 'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <AuthPurpleBackdrop />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-4 z-0 hidden md:block md:inset-6" aria-hidden>
          {AUTH_STICKS.map((s, idx) => (
            <SparkleGlyph
              key={`register-stick-${idx}`}
              className="absolute"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: 1,
                filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.12)) drop-shadow(0 0 8px rgba(95,0,240,0.35))",
                transform: `translate(-50%, -50%) rotate(${
                  typeof s.tilt === "number" ? s.tilt : idx % 4 === 0 ? 0 : idx % 4 === 1 ? -18 : idx % 4 === 2 ? 24 : -30
                }deg)`,
              }}
            />
          ))}
        </div>

        {/* Top bar */}
        <div
          className="relative z-10 flex h-20 flex-shrink-0 items-center justify-between border-b px-10 backdrop-blur-md"
          style={{
            borderColor: "rgba(128,55,244,0.12)",
            background: "rgba(255,255,255,0.75)",
          }}
        >
          <button onClick={() => navigate(getBrandClickPath())} className="flex items-center gap-2.5 group">
            <BrandLogo size="auth" />
          </button>
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: "#8037f4" }}>
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Form — giữa màn hình (desktop + mobile) */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
          <div className="w-full max-w-md shrink-0 rounded-3xl border border-violet-100/80 bg-white p-7 shadow-[0_12px_40px_rgba(128,55,244,0.08)] sm:p-9">

            <h1 className="text-gray-900 mb-0.5"
              style={{ fontSize: "1.625rem", fontWeight: 750, letterSpacing: "-0.025em" }}>
              Tạo tài khoản
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mb-2">
              {AUTH_COPY.registerSubtitle}
            </p>

            {/* Error */}
            {error && (
              <div className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${errorIsGoogleEnvHint
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
                <label htmlFor="reg-name" className="mb-1 block text-xs font-semibold text-gray-700 sm:text-sm">Họ và tên</label>
                <input id="reg-name" type="text" placeholder="Nguyễn Văn A"
                  value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                  required className={INPUT_REG_CLS} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="mb-1 block text-xs font-semibold text-gray-700 sm:text-sm">Email</label>
                <input id="reg-email" type="email" placeholder="email@example.com"
                  value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                  required className={INPUT_REG_CLS} />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="mb-1 block text-xs font-semibold text-gray-700 sm:text-sm">Mật khẩu</label>
                <div className="relative">
                  <input id="reg-password" type={showPass ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                    required minLength={6} className={`${INPUT_REG_CLS} pr-12`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPass ? "Ẩn" : "Hiện"}>
                    {showPass ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="h-0.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: strength >= lvl ? STRENGTH_COLORS[strength - 1] : "#E5E7EB" }} />
                    ))}
                    <span className="ml-0.5 text-[10px] font-semibold sm:text-xs" style={{ color: STRENGTH_COLORS[strength - 1] }}>
                      {STRENGTH_LABELS[strength - 1]}
                    </span>
                  </div>
                )}
              </div>


              {form.role === "admin" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 sm:text-sm">Mã mời quản trị</label>
                  <input type="password" autoComplete="off" placeholder="ADMIN_INVITE_CODE"
                    value={form.adminInviteCode} onChange={(e) => handleChange("adminInviteCode", e.target.value)}
                    className={INPUT_REG_CLS} />
                </div>
              )}

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2">
                <button type="button" onClick={() => setAgreed(!agreed)}
                  className="mt-0.5 flex flex-shrink-0 items-center justify-center rounded-md border-2 transition-all"
                  style={{
                    width: "18px", height: "18px",
                    background: agreed ? "#8037f4" : "transparent",
                    borderColor: agreed ? "rgba(128,55,244,0.6)" : "#D1D5DB",
                  }}>
                  {agreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
                <span className="text-xs leading-snug text-gray-500 sm:text-sm">
                  Tôi đồng ý{" "}
                  <a href="#" className="font-semibold text-[#8037f4] hover:underline">Điều khoản</a>{" "}và{" "}
                  <a href="#" className="font-semibold text-[#8037f4] hover:underline">Bảo mật</a>.
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading || !agreed}
                className="w-full rounded-full py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:text-base"
                style={{
                  background: "#8037f4",
                  boxShadow: agreed ? "0 4px 20px rgba(128,55,244,0.3)" : "none",
                }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </span>
                  : "Tạo tài khoản"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3 flex items-center gap-3 sm:my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-medium text-gray-400">hoặc</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <GoogleSignInBlock onError={setError} />

            <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-snug text-gray-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#8037f4]" strokeWidth={2} />
              <span>
                Mã hóa an toàn · Không bán dữ liệu.
              </span>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
