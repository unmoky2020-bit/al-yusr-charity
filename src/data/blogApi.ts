import { apiFetch, formatServerImageUrl } from "./laravelApi";
import type { BlogPost } from "./blog";
import { blogPosts } from "./blog";

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
  focus_keyword: r.focus_keyword || undefined,
  tags: [...(r.tags_ar || []), ...(r.tags_en || [])],
});

const staticAsDb: DbBlogPost[] = (blogPosts || []).map((p) => ({
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
}));

const BLOG_POSTS_STORAGE_KEY = "alyusr_custom_blog_posts_v2";

export function getStoredCustomPosts(): DbBlogPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomPosts(posts: DbBlogPost[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch {}
}

/** Map a Laravel /content article to DbBlogPost */
function laravelToBlogPost(item: any): DbBlogPost {
  const rawImg = item.cover_image || item.image || item.image_url || null;
  return {
    id: `laravel-${item.id || item.slug}`,
    slug: item.slug || "",
    status: (item.status || "published") as DbStatus,
    published_at: item.published_at || item.created_at || new Date().toISOString(),
    scheduled_at: item.scheduled_at || null,
    image_url: rawImg ? formatServerImageUrl(rawImg) : null,
    og_image_url: null,
    category_ar: item.category_ar || "مقالات",
    category_en: item.category_en || "Articles",
    focus_keyword: item.focus_keyword || item.slug || null,
    title_ar: item.title_ar || item.title || "",
    title_en: item.title_en || item.title_ar || item.title || "",
    excerpt_ar: item.summary_ar || item.excerpt_ar || item.excerpt || "",
    excerpt_en: item.summary_en || item.excerpt_en || item.summary_ar || "",
    body_ar: item.content_ar
      ? (typeof item.content_ar === "string" ? item.content_ar.split(/\n\s*\n/) : [])
      : [],
    body_en: item.content_en
      ? (typeof item.content_en === "string" ? item.content_en.split(/\n\s*\n/) : [])
      : [],
    tags_ar: Array.isArray(item.tags) ? item.tags : (Array.isArray(item.tags_ar) ? item.tags_ar : []),
    tags_en: Array.isArray(item.tags_en) ? item.tags_en : [],
    seo_score: item.seo_score || 90,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.created_at || new Date().toISOString(),
  };
}

/** Admin: full row including status + scheduled_at — used by SEO panel. */
export const fetchAllRowsAdmin = async (): Promise<DbBlogPost[]> => {
  const map = new Map<string, DbBlogPost>();

  // 1. Seed with static posts (rich posts from blog data)
  for (const p of staticAsDb) {
    map.set(p.slug, p);
  }

  // 2. Overlay custom local storage posts (persists user edits/creations)
  const custom = getStoredCustomPosts();
  for (const c of custom) {
    map.set(c.slug, c);
  }

  // 3. Overlay Laravel /content (type: article) — primary source
  try {
    const res = await apiFetch<{ data?: any[] } | any[]>("/content?type=article", {
      method: "GET",
      ttlMs: 30000,
    });
    const items = Array.isArray(res) ? res : (res && Array.isArray((res as any).data) ? (res as any).data : []);
    for (const item of items) {
      if (item && item.slug) {
        map.set(item.slug, laravelToBlogPost(item));
      }
    }
  } catch {}

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
    if (item && (item.slug === slug || item.id)) {
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

export const createPost = async (p: NewPostInput) => {
  const status: DbStatus = p.status ?? "draft";
  const now = new Date().toISOString();
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newRow: DbBlogPost = {
    id,
    slug: p.slug,
    status,
    published_at: status === "published" ? now : null,
    scheduled_at: status === "scheduled" ? p.scheduled_at ?? null : null,
    image_url: p.image_url ?? null,
    og_image_url: p.og_image_url ?? null,
    category_ar: p.category_ar,
    category_en: p.category_en,
    focus_keyword: p.focus_keyword ?? null,
    title_ar: p.title_ar,
    title_en: p.title_en,
    excerpt_ar: p.excerpt_ar,
    excerpt_en: p.excerpt_en,
    body_ar: p.body_ar,
    body_en: p.body_en,
    tags_ar: p.tags_ar,
    tags_en: p.tags_en,
    seo_score: p.seo_score ?? 90,
    created_at: now,
    updated_at: now,
  };

  // 1. Save to local storage immediately
  const current = getStoredCustomPosts();
  const filtered = current.filter((x) => x.slug !== p.slug);
  saveStoredCustomPosts([newRow, ...filtered]);

  // 2. Post to Laravel /content (type: article) — primary backend
  try {
    const laravelRes = await apiFetch<{ data?: any }>("/content", {
      method: "POST",
      body: {
        type: "article",
        status: status === "published" ? "published" : "draft",
        slug: p.slug,
        title_ar: p.title_ar,
        title_en: p.title_en,
        summary_ar: p.excerpt_ar,
        summary_en: p.excerpt_en,
        content_ar: Array.isArray(p.body_ar) ? p.body_ar.join("\n\n") : p.body_ar,
        content_en: Array.isArray(p.body_en) ? p.body_en.join("\n\n") : p.body_en,
        focus_keyword: p.focus_keyword || p.slug,
        cover_image: p.image_url || null,
        tags: p.tags_ar,
      },
    });
    // Update local store with real backend ID if available
    if (laravelRes && (laravelRes as any)?.data?.id) {
      const backendPost = laravelToBlogPost((laravelRes as any).data);
      const updated = getStoredCustomPosts();
      const idx = updated.findIndex((x) => x.slug === p.slug);
      if (idx !== -1) updated[idx] = { ...updated[idx], id: backendPost.id };
      saveStoredCustomPosts(updated);
    }
  } catch {}
};

export const updatePostStatus = async (
  id: string,
  status: DbStatus,
  scheduled_at?: string | null,
) => {
  const current = getStoredCustomPosts();
  const target = current.find((x) => x.id === id || x.slug === id);
  if (target) {
    target.status = status;
    if (status === "published") target.published_at = new Date().toISOString();
    if (status === "scheduled") target.scheduled_at = scheduled_at || null;
    if (status === "draft") target.scheduled_at = null;
    target.updated_at = new Date().toISOString();
    saveStoredCustomPosts([...current]);
  } else {
    const staticMatch = staticAsDb.find((x) => x.id === id || x.slug === id);
    if (staticMatch) {
      const cloned: DbBlogPost = {
        ...staticMatch,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
        scheduled_at: status === "scheduled" ? scheduled_at || null : null,
        updated_at: new Date().toISOString(),
      };
      saveStoredCustomPosts([cloned, ...current]);
    }
  }

  // Sync to Laravel if ID has the laravel- prefix or is a number
  const laravelId = id.startsWith("laravel-") ? id.replace("laravel-", "") : (isNaN(Number(id)) ? null : id);
  if (laravelId) {
    const payload: Record<string, unknown> = { status };
    if (status === "published") payload.published_at = new Date().toISOString();
    if (status === "scheduled") payload.scheduled_at = scheduled_at;
    if (status === "draft") payload.scheduled_at = null;
    try {
      await apiFetch(`/content/${laravelId}`, { method: "PATCH", body: payload });
    } catch {}
  }
};

export const updatePostMedia = async (
  id: string,
  patch: { image_url?: string | null; og_image_url?: string | null },
) => {
  const current = getStoredCustomPosts();
  const target = current.find((x) => x.id === id || x.slug === id);
  if (target) {
    if (patch.image_url !== undefined) target.image_url = patch.image_url;
    if (patch.og_image_url !== undefined) target.og_image_url = patch.og_image_url;
    target.updated_at = new Date().toISOString();
    saveStoredCustomPosts([...current]);
  } else {
    const staticMatch = staticAsDb.find((x) => x.id === id || x.slug === id);
    if (staticMatch) {
      const cloned: DbBlogPost = {
        ...staticMatch,
        ...(patch.image_url !== undefined ? { image_url: patch.image_url } : {}),
        ...(patch.og_image_url !== undefined ? { og_image_url: patch.og_image_url } : {}),
        updated_at: new Date().toISOString(),
      };
      saveStoredCustomPosts([cloned, ...current]);
    }
  }

  const laravelId = id.startsWith("laravel-") ? id.replace("laravel-", "") : (isNaN(Number(id)) ? null : id);
  if (laravelId && patch.image_url !== undefined) {
    try {
      await apiFetch(`/content/${laravelId}`, { method: "PATCH", body: { cover_image: patch.image_url } });
    } catch {}
  }
};

/** Admin: update full content of a post (everything except status). */
export const updatePost = async (
  id: string,
  patch: Partial<Omit<DbBlogPost, "id" | "created_at" | "updated_at" | "status" | "published_at">>,
) => {
  const current = getStoredCustomPosts();
  let target = current.find((x) => x.id === id || x.slug === id);
  if (target) {
    Object.assign(target, patch);
    target.updated_at = new Date().toISOString();
    saveStoredCustomPosts([...current]);
  } else {
    const staticMatch = staticAsDb.find((x) => x.id === id || x.slug === id);
    if (staticMatch) {
      const cloned: DbBlogPost = {
        ...staticMatch,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      target = cloned;
      saveStoredCustomPosts([cloned, ...current]);
    }
  }

  const targetSlug = patch.slug || target?.slug || (id.startsWith("static-") ? id.replace("static-", "") : id);
  let laravelId = id.startsWith("laravel-") ? id.replace("laravel-", "") : (isNaN(Number(id)) ? null : id);

  // If no direct laravelId, query the backend by slug to find the real backend content record
  if (!laravelId && targetSlug) {
    try {
      const checkRes = await apiFetch<{ data?: any } | any>(
        `/content?type=article&slug=${encodeURIComponent(targetSlug)}`,
        { method: "GET", useCache: false }
      );
      const foundItem = (checkRes as any)?.data?.[0] || (Array.isArray(checkRes) ? checkRes[0] : null) || checkRes?.data || (checkRes?.id ? checkRes : null);
      if (foundItem?.id) {
        laravelId = String(foundItem.id);
        const posts = getStoredCustomPosts();
        const idx = posts.findIndex((p) => p.slug === targetSlug || p.id === id);
        if (idx !== -1) {
          posts[idx].id = `laravel-${laravelId}`;
          saveStoredCustomPosts(posts);
        }
      }
    } catch {}
  }

  const laravelPayload: Record<string, unknown> = {};
  if (patch.title_ar !== undefined) laravelPayload.title_ar = patch.title_ar;
  if (patch.title_en !== undefined) laravelPayload.title_en = patch.title_en;
  if (patch.excerpt_ar !== undefined) laravelPayload.summary_ar = patch.excerpt_ar;
  if (patch.excerpt_en !== undefined) laravelPayload.summary_en = patch.excerpt_en;
  if (patch.body_ar !== undefined) laravelPayload.content_ar = Array.isArray(patch.body_ar) ? patch.body_ar.join("\n\n") : patch.body_ar;
  if (patch.body_en !== undefined) laravelPayload.content_en = Array.isArray(patch.body_en) ? patch.body_en.join("\n\n") : patch.body_en;
  if (patch.slug !== undefined) laravelPayload.slug = patch.slug;
  if (patch.focus_keyword !== undefined) laravelPayload.focus_keyword = patch.focus_keyword;
  if (patch.image_url !== undefined) laravelPayload.cover_image = patch.image_url;
  if (patch.tags_ar !== undefined) laravelPayload.tags = patch.tags_ar;

  if (laravelId) {
    // Article exists on Laravel backend -> PATCH update
    try {
      await apiFetch(`/content/${laravelId}`, { method: "PATCH", body: laravelPayload });
    } catch (err) {
      console.warn("Could not patch article on Laravel:", err);
    }
  } else if (targetSlug) {
    // Article does not exist yet on Laravel backend -> POST create to persist permanently
    try {
      const createRes = await apiFetch<{ data?: any }>("/content", {
        method: "POST",
        body: {
          type: "article",
          status: target?.status || "published",
          slug: targetSlug,
          title_ar: patch.title_ar || target?.title_ar || targetSlug,
          title_en: patch.title_en || target?.title_en || patch.title_ar || targetSlug,
          summary_ar: patch.excerpt_ar || target?.excerpt_ar || "",
          summary_en: patch.excerpt_en || target?.excerpt_en || "",
          content_ar: Array.isArray(patch.body_ar) ? patch.body_ar.join("\n\n") : (patch.body_ar || (Array.isArray(target?.body_ar) ? target.body_ar.join("\n\n") : "")),
          content_en: Array.isArray(patch.body_en) ? patch.body_en.join("\n\n") : (patch.body_en || (Array.isArray(target?.body_en) ? target.body_en.join("\n\n") : "")),
          focus_keyword: patch.focus_keyword || target?.focus_keyword || targetSlug,
          cover_image: patch.image_url || target?.image_url || null,
          tags: patch.tags_ar || target?.tags_ar || [],
        },
      });
      if (createRes && (createRes as any)?.data?.id) {
        const newId = (createRes as any).data.id;
        const posts = getStoredCustomPosts();
        const idx = posts.findIndex((p) => p.slug === targetSlug || p.id === id);
        if (idx !== -1) {
          posts[idx].id = `laravel-${newId}`;
          saveStoredCustomPosts(posts);
        }
      }
    } catch (err) {
      console.warn("Could not create article on Laravel:", err);
    }
  }
};
