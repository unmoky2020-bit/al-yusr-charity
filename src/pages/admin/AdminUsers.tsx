import { UiSelect } from "@/components/common/UiSelect";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Shield, Loader2, KeyRound, Users as UsersIcon, Plus, Trash2, X, Check, CheckSquare, Square, Save, UserCheck } from "lucide-react";
import { AdminLayout, StatCard } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import {
  AdminUserRow,
  DbRole,
  fetchAllUsers,
  fetchAllRoles,
  fetchAllPermissions,
  updateRolePermissions,
  createRole,
  deleteRole,
  createUser,
  deleteUser,
  updateUser,
  ROLE_TO_LARAVEL_ID,
} from "@/data/usersApi";
import { LaravelRole, LaravelPermission } from "@/data/laravelApi";
import { logActivity } from "@/lib/activityLog";

const ROLE_LABEL: Record<string, { ar: string; en: string }> = {
  admin:        { ar: "مدير", en: "Admin" },
  "super-admin":{ ar: "مدير عام", en: "Super Admin" },
  editor:       { ar: "محرر محتوى", en: "Content Editor" },
  volunteer:    { ar: "متطوع", en: "Volunteer" },
  donor:        { ar: "متبرع", en: "Donor" },
  delegate:     { ar: "مندوب ميداني", en: "Field Delegate" },
  case_manager: { ar: "مسؤول حالات", en: "Case Manager" },
};

const MODULE_TITLES: Record<string, { ar: string; en: string }> = {
  content:                { ar: "المحتوى والمقالات",      en: "Content & Blog" },
  gallery:                { ar: "معرض الصور",            en: "Gallery" },
  blog_seo:               { ar: "سيو المقالات",          en: "Blog SEO" },
  homepage:               { ar: "محتوى الصفحة الرئيسية",   en: "Homepage CMS" },
  newsletter:             { ar: "النشرة البريدية",        en: "Newsletter" },
  cases:                  { ar: "الحالات الإنسانية",       en: "Cases" },
  projects:               { ar: "المشاريع",              en: "Projects" },
  programs:               { ar: "البرامج الرئيسية",       en: "Programs" },
  donors:                 { ar: "المتبرعون",             en: "Donors" },
  donations:              { ar: "التبرعات",              en: "Donations" },
  volunteers:             { ar: "المتطوعون",             en: "Volunteers" },
  volunteer_campaigns:    { ar: "حملات التطوع",          en: "Volunteer Campaigns" },
  volunteer_applications: { ar: "طلبات التطوع",          en: "Volunteer Applications" },
  payment_methods:        { ar: "طرق الدفع",             en: "Payment Methods" },
  axes:                   { ar: "محاور الخير",           en: "Work Axes" },
  content_change_requests:{ ar: "طلبات الاعتماد",         en: "Change Requests" },
  users:                  { ar: "المستخدمون",            en: "Users" },
  roles:                  { ar: "الأدوار",               en: "Roles" },
  permissions:            { ar: "الصلاحيات",             en: "Permissions" },
  stories:                { ar: "قصص الأثر",             en: "Stories" },
  reports:                { ar: "التقارير",              en: "Reports" },
  settings:               { ar: "الإعدادات",             en: "Settings" },
};

const ACTION_LABEL: Record<string, { ar: string; en: string }> = {
  view:    { ar: "عرض", en: "View" },
  create:  { ar: "إضافة", en: "Create" },
  update:  { ar: "تعديل", en: "Update" },
  delete:  { ar: "حذف", en: "Delete" },
  approve: { ar: "اعتماد", en: "Approve" },
  reject:  { ar: "رفض", en: "Reject" },
};

