import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, Car, Clock, CreditCard, FileSearch, Globe, HandHeart, LifeBuoy, MapPin,
  Navigation, Phone, Receipt, ShieldCheck, Sofa, Star, Stethoscope, Users,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/i18n/LangContext";
import { usePrograms } from "@/data/sources/programs";
import { isListedProgram } from "@/data/programScope";
import { programHref } from "@/data/programLandings";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { ORG, googleReviewLink, whatsappLink } from "@/data/orgInfo";

const PATH = "/charity-mansoura";
const SITE = "https://elyusr.org";

/**
 * /charity-mansoura — the page for «جمعيات خيرية في المنصورة» and the searches around it
 * (جمعية خيرية بالمنصورة، مؤسسة خيرية في المنصورة، التبرع في المنصورة…).
 * People who search this are donors, families who need help, people with clothes or furniture to give,
 * and volunteers — the page answers all four, with the foundation's real address, registration and hours.
 * Only facts that are true on the site are stated: no numbers or testimonials that the dashboard doesn't hold.
 */
const CharityMansoura = () => {
  const { lang } = useLang();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const { programs: allPrograms, isLoading: programsLoading } = usePrograms();
  const programs = useMemo(() => allPrograms.filter((p) => isListedProgram(p.slug)).slice(0, 6), [allPrograms]);

  const helpText = ar
    ? "السلام عليكم، أنا من (اكتب منطقتك) ومحتاج مساعدة في: (اكتب نوع المساعدة)."
    : "Hello, I live in (your area) and I need help with: (type of help).";
  const visitText = ar ? "السلام عليكم، عايز أعرف أكتر عن مؤسسة اليسر في المنصورة." : "Hello, I'd like to know more about Al-Yusr in Mansoura.";

  const intents = [
    { to: "/donate", Icon: HandHeart, t: ar ? "عايز أتبرع" : "I want to donate", d: ar ? "أونلاين بالكارت أو بالتحويل، وتاخد رقم تتبع" : "Online by card or transfer, with a tracking number", accent: true },
    { href: whatsappLink(helpText), Icon: LifeBuoy, t: ar ? "محتاج مساعدة" : "I need help", d: ar ? "ابعتلنا على واتساب وفريقنا هيتواصل معاك" : "Message us on WhatsApp and our team will reach out" },
    { to: "/markoun", Icon: Sofa, t: ar ? "عندي حاجات أتبرع بيها" : "I have items to give", d: ar ? "ملابس وأثاث وأجهزة، ومندوب يستلم من بيتك" : "Clothes, furniture, appliances — picked up from home" },
    { to: "/volunteer", Icon: Users, t: ar ? "عايز أتطوع" : "I want to volunteer", d: ar ? "اشتغل معانا في التوزيع والحملات" : "Join our distributions and campaigns" },
  ];

  const trust = [
    { Icon: BadgeCheck, t: ar ? "رقم إشهار رسمي" : "Official registration", d: ar ? `${ORG.registrationAr}. اسأل أي جمعية عن رقم إشهارها قبل ما تتبرع.` : `${ORG.registrationEn}. Ask any charity for its registration number before you give.`, to: "/trust" },
    { Icon: Building2, t: ar ? "مقر تقدر تزوره" : "An office you can visit", d: ar ? `${ORG.addressAr}. ${ORG.hours.labelAr}.` : `${ORG.addressEn}. ${ORG.hours.labelEn}.`, href: ORG.mapsUrl },
    { Icon: Receipt, t: ar ? "رقم تتبع لكل تبرع" : "A tracking number for every gift", d: ar ? "كل تبرع بياخد رقم تقدر تتابع بيه حالته في أي وقت." : "Every donation gets a number you can use to follow it at any time.", to: "/donate/track" },
    { Icon: CreditCard, t: ar ? "دفع آمن" : "Secure payment", d: ar ? "الدفع بالكارت عن طريق بوابة كاشير، ومش بنحتفظ ببيانات كارتك." : "Card payments go through the Kashier gateway; we never store your card.", to: "/trust" },
    { Icon: FileSearch, t: ar ? "حالات بتتراجع قبل ما تتنشر" : "Cases are checked before they go live", d: ar ? "كل حالة بتتعمل لها مراجعة ميدانية، وتقدر تشوف المطلوب والمتجمّع لحد دلوقتي." : "Each case is reviewed in the field, and you can see the goal and what's been raised.", to: "/cases" },
    { Icon: Star, t: ar ? "رأي الناس فيها" : "What people say about it", d: ar ? "اقرأ تقييمات اللي اتعاملوا معانا على خرايط جوجل، وبعد ما تتعامل معانا اكتب رأيك." : "Read reviews from people who dealt with us on Google Maps, and leave yours once you have.", href: googleReviewLink() },
  ];

  // Two services people look up by name: free Takrim inside Mansoura, and the medical complex in El-Hafir.
  const takrimText = ar
    ? "السلام عليكم، محتاج خدمة تكريم الإنسان (الغسل والتكفين والنقل) في المنصورة."
    : "Hello, I need the Takrim service (washing, shrouding and transport) in Mansoura.";
  const services = [
    {
      Icon: Car, to: "/takrim",
      t: ar ? "تكريم الإنسان: غسل وتكفين ونقل المتوفى مجانًا" : "Takrim: free washing, shrouding and funeral transport",
      d: ar
        ? "فريق اليسر وسيارة تكريم الإنسان بيوصلوا لك داخل مدينة المنصورة: غسل وتكفين على السنة، ونقل للمسجد وبعدين للمقابر. الخدمة مجانية لكل الناس."
        : "Al-Yusr's team and the Takrim van come to you inside Mansoura: washing and shrouding per the Sunnah, then to the mosque and the cemetery. Free for everyone.",
      ctaHref: whatsappLink(takrimText), cta: ar ? "اطلب الخدمة على واتساب" : "Request it on WhatsApp",
      more: ar ? "تفاصيل الخدمة" : "About the service",
    },
    {
      Icon: Stethoscope, to: "/medical",
      t: ar ? "مجمع اليسر الطبي بالحفير" : "Al-Yusr Medical Complex, El-Hafir",
      d: ar
        ? "عيادات في تخصصات مختلفة، وروشتات بتتصرف بالمجان للمستحقين، وعمليات وأشعة وتحاليل، لأهالي القرى حوالين الحفير بين الدقهلية وكفر الشيخ."
        : "Clinics in several specialties, free prescriptions for those in need, surgeries, scans and lab tests for the villages around El-Hafir, between Dakahlia and Kafr El-Sheikh.",
      ctaTo: "/medical", cta: ar ? "ساهم في المجمع" : "Support the complex",
      more: ar ? "اعرف أكتر" : "Learn more",
    },
  ];

  const helpSteps = ar
    ? [
        { t: "ابعتلنا", d: "على واتساب أو زورنا في المقر: اسمك، ومنطقتك، ونوع المساعدة اللي محتاجها." },
        { t: "فريقنا يتواصل معاك", d: "علشان يعرف تفاصيل الحالة والمستندات المطلوبة." },
        { t: "المراجعة", d: "الحالات بتتراجع ميدانيًا قبل ما تتعتمد، علشان المساعدة توصل لمستحقها." },
      ]
    : [
        { t: "Reach out", d: "On WhatsApp or at our office: your name, area and the help you need." },
        { t: "Our team calls you", d: "To learn the details and the documents needed." },
        { t: "Review", d: "Cases are reviewed in the field before approval, so help reaches those who need it." },
      ];

  const cities = DAKAHLIA_CITIES;
  const cityHref = (slug: string, programsList: string[]) =>
    slug === "mansoura" ? "/donate/mansoura" : `/dakahlia/${slug}/${programsList.includes("box") ? "box" : programsList[0] ?? "odhya"}`;

  const faq = ar
    ? [
        { q: "فين مقر مؤسسة اليسر الخيرية في المنصورة؟", a: `${ORG.addressAr}. مواعيد الاستقبال: ${ORG.hours.labelAr}. وتقدر تكلمنا على ${ORG.phoneDisplay} أو على واتساب.` },
        { q: "هل مؤسسة اليسر جمعية خيرية مشهرة؟", a: `أيوه. مؤسسة اليسر الخيرية ${ORG.registrationAr}، ومقرها في المنصورة بمحافظة الدقهلية.` },
        { q: "إزاي أتبرع لجمعية خيرية في المنصورة وأنا في البيت؟", a: "من صفحة التبرع: بالكارت عن طريق بوابة كاشير، أو بالتحويل البنكي أو المحفظة أو إنستاباي وتبعت الإيصال على واتساب. وكل تبرع بياخد رقم تتبع." },
        { q: "أنا محتاج مساعدة، أتواصل مع الجمعية إزاي؟", a: "ابعتلنا على واتساب اسمك ومنطقتك ونوع المساعدة، أو زورنا في المقر في مواعيد الاستقبال. فريقنا هيتواصل معاك، والحالات بتتراجع ميدانيًا قبل اعتمادها." },
        { q: "ممكن أتبرع بملابس أو أثاث أو أجهزة في المنصورة؟", a: "أيوه، من خلال حملة مَرْكُون: بتبعت نوع الحاجات اللي عندك، ومندوب المؤسسة بيستلمها من بيتك في المنصورة والدقهلية." },
        { q: "فيه جمعية في المنصورة بتغسّل وتكفّن الموتى مجانًا؟", a: "أيوه، خدمة تكريم الإنسان من مؤسسة اليسر: فريق وسيارة بيوصلوا لك داخل مدينة المنصورة، بيغسّلوا المتوفى ويكفّنوه على السنة، وبينقلوه للمسجد وبعدين للمقابر. الخدمة مجانية لكل الناس، واطلبها على واتساب أو بالتليفون." },
        { q: "بتخدموا فين غير المنصورة؟", a: `بنخدم المنصورة ومراكز وقرى الدقهلية، منها: ${cities.filter((c) => c.slug !== "mansoura").map((c) => c.ar).join("، ")}. ومجمع الحفير الطبي بيخدم قرى بين الدقهلية وكفر الشيخ، وبعض المشاريع بتوصل لمحافظات تانية.` },
        { q: "أقدر أتبرع لجمعية في المنصورة وأنا برا مصر؟", a: "أيوه، بالكارت أونلاين من أي بلد، أو بتحويل بنكي دولي. الخطوات في صفحة «اتبرع لمصر من برا مصر»." },
        { q: "أقدر أتابع تبرعي بعد ما أدفع؟", a: "أيوه، برقم التتبع من صفحة «تتبع تبرعك» في أي وقت." },
        { q: "أقدر أتطوع مع جمعية خيرية في المنصورة؟", a: "أيوه، سجّل من صفحة التطوع، وهنتواصل معاك لما يبقى فيه حملة أو توزيع يناسبك." },
      ]
    : [
        { q: "Where is Al-Yusr Charity Foundation in Mansoura?", a: `${ORG.addressEn}. Opening hours: ${ORG.hours.labelEn}. Call ${ORG.phoneDisplay} or message us on WhatsApp.` },
        { q: "Is Al-Yusr a registered charity?", a: `Yes. ${ORG.registrationEn}. Al-Yusr is based in Mansoura, Dakahlia.` },
        { q: "How can I donate to a charity in Mansoura from home?", a: "From the donate page: by card through the Kashier gateway, or by bank transfer, wallet or InstaPay and send the receipt on WhatsApp. Every donation gets a tracking number." },
        { q: "I need help — how do I contact you?", a: "Send us your name, area and the help you need on WhatsApp, or visit our office during opening hours. Our team will contact you; cases are reviewed in the field before approval." },
        { q: "Can I donate clothes, furniture or appliances in Mansoura?", a: "Yes, through the Markoun campaign: tell us what you have and our team picks it up from your home in Mansoura and Dakahlia." },
        { q: "Is there a charity in Mansoura that washes and shrouds the deceased for free?", a: "Yes, Al-Yusr's Takrim service: a team and a van come to you inside Mansoura, wash and shroud the deceased per the Sunnah, and carry them to the mosque and then the cemetery. It is free for everyone; request it on WhatsApp or by phone." },
        { q: "Where else do you work?", a: `Mansoura and the towns and villages of Dakahlia, including ${cities.filter((c) => c.slug !== "mansoura").map((c) => c.en).join(", ")}. The El-Hafir medical complex serves villages between Dakahlia and Kafr El-Sheikh, and some projects reach other governorates.` },
        { q: "Can I donate to a Mansoura charity from outside Egypt?", a: "Yes, by card online from any country, or by international bank transfer. The steps are on the «Donate to Egypt from abroad» page." },
        { q: "Can I follow my donation?", a: "Yes, with your tracking number on the «Track your donation» page." },
        { q: "Can I volunteer?", a: "Yes, sign up on the volunteer page and we'll contact you when there's a campaign or distribution that suits you." },
      ];

  const title = ar ? "جمعية خيرية في المنصورة | مؤسسة اليسر الخيرية" : "Charity in Mansoura | Al-Yusr Charity Foundation";
  const description = ar
    ? "مؤسسة اليسر جمعية خيرية مشهرة برقم 2665 مقرها المنصورة (تقسيم خطاب). اتبرع أونلاين بأمان، أو اطلب مساعدة، أو اتبرع بملابس وأثاث يتستلموا من بيتك."
    : "Al-Yusr is a registered charity (No. 2665) based in Mansoura. Donate online securely, ask for help, or give clothes and furniture picked up from your home.";
  const keywords = ar
    ? "جمعيات خيرية في المنصورة, جمعية خيرية بالمنصورة, مؤسسة خيرية في المنصورة, جمعيات خيرية بالدقهلية, التبرع في المنصورة, عنوان جمعية خيرية في المنصورة, رقم جمعية خيرية في المنصورة, التبرع بالملابس في المنصورة, التبرع بالأثاث في المنصورة, غسل وتكفين الموتى مجانا المنصورة, نقل الموتى مجانا المنصورة, مجمع طبي الحفير"
    : "charity in Mansoura, charities in Mansoura Egypt, NGO Mansoura, donate in Mansoura, charity Dakahlia";

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE}${PATH}#webpage`,
    url: `${SITE}${PATH}`,
    name: title,
    description,
    inLanguage: ar ? "ar-EG" : "en",
    isPartOf: { "@id": `${SITE}/#website` },
    about: { "@id": `${SITE}/#org` },
    mainEntity: { "@id": `${SITE}/#local` },
    spatialCoverage: { "@type": "City", name: ar ? "المنصورة" : "Mansoura", containedInPlace: { "@type": "AdministrativeArea", name: ar ? "محافظة الدقهلية" : "Dakahlia" } },
  };

  return (
    <PageLayout>
      <SEOHelmet title={title} description={description} path={PATH} keywords={keywords} image={ar ? "/og-ar.jpg" : "/og-en.jpg"} />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: ar ? "الرئيسية" : "Home", url: `${SITE}/` },
          { name: ar ? "جمعية خيرية في المنصورة" : "Charity in Mansoura", url: `${SITE}${PATH}` },
        ]}
      />
      <FAQSchema items={faq} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageLd)}</script>
      </Helmet>

      {/* Hero: who we are, where, and the four reasons people search for a charity in Mansoura */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95" />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-10 text-center md:pb-14 md:pt-14">
          <div className="mb-3 flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "جمعية خيرية في المنصورة" : "Charity in Mansoura" }]} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-secondary">
            <MapPin className="h-3.5 w-3.5" /> {ar ? "المنصورة · الدقهلية" : "Mansoura · Dakahlia"}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            {ar ? <>جمعية خيرية في المنصورة: <span className="text-secondary">مؤسسة اليسر الخيرية</span></> : <>A charity in Mansoura: <span className="text-secondary">Al-Yusr Charity Foundation</span></>}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">
            {ar
              ? "مؤسسة أهلية مشهرة برقم 2665 لسنة 2019، مقرها في المنصورة (تقسيم خطاب، بجوار وكالة المنصورة). بنوصّل تبرعك لأسر محتاجة في المنصورة وقرى الدقهلية، ولو محتاج مساعدة تقدر تتواصل معانا مباشرة."
              : "A registered NGO (No. 2665 of 2019) based in Mansoura (Khattab District, next to Mansoura Agency). We deliver your gifts to families in need across Mansoura and Dakahlia, and if you need help you can reach us directly."}
          </p>

          <div className="mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-2.5 text-start sm:gap-3 lg:grid-cols-4">
            {intents.map(({ to, href, Icon, t, d, accent }) => {
              const cls = `group flex h-full flex-col gap-2 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${accent ? "border-transparent bg-orange-grad text-accent-foreground shadow-cta" : "border-white/15 bg-white/10 text-primary-foreground backdrop-blur-md hover:bg-white/15"}`;
              const inner = (
                <>
                  <Icon className={`h-6 w-6 ${accent ? "" : "text-secondary"}`} />
                  <span className="text-[15px] font-black leading-snug sm:text-base">{t}</span>
                  <span className={`text-[11.5px] font-bold leading-relaxed sm:text-xs ${accent ? "text-accent-foreground/90" : "text-primary-foreground/75"}`}>{d}</span>
                </>
              );
              return to ? (
                <Link key={t} to={to} className={cls}>{inner}</Link>
              ) : (
                <a key={t} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              );
            })}
          </div>

          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2 text-[11.5px] font-black sm:text-xs">
            {(ar
              ? ["مشهرة برقم 2665 لسنة 2019", "مقرنا في المنصورة", "دفع آمن عبر كاشير", "رقم تتبع لكل تبرع"]
              : ["Registered No. 2665/2019", "Based in Mansoura", "Secure Kashier payments", "Tracking number per gift"]
            ).map((x) => (
              <li key={x} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The foundation's card: the same name, address, phone and hours as Google Maps */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "بيانات الجمعية في المنصورة" : "Our details in Mansoura"}</h2>
            <dl className="mt-5 space-y-4 text-sm md:text-[15px]">
              {[
                { Icon: Building2, k: ar ? "الاسم" : "Name", v: ar ? ORG.nameAr : ORG.nameEn },
                { Icon: BadgeCheck, k: ar ? "الإشهار" : "Registration", v: ar ? ORG.registrationAr : ORG.registrationEn },
                { Icon: MapPin, k: ar ? "العنوان" : "Address", v: ar ? `${ORG.addressAr}، ${ORG.landmarkAr}` : `${ORG.addressEn}, ${ORG.landmarkEn}` },
                { Icon: Clock, k: ar ? "المواعيد" : "Hours", v: ar ? ORG.hours.labelAr : ORG.hours.labelEn },
                { Icon: Phone, k: ar ? "التليفون وواتساب" : "Phone & WhatsApp", v: ORG.phoneDisplay, ltr: true },
              ].map(({ Icon, k, v, ltr }) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/15 text-primary"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <dt className="text-xs font-black text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-bold leading-relaxed text-foreground" dir={ltr ? "ltr" : undefined}>{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a href={`tel:${ORG.phoneE164}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-black text-primary hover:border-secondary">
                <Phone className="h-4 w-4" /> {ar ? "اتصل" : "Call"}
              </a>
              <a href={whatsappLink(visitText)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-black text-white hover:opacity-95">
                <WhatsAppIcon className="h-4 w-4" /> {ar ? "واتساب" : "WhatsApp"}
              </a>
              <a href={ORG.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border font-black text-primary hover:border-secondary">
                <Navigation className="h-4 w-4" /> {ar ? "الاتجاهات" : "Directions"}
              </a>
            </div>
            {/* Reviews on the Google profile are the strongest signal for «جمعيات خيرية في المنصورة» on Maps */}
            <a href={googleReviewLink()} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-start transition hover:border-amber-300">
              <span>
                <span className="block text-sm font-black text-amber-900">{ar ? "اتعاملت معانا؟ قيّمنا على جوجل" : "Worked with us? Review us on Google"}</span>
                <span className="mt-0.5 block text-xs font-bold text-amber-900/70">{ar ? "رأيك بيساعد ناس تانية تعرف إن المؤسسة موثوقة" : "Your review helps others know they can trust us"}</span>
              </span>
              <span className="flex shrink-0 gap-0.5 text-amber-500" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </span>
            </a>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-muted shadow-soft">
            <iframe
              title={ar ? "مقر مؤسسة اليسر الخيرية في المنصورة على خرائط جوجل" : "Al-Yusr Charity Foundation in Mansoura on Google Maps"}
              src={ORG.mapsEmbed}
              className="block h-full min-h-[320px] w-full border-0 md:min-h-[420px]"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* What we do — live from the dashboard */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "بنعمل إيه في المنصورة والدقهلية" : "What we do in Mansoura and Dakahlia"}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{ar ? "برامج دايمة تقدر تتبرع لأي واحد فيها وتتابعه." : "Ongoing programs you can give to and follow."}</p>
            </div>
            <Link to="/programs" className="inline-flex items-center gap-1 text-sm font-black text-primary hover:text-secondary">
              {ar ? "كل البرامج" : "All programs"} <Arrow className="h-4 w-4" />
            </Link>
          </div>
          {programsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="space-y-2 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p) => (
                <Link key={p.slug} to={programHref(p.slug)} className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {p.image && <img src={p.image} alt={ar ? p.ar.name : p.en.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-primary">{ar ? p.ar.name : p.en.name}</h3>
                    {(ar ? p.ar.tagline : p.en.tagline) && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{ar ? p.ar.tagline : p.en.tagline}</p>}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-accent">{ar ? "اتبرع للبرنامج" : "Give to this program"} <Arrow className="h-4 w-4" /></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Free services people in Mansoura search for by name */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "خدمات مجانية من اليسر في المنصورة وحواليها" : "Free services from Al-Yusr in and around Mansoura"}</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {services.map(({ Icon, to, t, d, ctaHref, ctaTo, cta, more }) => (
              <article key={t} className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-primary"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-black leading-snug text-primary md:text-xl">{t}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {ctaHref ? (
                    <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-white hover:opacity-95">
                      <WhatsAppIcon className="h-4 w-4" /> {cta}
                    </a>
                  ) : (
                    <Link to={ctaTo ?? to} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta">
                      <HandHeart className="h-4 w-4" /> {cta}
                    </Link>
                  )}
                  <Link to={to} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border px-5 text-sm font-black text-primary hover:border-secondary">
                    {more} <Arrow className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LinkedCasesSection
        filter={{}}
        limit={3}
        isRTL={ar}
        title={ar ? "حالات محتاجة دعم دلوقتي" : "Cases that need support now"}
        subtitle={ar ? "حالات اتراجعت ميدانيًا، وتقدر تشوف المطلوب والمتجمّع لكل واحدة." : "Field-reviewed cases with their goal and what has been raised."}
        className="bg-muted/30"
      />

      {/* How to choose a charity you can trust — the question behind «جمعيات خيرية في المنصورة» */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "إزاي تختار جمعية خيرية في المنصورة تثق فيها؟" : "How to choose a charity in Mansoura you can trust"}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            {ar ? "قبل ما تتبرع لأي جمعية، اتأكد من الست حاجات دول. ودي إجابة اليسر على كل واحدة:" : "Before giving to any charity, check these six things. Here is how Al-Yusr answers each:"}
          </p>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trust.map(({ Icon, t, d, to, href }, i) => {
              const body = (
                <>
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
                    <span className="text-base font-black text-primary"><span className="me-1 text-secondary">{i + 1}.</span>{t}</span>
                  </span>
                  <span className="mt-3 block text-sm leading-relaxed text-muted-foreground">{d}</span>
                </>
              );
              const cls = "block h-full rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition hover:border-secondary";
              return (
                <li key={t}>
                  {to ? <Link to={to} className={cls}>{body}</Link> : <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* For families who need help */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-card md:p-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black md:text-3xl">{ar ? "محتاج مساعدة؟" : "Do you need help?"}</h2>
                <ol className="mt-5 space-y-4">
                  {helpSteps.map((s, i) => (
                    <li key={s.t} className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary font-black text-slate-950">{i + 1}</span>
                      <div>
                        <p className="font-black">{s.t}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-primary-foreground/80">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <a href={whatsappLink(helpText)} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 font-black text-white shadow-lg transition hover:-translate-y-0.5">
                <WhatsAppIcon className="h-5 w-5" /> {ar ? "ابعت طلبك على واتساب" : "Send your request on WhatsApp"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Where we work */}
      <section className="bg-background py-12 md:py-14">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "بنخدم المنصورة وكل مراكز الدقهلية" : "Mansoura and every Dakahlia district"}</h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link to={cityHref(c.slug, c.programs)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-black text-primary transition hover:border-secondary hover:bg-secondary/10">
                  <MapPin className="h-3.5 w-3.5 text-secondary" /> {ar ? c.ar : c.en}
                </Link>
              </li>
            ))}
          </ul>
          {/* Donors outside Mansoura and outside Egypt */}
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-start sm:grid-cols-2">
            <Link to="/charity-egypt" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:border-secondary">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><MapPin className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block font-black text-primary">{ar ? "مش في المنصورة؟" : "Not in Mansoura?"}</span>
                <span className="block text-xs font-bold text-muted-foreground">{ar ? "اتبرع من أي محافظة في مصر" : "Give from any governorate in Egypt"}</span>
              </span>
            </Link>
            <Link to="/donate-from-abroad" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:border-secondary">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Globe className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block font-black text-primary">{ar ? "عايش برا مصر؟" : "Living outside Egypt?"}</span>
                <span className="block text-xs font-bold text-muted-foreground">{ar ? "اتبرع بالكارت أو بتحويل بنكي دولي" : "Give by card or international transfer"}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Questions people ask about charities in Mansoura */}
      <section className="bg-muted/30 pb-28 pt-12 sm:pb-36 md:pb-44 md:pt-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-black text-primary md:text-3xl">{ar ? "أسئلة عن الجمعيات الخيرية في المنصورة" : "Questions about charities in Mansoura"}</h2>
          <Accordion type="single" collapsible className="mt-6 rounded-3xl border border-border/70 bg-card px-5 shadow-soft">
            {faq.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className={i === faq.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="gap-3 text-[15px] font-black text-primary hover:no-underline">
                  <span className="flex-1 text-start leading-relaxed">{f.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/donate" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-grad px-7 font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5">
              <HandHeart className="h-5 w-5" /> {ar ? "اتبرع دلوقتي" : "Donate now"}
            </Link>
            <Link to="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border px-7 font-black text-primary hover:border-secondary">
              {ar ? "تواصل معنا" : "Contact us"}
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default CharityMansoura;
