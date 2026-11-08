/**
 * Persistence for campaign landing-page content.
 *
 * Source of truth: the campaign record itself (`donation_campaigns.page_content`, `.seo`, `.faqs`, PROPOSED
 * columns, see backend-handoff/05-campaigns-seasons-section.md). The dashboard writes them with
 * `PUT /donation-campaigns/{id}` (src/pages/admin/AdminDonationCampaignDetail.tsx).
 *
 * Legacy (read-only fallback): before those columns existed the content was kept as one unified-content
 * item per campaign, `type: "page"`, slug `campaign-page-<slug>`, JSON in `content_ar`. It is still READ
 * when the campaign record has no content, so pages saved that way keep showing; it is never written
 * again except to clear it on "reset to defaults".
 */
import { apiFetch, invalidateApiCache, pagesApi, type LaravelUnifiedContent } from "@/data/laravelApi";
import { fetchPublicList, normalizeSlug, type ApiRecord } from "@/data/sources/_shared";
import {
  parseJsonColumn,
  type CampaignFaq,
  type CampaignPageContentColumn,
  type CampaignRecord,
  type CampaignSeo,
} from "@/data/api/donationCampaignsAdminApi";
import { imagesColumn, type CampaignPageContent, type FaqItem, type PageImage } from "./types";
// Call-time only (index.ts re-exports this module): no top-level use, so the import cycle is harmless.
import { getCampaignPageMeta } from "./index";
import { fetchFaqs } from "@/data/faqsApi";
import type { CampaignSeoData } from "@/data/campaignSeoStore";

export const campaignPageSlugKey = (slug: string) => `campaign-page-${slug}`;

export type CampaignPageRecord = {
  /** Legacy `/content` item, when the content came from there. */
  item: LaravelUnifiedContent | null;
  /** Parsed override, or null when nothing is saved / the JSON is unreadable. */
  content: Partial<CampaignPageContent> | null;
  /** Where `content` came from. */
  source?: "campaign" | "legacy" | null;
  /** Shared campaign fields used as fallbacks by the bespoke landing-page layouts. */
  campaign?: Pick<
    CampaignRecord,
    | "image"
    | "name_ar"
    | "name_en"
    | "title_ar"
    | "title_en"
    | "subtitle_ar"
    | "subtitle_en"
    | "description_ar"
    | "description_en"
    | "description"
  > & { donation_packages?: CampaignPagePackage[] };
};

export type CampaignPagePackage = {
  id?: number | string;
  key?: string | null;
  name_ar: string;
  name_en?: string;
  amount: number;
  is_active?: boolean;
  sort_order?: number;
};

/* ───────────────────────── campaign record <-> content ───────────────────────── */

/** True when the backend resource returns the landing-content column at all (even as null). */
export const campaignHasContentColumns = (rec: object | null | undefined): boolean =>
  !!rec && Object.prototype.hasOwnProperty.call(rec, "page_content");

/** Build the editor's override object from the campaign's `page_content` / `seo` / `faqs`. Null when all are empty. */
export function contentFromCampaign(rec: Partial<CampaignRecord> | null | undefined): Partial<CampaignPageContent> | null {
  if (!rec) return null;
  const page = parseJsonColumn<CampaignPageContentColumn>(rec.page_content);
  const seo = parseJsonColumn<CampaignSeo>(rec.seo);
  const faqsRaw = Array.isArray(rec.faqs) ? rec.faqs : parseJsonColumn<CampaignFaq[]>(rec.faqs);
  const faqs = Array.isArray(faqsRaw) ? faqsRaw : [];
  const hasPage = !!page && Object.keys(page).length > 0;
  if (!hasPage && !seo && faqs.length === 0) return null;
  const faq: FaqItem[] = faqs
    .filter((f) => f && typeof f.question_ar === "string" && typeof f.answer_ar === "string")
    .map((f) => ({ q: { ar: f.question_ar, en: f.question_en || "" }, a: { ar: f.answer_ar, en: f.answer_en || "" } }));
  return {
    ...(hasPage ? (page as Partial<CampaignPageContent>) : {}),
    ...(seo ? { seo } : {}),
    ...(faq.length ? { faq } : {}),
  };
}

