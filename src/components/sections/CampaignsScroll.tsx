import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, Sparkles, HeartHandshake } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useLang } from "@/i18n/LangContext";
import { programs } from "@/data/programs";
import { Button } from "@/components/ui/button";
import ctaHourglass from "@/assets/cta-hourglass-banner.jpg";
import { useCampaignsSettings, getVisibleCampaignPrograms } from "@/data/campaignsSettings";
import { recordCampaignClick, recordSectionView } from "@/lib/campaignsMetrics";

export const clampSlide = (index: number, total: number) => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
};

export const progressToSlide = (progress: number, total: number) => {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return Math.round(safeProgress * Math.max(1, total - 1));
};

export const scrollTopForSlide = (sectionTop: number, scrollRange: number, index: number, total: number) => {
  const clamped = clampSlide(index, total);
  return sectionTop + (scrollRange * clamped) / Math.max(1, total - 1);
};

export const swipeTargetSlide = (
  current: number,
  total: number,
  deltaX: number,
  deltaY: number,
  isRTL: boolean,
  threshold = 42,
) => {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX < threshold || absX < absY * 1.15) return clampSlide(current, total);

  const ltrStep = deltaX < 0 ? 1 : -1;
  const step = isRTL ? -ltrStep : ltrStep;
  return clampSlide(current + step, total);
};

/**
 * Al-Yusr campaigns — scroll-driven horizontal strip.
 * Uses framer-motion `useScroll` to translate the row as the user scrolls
 * through a tall pinned section. Fully RTL/LTR aware: in Arabic the row
 * starts from the right (x: 0%) and slides toward negative x (right→left
 * relative to RTL flow). Reduced motion = static grid fallback.
 */
