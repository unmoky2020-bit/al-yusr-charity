import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, MailCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/auth/CodeInput";
import { useAuth } from "@/auth/AuthContext";
import { authApi } from "@/data/laravelApi";
import { CODE_LENGTH } from "@/lib/passwordRules";
import { errorReason, toast } from "@/lib/notify";
import { useLang } from "@/i18n/LangContext";

/** Only same-site paths are followed after confirming. */
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard");

/**
 * Right after sign-up (and from «أكّد بريدك» anywhere): the code goes to the account's email at once,
 * the person types it here, and continues to where they were going. "Later" is always allowed.
 */
export default function VerifyEmail() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [state, setState] = useState<"sending" | "sent" | "error" | "checking">("sending");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const started = useRef(false);

  const send = async () => {
    setState("sending");
    try {
      const res = await authApi.sendEmailCode();
      if (res.verified) { await refresh(); nav(next, { replace: true }); return; }
      setState("sent");
      setCooldown(60);
    } catch (err) {
      setState("error");
      setError(errorReason(err));
    }
  };

  useEffect(() => {
    if (!user || user.emailVerified || started.current) return;
    started.current = true;
    void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) return;
    setState("checking");
    try {
      await authApi.verifyEmail(value);
      await refresh();
      toast.success(ar ? "تم تأكيد بريدك" : "Email confirmed");
      nav(next, { replace: true });
    } catch (err) {
      setState("sent");
      setCode("");
      toast.error(ar ? "الرمز ما اتقبلش" : "Code not accepted", { description: errorReason(err) });
    }
  };

  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/verify-email?next=${next}`)}`} replace />;
  if (user.emailVerified) return <Navigate to={next} replace />;

  return (
    <PageLayout>
      <Helmet><title>{ar ? "أكّد بريدك | اليسر" : "Confirm your email | Al-Yusr"}</title><meta name="robots" content="noindex" /></Helmet>
      <section className="container mx-auto max-w-md px-4 py-12 sm:py-16" dir={ar ? "rtl" : "ltr"}>
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/15 text-primary"><MailCheck className="h-7 w-7" /></span>
          <h1 className="mt-4 text-2xl font-black text-primary">{ar ? "أكّد بريدك" : "Confirm your email"}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {ar ? "بعتنا رمز من 6 أرقام لـ" : "We sent a 6-digit code to"}{" "}
            <b className="text-foreground" dir="ltr">{user.email}</b>.
            {ar ? " لو مش لاقيه، بص في الرسائل غير المرغوب فيها (Spam)." : " Check spam if you don't see it."}
          </p>

          {state === "sending" ? (
            <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
          ) : state === "error" ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-bold text-destructive">{error || (ar ? "تعذر إرسال الرمز" : "Couldn't send the code")}</p>
              <Button onClick={() => void send()}>{ar ? "حاول تاني" : "Try again"}</Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <CodeInput value={code} onChange={setCode} onComplete={(v) => void verify(v)} disabled={state === "checking"} autoFocus />
              <Button className="h-11 w-full font-extrabold" disabled={state === "checking" || code.length !== CODE_LENGTH} onClick={() => void verify()}>
                {state === "checking" && <Loader2 className="ml-1 h-4 w-4 animate-spin" />} {ar ? "تأكيد" : "Confirm"}
              </Button>
              <Button variant="ghost" className="text-xs font-bold text-primary" disabled={cooldown > 0} onClick={() => void send()}>
                {cooldown > 0 ? (ar ? `ابعت رمز جديد بعد ${cooldown} ثانية` : `Resend in ${cooldown}s`) : ar ? "ابعت رمز جديد" : "Send a new code"}
              </Button>
            </div>
          )}
          <Link to={next} className="mt-4 block text-xs text-muted-foreground underline">{ar ? "أكّد بعدين" : "Later"}</Link>
        </div>
      </section>
    </PageLayout>
  );
}
