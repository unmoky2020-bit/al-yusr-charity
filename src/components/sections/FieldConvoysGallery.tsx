import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Camera, MapPin, ShieldCheck, Heart, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { FIELD_CONVOYS, type FieldConvoyItem } from "@/data/fieldConvoys";
import { pageImageUrl } from "@/data/pageImages";
import { usePageGallery, type PageGalleryKey } from "@/data/pageGalleries";


export type FieldConvoyVariant = "qurbani" | "farm" | "all";

/** A tile: `src` is a ready URL; `year` / `city` are "" for pictures chosen in the dashboard. */
type Item = FieldConvoyItem;

const MarqueeRow = ({
  rowItems,
  reverse,
  large,
  isAR,
  cityLabelEn,
  duration,
}: {
  rowItems: Item[];
  reverse: boolean;
  large: boolean;
  isAR: boolean;
  cityLabelEn: Record<string, string>;
  duration: number;
}) => {
  if (rowItems.length === 0) return null;
  // First, repeat the source enough times to fill the viewport even when the
  // filter narrows the set to 2–3 tiles. Then duplicate the resulting base
  // exactly once so the `translateX(-50%)` keyframe lands perfectly back on
  // the first frame — no jump, no gap, regardless of count or direction.
  const minTilesPerHalf = 8;
  const repeats = Math.max(1, Math.ceil(minTilesPerHalf / rowItems.length));
  const base = Array.from({ length: repeats }, () => rowItems).flat();
  const looped = [...base, ...base];
  // Tile sizing: large row is taller, second row a bit smaller for variety.
  const tile = large
    ? "h-44 w-64 sm:h-56 sm:w-80 md:h-64 md:w-[22rem]"
    : "h-32 w-48 sm:h-40 sm:w-60 md:h-48 md:w-72";
  return (
    <div dir="ltr" className="marquee-row mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ ["--marquee-duration" as any]: `${duration}s` }}
      >
        {looped.map((g, i) => (
          <Link
            key={`${g.src}-${i}`}
            to={`/programs/${g.tag === "qurbani" ? "odhya" : "box"}`}
            aria-label={(isAR ? "افتح الصورة: " : "Open image: ") + (isAR ? g.ar : g.en)}
            className={`group relative ${tile} me-3 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary`}
          >
            <img
              src={g.src}
              alt={isAR ? g.ar : g.en}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-2.5 text-start">
              <p className="line-clamp-2 text-[11px] font-extrabold text-white sm:text-xs">
                {isAR ? g.ar : g.en}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-extrabold text-white/85">
                {g.city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                    <MapPin className="h-2.5 w-2.5" />
                    {isAR ? g.city : (cityLabelEn[g.city] || g.city)}
                  </span>
                )}
                {g.year && (
                  <span className="rounded-full bg-secondary/80 px-2 py-0.5 font-mono text-secondary-foreground">
                    {g.year}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * Field-convoy & Qurbani proof gallery shared between /farm and /qurbani.
 * Lazy images, fixed aspect to avoid CLS, ImageGallery JSON-LD,
 * plus a lightweight city filter for Premium UX on /farm and /qurbani.
 */
export const FieldConvoysGallery = ({
  variant = "all",
  donateHref = "/donate?program=odhya",
  galleryKey,
}: {
  variant?: FieldConvoyVariant;
  donateHref?: string;
  /** Dashboard gallery (معارض صور الصفحات) that replaces the built-in photos once it has pictures. */
  galleryKey?: PageGalleryKey;
}) => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const base = "https://elyusr.org";
  const custom = usePageGallery(galleryKey);

  const variantItems = useMemo<Item[]>(() => {
    if (custom) {
      const tag = variant === "qurbani" ? "qurbani" : "convoy";
      return custom.map((g) => ({ src: g.src, ar: g.altAr, en: g.altEn, year: "", tag, city: "" }));
    }
    return FIELD_CONVOYS.filter((i) => (variant === "qurbani" ? i.tag === "qurbani" : true)).map((i) => ({ ...i, src: pageImageUrl(i.src) }));
  }, [custom, variant]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    variantItems.forEach((i) => { if (i.city) set.add(i.city); });
    return Array.from(set);
  }, [variantItems]);

  const [city, setCity] = useState<string>("all");
  const items = city === "all" ? variantItems : variantItems.filter((i) => i.city === city);

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const isOpen = openIdx !== null;
  const current = isOpen ? items[openIdx!] : null;

  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length],
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length],
  );

  // Swipe support for the lightbox on touch devices.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      // In RTL, swiping right means "previous"; flip for LTR.
      if (dx > 0) (isAR ? next() : prev());
      else (isAR ? prev() : next());
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") (isAR ? next() : prev());
      else if (e.key === "ArrowRight") (isAR ? prev() : next());
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isAR, prev, next, close]);

  // Reset open index if filter changes while lightbox is open
  useEffect(() => { setOpenIdx(null); }, [city]);

  const cityLabelEn: Record<string, string> = {
    "المنصورة": "Mansoura",
    "الدقهلية": "Dakahlia",
    "كفر الشيخ": "Kafr El-Sheikh",
  };

  const heading =
    variant === "qurbani"
      ? isAR
        ? "توثيق صكوك الأضحية — صور من مواسم 2024 و2025 ومن قوافل اليسر"
        : "Qurbani voucher proof — photos from 2024, 2025 & Al-Yusr convoys"
      : isAR
        ? "صور حقيقية من مزرعة اليسر وقوافل التوزيع بالدقهلية"
        : "Real photos from Al-Yusr endowment farm and Dakahlia distribution convoys";

  return (
    <section className="bg-background py-14 md:py-20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: heading,
          about: isAR ? "صك أضحية وقوافل اليسر بالدقهلية" : "Qurbani share & Al-Yusr Dakahlia convoys",
          image: variantItems.map((i) => ({
            "@type": "ImageObject",
            contentUrl: i.src.startsWith("http") ? i.src : `${base}${i.src}`,
            caption: isAR ? i.ar : i.en,
            ...(i.city ? { contentLocation: { "@type": "Place", name: isAR ? i.city : (cityLabelEn[i.city] || i.city) } } : {}),
            creditText: "Al-Yusr Charity Foundation",
            copyrightNotice: "© Al-Yusr Charity Foundation",
            creator: { "@type": "Organization", name: "Al-Yusr Charity Foundation", url: "https://elyusr.org/" },
            license: `${base}/terms`,
            acquireLicensePage: `${base}/contact`,
          })),
        })}</script>
      </Helmet>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent">
            <Camera className="h-3.5 w-3.5" />
            {isAR ? "أرشيف المواسم السابقة" : "Previous seasons archive"}
          </span>
          <span className="mt-3 block text-sm font-extrabold text-primary">
            {isAR ? "صور أخرى من الميدان — اضغط على الصورة لزيارة البرنامج المسؤول عنها" : "More field photos - select a card to visit its related program"}
          </span>
          <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">{heading}</h2>
          <p className="mt-3 text-muted-foreground">
            {isAR
              ? "صور من قلب الميدان — موسم الأضحى 2024 و2025 وقوافل الإغاثة 2026 — نوثّق كل صك بالصور والفيديو ونرسلها إلى المتبرع مع الحفاظ على كرامة الأسرة."
              : "Straight from the field — Qurbani 2024, 2025 and 2026 relief convoys. Every voucher is documented and shared with the donor while preserving family dignity."}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] font-extrabold">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-primary"><ShieldCheck className="h-3 w-3" />{isAR ? "ذبح شرعي بإشراف بيطري" : "Sharia + vet supervision"}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-primary"><MapPin className="h-3 w-3" />{isAR ? "الدقهلية وكفر الشيخ" : "Dakahlia & Kafr El-Sheikh"}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-primary"><Camera className="h-3 w-3" />{isAR ? "توثيق صور وفيديو" : "Photo & video proof"}</span>
          </div>
        </div>

        {cities.length > 1 && (
          <div
            role="tablist"
            aria-label={isAR ? "تصفية حسب المدينة" : "Filter by city"}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {[{ id: "all", label: isAR ? "كل المدن" : "All cities" } as const,
              ...cities.map((c) => ({ id: c, label: isAR ? c : (cityLabelEn[c] || c) }))].map((c) => {
              const active = city === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCity(c.id)}
                  className={
                    "rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition " +
                    (active
                      ? "border-secondary bg-secondary text-secondary-foreground shadow-soft"
                      : "border-border bg-card text-primary hover:border-secondary/60 hover:bg-secondary/10")
                  }
                >
                  <MapPin className="me-1 inline h-3 w-3" />{c.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Dual auto-scrolling marquees: top row (large) drifts one way,
            bottom row (smaller) drifts the opposite way. Pauses on hover.
            Tracks duplicate the list so the loop is seamless. Click any
            tile to open the lightbox. */}
        <MarqueeRow
          rowItems={items.slice(0, Math.ceil(items.length / 2))}
          reverse={false}
          large
          isAR={isAR}
          cityLabelEn={cityLabelEn}
          duration={items.length > 6 ? 70 : 50}
        />
        <div className="mt-3">
          <MarqueeRow
            rowItems={items.slice(Math.ceil(items.length / 2))}
            reverse
            large={false}
            isAR={isAR}
            cityLabelEn={cityLabelEn}
            duration={items.length > 6 ? 60 : 45}
          />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/gallery">{isAR ? "معرض الصور كاملًا" : "Full gallery"}</Link>
          </Button>
          <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
            <Link to="/farm"><Heart className="h-4 w-4" />{isAR ? "ادعم المزرعة الوقفية" : "Support the endowment farm"}</Link>
          </Button>
        </div>
      </div>

      {isOpen && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isAR ? "عارض الصور" : "Image viewer"}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 sm:grid sm:place-items-center sm:p-4"
          style={{ height: "100dvh" }}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative flex h-full w-full flex-col sm:h-auto sm:max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label={isAR ? "إغلاق" : "Close"}
              className="absolute end-2 top-2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:-top-4 sm:end-0"
            >
              <X className="h-5 w-5" />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label={isAR ? "السابق" : "Previous"}
                  className="absolute start-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
                >
                  {isAR ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label={isAR ? "التالي" : "Next"}
                  className="absolute end-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
                >
                  {isAR ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </>
            )}

            <div className="flex flex-1 items-center justify-center overflow-hidden px-2 pt-12 pb-2 sm:flex-none sm:px-0 sm:pt-0 sm:pb-0">
              <img
                key={current.src}
                src={current.src}
                alt={isAR ? current.ar : current.en}
                decoding="async"
                className="mx-auto block max-h-full w-auto max-w-full animate-fade-in rounded-xl object-contain shadow-card sm:max-h-[70vh] sm:rounded-2xl"
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl bg-white/5 px-3 py-2 text-primary-foreground backdrop-blur sm:mt-3 sm:rounded-2xl">
              <p className="text-sm font-bold">
                <span className="me-2 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px]">{openIdx! + 1} / {items.length}</span>
                {isAR ? current.ar : current.en}
              </p>
              <div className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold">
                {current.city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <MapPin className="h-3 w-3" />
                    {isAR ? current.city : (cityLabelEn[current.city] || current.city)}
                  </span>
                )}
                {current.year && <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono">{current.year}</span>}
              </div>
            </div>

            {items.length > 1 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-white/5 p-2 backdrop-blur [scrollbar-width:thin]"
                aria-label={isAR ? "شريط الصور" : "Thumbnails"}
              >
                {items.map((t, i) => {
                  const active = i === openIdx;
                  return (
                    <button
                      key={t.src + i}
                      type="button"
                      onClick={() => setOpenIdx(i)}
                      aria-label={(isAR ? "اذهب إلى الصورة " : "Go to image ") + (i + 1)}
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
    </section>
  );
};

export default FieldConvoysGallery;