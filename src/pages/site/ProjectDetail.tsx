import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Heart, SearchX, Target, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DetailPageSkeleton } from "@/components/common/ContentSkeletons";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useProjectDetail } from "@/data/sources/projects";

/**
 * /projects/:slug — one development project, entirely from the backend record (dashboard → المشاريع):
 * hero, description, donation packages (each opens the donate form on that package), funding progress,
 * linked cases and the FAQ category linked to the project.
 */
const ProjectDetail = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const isAR = lang === "ar";
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const { project, isLoading, notFound } = useProjectDetail(slug);
  const fmt = (n: number) => n.toLocaleString(isAR ? "ar-EG" : "en-US");

  if (isLoading && !project) {
    return (
      <PageLayout>
        <DetailPageSkeleton />
      </PageLayout>
    );
  }

  if (notFound || !project) {
    return (
      <PageLayout>
        <SEOHelmet title={isAR ? "المشروع غير موجود | اليسر" : "Project not found | Al-Yusr"} description="" path={`/projects/${slug}`} />
        <Helmet><meta name="robots" content="noindex" /></Helmet>
        <section className="container mx-auto grid place-items-center px-4 py-24 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-black text-primary">{isAR ? "المشروع ده مش موجود" : "This project was not found"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{isAR ? "ممكن يكون الرابط اتغير. تقدر تتصفح مشاريعنا من هنا." : "The link may have changed. Browse our projects instead."}</p>
          <Button asChild className="mt-6"><Link to="/projects">{isAR ? "كل المشاريع" : "All projects"}</Link></Button>
        </section>
      </PageLayout>
    );
  }

  const name = isAR ? project.ar : project.en;
  const lede = isAR ? project.descAr : project.descEn || project.descAr;
  const body = project.description && project.description !== project.descAr ? project.description : "";
  const donateHref = `/donate?project=${encodeURIComponent(project.slug)}`;
  const pct = project.target > 0 ? Math.min(100, Math.round((project.collected / project.target) * 100)) : 0;
  const url = `https://elyusr.org/projects/${project.slug}`;
  const crumbs = [
    { name: isAR ? "الرئيسية" : "Home", href: "/" },
    { name: isAR ? "مشاريعنا" : "Our projects", href: "/projects" },
    { name },
  ];

  return (
    <PageLayout>
      <SEOHelmet
        title={isAR ? `${name} | مشاريع اليسر — صدقة جارية` : `${name} | Al-Yusr projects`}
        description={(lede || body).slice(0, 155)}
        path={`/projects/${project.slug}`}
        image={project.image}
      />
      <BreadcrumbSchema
        items={[
          { name: isAR ? "الرئيسية" : "Home", url: "https://elyusr.org/" },
          { name: isAR ? "مشاريعنا" : "Our projects", url: "https://elyusr.org/projects" },
          { name, url },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name,
          description: lede || body,
          image: project.image,
          url,
          provider: { "@type": "NGO", name: isAR ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
          areaServed: { "@type": "Country", name: "Egypt" },
          ...(project.packages.length
            ? {
                offers: project.packages.map((p) => ({
                  "@type": "Offer",
                  name: isAR ? p.nameAr : p.nameEn,
                  price: p.price,
                  priceCurrency: "EGP",
                  url: `https://elyusr.org${donateHref}${p.apiId ? `&package=${p.apiId}` : ""}`,
                })),
              }
            : {}),
        })}</script>
      </Helmet>

      {/* Hero — same full-width style as the other listing pages */}
      <section className="relative flex min-h-[50vh] items-center overflow-hidden bg-primary sm:min-h-[55vh]">
        <div className="absolute inset-0">
          <img src={project.image} alt="" aria-hidden className="h-full w-full object-cover opacity-45" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/65 to-primary/95" />
        </div>
        <div className="container relative z-10 mx-auto max-w-[1440px] px-4 py-12 text-center sm:px-6 sm:py-20 lg:px-10">
          <div className="mb-5 flex justify-center text-white/80 [&_a]:text-white/80 [&_a:hover]:text-secondary">
            <Breadcrumbs items={crumbs} />
          </div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/20 px-4 py-1.5 text-xs font-black text-secondary backdrop-blur-xs">
            <Sparkles className="h-4 w-4" /> {isAR ? "صدقة جارية" : "Ongoing charity"}
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">{name}</h1>
          {lede && <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/90 sm:mt-5 sm:text-base md:text-lg">{lede}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to={donateHref}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-secondary px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-secondary/25 transition-all hover:scale-[1.02] hover:bg-secondary/90 sm:text-base"
            >
              <Heart className="h-5 w-5" /> {isAR ? "تبرع للمشروع" : "Donate to this project"}
            </Link>
            {project.priceFrom > 0 && (
              <span className="rounded-2xl border border-white/25 bg-black/20 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-md">
                {isAR ? `الأسهم تبدأ من ${fmt(project.priceFrom)} ج.م` : `Shares from ${fmt(project.priceFrom)} EGP`}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Funding progress (only when the project has a target) */}
      {project.target > 0 && (
        <section className="border-b border-border/70 bg-card">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-1.5 text-primary"><Target className="h-4 w-4 text-secondary" /> {isAR ? "تم جمع" : "Raised"} {fmt(project.collected)} {isAR ? "ج.م" : "EGP"}</span>
              <span className="text-muted-foreground">{isAR ? "الهدف" : "Goal"} {fmt(project.target)} {isAR ? "ج.م" : "EGP"}</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>
      )}

      {/* About + packages */}
      <section className="container mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-2xl font-black text-primary sm:text-3xl">{isAR ? "عن المشروع" : "About the project"}</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-loose text-muted-foreground sm:text-base">{body || lede}</p>
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary sm:text-3xl">{isAR ? "اختار سهمك" : "Choose your share"}</h2>
            {project.packages.length ? (
              <ul className="mt-4 space-y-3">
                {project.packages.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`${donateHref}${p.apiId ? `&package=${p.apiId}` : ""}&amount=${p.price}`}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:border-secondary hover:bg-secondary/5"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-primary">{isAR ? p.nameAr : p.nameEn}</span>
                        {(isAR ? p.descAr : p.descEn) && <span className="block text-xs text-muted-foreground">{isAR ? p.descAr : p.descEn}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-sm font-black text-secondary-foreground">
                        <span className="rounded-full bg-secondary px-3 py-1 text-slate-950">{fmt(p.price)} {isAR ? "ج.م" : "EGP"}</span>
                        <Arrow className="h-4 w-4 text-muted-foreground transition group-hover:text-secondary" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">{isAR ? "تقدر تتبرع للمشروع بأي مبلغ." : "You can give any amount to this project."}</p>
                <Button asChild className="mt-4"><Link to={donateHref}>{isAR ? "تبرع الآن" : "Donate now"}</Link></Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cases linked to this project in the dashboard (renders nothing when there are none) */}
      <LinkedCasesSection
        filter={{ projectId: project.id }}
        isRTL={isAR}
        className="bg-muted/30"
        title={isAR ? `حالات ضمن ${name}` : `Cases in ${name}`}
        subtitle={isAR ? "اختار حالة بعينها، وتبرعك هيوصل لها هي وهتتابع تحديثاتها." : "Choose a specific case; your donation goes to it and you follow its updates."}
      />

      {/* FAQ category linked to the project (dashboard → المشروع → الأسئلة الشائعة) */}
      {project.faqCategorySlug && (
        <LocalFAQ categorySlug={project.faqCategorySlug} donateHref={donateHref} id={`project-${project.slug}-faq`}
          title={isAR ? `أسئلة شائعة عن ${name}` : `${name} — FAQ`} />
      )}
    </PageLayout>
  );
};

export default ProjectDetail;
