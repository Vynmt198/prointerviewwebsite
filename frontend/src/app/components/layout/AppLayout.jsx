import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { resolveDocumentTitle } from "../../utils/documentTitle";
import { getUser } from "../../utils/auth";
import { SidebarMascot } from "./SidebarMascot";

export function AppLayout() {
  const location = useLocation();
  const user = getUser();
  const isMentor = user?.role === "mentor";

  useEffect(() => {
    document.title = resolveDocumentTitle(location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="app-user-shell relative min-h-svh w-full overflow-x-hidden bg-[#f3f0f9] text-slate-900 antialiased selection:bg-violet-100 selection:text-violet-900"
      style={{
        fontFamily: "'Lexend', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div className="app-shell-ambient" aria-hidden />
      <SidebarProvider
        className="relative z-[1] flex min-h-svh w-full bg-transparent"
        style={{
          "--sidebar-width": "228px",
          "--sidebar-width-icon": "56px",
        }}
      >
        <AppSidebar />
        <SidebarInset className="relative z-[1] flex min-h-svh flex-1 flex-col bg-transparent shadow-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none">
          <Navbar />
          <div className="relative z-[1] min-h-0 flex-1">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      {!isMentor && <SidebarMascot />}
    </div>
  );
}
