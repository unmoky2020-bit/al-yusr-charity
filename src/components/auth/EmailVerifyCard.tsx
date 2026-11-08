import { useState } from "react";
import { BadgeCheck, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/auth/CodeInput";
import { useAuth } from "@/auth/AuthContext";
import { authApi } from "@/data/laravelApi";
import { useAuthProviders } from "@/hooks/useAuthProviders";
import { useLang } from "@/i18n/LangContext";
import { CODE_LENGTH } from "@/lib/passwordRules";
import { errorReason, toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

/**
 * «أكّد بريدك»: a 6-digit code to the account's email, typed back here. Confirmed accounts see a
 * small badge instead. Shown only once the server has the email-code routes.
 */
export function EmailVerifyCard({ className }: { className?: string }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, refresh } = useAuth();
  const { ready } = useAuthProviders();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user || !ready) return null;

  if (user.emailVerified) {
    return (
      <p className={cn("inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-700", className)}>
        <BadgeCheck className="h-4 w-4" aria-hidden /> {ar ? "بريدك مؤكَّد" : "Email confirmed"}
      </p>
    );
  }

  const send = async () => {
    setBusy(true);
    try {
      const res = await authApi.sendEmailCode();
      if (res.verified) {
        await refresh();
        return;
      }
      setSent(true);
      setCode("");
      toast.success(ar ? "بعتنالك رمز التأكيد" : "We sent you the code", { description: user.email });
    } catch (err) {
      toast.error(ar ? "تعذّر إرسال الرمز" : "Couldn't send the code", { description: errorReason(err) });
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) return;
    setBusy(true);
    try {
      await authApi.verifyEmail(value);
      toast.success(ar ? "تم تأكيد بريدك" : "Email confirmed");
      await refresh();
    } catch (err) {
      toast.error(ar ? "الرمز ما اتقبلش" : "Code not accepted", { description: errorReason(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("rounded-3xl border border-secondary/30 bg-secondary/10 p-5", className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-card text-primary shadow-soft">
          <MailCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-primary">{ar ? "أكّد بريدك الإلكتروني" : "Confirm your email"}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {ar ? "عشان إيصالات تبرعك وإشعاراتك توصل صح، وتقدر تستعيد حسابك لو نسيت كلمة المرور." : "So your receipts and updates arrive, and you can always recover your account."}
          </p>
        </div>
      </div>
      {sent ? (
        <div className="mt-4 space-y-3">
          <CodeInput value={code} onChange={setCode} onComplete={(v) => void verify(v)} disabled={busy} autoFocus />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" disabled={busy || code.length !== CODE_LENGTH} onClick={() => void verify()} className="h-10 bg-primary px-6 font-extrabold text-primary-foreground">
              {ar ? "تأكيد" : "Confirm"}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void send()} className="h-10 text-xs font-bold text-primary">
              {ar ? "ابعت رمز جديد" : "Send a new code"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" disabled={busy} onClick={() => void send()} className="mt-4 h-10 w-full bg-primary font-extrabold text-primary-foreground sm:w-auto sm:px-6">
          {busy ? (ar ? "جارٍ الإرسال…" : "Sending…") : ar ? "ابعت رمز التأكيد" : "Send the code"}
        </Button>
      )}
    </div>
  );
}
