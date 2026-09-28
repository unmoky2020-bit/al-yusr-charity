import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authApi, getApiToken, clearApiToken, LaravelUser } from "@/data/laravelApi";
import { Permission, inferPermissions } from "./permissions";
import { buildUserFromLaravel } from "./userBuilder";

export type Role = "admin" | "editor" | "caseworker" | "case_manager" | "volunteer" | "delegate" | "donor";
export type DbRole = "admin" | "editor" | "case_manager" | "volunteer" | "delegate" | "donor";
export type VolunteerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  roles: Role[];
  avatar?: string;
  createdAt: string;
  volunteerStatus?: VolunteerStatus;
  skills?: string[];
  city?: string;
  bio?: string;
  assignedProgram?: string;
  permissions?: Permission[];
  totalDonated?: number;
  donationsCount?: number;
  preferredProgram?: string;
}

type LoginResult = { ok: boolean; error?: string };

type Ctx = {
  user: User | null;
  loading: boolean;
  session: { token: string; user: User } | null;
  users: User[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  registerVolunteer: (data: { name: string; email: string; password: string; phone?: string; city?: string; bio?: string; skills?: string[] }) => Promise<LoginResult>;
  registerDonor: (data: { name: string; email: string; password: string; phone?: string; preferredProgram?: string }) => Promise<LoginResult>;
  registerEditor: (data: { name: string; email: string; password: string; phone?: string; city?: string; bio?: string }) => Promise<LoginResult>;
  updateProfile: (id: string, patch: Partial<User>) => Promise<void>;
  changePassword: (id: string, oldPwd: string, newPwd: string) => Promise<LoginResult>;
  setVolunteerStatus: (id: string, status: VolunteerStatus, assignedProgram?: string) => void;
  setUserRoles: (id: string, roles: Role[]) => void;
  setUserPermissions: (id: string, perms: Permission[]) => void;
  removeUser: (id: string) => void;
  hasRole: (role: Role) => boolean;
  hasPermission: (perm: Permission) => boolean;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

const toDbRole = (r: Role): DbRole => (r === "caseworker" ? "case_manager" : (r as DbRole));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = getApiToken();
    if (!token) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const lUser = await authApi.profile();
      if (lUser && (lUser.id || lUser.email)) {
        const u = buildUserFromLaravel(lUser);
        setUser(u);
        setSession({ token, user: u });
      } else {
        clearApiToken();
        setUser(null);
        setSession(null);
      }
    } catch {
      // If token is invalid/expired, reset
      clearApiToken();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();

    // Listen for 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setSession(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [loadProfile]);

  const login: Ctx["login"] = async (email, password) => {
    try {
      const res = await authApi.login({ email: email.trim(), password });
      if (res.token) {
        const u = res.user ? buildUserFromLaravel(res.user) : await authApi.profile().then(buildUserFromLaravel);
        setUser(u);
        setSession({ token: res.token, user: u });
        return { ok: true };
      }
      return { ok: false, error: res.message || "بيانات الدخول غير صحيحة" };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "تعذر تسجيل الدخول";
      return { ok: false, error: message };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearApiToken();
    setUser(null);
    setSession(null);
  };

  const registerDonor: Ctx["registerDonor"] = async (data) => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "donor",
      });
      if (res.token) {
        const u = buildUserFromLaravel(res.user);
        setUser(u);
        setSession({ token: res.token, user: u });
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "فشل التسجيل" };
    }
  };

  const registerVolunteer: Ctx["registerVolunteer"] = async (data) => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "volunteer",
      });
      if (res.token) {
        const u = buildUserFromLaravel(res.user);
        setUser(u);
        setSession({ token: res.token, user: u });
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "فشل التسجيل" };
    }
  };

  const registerEditor: Ctx["registerEditor"] = async (data) => {
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "editor",
      });
      if (res.token) {
        const u = buildUserFromLaravel(res.user);
        setUser(u);
        setSession({ token: res.token, user: u });
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "فشل التسجيل" };
    }
  };

  const updateProfile: Ctx["updateProfile"] = async (_id, patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const changePassword: Ctx["changePassword"] = async (_id, oldPwd, newPwd) => {
    try {
      await authApi.changePassword({
        current_password: oldPwd,
        password: newPwd,
        password_confirmation: newPwd,
      });
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "فشل تغيير كلمة المرور" };
    }
  };

  const setVolunteerStatus: Ctx["setVolunteerStatus"] = () => {};
  const setUserRoles: Ctx["setUserRoles"] = () => {};
  const setUserPermissions: Ctx["setUserPermissions"] = () => {};
  const removeUser: Ctx["removeUser"] = () => {};

  const hasRole = (role: Role) => {
    if (!user) return false;
    const want = toDbRole(role);
    return user.roles.some((r) => toDbRole(r) === want);
  };

  const hasPermission = (perm: Permission) => {
    if (!user) return false;
    if (hasRole("admin") || hasRole("case_manager")) return true;
    const explicit = user.permissions || inferPermissions(user.skills);
    return explicit.includes(perm);
  };

  const refresh = async () => {
    await loadProfile();
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        session,
        users: [],
        login,
        logout,
        registerVolunteer,
        registerDonor,
        registerEditor,
        updateProfile,
        changePassword,
        setVolunteerStatus,
        setUserRoles,
        setUserPermissions,
        removeUser,
        hasRole,
        hasPermission,
        refresh,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};