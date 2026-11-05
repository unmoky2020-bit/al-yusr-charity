import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Heart, Sparkles, HeartHandshake } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useLang } from "@/i18n/LangContext";
import { programs } from "@/data/programs";
import { Button } from "@/components/ui/button";
import ctaHourglass from "@/assets/cta-hourglass-banner.jpg";
import { useCampaignsSettings, getVisibleCampaignPrograms } from "@/data/campaignsSettings";
import { formatServerImageUrl } from "@/data/laravelApi";
import { recordCampaignClick, recordSectionView } from "@/lib/campaignsMetrics";
import { DONATION_ENTITIES } from "@/data/donationEntities";

export const clampSlide = (index: number, total: number) => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
};

export const progressToSlide = (progress: number, total: number) => {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return Math.round(safeProgress * Math.max(1, total - 1));
};

/**
 * Slide for a scroll progress (0–1) over `total` equal zones, with hysteresis: near the border between
 * the current slide's zone and a neighbour (within `margin` of a zone), the current slide is kept.
 * Stops the active card from flickering back and forth when iOS momentum / rubber-banding wobbles the
 * scroll position around a zone edge.
 */
export const slideForProgress = (progress: number, total: number, current: number, margin = 0.12) => {
  if (total <= 1) return 0;
  const raw = Math.max(0, Math.min(1, progress)) * total; // position in "zones"
  const next = Math.min(total - 1, Math.floor(raw));
  if (next === current) return current;
  // Distance (in zones) from the edge of the current zone.
  const beyond = next > current ? raw - (current + 1) : current - raw;
  return Math.abs(next - current) === 1 && beyond < margin ? current : next;
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
 * Dynamically computes optimal 3D Coverflow card spacing so the carousel
 * expands horizontally to match the site's max-w-7xl header bounds without dead margins.
 */
const useResponsiveSpacing = () => {
  const [spacing, setSpacing] = useState(() => {
    if (typeof window === "undefined") return 218;
    const w = window.innerWidth;
    if (w < 480) return 108;
    if (w < 640) return 135;
    if (w < 768) return 165;
    if (w < 1024) return 185;
    if (w < 1280) return 202;
    return 218;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth;
        let s = 218;
        if (w < 480) s = 108;
        else if (w < 640) s = 135;
        else if (w < 768) s = 165;
        else if (w < 1024) s = 185;
        else if (w < 1280) s = 202;
        else s = 218;
        setSpacing(s);
      });
    };
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return spacing;
};

