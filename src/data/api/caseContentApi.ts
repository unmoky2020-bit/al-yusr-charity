/**
 * Case updates / media / documents / journey → Laravel.
 *
 * Live since 2026-10-29 (CaseContentController). The timeline (/journey) is computed by the
 * backend from the case and its updates. They replaced the old Supabase tables
 * case_updates, case_media, case_documents and donation_journey_steps.
 *
 * Every function throws ApiError on non-2xx (apiFetch), so admin screens can show a real
 * error and public pages decide themselves to fall back to an empty list.
 */
import { apiFetch, formatServerImageUrl, invalidateApiCache } from "@/data/laravelApi";
import type {
  CaseDocumentRow, CaseMediaKind, CaseMediaRow, CaseUpdateRow, JourneyStepRow,
} from "./caseTypes";

type Raw = Record<string, unknown>;

/** Accepts `[...]`, `{ data: [...] }` or `{ data: { data: [...] } }` (paginated). */
function unwrapList(res: unknown): Raw[] {
  if (Array.isArray(res)) return res as Raw[];
  const d = (res as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as Raw[];
  const dd = (d as { data?: unknown } | null)?.data;
  return Array.isArray(dd) ? (dd as Raw[]) : [];
}

function unwrapOne(res: unknown): Raw {
  const d = (res as { data?: unknown } | null)?.data;
  return ((d && typeof d === "object" && !Array.isArray(d) ? d : res) ?? {}) as Raw;
}

const str = (v: unknown): string => (v == null ? "" : String(v));
const strOrNull = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
const fileUrl = (v: unknown): string => formatServerImageUrl(strOrNull(v)) || str(v);
const nowIso = () => new Date().toISOString();

function toUpdate(r: Raw, caseId: string): CaseUpdateRow {
  const img = r.image_url ?? r.image;
  return {
    id: str(r.id),
    case_id: str(r.case_id ?? caseId),
    body: str(r.body ?? r.content),
    image_url: strOrNull(img) ? fileUrl(img) : null,
    author_id: strOrNull(r.author_id ?? r.created_by),
    created_at: str(r.created_at || nowIso()),
  };
}

function toMedia(r: Raw, caseId: string): CaseMediaRow {
  return {
    id: str(r.id),
    case_id: str(r.case_id ?? caseId),
    url: fileUrl(r.url ?? r.file ?? r.path),
    kind: (r.kind as CaseMediaKind) || "other",
    caption_ar: strOrNull(r.caption_ar),
    caption_en: strOrNull(r.caption_en),
    is_public: r.is_public === undefined ? true : Boolean(r.is_public),
    sort_order: Number(r.sort_order ?? 0),
    uploaded_by: strOrNull(r.uploaded_by),
    created_at: str(r.created_at || nowIso()),
    updated_at: str(r.updated_at || r.created_at || nowIso()),
  };
}

function toDocument(r: Raw, caseId: string): CaseDocumentRow {
  return {
    id: str(r.id),
    case_id: str(r.case_id ?? caseId),
    storage_path: fileUrl(r.url ?? r.storage_path ?? r.path),
    doc_type: str(r.doc_type || "other"),
    caption: strOrNull(r.caption),
    is_public: r.is_public === undefined ? true : Boolean(r.is_public),
    uploaded_by: strOrNull(r.uploaded_by),
    created_at: str(r.created_at || nowIso()),
  };
}

function toJourney(r: Raw, caseId: string): JourneyStepRow {
  return {
    id: str(r.id),
    case_id: strOrNull(r.case_id ?? caseId),
    donation_id: strOrNull(r.donation_id),
    step_key: (r.step_key as JourneyStepRow["step_key"]) || "created",
    title_ar: str(r.title_ar),
    title_en: str(r.title_en),
    note_ar: strOrNull(r.note_ar),
    note_en: strOrNull(r.note_en),
    media_url: strOrNull(r.media_url) ? fileUrl(r.media_url) : null,
    occurred_at: str(r.occurred_at || r.created_at || nowIso()),
    is_public: r.is_public === undefined ? true : Boolean(r.is_public),
    created_by: strOrNull(r.created_by),
    created_at: str(r.created_at || nowIso()),
    updated_at: str(r.updated_at || r.created_at || nowIso()),
  };
}

const enc = (id: string | number) => encodeURIComponent(String(id));

// ── Case updates ────────────────────────────────────────────────────────────
export async function fetchCaseUpdates(caseId: string): Promise<CaseUpdateRow[]> {
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/updates`, { method: "GET", ttlMs: 30_000 });
  return unwrapList(res).map((r) => toUpdate(r, caseId));
}

export async function createCaseUpdate(caseId: string, body: string, image_url?: string | null): Promise<CaseUpdateRow> {
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/updates`, {
    method: "POST",
    body: { body, image_url: image_url || null },
  });
  invalidateApiCache(`/cases/${caseId}`);
  return toUpdate(unwrapOne(res), caseId);
}

export async function patchCaseUpdate(id: string, patch: { body?: string; image_url?: string | null }): Promise<CaseUpdateRow> {
  const res = await apiFetch<unknown>(`/case-updates/${enc(id)}`, { method: "PUT", body: patch });
  invalidateApiCache("/cases/");
  const row = unwrapOne(res);
  return toUpdate(row, str(row.case_id));
}

