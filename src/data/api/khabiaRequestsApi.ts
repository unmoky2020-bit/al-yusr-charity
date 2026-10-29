/**
 * Khabia requests + delegate field tasks — replaces the Supabase tables `khabia_requests`,
 * `user_roles`/`profiles` (delegate list) and the private storage bucket `khabia-proofs`.
 *
 * EXISTING:  GET /users (filter `role=delegate` is NEW), GET/PUT /cases/{id}
 * PROPOSED:  GET/POST /khabia-requests, PUT /khabia-requests/{id},
 *            POST /khabia-requests/{id}/proof (multipart),
 *            cases.assigned_delegate_id / scheduled_visit_at / delegate_notes columns,
 *            GET /cases?assigned_delegate_id=me, POST /cases/{id}/updates (multipart).
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import { formatServerImageUrl } from "@/data/laravelApi";
import { fetchList, sendJson } from "./adminApiHelpers";

export type KhabiaStatus = "pending" | "scheduled" | "delivered" | "collected" | "cancelled";

export interface KhabiaRequest {
  id: string;
  ref_code: string;
  full_name: string;
  phone: string;
  city: string;
  address: string | null;
  status: KhabiaStatus | string;
  scheduled_at: string | null;
  delivered_at: string | null;
  collected_at: string | null;
  amount_collected: number | null;
  notes: string | null;
  assigned_delegate_id: string | null;
  /** Full URL (backend returns a public or temporary signed URL). */
  delivery_proof_url: string | null;
  collection_proof_url: string | null;
  created_at?: string;
}

export interface Delegate {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
}

export interface DelegateCase {
  id: string;
  ref_code: string;
  title: string;
  status: string;
  beneficiary_name: string;
  city: string | null;
  area: string | null;
  governorate: string;
  scheduled_visit_at: string | null;
  delegate_notes: string | null;
  cover_image_url: string | null;
  assigned_delegate_id: string | null;
}

const str = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));

function mapKhabia(r: Record<string, unknown>): KhabiaRequest {
  return {
    id: String(r.id),
    ref_code: String(r.ref_code ?? r.code ?? r.id ?? ""),
    full_name: String(r.full_name ?? r.name ?? ""),
    phone: String(r.phone ?? ""),
    city: String(r.city ?? ""),
    address: str(r.address),
    status: String(r.status ?? "pending"),
    scheduled_at: str(r.scheduled_at),
    delivered_at: str(r.delivered_at),
    collected_at: str(r.collected_at),
    amount_collected: r.amount_collected === null || r.amount_collected === undefined ? null : Number(r.amount_collected),
    notes: str(r.notes),
    assigned_delegate_id: str(r.assigned_delegate_id),
    delivery_proof_url: str(r.delivery_proof_url) ? formatServerImageUrl(String(r.delivery_proof_url)) : null,
    collection_proof_url: str(r.collection_proof_url) ? formatServerImageUrl(String(r.collection_proof_url)) : null,
    created_at: str(r.created_at) ?? undefined,
  };
}

function mapCase(r: Record<string, unknown>): DelegateCase {
  const cover = str(r.cover_image_url) ?? str(r.cover_image);
  return {
    id: String(r.id),
    ref_code: String(r.code ?? r.ref_code ?? r.id ?? ""),
    title: String(r.title ?? ""),
    status: String(r.status ?? "pending_review"),
    beneficiary_name: String(r.beneficiary_name ?? ""),
    city: str(r.city),
    area: str(r.area),
    governorate: String(r.governorate ?? ""),
    scheduled_visit_at: str(r.scheduled_visit_at),
    delegate_notes: str(r.delegate_notes),
    cover_image_url: cover ? formatServerImageUrl(cover) : null,
    assigned_delegate_id: str(r.assigned_delegate_id),
  };
}

export type KhabiaPatch = Partial<Pick<KhabiaRequest,
  "status" | "scheduled_at" | "delivered_at" | "collected_at" | "amount_collected" | "notes" | "assigned_delegate_id">>;

export const khabiaRequestsApi = {
  /** Admin/case manager: every request. Delegate: pass `{ assigned_delegate_id: "me" }`. */
  async list(params?: Record<string, unknown>): Promise<KhabiaRequest[]> {
    const rows = await fetchList<Record<string, unknown>>("/khabia-requests", { per_page: 500, ...(params || {}) });
    return rows.map(mapKhabia);
  },
  async update(id: string, patch: KhabiaPatch): Promise<KhabiaRequest> {
    return mapKhabia(await sendJson<Record<string, unknown>>(`/khabia-requests/${id}`, "PUT", patch));
  },
  /**
   * Upload a delivery / collection proof photo. The backend stores it (private disk),
   * sets `<kind>_proof_url` and, for kind=delivery, status=delivered + delivered_at.
   */
  async uploadProof(id: string, kind: "delivery" | "collection", file: Blob, filename = "proof.webp"): Promise<KhabiaRequest> {
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file, filename);
    return mapKhabia(await sendJson<Record<string, unknown>>(`/khabia-requests/${id}/proof`, "POST", fd));
  },
};

export const delegatesApi = {
  /** Users that hold the `delegate` role. */
  async list(): Promise<Delegate[]> {
    const rows = await fetchList<Record<string, unknown>>("/users", { role: "delegate", per_page: 500 });
    return rows
      .filter((u) => {
        const roles = (u.roles as Array<{ slug?: string; name?: string } | string> | undefined) ?? [];
        if (!roles.length && !u.role) return true; // backend already filtered
        const names = roles.map((r) => (typeof r === "string" ? r : r.slug || r.name || ""));
        if (typeof u.role === "string") names.push(u.role);
        return names.some((n) => n === "delegate");
      })
      .map((u) => ({
        id: String(u.id),
        full_name: String(u.name ?? u.full_name ?? ""),
        phone: str(u.phone),
        city: str(u.city),
      }));
  },
};

export const delegateCasesApi = {
  /** Cases assigned to a delegate. `assigned_delegate_id`: a user id, "me", or "any". */
  async list(assignedDelegateId: string): Promise<DelegateCase[]> {
    const rows = await fetchList<Record<string, unknown>>("/cases", { assigned_delegate_id: assignedDelegateId, per_page: 500 });
    const mapped = rows.map(mapCase);
    if (assignedDelegateId === "me") return mapped; // backend resolves "me" from the token
    if (assignedDelegateId === "any") return mapped.filter((c) => c.assigned_delegate_id);
    return mapped.filter((c) => c.assigned_delegate_id === assignedDelegateId);
  },
  /** Field delivery log on a case (note + optional photo). */
  async postUpdate(caseId: string, body: string, image?: Blob | null): Promise<void> {
    const fd = new FormData();
    fd.append("body", body);
    if (image) fd.append("image", image, "proof.webp");
    await sendJson(`/cases/${caseId}/updates`, "POST", fd);
  },
};
