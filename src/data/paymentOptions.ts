/**
 * Payment options shown to donors — the ACTIVE methods of the dashboard («طرق الدفع»), read from
 * GET /payment-methods/active. Numbers and accounts come only from there: nothing is invented when a
 * field is empty (a method without a destination is not shown), so a donor never sees a number that
 * is not the foundation's.
 *
 * Option ids are stable keys used across the form and createDonation:
 *   card_kashier · vodafone_cash · orange_cash · instapay · bank_transfer · delegate_pickup
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/data/laravelApi";

export type PaymentOptionKind = "gateway" | "wallet" | "instant" | "bank" | "pickup";

/** One place to send money (a wallet number, an IPA address, a bank account). */
export interface PayoutDestination {
  value: string;
  labelAr: string;
  labelEn: string;
  /** Bank accounts: bank code (cib, nbe, misr…) for the logo, account holder, IBAN/SWIFT. */
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  iban?: string;
  swift?: string;
}

export interface PaymentOption {
  id: string;
  kind: PaymentOptionKind;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  destinations: PayoutDestination[];
  sortOrder: number;
}

type ApiMethod = {
  id: number;
  slug: string;
  type: string;
  name_ar?: string;
  name_en?: string;
  provider_ar?: string | null;
  provider_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  details?: Record<string, unknown> | null;
  sort_order?: number | null;
  is_active?: boolean;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);

/** Option id for a backend method, or null when the form has no flow for it (e.g. a second card gateway). */
export function optionIdOf(m: Pick<ApiMethod, "slug" | "type">): string | null {
  const slug = m.slug.toLowerCase();
  if (m.type === "card") return slug.includes("kashier") ? "card_kashier" : null;
  if (m.type === "cash_pickup") return "delegate_pickup";
  if (m.type === "bank_transfer") return "bank_transfer";
  if (m.type === "instant_payment") return "instapay";
  if (m.type === "wallet") return slug.includes("vodafone") ? "vodafone_cash" : slug.includes("orange") ? "orange_cash" : slug.replace(/-/g, "_");
  return null;
}

function destinationsOf(m: ApiMethod): PayoutDestination[] {
  const d = m.details ?? {};
  if (m.type === "wallet") {
    return list(d.numbers).map((n) => ({ value: str(n.number), labelAr: str(n.label) || "رقم التحويل", labelEn: str(n.label) || "Transfer to" })).filter((x) => /^01\d{9}$/.test(x.value));
  }
  if (m.type === "instant_payment") {
    return list(d.addresses).map((a) => ({ value: str(a.ipa), labelAr: str(a.label) || "عنوان إنستاباي (IPA)", labelEn: str(a.label) || "InstaPay IPA" })).filter((x) => x.value.includes("@"));
  }
  if (m.type === "bank_transfer") {
    return list(d.accounts)
      .map((a) => ({
        value: str(a.account_number),
        labelAr: "رقم الحساب",
        labelEn: "Account number",
        bankCode: str(a.bank_code) || "other",
        bankName: str(a.bank_name),
        accountName: str(a.account_name),
        iban: str(a.iban) || undefined,
        swift: str(a.swift) || undefined,
      }))
      .filter((x) => /^\d{6,30}$/.test(x.value));
  }
  return [];
}

const KIND: Record<string, PaymentOptionKind> = {
  card: "gateway", wallet: "wallet", instant_payment: "instant", bank_transfer: "bank", cash_pickup: "pickup",
};

/** Pure mapper (exported for tests): active methods → options, in dashboard order. */
export function toPaymentOptions(rows: ApiMethod[]): PaymentOption[] {
  const seen = new Set<string>();
  return rows
    .filter((m) => m && m.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .flatMap((m) => {
      const id = optionIdOf(m);
      const kind = KIND[m.type];
      if (!id || !kind || seen.has(id)) return [];
      const destinations = destinationsOf(m);
      // A transfer method with nowhere to send money is not offered.
      if ((kind === "wallet" || kind === "instant" || kind === "bank") && destinations.length === 0) return [];
      seen.add(id);
      return [{
        id,
        kind,
        nameAr: str(m.name_ar) || id,
        nameEn: str(m.name_en) || str(m.name_ar) || id,
        descriptionAr: str(m.description_ar),
        descriptionEn: str(m.description_en),
        destinations,
        sortOrder: m.sort_order ?? 0,
      }];
    });
}

/** Used while loading or when the API is unreachable: online card + home pickup only (no account numbers). */
export const FALLBACK_PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "card_kashier", kind: "gateway", nameAr: "بطاقة بنكية", nameEn: "Bank card", descriptionAr: "", descriptionEn: "", destinations: [], sortOrder: 0 },
  { id: "delegate_pickup", kind: "pickup", nameAr: "مندوب اليسر", nameEn: "Al-Yusr delegate", descriptionAr: "", descriptionEn: "", destinations: [], sortOrder: 1 },
];

export async function fetchPaymentOptions(): Promise<PaymentOption[]> {
  const res = await apiFetch<{ data?: ApiMethod[] } | ApiMethod[]>("/payment-methods/active", { method: "GET", ttlMs: 60_000 });
  const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return toPaymentOptions(rows);
}

/** Active payment options for the donation forms (fallback while loading / offline). */
export function usePaymentOptions(): { options: PaymentOption[]; isLoading: boolean; fromApi: boolean } {
  const q = useQuery({ queryKey: ["payment-options"], queryFn: fetchPaymentOptions, staleTime: 60_000, retry: 1 });
  const options = q.data && q.data.length ? q.data : FALLBACK_PAYMENT_OPTIONS;
  return { options, isLoading: q.isLoading, fromApi: !!q.data?.length };
}

const BANK_SHORT: Record<string, string> = {
  cib: "CIB", nbe: "NBE", misr: "Banque Misr", qnb: "QNB", alexbank: "AlexBank", aaib: "AAIB", hsbc: "HSBC", adib: "ADIB", faisal: "Faisal",
};

/** "CIB: 100043605733" — the short form pages use in a sentence. */
export const bankAccountLabel = (d: PayoutDestination): string =>
  `${BANK_SHORT[d.bankCode ?? ""] || d.bankName || ""}: ${d.value}`.replace(/^: /, "");

/**
 * The foundation's bank accounts shown on content pages (footer, About, Zakat, Trust…), from the same
 * dashboard source as the donation form. Empty while loading, offline, or when bank transfer is hidden —
 * pages then leave the number out rather than show one that may be out of date.
 */
export function useBankAccounts(): PayoutDestination[] {
  const { options, fromApi } = usePaymentOptions();
  return fromApi ? options.find((o) => o.kind === "bank")?.destinations ?? [] : [];
}
