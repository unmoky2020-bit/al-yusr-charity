import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Bell, CalendarDays, HandHeart, HeartHandshake, KeyRound, LayoutDashboard,
  LogOut, MapPin, MessageCircle, SearchCheck, Shield, UserRound,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { EmailVerifyCard } from "@/components/auth/EmailVerifyCard";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ProfileDetailsForm } from "@/components/account/ProfileDetailsForm";
import { ContactPreferences } from "@/components/account/ContactPreferences";

const TEAM_ROLES = ["admin", "editor", "caseworker", "case_manager", "volunteer", "delegate"] as const;

/** A titled white card of the account page. */
function Panel({ icon: Icon, title, hint, children }: { icon: typeof UserRound; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft md:p-7">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-primary">{title}</h2>
          {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

/**
 * «حسابي»: photo, personal details, contact preferences and password, on the same width as the
 * header and footer. RequireAuth (App.tsx) guarantees a signed-in user.
 */
const Profile = () => {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  const isTeam = user.roles.some((r) => (TEAM_ROLES as readonly string[]).includes(r));
  const isVolunteer = user.roles.includes("volunteer");
  const RoleIcon = isTeam && !isVolunteer ? Shield : isVolunteer ? HandHeart : HeartHandshake;
  const roleLabel = isTeam && !isVolunteer ? (ar ? "فريق المؤسسة" : "Team") : isVolunteer ? (ar ? "متطوع" : "Volunteer") : ar ? "متبرع" : "Donor";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long" }) : "";
  const place = [user.city, user.governorate].filter(Boolean).join("، ");

  const links = [
    ...(isTeam
      ? [{ to: "/admin", icon: LayoutDashboard, label: ar ? "لوحة التحكم" : "Dashboard" }]
      : [
          { to: "/dashboard?tab=donations", icon: HeartHandshake, label: ar ? "تبرعاتي وتتبعها" : "My donations" },
          { to: "/dashboard?tab=notifications", icon: Bell, label: ar ? "الإشعارات" : "Notifications" },
        ]),
    { to: "/donate/track", icon: SearchCheck, label: ar ? "تتبّع تبرع برقمه" : "Track a donation" },
    { to: "/contact", icon: MessageCircle, label: ar ? "كلّمنا" : "Contact us" },
  ];

  return (
    <PageLayout>
      <SEOHelmet
        noindex
        title={ar ? "حسابي | مؤسسة اليسر" : "My Profile | Al-Yusr"}
        description={ar ? "صورتك وبياناتك وطريقة التواصل وكلمة المرور في مؤسسة اليسر." : "Your photo, details, contact preferences and password at Al-Yusr."}
        path="/profile"
      />
      {/* pb leaves room for the newsletter card that floats over the page end */}
      <section className="bg-muted/30 pb-24 pt-8 md:pb-32 md:pt-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: ar ? "الرئيسية" : "Home", href: "/" }, { name: ar ? "حسابي" : "Profile" }]} />

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* ── Identity card ── */}
            <aside className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card lg:sticky lg:top-24">
              <div className="h-28 pattern-hero-luxe sm:h-32" aria-hidden />
              <div className="-mt-16 px-5 pb-5 text-center">
                <AvatarUploader size="xl" />
                <h1 className="mt-3 text-xl font-black text-primary">{user.name}</h1>
                {user.jobTitle && <p className="mt-0.5 text-xs font-bold text-muted-foreground">{user.jobTitle}</p>}
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary">
                  <RoleIcon className="h-3.5 w-3.5" /> {roleLabel}
                </div>
                <p className="mt-3 truncate text-xs text-muted-foreground" dir="ltr">{user.email}</p>
                <EmailVerifyCard className="mt-3" />
                <dl className="mt-4 space-y-2 text-start text-xs">
                  {memberSince && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-secondary" />
                      <dt className="font-bold text-muted-foreground">{ar ? "معانا من" : "Member since"}</dt>
                      <dd className="ms-auto font-extrabold text-primary">{memberSince}</dd>
                    </div>
                  )}
                  {place && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                      <MapPin className="h-4 w-4 shrink-0 text-secondary" />
                      <dt className="font-bold text-muted-foreground">{ar ? "المكان" : "Location"}</dt>
                      <dd className="ms-auto truncate font-extrabold text-primary">{place}</dd>
                    </div>
                  )}
                </dl>
                <nav className="mt-4 grid gap-1.5" aria-label={ar ? "روابط حسابي" : "Account links"}>
                  {links.map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-primary transition hover:bg-secondary/15">
                      <Icon className="h-4 w-4 text-secondary" />
                      <span className="flex-1 text-start">{label}</span>
                      <Arrow className="h-3.5 w-3.5 opacity-50 transition group-hover:opacity-100" />
                    </Link>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={() => { logout(); nav("/"); }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" /> {ar ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            </aside>

            {/* ── Editable details ── */}
            <div className="min-w-0 space-y-6">
              <Panel icon={UserRound} title={ar ? "البيانات الشخصية" : "Personal details"} hint={ar ? "بنستخدمها في الإيصالات والتواصل معاك بس." : "Used for receipts and to reach you only."}>
                <ProfileDetailsForm showJobTitle={isTeam} />
              </Panel>
              <div className="grid items-start gap-6 xl:grid-cols-2">
                <Panel icon={Bell} title={ar ? "التواصل والإشعارات" : "Contact & updates"} hint={ar ? "اختار نوصلك إزاي وإيه اللي يوصلك." : "Choose how and what we send you."}>
                  <ContactPreferences showDonorOptions={!isTeam} />
                </Panel>
                <Panel icon={KeyRound} title={ar ? "كلمة المرور" : "Password"} hint={ar ? "غيّرها من هنا في أي وقت." : "Change it any time."}>
                  <ChangePasswordForm />
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Profile;
