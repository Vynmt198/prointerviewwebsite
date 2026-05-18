import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Monitor, Key } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAuthSessions,
  revokeAuthSession,
  getCurrentAuthSessionId,
} from "../../utils/auth";

function formatSessionLabel(userAgent) {
  const ua = String(userAgent || "").trim();
  if (!ua) return "Thiết bị không xác định";
  if (/Edg\//i.test(ua)) return "Microsoft Edge";
  if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) return "Google Chrome";
  if (/Firefox\//i.test(ua)) return "Mozilla Firefox";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return ua.length > 48 ? `${ua.slice(0, 48)}…` : ua;
}

function formatSessionWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function LoginSessionsSection({ SectionCard }) {
  const navigate = useNavigate();
  const currentId = getCurrentAuthSessionId();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetchAuthSessions();
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Không tải được danh sách phiên.");
      setSessions([]);
      return;
    }
    setSessions(res.sessions || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async (sessionId) => {
    if (!sessionId) return;
    const isCurrent = sessionId === currentId;
    const msg = isCurrent
      ? "Thu hồi phiên này sẽ đăng xuất bạn khỏi thiết bị hiện tại. Tiếp tục?"
      : "Thu hồi phiên đăng nhập trên thiết bị đó?";
    if (!window.confirm(msg)) return;
    setRevokingId(sessionId);
    const res = await revokeAuthSession(sessionId);
    setRevokingId("");
    if (!res.success) {
      toast.error(res.error || "Không thu hồi được phiên.");
      return;
    }
    toast.success(isCurrent ? "Đã đăng xuất phiên hiện tại." : "Đã thu hồi phiên.");
    if (isCurrent) {
      navigate("/");
      return;
    }
    await load();
  };

  return (
    <SectionCard title="Phiên đăng nhập" icon={Key}>
      {loading && (
        <p className="text-sm font-medium text-slate-500">Đang tải phiên đăng nhập…</p>
      )}
      {error && !loading && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}
      {!loading && !error && sessions.length === 0 && (
        <p className="text-sm font-medium text-slate-500">Không có phiên đăng nhập nào.</p>
      )}
      <div className="space-y-3">
        {sessions.map((sess) => {
          const isCurrent = sess.id === currentId;
          return (
            <div
              key={sess.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c4ff47]/12 text-[#c4ff47]">
                  <Monitor size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatSessionLabel(sess.userAgent)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {sess.ip ? `IP: ${sess.ip} · ` : ""}
                    {formatSessionWhen(sess.lastUsedAt || sess.createdAt)}
                    {isCurrent && (
                      <span className="text-emerald-600"> · Đang hoạt động</span>
                    )}
                  </p>
                </div>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  disabled={revokingId === sess.id}
                  onClick={() => handleRevoke(sess.id)}
                  className="self-start rounded-xl border border-slate-300 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50 sm:self-center"
                >
                  {revokingId === sess.id ? "Đang thu hồi…" : "Thu hồi"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
