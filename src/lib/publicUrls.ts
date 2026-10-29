/**
 * Public website paths of dashboard records — the single place admin «معاينة» / «عرض في الموقع» links come from.
 * Each path is a page that really exists for that record (see src/App.tsx).
 */
import { getCampaignPageMetaForCampaign } from "@/data/campaignPages/index";
import { PROGRAM_SLUG_ALIASES } from "@/data/sources/programs";

const seg = (v: string | number | null | undefined) => encodeURIComponent(String(v ?? "").trim());

export const publicUrls = {
  /**
   * Donation campaign: its landing page (/dhill, /setr…). A campaign without a landing page has no page
   * of its own, so it opens the donation form with the campaign selected.
   */
  donationCampaign(c: { slug?: string | null; id?: number | string | null; name_ar?: string | null }): string {
    const landing = getCampaignPageMetaForCampaign(c);
    return landing ? landing.path : `/donate?campaign=${seg(c.slug || c.id)}`;
  },
  /** Volunteer (field) campaign page. */
  volunteerCampaign: (slug: string) => `/campaigns/${seg(slug)}`,
  /** Program page; backend slugs with a different public slug (general-donation → general) are mapped. */
  program: (slug: string) => `/programs/${seg(PROGRAM_SLUG_ALIASES[slug] ?? slug)}`,
  project: (slug: string) => `/projects/${seg(slug)}`,
  case: (code: string) => `/cases/${seg(code)}`,
  axis: (slug: string) => `/axes/${seg(slug)}`,
  story: (slug: string) => `/stories/${seg(slug)}`,
  /** Blog post; drafts open with ?preview=1. */
  blog: (slug: string, draft = false) => `/blog/${seg(slug)}${draft ? "?preview=1" : ""}`,
};
