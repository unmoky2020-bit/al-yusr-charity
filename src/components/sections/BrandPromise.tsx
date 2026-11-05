import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { HandHeart } from "lucide-react";
import { getLucideIcon } from "@/lib/lucide-icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { ImpactStatsPanel } from "@/components/sections/Stats";
import brandBags from "@/assets/brand-bags.jpg";
import brandPoster from "@/assets/brand-poster-frame.jpg";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

import { contentApi, formatServerImageUrl, HOMEPAGE_DEFAULT_CONTENT, getApiToken } from "@/data/laravelApi";

/**
 * Brand promise band - collage: big poster (col-span-3 row-span-2) + top bag + bottom CTA card.
 */
export const BrandPromise = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const statsWrap = useRef<HTMLDivElement | null>(null);
  const collageRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = !!getApiToken();
  const { data: homeContent, isLoading } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => contentApi.homepage(),
    staleTime: isAdmin ? 0 : 30_000,
    retry: false,
  });

  // Resolve: backend first, then HOMEPAGE_DEFAULT_CONTENT — never hardcoded strings
  const c = homeContent ?? HOMEPAGE_DEFAULT_CONTENT;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const mm = gsap.matchMedia();

    // ── 0. Stats Bar (Always visible, gentle smooth entry) ──
    if (statsWrap.current) {
      gsap.fromTo(
        statsWrap.current,
        { y: 20 },
        {
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          clearProps: "transform",
        }
      );
    }

    // ── 1. Mobile Motion (< 768px): Stacked layout ──
    mm.add("(max-width: 767px)", () => {
      // الصف العلوي (المحتوى والعناوين والأزرار): ينزل بنعومة ولطف من فوق لتحت
      if (copyRef.current) {
        const items = copyRef.current.querySelectorAll("[data-bp='copy-item']");
        if (items.length) {
          gsap.from(items, {
            y: -28,
            opacity: 0,
            duration: 0.75,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: copyRef.current,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // كولاج الصور: الصورة الكبيرة تدخل من جهة، والعمود الجانبي بالكامل (الصورة والكارت البرتقالي) يدخلان معاً في نفس التوقيت الموحد تماماً
      if (collageRef.current) {
        const cardBig = collageRef.current.querySelector("[data-bp='card-big']");
        const sideCol = collageRef.current.querySelector("[data-bp='side-col']");
        if (cardBig && sideCol) {
          gsap.from(cardBig, {
            x: isRTL ? 35 : -35,
            opacity: 0,
            duration: 0.75,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: collageRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
          gsap.from(sideCol, {
            x: isRTL ? -35 : 35,
            opacity: 0,
            duration: 0.75,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: collageRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        }
      }
    });

    // ── 2. Desktop Motion (>= 768px): Side-by-side columns ──
    mm.add("(min-width: 768px)", () => {
      // في العربية: عمود المحتوى يمين (يدخل من اليمين)، وعمود الكولاج يسار
      const copyX = isRTL ? 45 : -45;

      // عمود المحتوى يدخل أفقياً بحسب اتجاه اللغة
      if (copyRef.current) {
        const items = copyRef.current.querySelectorAll("[data-bp='copy-item']");
        if (items.length) {
          gsap.from(items, {
            x: copyX,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: copyRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      }

      // عمود الكولاج: الصورة الكبيرة والعمود الجانبي يدخلان بتزامن دقيق وبدون أي تأخير للكارت البرتقالي
      if (collageRef.current) {
        const cardBig = collageRef.current.querySelector("[data-bp='card-big']");
        const sideCol = collageRef.current.querySelector("[data-bp='side-col']");
        if (cardBig && sideCol) {
          gsap.from(cardBig, {
            x: isRTL ? 40 : -40,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: collageRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          gsap.from(sideCol, {
            x: isRTL ? -40 : 40,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: collageRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }
      }
    });

    // Refresh ScrollTrigger when layout changes
    ScrollTrigger.refresh();

    return () => mm.revert();
  }, [isRTL, isLoading]);

  const rawTitle = isRTL ? c.section2_title_ar : c.section2_title_en;
  const rawAccent = isRTL ? c.section2_title_accent_ar : c.section2_title_accent_en;
  const titleLine1 = (rawAccent && rawTitle && rawTitle.includes(rawAccent))
    ? rawTitle.replace(rawAccent, "").replace(/[—\-–&،,\s]+$/, "").trim()
    : rawTitle;
  const titleLine2 = rawAccent;

  const primaryCtaText = isRTL ? c.section2_cta_primary_ar : c.section2_cta_primary_en;
  const primaryCtaLink = c.section2_cta_primary_link || "/projects";
  const PrimaryIcon = getLucideIcon(c.section2_cta_primary_icon || "Compass");

  const secondaryCtaText = isRTL ? c.section2_cta_secondary_ar : c.section2_cta_secondary_en;
  const secondaryCtaLink = c.section2_cta_secondary_link || "/zakat-calculator";
  const SecondaryIcon = getLucideIcon(c.section2_cta_secondary_icon || "Calculator");

  const mainImageUrl = formatServerImageUrl(c.section2_main_image) || "";
  const topImageUrl = formatServerImageUrl(c.section2_left_top_image) || "";

  const cardTitle = isRTL
    ? (c.section2_card_title_ar || c.section2_card_cta_title_ar || "كن سبب الفرحة")
    : (c.section2_card_title_en || c.section2_card_cta_title_en || "Be their joy");
  const cardSubtitle = isRTL
    ? (c.section2_card_subtitle_ar || c.section2_card_cta_sub_ar || "كل تبرع موثّق، وكل أثر مرئي")
    : (c.section2_card_subtitle_en || c.section2_card_cta_sub_en || "Every donation tracked, every impact visible");
  const cardLink = c.section2_card_url || c.section2_card_cta_link || "/about#impact";

  return (
    <section id="stats" className="relative z-10 overflow-visible pb-14 sm:pb-16 md:pb-20 pt-4 sm:pt-6">
      <div className="container relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={statsWrap} className="relative -mt-16 mx-auto w-full max-w-7xl will-change-transform sm:-mt-20 md:-mt-22">
          <ImpactStatsPanel isRTL={isRTL} />
        </div>
      </div>

      <div className="container relative mx-auto max-w-7xl mt-8 sm:mt-10 md:mt-14 grid items-start gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Copy */}
        <div ref={copyRef} className="text-center md:text-start">
          {isLoading ? (
            /* ── Skeleton while loading ── */
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-24 rounded-full bg-secondary/25 mx-auto md:mx-0" />
              <div className="space-y-2.5">
                <div className="h-9 w-3/4 rounded-xl bg-muted mx-auto md:mx-0" />
                <div className="h-9 w-1/2 rounded-xl bg-accent/20 mx-auto md:mx-0" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full max-w-md rounded bg-muted mx-auto md:mx-0" />
                <div className="h-4 w-4/5 rounded bg-muted mx-auto md:mx-0" />
                <div className="h-4 w-3/5 rounded bg-muted mx-auto md:mx-0" />
              </div>
              <div className="flex gap-3 justify-center md:justify-start mt-2">
                <div className="h-11 w-36 rounded-2xl bg-orange-400/25" />
                <div className="h-11 w-36 rounded-2xl bg-muted" />
              </div>
            </div>
          ) : (
            <>
              <span data-bp="copy-item" className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] sm:text-xs font-black text-primary">
                {isRTL ? c.section2_badge_ar : c.section2_badge_en}
              </span>
              <h2 data-bp="copy-item" className="mt-3.5 text-[26px] font-black leading-[1.3] text-primary sm:text-3xl md:text-4xl lg:text-5xl md:leading-[1.28]">
                <span className="block">{titleLine1}</span>
                {titleLine2 && (
                  <span className="mt-1.5 sm:mt-2.5 block text-accent">{titleLine2}</span>
                )}
              </h2>
              <p data-bp="copy-item" className="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-foreground/85 sm:text-base md:mx-0 md:text-lg">
                {isRTL ? c.section2_description_ar : c.section2_description_en}
              </p>
              <div data-bp="copy-item" className="mt-7 flex w-auto max-w-[340px] sm:max-w-none flex-row items-center justify-center gap-3 sm:gap-4 md:justify-start mx-auto md:mx-0">
                <Button asChild size="lg" className="h-11 px-5 rounded-2xl bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground no-underline shadow-cta hover:opacity-95 sm:h-12 sm:px-7 flex-1 sm:flex-initial">
                  <Link to={primaryCtaLink}>
                    <PrimaryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {primaryCtaText}
                  </Link>
                </Button>
                <Button asChild size="lg" className="h-11 px-5 rounded-2xl border-2 border-lime-400/60 bg-lime-400 text-xs sm:text-sm font-black text-lime-950 no-underline shadow-soft hover:bg-lime-300 hover:border-lime-300 transition-all sm:h-12 sm:px-7 flex-1 sm:flex-initial">
                  <Link to={secondaryCtaLink}>
                    <SecondaryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {secondaryCtaText}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/*
          Collage: 5-col grid.
          Big poster  -> col-span-3 (fills full height).
          Side column -> col-span-2 flex flex-col:
                         - Top image card is taller (flex-[1.45])
                         - Bottom orange card is compact (flex-1)
        */}
        <div
          ref={collageRef}
          className="relative mx-auto grid w-full grid-cols-5 gap-3 sm:gap-4 mb-8 sm:mb-9 md:mb-0"
          style={{ height: "clamp(320px, 42vw, 430px)" }}
        >
          {/* Big poster — col-span-3 */}
          <div
            data-bp="card-big"
            className="col-span-3 h-full overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-secondary/40 shadow-card bg-muted"
          >
            {isLoading ? (
              <div className="h-full w-full bg-muted animate-pulse" />
            ) : (
              <img
                src={mainImageUrl || brandPoster}
                alt={isRTL ? "مبادرة اليسر الخيرية" : "Al-Yusr Charity initiative"}
                className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = brandPoster;
                }}
              />
            )}
          </div>

          {/* Side column: Small image on top + Orange card below it */}
          <div
            data-bp="side-col"
            className="col-span-2 flex h-full flex-col gap-3 sm:gap-4"
          >
            {/* Top bag image — taller in column (flex-[1.45]) */}
            <div
              data-bp="card-top"
              className="relative flex-[1.45] min-h-0 w-full overflow-hidden rounded-[1rem] sm:rounded-[1.25rem] border-2 border-accent/40 shadow-soft bg-muted"
            >
              {isLoading ? (
                <div className="h-full w-full bg-muted animate-pulse" />
              ) : (
                <img
                  src={topImageUrl || brandBags}
                  alt={isRTL ? "كرتونة اليسر وقوافل الخير" : "Al-Yusr food bags & aid convoys"}
                  className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = brandBags;
                  }}
                />
              )}
            </div>

            {/* Bottom CTA card — compact in column (flex-1) with full text visibility */}
            <Link
              to={cardLink}
              data-bp="card-bottom"
              className="group relative flex flex-1 min-h-0 w-full flex-col items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-[#fb923c] to-[#ea580c] px-3 py-2 sm:px-4 sm:py-3 text-center text-white shadow-cta hover:shadow-lg transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-black text-white/95 transition-transform duration-200 group-hover:scale-105">
                <HandHeart className="h-4 w-4 shrink-0 text-white" />
                <span>{cardTitle}</span>
              </div>
              <p className="mt-1 sm:mt-1.5 text-[10.5px] sm:text-[11.5px] md:text-xs font-bold leading-normal text-white/95 px-1 pb-1">
                {cardSubtitle}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandPromise;
