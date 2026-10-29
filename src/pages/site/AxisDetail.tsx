import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Heart, CheckCircle2, Sparkles, Target, Users, FileText, SearchX } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DetailPageSkeleton, CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { axesApi, formatServerImageUrl } from "@/data/laravelApi";
import { fetchProgramRecords, programSlugOf } from "@/data/sources/programs";
import { image, isPublicRecord, num, pick, type ApiRecord } from "@/data/sources/_shared";
import iconFood from "@/assets/axis-food.jpg";
import iconHealth from "@/assets/axis-health.jpg";
import iconEdu from "@/assets/axis-education.jpg";

/** Used only when the axis has no image in the dashboard. */
const FALLBACK_IMAGES: Record<string, string> = { food: iconFood, health: iconHealth, education: iconEdu };

/** Case category whose cases belong to an axis, where its slug differs from the axis slug. */
const AXIS_CASE_CATEGORY: Record<string, string> = { health: "medical" };

/** Labels for the known `statistics` keys (dashboard → المحاور). Unknown keys show as written. */
const STAT_LABELS: Record<string, { ar: string; en: string }> = {
  students_supported: { ar: "طالب مكفول", en: "Sponsored students" },
  students_sponsored: { ar: "طالب مكفول", en: "Sponsored students" },
  beneficiary_families: { ar: "أسرة مستفيدة سنويًا", en: "Families helped / year" },
  fresh_meat_tons: { ar: "لحوم بلدي", en: "Fresh meat" },
  open_kitchen_days: { ar: "يوم مطبخ مفتوح", en: "Days of open kitchen" },
  treated_cases: { ar: "حالة طبية تم علاجها", en: "Treated medical cases" },
  medical_complexes: { ar: "مجمّع طبي", en: "Medical complex" },
  educational_centers: { ar: "مجمّع تعليمي", en: "Educational complex" },
  follow_up_months: { ar: "أشهر متابعة سنوية", en: "Months of follow-up" },
  school_kits: { ar: "حقيبة مدرسية", en: "School kits" },
};

type AxisProgram = { slug: string; ar: string; en: string; descAr: string; descEn: string; image?: string; priceFrom?: number };

/** Public programs of one axis (GET /programs, axis_id), in dashboard order. */
function axisPrograms(records: ApiRecord[], axisId: number): AxisProgram[] {
  return records
    .filter((r) => isPublicRecord(r) && num(r.axis_id ?? (r.axis as ApiRecord | undefined)?.id) === axisId)
    .sort((a, b) => (num(a.sort_order) ?? 0) - (num(b.sort_order) ?? 0))
    .map((r) => {
      const prices = (Array.isArray(r.donation_packages) ? (r.donation_packages as ApiRecord[]) : [])
        .filter((p) => p.is_active !== false)
        .map((p) => num(p.amount) ?? 0)
        .filter((n) => n > 0);
      const ar = pick(r.name_ar, r.name, r.title_ar) ?? "";
      return {
        slug: programSlugOf(r),
        ar,
        en: pick(r.name_en, r.title_en) ?? ar,
        descAr: pick(r.tagline_ar, r.description_ar, r.description) ?? "",
        descEn: pick(r.tagline_en, r.description_en) ?? "",
        image: image(r.image, r.hero_image),
        priceFrom: num(r.minimum_amount) || (prices.length ? Math.min(...prices) : undefined),
      };
    });
}

