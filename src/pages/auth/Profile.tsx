import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User as UserIcon, Mail, Phone, Lock, LogOut, Shield, HandHeart, HeartHandshake, Save, LayoutDashboard, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { RequireAuth } from "@/auth/RequireAuth";
import { toast } from "@/hooks/use-toast";
import { formatNumberEN } from "@/lib/utils";

const ProfileInner = () => {
  const { lang } = useLang();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: user!.name, email: user!.email, phone: user!.phone || "", bio: user!.bio || "" });
  const [pwd, setPwd] = useState({ old: "", neu: "", confirm: "" });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(user!.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), bio: form.bio.trim() });
      toast({ title: lang === "ar" ? " تم تحديث البيانات" : " Profile updated" });
    } catch { /* AuthContext already showed the server error */ }
  };

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.neu !== pwd.confirm) {
      toast({ title: lang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords don't match", variant: "destructive" });
      return;
    }
    const res = await changePassword(user!.id, pwd.old, pwd.neu);
    if (!res.ok) {
      const msg = res.error === "WRONG_PASSWORD" ? (lang === "ar" ? "كلمة المرور الحالية خاطئة" : "Current password is wrong")
        : res.error === "WEAK_PASSWORD" ? (lang === "ar" ? "كلمة المرور قصيرة (٦+)" : "Password too short (6+)")
        : (lang === "ar" ? "خطأ" : "Error");
      toast({ title: msg, variant: "destructive" });
      return;
    }
    setPwd({ old: "", neu: "", confirm: "" });
    toast({ title: lang === "ar" ? " تم تغيير كلمة المرور" : " Password changed" });
  };

  const isAdmin = user!.roles.includes("admin") || user!.roles.includes("editor");
  const isVolunteer = user!.roles.includes("volunteer");
  const isDonor = user!.roles.includes("donor");

  const RoleIcon = isAdmin ? Shield : isVolunteer ? HandHeart : HeartHandshake;
  const roleLabel = isAdmin ? (lang === "ar" ? "مسؤول" : "Admin") : isVolunteer ? (lang === "ar" ? "متطوع" : "Volunteer") : (lang === "ar" ? "متبرع" : "Donor");
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  // Every signed-in user gets a dashboard link based on role.
  const dashboardHref = isAdmin ? "/admin" : isVolunteer ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin
    ? (lang === "ar" ? "افتح لوحة التحكم" : "Open Admin Dashboard")
    : isVolunteer
    ? (lang === "ar" ? "افتح لوحة المتطوع" : "Open Volunteer Dashboard")
    : (lang === "ar" ? "افتح لوحة المتبرع" : "Open Donor Dashboard");

  return (
    <PageLayout>
      <SEOHelmet noindex
        title={lang === "ar" ? "حسابي | مؤسسة اليسر" : "My Profile | Al-Yusr"}
        description={lang === "ar" ? "إدارة بياناتك الشخصية وكلمة المرور في مؤسسة اليسر." : "Manage your personal data and password at Al-Yusr."}
        path="/profile"
      />
      <section className="bg-muted/30 py-10 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <Breadcrumbs items={[{ name: lang === "ar" ? "الرئيسية" : "Home", href: "/" }, { name: lang === "ar" ? "حسابي" : "Profile" }]} />

          <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
            {/* Side card */}
            <aside className="rounded-3xl bg-card p-5 shadow-card text-center md:sticky md:top-24 md:h-fit">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-3xl font-black text-secondary">
                {user!.name.charAt(0)}
              </div>
              <h2 className="mt-3 text-lg font-black text-primary">{user!.name}</h2>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 text-xs font-extrabold text-primary">
                <RoleIcon className="h-3.5 w-3.5" /> {roleLabel}
              </div>
              <p className="mt-3 text-xs text-muted-foreground" dir="ltr">{user!.email}</p>
              {isVolunteer && user!.volunteerStatus && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${
                  user!.volunteerStatus === "approved" ? "bg-secondary/20 text-primary"
                  : user!.volunteerStatus === "pending" ? "bg-accent/15 text-accent"
                  : "bg-destructive/10 text-destructive"
                }`}>
                  {user!.volunteerStatus === "approved" ? (lang === "ar" ? "✅ معتمد" : "✅ Approved")
                  : user!.volunteerStatus === "pending" ? (lang === "ar" ? "⏳ قيد المراجعة" : "⏳ Pending")
                  : (lang === "ar" ? "❌ مرفوض" : "❌ Rejected")}
                </div>
              )}
              {isDonor && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-lg font-black text-primary">{formatNumberEN(user!.totalDonated) || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{lang === "ar" ? "ج.م تبرعت" : "EGP donated"}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <div className="text-lg font-black text-primary">{user!.donationsCount || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{lang === "ar" ? "تبرع" : "donations"}</div>
                  </div>
                </div>
              )}
              <Link
                to={dashboardHref}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2.5 text-xs font-extrabold text-secondary-foreground hover:opacity-90"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {dashboardLabel}
                <Arrow className="h-3.5 w-3.5" />
              </Link>
              <button onClick={() => { logout(); nav("/"); }} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" /> {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
              </button>
            </aside>

            {/* Forms */}
            <div className="space-y-4">
              <div className="rounded-3xl bg-card p-5 shadow-card md:p-7">
                <h3 className="text-lg font-black text-primary">{lang === "ar" ? "البيانات الشخصية" : "Personal info"}</h3>
                <form method="post" onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="relative sm:col-span-2">
                    <UserIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-12 ps-9" placeholder={lang === "ar" ? "الاسم" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" className="h-12 ps-9" placeholder={lang === "ar" ? "البريد" : "Email"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" className="h-12 ps-9" placeholder={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <textarea
                    placeholder={lang === "ar" ? "نبذة مختصرة" : "Short bio"}
                    className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2.5 text-sm sm:col-span-2"
                    value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                  <Button type="submit" className="h-11 bg-orange-grad font-extrabold text-accent-foreground sm:col-span-2">
                    <Save className="h-4 w-4" /> {lang === "ar" ? "حفظ التغييرات" : "Save changes"}
                  </Button>
                </form>
              </div>

              <div className="rounded-3xl bg-card p-5 shadow-card md:p-7">
                <h3 className="text-lg font-black text-primary">{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</h3>
                <form method="post" onSubmit={savePwd} className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="relative sm:col-span-3">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="password" required className="h-12 ps-9" placeholder={lang === "ar" ? "كلمة المرور الحالية" : "Current password"} value={pwd.old} onChange={(e) => setPwd({ ...pwd, old: e.target.value })} />
                  </div>
                  <Input type="password" required className="h-12" placeholder={lang === "ar" ? "كلمة المرور الجديدة" : "New password"} value={pwd.neu} onChange={(e) => setPwd({ ...pwd, neu: e.target.value })} />
                  <Input type="password" required className="h-12" placeholder={lang === "ar" ? "تأكيد كلمة المرور" : "Confirm new password"} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                  <Button type="submit" className="h-12 bg-primary font-extrabold text-primary-foreground hover:opacity-95">
                    {lang === "ar" ? "تحديث" : "Update"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

const Profile = () => (
  <RequireAuth>
    <ProfileInner />
  </RequireAuth>
);

export default Profile;