export const CampaignsScroll = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const { settings } = useCampaignsSettings();
  const items = useMemo(() => getVisibleCampaignPrograms(settings), [settings]);
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
  // Calibrated dwell: responsive per-slide scroll distance so pinned scroll
  // tracks smoothly without excessive white space or dragging on forever.
  const stepVh = isNarrow ? 36 : 48;
  const speedMultiplier = Math.max(0.7, Math.min(1.4, settings.scrollSpeed || 1));
  const heightVh = Math.round(100 + Math.max(1, totalSlides - 1) * stepVh * speedMultiplier);
  const spacing = useResponsiveSpacing();

  const headerTitle = settings.title?.[lang] || (isRTL
    ? "خيرك… يصل إلى باب البيت"
    : "Your kindness — delivered to the doorstep");
  const headerSubtitle = settings.subtitle?.[lang] || (isRTL
    ? "اختر حملتك وابدأ أثرك في دقائق."
    : "Pick a campaign and start your impact in minutes.");

  const sectionRef = useRef<HTMLDivElement | null>(null);
  /** The sticky (pinned) viewport. Its height is 100svh, which iOS Safari keeps constant while the
   *  address bar shows/hides — unlike window.innerHeight, which changes mid-scroll. */
  const pinRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const swipeRef = useRef<{ x: number; y: number; slide: number; pointerId: number } | null>(null);

  // ── Native scroll listener for reliable cross-browser scroll tracking ──
  // Framer Motion's useScroll + useMotionValueEvent can miss updates in
  // Firefox's async scroll model. Using a passive native listener gives us
  // direct access to window.scrollY at the right time.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const enableScrollTrigger = settings.enableScrollTrigger !== false;

  const isProgrammaticScrollRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const lockStartRef = useRef(0);
  /** Recomputes the active slide from the real scroll position (set by the scroll effect). */
  const syncFromScrollRef = useRef<() => void>(() => {});

  /** Scroll distance while pinned: track height − pinned viewport height. Both are svh-based, so the
   *  value does not change when the iOS toolbar collapses or expands. */
  /** Cached: re-measured only when the track or pinned viewport really changes size (ResizeObserver),
   *  so a scroll frame only reads the track's position. */
  const rangeRef = useRef(0);
  const measureRange = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return 1;
    const pinH = pinRef.current?.offsetHeight || window.innerHeight;
    rangeRef.current = Math.max(1, s.offsetHeight - pinH);
    return rangeRef.current;
  }, []);
  const getScrollRange = useCallback(() => rangeRef.current || measureRange(), [measureRange]);

  /** True while the section fully covers the screen (the cards are pinned). */
  const isInPinnedRange = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return false;
    const rect = s.getBoundingClientRect();
    const pinH = pinRef.current?.offsetHeight || window.innerHeight;
    return rect.top <= 2 && rect.bottom >= pinH - 2;
  }, []);
  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: none) and (pointer: coarse)").matches,
    [],
  );

  const releaseLock = useCallback(() => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
    if (!isProgrammaticScrollRef.current) return;
    isProgrammaticScrollRef.current = false;
    syncFromScrollRef.current();
  }, []);

  useEffect(() => {
    if (!enableScrollTrigger || reduce || typeof window === "undefined") return;
    let raf = 0;
    const compute = () => {
      const s = sectionRef.current;
      if (!s) return;
      const scrolled = -s.getBoundingClientRect().top;
      if (scrolled <= 0) {
        if (activeIndexRef.current !== 0) {
          activeIndexRef.current = 0;
          setActiveIndex(0);
        }
        return;
      }
      const next = slideForProgress(scrolled / getScrollRange(), totalSlides, activeIndexRef.current);
      if (activeIndexRef.current !== next) {
        activeIndexRef.current = next;
        setActiveIndex(next);
      }
    };
    syncFromScrollRef.current = compute;

    // ── iOS: fixed instead of sticky while fully pinned ──
    // WebKit re-positions a sticky box every scroll frame and rounds it ±1px differently from the
    // page, which shows as a constant tremor of the whole pinned section on iPhone (measured on a
    // screen recording: ±1px every frame while scrolling, 0 when the finger stops). A fixed box is
    // composited against the screen and does not move. The switch happens only when entering and
    // leaving the fully-pinned range, where sticky and fixed sit at the same place, so it is seamless.
    // Touch devices only (desktop sticky is smooth); disabled for good if fixed lands anywhere else.
    const pinAtMount = pinRef.current;
    let fixedPin = isTouchDevice;
    let isFixed = false;
    let verified = false;
    const updatePin = () => {
      const s = sectionRef.current;
      const pin = pinRef.current;
      if (!fixedPin || !s || !pin) return;
      const rect = s.getBoundingClientRect();
      const pinH = pin.offsetHeight || window.innerHeight;
      const want = rect.top <= 0 && rect.bottom >= pinH;
      if (want === isFixed) return;
      isFixed = want;
      pin.classList.toggle("cs-pin--fixed", want);
      if (want && !verified) {
        verified = true;
        // Safety net: an ancestor with a transform would make "fixed" relative to it, not the screen.
        if (Math.abs(pin.getBoundingClientRect().top) > 2) {
          fixedPin = false;
          isFixed = false;
          pin.classList.remove("cs-pin--fixed");
        }
      }
    };
    measureRange();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => { measureRange(); });
      if (sectionRef.current) ro.observe(sectionRef.current);
      if (pinRef.current) ro.observe(pinRef.current);
    }
    const onScroll = () => {
      updatePin(); // synchronous: the pin state must follow every frame, also during programmatic scrolls
      if (isProgrammaticScrollRef.current) {
        // A programmatic (smooth) scroll is running: wait until it has really stopped — iOS can
        // take well over a second for long distances — instead of a fixed timeout.
        if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(releaseLock, 140);
        if (performance.now() - lockStartRef.current > 3000) releaseLock();
        return;
      }
      cancelAnimationFrame(raf);
      // Re-checked in the frame: a programmatic scroll may have started since (e.g. touch paging).
      raf = requestAnimationFrame(() => { if (!isProgrammaticScrollRef.current) compute(); });
    };
    // The visitor takes over (touch / wheel) → stop waiting for the programmatic scroll.
    const onUserInput = (e: Event) => {
      if (!isProgrammaticScrollRef.current) return;
      if (e.type === "touchstart" && isTouchDevice && isInPinnedRange()) return; // touch paging takes over
      releaseLock();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => { measureRange(); onScroll(); };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("touchstart", onUserInput, { passive: true });
    window.addEventListener("wheel", onUserInput, { passive: true });
    compute();
    updatePin();
    return () => {
      pinAtMount?.classList.remove("cs-pin--fixed");
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onUserInput);
      window.removeEventListener("wheel", onUserInput);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      ro?.disconnect();
    };
  }, [enableScrollTrigger, reduce, totalSlides, getScrollRange, measureRange, releaseLock, isTouchDevice, isInPinnedRange]);

  // On desktop show 5 cards (radius 2), on mobile 3 (radius 1)
  const renderRadius = isNarrow ? 1 : 2;
  type SlideEntry = { key: string; offset: number; kind: "item" | "cta"; realIndex: number };
  const renderEntries: SlideEntry[] = [];
  const ctaIndex = items.length; // virtual position of the final CTA card
  const total = totalSlides;
  // Helper to know whether a virtual position maps to the final-CTA slot.
  const isCtaPos = (pos: number) => showFinalCta && pos === ctaIndex;
  // Continuous loop: wraps around so both sides are always populated symmetrically without blank spaces
  for (let virtual = activeIndex - renderRadius - 1; virtual <= activeIndex + renderRadius + 1; virtual++) {
    const offset = virtual - activeIndex;
    if (Math.abs(offset) > renderRadius) continue;
    const realIndex = ((virtual % total) + total) % total;
    const kind: SlideEntry["kind"] = isCtaPos(realIndex) ? "cta" : "item";
    renderEntries.push({ key: `slide-${virtual}`, offset, kind, realIndex });
  }

  const scrollToSlide = useCallback((index: number, focus = true, behavior: ScrollBehavior = "smooth") => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return;
    const clamped = clampSlide(index, totalSlides);

    // Ignore scroll-derived updates until this programmatic scroll has settled (see onScroll).
    isProgrammaticScrollRef.current = true;
    lockStartRef.current = performance.now();
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    // Released by the first quiet period after the last scroll event; this also covers the case
    // where no scroll event fires at all (already at the target).
    settleTimerRef.current = window.setTimeout(releaseLock, 250);

    setActiveIndex(clamped);
    activeIndexRef.current = clamped;

    const scrollRange = getScrollRange();
    const docTop = s.getBoundingClientRect().top + window.scrollY;
    // Scroll directly to the midpoint of the slide's active zone
    const targetProgress = (clamped + 0.5) / totalSlides;
    const top = docTop + scrollRange * Math.min(1, targetProgress);
    try {
      window.scrollTo({ top, behavior });
    } catch { /* older browsers: no smooth scrolling */ }

    if (focus) requestAnimationFrame(() => cardRefs.current[clamped]?.focus({ preventScroll: true }));
  }, [totalSlides, getScrollRange, releaseLock]);

  // ── Touch paging: one swipe = one card ──
  // On phones a single flick scrolled far enough (with iOS momentum) to run through every card at
  // once. Inside the fully-pinned range a vertical swipe now moves exactly one card (smooth
  // programmatic scroll to that card); a swipe past the last / before the first card leaves the
  // section; momentum or a drag that carries the page into the section settles on the first (from
  // above) or last (from below) card instead of running through them. Taps and horizontal swipes
  // are untouched. Touch devices only; desktop wheel/trackpad keep the continuous scroll.
  const scrollToSlideRef = useRef(scrollToSlide);
  scrollToSlideRef.current = scrollToSlide;
  useEffect(() => {
    if (!enableScrollTrigger || reduce || !isTouchDevice || typeof window === "undefined") return;
    type Gesture = { x: number; y: number; decided: boolean; vertical: boolean };
    let gesture: Gesture | null = null;
    let touching = false;
    let wasIn = isInPinnedRange();
    let lastY = window.scrollY;
    const go = (index: number) => scrollToSlideRef.current(index, false);
    const leave = (dir: 1 | -1) => {
      const s = sectionRef.current;
      if (!s) return;
      const pinH = pinRef.current?.offsetHeight || window.innerHeight;
      const docTop = s.getBoundingClientRect().top + window.scrollY;
      const top = dir > 0 ? docTop + getScrollRange() + pinH * 0.6 : docTop - pinH * 0.6;
      try { window.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); } catch { window.scrollTo(0, Math.max(0, top)); }
    };
    const point = (e: TouchEvent, changed = false) => (changed ? e.changedTouches : e.touches)[0];
    const onStart = (e: TouchEvent) => {
      touching = true;
      if (e.touches.length !== 1 || !isInPinnedRange()) { gesture = null; return; }
      const t = point(e);
      gesture = { x: t.clientX, y: t.clientY, decided: false, vertical: false };
    };
    const onMove = (e: TouchEvent) => {
      if (!gesture || e.touches.length !== 1) return;
      const t = point(e);
      const dx = t.clientX - gesture.x;
      const dy = t.clientY - gesture.y;
      if (!gesture.decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        gesture.decided = true;
        gesture.vertical = Math.abs(dy) > Math.abs(dx);
      }
      // Vertical swipe inside the pinned section: no native scroll (and no momentum) — we page instead.
      if (gesture.vertical && e.cancelable) e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      touching = e.touches.length > 0;
      const g = gesture;
      gesture = null;
      if (g?.vertical) {
        const t = point(e, true);
        const dy = t ? t.clientY - g.y : 0;
        if (Math.abs(dy) < 24) { go(activeIndexRef.current); return; } // too short: stay on this card
        const target = activeIndexRef.current + (dy < 0 ? 1 : -1); // finger up → next card
        if (target < 0) leave(-1);
        else if (target >= totalSlides) leave(1);
        else go(target);
        return;
      }
      // A drag that started outside the section and was released inside it: settle on a card.
      if (!g && !touching && isInPinnedRange() && !isProgrammaticScrollRef.current) go(activeIndexRef.current);
    };
    const onScroll = () => {
      const now = isInPinnedRange();
      if (now && !wasIn && !touching && !isProgrammaticScrollRef.current) {
        // Momentum carried the page into the section: stop on the first card (coming from above)
        // or the last one (coming from below) instead of running through all of them.
        const fromAbove = window.scrollY >= lastY; // moving down → entered from above
        go(fromAbove ? 0 : totalSlides - 1);
      }
      wasIn = now;
      lastY = window.scrollY;
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enableScrollTrigger, reduce, isTouchDevice, totalSlides, getScrollRange, isInPinnedRange]);

  const getCurrentSlide = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return 0;
    const progress = Math.max(0, Math.min(1, -s.getBoundingClientRect().top / getScrollRange()));
    return Math.min(totalSlides - 1, Math.floor(progress * totalSlides));
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

  /** Smoothly scrolls past the pinned section — used by the Skip button. */
  const handleSkip = useCallback(() => {
    const s = sectionRef.current;
    if (!s || typeof window === "undefined") return;
    const bottom = s.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom + 8, behavior: "smooth" });
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const showSkipButton = enableScrollTrigger && settings.showSkipButton !== false;

  if (!mounted) {
    return (
      <section id="campaigns" className="relative z-0 isolate bg-background py-16 px-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto flex flex-col items-center text-center">
          <div className="h-6 w-32 rounded-full bg-primary/10 animate-pulse mb-3" />
          <div className="h-9 w-64 sm:w-96 rounded-xl bg-primary/15 animate-pulse mb-2" />
          <div className="h-4 w-48 sm:w-72 rounded bg-muted animate-pulse mb-10" />

          {/* 3 stacked skeleton cards matching coverflow 3D perspective */}
          <div className="relative flex h-[480px] w-full max-w-4xl items-center justify-center">
            {/* Left Card */}
            <div className="hidden sm:block absolute start-12 h-[420px] w-[260px] rounded-3xl bg-slate-800/40 border border-white/5 animate-pulse scale-90 -rotate-6 opacity-40" />
            {/* Center Card */}
            <div className="relative z-10 h-[480px] w-[300px] sm:w-[350px] rounded-3xl bg-slate-800/80 border border-white/10 animate-pulse p-5 flex flex-col justify-end shadow-2xl">
              <div className="absolute top-4 start-4 h-6 w-16 rounded-full bg-white/15" />
              <div className="absolute top-4 end-4 h-6 w-20 rounded-full bg-orange-500/30" />
              <div className="space-y-2.5">
                <div className="h-6 w-3/4 rounded-lg bg-white/20" />
                <div className="h-4 w-full rounded-md bg-white/10" />
                <div className="h-4 w-2/3 rounded-md bg-white/10" />
                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <div className="h-4 w-20 rounded bg-white/20" />
                  <div className="h-9 w-24 rounded-xl bg-orange-500/40" />
                </div>
              </div>
            </div>
            {/* Right Card */}
            <div className="hidden sm:block absolute end-12 h-[420px] w-[260px] rounded-3xl bg-slate-800/40 border border-white/5 animate-pulse scale-90 rotate-6 opacity-40" />
          </div>
        </div>
      </section>
    );
  }

  if (!settings.enabled || items.length === 0) return null;

  return (
    <section
      id="campaigns"
      className="relative z-0 isolate bg-background [overflow-x:clip]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background is a flat surface — the heavy SVG pattern was the main
          cause of jank on mobile while the coverflow scrolled. */}
      {reduce || !enableScrollTrigger ? (
        // ── Autoplay carousel (reduce-motion OR ScrollTrigger disabled) ──
        <AutoplayCampaigns
          items={items}
          showFinalCta={showFinalCta}
          totalSlides={totalSlides}
          isRTL={isRTL}
          lang={lang}
          Arrow={Arrow}
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          isNarrow={isNarrow}
          spacing={spacing}
          scrollSpeed={settings.scrollSpeed}
        />
      ) : (
        <div ref={sectionRef} className="cs-track relative" style={{ ["--cs-n" as string]: heightVh / 100 }}>
          <div ref={pinRef} className="cs-pin sticky top-0 flex flex-col items-center justify-center overflow-visible pt-20 pb-0 sm:pt-20 sm:pb-2 md:pt-24 md:pb-4 px-2 sm:px-4 lg:px-8">
            {/* Unified vertical group — balanced spacing between Header, Cards, and Indicator */}
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 w-full max-w-7xl px-2 sm:px-4 lg:px-8 shrink-0 my-auto">
              <Header isRTL={isRTL} title={headerTitle} subtitle={headerSubtitle} />

              {/* Card height never exceeds the room left in the pinned viewport (padding + header + dots + skip),
                  so the skip button stays on screen on short laptop screens (e.g. 1366x768). */}
              <div
                className="relative flex h-[clamp(340px,min(57svh,calc(100svh_-_215px)),500px)] sm:h-[clamp(360px,min(61svh,calc(100svh_-_230px)),560px)] md:h-[clamp(380px,min(64svh,calc(100svh_-_255px)),620px)] w-full items-center justify-center shrink-0 overflow-visible"
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
                        spacing={spacing}
                        refCallback={refCallback}
                      >
                      <FinalCTACard isRTL={isRTL} className="h-full w-full"
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
                      spacing={spacing}
                      refCallback={refCallback}
                    >
                      <CampaignCard p={p} i={entry.realIndex} total={items.length}
                        lang={lang} isRTL={isRTL} Arrow={Arrow}
                        className="h-full w-full"
                        ariaPos={entry.realIndex + 1} ariaSize={totalSlides} />
                    </CoverflowSlide>
                  );
                })}

                {/* Prev / Next navigation arrow buttons — positioned to frame the 7xl container edges */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-[120] mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6">
                  <div className="relative flex w-full items-center justify-between" dir="ltr">
                    {/* Physical Left Button: in RTL goes to Next slide, in LTR goes to Prev slide */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const target = isRTL ? (activeIndex + 1) % totalSlides : (activeIndex - 1 + totalSlides) % totalSlides;
                        scrollToSlide(target);
                      }}
                      aria-label={isRTL ? "البطاقة التالية" : "Previous slide"}
                      className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-primary border border-border/80 shadow-xl transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-110 hover:border-secondary hover:text-secondary active:scale-95 cursor-pointer ring-1 ring-black/5"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>

                    {/* Physical Right Button: in RTL goes to Prev slide, in LTR goes to Next slide */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const target = isRTL ? (activeIndex - 1 + totalSlides) % totalSlides : (activeIndex + 1) % totalSlides;
                        scrollToSlide(target);
                      }}
                      aria-label={isRTL ? "البطاقة السابقة" : "Next slide"}
                      className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-primary border border-border/80 shadow-xl transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-110 hover:border-secondary hover:text-secondary active:scale-95 cursor-pointer ring-1 ring-black/5"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slide indicator + optional skip button — balanced spacing below card */}
              <div className="mt-1.5 sm:mt-2.5 flex flex-col items-center">
                <SlideIndicator
                  totalSlides={totalSlides}
                  activeIndex={activeIndex}
                  isRTL={isRTL}
                  isNarrow={isNarrow}
                  onSelect={scrollToSlide}
                  showSkipButton={showSkipButton}
                  onSkip={handleSkip}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ── Coverflow slide ──────────────────────────────────────────────────
 * Plain div with CSS transitions (no motion.div subscription needed —
 * offset is discrete, computed from scroll progress in increments).
 * GPU composited transform only: translate3d + rotateY + scale.
 * No flickering: backface-visibility:hidden + isolation + contain.
 */
