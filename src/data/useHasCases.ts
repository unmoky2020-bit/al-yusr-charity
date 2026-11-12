import { useQuery } from "@tanstack/react-query";
import { listPublicCases } from "@/data/casesApi";

const KEY = "yusr:has-public-cases";
const remembered = (): boolean => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

/**
 * Are there published cases to show? While there are none, links to «الحالات» stay out of the
 * navigation so nobody lands on an empty list. The last answer is remembered per browser so the
 * link does not blink on every visit.
 */
export function useHasCases(): boolean {
  const { data } = useQuery({
    queryKey: ["has-public-cases"],
    queryFn: async () => {
      const has = (await listPublicCases({ limit: 1 })).length > 0;
      try { localStorage.setItem(KEY, has ? "1" : "0"); } catch { /* private mode */ }
      return has;
    },
    staleTime: 5 * 60_000,
  });
  return data ?? remembered();
}
