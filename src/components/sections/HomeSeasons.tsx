import { Link, useNavigate } from "react-router-dom";
import { Beef, Sun, Snowflake, Moon, Sparkles, ArrowLeft, ArrowRight, GraduationCap, Star, Heart, Lock } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { isSeasonEnabled, useSeasons, type SeasonSlug } from "@/data/seasons";
import { StickyStack, StickyStackItem } from "@/components/ui/sticky-stack";
import imgShelter from "@/assets/poster-water.png";
import imgWater from "@/assets/poster-water.png";
import imgRamadan from "@/assets/yusr-ramadan-box.png";
import imgMeat from "@/assets/poster-meat.webp";
import imgQurbani from "@/assets/qurbani-hero-trays.webp";
import imgSchool from "@/assets/poster-education.png";

/**
 * Homepage Seasons section — restored.
 * Mirrors the "Block 3: Seasons" from ZakatAxes but standalone, and uses the
 * unified `pattern-hero-soft` background to match the WorkAxes section.
 */
export const HomeSeasons = () => {
  // Subscribes to /seasons in api mode so isSeasonEnabled() below re-renders when data arrives (no-op when static).
  useSeasons();
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();

  // Pick current season by month (Cairo time approximation).
  const month = new Date().getMonth() + 1;
  const currentSeason: "winter" | "summer" | "ramadan" | "thuhijjah" | "qurbani" | "school" =
    month >= 10 || month <= 2 ? "winter"
      : month === 3 ? "ramadan"
      : month === 4 ? "ramadan"
      : month === 5 ? "thuhijjah"
      : month === 6 ? "qurbani"
      : month === 7 ? "summer"
      : month === 8 ? "school"
      : "summer";

  const seasons = [
    {
      key: "winter" as const,
      img: imgShelter,
      number: "01",
      icon: Snowflake,
      tag: isRTL ? "موسم الشتاء" : "Winter season",
      title: isRTL ? "حملة ستر" : "Ster campaign",
      text: isRTL
        ? "«من ستر مسلمًا ستره الله». لحاف فايبر، وأسقف منازل، ومراتب، وكسوة شتاء، وأسرّة، وأبواب ونوافذ تصدّ الريح."
        : "Fiber blankets, roofs, mattresses, winter clothes, beds, doors & windows that hold back the cold.",
      bullets: isRTL
        ? ["لحاف فايبر + كسوة شتاء", "ترميم أسقف وأبواب ونوافذ", "أسرّة ومراتب لكل أسرة"]
        : ["Fiber blankets + winter clothing", "Roofs, doors & windows repaired", "Beds & mattresses for each family"],
      months: isRTL ? "أكتوبر — فبراير" : "Oct — Feb",
      accent: "bg-primary text-primary-foreground",
      href: "/seasons/ster",
      slug: "ster" as SeasonSlug,
    },
    {
      key: "summer" as const,
      img: imgWater,
      number: "02",
      icon: Sun,
      tag: isRTL ? "موسم الصيف" : "Summer season",
      title: isRTL ? "حملة ظل — رحمة من الشمس" : "Shade — mercy from the sun",
      text: isRTL
        ? "وصلات مياه نظيفة، أسقف تحمي من الشمس، تجديد مراوح وثلاجات «مركون»، ومياه ومشروبات باردة للعمال."
        : "Clean water lines, sun-proof roofs, refurbished fans & fridges, cold drinks for outdoor workers.",
      bullets: isRTL
        ? ["وصلات مياه نظيفة للمنازل", "أسقف تحمي من حر الشمس", "مراوح وثلاجات «مركون» مجدّدة"]
        : ["Clean water lines to homes", "Sun-proof roofs", "Refurbished fans & fridges"],
      months: isRTL ? "يونيو — سبتمبر" : "Jun — Sep",
      accent: "bg-secondary text-secondary-foreground",
      href: "/seasons/thill",
      slug: "thill" as SeasonSlug,
    },
    {
      key: "ramadan" as const,
      img: imgRamadan,
      number: "03",
      icon: Moon,
      tag: isRTL ? "شهر الخير — رمضان" : "Holy Ramadan",
      title: isRTL ? "إحسان العطاء" : "The best of giving",
      text: isRTL
        ? "كرتونة ٢٥ كجم، إفطار صائم يومي، تيسير زواج يتيمة كل يوم، +٣ طن ذبائح، مسابقات قرآن، وزكاة في موعدها."
        : "25kg carton, daily iftar, orphan weddings, 3+ tons of meat, Quran contests, and timely Zakat.",
      bullets: isRTL
        ? ["كرتونة رمضان ٢٥ كجم", "إفطار صائم يومي + ذبائح", "تيسير زواج يتيمة كل يوم"]
        : ["25kg Ramadan carton", "Daily iftar + meat distribution", "Orphan weddings every day"],
      months: isRTL ? "رمضان" : "Ramadan",
      accent: "bg-accent text-accent-foreground",
      href: "/seasons/ramadan",
      slug: "ramadan" as SeasonSlug,
    },
    {
      key: "thuhijjah" as const,
      img: imgMeat,
      number: "04",
      icon: Star,
      tag: isRTL ? "العشر الأوائل" : "First 10 of Dhul Hijjah",
      title: isRTL ? "أحب الأيام إلى الله" : "Most beloved days",
      text: isRTL
        ? "إفطار يومي للصائمين، ذبح عجل كل يوم، تكثيف وصلات مياه، إعمار مساجد، وصلاة العيد بمسجد الصديق."
        : "Daily iftar, a calf slaughtered daily, water lines, mosque restoration, and Eid prayer at Al-Siddiq.",
      bullets: isRTL
        ? ["ذبح عجل كل يوم للفقراء", "إفطار يومي وتكثيف مياه", "إعمار وترميم مساجد"]
        : ["A calf slaughtered daily", "Daily iftar + water lines", "Mosque restoration"],
      months: isRTL ? "ذو الحجة ١ — ١٠" : "Dhul Hijjah 1–10",
      accent: "bg-primary text-primary-foreground",
      href: "/seasons/ashr",
      slug: "ashr" as SeasonSlug,
    },
    {
      key: "qurbani" as const,
      img: imgQurbani,
      number: "05",
      icon: Beef,
      tag: isRTL ? "موسم الأضاحي" : "Qurbani season",
      title: isRTL ? "تيسير الأضاحي — بدون استغلال" : "Qurbani — no exploitation",
      text: isRTL
        ? "من مزارع اليسر الوقفية: مواشي محصّنة بأعلى تصفية. سعر السوق بدون ربح، مقابل ٥ كجم للفقراء — +٥ أطنان سنويًا."
        : "From our Waqf farms: vaccinated cattle, market price with no markup, 5kg back to the poor — 5+ tons yearly.",
      bullets: isRTL
        ? ["مواشي وقفية محصّنة بأعلى تصفية", "سعر السوق — بدون ربح للمؤسسة", "٥ كجم من الصك للفقراء"]
        : ["Waqf-raised vaccinated cattle", "Market price — zero markup", "5 kg from each share to the poor"],
      months: isRTL ? "ذو الحجة" : "Dhul Hijjah",
      accent: "bg-secondary text-secondary-foreground",
      href: "/seasons/qurbani",
      slug: "qurbani" as SeasonSlug,
    },
    {
      key: "school" as const,
      img: imgSchool,
      number: "06",
      icon: GraduationCap,
      tag: isRTL ? "العودة للمدارس" : "Back to school",
      title: isRTL ? "الجهل هو الفقر الأول" : "Ignorance is the first poverty",
      text: isRTL
        ? "حقيبة مدرسية لكل طالب مستحق، وأدوات كاملة، وزي مدرسي جديد، وسداد المصروفات الدراسية."
        : "School bags, full supplies, new uniforms, and tuition fees paid for students in need.",
      bullets: isRTL
        ? ["حقيبة مدرسية + أدوات كاملة", "زي مدرسي جديد", "سداد مصروفات دراسية"]
        : ["School bag + full supplies", "Brand-new uniforms", "Tuition fees paid"],
      months: isRTL ? "أغسطس — سبتمبر" : "Aug — Sep",
      accent: "bg-accent text-accent-foreground",
      href: "/seasons/school",
      slug: "school" as SeasonSlug,
    },
  ];

  const order: Array<typeof currentSeason> = (() => {
    const all: Array<typeof currentSeason> = ["winter", "ramadan", "thuhijjah", "qurbani", "summer", "school"];
    const i = all.indexOf(currentSeason);
    return i < 0 ? all : [...all.slice(i), ...all.slice(0, i)];
  })();
  const sorted = order.map((k) => seasons.find((s) => s.key === k)!).filter(Boolean);
  // Sticky offsets cycled across the (up to 6) cards — same pattern as WorkAxes.
  const stickyOffsets = [
    "top-[84px] md:top-[96px]",
    "top-[100px] md:top-[116px]",
    "top-[116px] md:top-[136px]",
    "top-[132px] md:top-[156px]",
    "top-[148px] md:top-[176px]",
    "top-[164px] md:top-[196px]",
  ];

  return (
    <section
      aria-label={isRTL ? "مواسم اليسر" : "Al-Yusr seasons"}
      className="relative overflow-x-clip pattern-programs py-12 md:py-16"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        backgroundImage:
          "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(40 30% 98%) 42%, hsl(60 33% 97%) 70%, hsl(60 33% 97%) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isRTL ? "مواسم الخير" : "Seasons of good"}
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl md:text-4xl">
            {isRTL ? "نعمل طوال العام… ولكل موسم حملته" : "We work all year — every season, its own campaign"}
          </h2>
          <p className="mx-auto mt-2.5 max-w-[56ch] text-[13.5px] leading-relaxed text-muted-foreground sm:text-sm md:text-[15px]">
            {isRTL
              ? "ستة مواسم، وست حملات متكاملة، وأثر يدوم ٣٦٥ يومًا — مرتبة حسب الموسم الحالي."
              : "Six seasons, six integrated campaigns, impact that lasts 365 days — sorted by what's current."}
          </p>
        </header>

        {/* Same StickyStack pattern as WorkAxes — alternating image/content rows that
            stick & overlap on scroll. Identical on mobile and desktop styling. */}
        <StickyStack className="mx-auto mt-8 max-w-5xl">
          {sorted.map((s, idx) => {
            const enabled = isSeasonEnabled(s.slug);
            const Icon = s.icon;
            return (
              <StickyStackItem key={s.key} index={idx} top={stickyOffsets[idx % stickyOffsets.length]}>
                <Link
                  to={s.href}
                  style={{ isolation: "isolate" }}
                  className={`group relative isolate mx-auto flex w-full max-w-5xl scroll-mt-24 flex-col overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-b from-card to-card/95 shadow-card outline-none ring-1 ring-primary/5 transition-colors duration-300 hover:border-secondary/50 focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 md:items-stretch ${idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
                >
                  {/* Image side — mirrors WorkAxes framing */}
                  <div className="relative m-2.5 aspect-[16/11] overflow-hidden rounded-[20px] bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.10] ring-1 ring-primary/10 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.6),0_8px_24px_-12px_hsl(var(--primary)/0.25)] sm:aspect-[16/10] md:m-3 md:aspect-auto md:w-1/2 md:shrink-0 md:self-stretch">
                    <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--secondary)/0.10),transparent_65%)]" />
                    <img
                      src={s.img}
                      alt={s.title}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="absolute inset-0 h-full w-full object-contain md:transition-transform md:duration-700 md:group-hover:scale-[1.04]"
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_-30px_60px_-30px_hsl(var(--primary)/0.18),inset_0_30px_60px_-30px_hsl(0_0%_100%/0.35)]" />
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    {/* Tag chip */}
                    <span className={`absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-cta ring-2 ring-card ${s.accent}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {s.tag}
                    </span>
                    {/* Number badge */}
                    <span
                      aria-hidden
                      className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-secondary text-[14px] font-black text-secondary-foreground shadow-cta ring-2 ring-card"
                    >
                      {s.number}
                    </span>
                    {/* Status chips (current / closed) — bottom corner so they don't collide */}
                    {s.key === currentSeason && (
                      <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-orange-grad px-2.5 py-1 text-[10px] font-black text-accent-foreground shadow-cta ring-2 ring-card">
                        <Sparkles className="h-3 w-3" />
                        {isRTL ? "الموسم الحالي" : "Current"}
                      </span>
                    )}
                    {!enabled && (
                      <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground ring-2 ring-card">
                        <Lock className="h-3 w-3" />
                        {isRTL ? "الحملة مغلقة" : "Closed"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-1 md:w-1/2 md:justify-center md:px-6 md:py-6">
                    <h3 className="text-2xl font-black leading-tight text-primary md:text-[28px]">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13px] font-semibold leading-7 text-muted-foreground">{s.text}</p>

                    <ul className="mt-3.5 space-y-2">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-foreground/85">
                          <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary/20 text-primary">
                            <Sparkles className="h-2.5 w-2.5" />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      {enabled ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/donate?season=${s.slug}`);
                          }}
                          aria-label={`${isRTL ? "تبرع لـ" : "Donate to"} ${s.title}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-4 py-2 text-[12.5px] font-extrabold text-accent-foreground shadow-cta transition hover:-translate-y-0.5 hover:opacity-95"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {isRTL ? "تبرع الآن" : "Donate now"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-[12.5px] font-extrabold text-muted-foreground ring-1 ring-border">
                          <Lock className="h-3.5 w-3.5" />
                          {isRTL ? "الحملة مغلقة" : "Campaign closed"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-4 py-2 text-[12.5px] font-extrabold text-primary transition group-hover:border-secondary/60 group-hover:text-accent">
                        {isRTL ? "تفاصيل الموسم" : "Season details"}
                        <Arrow className="h-3.5 w-3.5" />
                      </span>
                      <span className="ms-auto text-[11px] font-extrabold text-muted-foreground">{s.months}</span>
                    </div>
                  </div>
                </Link>
              </StickyStackItem>
            );
          })}
        </StickyStack>
      </div>
    </section>
  );
};

export default HomeSeasons;