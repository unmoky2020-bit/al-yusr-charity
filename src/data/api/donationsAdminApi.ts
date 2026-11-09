/**
 * Dashboard donations API — one typed client for /admin/donations, /admin and /admin/analytics.
 *
 *   GET /donations        server-side pagination + filters (App\Support\DonationFilters)
 *   GET /donations/stats  totals over ALL matching donations (same filters)
 *   GET /dashboard        headline counts (money = paid only)
 *
 * Every number on those pages comes from here; nothing is summed from the current page in the browser.
 */
import { apiFetch, invalidateApiCache } from "@/data/laravelApi";

export type DonationStatusKey = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type TargetKind = "program" | "project" | "campaign" | "case";

/** Query-string filters understood by GET /donations and GET /donations/stats. */
export interface DonationFilters {
  status?: string; // comma list
  payment_method_id?: string; // comma list
  channel?: "gateway" | "manual";
  target?: TargetKind;
  program_id?: string;
  project_id?: string;
  donation_campaign_id?: string;
  case_id?: string;
  from?: string; // Y-m-d
  to?: string; // Y-m-d
  q?: string;
  sort?: "-created_at" | "created_at" | "-amount" | "amount";
}

export const DONATION_FILTER_KEYS: (keyof DonationFilters)[] = [
  "status", "payment_method_id", "channel", "target", "program_id", "project_id",
  "donation_campaign_id", "case_id", "from", "to", "q", "sort",
];

const CHANNELS = ["gateway", "manual"] as const;
const TARGETS = ["program", "project", "campaign", "case"] as const;
const SORTS = ["-created_at", "created_at", "-amount", "amount"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_LIST_RE = /^\d+(,\d+)*$/;

/** Filters → query params: empty / invalid values are dropped, so the URL stays short and the API never sees junk. */
export function filtersToParams(f: DonationFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of DONATION_FILTER_KEYS) {
    const raw = f[key];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) continue;
    if ((key === "from" || key === "to") && !DATE_RE.test(v)) continue;
    if (key === "channel" && !(CHANNELS as readonly string[]).includes(v)) continue;
    if (key === "target" && !(TARGETS as readonly string[]).includes(v)) continue;
    if (key === "sort" && (v === "-created_at" || !(SORTS as readonly string[]).includes(v))) continue; // default sort
    if (["program_id", "project_id", "donation_campaign_id", "case_id", "payment_method_id"].includes(key) && !ID_LIST_RE.test(v)) continue;
    out[key] = v;
  }
  return out;
}

/** URL search params → filters (the inverse of filtersToParams; unknown keys ignored). */
export function filtersFromSearch(sp: URLSearchParams): DonationFilters {
  const raw: Record<string, string> = {};
  for (const key of DONATION_FILTER_KEYS) {
    const v = sp.get(key);
    if (v) raw[key] = v;
  }
  return filtersToParams(raw as DonationFilters) as DonationFilters;
}

/* ───────────── rows ───────────── */

