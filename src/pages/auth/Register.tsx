import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Users, ShieldCheck, Mail, User as UserIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/common/PhoneInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { SocialSignIn } from "@/components/auth/SocialSignIn";
import { MIN_PASSWORD, newPasswordProblem } from "@/lib/passwordRules";

type Role = "donor" | "volunteer" | "editor";

const Register = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const { registerDonor, registerVolunteer, registerEditor } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("role") as Role) || "donor";
  const [role, setRole] = useState<Role>(["donor", "volunteer", "editor"].includes(initialRole) ? initialRole : "donor");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", password: "", bio: "" });

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = newPasswordProblem(form.password, form.password, lang);
    if (problem) {
      toast({ title: problem, variant: "destructive" });
      return;
    }
    setLoading(true);
    let res;
    if (role === "donor") {
      res = await registerDonor({ name: form.name, email: form.email, password: form.password, phone: form.phone });
    } else if (role === "volunteer") {
      res = await registerVolunteer({ name: form.name, email: form.email, password: form.password, phone: form.phone, city: form.city, bio: form.bio });
    } else {
      res = await registerEditor({ name: form.name, email: form.email, password: form.password, phone: form.phone, city: form.city, bio: form.bio });
    }
    setLoading(false);
    if (!res.ok) {
      const taken = /registered|exists|taken|مسجل|مستخدم/i.test(res.error ?? "");
      toast({
        title: taken ? (isRTL ? "هذا البريد مسجّل بالفعل" : "Email already registered") : isRTL ? "تعذّر إنشاء الحساب" : "Could not create the account",
        description: taken ? (isRTL ? "سجّل الدخول، أو استعد كلمة المرور لو نسيتها." : "Sign in, or reset your password if you forgot it.") : res.error,
        variant: "destructive",
      });
      return;
    }
    if (role === "editor") {
      toast({ title: isRTL ? "تم إنشاء حسابك وإرسال طلب المحرر" : "Account created and editor request sent", description: isRTL ? "هتوصلك صلاحية المحرر بعد موافقة الإدارة." : "You'll get editor access once the team approves." });
    } else {
      toast({ title: isRTL ? "أهلًا بك في عائلة اليسر" : "Welcome to Al-Yusr" });
    }
    nav(role === "donor" ? "/dashboard" : "/profile");
  };

  const roles: { id: Role; ar: string; en: string; desc: { ar: string; en: string }; icon: typeof Heart }[] = [
    { id: "donor", ar: "متبرع", en: "Donor", icon: Heart, desc: { ar: "تابع تبرعاتك وأثرك", en: "Track donations & impact" } },
    { id: "volunteer", ar: "متطوع", en: "Volunteer", icon: Users, desc: { ar: "انضم لحملاتنا الميدانية", en: "Join field campaigns" } },
    { id: "editor", ar: "محرر", en: "Editor", icon: ShieldCheck, desc: { ar: "كتابة مقالات المدونة (بموافقة الإدارة)", en: "Write blog articles (team approval)" } },
  ];

  return (
    <PageLayout>
      <SEOHelmet noindex
        title={isRTL ? "إنشاء حساب | مؤسسة اليسر الخيرية" : "Create account | Al-Yusr Charity"}
        description={isRTL ? "أنشئ حسابك في مؤسسة اليسر كمتبرع أو متطوع أو محرر." : "Create your Al-Yusr account as a donor, volunteer, or editor."}
        path="/register"
      />
      <section className="bg-muted/30 pt-8 sm:pt-12 pb-36 sm:pb-44 md:pt-16 md:pb-52">
        <div className="container mx-auto max-w-2xl px-4">
          <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "إنشاء حساب" : "Create account" }]} />
          <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-black text-primary md:text-3xl">
                {isRTL ? "إنشاء حساب" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRTL ? "اختر نوع حسابك ثم أكمل البيانات" : "Pick your account type, then fill in your details"}
              </p>
            </div>

            {/* Role selector */}
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`group rounded-2xl border-2 p-3 text-start transition ${
                      active ? "border-secondary bg-secondary/10 shadow-soft" : "border-border bg-card hover:border-secondary/50"
                    }`}
                  >
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-sm font-extrabold text-primary">{r[lang]}</div>
                    <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.desc[lang]}</div>
                  </button>
                );
              })}
            </div>

            {role === "editor" && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs font-bold text-accent">
                {isRTL
                  ? "بننشئ حسابك وبنبعت طلبك للإدارة. صلاحية المحرر (المدونة) بتتفعّل بعد الموافقة، وكل اللي بتكتبه بيتراجع قبل النشر."
                  : "We create your account and send your request to the team. Editor access (the blog) starts once approved, and everything you write is reviewed before it goes live."}
              </div>
            )}

            <form method="post" onSubmit={submit} className="mt-5 space-y-3">
              <div className="relative">
                <UserIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input required placeholder={isRTL ? "الاسم بالكامل" : "Full name"} className="h-12 ps-9" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input required type="email" placeholder={isRTL ? "البريد الإلكتروني" : "Email"} className="h-12 ps-9" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="relative">
                  <PhoneInput value={form.phone} onChange={(v) => set("phone", v)} />
                </div>
              </div>
              {(role === "volunteer" || role === "editor") && (
                <div className="relative">
                  <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={isRTL ? "المدينة (مثال: المنصورة)" : "City (e.g. Mansoura)"} className="h-12 ps-9" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
              )}
              <PasswordField
                required
                minLength={MIN_PASSWORD}
                autoComplete="new-password"
                placeholder={isRTL ? `كلمة المرور (${MIN_PASSWORD} أحرف على الأقل)` : `Password (min ${MIN_PASSWORD} chars)`}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              {(role === "volunteer" || role === "editor") && (
                <textarea
                  placeholder={isRTL ? (role === "editor" ? "خبرتك في إدارة المحتوى/الحالات (اختياري)" : "نبذة قصيرة عنك (اختياري)") : "Short bio (optional)"}
                  className="min-h-[84px] w-full rounded-md border border-input bg-background p-3 text-sm"
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                />
              )}
              <Button type="submit" disabled={loading} className="h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
                {loading
                  ? (isRTL ? "جارٍ الإنشاء..." : "Creating...")
                  : role === "editor"
                    ? (isRTL ? "إرسال طلب محرر" : "Submit editor request")
                    : (isRTL ? "أنشئ حسابي" : "Create my account")}
              </Button>
            </form>

            {role === "donor" && (
              <div className="mt-4">
                <SocialSignIn onSignedIn={() => nav("/dashboard", { replace: true })} />
              </div>
            )}

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {isRTL ? "لديك حساب؟" : "Already have an account?"}{" "}
              <Link to="/login" className="font-extrabold text-accent">{isRTL ? "ادخل من هنا" : "Sign in"}</Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Register;