import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholders for content sections and dashboard forms. Routes use PageLoadingState. */

/** A grid of cards (blog list, programs, gallery…). */
export function CardGridSkeleton({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`} aria-busy="true" aria-label="جارٍ التحميل">
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
    <div className="space-y-4" aria-busy="true" aria-label="جارٍ التحميل">
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

/** Rows of a table or list (cases, services, FAQs…). */
export function ListSkeleton({ rows = 6, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="جارٍ التحميل">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-8 w-20 rounded-lg sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Square tiles (media library, photo pickers). */
export function TileGridSkeleton({ count = 12, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${className}`} aria-busy="true" aria-label="جارٍ التحميل">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
      ))}
    </div>
  );
}
