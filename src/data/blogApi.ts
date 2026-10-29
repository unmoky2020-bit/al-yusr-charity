import { apiFetch, formatServerImageUrl, invalidateApiCache } from "./laravelApi";
import type { BlogPost } from "./blog";

export type DbStatus = "draft" | "pending_review" | "scheduled" | "published" | "archived";

export type DbBlogPost = {
  id: string;
  slug: string;
  status: DbStatus;
  published_at: string | null;
  scheduled_at: string | null;
  image_url: string | null;
  og_image_url: string | null;
  category_ar: string;
  category_en: string;
  focus_keyword: string | null;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  body_ar: string[];
  body_en: string[];
  tags_ar: string[];
  tags_en: string[];
  seo_score: number;
  created_at: string;
  updated_at: string;
};

export const dbToBlogPost = (r: DbBlogPost): BlogPost => ({
  slug: r.slug || "",
  image: formatServerImageUrl(r.image_url) || "/placeholder.svg",
  date: (r.published_at || r.scheduled_at || r.created_at || new Date().toISOString()).slice(0, 10),
  category: { ar: r.category_ar || "", en: r.category_en || "" },
  ar: { title: r.title_ar || "", excerpt: r.excerpt_ar || "", body: r.body_ar || [], tags: r.tags_ar || [] },
  en: { title: r.title_en || "", excerpt: r.excerpt_en || "", body: r.body_en || [], tags: r.tags_en || [] },
  // Extra fields consumed by SEO helpers (not part of the static BlogPost type).
  ...({
    focus_keyword: r.focus_keyword || undefined,
    tags: [...(r.tags_ar || []), ...(r.tags_en || [])],
  } as Partial<BlogPost>),
});

/** The articles shipped with the site, as rows. Loaded on first use (~160 KB), not with every page. */
let staticRowsPromise: Promise<DbBlogPost[]> | null = null;
const staticRows = (): Promise<DbBlogPost[]> =>
  (staticRowsPromise ??= import("./blog").then(({ blogPosts }) => (blogPosts || []).map(toStaticRow)));