const CoverflowSlide = ({
  offset,
  isRTL,
  isNarrow,
  spacing,
  refCallback,
  children,
}: {
  offset: number;
  isRTL: boolean;
  isNarrow: boolean;
  spacing: number;
  refCallback: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) => {
  const reduce = useReducedMotion();
  const dir = isRTL ? -1 : 1;
  const scaleStep = isNarrow ? 0.08 : 0.10;
  const minScale = isNarrow ? 0.86 : 0.82;

  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  const x = sign * abs * spacing * dir;
  const scale = Math.max(minScale, 1 - abs * scaleStep);
  const zIndex = abs === 0 ? 100 : Math.max(1, 80 - Math.round(abs) * 20);

  // Pure 2D translateX + scale ONLY.
  // rotateY was the root cause of white-corner artifacts: when border-radius
  // rounded corners meet a 3D-rotated dark card, the GPU compositor exposes
  // the light section background through the curved clipping path.
  // Without rotateY, there is zero sub-pixel bleed at card corners.
  //
  // Opacity at comfortable levels — side cards stay readable, just slightly dimmer.
  const dimOpacity = abs === 0 ? 1 : abs === 1 ? 0.88 : 0.74;

  const transitionStyle = reduce
    ? "none"
    : `transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease`;

  return (
    <div
      ref={refCallback as never}
      tabIndex={-1}
      style={{
        zIndex,
        pointerEvents: abs <= 1 ? "auto" : "none",
        transform: `translateX(${x.toFixed(1)}px) scale(${scale.toFixed(3)})`,
        opacity: dimOpacity,
        transition: transitionStyle,
        // will-change:transform promotes to its own GPU layer.
        // No perspective, no rotateY, no filter = zero white-seam artifacts.
      }}
      className="absolute inset-y-0 left-0 right-0 mx-auto flex w-[84vw] max-w-[305px] items-center justify-center outline-none will-change-transform sm:w-[345px] sm:max-w-[345px] md:w-[372px] md:max-w-[372px] lg:w-[395px] lg:max-w-[395px] xl:w-[415px] xl:max-w-[415px] 2xl:w-[425px] 2xl:max-w-[425px]"
    >
      {children}
    </div>
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
  showSkipButton = false,
  onSkip,
}: {
  totalSlides: number;
  activeIndex: number;
  isRTL: boolean;
  isNarrow: boolean;
  onSelect: (index: number) => void;
  showSkipButton?: boolean;
  onSkip?: () => void;
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
    <div className="flex shrink-0 flex-col items-center justify-center gap-1.5">
      {/* Dots indicator — ABOVE the skip button */}
      <div
        role="tablist"
        aria-label={isRTL ? "مؤشر البطاقات" : "Slide indicator"}
        className="flex items-center gap-1.5"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {visible.map((i) => {
          const isActive = i === activeIndex;
          const isEdge = (useWindow && (i === start || i === end - 1) && !isActive
            && ((start > 0 && i === start) || (end < totalSlides && i === end - 1)));
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={isRTL ? `الانتقال للبطاقة ${i + 1}` : `Go to slide ${i + 1}`}
              onClick={() => onSelect(i)}
              className={`rounded-full transition-all duration-300 ${isActive
                ? "h-1.5 w-5 bg-primary sm:w-6"
                : isEdge
                  ? "h-1 w-1 bg-primary/20 hover:bg-primary/40"
                  : "h-1.5 w-1.5 bg-primary/30 hover:bg-primary/50"
                }`}
            />
          );
        })}
      </div>

      {/* Skip button — compact directly below navigation dots */}
      {showSkipButton && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          aria-label={isRTL ? "تخطي قسم الحملات" : "Skip campaigns section"}
          className="group flex items-center gap-1.5 rounded-full !bg-[#a3e635] hover:!bg-[#bbf451] px-4 py-1 text-[11px] sm:text-xs font-black !text-[#062c19] shadow-cta ring-1 ring-black/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span>{isRTL ? "تخطي" : "Skip"}</span>
          <ChevronDown className="h-3.5 w-3.5 !text-[#062c19] transition-transform duration-300 group-hover:translate-y-0.5" />
        </button>
      )}
    </div>
  );
};

