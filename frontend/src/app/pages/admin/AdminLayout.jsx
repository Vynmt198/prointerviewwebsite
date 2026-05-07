import React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserPlus,
  Wallet,
  ArrowLeftRight,
  Banknote,
  Calendar,
  FileQuestion,
  Video,
  BookOpen,
  LineChart,
  Settings,
  Star,
  LifeBuoy,
  User,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { logout, getUser, getInitials } from "../../utils/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const IS = { strokeWidth: 1.75 };

const MAIN_GROUPS = [
  {
    title: "Tổng quan",
    items: [{ to: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Người dùng",
    items: [
      { to: "/admin/users", label: "Người dùng", icon: Users },
      { to: "/admin/mentors", label: "Cố vấn", icon: GraduationCap },
      { to: "/admin/mentors/pending", label: "Duyệt cố vấn", icon: UserPlus },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { to: "/admin/bookings", label: "Lịch hẹn", icon: Calendar },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { to: "/admin/finance", label: "Tài chính", icon: Wallet },
      { to: "/admin/transactions", label: "Giao dịch", icon: ArrowLeftRight },
      { to: "/admin/payouts", label: "Rút tiền cố vấn", icon: Banknote },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { to: "/admin/content/questions", label: "Câu hỏi mẫu", icon: FileQuestion },
      { to: "/admin/content/videos", label: "Video HR", icon: Video },
      { to: "/admin/content/courses", label: "Khóa học", icon: BookOpen },
    ],
  },
  {
    title: "Theo dõi chất lượng",
    items: [
      { to: "/admin/analytics", label: "Phân tích", icon: LineChart },
      { to: "/admin/reviews", label: "Đánh giá", icon: Star },
      { to: "/admin/support", label: "Hỗ trợ", icon: LifeBuoy },
    ],
  },
];

const SECONDARY_ITEMS = [
  { to: "/admin/settings", label: "Cài đặt", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const displayName = user?.name || "Admin";
  const initials = getInitials(user?.name || "A");
  const navRef = React.useRef(null);

  React.useEffect(() => {
    if (navRef.current) navRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0a0618] font-sans text-white">
      <style>{`
        .admin-glass {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(36px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .admin-glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(40px);
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.35s ease, border-color 0.3s ease, box-shadow 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(40px);
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.35s ease, border-color 0.3s ease, box-shadow 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        .glass-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg, rgba(236,72,153,0.07) 0%, transparent 45%, rgba(196,255,71,0.06) 100%);
          pointer-events: none;
          opacity: .85;
        }
        .glass-card:hover {
          border-color: rgba(196,255,71,.38);
          transform: translateY(-2px);
          box-shadow: 0 20px 45px rgba(0,0,0,.35), 0 0 0 1px rgba(196,255,71,.1) inset;
        }
        .admin-glass-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(125deg, rgba(236,72,153,0.07) 0%, transparent 45%, rgba(196,255,71,0.06) 100%);
          pointer-events: none;
          opacity: .85;
        }
        .admin-glass-card:hover {
          border-color: rgba(196,255,71,.38);
          transform: translateY(-2px);
          box-shadow: 0 20px 45px rgba(0,0,0,.35), 0 0 0 1px rgba(196,255,71,.1) inset;
        }
        .admin-shell-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.08;
          background-image:
            linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-18%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-gradient-to-bl from-fuchsia-600/30 via-violet-600/15 to-transparent blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-12%] h-[72vh] w-[72vh] rounded-full bg-gradient-to-tr from-[#c4ff47]/14 via-cyan-500/8 to-fuchsia-500/12 blur-[110px]" />
      </div>
      <div className="admin-shell-grid" />
      <aside className="z-10 flex h-screen w-[272px] shrink-0 flex-col border-r border-white/10 bg-[#07060e]/92 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4">
          <button type="button" onClick={() => navigate("/admin")} className="flex w-full items-center gap-3 text-left">
            <div className="flex h-12 w-[138px] shrink-0 items-center justify-start overflow-hidden rounded-lg">
              <img
                src="/Logo.png"
                alt="ProInterview logo"
                className="h-12 w-auto origin-left scale-[1.6] object-contain"
              />
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 rounded-md bg-[#c4ff47] px-1.5 py-0.5 text-[7px] font-bold tracking-wide text-[#120B2E]">ADMIN</span>
              </div>
            </div>
          </button>
        </div>
        <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Menu chính</p>
          <div className="space-y-3">
            {MAIN_GROUPS.map((group) => (
              <div key={group.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
                <p className="mb-1.5 px-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={Boolean(end)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-[#6E35E8] to-[#8B4DFF] text-white shadow-[0_4px_12px_rgba(110,53,232,.35)]"
                              : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                          }`
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" {...IS} />
                        <span className="truncate font-medium">{label}</span>
                        {location.pathname === to && (
                          <span className="ml-auto size-1.5 shrink-0 rounded-full bg-[#c4ff47]" />
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mx-1 my-3 h-px bg-white/10" />
          <div>
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Khác</p>
            <ul className="space-y-1">
              {SECONDARY_ITEMS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#6E35E8] to-[#8B4DFF] text-white shadow-[0_4px_12px_rgba(110,53,232,.35)]"
                          : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" {...IS} />
                    <span className="truncate font-medium">{label}</span>
                    {location.pathname === to && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-[#c4ff47]" />}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="border-t border-white/10 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2 transition-all hover:bg-white/10"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] text-[11px] font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[12px] font-medium text-white">{displayName}</p>
                  <p className="truncate text-[10px] text-white/35">{user?.email ?? ""}</p>
                </div>
                <ChevronsUpDown className="h-3 w-3 shrink-0 text-white/25" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="mb-1 w-56">
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="flex cursor-pointer items-center gap-2.5">
                  <User className="size-4" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="flex cursor-pointer items-center gap-2.5">
                  <Settings className="size-4" />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="flex cursor-pointer items-center gap-2.5 text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
