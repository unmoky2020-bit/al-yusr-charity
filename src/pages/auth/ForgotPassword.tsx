import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/auth/CodeInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { useLang } from "@/i18n/LangContext";
import { authApi } from "@/data/laravelApi";
import { CODE_LENGTH, MIN_PASSWORD, newPasswordProblem } from "@/lib/passwordRules";
import { errorReason, toast } from "@/lib/notify";

/**
 * Forgotten password in two steps: the email receives a 6-digit code (15 minutes, 5 tries), then
 * the code and the new password. Step 1 answers the same for every email, so it never reveals who
 * has an account; the account is signed out everywhere after the change.
 */
export default function ForgotPassword() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const nav = useNavigate();
  // The email typed on the sign-in page travels in router state, never in the URL.
  const initialEmail = (useLocation().state as { email?: string } | null)?.email ?? "";
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const requestCode = async () => {
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      toast.success(ar ? "لو البريد مسجّل، الرمز في الطريق" : "If the email is registered, the code is on its way", {
        description: ar ? "افتح بريدك، وراجع الرسائل غير المرغوب فيها لو مالقيتوش." : "Check your inbox, and the spam folder if it isn't there.",
      });
      setCode("");
      setStep("code");
    } catch (err) {
      toast.error(ar ? "تعذّر إرسال الرمز" : "Couldn't send the code", { description: errorReason(err) });
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    void requestCode();
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = newPasswordProblem(password, confirm, lang);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code, password });
      toast.success(ar ? "تم تغيير كلمة المرور" : "Password changed", {
        description: ar ? "سجّل الدخول بكلمة المرور الجديدة." : "Sign in with your new password.",
      });
      nav("/login", { replace: true, state: { email: email.trim() } });
    } catch (err) {
      toast.error(ar ? "لم يتم تغيير كلمة المرور" : "Password not changed", { description: errorReason(err) });
    } finally {
      setBusy(false);
    }
  };

  const title = ar ? "استعادة كلمة المرور" : "Reset your password";
  const cta = "h-12 w-full bg-orange-grad text-base font-extrabold text-accent-foreground shadow-cta hover:opacity-95";

  return (
    <PageLayout>
      <SEOHelmet
        noindex
        path="/forgot-password"
        title={ar ? "استعادة كلمة المرور | مؤسسة اليسر الخيرية" : "Reset password | Al-Yusr Charity"}
        description={ar ? "استعد الدخول إلى حسابك في مؤسسة اليسر برمز يصل إلى بريدك." : "Get back into your Al-Yusr account with a code sent to your email."}
      />
      <section className="bg-muted/30 pt-8 sm:pt-12 pb-36 sm:pb-44 md:pt-16 md:pb-52">
        <div className="container mx-auto max-w-md px-4">
          <Breadcrumbs
            items={[
              { name: ar ? "الرئيسية" : "Home", href: "/" },
              { name: ar ? "تسجيل الدخول" : "Login", href: "/login" },
              { name: title },
            ]}
          />
          <div className="mt-4 rounded-3xl bg-card p-6 shadow-card md:p-8">
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/20 text-primary">
                {step === "email" ? <KeyRound className="h-6 w-6" aria-hidden /> : <ShieldCheck className="h-6 w-6" aria-hidden />}
              </div>
              <h1 className="mt-3 text-2xl font-black text-primary md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {step === "email" ? (
                  ar ? "اكتب بريدك المسجّل، وهنبعتلك رمز من 6 أرقام." : "Enter your account email and we'll send a 6-digit code."
                ) : (
                  <>
                    {ar ? "اكتب الرمز اللي وصل على " : "Enter the code sent to "}
                    <bdi className="font-bold text-foreground">{email}</bdi>
                    {ar ? " — صالح 15 دقيقة." : " — valid for 15 minutes."}
                  </>
                )}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={sendCode} className="mt-6 space-y-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder={ar ? "البريد الإلكتروني" : "Email"}
                    className="h-12 ps-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy} className={cta}>
                  {busy ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? "ابعت الرمز" : "Send code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={reset} className="mt-6 space-y-3">
                <CodeInput value={code} onChange={setCode} disabled={busy} autoFocus />
                <PasswordField
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                  placeholder={ar ? `كلمة المرور الجديدة (${MIN_PASSWORD} أحرف أو أكثر)` : `New password (${MIN_PASSWORD}+ characters)`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordField
                  required
                  autoComplete="new-password"
                  placeholder={ar ? "أعد كتابة كلمة المرور" : "Repeat the password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <Button type="submit" disabled={busy || code.length !== CODE_LENGTH} className={cta}>
                  {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "احفظ كلمة المرور الجديدة" : "Save the new password"}
                </Button>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-bold">
                  <button type="button" onClick={() => setStep("email")} className="rounded-full px-2 py-1 text-primary/80 hover:bg-muted hover:text-primary">
                    {ar ? "تغيير البريد" : "Change email"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void requestCode()}
                    className="rounded-full px-2 py-1 text-primary/80 hover:bg-muted hover:text-primary disabled:opacity-50"
                  >
                    {ar ? "ماوصلش؟ ابعت تاني" : "No code? Send again"}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm">
              <Link to="/login" className="font-extrabold text-primary hover:underline">
                {ar ? "العودة لتسجيل الدخول" : "Back to sign in"}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
