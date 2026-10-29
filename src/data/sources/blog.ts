/**
 * Blog posts content source (/blog, /blog/:slug).
 *   static: exactly today's behaviour — `useAllBlogPosts()` (static `blogPosts` merged with published
 *           /content articles, as src/data/useBlogPosts.ts already does) and `getPost(slug)` as a fallback.
 *   api:    additionally GET /blog-seo (EXISTS) and GET /content?type=article (EXISTS); published records are
 *           mapped to `BlogPost` and override the post with the same slug (missing fields fall back to it).
 */
import { useMemo } from "react";
import { blogPosts as STATIC_POSTS, getPost, type BlogPost } from "@/data/blog";
import { useAllBlogPosts } from "@/data/useBlogPosts";
import { CONTENT_SOURCE, type ContentSource } from "@/lib/contentSource";
import {
  type ApiRecord,
  fetchPublicList,
  image,
  isPublicRecord,
  mergeByKey,
  paragraphs,
  pick,
  str,
  strList,
  useSourced,
  withExtra,
} from "./_shared";

const byDateDesc = (a: BlogPost, b: BlogPost) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/** Map one /blog-seo or /content (type=article) record to the static `BlogPost`. */
export function mapApiBlogPost(raw: ApiRecord, fallback?: BlogPost): BlogPost {
  const r = withExtra(raw);
  const fb = fallback;
  const date = pick(r.published_at, r.scheduled_at, r.created_at);
  const flatTags = strList(r.tags);
  const lang = (l: "ar" | "en") => ({
    title: pick(r[`title_${l}`], l === "ar" ? r.title : undefined, fb?.[l].title, l === "en" ? r.title_ar : undefined) ?? "",
    excerpt: pick(r[`summary_${l}`], r[`excerpt_${l}`], fb?.[l].excerpt) ?? "",
    body: paragraphs(r[`content_${l}`]) ?? paragraphs(r[`body_${l}`]) ?? fb?.[l].body ?? [],
    tags: strList(r[`tags_${l}`]) ?? (l === "ar" ? flatTags : undefined) ?? fb?.[l].tags ?? [],
  });
  return {
    slug: str(r.slug) ?? fb?.slug ?? "",
    image: image(r.cover_image, r.image, r.image_url, r.og_image_url, r.og_image) ?? fb?.image ?? "/placeholder.svg",
    date: date ? date.slice(0, 10) : fb?.date ?? "",
    category: {
      ar: pick(r.category_ar, fb?.category.ar) ?? "",
      en: pick(r.category_en, fb?.category.en, r.category_ar) ?? "",
    },
    ar: lang("ar"),
    en: lang("en"),
  };
}

export type BlogRecords = { blogSeo: ApiRecord[]; articles: ApiRecord[] };

/**
 * Final post list (pure). `base` is today's merged list (static + published /content).
 * Published /blog-seo records win over /content records, which win over `base`.
 */
export function resolveBlogPosts(
  base: BlogPost[],
  raw: BlogRecords | undefined,
  source: ContentSource = CONTENT_SOURCE,
): BlogPost[] {
  if (source === "static" || !raw) return base;
  const bySlug = new Map(base.map((p) => [p.slug, p]));
  const pickPublished = (list: ApiRecord[]) => list.filter((r) => str(r.slug) && isPublicRecord(r));
  const seen = new Set<string>();
  const mapped: BlogPost[] = [];
  for (const r of [...pickPublished(raw.blogSeo), ...pickPublished(raw.articles)]) {
    const slug = str(r.slug)!;
    if (seen.has(slug)) continue;
    seen.add(slug);
    mapped.push(mapApiBlogPost(r, bySlug.get(slug)));
  }
  if (!mapped.length) return base;
  return [...mergeByKey(base, mapped, (p) => p.slug)].sort(byDateDesc);
}

export async function fetchBlogRecords(): Promise<BlogRecords> {
  const settle = (p: Promise<ApiRecord[]>) => p.catch((): ApiRecord[] => []);
  const [blogSeo, articles] = await Promise.all([
    settle(fetchPublicList("/blog-seo", { per_page: 100 })),
    settle(fetchPublicList("/content", { type: "article", per_page: 100 })),
  ]);
  return { blogSeo, articles };
}

/** All public posts. With the default flag this is exactly `useAllBlogPosts()`. */
export function useBlogPosts(): { posts: BlogPost[]; loading: boolean } {
  const { posts: base, loading } = useAllBlogPosts();
  const { data: raw, isLoading } = useSourced<BlogRecords, BlogRecords | undefined>(
    ["blog"],
    fetchBlogRecords,
    undefined,
    (r) => r,
  );
  const posts = useMemo(() => resolveBlogPosts(base, raw), [base, raw]);
  return { posts, loading: loading || isLoading };
}

/** One post by slug: list first, then the static `getPost` (same lookup BlogPost.tsx did before). */
export function findBlogPost(posts: BlogPost[], slug: string | undefined): BlogPost | undefined {
  if (!slug) return undefined;
  return posts.find((p) => p.slug === slug) ?? getPost(slug);
}

export { STATIC_POSTS };
