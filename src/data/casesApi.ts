import type { Database } from "@/integrations/supabase/types";
import { restApi, isRestProvider } from "./restApi";
import { casesApiV1, LaravelCase, donationsApiV1 } from "./laravelApi";
import { donationsStore } from "@/data/donationsStore";

export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type Urgency = Database["public"]["Enums"]["urgency_level"];
export type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["case_categories"]["Row"];
export type DonationRow = Database["public"]["Tables"]["donations"]["Row"];
export type DonationStatus = "pending" | "paid" | "failed" | "refunded";
export const DONATION_STATUS_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  pending:  ["paid", "failed"],
  paid:     ["refunded"],
  failed:   ["pending"],
  refunded: [],
};
export const canTransitionDonation = (from: DonationStatus, to: DonationStatus) =>
  from === to || DONATION_STATUS_TRANSITIONS[from]?.includes(to);

export type CaseInput = {
  title: string;
  story?: string;
  category_id: string;
  beneficiary_name: string;
  beneficiary_age?: number | null;
  beneficiary_gender?: "male" | "female" | null;
  governorate?: string;
  city?: string | null;
  cover_image_url?: string | null;
  needed_amount: number;
  deadline?: string | null;
  urgency?: Urgency;
};

export const STATUS_LABELS: Record<CaseStatus, { ar: string; en: string; tone: string }> = {
  draft:    { ar: "مسودة",     en: "Draft",    tone: "bg-muted text-muted-foreground" },
  pending:  { ar: "قيد المراجعة", en: "Pending",  tone: "bg-accent/15 text-accent" },
  approved: { ar: "معتمدة",     en: "Approved", tone: "bg-secondary/20 text-primary" },
  funded:   { ar: "مكتملة",    en: "Funded",   tone: "bg-primary/15 text-primary" },
  closed:   { ar: "مغلقة",     en: "Closed",   tone: "bg-muted text-muted-foreground" },
  rejected: { ar: "مرفوضة",    en: "Rejected", tone: "bg-destructive/15 text-destructive" },
};

const DEFAULT_CATEGORIES: CategoryRow[] = [
  { id: "cat-medical", slug: "medical", name_ar: "حالات طبية وعلاج", name_en: "Medical & Treatment", icon: "Activity", active: true, sort_order: 1, created_at: "" },
  { id: "cat-housing", slug: "housing", name_ar: "إسكان وتسقيف منازل", name_en: "Housing & Roofing", icon: "Home", active: true, sort_order: 2, created_at: "" },
  { id: "cat-food", slug: "food", name_ar: "إطعام وسلال غذائية", name_en: "Food Baskets", icon: "Utensils", active: true, sort_order: 3, created_at: "" },
  { id: "cat-education", slug: "education", name_ar: "تعليم وكفالة أيتام", name_en: "Education & Orphans", icon: "GraduationCap", active: true, sort_order: 4, created_at: "" },
  { id: "cat-debts", slug: "debts", name_ar: "فك كرب وغارمات", name_en: "Debt Relief", icon: "ShieldAlert", active: true, sort_order: 5, created_at: "" },
  { id: "cat-general", slug: "general", name_ar: "مساعدات عامة", name_en: "General Assistance", icon: "Heart", active: true, sort_order: 6, created_at: "" },
];

export async function listCategories() {
  try {
    if (isRestProvider()) return (await restApi.listCategories()) as CategoryRow[];
    // Try Laravel API first
    const { categoriesApiV1 } = await import("./laravelApi");
    const lCats = await categoriesApiV1.listAll();
    if (Array.isArray(lCats) && lCats.length > 0) {
      return lCats.map((c: any) => ({
        id: String(c.id),
        slug: c.slug || String(c.id),
        name_ar: c.name_ar || c.name || c.title_ar || "",
        name_en: c.name_en || c.name || c.title_en || "",
        icon: c.icon || "Heart",
        active: c.active !== false,
        sort_order: c.sort_order || 0,
        created_at: c.created_at || "",
      }) as CategoryRow);
    }
  } catch {}
  return DEFAULT_CATEGORIES;
}

