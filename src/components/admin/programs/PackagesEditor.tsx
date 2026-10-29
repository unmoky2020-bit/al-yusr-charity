/**
 * Donation packages (الأسهم / الباقات) of a program or project.
 * - list + add: EXISTING endpoints (GET/POST /{kind}/{id}/donation-packages)
 * - inline edit, delete, reorder: PROPOSED endpoints; on 404/405 the row shows
 *   "يحتاج تفعيل من الباك إند" and nothing is reported as saved.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, RefreshCw, Save, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  apiErrorMessageAr,
  donationPackagesAdminApi,
  isMissingEndpoint,
  NEEDS_BACKEND_AR,
  type DonationPackageRow,
  type PackageOwnerKind,
} from "@/data/api/programsAdminApi";
import { NeedsBackendBadge } from "./FormKit";

interface Draft {
  name_ar: string;
  name_en: string;
  amount: string;
  is_active: boolean;
}

const toDraft = (p: DonationPackageRow): Draft => ({
  name_ar: p.name_ar || "",
  name_en: p.name_en || "",
  amount: p.amount === null || p.amount === undefined ? "" : String(Number(p.amount)),
  is_active: p.is_active !== false,
});

const sameDraft = (a: Draft, b: Draft) =>
  a.name_ar === b.name_ar && a.name_en === b.name_en && a.amount === b.amount && a.is_active === b.is_active;

export function PackagesEditor({
  kind,
  ownerId,
  onChanged,
}: {
  kind: PackageOwnerKind;
  ownerId: number | string | null;
  onChanged?: (rows: DonationPackageRow[]) => void;
}) {
  const [rows, setRows] = useState<DonationPackageRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [newPkg, setNewPkg] = useState<Draft>({ name_ar: "", name_en: "", amount: "", is_active: true });

  // Keep the latest callback in a ref so an inline parent callback does not re-trigger loading.
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const applyRows = useCallback((list: DonationPackageRow[]) => {
    const sorted = [...list].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || a.id - b.id);
    setRows(sorted);
    setDrafts(Object.fromEntries(sorted.map((p) => [p.id, toDraft(p)])));
    onChangedRef.current?.(sorted);
  }, []);

  const load = useCallback(async () => {
    if (ownerId === null || ownerId === undefined || ownerId === "") return;
    setLoading(true);
    setLoadError("");
    try {
      applyRows(await donationPackagesAdminApi.list(kind, ownerId));
    } catch (err) {
      setLoadError(apiErrorMessageAr(err));
    } finally {
      setLoading(false);
    }
  }, [kind, ownerId, applyRows]);

  useEffect(() => { void load(); }, [load]);

  const failWrite = (action: string, err: unknown) => {
    if (isMissingEndpoint(err)) setPending((p) => ({ ...p, [action]: true }));
    toast({
      variant: "destructive",
      title: isMissingEndpoint(err) ? NEEDS_BACKEND_AR : "فشل حفظ الباقة",
      description: isMissingEndpoint(err)
        ? `${action}: هذا المسار غير موجود في الباك إند بعد، ولم يتم حفظ أي تغيير.`
        : apiErrorMessageAr(err),
    });
  };

  if (ownerId === null || ownerId === undefined || ownerId === "") {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        احفظ العنصر أولاً، ثم أضف باقات التبرع.
      </div>
    );
  }

  const saveRow = async (p: DonationPackageRow) => {
    const d = drafts[p.id];
    if (!d) return;
    const amount = Number(d.amount);
    if (!d.name_ar.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "اكتب اسم الباقة بالعربية ومبلغاً أكبر من صفر." });
      return;
    }
    setBusy(`save-${p.id}`);
    try {
      await donationPackagesAdminApi.update(kind, ownerId, p.id, {
        name_ar: d.name_ar.trim(),
        name_en: d.name_en.trim() || null,
        amount,
        is_active: d.is_active,
        sort_order: Number(p.sort_order ?? 0),
      });
      toast({ title: "تم حفظ الباقة" });
      await load();
    } catch (err) {
      failWrite("تعديل الباقة (PUT)", err);
    } finally {
      setBusy("");
    }
  };

  const deleteRow = async (p: DonationPackageRow) => {
    if (!window.confirm(`حذف الباقة «${p.name_ar}»؟`)) return;
    setBusy(`del-${p.id}`);
    try {
      await donationPackagesAdminApi.remove(kind, ownerId, p.id);
      toast({ title: "تم حذف الباقة" });
      await load();
    } catch (err) {
      failWrite("حذف الباقة (DELETE)", err);
    } finally {
      setBusy("");
    }
  };

  const moveRow = async (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    const order = next.map((p, i) => ({ id: p.id, sort_order: i + 1 }));
    setBusy("reorder");
    try {
      await donationPackagesAdminApi.reorder(kind, ownerId, order);
      toast({ title: "تم حفظ الترتيب" });
      await load();
    } catch (err) {
      failWrite("ترتيب الباقات (reorder)", err);
    } finally {
      setBusy("");
    }
  };

  const addRow = async () => {
    const amount = Number(newPkg.amount);
    if (!newPkg.name_ar.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "اكتب اسم الباقة بالعربية ومبلغاً أكبر من صفر." });
      return;
    }
    setBusy("add");
    try {
      const maxOrder = rows.reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0);
      await donationPackagesAdminApi.add(kind, ownerId, {
        name_ar: newPkg.name_ar.trim(),
        name_en: newPkg.name_en.trim() || null,
        amount,
        sort_order: maxOrder + 1,
        is_active: newPkg.is_active,
      });
      toast({ title: "تمت إضافة الباقة" });
      setNewPkg({ name_ar: "", name_en: "", amount: "", is_active: true });
      await load();
    } catch (err) {
      toast({ variant: "destructive", title: "فشل إضافة الباقة", description: apiErrorMessageAr(err) });
    } finally {
      setBusy("");
    }
  };

  const setDraft = (id: number, p: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...p } }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-foreground">
          <Tag className="h-4 w-4 text-secondary" /> الباقات الحالية ({rows.length})
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(pending).length > 0 && <NeedsBackendBadge text={`${NEEDS_BACKEND_AR}: ${Object.keys(pending).join("، ")}`} />}
          <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> تحديث
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">تعذر تحميل الباقات: {loadError}</div>
      )}

      {loading && rows.length === 0 ? (
        <div className="grid place-items-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 && !loadError ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لا توجد باقات بعد.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((p, i) => {
            const d = drafts[p.id] || toDraft(p);
            const dirty = !sameDraft(d, toDraft(p));
            return (
              <div key={p.id} className={`grid grid-cols-1 items-center gap-2 rounded-2xl border p-2.5 sm:grid-cols-[auto_1fr_1fr_8rem_auto_auto] ${dirty ? "border-primary/50 bg-primary/5" : "border-border/70 bg-muted/30"}`}>
                <div className="flex items-center gap-0.5">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0 || !!busy} onClick={() => void moveRow(i, i - 1)} aria-label="لأعلى">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === rows.length - 1 || !!busy} onClick={() => void moveRow(i, i + 1)} aria-label="لأسفل">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input dir="rtl" value={d.name_ar} placeholder="اسم الباقة بالعربية" className="h-9 rounded-xl text-xs" onChange={(e) => setDraft(p.id, { name_ar: e.target.value })} />
                <Input dir="ltr" value={d.name_en} placeholder="Package name (EN)" className="h-9 rounded-xl text-left text-xs" onChange={(e) => setDraft(p.id, { name_en: e.target.value })} />
                <Input dir="ltr" type="number" min={1} value={d.amount} placeholder="المبلغ" className="h-9 rounded-xl text-xs" onChange={(e) => setDraft(p.id, { amount: e.target.value })} />
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                  <Switch checked={d.is_active} onCheckedChange={(c) => setDraft(p.id, { is_active: c })} /> مفعّلة
                </label>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" className="h-8 gap-1 rounded-xl text-xs" disabled={!dirty || !!busy} onClick={() => void saveRow(p)}>
                    {busy === `save-${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" disabled={!!busy} onClick={() => void deleteRow(p)} aria-label="حذف">
                    {busy === `del-${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-black text-primary"><Plus className="h-3.5 w-3.5" /> إضافة باقة جديدة</p>
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_8rem_auto_auto]">
          <Input dir="rtl" value={newPkg.name_ar} placeholder="اسم الباقة بالعربية *" className="h-9 rounded-xl text-xs" onChange={(e) => setNewPkg({ ...newPkg, name_ar: e.target.value })} />
          <Input dir="ltr" value={newPkg.name_en} placeholder="Package name (EN)" className="h-9 rounded-xl text-left text-xs" onChange={(e) => setNewPkg({ ...newPkg, name_en: e.target.value })} />
          <Input dir="ltr" type="number" min={1} value={newPkg.amount} placeholder="المبلغ *" className="h-9 rounded-xl text-xs" onChange={(e) => setNewPkg({ ...newPkg, amount: e.target.value })} />
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Switch checked={newPkg.is_active} onCheckedChange={(c) => setNewPkg({ ...newPkg, is_active: c })} /> مفعّلة
          </label>
          <Button type="button" size="sm" className="h-9 gap-1 rounded-xl text-xs" disabled={!!busy} onClick={() => void addRow()}>
            {busy === "add" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} إضافة
          </Button>
        </div>
      </div>
    </div>
  );
}
