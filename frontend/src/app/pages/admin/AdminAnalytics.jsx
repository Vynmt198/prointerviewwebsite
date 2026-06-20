import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  RefreshCw,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  Flag,
  Brain,
  Route,
  MousePointerClick,
  TrendingDown,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  AdminPageHeader,
  adminGlassTable,
  adminHeaderRow,
  adminPageWrap,
  adminRefreshBtn,
  adminStatGrid3,
  adminStatGrid4,
  adminStatLabel,
  adminStatValue,
  adminTdCell,
  adminThCell,
  adminToolbar,
} from "../../components/admin/AdminPageShell.jsx";
import { BookingStatusPill, PaymentStatusPill } from "../../components/admin/AdminStatusPill.jsx";
import { adminApi } from "../../api/adminApi.js";
import { tryApi } from "../../utils/shared/apiToast.js";
import { formatDurationMs, labelAction, labelRoute } from "../../utils/analytics/analyticsLabels.js";

function vnd(n) {
  return `${Number(n || 0).toLocaleString("vi-VN")} đ`;
}

const BOOKING_STATUS_LABELS = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang diễn ra",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  rescheduled: "Đổi lịch",
  no_show: "Không tham gia",
};

function KpiCard({ label, value, icon: Icon, color = "#8037f4" }) {
  return (
    <div className="glass-card group flex items-center justify-between p-6 sm:p-7">
      <div className="min-w-0">
        <p className={adminStatLabel}>{label}</p>
        <p className={`${adminStatValue} mt-1 origin-left transition-transform group-hover:scale-[1.02]`}>
          {value}
        </p>
      </div>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/90 sm:h-16 sm:w-16"
        style={{ color }}
      >
        <Icon size={28} strokeWidth={2.25} aria-hidden />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4">
      <p className={adminStatLabel}>{label}</p>
      <p className={`${adminStatValue} mt-1 text-xl sm:text-2xl`}>{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, kicker, title, desc }) {
  return (
    <div className="border-b border-slate-200/90 bg-gradient-to-r from-violet-50/70 via-white to-white px-6 py-5 sm:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-[0_4px_14px_rgba(128,55,244,0.08)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8037f4]">{kicker}</p>
          <h3 className="font-headline mt-0.5 text-lg font-black uppercase tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h3>
          {desc ? <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">{desc}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max, accent = "violet", suffix = "" }) {
  const num = Number(value) || 0;
  const pct = max > 0 ? Math.round((num / max) * 100) : 0;
  const bar =
    accent === "emerald"
      ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
      : "bg-gradient-to-r from-violet-500 to-[#8037f4]";

  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="shrink-0 font-black tabular-nums text-violet-800">
          {num}
          {suffix}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function EmptyHint({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-500">{children}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [content, setContent] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [statsRes, contentRes, behaviorRes] = await Promise.all([
      tryApi(() => adminApi.getStats(), { fallback: "Không tải được thống kê nền tảng." }),
      tryApi(() => adminApi.getContentStats(), { fallback: "", silent: true }),
      tryApi(() => adminApi.getUserBehavior(7), { fallback: "", silent: true }),
    ]);
    if (statsRes.success) setStats(statsRes.stats || null);
    if (contentRes.success) setContent(contentRes.content || null);
    if (behaviorRes.success) setBehavior(behaviorRes.behavior || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const plans = stats?.plans || { free: 0, starter_pro: 0, elite_pro: 0 };
  const bookingBreakdown = useMemo(() => {
    const raw = stats?.bookingsByStatus || {};
    return Object.entries(raw)
      .map(([status, count]) => ({
        status,
        label: BOOKING_STATUS_LABELS[status] || status,
        count: Number(count) || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [stats?.bookingsByStatus]);

  const recentBookings = stats?.recentBookings || [];
  const interviewOps = content?.interviewOps || {};
  const funnelMax = Math.max(...(behavior?.funnel || []).map((f) => f.users), 1);
  const bookingMax = bookingBreakdown[0]?.count || 1;

  return (
    <div className={adminPageWrap}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={adminHeaderRow}>
        <AdminPageHeader
          kicker="Báo cáo nền tảng"
          title={
            <>
              <span className="text-violet-700">Phân tích</span> &amp; hành vi
            </>
          }
          subtitle="Tổng quan người dùng, lịch hẹn, nội dung và hành trình trên ProInterview (7 ngày gần nhất)."
        />
        <div className={adminToolbar}>
          <button type="button" onClick={() => void loadAll()} disabled={loading} className={adminRefreshBtn}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </motion.div>

      {loading && !stats ? (
        <div className="glass-card flex min-h-[240px] items-center justify-center p-10">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-sm font-semibold text-slate-500">Đang tải dữ liệu phân tích…</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={adminStatGrid4}>
            <KpiCard label="Khách hàng" value={stats?.users ?? 0} icon={Users} color="#8037f4" />
            <KpiCard label="Cố vấn" value={stats?.mentors ?? 0} icon={GraduationCap} color="#84cc16" />
            <KpiCard label="Lịch hẹn" value={stats?.bookings ?? 0} icon={Calendar} color="#0ea5e9" />
            <KpiCard label="Ghi danh" value={stats?.enrollmentsPaid ?? 0} icon={BookOpen} color="#f59e0b" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${adminGlassTable} p-6 sm:p-8`}
          >
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-700" aria-hidden />
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">Chỉ số chi tiết</p>
            </div>
            <div className={`${adminStatGrid4} mb-4`}>
              <MiniStat label="Gói Pro" value={plans.starter_pro ?? 0} />
              <MiniStat label="Gói Elite" value={plans.elite_pro ?? 0} />
              <MiniStat label="Free" value={plans.free ?? 0} />
              <MiniStat label="Báo cáo mở" value={stats?.reportsOpen ?? 0} />
            </div>
            <div className={adminStatGrid4}>
              <MiniStat label="Khóa chờ duyệt" value={stats?.courses?.pendingReview ?? 0} />
              <MiniStat label="Khóa xuất bản" value={stats?.courses?.published ?? 0} />
              <MiniStat label="Phân tích CV" value={content?.cvAnalyses ?? 0} />
              <MiniStat
                label="Phiên AI"
                value={
                  interviewOps?.periodDays
                    ? `${content?.interviewSessions ?? 0} · ${interviewOps.sessions7d ?? 0}/${interviewOps.periodDays}d`
                    : content?.interviewSessions ?? 0
                }
              />
            </div>
          </motion.div>

          {behavior ? (
            <div className="grid gap-6 xl:grid-cols-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${adminGlassTable} xl:col-span-3`}
              >
                <SectionHeader
                  icon={Route}
                  kicker="Hành vi"
                  title={`Top trang · ${behavior.days} ngày`}
                  desc="Trang user ở lâu nhất (đã đăng nhập)."
                />
                <div className="max-w-full overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        <th className={adminThCell}>Trang</th>
                        <th className={`${adminThCell} text-center`}>User</th>
                        <th className={`${adminThCell} text-center`}>Lượt</th>
                        <th className={`${adminThCell} text-right`}>TB / lượt</th>
                        <th className={`${adminThCell} text-right`}>Tổng TG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(behavior.topRoutes || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`${adminTdCell} text-center`}>
                            <EmptyHint>Chưa có dữ liệu — user cần đăng nhập và duyệt app.</EmptyHint>
                          </td>
                        </tr>
                      ) : (
                        behavior.topRoutes.map((r) => (
                          <tr key={r.route} className="transition-colors hover:bg-violet-50/40">
                            <td className={`${adminTdCell} font-black text-slate-900`}>{labelRoute(r.route)}</td>
                            <td className={`${adminTdCell} text-center tabular-nums`}>{r.uniqueUsers}</td>
                            <td className={`${adminTdCell} text-center tabular-nums`}>{r.visits}</td>
                            <td className={`${adminTdCell} text-right tabular-nums text-slate-600`}>
                              {formatDurationMs(r.avgMs)}
                            </td>
                            <td className={`${adminTdCell} text-right font-black tabular-nums text-violet-800`}>
                              {formatDurationMs(r.totalMs)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${adminGlassTable} space-y-0 xl:col-span-2`}
              >
                <SectionHeader
                  icon={TrendingDown}
                  kicker="Funnel"
                  title="Hành trình khách"
                  desc="Số user unique từng bước — thấp dần = rớt nhiều."
                />
                <div className="space-y-6 p-6 sm:p-8">
                  {(behavior.funnel || []).length === 0 ? (
                    <EmptyHint>Chưa có dữ liệu funnel.</EmptyHint>
                  ) : (
                    <ul className="space-y-4">
                      {behavior.funnel.map((step) => (
                        <ProgressRow
                          key={step.route}
                          label={labelRoute(step.route)}
                          value={step.users}
                          max={funnelMax}
                          suffix=" user"
                          accent="emerald"
                        />
                      ))}
                    </ul>
                  )}

                  {(behavior.topActions || []).length > 0 ? (
                    <div className="border-t border-slate-100 pt-6">
                      <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        Hành động nổi bật
                      </p>
                      <ul className="space-y-3">
                        {behavior.topActions.map((a) => (
                          <li
                            key={a.action}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                          >
                            <span className="text-sm font-bold text-slate-900">{labelAction(a.action)}</span>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">
                              {a.count} · {a.uniqueUsers} user
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={adminGlassTable}>
              <SectionHeader
                icon={Calendar}
                kicker="Vận hành"
                title="Lịch hẹn theo trạng thái"
              />
              <div className="p-6 sm:p-8">
                {bookingBreakdown.length === 0 ? (
                  <EmptyHint>Chưa có lịch hẹn.</EmptyHint>
                ) : (
                  <ul className="space-y-4">
                    {bookingBreakdown.map((row) => (
                      <ProgressRow key={row.status} label={row.label} value={row.count} max={bookingMax} />
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={adminGlassTable}>
              <SectionHeader icon={Brain} kicker="AI" title="Phỏng vấn thông minh" />
              <div className={`${adminStatGrid3} p-6 sm:p-8`}>
                <MiniStat label="Tổng phiên" value={content?.interviewSessions ?? 0} />
                <MiniStat
                  label={interviewOps?.periodDays ? `${interviewOps.periodDays} ngày qua` : "7 ngày qua"}
                  value={interviewOps?.sessions7d ?? "—"}
                />
                <MiniStat
                  label="Điểm TB"
                  value={interviewOps?.avgScore7d != null ? interviewOps.avgScore7d : "—"}
                />
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={adminGlassTable}>
            <SectionHeader
              icon={Flag}
              kicker="Gần đây"
              title="Lịch hẹn mới nhất"
              desc="Các buổi mentor vừa tạo hoặc cập nhật."
            />
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className={adminThCell}>Học viên</th>
                    <th className={adminThCell}>Cố vấn</th>
                    <th className={adminThCell}>Ngày giờ</th>
                    <th className={`${adminThCell} text-center`}>Buổi hẹn</th>
                    <th className={`${adminThCell} text-center`}>Thanh toán</th>
                    <th className={`${adminThCell} text-right`}>Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={adminTdCell}>
                        <EmptyHint>Chưa có lịch hẹn gần đây.</EmptyHint>
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b._id} className="transition-colors hover:bg-violet-50/40">
                        <td className={`${adminTdCell} font-black text-slate-900`}>{b.studentName}</td>
                        <td className={`${adminTdCell} text-slate-700`}>{b.mentorName}</td>
                        <td className={`${adminTdCell} tabular-nums text-slate-600`}>
                          {b.date} {b.timeSlot}
                        </td>
                        <td className={adminTdCell}>
                          <div className="flex justify-center">
                            <BookingStatusPill status={b.status} />
                          </div>
                        </td>
                        <td className={adminTdCell}>
                          <div className="flex justify-center">
                            <PaymentStatusPill status={b.paymentStatus} />
                          </div>
                        </td>
                        <td className={`${adminTdCell} text-right font-black tabular-nums text-violet-900`}>
                          {vnd(b.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 sm:px-8">
              <p className="text-xs font-semibold text-slate-500">{recentBookings.length} buổi hiển thị</p>
              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-700 transition-colors hover:text-violet-900"
              >
                Xem tất cả lịch hẹn
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
