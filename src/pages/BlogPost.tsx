import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Tag, Heart, ArrowLeft, ArrowRight, Eye, Share2, Twitter, Facebook, Link as LinkIcon, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, ArticleSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { getPost } from "@/data/blog";
import { useAllBlogPosts } from "@/data/useBlogPosts";
import { fetchPostBySlug } from "@/data/blogApi";
import type { BlogPost as BlogPostType } from "@/data/blog";
import { linkifyBody } from "@/data/internalLinks";
import { TagsRail } from "@/components/common/TagsRail";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [search] = useSearchParams();
  const isPreview = search.get("preview") === "1";
  const { posts, loading } = useAllBlogPosts();
  const fromPublic = slug ? (posts.find((p) => p.slug === slug) ?? getPost(slug)) : undefined;

  // Preview mode: fetch the row directly (could be draft/scheduled).
  const [previewPost, setPreviewPost] = useState<BlogPostType | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!isPreview || !slug || fromPublic) return;
    setPreviewLoading(true);
    fetchPostBySlug(slug).then((p) => setPreviewPost(p)).finally(() => setPreviewLoading(false));
  }, [isPreview, slug, fromPublic]);

  const post = fromPublic || previewPost || undefined;
  if (!post) {
    if (loading || (isPreview && previewLoading)) return null;
    return <Navigate to="/404" replace />;
  }

  const c = post[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const heroTextAlign = lang === "ar" ? "text-center md:text-right" : "text-center md:text-left";
  const heroJustify = lang === "ar" ? "justify-center md:justify-end" : "justify-center md:justify-start";
  const baseUrl = "https://elyusr.org";
  const url = `${baseUrl}/blog/${post.slug}`;
  // Ensure any stray markdown link syntax like [text](url) is cleaned to text so raw brackets never render
  const cleanedBody = c.body.map((p) =>
    p.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, "$1")
  );
  // Inject up to 4 contextual internal links into the Arabic body for SEO.
  const renderedBody = lang === "ar" ? linkifyBody(cleanedBody, 4) : cleanedBody.map((p) => [{ type: "text" as const, value: p }]);

  // Word count is still useful for Article schema metadata and reading-time cues.
  const wordCount = cleanedBody.reduce((acc, p) => acc + p.trim().split(/\s+/).filter(Boolean).length, 0);
  const readingMinutes = Math.max(1, Math.round(wordCount / 180));

  // Related posts: same category first, then any other posts, exclude current, max 3
  const sameCat = posts.filter((p) => p.slug !== post.slug && p.category?.[lang] === post.category?.[lang]);
  const others  = posts.filter((p) => p.slug !== post.slug && p.category?.[lang] !== post.category?.[lang]);
  const related = [...sameCat, ...others].slice(0, 3);
  const seoKeywords = c.tags.join(", ");
  const hiddenSeoText = lang === "ar"
    ? `مقالات مؤسسة اليسر عن ${c.tags.join("، ")}. تبرع، زكاة، صدقة، كفالة يتيم، صك أضحية، كرتونة عزومة، قافلة طبية، توزيع مساعدات، توثيق ميداني.`
    : `Al-Yusr articles about ${c.tags.join(", ")}. Donate, zakat, sadaqah, orphan sponsorship, Udhiyah, food box, medical convoy, relief distribution, field documentation.`;

  const shareTitle = encodeURIComponent(c.title);
  const shareUrl = encodeURIComponent(url);
  const copyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }).catch(() => {});
    }
  };

  return (
    <PageLayout>
      {isPreview && (
        <div className="sticky top-16 z-40 border-b border-amber-300 bg-amber-100/95 py-2 text-center text-xs font-extrabold text-amber-900 backdrop-blur dark:bg-amber-500/20 dark:text-amber-200">
          <Eye className="me-1 inline h-3.5 w-3.5" />
          {lang === "ar" ? "وضع المعاينة — هذه الصفحة لم تنشر بعد" : "Preview mode — this page is not yet published"}
        </div>
      )}
      <SEOHelmet
        title={
          (() => {
            const suffix = lang === "ar" ? " | اليسر" : " | Al-Yusr";
            const maxLen = 60 - suffix.length;
            const t = c.title.length > maxLen ? c.title.slice(0, maxLen - 1).trimEnd() + "…" : c.title;
            return `${t}${suffix}`;
          })()
        }
        description={c.excerpt}
        path={`/blog/${post.slug}`}
        image={post.image}
        ogType="article"
        keywords={seoKeywords}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: t.nav.home, url: `${baseUrl}/` },
        { name: lang === "ar" ? "المدونة" : "Blog", url: `${baseUrl}/blog` },
        { name: c.title, url },
      ]} />
      <ArticleSchema
        url={url}
        headline={c.title}
        description={c.excerpt}
        image={post.image}
        datePublished={post.date}
        section={post.category[lang]}
        keywords={c.tags}
        wordCount={wordCount}
        timeRequiredMinutes={readingMinutes}
        inLanguage={lang === "ar" ? "ar" : "en"}
      />

      <article className="bg-background">
        {/* Hero */}
        <header className="pattern-hero-luxe hero-pattern-fade text-primary-foreground pb-28 sm:pb-36 md:pb-44 lg:pb-48">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-4 md:pt-16 md:pb-6">
            <div className="text-primary-foreground/85">
              <Breadcrumbs items={[
                { name: t.nav.home, href: "/" },
                { name: lang === "ar" ? "المدونة" : "Blog", href: "/blog" },
                { name: c.title },
              ]} />
            </div>
            <div className={`mt-5 flex flex-wrap items-center gap-3 text-xs ${heroJustify}`}>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 font-bold text-secondary"><Tag className="h-3 w-3" />{post.category[lang]}</span>
              <span className="inline-flex items-center gap-1 text-primary-foreground/75"><Calendar className="h-3 w-3" />{post.date}</span>
            </div>
            <h1 className={`${heroTextAlign} mt-4 max-w-5xl text-2xl font-black leading-tight sm:text-3xl md:text-4xl lg:text-5xl mx-auto md:mx-0`}>{c.title}</h1>
            <p className={`${heroTextAlign} mt-3.5 max-w-4xl text-sm font-medium leading-relaxed text-primary-foreground/90 sm:text-base md:text-lg mx-auto md:mx-0`}>{c.excerpt}</p>
            <div className="mt-7 w-full max-w-7xl rounded-3xl border border-white/80 bg-white p-5 text-sm text-slate-900 shadow-card ring-1 ring-black/5 md:p-8">
              <p className="font-bold leading-relaxed text-slate-900 text-sm md:text-base">
                {lang === "ar" ? "هذا المقال يوضح كيف تتحول جهود مؤسسة اليسر إلى دعم حقيقي موثق في الميدان مع دعوة صريحة للمساهمة." : "This article shows how Al-Yusr turns relief efforts into real, documented field impact with a clear donation invitation."}
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-xs sm:text-sm font-bold leading-6 text-slate-800">
                <li className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{lang === "ar" ? "توثيق بالصورة والفيديو لكل عملية توزيع." : "Documented proof for every distribution."}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{lang === "ar" ? "دعم مباشر للأسر المستحقة في الدقهلية." : "Direct support for deserving families in Dakahlia."}</span>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Floating Featured Image — Full container width matching header on large screens */}
        <div className="relative z-20 -mt-24 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 sm:-mt-32 md:-mt-40">
          <figure className="w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-4 border-background bg-card shadow-2xl ring-1 ring-black/5">
            <img
              decoding="async"
              src={post.image}
              alt={c.title}
              className="aspect-[16/9] sm:aspect-[21/10] md:aspect-[16/8] lg:aspect-[21/9] w-full object-cover transition duration-500 hover:scale-[1.01]"
              loading="eager"
            />
            <figcaption className="mx-auto my-3.5 max-w-5xl px-4 text-center text-xs sm:text-sm font-bold leading-relaxed text-muted-foreground">
              {c.title}
            </figcaption>
          </figure>
        </div>

        {/* Why this article matters */}
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8 md:p-10">
            <h2 className="text-lg font-black text-primary md:text-xl">
              {lang === "ar" ? "لماذا هذا المقال مهم" : "Why this article matters"}
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-800 md:text-base">
              {lang === "ar"
                ? "اكتشف كيف تتحول جهود مؤسسة اليسر من كلام إلى أثر ميداني موثوق، مع تقارير وصور وتوثيق لكل حملة." 
                : "Discover how Al-Yusr turns effort into trusted field impact, with reports, photos, and documentation for every campaign."
              }
            </p>
            <ul className="mt-4 space-y-3 text-xs sm:text-sm font-bold leading-7 text-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{lang === "ar" ? "تتبعنا من الزيارة الميدانية حتى تسليم الخير." : "Follow our process from field visit to donation delivery."}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{lang === "ar" ? "كل تبرع يُسجَّل ويُوثَّق ليصل بإخلاص." : "Each donation is recorded and documented to arrive with integrity."}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-visible py-8 md:py-12">
          {/* Article meta + share — clean & without reading-time */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 text-xs sm:text-sm font-bold text-slate-700 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-primary"><BookOpen className="h-3.5 w-3.5 text-accent" />{lang === "ar" ? "من مدونة اليسر" : "From the Al-Yusr blog"}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-accent" />{post.date}</span>
              <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-accent" />{post.category[lang]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500 sm:inline-flex"><Share2 className="h-3 w-3" />{lang === "ar" ? "شارك" : "Share"}</span>
              <a aria-label="Share on Twitter" href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:-translate-y-0.5 hover:bg-secondary/20 hover:text-primary"><Twitter className="h-3.5 w-3.5" /></a>
              <a aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:-translate-y-0.5 hover:bg-secondary/20 hover:text-primary"><Facebook className="h-3.5 w-3.5" /></a>
              <button type="button" aria-label={lang === "ar" ? "نسخ الرابط" : "Copy link"} onClick={copyLink} className={"grid h-8 w-8 place-items-center rounded-full transition hover:-translate-y-0.5 " + (copied ? "bg-secondary/30 text-primary" : "bg-slate-100 text-slate-700 hover:bg-secondary/20 hover:text-primary") }>
                {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="article-body space-y-6 text-[16.5px] leading-8 text-slate-900 sm:text-[18px] sm:leading-9 md:text-[19px] md:leading-[2.2] [&_a]:break-words">
            {renderedBody.map((tokens, i) => (
              <p key={i} className="font-normal text-slate-900">
                {tokens.map((tok, j) =>
                  tok.type === "link" ? (
                    <Link key={j} to={tok.href} className="font-bold text-accent underline underline-offset-4 hover:text-primary">{tok.text}</Link>
                  ) : (
                    <span key={j}>{tok.value}</span>
                  ),
                )}
              </p>
            ))}
          </div>

          <TagsRail
            className="mt-8"
            source="blog-post-tags"
            items={c.tags.map((tg: string) => ({ id: tg, label: `#${tg}` }))}
          />

          {/* Actionable CTA box — 2 buttons in one row with refined sizing and clear dark copy */}
          <div className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft md:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2.5">
                <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-xs font-black text-primary">
                  {lang === "ar" ? "نداء للخير" : "Actionable support"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                  {lang === "ar" ? "تبرع الآن وكن سببًا في توثيق الخير" : "Donate now and be the reason this relief is delivered."}
                </h3>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-600">
                  {lang === "ar" ? "كل تبرع يُسجَّل ويُتابع ميدانيًا، مع تقارير وصور تصل إليك بسرعة." : "Every donation is logged and field-tracked, with reports and photos delivered to you."}
                </p>
              </div>
              <div className="flex flex-row items-center gap-2.5 sm:gap-3 shrink-0">
                <Button asChild size="default" className="flex-1 sm:flex-initial h-11 px-4 sm:px-6 bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground shadow-cta hover:opacity-95 rounded-2xl">
                  <Link to="/donate"><Heart className="h-4 w-4" />{t.nav.donate}</Link>
                </Button>
                <Link to="/contact" className="flex-1 sm:flex-initial inline-flex h-11 items-center justify-center rounded-2xl border border-primary/20 bg-secondary/15 px-4 sm:px-5 text-xs sm:text-sm font-black text-primary transition hover:bg-secondary/30">
                  {lang === "ar" ? "استفسر عن حملاتنا" : "Ask about campaigns"}
                </Link>
              </div>
            </div>
            <div className="mt-4 text-[11px] font-bold text-slate-500">
              {lang === "ar" ? "نحن نوفر متابعة دائمة للمستفيدين وتقارير شفافة لكل تبرع." : "We provide continuous follow-up and transparent reports for every donation."}
            </div>
          </div>
          <div className="sr-only">{hiddenSeoText}</div>
        </div>

        {/* Related with generous bottom padding for footer newsletter */}
        {/* Related posts — only render when there are related posts */}
        {related.length > 0 && <section className="bg-muted/30 pt-12 pb-20 sm:pb-24 md:pt-16 md:pb-28">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-xl font-black text-primary md:text-2xl">
              {lang === "ar" ? "مقالات أخرى" : "More articles"}
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img decoding="async" src={r.image} alt={r[lang].title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-extrabold text-primary line-clamp-2">{r[lang].title}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-accent">
                      {lang === "ar" ? "اقرأ" : "Read"} <Arrow className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>}
      </article>
    </PageLayout>
  );
};

export default BlogPost;