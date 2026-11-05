import { useState } from "react";
import { X, ExternalLink, ShieldCheck, Lock, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymobCheckoutModalProps {
  isOpen: boolean;
  clientSecret: string;
  publicKey?: string;
  amount: number;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymobCheckoutModal({
  isOpen,
  clientSecret,
  publicKey,
  amount,
  currency = "EGP",
  onClose,
}: PaymobCheckoutModalProps) {
  const [loading, setLoading] = useState(true);

  if (!isOpen || !clientSecret) return null;

  // Use provided publicKey or fallback to public env var
  const effectivePublicKey =
    publicKey ||
    import.meta.env.VITE_PAYMOB_PUBLIC_KEY ||
    "";

  // Construct Paymob Unified Checkout URL
  // If publicKey is present, standard format:
  // https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}
  const checkoutUrl = effectivePublicKey
    ? `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(effectivePublicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`
    : `https://accept.paymob.com/unifiedcheckout/?clientSecret=${encodeURIComponent(clientSecret)}`;

  const openInNewTab = () => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-fade-in text-start">
      <div
        className="relative flex flex-col w-full max-w-2xl h-[92vh] max-h-[780px] rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paymob-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/70 bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/15 text-blue-600 border border-blue-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="paymob-modal-title" className="text-sm sm:text-base font-black text-primary">
                  بوابة الدفع الإلكتروني — Paymob
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black border border-emerald-500/25">
                  <ShieldCheck className="h-3 w-3" />
                  3D-Secure مؤمّن
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold">
                المبلغ المطلوب سداده: <strong className="text-primary font-black">{amount.toLocaleString()} {currency}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1 border-border/70 hover:bg-muted cursor-pointer"
              title="فتح في نافذة كاملة جديدة"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">نافذة كاملة</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-primary transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Security Alert Strip */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 bg-blue-500/5 border-b border-blue-500/15 text-[11px] text-blue-700 dark:text-blue-300 font-bold shrink-0">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-blue-600" />
            معاملتك مشفرة وفق معايير PCI-DSS المصرفية (فيزا، ماستركارد، ميزة)
          </span>
          <span className="hidden md:inline text-[10px] text-muted-foreground">
            لا نحتفظ بأي بيانات خاصة ببطاقتك
          </span>
        </div>

        {/* Iframe Body with Loading Overlay */}
        <div className="relative flex-1 w-full bg-background overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/95">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              <p className="text-xs sm:text-sm font-bold text-primary">
                جارٍ الاتصال الآمن بخادم Paymob...
              </p>
              <p className="text-[11px] text-muted-foreground">
                يُرجى الانتظار لحظات حتى تُفتح شاشة إدخال بيانات البطاقة
              </p>
            </div>
          )}

          <iframe
            src={checkoutUrl}
            title="Paymob Checkout"
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            allow="payment *"
          />
        </div>

        {/* Footer fallback */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-border/60 bg-muted/20 text-xs shrink-0">
          <span className="text-muted-foreground text-[11px]">
            تواجه مشكلة في العرض داخل الصفحة؟
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="h-7 text-xs font-black text-secondary hover:underline cursor-pointer p-0"
          >
            اضغط هنا لفتح الدفع في صفحة مستقلة ←
          </Button>
        </div>
      </div>
    </div>
  );
}
