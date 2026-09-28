export type PaymentMethodRow = {
  id: string;
  key: string;
  kind: "manual" | "gateway";
  provider: string | null;
  label_ar: string;
  label_en: string;
  account_label_ar: string | null;
  account_label_en: string | null;
  account_value: string | null;
  instructions_ar: string | null;
  instructions_en: string | null;
  qr_image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodRow[] = [
  {
    id: "pm-vodafone-cash",
    key: "vodafone_cash",
    kind: "manual",
    provider: "Vodafone",
    label_ar: "فودافون كاش",
    label_en: "Vodafone Cash",
    account_label_ar: "رقم المحفظة",
    account_label_en: "Wallet Number",
    account_value: "01000000000",
    instructions_ar: "حول المبلغ على رقم المحفظة ثم أرسل صورة التحويل عبر واتساب للتأكيد.",
    instructions_en: "Transfer the amount to the wallet number and send the receipt on WhatsApp.",
    qr_image_url: null,
    active: true,
    sort_order: 1,
  },
  {
    id: "pm-instapay",
    key: "instapay",
    kind: "manual",
    provider: "InstaPay",
    label_ar: "إنستاباي InstaPay",
    label_en: "InstaPay",
    account_label_ar: "عنوان الدفع IPA",
    account_label_en: "Payment Address IPA",
    account_value: "alyusr@instapay",
    instructions_ar: "حول المبلغ مباشرة عبر تطبيق إنستاباي باستخدام عنوان الدفع.",
    instructions_en: "Transfer directly using the InstaPay application.",
    qr_image_url: null,
    active: true,
    sort_order: 2,
  },
  {
    id: "pm-paymob-card",
    key: "credit_card",
    kind: "gateway",
    provider: "Paymob",
    label_ar: "بطاقة بنكية (فيزا / ماستركارد)",
    label_en: "Credit Card (Visa / Mastercard)",
    account_label_ar: "بوابة إلكترونية آمنة",
    account_label_en: "Secure Online Gateway",
    account_value: "Paymob Online",
    instructions_ar: "دفع إلكتروني فوري وآمن ومشفر بالكامل عبر بوابة Paymob المعتمدة.",
    instructions_en: "Instant and secure encrypted payment via Paymob.",
    qr_image_url: null,
    active: true,
    sort_order: 3,
  },
  {
    id: "pm-bank-transfer",
    key: "bank_transfer",
    kind: "manual",
    provider: "Banque Misr",
    label_ar: "تحويل بنكي (بنك مصر)",
    label_en: "Bank Transfer (Banque Misr)",
    account_label_ar: "رقم الحساب (IBAN)",
    account_label_en: "Account Number (IBAN)",
    account_value: "EG00000000000000000000000000",
    instructions_ar: "التحويل على حساب مؤسسة اليسر للأعمال الخيرية ببنك مصر.",
    instructions_en: "Direct bank transfer to Al-Yusr Charity account.",
    qr_image_url: null,
    active: true,
    sort_order: 4,
  },
  {
    id: "pm-delegate",
    key: "delegate",
    kind: "manual",
    provider: "Direct Pickup",
    label_ar: "مندوب تحصيل للبيت",
    label_en: "Home Pickup Delegate",
    account_label_ar: "خدمة التوصيل والتحصيل",
    account_label_en: "Pickup Service",
    account_value: "خدمة مجانية بالدقهلية",
    instructions_ar: "يصلك مندوب المؤسسة الرسمي بإيصال استلام معتمد حتى باب منزلك.",
    instructions_en: "Our official representative arrives at your door with a stamped receipt.",
    qr_image_url: null,
    active: true,
    sort_order: 5,
  },
];

const STORAGE_KEY = "alyusr_payment_methods";

function mapLaravelPaymentMethod(m: any): PaymentMethodRow {
  const details = m.details || {};
  let accountLabelAr: string | null = null;
  let accountLabelEn: string | null = null;
  let accountValue: string | null = null;

  if (details.wallet_number !== undefined) {
    accountLabelAr = "رقم المحفظة";
    accountLabelEn = "Wallet Number";
    accountValue = details.wallet_number || "01000000000";
  } else if (details.ipa !== undefined) {
    accountLabelAr = "عنوان الدفع IPA";
    accountLabelEn = "Payment Address IPA";
    accountValue = details.ipa || "alyusr@instapay";
  } else if (details.iban !== undefined || details.account_number !== undefined) {
    accountLabelAr = "رقم الحساب (IBAN)";
    accountLabelEn = "Account Number (IBAN)";
    accountValue = details.iban || details.account_number || "EG00000000000000000000000000";
  } else if (m.type === "cash_pickup") {
    accountLabelAr = "خدمة التوصيل والتحصيل";
    accountLabelEn = "Pickup Service";
    accountValue = "خدمة مجانية بالدقهلية";
  }

  return {
    id: String(m.id),
    key: m.slug || `pm-${m.id}`,
    kind: m.type === "card" || m.type === "gateway" ? "gateway" : "manual",
    provider: m.provider_ar || m.provider_en || m.name_ar,
    label_ar: m.name_ar,
    label_en: m.name_en || m.name_ar,
    account_label_ar: accountLabelAr,
    account_label_en: accountLabelEn,
    account_value: accountValue,
    instructions_ar: m.description_ar || "",
    instructions_en: m.description_en || "",
    qr_image_url: null,
    active: m.is_active !== undefined ? Boolean(m.is_active) : true,
    sort_order: Number(m.sort_order || 0),
    created_at: m.created_at,
    updated_at: m.updated_at,
  };
}

export async function listAllPaymentMethods(): Promise<PaymentMethodRow[]> {
  try {
    const { paymentMethodsApi } = await import("@/data/laravelApi");
    const liveList = await paymentMethodsApi.listAll();
    if (Array.isArray(liveList) && liveList.length > 0) {
      const mapped = liveList.map(mapLaravelPaymentMethod);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)); } catch {}
      return mapped;
    }
  } catch (err) {
    console.warn("Could not fetch payment methods from Laravel API:", err);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_PAYMENT_METHODS];
}

export async function listActivePaymentMethods(): Promise<PaymentMethodRow[]> {
  const all = await listAllPaymentMethods();
  return all.filter((x) => x.active);
}

export async function updatePaymentMethod(id: string, patch: Partial<PaymentMethodRow>) {
  try {
    const { paymentMethodsApi } = await import("@/data/laravelApi");
    const payload: Record<string, unknown> = {};
    if (patch.label_ar) payload.name_ar = patch.label_ar;
    if (patch.label_en) payload.name_en = patch.label_en;
    if (patch.instructions_ar) payload.description_ar = patch.instructions_ar;
    if (patch.instructions_en) payload.description_en = patch.instructions_en;
    if (patch.active !== undefined) payload.is_active = patch.active;
    if (patch.sort_order !== undefined) payload.sort_order = patch.sort_order;
    if (patch.provider) { payload.provider_ar = patch.provider; payload.provider_en = patch.provider; }
    if (patch.kind) payload.type = patch.kind === "gateway" ? "card" : "manual";

    if (Object.keys(payload).length > 0 && !id.startsWith("pm-")) {
      await paymentMethodsApi.update(id, payload as any);
    }
  } catch (err) {
    console.warn("Could not update payment method on Laravel API:", err);
  }

  const all = await listAllPaymentMethods();
  const next = all.map((m) => (m.id === id ? { ...m, ...patch } : m));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function setPaymentMethodActive(id: string, active: boolean) {
  return updatePaymentMethod(id, { active });
}