export const CampaignsScroll = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const { settings } = useCampaignsSettings();
  const items = getVisibleCampaignPrograms(settings);
  const showFinalCta = settings.showFinalCta;
  const totalSlides = items.length + (showFinalCta ? 1 : 0);
  const reduce = useReducedMotion();
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    let raf = 0;
    const syncNarrow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setIsNarrow(mq.matches);
      });
    };
    syncNarrow();
    mq.addEventListener("change", syncNarrow);
    window.addEventListener("orientationchange", syncNarrow);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", syncNarrow);
      window.removeEventListener("orientationchange", syncNarrow);
    };
  }, []);
  // Shorter dwell on mobile → less pinned scroll distance → snappier feel
  // and fewer scroll-driven recomputes per second.
  // Even shorter dwell on mobile → less scroll distance, fewer scroll
  // callbacks per second. Desktop kept comfortable.
  // Shorter dwell on mobile = less pinned distance = snappier scroll and
  // fewer scroll-driven recomputes per second.
  const baseDwell = isNarrow ? 36 : 70;
  const dwellVh = Math.round(baseDwell * Math.max(0.6, Math.min(1.6, settings.scrollSpeed || 1)));
  const heightVh = Math.max(120, totalSlides * dwellVh);

  const headerTitle = settings.title?.[lang] || (isRTL
    ? "خيرك… بيوصل لحد الباب"
    : "Your kindness — delivered to the doorstep");
  const headerSubtitle = settings.subtitle?.[lang] || (isRTL
    ? "اختار حملتك وابدأ أثرك في دقايق."
    : "Pick a campaign and start your impact in minutes.");

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const swipeRef = useRef<{ x: number; y: number; slide: number; pointerId: number } | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Track the active slide for the dots indicator. Throttled by the motion
  // value subscription, so it only updates when scroll progress actually
  // changes — cheap on mobile.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = progressToSlide(v, totalSlides);
    if (activeIndexRef.current === next) return;
    activeIndexRef.current = next;
    setActiveIndex(next);
  });
  const renderRadius = 2;
  // Build the list of slides to render. We render each real slide at its
  // natural offset (i - activeIndex) AND add virtual wrap-around copies of
  // the last few slides on the "before" side when the user is near the
  // start, and the first few slides on the "after" side when near the end.
  // This avoids the empty visual gap on either side of the coverflow.
  type SlideEntry = { key: string; offset: number; kind: "item" | "cta"; realIndex: number };
  const renderEntries: SlideEntry[] = [];
  const ctaIndex = items.length; // virtual position of the final CTA card
  const total = totalSlides;
  // Helper to know whether a virtual position maps to the final-CTA slot.
  const isCtaPos = (pos: number) => showFinalCta && pos === ctaIndex;
  for (let virtual = -2; virtual < total + 2; virtual++) {
    const offset = virtual - activeIndex;
    if (Math.abs(offset) > renderRadius) continue;
    // Wrap virtual index into the real range so we know which slide to render.
    const realIndex = ((virtual % total) + total) % total;
    const kind: SlideEntry["kind"] = isCtaPos(realIndex) ? "cta" : "item";
    renderEntries.push({ key: `slide-${virtual}`, offset, kind, realIndex });
  }

  const getScrollRange = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return 0;
    return Math.max(1, s.offsetHeight - window.innerHeight);
  }, []);

  const scrollToSlide = useCallback((index: number, focus = true, behavior: ScrollBehavior = "smooth") => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return;
    const clamped = clampSlide(index, totalSlides);
    const sectionTop = s.getBoundingClientRect().top + window.scrollY;
    const top = scrollTopForSlide(sectionTop, getScrollRange(), clamped, totalSlides);
    window.scrollTo({ top, behavior });
    if (focus) requestAnimationFrame(() => cardRefs.current[clamped]?.focus({ preventScroll: true }));
  }, [getScrollRange, totalSlides]);

  const getCurrentSlide = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return 0;
    const progress = Math.max(0, Math.min(1, (window.scrollY - s.offsetTop) / getScrollRange()));
    return Math.round(progress * (totalSlides - 1));
  }, [getScrollRange, totalSlides]);

  // ── Section-level view tracking only. We don't track per-card views
  // because users must scroll through every card to advance the page, so
  // per-card view counts would always equal the section view count.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = sectionRef.current;
    if (!s) return;
    let firedSection = false;
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !firedSection) {
          firedSection = true;
          recordSectionView();
          sectionObs.disconnect();
        }
      });
    }, { threshold: 0.25 });
    sectionObs.observe(s);
    return () => { sectionObs.disconnect(); };
  }, [items, showFinalCta]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = getCurrentSlide();
    if (event.key === "ArrowRight") { event.preventDefault(); scrollToSlide(isRTL ? current - 1 : current + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); scrollToSlide(isRTL ? current + 1 : current - 1); }
    else if (event.key === "Home") { event.preventDefault(); scrollToSlide(0); }
    else if (event.key === "End") { event.preventDefault(); scrollToSlide(totalSlides - 1); }
  }, [getCurrentSlide, isRTL, scrollToSlide, totalSlides]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select")) return;
    swipeRef.current = {
      x: event.clientX,
      y: event.clientY,
      slide: activeIndexRef.current,
      pointerId: event.pointerId,
    };
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    swipeRef.current = null;
    const target = swipeTargetSlide(
      start.slide,
      totalSlides,
      event.clientX - start.x,
      event.clientY - start.y,
      isRTL,
    );
    if (target !== start.slide) {
      event.preventDefault();
      scrollToSlide(target, false);
    }
  }, [isRTL, scrollToSlide, totalSlides]);

  const handlePointerCancel = useCallback(() => {
    swipeRef.current = null;
  }, []);

  if (!settings.enabled || items.length === 0) return null;

  return (
    <section
      id="campaigns"
      className="relative z-0 isolate bg-background"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ overflowX: "clip" }}
    >
      {/* Background is a flat surface — the heavy SVG pattern was the main
          cause of jank on mobile while the coverflow scrolled. */}
      {reduce ? (
        // Reduced-motion fallback: static grid / native horizontal browsing.
        <div className="container mx-auto px-4 py-14 md:py-20">
          <Header isRTL={isRTL} title={headerTitle} subtitle={headerSubtitle} />
          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [touch-action:pan-x_pinch-zoom] md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <div key={p.slug} className="w-[86vw] max-w-[390px] shrink-0 snap-center md:w-auto md:max-w-none">
                <CampaignCard p={p} i={i} total={items.length}
                  lang={lang} isRTL={isRTL} Arrow={Arrow}
                  className="min-h-[440px]"
                  ariaPos={i + 1} ariaSize={totalSlides} />
              </div>
            ))}
            {showFinalCta && (
              <div className="w-[86vw] max-w-[390px] shrink-0 snap-center md:w-auto md:max-w-none">
                <FinalCTACard isRTL={isRTL} className="min-h-[440px]"
                  ariaPos={totalSlides} ariaSize={totalSlides} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div ref={sectionRef} className="relative" style={{ height: `${heightVh}vh` }}>
          <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-20 pb-6 sm:pt-24 sm:pb-8">
            <div className="container mx-auto shrink-0 px-4">
              <Header isRTL={isRTL} title={headerTitle} subtitle={headerSubtitle} />
            </div>
            <div
              className="relative mt-4 flex flex-1 min-h-0 items-center justify-center px-4 sm:mt-6"
              role="region"
              aria-roledescription={isRTL ? "بطاقات حملات متراكمة" : "stacked campaign cards"}
              aria-label={isRTL ? "بطاقات اليسر — مرّر عموديًا أو استخدم الأسهم للتنقل" : "Al-Yusr cards — scroll vertically or use arrows to navigate"}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onLostPointerCapture={handlePointerCancel}
              style={{ touchAction: "pan-y pinch-zoom", overscrollBehaviorX: "none" }}
            >
              {renderEntries.map((entry) => {
                // Only the "real" copy (offset matches its in-range position)
                // owns the focus ref so keyboard nav stays predictable.
                const isRealCopy = entry.offset === entry.realIndex - activeIndex;
                const refCallback = (node: HTMLElement | null) => {
                  if (isRealCopy) cardRefs.current[entry.realIndex] = node;
                };
                if (entry.kind === "cta") {
                  return (
                    <CoverflowSlide
                      key={entry.key}
                      offset={entry.offset}
                      isRTL={isRTL}
                      isNarrow={isNarrow}
                      refCallback={refCallback}
                    >
                      <FinalCTACard isRTL={isRTL} className="h-[clamp(380px,66svh,520px)] sm:h-full sm:max-h-[500px]"
                        ariaPos={totalSlides} ariaSize={totalSlides} />
                    </CoverflowSlide>
                  );
                }
                const p = items[entry.realIndex];
                if (!p) return null;
                return (
                  <CoverflowSlide
                    key={entry.key}
                    offset={entry.offset}
                    isRTL={isRTL}
                    isNarrow={isNarrow}
                    refCallback={refCallback}
                  >
                    <CampaignCard p={p} i={entry.realIndex} total={items.length}
                      lang={lang} isRTL={isRTL} Arrow={Arrow}
                      className="h-[clamp(380px,66svh,520px)] sm:h-full sm:max-h-[500px]"
                      ariaPos={entry.realIndex + 1} ariaSize={totalSlides} />
                  </CoverflowSlide>
                );
              })}
            </div>
            {/* Slide indicator + subtle scroll hint */}
            <SlideIndicator
              totalSlides={totalSlides}
              activeIndex={activeIndex}
              isRTL={isRTL}
              isNarrow={isNarrow}
              onSelect={scrollToSlide}
            />
          </div>
        </div>
      )}
    </section>
  );
};

