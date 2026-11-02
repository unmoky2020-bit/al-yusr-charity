import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { listPublicCases, type CaseRow, type LinkedCasesFilter } from "@/data/casesApi";
import { CaseCard, caseOwnerLabel } from "./CaseCard";
import { CasesCarousel } from "./CasesCarousel";

/**
 * Approved cases that belong to a program / project / campaign (or to any of a kind), straight
 * from the backend. Renders nothing when there are none, so a page never shows an empty block.
 */
export function LinkedCasesSection({
  filter,
  title,
  subtitle,
  isRTL,
  limit = 6,
  showOwner = false,
  variant = "grid",
  filterByOwner = false,
  include,
  className = "",
}: {
  filter: LinkedCasesFilter;
  title: string;
  subtitle?: string;
  isRTL: boolean;
  limit?: number;
  showOwner?: boolean;
  /** "carousel" = one swipeable row (better when there are many cases). */
  variant?: "grid" | "carousel";
  /** Chips above the cases to show one program / project / campaign at a time. */
  filterByOwner?: boolean;
  /** Keep only some of the cases (e.g. only cases of programs that are listed on the page). */
  include?: (c: CaseRow) => boolean;
  className?: string;
}) {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const key = JSON.stringify(filter);

  useEffect(() => {
    let alive = true;
    setCases(null);
    listPublicCases({ ...filter, limit })
      .then((rows) => alive && setCases(include ? rows.filter(include) : rows))
      .catch(() => alive && setCases([]));
    return () => {
      alive = false;
    };
    // `key` is the serialised filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit, include]);

  const owners = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cases ?? []) {
      const o = caseOwnerLabel(c, isRTL);
      if (o) counts.set(o, (counts.get(o) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [cases, isRTL]);
  const shown = useMemo(
    () => (owner ? (cases ?? []).filter((c) => caseOwnerLabel(c, isRTL) === owner) : cases ?? []),
    [cases, owner, isRTL],
  );

  if (cases && cases.length === 0) return null;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className={`py-12 md:py-16 ${className}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-primary md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
          </div>
          <Button asChild variant="ghost" className="gap-1 font-bold">
            <Link to="/cases">{isRTL ? "كل الحالات" : "All cases"} <Arrow className="h-4 w-4" /></Link>
          </Button>
        </div>
        {filterByOwner && owners.length > 1 && (
          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label={isRTL ? "اختار البرنامج" : "Choose a program"}>
            {[{ key: null as string | null, label: isRTL ? "الكل" : "All", n: cases?.length ?? 0 }, ...owners.map(([o, n]) => ({ key: o as string | null, label: o, n }))].map((chip) => {
              const active = owner === chip.key;
              return (
                <button
                  key={chip.key ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setOwner(chip.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-primary/15 bg-card text-primary hover:border-primary/40"}`}
                >
                  {chip.label}
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-primary/10"}`}>{chip.n}</span>
                </button>
              );
            })}
          </div>
        )}
        {cases === null ? (
          <CardGridSkeleton count={3} />
        ) : variant === "carousel" ? (
          <CasesCarousel key={owner ?? "all"} cases={shown} isRTL={isRTL} showOwner={showOwner && !owner} label={title} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((c) => <CaseCard key={c.id} c={c} isRTL={isRTL} showOwner={showOwner} />)}
          </div>
        )}
      </div>
    </section>
  );
}
