import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "./AuthContext";

const toDb = (r: Role) => (r === "caseworker" ? "case_manager" : r);

export const RequireAuth = ({ children, roles }: { children: ReactNode; roles?: Role[] }) => {
  const { user, loading, session } = useAuth();
  const loc = useLocation();
  if (loading || (session && !user)) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" aria-label="loading" />
      </div>
    );
  }
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