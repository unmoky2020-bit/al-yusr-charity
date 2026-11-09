import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, RefreshCw, Search } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  DistributionView, FinishedCaseView, HowWeDocument, ImpactComingSoon, NumbersLedger, PreviewBanner, TargetCard, WayBar,
} from "@/components/impact/ImpactBlocks";
import { useAuth } from "@/auth/AuthContext";
import { IMPACT_REPORT_PUBLIC } from "@/config/impact";
import { fetchImpactOverview } from "@/data/api/impactApi";
import { useLang } from "@/i18n/LangContext";

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6 grid gap-2 border-b border-border pb-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-end md:gap-10">
      <h2 className="text-balance text-2xl font-black leading-tight text-primary md:text-3xl">{title}</h2>
      {sub && <p className="max-w-md text-sm leading-relaxed text-foreground/70">{sub}</p>}
    </div>
  );
}

/**
 * «تقرير الأثر» — where the donations went, built only from records: paid donations and their
 * delivery trail, distribution days, case files. No donor names anywhere. Team-only until
 * IMPACT_REPORT_PUBLIC is switched on (see src/config/impact.ts).
 */
export default function ImpactReport() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user } = useAuth();
  const staff = !!user?.roles?.some((r) => r !== "donor");
  const visible = IMPACT_REPORT_PUBLIC || staff;
  const q = useQuery({ queryKey: ["impact-overview"], queryFn: fetchImpactOverview, enabled: visible, staleTime: 60_000 });
  const d = q.data;

  return (
    <PageLayout>
      <SEOHelmet
        title={ar ? "تقرير الأثر | تبرعاتكم وصلت فين؟ — مؤسسة اليسر" : "Impact report | Where your donations went — Al-Yusr"}
        description={ar ? "تقرير بيتحدّث من سجلات اليسر: التبرعات المدفوعة، خطوات التسليم، أيام التوزيع بالصور، وملف كل حالة بالإيصالات." : "Built from Al-Yusr's records: paid donations, delivery steps, distribution days with photos, and each case's receipts."}
        path="/impact"
        noindex={!IMPACT_REPORT_PUBLIC}
      />
      <div className="keep-flow">
      {!visible ? (
        <ImpactComingSoon lang={lang} />
      ) : (
        <>
          {!IMPACT_REPORT_PUBLIC && <PreviewBanner lang={lang} />}
          <section className="relative overflow-hidden bg-primary text-primary-foreground">
            <div aria-hidden className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />
            <div className="container relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
              <div className="text-primary-foreground/80">
                <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "الشفافية" : "Trust", href: "/trust" }, { name: ar ? "تقرير الأثر" : "Impact report" }]} />
              </div>
              <h1 className="mt-8 max-w-3xl text-balance text-4xl font-black leading-[1.15] text-white sm:text-5xl">{ar ? "تبرعاتكم وصلت فين؟" : "Where did your donations go?"}</h1>
              <p className="mt-4 max-w-2xl leading-relaxed text-white/85 md:text-lg">
                {ar ? "التقرير ده بيتحدّث لوحده من سجلاتنا: كل تبرع مدفوع، وكل يوم توزيع، وكل بند اتصرف على حالة — بالأرقام والصور. مفيش رقم بيتكتب بإيد." : "This report updates itself from our records: every paid donation, every distribution day, every line spent on a case — with numbers and photos. Nothing is typed in by hand."}
              </p>
              {d?.updated_at && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/60">
                  <RefreshCw className="h-3.5 w-3.5" />{ar ? "آخر تحديث" : "Updated"} {new Date(d.updated_at).toLocaleString(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              <div className="mt-8">
                {d ? <NumbersLedger n={d.totals} lang={lang} /> : <div className="h-28 animate-pulse rounded-2xl bg-white/10" />}
              </div>
            </div>
          </section>

          {q.error && (
            <p className="container mx-auto mt-6 max-w-6xl px-4 text-center text-sm font-bold text-destructive">{ar ? "التقرير ما اتحملش. جرّب تاني بعد شوية." : "The report could not load. Try again shortly."}</p>
          )}

          {d && (
            <div className="bg-background pb-24 md:pb-28">
              <section className="container mx-auto max-w-6xl px-4 pt-12 sm:px-6">
                <Head title={ar ? "التبرعات وصلت لحد فين؟" : "Where do the donations stand?"} sub={ar ? `من ${d.totals.donations} تبرع مدفوع` : `Out of ${d.totals.donations} paid donations`} />
                <WayBar n={d.totals} lang={lang} />
              </section>

              {d.targets.length > 0 && (
                <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                  <Head title={ar ? "لكل برنامج وحملة" : "By program and campaign"} sub={ar ? "اضغط على أي واحد تشوف تقريره: الفلوس، أيام التوزيع، والحالات." : "Open any one for its own report."} />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {d.targets.map((t) => <TargetCard key={`${t.kind}-${t.id}`} t={t} lang={lang} />)}
                  </div>
                </section>
              )}

              <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                <Head title={ar ? "أيام التوزيع" : "Distribution days"} sub={ar ? "صور من الميدان — الوشوش مموّهة احتراماً للأسر." : "Photos from the field — faces blurred out of respect."} />
                {d.distributions.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.distributions.map((x) => <DistributionView key={x.id} d={x} lang={lang} />)}</div>
                ) : (
                  <p className="rounded-3xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm font-bold text-muted-foreground">{ar ? "أول أيام التوزيع هتظهر هنا بالصور والمكان وعدد الأسر." : "The first distribution days will appear here."}</p>
                )}
              </section>

              {d.finished_cases.length > 0 && (
                <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                  <Head title={ar ? "حالات اكتملت" : "Completed cases"} sub={ar ? "قبل وبعد، وكل جنيه اتصرف فين." : "Before and after, and where every pound went."} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.finished_cases.map((c) => <FinishedCaseView key={c.code} c={c} lang={lang} />)}</div>
                </section>
              )}

              <section className="container mx-auto max-w-6xl px-4 pt-14 sm:px-6">
                <Head title={ar ? "إزاي بنوثّق كل جنيه" : "How every pound is documented"} />
                <HowWeDocument lang={lang} />
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta"><Link to="/donate"><Heart className="h-5 w-5" />{ar ? "تبرع بثقة" : "Donate with confidence"}</Link></Button>
                  <Button asChild size="lg" variant="outline"><Link to="/donate/track"><Search className="h-5 w-5" />{ar ? "تابع تبرعك" : "Track your donation"}</Link></Button>
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
