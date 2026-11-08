import { useMemo, useState, useEffect, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { X, ChevronLeft, ChevronRight, Share2, Heart, Download } from "lucide-react";
import { track } from "@/lib/track";
import { LazyImage } from "@/components/common/LazyImage";
// FieldGalleryScroll removed — gallery archive appearance simplified per request.
import { GALLERY_PROGRAMS } from "@/data/galleryApi";
import { type GalleryImage } from "@/data/galleryImages";
import { useGalleryImages } from "@/data/sources/gallery";
import { responsiveImage } from "@/lib/image-srcset";

const PAGE_SIZE = 8;

type CardProps = {
  img: GalleryImage;
  alt: string;
  onOpen: (id: string) => void;
};
const GalleryCard = memo(function GalleryCard({ img, alt, onOpen }: CardProps) {
  const responsive = responsiveImage(img.src);
  return (
    <figure
      id={img.id}
      itemScope
      itemType="https://schema.org/ImageObject"
      className="group relative aspect-square overflow-hidden rounded-[24px] border border-border/70 bg-card/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
    >
      <button type="button" onClick={() => onOpen(img.id)} className="block h-full w-full" aria-label={alt}>
        <LazyImage
          src={responsive.src}
          srcSet={responsive.srcSet}
          sizes={responsive.sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          alt={alt}
          width={600}
          height={600}
          className="transition-transform duration-700 group-hover:scale-110"
          wrapperClassName="h-full w-full"
        />
        <meta itemProp="contentUrl" content={img.src} />
        <meta itemProp="name" content={alt} />
        <meta itemProp="caption" content={alt} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 px-3 pb-2 text-[11px] font-bold text-primary-foreground opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          {alt}
        </figcaption>
      </button>
    </figure>
  );
});

const Gallery = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const base = "https://elyusr.org";
  const [open, setOpen] = useState<number | null>(null);
  const [cat, setCat] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Live merged list (DB rows first, static images as fallback/seed) — resolved by the content source.
  const { images: allImages } = useGalleryImages();

  // Build category chips from active program slugs found in current data, plus "all".
  const activeSlugs = useMemo(() => {
    const set = new Set<string>();
    allImages.forEach((i) => { if (i.programSlug) set.add(i.programSlug); });
    return GALLERY_PROGRAMS.filter((p) => set.has(p.slug));
  }, [allImages]);

  const cats = useMemo(() => {
    const head = [{ id: "all", label: isRTL ? "الكل" : "All" }];
    if (activeSlugs.length > 0) {
      return head.concat(activeSlugs.map((p) => ({ id: p.slug, label: isRTL ? p.label_ar : p.label_en })));
    }
    // Fallback to the original static category set
    return head.concat(
      isRTL
        ? [
            { id: "families", label: "الأسر" },
            { id: "qurbani", label: "أضحية" },
            { id: "education", label: "تعليم" },
            { id: "health", label: "صحة" },
            { id: "water", label: "مياه" },
            { id: "campaigns", label: "حملات" },
          ]
        : [
            { id: "families", label: "Families" },
            { id: "qurbani", label: "Qurbani" },
            { id: "education", label: "Education" },
            { id: "health", label: "Health" },
            { id: "water", label: "Water" },
            { id: "campaigns", label: "Campaigns" },
          ],
    );
  }, [isRTL, activeSlugs]);

  const filtered = useMemo(
    () => {
      if (cat === "all") return allImages;
      // Match by programSlug if available, otherwise legacy category bucket
      return allImages.filter((i) => (i.programSlug ? i.programSlug === cat : i.category === cat));
    },
    [cat, allImages],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [cat]);

  const openById = useCallback((id: string) => {
    const idx = filtered.findIndex((i) => i.id === id);
    if (idx >= 0) {
      setOpen(idx);
      const img = filtered[idx];
      track("gallery_open", { payload: { id: img.id, category: img.category } });
    }
  }, [filtered]);

  // Keyboard nav inside the lightbox
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % filtered.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered.length]);

  const current = open !== null ? filtered[open] : null;

  const share = (img: GalleryImage) => {
    const url = `${base}/gallery#${img.id}`;
    const title = isRTL ? img.altAr : img.alt;
    track("gallery_share", { payload: { id: img.id, category: img.category, url } });
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  // ImageGallery JSON-LD (structured image listing)
  const imageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: isRTL ? "معرض صور مؤسسة اليسر" : "Al-Yusr photo gallery",
    url: `${base}/gallery`,
    image: allImages.map((img) => {
      const srcStr = img.src || "/placeholder.svg";
      return {
        "@type": "ImageObject",
        contentUrl: srcStr.startsWith("http") ? srcStr : `${base}${srcStr}`,
        url: `${base}/gallery#${img.id}`,
        name: isRTL ? img.altAr : img.alt,
        description: isRTL ? img.altAr : img.alt,
        caption: isRTL ? img.altAr : img.alt,
        representativeOfPage: false,
        creditText: "Al-Yusr Charity Foundation",
        copyrightNotice: "© Al-Yusr Charity",
        license: `${base}/terms`,
        acquireLicensePage: `${base}/contact`,
        creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: `${base}/` },
      };
    }),
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "معرض الصور — لحظات حقيقية من الميدان | مؤسسة اليسر" : "Photo Gallery — Real moments from the field | Al-Yusr"}
        description={isRTL ? "صور حقيقية من توزيعات وحملات مؤسسة اليسر الخيرية في الدقهلية ومحافظات مصر." : "Real photos from Al-Yusr's distributions and campaigns across Dakahlia and Egypt."}
        path="/gallery"
        image={current ? ((current.src && current.src.startsWith("http")) ? current.src : `${base}${current.src || "/placeholder.svg"}`) : undefined}
      />
      {/* Per-image OG/Twitter when a lightbox image is open — improves share previews */}
      {current && (
        <Helmet>
          <meta property="og:image" content={(current.src && current.src.startsWith("http")) ? current.src : `${base}${current.src || "/placeholder.svg"}`} />
          <meta property="og:image:alt" content={isRTL ? current.altAr : current.alt} />
          <meta name="twitter:image" content={(current.src && current.src.startsWith("http")) ? current.src : `${base}${current.src || "/placeholder.svg"}`} />
          <meta name="twitter:image:alt" content={isRTL ? current.altAr : current.alt} />
          <link rel="canonical" href={`${base}/gallery#${current.id}`} />
        </Helmet>
      )}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(imageJsonLd)}</script>
      </Helmet>
      <Helmet>
        <meta name="keywords" content={isRTL
          ? "معرض صور مؤسسة اليسر, صور قوافل المساعدات, صور صكوك الأضحية المنصورة, توزيع كرتونة العزومة الدقهلية, توثيق التبرعات بالصور, جمعية خيرية الدقهلية"
          : "Al-Yusr photo gallery, Mansoura charity convoys, Qurbani share proof, Dakahlia food box distribution, donation photo proof, Egypt charity"} />
        <meta name="author" content="Al-Yusr Charity Foundation" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isRTL ? "معرض صور مؤسسة اليسر" : "Al-Yusr Photo Gallery",
          url: `${base}/gallery`,
          inLanguage: isRTL ? "ar-EG" : "en",
          isPartOf: { "@type": "WebSite", name: "Al-Yusr", url: base },
          about: isRTL ? "توثيق التبرعات والقوافل بالصور" : "Photo documentation of donations and convoys",
          numberOfItems: allImages.length,
        })}</script>
      </Helmet>
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "معرض الصور" : "Gallery", url: `${base}/gallery` },
      ]} />

      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(150_55%_28%/0.35),transparent_55%)]" />
        <div className="container relative mx-auto flex flex-col justify-center px-4 py-8 text-center md:py-12">
          {/* Breadcrumbs first */}
          <div className="flex justify-center text-primary-foreground/75">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "معرض الصور" : "Gallery" }]} />
          </div>
          {/* Title */}
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            {isRTL ? "معرض الصور" : "Photo gallery"}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-primary-foreground/85 sm:text-sm md:text-base">
            {isRTL ? "لحظات صادقة من الميدان — كل صورة تعكس أمانة العمل وحرارة الخير." : "Honest moments from the field — every image captures care, dignity, and real impact."}
          </p>

          {/* Row 1: The 3 tags */}
          <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              isRTL ? "صور مباشرة" : "Live field photos",
              isRTL ? "توزيعات ومشاريع" : "Distributions & projects",
              isRTL ? "شفافية كاملة" : "Full transparency",
            ].map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground/85 backdrop-blur shadow-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Row 2: "ميدان حقيقي — صور موثوقة" tag centered in the row below */}
          <div className="mx-auto mt-2.5 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground backdrop-blur shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              {isRTL ? "ميدان حقيقي — صور موثوقة" : "Real fieldwork — trusted stories"}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-background pt-8 pb-28 sm:pb-36 md:pt-14 md:pb-44">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Clean Modern Categories Filter Pills */}
          <div
            role="tablist"
            aria-label={isRTL ? "تصنيفات المعرض" : "Gallery categories"}
            className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
          >
            {cats.map((c) => {
              const isActive = cat === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => { setCat(c.id); track("gallery_filter", { payload: { category: c.id } }); }}
                  className={`rounded-full px-4 py-2 text-xs font-black transition-all duration-200 shadow-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-cta ring-2 ring-primary/30 scale-105"
                      : "border border-border bg-card text-foreground/80 hover:border-primary/50 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

        

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {pageItems.map((img) => (
              <GalleryCard
                key={img.id}
                img={img}
                alt={isRTL ? img.altAr : img.alt}
                onOpen={openById}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-8 mb-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
                aria-label={isRTL ? "السابق" : "Previous"}
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  aria-current={safePage === i + 1 ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-full px-3 text-sm font-extrabold transition ${
                    safePage === i + 1 ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
                aria-label={isRTL ? "التالي" : "Next"}
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </nav>
          )}

          {/* Contextual CTA */}
          <div className="mt-14 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#183824] via-[#245035] to-[#4d7c45] p-6 text-primary-foreground shadow-[0_24px_80px_rgba(15,34,23,0.22)] md:p-8">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div className="text-center md:text-start">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-primary-foreground/80 backdrop-blur md:mx-0">
                  <Heart className="h-3.5 w-3.5" />
                  {isRTL ? "انضم إلى أثر حقيقي" : "Join a real impact"}
                </div>
                <h2 className="mt-4 text-xl font-black md:text-2xl">
                  {isRTL ? "كل صورة هنا كانت ممكنة بفضل من اختار أن يشارك" : "Every image here became possible because someone chose to care"}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85 md:mx-0 md:text-base">
                  {isRTL ? "ابدأ تبرعك اليوم وكن جزءًا من قصة ميدانٍ يلامس الأسر ويغيّر الحياة في الدقهلية." : "Start your donation today and become part of a field story that reaches families and changes lives in Dakahlia."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                  <Button asChild size="lg" className="h-11 rounded-full bg-orange-grad px-5 text-sm font-extrabold text-accent-foreground shadow-cta transition hover:opacity-95">
                    <Link to="/donate" data-source="gallery" data-label="gallery-donate"><Heart className="h-4 w-4" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 text-sm font-extrabold text-primary-foreground hover:bg-white/15">
                    <Link to="/projects" data-source="gallery" data-label="gallery-projects">{isRTL ? "اعرف برامج اليسر" : "See programs"}</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 text-sm shadow-inner backdrop-blur">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.26em] text-primary-foreground/80">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  {isRTL ? "لماذا هذا المعرض مهم؟" : "Why this gallery matters"}
                </div>
                <ul className="mt-4 space-y-3 text-sm text-primary-foreground/90">
                  <li className="flex items-start gap-2 rounded-2xl bg-black/10 p-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{isRTL ? "يوثق المساعدات بطريقة مباشرة وشفافة." : "It documents aid in a direct and transparent way."}</span>
                  </li>
                  <li className="flex items-start gap-2 rounded-2xl bg-black/10 p-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{isRTL ? "يربط بين التبرع والنتائج على الأرض." : "It connects the donation to visible impact on the ground."}</span>
                  </li>
                  <li className="flex items-start gap-2 rounded-2xl bg-black/10 p-3">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{isRTL ? "يمنحك شعورًا بأن الخير يصل فعلًا." : "It gives you confidence that giving truly reaches people."}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {open !== null && current && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 sm:grid sm:place-items-center sm:p-4"
          onClick={() => setOpen(null)}
          style={{ height: "100dvh" }}
        >
          <div
            className="relative flex h-full w-full flex-col sm:h-auto sm:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute end-2 top-2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:-top-4 sm:end-0 sm:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o - 1 + filtered.length) % filtered.length)); }}
              aria-label={isRTL ? "السابق" : "Previous"}
              className="absolute start-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o + 1) % filtered.length)); }}
              aria-label={isRTL ? "التالي" : "Next"}
              className="absolute end-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {/* Image area — full-screen contained on mobile, capped on desktop */}
            <div className="flex flex-1 items-center justify-center overflow-hidden px-2 pt-12 pb-2 sm:flex-none sm:px-0 sm:pt-0 sm:pb-0">
              <img
                loading="lazy"
                decoding="async"
                src={current.src}
                alt={isRTL ? current.altAr : current.alt}
                className="mx-auto block max-h-full w-auto max-w-full rounded-xl object-contain shadow-card sm:max-h-[70vh] sm:rounded-2xl"
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl bg-white/5 px-3 py-2 text-primary-foreground backdrop-blur sm:mt-3 sm:rounded-2xl">
              <p className="text-sm font-bold">
                <span className="me-2 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px]">{open + 1} / {filtered.length}</span>
                {isRTL ? current.altAr : current.alt}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => share(current)} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20">
                  <Share2 className="h-3.5 w-3.5" />{isRTL ? "مشاركة" : "Share"}
                </button>
                <a
                  href={current.src}
                  download
                  data-source="gallery"
                  data-label={`download-${current.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/20"
                >
                  <Download className="h-3.5 w-3.5" />{isRTL ? "تحميل" : "Download"}
                </a>
                {current.donateProgram && (
                  <Link
                    to={`/donate?program=${current.donateProgram}`}
                    data-source="gallery-lightbox"
                    data-label={`donate-${current.donateProgram}`}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-grad px-3 py-1 text-xs font-extrabold text-accent-foreground"
                  >
                    <Heart className="h-3.5 w-3.5" />{isRTL ? "تبرع لهذه الحملة" : "Donate to this campaign"}
                  </Link>
                )}
              </div>
            </div>

            {/* Thumbnail swiper strip */}
            {filtered.length > 1 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-white/5 p-2 backdrop-blur [scrollbar-width:thin]"
                aria-label={isRTL ? "شريط الصور" : "Thumbnails"}
              >
                {filtered.map((t, i) => {
                  const active = i === open;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOpen(i)}
                      aria-label={(isRTL ? "اذهب إلى الصورة " : "Go to image ") + (i + 1)}
                      aria-current={active ? "true" : undefined}
                      ref={(el) => { if (active && el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${active ? "ring-accent" : "ring-transparent hover:ring-white/40"}`}
                    >
                      <img src={t.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* FieldGalleryScroll removed to simplify archive appearance */}
    </PageLayout>
  );
};
export default Gallery;
