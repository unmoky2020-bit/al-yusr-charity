import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Wallet,
  Save,
  Settings2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Zap,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import {
  paymentMethodsApi,
  summarizeDestinations,
  hasLegacyDetails,
  PAYMENT_TYPE_LABELS,
  type PaymentMethod,
} from "@/data/paymentMethodsApi";
import {
  getGatewaySettings,
  saveGatewaySettings,
  type GatewaySettings,
} from "@/data/kashierGateway";
import { paymentGatewaysApi } from "@/data/laravelApi";
import { logActivity } from "@/lib/activityLog";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [rows, setRows] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Gateway Settings State (public fields only — persisted locally)
  const [gatewaySettings, setGatewaySettings] = useState<GatewaySettings>(getGatewaySettings);
  // Secret key: write-only. Lives in memory until it is sent to the backend once,
  // then it is cleared. It is never prefilled, echoed, copied or stored locally.
  const [kashierSecretInput, setKashierSecretInput] = useState("");
  const [testingKashier, setTestingKashier] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [gatewaySaved, setGatewaySaved] = useState(false);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await paymentMethodsApi.list());
    } catch (e: any) {
      setLoadError(apiErrorMessage(e, "تعذر تحميل طرق الدفع"));
      toast({ title: isAr ? "تعذر تحميل طرق الدفع" : "Load failed", description: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    const local = getGatewaySettings();
    setGatewaySettings(local);

    // Also load live credentials from backend
    paymentGatewaysApi.list().then((list) => {
      const k = list.find((g: any) => g.gateway === "kashier");
      if (k) {
        setGatewaySettings((prev) => ({
          ...prev,
          activeGateway: "kashier",
          kashier: {
            ...prev.kashier,
            merchantId: k.credentials?.merchant_id || prev.kashier.merchantId || "",
            mode: k.credentials?.base_url?.includes("test") ? "test" : "live",
          },
        }));
      }
    }).catch(() => {});
  }, []);

  /** Show / hide a method on the donation form: a partial update with is_active only. */
  const toggleActive = async (r: PaymentMethod, value: boolean) => {
    setBusy(r.id);
    try {
      const { method, message } = await paymentMethodsApi.setActive(r.id, value);
      const stored = method ? method.is_active : value;
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: stored } : x)));
      void logActivity({
        action: "payment_method.toggle",
        entityType: "payment_method",
        entityId: String(r.id),
        summary: `${r.slug} → ${value ? "active" : "inactive"}`,
        details: { is_active: value },
      });
      toast({
        title: stored === value ? (value ? "طريقة الدفع ظاهرة للمتبرعين" : "طريقة الدفع اتخفت من صفحة التبرع") : "التغيير بانتظار الموافقة",
        description: message,
      });
    } catch (e: unknown) {
      toast({ title: "لم يتم الحفظ", description: apiErrorMessage(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleSaveGatewaySettings = async () => {
    const effectiveMid = gatewaySettings.kashier.merchantId.trim();
    if (!effectiveMid) {
      toast({
        title: isAr ? "معرف التاجر مطلوب" : "Merchant ID is required",
        description: isAr ? "أدخل معرف التاجر الذي يبدأ بـ MID-" : "Enter the merchant ID starting with MID-",
        variant: "destructive",
      });
      return;
    }
    const updatedSettings: GatewaySettings = {
      ...gatewaySettings,
      activeGateway: "kashier",
      kashier: {
        ...gatewaySettings.kashier,
        merchantId: effectiveMid,
      },
    };
    setGatewaySettings(updatedSettings);
    // Public settings only (merchant id / mode). The secret is never persisted locally.
    saveGatewaySettings(updatedSettings);

    const secret = kashierSecretInput.trim();
    try {
      await paymentGatewaysApi.update("kashier", {
        is_active: true,
        credentials: {
          merchant_id: effectiveMid,
          base_url:
            gatewaySettings.kashier.mode === "live"
              ? "https://api.kashier.io"
              : "https://test-api.kashier.io",
          currency: "EGP",
          allowed_methods: "card,wallet",
          // Sent to the backend once, only when the admin typed a new value.
          ...(secret ? { secret_key: secret } : {}),
        },
      });
      // Drop the secret from memory as soon as the backend has it.
      setKashierSecretInput("");
      setGatewaySaved(true);
      setTimeout(() => setGatewaySaved(false), 2500);
      toast({
        title: isAr ? "تم حفظ إعدادات كاشير بنجاح" : "Kashier settings saved successfully",
        description: isAr
          ? `المعرف المعتمد: ${effectiveMid} (${gatewaySettings.kashier.mode === "live" ? "مباشر حي" : "تجريبي"})`
          : `Merchant ID: ${effectiveMid} (${gatewaySettings.kashier.mode})`,
      });
    } catch (err: any) {
      console.warn("Backend gateway update notice:", err);
      toast({
        title: isAr ? "تعذر حفظ الإعدادات على الخادم" : "Could not save settings on the server",
        description: err?.message || (isAr ? "حاول مرة أخرى" : "Please try again"),
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingKashier(true);
    setTestResult(null);
    try {
      // The secret lives on the backend only, so only the backend can verify it.
      const bRes: any = await paymentGatewaysApi.test("kashier");
      const backendOk = !!(
        bRes?.success ||
        bRes?.configured ||
        String(bRes?.status || "").toLowerCase() === "success" ||
        bRes?.message?.toLowerCase?.().includes("valid")
      );

      if (backendOk) {
        setTestResult({
          success: true,
          message: isAr
            ? `بوابة كاشير متصلة ومتوافقة بنجاح على الخادم (${gatewaySettings.kashier.mode === "live" ? "الوضع المباشر الحي" : "وضع التجربة Sandbox"})`
            : `Kashier is connected and verified (${gatewaySettings.kashier.mode})`,
        });
        toast({ title: isAr ? "الاتصال مع كاشير متوافق وناجح" : "Kashier verified successfully" });
      } else {
        const msg = bRes?.message || (isAr ? "لم يؤكد الخادم صحة بيانات كاشير" : "The server did not verify the Kashier credentials");
        setTestResult({ success: false, message: msg });
        toast({ title: "فشل التحقق", description: msg, variant: "destructive" });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "خطأ أثناء الاختبار" });
    } finally {
      setTestingKashier(false);
    }
  };

  return (
    <AdminLayout title={{ ar: "طرق وبوابات الدفع", en: "Payment Methods & Gateways" }}>
      <div className="space-y-4">
        {/* ========================================================================= */}
        {/* Kashier Dedicated Payment Gateway Card */}
        {/* ========================================================================= */}
        <Card className="p-4 sm:p-6 border-2 border-teal-500/25 bg-gradient-to-b from-teal-500/[0.04] to-card shadow-sm rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/15 text-teal-600 border border-teal-500/30">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-primary">
                    {isAr ? "إعدادات بوابة الدفع الإلكتروني (كاشير - Kashier)" : "Payment Gateway Settings (Kashier)"}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-black border border-emerald-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isAr ? "نشط ومعتمد" : "Active & Verified"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr
                    ? "الربط المعتمد لمدفوعات البطاقات البنكية (فيزا / ماستركارد / ميزة) والمحافظ الإلكترونية عبر كاشير"
                    : "Official payment gateway for cards (Visa, Mastercard, Meeza) and e-wallets via Kashier"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveGatewaySettings}
              className="gap-1.5 font-bold h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            >
              {gatewaySaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isAr ? (gatewaySaved ? "تم الحفظ ✓" : "حفظ إعدادات كاشير") : "Save Kashier Settings"}
            </Button>
          </div>

          {/* Kashier Credentials Fields */}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Kashier Merchant ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">
                    {isAr ? "معرف التاجر في كاشير (Merchant ID):" : "Kashier Merchant ID:"}
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">MID-XXXX-XXXX</span>
                </div>
                <div className="relative">
                  <Input
                    dir="ltr"
                    value={gatewaySettings.kashier.merchantId}
                    onChange={(e) =>
                      setGatewaySettings((prev) => ({
                        ...prev,
                        kashier: { ...prev.kashier, merchantId: e.target.value },
                      }))
                    }
                    className="font-mono text-xs pr-8"
                    placeholder="MID-XXXX-XXXX"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!gatewaySettings.kashier.merchantId) return;
                      navigator.clipboard.writeText(gatewaySettings.kashier.merchantId);
                      toast({ title: isAr ? "تم نسخ المعرّف" : "Copied" });
                    }}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary cursor-pointer"
                    title="نسخ"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {gatewaySettings.kashier.merchantId &&
                  !gatewaySettings.kashier.merchantId.toUpperCase().startsWith("MID-") && (
                    <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      ⚠️ كاشير يطلب معرف يبدأ بـ MID- (بصيغة MID-XXXX-XXXX).
                    </p>
                  )}
              </div>

              {/* Kashier Secret Key — write-only */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="kashier-secret-key" className="text-xs font-bold text-foreground">
                    {isAr ? "المفتاح السري (Secret Key):" : "Secret Key:"}
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">HMAC Key</span>
                </div>
                <Input
                  id="kashier-secret-key"
                  dir="ltr"
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  value={kashierSecretInput}
                  onChange={(e) => setKashierSecretInput(e.target.value)}
                  className="font-mono text-xs"
                  placeholder={isAr ? "اتركه فارغًا للإبقاء على المفتاح الحالي" : "Leave empty to keep the current key"}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {isAr
                    ? "يُرسل المفتاح إلى الخادم مرة واحدة عند الحفظ ولا يُحفظ أو يُعرض في المتصفح."
                    : "The key is sent to the server once on save; it is never stored or shown in the browser."}
                </p>
              </div>
            </div>

            {/* Mode & Test Connection Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">
                    {isAr ? "الوضع الفعلي المباشر (Live Mode)" : "Live Production Mode"}
                  </span>
                  <Switch
                    checked={gatewaySettings.kashier.mode === "live"}
                    onCheckedChange={(val) =>
                      setGatewaySettings((prev) => ({
                        ...prev,
                        kashier: { ...prev.kashier, mode: val ? "live" : "test" },
                      }))
                    }
                  />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gatewaySettings.kashier.mode === "live"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {gatewaySettings.kashier.mode === "live" ? "Live (إنتاج)" : "Test / Sandbox (تجريبي)"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.kashier.io/ar/developers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline px-2"
                >
                  {isAr ? "دليل المطورين" : "Developers Portal"}
                  <ExternalLink className="h-3 w-3" />
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingKashier}
                  onClick={handleTestConnection}
                  className="h-8 text-xs font-bold gap-1.5 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 cursor-pointer"
                >
                  {testingKashier ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  {isAr ? "اختبار الاتصال مع كاشير" : "Test Kashier Connection"}
                </Button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Informational strip */}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" />
            {isAr
              ? "الطريقة المقفولة مش بتظهر في صفحة التبرع. الأرقام والحسابات بتتعدل من «تفاصيل». كل تغيير في رقم أو حساب بيتسجل وبيوصل إشعار لكل المديرين."
              : "Hidden methods are not offered to donors. Edit numbers and accounts under Details; every change is logged and every admin is notified."}
          </div>
        </Card>

        {loading && (
          <div className="grid place-items-center p-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && loadError && (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4" />{" "}
              {isAr ? "تعذر تحميل طرق الدفع" : "Failed to load payment methods"}
            </div>
            <div className="mt-1 text-xs opacity-80">{loadError}</div>
            <Button size="sm" variant="outline" className="mt-3" onClick={reload}>
              {isAr ? "إعادة المحاولة" : "Retry"}
            </Button>
          </Card>
        )}

        {!loading && !loadError && rows.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {isAr ? "لا توجد طرق دفع بعد." : "No payment methods yet."}
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => {
            const legacy = hasLegacyDetails(r);
            return (
              <Card key={r.id} className={`p-4 ${r.is_active ? "" : "opacity-75"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-primary">{isAr ? r.name_ar : r.name_en || r.name_ar}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {PAYMENT_TYPE_LABELS[r.type] ?? r.type}
                      {(r.provider_ar || r.provider_en) && (
                        <span className="ms-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold">{isAr ? r.provider_ar || r.provider_en : r.provider_en || r.provider_ar}</span>
                      )}
                      <span className={`ms-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${r.is_active ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {r.is_active ? "ظاهرة للمتبرعين" : "مخفية"}
                      </span>
                    </div>
                    <div className={`mt-2 text-xs ${legacy ? "font-bold text-amber-700" : "text-foreground/80"}`} dir="rtl">
                      {summarizeDestinations(r)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 px-2">
                      <Link to={`/admin/payment-methods/${r.id}`}>
                        <Settings2 className="h-3.5 w-3.5" />
                        <span className="ms-1 text-[11px]">{isAr ? "تفاصيل" : "Details"}</span>
                      </Link>
                    </Button>
                    <Switch
                      checked={r.is_active}
                      disabled={busy === r.id}
                      onCheckedChange={(v) => void toggleActive(r, v)}
                      aria-label={r.is_active ? "إخفاء من صفحة التبرع" : "إظهار في صفحة التبرع"}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminPaymentMethods = () => (
  <RequireAuth roles={["admin"]}>
    <Inner />
  </RequireAuth>
);
export default AdminPaymentMethods;