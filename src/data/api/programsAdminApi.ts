/**
 * Admin API wrappers for PROGRAMS and PROJECTS (full-field editing), agent C1.
 *
 * Existing Laravel endpoints (backend-handoff/_postman_endpoints.txt + live GET):
 *   GET/POST /programs, GET/PUT/DELETE /programs/{id}
 *   GET/POST /programs/{id}/donation-packages
 *   GET/POST /programs/{id}/page-sections
 *   PUT/DELETE /programs/{id}/page-sections/{sectionId}
 *   PATCH /programs/{id}/page-sections/{sectionId}/toggle
 *   PUT /programs/{id}/top-section
 *   GET/POST /projects, GET/PUT/DELETE /projects/{id}
 *   GET/POST /projects/{id}/donation-packages
 *
 * PROPOSED endpoints (documented in backend-handoff/04-programs-projects.md). The UI calls them and,
 * while the backend does not have them yet, shows "يحتاج تفعيل من الباك إند" (never a fake success):
 *   PUT    /{programs|projects}/{id}/donation-packages/{packageId}
 *   DELETE /{programs|projects}/{id}/donation-packages/{packageId}
 *   POST   /{programs|projects}/{id}/donation-packages/reorder   (live since 2026-10-29)
 *
 * All calls throw on failure (no silent empty arrays), so screens can surface real errors.
 */
import { apiFetch, ApiError, invalidateApiCache } from "@/data/laravelApi";

export const NEEDS_BACKEND_AR = "يحتاج تفعيل من الباك إند";

// ─────────────────────────────────────────────────────────────────────────────
// Types (field names exactly as returned by the live API)
// ─────────────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProgramTopSection {
  badge_ar?: string | null;
  breadcrumb?: { home_ar?: string | null; programs_ar?: string | null; current_ar?: string | null } | null;
  title_ar?: string | null;
  title_en?: string | null;
  subtitle_ar?: string | null;
  subtitle_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  image?: string | null;
  primary_button_ar?: string | null;
  whatsapp_button_ar?: string | null;
  minimum_amount?: number | string | null;
  currency_ar?: string | null;
  donation_available?: boolean | null;
  [extra: string]: unknown;
}

