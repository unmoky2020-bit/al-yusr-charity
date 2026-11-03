import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Calendar, Mail, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useBlogPosts } from "@/data/sources/blog";
import { CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { authors, getAuthor, authorOfPost } from "@/data/blogTaxonomy";

const BlogAuthor = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !authors.find((a) => a.slug === slug)) return <Navigate to="/blog" replace />;
  return <BlogAuthorView key={slug} slug={slug} />;
};

const BlogAuthorView = ({ slug }: { slug: string }) => {
  const { lang, t } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const author = getAuthor(slug)!;
  const c = author[lang];
  const baseUrl = "https://elyusr.org";
  const url = `${baseUrl}/blog/author/${slug}`;

  const { posts: all, loading: postsLoading } = useBlogPosts();
  const posts = useMemo(
    () => all.filter((p) => authorOfPost(p).slug === slug).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [all, slug],
  );

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? `${c.name} — كاتب في اليسر | المنصورة` : `${c.name} — Author at Al-Yusr | Mansoura`}
        description={c.bio}
        path={`/blog/author/${slug}`}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: t.nav.home, url: `${baseUrl}/` },
        { name: isRTL ? "المدونة" : "Blog", url: `${baseUrl}/blog` },
        { name: c.name, url },
      ]} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: c.name,
          jobTitle: c.role,
          description: c.bio,
          url,
          worksFor: { "@type": "Organization", name: "مؤسسة اليسر الخيرية", url: baseUrl },
        })}</script>
      </Helmet>

      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <Breadcrumbs items={[{ name: t.nav.home, href: "/" }, { name: isRTL ? "المدونة" : "Blog", href: "/blog" }, { name: c.name }]} />
          <div className="mt-6 flex flex-col items-start gap-5 md:flex-row md:items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-2xl font-black text-secondary-foreground shadow-cta">
              {c.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black md:text-4xl">{c.name}</h1>
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-secondary">
                <ShieldCheck className="h-3.5 w-3.5" /> {c.role}
              </div>
              <p className="mt-3 max-w-2xl text-primary-foreground/85">{c.bio}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background pt-12 pb-28 sm:pb-36 md:pt-16 md:pb-44">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-black text-primary md:text-2xl">
            {isRTL ? `مقالات ${c.name} (${posts.length})` : `Articles by ${c.name} (${posts.length})`}
          </h2>
          {postsLoading ? (
            <CardGridSkeleton count={6} />
          ) : posts.length === 0 ? (
            <p className="mt-6 text-muted-foreground">{isRTL ? "لسه مفيش مقالات." : "No articles yet."}</p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={p.image} alt={p[lang].title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {p.date}
                    </div>
                    <h3 className="mt-2 font-extrabold text-primary line-clamp-2">{p[lang].title}</h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-accent">
                      {isRTL ? "اقرأ" : "Read"} <Arrow className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <Mail className="h-4 w-4 text-accent" />
              {isRTL ? "اقترح موضوع لـ" : "Suggest a topic for"} {c.name}: <a className="text-accent" href="mailto:editorial@elyusr.org">editorial@elyusr.org</a>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default BlogAuthor;