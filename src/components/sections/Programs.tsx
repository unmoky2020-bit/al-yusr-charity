import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Utensils, Stethoscope, GraduationCap, Droplets, Home,
  BadgeCheck, MessageCircle, Heart, Search, Truck, Camera, ListChecks, Activity,
  HandHeart, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Pause, Play,
} from "lucide-react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { programs, type ProgramContent } from "@/data/programs";
import { track } from "@/lib/track";
import { LazyImage } from "@/components/common/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";
import { programHref } from "@/data/programLandings";

/** WhatsApp number used by the org (digits only, E.164-friendly). */
const WA_NUMBER = "201097000137";
const waUrl = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

/** SessionStorage key for the lightweight in-page performance panel. */
const PERF_KEY = "alyusr.programs.perf.v1";
type PerfMap = Record<string, number>;
const loadPerf = (): PerfMap => {
  try { return JSON.parse(sessionStorage.getItem(PERF_KEY) || "{}"); }
  catch { return {}; }
};
const bumpPerf = (key: string) => {
  try {
    const p = loadPerf();
    p[key] = (p[key] || 0) + 1;
    sessionStorage.setItem(PERF_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent("alyusr:perf"));
  } catch {}
};

/**
 * Unified Programs section — combines basic-needs pillars + the full
 * program list. Each card has clear CTAs (Donate, Learn more, WhatsApp)
 * and a "Steps" dialog explaining the 4-stage path: donate → research →
 * execute → follow up. Every CTA is instrumented via lib/track.
 */
