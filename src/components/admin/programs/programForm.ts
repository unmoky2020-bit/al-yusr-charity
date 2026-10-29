/**
 * Program editor state <-> API payload mapping (every column of GET /programs/{id}).
 */
import type { AdminProgramRecord, ProgramTopSection } from "@/data/api/programsAdminApi";
import {
  cleanList,
  nullableNumber,
  nullableString,
  numStr,
  seoFromRecord,
  seoToPayload,
  str,
  toStringList,
  emptySeo,
  type SeoFormState,
} from "./formUtils";

export interface ProgramForm {
  slug: string;
  name_ar: string;
  name_en: string;
  title_ar: string;
  title_en: string;
  hero_h1_ar: string;
  hero_h1_en: string;
  hero_h3_ar: string;
  hero_h3_en: string;
  hero_image: string;
  tagline_ar: string;
  tagline_en: string;
  period_ar: string;
  period_en: string;
  description_ar: string;
  description_en: string;
  content_ar: string;
  content_en: string;
  benefits_ar: string[];
  benefits_en: string[];
  image: string;
  axis_id: string;
  season_ids: number[];
  target_amount: string;
  minimum_amount: string;
  donation_available: boolean;
  status: "published" | "draft";
  is_active: boolean;
  hide_from_audience: boolean;
  sort_order: string;
  seo: SeoFormState;
}

export function emptyProgramForm(): ProgramForm {
  return {
    slug: "", name_ar: "", name_en: "", title_ar: "", title_en: "",
    hero_h1_ar: "", hero_h1_en: "", hero_h3_ar: "", hero_h3_en: "", hero_image: "",
    tagline_ar: "", tagline_en: "", period_ar: "", period_en: "",
    description_ar: "", description_en: "", content_ar: "", content_en: "",
    benefits_ar: [], benefits_en: [], image: "", axis_id: "", season_ids: [],
    target_amount: "", minimum_amount: "", donation_available: true,
    status: "published", is_active: true, hide_from_audience: false, sort_order: "",
    seo: { ...emptySeo(), schema_type: "Service", twitter_card: "summary_large_image" },
  };
}

export function programFormFromRecord(p: AdminProgramRecord): ProgramForm {
  return {
    slug: str(p.slug),
    name_ar: str(p.name_ar || p.name),
    name_en: str(p.name_en),
    title_ar: str(p.title_ar),
    title_en: str(p.title_en),
    hero_h1_ar: str(p.hero_h1_ar),
    hero_h1_en: str(p.hero_h1_en),
    hero_h3_ar: str(p.hero_h3_ar),
    hero_h3_en: str(p.hero_h3_en),
    hero_image: str(p.hero_image),
    tagline_ar: str(p.tagline_ar),
    tagline_en: str(p.tagline_en),
    period_ar: str(p.period_ar),
    period_en: str(p.period_en),
    description_ar: str(p.description_ar || p.description),
    description_en: str(p.description_en),
    content_ar: str(p.content_ar),
    content_en: str(p.content_en),
    benefits_ar: toStringList(p.benefits_ar),
    benefits_en: toStringList(p.benefits_en),
    image: str(p.image),
    axis_id: p.axis_id ? String(p.axis_id) : (p.axis?.id ? String(p.axis.id) : ""),
    season_ids: Array.isArray(p.season_ids)
      ? p.season_ids.map(Number)
      : Array.isArray(p.seasons) ? p.seasons.map((s) => Number(s.id)) : [],
    target_amount: numStr(p.target_amount),
    minimum_amount: numStr(p.minimum_amount),
    donation_available: p.donation_available !== false,
    status: p.status === "draft" ? "draft" : "published",
    is_active: p.is_active !== false,
    hide_from_audience: !!p.hide_from_audience,
    sort_order: p.sort_order === null || p.sort_order === undefined ? "" : String(p.sort_order),
    seo: seoFromRecord(p as Record<string, unknown>),
  };
}

/**
 * Full payload for PUT/POST /programs. `image` and `hero_image` are URL / storage-path strings
 * (uploads go to the media library first; the backend accepts a file or a string).
 */
