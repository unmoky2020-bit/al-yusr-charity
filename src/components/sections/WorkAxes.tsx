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
import { axesApi, contentApi } from "@/data/laravelApi";
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

  const { data: liveAxes, isLoading, isError } = useQuery({
    queryKey: ["work-axes-live"],
    queryFn: () => axesApi.list(),
    staleTime: 60_000,
  });

  const [sectionCMS, setSectionCMS] = useState<{
    badge_ar?: string;
    badge_en?: string;
    title_ar?: string;
    title_en?: string;
    subtitle_ar?: string;
    subtitle_en?: string;
  } | null>(null);

  // Load axes section header from homepage/content API
  // Backend fields: section_axes_title_ar, section_axes_subtitle_ar (to be added)
  // Until backend adds these fields, this remains null and falls back to static text below.
  useEffect(() => {
    contentApi.homepage().then((data) => {
      if (data && data.section_axes_title_ar) {
        setSectionCMS({
          badge_ar: data.section_axes_badge_ar || undefined,
          badge_en: data.section_axes_badge_en || undefined,
          title_ar: data.section_axes_title_ar || undefined,
          title_en: data.section_axes_title_en || undefined,
          subtitle_ar: data.section_axes_subtitle_ar || undefined,
          subtitle_en: data.section_axes_subtitle_en || undefined,
        });
      }
    }).catch(() => { /* keep null — static text used as fallback */ });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) return;
    const ctx = gsap.context(() => {
      const items = headerRef.current!.querySelectorAll("[data-wa]");
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
  }, []);

  const defaultPillars = useMemo(() => [
    {
      img: imgFood,
      number: "01",
      slug: "food",
      donateSlug: "box",
      anchorId: "axis-food",
      tag: isAR ? "محور الإطعام" : "Food pillar",
      title: isAR ? "الغذاء" : "Food",
      desc: isAR
        ? "نوفر لأهالينا المستحقين الأمن الغذائي والدعم التمويني المستدام."
        : "Ensuring food security and continuous nutrition support for families in need.",
      bullets: isAR
        ? [
          "كرتونة الغذاء الشهرية ولحوم بلدي",
          "الوجبات الساخنة من مطابخنا",
          "أكثر من 5 طن لحوم سنويًا من مزارعنا",
        ]
        : ["Monthly food box + local meat", "Hot meals from our kitchens", "Over 5 tons of meat per year from our farms"],
      href: "/axes/food",
      accent: "bg-secondary text-secondary-foreground",
      aspectClass: "aspect-[16/11] sm:aspect-[16/10] md:aspect-auto",
    },
    {
      img: imgHealth,
      number: "02",
      slug: "health",
      donateSlug: "treatment",
      anchorId: "axis-health",
      tag: isAR ? "محور الصحة" : "Health pillar",
      title: isAR ? "الصحة" : "Health",
      desc: isAR
        ? "بناء إنسان معافى وقادر على العمل والحياة الكريمة من خلال الرعاية الطبية."
        : "Building a healthy individual able to live with dignity through comprehensive medical care.",
      bullets: isAR
        ? [
          "مجمعاتنا الطبية وعيادات الكشف",
          "روشتات علاج شهرية وعمليات جراحية",
          "قوافل علاجية في القرى النائية",
          "أطراف صناعية وتحدي إعاقة",
        ]
        : ["Medical complexes and clinics", "Monthly prescriptions & surgeries", "Medical caravans in remote villages", "Prosthetics & disability support"],
      href: "/axes/health",
      accent: "bg-accent text-accent-foreground",
      aspectClass: "aspect-[16/11] sm:aspect-[16/10] md:aspect-auto",
    },
    {
      img: imgEdu,
      number: "03",
      slug: "education",
      donateSlug: "education",
      anchorId: "axis-education",
      tag: isAR ? "محور التعليم" : "Education pillar",
      title: isAR ? "التعليم" : "Education",
      desc: isAR
        ? "محاربة الفقر بالعلم والمعرفة وتأمين مستقبل الأجيال القادمة."
        : "Fighting poverty with knowledge and securing future generations inside our educational complex.",
      bullets: isAR
        ? [
          "حقائب وأدوات مدرسية",
          "مصاريف مدرسية",
          "زي مدرسي",
          "دروس ومتابعة داخل المجمّع التعليمي",
        ]
        : ["School bags and supplies", "School fees sponsorship", "School uniforms", "Tutoring inside our educational complex"],
      href: "/axes/education",
      accent: "bg-primary text-primary-foreground",
      aspectClass: "aspect-[16/11] sm:aspect-[16/10] md:aspect-auto",
    },
  ], [isAR]);

  const pillars = useMemo(() => {
    return defaultPillars.map((defPillar) => {
      const live = (liveAxes || []).find((a: any) => a.slug === defPillar.slug);
      if (!live) return defPillar;

      const bullets = isAR
        ? (live.features_ar && live.features_ar.length > 0 ? live.features_ar : defPillar.bullets)
        : (live.features_en && live.features_en.length > 0 ? live.features_en : defPillar.bullets);

      // Use server image if available and valid — run through formatServerImageUrl for proper URL resolution
      const rawImg = live.image && typeof live.image === "string" && !live.image.includes("elyusr-local-mock.internal")
        ? live.image
        : null;
      const serverImg = rawImg ? (import.meta.env.DEV && rawImg.startsWith("https://elyusr-api.pyramedx.com")
        ? rawImg.replace("https://elyusr-api.pyramedx.com", "")
        : rawImg)
        : defPillar.img;

      return {
        ...defPillar,
        img: serverImg,
        tag: isAR ? (live.badge_ar || defPillar.tag) : (live.badge_en || defPillar.tag),
        title: isAR ? (live.name_ar || defPillar.title) : (live.name_en || defPillar.title),
        desc: isAR ? (live.description_ar || defPillar.desc) : (live.description_en || defPillar.desc),
        bullets,
      };
    });
  }, [liveAxes, defaultPillars, isAR]);


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
          </div>

          {/* 3 hero pillars — native on mobile, CSS sticky stack on large screens */}
          <StickyStack className="mt-2 sm:mt-4">
            {pillars.map((p, idx) => (
              <StickyStackItem key={p.title} index={idx} top={stickyOffsets[idx]}>
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
        </div>
        {/* Sentinel — marks end of the mobile journey for analytics. */}
        <div data-axis="journey-end" aria-hidden className="h-px w-full" />

        {/* ── Modern High-Conversion Action CTA Banner ────── */}
        <section
          aria-label={isAR ? "دعوة للمساهمة والتبرع" : "Call to action"}
          className="relative mt-8 overflow-hidden rounded-[32px] border border-secondary/25 bg-gradient-to-br from-[#0c492c] via-[#093e24] to-[#062c19] p-6 text-primary-foreground shadow-[0_20px_60px_-20px_rgba(10,72,43,0.4)] sm:p-8 md:p-10"
        >
          {/* Subtle brand pattern & radiant glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "url('/patterns/yusr-quatrefoil.png')", backgroundSize: "160px 160px" }} />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-1.5 text-xs font-black text-secondary shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {isAR ? "مسارات الخير المباشرة" : "Direct Paths of Goodness"}
            </span>

            <h2 className="mt-4 max-w-3xl text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-white">
              {isAR ? "كل تبرع منك يصنع فارقاً حقيقياً في حياة أسرة مستحقة" : "Every donation makes a real difference in a deserving family's life"}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-xs font-medium leading-relaxed text-primary-foreground/90 sm:text-sm md:text-base">
              {isAR
                ? "اختر البرنامج المناسب، تبرع بسهولة وأمان بأي مبلغ، واطلب توثيق تبرعك بالفيديو والصور ليصلك الأثر أينما كنت."
                : "Choose the right program, donate easily and securely, and request photo and video documentation of your donation."}
            </p>

            {/* Always one row — flex-row + flex-nowrap ensures both buttons stay side by side on all screen sizes */}
            <div className="mt-7 flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-4 w-full max-w-xl mx-auto">
              <Button asChild size="lg" className="h-11 flex-1 min-w-0 px-3 sm:h-12 sm:px-8 rounded-2xl bg-orange-grad text-xs sm:text-sm font-black text-accent-foreground no-underline shadow-cta hover:opacity-95">
                <Link to="/donate" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>{isAR ? "تبرع الآن" : "Donate now"}</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="h-11 flex-1 min-w-0 px-3 sm:h-12 sm:px-8 rounded-2xl bg-secondary text-secondary-foreground text-xs sm:text-sm font-black no-underline shadow-cta hover:opacity-95">
                <Link to="/services-map" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Compass className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>{isAR ? "خريطة الخدمات الكاملة" : "Full services map"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── 3 Enhanced Bottom Feature Cards (Sticky Stacked on Mobile, Grid on Desktop) ── */}
        <div className="relative mt-8 flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-5">
          {[
            {
              title: isAR ? "برامجنا ومشاريعنا" : "Programs & Projects",
              text: isAR ? "كل محور مرتبط مباشرة ببرنامج تفصيلي للتبرع والمتابعة المستمرة." : "Each axis links to a detailed donation and follow-up program.",
              href: "/programs",
              Icon: FolderHeart,
              accent: "text-primary bg-primary/10 border-primary/20",
              stickyTop: "top-[80px]",
              zIndex: "z-10",
              badge: isAR ? "مشاريع مستمرة" : "Ongoing Projects",
            },
            {
              title: isAR ? "الحالات العاجلة" : "Urgent Cases",
              text: isAR ? "شاهد الحالات الإنسانية الموثقة ميدانياً والتي تحتاج دعمًا عاجلًا الآن." : "Browse verified cases that need urgent support right now.",
              href: "/cases",
              Icon: HeartHandshake,
              accent: "text-accent bg-accent/15 border-accent/25",
              stickyTop: "top-[100px]",
              zIndex: "z-20",
              badge: isAR ? "نداء إنساني" : "Humanitarian Call",
            },
            {
              title: isAR ? "قصص الأثر من الميدان" : "Impact Stories",
              text: isAR ? "تابع كيف تحوّل التبرع إلى أثر حقيقي وحياة داخل بيوت أهالينا." : "See how donations turn into real life and lasting impact inside families' homes.",
              href: "/stories",
              Icon: Sparkles,
              accent: "text-secondary bg-secondary/20 border-secondary/30",
              stickyTop: "top-[120px]",
              zIndex: "z-30",
              badge: isAR ? "أثر موثّق" : "Verified Impact",
            },
          ].map((item, idx) => (
            <Link
              key={item.href}
              to={item.href}
              className={`group relative isolate flex flex-col justify-between overflow-hidden rounded-[28px] border-2 border-border/80 bg-gradient-to-b from-card via-card/95 to-[#f8fcf2] p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-secondary/60 hover:shadow-[0_16px_36px_-12px_hsl(var(--secondary)/0.35)] sm:p-7 sticky ${item.stickyTop} ${item.zIndex} md:static md:z-auto`}
            >
              {/* Subtle ambient luxury glow & brand pattern */}
              <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-[0.07]" />
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/15 blur-2xl transition-all duration-500 group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${item.accent} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                    <item.Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary/15 px-3 py-1 text-[10.5px] font-black text-primary">
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black text-primary sm:text-xl">{item.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground sm:text-sm">{item.text}</p>
              </div>

              <div className="relative mt-6 flex items-center justify-between border-t border-primary/10 pt-3.5 text-xs font-black text-accent transition-colors group-hover:text-primary">
                <span className="font-black tracking-wide">{isAR ? "افتح الصفحة" : "Open page"}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/10 text-accent transition-all group-hover:bg-orange-grad group-hover:text-accent-foreground shadow-sm">
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[-2px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkAxes;
