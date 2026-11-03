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

/**
 * Row ids:  "seo-<blog_seo id>"   an article with its SEO record (/blog-seo) — the normal case;
 *           "laravel-<content id>" an article saved only through /content (older) — saving it creates its SEO record;
 *           "static-<slug>"        an article shipped with the site's code — saving it creates it on the backend.
 * Every admin write goes through /blog-seo (it keeps the article in `contents` and its SEO in `blog_seos`).
 */
const seoIdOf = (id: string): string | null => (id.startsWith("seo-") ? id.slice(4) : null);
const contentIdOf = (id: string): string | null =>
  id.startsWith("laravel-") ? id.replace("laravel-", "") : (/^\d+$/.test(id) ? id : null);

const joinBody = (b: string[] | string | undefined | null) => (Array.isArray(b) ? b.join("\n\n") : (b ?? ""));
const splitBody = (v: unknown): string[] =>
  typeof v === "string" ? v.split(/\n\s*\n/).filter(Boolean) : Array.isArray(v) ? v.map(String) : [];
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((x) => x.trim()).filter(Boolean) : [];
const DB_STATUSES: DbStatus[] = ["draft", "pending_review", "scheduled", "published", "archived"];
const toDbStatus = (v: unknown): DbStatus => {
  const s = String(v || "");
  if (s === "review") return "pending_review";
  return (DB_STATUSES as string[]).includes(s) ? (s as DbStatus) : "draft";
};

/** Map a /content article or a /blog-seo record to DbBlogPost. */
function laravelToBlogPost(item: any, kind: "content" | "seo" = "content"): DbBlogPost {
  const rawImg = item.cover_image || item.cover_image_url || item.image || item.image_url || null;
  const og = item.og_image_url || item.og_image || null;
  return {
    id: kind === "seo" ? `seo-${item.id}` : `laravel-${item.id || item.slug}`,
    slug: item.slug || "",
    status: kind === "seo" ? toDbStatus(item.workflow_status) : toDbStatus(item.status || "published"),
    published_at: item.published_at || item.created_at || null,
    scheduled_at: item.scheduled_at || null,
    image_url: rawImg ? formatServerImageUrl(rawImg) : null,
    og_image_url: og ? formatServerImageUrl(og) : null,
    category_ar: item.category_ar || "مقالات",
    category_en: item.category_en || "Articles",
    focus_keyword: item.primary_keyword || item.focus_keyword || null,
    title_ar: item.title_ar || item.title || "",
    title_en: item.title_en || item.title_ar || item.title || "",
    excerpt_ar: item.summary_ar || item.excerpt_ar || item.excerpt || "",
    excerpt_en: item.summary_en || item.excerpt_en || item.summary_ar || "",
    body_ar: splitBody(item.content_ar),
    body_en: splitBody(item.content_en),
    tags_ar: strArr(item.tags_ar ?? item.tags),
    tags_en: strArr(item.tags_en),
    seo_score: Number(item.seo_score ?? 0) || 0,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
  };
}

/** Images are saved as plain URLs / storage paths (never data: or blob: — those are local previews). */
const savableImage = (v: string | null | undefined) =>
  v && !v.startsWith("data:") && !v.startsWith("blob:") && !v.startsWith("/src/") && !v.startsWith("/assets/") ? v : null;

