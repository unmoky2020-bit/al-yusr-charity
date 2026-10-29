import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Loader2, Plus, Save, ShieldAlert, Trash2, Wallet } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChoiceSelect, Field, SectionCard } from "@/components/admin/programs/FormKit";
import { toast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { logActivity } from "@/lib/activityLog";
import {
  BANK_CODES,
  BANK_LABELS,
  MAX_DESTINATIONS,
  PAYMENT_TYPE_LABELS,
  cleanPaymentDetails,
  describePayoutChange,
  destinationsOf,
  hasLegacyDetails,
  payoutKeyOf,
  paymentMethodsApi,
  serverFieldErrors,
  validatePaymentDetails,
  type BankAccount,
  type BankCode,
  type InstaPayAddress,
  type PaymentDetails,
  type PaymentMethod,
  type PaymentMethodPatch,
  type WalletNumber,
} from "@/data/paymentMethodsApi";

const AUDIT_NOTE = "كل تغيير في الأرقام أو الحسابات بيتسجل وبيوصل إشعار لكل المديرين.";

type TextForm = Pick<PaymentMethod, "name_ar" | "name_en" | "description_ar" | "description_en" | "sort_order" | "is_active">;

const textOf = (m: PaymentMethod): TextForm => ({
  name_ar: m.name_ar,
  name_en: m.name_en,
  description_ar: m.description_ar ?? "",
  description_en: m.description_en ?? "",
  sort_order: m.sort_order,
  is_active: m.is_active,
});

/** The editable payout list of a method in the structured format (legacy keys start an empty list). */
const payoutOf = (m: PaymentMethod): PaymentDetails => {
  const key = payoutKeyOf(m.type);
  return key ? { [key]: destinationsOf(m) } : {};
};

const emptyItem = (type: string): WalletNumber | InstaPayAddress | BankAccount =>
  type === "wallet" ? { number: "", label: "" }
    : type === "instant_payment" ? { ipa: "", label: "" }
      : { bank_code: "cib", bank_name: BANK_LABELS.cib, account_name: "مؤسسة اليسر الخيرية", account_number: "", iban: "", swift: "" };

const Inner = () => {
  const { id } = useParams<{ id: string }>();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<TextForm | null>(null);
  const [payout, setPayout] = useState<PaymentDetails>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const m = await paymentMethodsApi.get(String(id));
      setMethod(m);
      setForm(textOf(m));
      setPayout(payoutOf(m));
      setServerErrors({});
    } catch (e) {
      setLoadError(apiErrorMessage(e, "تعذر تحميل طريقة الدفع"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const key = method ? payoutKeyOf(method.type) : null;
  const items = (key ? (payout[key] as unknown[] | undefined) : undefined) ?? [];
  const clientErrors = useMemo(() => (method && key ? validatePaymentDetails(method.type, payout) : {}), [method, key, payout]);
  const errors = { ...serverErrors, ...clientErrors };
  const legacy = method ? hasLegacyDetails(method) : false;

  const textPatch = (): PaymentMethodPatch => {
    if (!method || !form) return {};
    const before = textOf(method);
    const patch: PaymentMethodPatch = {};
    (Object.keys(form) as (keyof TextForm)[]).forEach((k) => {
      if (form[k] !== before[k]) (patch as Record<string, unknown>)[k] = form[k];
    });
    if (!form.name_ar.trim()) return patch; // validation below blocks the save
    return patch;
  };

  const cleanedPayout = method && key ? cleanPaymentDetails(method.type, payout) : null;
  const payoutChanged = !!(method && key && cleanedPayout && (legacy || JSON.stringify(cleanPaymentDetails(method.type, payoutOf(method))) !== JSON.stringify(cleanedPayout)));
  const dirty = Object.keys(textPatch()).length > 0 || payoutChanged;

  const setItem = (i: number, patch: Record<string, string>) => {
    if (!key) return;
    setPayout((p) => ({ ...p, [key]: (p[key] as unknown[] ?? []).map((x, j) => (j === i ? { ...(x as object), ...patch } : x)) }));
    setServerErrors({});
  };
  const addItem = () => {
    if (!key || !method || items.length >= MAX_DESTINATIONS) return;
    setPayout((p) => ({ ...p, [key]: [...((p[key] as unknown[]) ?? []), emptyItem(method.type)] }));
  };
  const removeItem = (i: number) => {
    if (!key) return;
    setPayout((p) => ({ ...p, [key]: ((p[key] as unknown[]) ?? []).filter((_, j) => j !== i) }));
    setServerErrors({});
  };

  const requestSave = () => {
    if (!form?.name_ar.trim()) {
      toast({ title: "الاسم بالعربي مطلوب", variant: "destructive" });
      return;
    }
    if (Object.keys(clientErrors).length) {
      toast({ title: "صحّح الحقول المعلّمة بالأحمر الأول", variant: "destructive" });
      return;
    }
    // Payout numbers / accounts change only after an explicit confirmation listing old → new.
    if (payoutChanged) setConfirmOpen(true);
    else void save();
  };

  const save = async () => {
    if (!method) return;
    const patch: PaymentMethodPatch = { ...textPatch(), ...(payoutChanged && cleanedPayout ? { details: cleanedPayout } : {}) };
    if (!Object.keys(patch).length) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      const { method: stored, message } = await paymentMethodsApi.update(method.id, patch);
      void logActivity({
        action: payoutChanged ? "payment_method.payout_update" : "payment_method.update",
        entityType: "payment_method",
        entityId: String(method.id),
        summary: method.slug,
        details: { fields: Object.keys(patch) },
      });
      if (stored) {
        setMethod(stored);
        setForm(textOf(stored));
        setPayout(payoutOf(stored));
        toast({ title: "تم الحفظ", description: payoutChanged ? AUDIT_NOTE : message });
      } else {
        // e.g. an editor's change waiting in the approval queue
        toast({ title: message || "التغيير اتبعت للمراجعة" });
      }
      setServerErrors({});
    } catch (e) {
      setServerErrors(serverFieldErrors(e));
      toast({ title: "لم يتم الحفظ", description: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout title={{ ar: "طريقة دفع", en: "Payment method" }}><div className="grid place-items-center p-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div></AdminLayout>;
  }
  if (!method || !form) {
    return (
      <AdminLayout title={{ ar: "طريقة دفع", en: "Payment method" }}>
        <Card className="space-y-3 p-6 text-sm">
          <div>{loadError || "طريقة الدفع غير موجودة."}</div>
          <Button size="sm" variant="outline" onClick={() => void load()}>إعادة المحاولة</Button>
        </Card>
      </AdminLayout>
    );
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-[11px] font-bold text-destructive">{errors[k]}</p> : null);
  const change = cleanedPayout ? describePayoutChange(method.type, payoutOf(method), cleanedPayout) : { before: [], after: [] };

  return (
    <AdminLayout title={{ ar: `طريقة دفع · ${method.name_ar}`, en: `Payment method · ${method.name_en}` }}>
      <div className="mx-auto max-w-3xl space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/admin/payment-methods"><ArrowRight className="h-4 w-4" /> كل طرق الدفع</Link>
          </Button>
          <Button onClick={requestSave} disabled={!dirty || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ التغييرات
          </Button>
        </div>

        <Card className="flex items-start gap-2 border-amber-500/30 bg-amber-500/5 p-3 text-xs font-bold text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{AUDIT_NOTE} المتبرعين بيحوّلوا على الأرقام دي — راجع كل رقم كويس قبل الحفظ.</span>
        </Card>

        <SectionCard icon={<Wallet className="h-4 w-4 text-primary" />} title="البيانات الأساسية" description={`${PAYMENT_TYPE_LABELS[method.type] ?? method.type} · ${method.slug}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم بالعربي">
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              {err("name_ar")}
            </Field>
            <Field label="الاسم بالإنجليزي">
              <Input dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              {err("name_en")}
            </Field>
            <Field label="تعليمات للمتبرع (عربي)" className="sm:col-span-2">
              <Textarea rows={2} value={form.description_ar ?? ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            </Field>
            <Field label="تعليمات للمتبرع (إنجليزي)" className="sm:col-span-2">
              <Textarea dir="ltr" rows={2} value={form.description_en ?? ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
            </Field>
            <Field label="الترتيب في صفحة التبرع">
              <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="ظاهرة للمتبرعين">
              <div className="flex h-10 items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <span className="text-xs text-muted-foreground">{form.is_active ? "بتظهر في صفحة التبرع" : "مخفية من صفحة التبرع"}</span>
              </div>
            </Field>
          </div>
        </SectionCard>

        {key ? (
          <SectionCard
            icon={<Wallet className="h-4 w-4 text-primary" />}
            title={method.type === "wallet" ? "أرقام المحفظة" : method.type === "instant_payment" ? "عناوين إنستاباي" : "الحسابات البنكية"}
            description={`الطريقة دي بتظهر للمتبرع بس لو فيها رقم أو حساب واحد على الأقل. الحد الأقصى ${MAX_DESTINATIONS}.`}
            actions={
              <Button type="button" size="sm" variant="outline" className="gap-1" disabled={items.length >= MAX_DESTINATIONS} onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> إضافة
              </Button>
            }
          >
            {legacy && (
              <p className="mb-3 rounded-lg bg-amber-500/10 p-2 text-xs font-bold text-amber-800">
                بيانات قديمة — اعمل حفظ بالشكل الجديد. (الموجود على السيرفر محفوظ بشكل قديم ومش بيظهر للمتبرعين بالشكل ده.)
              </p>
            )}
            {err(`details.${key}`)}
            {err("details")}
            {items.length === 0 && <p className="text-xs text-muted-foreground">مفيش أرقام أو حسابات لسه — اضغط «إضافة».</p>}
            <div className="space-y-3">
              {items.map((raw, i) => {
                const p = `details.${key}.${i}`;
                return (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black text-primary">#{i + 1}</span>
                      <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-destructive" onClick={() => removeItem(i)}>
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </Button>
                    </div>
                    {method.type === "wallet" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="رقم المحفظة">
                          <Input dir="ltr" inputMode="numeric" placeholder="01XXXXXXXXX" value={(raw as WalletNumber).number}
                            onChange={(e) => setItem(i, { number: e.target.value.replace(/\s/g, "") })} />
                          {err(`${p}.number`)}
                        </Field>
                        <Field label="وصف (اختياري)">
                          <Input value={(raw as WalletNumber).label ?? ""} onChange={(e) => setItem(i, { label: e.target.value })} />
                        </Field>
                      </div>
                    )}
                    {method.type === "instant_payment" && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="عنوان إنستاباي (IPA)">
                          <Input dir="ltr" placeholder="name@bank" value={(raw as InstaPayAddress).ipa}
                            onChange={(e) => setItem(i, { ipa: e.target.value.trim() })} />
                          {err(`${p}.ipa`)}
                        </Field>
                        <Field label="وصف (اختياري)">
                          <Input value={(raw as InstaPayAddress).label ?? ""} onChange={(e) => setItem(i, { label: e.target.value })} />
                        </Field>
                      </div>
                    )}
                    {method.type === "bank_transfer" && (() => {
                      const a = raw as BankAccount;
                      return (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Field label="البنك">
                            <ChoiceSelect value={a.bank_code} ariaLabel="البنك"
                              onChange={(v) => setItem(i, { bank_code: v, bank_name: v && v !== "other" ? BANK_LABELS[v as BankCode] : a.bank_name })}
                              options={BANK_CODES.map((c) => ({ value: c, label: BANK_LABELS[c] }))} />
                            {err(`${p}.bank_code`)}
                          </Field>
                          <Field label="اسم البنك (كما يظهر للمتبرع)">
                            <Input value={a.bank_name} onChange={(e) => setItem(i, { bank_name: e.target.value })} />
                            {err(`${p}.bank_name`)}
                          </Field>
                          <Field label="اسم صاحب الحساب">
                            <Input value={a.account_name} onChange={(e) => setItem(i, { account_name: e.target.value })} />
                            {err(`${p}.account_name`)}
                          </Field>
                          <Field label="رقم الحساب">
                            <Input dir="ltr" inputMode="numeric" value={a.account_number} onChange={(e) => setItem(i, { account_number: e.target.value.replace(/\s/g, "") })} />
                            {err(`${p}.account_number`)}
                          </Field>
                          <Field label="IBAN (اختياري)">
                            <Input dir="ltr" placeholder="EG…" value={a.iban ?? ""} onChange={(e) => setItem(i, { iban: e.target.value.replace(/\s/g, "").toUpperCase() })} />
                            {err(`${p}.iban`)}
                          </Field>
                          <Field label="SWIFT (اختياري)">
                            <Input dir="ltr" value={a.swift ?? ""} onChange={(e) => setItem(i, { swift: e.target.value.replace(/\s/g, "").toUpperCase() })} />
                            {err(`${p}.swift`)}
                          </Field>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : (
          <SectionCard icon={<Wallet className="h-4 w-4 text-primary" />} title="إعدادات الطريقة" description="بتتظبط من إعدادات البوابة، مش من هنا.">
            <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 text-[11px]" dir="ltr">{JSON.stringify(method.details ?? {}, null, 2)}</pre>
          </SectionCard>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير أرقام / حسابات استلام التبرعات</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold text-foreground">قبل:</div>
                  {change.before.length ? change.before.map((l) => <div key={l} dir="ltr" className="font-mono text-xs">{l}</div>) : <div className="text-xs">— لا شيء —</div>}
                </div>
                <div>
                  <div className="font-bold text-foreground">بعد:</div>
                  {change.after.length ? change.after.map((l) => <div key={l} dir="ltr" className="font-mono text-xs">{l}</div>) : <div className="text-xs">— لا شيء (الطريقة مش هتظهر للمتبرعين) —</div>}
                </div>
                <p className="font-bold text-amber-700">{AUDIT_NOTE}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void save()}>تأكيد وحفظ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

const AdminPaymentMethodDetail = () => (
  <RequireAuth roles={["admin"]}>
    <Inner />
  </RequireAuth>
);
export default AdminPaymentMethodDetail;
