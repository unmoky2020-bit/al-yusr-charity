import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, Sprout } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { useSiteBlocks } from "@/data/siteBlocks";
import { ABOUT_TEASER_DEFAULT } from "@/data/aboutTeaserDefault";

/**
 * Home → About bridge. A short, formal origin story with a three-stop timeline
 * (a team for good → official registration → the journey continues) that draws itself once in view.
 */
export const AboutTeaser = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // From the dashboard («بيانات الموقع العامة» ← «من نحن» في الرئيسية); the built-in copy fills any gap.
  const block = useSiteBlocks().about_teaser;
  const D = ABOUT_TEASER_DEFAULT;
  const pick = (ar: string | undefined, en: string | undefined, dAr: string, dEn: string) => (isRTL ? ar || dAr : en || dEn);
  const title = pick(block?.title_ar, block?.title_en, D.title_ar, D.title_en);
  const text = pick(block?.text_ar, block?.text_en, D.text_ar, D.text_en);
  const stops = (block?.stops?.length ? block.stops : D.stops).map((s) => ({
    y: s.year || null,
    t: isRTL ? s.title_ar : s.title_en || s.title_ar,
    d: (isRTL ? s.text_ar : s.text_en || s.text_ar) || "",
  }));

  return (
    <section id="about-teaser" className="pattern-why relative overflow-hidden py-16 text-primary-foreground md:py-24">
      <div className="container relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="text-center md:col-span-5 md:text-start">
          <p className="inline-flex items-center gap-1.5 text-sm font-black text-secondary">
            <ShieldCheck className="h-4 w-4" /> {isRTL ? "من نحن" : "Who we are"}
          </p>
          <h2 className="mt-2 text-3xl font-black leading-[1.3] md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-primary-foreground/85 md:mx-0">
            {text}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-x-6 md:justify-start">
            <Link
              to="/about"
              data-source="about-teaser"
              data-label="about"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-secondary px-6 text-sm font-black text-secondary-foreground transition-colors hover:bg-[hsl(75_85%_68%)] active:bg-[hsl(75_80%_54%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {isRTL ? "اعرف قصتنا" : "Read our story"}
              <Arrow className="h-4 w-4" />
            </Link>
            <Link
              to="/about#trust"
              data-source="about-teaser"
              data-label="trust"
              className="inline-flex min-h-[44px] items-center rounded-lg text-sm font-black text-primary-foreground underline decoration-secondary/70 decoration-2 underline-offset-[6px] transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {isRTL ? "لماذا تثق بنا؟" : "Why trust us?"}
            </Link>
          </div>
        </div>

        <div ref={ref} className="about-teaser md:col-span-7" data-in={inView || undefined}>
          {/* Phones: the journey reads top to bottom — a rail with one card per stop */}
          <ol className="keep-flow relative space-y-4 sm:hidden">
            <span aria-hidden className="absolute bottom-10 start-[15px] top-3 w-[2px] bg-primary-foreground/15" />
            <span aria-hidden className="about-teaser-line absolute bottom-10 start-[15px] top-3 w-[2px] origin-top bg-secondary" />
            {stops.map((s, i) => (
              <li key={s.t} className="about-teaser-stop relative ps-12 text-start" style={{ transitionDelay: `${120 + i * 220}ms` }}>
                <span aria-hidden className={`absolute start-0 top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-secondary ${s.y ? "bg-[hsl(152_65%_11%)]" : "bg-secondary text-secondary-foreground shadow-[0_0_0_6px_hsl(var(--secondary)/0.15)]"}`}>
                  {s.y ? <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> : <Sprout className="h-4 w-4" />}
                </span>
                <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-4 backdrop-blur-[2px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base font-black leading-snug text-primary-foreground">{s.t}</h3>
                    {s.y && <span className="shrink-0 font-mono text-2xl font-black tabular-nums leading-none text-secondary" dir="ltr">{s.y}</span>}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/80">{s.d}</p>
                  {!s.y && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link to="/donate" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-3 text-sm font-black text-secondary-foreground">{isRTL ? "تبرّع" : "Give"}</Link>
                      <Link to="/volunteer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-secondary/60 px-3 text-sm font-black text-secondary">{isRTL ? "انضم إلينا" : "Join us"}</Link>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <ol className="relative hidden grid-cols-3 gap-3 sm:grid sm:gap-6">
            <span aria-hidden className="absolute end-[16.666%] start-[16.666%] top-[11px] h-[2px] bg-primary-foreground/15" />
            <span aria-hidden className="about-teaser-line absolute end-[16.666%] start-[16.666%] top-[11px] h-[2px] bg-secondary ltr:origin-left rtl:origin-right" />
            {/* the line keeps going past the last stop: the journey is not over */}
            <span
              aria-hidden
              className="about-teaser-stop absolute top-[11px] h-0"
              style={{ insetInlineEnd: "-4%", width: "20%", borderTop: "2px dashed hsl(var(--secondary) / 0.65)", transitionDelay: "820ms" }}
            />
            {stops.map((s, i) => (
              <li key={s.t} className="about-teaser-stop relative text-center" style={{ transitionDelay: `${120 + i * 220}ms` }}>
                <span aria-hidden className="relative mx-auto block h-6 w-6 rounded-full border-2 border-secondary bg-[hsl(152_65%_11%)]">
                  <span className="about-teaser-dot absolute inset-[4px] rounded-full bg-secondary" style={{ transitionDelay: `${120 + i * 220}ms` }} />
                </span>
                {s.y ? (
                  <div className="mt-4 font-mono text-3xl font-black tabular-nums text-secondary sm:text-5xl" dir="ltr">{s.y}</div>
                ) : (
                  <div className="mt-4 flex justify-center">
                    <span className="relative grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-[0_0_0_6px_hsl(var(--secondary)/0.15)] sm:h-12 sm:w-12">
                      <Sprout className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  </div>
                )}
                <div className="mt-2 text-sm font-black sm:text-base">{s.t}</div>
                <p className="mt-1 text-xs leading-relaxed text-primary-foreground/75 sm:text-sm">{s.d}</p>
                {!s.y && (
                  <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-black sm:text-sm">
                    <Link to="/volunteer" className="text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary">{isRTL ? "انضم إلينا" : "Join us"}</Link>
                    <Link to="/donate" className="text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary">{isRTL ? "تبرّع" : "Give"}</Link>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default AboutTeaser;
