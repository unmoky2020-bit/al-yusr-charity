import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { resetNotifications } from "@/data/notifications/notificationsStore";
import { authApi, getApiToken, clearApiToken, invalidateApiCache, type LaravelUser, type SocialProvider } from "@/data/laravelApi";
import { profileApi, volunteerAdminApi } from "@/data/api/profileApi";
import { apiErrorMessage } from "@/data/api/adminApiHelpers";
import { submitContactMessage } from "@/data/api/contactApi";
import { toast } from "@/hooks/use-toast";
import { Permission, inferPermissions } from "./permissions";
import { buildUserFromLaravel, type Role, type User } from "./userBuilder";
import type { AdminAccess } from "./adminAccess";

export type { Role, User };
export type DbRole = "admin" | "editor" | "case_manager" | "volunteer" | "delegate" | "donor";
export type VolunteerStatus = NonNullable<User["volunteerStatus"]>;

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
  /** PUT /volunteers/{id} {status, program_slug?}. Rejects on failure. */
  setVolunteerStatus: (id: string, status: VolunteerStatus, assignedProgram?: string) => Promise<void>;
  setUserRoles: (id: string, roles: Role[]) => void;
  /** PUT /volunteers/{id} {permissions}. Rejects on failure. */
  setUserPermissions: (id: string, perms: Permission[]) => Promise<void>;
  removeUser: (id: string) => void;
  hasRole: (role: Role) => boolean;
  hasPermission: (perm: Permission) => boolean;
  refresh: () => Promise<void>;
  /** Put a user the server just returned (profile save, new photo) into the session. */
  applyServerUser: (lUser: LaravelUser) => void;
  /** Google ID token / Facebook access token → signed in (donor accounts). */
  loginWithSocial: (provider: SocialProvider, token: string) => Promise<LoginResult & { created?: boolean }>;
  /**
   * The server permissions of a team account (GET /me/access): undefined while loading, null when
   * the server can't tell (older backend) or for donors.
   */
  access: AdminAccess | null | undefined;
};

const AuthCtx = createContext<Ctx | null>(null);

const toDbRole = (r: Role): DbRole => (r === "caseworker" ? "case_manager" : (r as DbRole));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AdminAccess | null | undefined>(undefined);

  // Team accounts: what their roles allow on the server decides the dashboard menu.
  const teamKey = user && user.roles.some((r) => r !== "donor") ? `${user.id}:${user.roles.join(",")}` : "";
  useEffect(() => {
    if (!teamKey) {
      setAccess(null);
      return;
    }
    let alive = true;
    setAccess(undefined);
    authApi
      .access()
      .then((a) => alive && setAccess({ permissions: Array.isArray(a?.permissions) ? a.permissions : [], superAdmin: Boolean(a?.super_admin) }))
      .catch(() => alive && setAccess(null));
    return () => {
      alive = false;
    };
  }, [teamKey]);

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

  const loginWithSocial: Ctx["loginWithSocial"] = async (provider, token) => {
    try {
      const res = await authApi.socialLogin(provider, token);
      if (!res.token) return { ok: false, error: res.message };
      const u = res.user ? buildUserFromLaravel(res.user) : await authApi.profile().then(buildUserFromLaravel);
      setUser(u);
      setSession({ token: res.token, user: u });
      return { ok: true, created: Boolean(res.created) };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "تعذر تسجيل الدخول" };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearApiToken();
    resetNotifications();
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

  /**
   * The server never lets a sign-up choose a team role, so an editor application is a normal account
   * plus a message in the team inbox; the super admin gives the Editor role from the user's page.
   */
  const registerEditor: Ctx["registerEditor"] = async (data) => {
    const res = await registerDonor({ name: data.name, email: data.email, password: data.password, phone: data.phone });
    if (!res.ok) return res;
    try {
      await submitContactMessage({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        section: "general",
        source: "editor-application",
        message: ["طلب الانضمام كمحرر محتوى (المدونة).", data.city ? `المدينة: ${data.city}` : "", data.bio ? `الخبرة: ${data.bio}` : ""].filter(Boolean).join("\n"),
      });
    } catch {
      /* the account exists; the team still sees the new user in its notifications */
    }
    return { ok: true };
  };

  const applyServerUser = useCallback((lUser: LaravelUser) => {
    if (!lUser || !(lUser.id || lUser.email)) return;
    const next = buildUserFromLaravel(lUser);
    // A reply without roles must not turn a team account into a donor: keep the roles we have.
    const sentRoles = (Array.isArray(lUser.roles) && lUser.roles.length > 0) || Boolean(lUser.role);
    setUser((prev) => (prev ? { ...prev, ...next, roles: sentRoles ? next.roles : prev.roles } : next));
    setSession((prev) => (prev ? { ...prev, user: { ...prev.user, ...next, roles: sentRoles ? next.roles : prev.user.roles } } : prev));
  }, []);

  /** PUT /profile — the local user is updated only after the server accepted the change. */
  const updateProfile: Ctx["updateProfile"] = async (_id, patch) => {
    try {
      const saved = await profileApi.update({
        name: patch.name,
        email: patch.email,
        phone: patch.phone,
        bio: patch.bio,
        city: patch.city,
        governorate: patch.governorate,
        job_title: patch.jobTitle,
        preferences: patch.preferences,
      });
      if (saved && (saved.id || saved.email)) applyServerUser(saved);
      else {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
        setSession((prev) => (prev ? { ...prev, user: { ...prev.user, ...patch } } : prev));
      }
    } catch (err) {
      // Some callers do not await: surface the failure here as well, then reject.
      toast({ variant: "destructive", title: "فشل حفظ الملف الشخصي", description: apiErrorMessage(err) });
      throw err;
    }
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

  const setVolunteerStatus: Ctx["setVolunteerStatus"] = async (id, status, assignedProgram) => {
    await volunteerAdminApi.update(id, {
      status,
      ...(assignedProgram !== undefined ? { program_slug: assignedProgram } : {}),
    });
  };
  const setUserRoles: Ctx["setUserRoles"] = () => {};
  const setUserPermissions: Ctx["setUserPermissions"] = async (id, perms) => {
    await volunteerAdminApi.update(id, { permissions: perms });
  };
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
    invalidateApiCache("/profile");
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
        applyServerUser,
        loginWithSocial,
        access,
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