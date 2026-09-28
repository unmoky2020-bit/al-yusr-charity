import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, Loader2, Wallet, AlertTriangle, Eye, Copy } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { listAllPaymentMethods, updatePaymentMethod, type PaymentMethodRow } from "@/data/paymentMethodsApi";
import { logActivity } from "@/lib/activityLog";

/* ---------- Validation rules per method key/kind ---------- */

const RX = {
  egPhone: /^01[0-25]\d{8}$/,            // EG mobile (Vodafone/Etisalat/Orange/WE)
  iban:    /^EG\d{27}$/i,                // EGP IBAN: EG + 27 digits
  bankAcc: /^[0-9]{8,20}$/,
  url:     /^https?:\/\/[^\s]+\.[^\s]+/i,
  instapay: /^[a-z0-9._-]{2,}@[a-z0-9._-]+$/i,
};

type FieldErrors = Partial<Record<keyof PaymentMethodRow, string>>;

function validate(row: PaymentMethodRow, isAr: boolean): FieldErrors {
  const e: FieldErrors = {};
  const ar = (a: string, en: string) => (isAr ? a : en);

  if (!row.label_ar?.trim()) e.label_ar = ar("الاسم بالعربي مطلوب", "Arabic label required");
  if (!row.label_en?.trim()) e.label_en = ar("الاسم بالإنجليزي مطلوب", "English label required");

  // Account value rules — only enforce on manual methods (gateways don't display an account)
  if (row.kind === "manual") {
    const val = (row.account_value || "").trim();
    if (!val) {
      e.account_value = ar("قيمة الحساب مطلوبة لطرق الدفع اليدوية", "Account value is required for manual methods");
    } else if (row.key === "vodafone_cash" || row.provider === "vodafone") {
      if (!RX.egPhone.test(val)) e.account_value = ar("رقم Vodafone غير صحيح (مثال: 01097000137)", "Invalid Vodafone number (e.g. 01097000137)");
    } else if (row.key === "instapay") {
      if (!RX.instapay.test(val)) e.account_value = ar("InstaPay handle غير صحيح (مثال: name@bank)", "Invalid InstaPay handle (e.g. name@bank)");
    } else if (row.key.startsWith("bank") || ["cib","adib","bank_misr"].includes(row.key)) {
      if (!(RX.iban.test(val) || RX.bankAcc.test(val))) {
        e.account_value = ar("أدخل IBAN صحيح (EG + 27 رقم) أو رقم حساب من 8-20 رقم", "Enter a valid IBAN (EG + 27 digits) or 8-20 digit account number");
      }
    }
  }

  if (row.qr_image_url && !RX.url.test(row.qr_image_url)) {
    e.qr_image_url = ar("رابط QR غير صحيح — لازم يبدأ بـ http(s)://", "Invalid QR URL — must start with http(s)://");
  }

  return e;
}

/* ---------- Component ---------- */

