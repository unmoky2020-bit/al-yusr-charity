/* eslint-disable @typescript-eslint/no-explicit-any -- backend rows are mapped field by field below */
import { apiFetch } from "@/data/laravelApi";
import { parseDelivery, type DeliveryInfo } from "@/lib/deliveryJourney";

/** One of the signed-in donor's own donations, as the donor dashboard shows it. */
export interface MyDonation {
  id: string;
  ref: string;
  status: string;
  amount: number;
  method: string;
  createdAt: string;
  updatedAt?: string;
  targetKind: "case" | "program" | "campaign" | "project" | "general";
  targetName: string;
  caseId: string | null;
  caseCode: string | null;
  delivery: DeliveryInfo | null;
  isGateway: boolean;
}

function mapRow(d: any): MyDonation {
  const kind: MyDonation["targetKind"] = d.case_id || d.case
    ? "case"
    : d.program_id || d.program
      ? "program"
      : d.donation_campaign_id || d.donation_campaign
        ? "campaign"
        : d.project_id || d.project
          ? "project"
          : "general";
  const name =
    d.case?.title ||
    d.program?.name_ar || d.program?.name ||
    d.donation_campaign?.name_ar ||
    d.project?.name_ar || d.project?.name ||
    d.donation_package?.name_ar ||
    "";
  const method =
    (d.payment_method_details && (d.payment_method_details.name_ar || d.payment_method_details.data?.name_ar)) ||
    d.payment_method || "";
  return {
    id: String(d.id),
    ref: d.transaction_reference || d.reference_code || d.ref_code || `DON-${d.id}`,
    status: String(d.status || d.payment_status || "pending").toLowerCase(),
    amount: Number(d.amount || 0),
    method: String(method),
    createdAt: d.created_at || "",
    updatedAt: d.updated_at || undefined,
    targetKind: kind,
    targetName: name,
    caseId: d.case_id != null ? String(d.case_id) : d.case?.id != null ? String(d.case.id) : null,
    caseCode: d.case?.code ? String(d.case.code) : null,
    delivery: parseDelivery(d.delivery),
    isGateway: Boolean(d.is_gateway),
  };
}

/**
 * GET /donations?mine=1 — the donations made with this account (every page, newest first).
 * `mine=1` keeps an admin's donor dashboard to their own giving instead of everyone's.
 */
export async function listMyDonations(): Promise<MyDonation[]> {
  const out: MyDonation[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await apiFetch<{ data?: any[]; meta?: { last_page?: number }; last_page?: number }>("/donations", {
      method: "GET",
      params: { mine: 1, per_page: 100, page },
      useCache: false,
    });
    const rows = Array.isArray(res?.data) ? res.data : [];
    out.push(...rows.map(mapRow));
    const last = Number(res?.meta?.last_page ?? res?.last_page ?? 1);
    if (rows.length === 0 || page >= last) break;
  }
  return out;
}
