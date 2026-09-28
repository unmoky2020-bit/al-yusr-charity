import React from "react";
import { Truck } from "lucide-react";

/**
 * شعارات رسمية وحديثة لشركات الدفع باستخدام الصور الرسمية الدقيقة
 */

export const VodafoneCashLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
    <img
      src="/images/payments/vodafone.svg"
      alt="Vodafone Cash"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const InstaPayLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center shrink-0 ${className}`}>
    <img
      src="/images/payments/instapay.png"
      alt="InstaPay"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const BankMisrLogo = ({ className = "h-6 sm:h-7" }: { className?: string }) => (
  <div className={`inline-flex items-center shrink-0 ${className}`}>
    <img
      src="/images/payments/banque-misr.svg"
      alt="Banque Misr"
      className="h-full w-auto max-h-full object-contain"
      loading="lazy"
    />
  </div>
);

export const CardBrandsLogo = ({ className = "h-4.5 sm:h-5" }: { className?: string }) => (
  <div className={`inline-flex items-center justify-center gap-1 shrink-0 max-w-full ${className}`}>
    <img src="/images/payments/visa.svg" alt="Visa" className="h-3.5 sm:h-4 w-auto object-contain shrink-0" />
    <img src="/images/payments/mastercard.svg" alt="Mastercard" className="h-3.5 sm:h-4 w-auto object-contain shrink-0" />
    <img src="/images/payments/meeza.svg" alt="Meeza" className="h-3.5 sm:h-4 w-auto object-contain shrink-0" />
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
 * Resolver يعيد الشعار المناسب بناءً على مفتاح أو مزود طريقة الدفع
 */
export const PaymentBrandIcon = ({
  methodKey = "",
  provider = "",
  className = "h-6 sm:h-7",
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
  if (k.includes("fawry") || p.includes("fawry")) {
    return <FawryLogo className={className} />;
  }
  if (k.includes("card") || k.includes("credit") || k.includes("visa") || p === "paymob") {
    return <CardBrandsLogo className={className} />;
  }
  if (k.includes("stripe") || p.includes("stripe")) {
    return <StripeLogo className={className} />;
  }
  if (k.includes("bank") || k.includes("misr") || k.includes("cib") || k.includes("adib")) {
    return <BankMisrLogo className={className} />;
  }
  if (k.includes("delegate") || k.includes("pickup") || k.includes("mandoub")) {
    return <DelegateLogo className={className} showText={showText} />;
  }

  return <CardBrandsLogo className={className} />;
};
