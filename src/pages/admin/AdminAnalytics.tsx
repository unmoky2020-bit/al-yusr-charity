import { UiSelect } from "@/components/common/UiSelect";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, BarChart3, CreditCard, FolderHeart, RefreshCw, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { AdminLayout, StatCard, ChartCard } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { donationsAdminApi, filtersFromSearch, filtersToParams, type DonationFilters, type TargetKind } from "@/data/api/donationsAdminApi";
import { MonthTooltip, TARGET_LABEL, TopTargets } from "@/components/admin/donations/DonationCharts";
import { donationStatusName, formatCompact, formatMoney, formatMonth, formatNumber } from "@/lib/donationDisplay";

const selectCls = "h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold";
/** Filters this page offers (all applied by GET /donations/stats). */
const PAGE_KEYS: (keyof DonationFilters)[] = ["from", "to", "target", "channel"];
const STATUS_ORDER = ["paid", "pending", "failed", "refunded", "cancelled"];

/**
 * Donation analytics. Every figure comes from GET /donations/stats with the filters below; nothing is
 * estimated in the browser, and figures the backend does not record are not shown.
 */
const AdminAnalytics = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [sp, setSp] = useSearchParams();

  const filters = useMemo(() => {
    const all = filtersFromSearch(sp);
    return Object.fromEntries(PAGE_KEYS.filter((k) => all[k]).map((k) => [k, all[k]])) as DonationFilters;
  }, [sp]);
  const setFilter = (patch: Partial<DonationFilters>) => setSp(filtersToParams({ ...filters, ...patch }), { replace: true });

  const q = useQuery({
    queryKey: ["admin-donations", "stats", filters],
    queryFn: () => donationsAdminApi.stats(filters),
    placeholderData: keepPreviousData,
  });
  const s = q.data;
  const dash = "—";
  const monthly = (s?.monthly ?? []).map((m) => ({ name: formatMonth(m.month, lang, false), month: m.month, value: m.amount, count: m.count }));
  const statuses = STATUS_ORDER.filter((k) => s?.by_status?.[k]);
  const statusTotal = statuses.reduce((n, k) => n + (s?.by_status?.[k]?.count ?? 0), 0) || 1;
  const channelTotal = (s?.by_channel.gateway.amount ?? 0) + (s?.by_channel.manual.amount ?? 0) || 1;
  const kindsShown: TargetKind[] = filters.target ? [filters.target] : ["program", "project", "campaign", "case"];

  return (
    <AdminLayout>
      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            <span>{isRTL ? "من تاريخ" : "From"}</span>
            <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilter({ from: e.target.value })} className="h-9 w-40 text-xs" />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            <span>{isRTL ? "إلى تاريخ" : "To"}</span>
            <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilter({ to: e.target.value })} className="h-9 w-40 text-xs" />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            <span>{isRTL ? "الجهة" : "Target"}</span>
            <UiSelect className={`${selectCls} block`} value={filters.target ?? ""} onChange={(e) => setFilter({ target: (e.target.value || undefined) as TargetKind | undefined })}>
              <option value="">{isRTL ? "كل الجهات" : "Any target"}</option>
              {(Object.keys(TARGET_LABEL) as TargetKind[]).map((k) => <option key={k} value={k}>{TARGET_LABEL[k][lang]}</option>)}
            </UiSelect>
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            <span>{isRTL ? "القناة" : "Channel"}</span>
            <UiSelect className={`${selectCls} block`} value={filters.channel ?? ""} onChange={(e) => setFilter({ channel: (e.target.value || undefined) as DonationFilters["channel"] })}>
              <option value="">{isRTL ? "أونلاين ويدوي" : "Online & manual"}</option>
              <option value="gateway">{isRTL ? "أونلاين (بوابة دفع)" : "Online (gateway)"}</option>
              <option value="manual">{isRTL ? "يدوي" : "Manual"}</option>
            </UiSelect>
          </label>
          {Object.keys(filters).length > 0 && (
            <Button size="sm" variant="outline" className="h-9 gap-1 text-xs font-bold" onClick={() => setSp({}, { replace: true })}>
              <RotateCcw className="h-3.5 w-3.5" /> {isRTL ? "مسح" : "Clear"}
            </Button>
          )}
          <span className="ms-auto flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            {q.isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
            {isRTL ? "المبالغ = التبرعات المدفوعة فقط" : "Amounts = paid donations only"}
          </span>
        </div>

        {q.isError && (
          <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" /> {isRTL ? "تعذر تحميل الإحصائيات من السيرفر." : "Could not load statistics."}
          </p>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent icon={Wallet} label={isRTL ? "المبلغ المستلم" : "Received"} value={s ? formatMoney(s.paid.amount, lang) : dash}
            sub={s ? (isRTL ? `${formatNumber(s.paid.count, lang)} تبرع مدفوع` : `${s.paid.count} paid donations`) : undefined} />
          <StatCard icon={BarChart3} label={isRTL ? "متوسط التبرع" : "Average donation"} value={s ? formatMoney(s.paid.average, lang) : dash}
            sub={s ? (isRTL ? `${formatNumber(s.paid.donors, lang)} متبرع دفعوا` : `${s.paid.donors} paying donors`) : undefined} />
          <StatCard icon={TrendingUp} label={isRTL ? "نسبة نجاح الدفع" : "Success rate"} value={s ? (s.success_rate == null ? dash : `${formatNumber(s.success_rate, lang)}%`) : dash}
            sub={isRTL ? "مدفوع ÷ (مدفوع + فاشل)" : "paid ÷ (paid + failed)"} />
          <StatCard icon={CreditCard} label={isRTL ? "كل العمليات" : "All operations"} value={s ? formatNumber(s.total_count, lang) : dash}
            sub={isRTL ? "بكل حالاتها ضمن الفلتر" : "any status, within filter"} />
        </div>

        {/* Monthly trend */}
        <ChartCard icon={TrendingUp} title={isRTL ? "التبرعات المدفوعة شهرياً" : "Paid donations per month"}
          subtitle={isRTL ? "آخر 12 شهر — الأعمدة: المبلغ، الخط: عدد التبرعات (فلتر التاريخ مش بيأثر على الرسم ده)" : "Last 12 months — bars: amount, line: count (the date filter does not apply here)"}>
          {q.isLoading ? <div className="h-[280px] animate-pulse rounded-xl bg-muted" /> : (
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" opacity={0.16} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} reversed={isRTL} />
                  <YAxis yAxisId="amount" orientation={isRTL ? "right" : "left"} tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(Number(v), lang)} axisLine={false} tickLine={false} width={52} />
                  <YAxis yAxisId="count" orientation={isRTL ? "left" : "right"} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<MonthTooltip lang={lang} />} />
                  <Bar yAxisId="amount" dataKey="value" fill="hsl(152 65% 28%)" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="count" type="monotone" dataKey="count" stroke="hsl(22 88% 58%)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Status breakdown */}
          <ChartCard icon={BarChart3} title={isRTL ? "العمليات حسب الحالة" : "Operations by status"} subtitle={isRTL ? "عدد وقيمة كل حالة" : "Count and value per status"}>
            {q.isLoading ? <div className="h-[180px] animate-pulse rounded-xl bg-muted" /> : statuses.length === 0 ? (
              <Empty lang={lang} />
            ) : (
              <ul className="space-y-3">
                {statuses.map((k) => {
                  const row = s!.by_status[k]!;
                  return (
                    <li key={k} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{donationStatusName(k, lang)}</span>
                        <span className="tabular-nums text-muted-foreground">{formatNumber(row.count, lang)} · {formatMoney(row.amount, lang)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(row.count / statusTotal) * 100}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ChartCard>

          {/* Channel */}
          <ChartCard icon={CreditCard} title={isRTL ? "المستلم حسب القناة" : "Received by channel"} subtitle={isRTL ? "أونلاين (بوابة دفع) مقابل يدوي (تحويل/محفظة/مندوب)" : "Online gateway vs manual"}>
            {q.isLoading ? <div className="h-[180px] animate-pulse rounded-xl bg-muted" /> : !s ? <Empty lang={lang} /> : (
              <ul className="space-y-3">
                {(["gateway", "manual"] as const).map((k) => (
                  <li key={k} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{k === "gateway" ? (isRTL ? "أونلاين" : "Online") : isRTL ? "يدوي" : "Manual"}</span>
                      <span className="tabular-nums text-muted-foreground">{formatNumber(s.by_channel[k].count, lang)} · {formatMoney(s.by_channel[k].amount, lang)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-secondary" style={{ width: `${(s.by_channel[k].amount / channelTotal) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>

        {/* By payment method */}
        <ChartCard icon={CreditCard} title={isRTL ? "حسب طريقة الدفع" : "By payment method"} subtitle={isRTL ? "كل العمليات، المدفوع منها، والمبلغ المستلم" : "All operations, paid ones, and received amount"}>
          {q.isLoading ? <div className="h-[160px] animate-pulse rounded-xl bg-muted" /> : !s?.by_method.length ? <Empty lang={lang} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[11px] text-muted-foreground">
                  <tr className="border-b border-border">
                    {[isRTL ? "طريقة الدفع" : "Method", isRTL ? "كل العمليات" : "Operations", isRTL ? "مدفوع" : "Paid", isRTL ? "نسبة المدفوع" : "Paid %", isRTL ? "المبلغ المستلم" : "Received"].map((h) => (
                      <th key={h} className="px-3 py-2 text-start font-black">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.by_method.map((m) => (
                    <tr key={String(m.payment_method_id)} className="border-b border-border/50">
                      <td className="px-3 py-2 font-bold">{isRTL ? m.name_ar : m.name_en || m.name_ar}</td>
                      <td className="px-3 py-2 tabular-nums">{formatNumber(m.count, lang)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatNumber(m.paid_count, lang)}</td>
                      <td className="px-3 py-2 tabular-nums">{m.count ? `${formatNumber((m.paid_count / m.count) * 100, lang)}%` : dash}</td>
                      <td className="px-3 py-2 font-black tabular-nums text-primary">{formatMoney(m.paid_amount, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* Top targets per kind */}
        <div className={`grid gap-4 ${kindsShown.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {kindsShown.map((kind) => (
            <ChartCard key={kind} icon={FolderHeart} title={isRTL ? `أعلى ${TARGET_LABEL[kind].arPlural} استلاماً` : `Top ${TARGET_LABEL[kind].enPlural}`}
              subtitle={isRTL ? "أعلى 10 حسب المبلغ المدفوع" : "Top 10 by paid amount"}>
              <TopTargets stats={s} loading={q.isLoading} lang={lang} kinds={[kind]} limit={10} />
            </ChartCard>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {isRTL
            ? "مش متاح من السيرفر حالياً: التبرعات اليومية، عدد المتبرعين لكل شهر، ومصدر الزيارة (UTM) — عشان كده مش معروضين بدل ما يتحسبوا تقريبياً."
            : "Not recorded by the server yet: daily donations, donors per month and traffic source (UTM) — so they are not shown rather than estimated."}
        </p>
      </div>
    </AdminLayout>
  );
};

const Empty = ({ lang }: { lang: "ar" | "en" }) => (
  <div className="flex h-[140px] items-center justify-center text-xs text-muted-foreground">{lang === "ar" ? "لا توجد بيانات ضمن الفلتر" : "No data within the filter"}</div>
);

export default AdminAnalytics;
