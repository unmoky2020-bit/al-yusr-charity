import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Beef, Wheat, ShieldCheck, Sprout, CheckCircle2, Heart, MessageCircle, Truck, Scale, Leaf, Stethoscope, Package, Users, TrendingUp } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { useLang } from "@/i18n/LangContext";
import farmHero from "@/assets/qurbani-cow-sheep.png";
import imgQurbani from "@/assets/qurbani-meat-quality.png";
import imgCowSheep from "@/assets/qurbani-cow-sheep.png";
import imgMeatTrays from "@/assets/yusr-qurbani-pricing.png";
import imgTakrimVan from "@/assets/qurbani-trusted-source.png";
import { FieldConvoysGallery } from "@/components/sections/FieldConvoysGallery";

const Farm = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const wa = `https://wa.me/201097000137?text=${encodeURIComponent(isRTL ? "السلام عليكم، عايز أعرف تفاصيل المزرعة الوقفية والأضحية." : "Hi, I want to know more about the endowment farm and Qurbani.")}`;

  const features = isRTL
    ? [
        { I: ShieldCheck, t: "ماشية محصنة بالكامل", d: "كل رأس بسجل بيطري وتطعيمات معتمدة قبل الذبح." },
        { I: Wheat,       t: "أعلاف بلدي طبيعية", d: "بنربّي بأفضل الأعلاف بدون هرمونات لجودة لحم حقيقية." },
        { I: Scale,       t: "بدون وسطاء وبدون ربح", d: "بنربط المضحي بالمستحق مباشرة — لا أرباح ولا عمولات." },
        { I: Truck,       t: "تسليم بكرامة لباب البيت", d: "اللحم بيوصل طازج للأسر المتعففة في نفس اليوم." },
        { I: Leaf,        t: "وقف مستدام", d: "الأرباح بترجع لزيادة عدد الرؤوس وخدمة أسر أكتر كل سنة." },
        { I: Sprout,      t: "إنتاج محلّي 100%", d: "مزارع مصرية بأيدي شباب مصري — دعم للاقتصاد المحلي." },
      ]
    : [
        { I: ShieldCheck, t: "Fully vaccinated livestock", d: "Each head has a vet record and certified vaccinations before slaughter." },
        { I: Wheat,       t: "Natural local feed", d: "Raised on premium hormone-free feed for genuine meat quality." },
        { I: Scale,       t: "No middlemen, no profit", d: "We connect the donor directly to the recipient — zero commission." },
        { I: Truck,       t: "Dignified doorstep delivery", d: "Fresh meat reaches needy families on the same day." },
        { I: Leaf,        t: "Sustainable endowment", d: "Profits expand the herd to serve more families every year." },
        { I: Sprout,      t: "100% local production", d: "Egyptian farms run by Egyptian youth — supporting local economy." },
      ];

  const stats = [
    { n: "4 طن", en: "4 tons",   ar: "لحوم وُزعت 2025",      enL: "Meat distributed 2025" },
    { n: "+3 طن", en: "+3 tons", ar: "إنتاج شهري",           enL: "Monthly production" },
    { n: "100%", en: "100%",     ar: "ماشية بلدي وقفية",      enL: "Local endowment cattle" },
    { n: "0%",   en: "0%",       ar: "هامش ربح للمؤسسة",     enL: "Foundation profit margin" },
  ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "مزارع اليسر الوقفية بالدقهلية | صك أضحية ولحوم بلدي بدون وسطاء — المنصورة" : "Al-Yusr Endowment Farm in Dakahlia | Qurbani & local meat, zero middlemen — Mansoura"}
        description={isRTL ? "مزارع اليسر الوقفية بتوفر  لحوم بلدي طازجة وماشية محصنة لصكوك الأضحية والمواسم الخيرية في المنصورة — بدون ربح وبجودة تليق بالإنسان." : "Al-Yusr endowment farms across Dakahlia supply fresh local meat and certified livestock for Qurbani and seasonal aid in Mansoura — zero profit, real quality."}
        path="/farm"
        image={farmHero}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "المزارع الوقفية" : "Endowment Farm", url: `${base}/farm` },
      ]} />
      {/* Rich JSON-LD: Organization + LocalBusiness extension + ImageObject + FAQPage */}
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
              "@type": "ImageObject",
              contentUrl: `${base}${(farmHero as unknown as string)}`,
              caption: isRTL ? "مزرعة اليسر الوقفية بالدقهلية" : "Al-Yusr endowment farm in Dakahlia",
              creditText: "Al-Yusr Charity Foundation",
              copyrightNotice: "© Al-Yusr Charity Foundation",
              creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
              license: `${base}/terms`,
              acquireLicensePage: `${base}/contact`,
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: isRTL ? "هل اللحوم بلدي 100%؟" : "Is the meat 100% local?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "نعم، إنتاج المزرعة الوقفية بالدقهلية بأعلاف بلدي طبيعية وبدون هرمونات." : "Yes — produced in our Dakahlia endowment farm on natural local feed, hormone-free." },
                },
                {
                  "@type": "Question",
                  name: isRTL ? "هل في هامش ربح؟" : "Is there a profit margin?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "0% — المتبرع يدفع التكلفة الفعلية فقط، والأرباح تُعاد لزيادة الرؤوس." : "0% — donors pay actual cost; profits expand the herd." },
                },
                {
                  "@type": "Question",
                  name: isRTL ? "هل يصل الصك في يوم العيد؟" : "Will my share arrive on Eid day?",
                  acceptedAnswer: { "@type": "Answer", text: isRTL ? "نعم، التوزيع في نفس يوم العيد بالمنصورة وكل مدن الدقهلية." : "Yes — same-day Eid delivery across Mansoura and all Dakahlia cities." },
                },
              ],
            },
            {
              "@type": "Service",
              "@id": `${base}/farm#service`,
              serviceType: isRTL ? "صك أضحية ولحوم بلدي وقفية" : "Qurbani share & endowment local meat",
              provider: { "@id": `${base}/#org` },
              areaServed: [
                { "@type": "AdministrativeArea", name: isRTL ? "محافظة الدقهلية" : "Dakahlia Governorate" },
                { "@type": "AdministrativeArea", name: isRTL ? "الدقهلية الشرقية" : "East Dakahlia" },
                { "@type": "City", name: isRTL ? "المنصورة" : "Mansoura" },
                { "@type": "City", name: isRTL ? "ميت غمر" : "Mit Ghamr" },
                { "@type": "City", name: isRTL ? "طلخا" : "Talkha" },
                { "@type": "AdministrativeArea", name: isRTL ? "محافظة كفر الشيخ" : "Kafr El Sheikh Governorate" },
              ],
              audience: { "@type": "Audience", audienceType: isRTL ? "أسر متعففة بالدقهلية" : "Underprivileged families in Dakahlia" },
              offers: { "@type": "Offer", priceCurrency: "EGP", price: "1400", url: `${base}/donate?program=odhya`, availability: "https://schema.org/InStock" },
            },
            {
              "@type": "HowTo",
              name: isRTL ? "إزاي تحجز صك أضحية من مزارع اليسر الوقفية" : "How to reserve a Qurbani share from Al-Yusr endowment farm",
              description: isRTL ? "خطوات حجز صك أضحية بدون وسطاء من مزرعة اليسر الوقفية بالدقهلية والمنصورة وميت غمر وطلخا." : "Steps to reserve a no-middlemen Qurbani share from Al-Yusr endowment farm in Dakahlia.",
              totalTime: "PT5M",
              step: [
                { "@type": "HowToStep", position: 1, name: isRTL ? "اختر النوع" : "Choose share", text: isRTL ? "اختر صك خروف أو سُبع بقرة من صفحة الأضحية." : "Pick a sheep or 1/7 cow share from the Qurbani page." },
                { "@type": "HowToStep", position: 2, name: isRTL ? "ادفع بأمان" : "Pay safely", text: isRTL ? "ادفع أونلاين بفيزا/فودافون كاش أو حوّل بنكي." : "Pay online by card / Vodafone Cash or bank transfer." },
                { "@type": "HowToStep", position: 3, name: isRTL ? "تابع المعاينة" : "Track inspection", text: isRTL ? "بنبعت لك صور وفيديو معاينة الماشية قبل الذبح." : "We send photos & video of livestock inspection before slaughter." },
                { "@type": "HowToStep", position: 4, name: isRTL ? "استلم التوثيق" : "Receive proof", text: isRTL ? "بنوزع اللحم في يوم العيد على أسر الدقهلية ونرسل لك توثيق التسليم." : "Meat is distributed on Eid day across Dakahlia and proof is shared." },
              ],
            },
            {
              "@type": "WebPage",
              "@id": `${base}/farm#webpage`,
              url: `${base}/farm`,
              name: isRTL ? "مزارع اليسر الوقفية بالدقهلية" : "Al-Yusr endowment farms — Dakahlia",
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", ".ai-answer"] },
              primaryImageOfPage: {
                "@type": "ImageObject",
                contentUrl: `${base}${(farmHero as unknown as string)}`,
                creditText: "Al-Yusr Charity Foundation",
                copyrightNotice: "© Al-Yusr Charity Foundation",
                creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
                license: `${base}/terms`,
                acquireLicensePage: `${base}/contact`,
              },
            },
          ],
        })}</script>
      </Helmet>

      <section className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="absolute inset-0 leaf-bg opacity-40" />
        <div className="container relative mx-auto px-4 py-12 md:py-24">
          <div className="flex justify-center text-primary-foreground/80 md:justify-start">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "المزارع الوقفية" : "Endowment Farm" }]} />
          </div>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
                <Sprout className="h-3.5 w-3.5" /> {isRTL ? "وقف خيري مستدام" : "Sustainable charitable endowment"}
              </span>
              <h1 className="mx-auto mt-4 max-w-xl text-3xl font-black leading-tight md:mx-0 md:text-5xl">
                {isRTL ? "مزارع اليسر الوقفية بالدقهلية | صك أضحية ولحوم بلدي " : "Al-Yusr endowment farms in Dakahlia | Qurbani & local meat "}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-primary-foreground/85 md:mx-0 md:text-lg">
                {isRTL
                  ? "بنربّي ماشية بلدي محصنة بأفضل الأعلاف، علشان نضمن لكل أسرة مستحقة لحم طازج بكرامة، وبدون أي وسطاء أو هامش ربح."
                  : "We raise vaccinated local livestock on premium feed so every family receives fresh, dignified meat — with no middlemen and zero profit margin."}
              </p>
              {/* Concise AI/voice-search answer block — speakable + internal linking. */}
              <p className="ai-answer mx-auto mt-3 max-w-xl text-sm text-primary-foreground/75 md:mx-0">
                {isRTL
                  ? "مزرعة اليسر الوقفية بتخدم الدقهلية الشرقية والمنصورة وميت غمر وطلخا وكفر الشيخ — صك أضحية مرخّص، معاينة قبل الذبح، وتوثيق صور وفيديو لكل أسرة مستفيدة."
                  : "Al-Yusr endowment farm serves East Dakahlia, Mansoura, Mit Ghamr, Talkha and Kafr El Sheikh — licensed Qurbani shares, pre-slaughter inspection, and full photo/video proof for every family."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to="/qurbani"><Heart className="h-5 w-5" />{isRTL ? "احجز صك أضحية" : "Reserve a Qurbani"}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <a href={wa} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5" />{isRTL ? "اسأل عن المزرعة" : "Ask about the farm"}</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/15 blur-2xl" aria-hidden />
              <img src={farmHero} alt={isRTL ? "مزرعة اليسر الوقفية" : "Al-Yusr endowment farm"} width={1600} height={900} className="relative w-full rounded-[2rem] border-4 border-secondary/40 object-cover shadow-card" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:py-10">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-mono text-3xl font-black text-secondary md:text-4xl">{isRTL ? s.n : s.en}</div>
              <div className="mt-1 text-xs font-extrabold text-primary-foreground/85 md:text-sm">{isRTL ? s.ar : s.enL}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Local SEO internal links — Centered perfectly on desktop and mobile */}
      <section className="bg-background border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-4 py-8 text-center">
          <h2 className="text-base font-black text-primary md:text-lg">
            {isRTL ? "صك أضحية اليسر في المنصورة" : "Al-Yusr Qurbani in Mansoura"}
          </h2>
          <p className="mx-auto mt-1 max-w-2xl text-xs text-muted-foreground md:text-sm">
            {isRTL ? "اختار مدينتك أو البرنامج المناسب، وكل تبرع موثَّق بالكامل:" : "Pick your city or program — every donation is fully documented:"}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {[
              { to: "/qurbani/mansoura",     label: isRTL ? "أضحية المنصورة" : "Qurbani Mansoura" },
              { to: "/programs/odhya",       label: isRTL ? "برنامج صك الأضحية" : "Qurbani program" },
              { to: "/programs/box",         label: isRTL ? "كرتونة الخير" : "elkhier box" },
              { to: "/programs/zakat",       label: isRTL ? "زكاة المال" : "Zakat" },
              { to: "/campaigns",            label: isRTL ? "كل الحملات النشطة" : "All active campaigns" },
              { to: "/trust",                label: isRTL ? "ضمانات الشفافية" : "Transparency guarantees" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition hover:border-secondary hover:bg-secondary/25"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-4xl">{isRTL ? "ليه المزرعة الوقفية؟" : "Why an endowment farm?"}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "علشان نضمن لكل مضحي ولكل مستحق نفس الجودة بنفس الأمانة، طول السنة." : "So every donor and every recipient gets the same quality with the same trust — all year round."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><f.I className="h-6 w-6" /></div>
                <h3 className="mt-3 font-black text-primary">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">
              <Beef className="h-3.5 w-3.5" /> {isRTL ? "موسم الأضحى" : "Qurbani season"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{isRTL ? "صك أضحية من مزرعتنا مباشرة" : "Qurbani directly from our farm"}</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL
                ? "وفّرنا أكثر من 2 طن لحوم سنوياً للأسر المتعففة من إنتاج المزرعة الوقفية فقط — بدون أي وسطاء، بكرامة كاملة، وفي اليوم نفسه."
                : "Over 2 tons of meat distributed annually to needy families from our endowment production — no middlemen, full dignity, same-day delivery."}
            </p>
            <ul className="mt-5 space-y-2 text-sm font-semibold text-foreground/85">
              {[isRTL ? "ذبح شرعي بإشراف مختص" : "Sharia-compliant slaughter under supervision",
                isRTL ? "تقطيع وتغليف صحي" : "Hygienic cutting and packaging",
                isRTL ? "صور وفيديو توثيق لكل صك" : "Photo and video documentation for every voucher"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" />{x}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/qurbani"><Heart className="h-4 w-4" />{isRTL ? "احجز صكك الآن" : "Reserve your voucher"}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/programs">{isRTL ? "كل برامج اليسر" : "All Al-Yusr programs"}</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src={imgCowSheep} alt={isRTL ? "ماشية بقري وأغنام بمزرعة اليسر الوقفية" : "Cattle and sheep at Al-Yusr endowment farm"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
            <img src={imgMeatTrays} alt={isRTL ? "صكوك أضحية اليسر — وزن الصك 30 كجم لحم بلدي" : "Al-Yusr Qurbani shares — 30kg of fresh local meat per share"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
            <img src={imgQurbani} alt={isRTL ? "تجهيز اللحوم بإشراف بيطري" : "Meat prep under veterinary supervision"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
            <img src={imgTakrimVan} alt={isRTL ? "سيارة تكريم الإنسان لتوصيل صكوك الأضحية لباب البيت" : "Al-Yusr 'Honor the Human' van delivering Qurbani shares to homes"} loading="lazy" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
          </div>
        </div>
      </section>

      {/* Livestock process timeline */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "رحلة الماشية… من المزرعة لبيت المستحق" : "From farm to family — the livestock journey"}
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "كل خطوة موثقة بإشراف بيطري وشرعي علشان توصل اللحوم بأعلى جودة وكرامة." : "Every step is documented under veterinary and Sharia supervision so meat arrives at peak quality and dignity."}
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(isRTL
              ? [
                  { I: Sprout,      t: "تربية وقفية", d: "تربية محلية بأعلاف بلدي طبيعية لمدة لا تقل عن 6 شهور." },
                  { I: Stethoscope, t: "إشراف بيطري", d: "تطعيمات وفحوصات دورية لكل رأس بسجل بيطري معتمد." },
                  { I: ShieldCheck, t: "ذبح شرعي موثق", d: "ذبح بإشراف شرعي بيطري داخل المسلخ بكاميرات توثيق." },
                  { I: Package,     t: "تقطيع وتغليف", d: "تقطيع صحي وتغليف فوري للحفاظ على الطزاجة قبل التوزيع." },
                ]
              : [
                  { I: Sprout,      t: "Endowment raising", d: "Local rearing on natural feed for at least 6 months." },
                  { I: Stethoscope, t: "Veterinary oversight", d: "Vaccinations and periodic checks with a certified record per head." },
                  { I: ShieldCheck, t: "Documented Sharia slaughter", d: "Performed under Sharia and veterinary supervision with on-site cameras." },
                  { I: Package,     t: "Cutting & packaging", d: "Hygienic cutting and instant packaging for maximum freshness." },
                ]
            ).map((s, i) => (
              <li key={i} className="relative rounded-3xl border border-border bg-card p-5 shadow-soft">
                <span className={`absolute -top-3 ${isRTL ? "right-5" : "left-5"} grid h-7 w-7 place-items-center rounded-full bg-secondary text-[12px] font-black text-primary shadow-soft`}>
                  {i + 1}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><s.I className="h-6 w-6" /></div>
                <h3 className="mt-3 font-black text-primary">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Endowment impact */}
      <section className="bg-primary py-14 text-primary-foreground md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-bold text-secondary">
              <TrendingUp className="h-3.5 w-3.5" /> {isRTL ? "أثر الوقف" : "Endowment impact"}
            </span>
            <h2 className="mt-3 text-2xl font-black md:text-4xl">
              {isRTL ? "وقف بيكبر… وأثر بيتضاعف كل سنة" : "An endowment that grows — impact compounding every year"}
            </h2>
            <p className="mt-3 text-primary-foreground/85 md:text-lg">
              {isRTL ? "أرباح الإنتاج بترجع لزيادة عدد الرؤوس، علشان نخدم أسر أكتر بنفس الجودة وبدون عبء على المتبرعين." : "Profits are reinvested to grow the herd so we serve more families at the same quality with no extra burden on donors."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { I: Beef,  ar: "+1,200 أسرة",   en: "+1,200 families",  arL: "استفادت سنوياً", enL: "served annually" },
              { I: Truck, ar: "12 محافظة",     en: "12 governorates",  arL: "تغطية ميدانية",   enL: "field coverage" },
              { I: Users, ar: "30 شاب",         en: "30 youth",          arL: "فرص عمل محلية",   enL: "local jobs created" },
              { I: Leaf,  ar: "0% وسطاء",      en: "0% middlemen",     arL: "تسليم مباشر",      enL: "direct delivery" },
            ].map((s, i) => (
              <div key={i} className="rounded-3xl border border-secondary/20 bg-primary-foreground/5 p-5 text-center backdrop-blur">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-secondary"><s.I className="h-6 w-6" /></div>
                <div className="mt-3 font-mono text-2xl font-black text-secondary md:text-3xl">{isRTL ? s.ar : s.en}</div>
                <div className="mt-1 text-xs font-extrabold text-primary-foreground/85 md:text-sm">{isRTL ? s.arL : s.enL}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* أين تُصرف المساهمات — Allocation breakdown */}
      <section className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Scale className="h-3.5 w-3.5" /> {isRTL ? "أين تُصرف مساهمات الصك؟" : "Where do voucher contributions go?"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "كل جنيه في الصك له مكان شفاف" : "Every pound in the voucher has a transparent place"}
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              {isRTL ? "تكلفة فعلية فقط — بدون أي هامش ربح للمؤسسة، بإشراف وزارة التضامن الاجتماعي." : "Actual cost only — zero foundation margin, under Ministry of Social Solidarity oversight."}
            </p>
          </div>
          <div className="mt-10 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
            {[
              { ar: "تربية الماشية والأعلاف بالدقهلية", en: "Livestock raising & feed (Dakahlia)", pct: 70, color: "bg-secondary" },
              { ar: "الذبح الشرعي والتقطيع والتغليف", en: "Sharia slaughter, cutting & packaging", pct: 18, color: "bg-accent" },
              { ar: "النقل والتوصيل لباب البيت بالمنصورة وميت غمر وطلخا", en: "Transport & doorstep delivery (Mansoura, Mit Ghamr, Talkha)", pct: 8, color: "bg-primary" },
              { ar: "التوثيق والمتابعة", en: "Documentation & follow-up", pct: 4, color: "bg-foreground/40" },
            ].map((a) => (
              <div key={a.en}>
                <div className="mb-1.5 flex items-center justify-between text-sm font-extrabold text-primary">
                  <span>{isRTL ? a.ar : a.en}</span>
                  <span className="font-mono text-secondary">{a.pct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`${a.color} h-full rounded-full`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="pt-3 text-center text-xs font-bold text-muted-foreground">
              {isRTL ? "0% هامش ربح — راجع التقرير المحاسبي السنوي في صفحة الشفافية." : "0% profit margin — see the annual audit on the Transparency page."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild variant="outline"><Link to="/trust">{isRTL ? "تقرير الشفافية" : "Transparency report"}</Link></Button>
              <Button asChild variant="outline"><Link to="/programs/odhya">{isRTL ? "تفاصيل برنامج الأضحية" : "Qurbani program details"}</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black text-primary md:text-3xl">
            {isRTL ? "صكك… بيدخل بيت محتاج" : "Your voucher reaches a needy home"}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {isRTL ? "ادعم المزرعة الوقفية بصك أضحية أو تبرع شهري — وكن سبب في استدامة العطاء." : "Support the endowment farm with a Qurbani voucher or a monthly gift — be a reason giving continues."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/qurbani"><Heart className="h-5 w-5" />{isRTL ? "احجز صك أضحية" : "Reserve a Qurbani voucher"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={wa} target="_blank" rel="noopener"><MessageCircle className="h-5 w-5" />{isRTL ? "تواصل واتساب" : "WhatsApp us"}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* نماذج توثيق — Proof gallery (real field photos 2024-2026) */}
      <FieldConvoysGallery variant="all" donateHref="/programs/odhya" />

      <LocalFAQ
        donateHref="/qurbani"
        title={isRTL ? "أسئلة شائعة عن صك الأضحية في الدقهلية" : "Qurbani share FAQs — Dakahlia"}
        intro={isRTL ? "إجابات سريعة للأسئلة اللي بنسمعها كل يوم من أهالي المنصورة وميت غمر وطلخا وبلقاس قبل العيد." : "Fast answers we hear every day from families across Mansoura, Mit Ghamr, Talkha and Belqas before Eid."}
        items={isRTL ? [
          { q: "إيه أقل سعر لصك أضحية في الدقهلية 2026؟", a: "صك الأضحية (سُبع بقرة) بيبدأ من 1400 جنيه، والخروف الكامل من 4500 جنيه — السعر شامل الذبح والتقطيع والتوزيع داخل الدقهلية بدون أي عمولة." },
          { q: "هل اللحمة بتوصل في يوم العيد فعلًا؟", a: "أيوه، التوزيع بيتم في نفس يوم العيد بقوافل اليسر في المنصورة وميت غمر وطلخا والسنبلاوين، وبتوصلك صور وفيديو التسليم خلال 24 ساعة." },
          { q: "إزاي أضمن إن صكي راح لأسرة مستحقة فعلًا؟", a: "كل أسرة بتدخل قاعدة بيانات اليسر بعد معاينة من الفريق الميداني وتأكيد من إمام الجامع أو الوحدة الاجتماعية في القرية، وبنرسل لك رقم متابعة لتتبع التبرع." },
          { q: "هل أقدر أحجز صك أضحية وأنا خارج مصر؟", a: "أيوه، تقدر تحجز أونلاين بفيزا أو ماستر كارد من أي دولة، أو تحوّل عبر إنستاباي للحساب الرسمي للمؤسسة، وهنوصلك التوثيق على الواتساب." },
          { q: "هل في فرق بين ماشية المزرعة الوقفية والماشية المستوردة؟", a: "ماشيتنا بلدي 100% من المزرعة الوقفية بالدقهلية، محصنة بسجل بيطري، ومتربية على أعلاف بلدي بدون هرمونات — ده اللي بيخلي اللحم طازج وآمن للأسر." },
          { q: "ممكن أزور المزرعة قبل ما أحجز؟", a: "أيوه، بنرحب بزيارة المتبرعين للمزرعة الوقفية بالدقهلية بميعاد مسبق — كلمنا على واتساب 01097000137 ونحدد لك معاد." },
        ] : [
          { q: "What is the lowest Qurbani share price in Dakahlia 2026?", a: "Shares start from EGP 1,400 (1/7 cow) and EGP 4,500 (full sheep), all-inclusive of slaughter, cutting and Dakahlia distribution — zero commission." },
          { q: "Will the meat really arrive on Eid day?", a: "Yes — same-day distribution by Al-Yusr convoys in Mansoura, Mit Ghamr, Talkha and Sinbillawayn, with photo/video proof sent within 24 hours." },
          { q: "How do I know my share reaches a truly deserving family?", a: "Every family is vetted by our field team and confirmed by the local mosque imam or social unit. You get a tracking reference to follow your donation." },
          { q: "Can I reserve from outside Egypt?", a: "Yes — pay online by Visa/Mastercard from any country, or transfer via InstaPay to the official account. We send the proof to your WhatsApp." },
          { q: "Is endowment-farm livestock different from imported meat?", a: "Our livestock is 100% local from the Dakahlia endowment farm, vet-vaccinated, and raised on hormone-free local feed — that's why the meat is fresh and safe." },
          { q: "Can I visit the farm before reserving?", a: "Yes — donor visits to the Dakahlia endowment farm are welcome by appointment. WhatsApp us on 01097000137 to schedule." },
        ]}
      />

      <StickyQurbaniCTA donateHref="/qurbani" />
    </PageLayout>
  );
};

export default Farm;