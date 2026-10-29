/**
 * Donation tree (sector → program → project → campaign → option) — PUBLIC read side.
 * Replaces the Supabase `donation_nodes` reads in DonationNodeSelector, ProgramDetail,
 * ProgramOptionDetail and StoryDetail.
 *
 * Endpoints (NEW — proposed; documented in backend-handoff/01-replace-supabase-public.md,
 * admin CRUD for the same resource in 02-replace-supabase-admin.md / donationNodesApi.ts):
 *   GET /donation-nodes?parent_id=<id|null>&slug=<slug>&active=1   (public, no auth)
 *   GET /donation-nodes/{id}                                         (public, no auth)
 *
 * Content-source flag: while VITE_CONTENT_SOURCE is "static" (default) these helpers do NOT
 * call the network and return []/null — exactly what the old no-op Supabase stub returned —
 * so callers keep showing their static fallback and the public site looks the same as today.
 * In "api"/"auto" mode they call Laravel; on any error they also return []/null so the
 * callers' static fallback is used.
 */
import { apiFetch, formatServerImageUrl } from "@/data/laravelApi";
import { useApiContent } from "@/lib/contentSource";

export type PublicDonationNodeType = "sector" | "program" | "project" | "campaign" | "option";

export interface PublicDonationNode {
  id: string;
  parent_id: string | null;
  type: PublicDonationNodeType;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  amount: number | null;
  target_amount: number | null;
  collected_amount: number;
  active: boolean;
  direct_checkout: boolean;
  sort_order: number;
  /** Free-form SEO / display metadata (meta_title_ar, meta_desc_ar, og_image_url, …). */
  metadata: Record<string, unknown> | null;
}

type Raw = Record<string, unknown>;

function unwrapList(res: unknown): Raw[] {
  if (Array.isArray(res)) return res as Raw[];
  const d = (res as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as Raw[];
  const dd = (d as { data?: unknown } | null)?.data;
  return Array.isArray(dd) ? (dd as Raw[]) : [];
}

const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v);
const strOrNull = (v: unknown): string | null => (v == null || v === "" ? null : String(v));

function normalize(r: Raw): PublicDonationNode {
  let metadata: Record<string, unknown> | null = null;
  if (r.metadata && typeof r.metadata === "object") metadata = r.metadata as Record<string, unknown>;
  else if (typeof r.metadata === "string") {
    try { metadata = JSON.parse(r.metadata) as Record<string, unknown>; } catch { metadata = null; }
  }
  const img = strOrNull(r.image_url ?? r.image);
  return {
    id: String(r.id ?? ""),
    parent_id: strOrNull(r.parent_id),
    type: ((r.type as PublicDonationNodeType) || "program"),
    slug: String(r.slug ?? ""),
    title_ar: String(r.title_ar ?? ""),
    title_en: String(r.title_en ?? r.title_ar ?? ""),
    description_ar: strOrNull(r.description_ar),
    description_en: strOrNull(r.description_en),
    image_url: img ? formatServerImageUrl(img) || img : null,
    amount: numOrNull(r.amount),
    target_amount: numOrNull(r.target_amount),
    collected_amount: Number(r.collected_amount ?? 0) || 0,
    active: r.active === undefined && r.is_active === undefined ? true : Boolean(r.active ?? r.is_active),
    direct_checkout: Boolean(r.direct_checkout),
    sort_order: Number(r.sort_order ?? 0) || 0,
    metadata,
  };
}

async function query(params: Record<string, unknown>): Promise<PublicDonationNode[]> {
  if (!useApiContent) return [];
  try {
    const res = await apiFetch<unknown>("/donation-nodes", {
      method: "GET",
      params: { active: 1, ...params },
      ttlMs: 60_000,
    });
    return unwrapList(res)
      .map(normalize)
      .filter((n) => n.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[donation-nodes] API unavailable, using static fallback:", err);
    return [];
  }
}

/** Active children of `parentId` (null → root nodes), sorted by sort_order. */
export function listDonationNodeChildren(parentId: string | null): Promise<PublicDonationNode[]> {
  return query({ parent_id: parentId ?? "null" });
}

/** First active node with this slug (optionally under a given parent), or null. */
export async function getDonationNodeBySlug(slug: string, parentId?: string | null): Promise<PublicDonationNode | null> {
  const params: Record<string, unknown> = { slug };
  if (parentId !== undefined) params.parent_id = parentId ?? "null";
  const rows = await query(params);
  return rows.find((n) => n.slug === slug) ?? null;
}

/** Node by id, or null. */
export async function getDonationNodeById(id: string): Promise<PublicDonationNode | null> {
  if (!useApiContent || !id) return null;
  try {
    const res = await apiFetch<unknown>(`/donation-nodes/${encodeURIComponent(id)}`, { method: "GET", ttlMs: 60_000 });
    const d = (res as { data?: unknown } | null)?.data ?? res;
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    return normalize(d as Raw);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[donation-nodes] API unavailable:", err);
    return null;
  }
}

/** True when the node has at least one active child. */
export async function hasActiveChildren(id: string): Promise<boolean> {
  return (await listDonationNodeChildren(id)).length > 0;
}
