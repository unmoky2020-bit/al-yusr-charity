import { useLang } from "@/i18n/LangContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import {
  Utensils,
  HeartPulse,
  GraduationCap,
  Droplets,
  Home,
  Package,
  Beef,
  Gift,
  Pill,
  Snowflake,
  Sun,
  Moon,
  Sparkles,
  Check,
  Heart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import imgFood from "@/assets/axis-food.jpg";
import imgHealth from "@/assets/axis-health.jpg";
import imgEdu from "@/assets/axis-education.jpg";

/**
 * ZakatAxes — three blocks in a single section:
 *  1) محاور صرف زكاتك (food / health / education)
 *  2) اختر سهمك في الجنة (6 zakat shares)
 *  3) مواسم الخير (4 seasonal campaigns)
 */
export const ZakatAxes = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();

  // Resolve the current season key from today's date.
  // Eid al-Adha window ≈ Dhul-Hijjah (uses fixed 2026 dates as anchor;
  // updates yearly via month-only check for non-Eid windows).
  const now = new Date();
  const month = now.getMonth() + 1; // 1..12
  const day = now.getDate();
  const inWindow = (m1: number, d1: number, m2: number, d2: number) => {
    const cur = month * 100 + day;
    const a = m1 * 100 + d1;
    const b = m2 * 100 + d2;
    return a <= b ? cur >= a && cur <= b : cur >= a || cur <= b;
  };
  // Eid al-Adha 1447H ≈ May 26 — Jun 5, 2026
  const isEid = inWindow(5, 15, 6, 10);
  const isSummer = !isEid && (month >= 6 && month <= 9);
  const isWinter = month === 10 || month === 11 || month === 12 || month === 1 || month === 2;
  const isRamadan = false; // anchor manually when Ramadan dates are added
  const currentSeason: "eid" | "summer" | "winter" | "ramadan" = isEid
    ? "eid"
    : isSummer
    ? "summer"
    : isWinter
    ? "winter"
    : isRamadan
    ? "ramadan"
    : "eid"; // default to nearest upcoming season

  // Pillar cards (same visual language as WorkAxes "محاور عملنا")
  const pillars = [
    {
      img: imgFood,
      number: "01",
      donateSlug: "box",
      tag: isRTL ? "محور الإطعام" : "Food pillar",
      title: isRTL ? "الغذاء" : "Food",
      desc: isRTL
        ? "أمان غذائي لكل أسرة مستحقة عبر مزارعنا الوقفية ومطابخ اليسر الدائمة."
        : "Food security for every family in need through our endowment farms and permanent Al-Yusr kitchens.",
      bullets: isRTL
        ? ["كرتونة الغذاء الشهرية + كيلو لحمة بلدي", "مطبخ يومي بآلاف الوجبات الساخنة", "أكثر من 5 طن لحوم سنويًا من مزارعنا الوقفية"]
        : ["Monthly food box + 1 kg of farm meat", "Daily kitchen with thousands of hot meals", "Over 5 tons of meat per year from our endowment farms"],
      href: "/axes/food",
      accent: "bg-secondary text-secondary-foreground",
    },
    {
      img: imgHealth,
      number: "02",
      donateSlug: "treatment",
      tag: isRTL ? "محور الصحة" : "Health pillar",
      title: isRTL ? "الصحة" : "Health",
      desc: isRTL
        ? "بناء إنسان منتج ومستقر عبر القوافل والمجمعات الطبية ومركز الغسيل الكلوي."
        : "Building a stable, productive person through medical caravans, clinics, and our dialysis center.",
      bullets: isRTL
        ? ["عمليات وعلاج للحالات العاجلة", "قوافل علاجية في القرى النائية", "أطراف صناعية وكراسي ذوي الهمم"]
        : ["Surgeries & urgent treatment", "Caravans in remote villages", "Prosthetics & wheelchairs"],
      href: "/axes/health",
      accent: "bg-accent text-accent-foreground",
    },
    {
      img: imgEdu,
      number: "03",
      donateSlug: "education",
      tag: isRTL ? "محور التعليم" : "Education pillar",
      title: isRTL ? "التعليم" : "Education",
      desc: isRTL
        ? "محاربة الفقر الأول بالعلم وتأمين مستقبل الأجيال داخل مجمّعنا التعليمي."
        : "Fighting the first poverty with knowledge and securing future generations inside our educational complex.",
      bullets: isRTL
        ? ["كفالة تعليمية لـ 354 طالبًا", "دروس ومتابعة داخل المجمّع", "حقائب وأدوات لكل عام دراسي"]
        : ["Education sponsorship for 354 students", "Tutoring inside our complex", "Backpacks & tools each year"],
      href: "/axes/education",
      accent: "bg-primary text-primary-foreground",
    },
  ];
  const stickyOffsets = [
    "top-[84px] md:top-[96px]",
    "top-[100px] md:top-[116px]",
    "top-[116px] md:top-[136px]",
  ];

  const shares = [
    { icon: Droplets, title: isRTL ? "سهم سُقيا الماء" : "Water share", text: isRTL ? "وصلة مياه أو حفر بئر." : "Water connection or well drilling." },
    { icon: Home, title: isRTL ? "سهم سَتر" : "Shelter share", text: isRTL ? "تسقيف وترميم منزل لأسرة." : "Roofing and home repair for a family." },
    { icon: Package, title: isRTL ? "كرتونة الخير 25 كيلو" : "25kg goodness carton", text: isRTL ? "إطعام أسرة لمدة شهر كامل." : "Feeds a family for a whole month." },
    { icon: Beef, title: isRTL ? "صك الأضحية" : "Qurbani share", text: isRTL ? "لحوم بلدي من مزارعنا — بدون ربح." : "Farm-raised meat from our farms — non-profit." },
    { icon: Gift, title: isRTL ? "تيسير عروسة" : "Bride's trousseau", text: isRTL ? "تجهيز يتيمة بأجهزة ومستلزمات بيتها." : "Equipping an orphan bride with home essentials." },
    { icon: Pill, title: isRTL ? "سهم العلاج" : "Treatment share", text: isRTL ? "دواء أو عملية جراحية عاجلة." : "Medicine or urgent surgery." },
  ];

  const seasons: Array<{
    key: "eid" | "summer" | "winter" | "ramadan";
    icon: any;
    tag: string;
    title: string;
    text: string;
    months: string;
    accent: string;
    href: string;
  }> = [
    {
      key: "eid",
      icon: Beef,
      tag: isRTL ? "عيد الأضحى — قريبًا" : "Eid al-Adha — coming soon",
      title: isRTL ? "تيسير الطاعة" : "Easing worship",
      text: isRTL
        ? "نربط المضحّي بالمستحق مباشرة — أكثر من ٢ طن لحوم سنويًا تصل لأبواب الأسر المتعفّفة في يوم العيد، طازجة، موثّقة بالصور والفيديو."
        : "We connect the donor directly to a family in need — over 2 tons of fresh meat delivered yearly on Eid day, documented with photo & video.",
      months: isRTL ? "ذو الحجة" : "Dhul Hijjah",
      accent: "from-amber-500/20 to-rose-500/10",
      href: "/qurbani",
    },
    {
      key: "summer",
      icon: Sun,
      tag: isRTL ? "موسم الصيف" : "Summer season",
      title: isRTL ? "حملة ظل" : "Shade campaign",
      text: isRTL
        ? "في عزّ الحرّ.. وصلة ماء بارد لبيت بلا حنفيّة، مروحة «مركون» تُسكِن غرفة، ومشروب بارد ليد عامل تحت الشمس. كرامة بسيطة في يوم طويل."
        : "In the peak of summer — a cold water line to a home with no tap, a fan from a closet that cools a room, a cold drink for a worker under the sun.",
      months: isRTL ? "يونيو — سبتمبر" : "June — September",
      accent: "from-sky-400/20 to-cyan-400/10",
      href: "/services/markoun",
    },
    {
      key: "winter",
      icon: Snowflake,
      tag: isRTL ? "موسم الشتاء" : "Winter season",
      title: isRTL ? "حملة ستر" : "Shelter campaign",
      text: isRTL
        ? "أكتوبر — فبراير: لحاف يدفّي طفل، مرتبة بدل الأرض، باب وشبّاك يحبسوا الريح، وسقف يحمي بيت بأكمله. «من ستر مسلماً ستره الله»."
        : "October–February: a blanket to warm a child, a mattress instead of the floor, doors and windows that hold back the cold, a roof that shelters a whole home.",
      months: isRTL ? "أكتوبر — فبراير" : "October — February",
      accent: "from-indigo-400/20 to-blue-500/10",
      href: "/services/ster",
    },
    {
      key: "ramadan",
      icon: Moon,
      tag: isRTL ? "رمضان المبارك" : "Holy Ramadan",
      title: isRTL ? "موائد الرحمة" : "Tables of mercy",
      text: isRTL
        ? "كرتونة ٢٥ كيلو على باب البيت، مطبخ اليسر بوجبة ساخنة، لحوم من مزارعنا الوقفية، وزكاة مال وفطر تُجمع بأمانة وتُسلَّم في موعدها."
        : "A 25kg carton at the doorstep, Al-Yusr kitchen with a hot meal, meat from our endowment farms, plus Zakat al-Mal & Fitr collected and delivered on time.",
      months: isRTL ? "رمضان" : "Ramadan",
      accent: "from-emerald-500/20 to-teal-400/10",
      href: "/services/food-box",
    },
  ];
  // Move the current season to the front and order by upcoming.
  const order: Array<typeof currentSeason> = (() => {
    const all: Array<typeof currentSeason> = ["eid", "summer", "winter", "ramadan"];
    const i = all.indexOf(currentSeason);
    return [...all.slice(i), ...all.slice(0, i)];
  })();
  const sortedSeasons = order
    .map((k) => seasons.find((s) => s.key === k)!)
    .filter(Boolean);

  return (
    <section
      aria-label={isRTL ? "محاور صرف الزكاة" : "Zakat disbursement axes"}
      className="relative isolate bg-background py-14 md:py-20"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4">
        {/* ── Block 1: Axes ─────────────────────────── */}
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isRTL ? "محاور الصرف" : "Disbursement axes"}
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
            {isRTL ? "محاور صرف زكاتك في اليسر" : "Where your Zakat goes at Al-Yusr"}
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {isRTL
              ? "نحن لا نمنح إعانة، بل نصنع حياة. زكاتك تتحوّل إلى غذاء يحفظ الكرامة، علاج يعيد الأمل، وتعليم يكسر دائرة الفقر."
              : "We don't hand out aid — we build lives. Your Zakat becomes dignified food, restoring treatment, and education that breaks the cycle of poverty."}
          </p>
        </header>

        <StickyStack className="mt-10">
          {pillars.map((p, idx) => (
            <StickyStackItem key={p.title} index={idx} top={stickyOffsets[idx]}>
              <Link
                to={p.href}
                style={{ isolation: "isolate" }}
                className={`group relative isolate mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-b from-card to-card/95 shadow-card outline-none ring-1 ring-primary/5 transition-colors duration-300 hover:border-secondary/50 md:items-stretch ${idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
              >
                <div className="relative m-2.5 aspect-[4/5] overflow-hidden rounded-[20px] bg-gradient-to-br from-primary/5 to-secondary/10 sm:aspect-[4/3] md:m-3 md:aspect-auto md:w-1/2 md:shrink-0 md:self-stretch">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading={idx === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-contain object-center md:transition-transform md:duration-700 md:group-hover:scale-[1.04] md:object-cover"
                  />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <span className={`absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-cta ring-2 ring-card ${p.accent}`}>
                    {p.tag}
                  </span>
                  <span aria-hidden className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-[14px] font-black text-secondary-foreground shadow-cta ring-2 ring-card">
                    {p.number}
                  </span>
                </div>
                <div className="flex flex-1 flex-col px-5 pb-5 pt-1 md:w-1/2 md:justify-center md:px-6 md:py-6">
                  <h3 className="text-2xl font-black leading-tight text-primary md:text-[28px]">{p.title}</h3>
                  <p className="mt-2 text-[13px] font-semibold leading-7 text-muted-foreground">{p.desc}</p>
                  <ul className="mt-3.5 space-y-2">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-foreground/85">
                        <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary/20 text-primary">
                          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/donate?program=${p.donateSlug}`);
                      }}
                      aria-label={`${isRTL ? "تبرع لمحور" : "Donate to"} ${p.title}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-4 py-2 text-[12.5px] font-extrabold text-accent-foreground shadow-cta transition hover:-translate-y-0.5 hover:opacity-95"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {isRTL ? "تبرع بزكاتك" : "Donate Zakat"}
                    </button>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[12.5px] font-extrabold text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:gap-3 group-hover:bg-accent group-hover:text-accent-foreground">
                      {isRTL ? "اعرف أكثر" : "Learn more"}
                      <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </StickyStackItem>
          ))}
          <div aria-hidden className="h-2" />
        </StickyStack>

        {/* ── Block 2: Shares ──────────────────────── */}
        <header className="mx-auto mt-20 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {isRTL ? "أسهم الجنة" : "Heaven shares"}
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
            {isRTL ? "اختر سهمك في الجنة" : "Choose your share of paradise"}
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {isRTL
              ? "أبواب صرف موثّقة تتوافق مع مصارف الزكاة الشرعية."
              : "Documented giving channels aligned with the Shariah-recognized Zakat outlets."}
          </p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((s) => (
            <article
              key={s.title}
              className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-6"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-grad text-accent-foreground shadow-cta">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-black text-foreground sm:text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="bg-orange-grad px-8 text-accent-foreground shadow-cta">
            <Link to="/donate">
              {isRTL ? "تبرّع بزكاتك الآن" : "Pay your Zakat now"}
            </Link>
          </Button>
        </div>

        {/* ── Block 3: Seasons ─────────────────────── */}
        <header className="mx-auto mt-20 max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isRTL ? "المواسم" : "Seasons"}
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
            {isRTL ? "مواسم الخير في اليسر" : "Seasons of goodness at Al-Yusr"}
          </h2>
          <p className="mx-auto mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {isRTL
              ? "كل موسم له قلبه ووجعه وفرحته — ومعاك بنوصل الخير في وقته، مش بعد فوات الأوان. الترتيب حسب الموسم القادم."
              : "Every season has its own heartbeat — we deliver good in its right time, never too late. Ordered by what's coming next."}
          </p>
        </header>

        <StickyStack className="mt-10">
          {sortedSeasons.map((s, i) => (
            <StickyStackItem key={s.key} index={i}>
            <Link
              to={s.href}
              className="group relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-all duration-500 hover:-translate-y-0.5 sm:p-8"
            >
              {/* gradient accent veil */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.accent} opacity-70 transition-opacity duration-500 group-hover:opacity-100`}
              />
              {/* gold corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/15 blur-3xl"
              />
              {/* "Current season" badge — driven by today's date */}
              {s.key === currentSeason && (
                <span className="absolute end-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-orange-grad px-2.5 py-0.5 text-[10px] font-black text-accent-foreground shadow-cta">
                  <Sparkles className="h-2.5 w-2.5" />
                  {isRTL ? "الموسم الحالي" : "Current season"}
                </span>
              )}
              <div className="relative z-10 flex flex-col">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-cta ring-4 ring-primary/10">
                  <s.icon className="h-7 w-7" />
                </span>
                <span className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">
                  {s.tag}
                </span>
                <h3 className="mt-1.5 text-xl font-black leading-tight text-foreground sm:text-2xl">{s.title}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm">{s.text}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] font-extrabold">
                  <span className="text-muted-foreground">{s.months}</span>
                  <span className="inline-flex items-center gap-1 text-primary transition group-hover:text-accent">
                    {isRTL ? "تفاصيل الحملة" : "Campaign details"}
                    <Arrow className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
            </StickyStackItem>
          ))}
          <div aria-hidden className="h-2" />
        </StickyStack>
      </div>
    </section>
  );
};

export default ZakatAxes;