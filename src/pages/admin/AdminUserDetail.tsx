import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  Save,
  User,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/LangContext";
import { donationPaymentMethodLabel } from "@/lib/payment-method-label";
import {
  apiFetch,
  usersApi,
  type LaravelActivityLog,
  type LaravelPermission,
  type LaravelRole,
  type LaravelUser,
} from "@/data/laravelApi";

type UserProfile = LaravelUser & {
  address?: string | null;
  city?: string | null;
  last_login_at?: string | null;
  deleted_at?: string | null;
  role_ids?: number[];
};

type UserDonation = {
  id: string | number;
  donor_id?: string | number | null;
  donor?: { id?: string | number | null; name?: string | null } | null;
  transaction_reference?: string | null;
  reference_code?: string | null;
  ref_code?: string | null;
  amount?: string | number | null;
  status?: string | null;
  payment_status?: string | null;
  payment_method_id?: number | string | null;
  payment_method_type?: string | null;
  payment_provider?: string | null;
  provider?: string | null;
  payment_details?: Record<string, unknown> | string | null;
  method?: string | null;
  payment_method?: string | { name_ar?: string; name_en?: string; slug?: string } | null;
  payment_method_details?: { name_ar?: string; name_en?: string; slug?: string } | null;
  program?: { name?: string; name_ar?: string; name_en?: string } | null;
  project?: { name?: string; name_en?: string } | null;
  donation_campaign?: { name_ar?: string; name_en?: string } | null;
  case?: { title?: string; code?: string } | null;
  notes?: string | null;
  created_at?: string | null;
};

type ActivityRow = LaravelActivityLog & {
  actor?: { id?: string | number; name?: string | null } | null;
};

type PaginatedResult<T> = {
  data?: T[];
  meta?: { current_page?: number; last_page?: number; total?: number };
  current_page?: number;
  last_page?: number;
  total?: number;
};

type Draft = {
  name: string;
  email: string;
  phone: string;
  status: string;
  role_ids: number[];
};

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

const roleLabel = (role: { name: string; slug?: string } | string, isAr: boolean) => {
  if (typeof role === "string") return role;
  const labels: Record<string, string> = {
    admin: "مدير",
    "super-admin": "مدير عام",
    editor: "محرر محتوى",
    volunteer: "متطوع",
    donor: "متبرع",
    delegate: "مندوب ميداني",
    case_manager: "مسؤول حالات",
  };
  return isAr ? labels[role.slug || ""] || role.name : role.name;
};

const dateLabel = (value: string | null | undefined, isAr: boolean) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(isAr ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" });
};

const payloadRows = <T,>(payload: PaginatedResult<T> | T[]) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

