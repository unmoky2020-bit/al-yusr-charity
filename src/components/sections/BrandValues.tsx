import { Sparkles, HeartHandshake, ShieldCheck, BadgeCheck, Sprout, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LangContext";

/**
 * Al-Yusr brand values — extracted from official brand identity book.
 * Five core values: Empowerment, Mercy, Transparency, Responsibility, Sustainability.
 * Visual treatment matches the brand book: deep green ground + lime leaf shapes + warm orange highlight.
 */
export const BrandValues = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const values = isRTL
    ? [
        { I: Sparkles, t: "التمكين", d: "ندعم الأسر لتعتمد على نفسها لا على الإحسان وحده." },
        { I: HeartHandshake, t: "الرحمة", d: "نسلّم الخير بكرامة، نحفظ ماء الوجه قبل الكرتونة." },
        { I: ShieldCheck, t: "الشفافية", d: "كل تبرع موثّق بالصور والفيديو وتقرير مفتوح." },
        { I: BadgeCheck, t: "المسؤولية", d: "أمانة شرعية وقانونية لكل قرش — مرخّصة 2655/2019." },
        { I: Sprout, t: "الاستدامة", d: "برامج تنموية، مش مجرد إغاثة لحظية." },
      ]
    : [
        { I: Sparkles, t: "Empowerment", d: "We help families stand on their own — beyond one-off aid." },
        { I: HeartHandshake, t: "Mercy", d: "Doorstep delivery — dignity before the box." },
        { I: ShieldCheck, t: "Transparency", d: "Every donation documented with photo, video and open report." },
        { I: BadgeCheck, t: "Responsibility", d: "Trust over every penny — Licensed NGO 2655/2019." },
        { I: Sprout, t: "Sustainability", d: "Development programs, not just one-time relief." },
      ];

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

      <div className="container relative mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
            <Sparkles className="h-3 w-3" />
            {isRTL ? "لماذا اليسر؟" : "Why Al-Yusr?"}
          </span>
          <h2 className="mt-2 text-xl font-black leading-tight md:text-3xl">
            {isRTL ? "قــوة · أمانــة · إحســان" : "Strength · Trust · Charity"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-[12px] leading-relaxed text-primary-foreground/85 md:text-sm">
            {isRTL
              ? "خمس قيم بنشتغل بيها كل يوم — صدقتك توصل بأمانة، موثّقة، وبكرامة محفوظة."
              : "Five values we live by — your gift arrives with trust, documented, and dignity intact."}
          </p>
        </div>

        <ul className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-2.5 md:mt-7 md:gap-3 lg:grid-cols-5">
          {values.map((v, i) => {
            const isLastOdd = values.length % 2 === 1 && i === values.length - 1;
            return (
              <li
                key={v.t}
                className={`group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-primary-foreground/15 bg-[hsl(152_55%_14%)]/80 p-3.5 text-center shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),0_8px_24px_-14px_hsl(0_0%_0%/0.5)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/45 hover:bg-[hsl(152_55%_16%)]/85 hover:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),0_12px_28px_-12px_hsl(0_0%_0%/0.55)] md:items-start md:p-4 md:text-start lg:col-span-1 ${
                  isLastOdd ? "col-span-2 lg:col-span-1" : ""
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* soft top accent line */}
                <span aria-hidden className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-secondary ring-1 ring-secondary/30 transition group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:ring-secondary/60 md:h-11 md:w-11">
                  <v.I className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-[13px] font-black tracking-tight text-primary-foreground md:text-sm">{v.t}</h3>
                <p className="text-[11px] leading-relaxed text-primary-foreground/80 md:text-xs">{v.d}</p>
              </li>
            );
          })}
        </ul>

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