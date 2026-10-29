/**
 * Case-related row types (formerly generated from the Supabase schema in
 * src/integrations/supabase/types.ts). Kept field-for-field identical so every screen
 * that imports these via `@/data/casesApi` keeps compiling after Supabase is removed.
 */

/** Backend statuses (pending_review | approved | completed | closed | rejected) plus legacy UI aliases. */
export type CaseStatus = "pending_review" | "approved" | "completed" | "closed" | "rejected" | "draft" | "pending" | "funded";
export type Urgency = "low" | "medium" | "high" | "critical";
export type Gender = "male" | "female";
export type CaseMediaKind = "before" | "during" | "after" | "report" | "other";
export type JourneyStepKey =
  | "created" | "paid" | "received" | "in_processing" | "executing"
  | "delivered" | "documented" | "completed" | "failed" | "refunded";

export interface CategoryRow {
  active: boolean;
  created_at: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export interface CaseRow {
  approved_at: string | null;
  approved_by: string | null;
  area: string | null;
  assigned_delegate_id: string | null;
  beneficiary_age: number | null;
  beneficiary_gender: Gender | null;
  beneficiary_name: string;
  category_id: string;
  city: string | null;
  closed_at: string | null;
  cover_image_url: string | null;
  created_at: string;
  created_by: string | null;
  deadline: string | null;
  delegate_notes: string | null;
  governorate: string;
  id: string;
  needed_amount: number;
  raised_amount: number;
  ref_code: string;
  rejection_reason: string | null;
  scheduled_visit_at: string | null;
  status: CaseStatus;
  story: string;
  title: string;
  updated_at: string;
  urgency: Urgency;
  /** The stored cover image (cover_image_url above falls back to a guessed placeholder). */
  cover_image?: string | null;
  /** Backend priority "high" — shown as «عاجلة» and in the homepage urgent carousel. */
  is_urgent?: boolean;
  /** Real category (backend case_categories); `category_id` above holds its id. */
  category_slug?: string | null;
  category_name_ar?: string | null;
  /** What the case belongs to (one of them at most). */
  program_id?: string | null;
  program_slug?: string | null;
  program_name?: string | null;
  project_id?: string | null;
  project_slug?: string | null;
  project_name?: string | null;
  donation_campaign_id?: string | null;
  donation_campaign_slug?: string | null;
  donation_campaign_name?: string | null;
}

export interface DonationRow {
  amount: number;
  campaign_id: string | null;
  case_id: string | null;
  category_id: string | null;
  created_at: string;
  currency: string;
  donor_email: string | null;
  donor_id: string | null;
  donor_name: string | null;
  donor_phone: string | null;
  id: string;
  idempotency_key: string | null;
  message: string | null;
  payment_method: string | null;
  payment_status: string;
  ref_code: string;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_medium: string | null;
  utm_source: string | null;
  utm_term: string | null;
}

export interface CaseUpdateRow {
  author_id: string | null;
  body: string;
  case_id: string;
  created_at: string;
  id: string;
  image_url: string | null;
}

export interface CaseMediaRow {
  caption_ar: string | null;
  caption_en: string | null;
  case_id: string;
  created_at: string;
  id: string;
  is_public: boolean;
  kind: CaseMediaKind;
  sort_order: number;
  updated_at: string;
  uploaded_by: string | null;
  url: string;
}

export interface CaseDocumentRow {
  caption: string | null;
  case_id: string;
  created_at: string;
  doc_type: string;
  id: string;
  is_public: boolean;
  storage_path: string;
  uploaded_by: string | null;
}

export interface JourneyStepRow {
  case_id: string | null;
  created_at: string;
  created_by: string | null;
  donation_id: string | null;
  id: string;
  is_public: boolean;
  media_url: string | null;
  note_ar: string | null;
  note_en: string | null;
  occurred_at: string;
  step_key: JourneyStepKey;
  title_ar: string;
  title_en: string;
  updated_at: string;
}
