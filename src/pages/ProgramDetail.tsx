import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Heart,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Phone,
  ShieldCheck,
  Camera,
  Truck,
  HandHeart,
  ListChecks,
  HelpCircle,
  Quote,
  MapPin,
  BadgeCheck,
  FileCheck2,
  Receipt,
  Headset,
  ClipboardCheck,
  Search,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { usePrograms } from "@/data/sources/programs";
import { track } from "@/lib/track";
import { BrideTrousseau } from "@/components/sections/BrideTrousseau";
import { RelatedContentLinks } from "@/components/common/RelatedContentLinks";
import { FieldConvoysGallery } from "@/components/sections/FieldConvoysGallery";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { TagsRail } from "@/components/common/TagsRail";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useProgramFaqs } from "@/data/programFaqs";
import { DetailPageSkeleton } from "@/components/common/ContentSkeletons";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { programSeo } from "@/data/programSeo";
import { ProgramUnavailable } from "@/components/programs/ProgramUnavailable";

type SubOption = {
  id: string;
  slug: string;
  packageId: number;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  amount: number | null;
  image_url: string | null;
  sort_order: number;
};

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const ALIAS_OF: Record<string, string> = { satr: "shelter", food: "box" };
  const aliasRedirect = slug && ALIAS_OF[slug] ? ALIAS_OF[slug] : undefined;
  // Published backend programs (static only when the API is unreachable); see src/data/sources/programs.ts.
  const { programs, isLoading: programsLoading } = usePrograms();
  const program = slug ? programs.find((p) => p.slug === slug) : undefined;
  const reduce = useReducedMotion();
  const isRTL = lang === "ar";
  // Program FAQ: own questions -> linked FAQ category -> "programs" category (see src/data/programFaqs.ts).
  const linkedFaqs = useProgramFaqs(program, isRTL, []);

  // Always run hooks before early return
  useEffect(() => {
    if (!program) return;
    track("program_view", {
      fbEvent: "ViewContent",
      payload: {
        program: program.slug,
        price_from: program.priceFrom,
        currency: "EGP",
        source: "program-detail",
      },
    });
  }, [program]);

  const isMobile = typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;
  const dirX = isRTL ? 1 : -1;

  if (aliasRedirect) return <Navigate to={`/programs/${aliasRedirect}`} replace />;
  if (programsLoading) return <PageLayout><DetailPageSkeleton /></PageLayout>;
  if (!program) return <ProgramUnavailable />;

  const content = program[lang];
  const seo = programSeo(program, lang);
  const hero = {
    title: program.hero?.[lang].title || content.name,
    subtitle: program.hero?.[lang].subtitle || content.tagline,
    badge: program.hero?.[lang].badge || (isRTL ? "برنامج معتمد" : "Verified program"),
    image: program.hero?.image || program.image,
  };
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const baseUrl = "https://elyusr.org";
  const url = `${baseUrl}/programs/${program.slug}`;
  const related = programs.filter((p) => p.slug !== program.slug).slice(0, 3);
  // Donation options = the program's shares from the dashboard (program → «باقات التبرع»).
  const subOptions: SubOption[] = (program.packages ?? []).map((pk, i) => ({
    id: String(pk.id), slug: pk.slug, packageId: pk.id,
    title_ar: pk.nameAr, title_en: pk.nameEn, description_ar: null, description_en: null,
    amount: pk.amount || null, image_url: null, sort_order: i,
  }));
  const safeSubOptions = subOptions;
  const displaySubOptions = subOptions;

  // Section TOC for in-page nav
  const toc = [
    { id: "benefits", label: isRTL ? "المزايا" : "Benefits" },
    ...(safeSubOptions.length > 0 ? [{ id: "options", label: isRTL ? "خيارات التبرع" : "Donation options" }] : []),
    { id: "how-it-works", label: isRTL ? "كيف يعمل البرنامج" : "How it works" },
    { id: "details", label: isRTL ? "التفاصيل" : "Details" },
    { id: "impact", label: isRTL ? "الأثر" : "Impact" },
    { id: "testimonials", label: isRTL ? "آراء المتبرعين" : "Donor stories" },
    { id: "faq", label: isRTL ? "أسئلة شائعة" : "FAQ" },
    { id: "related", label: isRTL ? "برامج مشابهة" : "Related" },
  ];

  const trackCta = (cta: string, target: string, fbEvent?: string) =>
    track("program_cta_click", {
      fbEvent,
      payload: { program: program.slug, cta, target, source: "program-detail" },
    });

  // Steps & FAQ keyed by program slug; fall back to a generic set.
  const defaultSteps =
    isRTL
      ? [
          { icon: HandHeart, t: "اختيار الحالة", d: "بحث ميداني للأسر الأكثر استحقاقاً في الدقهلية ومحافظات مصر." },
          { icon: ShieldCheck, t: "التحقق والاعتماد", d: "مراجعة شرعية ومحاسبية لكل عملية لضمان الشفافية الكاملة." },
          { icon: Truck, t: "التنفيذ والتسليم", d: "تسليم بكرامة لباب البيت بواسطة فريق متطوعينا المعتمدين." },
          { icon: Camera, t: "التوثيق", d: "تقرير مصوّر وفيديوهات تصلك بعد التنفيذ مباشرة." },
        ]
      : [
          { icon: HandHeart, t: "Case selection", d: "Field research to identify the most deserving families in Dakahlia and across Egypt." },
          { icon: ShieldCheck, t: "Verification", d: "Shariah and accounting review of every operation for full transparency." },
          { icon: Truck, t: "Delivery", d: "Dignified doorstep delivery by our certified volunteer team." },
          { icon: Camera, t: "Documentation", d: "Photo and video reports sent to you right after execution." },
        ];
  // «أقسام الصفحة» from the dashboard replace the defaults when they have items.
  const STEP_ICONS = [HandHeart, ShieldCheck, Truck, Camera];
  const sectionSteps = program.sections?.steps?.[lang];
  const steps = sectionSteps?.length
    ? sectionSteps.map((s, i) => ({ icon: STEP_ICONS[i % STEP_ICONS.length], t: s.t, d: s.d }))
    : defaultSteps;
  const benefits = program.sections?.benefits?.[lang]?.length ? program.sections.benefits[lang] : content.benefits;
  const longContent = program.sections?.details?.[lang]?.length ? program.sections.details[lang] : content.longContent;
  const impactItems = program.sections?.impact?.[lang];

  const genericFaqs =
    isRTL
      ? [
          { q: "هل تبرعي يصل فعلاً للمستحقين؟", a: "نعم — كل تبرع موثّق بالصور والفيديو، ومراجع من فريقنا المحاسبي المستقل." },
          { q: "هل أحصل على إيصال رسمي؟", a: "بمجرد إتمام الدفع يصلك إيصال إلكتروني فوري على بريدك ورقم تتبع للحالة." },
          { q: "هل يمكنني تخصيص محافظة معينة؟", a: "نعم، يمكنك تخصيص تبرعك لمحافظة الدقهلية أو أي محافظة أخرى نعمل بها." },
          { q: "ما طرق الدفع المتاحة؟", a: "فيزا/ماستر كارد، Vodafone Cash، InstaPay، وتحويل بنكي على CIB." },
        ]
      : [
          { q: "Does my donation really reach the beneficiaries?", a: "Yes — every donation is documented with photos and videos, and reviewed by our independent accounting team." },
          { q: "Will I receive an official receipt?", a: "An electronic receipt and a tracking reference are emailed to you instantly after payment." },
          { q: "Can I designate a specific governorate?", a: "Yes, you can designate your donation to Dakahlia or any governorate we operate in." },
          { q: "What payment methods are supported?", a: "Visa/Mastercard, Vodafone Cash, InstaPay, and bank transfer to CIB." },
        ];
  const faqs = linkedFaqs.length ? linkedFaqs : genericFaqs;

  return (
    <PageLayout>
      <SEOHelmet
        title={seo.title}
        description={seo.description}
        path={`/programs/${program.slug}`}
        image={program.image}
      />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: t.nav.home, url: `${baseUrl}/` },
          { name: t.nav.programs, url: `${baseUrl}/#programs` },
          { name: content.name, url },
        ]}
      />
      <Helmet>
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "@id": `${url}#service`,
          name: content.name,
          alternateName: program[lang === "ar" ? "en" : "ar"].name,
          serviceType: isRTL ? "خدمة خيرية" : "Charitable service",
          provider: { "@id": `${baseUrl}/#org` },
          brand: { "@id": `${baseUrl}/#org` },
          areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
          availableChannel: {
            "@type": "ServiceChannel",
            serviceUrl: `${baseUrl}/donate?program=${program.slug}`,
            servicePhone: "+201097000137",
          },
          termsOfService: `${baseUrl}/terms`,
          isRelatedTo: related.map((r) => ({
            "@type": "Service",
            name: r[lang].name,
            url: `${baseUrl}/programs/${r.slug}`,
          })),
          description: content.desc,
          image: program.image.startsWith("http") ? program.image : `${baseUrl}${program.image}`,
          offers: program.priceFrom > 0 ? {
            "@type": "Offer",
            price: program.priceFrom,
            priceCurrency: "EGP",
            availability: "https://schema.org/InStock",
            url,
            seller: { "@id": `${baseUrl}/#org` },
            category: isRTL ? "خير وصدقة" : "Charity & Sadaqah",
          } : undefined,
        })}</script>
        {subOptions.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "OfferCatalog",
            name: isRTL ? `خيارات التبرع — ${content.name}` : `Donation options — ${content.name}`,
            provider: { "@id": `${baseUrl}/#org` },
            itemListElement: subOptions.map((o) => ({
              "@type": "Offer",
              price: o.amount ?? undefined,
              priceCurrency: o.amount ? "EGP" : undefined,
              availability: "https://schema.org/InStock",
              url: `${baseUrl}/donate?program=${program.slug}&package=${o.packageId}`,
              itemOffered: {
                "@type": "Service",
                name: isRTL ? o.title_ar : (o.title_en || o.title_ar),
                description: isRTL ? (o.description_ar || undefined) : (o.description_en || o.description_ar || undefined),
                ...(o.image_url ? { image: o.image_url } : {}),
              },
            })),
          })}</script>
        )}
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
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: isRTL ? "برامج مشابهة" : "Related programs",
          itemListElement: related.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${baseUrl}/programs/${r.slug}`,
            name: r[lang].name,
            image: r.image.startsWith("http") ? r.image : `${baseUrl}${r.image}`,
          })),
        })}</script>
      </Helmet>

      {/* Hero */}
      <section
        data-source={`program-${program.slug}-hero`}
        className="relative -mt-px overflow-hidden pattern-hero-luxe hero-pattern-fade text-primary-foreground"
      >
        <div className="container relative mx-auto grid gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div className="order-1 text-center md:order-none md:text-start">
            <div className="flex justify-center text-primary-foreground/80 md:justify-start">
              <Breadcrumbs
                items={[
                  { name: t.nav.home, href: "/" },
                  { name: t.nav.programs, href: "/#programs" },
                  { name: content.name },
                ]}
              />
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight md:text-4xl">{hero.title}</h1>
            <p className="mt-4 text-lg text-primary-foreground/85 md:text-xl">{hero.subtitle}</p>
            <p className="mt-3 mx-auto md:mx-0 max-w-xl text-primary-foreground/75">{content.desc}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Button
                asChild
                size="lg"
                className="flex-1 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95 sm:flex-initial"
              >
                <Link
                  to={`/donate?program=${program.slug}`}
                  data-source={`program-${program.slug}`}
                  data-label="hero-donate"
                  onClick={() => trackCta("hero-donate", `/donate?program=${program.slug}`, "InitiateCheckout")}
                >
                  <Heart className="h-5 w-5" />
                  {isRTL ? "تبرع لهذا البرنامج" : "Donate to this program"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="flex-1 border-secondary/50 bg-secondary/10 text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground sm:flex-initial"
              >
                <a
                  href="https://wa.me/201097000137"
                  target="_blank"
                  rel="noopener"
                  dir="ltr"
                  data-source={`program-${program.slug}`}
                  data-label="hero-whatsapp"
                  onClick={() => trackCta("hero-whatsapp", "https://wa.me/201097000137", "Contact")}
                >
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp
                </a>
              </Button>
            </div>

            {program.priceFrom > 0 && (
              <div
                data-source={`program-${program.slug}-pricing`}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2 text-sm font-extrabold text-secondary-foreground shadow-cta"
              >
                {isRTL ? `يبدأ من ${program.priceFrom} ج` : `From ${program.priceFrom} EGP`}
              </div>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-md md:max-w-full">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/25 blur-3xl" />
            {/* The photo fills the frame (no blurred side bars). */}
            <div className="relative aspect-[4/3] max-h-[460px] w-full overflow-hidden rounded-[2rem] bg-primary/30 shadow-card md:rounded-[2.5rem]">
              <img decoding="async"
                src={hero.image}
                alt={hero.title}
                fetchpriority="high"
                className="relative h-full w-full object-cover object-center"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky in-page TOC */}
      <div className="sticky top-20 z-30 border-y border-border bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-2">
          <TagsRail
            source={`program-${program.slug}-toc`}
            ariaLabel={isRTL ? "روابط سريعة داخل الصفحة" : "On-page quick links"}
            items={toc.map((s) => ({ id: s.id, label: s.label, href: `#${s.id}` }))}
          />
        </div>
      </div>

      {/* Program brief / intro — concise summary at top of detail page */}
      <section aria-labelledby={`program-${program.slug}-intro`} className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-3xl px-4 py-8 text-center md:py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {isRTL ? "نبذة عن البرنامج" : "About this program"}
          </span>
          <h2 id={`program-${program.slug}-intro`} className="mt-3 text-xl font-black text-primary md:text-2xl">
            {content.tagline}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {content.desc}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section
        id="benefits"
        data-source={`program-${program.slug}-benefits`}
        className="scroll-mt-28 bg-background py-14 md:py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {isRTL ? "ليه البرنامج ده" : "Why this program"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "مزايا البرنامج" : "Program highlights"}
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-card"
              >
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
                <p className="text-sm font-semibold text-foreground/90">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation options = the program's shares (backend donation_packages) */}
      {subOptions.length > 0 && (
        <section
          id="options"
          data-source={`program-${program.slug}-options`}
          className="scroll-mt-28 bg-background py-14 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {isRTL ? "اختر الجزء اللي يلمس قلبك" : "Pick the part that moves your heart"}
              </span>
              <h2 className="mt-3 text-xl font-black text-primary md:text-3xl">
                {isRTL ? "ادعم البرنامج بالكامل" : "Support the whole program"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {isRTL
                  ? "تبرع واحد موحّد للبرنامج كله بأي مبلغ تختاره — يوزّع على كل أنشطته واحتياجاته."
                  : "One unified donation to the entire program at any amount you choose — distributed across all its activities."}
              </p>
            </div>

            {displaySubOptions.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displaySubOptions.map((o) => {
                const title = isRTL ? o.title_ar : (o.title_en || o.title_ar);
                const desc = isRTL ? o.description_ar : (o.description_en || o.description_ar);
                return (
                  <div
                    key={o.id}
                    className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-black text-primary md:text-lg">{title}</h3>
                        {o.amount ? (
                          <span className="shrink-0 rounded-full bg-secondary/25 px-2.5 py-1 text-[11px] font-black text-primary">
                            {o.amount.toLocaleString()} EGP
                          </span>
                        ) : null}
                      </div>
                      {desc && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" className="flex-1 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                        <Link
                          to={`/donate?program=${program.slug}&package=${o.packageId}`}
                          data-source={`program-${program.slug}-options`}
                          data-label={`option-${o.slug}-donate`}
                          onClick={() => trackCta(`option-${o.slug}-donate`, `/donate?program=${program.slug}&package=${o.packageId}`, "InitiateCheckout")}
                        >
                          <Heart className="h-4 w-4" />
                          {isRTL ? "تبرع" : "Donate"}
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-secondary/50">
                        <Link
                          to={`/programs/${program.slug}/${o.slug}`}
                          data-source={`program-${program.slug}-options`}
                          data-label={`option-${o.slug}-details`}
                          onClick={() => trackCta(`option-${o.slug}-details`, `/programs/${program.slug}/${o.slug}`)}
                        >
                          {isRTL ? "تفاصيل" : "Details"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl bg-primary/5 p-5 text-center sm:flex-row sm:text-start">
              <div className="flex-1">
                <h3 className="text-base font-black text-primary md:text-lg">
                  {isRTL ? "أو ادعم البرنامج بالكامل" : "Or support the whole program"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                  {isRTL ? "اختر مبلغك بنفسك ووجِّهه لكل احتياجات البرنامج." : "Choose your own amount and direct it to all program needs."}
                </p>
              </div>
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link
                  to={
                    `/donate?program=${program.slug}`
                  }
                  data-source={`program-${program.slug}-options`}
                  data-label="donate-whole-program"
                  onClick={() => trackCta("donate-whole-program", `/donate?program=${program.slug}`, "InitiateCheckout")}
                >
                  <Heart className="h-5 w-5" />
                  {isRTL ? "تبرع للبرنامج كله" : "Donate to whole program"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section
        id="how-it-works"
        data-source={`program-${program.slug}-how`}
        className="scroll-mt-24 bg-muted/30 py-14 md:py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-black text-primary md:text-3xl">
              {isRTL ? "كيف يعمل البرنامج؟" : "How does it work?"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {isRTL
                ? "كل خطوة موثّقة وكل قرش يصل لمن يستحق — هكذا نعمل في اليسر."
                : "Every step is documented and every pound reaches those who deserve it — this is how Al-Yusr works."}
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={i}
                className="sticky top-24 z-10 relative rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card md:static"
              >
                <span className="absolute -top-3 start-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-grad text-xs font-black text-accent-foreground shadow-cta">
                  {i + 1}
                </span>
                <s.icon className="mt-2 h-7 w-7 text-secondary" />
                <h3 className="mt-3 text-base font-extrabold text-primary">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Long content */}
      <section
        id="details"
        data-source={`program-${program.slug}-details`}
        className="scroll-mt-24 bg-background py-14 md:py-20"
      >
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
              <ListChecks className="h-3.5 w-3.5 text-primary" /> {isRTL ? "تفاصيل البرنامج" : "About the program"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "كل ما تحتاج معرفته" : "Everything you need to know"}
            </h2>
          </div>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/85">
            {longContent.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Inline CTA */}
          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
            <Button
              asChild
              size="lg"
              className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95"
            >
              <Link
                to={`/donate?program=${program.slug}`}
                data-source={`program-${program.slug}`}
                data-label="details-donate"
                onClick={() => trackCta("details-donate", `/donate?program=${program.slug}`, "InitiateCheckout")}
              >
                <Heart className="h-5 w-5" />
                {isRTL ? "تبرع الآن" : "Donate now"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href="https://wa.me/201097000137"
                target="_blank"
                rel="noopener"
                dir="ltr"
                data-source={`program-${program.slug}`}
                data-label="details-whatsapp"
                onClick={() => trackCta("details-whatsapp", "https://wa.me/201097000137", "Contact")}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {isRTL ? "تواصل واتساب" : "WhatsApp"}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section
        id="impact"
        data-source={`program-${program.slug}-impact`}
        className="scroll-mt-28 bg-background py-14 md:py-20"
      >
        {/* ── Program journey timeline — premium stages with motion ── */}
        <div className="container mx-auto mb-14 max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 border border-secondary/40 px-3.5 py-1 text-xs font-black text-black shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {isRTL ? "رحلة البرنامج" : "Program journey"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {isRTL ? "٤ مراحل من تبرعك لباب البيت" : "4 stages from your donation to the family's door"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {isRTL
                ? "كل مرحلة موثّقة بتقرير ميداني وصور قبل ما ندفع لباب البيت."
                : "Every stage is logged in a field report with photos before we move to delivery."}
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(impactItems?.length
              ? impactItems.slice(0, 4).map((it, i) => ({ Icon: [HandHeart, Search, PackageCheck, ClipboardCheck][i], n: String(i + 1).padStart(2, "0"), t: it.t, d: it.d }))
              : [
              { Icon: HandHeart, n: "01", t: isRTL ? "تبرعك" : "Your donation", d: isRTL ? "اختر مبلغ ودفع آمن عبر فيزا أو محفظة أو إنستا باي." : "Pick an amount, pay securely via card, wallet or InstaPay." },
              { Icon: Search, n: "02", t: isRTL ? "بحث ميداني" : "Field assessment", d: isRTL ? "زيارة بيت الأسرة وتحقق من الاستحقاق." : "Home visit and eligibility verification." },
              { Icon: PackageCheck, n: "03", t: isRTL ? "تجهيز وتنفيذ" : "Prepare & execute", d: isRTL ? "تجهيز الاحتياج بجودة سوبر ماركت." : "Prepared at supermarket-grade quality." },
              { Icon: ClipboardCheck, n: "04", t: isRTL ? "تسليم وتقرير" : "Deliver & report", d: isRTL ? "تسليم لباب البيت + تقرير مصوّر وإيصال." : "Doorstep delivery + photo report and e-receipt." },
            ]).map(({ Icon, n, t: title, d }, i) => (
              <li key={n}>
                <motion.div
                  initial={false}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: isMobile ? "-40px" : "-80px", amount: 0.2 }}
                  transition={{ duration: isMobile ? 0.45 : 0.6, delay: i * (isMobile ? 0.05 : 0.09), ease: [0.22, 1, 0.36, 1] }}
                  className="sticky top-24 z-10 group relative rounded-3xl border border-primary/10 bg-[linear-gradient(145deg,hsl(var(--card)),hsl(var(--secondary)/0.08))] p-5 shadow-soft transition will-change-transform hover:-translate-y-1 hover:border-secondary/40 hover:shadow-card md:static md:h-full"
                >
                  <span className="absolute -top-3 start-5 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] font-black text-accent-foreground shadow-sm">{n}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/20 text-primary transition group-hover:bg-secondary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-base font-black text-primary md:text-lg">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-muted-foreground md:text-sm">{d}</p>
                </motion.div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Dedicated donate CTA card — orange gradient, premium ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto mb-14 max-w-5xl px-4"
        >
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary to-primary/85 p-6 text-primary-foreground shadow-card md:p-10">
            <span aria-hidden className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />
            <span aria-hidden className="pointer-events-none absolute -start-10 bottom-0 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/50 bg-primary/40 px-3 py-1 text-[11px] font-extrabold text-secondary backdrop-blur">
                  <Heart className="h-3.5 w-3.5" /> {isRTL ? "ساهم في البرنامج" : "Support this program"}
                </span>
                <h3 className="mt-3 text-xl font-black leading-tight md:text-3xl">
                  {isRTL
                    ? `تبرعك لـ "${content.name}" بيوصل لأسرة فعليّة خلال أيام`
                    : `Your donation to "${content.name}" reaches a real family within days`}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-7 text-primary-foreground/85 md:text-base">
                  {isRTL
                    ? "كل جنيه بيُصرف بعد بحث اجتماعي ميداني، وبيوصلك تقرير مصوّر بعد التنفيذ."
                    : "Every EGP is spent after field assessment, and you receive a photo report after execution."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 md:flex-nowrap">
                <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link
                    to={`/donate?program=${program.slug}`}
                    data-source={`program-${program.slug}-cta-card`}
                    data-label="cta-card-donate"
                    onClick={() => trackCta("cta-card-donate", `/donate?program=${program.slug}`, "InitiateCheckout")}
                  >
                    <Heart className="h-5 w-5" />
                    {program.priceFrom > 0
                      ? (isRTL ? `تبرع من ${program.priceFrom} ج` : `Donate from ${program.priceFrom} EGP`)
                      : (isRTL ? "تبرع الآن" : "Donate now")}
                  </Link>
                </Button>
          
              </div>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-black text-primary md:text-2xl">
              {isRTL ? "ضمانات اليسر في كل برنامج" : "Al-Yusr's guarantees in every program"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {isRTL
                ? "مش وعود — ده الالتزام اللي بنشتغل بيه قبل وأثناء وبعد كل عملية صرف."
                : "Not promises — this is the commitment we operate by before, during, and after every distribution."}
            </p>
          </div>
          <div className="mx-auto mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: FileCheck2, t: isRTL ? "بحث اجتماعي قبل الصرف" : "Social assessment first", d: isRTL ? "زيارة ميدانية وتحقق من الاستحقاق قبل أي تنفيذ." : "Field visit and eligibility verification before any spend." },
              { Icon: BadgeCheck, t: isRTL ? "موافق للشريعة 100%" : "100% Shariah-compliant", d: isRTL ? "إشراف شرعي على الزكاة والأضحية والصدقات." : "Shariah oversight on Zakat, Qurbani, and Sadaqah." },
              { Icon: Camera, t: isRTL ? "توثيق بالصور والفيديو" : "Photo & video documentation", d: isRTL ? "تقرير مصوّر يصلك بعد التسليم." : "A photo report is shared with you after delivery." },
              { Icon: Receipt, t: isRTL ? "إيصال إلكتروني فوري" : "Instant electronic receipt", d: isRTL ? "إيصال برقم مرجعي لتتبع الحالة." : "Receipt with a reference code to track the case." },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 text-start shadow-soft">
                <c.Icon className="h-7 w-7 text-secondary" />
                <h3 className="mt-3 text-base font-black text-primary">{c.t}</h3>
                <p className="mt-1.5 text-xs leading-6 text-muted-foreground md:text-sm">{c.d}</p>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-10 grid gap-3 rounded-3xl bg-muted/40 p-5 sm:grid-cols-3 md:p-6">
            {[
              { Icon: ShieldCheck, t: isRTL ? "شفافية كاملة" : "Full transparency", d: isRTL ? "تقارير مالية مراجعة." : "Audited financial reports." },
              { Icon: Camera, t: isRTL ? "توثيق مصوّر" : "Photo documentation", d: isRTL ? "صور وفيديو لكل تنفيذ." : "Photo/video for every execution." },
              { Icon: Truck, t: isRTL ? "تسليم لباب البيت" : "Doorstep delivery", d: isRTL ? "بكرامة وبدون انتظار طويل." : "Dignified — no long queues." },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <c.Icon className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
                <div>
                  <h3 className="text-sm font-extrabold text-primary">{c.t}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.d}</p>
                </div>
              </div>
            ))}
          </div>

         
        </div>
      </section>



      {/* Field proof gallery for Qurbani / food box programs */}
      {(program.slug === "odhya" || program.slug === "box") && (
        <FieldConvoysGallery
          variant={program.slug === "odhya" ? "qurbani" : "all"}
          donateHref={`/donate?program=${program.slug}`}
          galleryKey={program.slug === "odhya" ? "qurbani" : "programs"}
        />
      )}

      {/* Field cases of this program (live from the backend) */}
      {program.apiId && (
        <LinkedCasesSection filter={{ programId: program.apiId }} isRTL={isRTL}
          title={isRTL ? `حالات ضمن ${content.name}` : `Cases in ${content.name}`}
          subtitle={isRTL ? "اختار حالة بعينها، وتبرعك هيوصل لها هي وهتتابع تحديثاتها." : "Choose a specific case; your donation goes to it and you follow its updates."} />
      )}

      {/* FAQ */}
      <section
        id="faq"
        data-source={`program-${program.slug}-faq`}
        className="scroll-mt-24 bg-muted/30 py-14 md:py-20"
      >
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-black text-primary md:text-2xl">
              {isRTL ? "أسئلة شائعة" : "Frequently asked questions"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {isRTL ? "إجابات سريعة على أهم استفساراتك حول البرنامج." : "Quick answers to your common questions about this program."}
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition open:shadow-card"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-3 text-base font-extrabold text-primary">
                  <span className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                    {f.q}
                  </span>
                  <span className="ms-2 text-secondary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section
        id="related"
        data-source={`program-${program.slug}-related`}
        className="scroll-mt-24 bg-background py-14 md:py-20"
      >
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-xl font-black text-primary md:text-2xl">
              {isRTL ? "برامج أخرى قد تهمك" : "More programs you might like"}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/programs/${r.slug}`}
                data-source={`program-${program.slug}-related`}
                data-label={`related-${r.slug}`}
                className="group overflow-hidden rounded-3xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img decoding="async"
                    src={r.image}
                    alt={r[lang].name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-primary">{r[lang].name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r[lang].tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent">
                    {t.programs.learnMore} <Arrow className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bride trousseau campaign — only on the bride program page */}
      {program.slug === "bride" && <BrideTrousseau />}

      {/* Internal-link hub: related articles + geo pages + sibling programs (excluded on bride where BrideTrousseau is the concluding CTA) */}
      {program.slug !== "bride" && <RelatedContentLinks programSlug={program.slug} />}

      {/* Sticky donate CTA — title + description + buttons; auto-hides over header/footer/hero */}
      <StickyQurbaniCTA
        donateHref={`/donate?program=${program.slug}`}
        dismissKey={`program-${program.slug}-cta-dismissed`}
        ariaLabel={{ ar: `دعم ${content.name}`, en: `Support ${content.name}` }}
        title={{ ar: `ادعم ${content.name}`, en: `Support ${content.name}` }}
        description={{
          ar: content.tagline || "كل تبرع بيوصل لأسرة محتاجة في الدقهلية ومحافظات مصر.",
          en: content.tagline || "Every donation reaches a family in need across Egypt.",
        }}
        ctaLabel={{ ar: "تبرع الآن", en: "Donate now" }}
        waText={isRTL ? `السلام عليكم، عايز أعرف تفاصيل ${content.name}.` : `Hi, I'd like details on ${content.name}.`}
      />
    </PageLayout>
  );
};

export default ProgramDetail;
