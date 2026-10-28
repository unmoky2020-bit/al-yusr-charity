import { useState } from "react";
import { HandHeart } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { useSiteStats, type SiteStat, DEFAULT_STATS } from "@/hooks/useSiteStats";
import { getLucideIcon } from "@/lib/lucide-icon";
import { CountUp } from "@/components/ui/count-up";
import { formatServerImageUrl } from "@/data/laravelApi";

const StatCard = ({ stat, lang }: { stat: SiteStat; lang: string }) => {
  const isAr = lang === "ar";
  const suffix = (isAr ? stat.suffix_ar : stat.suffix_en) || "";
  const label = (isAr ? stat.label_ar : stat.label_en) || stat.label_ar || stat.label_en;
  const Icon = getLucideIcon(stat.icon_name);
  const [imgError, setImgError] = useState(false);
  const resolvedImg = !imgError && stat.image_url ? formatServerImageUrl(stat.image_url) || stat.image_url : null;
  // Extract numeric content from either field. If `value_text` already contains
  // digits ("5 طن", "+9,520"), countup that leading number and treat the
  // remainder as its inline suffix so we don't double-render the unit.
  let parsedNumber: number | null = null;
  let inlineSuffix = suffix;
  let inlinePrefix = "";
  let displayFallback = "—";
  const rawText = stat.value_text?.trim() ?? "";
  // Normalize Arabic-Indic (٠-٩) and Persian (۰-۹) digits + Arabic thousands
  // separators (٬، ،) so we can parse "+٩٬٥٢٠ طن" the same as "+9,520 طن".
  const normalizeDigits = (s: string) =>
    s
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  if (rawText.length > 0) {
    const normalized = normalizeDigits(rawText);
    const m = normalized.match(/^(\D*?)([\d][\d.,\u066C\u060C]*)(.*)$/);
    if (m) {
      const n = Number(m[2].replace(/[,\u066C\u060C]/g, ""));
      if (!Number.isNaN(n)) {
        parsedNumber = n;
        inlinePrefix = m[1];
        const tail = m[3];
        // Avoid duplicating the configured suffix when it's already in the tail.
        inlineSuffix = suffix && tail.includes(suffix) ? tail : `${tail}${suffix ?? ""}`;
      }
    }
    displayFallback = rawText;
  } else if (typeof stat.value_number === "number") {
    parsedNumber = stat.value_number;
  }
  const display = displayFallback;
  return (
    <div className="group flex w-full min-w-0 flex-col items-center gap-1 rounded-xl p-2 text-center transition hover:bg-secondary/10 sm:gap-1.5 sm:p-2.5 md:rounded-2xl md:p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary/15 text-primary transition group-hover:bg-secondary/30 sm:h-9 sm:w-9 md:h-10 md:w-10">
        {resolvedImg ? (
          <img
            src={resolvedImg}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5" />
        )}
      </div>
      {parsedNumber !== null ? (
        <CountUp
          end={parsedNumber}
          prefix={inlinePrefix}
          suffix={inlineSuffix}
          locale={isAr ? "ar-EG" : "en-US"}
          className="text-sm font-extrabold leading-tight tabular-nums text-primary sm:text-base md:text-xl"
        />
      ) : (
        <span className="text-sm font-extrabold leading-tight tabular-nums text-primary sm:text-base md:text-xl">
          {display}
        </span>
      )}
      <div className="max-w-full text-center text-[10px] font-semibold leading-tight text-muted-foreground sm:text-[10.5px] md:text-[11px]">{label}</div>
    </div>
  );
};

