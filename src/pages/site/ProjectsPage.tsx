import { Link } from "react-router-dom";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Droplets,
  Home,
  Truck,
  Heart,
  Landmark,
  Leaf,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Award,
  Sparkles,
  PhoneCall,
  Compass,
  FileCheck2,
  Target,
  BookOpen,
  Stethoscope,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { useLang } from "@/i18n/LangContext";
import { useProjectCards, type ProjectCard } from "@/data/sources/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PROJECT_KINDS } from "@/components/campaigns/ProjectKind";

// ── Images ──
import heroImg from "@/assets/hands-sprout.jpg";
import nurseriesImg from "@/assets/program-education.jpg";
import { PROJECT_LANDINGS } from "@/data/projectLandings";

/** Look of a project card (icon + colours + optional landing page), by project slug. Text, image and
 *  prices come from the backend (dashboard → المشاريع); a project without an entry gets DEFAULT_THEME. */
interface ProjectTheme {
  icon: typeof Landmark;
  bgGradient: string;
  accentColor: string;
  landingUrl?: string;
  /** Donation link when the project has no backend record of its own. */
  donateUrl?: string;
  /** Card image while the backend project has no cover image. */
  fallbackImage?: string;
}

const DEFAULT_THEME: ProjectTheme = { icon: Building2, bgGradient: "from-slate-950 via-slate-950/85 to-transparent", accentColor: "#0f766e" };

const PROJECT_THEMES: Record<string, ProjectTheme> = {
  mosques: { icon: Landmark, bgGradient: "from-indigo-950 via-slate-950/85 to-transparent", accentColor: "#6366f1" },
  waqf: { icon: Leaf, bgGradient: "from-emerald-950 via-slate-950/85 to-transparent", accentColor: "#10b981", landingUrl: "/farm" },
  shelter: { icon: Home, bgGradient: "from-amber-950 via-slate-950/85 to-transparent", accentColor: "#f59e0b", landingUrl: "/setr" },
  water: { icon: Droplets, bgGradient: "from-sky-950 via-slate-950/85 to-transparent", accentColor: "#0284c7", landingUrl: "/water" },
  bride: { icon: Heart, bgGradient: "from-pink-950 via-slate-950/85 to-transparent", accentColor: "#ec4899" },
  medical: { icon: Stethoscope, bgGradient: "from-emerald-950 via-slate-950/85 to-transparent", accentColor: "#10b981", landingUrl: "/medical" },
  takrim: { icon: Truck, bgGradient: "from-slate-950 via-slate-950/85 to-transparent", accentColor: "#64748b", landingUrl: "/takrim" },
  nurseries: { icon: BookOpen, bgGradient: "from-emerald-950 via-slate-950/85 to-transparent", accentColor: "#0f766e", landingUrl: "/nurseries", fallbackImage: nurseriesImg },
};

type ProjectItem = ProjectCard & ProjectTheme;

/** The site's own photo stands in until a cover image is uploaded in the dashboard. */
const toItem = (p: ProjectCard): ProjectItem => {
  const theme = PROJECT_THEMES[p.slug] ?? DEFAULT_THEME;
  const noCover = !p.image || p.image === "/placeholder.svg";
  return { ...p, ...theme, image: noCover && theme.fallbackImage ? theme.fallbackImage : p.image };
};

/** Details: the campaign landing page when the project has one, else its own page. */
const detailsHref = (p: ProjectItem) => p.landingUrl ?? PROJECT_LANDINGS[p.slug] ?? `/projects/${p.slug}`;
const donateHref = (p: ProjectItem) => p.donateUrl ?? `/donate?project=${encodeURIComponent(p.slug)}`;

/**
 * Projects that have a landing page on the site but no record in the dashboard yet.
 * Shown after the backend projects, and only while the backend has no project with the same slug
 * (once it is created in المشاريع, the backend card replaces this one automatically).
 */
