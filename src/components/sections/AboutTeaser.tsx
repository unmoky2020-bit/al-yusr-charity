import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, Sprout } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

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

  /** Two dated milestones, then a mark (not a number) for the journey that continues. */
  const stops = isRTL
    ? [
        { y: "2000", t: "البداية: فريق للخير", d: "فريق اجتمع على خدمة الأسر المستحقة، واكتسب خبرته من العمل الميداني." },
        { y: "2019", t: "الإشهار الرسمي", d: "مؤسسة مشهرة برقم 2665 بوزارة التضامن الاجتماعي." },
        { y: null, t: "والمسيرة مستمرة", d: "تتوسع المؤسسة ويستمر عطاؤها بانضمامك إلينا أو بتبرعك." },
      ]
    : [
        { y: "2000", t: "The start: a team for good", d: "A team that came together to serve families in need and built its field experience." },
        { y: "2019", t: "Official registration", d: "Registered foundation No. 2665 with the Ministry of Social Solidarity." },
        { y: null, t: "And the journey continues", d: "The foundation grows and lasts as you join us or give." },
      ];

  return (
    <section id="about-teaser" className="pattern-why relative overflow-hidden py-16 text-primary-foreground md:py-24">
      <div className="container relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-12 lg:gap-16 lg:px-8">
        <div className="text-center md:col-span-5 md:text-start">
          <p className="inline-flex items-center gap-1.5 text-sm font-black text-secondary">
            <ShieldCheck className="h-4 w-4" /> {isRTL ? "من نحن" : "Who we are"}
          </p>
          <h2 className="mt-2 text-3xl font-black leading-[1.3] md:text-4xl">
            {isRTL ? "بدأنا فريقًا للخير، ثم أصبحنا مؤسسة مشهرة" : "We began as a team for good and grew into a registered foundation"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-primary-foreground/85 md:mx-0">
            {isRTL
              ? "بدأت اليسر فريقًا اجتمع على عمل الخير وخدمة الأسر المستحقة. ومع اتساع العمل تأسست مؤسسة مشهرة رسميًا بوزارة التضامن الاجتماعي برقم 2665 لسنة 2019، لكي ينمو الخير بنظام وحوكمة وشفافية. وما زالت المسيرة مستمرة."
              : "Al-Yusr began as a team that came together to do good and serve families in need. As the work grew, it became a foundation officially registered with the Ministry of Social Solidarity (No. 2665, 2019), so the good could grow with order, governance and transparency. The journey continues."}
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
