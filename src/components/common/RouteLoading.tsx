import { useLocation } from "react-router-dom";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { PageLayout } from "@/components/layout/PageLayout";

/**
 * What a route shows while its code or the signed-in account is still loading. The route fallback
 * and the sign-in gate (RequireAuth) both use it, so a page opens with the same mark the boot splash
 * shows and nothing else in between (no spinner, no second loader).
 * Dashboard routes get the mark alone; site routes keep the header around it.
 */
export function RouteLoading() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return <PageLoadingState />;
  return (
    <PageLayout>
      <PageLoadingState />
    </PageLayout>
  );
}
