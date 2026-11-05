import { Link } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  UtensilsCrossed,
  Stethoscope,
  GraduationCap,
  Droplets,
  Home,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ClipboardCheck,
  Truck,
  FileCheck2,
  HandHeart,
  Check,
  MapPin,
  Moon,
  Snowflake,
  BookOpen,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import type { CaseRow } from "@/data/casesApi";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs } from "@/data/faqsApi";
import { usePrograms } from "@/data/sources/programs";
import { Skeleton } from "@/components/ui/skeleton";
import { BrideTrousseau } from "@/components/sections/BrideTrousseau";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import { Helmet } from "react-helmet-async";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { motion, useReducedMotion } from "motion/react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GEO_GOVERNORATES } from "@/data/geoPages";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { TagsRail } from "@/components/common/TagsRail";
import { programHref } from "@/data/programLandings";
import { isListedProgram } from "@/data/programScope";
import { useListingHero } from "@/data/listingHeroes";
// Accordion imports kept for other uses
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Projects = () => {
  const { lang, t } = useLang();
  const isRTL = lang === "ar";
  const reduce = useReducedMotion();
  // Dashboard → البرامج → «صورة أعلى الصفحة» (default: the programs banner).
  const heroImg = useListingHero("programs");
  // Published backend programs (static copy only when the API is unreachable).
  const { programs: allPrograms, isLoading: programsLoading } = usePrograms();
  // One list, from the backend: campaigns and projects have their own pages and are never repeated here.
  // While the backend list loads, nothing from the built-in copy is shown (no flash of old programs).
  const programs = useMemo(() => (programsLoading ? [] : allPrograms.filter((p) => isListedProgram(p.slug))), [allPrograms, programsLoading]);
  const programSlugs = useMemo(() => new Set(programs.map((p) => p.slug)), [programs]);
  // Cases shown on this page belong to a program that is listed here (not to a hidden / stopped one).
  const includeProgramCase = useCallback((c: CaseRow) => !!c.program_slug && programSlugs.has(c.program_slug), [programSlugs]);
  const programNamesAr = programs.map((p) => p.ar.name).join("، ");
  const programNamesEn = programs.map((p) => p.en.name).join(", ");
  const programsSeoDescription = isRTL
    ? `برامج مؤسسة اليسر الخيرية في مصر، من المنصورة إلى محافظات مصر: ${programs.slice(0, 7).map((p) => p.ar.name).join("، ")} — بحث اجتماعي قبل الصرف وتوثيق بالصور.`
    : `Al-Yusr Charity programs across Egypt, from Mansoura to every governorate: ${programs.slice(0, 7).map((p) => p.en.name).join(", ")} — social assessment before spending and photo documentation.`;
  // Selected governorate tag — filters the GEO section so the page isn't
  // overwhelmed by 11+ huge cards. Defaults to Dakahlia (our home turf).
  const [activeGeo, setActiveGeo] = useState<string>(
    GEO_GOVERNORATES[0]?.slug ?? "",
  );
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const activeGov = useMemo(
    () => GEO_GOVERNORATES.find((g) => g.slug === activeGeo) ?? GEO_GOVERNORATES[0],
    [activeGeo],
  );
  const base = "https://elyusr.org";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const waMsg = encodeURIComponent(
    isRTL
      ? "السلام عليكم، أريد أن أعرف أنسب برنامج للتبرع أو للمساعدة مع مؤسسة اليسر."
      : "Hello, I'd like to learn which Al-Yusr program is best for donation or support."
  );
  const waHref = `https://wa.me/201097000137?text=${waMsg}`;
  const highlights = [
    isRTL ? "بحث اجتماعي قبل الصرف" : "Social assessment before spending",
    isRTL ? "تسليم بكرامة حتى باب البيت" : "Dignified doorstep delivery",
    isRTL ? "توثيق ومتابعة للأثر" : "Documented impact follow-up",
  ];

  // Mobile-aware motion presets — shorter stagger, smaller offsets, RTL-aware x slide.
  // Drives a premium-feeling reveal without jank on lower-end Android.
  const isMobile = typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;
  const dirX = isRTL ? 1 : -1;
  const axisStagger = isMobile ? 0.05 : 0.09;
  const axisDuration = isMobile ? 0.5 : 0.65;
  const axisOffsetY = isMobile ? 18 : 36;

  const axesStickyOffsets = [
    "top-[84px] md:top-[96px]",
    "top-[100px] md:top-[116px]",
    "top-[116px] md:top-[136px]",
  ];

  // Per-program signature innovations — what makes EACH program one-of-a-kind.
  // Used to power the new "Program signatures" section below for richer storytelling.
  const signatures: { slug: string; icon: any; ar: { t: string; d: string }; en: { t: string; d: string } }[] = [
    {
      slug: "odhya",
      icon: ShieldCheck,
      ar: { t: "ضمان جودة الأضحية", d: "الوحيدون في مصر الذين يقدّمون معاينة بيطرية مسبقة وذبحًا شرعيًا موثّقًا بالفيديو لكل صك." },
      en: { t: "Qurbani quality guarantee", d: "Only foundation in Egypt with pre-vet inspection and video-documented Shariah slaughter per voucher." },
    },
    {
      slug: "box",
      icon: Truck,
      ar: { t: "كرتونة + لحم بلدي", d: "كرتونة تكفي شهرًا كاملًا + كيلو لحم من مزارعنا الوقفية مع كل تبرع، لا مواد جافة فقط." },
      en: { t: "Food box + farm meat", d: "A full monthly box plus 1 kg of farm-fresh meat from our endowment farms with every donation." },
    },
    {
      slug: "water",
      icon: Droplets,
      ar: { t: "صدقة جارية بسهم 200 ج", d: "نقسّم تكلفة وصلة المياه إلى أسهم صغيرة حتى يستطيع أي متبرع المساهمة في مشروع ميداني كامل." },
      en: { t: "Lasting charity from 200 EGP", d: "We split each water line into micro-shares so any donor can participate in a real field project." },
    },
    {
      slug: "education",
      icon: GraduationCap,
      ar: { t: "حملة سبتمبر السنوية", d: "نفتح التسجيل قبل بداية الدراسة بأسابيع لنغطي مصاريف الطفل وزيّه وأدواته قبل اليوم الأول." },
      en: { t: "Annual September drive", d: "Registration opens weeks before school so we cover tuition, uniform and supplies before day one." },
    },
    {
      slug: "bride",
      icon: HandHeart,
      ar: { t: "تجهيز شقة كاملة بسهم 250 ج", d: "غرفة نوم وصالون ومطبخ وأجهزة — مشروع جماعي يحوّل تبرعك الصغير إلى جهاز عروس كامل." },
      en: { t: "Full apartment from 250 EGP shares", d: "Bedroom, living room, kitchen and appliances — your small share becomes a complete bride trousseau." },
    },
    {
      slug: "shelter",
      icon: Home,
      ar: { t: "تسقيف عازل بالبوتامين", d: "أسقف من البوتامين والخشب وأبواب وشبابيك آمنة — حملة من أكتوبر إلى فبراير لحماية الأسر من البرد." },
      en: { t: "Insulated bitumen roofing", d: "Bitumen and timber roofs with safe doors and windows — Oct–Feb drive protecting families from winter." },
    },
    {
      slug: "orphans",
      icon: HandHeart,
      ar: { t: "كفالة يتيم بتقرير شهري", d: "كفالة ٤٥٠ ج/شهر مع تقرير شهري بصور وفيديو ومتابعة دراسية وصحية موثّقة." },
      en: { t: "Orphan sponsorship + monthly report", d: "450 EGP/month with a monthly photo/video report and documented school & health follow-up." },
    },
    {
      slug: "treatment",
      icon: Stethoscope,
      ar: { t: "قافلة طبية موثّقة", d: "كشف وعلاج وتحاليل مجانية في القرى البعيدة مع ربط الحالات الحرجة بمستشفيات شريكة." },
      en: { t: "Field medical caravan", d: "Free check-ups, treatment and labs in remote villages, with critical cases referred to partner hospitals." },
    },
    {
      slug: "kitchen",
      icon: UtensilsCrossed,
      ar: { t: "مطبخ اليسر الدائم", d: "آلاف الوجبات الساخنة يوميًا — أول مطبخ خيري دائم في الدقهلية بإشراف غذائي معتمد." },
      en: { t: "Permanent Al-Yusr kitchen", d: "Thousands of hot meals daily — Dakahlia's first permanent charity kitchen under certified food supervision." },
    },
    {
      slug: "zakat",
      icon: ShieldCheck,
      ar: { t: "زكاة على المصارف الـ٨", d: "تخصيص زكاتك على المصارف الشرعية الثمانية مع مراجعة محاسبية مستقلة وتقرير شفّاف." },
      en: { t: "Zakat across all 8 channels", d: "Your Zakat allocated across the eight Shariah channels with independent accounting and transparent reporting." },
    },
  ];

  // Dynamic FAQ from Backend with robust fallback
  const { data: rawProgramsFaqs } = useQuery({
    queryKey: ["faqs-programs"],
    queryFn: () => fetchFaqs({ categorySlug: "programs" }),
    staleTime: 60_000,
  });

  const faqs = useMemo(() => {
    if (rawProgramsFaqs && rawProgramsFaqs.length > 0) {
      return rawProgramsFaqs.map((f) => ({
        q: isRTL ? f.question_ar : (f.question_en || f.question_ar),
        a: isRTL ? f.answer_ar : (f.answer_en || f.answer_ar),
      }));
    }
    return isRTL
      ? [
          { q: "ما هي أبواب التبرع المتاحة في مؤسسة اليسر؟", a: `برامجنا الحالية: ${programNamesAr}. ولكل موسم حملاته، وتجدها في صفحة «حملاتنا».` },
          { q: "هل تبرعي يصل فعلًا للمستحقين؟", a: "نعم. كل تبرع يمر ببحث اجتماعي ميداني للأسر، ثم يُسلَّم بكرامة حتى باب البيت، ويُوثَّق بصور وفيديو تصلك عبر واتساب أو البريد بعد التنفيذ." },
          { q: "هل أحصل على إيصال رسمي بالتبرع؟", a: "بمجرد إتمام الدفع يصلك إيصال إلكتروني فوري برقم مرجعي يمكنك أن تتابع به حالة تبرعك من صفحة «تتبع التبرع»." },
          { q: "ما الفرق بين التبرع لبرنامج والتبرع لحالة موثّقة؟", a: "التبرع لبرنامج (مثل صك أضحية أو كرتونة عزومة) يُوزَّع على أسر متعددة حسب الأشد احتياجًا، أما التبرع لحالة موثّقة فيذهب إلى حالة فردية بعينها مع متابعة نتيجتها." },
          { q: "هل يمكنني تخصيص تبرعي لمحافظة معينة؟", a: "نعم. تركيزنا الأساسي محافظة الدقهلية بكل مدنها وقراها، ونغطي أيضًا حالات في كفر الشيخ والصعيد. اطلب التخصيص من فريقنا على واتساب 201097000137+." },
          { q: "ما طرق الدفع المتاحة؟", a: "فيزا/ماستر كارد، Vodafone Cash، InstaPay، تحويل بنكي على CIB، أو دفع نقدي لدى ممثل المؤسسة في المنصورة." },
          { q: "هل المؤسسة مرخّصة رسميًا؟", a: "مؤسسة اليسر الخيرية مرخّصة من وزارة التضامن الاجتماعي تحت رقم إشهار 2665/2019، ومقرها الرئيسي بالمنصورة - الدقهلية." },
          { q: "كيف أتطوع أو أنضم إلى فريق العمل؟", a: "ادخل صفحة «تطوّع معنا» من القائمة، واختر المجال المناسب لمهاراتك، ثم قدّم طلبك. نوفّر تدريبًا ميدانيًا ومتابعة لكل متطوع جديد." },
        ]
      : [
          { q: "What donation programs does Al-Yusr offer?", a: `Our current programs: ${programNamesEn}. Seasonal campaigns are listed on the Campaigns page.` },
          { q: "Does my donation really reach the beneficiaries?", a: "Yes — every donation goes through field social assessment, dignified doorstep delivery, and is documented with photos and videos shared with you on WhatsApp or email after execution." },
          { q: "Will I receive an official receipt?", a: "An electronic receipt with a reference code is emailed to you instantly so you can track the case from our donation tracking page." },
          { q: "What is the difference between donating to a program and donating to a verified case?", a: "Program donations (e.g. a Qurbani voucher or food box) are distributed across multiple families by need. A verified case donation goes to one specific family with outcome follow-up." },
          { q: "Can I designate my donation to a specific governorate?", a: "Yes. Our primary focus is Dakahlia (all cities and villages); we also serve cases in Kafr El-Sheikh and Upper Egypt. Request a designation via WhatsApp +201097000137." },
          { q: "What payment methods are supported?", a: "Visa/Mastercard, Vodafone Cash, InstaPay, bank transfer to CIB, or in-person cash via our Mansoura representative." },
          { q: "Is the foundation officially licensed?", a: "Al-Yusr Charity Foundation is licensed by the Ministry of Social Solidarity under license number 2665/2019, headquartered in Mansoura, Dakahlia." },
          { q: "How can I volunteer or join the field team?", a: "Visit our volunteer campaigns page, pick a campaign, and apply for the slot that matches your skills. We provide field training and follow-up for every new volunteer." },
        ];
  }, [rawProgramsFaqs, isRTL, programNamesAr, programNamesEn]);

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "برامج خيرية في مصر | إطعام وعلاج وكفالة أيتام ومياه — اليسر" : "Charity programs in Egypt | Food, Health, Orphans, Water — Al-Yusr"}
        description={programsSeoDescription}
        path="/programs"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "البرامج" : "Programs", url: `${base}/programs` },
      ]} />
      {/* AIO/GEO/SIO: ItemList of programs with names + URLs + prices for AI answer engines */}
      <Helmet>
        {/* Rich ItemList: every program with image, price, provider, deep-link */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: isRTL ? "برامج مؤسسة اليسر الخيرية" : "Al-Yusr Charity Programs",
          inLanguage: isRTL ? "ar-EG" : "en",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: programs.length,
          itemListElement: programs.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${base}/programs/${p.slug}`,
            item: {
              "@type": "Service",
              "@id": `${base}/programs/${p.slug}#service`,
              name: p[lang].name,
              alternateName: p[lang === "ar" ? "en" : "ar"].name,
              description: p[lang].desc,
              url: `${base}/programs/${p.slug}`,
              image: `${base}${p.image.startsWith("/") ? p.image : "/" + p.image.replace(/^\/+/, "")}`,
              serviceType: isRTL ? "خدمة خيرية" : "Charitable service",
              areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
              provider: { "@id": `${base}/#org` },
              category: isRTL ? "خير وصدقة" : "Charity & Sadaqah",
              ...(p.priceFrom > 0 && {
                offers: {
                  "@type": "Offer",
                  price: p.priceFrom,
                  priceCurrency: "EGP",
                  availability: "https://schema.org/InStock",
                  url: `${base}/donate?program=${p.slug}`,
                  seller: { "@id": `${base}/#org` },
                },
              }),
            },
          })),
        })}</script>
        {/* OfferCatalog grouping for AI engines (AIO/GEO) */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          name: isRTL ? "كتالوج برامج اليسر الخيرية — الدقهلية ومصر" : "Al-Yusr program catalog — Dakahlia & Egypt",
          provider: { "@id": `${base}/#org` },
          itemListElement: programs
            .filter((p) => p.priceFrom > 0)
            .map((p) => ({
              "@type": "Offer",
              price: p.priceFrom,
              priceCurrency: "EGP",
              availability: "https://schema.org/InStock",
              url: `${base}/donate?program=${p.slug}`,
              itemOffered: { "@type": "Service", name: p[lang].name, url: `${base}/programs/${p.slug}` },
            })),
        })}</script>
        {/* FAQPage — content mirrors the visible accordion below */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: isRTL ? "ar-EG" : "en",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
        {/* HowTo — donation flow (AIO/GEO friendly) */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: isRTL ? "كيف تتبرع لبرامج اليسر الخيرية" : "How to donate to an Al-Yusr program",
          inLanguage: isRTL ? "ar-EG" : "en",
          totalTime: "PT3M",
          tool: [{ "@type": "HowToTool", name: isRTL ? "بطاقة بنكية أو محفظة إلكترونية" : "Bank card or e-wallet" }],
          step: [
            { "@type": "HowToStep", position: 1, name: isRTL ? "اختر البرنامج" : "Pick a program", text: isRTL ? "اختر الباب الذي يناسب نيتك (غذاء، علاج، تعليم، أضحية، زكاة…) من قائمة البرامج." : "Choose the track that matches your intention from the programs list." },
            { "@type": "HowToStep", position: 2, name: isRTL ? "حدّد المبلغ وادفع بأمان" : "Set amount and pay securely", text: isRTL ? "ادفع بفيزا أو فودافون كاش أو إنستا باي أو بتحويل على CIB، وكل المعاملات مشفّرة وآمنة." : "Pay with Visa, Vodafone Cash, InstaPay or CIB transfer — fully encrypted." },
            { "@type": "HowToStep", position: 3, name: isRTL ? "نوصل الخير إلى بيت الأسرة" : "We deliver to the family", text: isRTL ? "بعد البحث الميداني نوصل الاحتياج إلى باب البيت في الدقهلية وكفر الشيخ." : "After field assessment we deliver to the doorstep across Dakahlia & Kafr El Sheikh." },
            { "@type": "HowToStep", position: 4, name: isRTL ? "استلم التوثيق والإيصال" : "Receive proof & receipt", text: isRTL ? "يصلك إيصال إلكتروني ورقم تتبّع وصور أو فيديو للتسليم." : "You receive an e-receipt, tracking ID and delivery photos/video." },
          ],
        })}</script>
        {/* AboutPage — strengthens entity identity for AI engines */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${base}/programs`,
          inLanguage: isRTL ? "ar-EG" : "en",
          name: isRTL ? "برامج مؤسسة اليسر الخيرية" : "Al-Yusr Charity programs",
          about: { "@id": `${base}/#org` },
          mainEntity: { "@id": `${base}/#org` },
        })}</script>
        {/* CollectionPage — explicit collection of services for AIO crawlers */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${base}/programs#collection`,
          url: `${base}/programs`,
          inLanguage: isRTL ? "ar-EG" : "en",
          name: isRTL ? "كل برامج مؤسسة اليسر الخيرية" : "All Al-Yusr Charity programs",
          isPartOf: { "@id": `${base}/#website` },
          about: { "@id": `${base}/#org` },
          hasPart: programs.map((p) => ({
            "@type": "Service",
            name: p[lang].name,
            url: `${base}/programs/${p.slug}`,
          })),
        })}</script>
        {/* NGO entity reinforcement with full geo coverage for GEO/local search */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NGO",
          "@id": `${base}/#ngo`,
          name: isRTL ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation",
          url: `${base}/programs`,
          areaServed: GEO_GOVERNORATES.map((g) => ({
            "@type": "AdministrativeArea",
            name: isRTL ? g.ar : g.en,
            geo: { "@type": "GeoCoordinates", latitude: g.lat, longitude: g.lon },
          })),
          knowsAbout: programs.map((p) => p[lang].name),
          slogan: isRTL ? "نوصل الخير بكرامة إلى كل بيت محتاج" : "Delivering aid with dignity to every family in need",
        })}</script>
        {/* SpeakableSpecification — helps voice assistants summarise the page */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${base}/programs#page`,
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "h2", "#programs-how", "#program-signatures"],
          },
        })}</script>
      </Helmet>

      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        {/* Background picture (dashboard → البرامج → «صورة أعلى الصفحة») under a brand gradient */}
        {/* `!absolute`: .pattern-hero-luxe makes its direct children position:relative */}
        <div className="pointer-events-none !absolute inset-0" aria-hidden>
          <img src={heroImg} alt="" className="h-full w-full object-cover" fetchpriority="high" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/55 to-primary/90" />
        </div>
        {/* Brand leaf tile overlay — same SVG motif used on Bride Trousseau hero */}
        <div className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="flex justify-center text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "البرامج" : "Programs" }]} />
          </div>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div className="text-center lg:text-start">
              <span className="inline-flex rounded-full border border-secondary/40 bg-primary/55 px-3 py-1 text-xs font-extrabold text-secondary backdrop-blur">
                {isRTL ? "غذاء • علاج • تعليم • مياه • سكن" : "Food • Health • Education • Water • Shelter"}
              </span>
              <h1 className="mt-4 mx-auto lg:mx-0 max-w-3xl text-3xl font-black leading-[1.2] md:text-5xl">
                {isRTL ? "برامج اليسر… دعم متكامل يحسّن ظروف المعيشة" : "Al-Yusr programs for better living conditions"}
              </h1>
              <p className="mt-4 mx-auto lg:mx-0 max-w-2xl text-sm font-semibold leading-7 text-primary-foreground/85 md:text-base">
                {isRTL ? "من كرتونة الأمل إلى فرص العلاج والتعليم والمياه والسكن الآمن، نوصل الخير إلى البيوت المحتاجة بعد تحقق ميداني وبكرامة كاملة." : "From a hope box to healthcare, education, water, and safer homes — we deliver support after field verification and with full dignity."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
                <Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground shadow-whatsapp hover:opacity-95">
                  <a href={waHref} target="_blank" rel="noopener" data-source="programs" data-label="programs-whatsapp-hero">
                    <WhatsAppIcon className="h-5 w-5" aria-hidden />{isRTL ? "تواصل عبر واتساب" : "WhatsApp us"}
                  </a>
                </Button>
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link to="/donate" data-source="programs" data-label="programs-donate-hero"><Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-2 rounded-3xl border border-secondary/25 bg-primary/55 p-4 shadow-card backdrop-blur">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-primary-foreground/10 px-3 py-2 text-sm font-extrabold">
                  <ShieldCheck className="h-4 w-4 text-secondary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* How it works — 4-step donation journey (mirrors HowTo JSON-LD) */}
      <section aria-labelledby="programs-how" className="bg-background py-14 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "كيف نعمل" : "How it works"}
            </span>
            <h2 id="programs-how" className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "٤ خطوات من تبرعك إلى باب بيت الأسرة" : "4 steps from your donation to the family's door"}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-muted-foreground md:text-base">
              {isRTL ? "كل خطوة موثّقة بالصور والفيديو، ويراجعها فريق ميداني في الدقهلية." : "Every step is documented with photos and video and reviewed by our Dakahlia field team."}
            </p>
          </div>
          <ol className="mt-10 flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HandHeart, n: "01", t: isRTL ? "اختر البرنامج" : "Pick a program", d: isRTL ? "من الغذاء والعلاج إلى التعليم والأضحية وستر البيوت." : "From food and health to education, Qurbani and shelter.", stickyTop: "top-[80px]", zIndex: "z-10" },
              { icon: ClipboardCheck, n: "02", t: isRTL ? "بحث اجتماعي" : "Field assessment", d: isRTL ? "فريق ميداني يزور الأسرة ويوثّق احتياجها." : "A field team visits the family and documents the need.", stickyTop: "top-[98px]", zIndex: "z-20" },
              { icon: Truck, n: "03", t: isRTL ? "تسليم بكرامة" : "Dignified delivery", d: isRTL ? "نوصل الاحتياج إلى باب البيت دون أي تكلفة على الأسرة." : "We deliver to the doorstep at no cost to the family.", stickyTop: "top-[116px]", zIndex: "z-30" },
              { icon: FileCheck2, n: "04", t: isRTL ? "توثيق وتقرير" : "Proof & report", d: isRTL ? "صور وفيديو وإيصال إلكتروني برقم تتبّع." : "Photos, video and an e-receipt with a tracking ID.", stickyTop: "top-[134px]", zIndex: "z-40" },
            ].map(({ icon: Icon, n, t: title, d, stickyTop, zIndex }) => (
              <li
                key={n}
                className={`group relative isolate flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card sticky ${stickyTop} ${zIndex} sm:static sm:z-auto`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground shadow-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-orange-grad px-3 py-1 font-mono text-xs font-black text-accent-foreground shadow-cta">
                      {n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-black text-primary sm:text-xl">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground sm:text-sm">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* Trust strip */}
          <div className="mt-10 grid grid-cols-2 gap-3 rounded-3xl border border-border bg-card p-4 text-center shadow-soft sm:grid-cols-4 md:p-6">
            {[
              { k: programsLoading ? "—" : String(programs.length), l: isRTL ? "برنامج موثّق" : "Verified programs" },
              { k: "90%", l: isRTL ? "يصل إلى المستفيدين" : "Reaches beneficiaries" },
              { k: "100%", l: isRTL ? "توصيل لباب البيت" : "Doorstep delivery" },
              { k: "24/7", l: isRTL ? "دعم واتساب" : "WhatsApp support" },
            ].map(({ k, l }) => (
              <div key={l} className="rounded-2xl bg-secondary/10 p-3">
                <div className="font-mono text-2xl font-black text-primary md:text-3xl">{k}</div>
                <div className="mt-1 text-[11px] font-extrabold text-muted-foreground md:text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

   


      <section className="pattern-programs relative overflow-x-clip py-14 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "كل البرامج" : "All programs"}
            </span>
            <h2 className="mt-3 text-2xl font-black leading-[1.15] text-primary md:text-4xl">
              {isRTL ? "كل برامجنا في مكان واحد" : "Every Al-Yusr program in one place"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-muted-foreground md:text-base">
              {isRTL
                ? "اختر الباب الذي يناسب نيتك. كل برنامج موثّق ومُراجَع ميدانيًا، وأسعاره معلنة بشفافية."
                : "Pick the cause that matches your intention — every program is field-verified with transparent pricing."}
            </p>
          </div>
          {programsLoading && (
            <div className="w-full space-y-6 md:space-y-8" aria-busy="true" aria-label={isRTL ? "جارٍ تحميل البرامج" : "Loading programs"}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex ${i % 2 ? "lg:justify-end" : "lg:justify-start"}`}>
                  <div className={`flex w-full flex-col gap-4 overflow-hidden rounded-[28px] border border-primary/10 bg-card p-3 shadow-card md:flex-row lg:w-[90%] ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                    <div className="flex-1 space-y-3 p-3 md:py-8">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-8 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="mt-4 h-8 w-40 rounded-full" />
                    </div>
                    <Skeleton className="aspect-[4/3] w-full rounded-[20px] md:aspect-auto md:min-h-[260px] md:w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!programsLoading && programs.length === 0 && (
            <p className="mx-auto max-w-md rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">
              {isRTL ? "يجري تحديث البرامج الآن. يمكنك التبرع للصندوق العام أو التواصل معنا عبر واتساب." : "Programs are being updated. You can give to the general fund or WhatsApp us."}
            </p>
          )}
          {!programsLoading && (
          <StickyStack className="w-full overflow-x-clip" gap="mb-6 md:mb-8">
            {programs.map((p, idx) => {
              // Static (JIT-safe) sticky offsets that cascade so each card peeks under the next.
              const offsets = [
                "top-[72px] md:top-[88px]",
                "top-[84px] md:top-[102px]",
                "top-[96px] md:top-[116px]",
                "top-[108px] md:top-[130px]",
              ];
              const offset = offsets[idx % offsets.length];
              const reverse = idx % 2 === 1;
              // Large screens: one card to the start side, the next to the end side (zigzag, like /arboun).
              return (
                <StickyStackItem key={p.slug} index={idx} top={offset}>
                  <div className={`flex w-full ${reverse ? "lg:justify-end" : "lg:justify-start"}`}>
                  <Link
                    to={programHref(p.slug)}
                    data-source="projects"
                    data-label={`project-${p.slug}`}
                    className={`group relative isolate mx-auto flex w-full transform-gpu flex-col overflow-hidden rounded-[28px] lg:mx-0 lg:w-[90%] lg:max-w-none border border-primary/10 bg-gradient-to-b from-card to-card/95 shadow-card ring-1 ring-primary/5 transition-colors duration-300 [backface-visibility:hidden] hover:border-secondary/50 md:items-stretch ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
                  >
                    {/* Content first in DOM so it reads first on large screens */}
                    <div className="order-2 flex flex-1 flex-col px-5 pb-5 pt-4 md:order-1 md:w-1/2 md:justify-center md:px-6 md:py-6">
                      {p.season && (
                        <span className="mb-2 inline-flex w-fit rounded-full bg-accent/15 px-3 py-1 text-[11px] font-extrabold text-accent">
                          {p.season[lang]}
                        </span>
                      )}
                      <h3 className="text-2xl font-black leading-tight text-primary md:text-[28px]">{p[lang].name}</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-muted-foreground md:text-base">{p[lang].tagline}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground md:text-sm">{p[lang].desc}</p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {isRTL ? "موثّق ومراجع ميدانيًا" : "Field-verified and reviewed"}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-2.5">
                        {p.priceFrom > 0 && (
                          <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary">
                            {isRTL ? `يبدأ من ${p.priceFrom} ج` : `From ${p.priceFrom} EGP`}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-extrabold text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:gap-3 group-hover:bg-accent group-hover:text-accent-foreground">
                          {t.programs.learnMore} <Arrow className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    {/* Image */}
                    <div className="relative order-1 m-2.5 aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-primary/5 to-secondary/10 md:order-2 md:m-3 md:aspect-auto md:w-1/2 md:shrink-0 md:self-stretch">
                      <img
                        decoding="async"
                        src={p.image}
                        alt={p[lang].name}
                        loading={idx < 2 ? "eager" : "lazy"}
                        fetchpriority={idx === 0 ? "high" : "auto"}
                        className="absolute inset-0 h-full w-full object-cover md:transition-transform md:duration-700 md:group-hover:scale-[1.04]"
                      />
                      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    </div>
                  </Link>
                  </div>
                </StickyStackItem>
              );
            })}
          </StickyStack>
          )}
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-secondary/30 bg-card/90 p-6 text-center shadow-soft backdrop-blur md:flex-row md:justify-between md:p-8 md:text-start">
            <div>
              <h3 className="text-lg font-black text-primary md:text-xl">
                {isRTL ? "لم تحدد البرنامج المناسب بعد؟" : "Not sure which program fits?"}
              </h3>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-muted-foreground">
                {isRTL
                  ? "راسلنا عبر واتساب، وسيرشدك فريقنا إلى أكثر الاحتياجات إلحاحًا بما يناسب نيتك."
                  : "WhatsApp us and our advisory team will guide you to the most urgent fit for your intention."}
              </p>
            </div>
            <a href={waHref} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-extrabold text-whatsapp-foreground shadow-whatsapp transition hover:opacity-95" data-source="programs" data-label="programs-whatsapp-list">
              <WhatsAppIcon className="h-4 w-4" aria-hidden />{isRTL ? "اسأل عن أنسب برنامج" : "Ask for guidance"}
            </a>
          </div>
        </div>
       
      </section>

      {/* Visible FAQ — paired with the FAQPage JSON-LD above */}
      {/* ── GEO coverage — internal links to /geo/:gov/:program for local SEO ── */}
      <section aria-labelledby="programs-geo" className="bg-background py-10 md:py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <MapPin className="h-3.5 w-3.5" /> {isRTL ? "تغطية جغرافية" : "Local coverage"}
            </span>
            <h2 id="programs-geo" className="mt-2 text-xl font-black text-primary md:text-2xl">
              {isRTL ? "اختر برنامجًا لمدينتك" : "Pick a program in your city"}
            </h2>
            <p className="mt-2 text-[13px] font-semibold leading-6 text-muted-foreground">
              {isRTL ? "الدقهلية أولًا، بتغطية كل مراكزها وقراها." : "Dakahlia first — covering every district and village."}
            </p>
          </div>

          <div className="mt-5">
            <TagsRail
              ariaLabel={isRTL ? "اختر محافظة" : "Choose a governorate"}
              source="programs-geo-tags"
              activeId={activeGeo}
              items={GEO_GOVERNORATES.map((g) => ({
                id: g.slug,
                label: isRTL ? g.ar : g.en,
                onClick: () => setActiveGeo(g.slug),
                icon: <MapPin className="h-3.5 w-3.5" />,
              }))}
            />
          </div>

          {activeGov && (
            <motion.div
              key={activeGov.slug}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-6 max-w-4xl rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-card/95 p-5 sm:p-6 shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5 text-primary">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/20 text-secondary">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-primary md:text-lg">{isRTL ? activeGov.ar : activeGov.en}</h3>
                    <span className="text-[11px] font-bold text-muted-foreground">{activeGov.region}</span>
                  </div>
                </div>
                <span className="rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-xs font-black text-secondary">
                  {Object.keys(activeGov.programs).filter((s) => programSlugs.has(s)).length} {isRTL ? "برنامج نشط" : "active programs"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(activeGov.programs).map((slug) => {
                  const prog = programs.find((p) => p.slug === slug);
                  if (!prog) return null;
                  return (
                    <Link
                      key={slug}
                      to={`/geo/${activeGov.slug}/${slug}`}
                      data-source="programs-geo"
                      data-label={`geo-${activeGov.slug}-${slug}`}
                      className="group/pill inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-black text-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-soft"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary group-hover/pill:bg-primary transition-colors" />
                      {prog[lang].name}
                    </Link>
                  );
                })}
              </div>

              {activeGov.slug === "dakahlia" && (
                <details className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/5 p-3.5 transition-colors">
                  <summary className="cursor-pointer text-xs sm:text-sm font-black text-primary flex items-center justify-between">
                    <span>{isRTL ? "مدن وقرى الدقهلية المغطاة (اضغط للعرض)" : "Covered Dakahlia cities & villages (click to view)"}</span>
                    <span className="text-[11px] text-muted-foreground font-semibold">({DAKAHLIA_CITIES.length} {isRTL ? "مركز ومدينة" : "cities"})</span>
                  </summary>
                  <div className="mt-3.5 flex flex-wrap gap-1.5 pt-2 border-t border-secondary/15">
                    {DAKAHLIA_CITIES.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/dakahlia/${c.slug}/${c.programs.find((s) => programSlugs.has(s)) ?? programs[0]?.slug ?? ""}`}
                        data-source="programs-geo-city"
                        data-label={`dakahlia-${c.slug}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-extrabold text-primary transition hover:border-secondary/60 hover:bg-secondary/10 hover:-translate-y-0.5"
                      >
                        <MapPin className="h-3 w-3 text-secondary" />{isRTL ? c.ar : c.en}
                      </Link>
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          )}

          {/* Hidden SEO matrix — every Dakahlia city × program permutation
              rendered as crawlable links. Visually hidden but readable to
              search engines and AI answer engines (sr-only keeps it in DOM
              flow, off-screen). */}
          <div className="sr-only" aria-hidden="false">
            <h2>{isRTL ? "كل برامج اليسر في مدن وقرى الدقهلية" : "All Al-Yusr programs across Dakahlia cities and villages"}</h2>
            <p>
              {isRTL
                ? "تغطية شاملة لبرامج الأضحية والكرتونة وزكاة المال وكفالة اليتيم والتعليم والمياه وتجهيز العرائس وستر البيوت في كل مدن وقرى محافظة الدقهلية: المنصورة، ميت غمر، بلقاس، دكرنس، شربين، أجا، السنبلاوين، طلخا، نبروه، المطرية، الجمالية، ميت سلسيل، بني عبيد، المنزلة. تبرّع لأي مدينة عبر مؤسسة اليسر الخيرية."
                : "Comprehensive Al-Yusr coverage for Qurbani, food box, Zakat, orphan sponsorship, education, water, bride trousseau and home shelter across every Dakahlia city and village: Mansoura, Mit Ghamr, Belqas, Dikirnis, Sherbin, Aga, Sinbillawayn, Talkha, Nabaroh, Matareya, Gamalia, Mit Salsil, Bani Ubaid, Manzala."}
            </p>
            <ul>
              {DAKAHLIA_CITIES.flatMap((c) =>
                c.programs.map((slug) => {
                  const prog = programs.find((p) => p.slug === slug);
                  if (!prog) return null;
                  return (
                    <li key={`${c.slug}-${slug}`}>
                      <Link to={`/dakahlia/${c.slug}/${slug}`}>
                        {isRTL
                          ? `${prog.ar.name} في ${c.ar} — مؤسسة اليسر الخيرية بالدقهلية`
                          : `${prog.en.name} in ${c.en} — Al-Yusr Charity, Dakahlia`}
                      </Link>
                    </li>
                  );
                }),
              )}
              {GEO_GOVERNORATES.flatMap((g) =>
                Object.keys(g.programs).map((slug) => {
                  const prog = programs.find((p) => p.slug === slug);
                  if (!prog) return null;
                  return (
                    <li key={`gov-${g.slug}-${slug}`}>
                      <Link to={`/geo/${g.slug}/${slug}`}>
                        {isRTL
                          ? `${prog.ar.name} في ${g.ar} — ${g.region}`
                          : `${prog.en.name} in ${g.en} — ${g.region}`}
                      </Link>
                    </li>
                  );
                }),
              )}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="faq"
        aria-labelledby="programs-faq-heading"
        className="scroll-mt-24 bg-muted/40 py-14 md:py-20"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "أسئلة شائعة" : "FAQ"}
            </span>
            <h2
              id="programs-faq-heading"
              className="mt-3 text-2xl font-black text-primary md:text-3xl"
            >
              {isRTL ? "أسئلة شائعة عن برامج اليسر" : "Programs FAQs"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRTL
                ? "إجابات شفافة عن التوزيع والتوثيق والإيصالات."
                : "Transparent answers about distribution, documentation, and receipts."}
            </p>
          </div>

          {/* Questions: one per row */}
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaqIdx === i;
              return (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                    isOpen ? "border-secondary bg-secondary/5" : "border-border bg-card hover:border-secondary/40"
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-start font-extrabold text-primary cursor-pointer"
                    onClick={() => setOpenFaqIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${isOpen ? "bg-secondary text-emerald-950 font-black" : "bg-secondary/20 text-secondary"}`}>
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm sm:text-base leading-snug">{f.q}</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                      {f.a}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
            >
              <span>{isRTL ? "مركز الأسئلة الشائعة" : "View all FAQs"}</span>
              {isRTL ? <ArrowLeft className="h-4 w-4 text-secondary" /> : <ArrowRight className="h-4 w-4 text-secondary" />}
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground md:text-sm">
            {isRTL ? (
              <>
                هل لديك سؤال آخر؟{" "}
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener"
                  className="font-extrabold text-primary hover:text-secondary"
                  data-source="programs-faq"
                  data-label="faq-whatsapp"
                >
                  راسلنا عبر واتساب
                </a>{" "}
                أو اطّلع على <Link to="/trust" className="font-extrabold text-primary hover:text-secondary" data-source="programs-faq" data-label="faq-trust">تقارير الشفافية</Link>.
              </>
            ) : (
              <>
                Still have a question?{" "}
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener"
                  className="font-extrabold text-primary hover:text-secondary"
                  data-source="programs-faq"
                  data-label="faq-whatsapp"
                >
                  Message us on WhatsApp
                </a>{" "}
                or read our <Link to="/trust" className="font-extrabold text-primary hover:text-secondary" data-source="programs-faq" data-label="faq-trust">transparency reports</Link>.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Field cases across all programs (live from the backend; hidden when there are none) */}
      <LinkedCasesSection filter={{ linkedTo: "program" }} showOwner variant="carousel" filterByOwner limit={30} include={includeProgramCase} isRTL={isRTL} className="bg-muted/30"
        title={isRTL ? "حالات نجمع لها التبرعات ضمن برامجنا" : "Cases our programs are funding"}
        subtitle={isRTL ? "اختر حالة بعينها وتابع تحديثاتها بالصور حتى تكتمل." : "Pick a specific case and follow its photo updates until it is complete."} />
      {/* Bride trousseau call to action, closing the page */}
      <BrideTrousseau />
    </PageLayout>
  );
};
export default Projects;