export interface ProgramPageSection {
  id: number;
  program_id?: number;
  section_key: string;
  title_ar?: string | null;
  title_en?: string | null;
  subtitle_ar?: string | null;
  subtitle_en?: string | null;
  content_ar?: unknown;
  content_en?: unknown;
  settings?: unknown;
  is_enabled?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type PageSectionInput = Omit<ProgramPageSection, "id" | "program_id" | "created_at" | "updated_at">;

export interface DonationPackageRow {
  id: number;
  program_id?: number | null;
  project_id?: number | null;
  name_ar: string;
  name_en?: string | null;
  amount: number | string;
  sort_order?: number | null;
  is_active?: boolean;
}

export interface DonationPackageInput {
  name_ar: string;
  name_en?: string | null;
  amount: number;
  sort_order?: number;
  is_active?: boolean;
}

/** Full program record (GET /programs/{id}). Unknown extra keys are kept. */
export interface AdminProgramRecord {
  /** FAQ category whose questions the public page shows (null = the general fallback). */
  faq_category_id?: number | null;
  faq_category?: { id: number; slug: string; name_ar?: string } | null;
  id: number;
  slug?: string | null;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  hero_h1_ar?: string | null;
  hero_h1_en?: string | null;
  hero_h3_ar?: string | null;
  hero_h3_en?: string | null;
  hero_image?: string | null;
  top_section?: ProgramTopSection | null;
  page_sections?: ProgramPageSection[];
  axis_id?: number | null;
  axis?: { id: number; slug?: string; name_ar?: string; name_en?: string } | null;
  seasons?: Array<{ id: number; name_ar?: string; name_en?: string }>;
  season_ids?: number[];
  period_ar?: string | null;
  period_en?: string | null;
  tagline_ar?: string | null;
  tagline_en?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  content_ar?: string | null;
  content_en?: string | null;
  benefits_ar?: string[] | null;
  benefits_en?: string[] | null;
  image?: string | null;
  donation_available?: boolean;
  target_amount?: number | string | null;
  collected_amount?: number | string | null;
  minimum_amount?: number | string | null;
  donation_packages?: DonationPackageRow[];
  meta_title_ar?: string | null;
  meta_title_en?: string | null;
  meta_description_ar?: string | null;
  meta_description_en?: string | null;
  keywords_ar?: string | null;
  keywords_en?: string | null;
  canonical_url?: string | null;
  schema_type?: string | null;
  twitter_card?: string | null;
  noindex?: boolean;
  nofollow?: boolean;
  geo_region?: string | null;
  geo_placename?: string | null;
  geo_position?: string | null;
  geo_position_label?: string | null;
  ai_summary_ar?: string | null;
  ai_summary_en?: string | null;
  ai_faq_ar?: unknown;
  ai_faq_en?: unknown;
  status?: string | null;
  is_active?: boolean;
  hide_from_audience?: boolean;
  sort_order?: number | null;
  [extra: string]: unknown;
}

/**
 * Project record (GET /projects/{id}). The live API returns only the first block of keys;
 * everything else the editor sends is PROPOSED (see backend-handoff/04-programs-projects.md).
 */
export interface AdminProjectRecord {
  /** FAQ category whose questions the public page shows (null = the general fallback). */
  faq_category_id?: number | null;
  faq_category?: { id: number; slug: string; name_ar?: string } | null;
  id: number;
  name?: string | null;
  name_en?: string | null;
  slug?: string | null;
  description?: string | null;
  short_description?: string | null;
  short_description_en?: string | null;
  target_amount?: number | string | null;
  collected_amount?: number | string | null;
  starting_price?: number | string | null;
  display_order?: number | null;
  cover_image?: string | null;
  is_active?: boolean;
  donation_packages?: DonationPackageRow[];
  [extra: string]: unknown;
}

export type PackageOwnerKind = "programs" | "projects";

// ─────────────────────────────────────────────────────────────────────────────
// Error helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True when the endpoint itself is missing on the backend (404 route / 405 method). */
export function isMissingEndpoint(err: unknown): boolean {
  const status = err instanceof ApiError ? err.status : (err as { status?: number } | null)?.status;
  return status === 404 || status === 405;
}

/** Arabic, human-readable error for a failed admin write. */
export function apiErrorMessageAr(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.status === 405) return `${NEEDS_BACKEND_AR} (HTTP ${err.status})`;
    if (err.status === 0) return err.message || "تعذر الاتصال بالخادم";
    if (err.status === 401) return "انتهت الجلسة، سجّل الدخول مرة أخرى";
    if (err.status === 403) return "ليس لديك صلاحية لهذا الإجراء";
    if (err.status === 422) return `بيانات غير مقبولة من الخادم: ${err.message}`;
    if (err.status >= 500) return `خطأ في الخادم (HTTP ${err.status}): ${err.message}`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "حدث خطأ غير معروف";
}

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && !Array.isArray(res) && "data" in (res as Record<string, unknown>)) {
    const inner = (res as { data?: unknown }).data;
    if (inner !== undefined && inner !== null && typeof inner === "object") return inner as T;
  }
  return res as T;
}

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const inner = (res as { data?: unknown } | null)?.data;
  if (Array.isArray(inner)) return inner as T[];
  const deeper = (inner as { data?: unknown } | null | undefined)?.data;
  if (Array.isArray(deeper)) return deeper as T[];
  return [];
}

/** Upload a single file field with Laravel's method spoofing (POST + _method=PUT). */
async function uploadFileField<T>(path: string, field: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("_method", "PUT");
  fd.append(field, file);
  const res = await apiFetch<unknown>(path, { method: "POST", body: fd, useCache: false });
  return unwrap<T>(res);
}

// ─────────────────────────────────────────────────────────────────────────────
// Programs
// ─────────────────────────────────────────────────────────────────────────────

