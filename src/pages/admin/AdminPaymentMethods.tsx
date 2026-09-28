import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Wallet, Save, RotateCcw, Settings2, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import { listAllPaymentMethods, updatePaymentMethod, type PaymentMethodRow } from "@/data/paymentMethodsApi";
import { logActivity } from "@/lib/activityLog";

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<PaymentMethodRow[]>([]);
  const [draft, setDraft] = useState<Record<string, Partial<PaymentMethodRow>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true); setLoadError(null);
    try { setRows(await listAllPaymentMethods()); setDraft({}); }
    catch (e: any) {
      setLoadError(e?.message || "Failed to load");
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const merged = (r: PaymentMethodRow): PaymentMethodRow => ({ ...r, ...(draft[r.id] || {}) }) as PaymentMethodRow;
  const setField = (id: string, field: keyof PaymentMethodRow, value: any) => {
    setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));
  };

  const toggleActive = async (r: PaymentMethodRow, value: boolean) => {
    setBusy(r.id);
    try {
      await updatePaymentMethod(r.id, { active: value });
      setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, active: value } : x));
      void logActivity({ action: "payment_method.toggle", entityType: "payment_method", entityId: r.id,
        summary: `${r.key} → ${value ? "active" : "inactive"}`, details: { active: value } });
      toast({ title: isAr ? " تم التحديث" : " Updated" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const save = async (r: PaymentMethodRow) => {
    const patch = draft[r.id]; if (!patch) return;
    setBusy(r.id);
    try {
      await updatePaymentMethod(r.id, patch);
      setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, ...patch } : x));
      setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; });
      void logActivity({ action: "payment_method.update", entityType: "payment_method", entityId: r.id,
        summary: r.key, details: patch });
      toast({ title: isAr ? " تم الحفظ" : " Saved" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <AdminLayout title={{ ar: "طرق الدفع", en: "Payment methods" }}>
      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            {isAr
              ? "فعّل أو عطّل أي طريقة دفع، عدّل رقم الحساب أو رقم Vodafone Cash، وأضِف تعليمات. الطرق المعطّلة لن تظهر في صفحة التبرع."
              : "Toggle any payment method, edit the displayed account number or Vodafone Cash phone, and add instructions. Inactive methods are hidden from the donate page."}
          </div>
        </Card>

        {loading && (
          <div className="grid place-items-center p-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && loadError && (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> {isAr ? "تعذر تحميل طرق الدفع" : "Failed to load payment methods"}</div>
            <div className="mt-1 text-xs opacity-80">{loadError}</div>
            <Button size="sm" variant="outline" className="mt-3" onClick={reload}>{isAr ? "إعادة المحاولة" : "Retry"}</Button>
          </Card>
        )}

        {!loading && !loadError && rows.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد طرق دفع بعد." : "No payment methods yet."}
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {(Array.isArray(rows) ? rows : []).map((row) => {
            const r = merged(row);
            const dirty = !!draft[row.id];
            return (
              <Card key={row.id} className={`p-4 ${r.active ? "" : "opacity-80"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-primary">{isAr ? r.label_ar : r.label_en}</div>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-mono">{r.key}</span>
                      <span className="mx-1.5">·</span>
                      <span>{r.kind === "gateway" ? (isAr ? "بوابة دفع" : "Gateway") : (isAr ? "تحويل يدوي" : "Manual")}</span>
                      {r.provider && <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px]">{r.provider}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 px-2">
                      <Link to={`/admin/payment-methods/${row.id}`}>
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="ms-1 text-[11px]">{isAr ? "تفاصيل" : "Details"}</span>
                      </Link>
                    </Button>
                    <Switch checked={r.active} disabled={busy === row.id}
                      onCheckedChange={(v) => toggleActive(row, v)} />
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={r.label_ar || ""} placeholder={isAr ? "اسم بالعربي" : "Arabic label"}
                      onChange={(e) => setField(row.id, "label_ar", e.target.value)} />
                    <Input value={r.label_en || ""} placeholder={isAr ? "اسم بالإنجليزي" : "English label"} dir="ltr"
                      onChange={(e) => setField(row.id, "label_en", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="col-span-1" value={r.account_label_ar || ""} placeholder={isAr ? "وسم الحقل (ع)" : "Field label (AR)"}
                      onChange={(e) => setField(row.id, "account_label_ar", e.target.value)} />
                    <Input className="col-span-2" dir="ltr" value={r.account_value || ""} placeholder="Account / phone number"
                      onChange={(e) => setField(row.id, "account_value", e.target.value)} />
                  </div>
                  <textarea className="min-h-[64px] rounded-md border bg-background p-2 text-sm" dir="rtl"
                    placeholder={isAr ? "تعليمات للمتبرع (عربي)" : "Donor instructions (AR)"}
                    value={r.instructions_ar || ""}
                    onChange={(e) => setField(row.id, "instructions_ar", e.target.value)} />
                  <textarea className="min-h-[64px] rounded-md border bg-background p-2 text-sm" dir="ltr"
                    placeholder="Donor instructions (EN)"
                    value={r.instructions_en || ""}
                    onChange={(e) => setField(row.id, "instructions_en", e.target.value)} />
                </div>

                {dirty && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDraft((d) => { const n = { ...d }; delete n[row.id]; return n; })}>
                      <RotateCcw className="h-3.5 w-3.5" /> {isAr ? "تراجع" : "Reset"}
                    </Button>
                    <Button size="sm" disabled={busy === row.id} onClick={() => save(row)}>
                      <Save className="h-3.5 w-3.5" /> {isAr ? "حفظ" : "Save"}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminPaymentMethods = () => (
  <RequireAuth roles={["admin"]}><Inner /></RequireAuth>
);
export default AdminPaymentMethods;