const AxisDetail = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const slug = (useParams<{ slug: string }>().slug || "").toLowerCase();

  const { data: axis, isLoading } = useQuery({
    queryKey: ["axis", slug],
    queryFn: () => axesApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const { data: programRecords, isLoading: programsLoading } = useQuery({
    queryKey: ["content-source", "programs-raw"],
    queryFn: fetchProgramRecords,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const programs = useMemo(
    () => (axis && programRecords ? axisPrograms(programRecords, axis.id) : []),
    [axis, programRecords],
  );

  if (isLoading) return <PageLayout><DetailPageSkeleton /></PageLayout>;

  if (!axis) {
    return (
      <PageLayout>
        <SEOHelmet title={isAR ? "المحور غير موجود | اليسر" : "Pillar not found | Al-Yusr"} description="" path={`/axes/${slug}`} />
        <Helmet><meta name="robots" content="noindex" /></Helmet>
        <section className="container mx-auto grid place-items-center px-4 py-24 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-black text-primary">{isAR ? "المحور ده مش موجود" : "This pillar was not found"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isAR ? "ممكن يكون الرابط اتغير. تقدر تتصفح برامجنا من هنا." : "The link may have changed. Browse our programs instead."}</p>
          <Button asChild className="mt-6"><Link to="/programs">{isAR ? "كل البرامج" : "All programs"}</Link></Button>
        </section>
      </PageLayout>
    );
  }

  const title = (isAR ? axis.name_ar : axis.name_en || axis.name_ar) || "";
  const fullTitle = isAR ? `محور ${title}` : `${title} pillar`;
  const tag = (isAR ? axis.badge_ar : axis.badge_en || axis.badge_ar) || "";
  const lede = (isAR ? axis.description_ar : axis.description_en || axis.description_ar) || "";
  const features = ((isAR ? axis.features_ar : axis.features_en?.length ? axis.features_en : axis.features_ar) || []).filter(Boolean);
  const stats = Object.entries(axis.statistics && typeof axis.statistics === "object" ? axis.statistics : {})
    .filter(([, v]) => v !== null && v !== "")
    .map(([key, value]) => ({ value: String(value), label: STAT_LABELS[key]?.[isAR ? "ar" : "en"] ?? key.replace(/_/g, " ") }));
  const axisImg = (axis.image && !axis.image.includes("elyusr-local-mock.internal") ? formatServerImageUrl(axis.image) : "") || FALLBACK_IMAGES[slug] || iconFood;
  const donateHref = `/donate?sector=sector-${slug}`;
  const caseCategory = AXIS_CASE_CATEGORY[slug] ?? slug;
  const crumbs = [
    { name: isAR ? "الرئيسية" : "Home", href: "/" },
    { name: isAR ? "محاور عملنا" : "Our pillars", href: "/#axes" },
    { name: fullTitle },
  ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isAR ? `${fullTitle} — ${tag || "مؤسسة اليسر الخيرية"} | اليسر` : `${fullTitle} — ${tag || "Al-Yusr Charity"} | Al-Yusr`}
        description={lede.slice(0, 155)}
        path={`/axes/${slug}`}
        image={axisImg}
      />
      <BreadcrumbSchema
        items={[
          { name: isAR ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: fullTitle, url: `https://elyusr.org/axes/${slug}` },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: fullTitle,
          alternateName: tag || undefined,
          description: lede,
          image: axisImg,
          url: `https://elyusr.org/axes/${slug}`,
          provider: { "@type": "NGO", name: isAR ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity", url: "https://elyusr.org/" },
          areaServed: { "@type": "AdministrativeArea", name: "Dakahlia, Egypt" },
          ...(programs.length
            ? {
                hasOfferCatalog: {
                  "@type": "OfferCatalog",
                  name: isAR ? "برامج المحور" : "Pillar programs",
                  itemListElement: programs.map((p, i) => ({
                    "@type": "Offer",
                    position: i + 1,
                    itemOffered: { "@type": "Service", name: isAR ? p.ar : p.en, url: `https://elyusr.org/programs/${p.slug}` },
                  })),
                },
              }
            : {}),
        })}</script>
      </Helmet>

      {/* Hero — same full-width style as the other listing pages */}
      <section className="relative flex min-h-[50vh] items-center overflow-hidden bg-primary sm:min-h-[55vh]">
        <div className="absolute inset-0">
          <img src={axisImg} alt="" aria-hidden className="h-full w-full object-cover opacity-45" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/65 to-primary/95" />
          <div className="pointer-events-none absolute -top-24 -start-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto max-w-[1440px] px-4 py-12 text-center sm:px-6 sm:py-20 lg:px-10">
          <div className="mb-5 flex justify-center text-white/80 [&_a]:text-white/80 [&_a:hover]:text-secondary">
            <Breadcrumbs items={crumbs} />
          </div>
          {tag && (
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black text-secondary backdrop-blur-xs">
              <Sparkles className="h-4 w-4" /> {tag}
            </span>
          )}
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">{fullTitle}</h1>
          {lede && <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/90 sm:mt-5 sm:text-base md:text-lg">{lede}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to={donateHref}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-secondary/25 transition-all hover:scale-[1.02] hover:bg-secondary/90 sm:text-base"
            >
              <Heart className="h-5 w-5" /> {isAR ? "تبرع لهذا المحور" : "Donate to this pillar"}
            </Link>
            <Link
              to={`/cases?cat=${caseCategory}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/20 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-black/30 sm:text-base"
            >
              {isAR ? "تصفح الحالات" : "Browse cases"} <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Impact (statistics from the dashboard) */}
      {stats.length > 0 && (
        <section className="border-b border-border/70 bg-card shadow-xs">
          <div className="container mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
            <div className={`grid grid-cols-2 gap-3 text-center ${stats.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl px-3 py-3">
                  <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-secondary sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What we deliver (features) */}
      {features.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAR ? "إيه اللي بنقدّمه في المحور ده؟" : "What we deliver"}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary/25 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold leading-6 text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Programs of this axis */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-primary md:text-3xl">{isAR ? "البرامج التابعة للمحور" : "Programs in this pillar"}</h2>
            <Link to="/programs" className="shrink-0 text-xs font-extrabold text-accent hover:underline">{isAR ? "كل البرامج" : "All programs"} <Arrow className="inline h-3 w-3" /></Link>
          </div>
          {programsLoading ? (
            <CardGridSkeleton count={3} className="mt-5" />
          ) : programs.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
              {isAR ? "مفيش برامج متاحة في المحور ده حاليًا — تقدر تتبرع للمحور مباشرة." : "No programs are open in this pillar right now — you can donate to the pillar directly."}
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p) => (
                <Link key={p.slug} to={`/programs/${p.slug}`} className="group overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  {p.image ? (
                    <img src={p.image} alt={isAR ? p.ar : p.en} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="grid aspect-[16/10] w-full place-items-center bg-secondary/15 text-primary"><Target className="h-8 w-8" /></div>
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-extrabold text-primary">{isAR ? p.ar : p.en}</h3>
                    {(isAR ? p.descAr : p.descEn) && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{isAR ? p.descAr : p.descEn}</p>}
                    <div className="mt-3 flex items-center justify-between text-xs font-extrabold">
                      {p.priceFrom ? <span className="text-muted-foreground">{isAR ? `يبدأ من ${p.priceFrom} ج.م` : `From ${p.priceFrom} EGP`}</span> : <span />}
                      <span className="inline-flex items-center gap-1 text-accent transition-all group-hover:gap-2">{isAR ? "افتح البرنامج" : "Open program"} <Arrow className="h-3 w-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Approved cases of this axis' case category (renders nothing when there are none) */}
      <LinkedCasesSection
        filter={{ categorySlug: caseCategory }}
        showOwner
        isRTL={isAR}
        title={isAR ? `حالات ضمن ${fullTitle}` : `Cases in the ${fullTitle}`}
        subtitle={isAR ? "اختار حالة بعينها، وتبرعك هيوصل لها هي وهتتابع تحديثاتها." : "Choose a specific case; your donation goes to it and you follow its updates."}
      />

      {/* FAQ of the category linked in the dashboard (axis → «الأسئلة الشائعة») */}
      {axis.faq_category?.slug && (
        <LocalFAQ categorySlug={axis.faq_category.slug} donateHref={`/donate?sector=sector-${slug}`} id={`axis-${slug}-faq`}
          title={isAR ? `أسئلة شائعة عن ${fullTitle}` : `${fullTitle} — FAQ`} />
      )}

      {/* CTA */}
      <section className="pattern-hero-luxe hero-pattern-fade py-10 text-primary-foreground md:py-14">
        <div className="container mx-auto max-w-6xl px-4 pb-10 text-center">
          <Users className="mx-auto h-8 w-8 opacity-80" />
          <h2 className="mt-3 text-2xl font-black md:text-3xl">{isAR ? `كن جزءًا من ${fullTitle}` : `Be part of the ${fullTitle}`}</h2>
          <p className="mt-2 text-sm text-primary-foreground/80">{isAR ? "تبرعك يصل إلى أهله موثّقًا بالصور والفيديو." : "Your donation reaches its recipients — documented with photos and video."}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to={donateHref}><Heart className="h-5 w-5" /> {isAR ? "تبرع الآن" : "Donate now"}</Link>
            </Button>
            <Button asChild size="lg" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/volunteer"><FileText className="h-5 w-5" /> {isAR ? "تطوع معنا" : "Volunteer"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AxisDetail;