/** DbBlogPost fields → /blog-seo body (StoreBlogSeoRequest / UpdateBlogSeoRequest). */
function toBlogSeoBody(p: Partial<DbBlogPost>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.slug !== undefined) out.slug = p.slug;
  if (p.title_ar !== undefined) out.title_ar = p.title_ar;
  if (p.title_en !== undefined) out.title_en = p.title_en || null;
  if (p.excerpt_ar !== undefined) out.summary_ar = p.excerpt_ar || null;
  if (p.excerpt_en !== undefined) out.summary_en = p.excerpt_en || null;
  if (p.body_ar !== undefined) out.content_ar = joinBody(p.body_ar);
  if (p.body_en !== undefined) out.content_en = joinBody(p.body_en) || null;
  if (p.category_ar !== undefined) out.category_ar = p.category_ar || null;
  if (p.category_en !== undefined) out.category_en = p.category_en || null;
  if (p.focus_keyword !== undefined) out.primary_keyword = p.focus_keyword || null;
  if (p.image_url !== undefined) out.cover_image = savableImage(p.image_url);
  if (p.og_image_url !== undefined) out.og_image_url = savableImage(p.og_image_url);
  if (p.tags_ar !== undefined) out.tags_ar = p.tags_ar;
  if (p.tags_en !== undefined) out.tags_en = p.tags_en;
  if (p.status !== undefined) out.workflow_status = p.status === "pending_review" ? "review" : p.status;
  if (p.scheduled_at !== undefined) out.scheduled_at = p.scheduled_at;
  return out;
}

/** Every page of a list endpoint (admin token is sent by apiFetch). */
async function listAll(path: string, params: Record<string, unknown>): Promise<any[]> {
  const out: any[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await apiFetch<any>(path, { method: "GET", params: { ...params, per_page: 100, page }, useCache: false });
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    out.push(...items);
    const last = Number(res?.meta?.last_page ?? res?.last_page ?? 1);
    if (Array.isArray(res) || page >= last || !items.length) break;
  }
  return out;
}

/** Backend articles: SEO records first, then /content articles that have none yet. */
async function fetchLaravelArticles(): Promise<DbBlogPost[]> {
  const settle = <T,>(p: Promise<T[]>) => p.catch((): T[] => []);
  const [seo, content] = await Promise.all([
    settle(listAll("/blog-seo", {})),
    settle(listAll("/content", { type: "article" })),
  ]);
  const rows = seo.filter((r) => r && r.slug).map((r) => laravelToBlogPost(r, "seo"));
  const seen = new Set(rows.map((r) => r.slug));
  content.filter((r) => r && r.slug && !seen.has(r.slug)).forEach((r) => rows.push(laravelToBlogPost(r, "content")));
  return rows;
}

/**
 * Rows for the blog: the static articles shipped with the site, overlaid by the backend articles with the
 * same slug. Static rows keep id "static-<slug>"; saving one from the admin creates it on the backend.
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
  return allRows.filter((r) => r.status === "published").map(dbToBlogPost);
};

export const fetchAllPostsAdmin = async (): Promise<BlogPost[]> => {
  const allRows = await fetchAllRowsAdmin();
  return allRows.map(dbToBlogPost);
};

export const fetchPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const res = await apiFetch<any>("/blog-seo", { method: "GET", params: { slug }, useCache: false });
    const item = (Array.isArray(res?.data) ? res.data : []).find((r: any) => r?.slug === slug);
    if (item) {
      const row = laravelToBlogPost(item, "seo");
      return row.status === "published" ? dbToBlogPost(row) : null;
    }
  } catch {
    /* fall back to the merged list */
  }
  const allRows = await fetchAllRowsAdmin();
  const found = allRows.find((p) => p.slug === slug && p.status === "published");
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

const done = () => {
  invalidateApiCache("/blog-seo");
  invalidateApiCache("/content");
};

/** POST /blog-seo. Throws on failure; returns the created row. */
export const createPost = async (p: NewPostInput): Promise<DbBlogPost> => {
  const status: DbStatus = p.status ?? "draft";
  const body = toBlogSeoBody({
    ...p,
    status,
    image_url: p.image_url ?? null,
    og_image_url: p.og_image_url ?? null,
    focus_keyword: p.focus_keyword || p.slug,
    scheduled_at: status === "scheduled" ? p.scheduled_at ?? null : null,
  });
  // content_ar is required by the backend: an empty new article still gets a first paragraph.
  if (!body.content_ar) body.content_ar = p.excerpt_ar || p.title_ar;
  const res = await apiFetch<{ data?: any }>("/blog-seo", { method: "POST", body });
  done();
  const item = (res as any)?.data ?? res;
  return laravelToBlogPost({ ...item, slug: item?.slug || p.slug }, "seo");
};

