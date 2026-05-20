import React from "react";
import { Outlet, useLocation } from "react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../components/ui/sidebar";
import { AdminSidebar } from "../../components/layout/AdminSidebar";
import { MentorPageShell } from "../../components/mentor/MentorPageShell";

/** Tiêu đề header — thứ tự từ cụ thể → tổng quan (regex). */
const ADMIN_HEADER_RULES = [
  [/^\/admin\/users\/[^/]+$/, "Chi tiết người dùng", "Thông tin tài khoản"],
  [/^\/admin\/users$/, "Người dùng", "Danh sách & tìm kiếm"],
  [/^\/admin\/mentors\/pending$/, "Duyệt cố vấn", "Hồ sơ chờ phê duyệt"],
  [/^\/admin\/mentors\/[^/]+$/, "Chi tiết cố vấn", "Hồ sơ mentor"],
  [/^\/admin\/mentors$/, "Cố vấn", "Danh sách mentor"],
  [/^\/admin\/bookings\/[^/]+$/, "Chi tiết lịch hẹn", "Phiên & thanh toán"],
  [/^\/admin\/bookings$/, "Lịch hẹn & thanh toán", "Lịch hẹn cố vấn và xác nhận thanh toán chuyển khoản"],
  [/^\/admin\/course-payments$/, "Học phí khóa học", "Ghi danh khóa học chờ đối soát chuyển khoản"],
  [/^\/admin\/subscription-payments$/, "Gói cước Pro/Elite", "Nâng cấp tài khoản chờ xác nhận CK"],
  [/^\/admin\/transactions$/, "Giao dịch", "Lịch sử thanh toán"],
  [/^\/admin\/payouts$/, "Rút tiền cố vấn", "Yêu cầu chi trả"],
  [/^\/admin\/finance$/, "Tài chính", "Lịch hẹn, học phí khóa học, rút tiền cố vấn"],
  [/^\/admin\/content\/questions$/, "Câu hỏi mẫu", "Nội dung AI"],
  [/^\/admin\/content\/videos$/, "Video HR", "Thư viện media"],
  [/^\/admin\/content\/courses$/, "Khóa học", "Nội dung khóa"],
  [/^\/admin\/analytics$/, "Phân tích", "Báo cáo & biểu đồ"],
  [/^\/admin\/reviews$/, "Đánh giá", "Feedback người dùng"],
  [/^\/admin\/support$/, "Hỗ trợ", "Ticket & khiếu nại"],
  [/^\/admin\/settings$/, "Cài đặt hệ thống", "Cấu hình nền tảng"],
  [/^\/admin$/, "Quản trị", "Bảng điều khiển hệ thống"],
];

function adminPageHeader(pathname) {
  const p = (pathname || "").replace(/\/$/, "") || "/";
  for (const [re, label, sub] of ADMIN_HEADER_RULES) {
    if (re.test(p)) return { label, sub };
  }
  return { label: "Quản trị", sub: "ProInterview Admin" };
}

function AdminTopBar() {
  const location = useLocation();
  const { label, sub } = adminPageHeader(location.pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b px-5 backdrop-blur-xl"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderColor: "rgba(122,35,229,0.18)",
        boxShadow: "0 1px 0 rgba(122,35,229,0.08)",
      }}
    >
      <SidebarTrigger className="rounded-lg text-[#7a23e5]/70 transition-colors hover:bg-[#7a23e5]/10 hover:text-[#7a23e5]" />
      <div className="h-6 w-px shrink-0 bg-[#7a23e5]/20" />
      <div className="min-w-0 flex flex-col gap-0">
        <h1
          className="truncate text-[#7a23e5]"
          style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.015em" }}
        >
          {label}
        </h1>
        {sub ? (
          <p className="hidden truncate text-xs text-[#8CAF2F] sm:block">{sub}</p>
        ) : null}
      </div>
      <div className="flex-1" />
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#120B2E] sm:text-[10px]"
        style={{ background: "linear-gradient(135deg, #c4ff47, #a3e635)" }}
      >
        Admin
      </span>
    </header>
  );
}

export function AdminLayout() {
  return (
    <div className="relative h-svh w-full overflow-hidden bg-[#120B2E] text-foreground">
      <SidebarProvider
        className="relative z-[1] flex h-full min-h-0 w-full bg-transparent"
        style={{
          "--sidebar-width": "260px",
          "--sidebar-width-icon": "64px",
        }}
      >
        <AdminSidebar />
        <SidebarInset className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col bg-transparent shadow-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none">
          <AdminTopBar />
          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <MentorPageShell fillHeight bottomPad="pb-8">
              <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </MentorPageShell>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