export const Programs = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [stepsFor, setStepsFor] = useState<ProgramContent | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // 3 strategic pillars from our official mission (الغذاء / الصحة / التعليم)
  const corePillars = isRTL
    ? [
        { icon: Utensils, name: "الغذاء", slug: "box", stat: "+1400 كرتونة و5 طن لحوم/2025",
          desc: "كرتونة العزومة، وكيلو اللحم، ومطبخ اليسر، ومزارعنا الوقفية — حياة كريمة بلا جوع." },
        { icon: Stethoscope, name: "الصحة", slug: "treatment", stat: "مجمع طبي + غسيل كلوي + قوافل",
          desc: "علاج وأدوية وعمليات، وأطراف صناعية، وقوافل طبية تخصصية تصل إلى القرى البعيدة." },
        { icon: GraduationCap, name: "التعليم", slug: "education", stat: "354 طالبًا تحت الكفالة 2025",
          desc: "مصروفات دراسية وأدوات وزي مدرسي ودروس تقوية — استثمار في مستقبل طفل ومستقبل مصر." },
      ]
    : [
        { icon: Utensils, name: "Food", slug: "box", stat: "+1,400 boxes & 5 tons meat / 2025",
          desc: "Food boxes, kilo of meat, our kitchen, and waqf farms — a dignified life with no hunger." },
        { icon: Stethoscope, name: "Health", slug: "treatment", stat: "Medical complex + dialysis + convoys",
          desc: "Treatment, medication, surgeries, prosthetics, and specialty convoys reaching remote villages." },
        { icon: GraduationCap, name: "Education", slug: "education", stat: "354 sponsored students / 2025",
          desc: "Tuition, supplies, uniforms and tutoring — investing in a child and Egypt's future." },
      ];

  // Secondary needs we also lead on
  const secondaryNeeds = isRTL
    ? [
        { icon: Droplets, name: "سقيا الماء", slug: "water" },
        { icon: Home, name: "ستر وتسقيف", slug: "shelter" },
        { icon: HandHeart, name: "كفالة أيتام", slug: "orphans" },
        { icon: Sparkles, name: "تيسير زواج", slug: "bride" },
      ]
    : [
        { icon: Droplets, name: "Water", slug: "water" },
        { icon: Home, name: "Shelter", slug: "shelter" },
        { icon: HandHeart, name: "Orphans", slug: "orphans" },
        { icon: Sparkles, name: "Marriage", slug: "bride" },
      ];

  const orderedPrograms = useMemo(
    () => [...programs].sort((a, b) => (a.priceFrom === 0 ? 1 : 0) - (b.priceFrom === 0 ? 1 : 0)),
    [],
  );

  // Inline journey definition reused per program card
  const journey = isRTL
    ? [
        { icon: Search, t: "بحث ميداني", d: "زيارة منزلية + تحقق من الاستحقاق قبل أي صرف." },
        { icon: Heart, t: "تبرع آمن", d: "ادفع بأمان عبر فيزا أو فودافون كاش أو إنستا باي." },
        { icon: Truck, t: "تنفيذ وتسليم", d: "تجهيز الخير وتسليمه حتى باب البيت بكرامة." },
        { icon: Camera, t: "متابعة وتوثيق", d: "تقرير صور وفيديو يصلك بعد التسليم." },
      ]
    : [
        { icon: Search, t: "Field research", d: "Home visit + eligibility check before any spend." },
        { icon: Heart, t: "Secure donation", d: "Pay securely via Visa, Vodafone Cash or InstaPay." },
        { icon: Truck, t: "Execute & deliver", d: "Aid prepared and hand-delivered to the family." },
        { icon: Camera, t: "Follow up & docs", d: "Photo/video report delivered to you after." },
      ];

  const onCta = (
    cta: "header_whatsapp" | "card_learn_more" | "card_donate" | "card_steps" | "step_whatsapp" | "card_journey_toggle",
    program?: string,
    extra?: Record<string, unknown>,
  ) => {
    bumpPerf(cta);
    track("programs_cta_click", {
      fbEvent: cta.includes("whatsapp") ? "Contact" : cta.includes("donate") ? "InitiateCheckout" : undefined,
      payload: { cta, program, source: "programs-section", ...extra },
    });
  };

  // Reveal cards once the section enters the viewport (one-shot)
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = revealRef.current;
    if (!el || revealed) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [revealed]);

  // ---- Programs carousel (auto-play, RTL-aware, pause on hover/focus) ----
  // Respect users who turn on "reduce motion" — disable autoplay & long
  // reveal transitions for them.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // Detect small screens — on phones we drop per-card stagger and use a
  // shorter, lighter reveal so entry never feels janky.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  const lightMotion = isMobile || reducedMotion;

  const autoplayRef = useRef(
    Autoplay({
      delay: 4200,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
      playOnInit: true,
    }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      direction: isRTL ? "rtl" : "ltr",
      dragFree: false,
      containScroll: "trimSnaps",
      skipSnaps: false,
      duration: 26,
    },
    [autoplayRef.current],
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  // Wait one tick after the section is revealed before showing real cards,
  // so the skeletons paint first and the page never jumps.
  const [cardsReady, setCardsReady] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const id = window.setTimeout(() => setCardsReady(true), 120);
    return () => window.clearTimeout(id);
  }, [revealed]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    const onReInit = () => {
      setSnapCount(emblaApi.scrollSnapList().length);
      onSelect();
    };
    onReInit();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onReInit);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onReInit);
    };
  }, [emblaApi]);

  // Re-init when direction changes (lang flip)
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ direction: isRTL ? "rtl" : "ltr" });
  }, [emblaApi, isRTL]);

  // Pause autoplay when tab is hidden (saves battery on mobile) and when
  // the section scrolls out of view; resume on return.
  useEffect(() => {
    const ap = autoplayRef.current;
    if (!ap) return;
    const onVis = () => {
      if (document.hidden) ap.stop();
      else if (isPlaying && !reducedMotion) ap.play();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isPlaying, reducedMotion]);

  // Disable autoplay entirely for reduced-motion users.
  useEffect(() => {
    const ap = autoplayRef.current;
    if (!ap) return;
    if (reducedMotion) {
      ap.stop();
      setIsPlaying(false);
    }
  }, [reducedMotion]);

  // Pause autoplay when the carousel scrolls out of viewport (saves CPU
  // on long pages with many sections).
  const carouselRootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = carouselRootRef.current;
    const ap = autoplayRef.current;
    if (!el || !ap) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && isPlaying && !reducedMotion) ap.play();
        else ap.stop();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isPlaying, reducedMotion]);

  const toggleAutoplay = () => {
    const ap = autoplayRef.current;
    if (!ap) return;
    if (isPlaying) ap.stop();
    else ap.play();
    setIsPlaying(!isPlaying);
  };
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <section
      id="programs"
      ref={revealRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden py-20 md:py-28 pattern-programs"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-extrabold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            {isRTL ? "كل برامجنا في مكان واحد" : "All our programs in one place"}
          </span>
          <h2 className="mt-4 text-3xl font-black text-primary md:text-5xl">
            {isRTL ? "كل برامجنا والاحتياجات الأساسية" : "All Programs & Basic Needs"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {isRTL
              ? "لكل باب من هذه الأبواب مسار واضح: التبرع، ثم البحث، ثم التنفيذ، ثم المتابعة. اختر الباب الذي يناسب نيتك، أو تواصل معنا عبر واتساب لنرشدك إلى الاحتياج الأكثر إلحاحًا."
              : "Each pillar has a clear path: donate, research, execute, then follow up. Pick the one that matches your intent, or message us on WhatsApp."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
              <a
                href={waUrl(isRTL ? "اسأل عن أنسب برنامج" : "Ask about the most suitable program")}
                target="_blank" rel="noopener noreferrer"
                data-source="programs-header" data-label="ask-whatsapp"
                onClick={() => onCta("header_whatsapp")}
              >
                <MessageCircle className="h-4 w-4" />
                {isRTL ? "اسأل عن أنسب برنامج" : "Ask about the right program"}
              </a>
            </Button>
          </div>
        </div>

        {/* 3 strategic pillars — الغذاء / الصحة / التعليم */}
        <div className="mx-auto mb-8 max-w-6xl">
          <div className="mb-4 text-center text-xs font-extrabold uppercase tracking-wider text-secondary">
            {isRTL ? "محاور القوة الثلاثة" : "Our 3 strategic pillars"}
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {corePillars.map((p, i) => (
              <Link
                key={p.slug}
                to={`/donate?program=${p.slug}`}
                onClick={() => onCta("card_donate", p.slug, { source: "core_pillar" })}
                style={{ transitionDelay: revealed && !lightMotion ? `${i * 80}ms` : "0ms" }}
                className={`group relative overflow-hidden rounded-3xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-card to-secondary/10 p-6 text-start shadow-sm transition-all ${lightMotion ? "duration-300" : "duration-700"} ease-out hover:-translate-y-1 hover:border-secondary hover:shadow-card ${
                  revealed ? "opacity-100 translate-y-0" : `opacity-0 ${lightMotion ? "translate-y-2" : "translate-y-6"}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta transition group-hover:scale-110">
                    <p.icon className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-secondary/20 px-2.5 py-1 text-[10px] font-black text-primary">
                    {p.stat}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-primary">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-accent transition group-hover:gap-2.5">
                  {isRTL ? "تبرع للمحور" : "Donate to pillar"} <Arrow className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary needs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {secondaryNeeds.map((n, i) => (
              <Link
                key={n.slug}
                to={`/donate?program=${n.slug}`}
                onClick={() => onCta("card_donate", n.slug, { source: "secondary_need" })}
                style={{ transitionDelay: revealed && !lightMotion ? `${250 + i * 60}ms` : "0ms" }}
                className={`group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all ${lightMotion ? "duration-300" : "duration-700"} ease-out hover:-translate-y-0.5 hover:border-secondary hover:shadow-soft ${
                  revealed ? "opacity-100 translate-y-0" : `opacity-0 ${lightMotion ? "translate-y-1" : "translate-y-4"}`
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-primary transition group-hover:bg-secondary group-hover:text-secondary-foreground">
                  <n.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-extrabold text-foreground">{n.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Duplicate header removed — the section already introduces programs above. */}

        {/* Auto-playing program carousel (RTL-aware, pause on hover) */}
        <div className="relative" ref={carouselRootRef}>
          {/* Controls row */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              {cardsReady
                ? (isRTL
                    ? `عرض ${selectedIdx + 1} من ${snapCount || orderedPrograms.length}`
                    : `Slide ${selectedIdx + 1} of ${snapCount || orderedPrograms.length}`)
                : (isRTL ? "جارٍ تحميل البرامج…" : "Loading programs…")}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAutoplay}
                aria-label={isPlaying ? (isRTL ? "إيقاف التشغيل التلقائي" : "Pause autoplay") : (isRTL ? "تشغيل تلقائي" : "Play autoplay")}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:border-secondary hover:bg-secondary/10"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={isRTL ? scrollNext : scrollPrev}
                aria-label={isRTL ? "السابق" : "Previous"}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:border-secondary hover:bg-secondary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={isRTL ? scrollPrev : scrollNext}
                aria-label={isRTL ? "التالي" : "Next"}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:border-secondary hover:bg-secondary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!cardsReady ? (
            // Skeleton placeholders — match card geometry to prevent CLS
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl bg-card shadow-soft">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -mx-6 touch-pan-y">
                {orderedPrograms.map((p, i) => {
                  const isVolunteer = p.priceFrom === 0;
                  const name = p[lang].name;
                  const isOpen = expandedSlug === p.slug;
                  return (
                    <div
                      key={p.slug}
                      className="min-w-0 shrink-0 grow-0 basis-full px-6 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                    >
                      <article
                        style={{ transitionDelay: revealed && !lightMotion ? `${i * 40}ms` : "0ms" }}
                        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-soft transform transition-transform duration-500 ${lightMotion ? "duration-300" : "duration-700"} ease-out hover:-translate-y-1 hover:shadow-card ${
                          revealed ? "opacity-100 translate-y-0" : `opacity-0 ${lightMotion ? "translate-y-2" : "translate-y-6"}`
                        } ${i === selectedIdx ? "scale-100" : "scale-93"}`}
                      >
                        <Link
                          to={programHref(p.slug)}
                          data-source="programs-card" data-label={`image-${p.slug}`}
                          onClick={() => onCta("card_learn_more", p.slug)}
                          className="relative block overflow-hidden"
                          aria-label={isRTL ? `تعرف أكثر على ${name}` : `Learn more about ${name}`}
                        >
                          <LazyImage
                            src={p.image}
                            alt={name}
                            width={1024}
                            height={768}
                            aspect="aspect-[4/3]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
                          <span className="absolute top-3 end-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground shadow">
                            {isVolunteer
                              ? (isRTL ? "تطوع" : "Volunteer")
                              : (isRTL ? `من ${p.priceFrom} ج` : `From ${p.priceFrom} EGP`)}
                          </span>
                          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-extrabold text-primary shadow backdrop-blur">
                            <BadgeCheck className="h-3 w-3" />
                            {isRTL ? "موثّق ومراجع" : "Verified"}
                          </span>
                        </Link>

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="text-lg font-extrabold text-primary">{name}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p[lang].tagline}</p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {!isVolunteer && (
                              <Button asChild size="sm" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                                <Link
                                  to={`/donate?program=${p.slug}`}
                                  data-source="programs-card" data-label={`donate-${p.slug}`}
                                  onClick={() => onCta("card_donate", p.slug)}
                                >
                                  <Heart className="h-3.5 w-3.5" />
                                  {isRTL ? "ابدأ التبرع" : "Start donating"}
                                </Link>
                              </Button>
                            )}
                            <Button
                              type="button" size="sm" variant="outline"
                              aria-expanded={isOpen}
                              aria-controls={`journey-${p.slug}`}
                              data-source="programs-card" data-label={`journey-${p.slug}`}
                              onClick={() => {
                                onCta("card_journey_toggle", p.slug, { open: !isOpen });
                                setExpandedSlug(isOpen ? null : p.slug);
                                autoplayRef.current?.stop();
                                setIsPlaying(false);
                              }}
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              {isRTL ? "مخطط الرحلة" : "Journey"}
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </Button>
                          </div>

                          {/* Inline expandable 4-step journey */}
                          <div
                            id={`journey-${p.slug}`}
                            className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ${
                              isOpen ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="min-h-0">
                              <ol className="relative space-y-3 rounded-2xl border border-border bg-muted/30 p-3">
                                {journey.map((s, j) => {
                                  const Icon = s.icon;
                                  return (
                                    <li key={s.t} className="flex items-start gap-3">
                                      <div className="relative">
                                        <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-grad text-[11px] font-black text-accent-foreground shadow-cta">
                                          {j + 1}
                                        </span>
                                        {j < journey.length - 1 && (
                                          <span className="absolute start-1/2 top-8 h-3 w-px -translate-x-1/2 bg-border" aria-hidden />
                                        )}
                                      </div>
                                      <div className="flex-1 pt-0.5">
                                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
                                          <Icon className="h-3.5 w-3.5 text-secondary" /> {s.t}
                                        </div>
                                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.d}</p>
                                      </div>
                                    </li>
                                  );
                                })}
                                <li>
                                  <Button
                                    type="button" size="sm" variant="ghost"
                                    className="w-full text-[11px] font-extrabold text-accent"
                                    onClick={() => { onCta("card_steps", p.slug); setStepsFor(p); }}
                                  >
                                    {isRTL ? "افتح المخطط الكامل ←" : "Open full path →"}
                                  </Button>
                                </li>
                              </ol>
                            </div>
                          </div>

                          <Link
                            to={programHref(p.slug)}
                            data-source="programs-card" data-label={`learn-${p.slug}`}
                            onClick={() => onCta("card_learn_more", p.slug)}
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent transition hover:gap-2.5"
                          >
                            {t.programs.learnMore}
                            <Arrow className="h-4 w-4" />
                          </Link>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dot indicators */}
          {cardsReady && snapCount > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {Array.from({ length: snapCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={isRTL ? `اذهب للعرض ${i + 1}` : `Go to slide ${i + 1}`}
                  aria-current={i === selectedIdx}
                  className={`h-1.5 rounded-full transition-all ${
                    i === selectedIdx
                      ? "w-6 bg-orange-grad shadow-cta"
                      : "w-2 bg-border hover:bg-secondary/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lightweight in-page performance panel — only when ?debug=perf */}
        <PerfPanel />
      </div>

      <StepsDialog program={stepsFor} onClose={() => setStepsFor(null)} onTrack={onCta} />
    </section>
  );
};

/* ----------------------------- Steps Dialog ----------------------------- */

const StepsDialog = ({
  program,
  onClose,
  onTrack,
}: {
  program: ProgramContent | null;
  onClose: () => void;
  onTrack: (cta: "step_whatsapp", program?: string, extra?: Record<string, unknown>) => void;
}) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const open = !!program;
  const [active, setActive] = useState(0);
  const tablistRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (open) setActive(0); }, [open, program?.slug]);
  // When the dialog opens, move focus to the active step tab so keyboard
  // users land directly on the visual stepper (Radix already traps focus
  // inside the dialog and handles Esc to close).
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      tablistRef.current?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.focus();
    }, 30);
    return () => window.clearTimeout(id);
  }, [open, active]);

  const steps = isRTL
    ? [
        { icon: Heart, key: "donate", t: "تبرع", d: "اختر مبلغك وادفع فورًا وبأمان عبر فيزا أو فودافون كاش أو إنستا باي.", wa: "أريد التبرع لبرنامج" },
        { icon: Search, key: "research", t: "بحث ميداني", d: "فريقنا يدخل البيوت ويتحقق من الحالات الأكثر استحقاقًا قبل أي صرف.", wa: "أريد الاطلاع على آلية البحث الميداني لبرنامج" },
        { icon: Truck, key: "execute", t: "تنفيذ وتسليم", d: "تجهيز الكرتونة أو الصك أو التحويل، وتسليمه باليد حتى باب البيت بكرامة.", wa: "أريد متابعة موعد تنفيذ تبرعي لبرنامج" },
        { icon: Camera, key: "follow", t: "متابعة وتوثيق", d: "تقرير صور وفيديو يصلك بعد التسليم — شفافية كاملة.", wa: "أريد تقرير المتابعة والتوثيق لبرنامج" },
      ]
    : [
        { icon: Heart, key: "donate", t: "Donate", d: "Pick your amount and pay securely via Visa, Vodafone Cash or InstaPay.", wa: "I want to donate to program" },
        { icon: Search, key: "research", t: "Field research", d: "Our team visits homes and verifies the most deserving cases before any spend.", wa: "Tell me about field research for" },
        { icon: Truck, key: "execute", t: "Execute & deliver", d: "Box / voucher / transfer prepared and hand-delivered to the family's door.", wa: "Follow up delivery date for" },
        { icon: Camera, key: "follow", t: "Follow up & docs", d: "Photo and video report sent to you after delivery — full transparency.", wa: "Send the follow-up report for" },
      ];
  const total = steps.length;
  const onStepperKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((i) => (isRTL ? Math.max(0, i - 1) : Math.min(total - 1, i + 1)));
    if (e.key === "ArrowLeft")  setActive((i) => (isRTL ? Math.min(total - 1, i + 1) : Math.max(0, i - 1)));
    if (e.key === "Home") setActive(0);
    if (e.key === "End")  setActive(total - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby="steps-desc">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-black text-primary">
            {isRTL ? `مساري في "${program?.[lang].name ?? ""}"` : `My path in "${program?.[lang].name ?? ""}"`}
          </DialogTitle>
          <DialogDescription id="steps-desc" className="text-start">
            {isRTL
              ? "أربع خطوات واضحة من تبرعك حتى تقرير الأثر — مع زر واتساب لكل مرحلة."
              : "Four clear steps from your gift to the impact report — with a WhatsApp button for each stage."}
          </DialogDescription>
        </DialogHeader>

        {/* Visual stepper — keyboard accessible (←/→/Home/End). */}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={isRTL ? "خطوات المسار" : "Path steps"}
          aria-orientation="horizontal"
          onKeyDown={onStepperKey}
          className="mt-2 rounded-2xl border border-border bg-muted/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold text-muted-foreground">
            <span>{isRTL ? `الخطوة ${active + 1} من ${total}` : `Step ${active + 1} of ${total}`}</span>
            <span>{Math.round(((active + 1) / total) * 100)}%</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="absolute inset-y-0 start-0 rounded-full bg-orange-grad transition-[width] duration-300"
              style={{ width: `${((active + 1) / total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {steps.map((s, i) => {
              const done = i < active;
              const isActive = i === active;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "step" : undefined}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`group flex flex-1 flex-col items-center gap-1 rounded-xl p-1.5 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-secondary ${isActive ? "bg-secondary/15" : ""}`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-black shadow ${
                      isActive
                        ? "bg-orange-grad text-accent-foreground shadow-cta"
                        : done
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-card text-muted-foreground ring-1 ring-border"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`hidden text-[10px] font-extrabold sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.t}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ol className="mt-2 grid gap-3 sm:grid-cols-2">
          {steps.map((s, i) => {
            const text = `${s.wa} «${program?.[lang].name ?? ""}»`;
            const isActive = i === active;
            return (
              <li
                key={s.key}
                onClick={() => setActive(i)}
                className={`cursor-pointer rounded-2xl border bg-card p-4 text-start transition ${
                  isActive ? "border-secondary ring-2 ring-secondary/40" : "border-border hover:border-secondary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-grad text-xs font-black text-accent-foreground shadow-cta">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-secondary" />
                  <h4 className="text-sm font-extrabold text-foreground">{s.t}</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                <Button
                  asChild size="sm" variant="outline"
                  className="mt-3 h-8 border-secondary/40 text-xs"
                >
                  <a
                    href={waUrl(text)} target="_blank" rel="noopener noreferrer" dir="ltr"
                    data-source="programs-steps" data-label={`step-${s.key}-${program?.slug}`}
                    onClick={() => onTrack("step_whatsapp", program?.slug, { step: s.key })}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {isRTL ? "واتساب لهذه الخطوة" : "WhatsApp for this step"}
                  </a>
                </Button>
              </li>
            );
          })}
        </ol>

        {program && program.priceFrom > 0 && (
          <div className="mt-2 flex justify-end">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
              <Link
                to={`/donate?program=${program.slug}`}
                data-source="programs-steps" data-label={`donate-${program.slug}`}
              >
                <Heart className="h-4 w-4" />
                {isRTL ? "ابدأ التبرع الآن" : "Start donating now"}
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ----------------------------- Perf Panel ----------------------------- */

/**
 * Shows in-session click counts for the four tracked CTAs. Visible only
 * when the URL contains `?debug=perf`, so it never disturbs real users.
 */
const PerfPanel = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [data, setData] = useState<PerfMap>({});
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("debug") !== "perf") return;
    setEnabled(true);
    const refresh = () => setData(loadPerf());
    refresh();
    window.addEventListener("alyusr:perf", refresh);
    return () => window.removeEventListener("alyusr:perf", refresh);
  }, []);

  if (!enabled) return null;
  const rows: Array<[string, string]> = isRTL
    ? [
        ["header_whatsapp", "واتساب الترويسة"],
        ["card_learn_more", "اعرف أكثر"],
        ["card_donate", "ابدأ التبرع"],
        ["card_steps", "فتح الخطوات"],
        ["step_whatsapp", "واتساب خطوة"],
      ]
    : [
        ["header_whatsapp", "Header WhatsApp"],
        ["card_learn_more", "Learn more"],
        ["card_donate", "Start donating"],
        ["card_steps", "Open steps"],
        ["step_whatsapp", "Step WhatsApp"],
      ];

  return (
    <div
      className="mx-auto mt-10 max-w-md rounded-2xl border border-secondary/40 bg-[hsl(152_65%_10%)] p-4 text-primary-foreground shadow-cta"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-secondary" />
        <h4 className="text-sm font-extrabold">
          {isRTL ? "أداء البرامج (الجلسة الحالية)" : "Programs perf (this session)"}
        </h4>
      </div>
      <ul className="mt-3 space-y-1 text-xs">
        {rows.map(([k, label]) => (
          <li key={k} className="flex items-center justify-between border-b border-white/5 py-1">
            <span className="opacity-80">{label}</span>
            <span className="tabular-nums font-black">{data[k] || 0}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] opacity-60">
        {isRTL ? "يظهر فقط مع ?debug=perf" : "Visible only with ?debug=perf"}
      </p>
    </div>
  );
};
