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

export async function listCategories() {
  try {
    if (isRestProvider()) return (await restApi.listCategories()) as CategoryRow[];
    // Try Laravel API first
    const { caseCategoriesApi } = await import("./laravelApi");
    const res = await caseCategoriesApi.list({ per_page: 100 });
    const lCats = Array.isArray(res) ? res : res?.data || [];
    if (Array.isArray(lCats) && lCats.length > 0) {
      return lCats.map((c: any) => ({
        id: String(c.id),
        slug: c.slug || String(c.id),
        name_ar: c.name_ar || c.name || c.title_ar || "",
        name_en: c.name_en || c.name || c.title_en || "",
        description_ar: c.description_ar || "",
        description_en: c.description_en || "",
        icon: c.icon || "Heart",
        active: c.active !== false && c.is_active !== false,
        sort_order: c.sort_order || 0,
        created_at: c.created_at || "",
      }) as CategoryRow);
    }
  } catch { }
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
  const text = `${c?.title || ""} ${c?.category_id || ""} ${c?.ref_code || ""}`.toLowerCase();
  if (text.includes("قلب") || text.includes("جراح") || text.includes("يوسف") || text.includes("heart") || text.includes("case-001")) {
    return "/images/cases/case-heart-child.jpg";
  }
  if (text.includes("زواج") || text.includes("يتيمة") || text.includes("عروس") || text.includes("أمل") || text.includes("bride") || text.includes("marriage") || text.includes("case-002")) {
    return "/images/cases/case-bride.png";
  }
  if (text.includes("طالب") || text.includes("تعليم") || text.includes("جامعة") || text.includes("مدرسة") || text.includes("كتاب") || text.includes("education") || text.includes("case-003")) {
    return "/images/cases/case-education.jpg";
  }
  if (text.includes("تسقيف") || text.includes("سكن") || text.includes("منزل") || text.includes("بيت") || text.includes("أجهزة") || text.includes("غسالة") || text.includes("ثلاجة") || text.includes("housing")) {
    return "/images/cases/case-housing.jpg";
  }
  if (text.includes("سلال") || text.includes("إطعام") || text.includes("طعام") || text.includes("وجبة") || text.includes("كرتونة") || text.includes("غذاء") || text.includes("food")) {
    return "/images/cases/case-food.jpg";
  }
  if (text.includes("أطراف") || text.includes("طرف") || text.includes("صناعي") || text.includes("كرسي") || text.includes("متحرك") || text.includes("prosthetics")) {
    return "/images/cases/case-prosthetics.jpg";
  }
  if (text.includes("علاج") || text.includes("دواء") || text.includes("طبي") || text.includes("مستشفى") || text.includes("عملية") || text.includes("مرض") || text.includes("medical")) {
    return "/images/cases/case-medical.jpg";
  }
  if (text.includes("كفالة") || text.includes("يتيم") || text.includes("أيتام") || text.includes("أسرة") || text.includes("فقر") || text.includes("غارم") || text.includes("family")) {
    return "/images/cases/case-family.jpg";
  }
  return "/images/cases/case-medical.jpg";
}