export async function removeCaseUpdate(id: string): Promise<void> {
  await apiFetch<unknown>(`/case-updates/${enc(id)}`, { method: "DELETE" });
  invalidateApiCache("/cases/");
}

// ── Case media ──────────────────────────────────────────────────────────────
/** Public list (only is_public = true). With `all: true` (staff token) the backend also returns private items. */
export async function fetchCaseMedia(caseId: string, opts: { all?: boolean } = {}): Promise<CaseMediaRow[]> {
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/media`, {
    method: "GET",
    params: opts.all ? { all: 1 } : undefined,
    useCache: !opts.all,
    ttlMs: 30_000,
  });
  return unwrapList(res)
    .map((r) => toMedia(r, caseId))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Upload a file only (no media row) — used for images attached to case updates. Returns its public URL. */
export async function uploadCaseFile(file: File | Blob, caseId: string): Promise<{ url: string; path: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/media/upload`, { method: "POST", body: fd });
  const r = unwrapOne(res);
  const path = str(r.path ?? r.url);
  const u = fileUrl(r.url ?? r.path);
  if (!u) throw new Error("لم يرجع الخادم رابط الملف المرفوع");
  return { url: u, path };
}

export interface CaseMediaInput {
  file?: File | Blob;
  url?: string;
  kind?: CaseMediaKind;
  caption_ar?: string | null;
  caption_en?: string | null;
  is_public?: boolean;
  sort_order?: number;
}

/** Create a media row: multipart when a file is given, JSON when only a URL is given. */
export async function createCaseMedia(caseId: string, input: CaseMediaInput): Promise<CaseMediaRow> {
  let body: FormData | Record<string, unknown>;
  if (input.file) {
    const fd = new FormData();
    fd.append("file", input.file);
    fd.append("kind", input.kind ?? "other");
    if (input.caption_ar) fd.append("caption_ar", input.caption_ar);
    if (input.caption_en) fd.append("caption_en", input.caption_en);
    fd.append("is_public", input.is_public === false ? "0" : "1");
    fd.append("sort_order", String(input.sort_order ?? 0));
    body = fd;
  } else {
    body = {
      url: input.url,
      kind: input.kind ?? "other",
      caption_ar: input.caption_ar ?? null,
      caption_en: input.caption_en ?? null,
      is_public: input.is_public !== false,
      sort_order: input.sort_order ?? 0,
    };
  }
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/media`, { method: "POST", body });
  invalidateApiCache(`/cases/${caseId}`);
  return toMedia(unwrapOne(res), caseId);
}

export async function patchCaseMedia(
  id: string,
  patch: Partial<Pick<CaseMediaRow, "kind" | "caption_ar" | "caption_en" | "is_public" | "sort_order" | "url">>,
): Promise<CaseMediaRow> {
  const res = await apiFetch<unknown>(`/case-media/${enc(id)}`, { method: "PUT", body: patch });
  invalidateApiCache("/cases/");
  const row = unwrapOne(res);
  return toMedia(row, str(row.case_id));
}

export async function removeCaseMedia(id: string): Promise<void> {
  await apiFetch<unknown>(`/case-media/${enc(id)}`, { method: "DELETE" });
  invalidateApiCache("/cases/");
}

export async function reorderCaseMediaItems(caseId: string, ids: string[]): Promise<void> {
  await apiFetch<unknown>(`/cases/${enc(caseId)}/media/reorder`, { method: "POST", body: { ids } });
  invalidateApiCache(`/cases/${caseId}`);
}

// ── Documents & journey (read-only on the public side) ──────────────────────
export async function fetchCaseDocuments(caseId: string): Promise<CaseDocumentRow[]> {
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/documents`, { method: "GET", ttlMs: 60_000 });
  return unwrapList(res).map((r) => toDocument(r, caseId));
}

/** POST /cases/{id}/documents (multipart): PDF or image, max 10 MB. Private unless is_public. */
export async function createCaseDocument(
  caseId: string,
  input: { file: File; doc_type?: string; caption?: string | null; is_public?: boolean },
): Promise<CaseDocumentRow> {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("doc_type", input.doc_type || "other");
  if (input.caption) fd.append("caption", input.caption);
  fd.append("is_public", input.is_public ? "1" : "0");
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/documents`, { method: "POST", body: fd });
  invalidateApiCache(`/cases/${caseId}`);
  return toDocument(unwrapOne(res), caseId);
}

export async function removeCaseDocument(id: string): Promise<void> {
  await apiFetch<unknown>(`/case-documents/${enc(id)}`, { method: "DELETE" });
  invalidateApiCache("/cases/");
}

export async function fetchCaseJourney(caseId: string): Promise<JourneyStepRow[]> {
  const res = await apiFetch<unknown>(`/cases/${enc(caseId)}/journey`, { method: "GET", ttlMs: 30_000 });
  return unwrapList(res)
    .map((r) => toJourney(r, caseId))
    .filter((s) => s.is_public)
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
}