// Columns safe to expose to anonymous visitors. Sensitive internal fields
// (delegate_notes, rejection_reason, assigned_delegate_id, beneficiary_age,
// beneficiary_gender, scheduled_visit_at, created_by, approved_by) are
// intentionally omitted — the `anon` Postgres role no longer has SELECT
// privilege on them.
const PUBLIC_CASE_COLUMNS =
  "id,ref_code,category_id,title,story,beneficiary_name," +
  "governorate,city,area,cover_image_url," +
  "needed_amount,raised_amount,deadline,urgency,status," +
  "approved_at,closed_at,created_at,updated_at";

export async function listPublicCases(opts?: { categorySlug?: string; limit?: number }) {
  try {
    const lCases = await casesApiV1.listAll();
    if (Array.isArray(lCases) && lCases.length > 0) {
      let filtered = lCases.filter((c: any) => c.status === "approved" || c.status === "completed" || !c.status);
      if (opts?.categorySlug) {
        filtered = filtered.filter((c: any) => c.category?.toLowerCase() === opts.categorySlug?.toLowerCase() || c.category_id == opts.categorySlug);
      }
      if (opts?.limit) {
        filtered = filtered.slice(0, opts.limit);
      }
      return filtered.map(mapLaravelCaseToRow);
    }
  } catch (err) {
    console.warn("Could not fetch public cases from Laravel API:", err);
  }
  if (isRestProvider()) return (await restApi.listPublicCases(opts)) as CaseRow[];
  return [];
}

export async function getCaseByRef(ref: string) {
  try {
    const id = ref.startsWith("CASE-") ? ref.replace("CASE-", "") : ref;
    const lCase = await casesApiV1.get(id);
    if (lCase && lCase.id) return mapLaravelCaseToRow(lCase);

    const all = await casesApiV1.listAll();
    const found = all.find((c: any) => c.code === ref || String(c.id) === ref);
    if (found) return mapLaravelCaseToRow(found);
  } catch {}
  if (isRestProvider()) return (await restApi.getCaseByRef(ref)) as CaseRow | null;
  return null;
}

function mapLaravelCaseToRow(c: LaravelCase): CaseRow {
  return {
    id: String(c.id),
    ref_code: c.code || `CASE-${c.id}`,
    category_id: c.category || "general",
    title: c.title || "",
    story: (c as any).story || "",
    beneficiary_name: c.beneficiary_name || "",
    beneficiary_age: null,
    beneficiary_gender: null,
    governorate: c.governorate || "الدقهلية",
    city: (c as any).city || null,
    area: (c as any).area || null,
    cover_image_url: (c as any).cover_image_url || (c as any).image || null,
    needed_amount: Number(c.target_amount || 0),
    raised_amount: Number(c.collected_amount || 0),
    deadline: null,
    urgency: (c.priority as Urgency) || "medium",
    status: (c.status as CaseStatus) || "approved",
    approved_at: c.created_at || null,
    closed_at: null,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.created_at || new Date().toISOString(),
    approved_by: null,
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "general",
      slug: c.category || "general",
      name_ar: c.category || "عام",
      name_en: c.category || "General",
      icon: "Heart",
      active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
    },
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
  if (isRestProvider()) return (await restApi.listAllCasesForStaff()) as CaseRow[];
  return [];
}

export async function getCaseById(id: string) {
  try {
    const lCase = await casesApiV1.get(id);
    if (lCase && lCase.id) return mapLaravelCaseToRow(lCase);
  } catch {}
  return null;
}

export async function listDonationsForCase(_caseId: string) {
  // Supabase removed — use Laravel donations API instead
  return [];
}

export async function createCase(input: CaseInput) {
  try {
    const code = `CASE-${Date.now().toString(36).toUpperCase()}`;
    const priority = (input.urgency === "high" || (input.urgency as string) === "critical" ? "high" : (input.urgency as string) === "urgent" ? "medium" : "low") as "low" | "medium" | "high";
    const created = await casesApiV1.create({
      code,
      title: input.title,
      beneficiary_name: input.beneficiary_name,
      governorate: input.governorate || "الدقهلية",
      target_amount: Number(input.needed_amount || 0),
      category: input.category_id || "عام",
      priority,
      description: input.story || input.title || "تفاصيل الحالة للمستفيد",
      status: "pending",
    } as any);
    return mapLaravelCaseToRow(created);
  } catch (err) {
    console.warn("Could not create case on Laravel API:", err);
    throw err;
  }
}