export const FALLBACK_PUBLIC_CASES: CaseRow[] = [
  {
    id: "case-seed-001",
    ref_code: "CASE-001",
    category_id: "medical",
    title: "إجراء جراحة قلب عاجلة للطفل يوسف",
    story: "طفل يبلغ من العمر 7 سنوات يعاني من ثقب خلقي في القلب، يحتاج لعملية جراحية عاجلة ودقيقة بمستشفى المنصورة الجامعي لإنقاذ حياته واستعادة طفولته.",
    beneficiary_name: "يوسف م. ع.",
    beneficiary_age: 7,
    beneficiary_gender: "male",
    governorate: "الدقهلية",
    city: "المنصورة",
    area: "الجامعة",
    cover_image_url: "/images/cases/case-heart-child.jpg",
    needed_amount: 35000,
    raised_amount: 14200,
    deadline: "2026-11-30",
    urgency: "high",
    status: "approved",
    approved_at: "2026-03-01T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    approved_by: "field_researcher_1",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-medical",
      slug: "medical",
      name_ar: "حالات طبية وعلاج",
      name_en: "Medical & Treatment",
      icon: "Activity",
      active: true,
      sort_order: 1,
      created_at: "",
    },
  } as unknown as CaseRow,
  {
    id: "case-seed-002",
    ref_code: "CASE-002",
    category_id: "housing",
    title: "تيسير زواج فتاة يتيمة الأبوين بالمنزلة",
    story: "فتاة نشأت يتيمة الأبوين بمركز المنزلة، متعثرة في توفير الأجهزة الكهربائية الأساسية (غسالة، ثلاجة، بوتاجاز ومفروشات) لإتمام زواجها وسترها.",
    beneficiary_name: "أمل ح. س.",
    beneficiary_age: 22,
    beneficiary_gender: "female",
    governorate: "الدقهلية",
    city: "المنزلة",
    area: "المنزلة",
    cover_image_url: "/images/cases/case-bride.png",
    needed_amount: 18000,
    raised_amount: 7500,
    deadline: "2026-11-15",
    urgency: "high",
    status: "approved",
    approved_at: "2026-03-02T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-02T10:00:00Z",
    updated_at: "2026-03-02T10:00:00Z",
    approved_by: "field_researcher_2",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-housing",
      slug: "housing",
      name_ar: "إسكان وتسقيف منازل",
      name_en: "Housing & Roofing",
      icon: "Home",
      active: true,
      sort_order: 2,
      created_at: "",
    },
  } as unknown as CaseRow,
  {
    id: "case-seed-003",
    ref_code: "CASE-003",
    category_id: "education",
    title: "كفالة دراسية ومصروفات لطالب طب متفوق",
    story: "طالب يتيم الأب متفوق بالفرقة الثالثة بكلية الطب البشري، مهدد بوقف قيده بسبب المصروفات الدراسية وثمن الكتب والمراجع الطبية وأدوات التدريب.",
    beneficiary_name: "محمد أ. خ.",
    beneficiary_age: 21,
    beneficiary_gender: "male",
    governorate: "الدقهلية",
    city: "المنصورة",
    area: "توريل",
    cover_image_url: "/images/cases/case-education.jpg",
    needed_amount: 12000,
    raised_amount: 5000,
    deadline: "2026-12-01",
    urgency: "medium",
    status: "approved",
    approved_at: "2026-03-03T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-03T10:00:00Z",
    updated_at: "2026-03-03T10:00:00Z",
    approved_by: "field_researcher_1",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-education",
      slug: "education",
      name_ar: "تعليم وكفالة أيتام",
      name_en: "Education & Orphans",
      icon: "GraduationCap",
      active: true,
      sort_order: 4,
      created_at: "",
    },
  } as unknown as CaseRow,
  {
    id: "case-seed-004",
    ref_code: "CASE-004",
    category_id: "housing",
    title: "تسقيف منزل متهالك لأسرة أيتام ببلقاس",
    story: "منزل مبني من الطوب اللبن بدون سقف خرساني يحمي أرامل وأطفالاً من مياه الأمطار الشديدة وبرد الشتاء، بحاجة لصبة وسقف خشبي وعزل مائي كامل.",
    beneficiary_name: "أم كريم ومحمود",
    beneficiary_age: 44,
    beneficiary_gender: "female",
    governorate: "الدقهلية",
    city: "بلقاس",
    area: "قرية المعصرة",
    cover_image_url: "/images/cases/case-housing.jpg",
    needed_amount: 24000,
    raised_amount: 9800,
    deadline: "2026-11-20",
    urgency: "critical",
    status: "approved",
    approved_at: "2026-03-04T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-04T10:00:00Z",
    updated_at: "2026-03-04T10:00:00Z",
    approved_by: "field_researcher_3",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-housing",
      slug: "housing",
      name_ar: "إسكان وتسقيف منازل",
      name_en: "Housing & Roofing",
      icon: "Home",
      active: true,
      sort_order: 2,
      created_at: "",
    },
  } as unknown as CaseRow,
  {
    id: "case-seed-005",
    ref_code: "CASE-005",
    category_id: "food",
    title: "توفير سلال غذائية متكاملة لـ 15 أسرة متعففة",
    story: "توفير الدعم الغذائي الشهري من زيت وأرز وسكر وبقوليات ولحوم لـ 15 أسرة من أسر الأيتام وذوي الإعاقة وكبار السن الذين لا يملكون أي دخل ثابت.",
    beneficiary_name: "أسر شربين المتعففة",
    beneficiary_age: null,
    beneficiary_gender: null,
    governorate: "الدقهلية",
    city: "شربين",
    area: "قرى شربين",
    cover_image_url: "/images/cases/case-food.jpg",
    needed_amount: 15000,
    raised_amount: 6200,
    deadline: "2026-12-15",
    urgency: "medium",
    status: "approved",
    approved_at: "2026-03-05T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-05T10:00:00Z",
    updated_at: "2026-03-05T10:00:00Z",
    approved_by: "field_researcher_2",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-food",
      slug: "food",
      name_ar: "إطعام وسلال غذائية",
      name_en: "Food Baskets",
      icon: "Utensils",
      active: true,
      sort_order: 3,
      created_at: "",
    },
  } as unknown as CaseRow,
  {
    id: "case-seed-006",
    ref_code: "CASE-006",
    category_id: "medical",
    title: "توفير طرف صناعي هيدروليكي لشاب عائل",
    story: "شاب عائل لـ 3 أطفال أصيب في حادث أليم أدى لبتر ساقه، يحتاج لطرف صناعي حديث مع جلسات تأهيل حركي وعلاج طبيعي ليعود للعمل وكسب رزقه بكرامة.",
    beneficiary_name: "سامح ع. م.",
    beneficiary_age: 34,
    beneficiary_gender: "male",
    governorate: "الدقهلية",
    city: "ميت غمر",
    area: "ميت غمر",
    cover_image_url: "/images/cases/case-prosthetics.jpg",
    needed_amount: 28000,
    raised_amount: 12500,
    deadline: "2026-11-25",
    urgency: "high",
    status: "approved",
    approved_at: "2026-03-06T10:00:00Z",
    closed_at: null,
    created_at: "2026-03-06T10:00:00Z",
    updated_at: "2026-03-06T10:00:00Z",
    approved_by: "field_researcher_1",
    created_by: null,
    assigned_delegate_id: null,
    delegate_notes: null,
    rejection_reason: null,
    scheduled_visit_at: null,
    case_categories: {
      id: "cat-medical",
      slug: "medical",
      name_ar: "حالات طبية وعلاج",
      name_en: "Medical & Treatment",
      icon: "Activity",
      active: true,
      sort_order: 1,
      created_at: "",
    },
  } as unknown as CaseRow,
];

