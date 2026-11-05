import { Link } from "react-router-dom";
import { Heart, ShieldCheck, Camera, Truck, MapPin, CheckCircle2, Clock, Phone, AlertTriangle, Beef, Sparkles, BadgeCheck, FileCheck2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, QurbaniSchema, DakahliaServiceSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { QurbaniCampaign } from "@/components/sections/QurbaniCampaign";
import { FieldConvoysGallery } from "@/components/sections/FieldConvoysGallery";
import { useState, useEffect } from "react";
import cowSheep from "@/assets/qurbani-hero-trays.webp";
import qurbaniBanner from "@/assets/yusr-qurbani-banner.webp";
import { FAQ_AR, FAQ_EN } from "@/data/qurbaniFaq";
import iconVet from "@/assets/program-health.webp";
import iconCam from "@/assets/qurbani-meat-quality.webp";
import iconTruck from "@/assets/brand-truck.jpg";
import iconReceipt from "@/assets/brand-card.jpg";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";
import { QURBANI_SEASON, daysUntilEid } from "@/data/qurbaniSeason";

const useDays = () => {
  const [d, setD] = useState(() => daysUntilEid());
  useEffect(() => {
    const id = setInterval(() => setD(daysUntilEid()), 60_000);
    return () => clearInterval(id);
  }, []);
  return d;
};

const QurbaniLanding = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const bankAccounts = useBankAccounts();
  const bankText = bankAccounts[0] ? bankAccountLabel(bankAccounts[0]) : "";
  const days = useDays();
  const faq = isAr ? FAQ_AR : FAQ_EN;

  return (
    <PageLayout>
      <SEOHelmet
        title={isAr
          ? `صك أضحية ${QURBANI_SEASON.year} بالدقهلية | مؤسسة اليسر`
          : `Qurbani ${QURBANI_SEASON.year} in Dakahlia | Al-Yusr`}
        description={isAr
          ? "احجز صك أضحية مضمون بالدقهلية مع اليسر: معاينة قبل الذبح، توثيق بالصور، وتوزيع يوم العيد على الأسر بالمنصورة."
          : "Book a verified Qurbani share in Dakahlia with Al-Yusr: pre-slaughter checks, photo proof, and same-day Eid delivery to families in Mansoura."}
        path="/qurbani"
        image={isAr ? "https://elyusr.org/og-qurbani-ar.jpg" : "https://elyusr.org/og-qurbani-en.jpg"}
      />
      <SiteSchemas />
      {QURBANI_SEASON.bookingOpen && <QurbaniSchema />}
      <DakahliaServiceSchema />
      <FAQSchema items={FAQ_AR} />
      <BreadcrumbSchema items={[
        { name: isAr ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
        { name: isAr ? `صك أضحية الدقهلية ${QURBANI_SEASON.year}` : `Dakahlia Qurbani ${QURBANI_SEASON.year}`, url: "https://elyusr.org/qurbani" },
        { name: isAr ? "كيف تصل أضحيتك" : "How it works", url: "https://elyusr.org/qurbani#how" },
        { name: isAr ? "مدن الدقهلية" : "Dakahlia cities", url: "https://elyusr.org/qurbani#cities" },
        { name: isAr ? "الأسئلة الشائعة" : "FAQ", url: "https://elyusr.org/qurbani#faq" },
      ]} />
      {/* FAQPage JSON-LD is rendered statically in index.html (data-ssr="qurbani-faq") so crawlers see it
          in the initial HTML response, before React hydrates. No client-side injection here. */}

      {/* Hero — pricing flyer style */}
      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        {/* Leaf mosaic backdrop */}
        <div className="pointer-events-none absolute inset-0 leaf-mosaic opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(150_55%_28%/0.4),transparent_60%)]" />

        <div className="container relative mx-auto px-4 py-10 md:py-16">
          <div className="flex justify-center text-primary-foreground/70">
            <Breadcrumbs items={[
              { name: isAr ? "الرئيسية" : "Home", href: "/" },
              { name: isAr ? `صك أضحية الدقهلية ${QURBANI_SEASON.year}` : `Dakahlia Qurbani ${QURBANI_SEASON.year}` },
            ]} />
          </div>

          {/* Marketing banner — reserve with us */}
          <div className="mx-auto mt-8 max-w-2xl text-center">
            {/* [EID-2026] Qurbani booking closed — replaced by closure notice + Farm CTA.
                To re-open booking next season, restore the original urgency banner below. */}
            <div className="rounded-2xl border-2 border-[hsl(45_85%_55%)]/60 bg-[hsl(152_55%_12%)]/85 p-5 text-center shadow-card">
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(45_85%_55%)]/60 bg-[hsl(45_85%_55%)]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[hsl(45_85%_75%)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                {QURBANI_SEASON.bookingOpen
                  ? (isAr ? `حجز صكوك أضحية ${QURBANI_SEASON.year} مفتوح` : `Qurbani ${QURBANI_SEASON.year} booking is open`)
                  : (isAr ? `حجز صكوك أضحية ${QURBANI_SEASON.year} هيفتح قريب` : `Qurbani ${QURBANI_SEASON.year} booking opens soon`)}
              </div>
              <p className="mt-3 text-sm font-bold leading-relaxed text-primary-foreground/90 md:text-base">
                {isAr
                  ? "هنعلن ميعاد الحجز هنا. ولحد ده الوقت تقدر تدعم المزرعة الوقفية اللي بتطعّم الأسر طول السنة."
                  : "We'll announce the booking date here. Meanwhile you can support our endowment farm that feeds families year-round."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/farm"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta hover:opacity-95"
                >
                  <Heart className="h-4 w-4" />
                  {isAr ? "تبرع للمزرعة الوقفية" : "Donate to the endowment farm"}
                </Link>
                <Link
                  to="/donate"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-5 text-sm font-black text-primary-foreground hover:bg-primary-foreground/20"
                >
                  {isAr ? "تبرع عام" : "General donation"}
                </Link>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[hsl(45_85%_55%)]/40 bg-[hsl(152_55%_15%)]/70 px-3 py-1 text-[11px] font-extrabold tracking-wider text-[hsl(45_85%_70%)]">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "الوحيدين في مصر بنديك ضمان جودة الأضحية" : "The only ones in Egypt guaranteeing share quality"}
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight text-primary-foreground md:text-5xl">
              {isAr ? "صكّ أضحية مش غالي — والجودة مضمونة" : "Affordable Qurbani share with guaranteed quality"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-primary-foreground/85 md:text-base">
              {isAr
                ? "الصك عندنا مش غالي، محدش بيقدّم اللي إحنا بنقدّمه: ٣٠ كجم لحم صافي + توثيق صور وفيديو + توزيع نفس يوم العيد على أسر مستحقة في الدقهلية."
                : "Our share is honestly priced — 30 kg of clean meat, full photo/video proof, and Eid-day delivery to families in need across Dakahlia."}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary-foreground/90 md:text-base">
              <Phone className="h-4 w-4 text-[hsl(45_85%_65%)]" />
              {isAr ? "احجز الآن بالاتصال أو واتساب — مندوب يوصلك" : "Book now by call or WhatsApp — agent visits you"}
            </div>
          </div>

          {/* Animal image + 4 pricing tiles */}
          <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2">
            {/* Image card */}
            <div className="overflow-hidden rounded-3xl border-4 border-[hsl(45_85%_55%)]/70 bg-[hsl(152_55%_15%)] shadow-card md:row-span-2">
              <div className="relative h-full overflow-hidden rounded-[1.25rem]">
                <img
                  src={cowSheep}
                  alt={isAr ? "صك أضحية ٣٠ كجم لحم صافي — مؤسسة اليسر" : "Qurbani share 30kg clean meat — Al-Yusr"}
                  width={1080} height={1440}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Pricing tiles 2x2 (right side) */}
            {[
              { icon: Beef, ar: "جاموسي", en: "Buffalo",      weight: isAr ? "وزن الصك ٣٠ ك صافي" : "Share weight: 30 kg net", price: "14,000" },
              { icon: Beef, ar: "بقري",   en: "Cow",          weight: isAr ? "وزن الصك ٣٠ صافي" : "Share weight: 30 kg net", price: "16,000" },
              { icon: Beef, ar: "بقري",   en: "Cow",          weight: isAr ? "وزن الصك ٣٥-٣٧ صافي" : "Share weight: 35-37 net", price: "18,000" },
              { icon: Beef, ar: "خروف",   en: "Sheep",        weight: isAr ? "وزن ٥٠-٦٠ ك قائم" : "Live weight: 50-60 kg", price: isAr ? "١٤٥٠ - ١٥٥٠" : "1,450 - 1,550" },
            ].map((p, i) => (
              <div key={i} className="rounded-3xl border-2 border-[hsl(45_85%_55%)]/40 bg-[hsl(152_55%_15%)]/95 p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-[hsl(45_85%_60%)]/80">
                <div className="flex items-center justify-center gap-2">
                  <p.icon className="h-6 w-6 text-[hsl(45_85%_65%)]" />
                  <h3 className="text-2xl font-black text-primary-foreground md:text-3xl">{isAr ? p.ar : p.en}</h3>
                </div>
                <div className="mt-2 text-sm font-bold text-primary-foreground/85 md:text-base">{p.weight}</div>
                <div className="mt-2 font-mono text-2xl font-black text-[hsl(45_85%_70%)] md:text-3xl">
                  {p.price} <span className="text-lg font-extrabold text-primary-foreground/90">{isAr ? "جنيه" : "EGP"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-2 rounded-full border border-[hsl(45_85%_55%)]/30 bg-[hsl(152_55%_15%)]/60 px-4 py-3 text-center text-sm font-bold text-primary-foreground/95 md:text-base">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[hsl(45_85%_65%)]" />
            {isAr ? "الأسعار تحت العجز والزيادة شاملة كل النفقات المتعلقة بالصك" : "Prices include all expenses; subject to ±deficit/surplus adjustment"}
          </div>

          {/* Lime contact pill */}
          <div className="mx-auto mt-6 max-w-3xl rounded-[2rem] bg-secondary p-5 text-center text-secondary-foreground shadow-cta">
            <div className="space-y-1.5 text-sm font-extrabold md:text-base">
              <div>{isAr ? "أرقامنا:" : "Phones:"} <span className="font-mono">01097000137</span> – {isAr ? "يمكنك طلب مندوب يصل لمنزلك" : "Home pickup available"}</div>
              {bankText && <div>{isAr ? "الحساب البنكي" : "Bank account"} <span className="font-mono">{bankText}</span></div>}
              <div>{isAr ? "العنوان: المنصورة، تقسيم خطاب، بجوار وكالة المنصورة" : "Address: Mansoura, Khattab District, next to Mansoura Agency"}</div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate?program=odhya"><Heart className="h-5 w-5" />{isAr ? "احجز صك الأضحية" : "Reserve a share"}</Link>
              </Button>
              <a
                href="https://wa.me/201097000137?text=عايز%20احجز%20صك%20أضحية%20من%20الموقع"
                target="_blank" rel="noopener"
                className="inline-flex h-11 items-center gap-2 rounded-md border-2 border-primary/30 bg-primary px-5 text-sm font-extrabold text-primary-foreground hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />{isAr ? "تواصل واتساب" : "WhatsApp us"}
              </a>
            </div>
          </div>

          {/* Trust chips */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { img: iconVet,     ar: "معاينة طبية قبل الذبح", en: "Vet pre-inspection" },
              { img: iconCam,     ar: "صور وفيديو لكل صك",     en: "Photo & video proof" },
              { img: iconTruck,   ar: "توصيل يوم العيد",       en: "Eid-day delivery" },
              { img: iconReceipt, ar: "إيصال PDF فوري",        en: "Instant PDF receipt" },
            ].map(({ img, ar, en }) => (
              <div key={en} className="flex flex-col items-center gap-2 rounded-2xl border border-[hsl(45_85%_55%)]/25 bg-primary-foreground/5 p-3 text-center">
                <img src={img} alt={isAr ? ar : en} loading="lazy" width={56} height={56} className="h-12 w-12 object-contain md:h-14 md:w-14" />
                <div className="text-[12px] font-extrabold leading-tight text-primary-foreground/95 md:text-[13px]">{isAr ? ar : en}</div>
              </div>
            ))}
          </div>

          {/* Countdown footer */}
          <div className="mx-auto mt-8 max-w-md text-center text-primary-foreground/85">
            <span className="font-mono text-3xl font-black text-secondary">{days}</span>
            <span className="mx-2 text-base font-extrabold">{isAr ? `يوم تقريبًا على عيد الأضحى ${QURBANI_SEASON.year}` : `days (approx.) to Eid al-Adha ${QURBANI_SEASON.year}`}</span>
          </div>
        </div>
      </section>

      {/* Goals & countdown reuse */}
      {QURBANI_SEASON.bookingOpen && <QurbaniCampaign />}

      {/* Sticky in-page nav — keeps users oriented across long content */}
      <nav
        aria-label={isAr ? "فهرس صفحة صك أضحية الدقهلية" : "Dakahlia Qurbani page table of contents"}
        className="sticky top-16 z-30 border-y border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      >
        <div className="container mx-auto flex items-center justify-center gap-2 overflow-x-auto px-4 py-2 text-xs font-extrabold text-primary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:text-sm">
          <ol className="flex items-center gap-2">
            {[
              { id: "how",    ar: "كيف تصل أضحيتك", en: "How it works" },
              { id: "cities", ar: "مدن الدقهلية",   en: "Cities" },
              { id: "faq",    ar: "الأسئلة الشائعة", en: "FAQ" },
            ].map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  title={isAr ? s.ar : s.en}
                  className="block shrink-0 rounded-full bg-secondary/15 px-3 py-1.5 hover:bg-secondary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                >
                  {isAr ? s.ar : s.en}
                </a>
              </li>
            ))}
          </ol>
          <Link to="/donate?program=odhya" className="ms-3 shrink-0 rounded-full bg-orange-grad px-4 py-1.5 text-accent-foreground shadow-cta">
            {isAr ? "احجز صك" : "Reserve"}
          </Link>
        </div>
      </nav>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-background py-16 md:py-20 leaf-pattern">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-2xl">{isAr ? "كيف تصل أضحيتك للأسرة؟" : "How your Qurbani reaches the family"}</h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-4">
            {[
              { I: Heart, ar: "1. تحجز صك أضحية", en: "1. Reserve a share" },
              { I: ShieldCheck, ar: "2. نعاين الحيوان طبياً", en: "2. Vet inspects animal" },
              { I: Camera, ar: "3. نوثّق الذبح بالفيديو", en: "3. Slaughter on video" },
              { I: Truck, ar: "4. نسلم لباب البيت", en: "4. Doorstep delivery" },
            ].map((s, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><s.I className="h-5 w-5" /></div>
                <div className="mt-3 font-black text-primary">{isAr ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities directory */}
      <section id="cities" className="scroll-mt-24 bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-2xl">{isAr ? "صك أضحية في كل مدن الدقهلية" : "Qurbani in every Dakahlia city"}</h2>
            <p className="mt-3 text-muted-foreground">{isAr ? "اختر مدينتك لرؤية البرامج الفعالة فيها وحجز صك أضحية موجَّه لأسرها." : "Pick your city to see active programs and reserve a Qurbani share targeted to its families."}</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DAKAHLIA_CITIES.map((c) => (
              <Link key={c.slug} to={`/qurbani/${c.slug}`} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-secondary" />{isAr ? "الدقهلية" : "Dakahlia"}
                  </div>
                  <div className="mt-1 text-lg font-black text-primary">
                    {isAr ? `صك أضحية ${c.ar}` : `Qurbani in ${c.en}`}
                  </div>
                  <div className="text-[11px] font-bold text-muted-foreground">
                    {c.families.toLocaleString()} {isAr ? "أسرة مستفيدة" : "families served"}
                  </div>
                </div>
                <div className="rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-extrabold text-primary">
                  {c.programs.length} {isAr ? "برامج" : "progs"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Real-field proof gallery — Qurbani 2024 / 2025 + 2026 convoys */}
      <FieldConvoysGallery variant="qurbani" donateHref="/donate?program=odhya" galleryKey="qurbani" />

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-black text-primary md:text-2xl">{isAr ? "أسئلة شائعة عن صك الأضحية بالدقهلية" : "Dakahlia Qurbani FAQ"}</h2>
          <div className="mt-8 space-y-3">
            {faq.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft">
                <summary className="flex cursor-pointer items-start justify-between gap-3 font-extrabold text-primary">
                  <span>{f.q}</span>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/donate?program=odhya"><Heart className="h-5 w-5" />{isAr ? "احجز صك أضحيتك الآن" : "Reserve your share"}</Link>
            </Button>
          </div>
        </div>
      </section>
      {/* Final CTA — soft-orange brand-pattern background with banner image */}
      <section
        aria-label={isAr ? "احجز صك أضحيتك" : "Reserve your share"}
        className="relative overflow-hidden bg-[hsl(28_80%_94%)]"
      >
        {/* Brand leaf pattern, tinted to match soft-orange tone */}
        <div aria-hidden className="pointer-events-none absolute inset-0 leaf-bg opacity-25 mix-blend-multiply" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(28_85%_88%/0.6),transparent_60%)]" />

        <div className="container relative mx-auto grid items-center gap-8 px-4 pt-12 pb-28 sm:pb-36 md:pt-16 md:pb-44 md:grid-cols-2">
          {/* Text + chips + CTAs */}
          <div className="text-center md:text-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" />
              {isAr ? `حملة العيد الكبير ${QURBANI_SEASON.year}` : `Eid al-Adha ${QURBANI_SEASON.year} campaign`}
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-primary md:text-5xl">
              {QURBANI_SEASON.bookingOpen
                ? (isAr ? "سارع بحجز صك أضحيتك قبل ما يخلص الوقت" : "Hurry — reserve your Qurbani before time runs out")
                : (isAr ? "أضحيتك مع اليسر: معاينة وتوثيق لحد باب البيت" : "Your Qurbani with Al-Yusr: inspected and documented to the doorstep")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-foreground/75 md:mx-0 md:text-base">
              {isAr
                ? "كل صك بيتعاين قبل الذبح ويتوثّق بالصور والفيديو — لراحة بال كاملة."
                : "Every share is vet-inspected before slaughter and documented with photo & video — full peace of mind."}
            </p>

            <ul className="mx-auto mt-5 flex flex-wrap justify-center gap-2 md:mx-0 md:justify-start">
              {[
                { I: ShieldCheck, ar: "أمانة شرعية", en: "Sharia trust" },
                { I: BadgeCheck,  ar: "جودة مضمونة", en: "Guaranteed quality" },
                { I: FileCheck2,  ar: "توثيق كامل",  en: "Full documentation" },
              ].map(({ I, ar, en }) => (
                <li
                  key={en}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-card/70 px-3 py-1.5 text-xs font-extrabold text-primary shadow-soft backdrop-blur"
                >
                  <I className="h-3.5 w-3.5 text-accent" />
                  {isAr ? ar : en}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate?program=odhya"><Heart className="h-5 w-5" />{isAr ? "احجز صك أضحية الآن" : "Reserve a share now"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary/30 bg-card text-primary hover:bg-primary/5">
                <Link to="/donate?program=odhya">{isAr ? "تبرّع الآن" : "Donate now"}</Link>
              </Button>
            </div>
          </div>

          {/* Banner image */}
          <Link
            to="/donate?program=odhya"
            className="group relative block overflow-hidden rounded-3xl shadow-card ring-1 ring-accent/30 transition hover:-translate-y-0.5 hover:shadow-cta"
            aria-label={isAr ? "احجز صك أضحية" : "Reserve a Qurbani share"}
          >
            <img
              src={qurbaniBanner}
              alt={isAr ? "أضحيتك عندنا غير — مؤسسة اليسر الخيرية، احجز صك أضحية" : "Your Qurbani is different with us — Al-Yusr Charity, reserve your 2026 share"}
              width={1920} height={812}
              loading="lazy" decoding="async"
              className="h-auto w-full object-cover transition group-hover:scale-[1.02]"
            />
          </Link>
        </div>
      </section>
      <StickyQurbaniCTA donateHref={QURBANI_SEASON.bookingOpen ? "/donate?program=odhya" : "/farm"} />
    </PageLayout>
  );
};

export default QurbaniLanding;