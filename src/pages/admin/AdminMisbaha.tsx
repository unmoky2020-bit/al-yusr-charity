import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, EyeOff, RefreshCcw, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/LangContext";
import { useCan } from "@/auth/useCan";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { misbahaAdminApi, type AdminMisbahaRoom, type MisbahaKind } from "@/data/api/misbahaRoomsApi";

const KIND: Record<MisbahaKind, { ar: string; en: string }> = {
  deceased: { ar: "لمتوفّى", en: "Deceased" },
  sick: { ar: "لمريض", en: "Sick" },
  group: { ar: "جماعية", en: "Group" },
};
type Filter = "all" | MisbahaKind | "hidden";

const fmt = (n: number) => n.toLocaleString("en-US");
const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const isToday = (iso?: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/** «السبح المشتركة»: every shared misbaha people created, its count, and a switch to hide an abusive one. */
export default function AdminMisbaha() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const can = useCan();
  const canEdit = can("content.update");
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data: rooms = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-misbaha-rooms"],
    queryFn: misbahaAdminApi.list,
  });

  const toggle = useMutation({
    mutationFn: (r: AdminMisbahaRoom) => misbahaAdminApi.setHidden(r.id, !r.is_hidden),
    onSuccess: (_d, r) => {
      qc.invalidateQueries({ queryKey: ["admin-misbaha-rooms"] });
      toast({ title: r.is_hidden ? (isAr ? "السبحة رجعت تظهر" : "Misbaha is visible again") : isAr ? "السبحة اتخفت من الموقع" : "Misbaha hidden from the site" });
    },
    onError: (e) => toast({ variant: "destructive", title: isAr ? "تعذر حفظ التغيير" : "Could not save", description: apiErrorMessage(e) }),
  });

  const stats = useMemo(() => ({
    rooms: rooms.length,
    total: rooms.reduce((s, r) => s + (Number(r.total_count) || 0), 0),
    today: rooms.filter((r) => isToday(r.created_at)).length,
    hidden: rooms.filter((r) => !!r.is_hidden).length,
  }), [rooms]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rooms.filter((r) => {
      if (filter === "hidden" ? !r.is_hidden : filter !== "all" && (r.kind ?? "deceased") !== filter) return false;
      return !needle || `${r.name} ${r.created_by ?? ""} ${r.slug}`.toLowerCase().includes(needle);
    });
  }, [rooms, q, filter]);

  const tiles = [
    { label: isAr ? "عدد السبح" : "Misbahas", value: fmt(stats.rooms) },
    { label: isAr ? "إجمالي الذكر" : "Total dhikr", value: fmt(stats.total) },
    { label: isAr ? "اتعملت النهارده" : "Created today", value: fmt(stats.today) },
    { label: isAr ? "مخفية" : "Hidden", value: fmt(stats.hidden) },
  ];
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: isAr ? "الكل" : "All" },
    { key: "deceased", label: KIND.deceased[isAr ? "ar" : "en"] },
    { key: "sick", label: KIND.sick[isAr ? "ar" : "en"] },
    { key: "group", label: KIND.group[isAr ? "ar" : "en"] },
    { key: "hidden", label: isAr ? "المخفية" : "Hidden" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">{isAr ? "السبح المشتركة" : "Shared misbahas"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isAr ? "كل سبحة عملها زائر، عدّادها، وإخفاء أي اسم مسيء." : "Every misbaha visitors created, its count, and hiding an abusive name."}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2 rounded-xl font-bold">
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs font-bold text-muted-foreground">{t.label}</div>
              <div className="mt-1 font-mono text-2xl font-black tabular-nums text-primary">{isLoading ? "…" : t.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAr ? "ابحث بالاسم أو المنشئ أو الرابط" : "Search name, creator or link"} className="h-11 rounded-xl ps-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                className={`h-9 rounded-full px-3.5 text-xs font-black transition ${filter === f.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-primary hover:border-primary/40"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm font-bold text-destructive">{apiErrorMessage(error)}</div>
        ) : isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm font-bold text-muted-foreground">{isAr ? "مفيش سبح بالاختيار ده." : "No misbahas match."}</div>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => {
              const hidden = !!r.is_hidden;
              return (
                <li key={r.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 ${hidden ? "border-dashed border-border opacity-70" : "border-border"}`}>
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words text-base font-black text-foreground">{r.name}</span>
                      <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[11px] font-black text-primary">{KIND[(r.kind ?? "deceased") as MisbahaKind]?.[isAr ? "ar" : "en"]}</span>
                      {hidden && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-black text-muted-foreground">{isAr ? "مخفية" : "Hidden"}</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.created_by ? `${isAr ? "أنشأها" : "By"} ${r.created_by} · ` : ""}{day(r.created_at)} · <span dir="ltr">/misbaha/{r.slug}</span>
                    </div>
                  </div>
                  <div className="flex-1 text-start sm:flex-none sm:text-end">
                    <div className="font-mono text-lg font-black tabular-nums text-primary">{fmt(Number(r.total_count) || 0)}</div>
                    <div className="text-[11px] font-bold text-muted-foreground">{r.target_total ? `${isAr ? "من" : "of"} ${fmt(r.target_total)}` : isAr ? "ذكر" : "dhikr"}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl font-bold">
                      <a href={`/misbaha/${r.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> {isAr ? "افتح" : "Open"}</a>
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate(r)} className="h-9 gap-1.5 rounded-xl font-bold">
                        {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {hidden ? (isAr ? "أظهر" : "Show") : isAr ? "أخفِ" : "Hide"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
