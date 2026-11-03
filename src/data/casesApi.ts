import { apiFetch, ApiError, casesApiV1, invalidateApiCache, LaravelCase, donationsApiV1 } from "./laravelApi";
import { TARGET_FIELD, type DonationTarget } from "@/data/donationTarget";
import { donationsStore } from "@/data/donationsStore";
import type {
  CaseStatus, Urgency, CaseRow, CategoryRow, DonationRow,
  CaseUpdateRow, CaseMediaRow, CaseDocumentRow, JourneyStepRow, CaseMediaKind,
} from "./api/caseTypes";
import {
  fetchCaseUpdates, createCaseUpdate, patchCaseUpdate, removeCaseUpdate,
  fetchCaseMedia, uploadCaseFile, createCaseMedia, patchCaseMedia, removeCaseMedia,
  reorderCaseMediaItems, fetchCaseDocuments, fetchCaseJourney, createCaseDocument, removeCaseDocument,
} from "./api/caseContentApi";

export type {
  CaseStatus, Urgency, CaseRow, CategoryRow, DonationRow,
  CaseUpdateRow, CaseMediaRow, CaseDocumentRow, JourneyStepRow, CaseMediaKind,
};
export type DonationStatus = "pending" | "paid" | "failed" | "refunded";
export const DONATION_STATUS_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  failed: ["pending"],
  refunded: [],
};
export const canTransitionDonation = (from: DonationStatus, to: DonationStatus) =>
  from === to || DONATION_STATUS_TRANSITIONS[from]?.includes(to);

export type CaseInput = {
  code?: string;
  title: string;
  story?: string;
  description?: string;
  category_id: string | number;
  /** Axis (food / health / education…) the case belongs to. */
  axis_id?: number | string | null;
  program_id?: number | string | null;
  project_id?: number | string | null;
  donation_campaign_id?: number | string | null;
  beneficiary_name: string;
  beneficiary_age?: number | null;
  beneficiary_gender?: "male" | "female" | null;
  governorate?: string;
  city?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  needed_amount?: number;
  target_amount?: number;
  deadline?: string | null;
  urgency?: Urgency;
  priority?: "low" | "medium" | "high" | string;
  status?: string;
};

