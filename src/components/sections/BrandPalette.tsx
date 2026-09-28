import { useLang } from "@/i18n/LangContext";
import logo from "@/assets/brand-logo.png";
import girl from "@/assets/brand-girl-orange.jpg";

/**
 * Brand palette + mark band — extracted from the official brand book.
 * Three signature colors with their meaning, alongside the iconic
 * orange-flame portrait used in the brand identity.
 */
export const BrandPalette = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const palette = isRTL
    ? [
        { name: "أخضر القوة", hex: "#0E4F37", desc: "ثقة ومسؤولية مؤسسية", style: "bg-[#0E4F37] text-white" },
        { name: "ليموني الأمل", hex: "#C9F25C", desc: "طاقة وأمل ونماء", style: "bg-[#C9F25C] text-[#0E4F37]" },
        { name: "برتقالي الإنسانية", hex: "#F26B2C", desc: "دفء وتأثير إنساني", style: "bg-[#F26B2C] text-white" },
      ]
    : [
        { name: "Strength Green", hex: "#0E4F37", desc: "Trust & institutional responsibility", style: "bg-[#0E4F37] text-white" },
        { name: "Hope Lime", hex: "#C9F25C", desc: "Energy, hope, growth", style: "bg-[#C9F25C] text-[#0E4F37]" },
        { name: "Human Orange", hex: "#F26B2C", desc: "Warmth & human impact", style: "bg-[#F26B2C] text-white" },
      ];

  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24">
      <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2">
        {/* Iconic mark + portrait */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 rounded-[3rem] bg-secondary/20 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-secondary shadow-card">
            <img src={girl} alt={isRTL ? "طفلة من بطل قصة اليسر" : "Child portrait — Al-Yusr story"} className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="absolute -bottom-6 -end-6 grid h-28 w-28 place-items-center rounded-full border-4 border-secondary bg-primary p-3 shadow-cta md:h-36 md:w-36">
            <img src={logo} alt="Al-Yusr logo" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Palette */}
        <div className="text-center lg:text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
            {isRTL ? "نظام الألوان" : "Brand palette"}
          </span>
          <h2 className="mt-4 text-3xl font-black text-primary md:text-4xl">
            {isRTL ? "ثلاث ألوان · رسالة واحدة" : "Three colors · one message"}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {isRTL
              ? "ألوان حديثة و عطوفة و متجانسة، تعبر عن قوة المؤسسة، أمل المستفيد، ودفء العطاء."
              : "Modern, kind, and cohesive — expressing institutional strength, beneficiary hope, and the warmth of giving."}
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {palette.map((c) => (
              <li
                key={c.hex}
                className={`group rounded-2xl p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card ${c.style}`}
              >
                <div className="text-base font-black">{c.name}</div>
                <div className="mt-1 font-mono text-xs opacity-80">{c.hex}</div>
                <p className="mt-3 text-sm leading-relaxed opacity-90">{c.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default BrandPalette;