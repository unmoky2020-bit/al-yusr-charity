import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "./laravelApi";
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
  image: r.image_url || "/placeholder.svg",
  date: (r.published_at || r.scheduled_at || r.created_at || new Date().toISOString()).slice(0, 10),
  category: { ar: r.category_ar || "", en: r.category_en || "" },
  ar: { title: r.title_ar || "", excerpt: r.excerpt_ar || "", body: r.body_ar || [], tags: r.tags_ar || [] },
  en: { title: r.title_en || "", excerpt: r.excerpt_en || "", body: r.body_en || [], tags: r.tags_en || [] },
});

const staticAsDb: DbBlogPost[] = (blogPosts || []).map((p) => ({
  id: `static-${p.slug}`,
  slug: p.slug,
  status: "published" as DbStatus,
  published_at: p.date || new Date().toISOString(),
  scheduled_at: null,
  image_url: p.image,
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

/** Admin: full row including status + scheduled_at — used by SEO panel. */
export const fetchAllRowsAdmin = async (): Promise<DbBlogPost[]> => {
  const map = new Map<string, DbBlogPost>();

  // 1. Seed with static posts (52 rich posts)
  for (const p of staticAsDb) {
    map.set(p.slug, p);
  }

  // 2. Overlay custom local storage posts (persists user edits/creations)
  const custom = getStoredCustomPosts();
  for (const c of custom) {
    map.set(c.slug, c);
  }

  // 3. Overlay Supabase if available
  try {
    const { data, error } = await supabase
      .from("blog_posts" as never).select("*")
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      for (const sp of (data as unknown as DbBlogPost[])) {
        map.set(sp.slug, sp);
      }
    }
  } catch {}

  // 4. Overlay Laravel /content (type: article) if available
  try {
    const res = await apiFetch<{ data?: any[] } | any[]>("/content?type=article", {
      method: "GET",
      ttlMs: 30000,
    });
    const items = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
    for (const item of items) {
      if (item && item.slug) {
        map.set(item.slug, {
          id: `laravel-${item.id || item.slug}`,
          slug: item.slug,
          status: (item.status || "published") as DbStatus,
          published_at: item.created_at || new Date().toISOString(),
          scheduled_at: null,
          image_url: item.cover_image || null,
          og_image_url: null,
          category_ar: "مقالات",
          category_en: "Articles",
          focus_keyword: item.slug,
          title_ar: item.title_ar || "",
          title_en: item.title_en || item.title_ar || "",
          excerpt_ar: item.summary_ar || "",
          excerpt_en: item.summary_en || item.summary_ar || "",
          body_ar: item.content_ar ? item.content_ar.split(/\n\s*\n/) : [],
          body_en: item.content_en ? item.content_en.split(/\n\s*\n/) : [],
          tags_ar: Array.isArray(item.tags) ? item.tags : [],
          tags_en: [],
          seo_score: 90,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        });
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
  scheduled_at?: string | null;
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

  // 1. Save to local storage
  const current = getStoredCustomPosts();
  const filtered = current.filter((x) => x.slug !== p.slug);
  saveStoredCustomPosts([newRow, ...filtered]);

  // 2. Post to Laravel /content (type: article) if online
  try {
    await apiFetch("/content", {
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
        tags: p.tags_ar,
      },
    });
  } catch {}

  // 3. Post to Supabase if online
  try {
    await supabase.from("blog_posts" as never).insert(newRow as never);
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
    // If not yet in custom store, check if it's a static post being updated
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

  const payload: Record<string, unknown> = { status };
  if (status === "published") payload.published_at = new Date().toISOString();
  if (status === "scheduled") payload.scheduled_at = scheduled_at;
  if (status === "draft") payload.scheduled_at = null;
  try {
    await supabase.from("blog_posts" as never).update(payload as never).eq("id", id);
  } catch {}
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

  try {
    await supabase.from("blog_posts" as never).update(patch as never).eq("id", id);
  } catch {}
};

/** Admin: update full content of a post (everything except status). */
export const updatePost = async (
  id: string,
  patch: Partial<Omit<DbBlogPost, "id" | "created_at" | "updated_at" | "status" | "published_at">>,
) => {
  const current = getStoredCustomPosts();
  const target = current.find((x) => x.id === id || x.slug === id);
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
      saveStoredCustomPosts([cloned, ...current]);
    }
  }

  try {
    await supabase.from("blog_posts" as never).update(patch as never).eq("id", id);
  } catch {}
};
