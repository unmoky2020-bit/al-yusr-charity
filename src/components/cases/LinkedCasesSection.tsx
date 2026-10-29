import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/common/ContentSkeletons";
import { listPublicCases, type CaseRow, type LinkedCasesFilter } from "@/data/casesApi";
import { CaseCard } from "./CaseCard";

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
  className = "",
}: {
  filter: LinkedCasesFilter;
  title: string;
  subtitle?: string;
  isRTL: boolean;
  limit?: number;
  showOwner?: boolean;
  className?: string;
}) {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const key = JSON.stringify(filter);

  useEffect(() => {
    let alive = true;
    setCases(null);
    listPublicCases({ ...filter, limit })
      .then((rows) => alive && setCases(rows))
      .catch(() => alive && setCases([]));
    return () => {
      alive = false;
    };
    // `key` is the serialised filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit]);

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
        {cases === null ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => <CaseCard key={c.id} c={c} isRTL={isRTL} showOwner={showOwner} />)}
          </div>
        )}
      </div>
    </section>
  );
}
