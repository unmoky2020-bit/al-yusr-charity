import { useQuery } from "@tanstack/react-query";
import { blogPosts as staticPosts } from "./blog";
import { fetchPublishedPosts, fetchAllPostsAdmin, fetchAllRowsAdmin, type DbBlogPost } from "./blogApi";
import type { BlogPost } from "./blog";

const merge = (db: BlogPost[]): BlogPost[] => {
  const seen = new Set(db.map((p) => p.slug));
  const fromStatic = staticPosts.filter((p) => !seen.has(p.slug));
  return [...db, ...fromStatic].sort((a, b) => (a.date < b.date ? 1 : -1));
};

/** Public hook — merges DB-published posts with static seed posts. */
export function useAllBlogPosts() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["blog_posts", "published"],
    queryFn: fetchPublishedPosts,
    staleTime: 60_000,
  });
  return { posts: merge(data), loading: isLoading };
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