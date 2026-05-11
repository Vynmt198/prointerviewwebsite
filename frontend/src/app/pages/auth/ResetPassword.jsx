import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { resetPassword } from "../../utils/auth";

const INPUT_CLS =
  "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base outline-none transition-all " +
  "focus:border-[#6E35E8] focus:ring-2 focus:ring-[#6E35E8]/15 text-gray-900 placeholder-gray-400 " +
  "bg-white hover:bg-gray-50/50";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Thiếu token đặt lại mật khẩu.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    const res = await resetPassword(token, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] text-gray-900 antialiased">
      <div
        className="flex items-center justify-between px-10 h-20 border-b"
        style={{ borderColor: "rgba(110,53,232,0.1)" }}
      >
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group" aria-label="Về trang chủ">
          <BrandLogo />
        </button>
        <Link to="/login" className="text-sm font-semibold" style={{ color: "#6E35E8" }}>
          Đăng nhập
        </Link>
      </div>

      <div className="mx-auto max-w-md px-6 py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <h1 className="mb-2 text-3xl font-black tracking-tight" style={{ letterSpacing: "-0.03em" }}>
          Đặt lại mật khẩu
        </h1>
        <p className="mb-6 text-sm text-gray-600 leading-relaxed">
          Tạo mật khẩu mới cho tài khoản của bạn. Sau khi đổi, mọi phiên đăng nhập cũ sẽ bị đăng xuất.
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {done ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-900">Đổi mật khẩu thành công.</p>
                <p className="mt-1 text-sm text-emerald-900/80 leading-relaxed">
                  Bạn có thể đăng nhập lại bằng mật khẩu mới.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-white"
                style={{ background: "linear-gradient(135deg, #6E35E8, #9B6DFF)" }}
              >
                Đi đến đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="rp-pass">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="rp-pass"
                type="password"
                required
                autoComplete="new-password"
                className={`${INPUT_CLS} pl-12`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
              />
            </div>

            <label className="mt-4 block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="rp-confirm">
              Xác nhận mật khẩu
            </label>
            <input
              id="rp-confirm"
              type="password"
              required
              autoComplete="new-password"
              className={INPUT_CLS}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-2xl py-3.5 text-sm font-black text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6E35E8, #9B6DFF)" }}
            >
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>

            {!token && (
              <p className="mt-4 text-xs text-amber-700">
                Thiếu token. Hãy mở link đặt lại mật khẩu được tạo từ trang “Quên mật khẩu”.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

