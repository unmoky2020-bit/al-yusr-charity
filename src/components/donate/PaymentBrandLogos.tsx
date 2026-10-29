import React from "react";
import { Truck } from "lucide-react";

/**
 * شعارات رسمية وموحدة لشركات وطرق الدفع بأيقونة واحدة واضحة لكل طريقة
 */

export const VodafoneCashLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/images/payments/vodafone.svg"
      alt="Vodafone Cash"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const InstaPayLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/images/payments/instapay.png"
      alt="InstaPay"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const BankMisrLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/images/payments/banque-misr.svg"
      alt="Banque Misr"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const CibLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img src="/images/payments/cib.svg" alt="CIB" className="h-full w-auto max-h-full object-contain" loading="lazy" />
  </div>
);

/** Any other bank: a neutral bank mark (never another bank's logo). */
export const GenericBankLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 text-primary ${className}`} aria-label="Bank">
    <svg viewBox="0 0 24 24" className="h-full w-auto" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" />
    </svg>
  </div>
);

/**
 * أيقونة موحدة فردية أنيقة للبطاقات البنكية بدلاً من تكديس 3 شعارات
 */
export const SingleCardLogo = ({ className = "h-5 sm:h-6" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/images/payments/bank-card.svg"
      alt="بطاقة بنكية"
      className="h-full w-auto max-h-full object-contain drop-shadow-2xs"
      loading="lazy"
    />
  </div>
);

export const KashierLogo = ({ className = "h-5 sm:h-6" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
    <img
      src="/images/payments/kashier.svg"
      alt="Kashier"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const DelegateLogo = ({
  className = "h-6 sm:h-7",
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) => (
  <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
    <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-secondary/15 text-secondary">
      <Truck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
    </div>
    {showText && <span className="text-xs font-black text-primary">مندوب اليسر</span>}
  </div>
);

export const StripeLogo = ({ className = "h-5" }: { className?: string }) => (
  <div className={`inline-flex items-center shrink-0 ${className}`}>
    <img src="/images/payments/stripe.svg" alt="Stripe" className="h-full w-auto max-h-full object-contain" />
  </div>
);

export const FawryLogo = ({ className = "h-6" }: { className?: string }) => (
  <div className={`inline-flex items-center shrink-0 ${className}`}>
    <span className="inline-block rounded-md bg-[#FFB703] px-2 py-0.5 text-xs font-black text-[#023047]">
      fawry
    </span>
  </div>
);

/**
 * Resolver يعيد الشعار المناسب بأيقونة واحدة نظيفة بناءً على طريقة الدفع
 */
export const PaymentBrandIcon = ({
  methodKey = "",
  provider = "",
  className = "h-5 sm:h-6",
  showText = false,
}: {
  methodKey?: string;
  provider?: string | null;
  className?: string;
  showText?: boolean;
}) => {
  const k = (methodKey || "").toLowerCase();
  const p = (provider || "").toLowerCase();

  if (k.includes("vodafone") || p.includes("vodafone")) {
    return <VodafoneCashLogo className={className} />;
  }
  if (k.includes("instapay") || p.includes("instapay")) {
    return <InstaPayLogo className={className} />;
  }
  if (k.includes("kashier") || p.includes("kashier")) {
    return <KashierLogo className={className} />;
  }
  if (k.includes("fawry") || p.includes("fawry")) {
    return <FawryLogo className={className} />;
  }
  // Banks: the logo of the account's bank (keys like "bank_cib"); never Banque Misr for another bank.
  if (k.includes("cib") || p.includes("cib")) {
    return <CibLogo className={className} />;
  }
  if (k.includes("misr")) {
    return <BankMisrLogo className={className} />;
  }
  if (k.includes("bank")) {
    return <GenericBankLogo className={className} />;
  }
  if (k.includes("delegate") || k.includes("pickup") || k.includes("mandoub")) {
    return <DelegateLogo className={className} showText={showText} />;
  }
  if (k.includes("stripe") || p.includes("stripe")) {
    return <StripeLogo className={className} />;
  }

  // الافتراضي للبطاقات البنكية: أيقونة واحدة أنيقة وموحدة
  return <SingleCardLogo className={className} />;
};

// Aliases for backwards compatibility
export const CardBrandsLogo = SingleCardLogo;
