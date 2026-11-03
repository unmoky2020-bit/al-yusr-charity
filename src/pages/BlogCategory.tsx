import { useParams, Link, Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Calendar, Tag, ArrowLeft, ArrowRight, Clock, ArrowUpDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useBlogPosts } from "@/data/sources/blog";
import { CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { axes, axisOfPost, getAxis, readingTime, type AxisSlug } from "@/data/blogTaxonomy";
import { TagsRail } from "@/components/common/TagsRail";

const PAGE_SIZE = 9;

const BlogCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const validSlugs = axes.map((a) => a.slug);
  if (!slug || !validSlugs.includes(slug as AxisSlug)) return <Navigate to="/blog" replace />;
  // key resets page/sort state when moving between categories
  return <BlogCategoryView key={slug} slug={slug} />;
};

const BlogCategoryView = ({ slug }: { slug: string }) => {
  const { lang, t } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const axis = getAxis(slug as AxisSlug);

  const baseUrl = "https://elyusr.org";
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const { posts: allBlogPosts, loading: postsLoading } = useBlogPosts();
  const allPosts = useMemo(
    () => allBlogPosts.filter((p) => axisOfPost(p) === slug),
    [allBlogPosts, slug],
  );
  const sorted = useMemo(
    () => [...allPosts].sort((a, b) => sort === "newest" ? (a.date < b.date ? 1 : -1) : (a.date > b.date ? 1 : -1)),
    [allPosts, sort],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const posts = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const meta = axis[lang];
  const localTitle = isRTL
    ? `${meta.name} — مقالات اليسر بالمنصورة`
    : `${meta.name} — Al-Yusr Blog, Mansoura`;
  const localDesc = isRTL
    ? `${meta.description} مقالات موثّقة من قرى الدقهلية مع صور وفيديو من الميدان وفريق اليسر بالمنصورة.`
    : `${meta.description} Verified articles from Dakahlia villages with field photos & videos by Al-Yusr Mansoura.`;

  return (
    <PageLayout>
      <SEOHelmet
        title={localTitle}
        description={localDesc}
        path={`/blog/category/${slug}`}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: t.nav.home, url: `${baseUrl}/` },
        { name: isRTL ? "المدونة" : "Blog", url: `${baseUrl}/blog` },
        { name: isRTL ? "تصنيفات" : "Categories", url: `${baseUrl}/blog#categories` },
        { name: meta.name, url: `${baseUrl}/blog/category/${slug}` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-primary-foreground/85">
            <Breadcrumbs items={[
              { name: t.nav.home, href: "/" },
              { name: isRTL ? "المدونة" : "Blog", href: "/blog" },
              { name: isRTL ? "تصنيفات" : "Categories", href: "/blog#categories" },
              { name: meta.name },
            ]} />
          </div>
          <h1 className="mt-5 text-2xl font-black md:text-4xl">
            {isRTL ? `كل مقالات: ${meta.name}` : `All articles: ${meta.name}`}
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85">{meta.description}</p>
          <div className="mt-3 text-xs font-bold text-secondary">
            {isRTL ? `${sorted.length} مقالة · المنصورة - الدقهلية` : `${sorted.length} articles · Mansoura - Dakahlia`}
          </div>
        </div>
      </section>

      {/* Other categories chips */}
      <section className="border-y border-border bg-muted/40 py-4">
        <div className="container mx-auto px-4">
          <TagsRail
            source="blog-category-nav"
            activeId={slug}
            ariaLabel={isRTL ? "تصنيفات المدونة" : "Blog categories"}
            items={axes.map((a) => ({
              id: a.slug,
              label: a[lang].name,
              to: `/blog/category/${a.slug}`,
            }))}
          />
        </div>
      </section>

      <section className="pattern-programs pt-14 pb-28 sm:pb-36 md:pt-20 md:pb-44">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {sorted.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-muted-foreground">
                {isRTL ? `صفحة ${safePage} من ${totalPages}` : `Page ${safePage} of ${totalPages}`}
              </div>
              <button
                onClick={() => { setSort((s) => (s === "newest" ? "oldest" : "newest")); setPage(1); }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-foreground hover:border-secondary"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sort === "newest"
                  ? (isRTL ? "الأحدث أولًا" : "Newest first")
                  : (isRTL ? "الأقدم أولًا" : "Oldest first")}
              </button>
            </div>
          )}
          {postsLoading ? (
            <CardGridSkeleton count={6} />
          ) : posts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              {isRTL ? "مفيش مقالات في هذا التصنيف بعد. تابعنا قريبًا." : "No articles in this category yet. Stay tuned."}
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => {
                const c = p[lang];
                const rt = readingTime(p, lang);
                return (
                  <article key={p.slug} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-1 hover:border-secondary/50 hover:shadow-card">
                    <Link to={`/blog/${p.slug}`} className="flex h-full flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={p.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-soft backdrop-blur">
                          <Tag className="h-3 w-3 text-accent" />{p.category[lang]}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3 text-accent" /><time>{p.date}</time></span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-accent" />{isRTL ? `${rt.minutes} دقيقة` : `${rt.minutes} min`}</span>
                        </div>
                        <h2 className="mt-3 text-base font-black leading-[1.45] text-primary transition-colors group-hover:text-accent line-clamp-3 py-0.5 md:text-lg">{c.title}</h2>
                        <p className="mt-2 line-clamp-2 text-xs leading-[1.6] text-muted-foreground md:text-sm">{c.excerpt}</p>
                        <div className="mt-auto flex items-center justify-end pt-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-accent transition group-hover:gap-2.5">
                            {isRTL ? "اقرأ المقال" : "Read article"} <Arrow className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
              aria-label={isRTL ? "تصفّح الصفحات" : "Pagination"}
            >
              <button
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-secondary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <Arrow className="h-3.5 w-3.5 rotate-180" />
                <span className="hidden sm:inline">{isRTL ? "السابق" : "Prev"}</span>
              </button>
              {(() => {
                const pages: (number | "…")[] = [];
                const add = (n: number | "…") => pages.push(n);
                const last = totalPages;
                const cur = safePage;
                const window = 1; // pages on each side of current
                add(1);
                if (cur - window > 2) add("…");
                for (let n = Math.max(2, cur - window); n <= Math.min(last - 1, cur + window); n++) add(n);
                if (cur + window < last - 1) add("…");
                if (last > 1) add(last);
                return pages.map((n, i) =>
                  n === "…" ? (
                    <span key={`e-${i}`} className="px-1 text-xs font-bold text-muted-foreground" aria-hidden>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      aria-current={n === cur ? "page" : undefined}
                      aria-label={isRTL ? `الصفحة ${n}` : `Page ${n}`}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${
                        n === cur
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "border border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-secondary hover:text-primary"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                );
              })()}
              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label={isRTL ? "الصفحة التالية" : "Next page"}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-secondary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="hidden sm:inline">{isRTL ? "التالي" : "Next"}</span>
                <Arrow className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default BlogCategory;