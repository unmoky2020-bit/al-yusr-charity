import { volunteerCampaignsApi, apiFetch, invalidateApiCache, type LaravelVolunteerCampaign } from "@/data/laravelApi";
import { fetchList, unwrapItem, unwrapList } from "@/data/api/adminApiHelpers";

export type CampaignStatus = "open" | "closed" | "completed" | "draft" | "cancelled";
/** Matches the backend enum on volunteer_campaign_applications.status (migration 2026_10_30_140000). */
export type ApplicationStatus =
  | "invited" | "pending" | "approved" | "rejected" | "withdrawn" | "waitlist" | "attended" | "noshow";

export type Campaign = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  city: string;
  location: string;
  event_date: string;
  capacity: number;
  accepted_count: number;
  status: CampaignStatus;
  program_slug: string;
  required_skills: string[];
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  /** Laravel volunteer-campaign fields exposed for the admin detail screen. */
  governorate?: string;
  event_time?: string | null;
  slots_needed?: number;
  slots_filled?: number;
};

export type CampaignInsert = Omit<Campaign, "id" | "created_at" | "updated_at">;
export type CampaignUpdate = Partial<CampaignInsert>;

export type Application = {
  id: string;
  campaign_id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  status: ApplicationStatus;
  assigned_role?: string;
  shift?: string;
  reviewed_at?: string | null;
  created_at: string;
  volunteer_id?: string | null;
  city?: string | null;
  notes?: string | null;
};

export type ApplicationInsert = Omit<Application, "id" | "created_at" | "reviewed_at" | "status"> & {
  status?: ApplicationStatus;
};

export const slugify = (s: string) =>
  s.toString().trim().toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 80) || `c-${Date.now()}`;

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    slug: "ramadan-food-boxes-2026",
    title_ar: "حملة تعبئة وتوزيع كراتين رمضان 2026",
    title_en: "Ramadan 2026 Food Box Packing & Distribution",
    description_ar: "تجهيز وتعبئة 5000 كرتونة مواد غذائية لأسر القرى الأكثر احتياجًا في الدقهلية.",
    description_en: "Packing and delivering 5,000 food parcels to impoverished families.",
    city: "المنصورة",
    location: "مقر مستودع مؤسسة اليسر - المنصورة",
    event_date: "2026-03-15",
    capacity: 50,
    accepted_count: 32,
    status: "open",
    program_slug: "food",
    required_skills: ["تعبئة", "تنظيم", "قيادة سيارات"],
    cover_image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "camp-2",
    slug: "medical-convoy-sherbin",
    title_ar: "قافلة اليسر الطبية الشاملة بقرى شربين",
    title_en: "Comprehensive Medical Convoy in Sherbin",
    description_ar: "يوم طبي متكامل للكشف وصرف العلاج المجاني وإجراء الفحوصات لكبار السن والأطفال.",
    description_en: "Full medical day providing free consultations and medicine in Sherbin villages.",
    city: "شربين",
    location: "الوحدة الصحية - قرى شربين",
    event_date: "2026-04-05",
    capacity: 30,
    accepted_count: 18,
    status: "open",
    program_slug: "health",
    required_skills: ["تمريض", "صيدلة", "استقبال وتنظيم"],
    cover_image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function mapLaravelCampaign(lc: LaravelVolunteerCampaign): Campaign {
  return {
    id: String(lc.id),
    slug: (lc as any).slug || slugify(lc.title_ar || `camp-${lc.id}`),
    title_ar: lc.title_ar,
    title_en: lc.title_en || "",
    description_ar: lc.description_ar || "",
    description_en: lc.description_en || "",
    city: lc.city || lc.governorate || "المنصورة",
    location: lc.location || "",
    event_date: lc.event_date || new Date().toISOString().slice(0, 10),
    capacity: Number(lc.required_volunteers) || 50,
    accepted_count: Number(lc.approved_volunteers_count) || 0,
    status: (lc.status as CampaignStatus) || "open",
    program_slug: "general",
    required_skills: Array.isArray(lc.required_skills) ? lc.required_skills : ["تنظيم", "تطوع"],
    cover_image_url: ((lc as unknown as Record<string, unknown>).cover_image_url as string | null) ?? null,
    created_at: lc.created_at || new Date().toISOString(),
    updated_at: lc.updated_at || new Date().toISOString(),
    governorate: lc.governorate || "",
    event_time: lc.event_time ?? null,
    slots_needed: Number(lc.required_volunteers) || 0,
    slots_filled: Number(lc.approved_volunteers_count) || 0,
  };
}

