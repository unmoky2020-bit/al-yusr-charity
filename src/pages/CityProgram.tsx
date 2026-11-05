import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Heart, MapPin, Phone, ShieldCheck, HelpCircle, Truck, FileCheck2,
  ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { DAKAHLIA_CITIES, getCity, DISTRICTS_BY_CITY } from "@/data/dakahliaCities";
import { usePrograms } from "@/data/sources/programs";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

/**
 * City-level program landing — /dakahlia/:city/:program.
 * Lightweight, SEO-first page that targets long-tail queries like
 * "كرتونة في المنصورة" / "Qurbani in Mit Ghamr".
 */
const CityProgram = () => {
  const { city = "", program = "" } = useParams();
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const reduce = useReducedMotion();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const cityObj = getCity(city);
  const { programs } = usePrograms();
  const prog = programs.find((p) => p.slug === program);
  if (!cityObj || !prog) return <Navigate to="/programs" replace />;

  const cName = isRTL ? cityObj.ar : cityObj.en;
  const pName = isRTL ? prog.ar.name : prog.en.name;
  const districts = DISTRICTS_BY_CITY[cityObj.slug] || [];

  const headline = isRTL
    ? `${pName} في ${cName} — توصيل حتى باب البيت`
    : `${pName} in ${cName} — doorstep delivery`;
  const intro = isRTL
    ? `فريق مؤسسة اليسر الخيرية في ${cName} يوصل ${pName} إلى الأسر المستحقة بعد بحث ميداني وتوثيق كامل بالصور والفيديو. ${cityObj.highlight.ar}.`
    : `Al-Yusr Charity's ${cName} team delivers ${pName} to verified families with full photo/video documentation. ${cityObj.highlight.en}.`;

  // SEO-tuned head (title ≤ 60, description ≤ 160) — different from on-page H1
  const seoTitle = isRTL
    ? `${pName} في ${cName} — اليسر الخيرية`
    : `${pName} in ${cName} — Al-Yusr Charity`;
  const seoDescription = isRTL
    ? `تبرّع بـ${pName} في ${cName} مع توثيق بالصور والفيديو وتوصيل حتى باب البيت. مؤسسة اليسر الخيرية — مرخّصة 2665/2019.`
    : `Donate ${pName} in ${cName} with photo/video proof and doorstep delivery. Al-Yusr Charity — licensed (2665/2019).`;

  const path = `/dakahlia/${cityObj.slug}/${prog.slug}`;
  const url = `https://elyusr.org${path}`;
  const waHref = `https://wa.me/201097000137?text=${encodeURIComponent(
    isRTL ? `السلام عليكم، أودّ معرفة تفاصيل ${pName} في ${cName}.` : `Hi, tell me about ${pName} in ${cName}.`,
  )}`;

  const siblings = cityObj.programs
    .filter((s) => s !== prog.slug)
    .map((s) => programs.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const otherCities = DAKAHLIA_CITIES.filter(
    (c) => c.slug !== cityObj.slug && c.programs.includes(prog.slug),
  ).slice(0, 8);

  const steps = [
    { icon: ClipboardCheck, t: isRTL ? "بحث ميداني" : "Field check", d: isRTL ? `زيارة الأسرة في ${cName}.` : `Family visit in ${cName}.` },
    { icon: Truck, t: isRTL ? "تسليم بكرامة" : "Dignified delivery", d: isRTL ? "حتى باب البيت دون انتظار." : "To the doorstep." },
    { icon: FileCheck2, t: isRTL ? "توثيق" : "Proof", d: isRTL ? "تقرير مصوّر خلال 48 ساعة." : "Photo report within 48h." },
  ];

  const faqs = isRTL
    ? [
        { q: `كيف أتبرع بـ${pName} في ${cName}؟`, a: `اختر البرنامج من الموقع، وحدّد المبلغ، وادفع بأمان. وسيتواصل معك فريقنا في ${cName} بعد التسليم بتوثيق كامل.` },
        { q: `هل يصل ${pName} إلى كل قرى ${cName}؟`, a: `نعم، نغطي ${cityObj.copy.ar.coverage}` },
        { q: `ما ضمان جودة ${pName} في ${cName}؟`, a: `كل خطوة موثّقة بالصور والفيديو، والمؤسسة مرخّصة بإشهار رقم 2665/2019.` },
      ]
    : [
        { q: `How do I donate ${pName} in ${cName}?`, a: `Pick the program, set an amount, and pay securely. Our ${cName} team will follow up with full proof.` },
        { q: `Do you cover every village in ${cName}?`, a: `Yes — ${cityObj.copy.en.coverage}` },
        { q: `How do you guarantee quality of ${pName} in ${cName}?`, a: `Every step is photo/video documented, and Al-Yusr is licensed (No. 2665/2019).` },
      ];

  return (
    <PageLayout>
      <SEOHelmet
        title={seoTitle}
        description={seoDescription}
        path={path}
        image={prog.image}
      />
      <Helmet>
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: isRTL ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
            { "@type": "ListItem", position: 2, name: isRTL ? "البرامج" : "Programs", item: "https://elyusr.org/programs" },
            { "@type": "ListItem", position: 3, name: pName, item: `https://elyusr.org/programs/${prog.slug}` },
            { "@type": "ListItem", position: 4, name: isRTL ? "الدقهلية" : "Dakahlia", item: "https://elyusr.org/geo/dakahlia/" + prog.slug },
            { "@type": "ListItem", position: 5, name: cName, item: url },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${url}#localbusiness`,
          name: `${isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity"} — ${cName}`,
          image: {
            "@type": "ImageObject",
            url: prog.image?.startsWith("http") ? prog.image : `https://elyusr.org${prog.image || ""}`,
            caption: headline,
            creditText: "Al-Yusr Charity Foundation",
            copyrightNotice: "© Al-Yusr Charity Foundation",
            creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
            license: "https://elyusr.org/terms",
            acquireLicensePage: "https://elyusr.org/contact",
          },
          url,
          telephone: "+201097000137",
          priceRange: "EGP",
          areaServed: { "@type": "City", name: cName, containedInPlace: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" } },
          address: { "@type": "PostalAddress", addressCountry: "EG", addressRegion: "Dakahlia", addressLocality: cName },
          geo: { "@type": "GeoCoordinates", latitude: cityObj.lat, longitude: cityObj.lon },
          makesOffer: {
            "@type": "Offer",
            name: headline,
            priceCurrency: "EGP",
            price: prog.priceFrom || undefined,
            url: `https://elyusr.org/donate?program=${prog.slug}&city=${cityObj.slug}`,
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
      </Helmet>

      <section className="pattern-hero-luxe text-primary-foreground">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <Breadcrumbs items={[
            { name: isRTL ? "الرئيسية" : "Home", href: "/" },
            { name: isRTL ? "البرامج" : "Programs", href: "/programs" },
            { name: pName, href: `/programs/${prog.slug}` },
            { name: isRTL ? "الدقهلية" : "Dakahlia", href: `/geo/dakahlia/${prog.slug}` },
            { name: cName },
          ]} />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-extrabold text-secondary">
              <MapPin className="h-3.5 w-3.5" /> {cName} — {isRTL ? "الدقهلية" : "Dakahlia"}
            </span>
            <h1 className="mt-3 max-w-3xl text-2xl font-black leading-tight md:text-4xl">{headline}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/85 md:text-base">{intro}</p>
            {prog.priceFrom > 0 && (
              <span className="mt-4 inline-flex rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-extrabold ring-1 ring-secondary/30">
                {isRTL ? `يبدأ من ${prog.priceFrom} ج في ${cName}` : `From ${prog.priceFrom} EGP in ${cName}`}
              </span>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
                <Link to={`/donate?program=${prog.slug}&city=${cityObj.slug}`}>
                  <Heart className="h-5 w-5" /> {isRTL ? `تبرع لـ ${cName}` : `Donate to ${cName}`}
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground shadow-whatsapp">
                <a href={waHref} target="_blank" rel="noopener"><WhatsAppIcon className="h-5 w-5" aria-hidden /> {isRTL ? "واتساب" : "WhatsApp"}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container mx-auto grid max-w-5xl gap-5 px-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-black text-primary"><MapPin className="h-5 w-5 text-secondary" />{isRTL ? `لماذا ${pName} في ${cName}؟` : `Why ${pName} in ${cName}?`}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/85">{isRTL ? cityObj.copy.ar.localNote : cityObj.copy.en.localNote}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-black text-primary"><ShieldCheck className="h-5 w-5 text-secondary" />{isRTL ? "نطاق التوصيل" : "Delivery coverage"}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/85">{isRTL ? cityObj.copy.ar.coverage : cityObj.copy.en.coverage}</p>
            {districts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {districts.map((d) => (
                  <span key={d.en} className="rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-extrabold text-secondary">
                    {isRTL ? d.ar : d.en}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto mt-8 max-w-5xl px-4">
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, t, d }, i) => (
              <motion.li
                key={t}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-2 text-sm font-black text-primary">{t}</h3>
                <p className="mt-1 text-[13px] font-semibold text-muted-foreground">{d}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-muted/30 py-10 md:py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-5 text-center text-xl font-black text-primary md:text-2xl">{isRTL ? "أسئلة شائعة" : "FAQ"}</h2>
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft">
                <summary className="flex cursor-pointer items-start gap-2 text-sm font-extrabold text-primary md:text-base">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />{f.q}
                </summary>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="bg-background py-10 md:py-14">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-lg font-black text-primary md:text-2xl">
              {isRTL ? `برامج أخرى في ${cName}` : `Other programs in ${cName}`}
            </h2>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((p) => (
                <Link
                  key={p.slug}
                  to={`/dakahlia/${cityObj.slug}/${p.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-card"
                >
                  <span className="text-sm font-black text-primary">{p[lang].name}</span>
                  <Arrow className="h-4 w-4 text-accent transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {otherCities.length > 0 && (
        <section className="bg-muted/30 py-10 md:py-14">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-lg font-black text-primary md:text-2xl">
              {isRTL ? `${pName} في مدن أخرى بالدقهلية` : `${pName} in other Dakahlia cities`}
            </h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  to={`/dakahlia/${c.slug}/${prog.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-primary shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/50"
                >
                  <MapPin className="h-3.5 w-3.5 text-secondary" />{isRTL ? c.ar : c.en}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to={`/geo/dakahlia/${prog.slug}`} className="font-extrabold text-primary hover:text-secondary">
                {isRTL ? `كل برامج ${pName} في الدقهلية` : `All ${pName} programs in Dakahlia`} <CheckCircle2 className="inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default CityProgram;