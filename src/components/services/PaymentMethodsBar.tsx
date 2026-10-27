import { Copy, CheckCircle2, ShieldCheck, Smartphone, CreditCard, Wallet } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/i18n/LangContext";

/** Visual-only payment options bar (Kashier, Vodafone Cash, InstaPay) with copy-to-clipboard for wallet/IPA. */
const METHODS = [
  {
    id: "paymob",
    Icon: CreditCard,
    ar: "Kashier — بطاقة فيزا/ماستركارد",
    en: "Kashier — Visa/Mastercard",
    note_ar: "ادفع بأمان عبر بوابة كاشير (Kashier) المعتمدة.",
    note_en: "Pay securely via the Kashier gateway.",
    badge_ar: "آمن",
    badge_en: "Secure",
    color: "from-[hsl(20_90%_55%)] to-[hsl(35_95%_60%)]",
  },
  {
    id: "vodafone",
    Icon: Smartphone,
    ar: "Vodafone Cash",
    en: "Vodafone Cash",
    note_ar: "حوّل المبلغ على الرقم ثم أرسل إيصال التحويل على واتساب.",
    note_en: "Send the amount to the number, then share the receipt on WhatsApp.",
    value: "01097000137",
    color: "from-[hsl(0_85%_55%)] to-[hsl(15_90%_60%)]",
  },
  
] as const;

export const PaymentMethodsBar = ({ compact = false }: { compact?: boolean }) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (id: string, value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };
  return (
    <div className={compact ? "" : "rounded-3xl border border-border bg-card p-4 shadow-soft md:p-6"}>
      {!compact && (
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          <span className="text-sm font-extrabold text-primary">
            {isRTL ? "اختر وسيلة الدفع المناسبة لك" : "Choose your preferred payment method"}
          </span>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-3">
        {METHODS.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-center gap-2.5">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${m.color} text-white shadow-soft`}>
                <m.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-primary">{isRTL ? m.ar : m.en}</div>
                {"value" in m && m.value && (
                  <button
                    type="button"
                    onClick={() => copy(m.id, (m as any).value)}
                    className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-foreground/80 transition hover:bg-secondary/30"
                    aria-label={isRTL ? "نسخ" : "Copy"}
                  >
                    {copied === m.id ? <CheckCircle2 className="h-3 w-3 text-secondary" /> : <Copy className="h-3 w-3" />}
                    {(m as any).value}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{isRTL ? m.note_ar : m.note_en}</p>
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="mt-4 text-[11px] text-muted-foreground">
          {isRTL
            ? "بعد التحويل، أرسل صورة الإيصال على واتساب 01097000137 لإصدار إيصال رسمي ومتابعة تنفيذ التبرع."
            : "After transferring, send the receipt to WhatsApp +20 109 700 0137 to receive an official receipt and tracking."}
        </p>
      )}
    </div>
  );
};

export default PaymentMethodsBar;