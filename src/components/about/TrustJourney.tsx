import { useEffect, useId, useRef, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export type TrustStep = {
  icon: ElementType;
  title: string;
  desc: string;
};

/**
 * "Why trust us" as the path a donation actually walks.
 * A rail fills with scroll progress (transform: scaleY only), each station lights
 * up once the rail reaches it, and the official seal stamps when the path completes.
 * Reduced motion: everything renders in its final state, no scroll work.
 */
export const TrustJourney = ({ steps, isRTL }: { steps: TrustStep[]; isRTL: boolean }) => {
  const railRef = useRef<HTMLOListElement | null>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [reached, setReached] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) {
      setReduced(true);
      setProgress(1);
      setReached(steps.length);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rail = railRef.current;
      if (!rail) return;
      const line = window.innerHeight * 0.6;
      const r = rail.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)));
      setProgress(p);
      let n = 0;
      markerRefs.current.forEach((m) => {
        if (m && m.getBoundingClientRect().top + 20 <= line) n++;
      });
      setReached(n);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps.length]);

  const stamped = reached >= steps.length && steps.length > 0;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const fmt = (n: number) => n.toLocaleString(isRTL ? "ar-EG" : "en-US");

  const sealBlock = (className: string) => (
    <div className={`items-center gap-5 ${className}`}>
      <TrustSeal stamped={stamped} reduced={reduced} isRTL={isRTL} />
      <div className="min-w-0">
        <div className="font-mono text-2xl font-black tabular-nums text-primary" dir="ltr">2665 / 2019</div>
        <div className="mt-1 text-sm font-bold text-muted-foreground">
          {isRTL ? "إشهار رسمي بوزارة التضامن الاجتماعي" : "Registered with the Ministry of Social Solidarity"}
        </div>
        <Link
          to="/trust"
          className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-black text-primary underline decoration-secondary decoration-2 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {isRTL ? "كل ضمانات الشفافية" : "All transparency guarantees"}
          <Arrow className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <section id="trust" className="trust-journey scroll-mt-24 bg-background py-16 md:py-24">
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        {/* Sticky intro + seal */}
        <div className="md:sticky md:top-28 md:self-start">
          <p className="text-sm font-black text-accent">{isRTL ? "ضمانات حقيقية لراحة بالك" : "Real guarantees, not promises"}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-primary md:text-4xl lg:text-5xl">
            {isRTL ? "لماذا تثق بنا؟" : "Why trust Al-Yusr?"}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/80">
            {isRTL
              ? "تابع الطريق الذي يسلكه تبرعك من لحظة الدفع حتى يصل إلى باب البيت. في كل محطة ضمانة يمكنك أن تتأكد منها بنفسك."
              : "Follow the path your gift takes, from the moment you give to the family's doorstep. Every stop is a guarantee you can check yourself."}
          </p>

          {sealBlock("mt-8 hidden md:flex")}
        </div>

        {/* The path */}
        <ol ref={railRef} className="relative">
          <span aria-hidden className="absolute bottom-6 start-[23px] top-6 w-[3px] rounded-full bg-border" />
          <span
            aria-hidden
            className="trust-rail-fill absolute bottom-6 start-[23px] top-6 w-[3px] origin-top rounded-full bg-secondary"
            style={{ transform: `scaleY(${progress})` }}
          />

          {steps.map((s, i) => {
            const on = i < reached;
            const Icon = s.icon;
            return (
              <li key={i} className="relative pb-10 ps-16 last:pb-0" data-on={on || undefined}>
                <span
                  ref={(el) => (markerRefs.current[i] = el)}
                  className="trust-node absolute start-0 top-0 grid h-12 w-12 place-items-center rounded-full border-2 font-mono text-base font-black tabular-nums"
                  aria-hidden
                >
                  {fmt(i + 1)}
                </span>
                <div className="trust-card rounded-2xl border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-2.5">
                    <Icon className="trust-icon h-5 w-5 shrink-0" strokeWidth={1.75} />
                    <h3 className="text-lg font-black text-primary sm:text-xl">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:text-base">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {sealBlock("flex md:hidden")}
      </div>
    </section>
  );
};

/** Circular rubber-stamp seal. Stamps (scale + slight rotation + ink in) once. */
const TrustSeal = ({ stamped, reduced, isRTL }: { stamped: boolean; reduced: boolean; isRTL: boolean }) => {
  const ringId = `trust-seal-ring-${useId().replace(/:/g, "")}`;
  const ring = isRTL
    ? "مؤسسة اليسر الخيرية • مشهرة رسمياً • وزارة التضامن الاجتماعي • "
    : "AL-YUSR CHARITY FOUNDATION • LICENSED NGO • MANSOURA EGYPT • ";
  return (
    <div
      className="trust-seal relative h-28 w-28 shrink-0 text-accent sm:h-32 sm:w-32"
      data-stamped={stamped || reduced || undefined}
      role="img"
      aria-label={isRTL ? "ختم الإشهار الرسمي رقم 2665 لسنة 2019" : "Official registration seal no. 2665/2019"}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
        <defs>
          <path id={ringId} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
        <text fill="currentColor" direction={isRTL ? "rtl" : "ltr"} fontSize={isRTL ? 9.5 : 8} fontWeight={800} letterSpacing={isRTL ? 0 : 1.2}>
          <textPath href={`#${ringId}`} startOffset="50%" textAnchor="middle">{ring}</textPath>
        </text>
      </svg>
      <ShieldCheck className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2" strokeWidth={1.75} aria-hidden />
    </div>
  );
};
