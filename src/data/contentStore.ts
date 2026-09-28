import { useEffect, useState } from "react";

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

// Bump key when seed/shape changes so stale localStorage seed is purged for users.
const KEY = "alyusr_content_v2";

/**
 * Local content store seed — intentionally EMPTY.
 * All real content (articles/FAQs/programs/stories) is now sourced from
 * Lovable Cloud (blog_posts, donation_nodes.metadata.faq, stories).
 * This store is kept only for ad-hoc local drafts created from /admin/content.
 */
const SEED: ContentDoc[] = [];

const load = (): ContentDoc[] => {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try { return JSON.parse(raw); } catch { return SEED; }
};

const save = (list: ContentDoc[]) => localStorage.setItem(KEY, JSON.stringify(list));

export const useContentStore = () => {
  const [items, setItems] = useState<ContentDoc[]>(() => load());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const upsert = (doc: ContentDoc) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === doc.id);
      const next = exists ? prev.map((p) => (p.id === doc.id ? doc : p)) : [doc, ...prev];
      save(next);
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      save(next);
      return next;
    });
  };

  const setStatus = (id: string, status: ContentStatus) => {
    setItems((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString().slice(0, 10) } : p));
      save(next);
      return next;
    });
  };

  const reset = () => {
    save(SEED);
    setItems(SEED);
  };

  return { items, upsert, remove, setStatus, reset };
};

export const getPublishedArticles = (): ContentDoc[] => {
  return load().filter((d) => d.type === "article" && d.status === "published");
};

export const getPublishedFaqs = (): ContentDoc[] => {
  return load().filter((d) => d.type === "faq" && d.status === "published");
};