const CODE_PROJECTS: ProjectItem[] = [
  {
    id: 0, slug: "nurseries", ar: "حضانات اليسر ودور تحفيظ القرآن", en: "Al-Yusr nurseries & Qur'an houses",
    descAr: "حضانات تعليمية للأطفال من ٤ لـ ٦ سنين، ودور تحفيظ قرآن من ٤ لـ ١٦ سنة، بمناهج متخصصة بنبنيها ونشرف عليها، ومسابقات قرآن.",
    descEn: "Learning nurseries for ages 4–6 and Qur'an houses for ages 4–16, with curricula we build and supervise, and Qur'an competitions.",
    image: nurseriesImg, priceFrom: 0, sharesCount: 0, casesCount: 0,
    icon: BookOpen, bgGradient: "from-emerald-950 via-slate-950/85 to-transparent", accentColor: "#0f766e",
    landingUrl: "/nurseries", donateUrl: "/donate?type=project",
  },
];

const pct = (raised: number, target: number) => Math.min(100, Math.round((raised / (target || 1)) * 100));

function ProjectsGridSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-[380px] sm:h-[420px] w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[460px] w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */

const ProjectsPage = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;

  const { projects: cards, isLoading } = useProjectCards();
  const backendSlugs = new Set(cards.map((c) => c.slug));
  const PROJECTS = [...cards.map(toItem), ...(cards.length ? CODE_PROJECTS.filter((p) => !backendSlugs.has(p.slug)) : [])];
  const totalShares = cards.reduce((n, p) => n + p.sharesCount, 0);

  const waMsg = encodeURIComponent(
    isAR
      ? "السلام عليكم، أرغب في الاستفسار عن كفالة ومشاريع مؤسسة اليسر التنموية."
      : "Hello, I'd like to learn about Al-Yusr development projects."
  );

  const waSponsorMsg = encodeURIComponent(
    isAR
      ? "السلام عليكم، أرغب في الاستفسار عن كفالة ورعاية مشروع كامل (مسجد / مياه / أسقف) باسم العائلة."
      : "Hello, I am interested in fully sponsoring a major project."
  );

  return (
    <PageLayout>
      <SEOHelmet
        title={
          isAR
            ? "مشاريع اليسر | مساجد، وقف، سقيا ماء، غسل وتكفين ونقل موتى، حضانات وتحفيظ قرآن"
            : "Al-Yusr Development Projects | Mosques, Waqf, Water, Shelter, Marriage Aid"
        }
        description={
          isAR
            ? "مشاريع مؤسسة اليسر: بناء المساجد، المزرعة الوقفية، سقيا الماء، غسل وتكفين ونقل الموتى في المنصورة، حضانات اليسر ودور تحفيظ القرآن، تسقيف المنازل وتيسير الزواج."
            : "Al-Yusr development projects: mosque construction, Waqf farm, clean water, home roofing, marriage aid, and mortuary vans."
        }
        path="/projects"
      />
      <SiteSchemas />
      <BreadcrumbSchema
        items={[
          { name: isAR ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: isAR ? "مشاريعنا" : "Our Projects", url: "https://elyusr.org/projects" },
        ]}
      />

      {/* ══════════ HERO (Wide container & clear visible background image) ══════════ */}
      <section className="relative overflow-hidden bg-primary min-h-[50vh] sm:min-h-[55vh] flex items-center">
        {/* Background Image with increased visibility as requested */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-60"
          />
          {/* Subtle balanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/95" />
          <div className="absolute -top-24 -start-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black text-secondary mb-5 shadow-xs backdrop-blur-xs">
            <Building2 className="h-4 w-4" />
            {isAR ? "أصول بتفضل تنتج خير" : "Assets that keep producing good"}
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            {isAR ? "مشاريعنا التنموية المستدامة" : "Our Sustainable Projects"}
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-xs">
            {isAR
              ? "هدفنا إن الخير ما يخلصش بانتهاء التبرع. كل مشروع أصل بيفضل يشتغل سنين: يا إما بيدخّل موارد بتتصرف على أنشطة المؤسسة، يا إما بيسيب أثر بيغيّر حياة الناس، وفي الحالتين أجره صدقة جارية ليك ما دام قايم."
              : "Our aim is good that does not end when the donation does. Each project is an asset that keeps working for years: it either earns income for the foundation's work or leaves an impact that changes lives, and either way its reward is ongoing charity for you."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5 justify-center items-center">
            <Link
              to="/donate?type=project"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-7 py-3.5 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/25 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAR ? "تبرع لمشروع بالأسهم" : "Donate to a Project"}
              <Arrow className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/201097000137?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/20 backdrop-blur-md px-6 py-3.5 text-sm sm:text-base font-bold text-white transition hover:bg-black/30 hover:border-white/40"
            >
              <PhoneCall className="h-4 w-4 text-secondary" />
              {isAR ? "استفسار هاتفي / واتساب" : "WhatsApp Inquiry"}
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ Stats Strip (Expanded max-w-[1440px]) ══════════ */}
      <section className="bg-card border-b border-border/70 shadow-xs">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 text-center">
            {[
              { num: isLoading ? "…" : `${PROJECTS.length}`, labelAr: "مشاريع تنموية كبرى", labelEn: "Active Mega Projects" },
              { num: isLoading ? "…" : `${totalShares}`, labelAr: "سهم مالي متاح", labelEn: "Available Shares" },
              { num: "١٢،٥٠٠+", labelAr: "مستفيد مباشر بالقرى", labelEn: "Direct Rural Beneficiaries" },
              { num: "١٠٠٪", labelAr: "توثيق ميداني معتمد", labelEn: "Documented Impact" },
            ].map((s, idx) => {
              // Perfect '+' cross on mobile (2x2) and vertical dividers on desktop (1x4)
              const borderCls =
                idx === 0
                  ? "border-b border-e border-border/60 md:border-b-0 md:border-e"
                  : idx === 1
                  ? "border-b border-border/60 md:border-b-0 md:border-e"
                  : idx === 2
                  ? "border-e border-border/60 md:border-e"
                  : "md:border-none";

              return (
                <div key={idx} className={`px-3 py-3.5 sm:py-2.5 flex flex-col justify-center items-center ${borderCls}`}>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-secondary tracking-tight">
                    {s.num}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    {isAR ? s.labelAr : s.labelEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Projects Layout: Featured Large Card + Clean Full-Image Grid ══════════ */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12 text-center md:text-start">
            <div className="flex flex-col items-center md:items-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-950 text-secondary px-3.5 py-1 text-xs font-black shadow-xs mb-3">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                {isAR ? "صدقات جارية تدوم" : "Lasting Ongoing Charities"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-primary leading-tight">
                {isAR ? "مشاريعنا التنموية الجارية" : "Our Ongoing Development Projects"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed mx-auto md:mx-0">
              {isAR
                ? "اختر مشروعك وابدأ مساهمتك بأي مبلغ أو بسهم محدد كصدقة جارية لك أو لوالديك."
                : "Choose your project and contribute with any amount or share as an enduring charity."}
            </p>
          </div>

          {/* ── 1. Featured project: photo and content side by side, photo fully visible ── */}
          {isLoading && PROJECTS.length === 0 && <ProjectsGridSkeleton />}
          {PROJECTS.length > 0 && (() => {
            const proj = PROJECTS[0];
            const activeCase = proj.firstCase;
            const Icon = proj.icon;

            return (
              <ScrollReveal>
                <article className="group mb-8 grid overflow-hidden rounded-[2rem] border border-border/70 bg-primary text-primary-foreground shadow-card transition-shadow duration-500 hover:shadow-2xl sm:mb-10 lg:grid-cols-2">
                  <Link to={detailsHref(proj)} className="relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[440px]" aria-label={isAR ? `تفاصيل ${proj.ar}` : `${proj.en} details`}>
                    <img
                      src={proj.image}
                      alt={isAR ? proj.ar : proj.en}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="eager"
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-black text-slate-950 shadow-md">
                      <Sparkles className="h-3.5 w-3.5" /> {isAR ? "المشروع الرائد لهذا الشهر" : "Featured this month"}
                    </span>
                    {proj.priceFrom > 0 && (
                      <span className="absolute bottom-4 start-4 rounded-full bg-black/55 px-3.5 py-1.5 text-xs font-black text-white backdrop-blur-md">
                        {isAR ? `الأسهم تبدأ من ${proj.priceFrom} ج.م` : `Shares from ${proj.priceFrom} EGP`}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1 text-xs font-black text-secondary">
                      <Icon className="h-3.5 w-3.5" /> {isAR ? "صدقة جارية" : "Ongoing charity"}
                    </span>
                    <div>
                      <h3 className="text-2xl font-black leading-tight sm:text-4xl">{isAR ? proj.ar : proj.en}</h3>
                      <p className="mt-3 text-sm leading-loose text-primary-foreground/85 sm:text-base">{isAR ? proj.descAr : proj.descEn}</p>
                    </div>

                    {activeCase && (
                      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-amber-300">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                            {isAR ? "حالة ميدانية نشطة" : "Active field case"}
                          </span>
                          <span className="text-[11px] text-white/70">{[activeCase.city, activeCase.governorate].filter(Boolean).join(" · ")}</span>
                        </div>
                        <p className="mb-2.5 line-clamp-1 text-sm font-semibold">{isAR ? activeCase.titleAr : activeCase.titleEn}</p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${pct(activeCase.raised, activeCase.target)}%` }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-white/70">
                          <span>
                            {isAR
                              ? `تم جمع ${activeCase.raised.toLocaleString()} من ${activeCase.target.toLocaleString()} ج.م`
                              : `Collected ${activeCase.raised.toLocaleString()} of ${activeCase.target.toLocaleString()} EGP`}
                          </span>
                          <span className="font-black text-secondary">{pct(activeCase.raised, activeCase.target)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-primary-foreground/80">
                      <span className="flex items-center gap-1"><Target className="h-4 w-4 text-secondary" />{proj.sharesCount} {isAR ? "أسهم تبرع متاحة" : "shares available"}</span>
                      {proj.casesCount > 0 && <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-rose-300" />{proj.casesCount} {isAR ? "حالات مرتبطة" : "linked cases"}</span>}
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Link
                        to={donateHref(proj)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-7 py-3 text-sm font-black text-slate-950 shadow-lg shadow-secondary/25 transition-all hover:scale-[1.02] hover:bg-secondary/90 active:scale-[0.98]"
                      >
                        {isAR ? "تبرع الآن" : "Donate now"} <Arrow className="h-4 w-4" />
                      </Link>
                      <Link
                        to={detailsHref(proj)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold transition hover:bg-white/20"
                      >
                        <ExternalLink className="h-4 w-4 text-secondary" /> {isAR ? "تفاصيل المشروع" : "Project details"}
                      </Link>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })()}

          {/* ── 2. The other projects: photo on top, readable content below ── */}
          <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.slice(1).map((proj, i) => {
              const Icon = proj.icon;
              return (
                <ScrollReveal key={proj.slug}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card">
                    <Link to={detailsHref(proj)} className="relative block aspect-[16/10] overflow-hidden" aria-label={isAR ? `تفاصيل ${proj.ar}` : `${proj.en} details`}>
                      <img
                        src={proj.image}
                        alt={isAR ? proj.ar : proj.en}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      {proj.priceFrom > 0 && (
                        <span className="absolute end-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-black text-slate-950 shadow-md">
                          {isAR ? `من ${proj.priceFrom} ج.م` : `From ${proj.priceFrom} EGP`}
                        </span>
                      )}
                      <span
                        className="absolute bottom-3 start-3 grid h-10 w-10 place-items-center rounded-xl text-white shadow-lg ring-2 ring-white/70"
                        style={{ backgroundColor: proj.accentColor }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-black text-secondary">{isAR ? "صدقة جارية" : "Ongoing charity"}</p>
                      <h3 className="mt-1 text-lg font-black leading-snug text-primary sm:text-xl">
                        <Link to={detailsHref(proj)} className="transition-colors hover:text-secondary">{isAR ? proj.ar : proj.en}</Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{isAR ? proj.descAr : proj.descEn}</p>
                      {(proj.sharesCount > 0 || proj.casesCount > 0) && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                          {proj.sharesCount > 0 && <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-secondary" />{proj.sharesCount} {isAR ? "أسهم" : "shares"}</span>}
                          {proj.casesCount > 0 && <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-rose-500" />{proj.casesCount} {isAR ? "حالات" : "cases"}</span>}
                        </div>
                      )}
                      <div className="mt-auto flex items-center gap-2.5 pt-5">
                        <Link
                          to={donateHref(proj)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
                        >
                          {isAR ? "تبرع الآن" : "Donate now"} <Arrow className="h-4 w-4" />
                        </Link>
                        <Link
                          to={detailsHref(proj)}
                          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-primary transition hover:border-secondary hover:bg-secondary/10"
                        >
                          {isAR ? "التفاصيل" : "Details"}
                        </Link>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Two kinds of projects + featured project landings ══════════ */}
      <section id="project-kinds" className="scroll-mt-24 border-t border-border/60 bg-background py-12 sm:py-16">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-black leading-tight text-primary sm:text-4xl">
              {isAR ? "مشاريعنا نوعين، والاتنين خير مستمر" : "Two kinds of projects, both lasting good"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {isAR
                ? "فيه مشاريع خدمية بتدخّل موارد بتتصرف على أنشطة المؤسسة، وفيه مشاريع هدفها الأثر في المجتمع. وأحيانًا المشروع الواحد بيجمع الاتنين."
                : "Some projects provide services whose income funds the foundation's work; others exist for their impact on the community. Some do both."}
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {(["service", "impact"] as const).map((k) => {
              const kind = PROJECT_KINDS[k];
              const KIcon = kind.icon;
              return (
                <div key={k} className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><KIcon className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-black text-primary sm:text-xl">{isAR ? kind.ar : kind.en}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isAR ? kind.descAr : kind.descEn}</p>
                  <p className="mt-3 text-xs font-bold text-secondary">{isAR ? kind.examplesAr : kind.examplesEn}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/takrim", icon: Truck, ar: "تكريم الإنسان", en: "Takrim", subAr: "غسل وتكفين ونقل الموتى في المنصورة، والقاهرة قريبًا", subEn: "Funeral washing, shrouding and transport in Mansoura, Cairo next" },
              { href: "/water", icon: Droplets, ar: "سقيا الماء", en: "Clean water", subAr: "افتح الحنفية وشوف إزاي المية النظيفة بتغيّر حياة بيت", subEn: "Open the tap and see how clean water changes a home" },
              { href: "/nurseries", icon: BookOpen, ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses", subAr: "حضانات من ٤ لـ ٦ سنين ودور تحفيظ من ٤ لـ ١٦ سنة", subEn: "Nurseries for ages 4–6, Qur'an houses for ages 4–16" },
              { href: "/medical", icon: Stethoscope, ar: "المساعدات الطبية", en: "Medical aid", subAr: "روشتات وعمليات وأشعة وتحاليل وأطراف صناعية", subEn: "Prescriptions, surgery, scans, tests and prosthetics" },
            ].map((l) => {
              const LIcon = l.icon;
              return (
                <Link key={l.href} to={l.href} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 transition hover:border-secondary/60 hover:bg-secondary/10">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-slate-950"><LIcon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-primary group-hover:text-secondary">{isAR ? l.ar : l.en}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{isAR ? l.subAr : l.subEn}</span>
                  </span>
                  <Arrow className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-secondary" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ Why Projects (Balanced 2-Column + Full-Width Bottom CTA Across Both Columns) ══════════ */}
      <section className="py-8 sm:py-12 bg-muted/30 border-t border-border/60">
        <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          {/* Top Row: Balanced 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-8 sm:mb-10">
            {/* RIGHT COLUMN (In RTL: lg:col-span-7 contains Why intro + 3 Pillars + 4 Guarantees) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              {/* Header: Centered on mobile, aligned on desktop, with high-contrast emerald badge */}
              <div className="text-center lg:text-start">
                <div className="flex justify-center lg:justify-start mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-emerald-800/10 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-xs">
                    <Landmark className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    {isAR ? "أثر دائم يمتد لعقود" : "Sustainable Generational Impact"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary leading-tight mb-3">
                  {isAR ? "لماذا المشاريع التنموية في مؤسسة اليسر؟" : "Why Development Projects with Al-Yusr?"}
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {isAR
                    ? "على عكس المساعدات الآنية، تبني المشاريع التنموية أصولاً وبنى تحتية تنفع القرى والمجتمعات لعقود طويلة. مسجد يُعمَّر، وبئر ارتوازي يسقي الآلاف، وسقف صلب يحمي عائلات من قسوة الشتاء، ومزرعة تدر عائداً سنوياً مستداماً للفقراء."
                    : "Unlike temporary relief, development projects build permanent infrastructure serving communities for decades. A mosque remains, a deep well quenches thousands, a sturdy roof protects families, and an endowment farm feeds orphans sustainably."}
                </p>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  {
                    icon: Building2,
                    titleAr: "بنية تحتية دائمة",
                    titleEn: "Lasting Infrastructure",
                    descAr: "عقوداً من الأثر المتواصل في حياة القرى",
                    descEn: "Decades of uninterrupted community benefit",
                  },
                  {
                    icon: ShieldCheck,
                    titleAr: "هدف مالي وشفاف",
                    titleEn: "Transparent Tracking",
                    descAr: "تتبّع تقدم التنفيذ برقم الحالة والقرية",
                    descEn: "Track real progress with case ref & location",
                  },
                  {
                    icon: Leaf,
                    titleAr: "صدقة جارية ممتدة",
                    titleEn: "Ongoing Charity",
                    descAr: "أجر مستمر في حياتك وبعد الممات",
                    descEn: "Continuous reward during and after life",
                  },
                ].map((f) => {
                  const FIcon = f.icon;
                  return (
                    <div
                      key={f.titleEn}
                      className="rounded-2xl border border-border/80 bg-card p-4 text-center sm:text-start shadow-xs transition hover:border-secondary/40"
                    >
                      <div className="h-9 w-9 rounded-xl bg-secondary/15 grid place-items-center mb-2.5 mx-auto sm:mx-0">
                        <FIcon className="h-4.5 w-4.5 text-secondary" />
                      </div>
                      <p className="text-xs sm:text-sm font-black text-primary">{isAR ? f.titleAr : f.titleEn}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {isAR ? f.descAr : f.descEn}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ── ميثاق التوثيق والضمانات التنفيذية (4 ركائز موثقة) ── */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-black text-primary">
                    {isAR ? "ميثاق التوثيق والشفافية لمشاريعنا:" : "Transparency & Field Execution Charter:"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      icon: Camera,
                      titleAr: "توثيق مصور وفيديو",
                      titleEn: "Photo & Video Reports",
                      descAr: "إرسال تقرير فوتوغرافي لمراحل الحفر أو البناء أو التشطيب حتى التسليم للمستفيدين.",
                      descEn: "Detailed photo/video milestones sent upon project completion.",
                    },
                    {
                      icon: FileCheck2,
                      titleAr: "إشراف هندسي وتنفيذي مباشر",
                      titleEn: "Direct Engineering Oversight",
                      descAr: "تنفيذ رسمي خاضع لمعايير هندسية متينة بدون وسطاء تجاريين لضمان بقاء الأثر.",
                      descEn: "Licensed execution ensuring structural longevity with zero intermediaries.",
                    },
                    {
                      icon: Award,
                      titleAr: "شهادة سهم وقفية موثقة",
                      titleEn: "Endowment Share Certificate",
                      descAr: "إصدار شهادة مساهمة رقمية أو مطبوعة باسمك أو إهداءً لوالديك كصدقة جارية مباركة.",
                      descEn: "Digital or printed certificate in your name or dedicated to loved ones.",
                    },
                    {
                      icon: Compass,
                      titleAr: "ربط بحالات وقرى محددة",
                      titleEn: "Linked to Real Locations",
                      descAr: "كل سهم يوجه لحالة وقرية بعينها يمكنك معرفة تفاصيلها وموقعها الميداني بالدقهلية.",
                      descEn: "Every share is assigned to a specific verified village or family.",
                    },
                  ].map((p, idx) => {
                    const PIcon = p.icon;
                    return (
                      <div key={idx} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 border border-border/50 text-start">
                        <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0 text-primary mt-0.5">
                          <PIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-black text-primary">{isAR ? p.titleAr : p.titleEn}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {isAR ? p.descAr : p.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: Quick Project Picker Strip (Aligned in height with right column) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 space-y-3.5 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                    <p className="text-sm font-black text-primary">
                      {isAR ? "اختر مشروعك وابدأ فوراً:" : "Choose a Project to Support:"}
                    </p>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {PROJECTS.length} {isAR ? "مشاريع نشطة" : "Active"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {PROJECTS.map((proj) => {
                      const Icon = proj.icon;
                      return (
                        <Link
                          key={proj.slug}
                          to={donateHref(proj)}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3.5 py-3 hover:border-secondary/60 hover:bg-secondary/10 transition-all group"
                        >
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: proj.accentColor }}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1 text-start">
                            <p className="text-xs sm:text-sm font-black text-primary truncate group-hover:text-secondary transition-colors">
                              {isAR ? proj.ar : proj.en}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {proj.priceFrom > 0 ? (isAR ? `يبدأ من ${proj.priceFrom} ج.م` : `Starts at ${proj.priceFrom} EGP`) : (isAR ? "تبرع بأي مبلغ" : "Any amount")}
                              {proj.sharesCount ? ` · ${proj.sharesCount} ${isAR ? "أسهم متاحة" : "shares"}` : ""}
                            </p>
                          </div>
                          <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px] transition-all shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Trust Seal at bottom of list */}
                <div className="pt-3 border-t border-border/60 text-center">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {isAR
                      ? "جميع التبرعات مقيدة ومعتمدة بوزارة التضامن الاجتماعي"
                      : "Official licensed charity under the Ministry of Social Solidarity"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── FULL-WIDTH BOTTOM ROW: Grand Project Sponsorship (Centered on mobile, aligned on desktop) ── */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-primary to-slate-950 p-6 sm:p-8 md:p-10 text-white border border-secondary/30 shadow-xl">
              <div className="absolute top-0 end-0 -mt-10 -me-10 h-52 w-52 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

              {/* Flex container: Centered on mobile, aligned on desktop */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-3xl text-center md:text-start flex flex-col items-center md:items-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 border border-secondary/40 px-3.5 py-1 text-xs font-black text-secondary shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isAR ? "كفالة كاملة لمشروع" : "Full Project Sponsorship"}
                  </span>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
                    {isAR ? "ترغب في كفالة مشروع كامل باسمك أو باسم عائلتك؟" : "Want to sponsor a complete project?"}
                  </h4>
                  <p className="text-xs sm:text-sm md:text-base text-white/85 leading-relaxed max-w-2xl">
                    {isAR
                      ? "بناء مسجد بالكامل، محطة تنقية مياه قروية، أو مجمع تسقيف متكامل باسمك أو صدقة جارية لروح فقيد، مع لوحة تذكارية رسمية باسم الواقف وتقارير تنفيذ دورية موثقة بالفيديو."
                      : "Sponsor a full mosque, water plant, or village roofing cluster with dedicated plaque and verified milestone reports."}
                  </p>
                </div>

                {/* Button: Centered on mobile, aligned on desktop */}
                <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 flex justify-center md:justify-end">
                  <a
                    href={`https://wa.me/201097000137?text=${waSponsorMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-secondary px-8 py-4 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/30 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PhoneCall className="h-4.5 w-4.5" />
                    {isAR ? "استشارة مسؤول كبار المشروعات" : "Contact Major Projects"}
                  </a>
                </div>
              </div>
            </div>

            {/* ── HADITH REFLECTION BANNER (Premium · minimal · elegant) ── */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-700/20 bg-card dark:bg-slate-900/70">
              {/* Top shimmer */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              {/* Vertical accent bar */}
              <div className="absolute top-5 bottom-5 end-0 w-[3px] rounded-full bg-gradient-to-b from-emerald-400/80 via-emerald-600/40 to-transparent" />

              <div className="px-7 sm:px-12 py-5 sm:py-6 text-center">
                <p className="text-[10.5px] tracking-[0.18em] font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                  {isAR ? "قال رسول الله ﷺ" : "The Prophet ﷺ Said"}
                </p>

                <blockquote>
                  <p className="text-base sm:text-lg font-bold text-primary dark:text-emerald-100 leading-loose font-serif max-w-2xl mx-auto">
                    {isAR
                      ? "«إِذَا مَاتَ الإنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ: صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ»"
                      : '"All deeds cease at death except three: ongoing charity, beneficial knowledge, or a righteous child who prays for them."'}
                  </p>
                </blockquote>

                <p className="text-[11px] text-muted-foreground/70 mt-2.5 font-medium tracking-wide">
                  {isAR ? "— رواه مسلم" : "— Sahih Muslim"}
                </p>
              </div>

              {/* Bottom shimmer */}
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA (Expanded max-w-[1440px]) ══════════ */}
      {/* Cases that belong to our projects (live from the backend) */}
      <LinkedCasesSection filter={{ linkedTo: "project" }} showOwner variant="carousel" filterByOwner limit={30} isRTL={isAR} className="bg-muted/30"
        title={isAR ? "حالات ميدانية ضمن مشاريعنا" : "Field cases in our projects"}
        subtitle={isAR ? "كل حالة اتعمل لها بحث ميداني، وتبرعك ليها بيروح لنفس المشروع." : "Every case is field-verified; your donation goes to the same project."} />

      <section className="pt-10 sm:pt-14 pb-16 sm:pb-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_60%_50%,theme(colors.secondary.DEFAULT)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 container mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-3.5 py-1 text-xs font-black text-secondary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {isAR ? "خطوتك الأولى في الصدقة الجارية" : "Your First Step in Perpetual Giving"}
          </span>

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
            {isAR ? "اختر مشروعك الآن وابدأ أثراً لا ينقطع" : "Choose Your Project & Begin Your Everlasting Impact"}
          </h2>

          <p className="text-sm sm:text-base text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            {isAR
              ? "يمكنك التبرع لعدة مشاريع بأسهم متنوعة في معاملة تبرع واحدة عبر فيزا، ميزة، فودافون كاش، محافظ الهاتف، أو المندوب الميداني حتى باب منزلك."
              : "Donate to multiple projects with various shares in one checkout using Visa, Meeza, mobile wallets, or our home representative."}
          </p>

          <div className="flex flex-wrap gap-3.5 justify-center items-center">
            <Link
              to="/donate?type=project"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-8 py-3.5 text-sm sm:text-base font-black text-slate-950 shadow-xl shadow-secondary/30 transition-all hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAR ? "انتقل لصفحة التبرع" : "Go to Donation Page"}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-7 py-3.5 text-sm sm:text-base font-bold text-white transition hover:bg-white/15 hover:border-white/40"
            >
              <ExternalLink className="h-4 w-4 text-secondary" />
              {isAR ? "استعرض الحالات الميدانية" : "View Field Cases"}
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProjectsPage;
