import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Tag, Heart, ArrowLeft, ArrowRight, Eye, Share2, Twitter, Facebook, Link as LinkIcon, BookOpen, Check, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, ArticleSchema, FAQSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { findBlogPost, useBlogPosts } from "@/data/sources/blog";
import { DetailPageSkeleton } from "@/components/common/ContentSkeletons";
import { fetchPostBySlug } from "@/data/blogApi";
import { linkifyBarePaths } from "@/lib/article-links";
import type { BlogPost as BlogPostType } from "@/data/blog";
import { linkifyParagraph } from "@/data/internalLinks";
import { TagsRail } from "@/components/common/TagsRail";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [search] = useSearchParams();
  const isPreview = search.get("preview") === "1";
  const { posts, loading } = useBlogPosts();
  const fromPublic = findBlogPost(posts, slug);

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
  if (loading || (!post && isPreview && previewLoading)) {
    return <PageLayout><DetailPageSkeleton /></PageLayout>;
  }
  if (!post) return <Navigate to="/404" replace />;

  const c = post[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const heroTextAlign = lang === "ar" ? "text-center md:text-right" : "text-center md:text-left";
  const heroJustify = lang === "ar" ? "justify-center md:justify-end" : "justify-center md:justify-start";
  const baseUrl = "https://elyusr.org";
  const url = `${baseUrl}/blog/${post.slug}`;

  // Parse structured body blocks: Headings, Related Links (grouped or single), Paragraphs with inline markdown
  type RelatedLink = { title: string; href: string };
  type BodyBlock =
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "related_group"; items: RelatedLink[] }
    | { type: "related_single"; item: RelatedLink }
    | { type: "paragraph"; raw: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "table"; head: string[]; rows: string[][] }
    | { type: "quick"; raw: string }
    | { type: "sources"; items: RelatedLink[] }
    | { type: "cta"; item: RelatedLink };

  const parseRelatedLink = (text: string): RelatedLink | null => {
    const trimmed = text.trim().replace(/^[-*•]\s*/, "");
    const m = trimmed.match(
      /^(?:(?:اقرأ|راجع|انظر)\s*(?:أيضًا|أيضا|أيضاً|كذلك|المزيد)?\s*[:—\-]?\s*|Read\s*also\s*[:—\-]?\s*|\(?المصدر\s*:\s*|\(?للمزيد\s*:\s*)?\[([^\]]+)\]\(([^)]+)\)\.?\)?$/i
    );
    if (m) {
      return { title: m[1].trim(), href: m[2].trim() };
    }
    return null;
  };

  const blocks: BodyBlock[] = [];
  let pendingRelated: RelatedLink[] = [];

  const flushRelated = () => {
    if (pendingRelated.length === 1) {
      blocks.push({ type: "related_single", item: pendingRelated[0] });
    } else if (pendingRelated.length > 1) {
      blocks.push({ type: "related_group", items: [...pendingRelated] });
    }
    pendingRelated = [];
  };

  // Flatten and split by newlines so every line/paragraph is a discrete block
  // bare site paths written as text in older articles ("صفحة التبرع: /donate?…") become real links
  const lines = c.body
    .flatMap((p) => (typeof p === "string" ? p.split(/\r?\n+/) : []))
    .map((l) => linkifyBarePaths(l.trim()))
    .filter(Boolean);

  const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  let inSources = false;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (/^#\s+/.test(line) || /^-{3,}$/.test(line)) { flushRelated(); continue; } // the title is the page H1; rules are spacing

    // «**المصادر:**» → the links after it are sources (external, cited), not "read also" cards
    if (/^\*\*(المصادر|المراجع|Sources)\s*:?\*\*\s*:?$/i.test(line)) { flushRelated(); inSources = true; blocks.push({ type: "sources", items: [] }); continue; }
    if (inSources) {
      const rel = parseRelatedLink(line);
      const last = blocks[blocks.length - 1];
      if (rel && last?.type === "sources") { last.items.push(rel); continue; }
      inSources = false;
    }

    // tables: consecutive "| a | b |" lines (the "|---|" row is the separator)
    if (line.startsWith("|")) {
      flushRelated();
      const rows: string[][] = [];
      while (li < lines.length && lines[li].startsWith("|")) {
        if (!/^\|?\s*:?-{2,}/.test(lines[li])) rows.push(cells(lines[li]));
        li++;
      }
      li--;
      if (rows.length) blocks.push({ type: "table", head: rows[0], rows: rows.slice(1) });
      continue;
    }

    // a line that is only a link to a page of the site → a call to action / related card
    const rel = parseRelatedLink(line);
    if (rel && !/^[-*•]\s/.test(line) && rel.href.startsWith("/") && !rel.href.startsWith("/blog/")) {
      flushRelated();
      blocks.push({ type: "cta", item: rel });
      continue;
    }
    if (rel) {
      pendingRelated.push(rel);
      continue;
    }

    flushRelated();

    // lists
    const ulm = line.match(/^[-*•]\s+(.*)$/);
    const olm = line.match(/^\d+[.)]\s+(.*)$/);
    if (ulm || olm) {
      const kind = ulm ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      const text = (ulm || olm)![1];
      if (last && last.type === kind) last.items.push(text);
      else blocks.push(kind === "ul" ? { type: "ul", items: [text] } : { type: "ol", items: [text] });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.replace(/^###\s+/, "") });
    } else if (/^\*\*(الإجابة السريعة|الخلاصة|باختصار|الإجابة المختصرة|Quick answer|In short)\s*:?\*\*/i.test(line)) {
      blocks.push({ type: "quick", raw: line.replace(/^\*\*[^*]+\*\*\s*:?\s*/, "") });
    } else if (line.startsWith("> ")) {
      blocks.push({ type: "quick", raw: line.replace(/^>\s+/, "") });
    } else if (/^\*\*[^*]+[؟?]\*\*$/.test(line)) {
      // «**سؤال؟**» on its own line = a question heading (FAQ style)
      blocks.push({ type: "h3", text: line.replace(/^\*\*|\*\*$/g, "") });
    } else {
      blocks.push({ type: "paragraph", raw: line });
    }
  }
  flushRelated();

  // «## أسئلة شائعة» / «## FAQ» section: each «### question» with the paragraph after it → FAQPage schema.
  const faqItems: { q: string; a: string }[] = [];
  {
    const at = blocks.findIndex((b) => b.type === "h2" && /أسئلة شائعة|الأسئلة الشائعة|FAQ|Frequently asked/i.test(b.text));
    if (at >= 0) {
      for (let i = at + 1; i < blocks.length && blocks[i].type !== "h2"; i++) {
        const b = blocks[i];
        const next = blocks[i + 1];
        if (b.type === "h3" && next?.type === "paragraph") {
          faqItems.push({ q: b.text, a: next.raw.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") });
        }
      }
    }
  }

  // Word count is still useful for Article schema metadata and reading-time cues.
  const wordCount = c.body.reduce((acc, p) => acc + p.trim().split(/\s+/).filter(Boolean).length, 0);
  const readingMinutes = Math.max(1, Math.round(wordCount / 180));

  // Related posts: same category first, then any other posts, exclude current, max 3
  const sameCat = posts.filter((p) => p.slug !== post.slug && p.category?.[lang] === post.category?.[lang]);
  const others  = posts.filter((p) => p.slug !== post.slug && p.category?.[lang] !== post.category?.[lang]);
  const related = [...sameCat, ...others].slice(0, 3);
  const seoKeywords = c.tags.join(", ");

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
      {faqItems.length >= 2 && <FAQSchema items={faqItems} />}

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
              src={post.image || "/placeholder.svg"}
              alt={c.title}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                if (el.src !== "/placeholder.svg") {
                  el.src = "/placeholder.svg";
                }
              }}
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

          {(() => {
            const usedAnchors = new Set<string>();
            const renderInline = (text: string) => {
              const regex = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
              const elements: React.ReactNode[] = [];
              let lastIndex = 0;
              let match: RegExpExecArray | null;

              while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                  const before = text.slice(lastIndex, match.index);
                  if (lang === "ar" && usedAnchors.size < 4) {
                    const tokens = linkifyParagraph(before, usedAnchors, 1);
                    tokens.forEach((t, idx) => {
                      if (t.type === "link") {
                        elements.push(
                          <Link key={`kw-${match?.index}-${idx}`} to={t.href} className="font-bold text-accent underline underline-offset-4 hover:text-primary transition">
                            {t.text}
                          </Link>
                        );
                      } else {
                        elements.push(<span key={`txt-${match?.index}-${idx}`}>{t.value}</span>);
                      }
                    });
                  } else {
                    elements.push(<span key={`txt-${match.index}`}>{before}</span>);
                  }
                }

                if (match[2] !== undefined) {
                  elements.push(
                    <strong key={`b-${match.index}`} className="font-extrabold text-slate-900">
                      {/\[[^\]]+\]\([^)]+\)/.test(match[2]) ? renderInline(match[2]) : match[2]}
                    </strong>
                  );
                } else if (match[3] !== undefined && match[4] !== undefined) {
                  const linkText = match[3];
                  const linkUrl = match[4];
                  const isExternal = linkUrl.startsWith("http://") || linkUrl.startsWith("https://");
                  if (isExternal) {
                    elements.push(
                      <a
                        key={`a-${match.index}`}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-accent underline underline-offset-4 hover:text-primary transition"
                      >
                        {linkText}
                      </a>
                    );
                  } else {
                    elements.push(
                      <Link
                        key={`link-${match.index}`}
                        to={linkUrl}
                        className="font-bold text-accent underline underline-offset-4 hover:text-primary transition"
                      >
                        {linkText}
                      </Link>
                    );
                  }
                }

                lastIndex = regex.lastIndex;
              }

              if (lastIndex < text.length) {
                const remaining = text.slice(lastIndex);
                if (lang === "ar" && usedAnchors.size < 4) {
                  const tokens = linkifyParagraph(remaining, usedAnchors, 1);
                  tokens.forEach((t, idx) => {
                    if (t.type === "link") {
                      elements.push(
                        <Link key={`kw-tail-${idx}`} to={t.href} className="font-bold text-accent underline underline-offset-4 hover:text-primary transition">
                          {t.text}
                        </Link>
                      );
                    } else {
                      elements.push(<span key={`txt-tail-${idx}`}>{t.value}</span>);
                    }
                  });
                } else {
                  elements.push(<span key="txt-tail">{remaining}</span>);
                }
              }

              return elements;
            };

            return (
              <div className="article-body space-y-6 text-[16.5px] leading-8 text-slate-900 sm:text-[18px] sm:leading-9 md:text-[19px] md:leading-[2.2] [&_a]:break-words">
                {blocks.map((block, i) => {
                  if (block.type === "h2") {
                    return (
                      <h2 key={i} className="text-xl sm:text-2xl md:text-3xl font-black text-primary mt-9 mb-4 border-b border-border/60 pb-3 flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{block.text}</span>
                      </h2>
                    );
                  }
                  if (block.type === "h3") {
                    return (
                      <h3 key={i} className="text-lg sm:text-xl font-extrabold text-foreground mt-7 mb-3">
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === "related_group") {
                    return (
                      <div key={i} className="my-8 rounded-3xl border border-secondary/30 bg-gradient-to-br from-card via-card to-secondary/10 p-5 sm:p-7 shadow-soft">
                        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border/60">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/20 text-primary">
                            <BookOpen className="h-4.5 w-4.5" />
                          </span>
                          <div>
                            <h4 className="font-black text-base sm:text-lg text-primary">
                              {lang === "ar" ? "مقالات وروابط ذات صلة" : "Related Articles & Guides"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {lang === "ar" ? "موضوعات وتقارير تكميلية ننصح بالاطلاع عليها" : "Recommended related reads and guides"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {block.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.href}
                              {...(/^https?:/.test(item.href) ? { reloadDocument: true, target: "_blank", rel: "noopener noreferrer" } : {})}
                              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-background hover:bg-secondary/15 hover:border-secondary/40 transition group shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary line-clamp-2 transition">
                                  {item.title}
                                </span>
                              </div>
                              <Arrow className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (block.type === "related_single") {
                    return (
                      <div key={i} className="my-6 rounded-2xl border border-secondary/30 bg-secondary/5 hover:bg-secondary/15 p-4 sm:p-5 transition-all shadow-xs group">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/20 text-primary">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
                                {lang === "ar" ? "اقرأ أيضاً" : "Read also"}
                              </span>
                              <Link to={block.item.href} className="font-extrabold text-slate-900 group-hover:text-primary transition line-clamp-2 text-sm sm:text-base">
                                {block.item.title}
                              </Link>
                            </div>
                          </div>
                          <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  }
                  if (block.type === "quick") {
                    return (
                      <aside key={i} id={i < 4 ? "quick-answer" : undefined} className="quick-answer my-6 rounded-2xl border-s-4 border-secondary bg-secondary/10 p-4 sm:p-5">
                        <p className="mb-1 text-xs font-black text-primary">{lang === "ar" ? "الإجابة باختصار" : "In short"}</p>
                        <p className="font-semibold leading-8 text-slate-900">{renderInline(block.raw)}</p>
                      </aside>
                    );
                  }
                  if (block.type === "ul" || block.type === "ol") {
                    const ListTag = block.type === "ul" ? "ul" : "ol";
                    return (
                      <ListTag key={i} className={`space-y-2 ps-6 marker:font-black marker:text-secondary ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
                        {block.items.map((t, k) => <li key={k} className="ps-1 leading-8">{renderInline(t)}</li>)}
                      </ListTag>
                    );
                  }
                  if (block.type === "table") {
                    return (
                      <div key={i} className="my-6 overflow-x-auto rounded-2xl border border-border shadow-xs">
                        <table className="w-full min-w-[480px] border-collapse text-start text-[15px] leading-7">
                          <thead className="bg-primary text-primary-foreground">
                            <tr>{block.head.map((h, k) => <th key={k} scope="col" className="px-4 py-3 text-start font-black">{renderInline(h)}</th>)}</tr>
                          </thead>
                          <tbody>
                            {block.rows.map((r, k) => (
                              <tr key={k} className="border-t border-border odd:bg-card even:bg-muted/40">
                                {r.map((c2, x) => <td key={x} className={`px-4 py-3 align-top ${x === 0 ? "font-bold text-primary" : ""}`}>{renderInline(c2)}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (block.type === "cta") {
                    return (
                      <div key={i} className="my-7 flex justify-center">
                        <Link to={block.item.href} data-source={`blog-${post.slug}`} data-label="article-cta"
                          className="inline-flex items-center gap-2 rounded-2xl bg-orange-grad px-6 py-3.5 text-base font-black text-accent-foreground shadow-cta transition hover:opacity-95">
                          {block.item.title} <Arrow className="h-4 w-4" />
                        </Link>
                      </div>
                    );
                  }
                  if (block.type === "sources") {
                    return block.items.length ? (
                      <div key={i} className="mt-10 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 text-sm">
                        <p className="mb-2 font-black text-primary">{lang === "ar" ? "المصادر" : "Sources"}</p>
                        <ol className="list-decimal space-y-1.5 ps-5">
                          {block.items.map((it, k) => (
                            <li key={k}>
                              {/^https?:/.test(it.href)
                                ? <a href={it.href} target="_blank" rel="noopener noreferrer" className="font-bold text-accent underline underline-offset-4 hover:text-primary">{it.title}</a>
                                : <Link to={it.href} className="font-bold text-accent underline underline-offset-4 hover:text-primary">{it.title}</Link>}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null;
                  }
                  return (
                    <p key={i} className="font-normal text-slate-900 leading-8 sm:leading-9">
                      {renderInline(block.raw)}
                    </p>
                  );
                })}
              </div>
            );
          })()}

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