export function programPayload(f: ProgramForm): Record<string, unknown> {
  const nameAr = f.name_ar.trim();
  const descAr = nullableString(f.description_ar);
  const benefitsAr = cleanList(f.benefits_ar);
  const benefitsEn = cleanList(f.benefits_en);
  return {
    slug: nullableString(f.slug),
    name_ar: nameAr,
    name: nameAr, // legacy column kept in sync
    name_en: nullableString(f.name_en),
    title_ar: nullableString(f.title_ar) ?? nameAr,
    title_en: nullableString(f.title_en) ?? nullableString(f.name_en),
    hero_h1_ar: nullableString(f.hero_h1_ar),
    hero_h1_en: nullableString(f.hero_h1_en),
    hero_h3_ar: nullableString(f.hero_h3_ar),
    hero_h3_en: nullableString(f.hero_h3_en),
    hero_image: nullableString(f.hero_image),
    image: nullableString(f.image),
    tagline_ar: nullableString(f.tagline_ar),
    tagline_en: nullableString(f.tagline_en),
    period_ar: nullableString(f.period_ar),
    period_en: nullableString(f.period_en),
    description_ar: descAr,
    description: descAr, // legacy column kept in sync
    description_en: nullableString(f.description_en),
    content_ar: nullableString(f.content_ar),
    content_en: nullableString(f.content_en),
    benefits_ar: benefitsAr,
    benefits_en: benefitsEn,
    axis_id: f.axis_id ? Number(f.axis_id) : null,
    season_ids: [...f.season_ids].sort((a, b) => a - b),
    target_amount: nullableNumber(f.target_amount),
    minimum_amount: nullableNumber(f.minimum_amount),
    donation_available: f.donation_available,
    status: f.status,
    is_active: f.is_active,
    hide_from_audience: f.hide_from_audience,
    sort_order: nullableNumber(f.sort_order),
    ...seoToPayload(f.seo),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// top_section (PUT /programs/{id}/top-section)
// ─────────────────────────────────────────────────────────────────────────────

export interface TopSectionForm {
  badge_ar: string;
  breadcrumb_home_ar: string;
  breadcrumb_programs_ar: string;
  breadcrumb_current_ar: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  description_ar: string;
  description_en: string;
  image: string;
  primary_button_ar: string;
  whatsapp_button_ar: string;
  minimum_amount: string;
  currency_ar: string;
  donation_available: boolean;
}

export function topSectionFromRecord(t: ProgramTopSection | null | undefined): TopSectionForm {
  const r = t || {};
  const bc = (r.breadcrumb && typeof r.breadcrumb === "object") ? r.breadcrumb : {};
  return {
    badge_ar: str(r.badge_ar),
    breadcrumb_home_ar: str(bc.home_ar),
    breadcrumb_programs_ar: str(bc.programs_ar),
    breadcrumb_current_ar: str(bc.current_ar),
    title_ar: str(r.title_ar),
    title_en: str(r.title_en),
    subtitle_ar: str(r.subtitle_ar),
    subtitle_en: str(r.subtitle_en),
    description_ar: str(r.description_ar),
    description_en: str(r.description_en),
    image: str(r.image),
    primary_button_ar: str(r.primary_button_ar),
    whatsapp_button_ar: str(r.whatsapp_button_ar),
    minimum_amount: numStr(r.minimum_amount),
    currency_ar: str(r.currency_ar),
    donation_available: r.donation_available !== false,
  };
}

/** Rebuild the top_section object, keeping unknown keys of the original. */
export function topSectionPayload(f: TopSectionForm, original: ProgramTopSection | null | undefined): ProgramTopSection {
  const base: ProgramTopSection = { ...(original || {}) };
  const bcAny = f.breadcrumb_home_ar || f.breadcrumb_programs_ar || f.breadcrumb_current_ar;
  return {
    ...base,
    badge_ar: nullableString(f.badge_ar),
    ...(bcAny || base.breadcrumb
      ? {
          breadcrumb: {
            home_ar: nullableString(f.breadcrumb_home_ar),
            programs_ar: nullableString(f.breadcrumb_programs_ar),
            current_ar: nullableString(f.breadcrumb_current_ar),
          },
        }
      : {}),
    title_ar: nullableString(f.title_ar),
    title_en: nullableString(f.title_en),
    subtitle_ar: nullableString(f.subtitle_ar),
    subtitle_en: nullableString(f.subtitle_en),
    description_ar: nullableString(f.description_ar),
    description_en: nullableString(f.description_en),
    image: nullableString(f.image),
    primary_button_ar: nullableString(f.primary_button_ar),
    whatsapp_button_ar: nullableString(f.whatsapp_button_ar),
    minimum_amount: nullableNumber(f.minimum_amount),
    currency_ar: nullableString(f.currency_ar),
    donation_available: f.donation_available,
  };
}

export function isTopSectionEmpty(f: TopSectionForm): boolean {
  return Object.entries(f).every(([k, v]) => (k === "donation_available" ? true : !String(v).trim()));
}
