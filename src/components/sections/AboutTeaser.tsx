import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * Home → About bridge. A short origin story with a three-stop timeline
 * (grassroots → licensed → today) that draws itself once when scrolled into view.
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

  const stops = isRTL
    ? [
        { y: "2000", t: "عمل تطوعي في القرى", d: "سنين من الخير المباشر قبل أي ترخيص." },
        { y: "2019", t: "إشهار رسمي 2665", d: "كيان منظم تحت وزارة التضامن الاجتماعي." },
        { y: "2025", t: "385 وصلة مياه", d: "و122 سقف و3000+ كرتونة شهرية." },
      ]
    : [
        { y: "2000", t: "Village volunteering", d: "Years of direct giving before any license." },
        { y: "2019", t: "Licensed NGO 2665", d: "Registered with the Ministry of Social Solidarity." },
        { y: "2025", t: "385 water taps", d: "Plus 122 roofs and 3,000+ monthly food boxes." },
      ];

  return (
    <section id="about-teaser" className="pattern-why relative overflow-hidden py-16 text-primary-foreground md:py-24">
      <div className="container relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="text-center md:col-span-5 md:text-start">
          <p className="text-sm font-black text-secondary">{isRTL ? "من نحن" : "Who we are"}</p>
          <h2 className="mt-2 text-3xl font-black leading-[1.3] md:text-4xl">
            {isRTL ? "مش بداية جديدة. أكتر من 20 سنة في الميدان" : "Not a new start. 20+ years in the field"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-primary-foreground/85 md:mx-0">
            {isRTL
              ? "اليسر بدأت بناس بتلف على البيوت في قرى الدقهلية، وبقت مؤسسة مشهرة عشان الخير يكبر بنظام وأمانة. اعرف مين إحنا وإزاي بنضمن إن تبرعك يوصل."
              : "Al-Yusr began with people knocking on doors in Dakahlia's villages, and became a licensed foundation so the good could grow with order and accountability."}
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
          <ol className="relative grid grid-cols-3 gap-3 sm:gap-6">
            <span aria-hidden className="absolute end-[16.666%] start-[16.666%] top-[11px] h-[2px] bg-primary-foreground/15" />
            <span aria-hidden className="about-teaser-line absolute end-[16.666%] start-[16.666%] top-[11px] h-[2px] bg-secondary ltr:origin-left rtl:origin-right" />
            {stops.map((s, i) => (
              <li key={s.y} className="about-teaser-stop relative text-center" style={{ transitionDelay: `${120 + i * 220}ms` }}>
                <span aria-hidden className="relative mx-auto block h-6 w-6 rounded-full border-2 border-secondary bg-[hsl(152_65%_11%)]">
                  <span className="about-teaser-dot absolute inset-[4px] rounded-full bg-secondary" style={{ transitionDelay: `${120 + i * 220}ms` }} />
                </span>
                <div className="mt-4 font-mono text-3xl font-black tabular-nums text-secondary sm:text-5xl" dir="ltr">{s.y}</div>
                <div className="mt-2 text-sm font-black sm:text-base">{s.t}</div>
                <p className="mt-1 hidden text-sm leading-relaxed text-primary-foreground/75 sm:block">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default AboutTeaser;