const Header = ({ isRTL, title, subtitle }: { isRTL: boolean; title?: string; subtitle?: string }) => (
  <header className="mx-auto w-full px-2 text-center shrink-0">
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-primary">
      <span className="hand-underline">
        {title ?? (isRTL ? "حملات تصنع الأثر" : "Campaigns that make impact")}
      </span>
    </h2>
    <p className="mx-auto mt-0.5 sm:mt-1 max-w-[50ch] text-[11px] sm:text-xs md:text-sm font-semibold leading-relaxed text-muted-foreground">
      {subtitle ?? (isRTL
        ? "مرّر بهدوء، فكل بطاقة قصة أثر حقيقية."
        : "Scroll gently, every card is a story of real impact.")}
    </p>
  </header>
);

export default CampaignsScroll;

/* ── Autoplay Coverflow Carousel ───────────────────────────────────────
 * Renders when ScrollTrigger is disabled or reduced-motion is active.
 * Uses the exact same 3D Coverflow perspective fan layout (CoverflowSlide)
 * as the pinned mode, but without any scroll-jacking / pinned trigger.
 * Features auto-advance timer, pause-on-hover, prev/next arrows,
 * touch swipe, keyboard navigation, and the compact slide indicator.
 */
const AutoplayCampaigns = ({
  items,
  showFinalCta,
  totalSlides,
  isRTL,
  lang,
  Arrow,
  headerTitle,
  headerSubtitle,
  isNarrow,
  spacing,
  scrollSpeed,
}: {
  items: ReturnType<typeof getVisibleCampaignPrograms>;
  showFinalCta: boolean;
  totalSlides: number;
  isRTL: boolean;
  lang: "ar" | "en";
  Arrow: typeof ArrowLeft;
  headerTitle: string;
  headerSubtitle: string;
  isNarrow: boolean;
  spacing: number;
  scrollSpeed: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const swipeRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  /** Off-screen → no autoplay (no re-render of image cards while the visitor scrolls elsewhere). */
  const visibleRef = useRef(false);
  /** Autoplay waits until this time: set while the page scrolls and after any touch on the carousel,
   *  so a card never moves under the visitor's finger or competes with their scrolling. */
  const holdUntilRef = useRef(0);
  const hold = (ms: number) => { holdUntilRef.current = Math.max(holdUntilRef.current, performance.now() + ms); };

  // Interval in ms: baseline 3800ms
  const intervalMs = Math.round(3800 + (scrollSpeed - 2) * 200);

  useEffect(() => {
    const el = rootRef.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting && e.intersectionRatio > 0.35; }, { threshold: [0, 0.35, 0.6] });
      io.observe(el);
    } else {
      visibleRef.current = true;
    }
    const onScroll = () => { holdUntilRef.current = Math.max(holdUntilRef.current, performance.now() + 1200); };
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setInterval(() => {
      if (pausedRef.current || !visibleRef.current || document.hidden) return;
      if (performance.now() < holdUntilRef.current) return;
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, intervalMs);
    return () => {
      clearInterval(timer);
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [totalSlides, intervalMs]);

  const go = useCallback((next: number) => {
    // A manual move restarts the wait, so autoplay does not jump right after the visitor's choice.
    holdUntilRef.current = performance.now() + 6000;
    setActiveIndex(((next % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const prev = () => go(activeIndex - 1);
  const next = () => go(activeIndex + 1);

  // Build the list of slides to render using the same coverflow wrap-around technique
  // On desktop show 5 cards (radius 2), on mobile 3 (radius 1)
  const renderRadius = isNarrow ? 1 : 2;
  type SlideEntry = { key: string; offset: number; kind: "item" | "cta"; realIndex: number };
  const renderEntries: SlideEntry[] = [];
  const ctaIndex = items.length;
  const isCtaPos = (pos: number) => showFinalCta && pos === ctaIndex;

  for (let virtual = activeIndex - renderRadius - 1; virtual <= activeIndex + renderRadius + 1; virtual++) {
    const offset = virtual - activeIndex;
    if (Math.abs(offset) > renderRadius) continue;
    const realIndex = ((virtual % totalSlides) + totalSlides) % totalSlides;
    const kind: SlideEntry["kind"] = isCtaPos(realIndex) ? "cta" : "item";
    renderEntries.push({ key: `auto-${virtual}`, offset, kind, realIndex });
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") hold(6000);
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select")) return;
    swipeRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeRef.current || swipeRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        // Drag left: in RTL (reading right to left) or LTR, drag left pulls in the next cards
        go(isRTL ? activeIndex + 1 : activeIndex + 1);
      } else {
        // Drag right: pulls in previous cards
        go(isRTL ? activeIndex - 1 : activeIndex - 1);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(isRTL ? activeIndex - 1 : activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(isRTL ? activeIndex + 1 : activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(totalSlides - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-visible pt-20 pb-0 sm:pt-20 sm:pb-2 md:pt-24 md:pb-4 px-2 sm:px-4 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
      onTouchStart={() => hold(6000)}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; }}
    >
      <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 w-full max-w-7xl px-2 sm:px-4 lg:px-8 shrink-0 my-auto">
        <Header isRTL={isRTL} title={headerTitle} subtitle={headerSubtitle} />

        <div
          className="relative flex h-[clamp(395px,57svh,500px)] sm:h-[clamp(450px,61svh,560px)] md:h-[clamp(480px,64svh,620px)] w-full items-center justify-center shrink-0 overflow-visible"
          role="region"
          aria-roledescription={isRTL ? "بطاقات حملات متراكمة" : "stacked campaign cards"}
          aria-label={isRTL ? "بطاقات اليسر — استخدم الأسهم للتنقل" : "Al-Yusr cards — use arrows to navigate"}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { swipeRef.current = null; }}
          style={{ touchAction: "pan-y pinch-zoom", overscrollBehaviorX: "none" }}
        >
          {/* Navigation buttons — positioned to frame the 7xl container edges */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-[120] mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6">
            <div className="relative flex w-full items-center justify-between" dir="ltr">
              {/* Physical Left Navigation Button */}
              <button
                type="button"
                onClick={isRTL ? next : prev}
                aria-label={isRTL ? "البطاقة التالية" : "Previous slide"}
                className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-primary border border-border/80 shadow-xl transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-110 hover:border-secondary hover:text-secondary active:scale-95 cursor-pointer ring-1 ring-black/5"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Physical Right Navigation Button */}
              <button
                type="button"
                onClick={isRTL ? prev : next}
                aria-label={isRTL ? "البطاقة السابقة" : "Next slide"}
                className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 text-primary border border-border/80 shadow-xl transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-110 hover:border-secondary hover:text-secondary active:scale-95 cursor-pointer ring-1 ring-black/5"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Coverflow Slides */}
          {renderEntries.map((entry) => {
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
                  spacing={spacing}
                  refCallback={refCallback}
                >
                  <FinalCTACard
                    isRTL={isRTL}
                    className="h-full w-full"
                    ariaPos={totalSlides}
                    ariaSize={totalSlides}
                  />
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
                spacing={spacing}
                refCallback={refCallback}
              >
                <CampaignCard
                  p={p}
                  i={entry.realIndex}
                  total={items.length}
                  lang={lang}
                  isRTL={isRTL}
                  Arrow={Arrow}
                  className="h-full w-full"
                  ariaPos={entry.realIndex + 1}
                  ariaSize={totalSlides}
                />
              </CoverflowSlide>
            );
          })}
        </div>


        {/* Slide indicator dots with balanced spacing */}
        <div className="mt-2.5 sm:mt-3 flex flex-col items-center">
          <SlideIndicator
            totalSlides={totalSlides}
            activeIndex={activeIndex}
            isRTL={isRTL}
            isNarrow={isNarrow}
            onSelect={go}
            showSkipButton={false}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Card URL resolution helpers ─────────────────────────────────────────── */

/** Slug→entity mapping for DONATION_ENTITIES that don't share the same id as the program slug */
const SLUG_TO_ENTITY_ID: Record<string, string> = {
  // programs.ts slug → donationEntities.ts id
  odhya: "odhya",
  zakat: "general",
  meat: "monthly-meat",
  box: "monthly-meat",
  water: "water",
  education: "athar",
  bride: "ramadan",
  shelter: "shelter",
  orphans: "orphans",
  health: "medical",
  treatment: "medical",
  prosthetics: "medical",
  kitchen: "general",
  markoun: "markoun",
  ramadan: "ramadan",
  // campaign slugs that come from backend
  dhill: "dhill",
  athar: "athar",
  quran: "quran",
  takrim: "takrim",
  mosques: "mosques",
  inqadh: "inqadh",
  waqf: "waqf",
  medical: "medical",
  "monthly-sponsorship": "monthly-sponsorship",
  "monthly-meat": "monthly-meat",
};

const detectSlugFromCard = (p: any): { slug: string; type: "program" | "campaign" | "project" } => {
  const rawSlug = (p?.slug || p?.sourceId || "").replace(/^carousel-\d+$/, "").trim();
  if (rawSlug && SLUG_TO_ENTITY_ID[rawSlug]) {
    const ent = DONATION_ENTITIES.find(e => e.id === SLUG_TO_ENTITY_ID[rawSlug]);
    return { slug: SLUG_TO_ENTITY_ID[rawSlug], type: (ent?.entityType as any) || (p?.sourceType || "program") };
  }

  // 1. Try extracting slug from detailsUrl (e.g. /programs/shelter or /campaigns/dhill)
  const details = typeof p?.detailsUrl === "string" ? p.detailsUrl : "";
  const pathMatch = details.match(/\/(programs|campaigns|projects)\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) {
    const pathType = pathMatch[1] === "campaigns" ? "campaign" : pathMatch[1] === "projects" ? "project" : "program";
    const pathSlug = pathMatch[2];
    const mapped = SLUG_TO_ENTITY_ID[pathSlug] || pathSlug;
    return { slug: mapped, type: (pathType as any) };
  }

  // 2. Keyword detection from Arabic title / tagline
  const text = `${p?.name_ar || p?.title_ar || ""} ${p?.tagline_ar || p?.description_ar || ""}`.toLowerCase();
  if (text.includes("ستر") || text.includes("تسقيف") || text.includes("إيواء")) return { slug: "shelter", type: "campaign" };
  if (text.includes("مياه") || text.includes("سقيا") || text.includes("ماء")) return { slug: "water", type: "program" };
  if (text.includes("أيتام") || text.includes("يتيم")) return { slug: "orphans", type: "program" };
  if (text.includes("مركون")) return { slug: "markoun", type: "campaign" };
  if (text.includes("ظل")) return { slug: "dhill", type: "campaign" };
  if (text.includes("أثر") || text.includes("طالب علم") || text.includes("حقيبة")) return { slug: "athar", type: "campaign" };
  if (text.includes("مسجد") || text.includes("مساجد") || text.includes("إعمار")) return { slug: "mosques", type: "program" };
  if (text.includes("مزرعة") || text.includes("وقف")) return { slug: "waqf", type: "project" };
  if (text.includes("طبي") || text.includes("مجمع") || text.includes("أطراف")) return { slug: "medical", type: "project" };
  if (text.includes("أضحية") || text.includes("أضاحي") || text.includes("صك")) return { slug: "odhya", type: "campaign" };
  if (text.includes("رمضان") || text.includes("صائم") || text.includes("إفطار")) return { slug: "ramadan", type: "campaign" };
  if (text.includes("قرآن") || text.includes("تحفيظ")) return { slug: "quran", type: "program" };
  if (text.includes("تكريم") || text.includes("موتى") || text.includes("جثمان")) return { slug: "takrim", type: "program" };
  if (text.includes("إنقاذ") || text.includes("طوارئ") || text.includes("عاجلة")) return { slug: "inqadh", type: "program" };
  if (text.includes("لحوم") || text.includes("ذبائح")) return { slug: "monthly-meat", type: "program" };
  if (text.includes("كرتونة") || text.includes("غذاء شهري")) return { slug: "monthly-meat", type: "program" };
  if (text.includes("كفالة شهرية") || text.includes("رعاية أسرية")) return { slug: "monthly-sponsorship", type: "program" };
  if (text.includes("زكاة")) return { slug: "general", type: "program" };

  return { slug: rawSlug || "general", type: "program" };
};

const getCardDonateUrl = (p: any): string => {
  const custom = typeof p?.donateUrl === "string" ? p.donateUrl.trim() : "";
  // If admin set a custom URL with query params or external link, preserve it
  if (custom && custom !== "/donate" && custom !== "/donate/" && (custom.includes("?") || custom.startsWith("http"))) {
    return custom;
  }

  const { slug, type } = detectSlugFromCard(p);
  const paramKey = type === "campaign" ? "campaign" : type === "project" ? "project" : "program";
  const base = `/donate?${paramKey}=${encodeURIComponent(slug)}`;
  if (p?.priceFrom && Number(p.priceFrom) > 0) {
    return `${base}&amount=${Number(p.priceFrom)}`;
  }
  return base;
};

const getCardDetailsUrl = (p: any): string => {
  if (p.detailsUrl && typeof p.detailsUrl === "string" && p.detailsUrl.trim() && p.detailsUrl !== "/programs" && p.detailsUrl !== "/programs/") {
    return p.detailsUrl;
  }
  const { slug, type } = detectSlugFromCard(p);
  if (type === "campaign") {
    return `/campaigns/${encodeURIComponent(slug)}`;
  }
  if (type === "project") {
    return `/projects/${encodeURIComponent(slug)}`;
  }
  return `/programs/${encodeURIComponent(slug)}`;
};

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

const CampaignCard = memo(function CampaignCard({ p, i, total, lang, isRTL, Arrow, className = "", style, ariaPos, ariaSize }: CardProps) {
  const resolvedPropImg = useMemo(() => {
    if (!p.image || p.image.includes("example.com")) return p.image || "/og-ar.jpg";
    return formatServerImageUrl(p.image) || p.image;
  }, [p.image]);

  const [imgSrc, setImgSrc] = useState(resolvedPropImg);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(resolvedPropImg);
    setImgFailed(false);
  }, [resolvedPropImg]);

  // Fallback to verified local charity asset if external image fails
  const handleImageError = () => {
    if (!imgFailed) {
      setImgFailed(true);
      setImgSrc("/og-ar.jpg");
    }
  };

  const name = p[lang]?.name || (p as any).name_ar || "";
  const tagline = p[lang]?.tagline || (p as any).tagline_ar || "";

  return (
    <article
      data-stack-card
      data-campaign-card
      dir={isRTL ? "rtl" : "ltr"}
      style={style}
      role={ariaPos ? "group" : undefined}
      aria-roledescription={ariaPos ? (isRTL ? "شريحة" : "slide") : undefined}
      aria-label={ariaPos && ariaSize ? `${ariaPos} / ${ariaSize}` : undefined}
      className={`relative flex h-full w-full flex-col justify-end overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}
    >
      {/* Full-bleed background image — NO hover scale inside 3D context.
          Scale transforms on children of rotateY parents cause subpixel
          rendering artifacts (shimmering edges) on all GPU-composited layers. */}
      <img
        data-campaign-image
        src={imgSrc || "/og-ar.jpg"}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={handleImageError}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Cinematic dark gradient overlay from bottom to top for maximum text contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />

      {/* Top price chip */}
      {p.priceFrom > 0 && (
        <span className="absolute end-3.5 top-3.5 z-10 rounded-full bg-orange-grad px-3.5 py-1 text-[11.5px] font-black text-white shadow-cta ring-1 ring-white/20">
          {isRTL ? `من ${p.priceFrom.toLocaleString("ar-EG")} ج` : `From ${p.priceFrom} EGP`}
        </span>
      )}

      {/* Content & Actions Block overlaid on the lower portion of the image */}
      <div className="relative z-10 flex flex-col gap-1.5 p-3.5 sm:p-4.5 pb-3 sm:pb-4">
        <h3
          className="text-[13.5px] sm:text-[15.5px] md:text-[16.5px] font-black leading-[1.35] tracking-tight text-white [text-wrap:balance] line-clamp-2 pb-0.5"
          style={{ textShadow: "0 2px 14px rgba(0,0,0,0.8)" }}
        >
          {name}
        </h3>

        <p className="text-[10.5px] sm:text-[11.5px] md:text-[12px] font-medium leading-[1.6] text-white/95 line-clamp-2 pb-1">
          {tagline}
        </p>

        {/* Action buttons directly on the dark gradient */}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-white/20 pt-2.5">
          <Link
            to={getCardDetailsUrl(p)}
            onClick={() => recordCampaignClick(p.slug, "details_click")}
            className="inline-flex items-center gap-1 py-1 text-[11px] font-extrabold text-white/95 transition-all hover:text-white hover:underline sm:text-[12px]"
          >
            {isRTL ? "تفاصيل البرنامج" : "Program details"}
            <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {p.priceFrom > 0 ? (
            <Button
              asChild
              size="sm"
              className="h-8 sm:h-8.5 rounded-xl bg-orange-grad px-3.5 sm:px-4 py-1 text-[11px] sm:text-[12px] font-black text-white shadow-cta hover:opacity-95 transition-all"
            >
              <Link to={getCardDonateUrl(p)} onClick={() => recordCampaignClick(p.slug, "donate_click")}>
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isRTL ? "تبرع الآن" : "Donate"}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-8 sm:h-8.5 rounded-xl border-white/25 bg-white/10 px-3.5 sm:px-4 py-1 text-[11px] sm:text-[12px] font-bold text-white hover:bg-white/20 transition-all">
              <Link to="/register/volunteer" onClick={() => recordCampaignClick(p.slug, "details_click")}>{isRTL ? "تطوع معنا" : "Volunteer"}</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
});

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
    className={`relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] bg-primary text-primary-foreground ring-1 ring-secondary/40 ${className}`}
  >
    {/* Decorative hourglass background.
        mix-blend-screen removed — blend modes on composited GPU layers cause
        the browser to fall back to software compositing which produces
        white rectangular flashes when the parent rotateY changes. */}
    <img
      src={ctaHourglass}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width={1280}
      height={800}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
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
    <div className="relative flex flex-1 flex-col items-center justify-center p-4 sm:p-5 text-center">
      <span className="inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-primary-foreground/5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
        <Sparkles className="h-2.5 w-2.5" />
        {isRTL ? "ابدأ رحلتك" : "Start your journey"}
      </span>

      <h3 className="mt-2.5 text-xl font-black leading-[1.2] sm:text-2xl">
        {isRTL ? "تبرعك اليوم يصنع الفرق" : "Your gift today makes a difference"}
      </h3>
      <p className="mt-1.5 max-w-[28ch] text-xs font-semibold text-primary-foreground/85 sm:text-sm">
        {isRTL
          ? "اختر حملتك وابدأ أثرك مع اليسر — سريع، آمن، وموثّق."
          : "Pick your campaign and start your impact — fast, secure, documented."}
      </p>

      <div className="mt-3 flex w-full max-w-xs flex-row flex-nowrap items-stretch justify-center gap-2">
        <Button
          asChild
          size="sm"
          className="h-9 sm:h-10 flex-1 min-w-0 bg-orange-grad px-3 text-[11px] sm:text-xs font-extrabold text-accent-foreground shadow-cta hover:opacity-95"
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
          className="h-9 sm:h-10 flex-1 min-w-0 border-secondary/50 bg-primary-foreground/5 px-3 text-[11px] sm:text-xs font-extrabold text-primary-foreground hover:bg-secondary/15"
        >
          <Link to="/campaigns" onClick={() => recordCampaignClick("__cta__", "details_click")}>
            <HeartHandshake className="h-4 w-4" />
            {isRTL ? "تصفح كل الحملات" : "Browse all campaigns"}
          </Link>
        </Button>
      </div>

      <p className="mt-2.5 text-[10px] font-bold text-primary-foreground/65">
        {isRTL ? "دفع آمن • تأكيد فوري • إيصال رسمي" : "Secure payment • Instant confirmation • Official receipt"}
      </p>
    </div>
  </article>
);