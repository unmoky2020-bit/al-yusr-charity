import type { ReactNode } from "react";
import { BadgeCheck, Bell, CalendarDays, Clock, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { EmailVerifyCard } from "@/components/auth/EmailVerifyCard";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ProfileDetailsForm } from "@/components/account/ProfileDetailsForm";
import { ContactPreferences } from "@/components/account/ContactPreferences";

const ROLE_LABEL: Record<string, { ar: string; en: string }> = {
  admin: { ar: "مدير", en: "Admin" },
  editor: { ar: "محرر محتوى", en: "Content editor" },
  caseworker: { ar: "باحث حالات", en: "Caseworker" },
  case_manager: { ar: "مسؤول حالات", en: "Case manager" },
  volunteer: { ar: "متطوع", en: "Volunteer" },
  delegate: { ar: "مندوب", en: "Delegate" },
  donor: { ar: "متبرع", en: "Donor" },
};

function Panel({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft md:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-black text-primary">
        <Icon className="h-4.5 w-4.5 text-secondary" /> {title}
      </h2>
      {children}
    </section>
  );
}

/** The team member's own account inside the dashboard: photo, details, contact, password, access. */
const AdminProfile = () => {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, access } = useAuth();
  if (!user) return null;

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" }) : "";
  const permissionsCount = access?.superAdmin ? null : access?.permissions.length ?? null;

  return (
    <AdminLayout title={{ ar: "حسابي", en: "My Profile" }}>
      <div className="space-y-5 pb-6">
        {/* Identity: cover, photo, name and facts; the email box under them when the address isn't confirmed */}
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <div className="h-28 pattern-hero-luxe sm:h-32 md:h-36" aria-hidden />
          <div className="px-5 pb-6 md:px-8">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:gap-6 md:text-start">
              <AvatarUploader size="xl" className="-mt-16 md:-mt-[4.5rem]" />
              <div className="min-w-0 flex-1 md:pb-8">
                <h1 className="text-2xl font-black text-primary md:text-[1.75rem]">{user.name}</h1>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  {[user.jobTitle, ...user.roles.map((r) => (ROLE_LABEL[r] ? ROLE_LABEL[r][lang] : r))].filter(Boolean).join(" • ")}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground"><bdi dir="ltr">{user.email}</bdi></p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs md:justify-start">
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-extrabold text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> {ar ? "بريدك مؤكَّد" : "Email confirmed"}
                    </span>
                  )}
                  {user.createdAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-bold text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {ar ? "معانا من" : "Since"} {fmt(user.createdAt)}
                    </span>
                  )}
                  {user.lastLoginAt && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-bold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {ar ? "آخر دخول" : "Last sign-in"} {fmt(user.lastLoginAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!user.emailVerified && <EmailVerifyCard layout="row" className="mt-6" />}
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel icon={UserRound} title={ar ? "البيانات الشخصية" : "Personal details"}>
            <ProfileDetailsForm showJobTitle />
          </Panel>
          <div className="space-y-5">
            <Panel icon={KeyRound} title={ar ? "كلمة المرور" : "Password"}>
              <ChangePasswordForm size="compact" />
            </Panel>
            <Panel icon={ShieldCheck} title={ar ? "صلاحياتك" : "Your access"}>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <span key={r} className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-secondary-foreground">
                    {ROLE_LABEL[r] ? ROLE_LABEL[r][lang] : r}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {access?.superAdmin
                  ? ar ? "عندك كل الصلاحيات (مدير عام)." : "You have every permission (super admin)."
                  : permissionsCount !== null
                    ? ar ? `عندك ${permissionsCount} صلاحية. المدير العام هو اللي يقدر يزوّد أو يشيل صلاحيات من صفحة المستخدمين.` : `${permissionsCount} permissions. The super admin manages them from Users.`
                    : ar ? "الصلاحيات بيحددها المدير العام من صفحة المستخدمين." : "The super admin manages permissions from Users."}
              </p>
            </Panel>
            <Panel icon={Bell} title={ar ? "التواصل والإشعارات" : "Contact & updates"}>
              <ContactPreferences showDonorOptions={false} />
            </Panel>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
