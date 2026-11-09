import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, EyeOff, Loader2, MapPin, PackageCheck, Plus, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatServerImageUrl } from "@/data/laravelApi";
import { distributionsApi, type DistributionRow } from "@/data/api/impactApi";
import { DISTRIBUTION_STAGE, KIND_LABEL, formatDay } from "@/lib/impactLabels";
import { cn } from "@/lib/utils";

/** «أيام التوزيع»: every day the team moved a batch of donations a step, newest first. */
export default function AdminDistributions() {
  const q = useInfiniteQuery({
    queryKey: ["distributions"],
    queryFn: ({ pageParam }) => distributionsApi.list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length < last.lastPage ? pages.length + 1 : undefined),
  });
  const rows = q.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;

  return (
    <AdminLayout title={{ ar: "أيام التوزيع", en: "Distribution days" }}>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-base font-black text-primary"><PackageCheck className="h-5 w-5 text-secondary" />أيام التوزيع {total > 0 && <span className="text-xs text-muted-foreground">({total})</span>}</h1>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">سجّل يوم توزيع مرة واحدة، وكل المتبرعين اللي تبرعاتهم اتوزعت فيه بيشوفوه في سجل تبرعهم بالصور والمكان.</p>
          </div>
          <Button asChild className="h-10 gap-1.5 rounded-xl bg-orange-grad font-bold text-accent-foreground shadow-cta max-sm:w-full">
            <Link to="/admin/distributions/new"><Plus className="h-4 w-4" />تسجيل يوم توزيع</Link>
          </Button>
        </div>

        {q.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-muted" />)}</div>
        ) : q.error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">أيام التوزيع ما اتحملتش. جرّب تاني.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-secondary" />
            <p className="mt-2 text-sm font-black">لسه ما اتسجلش أي يوم توزيع</p>
            <p className="mx-auto mt-1 max-w-md text-[11.5px] text-muted-foreground">بعد أي توزيع (كراتين، لحوم، بطاطين…) سجّله هنا: اختار التبرعات اللي اتوزعت، وحط الصور (الوشوش بتتغطى لوحدها)، والمتبرعين يوصلهم إشعار.</p>
          </div>
        ) : (
          <>
            <ul className="grid gap-3 md:grid-cols-2">
              {rows.map((d) => <DistributionCardRow key={d.id} d={d} />)}
            </ul>
            {q.hasNextPage && (
              <Button type="button" variant="outline" onClick={() => void q.fetchNextPage()} disabled={q.isFetchingNextPage} className="mx-auto flex rounded-xl">
                {q.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}حمّل أكتر
              </Button>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function DistributionCardRow({ d }: { d: DistributionRow }) {
  const st = DISTRIBUTION_STAGE[d.stage];
  const cover = d.photos[0];
  return (
    <li>
      <Link to={`/admin/distributions/${d.id}`} className="flex gap-3 rounded-3xl border border-border/80 bg-card p-3 shadow-soft transition hover:border-primary/30 active:scale-[0.99]">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {cover ? <img src={formatServerImageUrl(cover) || cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <PackageCheck className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground/50" />}
          {d.photos.length > 1 && <span className="absolute bottom-1 end-1 rounded-md bg-black/60 px-1.5 text-[10px] font-bold text-white">+{d.photos.length - 1}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", st?.tone)}>{st?.ar ?? d.stage}</span>
            {!d.is_public && <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"><EyeOff className="h-3 w-3" />مش ظاهر للزوار</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug">{d.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5"><CalendarDays className="h-3 w-3" />{formatDay(d.happened_on, "ar")}</span>
            {d.place && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{d.place}</span>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-bold text-primary/80">
            <span>{d.donations_count} تبرع</span>
            {d.families_count > 0 && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{d.families_count} أسرة</span>}
            {d.target?.name && <span className="truncate text-muted-foreground">{KIND_LABEL[d.target.kind]?.ar}: {d.target.name}</span>}
          </p>
        </div>
        <ChevronLeft className="h-4 w-4 shrink-0 self-center text-muted-foreground/60" aria-hidden />
      </Link>
    </li>
  );
}
