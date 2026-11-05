import { Sparkles, HeartHandshake, ShieldCheck, Workflow, Heart, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LangContext";

/**
 * Al-Yusr's working principle: three pillars (strength of work, excellence in giving, trust in
 * delivery) that together lead to the result — the slogan «نصل بصدقتك لمن يستحق».
 * Visual treatment matches the brand book: deep green ground + lime leaf shapes + warm orange highlight.
 */
export const BrandValues = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const pillars = isRTL
    ? [
        { I: Workflow, t: "قوة العمل", d: "نظام قوي يعمل لتحقيق أقصى استفادة للمتبرع." },
        { I: HeartHandshake, t: "إحسان العطاء", d: "الصدقة تقع في يد الله قبل أن تقع في يد الفقير." },
        { I: ShieldCheck, t: "أمانة التوصيل", d: "صدقتك أمانة نتعامل معها بكل شفافية." },
      ]
    : [
        { I: Workflow, t: "Strength of work", d: "A strong system that makes every donation go as far as it can." },
        { I: HeartHandshake, t: "Excellence in giving", d: "Charity is given to God before it reaches the needy." },
        { I: ShieldCheck, t: "Trust in delivery", d: "Your donation is a trust we handle with full transparency." },
      ];
  const slogan = isRTL ? "نصل بصدقتك لمن يستحق" : "We bring your charity to those who deserve it";

  return (
    <section id="why-alyusr" className="relative overflow-hidden bg-[hsl(152_70%_8%)] text-primary-foreground py-10 md:py-14">
      {/* Pattern overlay — same SVG used in main hero for visual consistency */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
        style={{
          backgroundImage: "url('/patterns/p-ph-5.svg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Darkening wash to deepen the carpet feel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[hsl(152_70%_6%)]/55" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      {/* Soft brand glow accents */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-secondary/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-accent/15 blur-[120px]" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
            <Sparkles className="h-3 w-3" />
            {isRTL ? "مبادئ نعمل بها" : "The principle we work by"}
          </span>
          <h2 className="mt-2 text-xl font-black leading-tight md:text-3xl">
            {isRTL ? "قوة · إحسان · أمانة" : "Strength · Excellence · Trust"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-[12px] leading-relaxed text-primary-foreground/85 md:text-sm">
            {isRTL
              ? "ثلاثة مبادئ نعمل بها كل يوم، ونتيجتها واحدة."
              : "Three principles we work by every day, with one result."}
          </p>
        </div>

        <ul className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3 md:mt-8 md:gap-4">
          {pillars.map((v, i) => (
            <li
              key={v.t}
              className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-primary-foreground/15 bg-[hsl(152_55%_14%)]/80 p-4 text-center shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),0_8px_24px_-14px_hsl(0_0%_0%/0.5)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/45 hover:bg-[hsl(152_55%_16%)]/85 md:p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/20 text-secondary ring-1 ring-secondary/30 transition group-hover:bg-secondary group-hover:text-secondary-foreground md:h-12 md:w-12">
                <v.I className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black tracking-tight text-primary-foreground md:text-lg">{v.t}</h3>
              <p className="text-[13px] leading-relaxed text-primary-foreground/85 md:text-sm">{v.d}</p>
            </li>
          ))}
        </ul>

        {/* The three pillars meet in one result: the slogan */}
        <div aria-hidden className="mx-auto hidden h-14 max-w-5xl sm:block">
          <svg viewBox="0 0 300 56" preserveAspectRatio="none" className="h-full w-full text-secondary/70">
            <path d="M50 0 C50 30 150 26 150 52 M150 0 L150 52 M250 0 C250 30 150 26 150 52" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div aria-hidden className="mx-auto mt-3 flex justify-center text-secondary sm:hidden">
          <ArrowDown className="h-6 w-6" />
        </div>
        <div className="mx-auto mt-1 flex max-w-xl flex-col items-center text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground/70">
            {isRTL ? "نتيجة مبادئنا" : "What our principles add up to"}
          </span>
          <p className="mt-2 rounded-2xl bg-secondary px-6 py-3 text-lg font-black text-secondary-foreground shadow-cta md:text-2xl">
            {slogan}
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2.5 md:mt-8 md:gap-3">
          <Link
            to="/donate"
            data-source="why-alyusr"
            data-label="donate"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-grad px-3 py-2.5 text-[12px] font-extrabold text-accent-foreground shadow-cta transition hover:opacity-95 md:text-sm"
          >
            <Heart className="h-4 w-4" />
            {isRTL ? "تبرع الآن" : "Donate"}
          </Link>
          <Link
            to="/about"
            data-source="why-alyusr"
            data-label="about"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2.5 text-[12px] font-extrabold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/20 md:text-sm"
          >
            {isRTL ? "تعرّف علينا" : "About us"}
          </Link>
        </div>
      </div>
      {/* Bottom blender — fades into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[hsl(152_65%_11%)]" aria-hidden />
    </section>
  );
};

export default BrandValues;