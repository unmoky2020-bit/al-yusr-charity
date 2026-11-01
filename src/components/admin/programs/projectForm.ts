/**
 * Project editor state <-> API payload mapping.
 *
 * The live /projects record only has the EXISTING keys below. Everything in PROPOSED_PROJECT_KEYS
 * mirrors the program columns and is documented as new columns in backend-handoff/04-programs-projects.md.
 * The editor sends them; if the backend drops them, the save result says so (no fake success).
 */
import type { AdminProjectRecord } from "@/data/api/programsAdminApi";
import {
  cleanList,
  emptySeo,
  nullableNumber,
  nullableString,
  numStr,
  seoFromRecord,
  seoToPayload,
  SEO_KEYS,
  str,
  toStringList,
  type SeoFormState,
} from "./formUtils";

export const EXISTING_PROJECT_KEYS = [
  "name", "name_en", "slug", "description", "short_description", "short_description_en",
  "target_amount", "starting_price", "display_order", "cover_image", "is_active",
] as const;

export const PROPOSED_PROJECT_KEYS: string[] = [
  "description_en", "content_ar", "content_en", "benefits_ar", "benefits_en",
  "donation_available", "hide_from_audience", "page_content",
  ...SEO_KEYS,
];

export interface ProjectForm {
  name: string;
  name_en: string;
  slug: string;
  short_description: string;
  short_description_en: string;
  description: string;
  description_en: string;
  content_ar: string;
  content_en: string;
  benefits_ar: string[];
  benefits_en: string[];
  target_amount: string;
  starting_price: string;
  display_order: string;
  cover_image: string;
  is_active: boolean;
  hide_from_audience: boolean;
  donation_available: boolean;
  seo: SeoFormState;
}

export function emptyProjectForm(): ProjectForm {
  return {
    name: "", name_en: "", slug: "", short_description: "", short_description_en: "",
    description: "", description_en: "", content_ar: "", content_en: "",
    benefits_ar: [], benefits_en: [],
    target_amount: "", starting_price: "", display_order: "", cover_image: "",
    is_active: true, hide_from_audience: false, donation_available: true,
    seo: { ...emptySeo(), schema_type: "Service", twitter_card: "summary_large_image" },
  };
}

export function projectFormFromRecord(p: AdminProjectRecord): ProjectForm {
  const r = p as Record<string, unknown>;
  return {
    name: str(p.name ?? r.name_ar),
    name_en: str(p.name_en),
    slug: str(p.slug),
    short_description: str(p.short_description),
    short_description_en: str(p.short_description_en),
    description: str(p.description ?? r.description_ar),
    description_en: str(r.description_en),
    content_ar: str(r.content_ar),
    content_en: str(r.content_en),
    benefits_ar: toStringList(r.benefits_ar),
    benefits_en: toStringList(r.benefits_en),
    target_amount: numStr(p.target_amount),
    starting_price: numStr(p.starting_price),
    display_order: p.display_order === null || p.display_order === undefined ? "" : String(p.display_order),
    cover_image: str(p.cover_image ?? r.image),
    is_active: p.is_active !== false,
    hide_from_audience: Boolean(r.hide_from_audience),
    donation_available: r.donation_available === undefined ? true : Boolean(r.donation_available),
    seo: seoFromRecord(r),
  };
}

/** Payload for POST/PUT /projects. cover_image is a URL / storage-path string (uploads go to the media library first). */
export function projectPayload(f: ProjectForm): Record<string, unknown> {
  const benefitsAr = cleanList(f.benefits_ar);
  const benefitsEn = cleanList(f.benefits_en);
  return {
    // existing columns
    name: f.name.trim(),
    name_en: nullableString(f.name_en),
    slug: nullableString(f.slug),
    short_description: nullableString(f.short_description),
    short_description_en: nullableString(f.short_description_en),
    description: nullableString(f.description),
    target_amount: nullableNumber(f.target_amount),
    starting_price: nullableNumber(f.starting_price),
    display_order: nullableNumber(f.display_order),
    cover_image: nullableString(f.cover_image),
    is_active: f.is_active,
    // proposed columns
    description_en: nullableString(f.description_en),
    content_ar: nullableString(f.content_ar),
    content_en: nullableString(f.content_en),
    benefits_ar: benefitsAr,
    benefits_en: benefitsEn,
    hide_from_audience: f.hide_from_audience,
    donation_available: f.donation_available,
    ...seoToPayload(f.seo),
  };
}
