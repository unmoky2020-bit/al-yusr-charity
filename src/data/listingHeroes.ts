/**
 * Main (hero) image of the listing pages /projects and /programs, chosen from the dashboard
 * (المشاريع / البرامج → «صورة أعلى الصفحة»).
 *
 * Stored as one unified-content item per page (`/content`, type "page", slug `page-hero-<key>`), the
 * route the site already reads and writes: the picture goes in `cover_image` and, as a copy, in
 * `content_ar` as JSON `{ "image": "…" }` (in case the backend ignores `cover_image` on this type).
 * No item / no picture → the page's bundled default.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, invalidateApiCache, pagesApi, type LaravelUnifiedContent } from "@/data/laravelApi";
import { asset, pageImageUrl } from "@/data/pageImages";

export type ListingHeroKey = "projects" | "programs";

export const LISTING_HEROES: Record<ListingHeroKey, { path: string; titleAr: string; fallback: string }> = {
  projects: { path: "/projects", titleAr: "صورة أعلى صفحة المشاريع", fallback: asset("projects-hero.webp") },
  programs: { path: "/programs", titleAr: "صورة أعلى صفحة البرامج", fallback: asset("programs-hero.webp") },
};

const slugOf = (key: ListingHeroKey) => `page-hero-${key}`;

async function findItem(key: ListingHeroKey, fresh: boolean): Promise<LaravelUnifiedContent | null> {
  const slug = slugOf(key);
  const res = await apiFetch<unknown>(`/content?type=page&slug=${encodeURIComponent(slug)}`, {
    method: "GET",
    useCache: !fresh,
    ttlMs: fresh ? 0 : 60_000,
    skipAuthClear: true,
  });
  const raw = res as { data?: unknown };
  const list: unknown[] = Array.isArray(res) ? res : Array.isArray(raw?.data) ? raw.data : raw?.data ? [raw.data] : [];
  return (list as LaravelUnifiedContent[]).find((i) => i && i.slug === slug && i.type === "page") || null;
}

function imageOf(item: LaravelUnifiedContent | null): string {
  if (!item) return "";
  if (typeof item.cover_image === "string" && item.cover_image.trim()) return item.cover_image.trim();
  try {
    const o = JSON.parse(item.content_ar || "{}");
    return typeof o?.image === "string" ? o.image.trim() : "";
  } catch {
    return "";
  }
}

export const listingHeroApi = {
  /** The saved picture ("" when none). Never throws. */
  async load(key: ListingHeroKey, opts?: { fresh?: boolean }): Promise<string> {
    try {
      return imageOf(await findItem(key, !!opts?.fresh));
    } catch {
      return "";
    }
  },

  /** Save the picture ("" = back to the default). Throws on failure. */
  async save(key: ListingHeroKey, image: string): Promise<void> {
    const existing = await findItem(key, true);
    const body = { cover_image: image || null, content_ar: JSON.stringify({ image }) };
    if (existing) {
      await pagesApi.update(existing.id, body as Partial<LaravelUnifiedContent>);
    } else {
      await pagesApi.create({
        slug: slugOf(key),
        title_ar: LISTING_HEROES[key].titleAr,
        status: "published",
        ...body,
      } as Parameters<typeof pagesApi.create>[0]);
    }
    invalidateApiCache("/content");
  },
};

const queryKey = (key: ListingHeroKey) => ["listing-hero", key] as const;

/** URL of the hero picture of /projects or /programs: the saved one, else the bundled default. */
export function useListingHero(key: ListingHeroKey): string {
  const { data } = useQuery({ queryKey: queryKey(key), queryFn: () => listingHeroApi.load(key), staleTime: 5 * 60_000 });
  return pageImageUrl(data || LISTING_HEROES[key].fallback);
}

/** Lets the dashboard refresh the public value after a save. */
export function useInvalidateListingHero() {
  const qc = useQueryClient();
  return (key: ListingHeroKey) => qc.invalidateQueries({ queryKey: queryKey(key) });
}
