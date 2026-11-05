import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, MapPin, Users, ShieldCheck, Camera, Truck, Phone, CheckCircle2, Clock, Award, FileText } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { getCity, DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { QURBANI_SEASON, daysUntilEid } from "@/data/qurbaniSeason";

const PROGRAM_LABEL: Record<string, { ar: string; en: string }> = {
  odhya: { ar: "صك أضحية", en: "Qurbani share" },
  box: { ar: "كرتونة عزومة", en: "Food box" },
  meat: { ar: "كيلو لحم", en: "Kilo of meat" },
  education: { ar: "كفالة تعليمية", en: "Education sponsorship" },
  water: { ar: "وصلة مياه", en: "Water line" },
  bride: { ar: "جهاز عروس", en: "Bride preparation" },
  zakat: { ar: "زكاة مال", en: "Zakat" },
};

const QurbaniCity = () => {
  const { city: slug } = useParams<{ city: string }>();
  const city = slug ? getCity(slug) : undefined;
  if (!city) return <Navigate to="/qurbani" replace />;
  return <QurbaniCityView key={city.slug} city={city} />;
};

const QurbaniCityView = ({ city }: { city: NonNullable<ReturnType<typeof getCity>> }) => {
  const { lang } = useLang();

  const isAr = lang === "ar";
  const name = city[lang];
  const url = `https://elyusr.org/qurbani/${city.slug}`;
  const title = isAr
    ? `صك أضحية ${city.ar} ${QURBANI_SEASON.year} | مضمون مع توثيق — مؤسسة اليسر`
    : `Qurbani share in ${city.en} ${QURBANI_SEASON.year} | Verified — Al-Yusr`;
  const desc = isAr
    ? `احجز صك أضحية ${city.ar} (الدقهلية) مع مؤسسة اليسر — ${city.copy.ar.intro}`
    : `Reserve a Qurbani share for ${city.en} (Dakahlia) with Al-Yusr — ${city.copy.en.intro}`;

  // Other cities for internal linking
  const others = DAKAHLIA_CITIES.filter((c) => c.slug !== city.slug).slice(0, 8);

  // Next Eid al-Adha comes from the season config (src/data/qurbaniSeason.ts).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const daysLeft = daysUntilEid(now.getTime());

  // City-level price tiers (EGP) — keep in sync with /donate.
  const TIERS = [
    { id: "sheep",    ar: "خروف كامل",       en: "Whole sheep",       price: 14500, serves: isAr ? "أسرة (3–5 أفراد)" : "1 family (3–5)" },
    { id: "seventh",  ar: "صك سُبع بقري",    en: "1/7 cow share",     price: 16000, serves: isAr ? "نية شخص واحد" : "1 person's intention" },
    { id: "buffalo",  ar: "صك سُبع جاموسي",  en: "1/7 buffalo share", price: 14000, serves: isAr ? "نية شخص واحد" : "1 person's intention" },
  ];

  // City-specific FAQ — feeds FAQPage schema + on-page accordion.
  const FAQ = isAr ? [
    { q: `كيف أحجز صك أضحية في ${city.ar}؟`, a: `اضغط زر «احجز صك أضحية في ${city.ar}»، واختر الخروف أو صك السُّبع (بقري أو جاموسي)، ثم أكّد الدفع. سيصلك إيصال PDF فورًا مع رقم تتبّع.` },
    { q: `متى تُوزَّع لحوم الأضحية في ${city.ar}؟`, a: `في يوم العيد نفسه؛ يبدأ الذبح بعد صلاة العيد، ويصل اللحم إلى باب البيت في ${city.ar} قبل المغرب، مع صور وفيديو لكل صك.` },
    { q: `لماذا أختار مؤسسة اليسر لصك الأضحية في ${city.ar}؟`, a: `مؤسسة اليسر مؤسسة خيرية مصرية تعمل في محافظات مصر، ومقرها الرئيسي في المنصورة، ولها جذور عميقة في الدقهلية؛ لذلك نعرف القرى المحتاجة في ${city.ar} جيدًا، ولكل صك رقم تتبّع وصور توثيق.` },
    { q: `هل تصلون إلى قرى ${city.ar} البعيدة؟`, a: `نعم، يغطي فريقنا الميداني مراكز ${city.ar} وقراها بالكامل، والتوصيل مجاني للأسر التي لا تستطيع الحضور.` },
    { q: `كم سعر صك الأضحية في ${city.ar}؟`, a: `الخروف 14,500 جنيه، وصك سُبع بقري 16,000 جنيه، وصك سُبع جاموسي 14,000 جنيه. ويمكنك حجز أكثر من صك؛ فالعجل الكامل = 7 صكوك.` },
  ] : [
    { q: `How do I reserve a Qurbani share in ${city.en}?`, a: `Click "Reserve a share in ${city.en}", choose sheep or cow share, and confirm payment. You'll get a PDF receipt and tracking number instantly.` },
    { q: `When is the meat distributed in ${city.en}?`, a: `On Eid day itself — slaughter at dawn, delivery to the family's doorstep in ${city.en} before sunset, with photos and video for every share.` },
    { q: `What makes Al-Yusr different in ${city.en}?`, a: `Al-Yusr is an Egyptian foundation working across Egypt's governorates, headquartered in Mansoura with deep roots in Dakahlia, so we know the needy villages in ${city.en} well, and every share has a tracking number with full documentation.` },
    { q: `Do you reach remote villages in ${city.en}?`, a: `Yes. Our field team covers all of ${city.en}'s districts and villages, with free delivery for families unable to travel.` },
    { q: `How much is a Qurbani share in ${city.en}?`, a: `Whole sheep EGP 14,500, 1/7 cow share EGP 16,000, 1/7 buffalo share EGP 14,000. You can book more than one share — a whole animal = 7 shares.` },
  ];

  return (
    <PageLayout>
      <SEOHelmet title={title} description={desc} path={`/qurbani/${city.slug}`} />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isAr ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
        { name: isAr ? "صك أضحية الدقهلية" : "Dakahlia Qurbani", url: "https://elyusr.org/qurbani" },
        { name: name, url },
      ]} />
      <Helmet>
        {/* Place + Service + Product schema for the city */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Place",
              "@id": `${url}#place`,
              name: city.ar,
              alternateName: city.en,
              geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
              containedInPlace: { "@type": "AdministrativeArea", name: "محافظة الدقهلية" },
            },
            {
              "@type": "Service",
              "@id": `${url}#service`,
              serviceType: "Qurbani distribution",
              name: isAr ? `صك أضحية ${city.ar}` : `Qurbani share in ${city.en}`,
              description: desc,
              provider: { "@id": "https://elyusr.org/#org" },
              areaServed: { "@id": `${url}#place` },
              url,
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "EGP",
                lowPrice: "14000",
                highPrice: "16000",
                offerCount: 3,
                availability: QURBANI_SEASON.bookingOpen ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
                validThrough: QURBANI_SEASON.eidDate.slice(0, 10),
                url: `https://elyusr.org/donate?program=odhya&city=${city.slug}`,
              },
            },
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        })}</script>
        {/* OpenGraph place override */}
        <meta property="og:type" content="place" />
        <meta property="place:location:latitude" content={String(city.lat)} />
        <meta property="place:location:longitude" content={String(city.lon)} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg" />
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="text-primary-foreground/80">
            <Breadcrumbs items={[
              { name: isAr ? "الرئيسية" : "Home", href: "/" },
              { name: isAr ? "صك أضحية الدقهلية" : "Dakahlia Qurbani", href: "/qurbani" },
              { name: name },
            ]} />
          </div>
          {/* Eid countdown urgency banner — only show when ≤ 30 days left */}
          {daysLeft > 0 && daysLeft <= 30 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs font-extrabold text-secondary">
              <Clock className="h-3.5 w-3.5" />
              {isAr
                ? `الأيام المتبقية على عيد الأضحى: ${daysLeft} — احجز صك ${city.ar} قبل نفاد الكميات`
                : `${daysLeft} days to Eid Al-Adha — reserve your ${city.en} share before slots fill`}
            </div>
          )}
          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-[11px] font-extrabold text-secondary">
                <MapPin className="h-3 w-3" />{isAr ? "محافظة الدقهلية" : "Dakahlia Governorate"}
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight md:text-4xl">
                {isAr ? `صك أضحية ${city.ar}` : `Qurbani share in ${city.en}`}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85">
                {city.copy[lang].intro}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-orange-grad text-accent-foreground shadow-cta animate-pulse-glow hover:opacity-95">
                  <Link to={`/donate?program=odhya&city=${city.slug}`}>
                    <Heart className="h-4 w-4" />
                    {isAr ? `احجز صك أضحية في ${city.ar}` : `Reserve a share in ${city.en}`}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-secondary/40 bg-primary-foreground/5 text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground">
                  <a href="tel:+201097000137" dir="ltr"><Phone className="h-4 w-4" />+20 109 700 0137</a>
                </Button>
              </div>
            </div>
            {/* City stats card */}
            <aside className="rounded-2xl border border-secondary/30 bg-primary/40 p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-primary-foreground/10 p-2">
                  <Users className="h-3.5 w-3.5 text-secondary" />
                  <div className="mt-0.5 text-[10px] font-bold text-primary-foreground/70">{isAr ? "أسر مستفيدة" : "Families helped"}</div>
                  <div className="text-lg font-black text-secondary">{city.families.toLocaleString()}</div>
                </div>
                <div className="rounded-xl bg-primary-foreground/10 p-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  <div className="mt-0.5 text-[10px] font-bold text-primary-foreground/70">{isAr ? "برامج نشطة" : "Active programs"}</div>
                  <div className="text-lg font-black text-secondary">{city.programs.length}</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground/60">
                {isAr ? "البرامج المتاحة" : "Programs"}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {city.programs.map((p) => (
                  <Link key={p} to={`/donate?program=${p}&city=${city.slug}`} className="rounded-full bg-secondary/20 px-2 py-0.5 text-[9px] font-extrabold text-secondary hover:bg-secondary/30">
                    {PROGRAM_LABEL[p]?.[lang] || p}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Local notes */}
      <section className="bg-background py-14">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { I: ShieldCheck, t: city.highlight[lang] },
              { I: Truck,       t: city.copy[lang].localNote },
              { I: Camera,      t: city.copy[lang].coverage },
              { I: CheckCircle2, t: isAr
                  ? `كل صك أضحية في ${city.ar} يوثَّق بالصور والفيديو، ويصل إلى باب البيت يوم العيد.`
                  : `Every Qurbani share in ${city.en} is documented and delivered on Eid day.` },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <b.I className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
                <p className="text-sm font-semibold text-foreground/85">{b.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other cities — internal linking */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {isAr ? "صك أضحية في باقي مدن الدقهلية" : "Qurbani in other Dakahlia cities"}
          </h2>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {others.map((o) => (
              <Link key={o.slug} to={`/qurbani/${o.slug}`} className="group rounded-xl border border-border bg-card p-3 text-sm font-extrabold text-primary shadow-soft transition hover:border-secondary hover:text-accent">
                <MapPin className="me-1 inline h-3.5 w-3.5 text-secondary" />
                {isAr ? `صك أضحية ${o.ar}` : `Qurbani in ${o.en}`}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/qurbani">{isAr ? "كل مدن الدقهلية" : "All Dakahlia cities"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing tiers — schema-aligned, conversion-focused */}
      <section className="bg-background py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {isAr ? `أسعار صك أضحية ${city.ar}` : `Qurbani share prices in ${city.en}`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-foreground/70">
            {isAr
              ? "أسعار شفافة دون رسوم خفية، والسعر واحد في كل مدن الدقهلية. والحجز المبكر يضمن لك أفضل جودة."
              : "Transparent pricing, no hidden fees — same price across Dakahlia. Early booking guarantees best quality."}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => (
              <article key={t.id} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft transition hover:border-secondary hover:shadow-card">
                <div className="flex items-center gap-2 text-secondary">
                  <Award className="h-4 w-4" />
                  <h3 className="text-base font-black text-primary">{isAr ? t.ar : t.en}</h3>
                </div>
                <div className="mt-2 text-2xl font-black text-accent">
                  {t.price.toLocaleString()} <span className="text-xs font-bold text-foreground/60">{isAr ? "جنيه" : "EGP"}</span>
                </div>
                <p className="mt-1 text-xs font-bold text-foreground/70">{t.serves}</p>
                <Button asChild size="sm" className="mt-3 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to={`/donate?program=odhya&tier=${t.id}&city=${city.slug}`}>
                    <Heart className="h-3.5 w-3.5" />
                    {isAr ? `احجز ${t.ar}` : `Reserve ${t.en}`}
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip — addresses competitor comparison directly */}
      <section className="border-t border-border bg-muted/40 py-10">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { I: ShieldCheck, t: isAr ? `مرخّصة رسميًا برقم 2665 لسنة 2019 — وزارة التضامن` : "Officially licensed (2665/2019) — Ministry of Solidarity" },
              { I: Camera,      t: isAr ? `صور وفيديو لكل صك في ${city.ar}` : `Photo & video proof for every ${city.en} share` },
              { I: FileText,    t: isAr ? "إيصال PDF فوري + رقم تتبع لكل تبرع" : "Instant PDF receipt + tracking ID per donation" },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <b.I className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <p className="text-sm font-extrabold text-primary">{b.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City FAQ — feeds FAQPage schema above for rich snippets */}
      <section className="bg-background py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {isAr ? `أسئلة شائعة عن صك أضحية ${city.ar}` : `FAQs — Qurbani in ${city.en}`}
          </h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft open:shadow-card">
                <summary className="cursor-pointer text-base font-black text-primary">{f.q}</summary>
                <p className="mt-2 text-sm font-semibold text-foreground/80">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta animate-pulse-glow hover:opacity-95">
              <Link to={`/donate?program=odhya&city=${city.slug}`}>
                <Heart className="h-5 w-5" />
                {isAr ? `احجز صك أضحية ${city.ar} الآن` : `Reserve in ${city.en} now`}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default QurbaniCity;