const Inner = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "roles" ? "roles" : "users";

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<LaravelRole[]>([]);
  const [permissions, setPermissions] = useState<LaravelPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Selected role for permissions management
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermIds, setRolePermIds] = useState<Set<number>>(new Set());
  const [savingRole, setSavingRole] = useState(false);

  // Add User modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: 4, // Donor by default
    password: "",
  });
  const [addingUser, setAddingUser] = useState(false);

  // Add Role modal state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ name: "", slug: "", description: "" });
  const [addingRole, setAddingRole] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [u, r, p] = await Promise.all([
        fetchAllUsers(),
        fetchAllRoles(),
        fetchAllPermissions(),
      ]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);

      // Default select first role if none selected
      if (r.length > 0 && selectedRoleId === null) {
        const firstEditableRole = r.find((role) => role.slug === "editor") || r[0];
        setSelectedRoleId(firstEditableRole.id);
        const permIds = new Set((firstEditableRole.permissions || []).map((p) => p.id));
        setRolePermIds(permIds);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  // When changing selected role, sync permissions set
  const handleSelectRole = (role: LaravelRole) => {
    setSelectedRoleId(role.id);
    const permIds = new Set((role.permissions || []).map((p) => p.id));
    setRolePermIds(permIds);
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, LaravelPermission[]> = {};
    permissions.forEach((p) => {
      const mod = p.module || "other";
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    });
    return grouped;
  }, [permissions]);

  // Toggle single permission for current selected role
  const togglePermission = (permId: number) => {
    setRolePermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  // Bulk toggle for a module
  const toggleModulePermissions = (modPerms: LaravelPermission[], enable: boolean) => {
    setRolePermIds((prev) => {
      const next = new Set(prev);
      modPerms.forEach((p) => {
        if (enable) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  // Save updated permissions for the role
  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;
    const role = roles.find((r) => r.id === selectedRoleId);
    if (!role) return;

    setSavingRole(true);
    try {
      const updated = await updateRolePermissions(
        selectedRoleId,
        Array.from(rolePermIds),
        { name: role.name, slug: role.slug, description: role.description || "" }
      );
      toast({ title: isAr ? " تم حفظ صلاحيات الدور بنجاح" : " Role permissions saved successfully", });
      // Update local state
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRoleId ? { ...r, permissions: updated.permissions } : r))
      );
      void logActivity({
        action: "roles.update",
        entityType: "role",
        entityId: String(selectedRoleId),
        summary: `Updated permissions for role: ${role.name}`,
      });
    } catch (err: any) {
      toast({ title: isAr ? "فشل حفظ الصلاحيات" : "Failed to save permissions", description: err.message, variant: "destructive", });
    } finally {
      setSavingRole(false);
    }
  };

  // User role toggling
  const handleToggleUserRole = async (userId: string, roleId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    setBusyId(userId);
    try {
      const currentRoleIds = (targetUser.rawRoles || []).map((r) => r.id);
      let nextRoleIds: number[];
      if (currentRoleIds.includes(roleId)) {
        if (currentRoleIds.length === 1) {
          toast({ title: isAr ? "يجب أن يمتلك المستخدم دورًا واحدًا على الأقل" : "User must have at least one role", variant: "destructive", });
          return;
        }
        nextRoleIds = currentRoleIds.filter((id) => id !== roleId);
      } else {
        nextRoleIds = [...currentRoleIds, roleId];
      }

      await updateUser(userId, { role_ids: nextRoleIds });
      toast({ title: isAr ? " تم تحديث دور المستخدم" : " User role updated" });
      void reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      toast({ title: isAr ? "يرجى كتابة الاسم والبريد الإلكتروني" : "Name and email are required", variant: "destructive", });
      return;
    }
    setAddingUser(true);
    try {
      await createUser({
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        phone: newUserData.phone.trim() || undefined,
        role_id: newUserData.roleId,
        password: newUserData.password.trim() || "Password123!",
      });
      toast({ title: isAr ? " تم إنشاء المستخدم بنجاح" : " User created successfully" });
      setShowAddUserModal(false);
      setNewUserData({ name: "", email: "", phone: "", roleId: 4, password: "" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل إنشاء المستخدم" : "Failed to create user", description: err.message, variant: "destructive", });
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === String(user?.id)) {
      toast({ title: isAr ? "لا يمكنك حذف حسابك الشخصي" : "Cannot delete your own account", variant: "destructive" });
      return;
    }
    if (!confirm(isAr ? `هل أنت متأكد من حذف المستخدم "${name}"؟` : `Delete user "${name}"?`)) return;
    try {
      await deleteUser(id);
      toast({ title: isAr ? " تم حذف المستخدم" : " User deleted" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleData.name.trim() || !newRoleData.slug.trim()) {
      toast({ title: isAr ? "يرجى إدخال اسم الدور ومعرفه (Slug)" : "Name and slug are required", variant: "destructive" });
      return;
    }
    setAddingRole(true);
    try {
      const created = await createRole({
        name: newRoleData.name.trim(),
        slug: newRoleData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: newRoleData.description.trim(),
        permission_ids: [],
      });
      toast({ title: isAr ? " تم إنشاء الدور بنجاح" : " Role created successfully" });
      setShowAddRoleModal(false);
      setNewRoleData({ name: "", slug: "", description: "" });
      await reload();
      setSelectedRoleId(created.id);
    } catch (err: any) {
      toast({ title: isAr ? "فشل إنشاء الدور" : "Failed to create role", description: err.message, variant: "destructive" });
    } finally {
      setAddingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: number, name: string) => {
    if (roleId === 1) {
      toast({ title: isAr ? "لا يمكن حذف دور مدير النظام الأساسي" : "Cannot delete Super Admin role", variant: "destructive" });
      return;
    }
    if (!confirm(isAr ? `هل أنت متأكد من حذف دور "${name}"؟` : `Delete role "${name}"?`)) return;
    try {
      await deleteRole(roleId);
      toast({ title: isAr ? " تم حذف الدور" : " Role deleted" });
      void reload();
    } catch (err: any) {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!q) return true;
      const lower = q.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower) ||
        (u.phone || "").includes(lower)
      );
    });
  }, [users, q]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdminRole = selectedRole?.slug === "super-admin";

  return (
    <AdminLayout title={{ ar: "المستخدمون والأدوار والصلاحيات (RBAC)", en: "Users, Roles & Permissions" }}>
      <div className="space-y-4 text-start [&_input]:text-start" dir={isAr ? "rtl" : "ltr"}>
        {/* KPI Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent label={isAr ? "إجمالي المستخدمين" : "Total Users"} value={users.length} />
          <StatCard label={isAr ? "الأدوار المعرّفة" : "System Roles"} value={roles.length} />
          <StatCard label={isAr ? "إجمالي الصلاحيات" : "Permissions"} value={permissions.length} />
          <StatCard
            label={isAr ? "طاقم العمل والمسؤولين" : "Staff Members"}
            value={users.filter((u) => u.roles.some((r) => r === "admin" || r === "editor")).length}
          />
        </div>

        {/* Tab navigation */}
        <Tabs value={tab} onValueChange={(v) => setParams(v === "roles" ? { tab: "roles" } : {})} dir={isAr ? "rtl" : "ltr"}>
          <TabsList className="justify-start flex-wrap h-auto">
            <TabsTrigger value="users">
              <UsersIcon className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "المستخدمون وتعيين الأدوار" : "Users & Assigned Roles"}
            </TabsTrigger>
            <TabsTrigger value="roles">
              <KeyRound className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "إدارة الأدوار ومصفوفة الصلاحيات (Role Permissions)" : "Roles & Permission Matrix"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS */}
          <TabsContent value="users" className="mt-3 space-y-3">
            <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 shadow-soft sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={isAr ? "بحث بالاسم أو البريد أو الهاتف…" : "Search name, email, phone…"}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowAddUserModal(true)} className="bg-orange-grad text-accent-foreground">
                <Plus className="h-4 w-4 me-1.5" />
                {isAr ? "مستخدم جديد" : "New User"}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-start">{isAr ? "المستخدم" : "User"}</th>
                    <th className="px-3 py-2.5 text-start">{isAr ? "البريد الإلكتروني" : "Email"}</th>
                    <th className="px-3 py-2.5 text-start">{isAr ? "الأدوار الممنوحة (انقر للتبديل)" : "Roles (Click to toggle)"}</th>
                    <th className="px-3 py-2.5 text-start">{isAr ? "تاريخ الانضمام" : "Joined"}</th>
                    <th className="px-3 py-2.5 text-center">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        <Loader2 className="me-2 inline h-4 w-4 animate-spin" />
                        {isAr ? "جاري التحميل من الخادم…" : "Loading from server…"}
                      </td>
                    </tr>
                  )}
                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        {isAr ? "لا توجد نتائج" : "No results"}
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((u) => {
                    const userRoleIds = (u.rawRoles || []).map((r) => r.id);
                    return (
                      <tr key={u.id} className="border-t border-border/60 hover:bg-muted/30 transition">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-black text-secondary">
                              {(u.full_name || "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-primary flex items-center gap-1.5">
                                {u.full_name}
                                {String(u.id) === String(user?.id) && (
                                  <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.2 rounded font-bold">
                                    {isAr ? "أنت" : "You"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground" dir="ltr">
                                {u.phone || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground" dir="ltr">
                          {u.email || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {roles.map((r) => {
                              const active = userRoleIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => handleToggleUserRole(u.id, r.id)}
                                  disabled={busyId === u.id}
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold transition cursor-pointer ${
                                    active
                                      ? "bg-secondary text-secondary-foreground shadow-sm"
                                      : "bg-muted/60 text-muted-foreground hover:bg-secondary/20"
                                  }`}
                                  title={isAr ? `انقر لـ ${active ? "إلغاء" : "منح"} دور ${r.name}` : `Toggle ${r.name}`}
                                >
                                  {busyId === u.id && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                  {ROLE_LABEL[r.slug]?.[lang] || r.name}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {u.created_at?.slice(0, 10)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {String(u.id) !== String(user?.id) && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              className="inline-grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition cursor-pointer"
                              title={isAr ? "حذف المستخدم" : "Delete user"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-secondary/10 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <span>
                {isAr
                  ? "يتم تعيين الأدوار لكل مستخدم مباشرة عبر Laravel RBAC. لتعديل صلاحيات أي دور بالتفصيل، انتقل إلى تبويب «إدارة الأدوار ومصفوفة الصلاحيات»."
                  : "Roles are assigned directly via Laravel RBAC. To customize what each role can do, switch to the 'Roles & Permission Matrix' tab."}
              </span>
            </div>
          </TabsContent>

          {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
          <TabsContent value="roles" className="mt-3">
            <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
              {/* Roles List Sidebar */}
              <Card className="p-3 space-y-3 h-fit">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {isAr ? "الأدوار المعرفة" : "Defined Roles"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddRoleModal(true)}
                    className="h-7 px-2 text-xs font-bold text-primary"
                  >
                    <Plus className="h-3.5 w-3.5 me-1" />
                    {isAr ? "دور جديد" : "New Role"}
                  </Button>
                </div>

                <div className="space-y-1">
                  {roles.map((r) => {
                    const isSelected = selectedRoleId === r.id;
                    const permCount = (r.permissions || []).length;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRole(r)}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-black flex items-center gap-1.5">
                            {ROLE_LABEL[r.slug]?.[lang] || r.name}
                            {r.slug === "super-admin" && (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold">
                                {isAr ? "كامل" : "Full"}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] opacity-70 font-mono">
                            {r.slug} · {r.slug === "super-admin" ? (isAr ? "كل الصلاحيات" : "All permissions") : `${permCount} ${isAr ? "صلاحية" : "perms"}`}
                          </div>
                        </div>

                        {r.id !== 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteRole(r.id, r.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-destructive transition"
                            title={isAr ? "حذف الدور" : "Delete role"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Permissions Matrix for Selected Role */}
              <Card className="p-4 space-y-4">
                {!selectedRole ? (
                  <div className="grid place-items-center p-12 text-center text-muted-foreground">
                    <Shield className="mb-2 h-8 w-8 opacity-50" />
                    {isAr ? "اختر دورًا لعرض مصفوفة صلاحياته وتعديلها." : "Select a role to inspect and edit its permissions."}
                  </div>
                ) : (
                  <div>
                    {/* Header of selected role */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-primary">
                            {ROLE_LABEL[selectedRole.slug]?.[lang] || selectedRole.name}
                          </h3>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            slug: {selectedRole.slug}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedRole.description || (isAr ? "لا يوجد وصف" : "No description")}
                        </p>
                      </div>

                      {!isSuperAdminRole && (
                        <Button
                          onClick={handleSaveRolePermissions}
                          disabled={savingRole}
                          className="bg-orange-grad text-accent-foreground font-bold shadow-sm"
                        >
                          {savingRole ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 me-1.5" />}
                          {isAr ? "حفظ صلاحيات الدور" : "Save Role Permissions"}
                        </Button>
                      )}
                    </div>

                    {isSuperAdminRole ? (
                      <div className="p-6 text-center text-sm rounded-xl bg-primary/5 text-primary border border-primary/20 my-4">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="font-extrabold">{isAr ? "دور مدير النظام الأساسي (Super Admin)" : "Super Admin Role"}</div>
                        <p className="text-xs opacity-80 mt-1">
                          {isAr
                            ? "يمتلك هذا الدور وصولاً كاملاً ومطلقاً لجميع أقسام وموديولات النظام تلقائياً دون الحاجة لتحديد صلاحيات فردية."
                            : "This role automatically has unrestricted access to all modules and capabilities across the system."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                          <span>
                            {isAr ? "الصلاحيات المحددة:" : "Selected:"} {rolePermIds.size} / {permissions.length}
                          </span>
                          <span className="text-[11px] opacity-70">
                            {isAr ? "انقر على الصلاحية لتفعيلها أو إيقافها لهذا الدور" : "Click any permission to toggle"}
                          </span>
                        </div>

                        {/* Modules Accordion / Groups */}
                        <div className="grid gap-3">
                          {Object.entries(permissionsByModule).map(([modKey, modPerms]) => {
                            const modInfo = MODULE_TITLES[modKey] || { ar: modKey, en: modKey };
                            const activeCount = modPerms.filter((p) => rolePermIds.has(p.id)).length;
                            const allActive = activeCount === modPerms.length;

                            return (
                              <div
                                key={modKey}
                                className="rounded-xl border border-border/70 bg-card p-3 space-y-2 hover:border-primary/40 transition"
                              >
                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-foreground">
                                      {isAr ? modInfo.ar : modInfo.en}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                      ({modKey})
                                    </span>
                                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                                      {activeCount} / {modPerms.length}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => toggleModulePermissions(modPerms, !allActive)}
                                      className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      {allActive ? (
                                        <>
                                          <Square className="h-3.5 w-3.5" />
                                          {isAr ? "إلغاء الكل" : "Deselect all"}
                                        </>
                                      ) : (
                                        <>
                                          <CheckSquare className="h-3.5 w-3.5" />
                                          {isAr ? "تحديد الكل" : "Select all"}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Permissions chips inside module */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {modPerms.map((p) => {
                                    const isChecked = rolePermIds.has(p.id);
                                    const action = p.slug.split(".").pop() || "";
                                    const actLabel = ACTION_LABEL[action]?.[lang] || action;

                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => togglePermission(p.id)}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition border cursor-pointer ${
                                          isChecked
                                            ? "border-secondary bg-secondary/15 text-secondary-foreground shadow-xs"
                                            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70"
                                        }`}
                                      >
                                        <span
                                          className={`grid h-4 w-4 place-items-center rounded ${
                                            isChecked ? "bg-secondary text-secondary-foreground" : "border border-muted-foreground/40"
                                          }`}
                                        >
                                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                        </span>
                                        <span>{p.name || actLabel}</span>
                                        <span className="text-[10px] font-mono opacity-60">({p.slug})</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Add New User */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowAddUserModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary">{isAr ? "إضافة مستخدم جديد" : "Add New User"}</h3>
                <button onClick={() => setShowAddUserModal(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "الاسم الكامل *" : "Full Name *"}</label>
                  <Input value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} placeholder={isAr ? "مثال: أحمد محمود" : "e.g. Ahmed Mahmoud"} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "البريد الإلكتروني *" : "Email Address *"}</label>
                  <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} placeholder="user@alyusr.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "رقم الهاتف" : "Phone Number"}</label>
                  <Input value={newUserData.phone} onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })} placeholder="010XXXXXXXX" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "الدور الأساسي *" : "Primary Role *"}</label>
                  <UiSelect
                    value={newUserData.roleId}
                    onChange={(e) => setNewUserData({ ...newUserData, roleId: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-bold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {ROLE_LABEL[r.slug]?.[lang] || r.name} ({r.slug})
                      </option>
                    ))}
                  </UiSelect>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "كلمة المرور (الافتراضي Password123!)" : "Password (Default: Password123!)"}</label>
                  <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} placeholder="••••••••" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateUser} disabled={addingUser} className="flex-1 bg-orange-grad text-accent-foreground font-bold">
                  {addingUser && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr ? "حفظ وإنشاء" : "Save & Create"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add New Role */}
        {showAddRoleModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowAddRoleModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary">{isAr ? "إضافة دور جديد" : "Add New Role"}</h3>
                <button onClick={() => setShowAddRoleModal(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "اسم الدور بالعربية أو الإنجليزية *" : "Role Name *"}</label>
                  <Input
                    value={newRoleData.name}
                    onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                    placeholder={isAr ? "مثال: مراجع مالي" : "e.g. Financial Auditor"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "المعرّف البرمجي (Slug) *" : "Slug *"}</label>
                  <Input
                    value={newRoleData.slug}
                    onChange={(e) => setNewRoleData({ ...newRoleData, slug: e.target.value })}
                    placeholder="financial-auditor"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">{isAr ? "الوصف" : "Description"}</label>
                  <Input
                    value={newRoleData.description}
                    onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                    placeholder={isAr ? "صلاحيات مراجعة تقارير التبرعات والمصروفات" : "Financial reporting permissions"}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateRole} disabled={addingRole} className="flex-1 bg-orange-grad text-accent-foreground font-bold">
                  {addingRole && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                  {isAr ? "حفظ الدور" : "Save Role"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddRoleModal(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const AdminUsers = () => (
  <RequireAuth roles={["admin"]}><Inner /></RequireAuth>
);

export default AdminUsers;
