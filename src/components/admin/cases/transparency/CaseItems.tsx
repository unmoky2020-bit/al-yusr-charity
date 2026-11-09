import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Pencil, Plus, Receipt, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { askConfirm } from "@/components/common/confirm";
import { Field } from "@/components/admin/programs/FormKit";
import { EvidencePhotos } from "@/components/impact/EvidencePhotos";
import { PhotoStrip } from "@/components/impact/PhotoViewer";
import { caseFileApi, CASE_ITEM_STATUSES, itemSpent, type CaseItem, type CaseItemInput, type CaseItemStatus } from "@/data/api/impactApi";
import { formatDay, ITEM_STATUS, todayISO, egp } from "@/lib/impactLabels";
import { notifyError, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Draft = {
  title: string;
  quantity: string;
  estimated_cost: string;
  actual_cost: string;
  status: CaseItemStatus;
  note: string;
  purchased_on: string;
  delivered_on: string;
  receipt: string[];
  photo: string[];
};

const draftOf = (i?: CaseItem, status?: CaseItemStatus): Draft => ({
  title: i?.title ?? "",
  quantity: String(i?.quantity ?? 1),
  estimated_cost: i ? String(i.estimated_cost) : "",
  actual_cost: i?.actual_cost === null || i?.actual_cost === undefined ? "" : String(i.actual_cost),
  status: status ?? i?.status ?? "planned",
  note: i?.note ?? "",
  purchased_on: i?.purchased_on ?? "",
  delivered_on: i?.delivered_on ?? "",
  receipt: i?.receipt_url ? [i.receipt_url] : [],
  photo: i?.photo_url ? [i.photo_url] : [],
});

const STATUS_ICON: Record<CaseItemStatus, typeof Truck> = { planned: Receipt, purchased: ShoppingCart, delivered: Truck, cancelled: Trash2 };

/**
 * «بنود الصرف»: what the case needs, line by line — expected cost, then what it really cost with the
 * receipt, then the handover photo. Every change is logged on the server against the case.
 */
export function CaseItems({ caseId, items, onChanged }: { caseId: number; items: CaseItem[]; onChanged: () => void }) {
  const [open, setOpen] = useState<{ item?: CaseItem; status?: CaseItemStatus } | null>(null);
  const [moving, setMoving] = useState(false);

  const move = async (index: number, dir: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setMoving(true);
    try {
      await caseFileApi.reorder(caseId, ids);
      onChanged();
    } catch (err) {
      notifyError(err, "الترتيب ما اتحفظش");
    } finally {
      setMoving(false);
    }
  };

  const remove = async (item: CaseItem) => {
    const ok = await askConfirm(`نشيل بند «${item.title}»؟\nبيتشال من ملف الحالة، وبيفضل مكتوب في سجل التعديلات.`);
    if (!ok) return;
    try {
      await caseFileApi.removeItem(item.id);
      toast.success("اتشال البند");
      onChanged();
    } catch (err) {
      notifyError(err, "البند ما اتشالش");
    }
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center">
          <p className="text-sm font-bold text-foreground">لسه مفيش بنود</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">اكتب اللي الحالة محتاجاه بند بند (مثلاً: ثلاجة، غسالة، إيجار 3 شهور) بالتكلفة المتوقعة. المتبرع بيشوف كل بند اتشترى وإيصاله.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((i, idx) => {
            const st = ITEM_STATUS[i.status];
            const spent = itemSpent(i);
            const photos = [i.receipt_url, i.photo_url].filter(Boolean) as string[];
            return (
              <li key={i.id} className={cn("rounded-2xl border bg-background p-3", i.status === "cancelled" ? "border-border/50 opacity-70" : "border-border")}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-black text-muted-foreground">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-sm font-extrabold", i.status === "cancelled" && "line-through")}>{i.title}</span>
                      {i.quantity > 1 && <span className="rounded-md bg-muted px-1.5 text-[10.5px] font-bold text-muted-foreground">×{i.quantity}</span>}
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", st.tone)}>{st.ar}</span>
                      {(i.status === "purchased" || i.status === "delivered") && !i.receipt_url && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">مفيش إيصال</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      متوقع <b className="text-foreground">{egp(i.estimated_cost, "ar")}</b>
                      {spent > 0 && <> · اتصرف <b className="text-emerald-700">{egp(spent, "ar")}</b></>}
                      {i.purchased_on && <> · اتشترى {formatDay(i.purchased_on, "ar", false)}</>}
                      {i.delivered_on && <> · اتسلّم {formatDay(i.delivered_on, "ar", false)}</>}
                    </p>
                    {i.note && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{i.note}</p>}
                    {photos.length > 0 && <PhotoStrip className="mt-2" photos={photos} lang="ar" size="sm" caption={i.title} />}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" disabled={moving || idx === 0} onClick={() => void move(idx, -1)} className="grid h-7 w-7 place-items-center rounded-md bg-muted disabled:opacity-30" aria-label="لفوق"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" disabled={moving || idx === items.length - 1} onClick={() => void move(idx, 1)} className="grid h-7 w-7 place-items-center rounded-md bg-muted disabled:opacity-30" aria-label="لتحت"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
                  {i.status === "planned" && (
                    <Button type="button" size="sm" onClick={() => setOpen({ item: i, status: "purchased" })} className="h-8 gap-1 rounded-lg bg-sky-600 text-[11px] font-bold text-white hover:bg-sky-700">
                      <ShoppingCart className="h-3.5 w-3.5" />اتشترى
                    </Button>
                  )}
                  {(i.status === "planned" || i.status === "purchased") && (
                    <Button type="button" size="sm" onClick={() => setOpen({ item: i, status: "delivered" })} className="h-8 gap-1 rounded-lg bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />اتسلّم
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => setOpen({ item: i })} className="h-8 gap-1 rounded-lg text-[11px] font-bold">
                    <Pencil className="h-3.5 w-3.5" />تعديل
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void remove(i)} className="ms-auto h-8 gap-1 rounded-lg text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />شيل
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Button type="button" variant="outline" onClick={() => setOpen({})} className="h-10 w-full gap-1.5 rounded-xl border-dashed text-xs font-bold">
        <Plus className="h-4 w-4" />أضف بند
      </Button>
      {open && <CaseItemDialog caseId={caseId} item={open.item} status={open.status} onClose={() => setOpen(null)} onSaved={onChanged} />}
    </div>
  );
}

function CaseItemDialog({ caseId, item, status, onClose, onSaved }: {
  caseId: number;
  item?: CaseItem;
  status?: CaseItemStatus;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(() => {
    const base = draftOf(item, status);
    if (base.status !== "planned" && base.status !== "cancelled" && !base.purchased_on) base.purchased_on = todayISO();
    if (base.status === "delivered" && !base.delivered_on) base.delivered_on = todayISO();
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [busyReceipt, setBusyReceipt] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const uploading = busyReceipt || busyPhoto;
  const [error, setError] = useState("");
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const bought = d.status === "purchased" || d.status === "delivered";

  const save = async () => {
    const est = Number(d.estimated_cost);
    if (!d.title.trim()) return setError("اكتب اسم البند.");
    if (d.estimated_cost === "" || !Number.isFinite(est) || est < 0) return setError("اكتب التكلفة المتوقعة (رقم).");
    const actual = d.actual_cost === "" ? null : Number(d.actual_cost);
    if (actual !== null && (!Number.isFinite(actual) || actual < 0)) return setError("التكلفة الفعلية لازم تكون رقم.");
    setError("");
    const input: CaseItemInput = {
      title: d.title.trim(),
      quantity: Math.max(1, Math.round(Number(d.quantity) || 1)),
      estimated_cost: est,
      actual_cost: bought ? actual : null,
      status: d.status,
      note: d.note.trim() || null,
      purchased_on: bought ? d.purchased_on || null : null,
      delivered_on: d.status === "delivered" ? d.delivered_on || null : null,
      receipt_url: d.receipt[0] ?? null,
      photo_url: d.photo[0] ?? null,
    };
    setSaving(true);
    try {
      if (item) await caseFileApi.updateItem(item.id, input);
      else await caseFileApi.addItem(caseId, input);
      toast.success(item ? "اتحفظ البند" : "اتضاف البند");
      onSaved();
      onClose();
    } catch (err) {
      notifyError(err, "البند ما اتحفظش");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92dvh] overflow-y-auto rounded-3xl max-sm:w-[calc(100vw-1.5rem)] max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-base font-black">{item ? `تعديل «${item.title}»` : "بند جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="اسم البند">
            <Input value={d.title} maxLength={200} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: ثلاجة 12 قدم" className="h-10 rounded-xl" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الكمية">
              <Input type="number" inputMode="numeric" min={1} value={d.quantity} onChange={(e) => set({ quantity: e.target.value })} className="h-10 rounded-xl" />
            </Field>
            <Field label="التكلفة المتوقعة (ج.م)">
              <Input type="number" inputMode="decimal" min={0} value={d.estimated_cost} onChange={(e) => set({ estimated_cost: e.target.value })} className="h-10 rounded-xl" />
            </Field>
          </div>
          <Field label="الحالة">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {CASE_ITEM_STATUSES.map((s) => {
                const Icon = STATUS_ICON[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ status: s, ...(s !== "planned" && s !== "cancelled" && !d.purchased_on ? { purchased_on: todayISO() } : {}), ...(s === "delivered" && !d.delivered_on ? { delivered_on: todayISO() } : {}) })}
                    className={cn("flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11.5px] font-bold transition", d.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}
                    aria-pressed={d.status === s}
                  >
                    <Icon className="h-3.5 w-3.5" />{ITEM_STATUS[s].ar}
                  </button>
                );
              })}
            </div>
          </Field>
          {bought && (
            <div className="space-y-3 rounded-2xl bg-sky-50/70 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="اتدفع فعلاً (ج.م)" hint="لو فاضي بيتحسب المتوقع.">
                  <Input type="number" inputMode="decimal" min={0} value={d.actual_cost} onChange={(e) => set({ actual_cost: e.target.value })} className="h-10 rounded-xl bg-background" />
                </Field>
                <Field label="تاريخ الشراء">
                  <Input type="date" value={d.purchased_on} max={todayISO()} onChange={(e) => set({ purchased_on: e.target.value })} className="h-10 rounded-xl bg-background" />
                </Field>
              </div>
              <Field label="صورة الإيصال / الفاتورة" hint="لو فيها اسم أو تليفون حد من أصحاب الحالة، اضغط عليه في الصورة علشان يتغطى.">
                <EvidencePhotos value={d.receipt} onChange={(v) => set({ receipt: v })} max={1} kind="document" lang="ar" onBusyChange={setBusyReceipt} addLabel="الإيصال" />
              </Field>
            </div>
          )}
          {d.status === "delivered" && (
            <div className="space-y-3 rounded-2xl bg-emerald-50/70 p-3">
              <Field label="تاريخ التسليم">
                <Input type="date" value={d.delivered_on} max={todayISO()} onChange={(e) => set({ delivered_on: e.target.value })} className="h-10 rounded-xl bg-background" />
              </Field>
              <Field label="صورة التسليم">
                <EvidencePhotos value={d.photo} onChange={(v) => set({ photo: v })} max={1} lang="ar" onBusyChange={setBusyPhoto} addLabel="صورة" />
              </Field>
            </div>
          )}
          <Field label="ملاحظة (اختياري)">
            <Textarea rows={2} maxLength={500} value={d.note} onChange={(e) => set({ note: e.target.value })} placeholder="مثلاً: اتشترت من معرض … بخصم" className="rounded-xl" />
          </Field>
          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">إلغاء</Button>
          <Button type="button" onClick={() => void save()} disabled={saving || uploading} className="rounded-xl bg-orange-grad font-bold text-accent-foreground">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{uploading ? "استنى الصورة تترفع…" : "حفظ البند"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
