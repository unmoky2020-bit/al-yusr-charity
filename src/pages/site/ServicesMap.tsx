import { useState, useMemo, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFaqs, type FaqItem } from "@/data/faqsApi";
import { useServicesList } from "@/hooks/useServices";
import type { ServiceCard } from "@/data/servicesApi";
import { Helmet } from "react-helmet-async";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  Stethoscope,
  Users,
  Home,
  GraduationCap,
  Sprout,
  Coins,
  Heart,
  Beef,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Droplets,
  Truck,
  HeartHandshake,
  Utensils,
  Wheat,
  Gift,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema, SiteSchemas } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useDonateSectors } from "@/data/sources/servicesMap";
import { useServicePages } from "@/data/sources/services";
import { TagsRail } from "@/components/common/TagsRail";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Sector mapping for categorizing detailed service cards */
const SERVICE_SECTOR_MAP: Record<string, { id: string; name_ar: string; name_en: string }> = {
  mosques: { id: "housing", name_ar: "الإسكان والمنشآت", name_en: "Housing & Build" },
  wells: { id: "housing", name_ar: "الإسكان والمياه", name_en: "Housing & Water" },
  housing: { id: "housing", name_ar: "الإسكان والستر", name_en: "Housing & Shelter" },
  ster: { id: "housing", name_ar: "الإسكان والدفء", name_en: "Housing & Warmth" },
  "food-box": { id: "food", name_ar: "الغذاء والإطعام", name_en: "Food & Meals" },
  farm: { id: "food", name_ar: "الغذاء والتنمية", name_en: "Food & Farm" },
  qurbani: { id: "odhya", name_ar: "صك الأضحية", name_en: "Udhiya" },
  treatment: { id: "health", name_ar: "الصحة والعلاج", name_en: "Health & Treatment" },
  orphans: { id: "kafala", name_ar: "التكافل واليتيم", name_en: "Family Care & Orphans" },
  marriage: { id: "kafala", name_ar: "التكافل والعرائس", name_en: "Family Care & Brides" },
  markoun: { id: "kafala", name_ar: "التكافل والاستدامة", name_en: "Family Care & Sustainability" },
};

const SECTOR_TAGS = [
  { id: "all", label_ar: "كافة القطاعات", label_en: "All Sectors", Icon: Sparkles },
  { id: "odhya", label_ar: "صك الأضحية", label_en: "Udhiya", Icon: Beef },
  { id: "food", label_ar: "الغذاء", label_en: "Food", Icon: UtensilsCrossed },
  { id: "health", label_ar: "الصحة", label_en: "Health", Icon: Stethoscope },
  { id: "kafala", label_ar: "التكافل الاجتماعي", label_en: "Family Care", Icon: Users },
  { id: "housing", label_ar: "الإسكان والمنشآت", label_en: "Housing & Build", Icon: Home },
];

