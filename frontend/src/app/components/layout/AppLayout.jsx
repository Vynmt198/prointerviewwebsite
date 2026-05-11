import React from "react";
import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function AppLayout() {
  return (
    <div className="relative min-h-svh w-full overflow-x-hidden bg-[#120B2E] text-foreground antialiased">
      <SidebarProvider
        className="relative z-[1] flex min-h-svh w-full bg-transparent"
        style={{
          "--sidebar-width": "260px",
          "--sidebar-width-icon": "64px",
        }}
      >
        <AppSidebar />
        <SidebarInset className="relative z-[1] flex min-h-svh flex-1 flex-col bg-transparent shadow-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none">
          <Navbar />
          <div className="relative z-[1] flex-1 min-h-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
