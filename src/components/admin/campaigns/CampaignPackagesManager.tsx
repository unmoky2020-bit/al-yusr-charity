import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Tag, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { donationCampaignsAdminApi, type CampaignPackage } from "@/data/api/donationCampaignsAdminApi";
import { describeWriteError, BACKEND_PENDING_AR } from "@/data/api/backendPending";
import { rowKey, toDraft, toInput, validDraft, type Draft } from "./packageHelpers";
import type { L } from "@/data/campaignPages/types";

/**
 * Donation packages ("أسهم التبرع") of one campaign: add, inline edit (name_ar / name_en / amount / key / is_active),
 * delete and reorder.
 *
 * - Live mode (`campaignId` set): every action calls the backend right away and the list only changes after a 2xx.
 *   Edit / delete / reorder use PROPOSED routes; a 404 shows "يحتاج تفعيل من الباك إند" and nothing changes.
 * - Draft mode (`campaignId` null, i.e. a campaign that is not created yet): the list is edited locally and the parent
 *   POSTs every package after the campaign is created (see `createPackagesForCampaign`).
 */

export type { PackagePriceKey } from "./packageHelpers";
import type { PackagePriceKey } from "./packageHelpers";

type Props = {
  campaignId: number | string | null;
  packages: CampaignPackage[];
  onChange: (next: CampaignPackage[]) => void;
  isAr: boolean;
  /** Landing-page price ids of this campaign (suggested values for `key`). */
  priceKeys?: PackagePriceKey[];
};

