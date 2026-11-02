import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoCell, BentoGrid, ContainerScroll } from "@/components/ui/hero-gallery-scroll-animation";
import { useLang } from "@/i18n/LangContext";

import food from "@/assets/program-food.jpg";
import health from "@/assets/program-health.webp";
import orphans from "@/assets/program-orphans.jpg";
import truck from "@/assets/brand-truck.jpg";
import family from "@/assets/family-hope.webp";
import classroom from "@/assets/brand-poster-classroom.webp";
import bags from "@/assets/brand-bags.jpg";
import girl from "@/assets/brand-girl-orange.jpg";
import farm from "@/assets/farm-hero.jpg";
import volunteerField from "@/assets/poster-volunteer-field.webp";
import waterDrop from "@/assets/yusr-water.png";
import shelterHome from "@/assets/poster-water.png";


type Cell = {
  src: string;
  href: string;        // Program / axis route
  ar: string;          // Arabic caption
  en: string;          // English caption
  axisAr: string;      // Pillar label (الغذاء/الصحة/...)
  axisEn: string;
};

/** First 5 power the scroll-bento; the rest render in a follow-up grid. */
const IMAGES: Cell[] = [
  { src: food,    href: "/programs/box",        ar: "كرتونة العزومة في بيت أسرة بالدقهلية",    en: "Family Box delivered in Dakahlia",        axisAr: "الغذاء",   axisEn: "Food" },
  { src: health,  href: "/programs/treatment",  ar: "قافلة طبية مجانية لقرى الدقهلية",          en: "Free medical convoy in Dakahlia villages", axisAr: "الصحة",    axisEn: "Health" },
  { src: orphans, href: "/programs/orphans",    ar: "كفالة يتيم — ابتسامة من قلب الميدان",      en: "Orphan sponsorship — smiles from the field", axisAr: "الأيتام", axisEn: "Orphans" },
  { src: truck,   href: "/programs/kitchen",    ar: "شاحنة اليسر بتوزّع الخير من المنصورة",     en: "Al-Yusr truck distributing aid from Mansoura", axisAr: "المطبخ", axisEn: "Kitchen" },
  { src: family,  href: "/about",               ar: "أسرة استلمت تبرعك… ودعت لك",                en: "A family that received your gift — and prayed for you", axisAr: "الأثر", axisEn: "Impact" },
  // Extra rows below the cinematic scroll
  { src: classroom,      href: "/programs/education", ar: "ادفع مصروفه — فصل في مدرسة بطلخا",    en: "Pay His Tuition — a class in Talkha",   axisAr: "التعليم", axisEn: "Education" },
  { src: bags,           href: "/programs/box",       ar: "تجهيز شُنط الغذاء قبل التوزيع",        en: "Food bags prepared before distribution", axisAr: "الغذاء",  axisEn: "Food" },
  { src: girl,           href: "/programs/orphans",   ar: "بنت يتيمة استلمت كفالتها الشهرية",     en: "An orphan girl received her monthly sponsorship", axisAr: "الأيتام", axisEn: "Orphans" },
  { src: farm,           href: "/programs/odhya",     ar: "مزرعة الأضاحي — كشف بيطري قبل الذبح",  en: "Sacrifice farm — vet check before slaughter", axisAr: "الأضحية", axisEn: "Qurbani" },
  { src: volunteerField, href: "/volunteer",          ar: "متطوعو اليسر في قرى الدقهلية",          en: "Al-Yusr volunteers in Dakahlia villages", axisAr: "التطوع", axisEn: "Volunteer" },
];

const heroCells = IMAGES.slice(0, 5);
const extraCells = IMAGES.slice(5);

/**
 * Cinematic scroll-triggered bento gallery: real field images that scale + slide
 * into a five-cell mosaic as the user scrolls. Tied to brand identity & links to
 * the donation flow + about page.
 */
