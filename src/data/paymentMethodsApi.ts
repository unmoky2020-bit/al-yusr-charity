/**
 * Payment methods (dashboard «طرق الدفع») — GET/POST /payment-methods, GET/PUT/DELETE /payment-methods/{id}.
 *
 * Donors send money to what is stored here, so:
 *  - nothing is invented: an empty field stays empty (no placeholder numbers);
 *  - `details` has one shape per type, validated with the same rules as the backend
 *    (App\Support\PaymentDetailsRules): wallet → numbers, instant_payment → addresses, bank_transfer → accounts;
 *  - updates are partial (hiding a method sends `{is_active:false}` alone); `slug` and `type` never change;
 *  - every change to numbers/accounts is logged on the server and alerts every super-admin.
 */
import { ApiError, apiFetch, invalidateApiCache } from "@/data/laravelApi";
import { fetchItem, fetchList } from "@/data/api/adminApiHelpers";

export type PaymentMethodType = "card" | "bank_transfer" | "wallet" | "instant_payment" | "cash_pickup";

export const BANK_CODES = ["cib", "nbe", "misr", "qnb", "alexbank", "aaib", "hsbc", "adib", "faisal", "other"] as const;
export type BankCode = (typeof BANK_CODES)[number];

export const BANK_LABELS: Record<BankCode, string> = {
  cib: "البنك التجاري الدولي CIB",
  nbe: "البنك الأهلي المصري",
  misr: "بنك مصر",
  qnb: "QNB الأهلي",
  alexbank: "بنك الإسكندرية",
  aaib: "البنك العربي الأفريقي",
  hsbc: "HSBC",
  adib: "أبوظبي الإسلامي",
  faisal: "فيصل الإسلامي",
  other: "بنك آخر",
};

export interface WalletNumber { number: string; label?: string }
export interface InstaPayAddress { ipa: string; label?: string }
export interface BankAccount {
  bank_code: BankCode;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban?: string;
  swift?: string;
}

/** Structured details by type (what the backend accepts). Card / pickup details are read-only. */
export interface PaymentDetails {
  numbers?: WalletNumber[];
  addresses?: InstaPayAddress[];
  accounts?: BankAccount[];
  [legacyOrReadOnly: string]: unknown;
}

export interface PaymentMethod {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  type: PaymentMethodType | string;
  provider_ar: string | null;
  provider_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  details: PaymentDetails;
  sort_order: number;
  is_active: boolean;
}

/** Fields an update may carry (slug / type are fixed). */
export type PaymentMethodPatch = Partial<Pick<PaymentMethod,
  "name_ar" | "name_en" | "provider_ar" | "provider_en" | "description_ar" | "description_en" | "sort_order" | "is_active" | "details">>;

/* ───────────── validation (same rules as App\Support\PaymentDetailsRules) ───────────── */

export const MAX_DESTINATIONS = 5;

export const PAYMENT_RX = {
  wallet: /^01[0125][0-9]{8}$/,
  accountNumber: /^[0-9]{6,30}$/,
  iban: /^EG[0-9]{27}$/,
  swift: /^[A-Z0-9]{8}([A-Z0-9]{3})?$/,
  ipa: /^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/,
} as const;

/** Types whose details hold where donors send money (and are editable here). */
export const PAYOUT_TYPES = ["wallet", "instant_payment", "bank_transfer"] as const;
export const isPayoutType = (t: string): t is (typeof PAYOUT_TYPES)[number] => (PAYOUT_TYPES as readonly string[]).includes(t);

/** The payout list key of a type ("numbers" | "addresses" | "accounts"), or null for card / pickup. */
export function payoutKeyOf(type: string): "numbers" | "addresses" | "accounts" | null {
  if (type === "wallet") return "numbers";
  if (type === "instant_payment") return "addresses";
  if (type === "bank_transfer") return "accounts";
  return null;
}

