import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatServerImageUrl, invalidateApiCache } from "@/data/laravelApi";
import { apiErrorMessage, fetchList } from "@/data/api/adminApiHelpers";

export type ContentType = "article" | "program" | "faq" | "page";
export type ContentStatus = "published" | "draft";

export interface ContentDoc {
  id: string;
  type: ContentType;
  slug?: string;
  status: ContentStatus;
  author: string;
  updatedAt: string;
  title: { ar: string; en: string };
  excerpt?: { ar: string; en: string };
  body?: { ar: string; en: string };
  image?: string;
  tags?: string[];
}

/** Prefix for docs that live in Laravel `/content` (id = `CONTENT:<laravel id>`). */
export const CONTENT_ID_PREFIX = "CONTENT:";

/** Laravel id of a `/content` doc, or null for a doc that has not been saved yet. */
export const contentLaravelId = (docId: string): string | null =>
  docId.startsWith(CONTENT_ID_PREFIX) ? docId.slice(CONTENT_ID_PREFIX.length) : null;

type LaravelContentRow = {
  id: number | string;
  type?: string;
  status?: string;
  slug?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  summary_ar?: string | null;
  summary_en?: string | null;
  content_ar?: string | null;
  content_en?: string | null;
  cover_image?: string | null;
  tags?: string[] | string | null;
  author?: { id?: number; name?: string } | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const TYPES: ContentType[] = ["article", "program", "faq", "page"];

function fromLaravel(r: LaravelContentRow): ContentDoc {
  const type = (TYPES.includes(r.type as ContentType) ? r.type : "page") as ContentType;
  const tags = Array.isArray(r.tags) ? r.tags.map(String) : typeof r.tags === "string" && r.tags ? r.tags.split(",").map((t) => t.trim()) : [];
  return {
    id: `${CONTENT_ID_PREFIX}${r.id}`,
    type,
    slug: r.slug || undefined,
    status: r.status === "published" ? "published" : "draft",
    author: r.author?.name || "—",
    updatedAt: String(r.updated_at || r.created_at || "").slice(0, 10),
    title: { ar: r.title_ar || "", en: r.title_en || "" },
    excerpt: { ar: r.summary_ar || "", en: r.summary_en || "" },
    body: { ar: r.content_ar || "", en: r.content_en || "" },
    image: r.cover_image ? formatServerImageUrl(r.cover_image) : undefined,
    tags,
  };
}

/** ContentDoc → Laravel `/content` body (Postman: type,status,slug,title_*,summary_*,content_*,cover_image,tags). */
function toLaravel(doc: ContentDoc): Record<string, unknown> {
  return {
    type: doc.type,
    status: doc.status,
    slug: doc.slug || undefined,
    title_ar: doc.title.ar,
    title_en: doc.title.en,
    summary_ar: doc.excerpt?.ar ?? "",
    summary_en: doc.excerpt?.en ?? "",
    content_ar: doc.body?.ar ?? "",
    content_en: doc.body?.en ?? "",
    // Only real URLs (uploaded through /gallery) are sent — never data:/blob: URLs.
    cover_image: doc.image && !doc.image.startsWith("data:") && !doc.image.startsWith("blob:") ? doc.image : null,
    tags: doc.tags ?? [],
  };
}

/**
 * Admin "content" documents backed by Laravel `/content` (all types).
 * Every write goes to the server and throws on failure — there is no localStorage copy.
 */
export const useContentStore = () => {
  const [items, setItems] = useState<ContentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchList<LaravelContentRow>("/content", { per_page: 200 });
      setItems(rows.map(fromLaravel));
    } catch (e) {
      setItems([]);
      setError(apiErrorMessage(e, "تعذر تحميل المحتوى"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  /** POST /content (new doc) or PATCH /content/{id}. Throws on failure. */
  const upsert = async (doc: ContentDoc): Promise<ContentDoc> => {
    const id = contentLaravelId(doc.id);
    const res = await apiFetch<{ data?: LaravelContentRow } | LaravelContentRow>(id ? `/content/${id}` : "/content", {
      method: id ? "PATCH" : "POST",
      body: toLaravel(doc),
    });
    invalidateApiCache("/content");
    const row = (res && typeof res === "object" && "data" in res && res.data ? res.data : res) as LaravelContentRow;
    const saved = row && row.id !== undefined ? fromLaravel(row) : doc;
    await reload();
    return saved;
  };

  /** DELETE /content/{id}. Throws on failure. */
  const remove = async (docId: string): Promise<void> => {
    const id = contentLaravelId(docId);
    if (!id) throw new Error("العنصر غير محفوظ في قاعدة البيانات");
    await apiFetch(`/content/${id}`, { method: "DELETE" });
    invalidateApiCache("/content");
    setItems((prev) => prev.filter((p) => p.id !== docId));
  };

  /** PATCH /content/{id} {status}. Throws on failure. */
  const setStatus = async (docId: string, status: ContentStatus): Promise<void> => {
    const id = contentLaravelId(docId);
    if (!id) throw new Error("العنصر غير محفوظ في قاعدة البيانات");
    await apiFetch(`/content/${id}`, { method: "PATCH", body: { status } });
    invalidateApiCache("/content");
    setItems((prev) => prev.map((p) => (p.id === docId ? { ...p, status, updatedAt: new Date().toISOString().slice(0, 10) } : p)));
  };

  return { items, loading, error, reload, upsert, remove, setStatus };
};
