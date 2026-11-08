import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/data/laravelApi";

/**
 * GET /auth/providers: which social sign-in buttons the server is set up for. It ships in the same
 * routes file as the email codes and the super admin's password tool (8 Nov 2026), so `ready` also
 * tells the account pages that those features are on the server.
 */
export function useAuthProviders() {
  const q = useQuery({ queryKey: ["auth-providers"], queryFn: () => authApi.providers(), retry: false, staleTime: 10 * 60_000 });
  return { providers: q.data ?? null, ready: q.isSuccess };
}
