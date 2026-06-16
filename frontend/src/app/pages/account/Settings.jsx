import { MentorPageShell } from "../../components/mentor/MentorPageShell";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bell,
  LogOut,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  CalendarPlus,
  Clock,
  Star,
  ArrowLeftRight,
  Wallet,
  ClipboardCheck,
  Fingerprint,
  MonitorSmartphone,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { toastApiError, toastApiSuccess } from "../../utils/apiToast";
import { logout, getUser, updateUser, refreshUserProfile } from "../../utils/auth";
import { LoginSessionsSection } from "../../components/account/LoginSessionsSection";
import { AccountDangerZone } from "../../components/account/AccountDangerZone";
import {
  mentorPageTitle,
  mentorPageSubtitle,
  mentorAccentText,
} from "../../components/mentor/mentorTypography";

const NOTIF_PREFS_KEY_CUSTOMER = "prointerview_notif_prefs";
const NOTIF_PREFS_KEY_MENTOR = "prointerview_notif_prefs_mentor";

function notifStorageKey(role) {
  return role === "mentor" ? NOTIF_PREFS_KEY_MENTOR : NOTIF_PREFS_KEY_CUSTOMER;
}

/** Tiêu đề / nhãn, in hoa qua CSS */
const SETTINGS_TITLE_CLS =
  "text-xs font-bold uppercase tracking-wide text-slate-800";
/** Mô tả, viết thường, câu bình thường */
const ITEM_DESC_CLS = "text-sm text-slate-500 leading-relaxed tracking-normal";

