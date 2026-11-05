import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Send, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import family from "@/assets/family-hope.webp";
import hands from "@/assets/hands-sprout.jpg";
import hero from "@/assets/hero-child.jpg";
import edu from "@/assets/program-education.jpg";
import orph from "@/assets/program-orphans.jpg";
import { Button } from "@/components/ui/button";
import { CharacterMascot, type MascotState } from "@/components/common/CharacterMascot";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const imgs = [family, hands, edu, orph, hero];

/** Slugify chapter title (latin-safe id derived from numeric step). */
const stepId = (i: number) => `journey-step-${i + 1}`;

/** Per-step gradient palette (semantic tokens only — works in light/dark). */
const gradients = [
  "from-primary/90 via-primary/70 to-secondary/40",
  "from-secondary/90 via-secondary/70 to-accent/40",
  "from-accent/90 via-accent/70 to-secondary/40",
  "from-primary/90 via-secondary/60 to-accent/40",
  "from-accent/90 via-primary/60 to-secondary/40",
];

/** Mascot state synced with each story chapter. */
const mascotStates: MascotState[] = ["sad", "think", "wave", "celebrate", "celebrate"];

/** Per-step donation cause + CTA — links the story to a real action. */
type CaseCTA = {
  href: string;
  labelAr: string;
  labelEn: string;
  storyAr: string;
  storyEn: string;
};
const cases: CaseCTA[] = [
  {
    href: "/cases",
    labelAr: "ادعم حالة عاجلة الآن",
    labelEn: "Support an urgent case",
    storyAr: "أم بثلاثة أطفال في قرية بالدقهلية فقدت معيلها — حالتها بانتظار داعم.",
    storyEn: "A widowed mother of three in a Dakahlia village lost her breadwinner — her case awaits a sponsor.",
  },
  {
    href: "/donate?cause=food",
    labelAr: "تبرع بكرتونة عزومة",
    labelEn: "Donate a food box",
    storyAr: "كرتونة عزومة بـ500 جنيه تكفي أسرة أسبوعين كاملين في رمضان.",
    storyEn: "A 500 EGP food box feeds a family for two weeks during Ramadan.",
  },
  {
    href: "/qurbani",
    labelAr: "احجز صك أضحيتك",
    labelEn: "Reserve your Qurbani",
    storyAr: "صك أضحيتك يصل إلى 7 أسر في قرية واحدة يوم العيد، بفرحة لا تُنسى.",
    storyEn: "Your Qurbani share reaches 7 families in one village on Eid day — joy they never forget.",
  },
  {
    href: "/donate?cause=orphan",
    labelAr: "ادعم تعليم يتيم",
    labelEn: "Sponsor an orphan",
    storyAr: "كفالة تعليم يتيم بـ300 جنيه شهريًا = مستقبل كامل يبدأ بكتاب وقلم.",
    storyEn: "Orphan education sponsorship at 300 EGP/month = a future that starts with a book and pen.",
  },
  {
    href: "/donate?recurring=1",
    labelAr: "كن داعمًا شهريًا",
    labelEn: "Become a monthly supporter",
    storyAr: "تبرع شهري ثابت يعني أسرة آمنة كل شهر، وأثر يدوم لسنوات.",
    storyEn: "A recurring monthly gift means a family is safe every month, with impact for years.",
  },
];

/**
 * Journey of Hope — Premium Sticky Scroll Cards + cinematic Character Mascot.
 * - Desktop: sticky 5-state animated mascot + image cross-fade synced to scroll.
 * - Mobile: stacked gradient cards with full image + per-step CTA.
 * - Per-step "cause" story + CTA (donate / qurbani / case / sponsor).
 * - SEO: ItemList + FAQPage + Breadcrumb JSON-LD scoped to the section.
 */
