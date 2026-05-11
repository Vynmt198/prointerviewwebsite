import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users,
  GraduationCap,
  Wallet,
  Calendar,
  FileQuestion,
  LineChart,
  Settings,
  MessageSquare,
  Activity,
  ArrowRight,
} from "lucide-react";
import { adminApi } from "../../utils/adminApi";

const TILES = [
  { to: "/admin/users", label: "Người dùng", icon: Users, desc: "Danh sách, filter, chi tiết user" },
  { to: "/admin/mentors", label: "Cố vấn", icon: GraduationCap, desc: "Cố vấn, duyệt chờ xét" },
  { to: "/admin/finance", label: "Tài chính", icon: Wallet, desc: "Doanh thu, giao dịch, rút tiền" },
  { to: "/admin/bookings", label: "Lịch hẹn", icon: Calendar, desc: "Phiên hẹn và trạng thái" },
  { to: "/admin/content/questions", label: "Nội dung", icon: FileQuestion, desc: "Câu hỏi, video, khóa học" },
  { to: "/admin/analytics", label: "Phân tích", icon: LineChart, desc: "Báo cáo và biểu đồ" },
  { to: "/admin/settings", label: "Cài đặt HT", icon: Settings, desc: "Giá, fee, API, email" },
  { to: "/admin/support", label: "Hỗ trợ", icon: MessageSquare, desc: "Ticket, khiếu nại, review" },
];

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((res) => {
      if (res.success) setStats(res.stats);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card px-8 py-8">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a23e5]">
          ProInterview Command Center
        </p>
        <h1 className="font-headline text-5xl font-black tracking-tighter text-slate-900 sm:text-6xl">
          Xin chào, <span className="text-violet-700">Admin!</span>
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-600">
          Trung tâm điều hành toàn bộ hệ thống ProInterview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Tổng người dùng"
          value={loading ? "..." : stats?.users || 0}
          icon={Users}
          color="#6E35E8"
        />
        <StatCard
          label="Tổng cố vấn"
          value={loading ? "..." : stats?.mentors || 0}
          icon={GraduationCap}
          color="#84cc16"
        />
        <StatCard
          label="Lượt lịch hẹn"
          value={loading ? "..." : stats?.bookings || 0}
          icon={Activity}
          color="#f59e0b"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map(({ to, label, icon: Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="group glass-card border-slate-200/90 p-6 transition-all hover:border-violet-300/80"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-violet-700 transition-all group-hover:border-[#c4ff47]/60 group-hover:bg-[#c4ff47]/20 group-hover:text-[#120B2E]">
              <Icon size={24} strokeWidth={2} />
            </div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900 group-hover:text-violet-800">
              {label}{" "}
              <ArrowRight size={14} className="opacity-0 transition-all group-hover:opacity-100" />
            </h2>
            <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass-card flex items-center justify-between p-8 group">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <h3 className="origin-left text-4xl font-black tracking-tighter text-slate-900 transition-transform group-hover:scale-105">
          {value}
        </h3>
      </div>
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50"
        style={{ color }}
      >
        <Icon size={32} strokeWidth={2.5} />
      </div>
    </div>
  );
}