export function CampaignPackagesManager({ campaignId, packages, onChange, isAr, priceKeys = [] }: Props) {
  const live = campaignId !== null && campaignId !== undefined && String(campaignId) !== "new";
  const [edits, setEdits] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [newPkg, setNewPkg] = useState<Draft>({ name_ar: "", name_en: "", amount: "", key: "", is_active: true });
  const listId = useMemo(() => `pkg-keys-${String(campaignId ?? "new")}`, [campaignId]);

  const fail = (title: string, e: unknown, route: string) =>
    toast({ title, description: describeWriteError(e, route), variant: "destructive" });

  const warnIgnoredKey = (sentKey: string | null | undefined, returned: CampaignPackage | null | undefined) => {
    if (sentKey && returned && (returned.key ?? null) !== sentKey) {
      toast({
        title: isAr ? "تنبيه: الباك إند تجاهل «مفتاح الباقة» (key)" : "Backend ignored the package key",
        description: isAr ? `${BACKEND_PENDING_AR}: عمود key على donation_packages. باقي البيانات اتحفظت.` : "Add the `key` column on donation_packages.",
      });
    }
  };

  const draftOf = (p: CampaignPackage, idx: number) => edits[rowKey(p, idx)] ?? toDraft(p);
  const isDirty = (p: CampaignPackage, idx: number) => {
    const e = edits[rowKey(p, idx)];
    return !!e && JSON.stringify(e) !== JSON.stringify(toDraft(p));
  };

  const editRow = (p: CampaignPackage, idx: number, patch: Partial<Draft>) => {
    const next = { ...draftOf(p, idx), ...patch };
    if (!live) {
      // Draft mode: edit the list directly.
      onChange(packages.map((x, i) => (i === idx ? { ...x, ...toInput(next, x.sort_order ?? i + 1), amount: next.amount === "" ? "" : Number(next.amount) } : x)));
      return;
    }
    setEdits((prev) => ({ ...prev, [rowKey(p, idx)]: next }));
  };

  const discardRow = (p: CampaignPackage, idx: number) =>
    setEdits((prev) => {
      const n = { ...prev };
      delete n[rowKey(p, idx)];
      return n;
    });

  const saveRow = async (p: CampaignPackage, idx: number, override?: Partial<Draft>) => {
    const d = { ...draftOf(p, idx), ...override };
    if (!validDraft(d)) {
      toast({ title: isAr ? "اكتب اسم الباقة بالعربي ومبلغاً أكبر من صفر" : "Arabic name and a positive amount are required", variant: "destructive" });
      return;
    }
    if (!live || p.id === undefined || p.id === null) return;
    const k = rowKey(p, idx);
    setBusy(k);
    try {
      const body = toInput(d, p.sort_order ?? idx + 1);
      const res = await donationCampaignsAdminApi.updatePackage(campaignId!, p.id, body);
      const saved: CampaignPackage = { ...p, ...body, ...(res && typeof res === "object" ? res : {}) };
      onChange(packages.map((x, i) => (i === idx ? saved : x)));
      discardRow(p, idx);
      warnIgnoredKey(body.key, res);
      toast({ title: isAr ? "تم حفظ الباقة" : "Package saved" });
    } catch (e) {
      fail(isAr ? "لم يتم حفظ تعديل الباقة" : "Package not saved", e, "PUT /donation-campaigns/{id}/donation-packages/{packageId}");
    } finally {
      setBusy(null);
    }
  };

  const toggleRow = async (p: CampaignPackage, idx: number, value: boolean) => {
    if (!live) return editRow(p, idx, { is_active: value });
    // Toggle sends the SAVED values plus the new flag; unsaved text edits stay pending in the row.
    const k = rowKey(p, idx);
    setBusy(k);
    try {
      const body = { ...toInput(toDraft(p), p.sort_order ?? idx + 1), is_active: value };
      const res = await donationCampaignsAdminApi.updatePackage(campaignId!, p.id!, body);
      onChange(packages.map((x, i) => (i === idx ? { ...x, ...(res && typeof res === "object" ? res : {}), is_active: value } : x)));
      if (edits[k]) setEdits((prev) => ({ ...prev, [k]: { ...prev[k], is_active: value } }));
    } catch (e) {
      fail(isAr ? "لم يتم تغيير حالة الباقة" : "Package status not changed", e, "PUT /donation-campaigns/{id}/donation-packages/{packageId}");
    } finally {
      setBusy(null);
    }
  };

  const removeRow = async (p: CampaignPackage, idx: number) => {
    if (!live) {
      onChange(packages.filter((_, i) => i !== idx));
      return;
    }
    if (!window.confirm(isAr ? `حذف الباقة «${p.name_ar}» نهائياً من قاعدة البيانات؟` : `Delete package "${p.name_ar}"?`)) return;
    const k = rowKey(p, idx);
    setBusy(k);
    try {
      await donationCampaignsAdminApi.deletePackage(campaignId!, p.id!);
      onChange(packages.filter((_, i) => i !== idx));
      discardRow(p, idx);
      toast({ title: isAr ? "تم حذف الباقة" : "Package deleted" });
    } catch (e) {
      fail(isAr ? "لم يتم حذف الباقة" : "Package not deleted", e, "DELETE /donation-campaigns/{id}/donation-packages/{packageId}");
    } finally {
      setBusy(null);
    }
  };

  const moveRow = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= packages.length) return;
    const next = [...packages];
    const [m] = next.splice(idx, 1);
    next.splice(target, 0, m);
    const renumbered = next.map((p, i) => ({ ...p, sort_order: i + 1 }));
    if (!live) {
      onChange(renumbered);
      return;
    }
    setBusy("reorder");
    try {
      await donationCampaignsAdminApi.reorderPackages(
        campaignId!,
        renumbered.filter((p) => p.id !== undefined && p.id !== null).map((p) => ({ id: p.id!, sort_order: p.sort_order! })),
      );
      // Pending edits are keyed by id, so they follow their row.
      onChange(renumbered);
    } catch (e) {
      fail(isAr ? "لم يتم حفظ الترتيب" : "Order not saved", e, "POST /donation-campaigns/{id}/donation-packages/reorder");
    } finally {
      setBusy(null);
    }
  };

  const addPackage = async () => {
    if (!validDraft(newPkg)) {
      toast({ title: isAr ? "اكتب اسم الباقة بالعربي ومبلغاً أكبر من صفر" : "Arabic name and a positive amount are required", variant: "destructive" });
      return;
    }
    const body = toInput(newPkg, packages.length + 1);
    if (!live) {
      onChange([...packages, { ...body, id: `draft-${Date.now()}` }]);
      setNewPkg({ name_ar: "", name_en: "", amount: "", key: "", is_active: true });
      return;
    }
    setBusy("add");
    try {
      const res = await donationCampaignsAdminApi.createPackage(campaignId!, body);
      if (!res || res.id === undefined || res.id === null) throw new Error(isAr ? "الخادم لم يرجع رقم الباقة الجديدة" : "Server returned no package id");
      onChange([...packages, { ...body, ...res }]);
      setNewPkg({ name_ar: "", name_en: "", amount: "", key: "", is_active: true });
      warnIgnoredKey(body.key, res);
      toast({ title: isAr ? "تمت إضافة الباقة في قاعدة البيانات" : "Package added" });
    } catch (e) {
      fail(isAr ? "لم تتم إضافة الباقة" : "Package not added", e, "POST /donation-campaigns/{id}/donation-packages");
    } finally {
      setBusy(null);
    }
  };

  const keyLabel = (id: string) => {
    const k = priceKeys.find((x) => x.id === id);
    return k ? (isAr ? k.label.ar : k.label.en || k.label.ar) : "";
  };

  return (
    <div className="space-y-4">
      <datalist id={listId}>
        {priceKeys.map((k) => (
          <option key={k.id} value={k.id}>{isAr ? k.label.ar : k.label.en || k.label.ar}</option>
        ))}
      </datalist>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
        {live
          ? isAr
            ? "كل تعديل هنا يُحفظ مباشرة في قاعدة البيانات (زر الحفظ بجانب كل باقة). التعديل والحذف والترتيب ومفتاح الباقة (key) تحتاج endpoints جديدة؛ لو ظهرت رسالة «يحتاج تفعيل من الباك إند» فالتغيير لم يُحفظ."
            : "Each change is saved to the database right away. Edit / delete / reorder / key need new backend routes; \"needs backend\" means nothing was saved."
          : isAr
            ? "حملة جديدة: الباقات دي هتتضاف لقاعدة البيانات تلقائياً بعد إنشاء الحملة."
            : "New campaign: these packages are created right after the campaign is saved."}
        {priceKeys.length > 0 && (
          <span className="block mt-1">
            {isAr
              ? "«المفتاح» يربط الباقة بسعر بند في صفحة الهبوط (مثلاً carton = كرتونة الغذاء). اختره من القائمة المقترحة."
              : "The key links a package to a landing-page price item (e.g. carton). Pick from the suggestions."}
          </span>
        )}
      </div>

      {packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {isAr ? "لا توجد باقات تبرع مسجلة لهذه الحملة في قاعدة البيانات." : "This campaign has no donation packages in the database."}
        </div>
      ) : (
        <div className="space-y-2">
          {packages.map((p, idx) => {
            const k = rowKey(p, idx);
            const d = draftOf(p, idx);
            const dirty = live && isDirty(p, idx);
            const rowBusy = busy === k;
            return (
              <div
                key={k}
                className={`rounded-xl border bg-card p-3 shadow-xs ${dirty ? "border-amber-500/50" : "border-border/80"} ${d.is_active ? "" : "opacity-70"}`}
              >
                <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
                  <div className="flex items-center gap-1 sm:col-span-1">
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === 0 || !!busy} onClick={() => moveRow(idx, -1)} title={isAr ? "لأعلى" : "Up"}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={idx === packages.length - 1 || !!busy} onClick={() => moveRow(idx, 1)} title={isAr ? "لأسفل" : "Down"}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-3">
                    {isAr ? "الاسم (عربي) *" : "Name (AR) *"}
                    <Input dir="rtl" className="h-9 text-xs" value={d.name_ar} onChange={(e) => editRow(p, idx, { name_ar: e.target.value })} />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-3">
                    {isAr ? "الاسم (إنجليزي)" : "Name (EN)"}
                    <Input dir="ltr" className="h-9 text-xs" value={d.name_en} onChange={(e) => editRow(p, idx, { name_en: e.target.value })} />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
                    {isAr ? "المبلغ (ج.م) *" : "Amount (EGP) *"}
                    <Input dir="ltr" type="number" min={1} className="h-9 font-mono text-xs" value={d.amount} onChange={(e) => editRow(p, idx, { amount: e.target.value })} />
                  </label>
                  <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
                    {isAr ? "المفتاح (key)" : "Key"}
                    <Input dir="ltr" list={listId} className="h-9 font-mono text-xs" placeholder="carton" value={d.key} onChange={(e) => editRow(p, idx, { key: e.target.value.replace(/\s+/g, "_") })} />
                  </label>
                  <div className="flex items-center justify-end gap-1 sm:col-span-1">
                    <Switch checked={d.is_active} disabled={rowBusy} onCheckedChange={(v) => toggleRow(p, idx, v)} />
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive" disabled={rowBusy} onClick={() => removeRow(p, idx)} title={isAr ? "حذف" : "Delete"}>
                      {rowBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-secondary" />
                    {live ? `#${p.id}` : isAr ? "لم تُحفظ بعد" : "Not saved yet"}
                    {d.key && keyLabel(d.key) && <span>· {isAr ? "مرتبطة بـ" : "linked to"} «{keyLabel(d.key)}»</span>}
                    {!d.is_active && <span className="font-bold">· {isAr ? "مخفية" : "Hidden"}</span>}
                  </span>
                  {dirty && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400">{isAr ? "تعديل غير محفوظ" : "Unsaved"}</span>
                      <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => discardRow(p, idx)}>
                        <Undo2 className="h-3.5 w-3.5" />
                        {isAr ? "تراجع" : "Undo"}
                      </Button>
                      <Button type="button" size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700" disabled={rowBusy} onClick={() => saveRow(p, idx)}>
                        {rowBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isAr ? "حفظ الباقة" : "Save"}
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
        <p className="mb-2 text-xs font-bold text-foreground">{isAr ? "إضافة باقة جديدة" : "Add a package"}</p>
        <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
          <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-4">
            {isAr ? "الاسم (عربي) *" : "Name (AR) *"}
            <Input dir="rtl" className="h-9 text-xs" placeholder="مثال: كرتونة غذاء ١٤ كيلو" value={newPkg.name_ar} onChange={(e) => setNewPkg({ ...newPkg, name_ar: e.target.value })} />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-3">
            {isAr ? "الاسم (إنجليزي)" : "Name (EN)"}
            <Input dir="ltr" className="h-9 text-xs" value={newPkg.name_en} onChange={(e) => setNewPkg({ ...newPkg, name_en: e.target.value })} />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
            {isAr ? "المبلغ *" : "Amount *"}
            <Input dir="ltr" type="number" min={1} className="h-9 font-mono text-xs" value={newPkg.amount} onChange={(e) => setNewPkg({ ...newPkg, amount: e.target.value })} />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted-foreground sm:col-span-2">
            {isAr ? "المفتاح (key)" : "Key"}
            <Input dir="ltr" list={listId} className="h-9 font-mono text-xs" value={newPkg.key} onChange={(e) => setNewPkg({ ...newPkg, key: e.target.value.replace(/\s+/g, "_") })} />
          </label>
          <Button type="button" onClick={addPackage} disabled={busy === "add"} className="h-9 bg-secondary font-bold text-secondary-foreground sm:col-span-1">
            {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CampaignPackagesManager;
