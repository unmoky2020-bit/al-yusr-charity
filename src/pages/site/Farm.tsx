import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Beef, Wheat, ShieldCheck, Sprout, RefreshCw, Coins, CheckCircle2, Heart, MessageCircle, Truck, Scale, Leaf, Stethoscope, Package, Users, TrendingUp, type LucideIcon } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { useProjectPage } from "@/hooks/useProjectPage";
import FARM_DEFAULTS from "@/data/projectPages/farm";
import type { StatItem } from "@/data/campaignPages/types";
import farmHero from "@/assets/qurbani-cow-sheep.webp";
import imgQurbani from "@/assets/qurbani-meat-quality.webp";
import imgCattleTruck from "@/assets/field/qurbani-2024-cattle-truck.jpg";
import { WaqfCycle } from "@/components/campaigns/WaqfCycle";
import { PROJECT_KINDS } from "@/components/campaigns/ProjectKind";
import imgMeatTrays from "@/assets/yusr-qurbani-pricing.png";
import imgTakrimVan from "@/assets/qurbani-trusted-source.webp";
import { FieldConvoysGallery } from "@/components/sections/FieldConvoysGallery";

/**
 * /farm — the waqf farm (backend project `waqf`). Text comes from the project's `page_content`
 * (dashboard → المشاريع → المزرعة الوقفية → محتوى الصفحة) merged over src/data/projectPages/farm.ts;
 * the hero image, the waqf shares, linked cases and the FAQ category come from the project record.
 * Icons, links and layout stay in code, keyed by the content ids.
 */
const PROJECT_SLUG = "waqf";
const DONATE_WAQF = `/donate?project=${PROJECT_SLUG}`;

const WHY_ICONS: Record<string, LucideIcon> = { vaccinated: ShieldCheck, feed: Wheat, at_cost: Scale, delivery: Truck, sustainable: Leaf, local: Sprout };
const JOURNEY_ICONS: Record<string, LucideIcon> = { raise: Sprout, vet: Stethoscope, slaughter: ShieldCheck, pack: Package };
const IMPACT_ICONS: Record<string, LucideIcon> = { families: Beef, governorates: Truck, jobs: Users, middlemen: Leaf };
const LINK_HREFS: Record<string, string> = {
  qurbani_mansoura: "/qurbani/mansoura", odhya: "/programs/odhya", box: "/programs/box", zakat: "/programs/zakat", campaigns: "/campaigns", trust: "/trust",
};
const ALLOCATION_COLORS = ["bg-secondary", "bg-accent", "bg-primary", "bg-foreground/40"];
const TOP_STATS = ["meat_2025", "monthly", "local", "margin"];
const IMPACT_STATS = ["families", "governorates", "jobs", "middlemen"];