const toStaticRow = (p: BlogPost): DbBlogPost => ({
  id: `static-${p.slug}`,
  slug: p.slug,
  status: "published" as DbStatus,
  published_at: p.date || new Date().toISOString(),
  scheduled_at: null,
  image_url: (p as any).image || null,
  og_image_url: null,
  category_ar: p.category?.ar || "عام",
  category_en: p.category?.en || "General",
  focus_keyword: p.slug,
  title_ar: p.ar?.title || "",
  title_en: p.en?.title || "",
  excerpt_ar: p.ar?.excerpt || "",
  excerpt_en: p.en?.excerpt || "",
  body_ar: p.ar?.body || [],
  body_en: p.en?.body || [],
  tags_ar: p.ar?.tags || [],
  tags_en: p.en?.tags || [],
  seo_score: 95,
  created_at: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/** Laravel numeric id from our row id ("laravel-12" | "12"), or null for static rows. */
const laravelIdOf = (id: string): string | null =>
  id.startsWith("laravel-") ? id.replace("laravel-", "") : (/^\d+$/.test(id) ? id : null);

const joinBody = (b: string[] | string | undefined | null) => (Array.isArray(b) ? b.join("\n\n") : (b ?? ""));
const splitBody = (v: unknown): string[] =>
  typeof v === "string" ? v.split(/\n\s*\n/).filter(Boolean) : Array.isArray(v) ? v.map(String) : [];
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((x) => x.trim()).filter(Boolean) : [];

/** Map a Laravel /content article to DbBlogPost */
function laravelToBlogPost(item: any): DbBlogPost {
  const rawImg = item.cover_image || item.cover_image_url || item.image || item.image_url || null;
  return {
    id: `laravel-${item.id || item.slug}`,
    slug: item.slug || "",
    status: (item.status || "published") as DbStatus,
    published_at: item.published_at || item.created_at || new Date().toISOString(),
    scheduled_at: item.scheduled_at || null,
    image_url: rawImg ? formatServerImageUrl(rawImg) : null,
    og_image_url: item.og_image_url ? formatServerImageUrl(item.og_image_url) : null,
    category_ar: item.category_ar || "مقالات",
    category_en: item.category_en || "Articles",
    focus_keyword: item.focus_keyword || item.primary_keyword || item.slug || null,
    title_ar: item.title_ar || item.title || "",
    title_en: item.title_en || item.title_ar || item.title || "",
    excerpt_ar: item.summary_ar || item.excerpt_ar || item.excerpt || "",
    excerpt_en: item.summary_en || item.excerpt_en || item.summary_ar || "",
    body_ar: splitBody(item.content_ar),
    body_en: splitBody(item.content_en),
    tags_ar: strArr(item.tags_ar ?? item.tags),
    tags_en: strArr(item.tags_en),
    seo_score: Number(item.seo_score ?? 90) || 0,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
  };
}

/**
 * DbBlogPost fields → Laravel `/content` body.
 * Existing (Postman): type, status, slug, title_ar/en, summary_ar/en, content_ar/en, cover_image, tags, author_id.
 * NEW columns the admin now sends (see backend-handoff/02-replace-supabase-admin.md):
 * category_ar, category_en, tags_ar, tags_en, focus_keyword, og_image_url, seo_score, published_at, scheduled_at.
 */
function toLaravelContent(p: Partial<DbBlogPost>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.slug !== undefined) out.slug = p.slug;
  if (p.status !== undefined) out.status = p.status;
  if (p.title_ar !== undefined) out.title_ar = p.title_ar;
  if (p.title_en !== undefined) out.title_en = p.title_en;
  if (p.excerpt_ar !== undefined) out.summary_ar = p.excerpt_ar;
  if (p.excerpt_en !== undefined) out.summary_en = p.excerpt_en;
  if (p.body_ar !== undefined) out.content_ar = joinBody(p.body_ar);
  if (p.body_en !== undefined) out.content_en = joinBody(p.body_en);
  if (p.category_ar !== undefined) out.category_ar = p.category_ar;
  if (p.category_en !== undefined) out.category_en = p.category_en;
  if (p.focus_keyword !== undefined) out.focus_keyword = p.focus_keyword;
  if (p.image_url !== undefined) out.cover_image = p.image_url;
  if (p.og_image_url !== undefined) out.og_image_url = p.og_image_url;
  if (p.tags_ar !== undefined) { out.tags = p.tags_ar; out.tags_ar = p.tags_ar; }
  if (p.tags_en !== undefined) out.tags_en = p.tags_en;
  if (p.seo_score !== undefined) out.seo_score = p.seo_score;
  if (p.published_at !== undefined) out.published_at = p.published_at;
  if (p.scheduled_at !== undefined) out.scheduled_at = p.scheduled_at;
  return out;
}

async function fetchLaravelArticles(): Promise<DbBlogPost[]> {
  const res = await apiFetch<{ data?: any[] } | any[]>("/content", {
    method: "GET",
    params: { type: "article", per_page: 200 },
    ttlMs: 30000, // writes below call invalidateApiCache("/content")
  });
  const items = Array.isArray(res) ? res : (res && Array.isArray((res as any).data) ? (res as any).data : []);
  return items.filter((item: any) => item && item.slug).map(laravelToBlogPost);
}

/**
 * Rows for the blog: the static articles shipped with the site, overlaid by the Laravel `/content`
 * articles (type=article) with the same slug. Static rows keep id "static-<slug>"; saving one from
 * the admin creates it on Laravel (POST /content). No localStorage layer.
 */
export const fetchAllRowsAdmin = async (): Promise<DbBlogPost[]> => {
  const map = new Map<string, DbBlogPost>();
  for (const p of await staticRows()) map.set(p.slug, p);
  try {
    for (const row of await fetchLaravelArticles()) map.set(row.slug, row);
  } catch {
    /* public pages keep the static list when the API is down */
  }
  return Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
};

export const fetchPublishedPosts = async (): Promise<BlogPost[]> => {
  const allRows = await fetchAllRowsAdmin();
  return allRows
    .filter((r) => r.status === "published")
    .map(dbToBlogPost);
};

export const fetchAllPostsAdmin = async (): Promise<BlogPost[]> => {
  const allRows = await fetchAllRowsAdmin();
  return allRows.map(dbToBlogPost);
};

export const fetchPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  // Try Laravel first directly
  try {
    const res = await apiFetch<{ data?: any } | any>(`/content?type=article&slug=${encodeURIComponent(slug)}`, {
      method: "GET",
      useCache: false,
    });
    const item = (res as any)?.data?.[0] || (Array.isArray(res) ? res[0] : null) || res;
    if (item && item.slug === slug) {
      return dbToBlogPost(laravelToBlogPost(item));
    }
  } catch {}

  // Fallback to full list
  const allRows = await fetchAllRowsAdmin();
  const found = allRows.find((p) => p.slug === slug);
  return found ? dbToBlogPost(found) : null;
};

export type NewPostInput = {
  slug: string;
  category_ar: string; category_en: string;
  focus_keyword?: string;
  title_ar: string; title_en: string;
  excerpt_ar: string; excerpt_en: string;
  body_ar: string[]; body_en: string[];
  tags_ar: string[]; tags_en: string[];
  image_url?: string;
  og_image_url?: string;
  status?: DbStatus;
  scheduled_at?: string;
  seo_score?: number;
};

