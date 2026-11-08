import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Heart, PackageCheck, Truck, HandHeart, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import decoCarton from "@/assets/hero-carton-opened.webp";
import decoVan from "@/assets/brand-van.jpg";
import decoTower from "@/assets/hero-carton-tower.webp";
import decoFamily from "@/assets/hero-happy-family-new.png";

gsap.registerPlugin(ScrollTrigger);

/**
 * Interactive scroll storytelling — pinned stage where the user scrolls
 * through the lifecycle of a donation: gift → packed → on the road →
 * delivered → smile. Parallax depth on background art, step indicator
 * at the side, fully responsive + reduced-motion safe.
 */
export const InteractiveJourney = () => {
  const { t, lang } = useLang();
  const root = useRef<HTMLElement | null>(null);

  const steps =
    lang === "ar"
      ? [
          { icon: Heart, title: "تبرعك", desc: "تختار قيمة تبرعك خلال ثوانٍ وبأمان تام." },
          { icon: PackageCheck, title: "نجهّز الكرتونة", desc: "فريقنا يجمع الطعام والكساء والدواء بجودة عالية." },
          { icon: Truck, title: "على الطريق", desc: "تصل شاحناتنا إلى أبعد قرى الدقهلية وكل محافظات مصر." },
          { icon: HandHeart, title: "وصلت إلى يد المحتاج", desc: "نسلّم يدًا بيد ونوثّق الأثر بالصوت والصورة." },
          { icon: Sparkles, title: "ابتسامة جديدة", desc: "كل تبرع يصنع فرحة حقيقية ويغيّر حياة بإذن الله." },
        ]
      : [
          { icon: Heart, title: "Your Gift", desc: "Choose your donation amount in seconds, fully secure." },
          { icon: PackageCheck, title: "We Pack", desc: "Our team prepares food, clothing, and medicine with care." },
          { icon: Truck, title: "On the Road", desc: "Our trucks reach the furthest villages of Dakahlia & all Egypt." },
          { icon: HandHeart, title: "Delivered", desc: "Hand to hand, with sound and picture documentation." },
          { icon: Sparkles, title: "A New Smile", desc: "Every gift makes a real change in a family's life." },
        ];

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isRTL = lang === "ar";
    const sign = isRTL ? -1 : 1;

    const ctx = gsap.context(() => {
      const stage = root.current!.querySelector<HTMLElement>("[data-ij='stage']");
      const stepsEls = gsap.utils.toArray<HTMLElement>("[data-ij-step]");
      const scenesEls = gsap.utils.toArray<HTMLElement>("[data-ij-scene]");
      if (!stage || !stepsEls.length) return;

      // Initial state: only first scene + step visible
      gsap.set(scenesEls, { autoAlpha: 0 });
      gsap.set(scenesEls[0], { autoAlpha: 1 });
      stepsEls.forEach((el, i) => el.classList.toggle("is-active", i === 0));

      if (reduce) {
        // Static fallback: just reveal everything stacked.
        gsap.set(scenesEls, { autoAlpha: 1, position: "relative" });
        return;
      }

      // Pin stage and snap through steps
      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${stepsEls.length * 140}%`,
        pin: true,
        scrub: 1.1,
        snap: { snapTo: 1 / (stepsEls.length - 1), duration: 0.4, ease: "power1.inOut" },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(
            stepsEls.length - 1,
            Math.round(self.progress * (stepsEls.length - 1))
          );
          stepsEls.forEach((el, i) => el.classList.toggle("is-active", i === idx));
          scenesEls.forEach((el, i) => {
            gsap.to(el, {
              autoAlpha: i === idx ? 1 : 0,
              scale: i === idx ? 1 : 0.96,
              y: i === idx ? 0 : 12,
              duration: 0.6,
              ease: "power3.out",
              overwrite: true,
            });
          });
          const bar = root.current!.querySelector<HTMLElement>("[data-ij-progress]");
          if (bar) bar.style.width = `${Math.round(self.progress * 100)}%`;
        },
      });

      // Parallax background drift
      gsap.to("[data-ij-bg]", {
        x: 40 * sign,
        y: -30,
        scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: 1.2 },
      });
    }, root);

    return () => ctx.revert();
  }, [lang]);

  return (
    <section
      ref={root}
      aria-label={lang === "ar" ? "رحلة تبرعك خطوة بخطوة" : "Your donation journey, step by step"}
      className="relative overflow-hidden bg-primary text-primary-foreground"
    >
      {/* Section heading */}
      <div className="container relative z-10 mx-auto px-4 pt-14 text-center md:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-primary-foreground/10 px-4 py-1.5 text-[11px] font-extrabold text-secondary backdrop-blur-sm sm:text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          {lang === "ar" ? "رحلة تبرعك" : "Your Donation Journey"}
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          {lang === "ar" ? (
            <>من قلبك… إلى <span className="text-gradient-lime">يد المحتاج</span></>
          ) : (
            <>From your heart… to <span className="text-gradient-lime">a family in need</span></>
          )}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-primary-foreground/80 sm:text-base">
          {lang === "ar"
            ? "اسحب لأسفل وعِش كل خطوة من رحلة الخير — من تبرعك حتى ابتسامة الأسرة."
            : "Scroll down and live every step — from your gift to a family's smile."}
        </p>
      </div>

      <div data-ij="stage" className="relative h-screen min-h-[640px] w-full overflow-hidden">
        {/* Background art */}
        <div
          data-ij-bg
          aria-hidden
          className="pointer-events-none absolute inset-0 pattern-hero-luxe opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/10 to-primary/70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/15 blur-3xl"
        />

        {/* Progress bar */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-1 bg-primary-foreground/10">
          <div data-ij-progress className="h-full w-0 bg-gradient-to-r from-secondary via-accent to-secondary transition-[width] duration-150" />
        </div>

        <div className="container relative z-10 mx-auto grid h-full grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-[280px_1fr] md:gap-10 md:py-16">
          {/* Step indicator (left in LTR / right in RTL) */}
          <ol className="flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-4 md:overflow-visible">
            {steps.map((s, i) => (
              <li
                key={i}
                data-ij-step
                className="group relative flex shrink-0 items-center gap-3 rounded-2xl border border-secondary/20 bg-primary-foreground/5 px-3 py-2.5 text-start backdrop-blur transition-all data-[active=true]:border-secondary/60 [&.is-active]:border-secondary/70 [&.is-active]:bg-primary-foreground/15 [&.is-active]:shadow-[0_10px_30px_-10px_hsl(var(--secondary)/0.5)] md:px-4 md:py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary ring-1 ring-secondary/40 transition group-[.is-active]:bg-secondary group-[.is-active]:text-secondary-foreground">
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-extrabold text-secondary/80 sm:text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="block text-sm font-black leading-tight md:text-base">{s.title}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* Scenes */}
          <div className="relative h-[360px] w-full sm:h-[440px] md:h-[520px]">
            {/* Scene 1 — Heart / Gift */}
            <div data-ij-scene className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="grid h-28 w-28 place-items-center rounded-full bg-secondary/20 ring-1 ring-secondary/40 sm:h-36 sm:w-36">
                <Heart className="h-14 w-14 text-secondary sm:h-20 sm:w-20" />
              </div>
              <h3 className="mt-6 text-2xl font-black sm:text-3xl md:text-4xl">{steps[0].title}</h3>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{steps[0].desc}</p>
            </div>
            {/* Scene 2 — Packed carton tower */}
            <div data-ij-scene className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img src={decoTower} alt="" aria-hidden loading="lazy" className="h-48 w-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] sm:h-64 md:h-72" />
              <h3 className="mt-6 text-2xl font-black sm:text-3xl md:text-4xl">{steps[1].title}</h3>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{steps[1].desc}</p>
            </div>
            {/* Scene 3 — Van on the road */}
            <div data-ij-scene className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img src={decoVan} alt="" aria-hidden loading="lazy" className="h-40 w-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] sm:h-56 md:h-64" />
              <h3 className="mt-6 text-2xl font-black sm:text-3xl md:text-4xl">{steps[2].title}</h3>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{steps[2].desc}</p>
            </div>
            {/* Scene 4 — Delivered carton */}
            <div data-ij-scene className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img src={decoCarton} alt="" aria-hidden loading="lazy" className="h-44 w-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] sm:h-60 md:h-72" />
              <h3 className="mt-6 text-2xl font-black sm:text-3xl md:text-4xl">{steps[3].title}</h3>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{steps[3].desc}</p>
            </div>
            {/* Scene 5 — Happy family */}
            <div data-ij-scene className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <img
                src={decoFamily}
                alt={lang === "ar" ? "أسرة سعيدة بعد وصول الخير" : "Happy family after the aid arrives"}
                loading="lazy"
                className="h-44 w-auto rounded-2xl object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-secondary/40 sm:h-60 md:h-72"
              />
              <h3 className="mt-6 text-2xl font-black sm:text-3xl md:text-4xl">{steps[4].title}</h3>
              <p className="mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">{steps[4].desc}</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center text-[11px] font-extrabold tracking-widest text-secondary/80"
        >
          {lang === "ar" ? "مرّر للأسفل لتكتشف الرحلة" : "Scroll to explore the journey"}
        </div>
      </div>
    </section>
  );
};
