import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Heart, Snowflake, Sun, HeartHandshake, Droplets, Sparkles, Truck, Compass, FolderHeart, GraduationCap, Utensils, Wheat, Home, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import { track } from "@/lib/track";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";
import { useQuery } from "@tanstack/react-query";
import { axesApi, contentApi, getApiToken, formatServerImageUrl } from "@/data/laravelApi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Al-Yusr — "محاور عملنا" (Our work axes).
 *
 * Layout: 3 strategic pillars (Food / Health / Education) as hero cards
 * with bullet highlights pulled from our 2026 program docs.
 */
export const WorkAxes = () => {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const root = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const Arrow = isAR ? ArrowLeft : ArrowRight;
  const stickyOffsets = [
    "top-[84px] md:top-[96px]",
    "top-[100px] md:top-[116px]",
    "top-[116px] md:top-[136px]",
  ];

  const isAdmin = !!getApiToken();
  const { data: liveAxes, isLoading: axesLoading } = useQuery({
    queryKey: ["work-axes-live"],
    queryFn: () => axesApi.list(),
    staleTime: isAdmin ? 0 : 30_000,
    retry: false,
  });

  // Load axes section header from the shared homepage-content query (same cache as Hero)
  const { data: homeContent, isLoading: headerLoading } = useQuery({
    queryKey: ["homepage-content"],
    queryFn: () => contentApi.homepage(),
    staleTime: isAdmin ? 0 : 30_000,
    retry: false,
  });
  const isLoading = axesLoading || headerLoading;

  const sectionCMS = homeContent?.section_axes_title_ar ? {
    badge_ar: homeContent.section_axes_badge_ar || undefined,
    badge_en: homeContent.section_axes_badge_en || undefined,
    title_ar: homeContent.section_axes_title_ar || undefined,
    title_en: homeContent.section_axes_title_en || undefined,
    subtitle_ar: homeContent.section_axes_subtitle_ar || undefined,
    subtitle_en: homeContent.section_axes_subtitle_en || undefined,
  } : null;

  useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current || isLoading) return;
    const items = headerRef.current.querySelectorAll("[data-wa]");
    if (!items.length) return;
    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 24,
        opacity: 0,
        stagger: 0.14,
        duration: 0.82,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });
    return () => ctx.revert();
  }, [isLoading]);

  const fallbackImages: Record<string, string> = {
    food: imgFood,
    health: imgHealth,
    education: imgEdu,
  };

  const getStickyOffset = (idx: number) => {
    const offsets = [
      "top-[84px] md:top-[96px]",
      "top-[100px] md:top-[116px]",
      "top-[116px] md:top-[136px]",
      "top-[132px] md:top-[156px]",
      "top-[148px] md:top-[176px]",
      "top-[164px] md:top-[196px]",
    ];
    return offsets[idx] || `top-[${84 + (idx % 6) * 16}px] md:top-[${96 + (idx % 6) * 20}px]`;
  };

  // Pillars mapped dynamically from backend liveAxes — unified single source of truth
  const pillars = useMemo(() => {
    if (!liveAxes || liveAxes.length === 0) return [];
    const sorted = [...liveAxes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return sorted.map((axis, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const bullets = isAR
        ? (axis.features_ar && axis.features_ar.length > 0 ? axis.features_ar : [])
        : (axis.features_en && axis.features_en.length > 0 ? axis.features_en : axis.features_ar || []);

      const serverImg = axis.image && typeof axis.image === "string" && axis.image.trim() !== ""
        ? formatServerImageUrl(axis.image)
        : (fallbackImages[axis.slug] || imgFood);

      const accents = [
        "bg-secondary text-secondary-foreground",
        "bg-accent text-accent-foreground",
        "bg-primary text-primary-foreground",
      ];

      return {
        id: axis.id,
        number: num,
        slug: axis.slug,
        donateSlug: axis.slug,
        anchorId: `axis-${axis.slug}`,
        tag: isAR ? (axis.badge_ar || axis.name_ar) : (axis.badge_en || axis.name_en || axis.name_ar),
        title: isAR ? axis.name_ar : (axis.name_en || axis.name_ar),
        desc: isAR ? (axis.description_ar || "") : (axis.description_en || axis.description_ar || ""),
        bullets,
        href: `/axes/${axis.slug}`,
        img: serverImg,
        fallbackImg: fallbackImages[axis.slug] || imgFood,
        accent: accents[idx % accents.length],
        aspectClass: "aspect-[16/11] sm:aspect-[16/10] md:aspect-auto",
      };
    });
  }, [liveAxes, isAR]);


  // ── Motion preferences: respect prefers-reduced-motion on mobile.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReducedMotion(mqR.matches);
    };
    apply();
    mqR.addEventListener?.("change", apply);
    return () => {
      mqR.removeEventListener?.("change", apply);
    };
  }, []);

  // ── Lightweight parallax for the donation-axes background (works on mobile,
  // unlike CSS background-attachment: fixed which iOS ignores). Uses a single
  // rAF-throttled scroll listener and a transform on a dedicated bg layer.

  // Single tracking event: mobile journey completion (Hero → end of axes).
  // Fires once when the bottom sentinel of the section enters the viewport on
  // a mobile-sized screen. Unified data source for Google + Meta.
  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    if (!("IntersectionObserver" in window)) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const sentinel = root.current.querySelector<HTMLElement>("[data-axis='journey-end']");
    if (!sentinel) return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (fired) return;
        if (entries.some((e) => e.isIntersecting)) {
          fired = true;
          track("mobile_journey_complete", {
            payload: { section: "work_axes", path: "/" },
            fbEvent: "ViewContent",
          });
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={root}
      id="axes"
      dir={isAR ? "rtl" : "ltr"}
      className="relative overflow-x-clip pt-8 sm:pt-10 md:pt-12 lg:pt-14 pb-20 md:pb-28"
    >
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title column — sticky on lg so the section header stays visible while
            the pillar cards scroll/stack in the second column. On mobile it
            simply sits at the top of the section. */}
        <div className="flex flex-col gap-8 md:gap-12 mt-4 sm:mt-6 md:mt-0">
          <div ref={headerRef} className="mx-auto max-w-2xl text-center">
            {headerLoading ? (
              /* ── Skeleton for section header ── */
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="h-6 w-32 rounded-full bg-secondary/20" />
                <div className="h-9 w-2/3 rounded-xl bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-full max-w-xs rounded bg-muted" />
                  <div className="h-4 w-4/5 max-w-xs rounded bg-muted mx-auto" />
                </div>
              </div>
            ) : (
              <>
                {((isAR ? sectionCMS?.badge_ar : sectionCMS?.badge_en) || "محاور رسالتنا") && (
                  <span data-wa className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3.5 py-1 text-[11px] sm:text-xs font-black text-primary mb-3">
                    {isAR ? (sectionCMS?.badge_ar || "محاور رسالتنا") : (sectionCMS?.badge_en || "Our Work Axes")}
                  </span>
                )}
                <h2 data-wa className="text-[28px] font-black leading-[1.3] text-primary sm:text-3xl md:text-5xl">
                  <span className="hand-underline">
                    {isAR ? (sectionCMS?.title_ar || "محاور رسالتنا") : (sectionCMS?.title_en || "Our Work Axes")}
                  </span>
                </h2>
                <p data-wa className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base md:text-[16px]">
                  {isAR
                    ? (sectionCMS?.subtitle_ar || "بناء إنسان واعٍ جسدياً، ثقافياً، وصحياً. محاورنا الأساسية تخدم رسالتنا:")
                    : (sectionCMS?.subtitle_en || "Building a person who is physically, culturally, and health-aware. Our core pillars serve our mission:")}
                </p>
              </>
            )}
          </div>

          {/* Pillars section: Skeleton while loading, sticky stack when loaded */}
          {axesLoading ? (
            <div className="mt-4 space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mx-auto flex w-full flex-col md:flex-row overflow-hidden rounded-[28px] border border-primary/10 bg-card p-4 shadow-sm animate-pulse gap-6 items-center"
                >
                  <div className="w-full md:w-[55%] h-56 sm:h-64 md:h-80 rounded-2xl bg-muted/70" />
                  <div className="w-full md:w-[45%] space-y-4 p-4">
                    <div className="h-6 w-28 rounded-full bg-secondary/20" />
                    <div className="h-8 w-3/4 rounded-xl bg-muted" />
                    <div className="h-4 w-full rounded bg-muted/60" />
                    <div className="h-4 w-5/6 rounded bg-muted/60" />
                    <div className="space-y-2 pt-2">
                      <div className="h-3.5 w-4/5 rounded bg-muted/50" />
                      <div className="h-3.5 w-3/4 rounded bg-muted/50" />
                      <div className="h-3.5 w-2/3 rounded bg-muted/50" />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <div className="h-9 w-32 rounded-full bg-orange-grad/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StickyStack className="mt-2 sm:mt-4">
              {pillars.map((p, idx) => (
                <StickyStackItem key={p.slug || p.title} index={idx} top={getStickyOffset(idx)}>
                <Link
                  to={p.href}
                  id={p.anchorId}
                  data-axis="card"
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                  style={{ isolation: "isolate" }}
                  className={`group relative isolate mx-auto flex w-full scroll-mt-24 transform-gpu flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-card shadow-card outline-none ring-1 ring-primary/5 transition-colors duration-300 [backface-visibility:hidden] hover:border-secondary/50 focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 md:items-stretch ${idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
                >
                  <meta itemProp="position" content={String(idx + 1)} />
                  <meta itemProp="name" content={p.title} />
                  {/* Brand poster — show full image on mobile, cinematic on desktop */}
                  <div className={`relative overflow-hidden rounded-[28px] bg-card/95 shadow-soft md:w-[55%] md:shrink-0 md:self-stretch ${p.aspectClass}`}>
                    <img
                      src={p.img}
                      alt={p.title}
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                      onError={(e) => {
                        // Fallback to local static assets when server image fails
                        const fallbacks: Record<string, string> = {
                          food: imgFood,
                          health: imgHealth,
                          education: imgEdu,
                        };
                        const fb = fallbacks[p.slug] || imgFood;
                        if ((e.currentTarget as HTMLImageElement).src !== fb) {
                          (e.currentTarget as HTMLImageElement).src = fb;
                        }
                      }}
                      className="absolute inset-0 h-full w-full object-cover md:transition-transform md:duration-500 md:group-hover:scale-105"
                    />
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                      {idx === 1 ? (
                        <>
                          <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[12px] font-black shadow-sm">
                            {p.number}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${p.accent}`}>
                            {p.tag}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${p.accent}`}>
                            {p.tag}
                          </span>
                          <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[12px] font-black shadow-sm">
                            {p.number}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative flex flex-1 flex-col px-5 pb-5 pt-2 md:w-[45%] md:justify-center md:px-8 md:py-8 lg:px-10 lg:py-10">
                    {/* Giant watermark numeral — adds editorial depth */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute end-3 top-1 select-none text-[110px] font-black leading-none text-accent/[0.18] md:text-[160px]"
                      style={{
                        WebkitTextStroke: "0.5px hsl(75 85% 60% / 0.4)",
                      }}
                    >
                      {p.number}
                    </span>
                    <div className="relative">
                      <h3 className="mt-1.5 text-[26px] font-black leading-tight text-primary md:text-[32px]">
                        <span className="bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                          {p.title}
                        </span>
                      </h3>
                      <span aria-hidden className="mt-2 block h-[3px] w-12 rounded-full bg-orange-grad" />
                    </div>
                    <p className="relative mt-3 text-[13.5px] font-semibold leading-7 text-muted-foreground">{p.desc}</p>

                    <ul className="relative mt-4 space-y-2">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-foreground/85">
                          <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary/20 text-primary">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="relative mt-6 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/donate?program=${p.donateSlug}`, { preventScrollReset: false });
                        }}
                        aria-label={`${isAR ? "تبرع لمحور" : "Donate to"} ${p.title}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-4 py-2 text-[12.5px] font-extrabold text-accent-foreground shadow-cta transition hover:-translate-y-0.5 hover:opacity-95"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        {isAR ? "تبرع الآن" : "Donate now"}
                      </button>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-extrabold text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:gap-3 group-hover:bg-accent group-hover:text-accent-foreground group-focus-visible:bg-accent group-focus-visible:text-accent-foreground">
                        {isAR ? "اعرف أكثر" : "Learn more"}
                        <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </StickyStackItem>
            ))}
            <div aria-hidden className="h-2" />
          </StickyStack>
          )}
        </div>
        {/* Sentinel — marks end of the mobile journey for analytics. */}
        <div data-axis="journey-end" aria-hidden className="h-px w-full" />

        {/* ── Modern High-Conversion Action CTA Banner ────── */}
        <section
          aria-label={isAR ? "دعوة للمساهمة والتبرع" : "Call to action"}
          className="relative mt-8 overflow-hidden rounded-[28px] sm:rounded-[36px] border border-secondary/25 bg-gradient-to-br from-[#0c492c] via-[#093e24] to-[#062c19] p-6 text-white shadow-[0_20px_60px_-20px_rgba(10,72,43,0.45)] sm:p-8 md:p-10"
        >
          {/* ── Elegant & Calm Ambient Background Touches ── */}
          {/* Top luminous hairline reflection */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
          
          {/* Gentle central dome aura */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-64 w-[540px] max-w-full rounded-full bg-gradient-to-b from-secondary/20 via-emerald-400/10 to-transparent blur-3xl"
          />

          {/* Calm concentric ripple rings (signifying the expanding ripple of good deeds) */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] sm:h-[480px] sm:w-[480px]">
            <div className="absolute inset-0 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-10 rounded-full border border-secondary/[0.05]" />
            <div className="absolute inset-20 rounded-full border border-white/[0.03]" />
          </div>

          {/* Soft ambient brand glows */}
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          
          {/* Bottom hairline reflection */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Brand badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs font-black text-secondary shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAR ? "مسارات الخير المباشرة" : "Direct Paths of Goodness"}</span>
            </span>

            {/* Inspiring headline */}
            <h2 className="mt-4 max-w-3xl text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-white">
              {isAR ? "كل تبرع منك يصنع فارقاً حقيقياً في حياة أسرة مستحقة" : "Every donation makes a real difference in a deserving family's life"}
            </h2>

            {/* Clear reassuring subtitle */}
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm md:text-base font-normal leading-relaxed text-white/90">
              {isAR
                ? "اختر البرنامج المناسب، تبرع بسهولة وأمان بأي مبلغ، واطلب توثيق تبرعك بالفيديو والصور ليصلك الأثر أينما كنت."
                : "Choose the right program, donate easily and securely, and request photo and video documentation of your donation."}
            </p>

            {/* High-impact CTA Buttons: Brand Orange & Lemon-Lime side-by-side */}
            <div className="mt-7 flex flex-row flex-nowrap items-center justify-center gap-2.5 sm:gap-4 w-full max-w-xl mx-auto">
              <Button
                asChild
                size="lg"
                className="group h-11 sm:h-12 flex-1 min-w-0 px-3 sm:px-6 rounded-2xl bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground no-underline shadow-cta transition-all duration-300 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
              >
                <Link to="/donate" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Heart className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 fill-current transition-transform duration-300 group-hover:scale-110" />
                  <span>{isAR ? "تبرع الآن" : "Donate now"}</span>
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="group h-11 sm:h-12 flex-1 min-w-0 px-3 sm:px-6 rounded-2xl !bg-[#a3e635] hover:!bg-[#bbf451] !text-[#062c19] text-xs sm:text-sm font-black no-underline shadow-[0_8px_20px_-4px_rgba(163,230,53,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/projects" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <FolderHeart className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 !text-[#062c19] transition-transform duration-300 group-hover:scale-110" />
                  <span className="!text-[#062c19] font-black">{isAR ? "تصفح مشاريع الخير" : "Explore Projects"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkAxes;
