import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, Phone, KeyRound, ChevronDown, Copy, Check, Code2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

const REMEMBER_KEY = "alyusr.login.remember.v1";

const Login = () => {
  const { lang } = useLang();
  const { login, session, user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [devOpen, setDevOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  // Hydrate remembered identifier on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { tab?: "email" | "phone"; email?: string; phone?: string };
      if (data.tab === "phone") {
        setTab("phone");
        if (data.phone) setPhone(data.phone);
      } else {
        if (data.email) setEmail(data.email);
      }
      setRemember(true);
    } catch {}
  }, []);

  const clearRemembered = () => {
    try { localStorage.removeItem(REMEMBER_KEY); } catch {}
    setEmail("");
    setPhone("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    toast({ title: lang === "ar" ? "تم مسح البيانات المحفوظة" : "Saved data cleared" });
  };

  const demoAccounts = [
    { role: "Admin", email: "admin@alyusr.com", password: "12345678" },
    { role: "Editor", email: "gomaa@test.com", password: "01102670841" },
  ];

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const fill = (acc: { email: string; password: string }) => {
    setTab("email");
    setEmail(acc.email);
    setPassword(acc.password);
  };

  // Resolve the right landing page based on the user's role.
  const roleLanding = (): string => {
    if (!user) return "/profile";
    if (user.roles.includes("admin")) return "/admin";
    if (user.roles.includes("editor") || user.roles.includes("case_manager") || user.roles.includes("caseworker")) return "/admin";
    if (user.roles.includes("volunteer")) return "/admin";
    return "/dashboard"; // donors → donor dashboard
  };

  // After Supabase confirms the session AND profile/roles loaded, navigate.
  useEffect(() => {
    if (session && user) {
      const next = params.get("next");
      nav(next || roleLanding(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, user, params, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "phone") {
      // Mock OTP flow
      if (!otpSent) {
        if (!/^01\d{9}$/.test(phone.trim())) {
          toast({ title: lang === "ar" ? "رقم الهاتف غير صحيح" : "Invalid phone number", description: lang === "ar" ? "أدخل 11 رقمًا يبدأ بـ 01" : "Enter 11 digits starting with 01", variant: "destructive", });
          return;
        }
        setOtpSent(true);
        toast({ title: lang === "ar" ? " تم إرسال كود (تجربة: 1234)" : " Code sent (demo: 1234)" });
        return;
      }
      if (otp.trim() !== "1234") {
        toast({ title: lang === "ar" ? "كود التحقق غير صحيح" : "Invalid verification code", description: lang === "ar" ? "تأكد من الكود الذي أُرسل إلى هاتفك." : "Check the code sent to your phone.", variant: "destructive", });
        return;
      }
      if (remember) {
        try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ tab: "phone", phone: phone.trim() })); } catch {}
      } else {
        try { localStorage.removeItem(REMEMBER_KEY); } catch {}
      }
      toast({ title: lang === "ar" ? `أهلاً بعودتك ` : `Welcome back `, description: lang === "ar" ? "تم تسجيل الدخول بنجاح." : "You are now signed in.", });
      const next = params.get("next");
      nav(next || roleLanding());
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

  const social = async (provider: "google" | "facebook") => {
    if (provider === "facebook") {
      toast({ title: lang === "ar" ? "تسجيل الدخول بـ Facebook غير متاح حاليًا" : "Facebook sign-in is not available", description: lang === "ar" ? "نوفّر حاليًا الدخول عبر Google أو البريد الإلكتروني." : "Please use Google or email sign-in.", variant: "destructive", });
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: lang === "ar" ? "تعذّر الدخول بـ Google" : "Google sign-in failed", description: result.error.message, variant: "destructive", });
    }
  };

  return (
    <PageLayout>
      <SEOHelmet
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
              <button type="button" onClick={() => { setTab("email"); setOtpSent(false); }}
                className={`rounded-full py-2 text-xs font-extrabold transition ${tab === "email" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}>
                <Mail className="me-1 inline h-3.5 w-3.5" /> {lang === "ar" ? "البريد" : "Email"}
              </button>
              <button type="button" onClick={() => setTab("phone")}
                className={`rounded-full py-2 text-xs font-extrabold transition ${tab === "phone" ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}>
                <Phone className="me-1 inline h-3.5 w-3.5" /> {lang === "ar" ? "الهاتف" : "Phone"}
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {tab === "email" ? (
                <>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" required placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email"} className="h-12 ps-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type={show ? "text" : "password"} required placeholder={lang === "ar" ? "كلمة المرور" : "Password"} className="h-12 ps-9 pe-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" required dir="ltr" placeholder="01XXXXXXXXX" className="h-12 ps-9" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} />
                  </div>
                  {otpSent && (
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="text" required maxLength={4} dir="ltr" placeholder="1234" className="h-12 ps-9 text-center font-mono text-lg tracking-[0.6em]" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    </div>
                  )}
                </>
              )}
              <Button type="submit" disabled={loading} className="h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95">
                {loading
                  ? (lang === "ar" ? "جاري الدخول..." : "Signing in...")
                  : tab === "phone"
                  ? (otpSent ? (lang === "ar" ? "تأكيد الكود" : "Verify code") : (lang === "ar" ? "إرسال الكود" : "Send code"))
                  : (lang === "ar" ? "دخول" : "Sign in")}
              </Button>
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

            {/* Divider + Social */}
            <div className="mt-6 flex items-center gap-3 text-xs font-bold text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {lang === "ar" ? "أو" : "OR"}
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => social("google")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-xs font-extrabold text-primary transition hover:border-secondary hover:bg-secondary/5"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden className="shrink-0"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3c4.4-4 7.1-9.9 7.1-16 0-1.3-.1-2.3-.4-3.5z"/></svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => social("facebook")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-xs font-extrabold text-primary transition hover:border-secondary hover:bg-secondary/5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden className="shrink-0"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                <span>Facebook</span>
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

            {isDev && (
              <div className="mt-5 rounded-2xl border border-dashed border-secondary/40 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setDevOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-extrabold text-primary"
                  aria-expanded={devOpen}
                >
                  <span className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-accent" />
                    {lang === "ar" ? "حسابات تجريبية (للمطورين فقط)" : "Demo accounts (developers only)"}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${devOpen ? "rotate-180" : ""}`} />
                </button>
                {devOpen && (
                  <div className="space-y-2 border-t border-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      {lang === "ar" ? "مرئية فقط في وضع التطوير. اضغط تعبئة، أو انسخ القيم." : "Visible only in dev. Click Fill, or copy values."}
                    </p>
                    {demoAccounts.map((a) => (
                      <div key={a.email} className="rounded-xl bg-card p-2 shadow-soft">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary">{a.role}</span>
                          <button type="button" onClick={() => fill(a)} className="text-[10px] font-bold text-accent hover:underline">
                            {lang === "ar" ? "تعبئة" : "Fill"}
                          </button>
                        </div>
                        <div className="mt-1.5 space-y-1">
                          {[
                            { k: `${a.email}-e`, label: "email", val: a.email },
                            { k: `${a.email}-p`, label: "password", val: a.password },
                          ].map((row) => (
                            <div key={row.k} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                              <span className="w-16 text-[10px] font-bold uppercase text-muted-foreground">{row.label}</span>
                              <code className="flex-1 truncate text-[11px]" dir="ltr">{row.val}</code>
                              <button
                                type="button"
                                onClick={() => copy(row.val, row.k)}
                                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-secondary/30 hover:text-primary"
                                aria-label="copy"
                              >
                                {copied === row.k ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Login;