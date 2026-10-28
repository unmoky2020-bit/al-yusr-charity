import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
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
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs } from "@/data/faqsApi";
import { programs } from "@/data/programs";
import { BrideTrousseau } from "@/components/sections/BrideTrousseau";
import { HomeSeasons } from "@/components/sections/HomeSeasons";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import { Helmet } from "react-helmet-async";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { motion, useReducedMotion } from "motion/react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { GEO_GOVERNORATES } from "@/data/geoPages";
import { DAKAHLIA_CITIES } from "@/data/dakahliaCities";
import { TagsRail } from "@/components/common/TagsRail";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";
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
      ? "السلام عليكم، عايز أعرف أنسب برنامج للتبرع أو المساعدة مع مؤسسة اليسر."
      : "Hello, I'd like to learn which Al-Yusr program is best for donation or support."
  );
  const waHref = `https://wa.me/201097000137?text=${waMsg}`;
  const pillars = [
    { icon: UtensilsCrossed, title: isRTL ? "غذاء" : "Food", text: isRTL ? "كرتونة العزومة، كيلو لحمة، وتوزيعات موسمية تحفظ كرامة البيت." : "Food boxes, meat support, and seasonal distributions delivered with dignity.", to: "/programs/box" },
    { icon: Stethoscope, title: isRTL ? "علاج" : "Healthcare", text: isRTL ? "مساندة علاجية للحالات الأشد احتياجًا عبر بحث ميداني وتوجيه آمن للتبرع." : "Medical support for the most vulnerable cases through verified field assessment.", to: "/cases?cat=medication" },
    { icon: GraduationCap, title: isRTL ? "تعليم" : "Education", text: isRTL ? "مصاريف، أدوات، وزي مدرسي عشان طفل يكمل طريقه." : "Tuition, supplies, and uniforms so children can continue their path.", to: "/programs/education" },
    { icon: Droplets, title: isRTL ? "مياه" : "Water", text: isRTL ? "وصلات مياه وسهم صدقة جارية يغيّر يوم الأسرة كل يوم." : "Water connections and lasting charity shares that change daily life.", to: "/programs/water" },
    { icon: Home, title: isRTL ? "سكن" : "Shelter", text: isRTL ? "تجهيز بيوت، ستر أسر، ومساندة عرائس لبداية آمنة." : "Home support, family shelter, and bride preparation for safer starts.", to: "/programs/bride" },
  ];
  const highlights = [
    isRTL ? "بحث اجتماعي قبل الصرف" : "Social assessment before spending",
    isRTL ? "تسليم بكرامة لباب البيت" : "Dignified doorstep delivery",
    isRTL ? "توثيق ومتابعة للأثر" : "Documented impact follow-up",
  ];

  // Mobile-aware motion presets — shorter stagger, smaller offsets, RTL-aware x slide.
  // Drives a premium-feeling reveal without jank on lower-end Android.
  const isMobile = typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;
  const dirX = isRTL ? 1 : -1;
  const axisStagger = isMobile ? 0.05 : 0.09;
  const axisDuration = isMobile ? 0.5 : 0.65;
  const axisOffsetY = isMobile ? 18 : 36;

  // 3 strategic pillars — same card design used in the homepage WorkAxes section.
  // Reused here so the /programs page leads with our flagship axes before the full list.
  const axesPillars = [
    {
      img: imgFood,
      number: "01",
      anchorId: "axis-food",
      donateSlug: "box",
      href: "/axes/food",
      tag: isRTL ? "محور الإطعام" : "Food pillar",
      title: isRTL ? "الغذاء" : "Food",
      desc: isRTL
        ? "أمان غذائي لكل أسرة مستحقة عبر مزارعنا الوقفية ومطابخ اليسر الدائمة."
        : "Food security for every family in need through our endowment farms and permanent Al-Yusr kitchens.",
      bullets: isRTL
        ? ["كرتونة الغذاء الشهرية + كيلو لحمة بلدي", "مطبخ يومي بآلاف الوجبات الساخنة", "أكثر من 5 طن لحوم سنويًا من مزارعنا الوقفية"]
        : ["Monthly food box + 1 kg of farm meat", "Daily kitchen with thousands of hot meals", "Over 5 tons of meat per year from our endowment farms"],
      accent: "bg-secondary text-secondary-foreground",
      focus: "center 40%",
    },
    {
      img: imgHealth,
      number: "02",
      anchorId: "axis-health",
      donateSlug: "treatment",
      href: "/axes/health",
      tag: isRTL ? "محور الصحة" : "Health pillar",
      title: isRTL ? "الصحة" : "Health",
      desc: isRTL
        ? "بناء إنسان منتج ومستقر عبر القوافل والمجمعات الطبية ومركز الغسيل الكلوي."
        : "Building a stable, productive person through medical caravans, clinics, and our dialysis center.",
      bullets: isRTL
        ? ["عمليات وعلاج للحالات العاجلة", "قوافل علاجية في القرى النائية", "أطراف صناعية وكراسي ذوي الهمم"]
        : ["Surgeries & urgent treatment", "Caravans in remote villages", "Prosthetics & wheelchairs"],
      accent: "bg-accent text-accent-foreground",
      focus: "center 45%",
    },
    {
      img: imgEdu,
      number: "03",
      anchorId: "axis-education",
      donateSlug: "education",
      href: "/axes/education",
      tag: isRTL ? "محور التعليم" : "Education pillar",
      title: isRTL ? "التعليم" : "Education",
      desc: isRTL
        ? "محاربة الفقر الأول بالعلم وتأمين مستقبل الأجيال داخل مجمّعنا التعليمي."
        : "Fighting the first poverty with knowledge and securing future generations inside our educational complex.",
      bullets: isRTL
        ? ["كفالة تعليمية لـ 354 طالبًا", "دروس ومتابعة داخل المجمّع", "حقائب وأدوات لكل عام دراسي"]
        : ["Education sponsorship for 354 students", "Tutoring inside our complex", "Backpacks & tools each year"],
      accent: "bg-primary text-primary-foreground",
      focus: "center 35%",
    },
  ];
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
      ar: { t: "ضمان جودة الأضحية", d: "الوحيدون في مصر بمعاينة بيطرية مسبقة وذبح شرعي موثّق بالفيديو لكل صك." },
      en: { t: "Qurbani quality guarantee", d: "Only foundation in Egypt with pre-vet inspection and video-documented Shariah slaughter per voucher." },
    },
    {
      slug: "box",
      icon: Truck,
      ar: { t: "كرتونة + لحمة بلدي", d: "كرتونة كاملة لشهر + كيلو لحمة من مزارعنا الوقفية مع كل تبرع — مش بس مواد جافة." },
      en: { t: "Food box + farm meat", d: "A full monthly box plus 1 kg of farm-fresh meat from our endowment farms with every donation." },
    },
    {
      slug: "water",
      icon: Droplets,
      ar: { t: "صدقة جارية بسهم 200 ج", d: "بنفصل وصلة المياه لأسهم صغيرة عشان أي متبرع يقدر يساهم في مشروع ميداني كامل." },
      en: { t: "Lasting charity from 200 EGP", d: "We split each water line into micro-shares so any donor can participate in a real field project." },
    },
    {
      slug: "education",
      icon: GraduationCap,
      ar: { t: "حملة سبتمبر السنوية", d: "بنفتح التسجيل قبل بداية الدراسة بأسابيع لنغطي مصاريف + زي + أدوات الطفل قبل اليوم الأول." },
      en: { t: "Annual September drive", d: "Registration opens weeks before school so we cover tuition, uniform and supplies before day one." },
    },
    {
      slug: "bride",
      icon: HandHeart,
      ar: { t: "تجهيز شقة كاملة بسهم 250 ج", d: "غرفة نوم وصالون ومطبخ وأجهزة — مشروع جماعي يحوّل تبرعك الصغير لجهاز عروسة كامل." },
      en: { t: "Full apartment from 250 EGP shares", d: "Bedroom, living room, kitchen and appliances — your small share becomes a complete bride trousseau." },
    },
    {
      slug: "shelter",
      icon: Home,
      ar: { t: "تسقيف عازل بالبوتامين", d: "أسقف من البوتامين والخشب وأبواب وشبابيك آمنة — حملة من أكتوبر لفبراير لحماية الأسر من البرد." },
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
          { q: "ما هي أبواب التبرع المتاحة في مؤسسة اليسر؟", a: "بنوفّر مسارات تبرع لكل نية: صك أضحية، كرتونة عزومة شهرية، كيلو لحمة بلدي من مزارعنا الوقفية، زكاة المال، كفالة يتيم، تعليم (سبتمبر)، علاج وقوافل طبية، وصلات مياه، تجهيز عرائس، وحملة ستر للتسقيف والترميم." },
          { q: "هل تبرعي يصل فعلًا للمستحقين؟", a: "نعم — كل تبرع يمر ببحث اجتماعي ميداني للأسر، يُسلَّم بكرامة لباب البيت، ويتم توثيقه بصور وفيديو يصلك عبر واتساب أو البريد بعد التنفيذ." },
          { q: "هل أحصل على إيصال رسمي بالتبرع؟", a: "بمجرد إتمام الدفع يصلك إيصال إلكتروني فوري برقم مرجعي تقدر تتبع به الحالة من صفحة «تتبع التبرع»." },
          { q: "إيه الفرق بين التبرع لبرنامج وبين التبرع لحالة موثّقة؟", a: "التبرع لبرنامج (مثل صك أضحية أو كرتونة عزومة) بيُوزَّع على أسر متعددة حسب الأكثر احتياجًا. التبرع لحالة موثّقة بيروح لحالة فردية بعينها مع متابعة نتيجتها." },
          { q: "هل يمكنني تخصيص تبرعي لمحافظة معينة؟", a: "نعم. تركيزنا الأساسي محافظة الدقهلية بكل مدنها وقراها، وبنغطّي حالات أيضًا في كفر الشيخ والصعيد. اطلب التخصيص مع فريق واتساب 201097000137+." },
          { q: "ما طرق الدفع المتاحة؟", a: "فيزا/ماستر كارد، Vodafone Cash، InstaPay، تحويل بنكي على CIB، أو دفع كاش عند ممثل المؤسسة في المنصورة." },
          { q: "هل المؤسسة مرخّصة رسميًا؟", a: "مؤسسة اليسر الخيرية مرخّصة من وزارة التضامن الاجتماعي تحت رقم إشهار 2665/2019، ومقرها الرئيسي بالمنصورة - الدقهلية." },
          { q: "إزاي أتطوع أو أنضم لفريق العمل؟", a: "ادخل على صفحة حملات التطوع واختر حملة وقدّم على المقعد المناسب لمهاراتك. بنوفّر تدريب ميداني ومتابعة لكل متطوع جديد." },
        ]
      : [
          { q: "What donation programs does Al-Yusr offer?", a: "We provide a track for every intention: Qurbani vouchers, monthly food box, fresh farm meat, Zakat, orphan sponsorship, education (September), healthcare and medical convoys, water connections, bride preparation, and the Sitr roofing & repair campaign." },
          { q: "Does my donation really reach the beneficiaries?", a: "Yes — every donation goes through field social assessment, dignified doorstep delivery, and is documented with photos and videos shared with you on WhatsApp or email after execution." },
          { q: "Will I receive an official receipt?", a: "An electronic receipt with a reference code is emailed to you instantly so you can track the case from our donation tracking page." },
          { q: "What is the difference between donating to a program and donating to a verified case?", a: "Program donations (e.g. a Qurbani voucher or food box) are distributed across multiple families by need. A verified case donation goes to one specific family with outcome follow-up." },
          { q: "Can I designate my donation to a specific governorate?", a: "Yes. Our primary focus is Dakahlia (all cities and villages); we also serve cases in Kafr El-Sheikh and Upper Egypt. Request a designation via WhatsApp +201097000137." },
          { q: "What payment methods are supported?", a: "Visa/Mastercard, Vodafone Cash, InstaPay, bank transfer to CIB, or in-person cash via our Mansoura representative." },
          { q: "Is the foundation officially licensed?", a: "Al-Yusr Charity Foundation is licensed by the Ministry of Social Solidarity under license number 2665/2019, headquartered in Mansoura, Dakahlia." },
          { q: "How can I volunteer or join the field team?", a: "Visit our volunteer campaigns page, pick a campaign, and apply for the slot that matches your skills. We provide field training and follow-up for every new volunteer." },
        ];
  }, [rawProgramsFaqs, isRTL]);

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "برامج اليسر الخيرية بالدقهلية | غذاء علاج تعليم مياه سكن" : "Al-Yusr Programs in Dakahlia | Food, Health, Education, Water, Shelter"}
        description={isRTL ? "كل برامج مؤسسة اليسر الخيرية بالمنصورة والدقهلية: كرتونة العزومة، صك أضحية مضمون، زكاة، كفالة يتيم، تعليم، علاج، مياه، تجهيز عرائس وستر بيوت — توثيق بالصور وتواصل واتساب فوري." : "All Al-Yusr Foundation programs across Mansoura and Dakahlia: food box, guaranteed Qurbani, Zakat, orphan sponsorship, education, healthcare, water, bride trousseau and home shelter — photo-documented with instant WhatsApp support."}
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
          name: isRTL ? "إزاي تتبرع لبرنامج اليسر الخيرية" : "How to donate to an Al-Yusr program",
          inLanguage: isRTL ? "ar-EG" : "en",
          totalTime: "PT3M",
          tool: [{ "@type": "HowToTool", name: isRTL ? "بطاقة بنكية أو محفظة إلكترونية" : "Bank card or e-wallet" }],
          step: [
            { "@type": "HowToStep", position: 1, name: isRTL ? "اختر البرنامج" : "Pick a program", text: isRTL ? "اختر الباب اللي يناسب نيتك (غذاء، علاج، تعليم، أضحية، زكاة…) من قائمة البرامج." : "Choose the track that matches your intention from the programs list." },
            { "@type": "HowToStep", position: 2, name: isRTL ? "حدّد المبلغ وادفع بأمان" : "Set amount and pay securely", text: isRTL ? "ادفع بفيزا، فودافون كاش، إنستا باي أو تحويل CIB — كله مشفّر وآمن." : "Pay with Visa, Vodafone Cash, InstaPay or CIB transfer — fully encrypted." },
            { "@type": "HowToStep", position: 3, name: isRTL ? "نوصّل الخير لبيت الأسرة" : "We deliver to the family", text: isRTL ? "بعد بحث ميداني نوصّل الاحتياج لباب البيت في الدقهلية وكفر الشيخ." : "After field assessment we deliver to the doorstep across Dakahlia & Kafr El Sheikh." },
            { "@type": "HowToStep", position: 4, name: isRTL ? "استلم التوثيق والإيصال" : "Receive proof & receipt", text: isRTL ? "يوصلك إيصال إلكتروني ورقم تتبّع وصور/فيديو للتسليم." : "You receive an e-receipt, tracking ID and delivery photos/video." },
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
          slogan: isRTL ? "بنوصّل الخير بكرامة لكل بيت محتاج" : "Delivering aid with dignity to every family in need",
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

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        {/* Brand leaf tile overlay — same SVG motif used on Bride Trousseau hero */}
        <div className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="container mx-auto px-4 py-12 md:py-16">
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
                {isRTL ? "من كرتونة الأمل لفرصة علاج وتعليم ومياه وسكن آمن — بنوصل الخير للبيوت المحتاجة بعد تحقق ميداني وبكرامة كاملة." : "From a hope box to healthcare, education, water, and safer homes — we deliver support after field verification and with full dignity."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
                <Button asChild size="lg" className="bg-whatsapp text-whatsapp-foreground shadow-whatsapp hover:opacity-95">
                  <a href={waHref} target="_blank" rel="noopener" data-source="programs" data-label="programs-whatsapp-hero">
                    <WhatsAppIcon className="h-5 w-5" aria-hidden />{isRTL ? "تواصل واتساب" : "WhatsApp us"}
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
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "إزاي بنشتغل" : "How it works"}
            </span>
            <h2 id="programs-how" className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "٤ خطوات من تبرعك لباب بيت الأسرة" : "4 steps from your donation to the family's door"}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-muted-foreground md:text-base">
              {isRTL ? "كل خطوة موثّقة بصور وفيديو، ومراجعة من فريق ميداني في الدقهلية." : "Every step is documented with photos and video and reviewed by our Dakahlia field team."}
            </p>
          </div>
          <ol className="mt-10 flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HandHeart, n: "01", t: isRTL ? "اختر البرنامج" : "Pick a program", d: isRTL ? "من غذاء وعلاج لتعليم وأضحية وستر بيوت." : "From food and health to education, Qurbani and shelter.", stickyTop: "top-[80px]", zIndex: "z-10" },
              { icon: ClipboardCheck, n: "02", t: isRTL ? "بحث اجتماعي" : "Field assessment", d: isRTL ? "فريق ميداني يزور الأسرة ويوثّق احتياجها." : "A field team visits the family and documents the need.", stickyTop: "top-[98px]", zIndex: "z-20" },
              { icon: Truck, n: "03", t: isRTL ? "تسليم بكرامة" : "Dignified delivery", d: isRTL ? "نوصّل الاحتياج لباب البيت من غير تكلفة على الأسرة." : "We deliver to the doorstep at no cost to the family.", stickyTop: "top-[116px]", zIndex: "z-30" },
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
              { k: "+12", l: isRTL ? "برنامج موثّق" : "Verified programs" },
              { k: "<8%", l: isRTL ? "مصاريف تشغيل" : "Operating costs" },
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
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "كل البرامج" : "All programs"}
            </span>
            <h2 className="mt-3 text-2xl font-black leading-[1.15] text-primary md:text-4xl">
              {isRTL ? "كل برامجنا في مكان واحد" : "Every Al-Yusr program in one place"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-muted-foreground md:text-base">
              {isRTL
                ? "اختار الباب اللي يناسب نيتك — كل برنامج موثّق ومراجع ميدانيًا ومتاح بأسعار شفافة."
                : "Pick the cause that matches your intention — every program is field-verified with transparent pricing."}
            </p>
          </div>
          <StickyStack className="mx-auto max-w-5xl overflow-x-clip" gap="mb-6 md:mb-8">
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
              return (
                <StickyStackItem key={p.slug} index={idx} top={offset}>
                  <Link
                    to={`/programs/${p.slug}`}
                    data-source="projects"
                    data-label={`project-${p.slug}`}
                    className={`group relative isolate mx-auto flex w-full max-w-5xl transform-gpu flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-b from-card to-card/95 shadow-card ring-1 ring-primary/5 transition-colors duration-300 [backface-visibility:hidden] hover:border-secondary/50 md:items-stretch ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
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
                </StickyStackItem>
              );
            })}
          </StickyStack>
        </div>

        <div className="container mx-auto mt-12 max-w-3xl px-4">
          <div className="rounded-3xl border border-secondary/30 bg-card/85 p-5 text-center shadow-soft backdrop-blur md:p-7">
            <h3 className="text-base font-black text-primary md:text-lg">
              {isRTL ? "محتار تختار أي برنامج؟" : "Not sure which program fits?"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-6 text-muted-foreground md:text-sm">
              {isRTL
                ? "اسألنا واتساب وفريق الاستشارات يرشدك لأكثر احتياج عاجل يناسب نيتك."
                : "WhatsApp us and our advisory team will guide you to the most urgent fit for your intention."}
            </p>
            <div className="mt-4 flex justify-center">
              <a href={waHref} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-extrabold text-whatsapp-foreground shadow-whatsapp transition hover:opacity-95" data-source="programs" data-label="programs-whatsapp-list">
                <WhatsAppIcon className="h-4 w-4" aria-hidden />{isRTL ? "اسأل عن أنسب برنامج" : "Ask for guidance"}
              </a>
            </div>
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
              {isRTL ? "اختر برنامج لمدينتك" : "Pick a program in your city"}
            </h2>
            <p className="mt-2 text-[13px] font-semibold leading-6 text-muted-foreground">
              {isRTL ? "الدقهلية أولًا — تغطية كل المراكز والقرى." : "Dakahlia first — covering every district and village."}
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
                  {Object.keys(activeGov.programs).length} {isRTL ? "برنامج نشط" : "active programs"}
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
                        to={`/dakahlia/${c.slug}/odhya`}
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
                ? "تغطية شاملة لبرامج الأضحية والكرتونة وزكاة المال وكفالة اليتيم والتعليم والمياه وتجهيز العرائس وستر البيوت في كل مدن وقرى محافظة الدقهلية: المنصورة، ميت غمر، بلقاس، دكرنس، شربين، أجا، السنبلاوين، طلخا، نبروه، المطرية، الجمالية، ميت سلسيل، بني عبيد، المنزلة. تبرع لكل مدينة بمؤسسة اليسر الخيرية."
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
                ? "إجابات شفافة عن التوزيع، التوثيق، والإيصالات."
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
                لسه عندك سؤال؟{" "}
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener"
                  className="font-extrabold text-primary hover:text-secondary"
                  data-source="programs-faq"
                  data-label="faq-whatsapp"
                >
                  راسلنا على واتساب
                </a>{" "}
                أو شوف <Link to="/trust" className="font-extrabold text-primary hover:text-secondary" data-source="programs-faq" data-label="faq-trust">تقارير الشفافية</Link>.
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

      {/* Bride trousseau campaign */}
      <BrideTrousseau />
    </PageLayout>
  );
};
export default Projects;
