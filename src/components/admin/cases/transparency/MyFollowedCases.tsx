import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, UserRoundCheck } from "lucide-react";
import { caseFileApi } from "@/data/api/impactApi";
import { egp } from "@/lib/impactLabels";

/** «الحالات اللي بتتابعها»: the cases the signed-in member was assigned to follow (hidden when none). */
export function MyFollowedCases() {
  const { data } = useQuery({ queryKey: ["my-followed-cases"], queryFn: () => caseFileApi.myCases(), staleTime: 60_000, retry: false });
  if (!data?.length) return null;
  return (
    <section className="rounded-3xl border border-secondary/40 bg-secondary/10 p-4">
      <h2 className="flex items-center gap-2 text-sm font-black text-primary">
        <UserRoundCheck className="h-4 w-4" />الحالات اللي بتتابعها ({data.length})
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => {
          const t = c.file.totals;
          const pct = t.collected > 0 ? Math.min(100, Math.round((t.spent / t.collected) * 100)) : 0;
          const missing = c.file.items.filter((i) => (i.status === "purchased" || i.status === "delivered") && !i.receipt_url).length;
          return (
            <li key={c.id}>
              <Link to={`/admin/cases/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft transition hover:ring-1 hover:ring-primary/30">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10.5px] text-muted-foreground">{c.code}{c.city ? ` · ${c.city}` : ""}</p>
                  <p className="truncate text-[13px] font-extrabold">{c.title}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                  <p className="mt-1 text-[10.5px] font-bold text-muted-foreground">
                    اتصرف {egp(t.spent)} من {egp(t.collected)}
                    {c.file.outcome ? " · ليها نتيجة" : t.items.all === 0 ? " · مفيش بنود لسه" : ""}
                    {missing > 0 && <span className="text-amber-700"> · {missing} من غير إيصال</span>}
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
