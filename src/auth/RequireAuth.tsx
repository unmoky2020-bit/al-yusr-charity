import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "./AuthContext";
import { RouteLoading } from "@/components/common/RouteLoading";

const toDb = (r: Role) => (r === "caseworker" ? "case_manager" : r);

export const RequireAuth = ({ children, roles }: { children: ReactNode; roles?: Role[] }) => {
  const { user, loading, session } = useAuth();
  const loc = useLocation();
  // Same mark as the boot splash and the route fallback: the account check never shows a spinner.
  if (loading || (session && !user)) return <RouteLoading />;
  if (!session || !user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (roles && roles.length) {
    const want = roles.map(toDb);
    const have = user.roles.map(toDb);
    if (!want.some((r) => have.includes(r))) {
      return <Navigate to="/profile" replace />;
    }
  }
  return <>{children}</>;
};