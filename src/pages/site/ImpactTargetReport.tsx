import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink, Heart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  DistributionView, FinishedCaseView, HowWeDocument, ImpactComingSoon, NumbersLedger, PreviewBanner, WayBar,
} from "@/components/impact/ImpactBlocks";
import { useAuth } from "@/auth/AuthContext";
import { IMPACT_REPORT_PUBLIC } from "@/config/impact";
import { fetchImpactTarget, IMPACT_KINDS, type ImpactKind } from "@/data/api/impactApi";
import { formatServerImageUrl } from "@/data/laravelApi";
import { useLang } from "@/i18n/LangContext";
import { KIND_LABEL, egp, targetPagePath } from "@/lib/impactLabels";

/** Monthly paid money of the last 12 months as simple bars (no chart library). */
function MonthBars({ rows, lang }: { rows: { month: string; amount: number; count: number }[]; lang: "ar" | "en" }) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const label = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { month: "short" });
  const range = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" });
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label={rows.map((r) => `${label(r.month)}: ${egp(r.amount, lang)}`).join("، ")}>
        {rows.map((r) => (
          <div key={r.month} className="flex h-full flex-1 flex-col justify-end" title={`${label(r.month)} — ${egp(r.amount, lang)} (${r.count})`}>
            <div className="rounded-t-md bg-gradient-to-t from-primary to-secondary" style={{ height: `${Math.max(r.amount > 0 ? 4 : 0, (r.amount / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-center text-[10px] font-bold tabular-nums text-muted-foreground" aria-hidden>
        {rows.map((r) => <span key={r.month} className="flex-1">{r.month.slice(5)}</span>)}
      </div>
      {rows.length > 1 && (
        <p className="mt-2 text-center text-[11px] font-bold text-muted-foreground">
          {lang === "ar" ? "من" : "From"} {range(rows[0].month)} {lang === "ar" ? "لـ" : "to"} {range(rows[rows.length - 1].month)}
        </p>
      )}
    </div>
  );
}

/** One program / project / campaign / case report: its money, where its donations stand, its days and cases. */
export default function ImpactTargetReport() {
  const { kind = "", key = "" } = useParams<{ kind: string; key: string }>();
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user } = useAuth();
  const staff = !!user?.roles?.some((r) => r !== "donor");
  const visible = IMPACT_REPORT_PUBLIC || staff;
  const validKind = (IMPACT_KINDS as string[]).includes(kind) ? (kind as ImpactKind) : null;
  const q = useQuery({
    queryKey: ["impact-target", kind, key],
    queryFn: () => fetchImpactTarget(validKind!, key),
    enabled: visible && !!validKind && !!key,
    staleTime: 60_000,
    retry: (n, err) => (err as { status?: number })?.status !== 404 && n < 2,
  });
  const d = q.data;
  const name = d?.target.name ?? "";
  const page = d ? targetPagePath(d.target) : null;
  const Back = ar ? ArrowRight : ArrowLeft;

  return (
    <PageLayout>
      <SEOHelmet
        title={ar ? `تقرير أثر ${name || "اليسر"} — تبرعاتكم وصلت فين؟` : `${name || "Al-Yusr"} impact report`}
        description={ar ? `أرقام ${name}: التبرعات المدفوعة، وصلت لحد فين، أيام التوزيع بالصور، والحالات.` : `${name}: paid donations, delivery, distribution days and cases.`}
        path={`/impact/${kind}/${key}`}
        noindex={!IMPACT_REPORT_PUBLIC}
      />
      <div className="keep-flow">
      {!visible ? (
        <ImpactComingSoon lang={lang} />
      ) : !validKind || (q.error && (q.error as { status?: number }).status === 404) ? (
        <section className="container mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black text-primary">{ar ? "التقرير ده مش موجود" : "Report not found"}</h1>
          <Link to="/impact" className="mt-4 inline-flex items-center gap-1 text-sm font-black text-accent hover:underline"><Back className="h-4 w-4" />{ar ? "تقرير الأثر كله" : "Full impact report"}</Link>
        </section>
      ) : (
        <>
          {!IMPACT_REPORT_PUBLIC && <PreviewBanner lang={lang} />}
          <section className="relative overflow-hidden bg-primary text-primary-foreground">
            {d?.target.image && <img src={formatServerImageUrl(d.target.image) || d.target.image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/85 to-primary" aria-hidden />
            <div className="container relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
              <div className="text-primary-foreground/80">
                <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "تقرير الأثر" : "Impact report", href: "/impact" }, { name: name || "…" }]} />
              </div>
              {validKind && <span className="mt-8 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">{KIND_LABEL[validKind][lang]}</span>}
              <h1 className="mt-3 max-w-3xl text-balance text-3xl font-black leading-tight text-white sm:text-5xl">{name || (q.isLoading ? "…" : "")}</h1>
              {page && (
                <Link to={page} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white/80 hover:text-white hover:underline">
                  <ExternalLink className="h-4 w-4" />{ar ? "صفحته على الموقع" : "Its page"}
                </Link>
              )}
              <div className="mt-8">{d ? <NumbersLedger n={d.numbers} lang={lang} /> : <div className="h-28 animate-pulse rounded-2xl bg-white/10" />}</div>
            </div>
          </section>

          {q.error && (q.error as { status?: number }).status !== 404 && (
            <p className="container mx-auto mt-6 max-w-6xl px-4 text-center text-sm font-bold text-destructive">{ar ? "التقرير ما اتحملش. جرّب تاني بعد شوية." : "The report could not load."}</p>
          )}

          {d && (
            <div className="bg-background pb-24 md:pb-28">
              <section className="container mx-auto grid max-w-6xl gap-8 px-4 pt-12 sm:px-6 lg:grid-cols-2">
                <div>
                  <h2 className="mb-4 text-xl font-black text-primary">{ar ? "التبرعات وصلت لحد فين؟" : "Where do the donations stand?"}</h2>
                  <WayBar n={d.numbers} lang={lang} />
                </div>
                <div>
                  <h2 className="mb-4 text-xl font-black text-primary">{ar ? "التبرعات في آخر 12 شهر" : "Last 12 months"}</h2>
                  <MonthBars rows={d.monthly} lang={lang} />
                </div>
              </section>

              <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                <h2 className="mb-5 text-xl font-black text-primary">{ar ? "أيام التوزيع" : "Distribution days"}</h2>
                {d.distributions.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.distributions.map((x) => <DistributionView key={x.id} d={x} lang={lang} />)}</div>
                ) : (
                  <p className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm font-bold text-muted-foreground">{ar ? "لسه ما اتسجلش يوم توزيع هنا." : "No distribution day recorded here yet."}</p>
                )}
              </section>

              {d.cases.length > 0 && (
                <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                  <h2 className="mb-5 text-xl font-black text-primary">{validKind === "case" ? (ar ? "ملف الحالة" : "The case") : ar ? "الحالات" : "Cases"}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.cases.map((c) => <FinishedCaseView key={c.code} c={c} lang={lang} />)}</div>
                </section>
              )}

              <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                <HowWeDocument lang={lang} />
                <div className="mt-8 flex flex-wrap gap-3">
                  {page && <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta"><Link to={page}><Heart className="h-5 w-5" />{ar ? "تبرع هنا" : "Give here"}</Link></Button>}
                  <Button asChild size="lg" variant="outline"><Link to="/impact"><Back className="h-5 w-5" />{ar ? "تقرير الأثر كله" : "Full impact report"}</Link></Button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
      </div>
    </PageLayout>
  );
}