/** POST /content (type=article). Throws on failure; returns the created row. */
export const createPost = async (p: NewPostInput): Promise<DbBlogPost> => {
  const status: DbStatus = p.status ?? "draft";
  const res = await apiFetch<{ data?: any }>("/content", {
    method: "POST",
    body: {
      type: "article",
      ...toLaravelContent({
        slug: p.slug,
        status,
        title_ar: p.title_ar,
        title_en: p.title_en,
        excerpt_ar: p.excerpt_ar,
        excerpt_en: p.excerpt_en,
        body_ar: p.body_ar,
        body_en: p.body_en,
        category_ar: p.category_ar,
        category_en: p.category_en,
        focus_keyword: p.focus_keyword || p.slug,
        image_url: p.image_url ?? null,
        og_image_url: p.og_image_url ?? null,
        tags_ar: p.tags_ar,
        tags_en: p.tags_en,
        seo_score: p.seo_score ?? 0,
        published_at: status === "published" ? new Date().toISOString() : null,
        scheduled_at: status === "scheduled" ? p.scheduled_at ?? null : null,
      }),
    },
  });
  invalidateApiCache("/content");
  const item = (res as any)?.data ?? res;
  return laravelToBlogPost({ ...item, slug: item?.slug || p.slug });
};

/** Resolve (or create) the Laravel record behind a row id. Static rows are created on first save. */
async function ensureLaravelId(id: string, patch: Partial<DbBlogPost> = {}): Promise<string> {
  const direct = laravelIdOf(id);
  if (direct) return direct;
  const staticRow = (await staticRows()).find((x) => x.id === id || x.slug === id);
  const slug = staticRow?.slug ?? id.replace(/^static-/, "");
  // A record with this slug may already exist on the backend.
  const existing = (await fetchLaravelArticles()).find((r) => r.slug === slug);
  if (existing) return laravelIdOf(existing.id) as string;
  const base: Partial<DbBlogPost> = staticRow ? { ...staticRow } : { slug };
  const created = await createPost({
    slug: patch.slug ?? base.slug ?? slug,
    category_ar: patch.category_ar ?? base.category_ar ?? "مقالات",
    category_en: patch.category_en ?? base.category_en ?? "Articles",
    focus_keyword: (patch.focus_keyword ?? base.focus_keyword ?? slug) || slug,
    title_ar: patch.title_ar ?? base.title_ar ?? slug,
    title_en: patch.title_en ?? base.title_en ?? slug,
    excerpt_ar: patch.excerpt_ar ?? base.excerpt_ar ?? "",
    excerpt_en: patch.excerpt_en ?? base.excerpt_en ?? "",
    body_ar: patch.body_ar ?? base.body_ar ?? [],
    body_en: patch.body_en ?? base.body_en ?? [],
    tags_ar: patch.tags_ar ?? base.tags_ar ?? [],
    tags_en: patch.tags_en ?? base.tags_en ?? [],
    // Bundled static images are build-time asset paths; only real URLs are sent.
    image_url: (patch.image_url ?? undefined) || undefined,
    og_image_url: (patch.og_image_url ?? undefined) || undefined,
    status: base.status ?? "published",
    seo_score: patch.seo_score ?? base.seo_score,
  });
  const newId = laravelIdOf(created.id);
  if (!newId) throw new Error("تم الإنشاء لكن الخادم لم يُرجع رقم المقال");
  return newId;
}

async function patchContent(laravelId: string, body: Record<string, unknown>) {
  await apiFetch(`/content/${laravelId}`, { method: "PATCH", body });
  invalidateApiCache("/content");
}

/** PATCH /content/{id} {status, published_at, scheduled_at}. Throws on failure. */
export const updatePostStatus = async (
  id: string,
  status: DbStatus,
  scheduled_at?: string | null,
) => {
  const laravelId = await ensureLaravelId(id);
  const payload: Record<string, unknown> = { status };
  if (status === "published") payload.published_at = new Date().toISOString();
  if (status === "scheduled") payload.scheduled_at = scheduled_at ?? null;
  if (status === "draft") payload.scheduled_at = null;
  await patchContent(laravelId, payload);
};

/** PATCH /content/{id} {cover_image, og_image_url}. Throws on failure. */
export const updatePostMedia = async (
  id: string,
  patch: { image_url?: string | null; og_image_url?: string | null },
) => {
  const laravelId = await ensureLaravelId(id, patch);
  await patchContent(laravelId, toLaravelContent(patch));
};

/** Admin: update full content of a post (everything except status). Throws on failure; returns the Laravel row id. */
export const updatePost = async (
  id: string,
  patch: Partial<Omit<DbBlogPost, "id" | "created_at" | "updated_at" | "status" | "published_at">>,
): Promise<string> => {
  const laravelId = await ensureLaravelId(id, patch);
  await patchContent(laravelId, toLaravelContent(patch));
  return `laravel-${laravelId}`;
};

/** DELETE /content/{id}. Static (not yet saved) articles cannot be deleted from here. */
export const deletePost = async (id: string): Promise<void> => {
  const laravelId = laravelIdOf(id);
  if (!laravelId) throw new Error("هذا المقال غير محفوظ في قاعدة البيانات (مقال ثابت من كود الموقع)");
  await apiFetch(`/content/${laravelId}`, { method: "DELETE" });
  invalidateApiCache("/content");
};
