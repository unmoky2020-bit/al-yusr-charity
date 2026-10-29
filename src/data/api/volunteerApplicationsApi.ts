/**
 * Volunteer applications (a volunteer joining a volunteer campaign) — replaces the Supabase
 * tables `volunteer_applications` + `volunteer_campaigns` used by "My tasks".
 *
 * EXISTING:  GET /volunteer-campaigns
 * LIVE (2026-10-29): GET /volunteer-applications?mine=1   (applications of the signed-in user, with `campaign`)
 *            DELETE /volunteer-applications/{id}  (owner may cancel while status=pending)
 * See backend-handoff/02-replace-supabase-admin.md.
 */
import { fetchList, sendJson } from "./adminApiHelpers";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "attended" | "cancelled";

export interface VolunteerApplicationCampaign {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  event_date: string;
  event_time: string | null;
  location: string;
  governorate: string;
  required_skills: string[];
}

export interface VolunteerApplication {
  id: string;
  campaign_id: string;
  volunteer_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  city: string | null;
  skills: string[];
  status: ApplicationStatus | string;
  assigned_role: string | null;
  shift: string | null;
  notes: string | null;
  created_at: string;
  campaign: VolunteerApplicationCampaign | null;
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((x) => x.trim()) : [];
const strOrNull = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));

function mapCampaign(r: Record<string, unknown> | null | undefined): VolunteerApplicationCampaign | null {
  if (!r) return null;
  return {
    id: String(r.id),
    slug: String(r.slug ?? r.id),
    title_ar: String(r.title_ar ?? ""),
    title_en: String(r.title_en ?? r.title_ar ?? ""),
    description_ar: String(r.description_ar ?? ""),
    description_en: String(r.description_en ?? r.description_ar ?? ""),
    event_date: String(r.event_date ?? ""),
    event_time: strOrNull(r.event_time),
    location: String(r.location ?? ""),
    governorate: String(r.governorate ?? ""),
    required_skills: arr(r.required_skills),
  };
}

function mapApplication(r: Record<string, unknown>): VolunteerApplication {
  const campaignRaw = (r.campaign ?? r.volunteer_campaign) as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    campaign_id: String(r.campaign_id ?? r.volunteer_campaign_id ?? campaignRaw?.id ?? ""),
    volunteer_id: strOrNull(r.volunteer_id),
    full_name: String(r.full_name ?? r.name ?? ""),
    email: strOrNull(r.email),
    phone: String(r.phone ?? ""),
    city: strOrNull(r.city),
    skills: arr(r.skills),
    status: String(r.status ?? "pending"),
    assigned_role: strOrNull(r.assigned_role),
    shift: strOrNull(r.shift),
    notes: strOrNull(r.notes),
    created_at: String(r.created_at ?? ""),
    campaign: mapCampaign(campaignRaw),
  };
}

export const volunteerApplicationsApi = {
  /** Applications of the signed-in user (the backend resolves the user from the token). */
  async listMine(): Promise<VolunteerApplication[]> {
    const rows = await fetchList<Record<string, unknown>>("/volunteer-applications", { mine: 1, per_page: 200 });
    const apps = rows.map(mapApplication);
    // If the backend does not embed the campaign, join with the existing /volunteer-campaigns list.
    if (apps.some((a) => !a.campaign && a.campaign_id)) {
      try {
        const camps = await fetchList<Record<string, unknown>>("/volunteer-campaigns", { per_page: 200 });
        const byId = new Map(camps.map((c) => [String(c.id), mapCampaign(c)]));
        for (const a of apps) if (!a.campaign) a.campaign = byId.get(a.campaign_id) ?? null;
      } catch {
        /* campaign details are optional for this list */
      }
    }
    return apps.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  },
  cancel(id: string) {
    return sendJson<void>(`/volunteer-applications/${id}`, "DELETE");
  },
};