/** Field errors keyed like the backend ("details.numbers.0.number"), Arabic messages. */
export function validatePaymentDetails(type: string, details: PaymentDetails): Record<string, string> {
  const e: Record<string, string> = {};
  const key = payoutKeyOf(type);
  if (!key) return e;
  const items = (details[key] as unknown[] | undefined) ?? [];
  if (items.length > MAX_DESTINATIONS) e[`details.${key}`] = `الحد الأقصى ${MAX_DESTINATIONS}.`;

  items.forEach((raw, i) => {
    const p = `details.${key}.${i}`;
    if (type === "wallet") {
      const n = (raw as WalletNumber).number?.trim() ?? "";
      if (!PAYMENT_RX.wallet.test(n)) e[`${p}.number`] = "رقم المحفظة لازم يكون رقم موبايل مصري صحيح (01XXXXXXXXX).";
    } else if (type === "instant_payment") {
      const a = (raw as InstaPayAddress).ipa?.trim() ?? "";
      if (!PAYMENT_RX.ipa.test(a)) e[`${p}.ipa`] = "عنوان إنستاباي لازم يكون بالشكل name@bank.";
    } else {
      const a = raw as BankAccount;
      if (!BANK_CODES.includes(a.bank_code)) e[`${p}.bank_code`] = "اختار البنك.";
      if (!a.bank_name?.trim()) e[`${p}.bank_name`] = "اسم البنك مطلوب.";
      if (!a.account_name?.trim()) e[`${p}.account_name`] = "اسم صاحب الحساب مطلوب.";
      if (!PAYMENT_RX.accountNumber.test(a.account_number?.trim() ?? "")) e[`${p}.account_number`] = "رقم الحساب لازم يكون أرقام بس (من 6 لـ 30 رقم).";
      if (a.iban && !PAYMENT_RX.iban.test(a.iban.trim())) e[`${p}.iban`] = "الـ IBAN المصري بيبدأ بـ EG وبعده 27 رقم.";
      if (a.swift && !PAYMENT_RX.swift.test(a.swift.trim())) e[`${p}.swift`] = "كود SWIFT غير صحيح.";
    }
  });
  return e;
}

/** Trim values and drop empty optional fields before sending. */
export function cleanPaymentDetails(type: string, details: PaymentDetails): PaymentDetails {
  const opt = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  if (type === "wallet") return { numbers: (details.numbers ?? []).map((n) => ({ number: n.number.trim(), label: opt(n.label) })) };
  if (type === "instant_payment") return { addresses: (details.addresses ?? []).map((a) => ({ ipa: a.ipa.trim(), label: opt(a.label) })) };
  if (type === "bank_transfer") {
    return {
      accounts: (details.accounts ?? []).map((a) => ({
        bank_code: a.bank_code,
        bank_name: a.bank_name.trim(),
        account_name: a.account_name.trim(),
        account_number: a.account_number.trim(),
        iban: opt(a.iban)?.toUpperCase(),
        swift: opt(a.swift)?.toUpperCase(),
      })),
    };
  }
  return {};
}

/** Old flat keys (wallet_number, ipa, iban, account_number, bank_name) the server held before the structured format. */
export function hasLegacyDetails(m: Pick<PaymentMethod, "type" | "details">): boolean {
  const key = payoutKeyOf(m.type);
  if (!key) return false;
  const d = m.details ?? {};
  return !Array.isArray(d[key]) && ["wallet_number", "ipa", "iban", "account_number", "bank_name"].some((k) => k in d);
}

/** The payout list of a method in the structured format ([] when missing or legacy). */
export function destinationsOf(m: Pick<PaymentMethod, "type" | "details">): (WalletNumber | InstaPayAddress | BankAccount)[] {
  const key = payoutKeyOf(m.type);
  const list = key ? (m.details ?? {})[key] : undefined;
  return Array.isArray(list) ? (list as (WalletNumber | InstaPayAddress | BankAccount)[]) : [];
}

const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : v);
const COUNT_AR = ["", "", "اتنين", "3", "4", "5"];

/** Short Arabic summary of where donors send money, e.g. «رقمين: 0109…0137، 0100…1234» / «حساب CIB ‎…5733». */
export function summarizeDestinations(m: Pick<PaymentMethod, "type" | "details">): string {
  if (hasLegacyDetails(m)) return "بيانات قديمة — اعمل حفظ بالشكل الجديد";
  const items = destinationsOf(m);
  if (m.type === "card") return "بوابة دفع إلكتروني";
  if (m.type === "cash_pickup") return "تحصيل من البيت";
  if (!items.length) return "مفيش أرقام أو حسابات — مش هتظهر للمتبرع";
  if (m.type === "wallet") {
    const nums = (items as WalletNumber[]).map((n) => mask(n.number)).join("، ");
    return items.length === 1 ? `رقم: ${nums}` : items.length === 2 ? `رقمين: ${nums}` : `${COUNT_AR[items.length]} أرقام: ${nums}`;
  }
  if (m.type === "instant_payment") return (items as InstaPayAddress[]).map((a) => a.ipa).join("، ");
  return (items as BankAccount[])
    .map((a) => `حساب ${a.bank_code === "other" ? a.bank_name : a.bank_code.toUpperCase()} ‎…${a.account_number.slice(-4)}`)
    .join("، ");
}