const Farm = () => {
  const { c, t, isAr: isRTL, project, stat, section } = useProjectPage(PROJECT_SLUG, FARM_DEFAULTS);
  const base = "https://elyusr.org";
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(isRTL ? "السلام عليكم، أريد معرفة تفاصيل المزرعة الوقفية والأضحية." : "Hi, I want to know more about the endowment farm and Qurbani.")}`;

  /** "4 طن", "100%", "1,200 أسرة". A stat with no number shows nothing. */
  const statText = (st?: StatItem) => {
    if (!st || st.value === null) return "";
    const unit = t(st.unit);
    const n = st.value.toLocaleString("en-US");
    return unit ? (unit.startsWith("%") ? `${n}${unit}` : `${n} ${unit}`) : n;
  };

  const heroImg = project?.image && project.image !== "/placeholder.svg" ? project.image : farmHero;
  const why = section("why");
  const cycle = section("cycle");
  const returns = section("cycle_returns");
  const qurbani = section("qurbani");
  const journey = section("journey");
  const impact = section("impact");
  const allocation = section("allocation");
  const packages = project?.packages ?? [];
  const serviceKind = PROJECT_KINDS.service;
  const impactKind = PROJECT_KINDS.impact;

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "مزارع اليسر الوقفية بالدقهلية | صك أضحية ولحوم بلدي بدون وسطاء — المنصورة" : "Al-Yusr Endowment Farm in Dakahlia | Qurbani & local meat, zero middlemen — Mansoura"}
        description={isRTL ? "توفّر مزارع اليسر الوقفية لحومًا بلدية طازجة وماشية محصّنة لصكوك الأضحية والمواسم الخيرية في المنصورة، ويُنمّي عائد إنتاجها الوقف ويموّل الخير." : "Al-Yusr's waqf farm in Dakahlia supplies fresh local meat and certified livestock for Qurbani and seasonal aid in Mansoura, and its income grows the waqf."}
        path="/farm"
        image={heroImg}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "مشاريعنا" : "Our projects", url: `${base}/projects` },
        { name: isRTL ? "المزرعة الوقفية" : "Endowment Farm", url: `${base}/farm` },
      ]} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "NGO"],
              "@id": `${base}/#org`,
              name: "Al-Yusr Charity Foundation",
              alternateName: "مؤسسة اليسر الخيرية",
              url: `${base}/`,
              logo: `${base}/icon-192.png`,
              areaServed: ["Dakahlia, Egypt", "Mansoura", "Mit Ghamr", "Talkha", "Belqas"],
              sameAs: ["https://www.facebook.com/alyusrcharity"],
            },
            {
              "@type": "FAQPage",
              mainEntity: c.faq.map((f) => ({ "@type": "Question", name: t(f.q), acceptedAnswer: { "@type": "Answer", text: t(f.a) } })),
            },
            {
              "@type": "Service",
              "@id": `${base}/farm#service`,
              serviceType: isRTL ? "صك أضحية ولحوم بلدي وقفية" : "Qurbani share & endowment local meat",
              provider: { "@id": `${base}/#org` },
              areaServed: [
                { "@type": "AdministrativeArea", name: isRTL ? "محافظة الدقهلية" : "Dakahlia Governorate" },
                { "@type": "City", name: isRTL ? "المنصورة" : "Mansoura" },
                { "@type": "City", name: isRTL ? "ميت غمر" : "Mit Ghamr" },
                { "@type": "City", name: isRTL ? "طلخا" : "Talkha" },
                { "@type": "AdministrativeArea", name: isRTL ? "محافظة كفر الشيخ" : "Kafr El Sheikh Governorate" },
              ],
              audience: { "@type": "Audience", audienceType: isRTL ? "أسر متعففة بالدقهلية" : "Underprivileged families in Dakahlia" },
            },
            {
              "@type": "HowTo",
              name: isRTL ? "كيف تحجز صك أضحية من مزارع اليسر الوقفية" : "How to reserve a Qurbani share from Al-Yusr endowment farm",
              step: (journey?.items ?? []).map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: t(s.title), text: t(s.desc) })),
            },
            {
              "@type": "WebPage",
              "@id": `${base}/farm#webpage`,
              url: `${base}/farm`,
              name: t(c.hero.title),
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", ".ai-answer"] },
            },
          ],
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg opacity-40" />
        <div className="container relative mx-auto px-4 py-12 md:py-24">
          <div className="flex justify-center text-primary-foreground/80 md:justify-start">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "مشاريعنا" : "Our projects", href: "/projects" }, { name: isRTL ? "المزرعة الوقفية" : "Endowment Farm" }]} />
          </div>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
                <Sprout className="h-3.5 w-3.5" /> {t(c.hero.eyebrow)}
              </span>
              <h1 className="mx-auto mt-4 max-w-xl text-3xl font-black leading-tight md:mx-0 md:text-5xl">
                {t(c.hero.title)}
                {t(c.hero.title2) && <span className="mt-2 block text-xl text-secondary md:text-3xl">{t(c.hero.title2)}</span>}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-primary-foreground/85 md:mx-0 md:text-lg">{t(c.hero.lead)}</p>
              {t(section("answer")?.lead) && (
                <p className="ai-answer mx-auto mt-3 max-w-xl text-sm text-primary-foreground/75 md:mx-0">{t(section("answer")?.lead)}</p>
              )}
              <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to="/qurbani"><Heart className="h-5 w-5" />{t(c.hero.donateLabel)}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to={DONATE_WAQF}><Sprout className="h-5 w-5" />{isRTL ? "ساهم في الوقف" : "Give to the waqf"}</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
              <img src={heroImg} alt={t(c.hero.title)} width={1600} height={900} className="relative aspect-[16/10] w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
          {TOP_STATS.map((id) => {
            const st = stat(id);
            if (!st) return null;
            return (
              <div key={id} className="text-center">
                <div className="font-mono text-3xl font-black text-secondary md:text-4xl">{statText(st)}</div>
                <div className="mt-1 text-xs font-extrabold text-primary-foreground/85 md:text-sm">{t(st.label)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Local SEO internal links */}
      {section("links") && (
        <section className="border-b border-border/40 bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-8 text-center">
            <h2 className="text-base font-black text-primary md:text-lg">{t(section("links")!.title)}</h2>
            <p className="mx-auto mt-1 max-w-2xl text-xs text-muted-foreground md:text-sm">{t(section("links")!.lead)}</p>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {section("links")!.items.filter((it) => LINK_HREFS[it.id]).map((it) => (
                <Link key={it.id} to={LINK_HREFS[it.id]} className="rounded-full border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition hover:border-secondary hover:bg-secondary/25">
                  {t(it.title)}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {why && (
        <section className="bg-background py-14 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black text-primary md:text-4xl">{t(why.title)}</h2>
              <p className="mt-3 text-muted-foreground md:text-lg">{t(why.lead)}</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {why.items.map((f) => {
                const I = WHY_ICONS[f.id] ?? Leaf;
                return (
                  <div key={f.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><I className="h-6 w-6" /></div>
                    <h3 className="mt-3 font-black text-primary">{t(f.title)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(f.desc)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How the waqf works (interactive cycle) + project type + give to the waqf itself */}
      <section className="border-t border-border/60 bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-primary">
              <RefreshCw className="h-3.5 w-3.5" /> {isRTL ? "كيف يعمل الوقف؟" : "How does the waqf work?"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{t(cycle?.title)}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">{t(cycle?.lead)}</p>
          </div>
          <div className="mt-10">
            <WaqfCycle
              steps={cycle?.items.map((s) => ({ title: t(s.title), body: t(s.desc) }))}
              returns={returns?.items.map((r) => t(r.title))}
            />
          </div>

          {/* Waqf shares: the project's donation packages, priced from the dashboard */}
          {packages.length > 0 && (
            <div className="mt-12">
              <h3 className="text-center text-xl font-black text-primary md:text-2xl">{t(section("packages")?.title)}</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((p) => (
                  <Link key={p.id} to={`${DONATE_WAQF}${p.apiId ? `&package=${p.apiId}` : ""}&amount=${p.price}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft transition hover:border-secondary hover:bg-secondary/5">
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-primary">{isRTL ? p.nameAr : p.nameEn}</span>
                      {(isRTL ? p.descAr : p.descEn) && <span className="block text-xs text-muted-foreground">{isRTL ? p.descAr : p.descEn}</span>}
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-black text-slate-950">{p.price.toLocaleString(isRTL ? "ar-EG" : "en-US")} {isRTL ? "ج.م" : "EGP"}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <aside className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6" aria-label={t(section("kind")?.title)}>
              <p className="text-xs font-black text-secondary">{t(section("kind")?.title)}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {[serviceKind, impactKind].map((kind) => {
                  const KIcon = kind.icon;
                  return (
                    <div key={kind.en} className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><KIcon className="h-5 w-5" /></span>
                      <div>
                        <h3 className="text-sm font-black text-primary sm:text-base">{isRTL ? kind.ar : kind.en}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{isRTL ? kind.descAr : kind.descEn}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t(section("kind")?.lead)}</p>
              <Link to="/projects#project-kinds" className="mt-3 inline-block text-xs font-bold text-secondary hover:underline">
                {isRTL ? "اعرف أكثر عن أنواع مشاريع اليسر" : "More about Al-Yusr project types"}
              </Link>
            </aside>
            <div className="flex flex-col justify-between rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
              <div>
                <Coins className="h-8 w-8 text-secondary" />
                <h3 className="mt-3 text-xl font-black md:text-2xl">{t(section("give")?.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">{t(section("give")?.lead)}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to={DONATE_WAQF}><Sprout className="h-4 w-4" />{isRTL ? "ساهم بسهم في الوقف" : "Give a waqf share"}</Link>
                </Button>
                <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" />{isRTL ? "اسأل عن المزرعة" : "Ask about the farm"}</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {qurbani && (
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">
                <Beef className="h-3.5 w-3.5" /> {isRTL ? "موسم الأضحى" : "Qurbani season"}
              </span>
              <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{t(qurbani.title)}</h2>
              <p className="mt-3 text-muted-foreground md:text-lg">{t(qurbani.lead)}</p>
              <ul className="mt-5 space-y-2 text-sm font-semibold text-foreground/85">
                {qurbani.items.map((x) => (
                  <li key={x.id} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" />{t(x.title)}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to="/qurbani"><Heart className="h-4 w-4" />{isRTL ? "احجز صكك الآن" : "Reserve your share"}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/programs">{isRTL ? "كل برامج اليسر" : "All Al-Yusr programs"}</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src={imgCattleTruck} alt={isRTL ? "عجول بلدي من مزرعة اليسر الوقفية في طريقها للذبح الشرعي" : "Local cattle from the Al-Yusr waqf farm on the way to Sharia slaughter"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
              <img src={imgMeatTrays} alt={isRTL ? "صكوك أضحية اليسر — وزن الصك 30 كجم لحم بلدي" : "Al-Yusr Qurbani shares — 30kg of fresh local meat per share"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
              <img src={imgQurbani} alt={isRTL ? "تجهيز اللحوم بإشراف بيطري" : "Meat prep under veterinary supervision"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
              <img src={imgTakrimVan} alt={isRTL ? "سيارة اليسر لتوصيل صكوك الأضحية لباب البيت" : "Al-Yusr van delivering Qurbani shares to homes"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
            </div>
          </div>
        </section>
      )}

      {journey && (
        <section className="bg-background py-14 md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black text-primary md:text-4xl">{t(journey.title)}</h2>
              <p className="mt-3 text-muted-foreground md:text-lg">{t(journey.lead)}</p>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {journey.items.map((s, i) => {
                const I = JOURNEY_ICONS[s.id] ?? Sprout;
                return (
                  <li key={s.id} className="relative rounded-3xl border border-border bg-card p-5 shadow-soft">
                    <span className="absolute -top-3 start-5 grid h-7 w-7 place-items-center rounded-full bg-secondary text-[12px] font-black text-primary shadow-soft">{i + 1}</span>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><I className="h-6 w-6" /></div>
                    <h3 className="mt-3 font-black text-primary">{t(s.title)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(s.desc)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {impact && (
        <section className="bg-primary py-14 text-primary-foreground md:py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
                <TrendingUp className="h-3.5 w-3.5" /> {isRTL ? "أثر الوقف" : "Endowment impact"}
              </span>
              <h2 className="mt-3 text-2xl font-black md:text-4xl">{t(impact.title)}</h2>
              <p className="mt-3 text-primary-foreground/85 md:text-lg">{t(impact.lead)}</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {IMPACT_STATS.map((id) => {
                const st = stat(id);
                if (!st) return null;
                const I = IMPACT_ICONS[id];
                return (
                  <div key={id} className="rounded-3xl border border-secondary/20 bg-primary-foreground/5 p-5 text-center backdrop-blur">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-secondary"><I className="h-6 w-6" /></div>
                    <div className="mt-3 font-mono text-2xl font-black text-secondary md:text-3xl">{statText(st)}</div>
                    <div className="mt-1 text-xs font-extrabold text-primary-foreground/85 md:text-sm">{t(st.label)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Hadith */}
      <section className="bg-[hsl(60_33%_97%)] py-14 md:py-20" aria-label={isRTL ? "حديث شريف" : "Hadith"}>
        <figure className="container relative mx-auto max-w-4xl px-4 text-center">
          <span aria-hidden className="block font-serif text-7xl leading-none text-secondary">❝</span>
          <p className="mt-2 text-sm font-black text-muted-foreground">{isRTL ? "أجر الزرع والغرس" : "The reward of planting"}</p>
          <blockquote className="mx-auto mt-3 max-w-3xl text-2xl font-black leading-[1.75] text-primary md:text-3xl md:leading-[1.7]">
            {isRTL ? `قال رسول الله ﷺ: «${t(c.hadith.text)}»` : `The Prophet ﷺ said: “${t(c.hadith.text)}”`}
          </blockquote>
          <figcaption className="mt-5 text-sm font-bold text-muted-foreground">{t(c.hadith.source)}</figcaption>
        </figure>
      </section>

      {allocation && (
        <section className="bg-background py-14 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
                <Scale className="h-3.5 w-3.5" /> {isRTL ? "أين تُصرف مساهمات الصك؟" : "Where do share contributions go?"}
              </span>
              <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{t(allocation.title)}</h2>
              <p className="mt-3 text-muted-foreground md:text-lg">{t(allocation.lead)}</p>
            </div>
            <div className="mt-10 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
              {allocation.items.map((a, i) => {
                const pctNum = Math.max(0, Math.min(100, parseFloat(t(a.extra)) || 0));
                return (
                  <div key={a.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm font-extrabold text-primary">
                      <span>{t(a.title)}</span>
                      <span className="font-mono text-secondary">{pctNum}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} h-full rounded-full`} style={{ width: `${pctNum}%` }} />
                    </div>
                  </div>
                );
              })}
              {t(section("allocation_note")?.title) && (
                <p className="pt-3 text-center text-xs font-bold text-muted-foreground">{t(section("allocation_note")?.title)}</p>
              )}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button asChild variant="outline"><Link to="/trust">{isRTL ? "تقرير الشفافية" : "Transparency report"}</Link></Button>
                <Button asChild variant="outline"><Link to="/programs/odhya">{isRTL ? "تفاصيل برنامج الأضحية" : "Qurbani program details"}</Link></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{t(c.cta.title)}</h2>
          <p className="mt-3 text-muted-foreground md:text-lg">{t(c.cta.sub)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/qurbani"><Heart className="h-5 w-5" />{t(c.hero.donateLabel)}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={DONATE_WAQF}><Sprout className="h-5 w-5" />{isRTL ? "ساهم في الوقف" : "Give to the waqf"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cases linked to the waqf project in the dashboard (renders nothing when there are none) */}
      {project && (
        <LinkedCasesSection filter={{ projectId: project.id }} isRTL={isRTL} className="bg-background"
          title={isRTL ? "حالات ضمن المزرعة الوقفية" : "Cases in the waqf farm"}
          subtitle={isRTL ? "اختر حالة بعينها وتابع تحديثاتها." : "Pick a specific case and follow its updates."} />
      )}

      {/* Proof gallery (real field photos) */}
      <FieldConvoysGallery variant="all" donateHref="/programs/odhya" galleryKey="farm" />

      {/* FAQ: the FAQ category linked to the project in the dashboard, else the page defaults */}
      {project?.faqCategorySlug ? (
        <LocalFAQ categorySlug={project.faqCategorySlug} donateHref="/qurbani" id="farm-faq"
          title={isRTL ? "أسئلة شائعة عن المزرعة الوقفية وصك الأضحية" : "Waqf farm & Qurbani FAQ"} />
      ) : (
        <LocalFAQ
          donateHref="/qurbani"
          title={isRTL ? "أسئلة شائعة عن صك الأضحية في الدقهلية" : "Qurbani share FAQs — Dakahlia"}
          intro={isRTL ? "إجابات سريعة عن الأسئلة التي نسمعها كل يوم من أهالي المنصورة وميت غمر وطلخا وبلقاس قبل العيد." : "Fast answers we hear every day from families across Mansoura, Mit Ghamr, Talkha and Belqas before Eid."}
          items={c.faq.map((f) => ({ q: t(f.q), a: t(f.a) }))}
        />
      )}

      <StickyQurbaniCTA donateHref="/qurbani" />
    </PageLayout>
  );
};

export default Farm;