/* ── Coverflow slide ──────────────────────────────────────────────────
 * Cards only re-compute when the active slide changes, not on every scroll
 * tick. This keeps mobile scrolling light while preserving the coverflow feel.
 */
const CoverflowSlide = ({
  offset,
  isRTL,
  isNarrow,
  refCallback,
  children,
}: {
  offset: number;
  isRTL: boolean;
  isNarrow: boolean;
  refCallback: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) => {
  const reduce = useReducedMotion();
  const dir = isRTL ? -1 : 1; // visual flow direction
  // Lighter on mobile: no rotateY (avoids GPU layer + paint cost on phones),
  // tighter spacing, gentler falloff. Desktop keeps the full coverflow.
  const spacing = isNarrow ? 112 : 280;
  const tiltDeg = isNarrow ? 0 : 32;
  const scaleStep = isNarrow ? 0.04 : 0.08;
  const minScale = isNarrow ? 0.9 : 0.82;

  const sign = Math.sign(offset);
  const abs = Math.abs(offset);
  const compressed = abs <= 1 ? abs : 1 + (abs - 1) * (isNarrow ? 0.42 : 0.72);
  const x = sign * compressed * spacing * dir;
  const scale = Math.max(minScale, 1 - Math.min(abs, 3) * scaleStep);
  const clamped = Math.max(-2.2, Math.min(2.2, offset));
  const eased = Math.sign(clamped) * Math.pow(Math.abs(clamped) / 2.2, 0.85) * 2.2;
  const rotateY = -eased * tiltDeg * dir;
  const opacity = abs >= 2.5 ? 0 : abs >= 1 ? 1 - (abs - 1) * 0.22 : 1;
  const zIndex = 100 - Math.round(abs * 10);

  // Smooth, frame-stable easing (cubic-bezier approximating ease-out-quint).
  // Reduced-motion users get an instant snap with no transition.
  const transitionStyle = reduce
    ? "none"
    : `transform 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out`;

  return (
    <motion.div
      ref={refCallback as never}
      tabIndex={-1}
      style={{
        transform: `perspective(1200px) translate3d(${x.toFixed(2)}px,0,0) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        opacity,
        zIndex,
        pointerEvents: abs <= 1 ? "auto" : "none",
        transition: transitionStyle,
      }}
      className="absolute inset-y-0 left-0 right-0 mx-auto flex w-[84vw] max-w-[350px] items-center justify-center outline-none will-change-transform [contain:layout_paint_style] [transform-style:preserve-3d] [backface-visibility:hidden] sm:w-[440px] sm:max-w-[440px]"
      aria-hidden={false}
    >
      {children}
    </motion.div>
  );
};

/* ── Compact slide indicator ───────────────────────────────────────────
 * On narrow screens with many slides (e.g. 14), rendering every dot is
 * cramped and visually noisy. We show a sliding window of 7 dots with
 * subtle size scaling so the indicator stays compact and aligned.
 */
const SlideIndicator = ({
  totalSlides,
  activeIndex,
  isRTL,
  isNarrow,
  onSelect,
}: {
  totalSlides: number;
  activeIndex: number;
  isRTL: boolean;
  isNarrow: boolean;
  onSelect: (index: number) => void;
}) => {
  const maxDots = isNarrow ? 7 : Math.min(totalSlides, 14);
  const useWindow = totalSlides > maxDots;
  let start = 0;
  let end = totalSlides;
  if (useWindow) {
    const half = Math.floor(maxDots / 2);
    start = Math.max(0, Math.min(totalSlides - maxDots, activeIndex - half));
    end = start + maxDots;
  }
  const visible: number[] = [];
  for (let i = start; i < end; i++) visible.push(i);

  return (
    <div className="container mx-auto mt-2 flex shrink-0 flex-col items-center gap-1 px-4 sm:mt-3 sm:gap-1.5">
      <div
        role="tablist"
        aria-label={isRTL ? "مؤشر البطاقات" : "Slide indicator"}
        className="flex items-center gap-1"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {visible.map((i) => {
          const isActive = i === activeIndex;
          // Edge dots in the window shrink a bit so the strip feels softer
          const isEdge = useWindow && (i === start || i === end - 1) && !isActive
            && ((start > 0 && i === start) || (end < totalSlides && i === end - 1));
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={isRTL ? `الانتقال للبطاقة ${i + 1}` : `Go to slide ${i + 1}`}
              onClick={() => onSelect(i)}
              className={`rounded-full transition-all duration-300 ${isActive
                ? "h-1.5 w-4 bg-primary sm:w-5"
                : isEdge
                  ? "h-1 w-1 bg-primary/20 hover:bg-primary/40"
                  : "h-1.5 w-1.5 bg-primary/25 hover:bg-primary/45"
                }`}
            />
          );
        })}
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground/70 sm:text-[11.5px]">
        <bdi>{activeIndex + 1}</bdi>
        <span className="mx-0.5 opacity-60">/</span>
        <bdi>{totalSlides}</bdi>

      </p>
    </div>
  );
};

const Header = ({ isRTL, title, subtitle }: { isRTL: boolean; title?: string; subtitle?: string }) => (
  <header className="mx-auto max-w-3xl px-1 text-center">
    <h2 className="text-[26px] font-black leading-[1.15] text-primary sm:text-3xl md:text-4xl lg:text-5xl">
      <span className="hand-underline">
        {title ?? (isRTL ? "حملات تصنع الأثر" : "Campaigns that make impact")}
      </span>
    </h2>
    <p className="mx-auto mt-2.5 max-w-[40ch] text-[13px] font-medium leading-relaxed text-muted-foreground/90 sm:mt-3.5 sm:max-w-[54ch] sm:text-[15px] sm:leading-7">
      {subtitle ?? (isRTL
        ? "اختار حملة قريبة من قلبك… وخلي خيرك يوصل بهدوء."
        : "Pick a cause close to your heart — let your kindness arrive quietly.")}
    </p>
  </header>
);

export default CampaignsScroll;

/* ── Card component ───────────────────────────────────────────────────── */
type CardProps = {
  p: (typeof programs)[number];
  i: number;
  total: number;
  lang: "ar" | "en";
  isRTL: boolean;
  Arrow: typeof ArrowLeft;
  className?: string;
  style?: React.CSSProperties;
  ariaPos?: number;
  ariaSize?: number;
};

const CampaignCard = ({ p, i, total, lang, isRTL, Arrow, className = "", style, ariaPos, ariaSize }: CardProps) => (
  <article
    data-stack-card
    data-campaign-card
    dir={isRTL ? "rtl" : "ltr"}
    style={style}
    role={ariaPos ? "group" : undefined}
    aria-roledescription={ariaPos ? (isRTL ? "شريحة" : "slide") : undefined}
    aria-label={ariaPos && ariaSize ? `${ariaPos} / ${ariaSize}` : undefined}
    className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-primary/10 bg-card shadow-[0_14px_36px_-22px_hsl(var(--primary)/0.35)] ring-1 ring-border/50 sm:rounded-[1.75rem] ${className}`}
  >
    {/* Image area */}
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <img
        data-campaign-image
        src={p.image}
        alt={p[lang].name}
        loading="lazy"
        decoding="async"
        width={920}
        height={1150}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/55 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />

      {/* Index chip — bdi keeps the digits/slash visually ordered in RTL */}
      <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-black text-primary ring-1 ring-primary/10">
        <bdi>{String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</bdi>
      </span>

      {/* Price chip */}
      {p.priceFrom > 0 && (
        <span className="absolute end-3 top-3 rounded-full bg-orange-grad px-3 py-1 text-[10.5px] font-black text-accent-foreground shadow-cta ring-1 ring-accent-foreground/15 sm:text-[11px]">
          {isRTL ? `من ${p.priceFrom.toLocaleString("ar-EG")} ج` : `From ${p.priceFrom} EGP`}
        </span>
      )}

      {/* Title block over image — consistent margins + line-height across breakpoints */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 text-primary-foreground sm:gap-2 sm:p-5">
        <h3
          className="text-[16px] font-black leading-[1.3] tracking-tight [text-wrap:balance] line-clamp-2 sm:text-[22px] sm:leading-[1.25]"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
        >
          {p[lang].name}
        </h3>
        <p className="text-[11.5px] font-semibold leading-[1.55] text-primary-foreground/90 line-clamp-2 sm:text-[13px] sm:leading-[1.55]">
          {p[lang].tagline}
        </p>
      </div>
    </div>

    {/* Footer / CTAs */}
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border/60 bg-card px-4 py-3 sm:p-4">
      <Link
        to={`/programs/${p.slug}`}
        onClick={() => recordCampaignClick(p.slug, "details_click")}
        className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-primary transition-colors hover:text-accent sm:text-sm"
      >
        {isRTL ? "تفاصيل البرنامج" : "Program details"}
        <Arrow className="h-3.5 w-3.5" />
      </Link>
      {p.priceFrom > 0 ? (
        <Button
          asChild
          size="sm"
          className="h-9 bg-orange-grad px-3.5 text-[11.5px] font-extrabold text-accent-foreground shadow-cta hover:opacity-95 sm:h-10 sm:px-4 sm:text-sm"
        >
          <Link to={`/donate?program=${p.slug}`} onClick={() => recordCampaignClick(p.slug, "donate_click")}>
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isRTL ? "تبرع الآن" : "Donate"}
          </Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline" className="h-9 px-3.5 text-[11.5px] sm:h-10 sm:px-4 sm:text-sm">
          <Link to="/register/volunteer" onClick={() => recordCampaignClick(p.slug, "details_click")}>{isRTL ? "تطوع معنا" : "Volunteer"}</Link>
        </Button>
      )}
    </div>
  </article>
);

/* ── Final CTA card ───────────────────────────────────────────────────── */
const FinalCTACard = ({
  isRTL,
  className = "",
  style,
  ariaPos,
  ariaSize,
}: {
  isRTL: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaPos?: number;
  ariaSize?: number;
}) => (
  <article
    data-stack-card
    data-final-cta
    dir={isRTL ? "rtl" : "ltr"}
    style={style}
    role={ariaPos ? "group" : undefined}
    aria-roledescription={ariaPos ? (isRTL ? "شريحة" : "slide") : undefined}
    aria-label={ariaPos && ariaSize ? `${ariaPos} / ${ariaSize}` : undefined}
    className={`relative flex flex-col overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground shadow-card ring-1 ring-secondary/40 will-change-transform [transform-style:preserve-3d] ${className}`}
  >
    {/* Decorative hourglass background */}
    <img
      src={ctaHourglass}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width={1280}
      height={800}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-screen"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/30"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.28),transparent_60%)]"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
    />

    {/* Content */}
    <div className="relative flex flex-1 flex-col items-center justify-center p-7 text-center sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-primary-foreground/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
        <Sparkles className="h-3 w-3" />
        {isRTL ? "ابدأ رحلتك" : "Start your journey"}
      </span>

      <h3 className="mt-4 text-2xl font-black leading-[1.2] sm:text-[1.75rem]">
        {isRTL ? "تبرعك النهارده يصنع الفرق" : "Your gift today makes a difference"}
      </h3>
      <p className="mt-2.5 max-w-[28ch] text-sm font-semibold text-primary-foreground/85 sm:text-base">
        {isRTL
          ? "اختر حملتك وابدأ أثرك مع اليسر — سريع، آمن، وموثّق."
          : "Pick your campaign and start your impact — fast, secure, documented."}
      </p>

      <div className="mt-5 flex w-full max-w-sm flex-row flex-nowrap items-stretch justify-center gap-2">
        <Button
          asChild
          size="sm"
          className="h-11 flex-1 min-w-0 bg-orange-grad px-3 text-[12px] font-extrabold text-accent-foreground shadow-cta hover:opacity-95 sm:text-sm"
        >
          <Link to="/donate" onClick={() => recordCampaignClick("__cta__", "donate_click")}>
            <Heart className="h-4 w-4" />
            {isRTL ? "ابدأ التبرع الآن" : "Start donating"}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-11 flex-1 min-w-0 border-secondary/50 bg-primary-foreground/5 px-3 text-[12px] font-extrabold text-primary-foreground hover:bg-secondary/15 sm:text-sm"
        >
          <Link to="/projects" onClick={() => recordCampaignClick("__cta__", "details_click")}>
            <HeartHandshake className="h-4 w-4" />
            {isRTL ? "تصفح كل الحملات" : "Browse all campaigns"}
          </Link>
        </Button>
      </div>

      <p className="mt-4 text-[11px] font-bold text-primary-foreground/65">
        {isRTL ? "دفع آمن • تأكيد فوري • إيصال رسمي" : "Secure payment • Instant confirmation • Official receipt"}
      </p>
    </div>
  </article>
);