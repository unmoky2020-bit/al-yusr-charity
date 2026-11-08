export type PaymentMethodLanguage = "ar" | "en";

type PaymentMethodLike = {
  id?: number | string | null;
  name_ar?: string | null;
  name_en?: string | null;
  slug?: string | null;
  type?: string | null;
  provider_ar?: string | null;
  provider_en?: string | null;
};

export type DonationPaymentMethodSource = {
  payment_method?: string | PaymentMethodLike | null;
  payment_method_details?: PaymentMethodLike | null;
  payment_method_id?: number | string | null;
  payment_method_type?: string | null;
  payment_details?: Record<string, unknown> | string | null;
  payment_provider?: string | null;
  provider?: string | null;
  method?: string | null;
};

const KNOWN_METHODS: Record<string, { ar: string; en: string }> = {
  "1": { ar: "بطاقة بنكية", en: "Credit card" },
  "2": { ar: "تحويل بنكي", en: "Bank transfer" },
  "3": { ar: "فودافون كاش", en: "Vodafone Cash" },
  "4": { ar: "إنستا باي", en: "InstaPay" },
  "5": { ar: "مندوب تحصيل البيت", en: "Home pickup delegate" },
  "6": { ar: "أورنج كاش", en: "Orange Cash" },
  "8": { ar: "بطاقة بنكية - كاشير", en: "Credit card - Kashier" },
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const identifier = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

function isGenericBankLabel(value: string) {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  return ["bank", "banktransfer", "directbanktransfer", "تحويلبنكي", "تحويلبنكيمباشر"].includes(normalized);
}

function isGenericMethodHint(value: string) {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  return isGenericBankLabel(value) ||
    ["card", "creditcard", "debitcard", "visa", "mastercard", "cash", "wallet"].includes(normalized);
}

function mappedLabel(value: string, language: PaymentMethodLanguage): string | null {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (!normalized) return null;
  if (normalized.includes("instapay") || value.includes("إنستا") || value.includes("انستا")) {
    return language === "ar" ? "إنستا باي" : "InstaPay";
  }
  if (normalized.includes("vodafone") || value.includes("فودافون")) {
    return language === "ar" ? "فودافون كاش" : "Vodafone Cash";
  }
  if (normalized.includes("orange") || value.includes("أورنج") || value.includes("اورنج")) {
    return language === "ar" ? "أورنج كاش" : "Orange Cash";
  }
  if (normalized.includes("kashier")) {
    return language === "ar" ? "بطاقة بنكية - كاشير" : "Credit card - Kashier";
  }
  if (normalized.includes("paymob") || normalized.includes("visa") || normalized.includes("master") || normalized.includes("card")) {
    return language === "ar" ? "بطاقة بنكية" : "Credit card";
  }
  if (normalized.includes("delegate") || normalized.includes("pickup") || value.includes("مندوب")) {
    return language === "ar" ? "مندوب تحصيل البيت" : "Home pickup delegate";
  }
  if (isGenericBankLabel(value)) {
    return language === "ar" ? "تحويل بنكي" : "Bank transfer";
  }
  return null;
}

function nestedLabel(method: PaymentMethodLike, language: PaymentMethodLanguage): string | null {
  const hints = [method.slug, method.type, method.provider_ar, method.provider_en].map(text).filter(Boolean);
  for (const hint of hints) {
    const mapped = mappedLabel(hint, language);
    if (mapped && !isGenericBankLabel(hint)) return mapped;
  }

  const localized = text(language === "ar" ? method.name_ar : method.name_en) ||
    text(language === "ar" ? method.name_en : method.name_ar);
  if (!localized) return null;
  if (isGenericBankLabel(localized)) {
    const known = KNOWN_METHODS[identifier(method.id)];
    return known ? known[language] : null;
  }
  return mappedLabel(localized, language) || localized;
}

export function donationPaymentMethodLabel(
  donation: DonationPaymentMethodSource,
  language: PaymentMethodLanguage,
): string {
  const detail = donation.payment_method_details;
  if (detail) {
    const detailLabel = nestedLabel(detail, language);
    if (detailLabel) return detailLabel;
  }

  const method = donation.payment_method;
  if (method && typeof method === "object") {
    const methodLabel = nestedLabel(method, language);
    if (methodLabel) return methodLabel;
  }

  const hints = [
    donation.payment_provider,
    donation.provider,
    donation.payment_method_type,
    typeof donation.payment_details === "string" ? donation.payment_details : "",
    donation.method,
    typeof method === "string" ? method : "",
  ].map(text).filter(Boolean);

  const id = identifier(donation.payment_method_id ?? detail?.id ?? (method && typeof method === "object" ? method.id : ""));
  const idLabel = id ? KNOWN_METHODS[id] : undefined;
  if (idLabel && hints.every(isGenericMethodHint)) return idLabel[language];

  for (const hint of hints) {
    const mapped = mappedLabel(hint, language);
    if (mapped && !isGenericMethodHint(hint)) return mapped;
  }
  if (idLabel) return idLabel[language];

  for (const hint of hints) {
    if (hint) return hint;
  }
  return language === "ar" ? "غير محدد" : "Not specified";
}