export const Journey = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const sectionRef = useRef<HTMLElement | null>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = stepRefs.current.filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    let raf = 0;
    let snapTimer = 0;
    let pointerDown = false;
    let pointerStartY = 0;
    let pointerMoved = false;
    let snapArmed = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(media.matches);
    const setActiveIndex = (idx: number) => {
      if (idx === activeRef.current) return;
      activeRef.current = idx;
      setActive(idx);
    };
    const compute = () => {
      raf = 0;
      const activationLine = Math.min(window.innerHeight * 0.48, 420);
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        const isCurrentBand = r.top <= activationLine && r.bottom > activationLine;
        if (isCurrentBand) {
          bestIdx = i;
          break;
        }
        const stepAnchor = r.top + Math.min(r.height * 0.42, 360);
        const dist = Math.abs(stepAnchor - activationLine);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      setActiveIndex(bestIdx);
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
      if (snapArmed && !pointerDown) scheduleSnap(170);
    };
    const snapToNearest = () => {
      if (media.matches || !sectionRef.current) return;
      const sectionBox = sectionRef.current.getBoundingClientRect();
      if (sectionBox.bottom < 120 || sectionBox.top > window.innerHeight - 120) return;
      const currentY = window.scrollY;
      const stickyOffset = Math.min(window.innerHeight * 0.16, 92);
      let nearest = activeRef.current;
      let nearestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < els.length; i++) {
        const targetY = currentY + els[i].getBoundingClientRect().top - stickyOffset;
        const dist = Math.abs(targetY - currentY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      if (Math.abs((window.scrollY + els[nearest].getBoundingClientRect().top - stickyOffset) - currentY) > window.innerHeight * 0.62 && snapArmed) {
        scheduleSnap(120);
        return;
      }
      snapArmed = false;
      setActiveIndex(nearest);
      window.scrollTo({
        top: window.scrollY + els[nearest].getBoundingClientRect().top - stickyOffset,
        behavior: "smooth",
      });
    };
    const scheduleSnap = (delay = 150) => {
      window.clearTimeout(snapTimer);
      if (media.matches) return;
      snapTimer = window.setTimeout(snapToNearest, delay);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      pointerDown = true;
      pointerMoved = false;
      snapArmed = false;
      pointerStartY = event.clientY;
      window.clearTimeout(snapTimer);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown || event.pointerType === "mouse") return;
      if (Math.abs(event.clientY - pointerStartY) > 10) pointerMoved = true;
      onScroll();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      pointerDown = false;
      onScroll();
      snapArmed = pointerMoved;
      if (pointerMoved) scheduleSnap(220);
    };
    const gsapContext = media.matches
      ? null
      : gsap.context(() => {
          els.forEach((el, index) => {
            ScrollTrigger.create({
              trigger: el,
              start: "top 58%",
              end: "bottom 42%",
              onEnter: () => setActiveIndex(index),
              onEnterBack: () => setActiveIndex(index),
              invalidateOnRefresh: true,
            });
          });
        }, sectionRef);
    // Initial sync + listeners (passive for smoothness on mobile)
    syncReducedMotion();
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    sectionRef.current?.addEventListener("pointerdown", onPointerDown, { passive: true });
    sectionRef.current?.addEventListener("pointermove", onPointerMove, { passive: true });
    sectionRef.current?.addEventListener("pointerup", onPointerUp, { passive: true });
    sectionRef.current?.addEventListener("pointercancel", onPointerUp, { passive: true });
    media.addEventListener?.("change", syncReducedMotion);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(snapTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      sectionRef.current?.removeEventListener("pointerdown", onPointerDown);
      sectionRef.current?.removeEventListener("pointermove", onPointerMove);
      sectionRef.current?.removeEventListener("pointerup", onPointerUp);
      sectionRef.current?.removeEventListener("pointercancel", onPointerUp);
      media.removeEventListener?.("change", syncReducedMotion);
      gsapContext?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="journey"
      dir={isRTL ? "rtl" : "ltr"}
      data-source="journey"
      className="relative [overflow:clip] bg-gradient-to-b from-background via-secondary/5 to-muted/40 py-10 sm:py-12 lg:py-20"
    >
      {/* SEO: ItemList + Breadcrumb + FAQ for the Journey section */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: t.journey.title,
              description: t.journey.subtitle,
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: t.journey.steps.length,
              itemListElement: t.journey.steps.map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: s.title,
                description: s.desc,
                url: `https://elyusr.org/#${stepId(i)}`,
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: isRTL ? "الرئيسية" : "Home", item: "https://elyusr.org/" },
                { "@type": "ListItem", position: 2, name: t.journey.title, item: "https://elyusr.org/#journey" },
                ...t.journey.steps.map((s, i) => ({
                  "@type": "ListItem",
                  position: 3 + i,
                  name: s.title,
                  item: `https://elyusr.org/#${stepId(i)}`,
                })),
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: t.journey.steps.map((s, i) => ({
                "@type": "Question",
                name: isRTL ? `ماذا يعني ${s.title} في رحلة التبرع؟` : `What does "${s.title}" mean in the donation journey?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `${s.desc} — ${isRTL ? cases[i].storyAr : cases[i].storyEn}`,
                },
              })),
            },
          ]),
        }}
      />
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -start-10 top-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute -end-10 bottom-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto px-4">
        {/* Cinematic hero band — parallax bg on desktop, animated overlays both */}
        <div className="relative mx-auto mb-8 overflow-hidden rounded-3xl border border-secondary/20 shadow-card sm:rounded-[2rem] lg:mb-12">
          <div
            className="relative h-[360px] min-h-[360px] w-full bg-cover bg-center sm:h-[420px] lg:h-[480px] lg:bg-fixed xl:h-[520px]"
            style={{ backgroundImage: `url(${hero})` }}
          >
            {/* Layered gradient — depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/60 to-primary/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.25),transparent_60%)]" />
            {/* Decorative animated orbs */}
            <span aria-hidden className="pointer-events-none absolute -start-10 top-10 h-40 w-40 rounded-full bg-secondary/30 blur-3xl animate-pulse" />
            <span aria-hidden className="pointer-events-none absolute -end-12 bottom-6 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />
            {/* Soft grain via SVG noise */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-background/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-secondary backdrop-blur-md shadow-soft">
                <Sparkles className="h-3.5 w-3.5" />
                {isRTL ? "قصة كل تبرع" : "Every donation's story"}
              </span>
              <h2 className="mt-4 text-4xl font-black leading-[1.05] drop-shadow-lg sm:text-5xl lg:text-7xl">
                <span className="bg-gradient-to-b from-primary-foreground via-secondary/95 to-secondary bg-clip-text text-transparent">
                  {t.journey.title}
                </span>
              </h2>
              <div className="mx-auto mt-5 flex items-center gap-2" aria-hidden>
                <span className="h-px w-10 bg-secondary/60" />
                <span className="h-2 w-2 rotate-45 bg-secondary" />
                <span className="h-1 w-24 rounded-full bg-gradient-to-r from-secondary via-accent to-secondary" />
                <span className="h-2 w-2 rotate-45 bg-secondary" />
                <span className="h-px w-10 bg-secondary/60" />
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-primary-foreground/90 md:text-base">
                {t.journey.subtitle}
              </p>

              {/* Trust strip */}
              <ul className="mt-6 grid grid-cols-3 items-center justify-center gap-2 text-[10px] font-extrabold text-primary-foreground/95 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:text-xs">
                <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-secondary" />{isRTL ? "مرخصة 2665/2019" : "Licensed 2665/2019"}</li>
                <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-secondary" />{isRTL ? "+75 ألف أسرة" : "75K+ families"}</li>
                <li className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-secondary" />{isRTL ? "98% توثيق" : "98% documented"}</li>
              </ul>
            </div>

            {/* Bottom fade into next section */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background/40" />
          </div>
        </div>

        {/* === Premium Timeline strip — RTL-aware, breadcrumb per stage ====== */}
        <nav
          aria-label={isRTL ? "خطوات رحلة الأمل" : "Journey of Hope steps"}
          className="mx-auto mb-12 max-w-5xl"
        >
          {/* Breadcrumb (mini) */}
          <ol className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">{isRTL ? "الرئيسية" : "Home"}</Link></li>
            <li aria-hidden>{isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</li>
            <li><a href="#journey" className="text-primary">{t.journey.title}</a></li>
            <li aria-hidden>{isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</li>
            <li className="text-secondary">{t.journey.steps[active]?.title}</li>
          </ol>

          {/* Visual timeline rail */}
          <ol className="relative grid grid-cols-5 items-stretch gap-1 rounded-2xl border border-border/60 bg-card/80 px-2 py-3 shadow-soft backdrop-blur sm:flex sm:justify-between sm:gap-2 sm:px-4">
            {/* Track */}
            <span aria-hidden className="pointer-events-none absolute inset-x-6 top-1/2 -z-0 h-px -translate-y-1/2 bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20" />
            {t.journey.steps.map((s, i) => {
              const isActive = active === i;
              const isDone = i < active;
              return (
                <li key={i} className="relative z-10 flex min-w-0 flex-1 flex-col items-center sm:min-w-[100px]">
                  <a
                    href={`#${stepId(i)}`}
                    aria-current={isActive ? "step" : undefined}
                    className="group flex w-full flex-col items-center gap-1.5 focus-visible:outline-none"
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full font-mono text-[10px] font-black ring-2 transition-all motion-reduce:transition-none sm:h-11 sm:w-11 sm:text-sm ${
                        isActive
                          ? "bg-orange-grad text-accent-foreground ring-secondary shadow-cta scale-110"
                          : isDone
                            ? "bg-secondary text-secondary-foreground ring-secondary/50"
                            : "bg-card text-primary ring-border group-hover:ring-secondary/60"
                      }`}
                    >
                      {s.num}
                    </span>
                    <span className={`min-h-[2rem] w-full text-center text-[9px] font-extrabold leading-tight sm:text-[11px] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {s.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile-only compact title (parallax band already shows it on all sizes) */}
        <div className="sr-only">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary shadow-soft">
            <Heart className="h-3.5 w-3.5 text-accent" />
            {isRTL ? "قصة كل تبرع" : "Every donation's story"}
          </span>
        </div>

        {/* === Premium Sticky-Stack Scroll Cards (single unified layout) ===== */}
        <div className="relative mx-auto max-w-5xl">
          <ol className="relative touch-pan-y [overscroll-behavior-y:contain] [&>li]:list-none">
            {t.journey.steps.map((s, i) => {
              const isLast = i === t.journey.steps.length - 1;
              const NextIcon = isRTL ? ArrowLeft : ArrowRight;
              const c = cases[i];
              const total = t.journey.steps.length;
              const distance = Math.abs(active - i);
              const isPast = i < active;
              const cardTransform = reducedMotion
                ? "none"
                : active === i
                  ? "translate3d(0,0,0) scale(1)"
                  : isPast
                    ? `translate3d(0,${Math.max(-22, -distance * 7)}px,0) scale(${Math.max(0.94, 1 - distance * 0.022)})`
                    : `translate3d(0,${Math.min(28, distance * 9)}px,0) scale(${Math.max(0.96, 1 - distance * 0.018)})`;
              return (
                <li
                  key={i}
                  data-idx={i}
                  ref={(el) => (stepRefs.current[i] = el)}
                  className="relative scroll-mt-24 [scroll-snap-align:start] [scroll-snap-stop:always]"
                  style={{
                    // Each step gets its own scroll viewport so the card can stick
                    minHeight: reducedMotion ? "auto" : "clamp(560px, 82vh, 760px)",
                    zIndex: 20 + i,
                  }}
                >
                  <article
                    id={stepId(i)}
                    aria-current={active === i ? "step" : undefined}
                    className={`group relative mx-auto mb-6 overflow-hidden rounded-3xl border bg-card shadow-card [backface-visibility:hidden] sm:rounded-[2rem] ${
                      active === i ? "border-secondary/50 shadow-cta" : "border-border/60"
                    } [transition:transform_520ms_var(--ease-out-soft),opacity_320ms_var(--ease-out-soft),box-shadow_320ms_var(--ease-out-soft),border-color_320ms_var(--ease-out-soft)] will-change-[transform,opacity] motion-reduce:transition-none motion-reduce:will-change-auto`}
                    style={{
                      position: reducedMotion ? "relative" : "sticky",
                      top: `calc(5rem + ${i * 12}px)`,
                      transform: cardTransform,
                      opacity: reducedMotion ? 1 : active === i ? 1 : isPast ? 0.62 : 0.88,
                    }}
                  >
                    <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
                      {/* Media side */}
                      <div className="relative h-[240px] w-full overflow-hidden sm:h-[300px] md:h-full md:min-h-[420px]">
                        <img
                          src={imgs[i % imgs.length]}
                          alt={s.title}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-tr ${gradients[i % gradients.length]} mix-blend-multiply`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
                        {/* Big numeric watermark */}
                        <span className="pointer-events-none absolute end-4 top-3 font-mono text-6xl font-black leading-none text-primary-foreground/25 sm:text-7xl">
                          {s.num}
                        </span>
                        {/* Mascot — only on active card to keep it smooth */}
                        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                          <CharacterMascot
                            state={mascotStates[i] ?? "wave"}
                            className={`h-24 w-24 drop-shadow-2xl transition-all duration-500 motion-reduce:transition-none sm:h-32 sm:w-32 lg:h-40 lg:w-40 ${
                              active === i ? "opacity-100 scale-100" : "opacity-70 scale-95"
                            }`}
                          />
                        </div>
                        {/* Chapter label bottom */}
                        <div className="absolute inset-x-4 bottom-3 text-primary-foreground sm:inset-x-6 sm:bottom-5 md:hidden">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-secondary backdrop-blur">
                            {isRTL ? `الفصل ${s.num}` : `Chapter ${s.num}`}
                          </span>
                          <h3 className="mt-1.5 text-2xl font-black leading-tight drop-shadow">{s.title}</h3>
                        </div>
                      </div>

                      {/* Content side */}
                      <div className="relative p-5 sm:p-7 lg:p-9">
                        {/* Step progress (top of content) */}
                        <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-grad font-mono text-[11px] text-accent-foreground shadow-cta">
                            {s.num}
                          </span>
                          <span className="text-primary">{isRTL ? `الفصل ${i + 1} / ${total}` : `Chapter ${i + 1} / ${total}`}</span>
                        </div>
                        <h3 className="bg-gradient-to-b from-primary to-primary/70 bg-clip-text text-2xl font-black leading-tight text-transparent sm:text-3xl lg:text-4xl">
                          {s.title}
                        </h3>
                        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-secondary to-accent" aria-hidden />
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{s.desc}</p>

                        {/* Linked donation story */}
                        <div className="mt-5 rounded-2xl border border-secondary/25 bg-secondary/5 p-3.5 sm:p-4">
                          <p className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85">
                            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            <span>{isRTL ? c.storyAr : c.storyEn}</span>
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6">
                          {!isLast && (
                            <Button asChild size="sm" variant="outline" className="border-secondary/40 bg-secondary/5 text-primary hover:bg-secondary/15">
                              <a href={`#${stepId(i + 1)}`} data-cta="journey-next" data-step={i + 1}>
                                {isRTL ? "الخطوة التالية" : "Next step"}
                                <NextIcon className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button asChild size="sm" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                            <Link to={c.href} data-cta="journey-step-cta" data-step={i + 1}>
                              <Heart className="h-4 w-4" />
                              {isRTL ? c.labelAr : c.labelEn}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          {/* Newsletter / CTA closer */}
          <div
            className="relative z-50 mt-10 rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-card sm:p-6 md:mt-16 md:p-10"
          >
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
              <div>
                <h3 className="text-xl font-black md:text-2xl">
                  {isRTL ? "كن جزءًا من التغيير" : "Be part of the change"}
                </h3>
                <p className="mt-2 text-sm text-primary-foreground/85 md:text-base">
                  {isRTL
                    ? "اشترك في نشرتنا البريدية للحصول على آخر الأخبار والحملات."
                    : "Subscribe to our newsletter for the latest stories and campaigns."}
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95"
              >
                <Link
                  to="/donate"
                  data-cta="journey-donate"
                  data-source="journey"
                  onClick={() => {
                    (window as any).dataLayer?.push?.({ event: "cta_click", source: "journey", target: "/donate" });
                    (window as any).gtag?.("event", "cta_click", { source: "journey", target: "/donate" });
                    (window as any).fbq?.("trackCustom", "JourneyCTA");
                  }}
                >
                  <Send className="h-4 w-4" />
                  {isRTL ? "تبرع الآن" : "Donate now"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
