import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, ExternalLink, Wallet, CheckCircle2, FolderHeart, Briefcase, TrendingUp, PieChart as PieIcon,
  Users, UserCheck, ShieldCheck, HeartHandshake, Layers, RefreshCw
} from "lucide-react";
import { AdminLayout, StatCard, ChartCard } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, donationsApiV1 } from "@/data/laravelApi";

const AdminDashboard = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const fmtNum = (n: number) =>
    new Intl.NumberFormat(isRTL ? "ar-EG" : "en-US").format(Math.round(n));
  const fmtEGP = (n: number) => `${fmtNum(n)} ${isRTL ? "ج.م" : "EGP"}`;
  const fmtCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return fmtNum(n);
  };

  const formatEgyptDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(isRTL ? "ar-EG" : "en-US", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Live /dashboard stats from Laravel API
  const { data: laravelStats, isLoading: loadingStats, refetch: refetchStats, isFetching: fetchingStats } = useQuery({
    queryKey: ["laravel-dashboard-stats"],
    queryFn: async () => {
      try {
        return await dashboardApi.getStats();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  // Live /donations from Laravel API
  const { data: laravelDonations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ["laravel-dashboard-donations"],
    queryFn: async () => {
      try {
        const res = await donationsApiV1.listAll();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  const isLoading = loadingStats && !laravelStats;

  const totals = useMemo(() => {
    const raw = (laravelStats as any) || {};
    const ls = (raw.statistics || raw.data?.statistics || raw.data || raw) as Record<string, any>;
    const totalDonations = Number(ls.total_donations ?? 0);
    const countPaid = Number(ls.donations ?? 0);
    const donorsCount = Number(ls.donors ?? 0);
    const usersCount = Number(ls.users ?? 0);
    const activeProjects = Number(ls.active_projects ?? ls.projects ?? 0);
    const totalProjects = Number(ls.projects ?? 0);
    const activePrograms = Number(ls.active_programs ?? ls.programs ?? 0);
    const totalPrograms = Number(ls.programs ?? 0);
    const volunteers = Number(ls.volunteers ?? 0);
    const pendingVolunteers = Number(ls.pending_volunteers ?? 0);
    const approvedVolunteers = Number(ls.approved_volunteers ?? 0);
    const rejectedVolunteers = Number(ls.rejected_volunteers ?? 0);

    return {
      total: totalDonations,
      completed: countPaid,
      count: countPaid,
      donorsCount,
      usersCount,
      activeProjects,
      totalProjects,
      activePrograms,
      totalPrograms,
      volunteers,
      pendingVolunteers,
      approvedVolunteers,
      rejectedVolunteers,
    };
  }, [laravelStats]);

  // Live Laravel donations into recent list
  const recent = useMemo(() => {
    if (Array.isArray(laravelDonations) && laravelDonations.length > 0) {
      return laravelDonations.slice(0, 8).map((d: any) => ({
        id: d.id,
        ref_code: d.transaction_reference || `DON-${d.id}`,
        donor_name: d.donor?.name || (isRTL ? "فاعل خير" : "Anonymous Donor"),
        amount: Number(d.amount || 0),
        payment_method: d.payment_method || "visa",
        payment_status: d.status || "completed",
        created_at: d.created_at || new Date().toISOString(),
      }));
    }
    return [];
  }, [laravelDonations, isRTL]);

  // Real monthly trend from live donations
  const trendData = useMemo(() => {
    const monthNamesAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const monthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const months = 9;
    const buckets: { key: string; name: string; value: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = dt.getMonth();
      buckets.push({
        key: `${dt.getFullYear()}-${mIdx}`,
        name: isRTL ? monthNamesAr[mIdx] : monthNamesEn[mIdx],
        value: 0,
      });
    }
    if (Array.isArray(laravelDonations)) {
      for (const d of laravelDonations) {
        if (!d.created_at) continue;
        const dt = new Date(d.created_at);
        const k = `${dt.getFullYear()}-${dt.getMonth()}`;
        const b = buckets.find((x) => x.key === k);
        if (b) {
          b.value += Number(d.amount || 0);
        }
      }
    }
    return buckets;
  }, [laravelDonations, isRTL]);

  // Real program distribution from live donations
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(laravelDonations)) {
      for (const d of laravelDonations) {
        let prog = d.program?.name || d.program?.name_ar;
        if (!prog && typeof d.notes === "string" && d.notes.includes("Programs:")) {
          const m = d.notes.match(/Programs:\s*([^\[]+)/);
          if (m && m[1]) prog = m[1].trim();
        }
        if (!prog && d.payment_method_details?.name_ar) {
          prog = isRTL ? d.payment_method_details.name_ar : d.payment_method_details.name_en;
        }
        const label = prog || (isRTL ? "تبرع عام" : "General");
        map.set(label, (map.get(label) || 0) + Number(d.amount || 0));
      }
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    const palette = ["hsl(152 65% 18%)", "hsl(75 85% 50%)", "hsl(22 88% 58%)", "hsl(200 70% 50%)", "hsl(280 60% 55%)", "hsl(340 70% 55%)"];
    return Array.from(map.entries()).map(([name, val], i) => ({
      name,
      value: Math.round((val / total) * 100),
      rawAmount: val,
      color: palette[i % palette.length],
    }));
  }, [laravelDonations, isRTL]);

  const pieTotal = pieData.reduce((s, p) => s + p.value, 0);

  // Month-over-month delta for "Total donations" stat
  const trendDelta = useMemo(() => {
    if (trendData.length < 2) return null;
    const prev = trendData[trendData.length - 2].value;
    const curr = trendData[trendData.length - 1].value;
    if (!prev) return null;
    return {
      value: ((curr - prev) / prev) * 100,
      label: isRTL ? "مقارنة بالشهر السابق" : "vs previous month",
    };
  }, [trendData, isRTL]);
  const successRate = totals.count > 0 ? (totals.completed / totals.count) * 100 : 100;

  return (
    <AdminLayout>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* ── KPI grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label={isRTL ? "إجمالي التبرعات" : "Total donations"}
            value={isLoading ? "—" : fmtEGP(totals.total)}
            sub={isRTL ? "جميع الحالات — توثيق مباشر" : "All statuses — live sync"}
            icon={Wallet}
            delta={trendDelta}
            accent
          />
          <StatCard
            label={isRTL ? "عمليات التبرع" : "Donation operations"}
            value={isLoading ? "—" : fmtNum(totals.completed)}
            sub={`${isLoading ? "—" : fmtNum(totals.donorsCount)} ${isRTL ? "متبرع مسجل بالمنصة" : "registered donors"}`}
            icon={CheckCircle2}
          />
          <StatCard
            label={isRTL ? "البرامج والمشاريع" : "Programs & Projects"}
            value={isLoading ? "—" : `${fmtNum(totals.activePrograms)} ${isRTL ? "برنامج" : "programs"}`}
            sub={`${isLoading ? "—" : fmtNum(totals.activeProjects)} ${isRTL ? "مشاريع جارية معتمدة" : "active projects"}`}
            icon={FolderHeart}
          />
          <StatCard
            label={isRTL ? "المتطوعون والمستخدمون" : "Volunteers & Users"}
            value={isLoading ? "—" : `${fmtNum(totals.volunteers)} ${isRTL ? "متطوع" : "volunteers"}`}
            sub={`${isLoading ? "—" : totals.pendingVolunteers} ${isRTL ? `قيد المراجعة • ${totals.usersCount} مستخدم` : `pending • ${totals.usersCount} users`}`}
            icon={Users}
          />
        </div>

        {/* ── Secondary Quick Metrics Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "المستخدمون النشطون" : "Active Users"}</span>
            <div className="text-base sm:text-lg font-black text-foreground">{isLoading ? "—" : totals.usersCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "المتبرعون" : "Donors"}</span>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{isLoading ? "—" : totals.donorsCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "إجمالي البرامج" : "Total Programs"}</span>
            <div className="text-base sm:text-lg font-black text-foreground">{isLoading ? "—" : totals.totalPrograms}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "المشاريع النشطة" : "Active Projects"}</span>
            <div className="text-base sm:text-lg font-black text-foreground">{isLoading ? "—" : totals.activeProjects}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "متطوعون قيد المراجعة" : "Pending Volunteers"}</span>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">{isLoading ? "—" : totals.pendingVolunteers}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">{isRTL ? "نسبة نجاح العمليات" : "Success Rate"}</span>
            <div className="text-base sm:text-lg font-black text-primary">{isLoading ? "—" : `${Math.round(successRate)}%`}</div>
          </div>
        </div>

        {/* ── Charts ──────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
          <div className="lg:col-span-3">
            <ChartCard
              title={isRTL ? "نمو التبرعات" : "Donations growth"}
              subtitle={isRTL ? "آخر 9 أشهر — جنيه مصري" : "Last 9 months — EGP"}
              icon={TrendingUp}
              action={
                trendDelta && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums ${
                      trendDelta.value >= 0
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {trendDelta.value >= 0 ? "▲" : "▼"} {Math.abs(trendDelta.value).toFixed(1)}%
                  </span>
                )
              }
            >
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(75 85% 55%)" stopOpacity={0.55} />
                        <stop offset="60%" stopColor="hsl(152 65% 35%)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(152 65% 18%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" opacity={0.16} vertical={false} />
                    <XAxis
                      dataKey="name"
                      reversed={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      dy={4}
                      tickMargin={6}
                      padding={{ left: 6, right: 6 }}
                    />
                    <YAxis
                      orientation="left"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => fmtCompact(Number(v))}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                      tickMargin={4}
                    />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.15, strokeWidth: 1 }}
                      content={<TooltipBox isRTL={isRTL} fmt={fmtEGP} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(152 65% 22%)"
                      strokeWidth={2.5}
                      fill="url(#dgrad)"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="lg:col-span-2">
            <ChartCard
              title={isRTL ? "توزيع البرامج" : "Programs distribution"}
              subtitle={isRTL ? "نسبة % لكل برنامج" : "% per program"}
              icon={PieIcon}
            >
              {pieData.length === 0 && !loadingDonations ? (
                <div className="flex h-[260px] items-center justify-center text-center text-xs text-muted-foreground">
                  {isRTL ? "لا توجد بيانات بعد" : "No data yet"}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                  {/* Donut chart matching 3rd picture */}
                  <div className="relative h-[220px] w-full sm:w-[55%]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={92}
                          innerRadius={58}
                          paddingAngle={2}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        >
                          {pieData.map((p, i) => (
                            <Cell key={i} fill={p.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipBox isRTL={isRTL} suffix="%" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* centre label */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {isRTL ? "الإجمالي" : "Total"}
                      </div>
                      <div className="text-xl font-black tabular-nums text-primary">{pieTotal}%</div>
                    </div>
                  </div>
                  {/* Legend */}
                  <ul
                    dir={isRTL ? "rtl" : "ltr"}
                    className="grid w-full grid-cols-1 gap-1.5 sm:w-[45%]"
                  >
                    {pieData.slice(0, 6).map((p) => (
                      <li key={p.name} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border" style={{ background: p.color }} />
                          <span className="truncate text-[11.5px] font-semibold text-foreground">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-[11.5px] font-extrabold tabular-nums text-primary">{p.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ChartCard>
          </div>
        </div>

        {/* ── Recent donations table ─────────────────────────────── */}
        <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/60 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-primary md:text-base">
              <span className="me-2 inline-grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 align-middle">
                <Activity className="h-3.5 w-3.5" />
              </span>
              {isRTL ? "آخر التبرعات" : "Recent donations"}
            </h3>
            <Link to="/admin/donations" className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/15">
              {isRTL ? "عرض الكل ←" : "View all →"}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  {[isRTL ? "الكود" : "ID", isRTL ? "المتبرع" : "Donor",
                    isRTL ? "المبلغ" : "Amount", isRTL ? "القناة" : "Channel",
                    isRTL ? "الحالة" : "Status", isRTL ? "التاريخ والوقت" : "Date & Time", ""].map((h) => (
                    <th key={h} className="px-3 py-3 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingDonations && recent.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">{isRTL ? "جاري تحميل التبرعات المباشرة..." : "Loading live donations..."}</td></tr>
                )}
                {!loadingDonations && recent.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">{isRTL ? "لا توجد تبرعات بعد" : "No donations yet"}</td></tr>
                )}
                {recent.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 transition-colors hover:bg-muted/40">
                    <td className="px-3 py-3 font-mono text-xs">
                      <Link to={`/admin/donations/${d.id}`} className="text-accent hover:underline">{d.ref_code}</Link>
                    </td>
                    <td className="px-3 py-3 font-bold">{d.donor_name || "—"}</td>
                    <td className="px-3 py-3 font-extrabold tabular-nums">{fmtEGP(Number(d.amount))}</td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">{d.payment_method || "—"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={d.payment_status} lang={lang} />
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular-nums text-start text-xs font-medium" dir={isRTL ? "rtl" : "ltr"}>
                      {formatEgyptDateTime(d.created_at)}
                    </td>
                    <td className="px-3 py-3 text-end">
                      <Link to={`/admin/donations/${d.id}`} className="inline-grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" title={isRTL ? "تفاصيل" : "Details"}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

/* Premium tooltip used by both Area and Pie charts. */
const TooltipBox = ({
  active, payload, label, isRTL, fmt, suffix,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; payload?: { name?: string } }>;
  label?: string;
  isRTL: boolean;
  fmt?: (n: number) => string;
  suffix?: string;
}) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const title = label ?? p.payload?.name ?? p.name ?? "";
  const v = Number(p.value);
  const text = suffix ? `${v}${suffix}` : fmt ? fmt(v) : String(v);
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-xl border border-border/70 bg-card/95 px-3 py-2 text-xs shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.4)] backdrop-blur"
    >
      <div className="font-bold text-muted-foreground">{title}</div>
      <div className="mt-0.5 text-sm font-black tabular-nums text-primary">{text}</div>
    </div>
  );
};

export const StatusBadge = ({ status, lang }: { status: string; lang: "ar" | "en" }) => {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    completed: { ar: "مكتمل", en: "Completed", cls: "bg-secondary/30 text-primary" },
    paid:      { ar: "مكتمل", en: "Paid",      cls: "bg-secondary/30 text-primary" },
    pending: { ar: "قيد المراجعة", en: "Pending", cls: "bg-accent/20 text-accent" },
    failed: { ar: "فشل", en: "Failed", cls: "bg-destructive/15 text-destructive" },
    refunded: { ar: "مسترد", en: "Refunded", cls: "bg-muted text-muted-foreground" },
    active: { ar: "نشطة", en: "Active", cls: "bg-secondary/30 text-primary" },
    closed: { ar: "مغلقة", en: "Closed", cls: "bg-muted text-muted-foreground" },
    published: { ar: "منشور", en: "Published", cls: "bg-secondary/30 text-primary" },
    draft: { ar: "مسودة", en: "Draft", cls: "bg-muted text-muted-foreground" },
    planned: { ar: "مخطط", en: "Planned", cls: "bg-accent/20 text-accent" },
  };
  const m = map[status] || { ar: status, en: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${m.cls}`}>{m[lang]}</span>;
};

export default AdminDashboard;