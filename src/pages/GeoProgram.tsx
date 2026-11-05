import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, MapPin, Phone, ShieldCheck, HelpCircle, Sparkles, Truck, FileCheck2, ClipboardCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { getGeo, GEO_GOVERNORATES } from "@/data/geoPages";
import { usePrograms } from "@/data/sources/programs";
import { RelatedContentLinks } from "@/components/common/RelatedContentLinks";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

/**
 * Localized geo landing — /geo/:governorate/:program.
 * Adds LocalBusiness JSON-LD + canonical + AR↔EN hreflang and unique
 * bilingual copy per (city, program) pair.
 */
const GeoProgram = () => {
  const { governorate = "", program = "" } = useParams();
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const reduce = useReducedMotion();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const geo = getGeo(governorate);
  const { programs } = usePrograms();
  const prog = programs.find((p) => p.slug === program);
  const copy = geo?.programs[program];

  if (!geo || !prog || !copy) return <Navigate to="/programs" replace />;

  const c = isRTL ? copy.ar : copy.en;
  const gName = isRTL ? geo.ar : geo.en;
  const path = `/geo/${geo.slug}/${prog.slug}`;
  const url = `https://elyusr.org${path}`;
  const waHref = `https://wa.me/201097000137?text=${encodeURIComponent(
    isRTL ? `السلام عليكم، أودّ معرفة تفاصيل ${prog.ar.name} في ${gName}.` : `Hi, tell me more about ${prog.en.name} in ${gName}.`,
  )}`;

  // Sibling programs in the same governorate (for cross-linking & SEO).
  const siblingPrograms = Object.keys(geo.programs)
    .filter((s) => s !== prog.slug)
    .map((s) => programs.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 6);

  // Same program in other governorates (helps users compare locations).
  const sameProgramElsewhere = GEO_GOVERNORATES
    .filter((g) => g.slug !== geo.slug && g.programs[prog.slug])
    .slice(0, 6);

  const steps = [
    { icon: ClipboardCheck, t: isRTL ? "بحث ميداني" : "Field assessment", d: isRTL ? `فريق ${gName} يزور الأسرة.` : `${gName} team visits the family.` },
    { icon: Truck, t: isRTL ? "تسليم بكرامة" : "Dignified delivery", d: isRTL ? "نوصل الاحتياجات حتى باب البيت." : "We deliver to the doorstep." },
    { icon: FileCheck2, t: isRTL ? "توثيق وتقرير" : "Proof & report", d: isRTL ? "تقرير مصوّر خلال 48 ساعة." : "Photo report within 48 hours." },
  ];

  return (
    <PageLayout>
      <SEOHelmet title={`${c.headline} | ${isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity"}`} description={c.intro} path={path} image={prog.image} />
      <Helmet>
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: isRTL ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
            { "@type": "ListItem", position: 2, name: isRTL ? "البرامج" : "Programs", item: "https://elyusr.org/programs" },
            { "@type": "ListItem", position: 3, name: prog[lang].name, item: `https://elyusr.org/programs/${prog.slug}` },
            { "@type": "ListItem", position: 4, name: gName, item: url },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${url}#localbusiness`,
          name: `${isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity"} — ${gName}`,
          image: prog.image,
          url,
          telephone: "+201097000137",
          priceRange: "EGP",
          areaServed: { "@type": "AdministrativeArea", name: gName },
          address: { "@type": "PostalAddress", addressCountry: "EG", addressRegion: gName },
          geo: { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lon },
          makesOffer: {
            "@type": "Offer",
            name: c.headline,
            priceCurrency: "EGP",
            price: prog.priceFrom || undefined,
            url: `https://elyusr.org/donate?program=${prog.slug}&governorate=${geo.slug}`,
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: c.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
      </Helmet>

      <section className="pattern-hero-luxe text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Breadcrumbs items={[
            { name: isRTL ? "الرئيسية" : "Home", href: "/" },
            { name: isRTL ? "البرامج" : "Programs", href: "/programs" },
            { name: prog[lang].name, href: `/programs/${prog.slug}` },
            { name: gName },
          ]} />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-extrabold text-secondary">
            <MapPin className="h-3.5 w-3.5" /> {gName} — {geo.region}
          </span>
          <h1 className="mt-3 max-w-3xl text-xl font-black leading-tight md:text-3xl lg:text-4xl">{c.headline}</h1>
          <p className="mt-4 max-w-2xl text-base text-primary-foreground/85 md:text-lg">{c.intro}</p>
          {prog.priceFrom > 0 && (
            <span className="mt-4 inline-flex rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-extrabold text-primary-foreground ring-1 ring-secondary/30">
              {isRTL ? `يبدأ من ${prog.priceFrom} ج في ${gName}` : `From ${prog.priceFrom} EGP in ${gName}`}
            </span>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
              <Link to={`/donate?program=${prog.slug}&governorate=${geo.slug}`}>
                <Heart className="h-5 w-5" /> {isRTL ? `تبرع لـ ${gName}` : `Donate to ${gName}`}
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground shadow-whatsapp hover:opacity-95">
              <a href={waHref} target="_blank" rel="noopener"><WhatsAppIcon className="h-5 w-5" aria-hidden /> {isRTL ? "تواصل واتساب" : "WhatsApp"}</a>
            </Button>
          </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-primary"><MapPin className="h-5 w-5 text-secondary" /><h2 className="text-lg font-black">{isRTL ? "لماذا فريقنا في" : "Why our team in"} {gName}؟</h2></div>
            <p className="text-sm leading-relaxed text-foreground/85">{c.whyHere}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5 text-secondary" /><h2 className="text-lg font-black">{isRTL ? "نطاق التغطية" : "Coverage"}</h2></div>
            <p className="text-sm leading-relaxed text-foreground/85">{c.coverage}</p>
          </div>
        </div>

        {/* 3-step local journey */}
        <div className="container mx-auto mt-10 max-w-5xl px-4">
          <h2 className="text-center text-xl font-black text-primary md:text-2xl">
            {isRTL ? `كيف نعمل في ${gName}` : `How we work in ${gName}`}
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, t, d }, i) => (
              <motion.li
                key={t}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-base font-black text-primary">{t}</h3>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{d}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-center text-xl font-black text-primary md:text-2xl">{isRTL ? "أسئلة شائعة" : "FAQ"}</h2>
          <div className="space-y-3">
            {c.faq.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft">
                <summary className="flex cursor-pointer items-start gap-2 text-base font-extrabold text-primary">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />{f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other programs in this governorate — cross-linking for local SEO */}
      {siblingPrograms.length > 0 && (
        <section className="bg-background py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-xl font-black text-primary md:text-2xl">
              {isRTL ? `برامج أخرى في ${gName}` : `Other programs in ${gName}`}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblingPrograms.map((p, i) => (
                <motion.div
                  key={p.slug}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/geo/${geo.slug}/${p.slug}`}
                    className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-card"
                  >
                    <div>
                      <div className="text-sm font-black text-primary">{p[lang].name}</div>
                      <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">{gName}</div>
                    </div>
                    <Arrow className="h-4 w-4 text-accent transition group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Same program in other governorates */}
      {sameProgramElsewhere.length > 0 && (
        <section className="bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="text-center text-xl font-black text-primary md:text-2xl">
              {isRTL ? `${prog.ar.name} في محافظات أخرى` : `${prog.en.name} in other governorates`}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameProgramElsewhere.map((g, i) => (
                <motion.div
                  key={g.slug}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/geo/${g.slug}/${prog.slug}`}
                    className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-card"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <div>
                        <div className="text-sm font-black text-primary">{isRTL ? g.ar : g.en}</div>
                        <div className="mt-0.5 text-[11.5px] font-semibold text-muted-foreground">{g.region}</div>
                      </div>
                    </div>
                    <Arrow className="h-4 w-4 text-accent transition group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <RelatedContentLinks programSlug={prog.slug} governorateSlug={geo.slug} />
    </PageLayout>
  );
};

export default GeoProgram;