/** SEO form / preset (campaignSeoStore) -> the campaign's `seo` column. */
export const seoColumnFromForm = (s: CampaignSeoData): CampaignSeo => ({
  title: { ar: s.meta_title_ar || "", en: s.meta_title_en || "" },
  description: { ar: s.meta_description_ar || "", en: s.meta_description_en || "" },
  keywords: { ar: s.focus_keywords_ar || "", en: s.focus_keywords_en || "" },
  canonical: s.canonical_url || undefined,
  noindex: !!s.noindex,
  nofollow: !!s.nofollow,
});

/** Split the editor's content into the three campaign columns. Prices are not stored (they are the donation packages). */
export function toCampaignColumns(content: CampaignPageContent): {
  page_content: CampaignPageContentColumn;
  seo: CampaignSeo | null;
  faqs: CampaignFaq[];
} {
  const { prices: _prices, faq, seo, images, ...page } = content;
  const pageImages = imagesColumn(images);
  return {
    page_content: { ...page, ...(pageImages ? { images: pageImages } : {}) },
    seo: seo ?? null,
    faqs: (faq || []).map((f) => ({ question_ar: f.q.ar, answer_ar: f.a.ar, question_en: f.q.en || null, answer_en: f.a.en || null })),
  };
}

/* ───────────────────────── legacy /content item ───────────────────────── */

async function findLegacyItem(slug: string, fresh: boolean): Promise<LaravelUnifiedContent | null> {
  const key = campaignPageSlugKey(slug);
  const res = await apiFetch<unknown>(`/content?type=page&slug=${encodeURIComponent(key)}`, {
    method: "GET",
    useCache: !fresh,
    ttlMs: fresh ? 0 : 60_000,
    skipAuthClear: true,
  });
  const raw = res as { data?: unknown };
  const list: unknown[] = Array.isArray(res) ? res : Array.isArray(raw?.data) ? raw.data : raw?.data ? [raw.data] : [];
  return (list as LaravelUnifiedContent[]).find((i) => i && i.slug === key && i.type === "page") || null;
}

function parseLegacy(item: LaravelUnifiedContent | null): Partial<CampaignPageContent> | null {
  if (!item?.content_ar) return null;
  try {
    const parsed = JSON.parse(item.content_ar);
    return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0 ? (parsed as Partial<CampaignPageContent>) : null;
  } catch {
    return null;
  }
}

/* ───────────────────────── campaign lookup for a landing page ───────────────────────── */

const recordOf = (res: unknown): CampaignRecord | null => {
  const rec = ((res as { data?: unknown } | null)?.data ?? res) as CampaignRecord | null;
  return rec && typeof rec === "object" && "id" in rec ? rec : null;
};

async function fetchCampaignForPage(slug: string, fresh: boolean): Promise<CampaignRecord | null> {
  const meta = getCampaignPageMeta(slug);
  const opts = { method: "GET", useCache: !fresh, ttlMs: fresh ? 0 : 60_000, skipAuthClear: true } as const;
  for (const id of meta ? meta.apiIds : []) {
    try {
      // Same path and cache options as the package fetch in useCampaignPage, so a public page makes one request.
      const rec = recordOf(await apiFetch<unknown>(`/donation-campaigns/${id}`, opts));
      if (rec) return rec;
    } catch {
      /* try the next identifier */
    }
  }

  // Discover pages without a known backend ID from the public list instead of probing
  // several aliases through detail routes that return noisy 404s when the campaign is absent.
  const records = await fetchPublicList("/donation-campaigns", { per_page: 100 });
  const candidates = new Set([slug, ...(meta ? [meta.slug, ...meta.apiSlugs] : [])].map(normalizeSlug));
  const found = records.find((record) => {
    const recordSlug = normalizeSlug(record.slug);
    if (meta?.apiIds.includes(Number(record.id))) return true;
    if (recordSlug && candidates.has(recordSlug)) return true;
    const name = normalizeSlug(record.name_ar);
    return !!meta?.nameKey && name.includes(normalizeSlug(meta.nameKey));
  });
  const foundId = Number(found?.id);
  if (found && Number.isFinite(foundId) && foundId > 0) {
    const rec = recordOf(await apiFetch<unknown>(`/donation-campaigns/${foundId}`, opts));
    if (rec) return rec;
  }
  return found as CampaignRecord | null;
}