export async function listPublicCases(opts?: { categorySlug?: string; limit?: number }) {
  try {
    const lCases = await casesApiV1.listAll();
    if (Array.isArray(lCases) && lCases.length > 0) {
      let filtered = lCases.filter((c: any) => c.status === "approved" || c.status === "completed" || !c.status);
      if (opts?.categorySlug) {
        filtered = filtered.filter((c: any) => c.category?.toLowerCase() === opts.categorySlug?.toLowerCase() || c.category_id == opts.categorySlug);
      }
      if (filtered.length > 0) {
        if (opts?.limit) filtered = filtered.slice(0, opts.limit);
        return filtered.map(mapLaravelCaseToRow);
      }
    }
  } catch (err) {
    console.warn("Could not fetch public cases from Laravel API:", err);
  }

  // Filter fallback cases by category if requested
  let results = [...FALLBACK_PUBLIC_CASES];
  if (opts?.categorySlug) {
    const slug = opts.categorySlug.toLowerCase();
    results = results.filter(
      (c) =>
        c.category_id?.toLowerCase() === slug ||
        (c as any).case_categories?.slug?.toLowerCase() === slug
    );
  }
  if (opts?.limit) {
    results = results.slice(0, opts.limit);
  }
  return results;
}

export async function getCaseByRef(ref: string) {
  try {
    const id = ref.startsWith("CASE-") ? ref.replace("CASE-", "") : ref;
    const lCase = await casesApiV1.get(id);
    if (lCase && lCase.id) return mapLaravelCaseToRow(lCase);

    const all = await casesApiV1.listAll();
    const found = all.find((c: any) => c.code === ref || String(c.id) === ref);
    if (found) return mapLaravelCaseToRow(found);
  } catch { }

  const fallback = FALLBACK_PUBLIC_CASES.find(
    (c) => c.ref_code === ref || c.id === ref || c.ref_code.toLowerCase() === ref.toLowerCase()
  );
  if (fallback) return fallback;

  if (isRestProvider()) return (await restApi.getCaseByRef(ref)) as CaseRow | null;
  return null;
}

function mapLaravelCaseToRow(c: LaravelCase): CaseRow {
  const catName = c.category_data?.name_ar || (c.category && !c.category.includes("required") ? c.category : "كفالات ورعاية");
  return {
    id: String(c.id),
    ref_code: c.code || `CASE-${c.id}`,
    category_id: catName,
    title: c.title || "",
    story: c.description || (c as any).story || "",
    beneficiary_name: c.beneficiary_name || "",
    beneficiary_age: null,
    beneficiary_gender: null,
    governorate: c.governorate || "الدقهلية",
    city: (c as any).city || c.governorate || null,
    area: (c as any).area || null,
    cover_image_url: getCaseImageUrl({
      cover_image_url: c.cover_image || (c as any).cover_image_url || (c as any).image,
      title: c.title,
      category_id: catName,
      ref_code: c.code || `CASE-${c.id}`,
    }),
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
      id: String(c.category_data?.id || "general"),
      slug: c.category_data?.slug || "general",
      name_ar: catName,
      name_en: c.category_data?.name_en || "General",
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
  } catch { }
  return null;
}

export async function listDonationsForCase(_caseId: string) {
  // Supabase removed — use Laravel donations API instead
  return [];
}

