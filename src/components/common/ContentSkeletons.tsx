import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholders for content sections and dashboard forms. Routes use PageLoadingState. */

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
