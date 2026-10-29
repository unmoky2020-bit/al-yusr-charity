/**
 * Payment gateway transactions (Paymob / Kashier attempts) — replaces the Supabase table
 * `payment_transactions` and the edge function `paymob-create-payment`.
 *
 * PROPOSED:  GET   /payment-transactions?status=&method=&search=
 *            PATCH /payment-transactions/{id}         { internal_notes }
 *            POST  /payment-transactions/{id}/retry   -> { redirect_url }
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import { apiFetch } from "@/data/laravelApi";
import { fetchList, sendJson } from "./adminApiHelpers";

export interface PaymentTransaction {
  id: string;
  ref_code: string;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  provider: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  redirect_url: string | null;
  internal_notes: string | null;
  retry_count: number;
  last_error: string | null;
  created_at: string;
}

const s = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

function normalize(r: Record<string, unknown>): PaymentTransaction {
  return {
    id: String(r.id),
    ref_code: String(r.ref_code ?? r.reference ?? r.id ?? ""),
    status: String(r.status ?? "pending"),
    amount: Number(r.amount ?? 0) || 0,
    currency: String(r.currency ?? "EGP"),
    method: s(r.method),
    provider: String(r.provider ?? r.gateway ?? ""),
    donor_name: s(r.donor_name),
    donor_email: s(r.donor_email),
    donor_phone: s(r.donor_phone),
    redirect_url: s(r.redirect_url),
    internal_notes: s(r.internal_notes),
    retry_count: Number(r.retry_count ?? 0) || 0,
    last_error: s(r.last_error),
    created_at: String(r.created_at ?? ""),
  };
}

export const paymentTransactionsApi = {
  async list(filters: { status?: string; method?: string; search?: string } = {}): Promise<PaymentTransaction[]> {
    const rows = await fetchList<Record<string, unknown>>("/payment-transactions", { per_page: 200, ...filters });
    return rows.map(normalize);
  },
  updateNotes(id: string, internal_notes: string) {
    return sendJson<Record<string, unknown>>(`/payment-transactions/${id}`, "PATCH", { internal_notes });
  },
  /** Server creates a fresh gateway payment for the same donation and increments retry_count. */
  async retry(id: string): Promise<{ redirect_url: string | null }> {
    const res = await apiFetch<Record<string, unknown>>(`/payment-transactions/${id}/retry`, { method: "POST", body: {} });
    const d = ((res?.data as Record<string, unknown>) ?? res ?? {}) as Record<string, unknown>;
    return { redirect_url: s(d.redirect_url ?? d.payment_url ?? d.url) };
  },
};
