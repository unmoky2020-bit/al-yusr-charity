import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, Phone, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";

const REMEMBER_KEY = "alyusr.login.remember.v1";

/**
 * Only accept an in-app path for `?next=`: a single leading slash, not protocol-relative
 * (`//evil.com`) and no backslashes (browsers normalise `/\evil.com` to `//evil.com`).
 * Anything else falls back to the role-based landing page.
 */
const safeNext = (raw: string | null | undefined, fallback: string): string => {
  const v = (raw ?? "").trim();
  return /^\/(?!\/)/.test(v) && !v.includes("\\") ? v : fallback;
};

const Login = () => {
  const { lang } = useLang();
  const { login, session, user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  // Hydrate remembered identifier on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { email?: string };
      if (data.email) setEmail(data.email);
      setRemember(true);
    } catch {}
  }, []);

  const clearRemembered = () => {
    try { localStorage.removeItem(REMEMBER_KEY); } catch {}
    setEmail("");
    setPassword("");
    toast({ title: lang === "ar" ? "تم مسح البيانات المحفوظة" : "Saved data cleared" });
  };

  // Resolve the right landing page based on the user's role.
  const roleLanding = (): string => {
    if (!user) return "/profile";
    if (user.roles.includes("admin")) return "/admin";
    if (user.roles.includes("editor") || user.roles.includes("case_manager") || user.roles.includes("caseworker")) return "/admin";
    if (user.roles.includes("volunteer")) return "/admin";
    return "/dashboard"; // donors → donor dashboard
  };

  // After the Laravel session is confirmed AND profile/roles loaded, navigate.
  useEffect(() => {
    if (session && user) {
      nav(safeNext(params.get("next"), roleLanding()), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, params, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "phone") {
      // The backend has no phone/OTP login endpoint yet — never pretend to sign in.
      toast({ title: lang === "ar" ? "تسجيل الدخول بالهاتف غير متاح حاليًا" : "Phone sign-in is not available yet", description: lang === "ar" ? "يرجى الدخول باستخدام البريد الإلكتروني وكلمة المرور." : "Please sign in with your email and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      const res = await login(email.trim(), password);
      setLoading(false);
      if (!res.ok) {
        let title = "";
        let description = "";
        if (res.error === "PENDING_APPROVAL") {
          title = lang === "ar" ? "حسابك قيد المراجعة" : "Account pending approval";
          description = lang === "ar" ? "سيتم تفعيل حسابك بعد مراجعة فريق اليسر." : "Your account will be activated after Al-Yusr team review.";
        } else if (res.error === "REJECTED") {
          title = lang === "ar" ? "تم تعليق حسابك" : "Account suspended";
          description = lang === "ar" ? "يرجى التواصل مع الدعم لمزيد من التفاصيل." : "Please contact support for more details.";
        } else if (res.error === "EMAIL_NOT_CONFIRMED" || res.error?.toLowerCase().includes("email")) {
          title = lang === "ar" ? "يرجى تأكيد البريد الإلكتروني" : "Please confirm your email";
          description = lang === "ar" ? "افتح رسالة التأكيد المُرسلة إلى بريدك ثم حاول مرة أخرى." : "Open the confirmation email we sent you, then try again.";
        } else {
          title = lang === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials";
          description = lang === "ar" ? "تحقق من البريد وكلمة المرور وحاول مرة أخرى." : "Check your email and password, then try again.";
        }
        toast({ title, description, variant: "destructive" });
        return;
      }
      if (remember) {
        try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ tab: "email", email: email.trim() })); } catch {}
      } else {
        try { localStorage.removeItem(REMEMBER_KEY); } catch {}
      }
      toast({ title: lang === "ar" ? "أهلاً بعودتك " : "Welcome back ", description: lang === "ar" ? "تم تسجيل الدخول بنجاح." : "You are now signed in.", });
      // Navigation handled by the session effect above.
    }, 500);
  };

  // Social login (Google/Facebook) removed: it relied on Supabase + Lovable auth and always failed.
  // Proposed Laravel Socialite flow (GET /auth/{provider}/redirect → /auth/{provider}/callback) is
  // documented in backend-handoff/01-replace-supabase-public.md; re-add the buttons once it exists.

  return (
    <PageLayout>
      <SEOHelmet noindex
        title={lang === "ar" ? "تسجيل الدخول | مؤسسة اليسر الخيرية" : "Login | Al-Yusr Charity"}
        description={lang === "ar" ? "ادخل إلى حسابك في مؤسسة اليسر الخيرية لإدارة تبرعاتك أو بيانات تطوعك." : "Sign in to your Al-Yusr account to manage donations or volunteer info."}
        path="/login"
      />
      <section className="bg-muted/30 pt-8 sm:pt-12 pb-36 sm:pb-44 md:pt-16 md:pb-52">
        <div className="container mx-auto max-w-md px-4">
          <Breadcrumbs items={[{ name: lang === "ar" ? "الرئيسية" : "Home", href: "/" }, { name: lang === "ar" ? "تسجيل الدخول" : "Login" }]} />
          <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/20 text-primary">
                <LogIn className="h-6 w-6" />
              </div>
              <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">
                {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "ar" ? "أهلاً بعودتك إلى مؤسسة اليسر" : "Welcome back to Al-Yusr"}
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
              <button type="button" onClick={() => setTab("email")}
                className={`rounded-full py-2 text-xs font-extrabold transition ${tab === "email" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}>
                <Mail className="me-1 inline h-3.5 w-3.5" /> {lang === "ar" ? "البريد" : "Email"}
              </button>
              <button type="button" onClick={() => setTab("phone")}
                className={`rounded-full py-2 text-xs font-extrabold transition ${tab === "phone" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}>
                <Phone className="me-1 inline h-3.5 w-3.5" /> {lang === "ar" ? "الهاتف" : "Phone"}
              </button>
            </div>

            <form method="post" onSubmit={submit} className="mt-6 space-y-3">
              {tab === "email" ? (
                <>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" name="email" autoComplete="email" required placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} className="h-12 ps-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type={show ? "text" : "password"} name="password" autoComplete="current-password" required placeholder={lang === "ar" ? "كلمة المرور" : "Password"} className="h-12 ps-9 pe-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <div role="status" className="rounded-2xl border border-dashed border-secondary/40 bg-muted/30 p-4 text-center">
                  <Phone className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-extrabold text-primary">
                    {lang === "ar" ? "تسجيل الدخول بالهاتف غير متاح حاليًا" : "Phone sign-in is not available yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lang === "ar" ? "يمكنك الدخول باستخدام البريد الإلكتروني وكلمة المرور." : "You can sign in with your email and password."}
                  </p>
                  <button type="button" onClick={() => setTab("email")} className="mt-3 rounded-full bg-secondary/20 px-3.5 py-1.5 text-xs font-extrabold text-primary transition hover:bg-secondary/30">
                    {lang === "ar" ? "الدخول بالبريد الإلكتروني" : "Sign in with email"}
                  </button>
                </div>
              )}
              {tab === "email" && (
                <Button type="submit" disabled={loading} className="h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
                  {loading ? (lang === "ar" ? "جاري الدخول..." : "Signing in...") : (lang === "ar" ? "دخول" : "Sign in")}
                </Button>
              )}
            </form>

            {/* Remember + clear */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
              <label className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <span className="font-bold leading-tight">{lang === "ar" ? "تذكرني على هذا الجهاز" : "Remember me on this device"}</span>
              </label>
              <button
                type="button"
                onClick={clearRemembered}
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 font-bold text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <XIcon className="h-3 w-3" />
                {lang === "ar" ? "مسح البيانات" : "Clear saved"}
              </button>
            </div>

            <div className="mt-5 space-y-2.5 text-center text-sm">
              <p className="text-muted-foreground font-bold">
                {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link to="/register?role=donor" className="rounded-full bg-secondary/20 px-3.5 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30 transition">
                  {lang === "ar" ? "سجّل كمتبرع" : "Sign up as donor"}
                </Link>
                <Link to="/register?role=volunteer" className="rounded-full bg-secondary/20 px-3.5 py-1.5 text-xs font-extrabold text-primary hover:bg-secondary/30 transition">
                  {lang === "ar" ? "سجّل كمتطوع" : "Sign up as volunteer"}
                </Link>
                <Link to="/register?role=editor" className="rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-extrabold text-accent hover:bg-accent/20 transition">
                  {lang === "ar" ? "تقديم كمحرر" : "Apply as editor"}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Login;