const Inner = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const nav = useNavigate();

  const [row, setRow] = useState<PaymentMethodRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const dirtyRef = useRef<Partial<PaymentMethodRow>>({});
  const debounceRef = useRef<number | null>(null);
  const initialHydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await listAllPaymentMethods();
        setRow(all.find((r) => r.id === id) || null);
      } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
      finally { setLoading(false); initialHydrated.current = true; }
    })();
  }, [id]);

  const errors = useMemo<FieldErrors>(() => (row ? validate(row, isAr) : {}), [row, isAr]);
  const hasErrors = Object.keys(errors).length > 0;

  /* ---------- Auto-save (debounced 600ms) ---------- */
  const scheduleSave = () => {
    if (!row) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const patch = dirtyRef.current;
      if (!Object.keys(patch).length) return;
      // Re-validate against the latest row before saving — block save if errors exist on changed fields
      const blocking = Object.keys(patch).some((k) => (errors as any)[k]);
      if (blocking) {
        setSaveState("error");
        return;
      }
      setSaveState("saving");
      try {
        await updatePaymentMethod(row.id, patch);
        void logActivity({ action: "payment_method.update", entityType: "payment_method", entityId: row.id, summary: row.key, details: patch });
        dirtyRef.current = {};
        setSaveState("saved");
        setLastSavedAt(Date.now());
        window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1800);
      } catch (e: any) {
        setSaveState("error");
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }, 600);
  };

  const set = (k: keyof PaymentMethodRow, val: any) => {
    if (!row) return;
    setRow({ ...row, [k]: val });
    dirtyRef.current = { ...dirtyRef.current, [k]: val };
    scheduleSave();
  };

  // Toggle active saves immediately (skip debounce)
  const setActiveNow = async (val: boolean) => {
    if (!row) return;
    setRow({ ...row, active: val });
    setSaveState("saving");
    try {
      await updatePaymentMethod(row.id, { active: val });
      void logActivity({ action: "payment_method.toggle", entityType: "payment_method", entityId: row.id, summary: `${row.key} → ${val ? "active" : "inactive"}`, details: { active: val } });
      setSaveState("saved");
      setLastSavedAt(Date.now());
    } catch (e: any) {
      setSaveState("error");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return <AdminLayout title={{ ar: "طريقة دفع", en: "Payment method" }}><div className="grid place-items-center p-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div></AdminLayout>;
  if (!row) return <AdminLayout title={{ ar: "غير موجود", en: "Not found" }}><Card className="p-6 text-sm">{isAr ? "طريقة الدفع غير موجودة." : "Payment method not found."}</Card></AdminLayout>;

  const SaveBadge = () => {
    if (saveState === "saving") return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{isAr ? "جارٍ الحفظ…" : "Saving…"}</span>;
    if (saveState === "saved")  return <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" />{isAr ? "تم الحفظ" : "Saved"}</span>;
    if (saveState === "error")  return <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{isAr ? "خطأ في الحفظ" : "Save blocked"}</span>;
    if (lastSavedAt)            return <span className="text-xs text-muted-foreground">{isAr ? "آخر حفظ" : "Last saved"} {new Date(lastSavedAt).toLocaleTimeString()}</span>;
    return <span className="text-xs text-muted-foreground">{isAr ? "حفظ تلقائي مفعّل" : "Auto-save enabled"}</span>;
  };

  const Err = ({ k }: { k: keyof PaymentMethodRow }) => errors[k] ? (
    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-destructive"><AlertTriangle className="h-3 w-3" />{errors[k]}</p>
  ) : null;

  return (
    <AdminLayout title={{ ar: `طريقة دفع · ${row.label_ar}`, en: `Payment method · ${row.label_en}` }}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => nav("/admin/payment-methods")}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            <span className="ms-1">{isAr ? "رجوع" : "Back"}</span>
          </Button>
          <div className="flex items-center gap-3">
            <SaveBadge />
            <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
              <span className="text-xs font-bold text-primary">{isAr ? "نشط" : "Active"}</span>
              <Switch checked={row.active} onCheckedChange={setActiveNow} />
            </div>
          </div>
        </div>

        {hasErrors && (
          <Card className="border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            <div className="inline-flex items-center gap-1 font-bold"><AlertTriangle className="h-3.5 w-3.5" />{isAr ? "فيه حقول محتاجة تعديل قبل ما يتم الحفظ." : "Some fields need fixing before they will be saved."}</div>
          </Card>
        )}

        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          {/* ---------- Form column ---------- */}
          <div className="space-y-3">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary"><Wallet className="h-4 w-4" />{isAr ? "الأساسيات" : "Basics"}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">{isAr ? "المعرّف (key)" : "Key"}</Label>
                  <Input value={row.key} readOnly dir="ltr" className="font-mono" />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "النوع" : "Kind"}</Label>
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={row.kind} onChange={(e) => set("kind", e.target.value)}>
                    <option value="manual">{isAr ? "تحويل يدوي" : "Manual"}</option>
                    <option value="gateway">{isAr ? "بوابة دفع" : "Gateway"}</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "مزوّد الخدمة" : "Provider"}</Label>
                  <Input dir="ltr" value={row.provider || ""} onChange={(e) => set("provider", e.target.value)} placeholder="paymob, vodafone, bank…" />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "ترتيب الظهور" : "Sort order"}</Label>
                  <Input type="number" value={row.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Label (AR)"}</Label>
                  <Input value={row.label_ar || ""} onChange={(e) => set("label_ar", e.target.value)} className={errors.label_ar ? "border-destructive" : ""} />
                  <Err k="label_ar" />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Label (EN)"}</Label>
                  <Input dir="ltr" value={row.label_en || ""} onChange={(e) => set("label_en", e.target.value)} className={errors.label_en ? "border-destructive" : ""} />
                  <Err k="label_en" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 text-sm font-extrabold text-primary">{isAr ? "بيانات الحساب" : "Account details"}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">{isAr ? "وسم الحقل (عربي)" : "Field label (AR)"}</Label>
                  <Input value={row.account_label_ar || ""} onChange={(e) => set("account_label_ar", e.target.value)} placeholder={isAr ? "مثال: رقم Vodafone Cash" : ""} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "وسم الحقل (إنجليزي)" : "Field label (EN)"}</Label>
                  <Input dir="ltr" value={row.account_label_en || ""} onChange={(e) => set("account_label_en", e.target.value)} placeholder="e.g. Vodafone Cash number" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{isAr ? "قيمة الحساب / رقم الهاتف / IBAN" : "Account value / phone / IBAN"}</Label>
                  <Input dir="ltr" value={row.account_value || ""} onChange={(e) => set("account_value", e.target.value)} placeholder="01097000137 / EG..." className={`font-mono ${errors.account_value ? "border-destructive" : ""}`} />
                  <Err k="account_value" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">{isAr ? "رابط صورة QR (اختياري)" : "QR image URL (optional)"}</Label>
                  <Input dir="ltr" value={row.qr_image_url || ""} onChange={(e) => set("qr_image_url", e.target.value)} placeholder="https://…" className={errors.qr_image_url ? "border-destructive" : ""} />
                  <Err k="qr_image_url" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 text-sm font-extrabold text-primary">{isAr ? "تعليمات للمتبرع" : "Donor instructions"}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs">{isAr ? "تعليمات (عربي)" : "Instructions (AR)"}</Label>
                  <Textarea dir="rtl" rows={6} value={row.instructions_ar || ""} onChange={(e) => set("instructions_ar", e.target.value)} placeholder={isAr ? "اشرح للمتبرع خطوات التحويل…" : ""} />
                </div>
                <div>
                  <Label className="text-xs">{isAr ? "تعليمات (إنجليزي)" : "Instructions (EN)"}</Label>
                  <Textarea dir="ltr" rows={6} value={row.instructions_en || ""} onChange={(e) => set("instructions_en", e.target.value)} placeholder="Explain transfer steps…" />
                </div>
              </div>
            </Card>
          </div>

          {/* ---------- Live preview column ---------- */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary"><Eye className="h-3.5 w-3.5" />{isAr ? "معاينة فورية في صفحة التبرع" : "Live preview on /donate"}</div>
                {!row.active && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{isAr ? "معطّلة" : "INACTIVE"}</span>}
              </div>

              <div className="p-4">
                {/* Method tile (same shape as donate page) */}
                <div className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-xs font-bold transition ${row.active ? "border-secondary bg-secondary/15" : "border-dashed border-muted-foreground/30 bg-muted/30 opacity-70"}`}>
                  <Wallet className="h-6 w-6 text-primary" />
                  <span className="text-center">{isAr ? row.label_ar : row.label_en}</span>
                </div>

                {/* Instruction card */}
                {row.kind === "manual" ? (
                  <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 text-sm">
                    <p className="font-bold text-primary">{isAr ? `تعليمات ${row.label_ar}:` : `${row.label_en} instructions:`}</p>
                    {row.account_value && (
                      <p className="mt-2">
                        {isAr ? (row.account_label_ar || "حول على:") : (row.account_label_en || "Transfer to:")}{" "}
                        <span dir="ltr" className="font-extrabold">{row.account_value}</span>
                      </p>
                    )}
                    {row.account_value && (
                      <button onClick={() => { navigator.clipboard.writeText(row.account_value || ""); toast({ title: isAr ? "تم النسخ" : "Copied" }); }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-accent">
                        <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ" : "Copy"}
                      </button>
                    )}
                    {(isAr ? row.instructions_ar : row.instructions_en) && (
                      <p className="mt-3 whitespace-pre-line text-xs text-muted-foreground">
                        {isAr ? row.instructions_ar : row.instructions_en}
                      </p>
                    )}
                    {row.qr_image_url && RX.url.test(row.qr_image_url) && (
                      <img src={row.qr_image_url} alt="QR" className="mt-3 h-32 w-32 rounded-md border bg-white object-contain p-1" />
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm">
                    <p className="font-bold text-primary">{isAr ? `${row.label_ar} — دفع آمن` : `${row.label_en} — secure checkout`}</p>
                    <p className="mt-1 text-muted-foreground">{isAr ? "هتتحول لصفحة الدفع الآمنة بعد التأكيد." : "You'll be redirected to the secure checkout after confirmation."}</p>
                  </div>
                )}

                {!row.active && (
                  <p className="mt-3 text-[11px] text-muted-foreground">{isAr ? "هذه الطريقة معطّلة ولن تظهر للمتبرعين." : "This method is disabled and won't show to donors."}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminPaymentMethodDetail = () => (
  <RequireAuth roles={["admin"]}><Inner /></RequireAuth>
);
export default AdminPaymentMethodDetail;