export const FieldGalleryScroll = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isHovered = useRef(false);

  // Smooth Auto-Play carousel that pauses on hover/touch
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isHovered.current) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const step = 340;

      if (isRTL) {
        if (Math.abs(el.scrollLeft) >= maxScroll - 25) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: -step, behavior: "smooth" });
        }
      } else {
        if (el.scrollLeft >= maxScroll - 25) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: step, behavior: "smooth" });
        }
      }
    }, 3400);

    return () => clearInterval(interval);
  }, [isRTL]);

  return (
    <section
      aria-label={isRTL ? "معرض الميدان — صور حقيقية" : "Field gallery — real photos"}
      className="relative bg-background pb-28 sm:pb-36 md:pb-44"
    >
      {/* Static, always-visible heading (was hidden as overlay before) */}
      <header className="container mx-auto px-4 pt-14 pb-8 text-center md:pt-20 md:pb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-card/90 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-soft">
          <Camera className="h-3 w-3 text-accent" />
          {isRTL ? "بدون فلاتر — كل صورة من قلب القرية" : "No filters — every shot from the village"}
        </span>
        <h2 className="mt-4 text-3xl font-black leading-[1.15] text-primary md:text-5xl">
          {isRTL ? (
            <>تبرعك بيتحوّل لـ <span className="text-accent">حكاية حقيقية</span> في الدقهلية</>
          ) : (
            <>Your gift becomes a <span className="text-accent">real story</span> in Dakahlia</>
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-primary/75 md:text-base">
          {isRTL
            ? "اسحب لتحت وشوف بنفسك صور الميدان من المنصورة وقرى الدقهلية — كل لقطة بتقول إن أمانتك وصلت."
            : "Scroll down and see real field shots from Mansoura & Dakahlia villages — every frame proves your trust arrived."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-orange-grad font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
            <Link to="/donate">
              <Heart className="h-5 w-5" />
              {isRTL ? "تبرّع وكن جزء من الحكاية" : "Donate & join the story"}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-primary/20 bg-card font-extrabold text-primary hover:border-secondary hover:bg-secondary/10">
            <Link to="/about">{isRTL ? "اعرف اليسر أكتر" : "About Al-Yusr"}</Link>
          </Button>
        </div>
      </header>

      <ContainerScroll className="min-h-[200vh]">
        {/* Bento images that scale on scroll */}
        <div className="sticky top-0 flex h-screen items-center px-4 md:px-8">
          <BentoGrid className="mx-auto h-[78vh] w-full max-w-7xl">
            {heroCells.map((img, i) => (
              <BentoCell
                key={i}
                className="group relative overflow-hidden rounded-3xl shadow-card ring-1 ring-primary/10"
              >
                <Link to={img.href} aria-label={isRTL ? img.ar : img.en} className="block h-full w-full">
                  <img
                    src={img.src}
                    alt={isRTL ? img.ar : img.en}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/15 to-transparent" />
                  {/* Mini breadcrumb chip */}
                  <span className="absolute inset-x-0 top-0 flex items-center gap-1 px-4 pt-3 text-[10px] font-extrabold text-primary-foreground/90">
                    <span className="rounded-full bg-card/85 px-2 py-0.5 text-primary">{isRTL ? "الرئيسية" : "Home"}</span>
                    <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                    <span className="rounded-full bg-card/85 px-2 py-0.5 text-primary">{isRTL ? "البرامج" : "Programs"}</span>
                    <ChevronRight className={`h-3 w-3 ${isRTL ? "rotate-180" : ""}`} />
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{isRTL ? img.axisAr : img.axisEn}</span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 px-4 pb-3 pt-10 text-[11px] font-extrabold text-primary-foreground md:text-sm">
                    <span className="max-w-[70%]">
                      <span className="me-1.5 inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2 py-0.5 text-[10px] text-secondary-foreground">
                        <Camera className="h-3 w-3" /> {isRTL ? "من الميدان" : "Field"}
                      </span>
                      {isRTL ? img.ar : img.en}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-grad px-2.5 py-1 text-[10px] font-black text-accent-foreground shadow-cta">
                      {isRTL ? "اعرف أكتر" : "Learn more"} <Arrow className="h-3 w-3" />
                    </span>
                  </span>
                </Link>
              </BentoCell>
            ))}
          </BentoGrid>
        </div>
      </ContainerScroll>

      {/* Extra field shots — Interactive Auto-play carousel strip */}
      <div className="container mx-auto px-4 pb-16 md:pb-24">
        {/* Header and navigation buttons in the EXACT same row */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[10.5px] font-black text-secondary">
              <Camera className="h-3 w-3" />
              {isRTL ? "لقطات حية موثقة" : "Live Documented Shots"}
            </div>
            <h3 className="mt-1.5 text-xl font-black text-primary sm:text-2xl md:text-3xl">
              {isRTL ? "صور تانية من الميدان" : "More from the field"}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground sm:text-sm">
              {isRTL ? "كل صورة بتاخدك مباشرة على صفحة البرنامج المسؤول عنها." : "Every photo links directly to its program page."}
            </p>
          </div>

          {/* Carousel Navigation Buttons on the same row */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={isRTL ? "الصورة السابقة" : "Previous slide"}
              onClick={() => {
                if (trackRef.current) trackRef.current.scrollBy({ left: isRTL ? 340 : -340, behavior: "smooth" });
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary shadow-soft transition hover:border-secondary hover:bg-secondary/10 hover:text-secondary active:scale-95 sm:h-11 sm:w-11"
            >
              {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 rotate-180" />}
            </button>
            <button
              type="button"
              aria-label={isRTL ? "الصورة التالية" : "Next slide"}
              onClick={() => {
                if (trackRef.current) trackRef.current.scrollBy({ left: isRTL ? -340 : 340, behavior: "smooth" });
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary shadow-soft transition hover:border-secondary hover:bg-secondary/10 hover:text-secondary active:scale-95 sm:h-11 sm:w-11"
            >
              {isRTL ? <ChevronRight className="h-5 w-5 rotate-180" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* The Carousel Track with hover detection */}
        <div
          id="field-carousel-strip"
          ref={trackRef}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
          onTouchStart={() => { isHovered.current = true; }}
          onTouchEnd={() => { setTimeout(() => { isHovered.current = false; }, 2000); }}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {extraCells.map((img, i) => (
            <Link
              key={i}
              to={img.href}
              className="group relative aspect-[4/3] w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-secondary/50 hover:shadow-xl sm:w-[320px] md:w-[360px]"
            >
              <img
                src={img.src}
                alt={isRTL ? img.ar : img.en}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent" />

              {/* Pillar tag badge */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3.5 text-[10px] font-black">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground shadow-sm">
                  <Camera className="h-3 w-3" />
                  {isRTL ? img.axisAr : img.axisEn}
                </span>
                <span className="rounded-full bg-card/85 px-2.5 py-1 text-primary backdrop-blur">
                  {i + 1} / {extraCells.length}
                </span>
              </div>

              {/* Bottom Caption & Action */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                <p className="line-clamp-2 text-xs font-black leading-snug text-primary-foreground sm:text-sm">
                  {isRTL ? img.ar : img.en}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-grad px-3 py-1.5 text-[11px] font-black text-accent-foreground shadow-cta transition-transform group-hover:scale-105">
                  {isRTL ? "افتح" : "Open"}
                  <Arrow className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};