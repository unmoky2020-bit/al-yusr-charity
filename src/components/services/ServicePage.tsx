import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { Heart, MessageCircle, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { DonationTiers, type Tier } from "./DonationTiers";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

export interface ServicePageConfig {
  slug: string; // route slug after /services/
  programSlug: string; // donate program key
  hero: string; // image
  badge_ar: string; badge_en: string;
  title_ar: string; title_en: string;
  intro_ar: string; intro_en: string;
  seo_title_ar: string; seo_title_en: string;
  seo_desc_ar: string; seo_desc_en: string;
  bullets_ar: string[]; bullets_en: string[];
  stats: { ar: string; en: string; arL: string; enL: string }[];
  features: { Icon: any; t_ar: string; t_en: string; d_ar: string; d_en: string }[];
  tiers: Tier[];
  related?: { to: string; ar: string; en: string }[];
  /** Optional FAQ pairs for richer page + FAQ JSON-LD. */
  faqs?: { q_ar: string; a_ar: string; q_en: string; a_en: string }[];
  extra?: ReactNode;
}

/** Services that also have a dedicated landing page: Google should index that page, not both. */
const SERVICE_CANONICAL: Record<string, string> = { markoun: "/markoun" };

export const ServicePage = ({ config }: { config: ServicePageConfig }) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const base = "https://elyusr.org";
  const path = `/services/${config.slug}`;
  const title = isRTL ? config.seo_title_ar : config.seo_title_en;
  const description = isRTL ? config.seo_desc_ar : config.seo_desc_en;
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(
    isRTL ? `أريد التبرع لخدمة: ${config.title_ar}` : `I'd like to donate to: ${config.title_en}`
  )}`;

  return (
    <PageLayout>
      <SEOHelmet title={title} description={description} path={SERVICE_CANONICAL[config.slug] ?? path} image={config.hero} />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
          { name: isRTL ? "خريطة الخدمات" : "Services", url: `${base}/services-map` },
          { name: isRTL ? config.title_ar : config.title_en, url: `${base}${path}` },
        ]}
      />
      {/* Article + (optional) FAQPage JSON-LD for richer SERP */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          image: [`${base}${config.hero?.startsWith("/") ? config.hero : "/og-ar.jpg"}`],
          mainEntityOfPage: `${base}${path}`,
          author: { "@type": "Organization", name: "مؤسسة اليسر الخيرية" },
          publisher: {
            "@type": "Organization",
            name: "مؤسسة اليسر الخيرية",
            logo: { "@type": "ImageObject", url: `${base}/logo.png` },
          },
          inLanguage: isRTL ? "ar-EG" : "en",
        })}</script>
        {config.faqs && config.faqs.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: config.faqs.map((f) => ({
              "@type": "Question",
              name: isRTL ? f.q_ar : f.q_en,
              acceptedAnswer: { "@type": "Answer", text: isRTL ? f.a_ar : f.a_en },
            })),
          })}</script>
        )}
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg opacity-40" aria-hidden />
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="flex justify-center text-primary-foreground/80 md:justify-start">
            <Breadcrumbs
              items={[
                { name: isRTL ? "الرئيسية" : "Home", href: "/" },
                { name: isRTL ? "خريطة الخدمات" : "Services", href: "/services-map" },
                { name: isRTL ? config.title_ar : config.title_en },
              ]}
            />
          </div>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
                {isRTL ? config.badge_ar : config.badge_en}
              </span>
              <h1 className="mx-auto mt-4 max-w-xl text-3xl font-black leading-tight md:mx-0 md:text-5xl">
                {isRTL ? config.title_ar : config.title_en}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-primary-foreground/85 md:mx-0 md:text-lg">
                {isRTL ? config.intro_ar : config.intro_en}
              </p>
              <ul className="mx-auto mt-5 grid max-w-xl gap-2 text-sm text-start md:mx-0">
                {(isRTL ? config.bullets_ar : config.bullets_en).map((b, i) => (
                  <li key={i} className="inline-flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span className="text-primary-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link
                    to={`/donate?program=${config.programSlug}`}
                    data-source={`service-${config.slug}-hero`}
                    data-label="donate"
                  >
                    <Heart className="h-5 w-5" />
                    {isRTL ? "تبرع الآن" : "Donate now"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={wa} target="_blank" rel="noopener">
                    <WhatsAppIcon className="h-5 w-5" />
                    {isRTL ? "تواصل واتساب" : "Talk on WhatsApp"}
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
              <img
                src={config.hero}
                alt={isRTL ? config.title_ar : config.title_en}
                width={1600}
                height={900}
                className="relative w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {config.stats.length > 0 && (
        <section className="bg-primary text-primary-foreground">
          <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
            {config.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-3xl font-black text-secondary md:text-4xl">{s.en}</div>
                <div className="mt-1 text-xs font-extrabold text-primary-foreground/85 md:text-sm">{isRTL ? s.arL : s.enL}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "إيه اللي بيمزنا؟" : "What makes us different?"}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {config.features.map((f, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><f.Icon className="h-6 w-6" /></div>
                <h3 className="mt-3 font-black text-primary">{isRTL ? f.t_ar : f.t_en}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{isRTL ? f.d_ar : f.d_en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation tiers */}
      <DonationTiers
        programSlug={config.programSlug}
        tiers={config.tiers}
        title_ar={isRTL ? `باقات دعم ${config.title_ar}` : undefined}
        title_en={isRTL ? undefined : `Support packages — ${config.title_en}`}
      />

      {/* Optional FAQ */}
      {config.faqs && config.faqs.length > 0 && (
        <section className="bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "أسئلة شائعة" : "Frequently asked questions"}
            </h2>
            <div className="mt-8 space-y-3">
              {config.faqs.map((f, i) => (
                <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition open:shadow-card">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-extrabold text-primary">
                    {isRTL ? f.q_ar : f.q_en}
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary/20 text-primary transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isRTL ? f.a_ar : f.a_en}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {config.extra}

      {/* Related */}
      {config.related && config.related.length > 0 && (
        <section className="bg-background py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-xl font-black text-primary md:text-2xl">{isRTL ? "خدمات ذات صلة" : "Related services"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.related.map((r, i) => (
                <Link
                  key={i}
                  to={r.to}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-extrabold text-primary shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-card"
                >
                  <span>{isRTL ? r.ar : r.en}</span>
                  <Arrow className="h-4 w-4 text-secondary transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 pt-12 pb-24 sm:pb-28 md:pb-32">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {isRTL ? "خليك سبب في الأثر" : "Be the reason behind the impact"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {isRTL ? "كل تبرع مهما كان حجمه بيغيّر حياة." : "Every gift — no matter the size — changes a life."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={`/donate?program=${config.programSlug}`} data-source={`service-${config.slug}-cta`} data-label="donate">
                <Heart className="h-5 w-5" />
                {isRTL ? "تبرع الآن" : "Donate now"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/services-map">{isRTL ? "كل الخدمات" : "All services"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ServicePage;