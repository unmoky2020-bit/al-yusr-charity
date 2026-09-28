import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { getLucideIcon } from "@/lib/lucide-icon";
import heroSad from "@/assets/hero-girl-start.webp";
import heroHappy from "@/assets/hero-happy-family-new.webp";
import decoVan from "@/assets/hero-deco-van-new.png";
import decoVan2 from "@/assets/hero-deco-van-2.png";
import logoCircle from "@/assets/logo-circle.png";
import { useLang } from "@/i18n/LangContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/data/laravelApi";

const trackHeroCta = (target: string, fbEvent: string) => {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    dataLayer?: { push?: (event: Record<string, unknown>) => void };
    gtag?: (type: string, name: string, params: Record<string, unknown>) => void;
    fbq?: (type: string, name: string) => void;
  };
  w.dataLayer?.push?.({ event: "cta_click", source: "hero", target });
  w.gtag?.("event", "cta_click", { source: "hero", target });
  w.fbq?.("trackCustom", fbEvent);
};

/**
 * Cinematic Hero — scroll-scrubbed sticky story:
 *   sad girl → shrinks down → happy family blooms → convoy trucks roll in
 */
export const Hero = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const root = useRef<HTMLElement | null>(null);
  const pin = useRef<HTMLDivElement | null>(null);

  const { data: homeContent, isLoading, isError } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => contentApi.homepage(),
    staleTime: 60_000,
  });

  // ── Preload hero images immediately ──
  useEffect(() => {
    [heroSad, heroHappy].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);


  // ── Scroll-scrubbed cinematic timeline ──
  useEffect(() => {
    const lite = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {

      // ── Initial states ──────────────────────────────────────────────────
      gsap.set(".hc-face-sad", {
        scale: 1,
        autoAlpha: 1,
        transformOrigin: "50% 100%",
        force3D: true,
      });
      gsap.set(".hc-face-happy", {
        scale: 0.82,
        autoAlpha: 0,
        transformOrigin: "50% 100%",
        force3D: true,
      });
      gsap.set([".hc-van", ".hc-van2"], { autoAlpha: 0, force3D: true });
      gsap.set(".hc-copy", { autoAlpha: 1 });

      if (lite) {
        gsap.set(".hc-face-sad", { autoAlpha: 0 });
        gsap.set(".hc-face-happy", { scale: 1, autoAlpha: 1 });
        gsap.set([".hc-van", ".hc-van2"], { autoAlpha: 1, x: 0 });
        return;
      }

      // ── Scroll distance (generous length for rich storytelling) ────────
      const isMobile = window.innerWidth < 768;
      const pinH = window.innerHeight;
      const multiplier = isMobile ? 2.6 : 3.0;
      const endPx = Math.round(pinH * multiplier);
      const scrub = isMobile ? 0.35 : 0.6;

      // ── GSAP ScrollTrigger (lightweight, standard scroll-controlled) ────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          pin: pin.current,
          pinSpacing: true,
          start: "top top",
          end: `+=${endPx}px`,
          scrub,
          id: "hero",
        },
      });

      // ── Timeline: The Journey of Compassion ─────────────────────────────
      tl
        // Phase 1 — Hold on the sad girl (the emotional connection)
        .to({}, { duration: 1.6 })

        // Phase 2 — Sad girl shrinks down into place, staying pinned to bottom
        .to(".hc-face-sad", {
          scale: 0.82,
          duration: 2.0,
          ease: "power1.inOut",
        })

        // Phase 3 — Seamless, calm transition: Sad girl dissolves smoothly as Happy family emerges from the exact same scale
        .to(".hc-face-sad", {
          autoAlpha: 0,
          duration: 0.8,
          ease: "power1.out",
        })
        .to(".hc-face-happy", {
          autoAlpha: 1,
          duration: 0.8,
          ease: "power1.in",
        }, "<0.1")

        // Phase 4 — Happy family blooms and expands up to full stature
        .to(".hc-face-happy", {
          scale: 1.0,
          duration: 2.0,
          ease: "power1.out",
        }, ">-0.2")

        // Phase 5 — Convoys of goodness roll in from left & right to surround the family
        .fromTo(".hc-van",
          { x: 260, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power2.out", duration: 1.6 }, "-=1.2")
        .fromTo(".hc-van2",
          { x: -260, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power2.out", duration: 1.6 }, "-=1.3")

        // Phase 6 — Joyful, inspiring hold on the final picture
        .to({}, { duration: 2.0 });

    }, root);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={root}
      id="hero"
      dir={isRTL ? "rtl" : "ltr"}
      className="relative isolate z-0 w-full bg-[#083820] text-primary-foreground"
    >
      {/*
        ── Pinned container ──────────────────────────────────────────────────
        100lvh matches the full screen height with browser toolbars collapsed.
        Because lvh is completely static on mobile, it never recalculates or reflows
        when the Chrome address bar collapses or expands during scroll.
      */}
      <div
        ref={pin}
        className="hc-pin relative w-full overflow-hidden bg-[radial-gradient(ellipse_100%_90%_at_50%_-10%,#115e3b_0%,#0c492c_60%,#083820_100%)] h-screen h-[100lvh] min-h-[100lvh]"
      >
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/12 blur-3xl" />

        {/* Centered brand watermark — crisp native scale (<= 380px), centered behind hero copy */}
        <img
          src={logoCircle}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[54%] z-0 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.14] mix-blend-screen sm:h-[320px] sm:w-[320px] md:h-[380px] md:w-[380px]"
          style={{ filter: "drop-shadow(0 0 20px rgba(16,185,129,0.15))" }}
          decoding="async"
        />

        {/* ── Copy + CTAs (positioned with clear breathing space below the header) ── */}
        <div className="relative z-20 container mx-auto px-4 pt-36 xs:pt-40 sm:pt-44 md:pt-48 lg:pt-52">
          <div className="relative mx-auto flex max-w-[min(92vw,50rem)] flex-col items-center text-center">

            {/* Shimmer badge */}
            <div className="hc-copy mb-1.5 sm:mb-2.5 flex justify-center min-h-[26px]">
              {isLoading && !homeContent ? (
                <div className="h-6 w-36 rounded-full bg-white/20 animate-pulse" />
              ) : (
                <span className="inline-flex flex-row items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10.5px] sm:text-xs font-black text-secondary backdrop-blur-xs tracking-wide whitespace-nowrap shadow-xs">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-secondary animate-pulse shrink-0 inline-block" />
                  <span className="leading-none">
                    {isRTL
                      ? (homeContent?.hero_badge_ar || (isError ? "جمعية اليسر للبر والخدمات الاجتماعية" : ""))
                      : (homeContent?.hero_badge_en || (isError ? "Al-Yusr Charity" : ""))}
                  </span>
                </span>
              )}
            </div>

            <h1
              className="hc-copy relative z-20 text-[1.45rem] xs:text-[1.65rem] font-black tracking-tight leading-none sm:text-[2.05rem] md:text-[2.4rem] lg:text-[2.8rem] xl:text-[3.1rem] min-h-[2.5rem]"
              style={{ textShadow: "0 8px 24px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.35)" }}
            >
              {isLoading && !homeContent ? (
                <div className="mx-auto h-9 sm:h-12 w-3/4 max-w-md rounded-xl bg-white/20 animate-pulse my-1" />
              ) : (() => {
                const accent = isRTL
                  ? (homeContent?.hero_title_accent_ar || (isError ? t.hero.titleAccent : ""))
                  : (homeContent?.hero_title_accent_en || (isError ? t.hero.titleAccent : ""));
                const rawTitle = isRTL
                  ? (homeContent?.hero_title_ar || (isError ? `${t.hero.title1} ${t.hero.title2}` : ""))
                  : (homeContent?.hero_title_en || (isError ? `${t.hero.title1} ${t.hero.title2}` : ""));
                const line1 = (accent && rawTitle.includes(accent))
                  ? rawTitle.replace(accent, "").replace(/[—\-–&،,\s]+$/, "").trim()
                  : rawTitle;
                return (
                  <>
                    <span className="block leading-tight">{line1}</span>
                    {accent && (
                      <span className="-mt-0.5 sm:-mt-1.5 md:-mt-2 block text-gradient-lime [text-decoration:none] leading-tight">
                        {accent}
                      </span>
                    )}
                  </>
                );
              })()}
            </h1>

            <div className="hc-copy mx-auto mt-1.5 sm:mt-2.5 max-w-[32rem] min-h-[40px]">
              {isLoading && !homeContent ? (
                <div className="space-y-1.5 py-1">
                  <div className="h-3.5 w-full rounded bg-white/20 animate-pulse mx-auto" />
                  <div className="h-3.5 w-4/5 rounded bg-white/20 animate-pulse mx-auto" />
                </div>
              ) : (
                <p className="text-balance text-[11.5px] xs:text-xs sm:text-[14px] md:text-[15.5px] font-medium leading-snug sm:leading-relaxed text-primary-foreground/90 line-clamp-3 sm:line-clamp-none">
                  {isRTL
                    ? (homeContent?.hero_description_ar || (isError ? "تبرّعك من اليوم يوصل لأسرة مستحقة بأيدي متطوعينا الموثوقين — سريع، شفاف، وبأعلى معايير الأمانة." : ""))
                    : (homeContent?.hero_description_en || (isError ? "Your donation reaches a deserving family today through our trusted volunteers." : ""))}
                </p>
              )}
            </div>

            {(() => {
              const HeroPrimaryIcon = getLucideIcon(homeContent?.hero_cta_primary_icon || "Heart");
              const HeroSecondaryIcon = getLucideIcon(homeContent?.hero_cta_secondary_icon || "Info");
              return (
                <div className="hc-copy relative z-20 mx-auto mt-2.5 sm:mt-4 flex w-full max-w-sm flex-row items-center justify-center gap-2 sm:gap-3.5">
                  <Button asChild size="default"
                    className="h-9 min-w-[115px] px-3.5 sm:h-11 sm:min-w-[145px] sm:px-6 rounded-2xl bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground no-underline shadow-cta animate-pulse-glow hover:opacity-95 shrink-0">
                    <a
                      href={homeContent?.hero_cta_primary_link || "/donate"}
                      data-cta="hero-donate"
                      style={{ textDecoration: "none" }}
                      onClick={() => trackHeroCta(homeContent?.hero_cta_primary_link || "/donate", "HeroCTA")}
                      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <HeroPrimaryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>
                        {isRTL
                          ? (homeContent?.hero_cta_primary_ar || t.hero.ctaPrimary)
                          : (homeContent?.hero_cta_primary_en || t.hero.ctaPrimary)}
                      </span>
                    </a>
                  </Button>
                  <Button asChild size="default"
                    className="h-9 min-w-[115px] px-3.5 sm:h-11 sm:min-w-[145px] sm:px-6 rounded-2xl border-2 border-secondary/60 bg-primary-foreground/95 text-xs sm:text-sm font-black text-primary no-underline shadow-cta ring-1 ring-secondary/40 backdrop-blur-sm hover:bg-secondary hover:text-secondary-foreground shrink-0">
                    <a
                      href={homeContent?.hero_cta_secondary_link || "/about"}
                      style={{ textDecoration: "none" }}
                      onClick={() => trackHeroCta(homeContent?.hero_cta_secondary_link || "/about", "HeroAbout")}
                      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <HeroSecondaryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span>
                        {isRTL
                          ? (homeContent?.hero_cta_secondary_ar || "تعرّف علينا")
                          : (homeContent?.hero_cta_secondary_en || "About us")}
                      </span>
                    </a>
                  </Button>
                </div>
              );
            })()}

            <div className="hc-copy mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-2 text-[10.5px] font-bold text-primary-foreground/85 sm:text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-primary-foreground/10 px-2.5 py-0.5 sm:px-3 shadow-cta backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
                {isRTL
                  ? (homeContent?.hero_transparency_text_ar || "%99 شفافية")
                  : (homeContent?.hero_transparency_text_en || "99% Transparency")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Cinematic stage — anchored directly to the bottom floor ──────────────────────
            Fixed to absolute bottom of the pinned hero. Zero gaps, zero cutoffs under images. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center overflow-hidden h-full w-full"
          style={{ perspective: "1400px" }}
        >
          {/* ── FACE A: Sad Girl (grounded flush to bottom: 0) ─────────────────── */}
          <div
            className="hc-face-sad pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex items-end justify-center w-full"
            style={{ transformOrigin: "50% 100%" }}
          >
            <img
              src={heroSad}
              alt={isRTL ? "أسرة محتاجة قبل وصول الخير" : "A family before help arrives"}
              className="hc-sad pointer-events-none select-none object-contain object-bottom block w-auto max-w-[min(76vw,380px)] max-h-[410px] xs:max-h-[440px] sm:max-h-[470px]"
              style={{
                marginBottom: 0,
              }}
              decoding="async"
              // @ts-expect-error — React 18
              fetchpriority="high"
            />
          </div>

          {/* ── FACE B: Happy Family + Trucks (grounded flush to bottom: 0) ───── */}
          <div
            className="hc-face-happy pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex items-end justify-center w-full max-w-7xl mx-auto"
            style={{ transformOrigin: "50% 100%" }}
          >
            {/* Left Van */}
            <div className="hc-van2 pointer-events-none absolute -left-[5%] xs:-left-[3%] sm:left-[1%] md:left-[7%] lg:left-[10%] xl:left-[13%] bottom-0 z-[1] w-[58%] xs:w-[54%] sm:w-[46%] md:w-[40%] lg:w-[36%] xl:w-[33%] max-w-[580px] lg:max-w-[680px]">
              <img
                src={decoVan}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="h-auto w-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.4)] block object-bottom"
                style={{ filter: "saturate(1.12) brightness(1.06) contrast(1.06)" }}
              />
            </div>

            {/* Happy family */}
            <img
              src={heroHappy}
              alt={isRTL ? "متطوعو اليسر مع أسرة مستفيدة وسلال الخير" : "Al-Yusr volunteers with a family and aid baskets"}
              className="hc-happy pointer-events-none relative z-[3] w-[126%] xs:w-[120%] sm:w-[108%] md:w-[68%] lg:w-[56%] xl:w-[48%] max-w-none md:max-w-[680px] lg:max-w-[740px] xl:max-w-[780px] select-none object-contain object-bottom block max-h-[460px] xs:max-h-[500px] sm:max-h-[580px] md:max-h-[660px]"
              style={{
                filter: "saturate(1.05) contrast(1.03) drop-shadow(0 10px 24px rgba(0,0,0,0.36))",
                marginBottom: 0,
              }}
              decoding="async"
              // @ts-expect-error — high priority
              fetchpriority="high"
            />

            {/* Right Truck */}
            <div className="hc-van pointer-events-none absolute -right-[5%] xs:-right-[3%] sm:right-[1%] md:right-[7%] lg:right-[10%] xl:right-[13%] bottom-0 z-[1] w-[60%] xs:w-[56%] sm:w-[48%] md:w-[42%] lg:w-[38%] xl:w-[35%] max-w-[620px] lg:max-w-[720px]">
              <img
                src={decoVan2}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="h-auto w-full drop-shadow-[0_14px_22px_rgba(0,0,0,0.42)] block object-bottom"
                style={{ filter: "saturate(1.15) brightness(1.06) contrast(1.06)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
