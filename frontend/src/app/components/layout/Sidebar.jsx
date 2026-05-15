import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutGrid,
  FileText,
  Mic,
  Users,
  User,
  Settings,
  LogOut,
  Zap,
  ChevronsUpDown,
  Calendar,
  TrendingUp,
  Star,
  CircleDollarSign,
  GraduationCap,
  BookText,
  ClipboardList,
  Shield,
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
import { getUser, logout, getInitials, getBrandClickPath, getPlans, getDisplayName } from "../../utils/auth";

/* ── Nav data ─────────────────────────────────────────────── */
const customerMainItems = [
  { title: "Bảng điều khiển", url: "/dashboard", icon: LayoutGrid },
  { title: "Phân tích CV/JD", url: "/cv-analysis", icon: FileText },
  { title: "Phỏng vấn AI", url: "/interview", icon: Mic },
  { title: "Khóa học", url: "/courses", icon: GraduationCap },
  { title: "Tìm Mentor", url: "/mentors", icon: Users },
];

const mentorMainItems = [
  { title: "Bảng điều khiển", url: "/mentor/dashboard", icon: LayoutGrid },
  { title: "Lịch họp", url: "/mentor/schedule", icon: Calendar },
  { title: "Khóa học", url: "/mentor/courses", icon: GraduationCap },
  { title: "Đánh giá chéo", url: "/mentor/peer-review", icon: ClipboardList },
  { title: "Tài chính", url: "/mentor/finance", icon: CircleDollarSign },
  { title: "Phân tích", url: "/mentor/analytics", icon: TrendingUp },
  { title: "Đánh giá", url: "/mentor/reviews", icon: Star },
];

