import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import {
  Eye,
  EyeOff as EyeSlash,
  Check,
  AlertCircle as WarningCircle,
  Info,
} from "lucide-react";
import {
  loginUser,
  getUser,
  isLoggedIn,
  getPostLoginPath,
  getBrandClickPath,
} from "../../utils/auth";
import { toastApiError } from "../../utils/apiToast";
import { GoogleSignInBlock } from "../../components/auth/GoogleSignInBlock";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { SparkleGlyph } from "../../components/decor/SparkleGlyph.jsx";
import { AUTH_COPY } from "../../constants/brandVoice";
import { AuthPurpleBackdrop } from "../../components/auth/AuthPurpleBackdrop";

const INPUT_CLS =
  "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base outline-none transition-all " +
  "focus:border-[#8037f4] focus:ring-2 focus:ring-[#8037f4]/15 text-gray-900 placeholder-gray-400 " +
  "bg-white hover:bg-gray-50/50";

/** % = tâm sticker; kích thước lệch — nằm trong vùng inset của lớp nền */
const AUTH_STICKS = [
  { x: 14, y: 22, size: 26 },
  { x: 82, y: 20, size: 36 },
  { x: 18, y: 72, size: 22 },
  { x: 80, y: 74, size: 30 },
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

  React.useEffect(() => {
    if (!isLoggedIn()) return;
    const user = getUser();
    if (!user) return;
    navigate(getPostLoginPath(user, searchParams.get("redirect")), { replace: true });
  }, [navigate, searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginUser(email.trim(), typeof password === "string" ? password.trim() : password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      toastApiError(result.error, "Đăng nhập thất bại.");
      return;
    }
    const user = getUser();
    navigate(getPostLoginPath(user, searchParams.get("redirect")));
  };

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError("");
  };

  const errorIsGoogleEnvHint = Boolean(
    error && /VITE_GOOGLE|Google chưa được bật|thiếu.*CLIENT_ID|GOOGLE_CLIENT_ID|Authorized JavaScript/i.test(error),
  );
  const errorIsAccountLocked = Boolean(error && /bị khóa/i.test(error));
  const errorIsProxyOrApi = Boolean(
    error && /Vite proxy|Không gọi được API|Không kết nối được backend/i.test(error),
  );

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
              key={`login-stick-${idx}`}
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
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: "#8037f4" }}>
              Đăng ký
            </Link>
          </p>
        </div>

        {/* Form — giữa màn hình (desktop + mobile) */}
        <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 sm:px-10">
          <div className="w-full max-w-md rounded-3xl border border-violet-100/80 bg-white p-8 shadow-[0_12px_40px_rgba(128,55,244,0.08)] sm:p-10">

            <h1 className="text-gray-900 mb-1"
              style={{ fontSize: "1.875rem", fontWeight: 750, letterSpacing: "-0.025em" }}>
              Đăng nhập
            </h1>
            <p className="text-gray-500 text-sm mb-4">{AUTH_COPY.loginSubtitle}</p>

            {/* Success banner */}
            {isRegistered && (
              <div className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 border"
                style={{ background: "rgba(128,55,244,0.06)", borderColor: "rgba(128,55,244,0.2)" }}>
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#8037f4" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#8037f4" }}>{AUTH_COPY.loginRegisteredTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{AUTH_COPY.loginRegisteredBody}</p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${errorIsGoogleEnvHint || errorIsAccountLocked || errorIsProxyOrApi
                  ? "border-amber-400/25 bg-amber-50 text-amber-800"
                  : "border-red-300/40 bg-red-50 text-red-700"
                }`}>
                {errorIsGoogleEnvHint || errorIsAccountLocked || errorIsProxyOrApi
                  ? <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />
                  : <WarningCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />}
                <div>
                  <p className="font-medium">{error}</p>
                  {errorIsAccountLocked && (
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-900/80">
                      Bạn thử đăng nhập bằng email/mật khẩu, hoặc liên hệ{" "}
                      <a href="mailto:prointerview.ai@gmail.com" className="font-semibold underline">
                        prointerview.ai@gmail.com
                      </a>
                      .
                    </p>
                  )}
                  {errorIsProxyOrApi && !errorIsAccountLocked && (
                    <p className="mt-1.5 text-xs leading-relaxed text-amber-900/80">
                      Chạy <code className="rounded bg-amber-100 px-1">npm run dev:full</code> trong thư mục{" "}
                      <code className="rounded bg-amber-100 px-1">frontend</code>. Backend mặc định cổng{" "}
                      <strong>5001</strong> (macOS thường chiếm 5000).
                    </p>
                  )}
                </div>
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
                  <Link to="/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: "#8037f4" }}>
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
                  background: "#8037f4",
                  boxShadow: "0 4px 20px rgba(128,55,244,0.3)",
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
              <a href="#" className="font-semibold text-[#8037f4] hover:underline">Điều khoản dịch vụ</a>
              {" "}và{" "}
              <a href="#" className="font-semibold text-[#8037f4] hover:underline">Chính sách bảo mật</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
