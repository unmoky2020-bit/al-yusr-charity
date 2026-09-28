import { useEffect, useRef } from "react";
import { Heart, Truck, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import cartonClosed from "@/assets/hero-carton-closed.webp";
import cartonOpened from "@/assets/hero-carton-opened.webp";
import { useLang } from "@/i18n/LangContext";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-storytelling journey: a sealed Al-Yusr aid carton (closed) opens up
 * into a full food package (opened) as the user scrolls. Parallax on both
 * images plus a subtle floating idle motion. Fully responsive (mobile/tablet/
 * desktop) and respects prefers-reduced-motion.
 */
export const CartonJourney = () => {
  const { lang } = useLang();
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !root.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const stage = root.current!.querySelector<HTMLElement>("[data-cj='stage']");
      if (!stage) return;

      gsap.set("[data-cj='closed']", { autoAlpha: 1, scale: 1, rotate: -3, force3D: true });
      gsap.set("[data-cj='opened']", { autoAlpha: 0, scale: 0.92, y: 30, rotate: 4, force3D: true });
      gsap.set("[data-cj='beam']",   { autoAlpha: 0, scale: 0.85, force3D: true });

      // Start the animation only after the stage is fully inside the viewport
      // and finish it before leaving the section, so the story is contained.
      const trig = { trigger: stage, start: "top 85%", end: "bottom 75%", scrub: 1.1, invalidateOnRefresh: true } as const;

      // Crossfade closed → opened
      gsap.to("[data-cj='closed']", { autoAlpha: 0, scale: 1.04, x: -40, rotate: -8, ease: "none", scrollTrigger: trig });
      gsap.to("[data-cj='opened']", { autoAlpha: 1, scale: 1, y: 0, rotate: 0, ease: "none", scrollTrigger: trig });
      gsap.to("[data-cj='beam']",   { autoAlpha: 1, scale: 1.05, ease: "none", scrollTrigger: trig });

      // Parallax background pattern
      gsap.to("[data-cj='pattern']", { y: -60, ease: "none", scrollTrigger: { ...trig, scrub: 1.6 } });
      gsap.to("[data-cj='label-before']", { autoAlpha: 0, y: -10, ease: "none", scrollTrigger: trig });
      gsap.to("[data-cj='label-after']",  { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: trig });

      // Idle float on the cards
      gsap.to("[data-cj='floater']", { y: 8, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);

    return () => ctx.revert();
  }, []);

  const isAr = lang === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <section
      ref={root}
      className="relative overflow-hidden pattern-hero-luxe text-primary-foreground"
      aria-label={isAr ? "رحلة كرتونة الخير" : "The Aid Carton Journey"}
    >
      <div
        aria-hidden
        data-cj="pattern"
        className="pointer-events-none absolute inset-0 pattern-hero-luxe opacity-90"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/15 to-primary/55" />

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-primary-foreground/10 px-4 py-1.5 text-[11px] font-extrabold text-secondary backdrop-blur-sm sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "محطة 1 — رحلة العطاء" : "Stop 1 — The Giving Journey"}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            {isAr ? (
              <><span className="text-gradient-lime">كرتونة</span> خير</>
            ) : (
              <><span className="text-gradient-lime">A Carton</span> of Goodness</>
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-bold text-primary-foreground/85 sm:text-base md:text-lg">
            {isAr
              ? "كل تبرع يبدأ بكرتونة: طعام وكساء ودواء — نجمعها بجودة، نوثّقها بالصور، ونوصّلها لباب البيت بأمانة."
              : "Every donation begins with a carton: food, clothing, and medicine — packed with care, documented in photos, and delivered to the doorstep with trust."}
          </p>
        </div>

        {/* Stage */}
        <div
          data-cj="stage"
          className="relative mx-auto mt-10 grid max-w-6xl gap-6 md:mt-14 md:grid-cols-12 md:items-center"
        >
          {/* Step indicators (mobile + desktop) */}
          <div className="md:col-span-3">
            <ol className="flex flex-row items-center justify-center gap-3 md:flex-col md:items-start md:gap-5">
              <li data-cj="label-before" className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-extrabold text-foreground shadow sm:text-xs">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {isAr ? "قبل: كرتونة مُجهّزة" : "Before: sealed carton"}
              </li>
              <ArrowIcon className="hidden h-5 w-5 text-secondary md:block" />
              <li data-cj="label-after" className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-black text-secondary-foreground shadow-cta opacity-0 sm:text-xs">
                <Heart className="h-3.5 w-3.5" />
                {isAr ? "بعد: مائدة عامرة" : "After: a full table"}
              </li>
            </ol>
          </div>

          {/* Carton stage */}
          <div className="relative md:col-span-9">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[760px] overflow-hidden rounded-[1.75rem] bg-primary/40 ring-1 ring-secondary/30 shadow-card md:rounded-[2.25rem]">
              {/* Warm glow beam */}
              <div
                aria-hidden
                data-cj="beam"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,hsl(var(--secondary)/0.45),transparent_65%)] mix-blend-screen"
              />

              {/* Closed carton */}
              <div
                data-cj="closed"
                className="absolute inset-0 flex items-end justify-center pb-6 sm:pb-8"
                aria-hidden
              >
                <div data-cj="floater" className="h-[88%] w-auto max-w-[60%]">
                  <img
                    src={cartonClosed}
                    alt={isAr ? "كرتونة الخير المغلقة من مؤسسة اليسر" : "Al-Yusr sealed aid carton"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
                  />
                </div>
              </div>

              {/* Opened carton with food */}
              <div
                data-cj="opened"
                className="absolute inset-0 flex items-end justify-center pb-4 sm:pb-6"
              >
                <img
                  src={cartonOpened}
                  alt={isAr ? "كرتونة الخير ممتلئة بالطعام" : "Al-Yusr aid carton filled with food"}
                  loading="lazy"
                  decoding="async"
                  className="h-[92%] w-auto max-w-[92%] object-contain drop-shadow-[0_36px_56px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Bottom shelf gradient */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(to_bottom,transparent,hsl(28_45%_18%/0.55)_30%,hsl(28_55%_12%/0.9))]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-6 bottom-[22%] h-[2px] bg-gradient-to-r from-transparent via-secondary/45 to-transparent"
              />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mx-auto mt-10 flex w-full max-w-md flex-row items-center justify-center gap-2.5 sm:max-w-lg sm:gap-3">
          <Button
            asChild
            size="lg"
            className="h-11 flex-1 bg-orange-grad px-3 text-[13px] font-extrabold text-accent-foreground shadow-cta hover:opacity-95 sm:h-12 sm:px-6 sm:text-base"
          >
            <a href="/donate" data-cta="carton-journey-donate">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
              {isAr ? "تبرّع بكرتونة" : "Sponsor a Carton"}
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            className="group h-11 flex-1 border-0 bg-[#25D366] px-3 text-[13px] font-extrabold text-white shadow-cta hover:bg-[#1ebe5b] hover:text-white sm:h-12 sm:px-6 sm:text-base"
          >
            <a
              href={`https://wa.me/201097000137?text=${encodeURIComponent(
                isAr
                  ? "السلام عليكم، حابب أتبرع بكرتونة من مؤسسة اليسر."
                  : "Hello, I'd like to sponsor an Al-Yusr aid carton.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isAr ? "تواصل واتساب" : "WhatsApp"}
              className="inline-flex items-center justify-center gap-2"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 ring-1 ring-white/40 sm:h-6 sm:w-6">
                <svg viewBox="0 0 32 32" className="h-3 w-3 fill-white sm:h-3.5 sm:w-3.5" aria-hidden>
                  <path d="M19.11 17.21c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.6.13-.18.27-.69.88-.84 1.06-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.49-1.86-.16-.27-.02-.41.12-.54.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.83-1.99-.22-.52-.44-.45-.6-.46-.16-.01-.34-.01-.52-.01-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.21 0 1.3.96 2.56 1.09 2.74.13.18 1.88 2.87 4.56 4.02.64.28 1.13.44 1.52.57.64.2 1.22.18 1.68.11.51-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.31zM16.02 5.33C10.13 5.33 5.34 10.12 5.34 16c0 1.88.5 3.71 1.45 5.33L5.34 26.67l5.46-1.43A10.62 10.62 0 0 0 16.02 26.67c5.89 0 10.68-4.79 10.68-10.67 0-2.85-1.11-5.53-3.13-7.55a10.62 10.62 0 0 0-7.55-3.12zm0 19.51a8.84 8.84 0 0 1-4.5-1.23l-.32-.19-3.24.85.86-3.16-.21-.33A8.83 8.83 0 1 1 16.02 24.84z" />
                </svg>
              </span>
              {isAr ? "تواصل واتساب" : "WhatsApp"}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CartonJourney;