const secondaryItems = [
  { title: "Hồ sơ", url: "/profile", icon: User },
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

/* ── Component ───────────────────────────────────────────── */
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUser();
  const plans = getPlans();
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const isMentor = user?.role === "mentor";
  const isElite = !!plans?.elitePro;
  const isPro = !!plans?.starterPro && !isElite;
  const upgradeTitle = isPro ? "Nâng cấp lên Elite" : "Nâng cấp lên Pro";
  const upgradeButton = isPro ? "Xem gói Elite →" : "Xem gói Pro →";
  const upgradeHint = isPro ? "Mở khóa toàn bộ tính năng" : "AI không giới hạn";
  const secondaryNav = [
    ...(user?.role === "admin" ? [{ title: "Quản trị", url: "/admin", icon: Shield }] : []),
    ...secondaryItems,
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (url) =>
    url === "/dashboard" || url === "/mentor/dashboard"
      ? location.pathname === url
      : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">

      {/* ════════════ HEADER / LOGO ════════════ */}
      <SidebarHeader className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="ProInterview"
              onClick={() => navigate(getBrandClickPath())}
              className="
                !overflow-visible h-14 min-h-14 rounded-none cursor-pointer py-1
                hover:bg-sidebar-accent active:bg-sidebar-accent/80
                data-[active=true]:bg-transparent
                group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10
                group-data-[collapsible=icon]:!min-h-10 group-data-[collapsible=icon]:!min-w-10
                group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0
                group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0
                group-data-[collapsible=icon]:focus-visible:ring-0
                group-data-[collapsible=icon]:!overflow-visible
                group-data-[collapsible=icon]:px-0
                px-3
              "
            >
              {/* Full wordmark (expanded) + circular mark (collapsed) */}
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* divider */}
        <div className="mx-3 h-px bg-sidebar-border group-data-[collapsible=icon]:mx-2" />
      </SidebarHeader>

      {/* ════════════ CONTENT ════════════ */}
      <SidebarContent className="py-3 px-2 gap-0 overflow-x-hidden">

        {/* ── Main group ─────────────────────── */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel
            className="
              mb-1 px-2 uppercase text-sidebar-foreground/45
              group-data-[collapsible=icon]:hidden
            "
            style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em" }}
          >
            Menu chính
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {isMentor
                ? mentorMainItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        onClick={() => navigate(item.url)}
                        className="
                            h-10 rounded-xl gap-3 transition-all text-sidebar-foreground/75
                            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
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
                            : undefined
                        }
                      >
                        <item.icon
                          className={`size-[18px] shrink-0 ${active ? "text-white" : "text-sidebar-foreground/70"}`}
                        />
                        <span
                          className="text-[0.8125rem] truncate group-data-[collapsible=icon]:hidden"
                          style={{ fontWeight: active ? 600 : 400 }}
                        >
                          {item.title}
                        </span>
                        {/* active dot */}
                        {active && (
                          <span
                            className="ml-auto size-1.5 rounded-full shrink-0 group-data-[collapsible=icon]:hidden"
                            style={{ background: "#c4ff47" }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
                : customerMainItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        onClick={() => navigate(item.url)}
                        className="
                            h-10 rounded-xl gap-3 transition-all text-sidebar-foreground/75
                            hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
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
                            : undefined
                        }
                      >
                        <item.icon
                          className={`size-[18px] shrink-0 ${active ? "text-white" : "text-sidebar-foreground/70"}`}
                        />
                        <span
                          className="text-[0.8125rem] truncate group-data-[collapsible=icon]:hidden"
                          style={{ fontWeight: active ? 600 : 400 }}
                        >
                          {item.title}
                        </span>
                        {/* active dot */}
                        {active && (
                          <span
                            className="ml-auto size-1.5 rounded-full shrink-0 group-data-[collapsible=icon]:hidden"
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

        {/* ── Divider ─────────────────────────── */}
        <div className="mx-1 my-3 h-px bg-sidebar-border group-data-[collapsible=icon]:mx-0" />

        {/* ── Secondary group ─────────────────── */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel
            className="
              mb-1 px-2 uppercase text-sidebar-foreground/45
              group-data-[collapsible=icon]:hidden
            "
            style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em" }}
          >
            Khác
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {secondaryNav.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      onClick={() => navigate(item.url)}
                      className="
                        h-10 rounded-xl gap-3 transition-all text-sidebar-foreground/75
                        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
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
                          : undefined
                      }
                    >
                      <item.icon
                        className={`size-[18px] shrink-0 ${active ? "text-white" : "text-sidebar-foreground/70"}`}
                      />
                      <span
                        className="text-[0.8125rem] truncate group-data-[collapsible=icon]:hidden"
                        style={{ fontWeight: active ? 600 : 400 }}
                      >
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Upgrade CTA (expanded only) ─────── */}
        {!isMentor && !isElite && (
          <div className="mt-auto pt-3 group-data-[collapsible=icon]:hidden">
            <div
              className="rounded-2xl border border-[rgba(110,53,232,0.2)] bg-white/75 p-3.5 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(180,245,0,0.2)]"
                >
                  <Zap className="h-3.5 w-3.5 text-[#5a9e00]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{upgradeTitle}</p>
                  <p className="truncate text-[10px] text-slate-500">{upgradeHint}</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="w-full rounded-xl py-1.5 text-xs font-bold text-[#0f172a] transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #B4F500, #93D600)",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.1)",
                }}
              >
                {upgradeButton}
              </button>
            </div>
          </div>
        )}

        {/* ── Upgrade icon (collapsed only) ──── */}
        {!isMentor && !isElite && (
          <div className="hidden mt-auto pt-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <button
              onClick={() => navigate("/pricing")}
              title={upgradeTitle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(110,53,232,0.22)] bg-[rgba(180,245,0,0.15)] transition-all hover:bg-[rgba(180,245,0,0.28)]"
            >
              <Zap className="h-4 w-4 text-[#5a9e00]" />
            </button>
          </div>
        )}

      </SidebarContent>

      {/* ════════════ FOOTER / USER ════════════ */}
      <div className="mx-2 h-px bg-sidebar-border" />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="
                    flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2
                    transition-all focus:outline-none
                    bg-sidebar-accent/50 hover:bg-sidebar-accent
                    group-data-[collapsible=icon]:mx-auto
                    group-data-[collapsible=icon]:w-10
                    group-data-[collapsible=icon]:justify-center
                    group-data-[collapsible=icon]:px-0
                  "
                >
                  {/* Avatar */}
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

                  {/* Name + email — hidden when collapsed */}
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate font-medium text-slate-900" style={{ fontSize: "0.78rem" }}>
                      {displayName}
                    </p>
                    <p className="truncate text-slate-500" style={{ fontSize: "0.65rem" }}>
                      {user?.email || "Gói Miễn phí"}
                    </p>
                  </div>

                  <ChevronsUpDown
                    className="size-3 shrink-0 text-slate-400 group-data-[collapsible=icon]:hidden"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="end" className="w-56 mb-1">
                {/* Header */}
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {user?.email || ""}
                  </p>
                </div>

                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2.5 cursor-pointer">
                    <User className="size-4" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2.5 cursor-pointer">
                    <Settings className="size-4" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                {!isMentor && !isElite && (
                  <DropdownMenuItem
                    onClick={() => navigate("/pricing")}
                    className="flex items-center gap-2.5 cursor-pointer"
                    style={{ color: "#6E35E8", fontWeight: 600 }}
                  >
                    <Zap className="size-4" />
                    {upgradeTitle} ↗
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-destructive focus:text-destructive cursor-pointer"
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