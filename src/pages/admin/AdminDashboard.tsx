import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  Activity, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FolderHeart, HeartHandshake, Layers, RefreshCw, TrendingUp, Users, Wallet,
} from "lucide-react";
import { AdminLayout, StatCard, ChartCard } from "@/components/admin/AdminLayout";
import { useAdminNav, type NavItem } from "@/components/admin/adminNav";
import { WelcomeCard } from "@/components/admin/home/WelcomeCard";
import { LatestNotificationsCard } from "@/components/admin/home/LatestNotificationsCard";
import { EditorPostsCard } from "@/components/admin/home/EditorPostsCard";
import { SECTION_HINTS, pickRoleHome } from "@/components/admin/home/roleHome";
import { MyFollowedCases } from "@/components/admin/cases/transparency/MyFollowedCases";
import { FormSkeleton } from "@/components/common/ContentSkeletons";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LangContext";
import { donationsAdminApi } from "@/data/api/donationsAdminApi";
import { MonthTooltip, TopTargets } from "@/components/admin/donations/DonationCharts";
import { DonationCard, DonationCardsState } from "@/components/admin/donations/DonationCard";
import {
  donationMethodLabel, donationStatusLabel, donationStatusTone, formatCompact, formatDateTime, formatMoney, formatMonth, formatNumber,
} from "@/lib/donationDisplay";

const REFRESH_MS = 60_000;

/**
 * Dashboard home. Accounts that may see donations get the money overview; everyone else (a content
 * editor, a volunteer) gets the sections they work in — never the donation figures.
 */
const AdminDashboard = () => {
  const { user, access } = useAuth();
  const isTeamWithServerAccess = !!user?.roles.some((r) => r === "editor" || r === "case_manager");
  // Wait for the account's server permissions before choosing (no flash of donation figures).
  if (isTeamWithServerAccess && access === undefined) {
    return <AdminLayout><FormSkeleton sections={2} /></AdminLayout>;
  }
  const canSeeDonations = access
    ? access.superAdmin || access.permissions.includes("donations.view")
    : !!user?.roles.some((r) => r === "admin" || r === "case_manager");
  return canSeeDonations ? <DonationsOverview /> : <TeamHome />;
};

/** Greeting, role and the role's most used actions (only those the account may open). */
function useHomeIntro() {
  const { lang } = useLang();
  const { user, access } = useAuth();
  const { roleKey, navGroups } = useAdminNav();
  const sections = new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)));
  const role = pickRoleHome(roleKey);
  return {
    lang,
    roleKey,
    navGroups,
    name: user?.name ?? "",
    roleLabel: roleKey === "admin" && access?.superAdmin ? (lang === "ar" ? "مدير عام" : "Super admin") : role.label[lang],
    note: role.note[lang],
    actions: role.actions.filter((a) => sections.has(a.section)).map((a) => ({ to: a.to, label: a.label[lang], icon: a.icon, primary: a.primary })),
  };
}

/** Home of the accounts that don't see donations (content editors, delegates, volunteers). */
const TeamHome = () => {
  const { lang, roleKey, navGroups, ...intro } = useHomeIntro();
  const isRTL = lang === "ar";
  const items = navGroups.flatMap((g) => g.items).filter((i) => i.href !== "/admin");
  return (
    <AdminLayout>
      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <WelcomeCard lang={lang} {...intro} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-start">
          <div className="min-w-0 space-y-5">
            {items.some((i) => i.href === "/admin/blog") && <EditorPostsCard lang={lang} />}
            {roleKey !== "editor" && <MyFollowedCases limit={4} />}
            <SectionsGrid items={items} lang={lang} />
          </div>
          <LatestNotificationsCard lang={lang} />
        </div>
      </div>
    </AdminLayout>
  );
};