export const programsAdminApi = {
  async get(id: number | string): Promise<AdminProgramRecord> {
    return unwrap<AdminProgramRecord>(await apiFetch(`/programs/${id}`, { useCache: false }));
  },
  async create(payload: Record<string, unknown>): Promise<AdminProgramRecord> {
    const res = await apiFetch(`/programs`, { method: "POST", body: payload });
    invalidateApiCache("/programs");
    return unwrap<AdminProgramRecord>(res);
  },
  async update(id: number | string, payload: Record<string, unknown>): Promise<AdminProgramRecord> {
    const res = await apiFetch(`/programs/${id}`, { method: "PUT", body: payload });
    invalidateApiCache("/programs");
    return unwrap<AdminProgramRecord>(res);
  },
  /** Upload `image` or `hero_image` as a real file (multipart, _method=PUT). */
  async uploadImage(id: number | string, field: "image" | "hero_image", file: File): Promise<AdminProgramRecord> {
    const rec = await uploadFileField<AdminProgramRecord>(`/programs/${id}`, field, file);
    invalidateApiCache("/programs");
    return rec;
  },
  async remove(id: number | string): Promise<void> {
    await apiFetch(`/programs/${id}`, { method: "DELETE" });
    invalidateApiCache("/programs");
  },
  /** EXISTS: PUT /programs/{id}/top-section  body: { top_section: {...} } */
  async updateTopSection(id: number | string, topSection: ProgramTopSection): Promise<unknown> {
    const res = await apiFetch(`/programs/${id}/top-section`, { method: "PUT", body: { top_section: topSection } });
    invalidateApiCache("/programs");
    return unwrap<unknown>(res);
  },

  // ── Page sections (all existing) ──
  async listSections(programId: number | string): Promise<ProgramPageSection[]> {
    return unwrapList<ProgramPageSection>(await apiFetch(`/programs/${programId}/page-sections`, { useCache: false }));
  },
  async createSection(programId: number | string, body: PageSectionInput): Promise<ProgramPageSection> {
    const res = await apiFetch(`/programs/${programId}/page-sections`, { method: "POST", body });
    invalidateApiCache("/programs");
    return unwrap<ProgramPageSection>(res);
  },
  async updateSection(programId: number | string, sectionId: number, body: PageSectionInput): Promise<ProgramPageSection> {
    const res = await apiFetch(`/programs/${programId}/page-sections/${sectionId}`, { method: "PUT", body });
    invalidateApiCache("/programs");
    return unwrap<ProgramPageSection>(res);
  },
  async toggleSection(programId: number | string, sectionId: number, isEnabled: boolean): Promise<unknown> {
    const res = await apiFetch(`/programs/${programId}/page-sections/${sectionId}/toggle`, {
      method: "PATCH",
      body: { is_enabled: isEnabled },
    });
    invalidateApiCache("/programs");
    return res;
  },
  async deleteSection(programId: number | string, sectionId: number): Promise<void> {
    await apiFetch(`/programs/${programId}/page-sections/${sectionId}`, { method: "DELETE" });
    invalidateApiCache("/programs");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

export const projectsAdminApi = {
  async get(id: number | string): Promise<AdminProjectRecord> {
    return unwrap<AdminProjectRecord>(await apiFetch(`/projects/${id}`, { useCache: false }));
  },
  async create(payload: Record<string, unknown>): Promise<AdminProjectRecord> {
    const res = await apiFetch(`/projects`, { method: "POST", body: payload });
    invalidateApiCache("/projects");
    return unwrap<AdminProjectRecord>(res);
  },
  async update(id: number | string, payload: Record<string, unknown>): Promise<AdminProjectRecord> {
    const res = await apiFetch(`/projects/${id}`, { method: "PUT", body: payload });
    invalidateApiCache("/projects");
    return unwrap<AdminProjectRecord>(res);
  },
  async uploadCover(id: number | string, file: File): Promise<AdminProjectRecord> {
    const rec = await uploadFileField<AdminProjectRecord>(`/projects/${id}`, "cover_image", file);
    invalidateApiCache("/projects");
    return rec;
  },
  async remove(id: number | string): Promise<void> {
    await apiFetch(`/projects/${id}`, { method: "DELETE" });
    invalidateApiCache("/projects");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Donation packages (programs + projects share the same shape)
// ─────────────────────────────────────────────────────────────────────────────

export const donationPackagesAdminApi = {
  /** EXISTS: GET /{kind}/{id}/donation-packages */
  async list(kind: PackageOwnerKind, ownerId: number | string): Promise<DonationPackageRow[]> {
    return unwrapList<DonationPackageRow>(await apiFetch(`/${kind}/${ownerId}/donation-packages`, { useCache: false }));
  },
  /** EXISTS: POST /{kind}/{id}/donation-packages */
  async add(kind: PackageOwnerKind, ownerId: number | string, body: DonationPackageInput): Promise<DonationPackageRow> {
    const res = await apiFetch(`/${kind}/${ownerId}/donation-packages`, { method: "POST", body });
    invalidateApiCache(`/${kind}`);
    return unwrap<DonationPackageRow>(res);
  },
  /** PROPOSED: PUT /{kind}/{id}/donation-packages/{packageId} */
  async update(
    kind: PackageOwnerKind,
    ownerId: number | string,
    packageId: number,
    body: Partial<DonationPackageInput>,
  ): Promise<DonationPackageRow> {
    const res = await apiFetch(`/${kind}/${ownerId}/donation-packages/${packageId}`, { method: "PUT", body });
    invalidateApiCache(`/${kind}`);
    return unwrap<DonationPackageRow>(res);
  },
  /** PROPOSED: DELETE /{kind}/{id}/donation-packages/{packageId} */
  async remove(kind: PackageOwnerKind, ownerId: number | string, packageId: number): Promise<void> {
    await apiFetch(`/${kind}/${ownerId}/donation-packages/${packageId}`, { method: "DELETE" });
    invalidateApiCache(`/${kind}`);
  },
  /** POST /{kind}/{id}/donation-packages/reorder  body: { packages: [{ id, sort_order }] } (live since 2026-10-29) */
  async reorder(
    kind: PackageOwnerKind,
    ownerId: number | string,
    order: Array<{ id: number; sort_order: number }>,
  ): Promise<unknown> {
    const res = await apiFetch(`/${kind}/${ownerId}/donation-packages/reorder`, {
      method: "POST",
      body: { packages: order },
    });
    invalidateApiCache(`/${kind}`);
    return res;
  },
};
