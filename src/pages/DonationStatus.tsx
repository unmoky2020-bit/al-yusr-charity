import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { CheckCircle2, XCircle, Loader2, Clock, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { donationsApiV1 } from "@/data/laravelApi";
import { donationsStore } from "@/data/donationsStore";

type TxStatus = "pending" | "processing" | "paid" | "failed" | "refunded";

type Tx = {
  id: string;
  ref_code: string;
  status: TxStatus;
  amount: number;
  currency: string;
  method: string | null;
  provider: string;
  donor_name: string | null;
  donor_phone: string | null;
  last_error: string | null;
  created_at: string;
  redirect_url: string | null;
  /** true when the status comes from the backend (the only source allowed to say "paid") */
  verified: boolean;
};

/** Map a raw Laravel donation to Tx shape */
function fromLaravel(d: any): Tx {
  const rawStatus = String(d.payment_status || d.status || "pending").toLowerCase();
  let status: TxStatus = "pending";
  if (rawStatus === "paid" || rawStatus === "completed" || rawStatus === "success") status = "paid";
  else if (rawStatus === "failed" || rawStatus === "error" || rawStatus === "declined") status = "failed";
  else if (rawStatus === "refunded") status = "refunded";
  else if (rawStatus === "processing") status = "processing";

  const methodVal =
    d.payment_method?.name_ar ||
    d.payment_method?.slug ||
    (typeof d.payment_method === "string" ? d.payment_method : null) ||
    d.method ||
    null;

  return {
    id:           String(d.id || d.transaction_reference || ""),
    ref_code:     d.transaction_reference || d.code || d.reference_code || d.ref_code || `DON-${d.id}`,
    status,
    amount:       Number(d.amount || 0),
    currency:     d.currency || "EGP",
    method:       methodVal,
    provider:     d.provider || d.gateway || "kashier",
    donor_name:   d.donor_name || d.donor?.name || null,
    donor_phone:  d.donor_phone || d.donor?.phone || null,
    last_error:   d.last_error || null,
    created_at:   d.created_at || new Date().toISOString(),
    redirect_url: d.redirect_url || null,
    verified:     true,
  };
}

/** Ask the backend tracking endpoint. Returns null when the backend has no record. */
async function loadFromBackend(ref: string): Promise<Tx | null> {
  const cleanRef = ref.trim();
  if (!cleanRef) return null;
  try {
    const trackRes = await donationsApiV1.track(cleanRef);
    const data = (trackRes as any)?.data || trackRes;
    if (data && (data.transaction_reference || data.id || data.amount !== undefined)) {
      return fromLaravel(data);
    }
  } catch (err) {
    console.warn("DonationStatus: /donations/track notice:", err);
  }
  return null;
}

/**
 * Local-only fallback (this browser's own records). It can describe the
 * donation but is never allowed to claim the payment succeeded.
 */
function loadLocal(ref: string): Tx | null {
  try {
    const local = donationsStore.byRef(ref.trim());
    if (!local) return null;
    return {
      id: local.ref,
      ref_code: local.ref,
      status: local.status === "failed" ? "failed" : "pending",
      amount: local.amount,
      currency: "EGP",
      method: String(local.method || ""),
      provider: String(local.method || "").includes("kashier") ? "kashier" : "manual",
      donor_name: local.donor?.name || null,
      donor_phone: local.donor?.phone || null,
      last_error: null,
      created_at: local.createdAt,
      redirect_url: null,
      verified: false,
    };
  } catch {
    return null;
  }
}

export default function DonationStatus() {
  const { ref: paramRef } = useParams<{ ref: string }>();
  const [searchParams] = useSearchParams();
  const { lang } = useLang();

  // Candidate references: the route param plus whatever the gateway appended.
  // These are HINTS only — the backend decides what the status really is.
  const candidates = useMemo(() => {
    const list = [
      paramRef,
      searchParams.get("merchantOrderId"),
      searchParams.get("orderId"),
      searchParams.get("order_id"),
      searchParams.get("order"),
      searchParams.get("ref"),
      searchParams.get("id"),
    ]
      .map((v) => (v || "").trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [paramRef, searchParams]);

  const ref = candidates[0] || "";

  const [tx, setTx]             = useState<Tx | null>(null);
  const [loading, setLoading]   = useState(true);
  const [checking, setChecking] = useState(false);
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliveRef                = useRef(true);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const load = useCallback(async () => {
    if (candidates.length === 0) return;
    setChecking(true);
    let verified: Tx | null = null;
    for (const c of candidates) {
      verified = await loadFromBackend(c);
      if (verified) break;
    }
    if (!aliveRef.current) return;

    if (verified) {
      setTx(verified);
      if (verified.status === "paid" || verified.status === "failed" || verified.status === "refunded") {
        stopPolling();
      }
    } else {
      // Backend has no record yet: show what this browser knows (never "paid").
      setTx((prev) => (prev && prev.verified ? prev : loadLocal(ref)));
    }
    setChecking(false);
    setLoading(false);
  }, [candidates, ref]);

  useEffect(() => {
    aliveRef.current = true;
    if (!ref) {
      setLoading(false);
      return;
    }
    void load();
    pollRef.current = setInterval(() => void load(), 8000); // poll every 8s
    return () => {
      aliveRef.current = false;
      stopPolling();
    };
  }, [ref, load]);

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast({ title: lang === "ar" ? "تم النسخ" : "Copied" });
  };

  const StatusBlock = () => {
    if (!tx) return null;
    const map: Record<TxStatus, { Icon: any; color: string; ar: string; en: string }> = {
      paid:       { Icon: CheckCircle2, color: "text-secondary",       ar: "تم الدفع بنجاح",  en: "Payment successful" },
      processing: { Icon: Loader2,      color: "text-accent",           ar: "قيد المعالجة",    en: "Processing" },
      pending:    { Icon: Clock,        color: "text-accent",           ar: "جارٍ التحقق من عملية الدفع", en: "Verifying payment" },
      failed:     { Icon: XCircle,      color: "text-destructive",      ar: "فشلت العملية",    en: "Payment failed" },
      refunded:   { Icon: XCircle,      color: "text-muted-foreground", ar: "تم الاسترداد",    en: "Refunded" },
    };
    const s = map[tx.status];
    return (
      <div className="text-center">
        <s.Icon className={`mx-auto h-16 w-16 ${s.color} ${tx.status === "processing" ? "animate-spin" : ""}`} />
        <h1 className={`mt-4 text-2xl font-black md:text-3xl ${s.color}`}>{lang === "ar" ? s.ar : s.en}</h1>
        {tx.last_error && tx.status === "failed" && (
          <p className="mt-2 text-sm text-destructive">{tx.last_error}</p>
        )}
        {tx.status === "pending" && (
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "ar"
              ? "لم يصلنا تأكيد الدفع من بوابة الدفع بعد. احتفظ برقم العملية وسنحدّث الحالة تلقائيًا."
              : "We have not received the gateway confirmation yet. Keep your reference; the status updates automatically."}
          </p>
        )}
      </div>
    );
  };

  const RetryButton = () => (
    <Button size="lg" variant="outline" onClick={() => void load()} disabled={checking} className="gap-2">
      {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {lang === "ar" ? "إعادة التحقق" : "Check again"}
    </Button>
  );

  return (
    <PageLayout>
      <SEOHelmet
        title={lang === "ar" ? `حالة التبرع ${ref}` : `Donation status ${ref}`}
        description={lang === "ar" ? "تتبّع حالة عملية الدفع لحظيًا" : "Track your payment status in real-time"}
        path={`/donate/status/${ref}`}
      />
      <section className="bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="rounded-3xl bg-card p-6 shadow-card md:p-10">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !ref ? (
              <div className="text-center text-muted-foreground">
                {lang === "ar" ? "لم يتم العثور على هذه العملية." : "Transaction not found."}
              </div>
            ) : !tx ? (
              /* Reference known, but the backend has no verdict yet */
              <div className="text-center">
                <Clock className="mx-auto h-16 w-16 text-accent" />
                <h1 className="mt-4 text-2xl font-black text-accent md:text-3xl">
                  {lang === "ar" ? "جارٍ التحقق من عملية الدفع" : "Verifying payment"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "ar"
                    ? "لم نتمكن بعد من تأكيد هذه العملية من الخادم. احتفظ برقم العملية وأعد المحاولة بعد قليل."
                    : "We could not confirm this transaction with our server yet. Keep your reference and try again shortly."}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-2 font-extrabold text-primary" dir="ltr">
                  {ref}
                  <button onClick={() => copy(ref)} className="text-accent" aria-label="copy"><Copy className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <RetryButton />
                  <Button asChild size="lg" variant="outline">
                    <Link to="/">{lang === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
                  </Button>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {lang === "ar" ? "نحدّث الحالة تلقائيًا كل بضع ثوانٍ." : "We auto-refresh every few seconds."}
                </p>
              </div>
            ) : (
              <>
                <StatusBlock />

                <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{lang === "ar" ? "رقم العملية" : "Reference"}</span>
                    <span className="inline-flex items-center gap-2 font-extrabold text-primary" dir="ltr">
                      {tx.ref_code}
                      <button onClick={() => copy(tx.ref_code)} className="text-accent" aria-label="copy"><Copy className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{lang === "ar" ? "المبلغ" : "Amount"}</span>
                    <span className="font-extrabold text-primary">{Number(tx.amount).toLocaleString()} {tx.currency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{lang === "ar" ? "القناة" : "Channel"}</span>
                    <span className="font-bold text-primary">{tx.provider} · {tx.method || "—"}</span>
                  </div>
                  {tx.donor_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{lang === "ar" ? "المتبرع" : "Donor"}</span>
                      <span className="font-bold text-primary">{tx.donor_name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {(tx.status === "pending" || tx.status === "processing") && <RetryButton />}
                  {tx.status === "pending" && tx.redirect_url && (
                    <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
                      <a href={tx.redirect_url}>{lang === "ar" ? "إكمال الدفع" : "Continue payment"}</a>
                    </Button>
                  )}
                  {tx.status === "failed" && (
                    <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta">
                      <Link to="/donate">{lang === "ar" ? "حاول مرة أخرى" : "Try again"}</Link>
                    </Button>
                  )}
                  <Button asChild size="lg" variant="outline">
                    <Link to="/">{lang === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
                  </Button>
                </div>

                {(tx.status === "pending" || tx.status === "processing") && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    {lang === "ar" ? "نحدّث الحالة تلقائيًا كل بضع ثوانٍ." : "We auto-refresh every few seconds."}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