export async function updateCase(id: string, patch: Partial<CaseInput> & { status?: CaseStatus; rejection_reason?: string | null }) {
  try {
    const payload: Record<string, unknown> = {};
    if (patch.title) payload.title = patch.title;
    if (patch.beneficiary_name) payload.beneficiary_name = patch.beneficiary_name;
    if (patch.needed_amount !== undefined) payload.target_amount = Number(patch.needed_amount);
    if (patch.story) payload.description = patch.story;
    if (patch.governorate) payload.governorate = patch.governorate;
    if (patch.urgency) {
      payload.priority = (patch.urgency === "high" || (patch.urgency as string) === "critical" ? "high" : "medium") as "low" | "medium" | "high";
    }
    if (patch.status) {
      const mapSt = patch.status === "funded" || patch.status === "closed" ? "completed" : patch.status;
      payload.status = mapSt;
    }
    if (patch.rejection_reason) payload.rejection_reason = patch.rejection_reason;
    const updated = await casesApiV1.update(id, payload as any);
    return mapLaravelCaseToRow(updated);
  } catch (err) {
    console.warn("Could not update case on Laravel API:", err);
    throw err;
  }
}

export async function setCaseStatus(id: string, status: CaseStatus, rejection_reason?: string) {
  try {
    const mapSt = status === "funded" || status === "closed" ? "completed" : status;
    await casesApiV1.update(id, { status: mapSt, rejection_reason: rejection_reason ?? null } as any);
    return;
  } catch (err) {
    console.warn("Could not update status on Laravel API:", err);
    throw err;
  }
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
  } catch {}
  if (isRestProvider()) return (await restApi.listMyDonations()) as DonationRow[];
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
}) {
  try {
    const lDonations = await donationsApiV1.listAll();
    if (Array.isArray(lDonations) && lDonations.length > 0) {
      let mapped = lDonations.map((d: any) => ({
        id: String(d.id),
        ref_code: d.reference_code || d.code || `DON-${d.id}`,
        donor_name: d.donor_name || d.donor?.name || "متبرع كريم",
        donor_email: d.donor_email || d.donor?.email || "",
        donor_phone: d.donor_phone || d.donor?.phone || "",
        amount: Number(d.amount || 0),
        currency: d.currency || "EGP",
        payment_method: d.payment_method || d.method || "manual",
        payment_status: d.status || d.payment_status || "paid",
        created_at: d.created_at || new Date().toISOString(),
        cases: d.case ? { ref_code: d.case.code, title: d.case.title, cover_image_url: null } : null,
      }));
      if (filters?.status && filters.status !== "all") {
        mapped = mapped.filter((x: any) => x.payment_status === filters.status);
      }
      if (filters?.method && filters.method !== "all") {
        mapped = mapped.filter((x: any) => x.payment_method === filters.method);
      }
      if (filters?.q) {
        const query = filters.q.toLowerCase();
        mapped = mapped.filter((x: any) => x.donor_name.toLowerCase().includes(query) || x.ref_code.toLowerCase().includes(query));
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Could not fetch donations from Laravel API:", err);
  }
  return [];
}

export async function updateDonationStatus(id: string, status: DonationStatus) {
  try {
    await donationsApiV1.update(id, { status } as any);
  } catch {}
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


export async function listCaseDocuments(_caseId: string) {
  // Supabase removed
  return [];
}

export async function listCaseUpdates(caseId: string) {
  if (isRestProvider()) return (await restApi.listCaseUpdates(caseId)) as Database["public"]["Tables"]["case_updates"]["Row"][];
  return [];
}

export async function addCaseUpdate(caseId: string, body: string, image_url?: string | null) {
  if (isRestProvider()) return await restApi.addCaseUpdate(caseId, body, image_url) as Database["public"]["Tables"]["case_updates"]["Row"];
  throw new Error("Case updates require REST provider");
}

export async function updateCaseUpdate(_id: string, _patch: { body?: string; image_url?: string | null }) {
  throw new Error("Case updates require REST provider");
}

export async function deleteCaseUpdate(_id: string) {
  throw new Error("Case updates require REST provider");
}

export type CaseMediaRow = Database["public"]["Tables"]["case_media"]["Row"];
export type JourneyStepRow = Database["public"]["Tables"]["donation_journey_steps"]["Row"];

export async function listCaseMedia(_caseId: string) {
  return [] as CaseMediaRow[];
}

export async function listCaseMediaAdmin(_caseId: string) {
  return [] as CaseMediaRow[];
}

export type CaseMediaKind = CaseMediaRow["kind"];

/** Upload a file directly to the public case-media bucket and return its URL + path. */
export async function uploadCaseMediaFile(_file: File, _caseId: string): Promise<{ url: string; path: string }> {
  throw new Error("Media upload requires server integration");
}

export async function createCaseMediaRow(_input: {
  case_id: string; url: string; kind?: CaseMediaKind;
  caption_ar?: string | null; caption_en?: string | null;
  is_public?: boolean; sort_order?: number;
}): Promise<CaseMediaRow> {
  throw new Error("Media upload requires server integration");
}

export async function updateCaseMedia(_id: string, _patch: Partial<Pick<CaseMediaRow,
  "kind" | "caption_ar" | "caption_en" | "is_public" | "sort_order" | "url">>): Promise<CaseMediaRow> {
  throw new Error("Media upload requires server integration");
}

export async function deleteCaseMedia(_id: string, _url?: string) {
  // no-op without Supabase storage
}

export async function reorderCaseMedia(_rows: { id: string }[]) {
  // no-op without Supabase
}

export async function listCaseJourney(_caseId: string) {
  return [] as Pick<JourneyStepRow, "id"|"step_key"|"title_ar"|"title_en"|"note_ar"|"note_en"|"media_url"|"occurred_at"|"is_public">[];
}

export async function uploadCaseMedia(_file: File, _opts: { caseId?: string; visibility?: "public" | "private"; docType?: string; caption?: string }) {
  throw new Error("Media upload requires server integration");
}

export async function createDonation(input: {
  case_id?: string | null;
  category_id?: string | null;
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

  // 1. Try sending to Laravel Charity API v1 (/donations/submit or /donations)
  let laravelResponse: any = null;
  try {
    const rawRes = await fetch("/api/v1/donations/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: input.donor_name || "متبرع فاعل خير",
        email: input.donor_email || "donor@alyusr.org",
        phone: input.donor_phone || "01000000000",
        amount: input.amount,
        payment_method_id: input.payment_method === "card_paymob" || input.payment_method === "card" ? 1 : 2,
        notes: input.message || "تبرع عبر بوابة اليسر",
      }),
    });
    if (rawRes.ok) {
      laravelResponse = await rawRes.json();
    }
  } catch (err) {
    console.warn("Laravel /donations/submit network notice (fallback used):", err);
  }

  // Fallback to donationsApiV1 resource if submit endpoint wasn't reached
  if (!laravelResponse) {
    try {
      if (donationsApiV1 && typeof donationsApiV1.create === "function") {
        laravelResponse = await donationsApiV1.create({
          donor_id: 1,
          donor: input.donor_name || "متبرع فاعل خير",
          name: input.donor_name || "متبرع فاعل خير",
          email: input.donor_email || "donor@alyusr.org",
          phone: input.donor_phone || "01000000000",
          amount: String(input.amount),
          payment_method: input.payment_method || "cash",
        });
      }
    } catch (err) {
      console.warn("Laravel donation API sync notice:", err);
    }
  }

  // 2. Persist in local donation store for immediate admin & donor visibility
  try {
    donationsStore.create({
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

  // 3. Return complete, typed donation record
  const backendRef = laravelResponse?.donation?.transaction_reference || laravelResponse?.data?.transaction_reference;
  const paymentData = laravelResponse?.payment;

  return {
    id: `don-${Date.now()}`,
    ref_code: backendRef || refCode,
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
    created_at: now,
    updated_at: now,
  } as unknown as DonationRow;
}