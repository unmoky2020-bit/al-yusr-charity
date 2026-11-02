import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CaseRow } from "@/data/casesApi";
import { CasePosterCard } from "./CaseCard";

/**
 * Horizontal, swipeable row of case cards (homepage urgent cases, programs page).
 * One swipe / arrow press moves one "page" of cards; the bar under the row shows where you are.
 */
export function CasesCarousel({
  cases,
  isRTL,
  showOwner = false,
  label,
}: {
  cases: CaseRow[];
  isRTL: boolean;
  showOwner?: boolean;
  /** Accessible name of the row, e.g. «حالات عاجلة». */
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleRatio, setVisibleRatio] = useState(1);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // RTL browsers report scrollLeft as 0 → negative; take the distance from the start edge.
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos <= 4);
    setAtEnd(max - pos <= 4);
    setProgress(max > 0 ? pos / max : 0);
    setVisibleRatio(el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1);
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, cases.length]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // `dir` is "towards the end of the list"; in RTL that is to the left.
    el.scrollBy({ left: dir * (isRTL ? -1 : 1) * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(isRTL ? 1 : -1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(isRTL ? -1 : 1); }
  };

  const Back = isRTL ? ChevronRight : ChevronLeft;
  const Fwd = isRTL ? ChevronLeft : ChevronRight;
  const scrollable = visibleRatio < 0.999;
  const thumb = Math.max(visibleRatio, 0.12);

  return (
    <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
      <div
        ref={track}
        role="region"
        aria-roledescription={isRTL ? "شريط متحرك" : "carousel"}
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKey}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 pt-1 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-secondary/60 [&::-webkit-scrollbar]:hidden"
      >
        {cases.map((c) => (
          <CasePosterCard
            key={c.id}
            c={c}
            isRTL={isRTL}
            showOwner={showOwner}
            className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[30.5%] xl:w-[23.6%]"
          />
        ))}
      </div>

      {scrollable && (
        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10" aria-hidden>
            <div
              className="absolute inset-y-0 rounded-full bg-primary transition-[inset-inline-start] duration-150"
              style={{ width: `${thumb * 100}%`, insetInlineStart: `${progress * (1 - thumb) * 100}%` }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={atStart}
              aria-label={isRTL ? "الحالات السابقة" : "Previous cases"}
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:border-primary/50 hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <Back className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={atEnd}
              aria-label={isRTL ? "الحالات التالية" : "Next cases"}
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:border-primary/50 hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-35"
            >
              <Fwd className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