/** Questions of the FAQ category linked to the campaign (dashboard → «الأسئلة الشائعة» tab). Empty when none. */
async function faqOfLinkedCategory(rec: CampaignRecord | null): Promise<FaqItem[]> {
  const categoryId = Number(rec?.faq_category_id || 0);
  if (!categoryId) return [];
  try {
    const items = await fetchFaqs({ categoryId });
    return items
      .filter((f) => Number(f.faq_category_id ?? f.category?.id) === categoryId && f.is_active !== false && f.question_ar && f.answer_ar)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((f) => ({ q: { ar: f.question_ar, en: f.question_en || "" }, a: { ar: f.answer_ar, en: f.answer_en || "" } }));
  } catch {
    return [];
  }
}

export const campaignPagesApi = {
  /**
   * Load the saved override for a landing page (public pages: cached; dashboard: fresh). Never throws.
   * Campaign record first; the legacy `/content` item only when the record has no landing content.
   */
  async load(slug: string, opts?: { fresh?: boolean }): Promise<CampaignPageRecord> {
    try {
      const rec = await fetchCampaignForPage(slug, !!opts?.fresh);
      let fromCampaign = contentFromCampaign(rec);
      const linkedFaq = await faqOfLinkedCategory(rec);
      if (linkedFaq.length) fromCampaign = { ...(fromCampaign ?? {}), faq: linkedFaq };
      const campaign = rec
        ? {
            image: rec.image,
            name_ar: rec.name_ar,
            name_en: rec.name_en,
            title_ar: rec.title_ar,
            title_en: rec.title_en,
            subtitle_ar: rec.subtitle_ar,
            subtitle_en: rec.subtitle_en,
            description_ar: rec.description_ar,
            description_en: rec.description_en,
            description: rec.description,
            donation_packages: rec.donation_packages,
          }
        : undefined;
      if (fromCampaign) return { item: null, content: fromCampaign, source: "campaign", campaign };
      if (campaign) {
        const legacy = await campaignPagesApi.loadLegacy(slug, opts);
        return { ...legacy, campaign };
      }
    } catch {
      /* fall back to the legacy item */
    }
    return campaignPagesApi.loadLegacy(slug, opts);
  },

  /** Read-only: the legacy `/content` override (old saves). Never throws. */
  async loadLegacy(slug: string, opts?: { fresh?: boolean }): Promise<CampaignPageRecord> {
    try {
      const item = await findLegacyItem(slug, !!opts?.fresh);
      const content = parseLegacy(item);
      return { item, content, source: content ? "legacy" : null };
    } catch {
      return { item: null, content: null, source: null };
    }
  },

  /**
   * Empty the legacy item, used by "reset to defaults" so an old save does not resurface after the campaign
   * columns are cleared. Throws on failure; no-op when there is no legacy content.
   */
  async clearLegacy(slug: string): Promise<void> {
    const existing = await findLegacyItem(slug, true);
    if (existing && parseLegacy(existing)) {
      await pagesApi.update(existing.id, { content_ar: "{}" } as Partial<LaravelUnifiedContent>);
      invalidateApiCache("/content");
    }
  },
};
