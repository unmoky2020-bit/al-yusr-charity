/**
 * Persistence for campaign page content.
 *
 * Storage: one unified-content item per campaign, `type: "page"`, slug `campaign-page-<slug>`,
 * with the content JSON in `content_ar`. This reuses the existing `/content` endpoint, so it needs
 * no backend change and never appears in the blog (which filters `type=article`).
 */
import { apiFetch, invalidateApiCache, pagesApi, type LaravelUnifiedContent } from "@/data/laravelApi";
import type { CampaignPageContent, L } from "./types";

export const campaignPageSlugKey = (slug: string) => `campaign-page-${slug}`;

export type CampaignPageRecord = {
  item: LaravelUnifiedContent | null;
  /** Parsed override, or null when nothing is saved / the JSON is unreadable. */
  content: Partial<CampaignPageContent> | null;
};

async function findItem(slug: string, fresh: boolean): Promise<LaravelUnifiedContent | null> {
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

function parseContent(item: LaravelUnifiedContent | null): Partial<CampaignPageContent> | null {
  if (!item?.content_ar) return null;
  try {
    const parsed = JSON.parse(item.content_ar);
    return parsed && typeof parsed === "object" ? (parsed as Partial<CampaignPageContent>) : null;
  } catch {
    return null;
  }
}

export const campaignPagesApi = {
  /** Load the saved override (public pages: cached; dashboard: fresh). Never throws. */
  async load(slug: string, opts?: { fresh?: boolean }): Promise<CampaignPageRecord> {
    try {
      const item = await findItem(slug, !!opts?.fresh);
      return { item, content: parseContent(item) };
    } catch {
      return { item: null, content: null };
    }
  },

  /** Save the full content object for a campaign (creates the item on first save). */
  async save(slug: string, content: CampaignPageContent, name: L): Promise<LaravelUnifiedContent> {
    const existing = await findItem(slug, true);
    const payload = {
      type: "page",
      status: "published",
      slug: campaignPageSlugKey(slug),
      title_ar: `محتوى صفحة حملة: ${name.ar}`,
      title_en: `Campaign page content: ${name.en}`,
      summary_ar: "يُدار من لوحة التحكم: صفحات الحملات. لا تعدّل هذا العنصر يدوياً.",
      summary_en: "Managed from the dashboard: Campaign Pages. Do not edit by hand.",
      content_ar: JSON.stringify(content),
      content_en: "{}",
    } as Partial<LaravelUnifiedContent>;
    const saved = existing ? await pagesApi.update(existing.id, payload) : await pagesApi.create(payload);
    invalidateApiCache("/content");
    return saved as unknown as LaravelUnifiedContent;
  },

  /** Clear the override so the page falls back to the code defaults. Keeps the item (empty JSON). */
  async reset(slug: string): Promise<void> {
    const existing = await findItem(slug, true);
    if (existing) await pagesApi.update(existing.id, { content_ar: "{}" } as Partial<LaravelUnifiedContent>);
    invalidateApiCache("/content");
  },
};