/** Motion wrapper for cards with creative alternating mobile entrance (Right vs Left) */
const AlternatingCard = memo(({
  children,
  index,
  className = "",
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const isRight = index % 2 === 0;

  return (
    <motion.div
      initial={
        reduce
          ? false
          : {
              opacity: 0,
              x: isRight ? 45 : -45, // Mobile alternating entrance: right vs left
              y: 18,
              scale: 0.97,
            }
      }
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: (index % 3) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

const FAQS = [
  {
    id: "faq-1",
    q_ar: "ما هي قطاعات الخدمات المتاحة للتبرع في مؤسسة اليسر؟",
    q_en: "What are the available donation sectors in Al-Yusr?",
    a_ar: "تتضمن خريطة خدمات اليسر 7 قطاعات رئيسية: صك الأضحية، الغذاء (كرتونة ومطبخ ومخبز)، الصحة (علاج وأطراف صناعية وقوافل)، التكافل (كفالة أيتام وجهاز عرائس)، الإسكان (تسقيف ومياه)، التعليم (كفالة طلاب)، والتنمية والتكافل الاجتماعي.",
    a_en: "Al-Yusr services map features 7 main sectors: Udhiya, Food, Health, Family Care, Housing, Education, and Development.",
  },
  {
    id: "faq-2",
    q_ar: "كيف يتم توثيق التبرعات وتوصيلها للمستحقين؟",
    q_en: "How are donations documented and delivered?",
    a_ar: "تلتزم مؤسسة اليسر بتوثيق التبرعات بنسبة 100% بالصور والفيديو من لحظة تجهيز السلال أو الذبح وحتى التسليم لباب البيت مع الحفاظ على كرامة الأسر المتعففة في المنصورة والدقهلية وكفر الشيخ.",
    a_en: "Al-Yusr is committed to 100% photo and video documentation from preparation to doorstep delivery in Dakahlia & Kafr El Sheikh.",
  },
  {
    id: "faq-3",
    q_ar: "كيف يمكن التبرع لبرنامج معين مباشرة من خريطة الخدمات؟",
    q_en: "How can I donate to a specific program directly from the map?",
    a_ar: "يمكنك الضغط على زر 'تبرع الآن' الموجود على بطاقة أي برنامج للانتقال مباشرة إلى نموذج التبرع الآمن، أو استخدام خيار التحويل البنكي وحساباتنا الرسمية في بنك CIB.",
    a_en: "Click 'Donate now' on any program card to jump straight to our secure donation form or use our CIB bank transfer options.",
  },
];

const ServicesMap = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const reduce = useReducedMotion();
  const [activeSector, setActiveSector] = useState<string>("all");
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const base = "https://elyusr.org";

  const { data: remoteServices } = useServicesList();
  const { servicePages } = useServicePages();
  const { sectors } = useDonateSectors();
  const serviceList = remoteServices && remoteServices.length > 0 ? remoteServices : servicePages;

  const { data: dynamicFaqs } = useQuery<FaqItem[]>({
    queryKey: ["faqs-services"],
    queryFn: () => fetchFaqs({ categorySlug: "services" }),
    staleTime: 60_000,
  });

  const faqs = useMemo(() => {
    if (dynamicFaqs && dynamicFaqs.length > 0) {
      return dynamicFaqs.map((f, i) => ({
        id: `faq-${f.id || i}`,
        q_ar: f.question_ar,
        q_en: f.question_en || f.question_ar,
        a_ar: f.answer_ar,
        a_en: f.answer_en || f.answer_ar,
      }));
    }
    return FAQS;
  }, [dynamicFaqs]);

  const totalPrograms = useMemo(
    () => sectors.reduce((n, s) => n + s.programs.length, 0),
    [sectors],
  );

  const filteredServices = useMemo(() => {
    if (activeSector === "all") return serviceList;
    return serviceList.filter((s) => {
      const sec = SERVICE_SECTOR_MAP[s.slug];
      const ownSector = (s as { sector?: string }).sector;
      const sectorId = ownSector && ownSector !== "general" ? ownSector : sec?.id;
      return sectorId === activeSector;
    });
  }, [activeSector, serviceList]);

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "خريطة خدمات اليسر — 7 قطاعات للتبرع | المنصورة الدقهلية" : "Al-Yusr Services Map — 7 donation sectors | Mansoura, Dakahlia"}
        description={isRTL ? "خريطة خدمات مؤسسة اليسر الخيرية بالدقهلية وكفر الشيخ: 7 قطاعات للتبرع — الغذاء، الصحة، التكافل، الإسكان، التعليم، التنمية، والزكاة — توثيق كامل بالصور والفيديو وتوصيل لباب البيت." : "Al-Yusr Charity services map in Dakahlia: 7 donation sectors — Food, Health, Family Care, Housing, Education, Development, and Zakat — full transparency with photo & video proof."}
        path="/services-map"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "خريطة الخدمات" : "Services map", url: `${base}/services-map` },
      ]} />

      {/* Rich JSON-LD schemas: CollectionPage + ItemList + Service + FAQPage */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${base}/services-map#collection`,
          url: `${base}/services-map`,
          inLanguage: isRTL ? "ar-EG" : "en",
          name: isRTL ? "خريطة خدمات اليسر" : "Al-Yusr services map",
          isPartOf: { "@id": `${base}/#website` },
          about: { "@id": `${base}/#org` },
          hasPart: sectors.flatMap((s) =>
            s.programs.map((p) => ({
              "@type": "Service",
              name: isRTL ? p.title_ar : p.title_en,
              description: isRTL ? p.desc_ar : p.desc_en,
              url: `${base}/donate?program=${p.slug}`,
              category: isRTL ? s.title_ar : s.title_en,
              provider: { "@id": `${base}/#org` },
              areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
            }))),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: isRTL ? "قطاعات التبرع في اليسر" : "Al-Yusr donation sectors",
          numberOfItems: sectors.length,
          itemListElement: sectors.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: isRTL ? s.title_ar : s.title_en,
            url: `${base}/services-map#${s.id}`,
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: isRTL ? f.q_ar : f.q_en,
            acceptedAnswer: {
              "@type": "Answer",
              text: isRTL ? f.a_ar : f.a_en,
            },
          })),
        })}</script>
      </Helmet>

      {/* Hero Header */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />
        <div className="container mx-auto px-4 py-12 text-center md:py-16">
          <div className="flex justify-center text-primary-foreground/85">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "خريطة الخدمات" : "Services map" }]} />
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              {isRTL ? "خريطة خدمات اليسر — 7 قطاعات للتبرع" : "Al-Yusr Services Map — 7 donation sectors"}
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-primary-foreground/90 md:text-lg">
              {isRTL
                ? "تصفّح كافة القطاعات والخدمات مصنّفة وموثّقة بالكامل: اختر القطاع المناسب وتبرّع مباشرة للأسر المتعففة في الدقهلية وكفر الشيخ."
                : "Browse all classified & fully documented services: select your sector and support needy families with a single click."}
            </p>
            <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: sectors.length, v: isRTL ? "قطاعات" : "Sectors" },
                { k: totalPrograms, v: isRTL ? "برنامجًا" : "Programs" },
                { k: "100%", v: isRTL ? "توثيق" : "Documented" },
                { k: "24/7", v: isRTL ? "دعم واتساب" : "WhatsApp" },
              ].map((s, i) => (
                <motion.div
                  key={s.v}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur shadow-sm"
                >
                  <div className="font-mono text-2xl font-black">{s.k}</div>
                  <div className="text-[11px] font-bold opacity-85">{s.v}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky Sector Navigation Bar — Matching Navbar opacity & backdrop blur 100% */}
      <section className="sticky top-20 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 py-1 sm:py-1.5 shadow-sm">
        <div className="container mx-auto px-3 md:px-4">
          <TagsRail
            ariaLabel={isRTL ? "فلترة حسب القطاع" : "Filter by sector"}
            source="services-map-pillars"
            activeId={activeSector}
            items={SECTOR_TAGS.map((a) => ({
              id: a.id,
              label: isRTL ? a.label_ar : a.label_en,
              onClick: () => setActiveSector(a.id),
              icon: <a.Icon className="h-3.5 w-3.5 shrink-0" />,
            }))}
          />
        </div>
      </section>

      {/* Categorized Detailed Service Cards Grid — Alternating Mobile Entrance */}
      <section className="bg-background py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          {/* Section header — cascading top-to-bottom entrance */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/50 bg-lime-400/10 px-3.5 py-1 text-xs font-extrabold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "تقارير وصفحات تفصيلية" : "Detailed Service Pages"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
              {isRTL ? "تعرّف على خدماتنا بالتفصيل" : "Explore our services in detail"}
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {isRTL
                ? "صفحات مكتوبة بأيدي فريق المؤسسة من قلب الميدان: مصنّفة حسب القطاع لمعرفة التفاصيل، التوثيق، والتسليم لباب البيت."
                : "Pages written by our team from the field: categorized by sector to show impact, proof, and doorstep delivery."}
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="mt-8 grid gap-5 text-start sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((s, idx) => {
              const secInfo = SERVICE_SECTOR_MAP[s.slug];
              const sectorLabel = secInfo ? (isRTL ? secInfo.name_ar : secInfo.name_en) : (isRTL ? s.badge_ar : s.badge_en);

              return (
                <AlternatingCard key={s.slug} index={idx}>
                  <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-lime-400/80 hover:shadow-card">
                    {/* Card Hero Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={s.hero}
                        alt={isRTL ? s.title_ar : s.title_en}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Sector classification badge */}
                      <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full border border-lime-400/50 bg-primary/90 px-3 py-1 text-[10.5px] font-extrabold text-primary-foreground backdrop-blur shadow-sm">
                        <CheckCircle2 className="h-3 w-3 text-lime-400" />
                        {sectorLabel}
                      </span>
                    </div>

                    {/* Card Content & Concise Summary */}
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <h3 className="text-base font-black leading-snug text-primary md:text-lg">
                        {isRTL ? s.title_ar : s.title_en}
                      </h3>
                      {/* Concise 2-line summary */}
                      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
                        {isRTL ? s.intro_ar : s.intro_en}
                      </p>

                      {/* Card Action Buttons */}
                      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/50 pt-3.5">
                        <Button
                          asChild
                          size="sm"
                          className="bg-orange-grad text-xs font-extrabold text-accent-foreground shadow-cta hover:opacity-95"
                        >
                          <Link to={`/donate?program=${s.programSlug}`}>
                            <Heart className="h-3.5 w-3.5" />
                            {isRTL ? "تبرع الآن" : "Donate now"}
                          </Link>
                        </Button>

                        <Link
                          to={`/services/${s.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-extrabold text-secondary transition group-hover:text-primary"
                        >
                          {isRTL ? "اقرأ التفاصيل" : "Details"}
                          <Arrow className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </AlternatingCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Proof Points Strip */}
      <section className="bg-muted/20 py-10 border-t border-border/50">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-lime-400/40 bg-card p-4 text-center shadow-soft sm:grid-cols-4 md:p-6">
            {[
              { k: "2665/2019", l: isRTL ? "رقم الإشهار الرسمي" : "Official License" },
              { k: "<8%", l: isRTL ? "مصاريف تشغيلية" : "Operating cost" },
              { k: "100%", l: isRTL ? "توصيل لباب البيت" : "Doorstep delivery" },
              { k: "CIB", l: isRTL ? "حساب بنكي موثّق" : "Verified CIB bank" },
            ].map(({ k, l }, i) => (
              <motion.div
                key={l}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl bg-lime-400/10 border border-lime-400/30 p-3"
              >
                <div className="font-mono text-base font-black text-primary md:text-xl">{k}</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-extrabold text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-secondary" />
                  {l}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Choose Donation Now — Interactive Live Marquee Band ────── */}
      <section
        aria-labelledby="donation-axes-title"
        className="relative py-12 md:py-16 bg-gradient-to-b from-muted/20 via-background to-muted/20 border-t border-border/50 overflow-hidden"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-secondary/25 bg-gradient-to-b from-[#fbfdf7] via-card to-[#f4fae9] p-6 shadow-[0_20px_60px_-20px_hsl(var(--secondary)/0.15)] sm:p-8 md:p-10">
            {/* Balanced Ambient Glows (Top & Bottom) & Pattern */}
            <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-30" />
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/15 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                {isRTL ? "أنشطة ومبادرات مؤسسة اليسر" : "Al-Yusr Activities & Initiatives"}
              </span>

              <h2 id="donation-axes-title" className="mt-3.5 text-2xl font-black leading-tight text-primary sm:text-3xl md:text-[34px]">
                {isRTL ? "اختر تبرعك الآن" : "Choose your donation now"}
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-xs font-semibold leading-relaxed text-foreground/80 sm:text-sm md:text-base">
                {isRTL
                  ? "لنا هدفان: الأول يركز على المستحق والثاني عليك. هدفنا الأكبر هو النجاة بالإنسان من الفقر، فلا نركز على إعطاء مساعدة عابرة، بل علي تغير حياة المستحق والهدف الثاني هو أن نجعل لتبرعك أثراً في حياتك وحياة المستحق."
                  : "We have two goals: first, to focus on the recipient; second, on you. Our largest aim is lifting people out of poverty rather than temporary aid, but truly transforming the recipient's life and making your donation leave a lasting impact."}
              </p>

              <p className="mx-auto mt-2.5 max-w-2xl text-[11.5px] font-extrabold leading-6 text-primary sm:text-xs md:text-sm">
                {isRTL
                  ? "نوفر في مؤسسة اليسر الخيرية بالمنصورة - الدقهلية اكثر من نشاط وحملة تبرعات تخدم كل محافظات مصر :"
                  : "Al-Yusr Charity Foundation in Mansoura - Dakahlia provides multiple activities and donation campaigns serving all governorates of Egypt:"}
              </p>
            </div>

            {/* Infinite Scrolling Marquee Rows (Right & Left) */}
            {(() => {
              const row1 = [
                { label: isRTL ? "أسقف منازل" : "Home Roofing", href: "/programs/shelter", Icon: Home },
                { label: isRTL ? "وصلات مياه" : "Water Connections", href: "/programs/water", Icon: Droplets },
                { label: isRTL ? "باب الجنة" : "Bab Al-Jannah", href: "/donate?program=general", Icon: Sparkles },
                { label: isRTL ? "سيارة تكريم الإنسان" : "Honor Vehicle", href: "/services/honor-vehicle", Icon: Truck },
                { label: isRTL ? "كفالة طالب" : "Student Sponsorship", href: "/programs/education", Icon: GraduationCap },
                { label: isRTL ? "كفالة أسرة" : "Family Sponsorship", href: "/programs/orphans", Icon: HeartHandshake },
              ];

              const row2 = [
                { label: isRTL ? "تحفيظ قرآن" : "Quran Memorization", href: "/programs/quran", Icon: Sparkles },
                { label: isRTL ? "إعمار مساجد" : "Mosque Renovation", href: "/programs/mosques", Icon: Home },
                { label: isRTL ? "إطعام" : "Feeding & Meals", href: "/programs/food", Icon: Utensils },
                { label: isRTL ? "ذبائح شهرية" : "Monthly Sacrifices", href: "/farm", Icon: Wheat },
                { label: isRTL ? "كراتين غذائية" : "Food Boxes", href: "/programs/food", Icon: Gift },
              ];

              const renderTrack = (items: typeof row1, reverse = false, duration = 38) => {
                // Quadruple items in each half to ensure massive continuous width with zero gaps on any screen
                const chunk = [...items, ...items, ...items, ...items];
                return (
                  <div
                    dir="ltr"
                    className="group relative -mx-4 overflow-hidden py-1.5 sm:mx-0 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
                  >
                    <div
                      className="flex w-max items-center will-change-transform group-hover:[animation-play-state:paused]"
                      style={{
                        animation: `${reverse ? "services-marquee-right" : "services-marquee-left"} ${duration}s linear infinite`,
                      }}
                    >
                      {/* Block 1 */}
                      <div className="flex shrink-0 items-center gap-3.5 pe-3.5">
                        {chunk.map((t, idx) => (
                          <Link
                            key={`b1-${idx}-${t.label}`}
                            to={t.href}
                            className="group/tag inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-secondary/35 bg-card/95 px-4 py-2.5 text-xs sm:text-sm font-black text-primary shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary/15 hover:shadow-[0_8px_20px_rgba(40,120,40,0.12)] hover:ring-2 hover:ring-secondary/40"
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary transition-all group-hover/tag:scale-110 group-hover/tag:bg-secondary group-hover/tag:text-secondary-foreground shadow-sm">
                              <t.Icon className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap font-black">{t.label}</span>
                          </Link>
                        ))}
                      </div>

                      {/* Block 2 (identical duplicate to achieve continuous 50% loop) */}
                      <div aria-hidden className="flex shrink-0 items-center gap-3.5 pe-3.5">
                        {chunk.map((t, idx) => (
                          <Link
                            key={`b2-${idx}-${t.label}`}
                            to={t.href}
                            tabIndex={-1}
                            className="group/tag inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-secondary/35 bg-card/95 px-4 py-2.5 text-xs sm:text-sm font-black text-primary shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary/15 hover:shadow-[0_8px_20px_rgba(40,120,40,0.12)] hover:ring-2 hover:ring-secondary/40"
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary transition-all group-hover/tag:scale-110 group-hover/tag:bg-secondary group-hover/tag:text-secondary-foreground shadow-sm">
                              <t.Icon className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap font-black">{t.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div className="relative mt-8 space-y-3.5">
                  {renderTrack(row1, false, 36)}
                  {renderTrack(row2, true, 40)}

                  <style>{`
                    @keyframes services-marquee-left {
                      0% { transform: translate3d(0, 0, 0); }
                      100% { transform: translate3d(-50%, 0, 0); }
                    }
                    @keyframes services-marquee-right {
                      0% { transform: translate3d(-50%, 0, 0); }
                      100% { transform: translate3d(0, 0, 0); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                      .group > div { animation: none !important; }
                    }
                  `}</style>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* FAQ Section — Rich SEO FAQ & Schema Accordion */}
      <section className="bg-background py-12 md:py-16 border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3.5 py-1 text-xs font-extrabold text-primary">
              <HelpCircle className="h-3.5 w-3.5 text-secondary" />
              {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "كل ما تريد معرفته عن قطاعات خدماتنا" : "All you need to know about our services"}
            </h2>
          </div>
          <div className="mt-8 rounded-3xl border border-border bg-card p-4 md:p-6 shadow-soft">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                  <AccordionTrigger className="text-start text-base font-extrabold text-primary hover:text-secondary">
                    {isRTL ? faq.q_ar : faq.q_en}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {isRTL ? faq.a_ar : faq.a_en}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Center link to FAQ Hub */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/faqs"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-secondary/40 bg-card px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-primary shadow-sm hover:bg-secondary/10 transition"
            >
              <span>{isRTL ? "مركز الأسئلة الشائعة" : "FAQ Center"}</span>
              <Arrow className="h-3.5 w-3.5 text-secondary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Action CTA */}
      <section id="how-to-help" className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground scroll-mt-24 pt-12 md:pt-16 pb-24 sm:pb-28 md:pb-36 lg:pb-40">
        <div className="container relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold backdrop-blur">
            {isRTL ? "ابدأ من هنا" : "Start here"}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight md:text-4xl">
            {isRTL ? "اختر خدمة وادعمها مباشرة" : "Pick a service and support it directly"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
            {isRTL
              ? "ابدأ من الحالات الموثّقة، أو احسب زكاتك، أو ادعم برنامجًا — كل تبرع يُوثَّق بالصور والفيديو."
              : "Start with verified cases, calculate your Zakat, or back a program — every donation documented with photos & video."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg" className="bg-orange-grad font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/cases" data-source="services-map" data-label="cases">
                <Heart className="h-5 w-5" />
                {isRTL ? "الحالات النشطة" : "Active cases"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link to="/zakat" data-source="services-map" data-label="zakat">
                {isRTL ? "احسب زكاتك" : "Zakat calculator"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link to="/programs" data-source="services-map" data-label="programs">
                {isRTL ? "كل البرامج" : "All programs"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link to="/projects" data-source="services-map" data-label="projects">
                {isRTL ? "المشاريع الكبرى" : "Major projects"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ServicesMap;