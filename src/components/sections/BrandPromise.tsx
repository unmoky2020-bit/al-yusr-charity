import { useEffect, useRef } from "react";
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

import { useQuery } from "@tanstack/react-query";
import { contentApi, formatServerImageUrl } from "@/data/laravelApi";

/**
 * Brand promise band - collage: big poster (col-span-3 row-span-2) + top bag + bottom CTA card.
 */
export const BrandPromise = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const statsWrap = useRef<HTMLDivElement | null>(null);
  const collageRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);

  const { data: homeContent, isLoading, isError } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => contentApi.homepage(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      if (statsWrap.current) {
        gsap.from(statsWrap.current, {
          y: 28, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: statsWrap.current, start: "top 90%", toggleActions: "play none none none" },
        });
      }
      if (copyRef.current) {
        const items = copyRef.current.querySelectorAll("[data-bp='copy-item']");
        gsap.from(items, {
          y: 24, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: copyRef.current, start: "top 82%", toggleActions: "play none none none" },
        });
      }
      if (collageRef.current) {
        gsap.from(collageRef.current, {
          y: 28, opacity: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: collageRef.current, start: "top 80%", toggleActions: "play none none none" },
        });
      }
    });
    return () => ctx.revert();
  }, [isRTL]);

  const rawTitle = isRTL
    ? (homeContent?.section2_title_ar || "خيرك يوصل")
    : (homeContent?.section2_title_en || "Your good arrives");
  const rawAccent = isRTL
    ? (homeContent?.section2_title_accent_ar || "وأجرك يستمر")
    : (homeContent?.section2_title_accent_en || "Your reward continues");

  // Deduplicate: If rawTitle already contains rawAccent, strip it from line 1 so it doesn't duplicate
  const titleLine1 = (rawAccent && rawTitle.includes(rawAccent))
    ? rawTitle.replace(rawAccent, "").replace(/[—\-–&،,\s]+$/, "").trim()
    : rawTitle;
  const titleLine2 = rawAccent;

  const primaryCtaText = isRTL
    ? (homeContent?.section2_cta_primary_ar || "استكشف البرامج")
    : (homeContent?.section2_cta_primary_en || "Explore programs");
  const primaryCtaLink = homeContent?.section2_cta_primary_link || "/projects";
  const PrimaryIcon = getLucideIcon(homeContent?.section2_cta_primary_icon || "Compass");

  const secondaryCtaText = isRTL
    ? (homeContent?.section2_cta_secondary_ar || "احسب زكاتك")
    : (homeContent?.section2_cta_secondary_en || "Zakat calculator");
  const secondaryCtaLink = homeContent?.section2_cta_secondary_link || "/zakat-calculator";
  const SecondaryIcon = getLucideIcon(homeContent?.section2_cta_secondary_icon || "Calculator");

  const mainImageUrl = formatServerImageUrl(homeContent?.section2_main_image) || (isError ? brandPoster : "");
  const topImageUrl = formatServerImageUrl(homeContent?.section2_left_top_image) || (isError ? brandBags : "");

  const cardTitle = isRTL
    ? (homeContent?.section2_card_title_ar || homeContent?.section2_card_cta_title_ar || "كن سببًا في الخير")
    : (homeContent?.section2_card_title_en || homeContent?.section2_card_cta_title_en || "Be the Reason for Good");

  const cardSubtitle = isRTL
    ? (homeContent?.section2_card_subtitle_ar || homeContent?.section2_card_cta_sub_ar || "ساهم الآن في صناعة أثر حقيقي")
    : (homeContent?.section2_card_subtitle_en || homeContent?.section2_card_cta_sub_en || "Help create a real impact today");

  const cardLink = homeContent?.section2_card_url || homeContent?.section2_card_cta_link || "/projects";

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
          <span data-bp="copy-item" className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] sm:text-xs font-black text-primary">
            {isRTL ? (homeContent?.section2_badge_ar || "مع اليسر") : (homeContent?.section2_badge_en || "With Al-Yusr")}
          </span>

          {isLoading && !homeContent ? (
            <div className="space-y-3 mt-3.5">
              <div className="h-8 sm:h-10 w-2/3 rounded-xl bg-muted animate-pulse mx-auto md:mx-0" />
              <div className="h-4 sm:h-5 w-full max-w-md rounded bg-muted animate-pulse mx-auto md:mx-0" />
              <div className="h-4 sm:h-5 w-4/5 max-w-sm rounded bg-muted animate-pulse mx-auto md:mx-0" />
            </div>
          ) : (
            <>
              <h2 data-bp="copy-item" className="mt-3.5 text-[26px] font-black leading-[1.3] text-primary sm:text-3xl md:text-4xl lg:text-5xl md:leading-[1.28]">
                <span className="block">
                  {titleLine1 || (isRTL ? "تبرع اليوم" : "Today’s donation")}
                </span>
                {titleLine2 && (
                  <span className="mt-1.5 sm:mt-2.5 block text-accent">
                    {titleLine2}
                  </span>
                )}
              </h2>
              <p data-bp="copy-item" className="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-foreground/85 sm:text-base md:mx-0 md:text-lg">
                {isRTL
                  ? (homeContent?.section2_description_ar || (isError ? "تبرعك هو استثمارك في الجنة وراحتك في الدنيا، تبرعك موثّق وأثرك مرئي." : ""))
                  : (homeContent?.section2_description_en || (isError ? "Your donation is your investment in the hereafter and your peace in this life." : ""))}
              </p>
            </>
          )}

          <div data-bp="copy-item" className="mt-7 flex w-auto max-w-[340px] sm:max-w-none flex-row items-center justify-center gap-3 sm:gap-4 md:justify-start mx-auto md:mx-0">
            <Button asChild size="lg" className="h-11 px-5 rounded-2xl bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground no-underline shadow-cta hover:opacity-95 sm:h-12 sm:px-7 flex-1 sm:flex-initial">
              <Link to={primaryCtaLink}>
                <PrimaryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                {primaryCtaText}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-5 rounded-2xl border-2 border-primary/25 bg-background text-xs sm:text-sm font-black text-primary no-underline shadow-soft hover:bg-primary/5 sm:h-12 sm:px-7 flex-1 sm:flex-initial">
              <Link to={secondaryCtaLink}>
                <SecondaryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                {secondaryCtaText}
              </Link>
            </Button>
          </div>
        </div>

        {/*
          Collage: 5-col x 2-row grid.
          Big poster  -> col-span-3 row-span-2 (fills full height).
          Top bag img -> col-span-2 row 1.
          CTA card    -> col-span-2 row 2.
        */}
        <div
          ref={collageRef}
          className="relative mx-auto grid w-full grid-cols-5 grid-rows-2 gap-3 sm:gap-4 mb-8 sm:mb-9 md:mb-0"
          style={{ height: "clamp(280px, 40vw, 400px)" }}
        >
          {/* Big poster */}
          <div data-bp="card-big" className="col-span-3 row-span-2 overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border-2 border-secondary/40 shadow-card bg-muted">
            {isLoading && !mainImageUrl ? (
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

          {/* Top bag image */}
          <div data-bp="card-top" className="col-span-2 overflow-hidden rounded-[1rem] sm:rounded-[1.25rem] border-2 border-accent/40 shadow-soft bg-muted">
            {isLoading && !topImageUrl ? (
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

          {/* Bottom CTA card */}
          <Link
            to={cardLink}
            data-bp="card-bottom"
            className="col-span-2 flex flex-col items-center justify-center overflow-hidden rounded-[1rem] sm:rounded-[1.25rem] bg-gradient-to-br from-[#fb923c] to-[#ea580c] p-3 text-center text-white shadow-cta transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-black text-white/95">
              <HandHeart className="h-4 w-4 shrink-0 text-white" />
              <span>{cardTitle}</span>
            </div>
            <p className="mt-1 text-[10px] sm:text-[11px] font-black leading-tight text-white/90 line-clamp-2">
              {cardSubtitle}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandPromise;
