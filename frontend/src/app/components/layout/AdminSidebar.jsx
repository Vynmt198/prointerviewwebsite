import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getUser, logout, getInitials, getDisplayName } from "../../utils/auth";

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
      { to: "/admin/bookings", label: "Lịch hẹn & thanh toán", icon: Calendar },
      { to: "/admin/course-payments", label: "Học phí khóa học", icon: BookOpen },
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

const SECONDARY_ITEMS = [{ to: "/admin/settings", label: "Cài đặt", icon: Settings }];

function pathActive(pathname, to, end) {
  const p = pathname.replace(/\/$/, "") || "/";
  const t = to.replace(/\/$/, "") || "/";
  if (end) return p === t;
  return p === t || p.startsWith(`${t}/`);
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = React.useRef(null);

  const user = getUser();
  const displayName = getDisplayName(user, "Admin");
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  React.useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="ProInterview — Quản trị"
              onClick={() => navigate("/admin")}
              className="
                !overflow-visible h-14 min-h-14 rounded-none cursor-pointer py-1
                hover:bg-white/5 active:bg-white/10
                data-[active=true]:bg-transparent
                group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10
                group-data-[collapsible=icon]:!min-h-10 group-data-[collapsible=icon]:!min-w-10
                group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0
                group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0
                group-data-[collapsible=icon]:focus-visible:ring-0
                group-data-[collapsible=icon]:!overflow-visible
                group-data-[collapsible=icon]:px-0
                px-4
              "
            >
              <div className="relative flex h-14 min-w-0 flex-1 items-center justify-center gap-2 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:overflow-visible">
                <div className="relative flex h-14 w-auto shrink-0 items-center justify-center group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:overflow-visible">
                  <img
                    src="/Logo.png"
                    alt="ProInterview"
                    className="h-full w-auto object-contain origin-center brightness-[0.92] contrast-[1.14] saturate-[1.05] scale-[1.74] translate-x-12 group-data-[collapsible=icon]:hidden sm:scale-[1.8]"
                  />
                  <div
                    className="hidden size-10 shrink-0 items-center justify-center bg-transparent overflow-visible group-data-[collapsible=icon]:flex"
                    aria-hidden
                  >
                    <img
                      src="/logo-mark-circle.png?v=4"
                      alt=""
                      className="h-10 w-10 object-contain object-center brightness-[0.95] contrast-[1.08] translate-x-2.5 translate-y-0.5 scale-[1.1]"
                    />
                  </div>
                </div>
                <span className="ml-auto shrink-0 rounded-md bg-[#c4ff47] px-1.5 py-0.5 text-[7px] font-bold tracking-wide text-[#120B2E] group-data-[collapsible=icon]:hidden">
                  ADMIN
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div
          className="mx-3 h-px group-data-[collapsible=icon]:mx-2"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 gap-0 overflow-hidden px-2 py-3">
        <div ref={contentRef} className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel
            className="mb-1 px-2 uppercase text-white/30 group-data-[collapsible=icon]:hidden"
            style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em" }}
          >
            Menu chính
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-3 group-data-[collapsible=icon]:gap-2">
              {MAIN_GROUPS.map((group) => (
                <SidebarGroup key={group.title} className="p-0">
                  <SidebarGroupLabel
                    className="mb-1 px-2 uppercase text-white/45 group-data-[collapsible=icon]:hidden"
                    style={{ fontSize: "0.5625rem", fontWeight: 800, letterSpacing: "0.14em" }}
                  >
                    {group.title}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {group.items.map(({ to, label, icon: Icon, end }) => {
                        const active = pathActive(location.pathname, to, end);
                        return (
                          <SidebarMenuItem key={to}>
                            <SidebarMenuButton
                              isActive={active}
                              tooltip={label}
                              onClick={() => navigate(to)}
                              className="
                                h-10 rounded-xl gap-3 transition-all
                                group-data-[collapsible=icon]:!justify-center
                                group-data-[collapsible=icon]:!w-10
                                group-data-[collapsible=icon]:!mx-auto
                                group-data-[collapsible=icon]:px-0
                              "
                              style={
                                active
                                  ? {
                                      background: "linear-gradient(135deg, #6E35E8 0%, #8B4DFF 100%)",
                                      color: "#fff",
                                      boxShadow: "0 4px 12px rgba(110,53,232,0.35)",
                                    }
                                  : { color: "rgba(255,255,255,0.55)" }
                              }
                            >
                              <Icon
                                className="size-[18px] shrink-0"
                                style={{ color: active ? "#fff" : "rgba(255,255,255,0.55)" }}
                              />
                              <span
                                className="truncate text-[0.8125rem] group-data-[collapsible=icon]:hidden"
                                style={{ fontWeight: active ? 600 : 400 }}
                              >
                                {label}
                              </span>
                              {active && (
                                <span
                                  className="ml-auto size-1.5 shrink-0 rounded-full group-data-[collapsible=icon]:hidden"
                                  style={{ background: "#c4ff47" }}
                                />
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <div
          className="mx-1 my-3 h-px group-data-[collapsible=icon]:mx-0"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel
            className="mb-1 px-2 uppercase text-white/30 group-data-[collapsible=icon]:hidden"
            style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em" }}
          >
            Khác
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {SECONDARY_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = pathActive(location.pathname, to, false);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={label}
                      onClick={() => navigate(to)}
                      className="
                        h-10 rounded-xl gap-3 transition-all
                        group-data-[collapsible=icon]:!justify-center
                        group-data-[collapsible=icon]:!w-10
                        group-data-[collapsible=icon]:!mx-auto
                        group-data-[collapsible=icon]:px-0
                      "
                      style={
                        active
                          ? {
                              background: "linear-gradient(135deg, #6E35E8 0%, #8B4DFF 100%)",
                              color: "#fff",
                              boxShadow: "0 4px 12px rgba(110,53,232,0.35)",
                            }
                          : { color: "rgba(255,255,255,0.55)" }
                      }
                    >
                      <Icon
                        className="size-[18px] shrink-0"
                        style={{ color: active ? "#fff" : "rgba(255,255,255,0.55)" }}
                      />
                      <span
                        className="truncate text-[0.8125rem] group-data-[collapsible=icon]:hidden"
                        style={{ fontWeight: active ? 600 : 400 }}
                      >
                        {label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>
      </SidebarContent>

      <div className="mx-2 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="
                    flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2
                    transition-all focus:outline-none
                    group-data-[collapsible=icon]:mx-auto
                    group-data-[collapsible=icon]:w-10
                    group-data-[collapsible=icon]:justify-center
                    group-data-[collapsible=icon]:px-0
                  "
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                >
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #6E35E8 0%, #8B4DFF 100%)",
                      fontSize: "0.65rem",
                      boxShadow: "0 2px 8px rgba(110,53,232,0.4)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate font-medium text-white" style={{ fontSize: "0.78rem" }}>
                      {displayName}
                    </p>
                    <p className="truncate text-white/35" style={{ fontSize: "0.65rem" }}>
                      {user?.email || ""}
                    </p>
                  </div>
                  <ChevronsUpDown className="size-3 shrink-0 text-white/25 group-data-[collapsible=icon]:hidden" />
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
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
