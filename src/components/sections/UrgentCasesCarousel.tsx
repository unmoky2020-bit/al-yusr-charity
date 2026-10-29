import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { urgentCasesApi, type UrgentCasesSettings } from "@/data/api/urgentCasesApi";
import type { CaseRow } from "@/data/casesApi";
import { CaseCard } from "@/components/cases/CaseCard";

/**
 * Homepage «حالات عاجلة» strip. The admin chooses in /admin/cases: automatic (cases marked «عاجلة»)
 * or a hand-picked list. Renders nothing when switched off or empty.
 */
export const UrgentCasesCarousel = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [settings, setSettings] = useState<UrgentCasesSettings | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    urgentCasesApi
      .get()
      .then((r) => {
        if (!alive) return;
        setSettings(r.settings);
        setCases(r.cases);
      })
      .catch(() => alive && setCases([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!settings?.is_active || cases.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    // In RTL the scroll axis is mirrored.
    el.scrollBy({ left: dir * (isRTL ? -1 : 1) * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const Prev = isRTL ? ChevronRight : ChevronLeft;
  const Next = isRTL ? ChevronLeft : ChevronRight;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section id="urgent-cases" className="bg-muted/30 py-14 md:py-20" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-black text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {isRTL ? "عاجل" : "Urgent"}
            </span>
            <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">
              {(isRTL ? settings.title_ar : settings.title_en) || (isRTL ? "حالات عاجلة محتاجة دعمك" : "Urgent cases that need you")}
            </h2>
            {(isRTL ? settings.subtitle_ar : settings.subtitle_en) && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{isRTL ? settings.subtitle_ar : settings.subtitle_en}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => scroll(-1)} aria-label={isRTL ? "السابق" : "Previous"}>
              <Prev className="h-5 w-5" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => scroll(1)} aria-label={isRTL ? "التالي" : "Next"}>
              <Next className="h-5 w-5" />
            </Button>
            <Button asChild variant="ghost" className="gap-1 font-bold">
              <Link to="/cases">{isRTL ? "كل الحالات" : "All cases"} <Arrow className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        <div ref={track} className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} isRTL={isRTL} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23.5%]" />
          ))}
        </div>
      </div>
    </section>
  );
};