async function fetchAllPages<T>(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<{ rows: T[]; truncated: boolean }> {
  const first = await apiFetch<PaginatedResult<T> | T[]>(endpoint, {
    method: "GET",
    params: { ...params, page: 1, per_page: PAGE_SIZE },
    useCache: false,
  });
  const rows = payloadRows(first);
  if (Array.isArray(first)) return { rows, truncated: false };

  const lastPage = Math.max(1, Number(first.meta?.last_page ?? first.last_page ?? 1));
  const pageLimit = Math.min(lastPage, MAX_PAGES);
  for (let firstPage = 2; firstPage <= pageLimit; firstPage += 5) {
    const pageNumbers = Array.from(
      { length: Math.min(5, pageLimit - firstPage + 1) },
      (_, index) => firstPage + index,
    );
    const pages = await Promise.all(
      pageNumbers.map((page) =>
        apiFetch<PaginatedResult<T> | T[]>(endpoint, {
          method: "GET",
          params: { ...params, page, per_page: PAGE_SIZE },
          useCache: false,
        }),
      ),
    );
    pages.forEach((page) => rows.push(...payloadRows(page)));
  }
  return { rows, truncated: lastPage > MAX_PAGES };
}

function getRoleIds(profile: UserProfile, options: LaravelRole[]): number[] {
  if (Array.isArray(profile.role_ids) && profile.role_ids.length) return profile.role_ids;
  return (profile.roles || []).flatMap((role) => {
    if (typeof role !== "string") return [role.id];
    const match = options.find(
      (option) => option.slug === role || option.name.toLowerCase() === role.toLowerCase(),
    );
    return match ? [match.id] : [];
  });
}

function getDonationTarget(donation: UserDonation, isAr: boolean) {
  return (
    donation.case?.title ||
    donation.case?.code ||
    donation.donation_campaign?.name_ar ||
    donation.donation_campaign?.name_en ||
    donation.project?.name ||
    donation.project?.name_en ||
    donation.program?.name_ar ||
    donation.program?.name ||
    donation.program?.name_en ||
    (isAr ? "تبرع عام" : "General donation")
  );
}

function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rolePermissions(role: LaravelRole): LaravelPermission[] {
  return Array.isArray(role.permissions) ? role.permissions : [];
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<LaravelRole[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [donations, setDonations] = useState<UserDonation[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [donationsTruncated, setDonationsTruncated] = useState(false);
  const [activityTruncated, setActivityTruncated] = useState(false);

  const loadDonations = useCallback(async () => {
    if (!id) return;
    setDonationsLoading(true);
    setDonationsError(null);
    try {
      const result = await fetchAllPages<UserDonation>("/donations", {});
      setDonations(
        result.rows
          .filter((donation) => String(donation.donor_id ?? donation.donor?.id ?? "") === id)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
      );
      setDonationsTruncated(result.truncated);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setDonationsError(message);
      toast({
        title: isAr ? "تعذر تحميل تبرعات المستخدم" : "Could not load user donations",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDonationsLoading(false);
    }
  }, [id, isAr]);

  const loadActivity = useCallback(async () => {
    if (!id) return;
    setActivityLoading(true);
    setActivityError(null);
    try {
      const result = await fetchAllPages<ActivityRow>("/activity-logs", { module: "User" });
      setActivity(
        result.rows
          .filter((entry) => {
            const isUserEntity = String(entry.entity_type || entry.module || "").toLowerCase() === "user";
            return (
              (isUserEntity && String(entry.entity_id ?? "") === id) ||
              String(entry.user_id ?? entry.actor?.id ?? "") === id
            );
          })
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
      );
      setActivityTruncated(result.truncated);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setActivityError(message);
      toast({
        title: isAr ? "تعذر تحميل سجل التعديلات" : "Could not load change history",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActivityLoading(false);
    }
  }, [id, isAr]);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setProfileError(isAr ? "معرّف المستخدم غير صالح" : "Invalid user ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setProfileError(null);
    try {
      const result = await usersApi.get(id, { useCache: false });
      if (!result?.id) throw new Error(isAr ? "المستخدم غير موجود" : "User not found");

      let availableRoles: LaravelRole[] = [];
      setRolesError(null);
      try {
        const roleResult = await apiFetch<PaginatedResult<LaravelRole> | LaravelRole[]>("/roles", {
          method: "GET",
          params: { page: 1, per_page: 100 },
          useCache: false,
        });
        availableRoles = payloadRows(roleResult);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setRolesError(message);
        toast({
          title: isAr ? "تعذر تحميل قائمة الأدوار" : "Could not load roles",
          description: message,
          variant: "destructive",
        });
      }

      const user = result as UserProfile;
      setProfile(user);
      setRoles(availableRoles);
      setDraft({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        status: user.status || "active",
        role_ids: getRoleIds(user, availableRoles),
      });
      void loadDonations();
      void loadActivity();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setProfileError(message);
      toast({
        title: isAr ? "تعذر تحميل بروفايل المستخدم" : "Could not load user profile",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, isAr, loadActivity, loadDonations]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const assignedRoles = useMemo(
    () => roles.filter((role) => draft?.role_ids.includes(role.id)),
    [roles, draft?.role_ids],
  );
  const assignedPermissions = useMemo(() => {
    const byId = new Map<number, LaravelPermission>();
    assignedRoles.forEach((role) => rolePermissions(role).forEach((permission) => byId.set(permission.id, permission)));
    return Array.from(byId.values());
  }, [assignedRoles]);

  const totalPaid = donations
    .filter((donation) => ["paid", "completed", "succeeded", "success", "approved"].includes(
      String(donation.payment_status || donation.status || "").toLowerCase(),
    ))
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

  const saveChanges = async () => {
    if (!id || !draft) return;
    if (!draft.name.trim() || !draft.email.trim()) {
      toast({
        title: isAr ? "الاسم والبريد الإلكتروني مطلوبان" : "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    if (draft.role_ids.length === 0) {
      toast({
        title: isAr ? "يجب إسناد دور واحد على الأقل" : "At least one role is required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await usersApi.update(id, {
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        status: draft.status,
        role_ids: draft.role_ids,
      });
      const nextProfile = {
        ...profile,
        ...updated,
        name: updated.name || draft.name.trim(),
        email: updated.email || draft.email.trim(),
        phone: updated.phone ?? (draft.phone.trim() || null),
        status: updated.status || draft.status,
        role_ids: draft.role_ids,
        roles: assignedRoles,
      } as UserProfile;
      setProfile(nextProfile);
      setDraft((current) => current ? { ...current, ...draft } : current);
      toast({ title: isAr ? "تم حفظ تعديلات المستخدم" : "User changes saved" });
      void loadActivity();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      toast({
        title: isAr ? "فشل حفظ التعديلات" : "Could not save changes",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId: number) => {
    setDraft((current) => {
      if (!current) return current;
      const roleIds = current.role_ids.includes(roleId)
        ? current.role_ids.filter((idValue) => idValue !== roleId)
        : [...current.role_ids, roleId];
      return { ...current, role_ids: roleIds };
    });
  };

  return (
    <AdminLayout title={{ ar: "تفاصيل المستخدم", en: "User Details" }}>
      <div className="w-full min-w-0 space-y-5" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">
              <ArrowLeft className="me-2 h-4 w-4" />
              {isAr ? "العودة للمستخدمين" : "Back to users"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadProfile()} disabled={loading}>
            {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
            {isAr ? "تحديث البيانات" : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-2xl bg-card py-20 text-muted-foreground shadow-soft">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-bold">{isAr ? "جاري تحميل بيانات المستخدم..." : "Loading user details..."}</p>
          </div>
        ) : profileError ? (
          <section className="rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-soft">
            <p className="font-bold text-destructive">{profileError}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadProfile()}>
              {isAr ? "إعادة المحاولة" : "Try again"}
            </Button>
          </section>
        ) : profile && draft ? (
          <>
            <section className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft sm:flex-row sm:items-center">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <User className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black text-foreground">{profile.name}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAr ? "رقم المستخدم" : "User ID"}: <span className="font-mono">{profile.id}</span>
                  {profile.deleted_at ? ` · ${isAr ? "محذوف" : "Deleted"}` : ""}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                profile.status === "active"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}>
                {profile.status || (isAr ? "غير محدد" : "Unknown")}
              </span>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold text-muted-foreground">{isAr ? "عدد التبرعات" : "Donations"}</p><p className="text-lg font-black">{donationsLoading ? "…" : donations.length}</p></div>
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700"><CreditCard className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold text-muted-foreground">{isAr ? "إجمالي المدفوع" : "Total paid"}</p><p className="text-lg font-black">{totalPaid.toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "ج.م" : "EGP"}</p></div>
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-primary"><History className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold text-muted-foreground">{isAr ? "سجل التعديلات" : "Change history"}</p><p className="text-lg font-black">{activityLoading ? "…" : activity.length}</p></div>
              </Card>
              <Card className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Clock3 className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold text-muted-foreground">{isAr ? "آخر دخول" : "Last login"}</p><p className="text-sm font-black">{profile.last_login_at ? dateLabel(profile.last_login_at, isAr) : "—"}</p></div>
              </Card>
            </div>

            <Card className="space-y-5 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-black text-primary"><Edit3 className="h-4 w-4" />{isAr ? "بيانات الحساب وإدارة المستخدم" : "Account & user management"}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{isAr ? "التعديلات تحفظ مباشرة عبر واجهة Laravel المدعومة." : "Changes are saved through the supported Laravel users API."}</p>
                </div>
                <Button onClick={() => void saveChanges()} disabled={saving}>
                  {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                  {isAr ? "حفظ التعديلات" : "Save changes"}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? "الاسم" : "Name"}</span>
                  <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</span>
                  <Input type="email" dir="ltr" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? "رقم الهاتف" : "Phone"}</span>
                  <Input type="tel" dir="ltr" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? "حالة الحساب" : "Account status"}</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-bold"
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  >
                    <option value="active">{isAr ? "نشط" : "Active"}</option>
                    <option value="inactive">{isAr ? "غير نشط" : "Inactive"}</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-black">{isAr ? "الأدوار الممنوحة" : "Assigned roles"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{isAr ? "تغيير الأدوار يحدّث صلاحيات الوصول لهذا المستخدم." : "Role changes update this user's access permissions."}</p>
                  </div>
                  {rolesError ? (
                    <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{rolesError}</p>
                  ) : roles.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {roles.map((role) => {
                        const selected = draft.role_ids.includes(role.id);
                        return (
                          <label key={role.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${selected ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                            <input type="checkbox" checked={selected} onChange={() => toggleRole(role.id)} className="h-4 w-4 accent-primary" />
                            <span className="min-w-0 flex-1">{roleLabel(role, isAr)}</span>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{isAr ? "لم يتم تحميل قائمة الأدوار." : "Role list is unavailable."}</p>
                  )}
                  {profile.address || profile.city ? (
                    <div className="grid gap-2 rounded-xl bg-muted/30 p-3 text-xs sm:grid-cols-2">
                      {profile.address && <p><span className="font-bold">{isAr ? "العنوان:" : "Address:"}</span> {profile.address}</p>}
                      {profile.city && <p><span className="font-bold">{isAr ? "المدينة:" : "City:"}</span> {profile.city}</p>}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-black">{isAr ? "الصلاحيات الناتجة عن الأدوار" : "Permissions from assigned roles"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{isAr ? "الصلاحيات موروثة من الأدوار المعرفة في النظام." : "Permissions are inherited from system roles."}</p>
                  </div>
                  {assignedPermissions.length ? (
                    <div className="flex max-h-56 flex-wrap content-start gap-2 overflow-y-auto rounded-xl bg-muted/30 p-3">
                      {assignedPermissions.map((permission) => (
                        <span key={permission.id} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold" title={permission.slug}>
                          {permission.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground">{isAr ? "لا توجد صلاحيات مفصلة متاحة للأدوار الحالية." : "No detailed permissions are available for the assigned roles."}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 border-t border-border/60 pt-4 text-xs sm:grid-cols-3">
                <p><span className="font-bold text-muted-foreground">{isAr ? "تاريخ الإنشاء:" : "Created:"}</span> {dateLabel(profile.created_at, isAr)}</p>
                <p><span className="font-bold text-muted-foreground">{isAr ? "آخر تحديث:" : "Last updated:"}</span> {dateLabel(profile.updated_at, isAr)}</p>
                <p><span className="font-bold text-muted-foreground">{isAr ? "الأدوار الحالية:" : "Current roles:"}</span> {assignedRoles.map((role) => roleLabel(role, isAr)).join("، ") || "—"}</p>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-black text-primary">{isAr ? "كل التبرعات" : "All donations"}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{isAr ? "سجل التبرعات المرتبط برقم هذا المستخدم في الباك إند." : "Donations associated with this user's backend ID."}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{donations.length}</span>
              </div>
              {donationsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="me-2 inline h-4 w-4 animate-spin" />{isAr ? "جاري تحميل التبرعات..." : "Loading donations..."}</div>
              ) : donationsError ? (
                <div className="p-6 text-center text-sm text-destructive">{donationsError}</div>
              ) : donations.length ? (
                <>
                  {donationsTruncated && <p className="border-b bg-amber-500/10 p-3 text-xs font-semibold text-amber-800">{isAr ? "تم إيقاف التحميل بعد 10,000 سجل لتجنب الضغط على الخادم؛ قد توجد سجلات أقدم." : "Loading was capped at 10,000 records to protect the server; older records may exist."}</p>}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-muted/40 text-start text-[11px] font-extrabold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-start">{isAr ? "رقم التبرع" : "Reference"}</th>
                          <th className="px-4 py-3 text-start">{isAr ? "الوجهة" : "Destination"}</th>
                          <th className="px-4 py-3 text-start">{isAr ? "المبلغ" : "Amount"}</th>
                          <th className="px-4 py-3 text-start">{isAr ? "طريقة الدفع" : "Payment method"}</th>
                          <th className="px-4 py-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                          <th className="px-4 py-3 text-start">{isAr ? "التاريخ" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((donation) => {
                          const reference = donation.transaction_reference || donation.reference_code || donation.ref_code || String(donation.id);
                          const status = String(donation.payment_status || donation.status || "pending").toLowerCase();
                          return (
                            <tr key={String(donation.id)} className="border-t border-border/50 hover:bg-muted/20">
                              <td className="px-4 py-3 font-mono text-xs">
                                <Link to={`/admin/donations/${encodeURIComponent(String(donation.id))}`} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                                  {reference}<ExternalLink className="h-3 w-3" />
                                </Link>
                              </td>
                              <td className="max-w-[240px] truncate px-4 py-3 font-semibold" title={getDonationTarget(donation, isAr)}>{getDonationTarget(donation, isAr)}</td>
                              <td className="px-4 py-3 font-black">{Number(donation.amount || 0).toLocaleString(isAr ? "ar-EG" : "en-US")} {isAr ? "ج.م" : "EGP"}</td>
                              <td className="px-4 py-3">{donationPaymentMethodLabel(donation, isAr ? "ar" : "en")}</td>
                              <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">{status}</span></td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">{dateLabel(donation.created_at, isAr)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد تبرعات مرتبطة بهذا المستخدم." : "No donations are linked to this user."}</p>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-black text-primary">{isAr ? "سجل التعديلات والتصحيحات" : "Changes & corrections history"}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{isAr ? "يعرض من نفذ التغيير والقيم القديمة والجديدة المسجلة من الباك إند." : "Shows who changed the record and the old/new values recorded by the backend."}</p>
                </div>
                <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-black">{activity.length}</span>
              </div>
              {activityLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="me-2 inline h-4 w-4 animate-spin" />{isAr ? "جاري تحميل سجل التعديلات..." : "Loading change history..."}</div>
              ) : activityError ? (
                <div className="p-6 text-center text-sm text-destructive">{activityError}</div>
              ) : activity.length ? (
                <div className="divide-y divide-border/50">
                  {activityTruncated && <p className="bg-amber-500/10 p-3 text-xs font-semibold text-amber-800">{isAr ? "تم إيقاف تحميل السجل بعد 10,000 حدث؛ قد توجد أحداث أقدم." : "History loading was capped at 10,000 events; older events may exist."}</p>}
                  {activity.map((entry) => (
                    <article key={String(entry.id)} className="grid gap-3 p-4 lg:grid-cols-[180px_minmax(180px,0.7fr)_minmax(0,2fr)]">
                      <div className="text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">{dateLabel(entry.created_at, isAr)}</p>
                        <p className="mt-1">{entry.user?.name || entry.actor?.name || (isAr ? `مستخدم #${entry.user_id || "؟"}` : `User #${entry.user_id || "?"}`)}</p>
                      </div>
                      <div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{entry.action || (isAr ? "تعديل" : "Update")}</span>
                        <p className="mt-2 text-xs text-muted-foreground">{entry.module || entry.entity_type || (isAr ? "مستخدم" : "User")}</p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <p className="text-sm font-semibold">{entry.summary || entry.description || (isAr ? "تحديث بيانات المستخدم" : "User record updated")}</p>
                        {(entry.old_values || entry.new_values || entry.metadata) && (
                          <details className="rounded-lg bg-muted/30 p-3 text-xs">
                            <summary className="cursor-pointer font-bold">{isAr ? "عرض تفاصيل التغيير" : "Show change details"}</summary>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {entry.old_values && <div><p className="mb-1 font-black text-amber-700">{isAr ? "قبل" : "Before"}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words">{valueLabel(entry.old_values)}</pre></div>}
                              {(entry.new_values || entry.metadata) && <div><p className="mb-1 font-black text-emerald-700">{isAr ? "بعد" : "After"}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words">{valueLabel(entry.new_values || entry.metadata)}</pre></div>}
                            </div>
                          </details>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد تعديلات مسجلة لهذا المستخدم في سجل الباك إند." : "No backend change history is recorded for this user."}</p>
              )}
            </Card>

          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