export const StatsGrid = ({
  section = "home_stats",
  className = "",
  cols,
}: { section?: "home_stats" | "achievements"; className?: string; cols?: string }) => {
  const { lang } = useLang();
  const { data, loading } = useSiteStats(section);
  const gridCols = cols ?? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6";

  const resolvedData = data && data.length > 0 ? data : (DEFAULT_STATS[section] || []);

  if (loading && resolvedData.length === 0) {
    return (
      <div className={`grid gap-2 md:gap-2 ${gridCols} ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-1.5 rounded-xl p-2.5 sm:p-3 animate-pulse">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary/20" />
            <div className="h-5 w-16 rounded-md bg-primary/15 mt-1" />
            <div className="h-3 w-20 rounded bg-muted mt-0.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-2 md:gap-2 ${gridCols} ${className}`}>
      {resolvedData.map((s, index) => (
        <StatCard key={s.sort_order ?? index} stat={s} lang={lang} />
      ))}
    </div>
  );
};

export const ImpactStatsPanel = ({
  isRTL,
  className = "",
  animated = false,
}: {
  isRTL: boolean;
  className?: string;
  /** When true, renders both "before" and "after" badge states so that
   *  GSAP (in the Hero cinematic) can crossfade them with the flip. */
  animated?: boolean;
}) => (
  <div className={`relative ${className}`}>
    <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
      <div className="relative">
        {/* "Before" state — visible during the sad-girl phase of the hero cinematic.
            On the static (BrandPromise) instance, this layer is hidden. */}
        {animated && (
          <div className="hc-stats-badge-before inline-flex items-center gap-2 rounded-full bg-primary/95 px-3.5 py-2 text-[12px] font-black text-primary-foreground opacity-100 shadow-cta ring-1 ring-primary/20 will-change-[opacity] sm:px-5 sm:py-2.5 sm:text-[14px] md:text-[15px]">
            <HandHeart className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="whitespace-nowrap">{isRTL ? "قبل تبرعك" : "Before your gift"}</span>
          </div>
        )}
        {/* "After" state — the joyful badge. On the static instance it's the only one. */}
        <div
          className={`hc-stats-badge-after inline-flex items-center justify-center gap-2 rounded-full bg-orange-grad px-3.5 py-2 text-[12px] font-black text-accent-foreground shadow-cta ring-1 ring-primary/15 will-change-[opacity] sm:px-5 sm:py-2.5 sm:text-[14px] md:text-[15px] ${animated ? "absolute inset-0 opacity-0" : ""}`}
        >
          <HandHeart className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="whitespace-nowrap">{isRTL ? "كن سبب الفرحة" : "Be their joy"}</span>
        </div>
      </div>
    </div>
    <div className="min-h-[19rem] sm:min-h-[14rem] lg:min-h-[9.5rem] rounded-[20px] bg-card p-2.5 pt-6 shadow-card ring-1 ring-primary/10 overflow-hidden sm:p-4 sm:pt-8 md:rounded-3xl md:p-5 md:pt-9">
      <div className="mb-2 flex flex-col items-center justify-center gap-0.5 text-center sm:mb-4 sm:gap-1">
        <h3 className="text-base font-black text-primary sm:text-lg md:text-xl">
          {isRTL ? "أرقام تحكي أثر تبرعك" : "Numbers that tell your impact"}
        </h3>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {isRTL ? "محدّثة مباشرة من ميدان العمل" : "Live from the field"}
        </span>
      </div>
      <StatsGrid section="home_stats" cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 justify-items-center" />
    </div>
  </div>
);

/**
 * Standalone Stats section (kept for backwards compatibility / direct import).
 * The home page now embeds <StatsGrid /> inside <BrandPromise /> instead, but
 * this remains usable on other pages.
 */
export const Stats = () => {
  const { lang } = useLang();
  return (
    <section id="stats" className="relative z-40 overflow-visible bg-background px-4 py-8 md:py-10">
      <div className="container relative mx-auto">
        <div className="pointer-events-none absolute left-1/2 top-0 z-40 -translate-x-1/2 -translate-y-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-[12px] font-black text-secondary-foreground shadow-cta ring-1 ring-primary/15 sm:text-[13px]">
            <HandHeart className="h-3.5 w-3.5" />
            {lang === "ar" ? "كن سبب الفرحة" : "Be their joy"}
          </div>
        </div>
        <div className="rounded-[28px] bg-card p-5 pt-9 shadow-card ring-1 ring-primary/5 md:rounded-3xl md:p-6 md:pt-8">
          <StatsGrid section="home_stats" />
        </div>
      </div>
    </section>
  );
};
