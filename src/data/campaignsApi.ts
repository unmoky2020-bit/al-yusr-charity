import { volunteerCampaignsApi, apiFetch, type LaravelVolunteerCampaign } from "@/data/laravelApi";

export type CampaignStatus = "open" | "closed" | "completed" | "draft";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "waitlisted";

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
    description_ar: "تجهيز وتعبئة 5000 كرتونة مواد غذائية لأسر القرى الأكثر احتياجاً في الدقهلية.",
    description_en: "Packing and delivering 5,000 food parcels to impoverished families.",
    city: "المنصورة",
    location: "مقر مستودع مؤسسة اليسر - المنصورة",
    event_date: "2026-03-15",
    capacity: 50,
    accepted_count: 32,
    status: "open",
    program_slug: "food",
    required_skills: ["تعبئة", "تنظيم", "سواقة"],
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
    cover_image_url: null,
    created_at: lc.created_at || new Date().toISOString(),
    updated_at: lc.updated_at || new Date().toISOString(),
  };
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

export const listAllCampaigns = async (): Promise<Campaign[]> => {
  try {
    const data = await volunteerCampaignsApi.listAll();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapLaravelCampaign);
    }
  } catch {}
  return DEFAULT_CAMPAIGNS;
};

export const getCampaignBySlug = async (slug: string): Promise<Campaign | null> => {
  try {
    const all = await listAllCampaigns();
    const found = all.find((c) => c.slug === slug || String(c.id) === slug);
    if (found) return found;
  } catch {}
  return DEFAULT_CAMPAIGNS.find((c) => c.slug === slug) || null;
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const all = await listAllCampaigns();
    const found = all.find((c) => String(c.id) === String(id));
    if (found) return found;
  } catch {}
  return DEFAULT_CAMPAIGNS.find((c) => c.id === id) || null;
};

export const setCampaignStatus = async (id: string, status: CampaignStatus) => {
  try {
    await volunteerCampaignsApi.update(id, { status });
  } catch (e) {
    if (import.meta.env.DEV) console.error("setCampaignStatus failed", e);
  }
};

export const upsertCampaign = async (c: CampaignInsert | (CampaignUpdate & { id: string })) => {
  try {
    if ("id" in c && c.id) {
      await volunteerCampaignsApi.update(c.id, c as any);
      return String(c.id);
    } else {
      const res = await volunteerCampaignsApi.create(c as any);
      return String((res as any)?.id || Date.now());
    }
  } catch (e) {
    if (import.meta.env.DEV) console.error("upsertCampaign failed", e);
    return String(Date.now());
  }
};

export const deleteCampaign = async (id: string) => {
  await volunteerCampaignsApi.delete(id);
};

export const listApplications = async (campaignId: string): Promise<Application[]> => {
  try {
    const res = await apiFetch<{ data?: any[] } | any[]>(
      `/volunteer-campaigns/${campaignId}/applications`,
      { method: "GET", ttlMs: 10000 }
    );
    const items = Array.isArray(res) ? res : ((res as any)?.data ?? []);
    return items.map((a: any) => ({
      id: String(a.id || ""),
      campaign_id: String(a.campaign_id || campaignId),
      full_name: a.full_name || a.name || "",
      email: a.email || "",
      phone: a.phone || "",
      skills: Array.isArray(a.skills) ? a.skills : [],
      status: (a.status || "pending") as ApplicationStatus,
      assigned_role: a.assigned_role || undefined,
      shift: a.shift || undefined,
      reviewed_at: a.reviewed_at || null,
      created_at: a.created_at || new Date().toISOString(),
    }));
  } catch {}
  return [];
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
