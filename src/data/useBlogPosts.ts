import { useQuery } from "@tanstack/react-query";
import { blogPosts as staticPosts } from "./blog";
import { fetchAllPostsAdmin, fetchAllRowsAdmin, dbToBlogPost, type DbBlogPost } from "./blogApi";
import type { BlogPost } from "./blog";

/** `hidden`: slugs the team unpublished or deleted-as-archived — their built-in copy must not show either. */
const merge = (db: BlogPost[], hidden: Set<string> = new Set()): BlogPost[] => {
  const seen = new Set(db.map((p) => p.slug));
  const fromStatic = staticPosts.filter((p) => !seen.has(p.slug) && !hidden.has(p.slug));
  return [...db, ...fromStatic].sort((a, b) => (a.date < b.date ? 1 : -1));
};

/** Public hook — published backend posts + the built-in posts the team hasn't unpublished. */
export function useAllBlogPosts() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog_posts", "published"],
    queryFn: async () => {
      const rows = await fetchAllRowsAdmin();
      const backend = rows.filter((r) => !r.id.startsWith("static-"));
      return {
        published: rows.filter((r) => r.status === "published").map(dbToBlogPost),
        hidden: new Set(backend.filter((r) => r.status !== "published").map((r) => r.slug)),
      };
    },
    staleTime: 60_000,
  });
  return { posts: merge(data?.published ?? [], data?.hidden), loading: isLoading };
}

/** Admin hook — pulls every DB row (incl. drafts) merged with static. */
export function useAllBlogPostsAdmin() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["blog_posts", "all"],
    queryFn: fetchAllPostsAdmin,
    staleTime: 30_000,
  });
  return { posts: merge(data), loading: isLoading, refetch };
}

/** Admin: raw DB rows (with status + scheduled_at), no static merge. */
export function useAllBlogRowsAdmin() {
  const { data = [], isLoading, refetch } = useQuery<DbBlogPost[]>({
    queryKey: ["blog_posts", "rows"],
    queryFn: fetchAllRowsAdmin,
    staleTime: 30_000,
  });
  return { rows: Array.isArray(data) ? data : [], loading: isLoading, refetch };
}