import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, EyeOff, Pencil, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/notify";
import { askConfirm } from "@/components/common/confirm";
import { useLang } from "@/i18n/LangContext";
import { useCan } from "@/auth/useCan";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { misbahaAdminApi, type AdminMisbahaRoom, type MisbahaGender, type MisbahaKind } from "@/data/api/misbahaRoomsApi";

const KIND: Record<MisbahaKind, string> = { deceased: "لمتوفّى", sick: "لمريض", group: "جماعية" };
type Filter = "all" | MisbahaKind | "hidden" | "empty";
type Sort = "recent" | "count" | "created";

const fmt = (n: number) => n.toLocaleString("en-US");
const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const isToday = (iso?: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
type Row = AdminMisbahaRoom & { last_activity_at?: string | null };

/**
 * «السبح المشتركة»: every shared misbaha visitors created. The team can rename it, change its goal
 * or kind, reset its counter, hide it, or delete it for good (one by one or several at once).
 */
export default function AdminMisbaha() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const can = useCan();
  const canEdit = can("content.update");
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Row | null>(null);

  const { data: rooms = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-misbaha-rooms"],
    queryFn: misbahaAdminApi.list,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-misbaha-rooms"] });

  const toggle = useMutation({
    mutationFn: (r: Row) => misbahaAdminApi.setHidden(r.id, !r.is_hidden),
    onSuccess: (_d, r) => { refresh(); toast.success(r.is_hidden ? "السبحة رجعت تظهر" : "السبحة اتخفت من الموقع"); },
    onError: (e) => toast.error("ما اتحفظش", { description: apiErrorMessage(e) }),
  });

  const removeOne = async (r: Row) => {
    if (!(await askConfirm(`تحذف سبحة «${r.name}» نهائيًا؟ العداد (${fmt(Number(r.total_count) || 0)}) والرابط هيروحوا ومش هيرجعوا. لو عايز توقفها بس استخدم «أخفِ».`))) return;
    try {
      await misbahaAdminApi.remove(r.id);
      toast.success("اتحذفت السبحة");
      setPicked((s) => { const n = new Set(s); n.delete(r.id); return n; });
      refresh();
    } catch (e) {
      toast.error("ما اتحذفتش", { description: apiErrorMessage(e) });
    }
  };

  const removePicked = async () => {
    const ids = [...picked];
    if (!ids.length) return;
    if (!(await askConfirm(`تحذف ${ids.length} سبحة نهائيًا؟ مش هيرجعوا.`))) return;
    try {
      const n = await misbahaAdminApi.removeMany(ids);
      toast.success(`اتحذف ${n} سبحة`);
      setPicked(new Set());
      refresh();
    } catch (e) {
      toast.error("ما اتحذفوش", { description: apiErrorMessage(e) });
    }
  };

  const stats = useMemo(() => ({
    rooms: rooms.length,
    total: rooms.reduce((s, r) => s + (Number(r.total_count) || 0), 0),
    today: rooms.filter((r) => isToday(r.created_at)).length,
    hidden: rooms.filter((r) => !!r.is_hidden).length,
  }), [rooms]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = (rooms as Row[]).filter((r) => {
      if (filter === "hidden") { if (!r.is_hidden) return false; }
      else if (filter === "empty") { if ((Number(r.total_count) || 0) > 0) return false; }
      else if (filter !== "all" && (r.kind ?? "deceased") !== filter) return false;
      return !needle || `${r.name} ${r.created_by ?? ""} ${r.slug}`.toLowerCase().includes(needle);
    });
    const t = (s?: string | null) => (s ? new Date(s).getTime() : 0);
    return rows.sort((a, b) =>
      sort === "count" ? (Number(b.total_count) || 0) - (Number(a.total_count) || 0)
      : sort === "created" ? t(b.created_at) - t(a.created_at)
      : t(b.last_activity_at ?? b.updated_at ?? b.created_at) - t(a.last_activity_at ?? a.updated_at ?? a.created_at));
  }, [rooms, q, filter, sort]);

  const allPicked = list.length > 0 && list.every((r) => picked.has(r.id));
  const tiles = [
    { label: "عدد السبح", value: fmt(stats.rooms) },
    { label: "إجمالي الذكر", value: fmt(stats.total) },
    { label: "اتعملت النهارده", value: fmt(stats.today) },
    { label: "مخفية", value: fmt(stats.hidden) },
  ];
  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "الكل" }, { key: "deceased", label: KIND.deceased }, { key: "sick", label: KIND.sick },
    { key: "group", label: KIND.group }, { key: "hidden", label: "المخفية" }, { key: "empty", label: "من غير ذكر" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-primary">السبح المشتركة</h1>
            <p className="mt-1 text-sm text-muted-foreground">كل سبحة عملها زائر: عدّل اسمها أو هدفها، صفّر عدادها، أخفِها، أو احذفها نهائيًا.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2 rounded-xl font-bold">
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> تحديث
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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو المنشئ أو الرابط" className="h-11 rounded-xl ps-9" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="الترتيب"
            className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-bold text-primary">
            <option value="recent">آخر نشاط</option>
            <option value="count">الأكتر ذكرًا</option>
            <option value="created">الأحدث إنشاءً</option>
          </select>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                className={`h-9 rounded-full px-3.5 text-xs font-black transition ${filter === f.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-primary hover:border-primary/40"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {canEdit && list.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm">
            <label className="flex items-center gap-2 font-bold text-primary">
              <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(list.map((r) => r.id)))} className="h-4 w-4 accent-primary" />
              اختار الكل ({list.length})
            </label>
            {picked.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => void removePicked()} className="gap-1.5 rounded-xl font-bold">
                <Trash2 className="h-3.5 w-3.5" /> احذف المختار ({picked.size})
              </Button>
            )}
          </div>
        )}

        {isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm font-bold text-destructive">{apiErrorMessage(error)}</div>
        ) : isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm font-bold text-muted-foreground">مفيش سبح بالاختيار ده.</div>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => {
              const hidden = !!r.is_hidden;
              const count = Number(r.total_count) || 0;
              const pct = r.target_total ? Math.min(100, Math.round((count / r.target_total) * 100)) : null;
              return (
                <li key={r.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 ${hidden ? "border-dashed border-border opacity-70" : "border-border"}`}>
                  {canEdit && (
                    <input type="checkbox" checked={picked.has(r.id)} aria-label={`اختيار ${r.name}`} className="h-4 w-4 accent-primary"
                      onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} />
                  )}
                  <div className="min-w-0 flex-1 basis-[60%] sm:basis-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words text-base font-black text-foreground">{r.name}</span>
                      <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[11px] font-black text-primary">{KIND[(r.kind ?? "deceased") as MisbahaKind]}</span>
                      {hidden && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-black text-muted-foreground">مخفية</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.created_by ? `أنشأها ${r.created_by} · ` : ""}{day(r.created_at)}
                      {r.last_activity_at ? ` · آخر ذكر ${day(r.last_activity_at)}` : ""} · <span dir="ltr">/misbaha/{r.slug}</span>
                    </div>
                  </div>
                  <div className="text-start sm:text-end">
                    <div className="font-mono text-lg font-black tabular-nums text-primary">{fmt(count)}</div>
                    <div className="text-[11px] font-bold text-muted-foreground">{r.target_total ? `من ${fmt(r.target_total)} (${pct}%)` : "ذكر"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl font-bold">
                      <a href={`/misbaha/${r.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> افتح</a>
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditing(r)} className="h-9 gap-1.5 rounded-xl font-bold">
                          <Pencil className="h-3.5 w-3.5" /> عدّل
                        </Button>
                        <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate(r)} className="h-9 gap-1.5 rounded-xl font-bold">
                          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {hidden ? "أظهر" : "أخفِ"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void removeOne(r)} className="h-9 gap-1.5 rounded-xl border-destructive/40 font-bold text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" /> احذف
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!isAr && <p className="text-xs text-muted-foreground">This page is in Arabic.</p>}
      </div>
      {editing && <EditDialog room={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </AdminLayout>
  );
}

function EditDialog({ room, onClose, onSaved }: { room: Row; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(room.name);
  const [by, setBy] = useState(room.created_by ?? "");
  const [target, setTarget] = useState(room.target_total ? String(room.target_total) : "");
  const [kind, setKind] = useState<MisbahaKind>((room.kind ?? "deceased") as MisbahaKind);
  const [gender, setGender] = useState<MisbahaGender | "">((room.gender ?? "") as MisbahaGender | "");
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return toast.error("الاسم قصير قوي.");
    const t = target.trim() ? Number(target) : null;
    if (t !== null && (!Number.isInteger(t) || t < 1)) return toast.error("الهدف لازم يكون رقم صحيح أكبر من صفر.");
    if (reset && !(await askConfirm(`تصفّر عداد «${room.name}» (${fmt(Number(room.total_count) || 0)})؟ مش هيرجع.`))) return;
    setBusy(true);
    try {
      await misbahaAdminApi.update(room.id, {
        name: name.trim(), created_by: by.trim() || null, target_total: t, kind, gender: gender || null, reset_count: reset || undefined,
      });
      toast.success("اتحفظت التعديلات");
      onSaved();
    } catch (e) {
      toast.error("ما اتحفظش", { description: apiErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`تعديل ${room.name}`} dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-primary">تعديل السبحة</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs font-bold text-muted-foreground">الاسم
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-10" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-muted-foreground">أنشأها
            <Input value={by} onChange={(e) => setBy(e.target.value)} maxLength={80} className="h-10" placeholder="اختياري" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">النوع
              <select value={kind} onChange={(e) => setKind(e.target.value as MisbahaKind)} className="h-10 rounded-md border border-border bg-background px-2 text-sm">
                <option value="deceased">لمتوفّى</option><option value="sick">لمريض</option><option value="group">جماعية</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold text-muted-foreground">النوع (ذكر / أنثى)
              <select value={gender} onChange={(e) => setGender(e.target.value as MisbahaGender | "")} className="h-10 rounded-md border border-border bg-background px-2 text-sm">
                <option value="">مش محدد</option><option value="m">ذكر</option><option value="f">أنثى</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-xs font-bold text-muted-foreground">الهدف (عدد الذكر)
            <Input value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" className="h-10" placeholder="من غير هدف" />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 text-xs font-bold text-destructive">
            <input type="checkbox" checked={reset} onChange={(e) => setReset(e.target.checked)} className="h-4 w-4 accent-destructive" />
            صفّر العداد (حاليًا {fmt(Number(room.total_count) || 0)})
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => void save()} disabled={busy}>{busy ? "…" : "حفظ"}</Button>
        </div>
      </div>
    </div>
  );
}