/** The /blog-seo id behind a row. Older /content articles and site articles get their record on first save. */
async function ensureSeoId(id: string, patch: Partial<DbBlogPost> = {}): Promise<string> {
  const direct = seoIdOf(id);
  if (direct) return direct;
  const all = await fetchAllRowsAdmin();
  const base = all.find((x) => x.id === id) || (await staticRows()).find((x) => x.id === id || x.slug === id);
  const slug = patch.slug ?? base?.slug ?? id.replace(/^(static|laravel)-/, "");
  const already = all.find((r) => r.slug === slug && r.id.startsWith("seo-"));
  if (already) return seoIdOf(already.id) as string;
  const created = await createPost({
    slug,
    category_ar: patch.category_ar ?? base?.category_ar ?? "مقالات",
    category_en: patch.category_en ?? base?.category_en ?? "Articles",
    focus_keyword: (patch.focus_keyword ?? base?.focus_keyword ?? slug) || slug,
    title_ar: patch.title_ar ?? base?.title_ar ?? slug,
    title_en: patch.title_en ?? base?.title_en ?? slug,
    excerpt_ar: patch.excerpt_ar ?? base?.excerpt_ar ?? "",
    excerpt_en: patch.excerpt_en ?? base?.excerpt_en ?? "",
    body_ar: patch.body_ar ?? base?.body_ar ?? [],
    body_en: patch.body_en ?? base?.body_en ?? [],
    tags_ar: patch.tags_ar ?? base?.tags_ar ?? [],
    tags_en: patch.tags_en ?? base?.tags_en ?? [],
    image_url: savableImage(patch.image_url ?? base?.image_url) || undefined,
    og_image_url: savableImage(patch.og_image_url ?? base?.og_image_url) || undefined,
    status: patch.status ?? base?.status ?? "published",
  });
  const newId = seoIdOf(created.id);
  if (!newId) throw new Error("تم الحفظ لكن الخادم لم يُرجع رقم المقال");
  return newId;
}

async function patchSeo(seoId: string, body: Record<string, unknown>) {
  await apiFetch(`/blog-seo/${seoId}`, { method: "PATCH", body });
  done();
}

/** Status change (published / draft / scheduled / archived). Throws on failure. */
export const updatePostStatus = async (id: string, status: DbStatus, scheduled_at?: string | null) => {
  const seoId = await ensureSeoId(id, { status });
  await patchSeo(seoId, toBlogSeoBody({ status, scheduled_at: status === "scheduled" ? scheduled_at ?? null : null }));
};

/** Cover / OG image. Throws on failure. */
export const updatePostMedia = async (id: string, patch: { image_url?: string | null; og_image_url?: string | null }) => {
  const seoId = await ensureSeoId(id, patch);
  await patchSeo(seoId, toBlogSeoBody(patch));
};

/** Full content (everything except status). Throws on failure; returns the row id ("seo-<id>"). */
export const updatePost = async (
  id: string,
  patch: Partial<Omit<DbBlogPost, "id" | "created_at" | "updated_at" | "status" | "published_at">>,
): Promise<string> => {
  const seoId = await ensureSeoId(id, patch);
  await patchSeo(seoId, toBlogSeoBody(patch));
  return `seo-${seoId}`;
};

/**
 * Delete an article. Backend articles are deleted (article + SEO record). An article shipped with the
 * site's code can't be removed from the code here, so it is archived instead — hidden from the site and the sitemap.
 */
export const deletePost = async (id: string): Promise<"deleted" | "archived"> => {
  const seoId = seoIdOf(id);
  if (seoId) {
    await apiFetch(`/blog-seo/${seoId}`, { method: "DELETE" });
    done();
    return "deleted";
  }
  const contentId = contentIdOf(id);
  if (contentId) {
    await apiFetch(`/content/${contentId}`, { method: "DELETE" });
    done();
    return "deleted";
  }
  await updatePostStatus(id, "archived");
  return "archived";
};
