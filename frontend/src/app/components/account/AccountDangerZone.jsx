import { useState, useEffect } from "react";
import { financeRequest } from "../../api/financeOperationsApi.js";
import { useNavigate } from "react-router";
import { Trash2 as Trash } from "lucide-react";
import { toastApiError, toastApiSuccess, tryApi } from "../../utils/shared/apiToast.js";
import { deleteAccount, getUser } from "../../utils/auth/auth.js";

export function AccountDangerZone({ SectionCard }) {
  const navigate = useNavigate();
  const user = getUser();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [impact, setImpact] = useState(null);
  const [error, setError] = useState("");
  const loadImpact = async () => {
    setError("");
    try { setImpact((await financeRequest("/api/auth/me/closure-impact")).impact); }
    catch (err) { setError(err.message); }
  };
  useEffect(() => { void loadImpact(); }, []);

  const email = (user?.email || "").trim().toLowerCase();
  const canDelete = impact?.canClose && user?.role !== "admin" && email && confirmText.trim().toLowerCase() === email;

  const handleDeleteAccount = async () => {
    if (!canDelete) {
      toastApiError("Nhập đúng email tài khoản để xác nhận.");
      return;
    }
    if (!window.confirm("Đóng vĩnh viễn tài khoản và ngừng quyền truy cập? Lịch sử tài chính được giữ để đối soát.")) {
      return;
    }
    setDeleting(true);
    const res = await tryApi(() => deleteAccount(), { fallback: "Không xóa được tài khoản." });
    setDeleting(false);
    if (!res.success) { await loadImpact(); return; }
    toastApiSuccess(res.message || "Đã xóa tài khoản.");
    navigate("/");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <SectionCard title="Đóng tài khoản" icon={Trash}>
        <div className="flex flex-col gap-6 rounded-2xl border border-red-300/40 bg-red-50/60 p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <h4 className="mb-3 text-2xl font-black tracking-tight text-slate-900">Vùng nguy hiểm</h4>
            <p className="text-sm font-semibold text-slate-600">
              Đóng tài khoản, ẩn danh thông tin cơ bản và vô hiệu phiên đăng nhập. Lịch sử thanh toán và rút tiền được giữ để đối soát. Nhập email{" "}
              <span className="font-bold text-slate-900">{email || "của bạn"}</span> để xác nhận.
            </p>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            {!impact && !error && <p className="mt-3 text-sm">Đang kiểm tra khoản còn tồn…</p>}
            {impact?.blockers.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-800">{impact.blockers.map((b) => <li key={b.code}>{b.message}</li>)}</ul>}
            {impact && <p className="mt-3 text-sm">Sau khi đóng, bạn không thể truy cập {impact.asStudent.activeEnrollments} khóa học đã mua bằng tài khoản này.</p>}
            <button type="button" onClick={loadImpact} className="mt-3 text-sm font-bold text-violet-700">Kiểm tra lại</button>
            <input
              type="email"
              autoComplete="off"
              placeholder={email || "email@example.com"}
              className="input-glass mt-4 w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={!canDelete || deleting}
            onClick={handleDeleteAccount}
            className="rounded-2xl border border-red-400 bg-red-500 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Đang đóng…" : "Đóng tài khoản vĩnh viễn"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

export default AccountDangerZone;