export const STATUS_LABELS: Record<string, { ar: string; en: string; tone: string }> = {
  draft: { ar: "مسودة", en: "Draft", tone: "bg-muted text-muted-foreground" },
  pending: { ar: "قيد المراجعة", en: "Pending", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  pending_review: { ar: "قيد المراجعة", en: "Pending Review", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  approved: { ar: "معتمدة", en: "Approved", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  funded: { ar: "مكتملة", en: "Funded", tone: "bg-primary/15 text-primary" },
  completed: { ar: "مكتملة", en: "Completed", tone: "bg-primary/15 text-primary" },
  closed: { ar: "مغلقة", en: "Closed", tone: "bg-muted text-muted-foreground" },
  rejected: { ar: "مرفوضة", en: "Rejected", tone: "bg-destructive/15 text-destructive" },
};

export function getCaseStatusLabel(status?: string | null): { ar: string; en: string; tone: string } {
  if (!status) return STATUS_LABELS.pending;
  const norm = String(status).toLowerCase().trim();
  return (
    STATUS_LABELS[norm] ||
    STATUS_LABELS.pending || {
      ar: status,
      en: status,
      tone: "bg-muted text-muted-foreground",
    }
  );
}

const DEFAULT_CATEGORIES: CategoryRow[] = [
  { id: "cat-medical", slug: "medical", name_ar: "حالات طبية وعلاج", name_en: "Medical & Treatment", description_ar: "", description_en: "", icon: "Activity", active: true, sort_order: 1, created_at: "" },
  { id: "cat-housing", slug: "housing", name_ar: "إسكان وتسقيف منازل", name_en: "Housing & Roofing", description_ar: "", description_en: "", icon: "Home", active: true, sort_order: 2, created_at: "" },
  { id: "cat-food", slug: "food", name_ar: "إطعام وسلال غذائية", name_en: "Food Baskets", description_ar: "", description_en: "", icon: "Utensils", active: true, sort_order: 3, created_at: "" },
  { id: "cat-education", slug: "education", name_ar: "تعليم وكفالة أيتام", name_en: "Education & Orphans", description_ar: "", description_en: "", icon: "GraduationCap", active: true, sort_order: 4, created_at: "" },
  { id: "cat-debts", slug: "debts", name_ar: "فك كرب وغارمات", name_en: "Debt Relief", description_ar: "", description_en: "", icon: "ShieldAlert", active: true, sort_order: 5, created_at: "" },
  { id: "cat-general", slug: "general", name_ar: "مساعدات عامة", name_en: "General Assistance", description_ar: "", description_en: "", icon: "Heart", active: true, sort_order: 6, created_at: "" },
];

/** Test rows like "The category field is required." must never reach a visitor or a form. */
const isJunkCategory = (c: { name_ar?: string | null; slug?: string | null }) =>
  /required|field is/i.test(`${c.name_ar ?? ""} ${c.slug ?? ""}`);

/** Case categories from the backend (/case-categories). The static list is used only when the API is unreachable. */
export async function listCategories(): Promise<CategoryRow[]> {
  try {
    const res = await apiFetch<unknown>("/case-categories", { params: { per_page: 100 }, useCache: false });
    const rows = (Array.isArray(res) ? res : (res as { data?: unknown })?.data) as Record<string, unknown>[] | undefined;
    if (Array.isArray(rows)) {
      return rows
        .map((c) => ({
          id: String(c.id),
          slug: String(c.slug || c.id),
          name_ar: String(c.name_ar || c.name || ""),
          name_en: String(c.name_en || c.name_ar || ""),
          description_ar: (c.description_ar as string) || "",
          description_en: (c.description_en as string) || "",
          icon: (c.icon as string) || "Heart",
          active: c.active !== false && c.is_active !== false,
          sort_order: Number(c.sort_order || 0),
          created_at: String(c.created_at || ""),
        }) as CategoryRow)
        .filter((c) => !isJunkCategory(c))
        .sort((a, b) => a.sort_order - b.sort_order);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("listCategories: API unreachable, using the static list", err);
  }
  return DEFAULT_CATEGORIES;
}

/** Shown when a case has no photo of its own: a neutral Al-Yusr card, never a stock photo of someone else. */
export const CASE_PLACEHOLDER_IMAGE = "/images/cases/case-placeholder.svg";

export function getCaseImageUrl(c?: {
  cover_image_url?: string | null;
  cover_image?: string | null;
  title?: string | null;
  category_id?: string | null;
  ref_code?: string | null;
}): string {
  const explicit = c?.cover_image_url || c?.cover_image;
  if (explicit && typeof explicit === "string" && explicit.trim() && !explicit.includes("example.jpg")) {
    return explicit;
  }
  return CASE_PLACEHOLDER_IMAGE;
}

/**
 * Public case list from the backend. The backend already hides unapproved cases from visitors and
 * filters by category_slug / urgent. Only real backend cases are shown —
 * an empty category is an empty list, not fake cases.
 */
/** Which cases to list: by category, urgency, or what they belong to (one item, or any of a kind). */
export type LinkedCasesFilter = {
  categorySlug?: string;
  urgent?: boolean;
  programId?: number | string;
  projectId?: number | string;
  campaignId?: number | string;
  /** Any case linked to a program / project / campaign. */
  linkedTo?: "program" | "project" | "campaign";
};

const LINK_KEY = { program: "program_id", project: "project_id", campaign: "donation_campaign_id" } as const;

export async function listPublicCases(opts?: LinkedCasesFilter & { limit?: number }) {
  try {
    const res = await apiFetch<unknown>("/cases", {
      params: {
        // A "linked to any" filter is applied here, so fetch a full page first.
        per_page: opts?.linkedTo ? 100 : Math.min(opts?.limit ?? 100, 100),
        category_slug: opts?.categorySlug || undefined,
        urgent: opts?.urgent ? 1 : undefined,
        program_id: opts?.programId || undefined,
        project_id: opts?.projectId || undefined,
        donation_campaign_id: opts?.campaignId || undefined,
      },
      useCache: false,
    });
    const rows = (Array.isArray(res) ? res : (res as { data?: unknown })?.data) as LaravelCase[] | undefined;
    if (Array.isArray(rows)) {
      const linkKey = opts?.linkedTo ? LINK_KEY[opts.linkedTo] : null;
      const visible = rows.filter(
        (c) => (c.status === "approved" || c.status === "completed") && (!linkKey || c[linkKey] || c[linkKey.replace("_id", "") as "program" | "project" | "donation_campaign"]),
      );
      return (opts?.limit ? visible.slice(0, opts.limit) : visible).map(mapLaravelCaseToRow);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn("listPublicCases: API unreachable", err);
  }
  // Only real backend cases are ever shown to donors: no sample cases when the API is unreachable
  // (sections that list cases hide themselves when this is empty).
  return [];
}

/** One case by its public code (CASE-4224) or id. Visitors only get approved / completed cases. */
export async function getCaseByRef(ref: string) {
  try {
    const res = await apiFetch<{ data?: LaravelCase }>(`/cases/${encodeURIComponent(ref)}`, { useCache: false });
    const c = res?.data ?? (res as unknown as LaravelCase);
    return c && c.id ? mapLaravelCaseToRow(c) : null;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return null;
  }
  return null;
}

const toUrgency = (priority?: string): Urgency => (priority === "high" || priority === "low" ? priority : "medium");

export function mapLaravelCaseToRow(c: LaravelCase): CaseRow {
  const cat = c.category_data && !isJunkCategory(c.category_data) ? c.category_data : null;
  const catName = cat?.name_ar || "";
  const program = c.program as { id?: number; slug?: string; name_ar?: string; name?: string } | null | undefined;
  const project = c.project as { id?: number; slug?: string; name?: string } | null | undefined;
  const campaign = c.donation_campaign as { id?: number; slug?: string; name_ar?: string } | null | undefined;
  const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
  return {
    id: String(c.id),
    ref_code: c.code || `CASE-${c.id}`,
    category_id: cat ? String(cat.id) : str(c.category_id) ?? "",
    category_slug: cat?.slug ?? null,
    category_name_ar: catName || null,
    title: c.title || "",
    story: c.description || "",
    beneficiary_name: c.beneficiary_name || "",
    beneficiary_age: c.age ?? null,
    beneficiary_gender: null,
    governorate: c.governorate || "",
    city: c.city ?? null,
    area: null,
    cover_image_url: getCaseImageUrl({ cover_image_url: c.cover_image, title: c.title, category_id: catName, ref_code: c.code }),
    cover_image: c.cover_image ?? null,
    needed_amount: Number(c.target_amount || 0),
    raised_amount: Number(c.collected_amount || 0),
    deadline: c.deadline ? String(c.deadline).slice(0, 10) : null,
    urgency: toUrgency(c.priority),
    is_urgent: c.priority === "high",
    status: (c.status as CaseStatus) || "pending_review",
    approved_at: c.status === "approved" ? c.updated_at || null : null,
    closed_at: null,
    created_at: c.created_at || "",
    updated_at: c.updated_at || c.created_at || "",
    approved_by: null,
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    program_id: str(program?.id ?? c.program_id),
    program_slug: program?.slug ?? null,
    program_name: program?.name_ar || program?.name || null,
    project_id: str(project?.id ?? c.project_id),
    project_slug: project?.slug ?? null,
    project_name: project?.name || null,
    donation_campaign_id: str(campaign?.id ?? c.donation_campaign_id),
    donation_campaign_slug: campaign?.slug ?? null,
    donation_campaign_name: campaign?.name_ar || null,
    case_categories: cat
      ? { id: String(cat.id), slug: cat.slug, name_ar: catName, name_en: cat.name_en || catName, icon: "Heart", active: true, sort_order: 0, created_at: "" }
      : null,
  } as unknown as CaseRow;
}

export async function listAllCasesForStaff() {
  try {
    const lCases = await casesApiV1.listAll();
    if (Array.isArray(lCases) && lCases.length > 0) {
      return lCases.map(mapLaravelCaseToRow);
    }
  } catch (err) {
    console.warn("Could not fetch cases from Laravel API:", err);
  }
  return [];
}

export async function getCaseById(id: string) {
  try {
    const lCase = await casesApiV1.get(id);
    if (lCase && lCase.id) return mapLaravelCaseToRow(lCase);
  } catch { }
  return null;
}

/** Donations made to one case (the backend has no case filter yet, so the full list is filtered here). */
/** Donations of one case (GET /donations?case_id=…, filtered on the server). */
export async function listDonationsForCase(caseId: string) {
  const rows = await listAllDonations({ caseId });
  return rows.filter((d: any) => String(d.case_id ?? d.case?.id ?? "") === String(caseId));
}

const toPriority = (input: Partial<CaseInput>): "low" | "medium" | "high" | undefined => {
  if (input.priority === "low" || input.priority === "medium" || input.priority === "high") return input.priority;
  if (!input.urgency) return undefined;
  return input.urgency === "high" || input.urgency === "critical" ? "high" : input.urgency === "low" ? "low" : "medium";
};

/** UI status words -> backend enum (pending_review | approved | completed | closed | rejected). */
export const toBackendStatus = (s?: string | null): string | undefined => {
  if (!s) return undefined;
  if (s === "draft" || s === "pending") return "pending_review";
  if (s === "funded") return "completed";
  return s;
};

const numOrNull = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));

/**
 * POST /cases. The category must be a real id (no silent fallback); the code is optional — the
 * server generates CASE-xxxxx. JSON (not the shared serializer) so a cover image link is kept.
 */
export async function createCase(input: CaseInput) {
  const categoryId = Number(input.category_id);
  if (!categoryId) throw new Error("اختر تصنيف الحالة");
  const res = await apiFetch<{ data?: LaravelCase }>("/cases", {
    method: "POST",
    body: {
      code: input.code?.trim() || undefined,
      title: input.title,
      beneficiary_name: input.beneficiary_name,
      governorate: input.governorate || "الدقهلية",
      city: input.city || null,
      age: numOrNull(input.beneficiary_age),
      target_amount: Number(input.target_amount ?? input.needed_amount ?? 0),
      deadline: input.deadline || null,
      category_id: categoryId,
      axis_id: numOrNull(input.axis_id),
      program_id: numOrNull(input.program_id),
      project_id: numOrNull(input.project_id),
      donation_campaign_id: numOrNull(input.donation_campaign_id),
      priority: toPriority(input) ?? "medium",
      cover_image: input.cover_image || input.cover_image_url || null,
      description: input.description || input.story || "",
      status: toBackendStatus(input.status) || undefined,
    },
  });
  invalidateApiCache("/cases");
  return mapLaravelCaseToRow((res?.data ?? res) as LaravelCase);
}

/** PUT /cases/{id}: sends exactly the fields present in `patch` (null clears), nothing else. */
export async function updateCase(id: string, patch: Partial<CaseInput> & { status?: string; rejection_reason?: string | null }) {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(patch, k);
  const body: Record<string, unknown> = {};
  if (has("title")) body.title = patch.title;
  if (has("code") && patch.code) body.code = patch.code;
  if (has("beneficiary_name")) body.beneficiary_name = patch.beneficiary_name;
  if (has("target_amount")) body.target_amount = Number(patch.target_amount);
  else if (has("needed_amount")) body.target_amount = Number(patch.needed_amount);
  if (has("description")) body.description = patch.description;
  else if (has("story")) body.description = patch.story;
  if (has("governorate")) body.governorate = patch.governorate;
  if (has("city")) body.city = patch.city || null;
  if (has("beneficiary_age")) body.age = numOrNull(patch.beneficiary_age);
  if (has("deadline")) body.deadline = patch.deadline || null;
  if (has("cover_image")) body.cover_image = patch.cover_image || null;
  else if (has("cover_image_url")) body.cover_image = patch.cover_image_url || null;
  if (has("category_id") && Number(patch.category_id)) body.category_id = Number(patch.category_id);
  if (has("axis_id")) body.axis_id = numOrNull(patch.axis_id);
  if (has("program_id")) body.program_id = numOrNull(patch.program_id);
  if (has("project_id")) body.project_id = numOrNull(patch.project_id);
  if (has("donation_campaign_id")) body.donation_campaign_id = numOrNull(patch.donation_campaign_id);
  const priority = toPriority(patch);
  if (priority) body.priority = priority;
  if (has("status")) body.status = toBackendStatus(patch.status);
  const res = await apiFetch<{ data?: LaravelCase }>(`/cases/${id}`, { method: "PUT", body });
  invalidateApiCache("/cases");
  return mapLaravelCaseToRow((res?.data ?? res) as LaravelCase);
}

export async function setCaseStatus(id: string, status: CaseStatus, _rejectionReason?: string) {
  await apiFetch(`/cases/${id}`, { method: "PUT", body: { status: toBackendStatus(status) } });
  invalidateApiCache("/cases");
}

export async function deleteCase(id: string) {
  try {
    await casesApiV1.remove(id);
    return;
  } catch (err) {
    console.warn("Could not delete case on Laravel API:", err);
    throw err;
  }
}

export async function listMyDonations() {
  try {
    const all = await donationsApiV1.listAll();
    if (Array.isArray(all) && all.length > 0) {
      return all as unknown as DonationRow[];
    }
  } catch { }
  return [];
}

export async function listAllDonations(filters?: {
  status?: DonationStatus | "all";
  method?: string | "all";
  q?: string;
  campaignId?: string | "all";
  utmSource?: string;
  utmMedium?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
  limit?: number;
  /** Server-side filter (GET /donations?case_id=…). */
  caseId?: string;
}) {
  try {
    // Always fresh: gateway callbacks change a donation's status minutes after it was created.
    const lDonations = await donationsApiV1.listAll(filters?.caseId ? { case_id: filters.caseId } : undefined, { useCache: false });
    if (Array.isArray(lDonations) && lDonations.length > 0) {
      let mapped = lDonations.map((d: any) => {
        const pmDetails = d.payment_method_details;
        const methodName =
          (typeof pmDetails === "object" ? pmDetails?.name_ar || pmDetails?.name_en || pmDetails?.slug : String(pmDetails || "")) ||
          d.payment_method ||
          d.method ||
          "دفع إلكتروني";

        const rawStatus = (d.payment_status || d.status || "pending").toLowerCase();
        // Normalize 'completed' to 'paid' for unified accounting while preserving status display
        const normalizedStatus = rawStatus === "completed" ? "paid" : rawStatus;

        return {
          ...d,
          id: String(d.id),
          donor_id: d.donor_id || d.donor?.id || null,
          ref_code: d.transaction_reference || d.reference_code || d.code || d.ref_code || `DON-${d.id}`,
          donor_name: d.donor_name || d.name || d.donor?.name || "متبرع كريم",
          donor_email: d.donor_email || d.email || d.donor?.email || "",
          donor_phone: d.donor_phone || d.phone || d.donor?.phone || "",
          amount: Number(d.amount || 0),
          currency: d.currency || "EGP",
          payment_method: methodName,
          /** Raw method code (visa | cash | bank…): decides whether a gateway confirms it. */
          method_code: String(d.payment_method || "").toLowerCase(),
          payment_status: normalizedStatus,
          raw_status: rawStatus,
          created_at: d.created_at || new Date().toISOString(),
          cases: d.case ? { id: d.case.id, ref_code: d.case.code || `CASE-${d.case.id}`, title: d.case.title || d.case.title_ar, cover_image_url: d.case.image_url || d.case.image } : null,
          program: d.program,
          project: d.project,
          donation_campaign: d.donation_campaign,
          donation_package: d.donation_package,
          notes: d.notes || d.message || "",
        };
      });
      if (filters?.status && filters.status !== "all") {
        if (filters.status === "paid") {
          mapped = mapped.filter((x: any) => x.payment_status === "paid" || x.raw_status === "completed");
        } else {
          mapped = mapped.filter((x: any) => x.payment_status === filters.status);
        }
      }
      if (filters?.method && filters.method !== "all") {
        const targetMethod = filters.method.toLowerCase();
        mapped = mapped.filter((x: any) => String(x.payment_method).toLowerCase().includes(targetMethod));
      }
      if (filters?.q) {
        const query = filters.q.toLowerCase().trim();
        mapped = mapped.filter((x: any) =>
          String(x.donor_name || "").toLowerCase().includes(query) ||
          String(x.ref_code || "").toLowerCase().includes(query) ||
          String(x.donor_phone || "").toLowerCase().includes(query) ||
          String(x.donor_email || "").toLowerCase().includes(query)
        );
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Could not fetch donations from Laravel API:", err);
  }
  return [];
}

/** Analytics from Laravel API only. Supabase removed. */
export async function getDonationsAnalytics(_months = 9) {
  // Return empty analytics — use AdminAnalytics.tsx which reads from Laravel API
  return {
    rows: [],
    paid: [],
    totals: { total: 0, avg: 0, donors: 0, count: 0, countPaid: 0, countPending: 0, countFailed: 0 },
    trend: [],
    dailyTrend: [],
    categoryDist: [],
    methodDist: [],
  };
}


/**
 * Read helpers used by public pages AND by AdminCaseDetail's Promise.all: on API failure
 * (e.g. the proposed endpoint is not deployed yet) they log and return [] — the same
 * empty result these functions returned before — so one missing endpoint never blocks the
 * whole page. Writes below always throw. Screens that need the error can call the
 * `fetch*` functions in ./api/caseContentApi directly.
 */
async function readOrEmpty<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[casesApi] ${label} unavailable:`, err);
    return [];
  }
}

/** Case documents visible to the donor (Laravel GET /cases/{id}/documents — NEW, proposed). */
export async function listCaseDocuments(caseId: string): Promise<CaseDocumentRow[]> {
  return readOrEmpty("documents", () => fetchCaseDocuments(caseId));
}

export async function addCaseDocument(
  caseId: string,
  input: { file: File; doc_type?: string; caption?: string | null; is_public?: boolean },
): Promise<CaseDocumentRow> {
  return createCaseDocument(caseId, input);
}

export async function deleteCaseDocument(id: string): Promise<void> {
  return removeCaseDocument(id);
}

// ── Case updates (Laravel /cases/{id}/updates + /case-updates/{id} — NEW, proposed) ──
export async function listCaseUpdates(caseId: string): Promise<CaseUpdateRow[]> {
  return readOrEmpty("updates", () => fetchCaseUpdates(caseId));
}

export async function addCaseUpdate(caseId: string, body: string, image_url?: string | null): Promise<CaseUpdateRow> {
  return createCaseUpdate(caseId, body, image_url);
}

export async function updateCaseUpdate(id: string, patch: { body?: string; image_url?: string | null }): Promise<CaseUpdateRow> {
  return patchCaseUpdate(id, patch);
}

export async function deleteCaseUpdate(id: string): Promise<void> {
  return removeCaseUpdate(id);
}

// ── Case media (Laravel /cases/{id}/media + /case-media/{id} — NEW, proposed) ──
/** Public media for the case page (is_public only). */
export async function listCaseMedia(caseId: string): Promise<CaseMediaRow[]> {
  return readOrEmpty("media", () => fetchCaseMedia(caseId));
}

/** All media incl. private (staff token required). Throws so the admin screen can show the error. */
export async function listCaseMediaAdmin(caseId: string): Promise<CaseMediaRow[]> {
  return fetchCaseMedia(caseId, { all: true });
}

/** Upload a file (no media row) and return its public URL + storage path. */
export async function uploadCaseMediaFile(file: File, caseId: string): Promise<{ url: string; path: string }> {
  return uploadCaseFile(file, caseId);
}

export async function createCaseMediaRow(input: {
  case_id: string; url?: string; file?: File | Blob; kind?: CaseMediaKind;
  caption_ar?: string | null; caption_en?: string | null;
  is_public?: boolean; sort_order?: number;
}): Promise<CaseMediaRow> {
  const { case_id, ...rest } = input;
  return createCaseMedia(case_id, rest);
}

export async function updateCaseMedia(id: string, patch: Partial<Pick<CaseMediaRow,
  "kind" | "caption_ar" | "caption_en" | "is_public" | "sort_order" | "url">>): Promise<CaseMediaRow> {
  return patchCaseMedia(id, patch);
}

/** Deletes the media row; the backend also deletes the stored file. */
export async function deleteCaseMedia(id: string, _url?: string): Promise<void> {
  return removeCaseMedia(id);
}

export async function reorderCaseMedia(rows: { id: string; case_id?: string }[], caseId?: string): Promise<void> {
  const cid = caseId ?? rows.find((r) => r.case_id)?.case_id;
  if (!cid) throw new Error("لا يمكن إعادة الترتيب بدون رقم الحالة");
  return reorderCaseMediaItems(cid, rows.map((r) => r.id));
}

/** Public journey steps of a case (Laravel GET /cases/{id}/journey — NEW, proposed). */
export async function listCaseJourney(caseId: string): Promise<Pick<JourneyStepRow,
  "id" | "step_key" | "title_ar" | "title_en" | "note_ar" | "note_en" | "media_url" | "occurred_at" | "is_public">[]> {
  return readOrEmpty("journey", () => fetchCaseJourney(caseId));
}

/** Upload a document/media file for a case and create its row in one request. */
export async function uploadCaseMedia(file: File, opts: { caseId?: string; visibility?: "public" | "private"; docType?: string; caption?: string }): Promise<CaseMediaRow> {
  if (!opts.caseId) throw new Error("رقم الحالة مطلوب لرفع الملف");
  return createCaseMedia(opts.caseId, {
    file,
    kind: "other",
    caption_ar: opts.caption ?? null,
    is_public: opts.visibility !== "private",
  });
}

/** Backend program used for general (untargeted) donations, e.g. the home quick-donate. */
export const GENERAL_PROGRAM_ID = Number(import.meta.env.VITE_GENERAL_PROGRAM_ID) || 36;

export async function createDonation(input: {
  /** The record this donation is booked on (case / program / project / campaign); wins over the legacy fields. */
  target?: DonationTarget | null;
  case_id?: string | null;
  category_id?: string | null;
  donation_campaign_id?: string | number | null;
  amount: number;
  currency?: string;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  message?: string;
  payment_method?: string;
  payment_status?: string;
  idempotency_key?: string;
}) {
  const refCode = `YSR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  // Map frontend payment method to Laravel backend (accepts visa, bank, cash + payment_method_id 1..6)
  const rawMethod = String(input.payment_method || "card").toLowerCase();
  let pmInfo = { id: 1, method: "visa" as "visa" | "bank" | "cash", provider: "paymob" };

  if (rawMethod.includes("kashier")) {
    pmInfo = { id: 8, method: "visa", provider: "kashier" };
  } else if (rawMethod.includes("paymob") || rawMethod.includes("card") || rawMethod.includes("visa")) {
    pmInfo = { id: 1, method: "visa", provider: "paymob" };
  } else if (rawMethod.includes("bank")) {
    pmInfo = { id: 2, method: "bank", provider: "bank" };
  } else if (rawMethod.includes("vodafone") || rawMethod.includes("wallet")) {
    pmInfo = { id: 3, method: "bank", provider: "wallet" };
  } else if (rawMethod.includes("insta")) {
    pmInfo = { id: 4, method: "bank", provider: "instapay" };
  } else if (rawMethod.includes("delegate") || rawMethod.includes("cash")) {
    pmInfo = { id: 5, method: "cash", provider: "delegate" };
  } else if (rawMethod.includes("orange")) {
    pmInfo = { id: 6, method: "bank", provider: "orange" };
  }

  // donor_id is intentionally NOT sent: the backend derives the donor from the
  // bearer token (if any). A client-chosen id could be forged.

  // Resolve donation target — backend requires ONE of: case_id | program_id | project_id | donation_campaign_id
  let targetField: { key: string; value: number };
  const anyInput = input as any;
  if (input.target && input.target.id > 0) {
    targetField = { key: TARGET_FIELD[input.target.kind], value: input.target.id };
  } else if (input.case_id && !isNaN(Number(input.case_id)) && Number(input.case_id) > 0) {
    targetField = { key: "case_id", value: Number(input.case_id) };
  } else if (anyInput.donation_campaign_id && !isNaN(Number(anyInput.donation_campaign_id))) {
    targetField = { key: "donation_campaign_id", value: Number(anyInput.donation_campaign_id) };
  } else if (anyInput.campaign_id && !isNaN(Number(anyInput.campaign_id))) {
    targetField = { key: "donation_campaign_id", value: Number(anyInput.campaign_id) };
  } else if (input.category_id && !isNaN(Number(input.category_id)) && Number(input.category_id) > 0) {
    targetField = { key: "program_id", value: Number(input.category_id) };
  } else {
    // Untargeted donations go to the "تبرع عام" program (VITE_GENERAL_PROGRAM_ID).
    // Falls back to 36 (زكاة المال) only until that program exists on the backend.
    targetField = { key: "program_id", value: GENERAL_PROGRAM_ID };
  }

  // 1. Send to Laravel Charity API v1 (/donations/submit)
  let laravelResponse: any = null;
  // Where Kashier sends the browser after checkout. No status is baked into the
  // URL: Kashier appends its own result params, and the status page always asks
  // the backend (GET /donations/track/{ref}) before showing "paid".
  const frontendOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://elyusr.org";
  const frontendUrl = `${frontendOrigin}/donate/status/${encodeURIComponent(refCode)}`;

  try {
    laravelResponse = await donationsApiV1.submit({
      donation_target: String(input.amount || 100),
      provider: pmInfo.provider,
      // Only what the donor typed: the backend shows «فاعل خير» when the name is empty and
      // requires a phone number for guests (DonorResolver).
      name: input.donor_name?.trim() || undefined,
      email: input.donor_email?.trim() || undefined,
      phone: input.donor_phone?.trim() || undefined,
      amount: Number(input.amount),
      payment_method_id: pmInfo.id,
      payment_method: pmInfo.method,
      redirect_url: frontendUrl,
      merchant_redirect: frontendUrl,
      notes: input.message || "تبرع عبر بوابة اليسر",
      [targetField.key]: targetField.value,
      ...(input.target?.packageId ? { donation_package_id: input.target.packageId } : {}),
    });
  } catch (err) {
    // Never continue with a donation the server did not record: the caller shows this message.
    const apiErr = err as { message?: string; errors?: Record<string, string[]> };
    const firstFieldError = apiErr?.errors ? Object.values(apiErr.errors).flat()[0] : undefined;
    throw new Error(firstFieldError || apiErr?.message || "تعذر تسجيل التبرع، حاول مرة أخرى.");
  }

  // 2. Extract backend reference and payment session/secret
  const donationData = laravelResponse?.data?.donation || laravelResponse?.donation || laravelResponse?.data;
  const paymentData = laravelResponse?.data?.payment || laravelResponse?.payment;
  const backendRef = donationData?.transaction_reference;
  const finalRef = backendRef || refCode;

  // 3. Persist in local donation store for immediate admin & donor visibility
  try {
    donationsStore.create({
      ref: finalRef,
      donor: {
        name: input.donor_name || "فاعل خير",
        email: input.donor_email || "",
        phone: input.donor_phone || "",
      },
      amount: Number(input.amount),
      program: input.category_id || "general",
      programLabel: input.message || "تبرع عام",
      method: input.payment_method || "vodafone_cash",
      status: "pending",
    });
  } catch (err) {
    console.warn("donationsStore save notice:", err);
  }

  // 4. Return complete, typed donation record
  return {
    id: String(donationData?.id || `don-${Date.now()}`),
    ref_code: finalRef,
    amount: input.amount,
    currency: input.currency || "EGP",
    donor_name: input.donor_name || "فاعل خير",
    donor_email: input.donor_email || null,
    donor_phone: input.donor_phone || null,
    payment_method: input.payment_method || "cash",
    payment_status: input.payment_status || "pending",
    case_id: input.case_id || null,
    category_id: input.category_id || null,
    message: input.message || null,
    payment: paymentData,
    donation: donationData,
    created_at: now,
    updated_at: now,
  } as unknown as DonationRow;
}

/**
 * Poll backend for the payment status of a donation by its transaction reference.
 * Used by KashierCheckoutModal to detect payment completion after 3DS flow
 * when postMessage is blocked by iframe cross-origin CSP.
 *
 * Backend endpoint: GET /api/v1/donations/track/{ref}
 * Returns: { payment_status: "pending" | "paid" | "failed" }
 */
export type VerifiedPaymentStatus = "paid" | "failed" | "pending" | "unknown";

/** Normalise whatever status string the backend returns into a strict outcome. */
export function normalizePaymentStatus(raw: unknown): VerifiedPaymentStatus {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "unknown";
  if (["paid", "completed", "success", "succeeded", "approved", "captured"].includes(s)) return "paid";
  if (["failed", "failure", "error", "declined", "cancelled", "canceled", "expired", "refunded"].includes(s)) return "failed";
  return "pending";
}

/**
 * Ask the backend whether a donation reference has actually been paid.
 * This is the ONLY source of truth for showing a "paid" state in the UI;
 * URL params and iframe messages are hints that trigger this check.
 */
export async function verifyDonationPayment(
  ref: string
): Promise<{ status: VerifiedPaymentStatus; data: Record<string, any> | null }> {
  const clean = String(ref || "").trim();
  if (!clean) return { status: "unknown", data: null };
  const data = await getDonationByRef(clean);
  if (!data) return { status: "unknown", data: null };
  return { status: normalizePaymentStatus(data.payment_status), data };
}

export async function getDonationByRef(
  ref: string
): Promise<({ payment_status: string } & Record<string, any>) | null> {
  if (!ref) return null;
  try {
    const { apiFetch } = await import("./laravelApi");
    const res = await apiFetch<any>(`/donations/track/${encodeURIComponent(ref)}`, {
      method: "GET",
      useCache: false,
    });
    const data = res?.data ?? res ?? null;
    if (!data) return null;
    return {
      ...data,
      payment_status: data.payment_status || data.status || "pending",
    };
  } catch {
    return null;
  }
}