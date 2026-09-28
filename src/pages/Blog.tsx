import { Link } from "react-router-dom";
import { memo, useMemo, useState } from "react";
import { Calendar, Tag, ArrowLeft, ArrowRight, Search, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAllBlogPosts } from "@/data/useBlogPosts";
import { axes } from "@/data/blogTaxonomy";
import { TagsRail } from "@/components/common/TagsRail";

type BlogCardProps = {
  slug: string;
  image: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readLabel: string;
  Arrow: typeof ArrowLeft;
  featured?: boolean;
};
const BlogCard = memo(function BlogCard({ slug, image, title, excerpt, category, date, readLabel, Arrow, featured }: BlogCardProps) {
  if (featured) {
    return (
      <article className="group relative w-full overflow-hidden rounded-[2.25rem] border border-border/70 bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-elegant">
        <Link to={`/blog/${slug}`} className="flex flex-col md:flex-row md:items-stretch">
          <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-auto md:w-[48%] md:min-h-[320px] md:max-h-[380px]">
            <img
              decoding="async"
              src={image}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
            <span className="absolute start-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-xs font-extrabold text-primary shadow-soft backdrop-blur">
              <Tag className="h-3.5 w-3.5 text-accent" />
              {category}
            </span>
            <span className="absolute end-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-3 py-1 text-xs font-black text-accent-foreground shadow-cta">
              <Sparkles className="h-3.5 w-3.5" />
              {readLabel.startsWith("اقرأ") ? "مقال مميز" : "Featured"}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8 md:w-[52%] md:p-8 lg:p-10">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <time>{date}</time>
            </div>
            <h2 className="mt-3 text-lg font-black leading-snug text-primary transition-colors group-hover:text-accent sm:text-xl md:text-2xl line-clamp-2">
              {title}
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {excerpt}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs sm:text-sm font-black text-accent transition-all group-hover:gap-3">
              <span>{readLabel}</span>
              <Arrow className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-secondary/50 hover:shadow-card">
      <Link to={`/blog/${slug}`} className="flex flex-col h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            decoding="async"
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/0 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
          <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-soft backdrop-blur">
            <Tag className="h-3 w-3 text-accent" />
            {category}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5 md:p-6 justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
              <Calendar className="h-3 w-3 text-accent" />
              <time>{date}</time>
            </div>
            <h2 className="mt-2 font-black leading-[1.45] text-primary transition-colors group-hover:text-accent py-0.5 text-base md:text-lg line-clamp-2">
              {title}
            </h2>
            <p className="mt-1.5 text-xs md:text-sm leading-[1.6] text-muted-foreground line-clamp-2">{excerpt}</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-accent transition group-hover:gap-2.5">
            {readLabel} <Arrow className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </article>
  );
});

const Blog = () => {
  const { lang, t } = useLang();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const baseUrl = "https://elyusr.org";
  const readLabel = lang === "ar" ? "اقرأ المقال" : "Read article";
  const { posts } = useAllBlogPosts();
  const [query, setQuery] = useState("");
  const cards = useMemo(
    () => posts.map((p) => ({ slug: p.slug, image: p.image, date: p.date, category: p.category[lang], title: p[lang].title, excerpt: p[lang].excerpt })),
    [posts, lang]
  );
  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.excerpt.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q),
    );
  }, [cards, query]);
  const [featured, ...rest] = filteredCards;
  return (
    <PageLayout>
      <SEOHelmet
        title={lang === "ar" ? "المدونة — قصص الأثر | مؤسسة اليسر الخيرية المنصورة" : "Blog — Impact Stories | Al-Yusr Charity Mansoura"}
        description={lang === "ar" ? "مدونة اليسر: قصص الأثر، أدلة الزكاة، تجارب المتطوعين، وتحديثات مشاريعنا في الدقهلية ومصر." : "Al-Yusr Blog: impact stories, Zakat guides, volunteer experiences, and project updates in Dakahlia and Egypt."}
        path="/blog"
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: t.nav.home, url: `${baseUrl}/` },
        { name: lang === "ar" ? "المدونة" : "Blog", url: `${baseUrl}/blog` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="flex justify-center text-primary-foreground/85">
            <Breadcrumbs items={[{ name: t.nav.home, href: "/" }, { name: lang === "ar" ? "المدونة" : "Blog" }]} />
          </div>
          <h1 className="mt-4 text-center text-xl font-black md:text-3xl">
            {lang === "ar" ? "قصص الأثر — مدونة اليسر" : "Impact Stories — Al-Yusr Blog"}
          </h1>
          <p className="mx-auto mt-2.5 max-w-2xl text-center text-[13px] text-primary-foreground/85 md:text-sm">
            {lang === "ar" ? "تحديثات حقيقية من الميدان، أدلة شرعية، وقصص نجاح من المنصورة والدقهلية." : "Real field updates, Shariah guides, and success stories from Mansoura and Dakahlia."}
          </p>
        </div>
      </section>

      <nav aria-label={lang === "ar" ? "تصنيفات المدونة" : "Blog categories"} className="border-b border-border bg-muted/40 py-4">
        <div className="container mx-auto flex flex-col items-center gap-3 px-4">
          <TagsRail
            className="w-full"
            source="blog-categories"
            ariaLabel={lang === "ar" ? "تصنيفات المدونة" : "Blog categories"}
            items={axes.map((a) => ({
              id: a.slug,
              label: a[lang].name,
              to: `/blog/category/${a.slug}`,
            }))}
          />
          <label className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ar" ? "ابحث في المقالات…" : "Search articles…"}
              aria-label={lang === "ar" ? "ابحث في المقالات" : "Search articles"}
              className="w-full rounded-full border border-border bg-card ps-9 pe-4 py-2 text-[13px] font-bold text-foreground shadow-soft outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30"
            />
          </label>
        </div>
      </nav>

      <section className="pattern-programs pt-14 pb-28 sm:pb-36 md:pt-20 md:pb-44">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCards.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                {lang === "ar" ? "ما لقيناش مقالات مطابقة لبحثك." : "No articles match your search."}
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mb-6">
                  <BlogCard featured slug={featured.slug} image={featured.image} title={featured.title} excerpt={featured.excerpt} category={featured.category} date={featured.date} readLabel={readLabel} Arrow={Arrow} />
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((c) => (
                  <BlogCard key={c.slug} slug={c.slug} image={c.image} title={c.title} excerpt={c.excerpt} category={c.category} date={c.date} readLabel={readLabel} Arrow={Arrow} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;