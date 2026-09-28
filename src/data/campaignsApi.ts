import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { volunteerCampaignsApi, type LaravelVolunteerCampaign } from "@/data/laravelApi";

export type Campaign = Database["public"]["Tables"]["volunteer_campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["volunteer_campaigns"]["Insert"];
export type CampaignUpdate = Database["public"]["Tables"]["volunteer_campaigns"]["Update"];
export type Application = Database["public"]["Tables"]["volunteer_applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["volunteer_applications"]["Insert"];
export type ApplicationStatus = Database["public"]["Enums"]["application_status"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

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
  // 1. Try Laravel API v1
  try {
    const data = await volunteerCampaignsApi.listAll();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapLaravelCampaign);
    }
  } catch {}

  // 2. Supabase fallback
  try {
    const { data, error } = await supabase
      .from("volunteer_campaigns")
      .select("*")
      .in("status", ["open", "closed", "completed"])
      .order("event_date", { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) return data as Campaign[];
  } catch {}

  return DEFAULT_CAMPAIGNS;
};

export const listAllCampaigns = async (): Promise<Campaign[]> => {
  // 1. Try Laravel API v1
  try {
    const data = await volunteerCampaignsApi.listAll();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapLaravelCampaign);
    }
  } catch {}

  // 2. Supabase fallback
  try {
    const { data, error } = await supabase
      .from("volunteer_campaigns").select("*").order("event_date", { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) return data as Campaign[];
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
    return;
  } catch {}

  try {
    const { error } = await supabase.from("volunteer_campaigns").update({ status }).eq("id", id);
    if (error) throw error;
  } catch {}
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
  } catch {}

  if ("id" in c && c.id) {
    const { id, ...rest } = c as any;
    const { error } = await supabase.from("volunteer_campaigns").update(rest).eq("id", id);
    if (error) throw error;
    return id as string;
  }
  const { data, error } = await supabase.from("volunteer_campaigns").insert(c as CampaignInsert).select("id").single();
  if (error) throw error;
  return data.id as string;
};

export const deleteCampaign = async (id: string) => {
  try {
    await volunteerCampaignsApi.delete(id);
    return;
  } catch {}
  const { error } = await supabase.from("volunteer_campaigns").delete().eq("id", id);
  if (error) throw error;
};

export const listApplications = async (campaignId: string) => {
  try {
    const { data, error } = await supabase
      .from("volunteer_applications").select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) return data as Application[];
  } catch {}
  return [] as Application[];
};

export const submitApplication = async (a: ApplicationInsert) => {
  const { error } = await supabase.from("volunteer_applications").insert(a);
  if (error) throw error;
};

export const setApplicationStatus = async (
  id: string, status: ApplicationStatus, extras: { assigned_role?: string; shift?: string } = {}
) => {
  const { error } = await supabase
    .from("volunteer_applications")
    .update({ status, reviewed_at: new Date().toISOString(), ...extras })
    .eq("id", id);
  if (error) throw error;
};

export const deleteApplication = async (id: string) => {
  const { error } = await supabase.from("volunteer_applications").delete().eq("id", id);
  if (error) throw error;
};
