import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Copy, Heart, Loader2, Lock, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { useToast } from "@/hooks/use-toast";
import { trackDonationStarted } from "@/lib/track";
import { createDonation, GENERAL_PROGRAM_ID } from "@/data/casesApi";
import { donationsStore } from "@/data/donationsStore";
import { KashierCheckoutModal } from "@/components/donate/KashierCheckoutModal";
import { usePaymentOptions, type PayoutDestination } from "@/data/paymentOptions";

type MethodId = "card_kashier" | "vodafone_cash" | "instapay" | "bank_transfer";

/** How each method looks here; which ones are offered comes from the dashboard (usePaymentOptions). */
const METHODS: { id: MethodId; ar: string; en: string; noteAr: string; noteEn: string; logo: string; manual: boolean }[] = [
  { id: "card_kashier", ar: "بطاقة بنكية أو محفظة", en: "Card or mobile wallet", noteAr: "دفع فوري عبر كاشير", noteEn: "Instant via Kashier", logo: "/images/payments/kashier.svg", manual: false },
  { id: "instapay", ar: "إنستاباي", en: "InstaPay", noteAr: "تحويل لحظي", noteEn: "Instant transfer", logo: "/images/payments/instapay.png", manual: true },
  { id: "vodafone_cash", ar: "فودافون كاش", en: "Vodafone Cash", noteAr: "تحويل للمحفظة", noteEn: "Wallet transfer", logo: "/images/payments/vodafone.svg", manual: true },
  { id: "bank_transfer", ar: "تحويل بنكي", en: "Bank transfer", noteAr: "حساب المؤسسة الرسمي", noteEn: "Official account", logo: "/images/payments/cib.svg", manual: true },
];

const PRESETS = [100, 250, 500, 1000];
const MIN_AMOUNT = 10;

/**
 * Home quick-donate. Card/wallet goes straight to the Kashier gateway from here
 * (no intermediate form); manual transfers continue to /donate where the
 * account details and receipt upload live.
 */
/** Copy a value to the clipboard (with a fallback for older browsers). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** One copyable line: label, value (LTR) and a copy button that confirms in place. */
const CopyRow = ({ label, value, isAr }: { label: string; value: string; isAr: boolean }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (await copyText(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-base font-black text-primary sm:text-lg" dir="ltr">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={isAr ? `نسخ ${label}` : `Copy ${label}`}
        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-colors ${copied ? "bg-primary text-primary-foreground" : "bg-secondary/20 text-primary hover:bg-secondary/35"}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}
      </button>
    </div>
  );
};

