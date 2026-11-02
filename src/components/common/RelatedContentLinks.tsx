import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MapPin, Layers, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { GEO_GOVERNORATES } from "@/data/geoPages";
import { usePrograms } from "@/data/sources/programs";
import { fetchPublishedPosts } from "@/data/blogApi";

/**
 * Breadcrumb-aware internal-linking hub. Given a program (and optional
 * option/governorate), it surfaces:
 *   1. Up to 4 related blog articles (matched by tag/category/focus keyword)
 *   2. Localized geo pages for the same program in other governorates
 *   3. Sibling programs / option deep links
 * Strengthens topical authority and helps Google connect the cluster.
 */
type Article = { slug: string; title_ar: string; title_en: string; image_url?: string | null };

import { blogPosts } from "@/data/blog";

export const RelatedContentLinks = ({
  programSlug,
  optionSlug,
  governorateSlug,
  className = "",
}: {
  programSlug: string;
  optionSlug?: string;
  governorateSlug?: string;
  className?: string;
}) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const posts = await fetchPublishedPosts();
        if (alive && Array.isArray(posts) && posts.length > 0) {
          const matched = posts.filter(
            (p) =>
              p.slug.includes(programSlug) ||
              [...(p.ar?.tags ?? []), ...(p.en?.tags ?? [])].some((t) => t.includes(programSlug))
          ).slice(0, 4);

          const list = (matched.length > 0 ? matched : posts.slice(0, 3)).map((p) => ({
            slug: p.slug,
            title_ar: p.ar.title,
            title_en: p.en.title,
            image_url: p.image,
          }));

          setArticles(list);
          return;
        }
      } catch {}

      if (alive) {
        // Fallback to static blog articles
        const staticList = (blogPosts || []).slice(0, 3).map((p) => ({
          slug: p.slug,
          title_ar: p.ar.title,
          title_en: p.en.title,
          image_url: p.image,
        }));
        setArticles(staticList);
      }
    })();
    return () => { alive = false; };
  }, [programSlug]);

  const safeArticles = Array.isArray(articles) ? articles : [];

  const otherGeos = GEO_GOVERNORATES.filter(
    (g) => g.programs[programSlug] && g.slug !== governorateSlug,
  ).slice(0, 6);

  const { programs } = usePrograms();
  const siblings = programs.filter((p) => p.slug !== programSlug).slice(0, 4);

  return (
    <section
      data-source={`related-links-${programSlug}`}
      className={`bg-background pt-12 pb-28 sm:pb-36 md:pt-16 md:pb-44 ${className}`}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-2 text-center text-xl font-black text-primary md:text-2xl">
          {isRTL ? "اقرأ أكتر واستكشف أكتر" : "Read more & explore more"}
        </h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {isRTL ? "روابط داخلية مختارة لمساعدتك تتعمق أكتر في هذا البرنامج." : "Hand-picked internal links to dive deeper into this program."}
        </p>

        <div className={`grid gap-6 ${otherGeos.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {/* Articles */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2 font-extrabold text-primary">
              <BookOpen className="h-5 w-5 text-secondary" />
              {isRTL ? "مقالات ذات صلة" : "Related articles"}
            </div>
            {safeArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isRTL ? "لا توجد مقالات حالياً." : "No articles yet."}
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {safeArticles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      to={`/blog/${a.slug}`}
                      className="group inline-flex items-center gap-1 font-bold text-foreground/85 hover:text-primary"
                    >
                      {isRTL ? a.title_ar : (a.title_en || a.title_ar)}
                      <Arrow className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Geo pages — only show when there are real geo destinations to link to */}
          {otherGeos.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2 font-extrabold text-primary">
                <MapPin className="h-5 w-5 text-secondary" />
                {isRTL ? "نفس البرنامج في محافظات تانية" : "Same program in other governorates"}
              </div>
              <ul className="grid grid-cols-2 gap-1.5 text-sm">
                {otherGeos.map((g) => (
                  <li key={g.slug}>
                    <Link
                      to={`/geo/${g.slug}/${programSlug}`}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-bold text-foreground/80 hover:bg-secondary/25 hover:text-primary"
                    >
                      {isRTL ? g.ar : g.en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Siblings */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2 font-extrabold text-primary">
              <Layers className="h-5 w-5 text-secondary" />
              {isRTL ? "برامج أخرى قد تهمك" : "Other programs you may like"}
            </div>
            <ul className="space-y-2 text-sm">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/programs/${s.slug}`}
                    className="group inline-flex items-center gap-1 font-bold text-foreground/85 hover:text-primary"
                  >
                    {s[lang].name}
                    <Arrow className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
            {optionSlug && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                {isRTL ? "أنت تشاهد خيار:" : "Viewing option:"} <span className="font-bold">{optionSlug}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};