import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { CheckCircle2, XCircle, Loader2, Clock, Copy } from "lucide-react";
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
};

/** Map a raw Laravel donation to Tx shape */
function fromLaravel(d: any): Tx {
  const rawStatus = d.payment_status || d.status || "pending";
  let status: TxStatus = "pending";
  if (rawStatus === "paid" || rawStatus === "completed") status = "paid";
  else if (rawStatus === "failed") status = "failed";
  else if (rawStatus === "refunded") status = "refunded";
  else if (rawStatus === "processing") status = "processing";

  return {
    id:           String(d.id),
    ref_code:     d.code || d.reference_code || d.ref_code || `DON-${d.id}`,
    status,
    amount:       Number(d.amount || 0),
    currency:     d.currency || "EGP",
    method:       d.payment_method || d.method || null,
    provider:     d.provider || d.gateway || "paymob",
    donor_name:   d.donor_name || d.donor?.name || null,
    donor_phone:  d.donor_phone || d.donor?.phone || null,
    last_error:   d.last_error || null,
    created_at:   d.created_at || new Date().toISOString(),
    redirect_url: d.redirect_url || null,
  };
}

async function loadTx(ref: string): Promise<Tx | null> {
  try {
    const list = await donationsApiV1.listAll({ code: ref });
    const found = list.find((d: any) =>
      d.code === ref || d.reference_code === ref || d.ref_code === ref
    );
    if (found) return fromLaravel(found);

    // broader search
    const all = await donationsApiV1.listAll({ per_page: 200 });
    const match = all.find((d: any) =>
      d.code === ref || d.reference_code === ref || d.ref_code === ref
    );
    if (match) return fromLaravel(match);

    // try donationsStore local
    const local = donationsStore.byRef(ref);
    if (local) {
      return {
        id: local.ref,
        ref_code: local.ref,
        status: local.status === "completed" ? "paid" : local.status === "failed" ? "failed" : "pending",
        amount: local.amount,
        currency: "EGP",
        method: String(local.method || ""),
        provider: "paymob",
        donor_name: local.donor?.name || null,
        donor_phone: local.donor?.phone || null,
        last_error: null,
        created_at: local.createdAt,
        redirect_url: null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function DonationStatus() {
  const { ref } = useParams<{ ref: string }>();
  const { lang } = useLang();
  const [tx, setTx]           = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ref) return;
    let alive = true;

    const load = async () => {
      const data = await loadTx(ref);
      if (!alive) return;
      setTx(data);
      setLoading(false);

      // Stop polling once terminal state reached
      if (data && (data.status === "paid" || data.status === "failed" || data.status === "refunded")) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    };

    void load();
    pollRef.current = setInterval(load, 8000); // poll every 8s
    return () => {
      alive = false;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [ref]);

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast({ title: lang === "ar" ? "تم النسخ" : "Copied" });
  };

  const StatusBlock = () => {
    if (!tx) return null;
    const map: Record<TxStatus, { Icon: any; color: string; ar: string; en: string }> = {
      paid:       { Icon: CheckCircle2, color: "text-secondary",       ar: "تم الدفع بنجاح",  en: "Payment successful" },
      processing: { Icon: Loader2,      color: "text-accent",           ar: "قيد المعالجة",    en: "Processing" },
      pending:    { Icon: Clock,        color: "text-accent",           ar: "في انتظار الدفع", en: "Awaiting payment" },
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
      </div>
    );
  };

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
            ) : !tx ? (
              <div className="text-center text-muted-foreground">
                {lang === "ar" ? "لم يتم العثور على هذه العملية." : "Transaction not found."}
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
                    {lang === "ar" ? "نحدّث الحالة تلقائيًا كل بضع ثوان." : "We auto-refresh every few seconds."}
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