/** Maps the frontend campaign shape to the Laravel `/volunteer-campaigns` body. */
function toLaravelPayload(c: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const copy = ["title_ar", "title_en", "description_ar", "description_en", "event_date", "event_time",
    "governorate", "city", "location", "required_skills", "status", "slug", "cover_image_url"];
  for (const k of copy) if (c[k] !== undefined) out[k] = c[k];
  const needed = c.slots_needed ?? c.capacity ?? c.required_volunteers;
  if (needed !== undefined) out.required_volunteers = Number(needed) || 0;
  return out;
}

export const listPublicCampaigns = async (): Promise<Campaign[]> => {
  try {
    const data = await volunteerCampaignsApi.listAll();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapLaravelCampaign);
    }
  } catch {}
  return DEFAULT_CAMPAIGNS;
};

/**
 * Admin list: real API data only. Throws on failure and returns [] when the backend has no
 * campaigns (no demo fallback — admins must never see fake rows they cannot edit).
 */
export const listAllCampaigns = async (): Promise<Campaign[]> => {
  const data = await fetchList<LaravelVolunteerCampaign>("/volunteer-campaigns", { per_page: 200 });
  return data.map(mapLaravelCampaign);
};

/** Public page lookup (keeps the public demo fallback via listPublicCampaigns). */
export const getCampaignBySlug = async (slug: string): Promise<Campaign | null> => {
  try {
    const all = await listPublicCampaigns();
    const found = all.find((c) => c.slug === slug || String(c.id) === slug);
    if (found) return found;
  } catch {}
  return DEFAULT_CAMPAIGNS.find((c) => c.slug === slug) || null;
};

/** Admin lookup: GET /volunteer-campaigns/{id}. Returns null only on 404; other errors throw. */
export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const lc = await volunteerCampaignsApi.get(id, { useCache: false });
    return lc && (lc as LaravelVolunteerCampaign).id !== undefined ? mapLaravelCampaign(lc as LaravelVolunteerCampaign) : null;
  } catch (e) {
    if ((e as { status?: number })?.status === 404) return null;
    throw e;
  }
};

export const setCampaignStatus = async (id: string, status: CampaignStatus) => {
  await apiFetch(`/volunteer-campaigns/${id}`, { method: "PUT", body: { status } });
  invalidateApiCache("/volunteer-campaigns");
};

/** Create or update a volunteer campaign. Throws on failure; returns the real backend id. */
export const upsertCampaign = async (c: CampaignInsert | (CampaignUpdate & { id: string })): Promise<string> => {
  const body = toLaravelPayload(c as unknown as Record<string, unknown>);
  if ("id" in c && c.id) {
    await apiFetch(`/volunteer-campaigns/${c.id}`, { method: "PUT", body });
    invalidateApiCache("/volunteer-campaigns");
    return String(c.id);
  }
  const res = await apiFetch<unknown>("/volunteer-campaigns", { method: "POST", body });
  invalidateApiCache("/volunteer-campaigns");
  const created = unwrapItem<{ id?: number | string }>(res);
  if (created?.id === undefined || created?.id === null) {
    throw new Error("تم الإرسال لكن الخادم لم يُرجع رقم الحملة — حدّث الصفحة للتأكد");
  }
  return String(created.id);
};

export const deleteCampaign = async (id: string) => {
  await volunteerCampaignsApi.delete(id);
};

/** Applications of one campaign. Throws on failure (admin screens show the error). */
export const listApplications = async (campaignId: string): Promise<Application[]> => {
  const res = await apiFetch<unknown>(`/volunteer-campaigns/${campaignId}/applications`, { method: "GET", useCache: false });
  const items = unwrapList<Record<string, any>>(res);
  return items.map((a) => ({
    id: String(a.id || ""),
    campaign_id: String(a.campaign_id || a.volunteer_campaign_id || campaignId),
    full_name: a.full_name || a.name || "",
    email: a.email || "",
    phone: a.phone || "",
    skills: Array.isArray(a.skills) ? a.skills : [],
    status: (a.status || "pending") as ApplicationStatus,
    assigned_role: a.assigned_role || undefined,
    shift: a.shift || undefined,
    reviewed_at: a.reviewed_at || null,
    created_at: a.created_at || "",
    volunteer_id: a.volunteer_id != null ? String(a.volunteer_id) : (a.user_id != null ? String(a.user_id) : null),
    city: a.city ?? null,
    notes: a.notes ?? null,
  }));
};

export const submitApplication = async (a: ApplicationInsert) => {
  await apiFetch(`/volunteer-campaigns/${a.campaign_id}/apply`, {
    method: "POST",
    body: a,
  });
};

export const setApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  extras: { assigned_role?: string; shift?: string } = {}
) => {
  await apiFetch(`/volunteer-applications/${id}`, {
    method: "PATCH",
    body: { status, reviewed_at: new Date().toISOString(), ...extras },
  });
};

export const deleteApplication = async (id: string) => {
  await apiFetch(`/volunteer-applications/${id}`, { method: "DELETE" });
};
