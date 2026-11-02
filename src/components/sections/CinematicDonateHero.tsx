import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, ShieldCheck, Sparkles, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import heroSad from "@/assets/hero-girl-start.webp";
import heroHappy from "@/assets/hero-happy-family-new.webp";
import decoCarton from "@/assets/hero-carton-opened.webp";
import decoMedicine from "@/assets/hero-carton-closed.webp";
import decoBooks from "@/assets/axis-education.jpg";
import decoBread from "@/assets/hero-carton-opened.webp";
import decoChicken from "@/assets/qurbani-meat-trays.jpg";
import decoCowSheep from "@/assets/qurbani-cow-sheep.webp";
import decoMeat from "@/assets/poster-meat.webp";
import decoOrphan from "@/assets/poster-education.png";
import decoVan from "@/assets/hero-deco-van-2.webp";
import decoVan2 from "@/assets/hero-deco-van-2.webp";
import decoCan from "@/assets/brand-can.png";
import decoCartonTower from "@/assets/hero-carton-tower.webp";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CinematicDonateHero() {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);

  // Preload all stage assets so they're ready at the right moment of the
  // cinematic timeline (no missing trucks / cartons mid-scroll).
  useEffect(() => {
    [heroSad, heroHappy, decoVan, decoVan2, decoCarton, decoMedicine, decoBooks,
     decoBread, decoChicken, decoCowSheep, decoMeat, decoOrphan, decoCan,
     decoCartonTower].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);

  // Mouse parallax on the stage (only while in view)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!cardRef.current || !stageRef.current) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = cardRef.current!.getBoundingClientRect();
        cardRef.current!.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        cardRef.current!.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
        const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(stageRef.current, {
          rotationY: xVal * 8,
          rotationX: -yVal * 8,
          ease: "power3.out",
          duration: 1.1,
        });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pinned cinematic timeline
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(".cdh-text", { autoAlpha: 0, y: 60, scale: 0.9, filter: "blur(16px)" });
      gsap.set(".cdh-accent", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".cdh-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      // Stage hidden initially. SAD girl starts FAR (small + faded).
      gsap.set(".cdh-stage", { autoAlpha: 0 });
      gsap.set(".cdh-sad", { autoAlpha: 1, scale: 0.45, filter: "saturate(0.5) brightness(0.7) blur(6px)", transformOrigin: "50% 60%" });
      gsap.set(".cdh-ribbon-sad", { autoAlpha: 0, y: -8 });
      gsap.set([
        ".cdh-happy", ".cdh-van", ".cdh-van2", ".cdh-deco", ".cdh-cow",
        ".cdh-ribbon-happy", ".cdh-end-cta",
      ], { autoAlpha: 0 });

      const intro = gsap.timeline({ delay: 0.2 });
      intro
        .to(".cdh-text", { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: reduce ? 0.4 : 1.4, ease: "expo.out" })
        .to(".cdh-accent", { clipPath: "inset(0 0% 0 0)", duration: reduce ? 0.3 : 1.1, ease: "power4.inOut" }, "-=0.8");

      if (reduce) {
        gsap.set(".cdh-card", { y: 0, width: "100%", height: "100%", borderRadius: 0, autoAlpha: 1 });
        gsap.set([
          ".cdh-stage", ".cdh-happy", ".cdh-van", ".cdh-van2", ".cdh-deco",
          ".cdh-cow", ".cdh-ribbon-happy", ".cdh-end-cta",
        ], { autoAlpha: 1 });
        gsap.set([".cdh-sad", ".cdh-ribbon-sad"], { autoAlpha: 0 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.4,
          invalidateOnRefresh: true,
        },
      });

      tl
        // 1. Card rises and expands fullscreen; intro text blurs out
        .to(".cdh-hero-text", { scale: 1.1, filter: "blur(16px)", opacity: 0.15, ease: "power2.inOut", duration: 3 }, 0)
        .to(".cdh-card", { y: 0, ease: "power3.inOut", duration: 3 }, 0)
        .to(".cdh-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 2.4 })
        // 2. Stage in — only the SAD girl visible, FAR away
        .fromTo(
          ".cdh-stage",
          { y: 200, rotationX: 40, rotationY: -25, autoAlpha: 0, scale: 0.65 },
          { y: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 3.2 },
          "-=1.0",
        )
        // 3. Sad girl approaches: zoom from far → close, ribbon appears
        .to(".cdh-sad", { scale: 0.85, filter: "saturate(0.65) brightness(0.8) blur(2px)", duration: 4, ease: "power2.inOut" })
        .to(".cdh-ribbon-sad", { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" }, "-=2.4")
        .to(".cdh-sad", { scale: 1.05, filter: "saturate(0.7) brightness(0.86) blur(0px)", duration: 4, ease: "sine.inOut" })
        // Hold on the close-up
        .to({}, { duration: 3 })
        // 4. Al-Yusr trucks drive in from BOTH sides
        .fromTo(
          ".cdh-van",
          { x: isRTL ? 280 : -280, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power3.out", duration: 3 },
        )
        .fromTo(
          ".cdh-van2",
          { x: isRTL ? -280 : 280, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, ease: "power3.out", duration: 3 },
          "-=2.6",
        )
        .to({}, { duration: 2 })
        // 5. Crossfade sad → happy + ribbon swap
        .to(".cdh-sad", { autoAlpha: 0, scale: 0.92, duration: 2.4, ease: "power2.inOut" })
        .to(".cdh-ribbon-sad", { autoAlpha: 0, y: -10, duration: 1.2, ease: "power2.in" }, "<")
        .fromTo(
          ".cdh-happy",
          { autoAlpha: 0, scale: 1.06 },
          { autoAlpha: 1, scale: 1, duration: 2.4, ease: "power2.out" },
          "<",
        )
        .fromTo(
          ".cdh-ribbon-happy",
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 1.4, ease: "power2.out" },
          "<",
        )
        // 6. ALL aid items burst in together (cow + cartons + food + books + bag)
        .fromTo(
          ".cdh-cow",
          { y: 50, autoAlpha: 0, scale: 0.85 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 1.8, ease: "power3.out" },
          "-=1.4",
        )
        .fromTo(
          ".cdh-deco",
          { y: 100, autoAlpha: 0, scale: 0.6, rotateZ: -6 },
          { y: 0, autoAlpha: 1, scale: 1, rotateZ: 0, ease: "back.out(1.4)", duration: 2, stagger: 0.08 },
          "-=1.4",
        )
        // 7. Hold on the joyful end frame
        .to({}, { duration: 4 })
        // 8. Final CTA card overlays the joyful scene (scene stays visible)
        .set(".cdh-hero-text", { autoAlpha: 0 })
        .set(".cdh-end-cta", { autoAlpha: 1 })
        .fromTo(
          ".cdh-end-cta",
          { y: 30, scale: 0.92, filter: "blur(20px)" },
          { y: 0, scale: 1, filter: "blur(0px)", ease: "expo.out", duration: 2.2 },
        )
        .to({}, { duration: 3 });
    }, containerRef);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative h-[900vh] w-full bg-background motion-reduce:h-screen"
      aria-label={isRTL ? "رحلة التبرع السينمائية" : "Cinematic donation journey"}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundSize: "60px 60px",
            backgroundImage:
              "linear-gradient(to right, hsl(var(--primary) / 0.08) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary) / 0.08) 1px, transparent 1px)",
            maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
          }}
        />

      {/* Hero text */}
      <div className="cdh-hero-text absolute inset-0 z-10 grid place-items-center px-6 text-center">
        <div>
          <span className="cdh-text inline-flex rounded-full border border-secondary/40 bg-primary/10 px-4 py-1 text-xs font-extrabold text-primary">
            <Sparkles className="me-1 h-4 w-4" />
            {isRTL ? "رحلة صدقتك" : "Your charity journey"}
          </span>
          <h2 className="cdh-text mt-5 text-4xl font-black leading-[1.15] text-primary md:text-7xl" style={{ textDecoration: "none" }}>
            {isRTL ? "معًا" : "Together"}{" "}
            <span className="text-foreground" style={{ textDecoration: "none" }}>
              {isRTL ? "نصل بصدقتك" : "we deliver your charity"}
            </span>{" "}
            <span
              className="cdh-accent inline-block bg-gradient-to-l from-accent to-secondary bg-clip-text text-transparent"
              style={{ textDecoration: "none" }}
            >
              {isRTL ? "لمن يستحق" : "to who deserves it"}
            </span>
          </h2>
        </div>
      </div>

      {/* Main rising card */}
      <div
        ref={cardRef}
        className="cdh-card absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-border shadow-card"
        style={{
          width: "min(86vw, 1100px)",
          height: "min(78vh, 680px)",
          borderRadius: "40px",
          background: "linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)",
          boxShadow:
            "0 40px 100px -20px hsl(var(--primary) / 0.55), 0 20px 40px -20px hsl(var(--primary) / 0.4), inset 0 1px 2px hsl(var(--primary-foreground) / 0.18)",
        }}
      >
        {/* mouse sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--secondary) / 0.18) 0%, transparent 45%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Stage — replicates the original Hero's full layout (sad/happy +
            ribbons + 2 trucks + cow accent + cartons + chicken + meat +
            bread + books + schoolbag + can) at the same positions/spacing. */}
        <div
          ref={stageRef}
          className="cdh-stage absolute inset-0"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          <div className="relative mx-auto h-full w-full max-w-[1280px] overflow-visible">
            {/* Sad mid layer */}
            <img
              src={heroSad}
              alt={isRTL ? "طفلة محتاجة" : "Child in need"}
              loading="lazy"
              decoding="async"
              className="cdh-sad absolute inset-0 z-[2] h-full w-full object-cover object-[center_36%]"
              style={{ filter: "saturate(0.7) brightness(0.86) contrast(1.05)" }}
            />
            {/* Happy crossfade layer */}
            <img
              src={heroHappy}
              alt={isRTL ? "نفس الأسرة بعد التبرع" : "Same family after donation"}
              loading="lazy"
              decoding="async"
              className="cdh-happy absolute inset-0 z-[3] h-full w-full object-cover object-[center_36%]"
              style={{ filter: "saturate(1.02) contrast(1.02)" }}
            />

            {/* Status ribbons */}
            <div className="cdh-ribbon-sad absolute end-3 top-3 z-[13] inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-extrabold text-foreground shadow md:end-4 md:top-4">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {isRTL ? "قبل تبرعك" : "Before your gift"}
            </div>
            <div className="cdh-ribbon-happy absolute end-3 top-3 z-[14] inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-black text-secondary-foreground shadow-cta md:end-4 md:top-4">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {isRTL ? "بعد تبرعك" : "After your gift"}
            </div>

            {/* Two trucks at the bottom edges */}
            <div className="cdh-van pointer-events-none absolute -left-[18%] -bottom-[24%] z-[2] w-[96%] max-w-[1080px] sm:-bottom-[22%] sm:w-[82%] md:-bottom-[20%] md:w-[72%] lg:-bottom-[18%] lg:w-[66%]">
              <img src={decoVan} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_36px_54px_rgba(0,0,0,0.52)]" style={{ filter: "saturate(1.14) brightness(1.08) contrast(1.08)" }} />
            </div>
            <div className="cdh-van2 pointer-events-none absolute -right-[16%] -bottom-[20%] z-[2] w-[110%] max-w-[1240px] sm:-bottom-[18%] sm:w-[94%] md:-bottom-[16%] md:w-[84%] lg:-bottom-[15%] lg:w-[78%]">
              <img src={decoVan2} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_36px_54px_rgba(0,0,0,0.52)]" style={{ filter: "saturate(1.2) brightness(1.1) contrast(1.1)" }} />
            </div>

            {/* Cow accent — far right back */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] mx-auto w-full max-w-[1280px] px-2 sm:px-6 md:px-10">
              <div className="relative mx-auto h-full w-full">
                <div className="cdh-cow absolute right-[-4%] bottom-[22%] w-[34%] max-w-[360px] sm:right-[-2%] sm:w-[28%] md:right-[0%] md:w-[24%]" style={{ zIndex: 3 }}>
                  <img src={decoCowSheep} alt="" aria-hidden loading="lazy" className="h-auto w-full opacity-95 drop-shadow-[0_34px_52px_rgba(0,0,0,0.42)]" style={{ filter: "saturate(1.08) brightness(1.04) contrast(1.06)" }} />
                </div>
              </div>
            </div>

            {/* Stable table zone — aid items raised on the table */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] mx-auto w-full max-w-[1280px] px-2 pb-2 sm:px-6 sm:pb-3 md:px-10">
              <div className="relative mx-auto w-full" style={{ aspectRatio: "16 / 6" }}>
                {/* Right-bottom carton tower */}
                <div className="cdh-deco absolute bottom-[6%] end-[22%] w-[22%] max-w-[170px] sm:end-[20%] sm:w-[17%] md:w-[14%]" style={{ zIndex: 13 }}>
                  <img src={decoCartonTower} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_30px_44px_rgba(0,0,0,0.6)]" />
                </div>
                {/* Opened carton */}
                <div className="cdh-deco absolute -bottom-[12%] end-[3%] w-[34%] max-w-[280px] sm:-bottom-[11%] sm:end-[4%] sm:w-[28%] md:-bottom-[10%] md:end-[4%] md:w-[25%]" style={{ zIndex: 13 }}>
                  <img src={decoCarton} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_38px_56px_rgba(0,0,0,0.65)]" />
                </div>
                {/* Twin opened carton far right */}
                <div className="cdh-deco absolute -bottom-[2%] -end-[2%] hidden w-[22%] max-w-[180px] sm:block sm:w-[18%] md:w-[16%]" style={{ zIndex: 14 }}>
                  <img src={decoCarton} alt="" aria-hidden loading="lazy" className="h-auto w-full -scale-x-100 drop-shadow-[0_28px_40px_rgba(0,0,0,0.55)]" />
                </div>
                {/* Chicken platter — right foreground */}
                <div className="cdh-deco absolute -bottom-[8%] end-[18%] w-[26%] max-w-[220px] sm:-bottom-[7%] sm:end-[20%] sm:w-[22%] md:-bottom-[6%] md:end-[22%] md:w-[19%]" style={{ zIndex: 18 }}>
                  <img src={decoChicken} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_36px_48px_rgba(0,0,0,0.7)]" />
                </div>
                {/* Brand can */}
                <div className="cdh-deco absolute bottom-[6%] start-[8%] hidden w-[13%] max-w-[120px] sm:block" style={{ zIndex: 12 }}>
                  <img src={decoCan} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.5)]" />
                </div>
                {/* Right-side meat tray */}
                <div className="cdh-deco absolute bottom-[3%] end-[36%] w-[24%] max-w-[200px] sm:end-[36%] sm:w-[20%] md:end-[38%] md:w-[17%]" style={{ zIndex: 16 }}>
                  <img src={decoMeat} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_28px_36px_rgba(0,0,0,0.55)]" />
                </div>
                {/* Bread */}
                <div className="cdh-deco absolute bottom-[3%] start-[34%] w-[20%] max-w-[180px] sm:start-[36%] sm:w-[17%] md:w-[15%]" style={{ zIndex: 14 }}>
                  <img src={decoBread} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_28px_36px_rgba(0,0,0,0.55)]" />
                </div>
                {/* Center-left meat tray */}
                <div className="cdh-deco absolute bottom-[3%] start-[16%] w-[22%] max-w-[180px] sm:start-[18%] sm:w-[18%] md:start-[18%] md:w-[16%]" style={{ zIndex: 12 }}>
                  <img src={decoMeat} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_28px_36px_rgba(0,0,0,0.55)]" />
                </div>
                {/* Chicken — left background accent */}
                <div className="cdh-deco absolute bottom-[3%] start-[24%] w-[18%] max-w-[160px] sm:start-[26%] sm:w-[16%] md:start-[24%] md:w-[15%]" style={{ zIndex: 10 }}>
                  <img src={decoChicken} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_24px_32px_rgba(0,0,0,0.5)]" />
                </div>
                {/* Closed carton (small left accent) */}
                <div className="cdh-deco absolute bottom-[3%] start-[2%] hidden w-[16%] max-w-[140px] sm:block sm:w-[14%]" style={{ zIndex: 13 }}>
                  <img src={decoMedicine} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.45)]" />
                </div>
                {/* Education books */}
                <div className="cdh-deco absolute start-[8%] bottom-[22%] hidden w-[11%] max-w-[110px] md:block" style={{ zIndex: 12 }}>
                  <img src={decoBooks} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.45)]" />
                </div>
                {/* Schoolbag + clothes */}
                <div className="cdh-deco absolute start-[4%] bottom-[16%] w-[26%] max-w-[210px] sm:start-[5%] sm:w-[22%] md:start-[5%] md:w-[19%]" style={{ zIndex: 11 }}>
                  <img src={decoOrphan} alt="" aria-hidden loading="lazy" className="h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* End CTA */}
        <div className="cdh-end-cta absolute inset-0 z-50 grid place-items-center px-6 text-center">
          <div className="max-w-2xl" style={{ textDecoration: "none" }}>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-secondary">
              <ShieldCheck className="h-4 w-4" /> {isRTL ? "موثّق وشفاف" : "Verified & transparent"}
            </span>
            <h3 className="mt-4 text-3xl font-black text-primary-foreground md:text-5xl" style={{ textDecoration: "none" }}>
              {isRTL ? "صدقتك تبدأ رحلتها الآن" : "Your charity starts its journey now"}
            </h3>
            <p className="mt-3 text-sm font-semibold text-primary-foreground/85 md:text-base" style={{ textDecoration: "none" }}>
              {isRTL
                ? "بحث ميداني، تنفيذ بكرامة، توثيق ومتابعة — حتى تصل لمن يستحق."
                : "Field assessment, dignified delivery, documentation and follow-up — until it reaches who deserves it."}
            </p>
            <div className="mt-6 flex w-full flex-row flex-nowrap items-center justify-center gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-10 min-w-[130px] bg-orange-grad px-4 text-xs font-extrabold text-accent-foreground no-underline shadow-cta hover:opacity-95 sm:h-12 sm:min-w-[170px] sm:px-6 sm:text-sm"
              >
                <a href="#donate-form" className="inline-flex items-center justify-center gap-2 no-underline" style={{ textDecoration: "none" }}>
                  <Heart className="h-4 w-4" />
                  {isRTL ? "تبرع الآن" : "Donate now"}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-10 min-w-[130px] rounded-md border-2 border-primary-foreground/40 bg-primary-foreground/10 px-4 text-xs font-extrabold text-primary-foreground no-underline hover:bg-primary-foreground/20 sm:h-12 sm:min-w-[170px] sm:px-6 sm:text-sm"
              >
                <a href="/about" className="inline-flex items-center justify-center gap-2 no-underline" style={{ textDecoration: "none" }}>
                  <Info className="h-4 w-4" />
                  {isRTL ? "تعرّف علينا" : "About us"}
                </a>
              </Button>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary-foreground/80">
              <Truck className="h-4 w-4" />
              {isRTL ? "نوصل الخير لباب البيت" : "Doorstep delivery of good"}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default CinematicDonateHero;