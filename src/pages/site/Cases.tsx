import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { MapPin, AlertCircle, Heart, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { listPublicCases, listCategories, type CategoryRow, type Urgency } from "@/data/casesApi";

const URGENCY_LABEL: Record<Urgency, { ar: string; en: string; tone: string }> = {
  low:      { ar: "منخفض",  en: "Low",      tone: "bg-secondary/20 text-primary" },
  medium:   { ar: "متوسط",  en: "Medium",   tone: "bg-accent/15 text-accent" },
  high:     { ar: "عاجل",   en: "Urgent",   tone: "bg-destructive/15 text-destructive" },
  critical: { ar: "حرج",    en: "Critical", tone: "bg-destructive/20 text-destructive" },
};

const Cases = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") || "";
  const [cases, setCases] = useState<Awaited<ReturnType<typeof listPublicCases>>>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([listPublicCases({ categorySlug: activeCat || undefined }), listCategories()])
      .then(([cs, ks]) => {
        if (alive) {
          setCases(Array.isArray(cs) ? cs : []);
          setCats(Array.isArray(ks) ? ks : []);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [activeCat]);

  const setCat = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("cat", slug); else next.delete("cat");
    setParams(next, { replace: true });
  };

  const empty = !loading && !cases.length;
  const seoTitle = useMemo(() => isRTL ? "الحالات النشطة — تبرع لحالة محددة | مؤسسة اليسر" : "Active Cases — Donate to a specific case | Al-Yusr", [isRTL]);

  return (
    <PageLayout>
      <SEOHelmet
        title={seoTitle}
        description={isRTL ? "اختر حالة محددة من الحالات الموثّقة وادعمها مباشرة. كل حالة بحث ميداني وأرقام شفافة." : "Pick a verified case and donate directly. Every case is field-researched with transparent numbers."}
        path="/cases"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "الحالات" : "Cases", url: `${base}/cases` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "الحالات" : "Cases" }]} />
          </div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{isRTL ? "حالات بحاجة لدعمك الآن" : "Cases that need your support now"}</h1>
          <p className="mt-3 mx-auto max-w-2xl text-primary-foreground/85">{isRTL ? "كل حالة موثّقة بأبحاث ميدانية، أرقام شفافة، ومتابعة مستمرة حتى الإغلاق." : "Each case is field-verified, with transparent numbers and continuous follow-up until closed."}</p>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-wrap gap-1.5">
            <button onClick={() => setCat("")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${!activeCat ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{isRTL ? "كل البرامج" : "All"}</button>
            {cats.map(k => (
              <button key={k.slug} onClick={() => setCat(k.slug)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${activeCat === k.slug ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                {isRTL ? k.name_ar : k.name_en}
              </button>
            ))}
          </div>

          {loading && <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {empty && <p className="py-16 text-center text-muted-foreground">{isRTL ? "لا توجد حالات منشورة في هذه الفئة بعد." : "No published cases in this category yet."}</p>}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => {
              const need = Number(c.needed_amount) || 0;
              const raised = Number(c.raised_amount) || 0;
              const pct = need > 0 ? Math.min(100, Math.round((raised / need) * 100)) : 0;
              const u = URGENCY_LABEL[c.urgency as Urgency] ?? URGENCY_LABEL.medium;
              return (
                <article key={c.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  {c.cover_image_url && (
                    <Link to={`/cases/${c.ref_code}`} className="mb-3 block aspect-video overflow-hidden rounded-2xl bg-muted">
                      <img src={c.cover_image_url} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                    </Link>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${u.tone}`}>
                      <AlertCircle className="h-3 w-3" />{isRTL ? u.ar : u.en}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{c.ref_code}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-primary">
                    <Link to={`/cases/${c.ref_code}`} className="hover:text-secondary">{c.title}</Link>
                  </h2>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {c.city ?? c.governorate}
                  </div>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-orange-grad" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span dir="ltr" className="text-primary">{raised.toLocaleString()} / {need.toLocaleString()} EGP</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                  <Button asChild className="mt-4 h-11 w-full bg-orange-grad text-sm font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
                    <Link to={`/donate?case=${c.ref_code}`} data-source="cases" data-label={`case-${c.ref_code}`}>
                      <Heart className="h-4 w-4" />{isRTL ? "تبرع الآن" : "Donate now"}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="container mx-auto mt-12 mb-16 max-w-4xl px-4 text-center">
          <h2 className="text-lg font-black text-primary md:text-xl">{isRTL ? "كل حالة بتنتظرك دلوقتي" : "Every case is waiting for you"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{isRTL ? "ابدأ تبرعك أو اعرف برامج اليسر الكاملة في الدقهلية." : "Start your donation or explore Al-Yusr's full programs in Dakahlia."}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 w-full">
              <Link to="/donate" data-source="cases" data-label="cases-donate-cta"><Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link to="/about" data-source="cases" data-label="cases-about">{isRTL ? "ازاي بنوثّق الحالات؟" : "How we verify cases"}</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {isRTL ? (
              <>عندك حالة محتاجة دعم؟ <Link to="/contact" className="font-extrabold text-primary hover:text-secondary" data-source="cases-inline" data-label="inline-contact">قدّم بلاغ حالة</Link>.</>
            ) : (
              <>Know a case in need? <Link to="/contact" className="font-extrabold text-primary hover:text-secondary" data-source="cases-inline" data-label="inline-contact">Submit a case</Link>.</>
            )}
          </p>
        </div>
      </section>
    </PageLayout>
  );
};
export default Cases;
