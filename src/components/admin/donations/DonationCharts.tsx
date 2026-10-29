/** Chart pieces shared by the dashboard home and the analytics page (data: GET /donations/stats). */
import type { DonationStats, TargetKind } from "@/data/api/donationsAdminApi";
import { formatMoney, formatMonth, formatNumber } from "@/lib/donationDisplay";

export const TARGET_LABEL: Record<TargetKind, { ar: string; en: string; arPlural: string; enPlural: string }> = {
  program: { ar: "برنامج", en: "Program", arPlural: "البرامج", enPlural: "programs" },
  project: { ar: "مشروع", en: "Project", arPlural: "المشاريع", enPlural: "projects" },
  campaign: { ar: "حملة", en: "Campaign", arPlural: "الحملات", enPlural: "campaigns" },
  case: { ar: "حالة", en: "Case", arPlural: "الحالات", enPlural: "cases" },
};

const ALL_KINDS = Object.keys(TARGET_LABEL) as TargetKind[];

/** Top paid targets across programs, projects, campaigns and cases (from stats.by_target). */
export const TopTargets = ({
  stats, loading, lang, limit = 8, kinds = ALL_KINDS,
}: { stats?: DonationStats; loading: boolean; lang: "ar" | "en"; limit?: number; kinds?: TargetKind[] }) => {
  if (loading) return <div className="h-[260px] animate-pulse rounded-xl bg-muted" />;
  const rows = kinds
    .flatMap((kind) => (stats?.by_target?.[kind] ?? []).map((t) => ({ ...t, kind })))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
  if (!rows.length) {
    return <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">{lang === "ar" ? "لا توجد تبرعات مدفوعة بعد" : "No paid donations yet"}</div>;
  }
  const max = rows[0].amount || 1;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={`${r.kind}-${r.id}`} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-bold">
              <span className="me-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{TARGET_LABEL[r.kind][lang]}</span>
              {r.name}
            </span>
            <span className="shrink-0 font-black tabular-nums text-primary">{formatMoney(r.amount, lang)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, (r.amount / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export const MonthTooltip = ({ active, payload, lang }: { active?: boolean; payload?: Array<{ payload: { month: string; value: number; count: number } }>; lang: "ar" | "en" }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-xl border border-border/70 bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="font-bold text-muted-foreground">{formatMonth(p.month, lang)}</div>
      <div className="mt-0.5 text-sm font-black tabular-nums text-primary">{formatMoney(p.value, lang)}</div>
      <div className="text-[11px] text-muted-foreground">{lang === "ar" ? `${formatNumber(p.count, lang)} تبرع مدفوع` : `${p.count} paid donations`}</div>
    </div>
  );
};