function loadNotifPrefs(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function mergeNotifPrefs(defaults, storageKey) {
  const saved = loadNotifPrefs(storageKey);
  if (!saved) return defaults;
  return defaults.map((d) => {
    const hit = saved.find((s) => s.id === d.id);
    return hit ? { ...d, value: !!hit.value } : d;
  });
}

function mergeNotifFromServer(defaults, serverPrefs, isMentor) {
  const slice = isMentor ? serverPrefs?.mentor : serverPrefs?.customer;
  if (!slice || typeof slice !== "object") return defaults;
  return defaults.map((d) => ({
    ...d,
    value: typeof slice[d.id] === "boolean" ? slice[d.id] : d.value,
  }));
}

/* ─── Reusable components ───────────────────────────────── */
function ToggleSwitch({
  enabled,
  onChange,
  colorClass = "bg-primary-fixed",
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-[#8037f4]/20 ${
        enabled ? colorClass : "bg-slate-300"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({ children, className = "", title, icon: Icon }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">
            {Icon && <Icon size={15} strokeWidth={2.2} />}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function SaveBar({
  dirty,
  saving,
  saved,
  onSave,
  onReset,
}) {
  if (!dirty && !saved) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-10 right-10 left-auto z-50 flex items-center gap-6 px-10 py-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border backdrop-blur-3xl transition-all ${
        saved
          ? "bg-emerald-600 border-emerald-400 text-white"
          : "bg-[#1a0d35]/95 border-white/10"
      }`}
    >
      {saved ? (
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Đã đồng bộ thành công</span>
        </div>
      ) : (
        <>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">Hệ thống có thay đổi</span>
          <div className="flex items-center gap-4">
            <button
              onClick={onReset}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
            >
              Hủy
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-8 py-3 rounded-2xl bg-primary-fixed text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? "..." : "Lưu thay đổi"}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─── TAB: Notifications ────────────────────────────────── */
const DEFAULT_CUSTOMER_NOTIFS = [
  {
    id: "interview_reminder",
    label: "Nhắc lịch phỏng vấn",
    description: "Thông báo trước buổi hẹn khoảng 1 giờ.",
    value: true,
    icon: Clock,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
  {
    id: "mentor_feedback",
    label: "Phản hồi từ mentor",
    description: "Khi mentor gửi góp ý sau buổi hoặc nhận xét của bạn.",
    value: true,
    icon: UserCheck,
    iconBg: "#c4ff47",
    iconColor: "#3a5c00",
  },
  {
    id: "streak_reminder",
    label: "Nhắc luyện tập đều đặn",
    description: "Nhắc luyện phỏng vấn AI và hoàn thành mục tiêu tuần.",
    value: true,
    icon: Star,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
];

const DEFAULT_MENTOR_NOTIFS = [
  {
    id: "booking_request",
    label: "Yêu cầu đặt lịch mới",
    description: "Có lịch mới hoặc học viên đã thanh toán.",
    value: true,
    icon: CalendarPlus,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
  {
    id: "session_reminder",
    label: "Nhắc buổi mentor sắp tới",
    description: "Nhắc trước buổi khoảng 1 giờ.",
    value: true,
    icon: Clock,
    iconBg: "#c4ff47",
    iconColor: "#3a5c00",
  },
  {
    id: "mentee_review",
    label: "Đánh giá từ học viên",
    description: "Học viên gửi nhận xét sau buổi.",
    value: true,
    icon: Star,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
  {
    id: "booking_change",
    label: "Đổi hoặc hủy lịch",
    description: "Hủy buổi, đổi lịch hoặc cập nhật hoàn tiền.",
    value: true,
    icon: ArrowLeftRight,
    iconBg: "#c4ff47",
    iconColor: "#3a5c00",
  },
  {
    id: "payout_update",
    label: "Cập nhật tài chính",
    description: "Thu nhập, rút tiền và xác nhận từ admin.",
    value: true,
    icon: Wallet,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
  {
    id: "peer_review_course",
    label: "Đánh giá chéo khóa học",
    description: "Có khóa học cần bạn đánh giá chéo.",
    value: true,
    icon: ClipboardCheck,
    iconBg: "#c4ff47",
    iconColor: "#3a5c00",
  },
];

function NotificationsTab({ isMentor, profileFromServer, onProfileSynced }) {
  const defaults = isMentor ? DEFAULT_MENTOR_NOTIFS : DEFAULT_CUSTOMER_NOTIFS;
  const storageKey = notifStorageKey(isMentor ? "mentor" : "customer");
  const sectionTitle = isMentor ? "Thông báo mentor" : "Trung tâm thông báo";

  const initialPrefs = () => {
    if (profileFromServer?.notificationPrefs) {
      return mergeNotifFromServer(defaults, profileFromServer.notificationPrefs, isMentor);
    }
    return mergeNotifPrefs(defaults, storageKey);
  };

  const [push, setPush] = useState(initialPrefs);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const defs = isMentor ? DEFAULT_MENTOR_NOTIFS : DEFAULT_CUSTOMER_NOTIFS;
    if (profileFromServer?.notificationPrefs) {
      setPush(mergeNotifFromServer(defs, profileFromServer.notificationPrefs, isMentor));
    } else {
      setPush(mergeNotifPrefs(defs, storageKey));
    }
    setDirty(false);
  }, [isMentor, profileFromServer?.notificationPrefs, storageKey]);

  const toggle = (id) => {
    setPush((prev) => prev.map((t) => (t.id === id ? { ...t, value: !t.value } : t)));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const prefMap = Object.fromEntries(push.map(({ id, value }) => [id, value]));
    const payload = isMentor
      ? { notificationPrefs: { mentor: prefMap } }
      : { notificationPrefs: { customer: prefMap } };
    const res = await updateUser(payload);
    setSaving(false);
    if (!res.success) {
      toastApiError(res.error, "Không lưu được cài đặt thông báo.");
      return;
    }
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(push.map(({ id, value }) => ({ id, value }))),
      );
    } catch {
      /* cache optional */
    }
    const u = getUser();
    onProfileSynced?.(u);
    setDirty(false);
    toastApiSuccess("Đã lưu, thông báo sẽ áp dụng theo lựa chọn của bạn.");
  };

  const handleReset = () => {
    setPush(defaults);
    setDirty(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionCard title={sectionTitle} icon={Bell}>
        <div className="divide-y divide-slate-100">
          {push.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  {ItemIcon && (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: item.iconBg }}
                    >
                      <ItemIcon size={16} strokeWidth={2} style={{ color: item.iconColor }} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <ToggleSwitch enabled={item.value} onChange={() => toggle(item.id)} colorClass="bg-[#7fe015]" />
              </div>
            );
          })}
        </div>
      </SectionCard>
      <SaveBar dirty={dirty} saving={saving} saved={false} onSave={handleSave} onReset={handleReset} />
    </div>
  );
}

/* ─── TAB: Security ─────────────────────────────────────── */
const MIN_PASS = 6;
const DEFAULT_SECURITY_PREFS = [
  {
    id: "two_factor",
    label: "Xác thực 2 bước",
    description: "Tăng cường bảo vệ tài khoản khi đăng nhập.",
    value: false,
    icon: Fingerprint,
    iconBg: "#ede9fe",
    iconColor: "#8037f4",
  },
  {
    id: "login_alert",
    label: "Thông báo đăng nhập mới",
    description: "Nhận thông báo khi tài khoản được đăng nhập từ thiết bị lạ.",
    value: true,
    icon: MonitorSmartphone,
    iconBg: "#c4ff47",
    iconColor: "#3a5c00",
  },
];

function SecurityTab({ profileFromServer, onProfileSynced }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [securityPrefs, setSecurityPrefs] = useState(DEFAULT_SECURITY_PREFS);
  /** Profile có `hasGoogleLogin` từ server (đồng bộ từ trang Settings + sau đổi MK) */
  const [sessionUser, setSessionUser] = useState(
    () => profileFromServer ?? getUser()
  );

  useEffect(() => {
    setSessionUser(profileFromServer ?? getUser());
  }, [profileFromServer]);

  const hasGoogleLogin = Boolean(sessionUser?.hasGoogleLogin);
  /** Chỉ bắt buộc MK hiện tại khi server báo không có Google */
  const needsCurrentPassword = !hasGoogleLogin;
  const toggleSecurityPref = (id) => {
    setSecurityPrefs((prev) => prev.map((item) => (item.id === id ? { ...item, value: !item.value } : item)));
  };

  const handleUpdatePassword = async () => {
    const np = newPassword.trim();
    const cp = confirmPassword.trim();
    if (np.length < MIN_PASS) {
      toastApiError(`Mật khẩu mới cần ít nhất ${MIN_PASS} ký tự.`);
      return;
    }
    if (np !== cp) {
      toastApiError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (needsCurrentPassword && !currentPassword.trim()) {
      toastApiError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    setSaving(true);
    try {
      const payload = { newPassword: np };
      if (needsCurrentPassword) {
        payload.currentPassword = currentPassword.trim();
      } else if (currentPassword.trim()) {
        payload.currentPassword = currentPassword.trim();
      }
      const result = await updateUser(payload);
      if (result?.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        const u = await refreshUserProfile();
        const next = u ?? getUser();
        setSessionUser(next);
        onProfileSynced?.(next);
        toastApiSuccess("Đã cập nhật mật khẩu.");
      } else {
        toastApiError(result?.error, "Không lưu được mật khẩu.");
      }
    } catch {
      toastApiError("Lỗi kết nối khi đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionCard title="Bảo mật đăng nhập" icon={ShieldCheck}>
        <div className="divide-y divide-slate-100">
          {securityPrefs.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  {ItemIcon && (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: item.iconBg }}
                    >
                      <ItemIcon size={16} strokeWidth={2} style={{ color: item.iconColor }} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <ToggleSwitch enabled={item.value} onChange={() => toggleSecurityPref(item.id)} colorClass="bg-[#7fe015]" />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Đổi mật khẩu" icon={KeyRound}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Mật khẩu hiện tại</label>
            {!needsCurrentPassword && (
              <p className="text-xs text-slate-400">Không bắt buộc nếu bạn đang đăng nhập bằng Google.</p>
            )}
            <input
              type="password"
              autoComplete="current-password"
              placeholder={needsCurrentPassword ? "Nhập mật khẩu hiện tại" : "Để trống hoặc nhập mật khẩu cũ nếu có"}
              className="input-glass w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Mật khẩu mới</label>
            <input type="password" autoComplete="new-password" placeholder="••••••••" className="input-glass w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Xác nhận mật khẩu mới</label>
            <input type="password" autoComplete="new-password" placeholder="••••••••" className="input-glass w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <div className="mt-5">
          <button
            type="button"
            disabled={saving}
            onClick={handleUpdatePassword}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Cập nhật mật khẩu"}
          </button>
        </div>
      </SectionCard>

      <LoginSessionsSection SectionCard={SectionCard} />

      <AccountDangerZone SectionCard={SectionCard} />
    </div>
  );
}

/* ─── Main Settings Page ────────────────────────────────── */
const TABS = [
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: ShieldCheck },
];

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("notifications");
  /** Đồng bộ GET /me ngay khi vào Cài đặt, tránh tab Bảo mật đọc localStorage cũ thiếu hasGoogleLogin */
  const [profileFromServer, setProfileFromServer] = useState(() => getUser());

  useEffect(() => {
    let cancelled = false;
    refreshUserProfile().then((u) => {
      if (!cancelled) setProfileFromServer(u ?? getUser());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isMentor = profileFromServer?.role === "mentor";

  return (
    <MentorPageShell bottomPad="pb-32">
      <style>{`
        .glass-card {
           background: #ffffff;
           backdrop-filter: none;
           border-radius: 28px;
           border: 1px solid rgba(148, 163, 184, 0.28);
           transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.45s ease;
           position: relative;
           overflow: hidden;
           box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }
        .glass-card::before {
           content: none;
        }
        .glass-card:hover {
           border-color: rgba(122, 35, 229, 0.28);
           transform: translateY(-2px);
           box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
        }
        .settings-glass-nav {
           background: #ffffff;
           backdrop-filter: none;
           border: 1px solid rgba(148, 163, 184, 0.28);
        }
        .settings-glass-nav:hover { border-color: rgba(122, 35, 229, 0.22); }
        .font-headline {
          letter-spacing: -0.045em;
          text-shadow: none;
        }
        .input-glass {
           background: #ffffff;
           border: 1px solid #e2e8f0;
           border-radius: 14px;
           color: #0f172a;
           padding: 12px 16px;
           font-size: 0.875rem;
           font-weight: 500;
           letter-spacing: -0.01em;
           transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .input-glass:focus {
           background: #ffffff;
           border-color: rgba(122, 35, 229, 0.45);
           outline: none;
           box-shadow: 0 0 0 2px rgba(122, 35, 229, 0.12);
        }
        .input-glass::placeholder { color: #94a3b8; }
        @keyframes settings-shimmer {
          0% { opacity: 0.4; transform: translate(0,0) scale(1); }
          50% { opacity: 0.7; transform: translate(2%, -2%) scale(1.05); }
          100% { opacity: 0.4; transform: translate(0,0) scale(1); }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-violet-600">
              <ShieldCheck size={12} /> Tài khoản
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Cài đặt <span className="text-violet-600">tài khoản</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isMentor ? "Thông báo, bảo mật và phiên đăng nhập." : "Thông báo và bảo mật tài khoản."}
            </p>
          </div>
          {/* quick stat chips */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c4ff47] px-3 py-1.5 text-[11px] font-bold text-slate-800">
              <CheckCircle size={12} /> Tài khoản hoạt động
            </span>
            {isMentor && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
                <UserCheck size={12} /> Mentor
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
              </div>
              <div className="p-2">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`group mb-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all last:mb-0 ${
                        isActive
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <tab.icon size={16} strokeWidth={2} className="shrink-0" />
                        <span className="text-sm font-semibold">{tab.label}</span>
                      </div>
                      {isActive && <ChevronRight size={13} className="shrink-0 opacity-60" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut size={16} strokeWidth={2} />
                  <span className="text-sm font-semibold">Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <main className="lg:col-span-9">
            <div className="min-h-[400px]">
              {activeTab === "notifications" && (
                <NotificationsTab
                  isMentor={isMentor}
                  profileFromServer={profileFromServer}
                  onProfileSynced={(u) => setProfileFromServer(u ?? getUser())}
                />
              )}
              {activeTab === "security" && (
                <SecurityTab
                  profileFromServer={profileFromServer}
                  onProfileSynced={(u) => setProfileFromServer(u)}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </MentorPageShell>
  );
}