export const Donate = () => {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<MethodId>("card_kashier");
  // Only the methods active in the dashboard («طرق الدفع»); a hidden method disappears here too.
  const { options } = usePaymentOptions();
  const offered = METHODS.filter((m) => options.some((o) => o.id === m.id));
  useEffect(() => {
    if (!offered.some((m) => m.id === method) && offered[0]) setMethod(offered[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  const [processing, setProcessing] = useState(false);
  /** Name optional (empty = «فاعل خير»); phone required so the team can confirm the donation. */
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [checkout, setCheckout] = useState<{ open: boolean; orderId: string; sessionUrl?: string }>({ open: false, orderId: "" });
  const idemKey = useRef(`quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const selected = offered.find((m) => m.id === method) ?? offered[0] ?? METHODS[0];
  /** Where to send a manual transfer (numbers / IPA / bank accounts come only from the dashboard). */
  const destinations: PayoutDestination[] = options.find((o) => o.id === selected.id)?.destinations ?? [];
  const valid = amount >= MIN_AMOUNT;
  const phoneOk = /^(\+?\d{8,15}|01\d{9})$/.test(donorPhone.replace(/[\s-]/g, ""));
  const fmt = (n: number) => n.toLocaleString(isAr ? "ar-EG" : "en-US");

  const pickPreset = (v: number) => { setAmount(v); setCustom(""); };
  const onCustom = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 7);
    setCustom(digits);
    setAmount(Number(digits) || 0);
  };

  const submit = async () => {
    if (!valid || processing) return;
    if (!selected.manual && !phoneOk) return;
    trackDonationStarted({ amount, method, source: "home-quick" });

    if (selected.manual) {
      // The transfer details are shown right here; the donor sends the transfer receipt on WhatsApp.
      const msg = isAr
        ? `السلام عليكم، حوّلت ${fmt(amount)} جنيه تبرعًا عامًّا عن طريق ${selected.ar}، ومرفق صورة التحويل.`
        : `Hello, I transferred ${amount} EGP as a general donation via ${selected.en}. The transfer receipt is attached.`;
      window.open(`https://wa.me/201097000137?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      return;
    }

    setProcessing(true);
    const fallbackId = `YSR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let orderId = fallbackId;
    let sessionUrl: string | undefined;
    try {
      const res: any = await createDonation({
        amount,
        donor_name: donorName.trim() || undefined,
        donor_phone: donorPhone.trim(),
        category_id: String(GENERAL_PROGRAM_ID),
        payment_method: "kashier",
        payment_status: "pending",
        message: "تبرع عام — تبرع سريع من الصفحة الرئيسية",
        idempotency_key: idemKey.current,
      });
      sessionUrl = res?.payment?.session_url;
      orderId = res?.donation?.transaction_reference || res?.ref_code || fallbackId;
    } catch (err: any) {
      setProcessing(false);
      toast({ variant: "destructive", title: isAr ? "تعذر فتح بوابة الدفع" : "Could not open checkout", description: err?.message });
      return;
    }
    setProcessing(false);
    if (!sessionUrl) {
      toast({ variant: "destructive", title: isAr ? "تعذر فتح بوابة الدفع، حاول مرة أخرى." : "Could not open checkout, please try again." });
      return;
    }
    setCheckout({ open: true, orderId, sessionUrl });
  };

  const onPaid = () => {
    donationsStore.create({
      ref: checkout.orderId,
      donor: { name: donorName.trim() || (isAr ? "فاعل خير" : "Anonymous donor"), email: "", phone: donorPhone.trim() },
      amount,
      program: "general",
      programLabel: isAr ? "تبرع عام" : "General donation",
      method: "kashier",
      status: "completed",
    });
    setCheckout((c) => ({ ...c, open: false }));
    idemKey.current = `quick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Thank-you page (animation, reference, receipt); it re-checks the payment with the backend first.
    navigate(`/donate?ref=${encodeURIComponent(checkout.orderId)}`);
  };

  const ctaLabel = !valid
    ? (isAr ? `أقل مبلغ ${fmt(MIN_AMOUNT)} جنيه` : `Minimum ${MIN_AMOUNT} EGP`)
    : !selected.manual && !phoneOk
      ? (isAr ? "اكتب رقم موبايلك للمتابعة" : "Enter your mobile number to continue")
    : selected.manual
      ? (isAr ? "حوّلت؟ أرسل صورة التحويل عبر واتساب" : "Transferred? Send the receipt on WhatsApp")
      : (isAr ? `ادفع ${fmt(amount)} جنيه الآن` : `Pay ${fmt(amount)} EGP now`);

  return (
    <section id="donate" className="relative overflow-hidden pattern-hero-luxe hero-pattern-fade py-20 text-primary-foreground md:py-28">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-black text-secondary">{isAr ? "تبرع سريع" : "Quick donate"}</p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl">{t.donate.title}</h2>
            <p className="mt-3 text-primary-foreground/85">{t.donate.subtitle}</p>
          </div>

          <div className="mt-10 rounded-2xl bg-card p-5 text-foreground shadow-card sm:p-8 md:p-10">
            {/* 1. Amount */}
            <fieldset>
              <legend className="text-sm font-black text-primary">{isAr ? "١. اختر المبلغ" : "1. Choose an amount"}</legend>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PRESETS.map((p) => {
                  const on = !custom && amount === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickPreset(p)}
                      className={`h-12 rounded-xl border-2 text-base font-black tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:border-primary/40 active:bg-muted"
                      }`}
                    >
                      {fmt(p)} <span className="text-xs font-bold opacity-80">{isAr ? "ج" : "EGP"}</span>
                    </button>
                  );
                })}
              </div>
              <label htmlFor="quick-custom" className="mt-3 block text-xs font-bold text-muted-foreground">
                {isAr ? "أو اكتب مبلغًا آخر" : "Or enter another amount"}
              </label>
              <div className="relative mt-1.5">
                <input
                  id="quick-custom"
                  inputMode="numeric"
                  value={custom}
                  onChange={(e) => onCustom(e.target.value)}
                  placeholder={isAr ? "مثال: 750" : "e.g. 750"}
                  aria-invalid={!!custom && !valid}
                  className="h-12 w-full rounded-xl border-2 border-border bg-background pe-16 ps-4 text-base font-bold tabular-nums transition-colors placeholder:font-medium placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive"
                />
                <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
              </div>
              {!!custom && !valid && (
                <p className="mt-1.5 text-xs font-bold text-destructive" role="alert">
                  {isAr ? `أقل مبلغ للتبرع ${fmt(MIN_AMOUNT)} جنيه` : `Minimum donation is ${MIN_AMOUNT} EGP`}
                </p>
              )}
            </fieldset>

            {/* 2. Method */}
            <fieldset className="mt-7">
              <legend className="text-sm font-black text-primary">{isAr ? "٢. طريقة الدفع" : "2. Payment method"}</legend>
              <div role="radiogroup" className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {offered.map((m) => {
                  const on = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setMethod(m.id)}
                      className={`flex min-h-[60px] items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        on ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-primary" : "border-muted-foreground/40"}`} aria-hidden>
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-primary">{isAr ? m.ar : m.en}</span>
                        <span className="block text-xs text-muted-foreground">{isAr ? m.noteAr : m.noteEn}</span>
                      </span>
                      <img src={m.logo} alt="" className="h-6 w-auto max-w-[64px] shrink-0 object-contain" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 3. Manual transfer: the details to copy, right here */}
            {selected.manual && (
              <fieldset className="mt-7">
                <legend className="text-sm font-black text-primary">{isAr ? "٣. حوّل إلى" : "3. Transfer to"}</legend>
                <div className="mt-3 space-y-2.5 rounded-2xl bg-muted/40 p-3 sm:p-4">
                  {destinations.length > 0 ? (
                    destinations.map((d, i) => (
                      <div key={`${d.value}-${i}`} className="space-y-2">
                        {(d.bankName || d.accountName) && (
                          <p className="text-xs font-bold text-muted-foreground">{[d.bankName, d.accountName].filter(Boolean).join(" · ")}</p>
                        )}
                        <CopyRow label={isAr ? d.labelAr : d.labelEn} value={d.value} isAr={isAr} />
                        {d.iban && <CopyRow label="IBAN" value={d.iban} isAr={isAr} />}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-muted-foreground">
                      {isAr ? "بيانات التحويل غير متاحة الآن. تواصل معنا عبر واتساب وسنرسلها إليك." : "Transfer details are not available right now. Message us on WhatsApp."}
                    </p>
                  )}
                  <CopyRow label={isAr ? "المبلغ" : "Amount"} value={String(amount)} isAr={isAr} />
                  <ol className="list-inside list-decimal space-y-1 pt-1 text-xs font-bold leading-relaxed text-muted-foreground">
                    <li>{isAr ? "انسخ الرقم وحوّل المبلغ من تطبيقك." : "Copy the number and transfer the amount from your app."}</li>
                    <li>{isAr ? "أرسل إلينا صورة التحويل عبر واتساب لنؤكد تبرعك ونرسل إليك الإيصال." : "Send us the receipt on WhatsApp so we confirm your donation and send a receipt."}</li>
                  </ol>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {isAr ? "تريد تسجيل بياناتك واختيار برنامج معيّن؟ " : "Want to register your details or pick a programme? "}
                  <Link to={`/donate?${new URLSearchParams({ amount: String(amount), method, utm_source: "home", utm_medium: "quick_donate" }).toString()}`} className="font-bold text-primary underline underline-offset-2 hover:text-accent">
                    {isAr ? "أكمِل في صفحة التبرع" : "Continue on the donation page"}
                  </Link>
                </p>
              </fieldset>
            )}

            {/* 3. Donor (card payments) */}
            {!selected.manual && (
              <fieldset className="mt-7">
                <legend className="text-sm font-black text-primary">{isAr ? "٣. بياناتك" : "3. Your details"}</legend>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "رقم الموبايل *" : "Mobile number *"}</span>
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      autoComplete="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      aria-invalid={!!donorPhone && !phoneOk}
                      className="h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-base font-bold transition-colors focus:border-primary focus:outline-none aria-[invalid=true]:border-destructive"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "الاسم (اختياري)" : "Name (optional)"}</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder={isAr ? "اتركه فارغًا للتبرع باسم فاعل خير" : "Leave empty to give anonymously"}
                      className="h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-base font-bold transition-colors focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
                {!!donorPhone && !phoneOk && (
                  <p className="mt-1.5 text-xs font-bold text-destructive" role="alert">
                    {isAr ? "رقم الموبايل غير صحيح (مثال: 01012345678)" : "Invalid mobile number (e.g. 01012345678)"}
                  </p>
                )}
              </fieldset>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!valid || processing || (!selected.manual && !phoneOk)}
              className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-grad text-base font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : selected.manual ? <WhatsAppIcon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {processing ? (isAr ? "جارٍ فتح بوابة الدفع..." : "Opening secure checkout...") : ctaLabel}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> {t.donate.secure}</span>
              <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-primary" /> {isAr ? "إيصال فوري برقم تتبع" : "Instant receipt with tracking"}</span>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {isAr ? "بإتمام التبرع فإنك توافق على " : "By donating you agree to the "}
              <Link to="/terms#donations" className="font-bold text-primary underline underline-offset-2 hover:text-accent">
                {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Portal: the section's pattern styles create a containing block that would trap position:fixed */}
      {checkout.open && createPortal(
        <KashierCheckoutModal
          isOpen={checkout.open}
          amount={amount}
          orderId={checkout.orderId}
          sessionUrl={checkout.sessionUrl}
          donorName={donorName.trim() || undefined}
          donorPhone={donorPhone.trim()}
          onClose={() => setCheckout((c) => ({ ...c, open: false }))}
          onSuccess={onPaid}
        />,
        document.body,
      )}
    </section>
  );
};