/** Old → new lines for the confirmation shown before payout details are saved. */
export function describePayoutChange(type: string, before: PaymentDetails, after: PaymentDetails): { before: string[]; after: string[] } {
  const key = payoutKeyOf(type);
  const lines = (d: PaymentDetails) => {
    const list = key && Array.isArray(d[key]) ? (d[key] as unknown[]) : [];
    return list.map((x) => {
      if (type === "wallet") return (x as WalletNumber).number;
      if (type === "instant_payment") return (x as InstaPayAddress).ipa;
      const a = x as BankAccount;
      return `${a.bank_name} — ${a.account_number}${a.iban ? ` — ${a.iban}` : ""}`;
    });
  };
  return { before: lines(before), after: lines(after) };
}

/* ───────────── API ───────────── */

function normalize(r: Record<string, unknown>): PaymentMethod {
  const details = r.details && typeof r.details === "object" && !Array.isArray(r.details) ? (r.details as PaymentDetails) : {};
  return {
    id: Number(r.id),
    name_ar: String(r.name_ar ?? ""),
    name_en: String(r.name_en ?? ""),
    slug: String(r.slug ?? ""),
    type: String(r.type ?? ""),
    provider_ar: (r.provider_ar as string) ?? null,
    provider_en: (r.provider_en as string) ?? null,
    description_ar: (r.description_ar as string) ?? null,
    description_en: (r.description_en as string) ?? null,
    details,
    sort_order: Number(r.sort_order ?? 0) || 0,
    is_active: r.is_active === undefined ? true : Boolean(r.is_active),
  };
}

const done = () => {
  invalidateApiCache("/payment-methods");
};

export const paymentMethodsApi = {
  async list(): Promise<PaymentMethod[]> {
    const rows = await fetchList<Record<string, unknown>>("/payment-methods", { per_page: 100 });
    return rows.map(normalize).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  },
  async get(id: number | string): Promise<PaymentMethod> {
    return normalize(await fetchItem<Record<string, unknown>>(`/payment-methods/${id}`));
  },
  /**
   * Update; returns the server's record and its message (e.g. «بانتظار الموافقة» for editors).
   * The current API requires name_ar / name_en / slug / type on every PUT, so the stored values are
   * re-sent unchanged with the patch (slug and type are never taken from the patch).
   */
  async update(id: number | string, patch: PaymentMethodPatch): Promise<{ method: PaymentMethod | null; message?: string }> {
    const current = await paymentMethodsApi.get(id);
    const body = { name_ar: current.name_ar, name_en: current.name_en, ...patch, slug: current.slug, type: current.type };
    const res = await apiFetch<{ data?: Record<string, unknown>; message?: string }>(`/payment-methods/${id}`, { method: "PUT", body });
    done();
    const data = (res as { data?: Record<string, unknown> })?.data;
    return { method: data && "id" in data ? normalize(data) : null, message: (res as { message?: string })?.message };
  },
  setActive(id: number | string, is_active: boolean) {
    return paymentMethodsApi.update(id, { is_active });
  },
  async create(input: Omit<PaymentMethod, "id">): Promise<PaymentMethod | null> {
    const res = await apiFetch<{ data?: Record<string, unknown> }>("/payment-methods", { method: "POST", body: input });
    done();
    const data = res?.data;
    return data && "id" in data ? normalize(data) : null;
  },
  async remove(id: number | string): Promise<void> {
    await apiFetch(`/payment-methods/${id}`, { method: "DELETE" });
    done();
  },
};

/** Server validation errors (422) as {field: first message}, keys like "details.numbers.0.number". */
export function serverFieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.errors) return {};
  return Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]));
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  card: "بوابة دفع إلكتروني",
  wallet: "محفظة موبايل",
  instant_payment: "إنستاباي",
  bank_transfer: "تحويل بنكي",
  cash_pickup: "مندوب تحصيل",
};
