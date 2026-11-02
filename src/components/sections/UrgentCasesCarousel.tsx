import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { urgentCasesApi, type UrgentCasesSettings } from "@/data/api/urgentCasesApi";
import type { CaseRow } from "@/data/casesApi";
import { CasesCarousel } from "@/components/cases/CasesCarousel";

/**
 * Homepage «حالات عاجلة» strip. The admin chooses in /admin/cases: automatic (cases marked «عاجلة»)
 * or a hand-picked list. Renders nothing when switched off or empty.
 */
export const UrgentCasesCarousel = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [settings, setSettings] = useState<UrgentCasesSettings | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);

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

  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const title = (isRTL ? settings.title_ar : settings.title_en) || (isRTL ? "حالات عاجلة محتاجة دعمك" : "Urgent cases that need you");
  const subtitle = isRTL ? settings.subtitle_ar : settings.subtitle_en;

  return (
    <section id="urgent-cases" aria-labelledby="urgent-cases-title" className="relative overflow-hidden bg-muted/30 py-14 md:py-20" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-sm font-black text-destructive">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
              </span>
              {isRTL ? `${cases.length} حالة محتاجة تتحل دلوقتي` : `${cases.length} cases need help now`}
            </span>
            <h2 id="urgent-cases-title" className="mt-2 text-2xl font-black text-primary md:text-[2.1rem] md:leading-tight">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
          </div>
          <Button asChild variant="outline" className="gap-1.5 rounded-full border-primary/25 font-black text-primary">
            <Link to="/cases">{isRTL ? "كل الحالات" : "All cases"} <Arrow className="h-4 w-4" /></Link>
          </Button>
        </div>
        <CasesCarousel cases={cases} isRTL={isRTL} label={title} showOwner />
      </div>
    </section>
  );
};
