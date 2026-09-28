import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Sparkles,
  Coins,
} from "lucide-react";
import { useLang } from "@/i18n/LangContext";

export const ArbounCalculator = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  // Calculator State
  const [currency, setCurrency] = useState<"EGP" | "USD">("EGP");
  const [projectRevenue, setProjectRevenue] = useState<number>(currency === "EGP" ? 15000 : 500);
  const [percent, setPercent] = useState<number>(2.5);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Derived calculation
  const calculatedValue = customAmount
    ? Number(customAmount) || 0
    : Math.round((projectRevenue * percent) / 100);

  // Real-world Impact Mapping based on amount in EGP (USD is roughly converted ~48 EGP)
  const egpEquivalent = currency === "USD" ? calculatedValue * 48 : calculatedValue;

  const getImpactMessage = () => {
    if (egpEquivalent < 200) {
      return isRTL
        ? "يساهم في وجبة ساخنة طازجة أو دعم دواء لأسرة متعففة"
        : "Funds a fresh hot meal or vital medicine for a family";
    }
    if (egpEquivalent < 500) {
      return isRTL
        ? "يكفل شنطة مدرسية متكاملة بأدواتها وزي لطالب يتيم"
        : "Fully equips an orphan student with a backpack & supplies";
    }
    if (egpEquivalent < 1000) {
      return isRTL
        ? "يوفر كرتونة مواد غذائية شهرية متكاملة تكفي أسرة 4 أفراد"
        : "Supplies a complete monthly food box for a family of 4";
    }
    if (egpEquivalent < 2000) {
      return isRTL
        ? "يساهم في جهاز منزلي أساسي لتيسير زواج عروسة يتيمة"
        : "Directly funds a core home appliance for an orphan bride";
    }
    return isRTL
      ? "يساهم في مد وصلة مياه نقية أو عزل سقف منزل يحمي أسرة لـ 10 سنوات"
      : "Funds clean water piping or insulated roofing lasting 10 years";
  };

  return (
    <section id="arboun-calculator-section" className="relative z-10 overflow-x-clip py-14 md:py-24 bg-gradient-to-b from-background via-card/50 to-card/70 border-b border-border">
      <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full border border-lime-500/40 bg-lime-400/10 px-4 py-1.5 text-xs font-black text-lime-700 dark:text-lime-400 mb-3 shadow-sm">
            <span>{isRTL ? "استثمار البركة والأثر" : "Barakah & Real-World Impact"}</span>
          </div>

          <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl text-foreground">
            {isRTL ? (
              <>احسب عربون خيرك.. <span className="text-gradient-lime">وبارك في رزقك</span></>
            ) : (
              <>Calculate Your Pledge & <span className="text-gradient-lime">Bless Your Work</span></>
            )}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isRTL
              ? "مهما كانت قيمة مشروعك أو عملتك.. استقطع نسبة تناسبك وشاهد أثرها الحي والمباشر على الأرض."
              : "No matter your project size or currency, pick your percentage and see its direct field impact."}
          </p>
        </div>

        {/* Centered Single Calculator Card */}
        <div className="mx-auto max-w-2xl">
          {/* Card 1: Interactive Barakah Calculator */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-primary/25 bg-card p-6 sm:p-8 shadow-card">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {isRTL ? "حاسبة عربون المشروع" : "Project Pledge Calculator"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isRTL ? "اربط بركة رزقك بأثر ملموس" : "Tie project income to real impact"}
                    </p>
                  </div>
                </div>

                {/* Currency Switcher */}
                <div className="flex rounded-xl border border-input bg-muted/60 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("EGP");
                      setProjectRevenue(15000);
                      setCustomAmount("");
                    }}
                    className={`rounded-lg px-3 py-1 transition ${
                      currency === "EGP" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    EGP (ج.م)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("USD");
                      setProjectRevenue(500);
                      setCustomAmount("");
                    }}
                    className={`rounded-lg px-3 py-1 transition ${
                      currency === "USD" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {/* Input: Project Value */}
              <div className="mt-5 space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{isRTL ? "أرباح المشروع المتوقعة / المستلمة:" : "Client Project Earnings:"}</span>
                  <span className="font-mono text-primary font-black">
                    {projectRevenue.toLocaleString()} {currency}
                  </span>
                </label>
                <input
                  type="range"
                  min={currency === "EGP" ? 1000 : 50}
                  max={currency === "EGP" ? 100000 : 4000}
                  step={currency === "EGP" ? 500 : 25}
                  value={projectRevenue}
                  onChange={(e) => {
                    setProjectRevenue(Number(e.target.value));
                    setCustomAmount("");
                  }}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                />
              </div>

              {/* Select Percentage */}
              <div className="mt-6 space-y-2">
                <label className="text-xs font-bold text-foreground">
                  {isRTL ? "نسبة عربون الخير المقترحة:" : "Pledge Percentage:"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2.5, 5, 10].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPercent(p);
                        setCustomAmount("");
                      }}
                      className={`rounded-xl py-2 text-xs font-extrabold transition ${
                        percent === p && !customAmount
                          ? "bg-primary text-white shadow-cta ring-2 ring-primary/30"
                          : "border border-border bg-muted/40 text-foreground hover:bg-muted"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Output Box */}
              <div className="mt-6 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isRTL ? "قيمة عربون الخير:" : "Your Calculated Pledge:"}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-primary font-mono">
                    {calculatedValue.toLocaleString()} {currency}
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-secondary/20 text-xs font-bold text-secondary flex items-start gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-snug">{getImpactMessage()}</p>
                </div>
              </div>
            </div>

            {/* Donate CTA */}
            <div className="mt-6">
              <Link
                to={`/donate?program=freelancers&amount=${calculatedValue}&currency=${currency}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-grad px-6 text-sm font-black text-accent-foreground shadow-cta transition hover:opacity-95"
              >
                <Heart className="h-4 w-4" />
                <span>
                  {isRTL
                    ? `طلع عربون خيرك الآن (${calculatedValue.toLocaleString()} ${currency})`
                    : `Pledge ${calculatedValue.toLocaleString()} ${currency} Now`}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
