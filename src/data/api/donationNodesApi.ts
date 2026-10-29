/**
 * Donation tree nodes (program → project → campaign → option) — PROPOSED Laravel resource.
 * Replaces the old Supabase `donation_nodes` table. See backend-handoff/02-replace-supabase-admin.md.
 *
 *   GET    /donation-nodes?parent_id=<id|null>
 *   POST   /donation-nodes
 *   PUT    /donation-nodes/{id}
 *   DELETE /donation-nodes/{id}
 */
import { fetchList, sendJson } from "./adminApiHelpers";

export type DonationNodeType = "sector" | "program" | "project" | "campaign" | "option";

export interface DonationNode {
  id: number | string;
  parent_id: number | string | null;
  type: DonationNodeType;
  slug: string;
  title_ar: string;
  title_en: string | null;
  amount: number | null;
  active: boolean;
  direct_checkout: boolean;
  sort_order: number;
}

export type DonationNodeInput = Partial<Omit<DonationNode, "id">>;

function normalize(n: DonationNode): DonationNode {
  return {
    ...n,
    amount: n.amount === null || n.amount === undefined ? null : Number(n.amount),
    active: Boolean(n.active),
    direct_checkout: Boolean(n.direct_checkout),
    sort_order: Number(n.sort_order ?? 0),
  };
}

export const donationNodesApi = {
  /** Children of `parentId`; pass null for root nodes. */
  async listChildren(parentId: number | string | null): Promise<DonationNode[]> {
    const rows = await fetchList<DonationNode>("/donation-nodes", { parent_id: parentId ?? "null" });
    return rows.map(normalize).sort((a, b) => a.sort_order - b.sort_order);
  },
  /** Every node (used by the story editor's "related program" select). */
  async listAll(params?: Record<string, unknown>): Promise<DonationNode[]> {
    const rows = await fetchList<DonationNode>("/donation-nodes", { per_page: 500, ...(params || {}) });
    return rows.map(normalize).sort((a, b) => a.sort_order - b.sort_order);
  },
  create(input: DonationNodeInput) {
    return sendJson<DonationNode>("/donation-nodes", "POST", input);
  },
  update(id: number | string, input: DonationNodeInput) {
    return sendJson<DonationNode>(`/donation-nodes/${id}`, "PUT", input);
  },
  remove(id: number | string) {
    return sendJson<void>(`/donation-nodes/${id}`, "DELETE");
  },
};
