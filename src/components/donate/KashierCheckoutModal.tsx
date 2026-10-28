import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, CreditCard, RefreshCw, Clock, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createKashierSession,
  isKashierCheckoutUrl,
  KASHIER_CHECKOUT_ORIGINS,
  KASHIER_SESSION_ERROR_AR,
} from "@/data/kashierGateway";
import { verifyDonationPayment, type VerifiedPaymentStatus } from "@/data/casesApi";
import { toast } from "@/hooks/use-toast";

interface KashierCheckoutModalProps {
  isOpen: boolean;
  amount: number;
  currency?: string;
  orderId?: string;
  sessionUrl?: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  /** Donation target from the donor's actual selection (optional). */
  caseId?: string | null;
  programId?: string | null;
  campaignId?: string | null;
  message?: string;
  onClose: () => void;
  /** Fired ONLY after the backend confirmed the payment as paid. */
  onSuccess?: (ref: string) => void;
}

const VERIFY_ATTEMPTS = 12; // ~30s of active verification after a "success" hint
const VERIFY_INTERVAL_MS = 2500;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function KashierCheckoutModal({
  isOpen,
  amount,
  currency = "EGP",
  orderId,
  sessionUrl,
  donorName,
  donorEmail,
  donorPhone,
  caseId,
  programId,
  campaignId,
  message,
  onClose,
  onSuccess,
}: KashierCheckoutModalProps) {
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  /** Set when the backend could not (yet) confirm the payment. */
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoadCount = useRef(0);
  const successFiredRef = useRef(false);
  const verifyingRef = useRef(false);
  const aliveRef = useRef(false);
  const orderIdRef = useRef<string>("");

  if (!orderIdRef.current || !isOpen) {
    orderIdRef.current = orderId || `YSR-${Date.now().toString(36).toUpperCase()}`;
  }

  const fireSuccess = () => {
    if (successFiredRef.current) return;
    successFiredRef.current = true;
    const ref = orderIdRef.current;
    onClose();
    onSuccess?.(ref);
  };

  const applyOutcome = (status: VerifiedPaymentStatus) => {
    if (!aliveRef.current) return;
    if (status === "paid") {
      setVerifying(false);
      setPendingRef(null);
      fireSuccess();
      return;
    }
    if (status === "failed") {
      setVerifying(false);
      setPendingRef(null);
      setLoading(false);
      setError("فشلت عملية الدفع. يرجى المحاولة مرة أخرى.");
      return;
    }
    // pending / unknown → the donor keeps the reference and can re-check.
    setVerifying(false);
    setLoading(false);
    setPendingRef(orderIdRef.current);
  };

  /**
   * "Pending verification" path: the only way to reach onSuccess.
   * Polls GET /donations/track/{ref} and resolves to paid / failed / pending.
   */
  const verifyWithBackend = async (attempts = VERIFY_ATTEMPTS) => {
    if (verifyingRef.current || successFiredRef.current) return;
    const ref = orderIdRef.current;
    if (!ref) return;
    verifyingRef.current = true;
    setVerifying(true);
    setError(null);
    let outcome: VerifiedPaymentStatus = "pending";
    try {
      for (let i = 0; i < attempts && aliveRef.current; i++) {
        const { status } = await verifyDonationPayment(ref);
        if (status === "paid" || status === "failed") {
          outcome = status;
          break;
        }
        if (i < attempts - 1) await sleep(VERIFY_INTERVAL_MS);
      }
    } catch {
      outcome = "pending";
    } finally {
      verifyingRef.current = false;
    }
    applyOutcome(outcome);
  };

  const buildUrl = async () => {
    setLoading(true);
    setError(null);
    setPendingRef(null);
    iframeLoadCount.current = 0;
    if (sessionUrl && isKashierCheckoutUrl(sessionUrl)) {
      setCheckoutUrl(sessionUrl);
      setLoading(false);
      return;
    }
    try {
      const res = await createKashierSession({
        amount,
        currency,
        orderId: orderIdRef.current,
        donorName,
        donorEmail,
        donorPhone,
        lang: "ar",
        caseId,
        programId,
        campaignId,
        message,
      });
      if (!aliveRef.current) return;
      if (res?.orderId) orderIdRef.current = res.orderId;
      setCheckoutUrl(res.sessionUrl);
    } catch (err: any) {
      if (!aliveRef.current) return;
      setError(err?.message || KASHIER_SESSION_ERROR_AR);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      aliveRef.current = false;
      setCheckoutUrl("");
      setLoading(true);
      setError(null);
      setVerifying(false);
      setPendingRef(null);
      iframeLoadCount.current = 0;
      successFiredRef.current = false;
      verifyingRef.current = false;
      orderIdRef.current = "";
      return;
    }

    aliveRef.current = true;
    successFiredRef.current = false;
    verifyingRef.current = false;
    iframeLoadCount.current = 0;
    void buildUrl();

    const loadTimer = setTimeout(() => setLoading(false), 3500);

    // 1. PostMessage listener — accepted ONLY from the Kashier checkout origin
    //    that is actually loaded in our iframe. Messages never decide the
    //    outcome; a "success"-looking message merely triggers backend verification.
    const handleMessage = (event: MessageEvent) => {
      if (!(KASHIER_CHECKOUT_ORIGINS as readonly string[]).includes(event.origin)) return;
      const frameWin = iframeRef.current?.contentWindow;
      if (frameWin && event.source && event.source !== frameWin) return;

      let d: any = event.data;
      if (typeof d === "string") {
        try {
          d = JSON.parse(d);
        } catch {
          d = { message: d };
        }
      }
      if (!d || typeof d !== "object") return;

      const statusStr = String(
        d.status || d.paymentStatus || d?.data?.status || d?.data?.paymentStatus || ""
      ).toUpperCase();
      const looksPaid =
        d.message === "paymentSuccess" ||
        d.type === "KASHIER_SUCCESS" ||
        statusStr === "SUCCESS" ||
        statusStr === "PAID" ||
        (d.event === "pay" && (statusStr === "SUCCESS" || d?.data?.transactionResponseCode === "00"));
      const looksFailed =
        d.message === "paymentFailed" || statusStr === "FAILURE" || statusStr === "FAILED";

      if (looksPaid || looksFailed) {
        // Both outcomes are confirmed with the backend before anything is shown.
        void verifyWithBackend(looksFailed ? 2 : VERIFY_ATTEMPTS);
        return;
      }
      if (d.message === "closeIframe") {
        onClose();
        return;
      }
      if (d.message === "contentLoaded" || d.type === "FRAME_LOADED") {
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // 2. Background backend polling — stops after repeated 404s to avoid hammering.
    let consecutiveNotFound = 0;
    let totalAttempts = 0;
    const MAX_CONSECUTIVE_404 = 3;
    const MAX_TOTAL_ATTEMPTS = 40;

    const poll = async () => {
      if (successFiredRef.current || verifyingRef.current || !aliveRef.current) return;
      const ref = orderIdRef.current;
      if (!ref) return;
      totalAttempts++;
      if (totalAttempts > MAX_TOTAL_ATTEMPTS) {
        clearInterval(fastPoll);
        clearInterval(slowPoll);
        return;
      }
      try {
        const { status, data } = await verifyDonationPayment(ref);
        if (!data) {
          consecutiveNotFound++;
          if (consecutiveNotFound >= MAX_CONSECUTIVE_404) clearInterval(fastPoll);
          return;
        }
        consecutiveNotFound = 0;
        if (status === "paid") {
          clearInterval(fastPoll);
          clearInterval(slowPoll);
          applyOutcome("paid");
        } else if (status === "failed") {
          clearInterval(fastPoll);
          clearInterval(slowPoll);
          applyOutcome("failed");
        }
      } catch {
        // silent
      }
    };

    const fastPoll = setInterval(poll, 1500);
    const slowPoll = setInterval(poll, 6000);

    return () => {
      aliveRef.current = false;
      clearTimeout(loadTimer);
      clearInterval(fastPoll);
      clearInterval(slowPoll);
      window.removeEventListener("message", handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId, sessionUrl]);

  if (!isOpen) return null;

  const amountDisplay = `${Number(amount).toLocaleString("ar-EG")} ${currency === "EGP" ? "ج.م" : currency}`;

  const copyRef = (ref: string) => {
    try {
      void navigator.clipboard?.writeText(ref);
      toast({ title: "تم نسخ رقم العملية", description: ref });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-lg h-[86vh] max-h-[700px] rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kashier-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 id="kashier-modal-title" className="text-sm font-bold text-foreground leading-tight">
                بوابة الدفع الآمن
              </h3>
              <p className="text-xs text-muted-foreground">{amountDisplay}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 w-full bg-white overflow-hidden">
          {(loading || verifying) && !error && !pendingRef && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-gray-700">
                {verifying ? "جارٍ التحقق من عملية الدفع..." : "جاري فتح بوابة الدفع الآمنة..."}
              </p>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 grid place-items-center">
                <X className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-red-600 max-w-md">{error}</p>
              <Button variant="outline" size="sm" onClick={buildUrl} className="gap-1.5 text-xs font-bold">
                <RefreshCw className="h-3.5 w-3.5" />
                إعادة المحاولة
              </Button>
            </div>
          ) : pendingRef ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 grid place-items-center">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-base font-black text-gray-900">جارٍ التحقق من عملية الدفع</p>
              <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
                لم نتمكن بعد من تأكيد الدفع من الخادم. احتفظ برقم العملية، وسيتم تحديث الحالة تلقائيًا فور وصول تأكيد بوابة الدفع.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span dir="ltr" className="font-mono text-sm font-black text-gray-900">{pendingRef}</span>
                <button
                  type="button"
                  onClick={() => copyRef(pendingRef)}
                  className="text-gray-500 hover:text-emerald-600 cursor-pointer"
                  aria-label="نسخ رقم العملية"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => void verifyWithBackend(4)}
                  className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  إعادة التحقق
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
                  <Link to={`/donate/status/${encodeURIComponent(pendingRef)}`} onClick={onClose}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    متابعة حالة العملية
                  </Link>
                </Button>
              </div>
            </div>
          ) : checkoutUrl ? (
            <iframe
              ref={iframeRef}
              key={checkoutUrl}
              src={checkoutUrl}
              title="Kashier Secure Checkout"
              className="w-full h-full border-0"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-downloads"
              allow="payment *; publickey-credentials-get *"
              onLoad={() => {
                iframeLoadCount.current += 1;
                setLoading(false);
                // A second navigation inside the iframe usually means Kashier
                // redirected after checkout. That is a hint only: ask the backend.
                if (iframeLoadCount.current >= 2) {
                  void verifyWithBackend();
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