export async function createCase(input: CaseInput) {
  try {
    const code = input.code || `CASE-${Date.now().toString(36).toUpperCase()}`;
    const priority = input.priority || (input.urgency === "high" || (input.urgency as string) === "critical" ? "high" : (input.urgency as string) === "urgent" ? "medium" : "low");
    const targetAmount = Number(input.target_amount ?? input.needed_amount ?? 0);
    const created = await casesApiV1.create({
      code,
      title: input.title,
      beneficiary_name: input.beneficiary_name,
      governorate: input.governorate || "الدقهلية",
      city: input.city || null,
      age: input.beneficiary_age ?? null,
      target_amount: targetAmount,
      category_id: !isNaN(Number(input.category_id)) ? Number(input.category_id) : 1,
      program_id: input.program_id ? Number(input.program_id) : null,
      project_id: input.project_id ? Number(input.project_id) : null,
      donation_campaign_id: input.donation_campaign_id ? Number(input.donation_campaign_id) : null,
      priority,
      cover_image: input.cover_image || input.cover_image_url || null,
      description: input.description || input.story || input.title || "تفاصيل الحالة للمستفيد",
      status: input.status || "pending_review",
    } as any);
    return mapLaravelCaseToRow(created);
  } catch (err) {
    console.warn("Could not create case on Laravel API:", err);
    throw err;
  }
}

export async function updateCase(id: string, patch: Partial<CaseInput> & { status?: string; rejection_reason?: string | null }) {
  try {
    const payload: Record<string, unknown> = {};
    if (patch.title) payload.title = patch.title;
    if (patch.code) payload.code = patch.code;
    if (patch.beneficiary_name) payload.beneficiary_name = patch.beneficiary_name;
    if (patch.target_amount !== undefined) payload.target_amount = Number(patch.target_amount);
    else if (patch.needed_amount !== undefined) payload.target_amount = Number(patch.needed_amount);
    if (patch.story) payload.description = patch.story;
    if (patch.description) payload.description = patch.description;
    if (patch.governorate) payload.governorate = patch.governorate;
    if (patch.city !== undefined) payload.city = patch.city;
    if (patch.beneficiary_age !== undefined) payload.age = patch.beneficiary_age;
    if (patch.cover_image !== undefined) payload.cover_image = patch.cover_image;
    else if (patch.cover_image_url !== undefined) payload.cover_image = patch.cover_image_url;
    if (patch.category_id !== undefined && !isNaN(Number(patch.category_id))) {
      payload.category_id = Number(patch.category_id);
    }
    if (patch.program_id !== undefined) payload.program_id = patch.program_id ? Number(patch.program_id) : null;
    if (patch.project_id !== undefined) payload.project_id = patch.project_id ? Number(patch.project_id) : null;
    if (patch.donation_campaign_id !== undefined) payload.donation_campaign_id = patch.donation_campaign_id ? Number(patch.donation_campaign_id) : null;
    if (patch.priority) payload.priority = patch.priority;
    else if (patch.urgency) {
      payload.priority = (patch.urgency === "high" || (patch.urgency as string) === "critical" ? "high" : "medium") as "low" | "medium" | "high";
    }
    if (patch.status) {
      const mapSt = patch.status === "funded" ? "completed" : patch.status === "pending" ? "pending_review" : patch.status;
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
  } catch { }
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

export async function updateDonationStatus(id: string, status: DonationStatus) {
  try {
    await donationsApiV1.update(id, { status } as any);
  } catch { }
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
  return [] as Pick<JourneyStepRow, "id" | "step_key" | "title_ar" | "title_en" | "note_ar" | "note_en" | "media_url" | "occurred_at" | "is_public">[];
}

export async function uploadCaseMedia(_file: File, _opts: { caseId?: string; visibility?: "public" | "private"; docType?: string; caption?: string }) {
  throw new Error("Media upload requires server integration");
}

/** Backend program used for general (untargeted) donations, e.g. the home quick-donate. */
export const GENERAL_PROGRAM_ID = Number(import.meta.env.VITE_GENERAL_PROGRAM_ID) || 36;

export async function createDonation(input: {
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
  if (input.case_id && !isNaN(Number(input.case_id)) && Number(input.case_id) > 0) {
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
      name: input.donor_name || "متبرع فاعل خير",
      email: input.donor_email || "donor@elyusr.org",
      phone: input.donor_phone || "01000000000",
      address: "مصر",
      amount: Number(input.amount),
      payment_method_id: pmInfo.id,
      payment_method: pmInfo.method,
      redirect_url: frontendUrl,
      merchant_redirect: frontendUrl,
      notes: input.message || "تبرع عبر بوابة اليسر",
      [targetField.key]: targetField.value,
    });
  } catch (err) {
    console.warn("Laravel donation submit API notice:", err);
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