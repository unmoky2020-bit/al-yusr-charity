import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { AdminLayout, StatCard, ChartCard } from "@/components/admin/AdminLayout";
import { formatNumberEN } from "@/lib/utils";
import { useLang } from "@/i18n/LangContext";
import { TrendingUp, CalendarRange, PieChart as PieIcon, Wallet, BarChart3, Users, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, donationsApiV1, programsApiV1 } from "@/data/laravelApi";

const methodLabels: Record<string, { ar: string; en: string }> = {
  paymob: { ar: "Paymob", en: "Paymob" },
  vodafone: { ar: "Vodafone Cash", en: "Vodafone Cash" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" },
  etisalat_cash: { ar: "اتصالات كاش", en: "Etisalat Cash" },
  orange_cash: { ar: "أورنج كاش", en: "Orange Cash" },
  we_pay: { ar: "WE Pay", en: "WE Pay" },
  instapay: { ar: "InstaPay", en: "InstaPay" },
  bank: { ar: "تحويل بنكي", en: "Bank transfer" },
  bank_misr: { ar: "بنك مصر", en: "Banque Misr" },
  bank_transfer: { ar: "تحويل بنكي", en: "Bank transfer" },
  cash: { ar: "نقدي", en: "Cash" },
  card: { ar: "بطاقة ائتمان", en: "Card" },
  visa: { ar: "فيزا / ماستركارد", en: "Visa / Mastercard" },
  other: { ar: "أخرى", en: "Other" },
};

const AdminAnalytics = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const isMobile = useIsMobile();
  const chartH = isMobile ? 220 : 260;
  const chartHSm = isMobile ? 200 : 240;
  const yWidth = isMobile ? 36 : 44;
  const fmtNum = (n: number) => formatNumberEN(Math.round(n));
  const fmtCompact = (n: number) => n >= 1_000_000 ? `${formatNumberEN((n/1_000_000).toFixed(1))}M` : n >= 1_000 ? `${formatNumberEN((n/1_000).toFixed(1))}K` : fmtNum(n);
  const fmtEGP = (n: number) => `${fmtNum(n)} ${isRTL ? "ج.م" : "EGP"}`;

  // 1. Live stats from Laravel API (/dashboard)
  const { data: laravelStats, isLoading: loadingStats } = useQuery({
    queryKey: ["laravel-analytics-stats"],
    queryFn: async () => {
      try {
        return await dashboardApi.getStats();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  // 2. Live donations from Laravel API (/donations)
  const { data: donations = [], isLoading: loadingDonations } = useQuery({
    queryKey: ["laravel-analytics-donations"],
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

  // 3. Live programs from Laravel API (/programs)
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["laravel-analytics-programs"],
    queryFn: async () => {
      try {
        const res = await programsApiV1.listAll();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  const isInitialLoading = (loadingStats && !laravelStats) || (loadingDonations && !donations.length);

  const ls = useMemo(() => {
    const raw = (laravelStats as any) || {};
    return (raw.statistics || raw.data?.statistics || raw.data || raw) as Record<string, any>;
  }, [laravelStats]);

  const total = Number(ls.total_donations ?? donations.reduce((s: number, d: any) => s + Number(d.amount || 0), 0));
  const countPaid = Number(ls.donations ?? donations.length);
  const avg = countPaid > 0 ? Math.round(total / countPaid) : 0;
  const donorsCount = Number(ls.donors ?? new Set(donations.map((d: any) => d.donor?.id || d.donor?.email || d.id)).size);

  // Real monthly trend from live donations
  const trend = useMemo(() => {
    const monthNamesAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const monthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const months = 9;
    const buckets: { key: string; name: string; donations: number; donors: number; count: number }[] = [];
    const donorsByMonth = new Map<string, Set<string>>();
    for (let i = months - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = dt.getMonth();
      const k = `${dt.getFullYear()}-${mIdx}`;
      buckets.push({
        key: k,
        name: isRTL ? monthNamesAr[mIdx] : monthNamesEn[mIdx],
        donations: 0,
        donors: 0,
        count: 0,
      });
      donorsByMonth.set(k, new Set());
    }
    if (Array.isArray(donations)) {
      for (const d of donations) {
        if (!d.created_at) continue;
        const dt = new Date(d.created_at);
        const k = `${dt.getFullYear()}-${dt.getMonth()}`;
        const b = buckets.find((x) => x.key === k);
        if (b) {
          b.donations += Number(d.amount || 0);
          b.count += 1;
          const donorKey = String(d.donor?.id || d.donor?.email || d.id);
          donorsByMonth.get(k)?.add(donorKey);
        }
      }
    }
    for (const b of buckets) {
      b.donors = donorsByMonth.get(b.key)?.size || 0;
    }
    return buckets;
  }, [donations, isRTL]);

  // Real daily trend (last 30 days) from live donations
  const daily = useMemo(() => {
    const now = new Date();
    const dayBuckets: { key: string; name: string; value: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      dayBuckets.push({
        key,
        name: `${dt.getDate()}/${dt.getMonth() + 1}`,
        value: 0,
        count: 0,
      });
    }
    if (Array.isArray(donations)) {
      for (const d of donations) {
        const key = (d.created_at || "").slice(0, 10);
        const b = dayBuckets.find((x) => x.key === key);
        if (b) {
          b.value += Number(d.amount || 0);
          b.count += 1;
        }
      }
    }
    return dayBuckets;
  }, [donations]);

  // Real program distribution from live donations
  const pie = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(donations)) {
      for (const d of donations) {
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
    const totalAmount = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    const palette = ["hsl(152 65% 18%)", "hsl(75 85% 50%)", "hsl(22 88% 58%)", "hsl(200 70% 50%)", "hsl(280 60% 55%)", "hsl(340 70% 55%)"];
    return Array.from(map.entries()).map(([name, val], i) => ({
      name,
      value: Math.round((val / totalAmount) * 100),
      rawAmount: val,
      color: palette[i % palette.length],
    }));
  }, [donations, isRTL]);

  // Real payment methods distribution from live donations
  const paymentMethods = useMemo(() => {
    const methodMap = new Map<string, number>();
    if (Array.isArray(donations)) {
      for (const d of donations) {
        const k = (d.payment_method || d.payment_method_details?.slug || "other").toLowerCase();
        methodMap.set(k, (methodMap.get(k) || 0) + 1);
      }
    }
    const totalOps = donations.length || 1;
    const methodPalette = ["hsl(152 65% 18%)", "hsl(75 85% 50%)", "hsl(22 88% 58%)", "hsl(200 70% 50%)", "hsl(280 60% 55%)"];
    return Array.from(methodMap.entries()).map(([mKey, count], i) => ({
      name: (methodLabels[mKey] || { ar: mKey, en: mKey })[lang],
      value: Math.round((count / totalOps) * 100),
      count,
      color: methodPalette[i % methodPalette.length],
    }));
  }, [donations, lang]);

  // Real program targets from live programs API
  const programProgress = useMemo(() => {
    const safePrograms = Array.isArray(programs) ? programs : [];
    const withTargets = safePrograms.filter((p: any) => Number(p.target_amount || 0) > 0);
    const methodPalette = ["hsl(152 65% 18%)", "hsl(75 85% 50%)", "hsl(22 88% 58%)", "hsl(200 70% 50%)", "hsl(280 60% 55%)"];
    return withTargets.map((p: any, i: number) => {
      const target = Number(p.target_amount || 0);
      let collected = Number(p.collected_amount || 0);
      if (collected === 0 && Array.isArray(donations)) {
        collected = donations
          .filter((d: any) => d.program_id === p.id || (typeof d.notes === "string" && d.notes.includes(p.name)))
          .reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
      }
      return {
        name: { ar: p.name_ar || p.name || "", en: p.name_en || p.name || "" },
        target,
        current: collected,
        color: methodPalette[i % methodPalette.length],
      };
    });
  }, [programs, donations]);

  return (
    <AdminLayout loading={isInitialLoading}>
      <div className="space-y-5">
        {/* KPIs — 2 per row on mobile (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent icon={Wallet} label={isRTL ? "إجمالي التبرعات" : "Total"} value={isInitialLoading ? "—" : fmtCompact(total)} sub={isRTL ? "ج.م — منذ البداية" : "EGP — all time"} />
          <StatCard icon={Target} label={isRTL ? "متوسط التبرع" : "Avg donation"} value={isInitialLoading ? "—" : fmtEGP(avg)} sub={isRTL ? "لكل عملية" : "per op"} />
          <StatCard icon={Users} label={isRTL ? "إجمالي المتبرعين" : "Donors"} value={isInitialLoading ? "—" : fmtNum(donorsCount)} sub={isRTL ? "متبرع فريد" : "unique"} />
          <StatCard icon={BarChart3} label={isRTL ? "عمليات مدفوعة" : "Paid ops"} value={isInitialLoading ? "—" : fmtNum(countPaid)} sub={isInitialLoading ? "—" : `${fmtNum(countPaid)} ${isRTL ? "إجمالي" : "total"}`} />
        </div>

        {/* Row 1 */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <ChartCard icon={TrendingUp} title={isRTL ? "نمو التبرعات الشهري" : "Monthly donations growth"} subtitle={isRTL ? "المبلغ الإجمالي" : "Total amount"}>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={chartH}>
                <AreaChart data={trend} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(75 85% 50%)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="hsl(75 85% 50%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" opacity={0.18} vertical={false} />
                  <XAxis dataKey="name" reversed={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickMargin={6} padding={{ left: 6, right: 6 }} />
                  <YAxis orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtCompact(Number(v))} axisLine={false} tickLine={false} width={yWidth} tickMargin={4} />
                  <Tooltip content={<TooltipBox isRTL={isRTL} fmt={fmtEGP} />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.15 }} />
                  <Area dataKey="donations" stroke="hsl(152 65% 18%)" strokeWidth={2.5} fill="url(#ag)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard icon={CalendarRange} title={isRTL ? "اتجاه التبرعات اليومي" : "Daily donations trend"} subtitle={isRTL ? "آخر 30 يومًا" : "Last 30 days"}>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={chartH}>
                <AreaChart data={daily} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(22 88% 58%)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="hsl(22 88% 58%)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" opacity={0.18} vertical={false} />
                  <XAxis dataKey="name" reversed={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={isMobile ? 5 : 3} axisLine={false} tickLine={false} tickMargin={6} padding={{ left: 6, right: 6 }} />
                  <YAxis orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fmtCompact(Number(v))} axisLine={false} tickLine={false} width={yWidth} tickMargin={4} />
                  <Tooltip content={<TooltipBox isRTL={isRTL} fmt={fmtEGP} />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.15 }} />
                  <Area dataKey="value" stroke="hsl(22 88% 58%)" strokeWidth={2} fill="url(#dg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Row 2 */}
        <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
          <ChartCard icon={PieIcon} title={isRTL ? "توزيع التبرعات" : "Donations distribution"} subtitle={isRTL ? "حسب البرنامج" : "by program"}>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={chartHSm}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" outerRadius={isMobile ? 74 : 86} innerRadius={isMobile ? 44 : 52} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>
                    {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip content={<TooltipBox isRTL={isRTL} suffix="%" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul dir={isRTL ? "rtl" : "ltr"} className="mt-2 grid grid-cols-1 gap-1.5">
              {pie.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border" style={{ background: p.color }} />
                    <span className="truncate font-semibold text-foreground">{p.name}</span>
                  </span>
                  <span className="shrink-0 font-extrabold tabular-nums text-primary">{p.value}%</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard title={lang === "ar" ? "طرق الدفع" : "Payment methods"} subtitle={lang === "ar" ? "حسب الطريقة" : "by method"}>
            <div dir={isRTL ? "rtl" : "ltr"} className="space-y-3 py-2">
              {paymentMethods.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">{lang === "ar" ? "لا توجد بيانات" : "No data yet"}</div>
              )}
              {paymentMethods.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{m.name}</span>
                    <span className="font-bold text-accent">{m.value}% · {m.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard icon={BarChart3} title={isRTL ? "عدد العمليات الشهرية" : "Monthly ops"} subtitle={isRTL ? "تبرعات مدفوعة" : "Paid donations"}>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={chartHSm}>
                <BarChart data={trend.map((m) => ({ name: m.name, count: m.count }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" opacity={0.18} vertical={false} />
                  <XAxis dataKey="name" reversed={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickMargin={6} padding={{ left: 6, right: 6 }} />
                  <YAxis orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={yWidth} tickMargin={4} />
                  <Tooltip content={<TooltipBox isRTL={isRTL} />} cursor={{ fill: "hsl(var(--primary) / 0.06)" }} />
                  <Bar dataKey="count" fill="hsl(152 65% 22%)" radius={[6, 6, 0, 0]} name={isRTL ? "عمليات" : "Ops"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Donors growth + Programs progress */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <ChartCard icon={Users} title={isRTL ? "نمو قاعدة المتبرعين" : "Donor base growth"} subtitle={isRTL ? "متبرعون شهريًا" : "Monthly donors"}>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={chartHSm}>
                <LineChart data={trend} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" opacity={0.18} vertical={false} />
                  <XAxis dataKey="name" reversed={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickMargin={6} padding={{ left: 6, right: 6 }} />
                  <YAxis orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={yWidth} tickMargin={4} />
                  <Tooltip content={<TooltipBox isRTL={isRTL} />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.15 }} />
                  <Line dataKey="donors" stroke="hsl(22 88% 58%)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard icon={Target} title={isRTL ? "إنجاز البرامج" : "Programs progress"} subtitle={isRTL ? "حسب الهدف المحدد للبرنامج" : "Versus target amount"}>
          <div className="grid gap-4 sm:grid-cols-2">
            {programProgress.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-muted-foreground">{lang === "ar" ? "لم يتم تحديد أهداف للبرامج بعد" : "No program targets set yet"}</div>
            )}
            {programProgress.map((p) => {
              const pct = Math.round((p.current / p.target) * 100);
              return (
                <div key={p.name.en}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">{p.name[lang]}</span>
                    <span className="font-black text-primary">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: p.color }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{formatNumberEN(p.current)} EGP</span>
                    <span>{lang === "ar" ? "من" : "of"} {formatNumberEN(p.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
};

/* Premium tooltip — matches AdminDashboard */
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
    <div dir={isRTL ? "rtl" : "ltr"} className="rounded-xl border border-border/70 bg-card/95 px-3 py-2 text-xs shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.4)] backdrop-blur">
      <div className="font-bold text-muted-foreground">{title}</div>
      <div className="mt-0.5 text-sm font-black tabular-nums text-primary">{text}</div>
    </div>
  );
};

export default AdminAnalytics;