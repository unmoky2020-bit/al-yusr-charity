import { useMemo, useRef } from "react";
import { ShieldCheck, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { useDonationEntities } from "@/data/sources/donationEntities";

/**
 * Lightweight, centered donate hero — replaces the heavy cinematic "journey".
 * Just a clean headline + a centered, scrollable program strip.
 */
export function SimpleDonateHero({
  selected,
  onSelect,
  sectorFilter = "all",
  onSectorFilterChange,
}: {
  selected?: string;
  onSelect?: (slug: string) => void;
  /** Currently active sector chip — shared with the form selector below. */
  sectorFilter?: string;
  /** Sector slug ("all" or entityType or category). */
  onSectorFilterChange?: (slug: string) => void;
}) {
  const { lang } = useLang();
  const isAR = lang === "ar";
  const stripRef = useRef<HTMLDivElement | null>(null);
  const { entities } = useDonationEntities();

  // Tabs matching the 3 main pillars + key highlights
  const SECTORS: { id: string; ar: string; en: string }[] = [
    { id: "all",      ar: "الكل",          en: "All" },
    { id: "program",  ar: "برامج دائمة",   en: "Programs" },
    { id: "project",  ar: "مشاريع",        en: "Projects" },
    { id: "campaign", ar: "حملات",         en: "Campaigns" },
    { id: "markoun",  ar: "مركون",         en: "Markoun" },
    { id: "zakat",    ar: "زكاة المال",    en: "Zakat" },
    { id: "food",     ar: "إطعام وغذاء",   en: "Food" },
  ];
  const setFilter = (id: string) => onSectorFilterChange?.(id);
  const filter = sectorFilter;

  const allItems = useMemo(() => {
    return entities.map((ent) => ({
      slug: ent.id,
      name: isAR ? ent.ar : ent.en,
      image: ent.image,
      priceFrom: ent.priceFrom,
      entityType: ent.entityType,
      isMarkoun: ent.isMarkoun,
      sharesCount: ent.shares.length,
      casesCount: ent.cases.length,
    }));
  }, [isAR, entities]);

  const items = useMemo(() => {
    if (filter === "all") return allItems;
    if (filter === "program" || filter === "project" || filter === "campaign") {
      return allItems.filter((i) => i.entityType === filter || i.slug === "general");
    }
    if (filter === "markoun") {
      return allItems.filter((i) => i.slug === "markoun" || i.slug === "general");
    }
    if (filter === "zakat") {
      return allItems.filter((i) => i.slug === "zakat" || i.slug === "general");
    }
    if (filter === "food") {
      return allItems.filter((i) => i.slug === "box" || i.slug === "kitchen" || i.slug === "general");
    }
    return allItems;
  }, [allItems, filter]);




  const scrollBy = (dir: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const goForm = () => {
    const el = document.getElementById("donate-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4 md:pt-14 md:pb-6">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-extrabold backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
          {lang === "ar" ? "تبرع آمن • موثّق • شرعي" : "Secure • Documented • Compliant"}
        </span>
        <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
          {lang === "ar" ? "تبرّع الآن وابدأ الأثر" : "Donate Now, Start the Impact"}
        </h1>
        <p className="mt-3 text-sm text-primary-foreground/85 md:text-base">
          {lang === "ar"
            ? "اختر برنامجك من الشريط بالأسفل، أو اضغط (تبرع عام) ودعنا نوصلها للأشد احتياجًا."
            : "Pick a program from the strip below, or choose General and we'll route it to the most urgent need."}
        </p>
      </div>

      {/* Centered program strip aligned to max-w-7xl */}
      <div className="relative mx-auto mt-6 md:mt-8 w-full max-w-7xl">
        {/* Filters */}
        <div
          role="tablist"
          aria-label={isAR ? "فلتر البرامج" : "Filter programs"}
          className="mb-4 flex flex-wrap justify-center gap-1.5"
        >
          {SECTORS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={
                  "rounded-full border px-3 py-1.5 text-[12px] font-extrabold transition " +
                  (active
                    ? "border-secondary bg-secondary text-slate-950 font-black shadow-soft"
                    : "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85 hover:border-secondary/60 hover:bg-primary-foreground/15")
                }
              >
                {isAR ? f.ar : f.en}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(isAR ? 1 : -1)}
          aria-label={isAR ? "السابق" : "Previous"}
          className="absolute start-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary-foreground/15 p-2 backdrop-blur hover:bg-primary-foreground/25"
        >
          {isAR ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <div
          ref={stripRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-10 py-2"
        >
          {items.map((it) => {
            const active = selected === it.slug;
            return (
              <button
                key={it.slug}
                onClick={() => {
                  onSelect?.(it.slug);
                  goForm();
                }}
                className={`group relative flex w-[180px] shrink-0 snap-center flex-col items-center overflow-hidden rounded-2xl border-2 p-3 text-center transition ${
                  active
                    ? "border-secondary bg-secondary/20 shadow-cta ring-2 ring-secondary/30"
                    : "border-primary-foreground/15 bg-primary-foreground/5 hover:border-secondary/60 hover:bg-primary-foreground/10"
                }`}
              >
                {it.image && (
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-primary-foreground/10">
                    <img
                      src={it.image}
                      alt={it.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="mt-2 line-clamp-1 text-sm font-extrabold">{it.name}</div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="rounded-full bg-secondary text-slate-950 px-2 py-0.5 text-[10px] font-black shadow-2xs">
                    {it.isMarkoun ? (isAR ? "عيني ونقدي" : "In-Kind & Cash") : `${isAR ? "من" : "From"} ${it.priceFrom} EGP`}
                  </div>
                  {it.sharesCount > 0 && !it.isMarkoun && (
                    <span className="text-[9.5px] font-bold text-primary-foreground/75 hidden sm:inline">
                      {it.sharesCount} {isAR ? "أسهم" : "shares"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="grid w-full place-items-center px-6 py-10 text-sm text-primary-foreground/70">
              {isAR ? "لا توجد برامج في هذه الفئة حالياً" : "No programs in this filter yet"}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => scrollBy(isAR ? -1 : 1)}
          aria-label={isAR ? "التالي" : "Next"}
          className="absolute end-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-primary-foreground/15 p-2 backdrop-blur hover:bg-primary-foreground/25"
        >
          {isAR ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
