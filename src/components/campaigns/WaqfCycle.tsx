import { useEffect, useState } from "react";
import { HandCoins, Sprout, Beef, RefreshCw, Home, Building2, PlusCircle, type LucideIcon } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * "How the waqf farm works" — four steps on a ring (donation → raising → production → returns),
 * the last one feeding back into the first. Click a step to read it; it auto-advances until the
 * visitor picks one (never under prefers-reduced-motion).
 */
const STEPS: { icon: LucideIcon; ar: string; en: string; bodyAr: string; bodyEn: string }[] = [
  {
    icon: HandCoins,
    ar: "تبرعك للوقف",
    en: "Your gift to the waqf",
    bodyAr: "يتحوّل تبرعك إلى أصل ثابت في مزرعة اليسر: رؤوس ماشية وأعلاف وتجهيزات. هذا الأصل لا يُنفَق ولا ينفد، بل يظل يعمل ويُنتج.",
    bodyEn: "Your gift becomes a lasting asset at the Al-Yusr farm: livestock, feed and equipment. The asset is never spent; it keeps working.",
  },
  {
    icon: Sprout,
    ar: "تربية ورعاية",
    en: "Raising and care",
    bodyAr: "تُربّى الماشية على أعلاف بلدية طبيعية وتحت إشراف بيطري، مع تطعيمات وسجل لكل رأس، حتى تصل إلى الوزن المناسب.",
    bodyEn: "Livestock is raised on natural local feed under veterinary care, vaccinated and recorded head by head, until it reaches its weight.",
  },
  {
    icon: Beef,
    ar: "الإنتاج",
    en: "Production",
    bodyAr: "يغطي إنتاج المزرعة صكوك الأضحية ولحوم المواسم الخيرية، ويُباع الباقي لتوفير موارد للمزرعة.",
    bodyEn: "The farm's output covers Qurbani shares and seasonal charity meat; the rest is sold so the farm earns income.",
  },
  {
    icon: RefreshCw,
    ar: "العائد يعود",
    en: "Returns flow back",
    bodyAr: "يُقسَّم عائد الإنتاج على ثلاثة أوجه، ثم تبدأ الدورة من جديد وهي أكبر من قبل.",
    bodyEn: "The returns are split three ways, and then the cycle starts again, bigger than before.",
  },
];

const RETURNS: { icon: LucideIcon; ar: string; en: string }[] = [
  { icon: Home, ar: "لحم طازج للأسر المستحقة", en: "Fresh meat for families in need" },
  { icon: PlusCircle, ar: "رؤوس جديدة تكبّر الوقف", en: "New livestock that grows the waqf" },
  { icon: Building2, ar: "موارد لأنشطة المؤسسة", en: "Income for the foundation's work" },
];

/** Node positions on the ring (percent of the square), clockwise from the top. */
const POS = [
  { top: "0%", left: "50%" },
  { top: "50%", left: "100%" },
  { top: "100%", left: "50%" },
  { top: "50%", left: "0%" },
];

/** Optional text from the page content (already in the visitor's language); icons and order stay in code. */
type CycleText = { steps?: { title: string; body: string }[]; returns?: string[] };

export const WaqfCycle = ({ steps, returns }: CycleText = {}) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const stepTitle = (i: number) => steps?.[i]?.title || (isAr ? STEPS[i].ar : STEPS[i].en);
  const stepBody = (i: number) => steps?.[i]?.body || (isAr ? STEPS[i].bodyAr : STEPS[i].bodyEn);
  const returnText = (i: number) => returns?.[i] || (isAr ? RETURNS[i].ar : RETURNS[i].en);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4000);
    return () => window.clearInterval(id);
  }, [auto]);

  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };
  const step = STEPS[active];
  const StepIcon = step.icon;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      {/* Ring */}
      <div className="relative mx-auto aspect-square w-full max-w-[340px]" dir="ltr">
        <svg viewBox="0 0 200 200" className="absolute inset-[11%] h-[78%] w-[78%]" aria-hidden>
          <defs>
            <marker id="waqf-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 Z" fill="hsl(var(--secondary))" />
            </marker>
          </defs>
          {/* four clockwise arcs between the nodes */}
          {["M118 6 A96 96 0 0 1 194 82", "M194 118 A96 96 0 0 1 118 194", "M82 194 A96 96 0 0 1 6 118", "M6 82 A96 96 0 0 1 82 6"].map((d, i) => (
            <path key={d} d={d} fill="none" strokeWidth="3" strokeLinecap="round" markerEnd="url(#waqf-arrow)"
              stroke={i === active ? "hsl(var(--secondary))" : "hsl(var(--border))"} className="transition-colors duration-500" />
          ))}
        </svg>
        <div className="absolute inset-[30%] grid place-items-center rounded-full bg-primary p-3 text-center text-primary-foreground shadow-card">
          <span className="text-sm font-black leading-snug sm:text-base">{isAr ? "وقف يكبر كل عام" : "A waqf that grows every year"}</span>
        </div>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const on = i === active;
          return (
            <button
              key={s.en}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={on}
              style={POS[i]}
              className={`absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-center transition sm:w-28 ${
                on ? "border-secondary bg-secondary text-slate-950 shadow-cta" : "border-border bg-card text-primary hover:border-secondary/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-black leading-tight sm:text-xs" dir={isAr ? "rtl" : "ltr"}>{stepTitle(i)}</span>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div aria-live="polite">
        <p className="text-sm font-black text-secondary">{isAr ? `الخطوة ${(active + 1).toLocaleString("ar-EG")} من ٤` : `Step ${active + 1} of 4`}</p>
        <h3 className="mt-2 flex items-center gap-2 text-2xl font-black text-primary md:text-3xl">
          <StepIcon className="h-7 w-7 text-secondary" /> {stepTitle(active)}
        </h3>
        <p className="mt-3 text-base leading-loose text-muted-foreground">{stepBody(active)}</p>
        {active === STEPS.length - 1 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {RETURNS.map(({ icon: Icon, en }, i) => (
              <li key={en} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm font-bold text-primary shadow-soft">
                <Icon className="h-5 w-5 shrink-0 text-secondary" /> {returnText(i)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex gap-2" role="tablist" aria-label={isAr ? "خطوات دورة الوقف" : "Waqf cycle steps"}>
          {STEPS.map((s, i) => (
            <button key={s.en} type="button" role="tab" aria-selected={i === active} aria-label={stepTitle(i)} onClick={() => pick(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-secondary" : "w-2 bg-border hover:bg-secondary/50"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
