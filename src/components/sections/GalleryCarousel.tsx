import { useState, useRef, useCallback, useEffect } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GalleryItem {
  src: string;
  altAr: string;
  altEn: string;
  badgeAr: string;
}

interface GalleryCarouselProps {
  gallery: GalleryItem[];
  isRTL?: boolean;
}

export const GalleryCarousel = ({ gallery, isRTL = true }: GalleryCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = gallery.length;

  const go = useCallback(
    (next: number, dir: 1 | -1) => {
      setDirection(dir);
      setCurrent((next + count) % count);
    },
    [count]
  );

  const prev = () => go(current - 1, -1);
  const next = () => go(current + 1, 1);

  useEffect(() => {
    autoRef.current = setTimeout(() => go(current + 1, 1), 5000);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [current, go]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0, scale: 0.93 }),
    center: { x: "0%", opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0, scale: 0.93 }),
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-[hsl(150_25%_5%/0.5)] to-background" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-lime-400/6 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-emerald-500/6 blur-3xl" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-xs font-black text-lime-600 dark:text-lime-400 mb-3 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-lime-500" />
            <span>{isRTL ? "توثيق ميداني فوري لكل تبرع" : "Verified Field Proof"}</span>
          </div>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl md:text-4xl">
            {isRTL ? "أين يذهب عربون خيرك على الأرض؟" : "Where Does Your Pledge Go?"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            {isRTL
              ? "قوافل ميدانية مستمرة في قرى ومحافظات مصر تسلّم التبرعات لباب البيت بكرامة تامة."
              : "Continuous field convoys delivering dignity-first relief across Egyptian governorates."}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative mx-auto max-w-5xl">
          {/* Main slide */}
          <div
            className="relative overflow-hidden rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
            style={{ aspectRatio: "4/5" }}
          >
            <style>{`@media (min-width: 640px) { .carousel-main { aspect-ratio: 16/9 !important; } }`}</style>
            <AnimatePresence custom={direction} mode="popLayout">
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0"
              >
                <img
                  src={gallery[current].src}
                  alt={isRTL ? gallery[current].altAr : gallery[current].altEn}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                {/* Subtle lime tint at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-lime-950/30 to-transparent pointer-events-none" />

                {/* Badge */}
                <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} z-10`}>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/95 text-black px-3.5 py-1.5 text-[11px] sm:text-xs font-black shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/50 animate-pulse" />
                    {gallery[current].badgeAr}
                  </span>
                </div>

                {/* Bottom text overlay — NO white box */}
                <div className={`absolute bottom-0 inset-x-0 p-5 sm:p-8 z-10 ${isRTL ? "text-right" : "text-left"}`}>
                  <p className="text-white font-black text-lg sm:text-2xl md:text-3xl leading-snug drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                    {isRTL ? gallery[current].altAr : gallery[current].altEn}
                  </p>
                  {/* Dot indicators */}
                  <div className={`mt-4 flex gap-2 items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => go(i, i > current ? 1 : -1)}
                        className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                          i === current
                            ? "bg-lime-400 w-8 shadow-[0_0_8px_rgba(163,230,53,0.8)]"
                            : "bg-white/40 hover:bg-white/70 w-4"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / Next Buttons */}
          <button
            type="button"
            onClick={isRTL ? next : prev}
            aria-label="Previous"
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-card/90 border border-border/60 shadow-lg backdrop-blur-md text-foreground hover:bg-lime-400 hover:text-black hover:border-lime-400 transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={isRTL ? prev : next}
            aria-label="Next"
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-card/90 border border-border/60 shadow-lg backdrop-blur-md text-foreground hover:bg-lime-400 hover:text-black hover:border-lime-400 transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Thumbnail strip */}
          <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
            {gallery.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i, i > current ? 1 : -1)}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer ${
                  i === current
                    ? "ring-2 ring-lime-400 ring-offset-2 ring-offset-background scale-105 shadow-[0_0_15px_rgba(163,230,53,0.4)]"
                    : "opacity-50 hover:opacity-80"
                }`}
                style={{ aspectRatio: "4/3" }}
              >
                <img
                  src={item.src}
                  alt={isRTL ? item.altAr : item.altEn}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