/** «أقسامك»: every section the account may open, with one line on what is inside. */
const SectionsGrid = ({ items, lang }: { items: NavItem[]; lang: "ar" | "en" }) => {
  const Go = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <section>
      <h3 className="mb-3 text-sm font-black text-primary">{lang === "ar" ? "أقسامك" : "Your sections"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <Link
            key={i.href}
            to={i.href}
            className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/60 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary transition group-hover:bg-secondary">
              <i.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-primary">{i[lang]}</span>
              {SECTION_HINTS[i.href] && <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">{SECTION_HINTS[i.href][lang]}</span>}
            </span>
            <Go className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
};

/**
 * Money overview. Counts from GET /dashboard, money from GET /donations/stats (paid only), latest rows from
 * GET /donations — nothing is summed in the browser.
 */
const DonationsOverview = () => {
  const { lang, roleKey: _roleKey, navGroups: _navGroups, ...intro } = useHomeIntro();
  const isRTL = lang === "ar";

  const countsQ = useQuery({ queryKey: ["admin-dashboard", "counts"], queryFn: donationsAdminApi.dashboard, refetchInterval: REFRESH_MS });
  const statsQ = useQuery({ queryKey: ["admin-donations", "stats", {}], queryFn: () => donationsAdminApi.stats({}), refetchInterval: REFRESH_MS });
  const latestQ = useQuery({
    queryKey: ["admin-donations", "list", {}, 1, 8],
    queryFn: () => donationsAdminApi.list({}, 1, 8),
    refetchInterval: REFRESH_MS,
  });

  const c = countsQ.data;
  const s = statsQ.data;
  const dash = "—";
  const pending = s?.by_status?.pending;
  const fetching = countsQ.isFetching || statsQ.isFetching || latestQ.isFetching;
  const monthly = (s?.monthly ?? []).map((m) => ({ name: formatMonth(m.month, lang, false), month: m.month, value: m.amount, count: m.count }));

  return (
    <AdminLayout>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <WelcomeCard compact lang={lang} {...intro} />
        <div className="-mb-3 flex items-center justify-end gap-2 text-[11px] font-bold text-muted-foreground">
          {fetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />}
          {isRTL ? "المبالغ = التبرعات المدفوعة فقط" : "Amounts = paid donations only"}
        </div>

        {(countsQ.isError || statsQ.isError) && (
          <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {isRTL ? "تعذر تحميل جزء من الأرقام من السيرفر." : "Some figures could not be loaded from the server."}
          </p>
        )}

        {/* Money & donations */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard accent icon={Wallet} label={isRTL ? "المبلغ المستلم" : "Received"}
            value={s ? formatMoney(s.paid.amount, lang) : dash}
            sub={s ? (isRTL ? `من ${formatNumber(s.paid.count, lang)} تبرع مدفوع` : `from ${s.paid.count} paid donations`) : undefined} />
          <StatCard icon={CheckCircle2} label={isRTL ? "متوسط التبرع" : "Average donation"}
            value={s ? formatMoney(s.paid.average, lang) : dash}
            sub={s ? (isRTL ? `${formatNumber(s.paid.donors, lang)} متبرع دفعوا` : `${s.paid.donors} paying donors`) : undefined} />
          <StatCard icon={Activity} label={isRTL ? "تبرعات معلقة" : "Pending donations"}
            value={pending ? formatNumber(pending.count, lang) : s ? formatNumber(0, lang) : dash}
            sub={pending ? (isRTL ? `بقيمة ${formatMoney(pending.amount, lang)} — لسه ما اتدفعتش` : `worth ${formatMoney(pending.amount, lang)} — not received yet`) : undefined} />
          <StatCard icon={TrendingUp} label={isRTL ? "نسبة نجاح الدفع" : "Payment success rate"}
            value={s ? (s.success_rate == null ? dash : `${formatNumber(s.success_rate, lang)}%`) : dash}
            sub={s ? (isRTL ? `${formatNumber(s.by_status?.failed?.count ?? 0, lang)} عملية فاشلة` : `${s.by_status?.failed?.count ?? 0} failed`) : undefined} />
        </div>

        <MyFollowedCases limit={3} />

        {/* Content & people — each figure once, with its own label */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat icon={FolderHeart} label={isRTL ? "برامج نشطة" : "Active programs"} value={c ? `${formatNumber(c.active_programs, lang)} / ${formatNumber(c.programs, lang)}` : dash} />
          <MiniStat icon={Layers} label={isRTL ? "مشاريع نشطة" : "Active projects"} value={c ? `${formatNumber(c.active_projects, lang)} / ${formatNumber(c.projects, lang)}` : dash} />
          <MiniStat icon={HeartHandshake} label={isRTL ? "حملات نشطة" : "Active campaigns"} value={c ? `${formatNumber(c.active_campaigns, lang)} / ${formatNumber(c.campaigns, lang)}` : dash} />
          <MiniStat icon={CheckCircle2} label={isRTL ? "حالات منشورة / للمراجعة" : "Cases live / to review"} value={c ? `${formatNumber(c.approved_cases, lang)} / ${formatNumber(c.pending_cases, lang)}` : dash} />
          <MiniStat icon={Users} label={isRTL ? "متبرعون (كلهم / دفعوا)" : "Donors (all / paid)"} value={c ? `${formatNumber(c.donors, lang)} / ${formatNumber(c.paying_donors, lang)}` : dash} />
          <MiniStat icon={Users} label={isRTL ? "متطوعون (قيد المراجعة)" : "Volunteers (pending)"} value={c ? `${formatNumber(c.volunteers, lang)} (${formatNumber(c.pending_volunteers, lang)})` : dash} />
        </div>
        <p className="-mt-3 text-[11px] text-muted-foreground">{isRTL ? "الصيغة: نشط / الإجمالي" : "Format: active / total"}</p>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
          <div className="lg:col-span-3">
            <ChartCard title={isRTL ? "التبرعات المدفوعة شهرياً" : "Paid donations per month"} subtitle={isRTL ? "آخر 12 شهر — جنيه مصري" : "Last 12 months — EGP"} icon={TrendingUp}>
              {statsQ.isLoading ? (
                <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
              ) : (
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthly} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(75 85% 55%)" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="hsl(152 65% 18%)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" opacity={0.16} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCompact(Number(v), lang)} axisLine={false} tickLine={false} width={52} />
                      <Tooltip content={<MonthTooltip lang={lang} />} />
                      <Area type="monotone" dataKey="value" stroke="hsl(152 65% 22%)" strokeWidth={2.5} fill="url(#dgrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
          <div className="lg:col-span-2">
            <ChartCard title={isRTL ? "أكثر الجهات استلاماً" : "Top receiving targets"} subtitle={isRTL ? "المبالغ المدفوعة" : "Paid amounts"} icon={FolderHeart}>
              <TopTargets stats={s} loading={statsQ.isLoading} lang={lang} />
            </ChartCard>
          </div>
        </div>

        {/* Latest donations */}
        <div className="rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/60 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-primary md:text-base">{isRTL ? "آخر التبرعات" : "Latest donations"}</h3>
            <Link to="/admin/donations" className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/15">
              {isRTL ? "عرض الكل ←" : "View all →"}
            </Link>
          </div>
          {/* phones: cards; wider screens: the table */}
          <div className="space-y-2 md:hidden">
            <DonationCardsState lang={lang} loading={latestQ.isLoading} error={latestQ.isError} empty={latestQ.data?.rows.length === 0} />
            {latestQ.data?.rows.map((d) => <DonationCard key={d.id} d={d} lang={lang} />)}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="text-[11px] font-bold text-muted-foreground">
                <tr className="border-b border-border">
                  {[isRTL ? "رقم العملية" : "Reference", isRTL ? "المتبرع" : "Donor", isRTL ? "المبلغ" : "Amount", isRTL ? "طريقة الدفع" : "Method",
                    isRTL ? "الحالة" : "Status", isRTL ? "التاريخ" : "Date", ""].map((h, i) => <th key={i} className="px-3 py-3 text-start">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {latestQ.isLoading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>
                ))}
                {latestQ.isError && <tr><td colSpan={7} className="p-6 text-center text-sm font-bold text-destructive">{isRTL ? "تعذر تحميل التبرعات" : "Could not load donations"}</td></tr>}
                {latestQ.data?.rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">{isRTL ? "لا توجد تبرعات بعد" : "No donations yet"}</td></tr>}
                {latestQ.data?.rows.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="px-3 py-3 font-mono text-xs"><Link to={`/admin/donations/${d.id}`} className="text-accent hover:underline">{d.transaction_reference}</Link></td>
                    <td className="px-3 py-3 font-bold">{d.donor?.name || (isRTL ? "فاعل خير" : "Anonymous")}</td>
                    <td className="px-3 py-3 font-extrabold tabular-nums">{formatMoney(Number(d.amount), lang)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{donationMethodLabel(d, lang)}</td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${donationStatusTone(d.status, d.is_gateway)}`}>
                        {donationStatusLabel(d.status, d.is_gateway, lang)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatDateTime(d.created_at, lang)}</td>
                    <td className="px-3 py-3 text-end">
                      <Link to={`/admin/donations/${d.id}`} aria-label={isRTL ? "تفاصيل" : "Details"} className="inline-grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary">
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

const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="space-y-1 rounded-xl border border-border bg-card p-3 shadow-xs">
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
    <div className="text-base font-black tabular-nums text-foreground sm:text-lg">{value}</div>
  </div>
);

export default AdminDashboard;
