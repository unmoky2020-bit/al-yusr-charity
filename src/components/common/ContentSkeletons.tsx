import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholders shown while content comes from the API, so a page never flashes its
 * built-in fallback copy first and then swaps to the real data.
 */

/** A grid of cards (blog list, programs, gallery…). */
export function CardGridSkeleton({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`} aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-border/70 bg-card">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A detail page: hero band + body column (article, program, case). */
export function DetailPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="جاري التحميل">
      <div className="bg-primary/90 py-14">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40 bg-white/20" />
            <Skeleton className="h-6 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-10 w-4/5 bg-white/25" />
            <Skeleton className="h-5 w-3/5 bg-white/20" />
            <Skeleton className="h-11 w-44 rounded-xl bg-white/25" />
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-[2rem] bg-white/15" />
        </div>
      </div>
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** A dashboard form while its record loads. */
export function FormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="جاري التحميل">
      <Skeleton className="h-20 w-full rounded-3xl" />
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-3xl border border-border/70 bg-card p-5">
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