export interface AdminDonation {
  id: number;
  transaction_reference: string;
  status: DonationStatusKey | string;
  amount: string | number;
  is_gateway: boolean;
  payment_method_id?: number | null;
  payment_method_type?: string | null;
  payment_method_details?: { id: number; name_ar?: string; name_en?: string; type?: string } | null;
  donor?: { id: number; name?: string | null; email?: string | null; phone?: string | null } | null;
  program?: { id: number; name?: string; name_ar?: string; name_en?: string } | null;
  project?: { id: number; name?: string; name_en?: string } | null;
  donation_campaign?: { id: number; name_ar?: string; name_en?: string; slug?: string } | null;
  case?: { id: number; code?: string; title?: string } | null;
  donation_package?: { id: number; name_ar?: string; name_en?: string; amount?: string | number } | null;
  payment_reference?: string | null;
  payment_receipt?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface DonationPage {
  rows: AdminDonation[];
  meta: PageMeta;
}

/* ───────────── stats ───────────── */

export interface MoneyCount {
  count: number;
  amount: number;
}

export interface DonationStats {
  currency: string;
  total_count: number;
  paid: { count: number; amount: number; average: number; donors: number };
  by_status: Partial<Record<DonationStatusKey, MoneyCount>> & Record<string, MoneyCount>;
  success_rate: number | null;
  by_channel: { gateway: MoneyCount; manual: MoneyCount };
  by_method: { payment_method_id: number | null; name_ar: string; name_en: string; type: string | null; count: number; paid_count: number; paid_amount: number }[];
  by_target: Record<TargetKind, { id: number; name: string; count: number; amount: number }[]>;
  monthly: { month: string; count: number; amount: number }[];
}

/** GET /dashboard → statistics (money = paid only). */
export interface DashboardCounts {
  total_donations: number;
  paid_donations: number;
  pending_donations: number;
  failed_donations: number;
  donations: number;
  users: number;
  donors: number;
  paying_donors: number;
  volunteers: number;
  pending_volunteers: number;
  approved_volunteers: number;
  rejected_volunteers: number;
  programs: number;
  active_programs: number;
  projects: number;
  active_projects: number;
  campaigns: number;
  active_campaigns: number;
  approved_cases: number;
  pending_cases: number;
}

export interface PaymentMethodOption {
  id: number;
  name_ar: string;
  name_en?: string;
  type?: string;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toPageMeta = (m: Record<string, unknown> | undefined, rows: number): PageMeta => ({
  current_page: num(m?.current_page) || 1,
  last_page: num(m?.last_page) || 1,
  per_page: num(m?.per_page) || rows,
  total: num(m?.total),
  from: m?.from == null ? null : num(m.from),
  to: m?.to == null ? null : num(m.to),
});

export const donationsAdminApi = {
  async list(filters: DonationFilters, page = 1, perPage = 25): Promise<DonationPage> {
    const res = await apiFetch<{ data?: AdminDonation[]; meta?: Record<string, unknown> }>("/donations", {
      params: { ...filtersToParams(filters), page, per_page: perPage },
      useCache: false,
    });
    const rows = Array.isArray(res?.data) ? res.data : [];
    return { rows, meta: toPageMeta(res?.meta, rows.length) };
  },

  async stats(filters: DonationFilters = {}): Promise<DonationStats> {
    const res = await apiFetch<{ data: DonationStats }>("/donations/stats", {
      params: filtersToParams(filters),
      useCache: false,
    });
    return res.data;
  },

  async dashboard(): Promise<DashboardCounts> {
    const res = await apiFetch<{ statistics?: Record<string, unknown> }>("/dashboard", { useCache: false });
    const s = res?.statistics ?? {};
    const keys: (keyof DashboardCounts)[] = [
      "total_donations", "paid_donations", "pending_donations", "failed_donations", "donations", "users", "donors",
      "paying_donors", "volunteers", "pending_volunteers", "approved_volunteers", "rejected_volunteers", "programs",
      "active_programs", "projects", "active_projects", "campaigns", "active_campaigns", "approved_cases", "pending_cases",
    ];
    return Object.fromEntries(keys.map((k) => [k, num(s[k])])) as unknown as DashboardCounts;
  },

  async paymentMethods(): Promise<PaymentMethodOption[]> {
    const res = await apiFetch<{ data?: PaymentMethodOption[] }>("/payment-methods", { params: { per_page: 100 }, ttlMs: 60_000 });
    return Array.isArray(res?.data) ? res.data : [];
  },

  /**
   * PATCH /donations/{id}/status — allowed transitions only (pending→paid|failed, failed→pending,
   * paid→refunded); logged on the server. Marking an online (card) donation paid by hand needs
   * `confirmGateway` (the admin checked the money in the gateway account). Throws the server's
   * Arabic message when the change is refused. Resolves with the stored status.
   */
  async setStatus(id: number | string, status: DonationStatusKey, opts?: { confirmGateway?: boolean; note?: string }): Promise<string> {
    const res = await apiFetch<{ data?: { status?: string } }>(`/donations/${id}/status`, {
      method: "PATCH",
      body: { status, confirm_gateway: !!opts?.confirmGateway, note: opts?.note || undefined },
    });
    invalidateApiCache("/donations");
    return String(res?.data?.status ?? "");
  },

  /** Every row matching the filters (pages of 100, capped) — for CSV export. */
  async listAllMatching(filters: DonationFilters, maxRows = 5000): Promise<AdminDonation[]> {
    const out: AdminDonation[] = [];
    let page = 1;
    for (;;) {
      const { rows, meta } = await this.list(filters, page, 100);
      out.push(...rows);
      if (page >= meta.last_page || out.length >= maxRows) break;
      page += 1;
    }
    return out.slice(0, maxRows);
  },
};
