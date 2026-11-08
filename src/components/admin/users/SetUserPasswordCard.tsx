import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuth } from "@/auth/AuthContext";
import { authApi } from "@/data/laravelApi";
import { useAuthProviders } from "@/hooks/useAuthProviders";
import { useLang } from "@/i18n/LangContext";
import { MIN_PASSWORD, newPasswordProblem } from "@/lib/passwordRules";
import { errorReason, toast } from "@/lib/notify";

type Props = { userId: string | number; userName: string; userEmail?: string };

/**
 * Super admin only: give an account a new password (someone locked out, a shared password to
 * replace). The account is signed out on every device; the change is in the activity log.
 */
export function SetUserPasswordCard({ userId, userName, userEmail }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user } = useAuth();
  const { ready } = useAuthProviders();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSuperAdmin = Boolean(user?.roles.includes("admin"));
  const isSelf = String(user?.id) === String(userId);
  if (!isSuperAdmin || isSelf || !ready) return null;

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = newPasswordProblem(password, confirm, lang);
    if (problem) {
      toast.error(problem);
      return;
    }
    setAsking(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await authApi.setUserPassword(userId, password);
      setPassword("");
      setConfirm("");
      toast.success(ar ? "تم تعيين كلمة المرور الجديدة" : "New password set", {
        description: ar ? `اتسجّل خروج ${userName} من كل الأجهزة. ابعتله الكلمة الجديدة بطريقة آمنة.` : `${userName} was signed out everywhere. Share the new password safely.`,
      });
    } catch (err) {
      toast.error(ar ? "لم يتم تغيير كلمة المرور" : "Password not changed", { description: errorReason(err) });
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  return (
    <section className="rounded-2xl border border-destructive/20 bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <KeyRound className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-black text-primary">{ar ? "تعيين كلمة مرور جديدة" : "Set a new password"}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {ar
              ? "للسوبر أدمن بس: لو المستخدم مش قادر يدخل. الحساب هيتسجّل خروجه من كل الأجهزة، والتغيير بيتسجّل في سجل النشاط."
              : "Super admin only, for a locked-out user. The account is signed out everywhere and the change is logged."}
          </p>
        </div>
      </div>
      <form onSubmit={ask} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <PasswordField
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          className="h-11"
          placeholder={ar ? `كلمة المرور الجديدة (${MIN_PASSWORD}+)` : `New password (${MIN_PASSWORD}+)`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          required
          autoComplete="new-password"
          className="h-11"
          placeholder={ar ? "أعد كتابتها" : "Repeat it"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={busy} variant="destructive" className="h-11 font-extrabold">
          {ar ? "تعيين" : "Set"}
        </Button>
      </form>

      <AlertDialog open={asking} onOpenChange={(o) => !busy && setAsking(o)}>
        <AlertDialogContent dir={ar ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
              {ar ? "تغيير كلمة مرور المستخدم؟" : "Change this user's password?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? `كلمة مرور «${userName}»${userEmail ? ` (${userEmail})` : ""} هتتغيّر، وهيتسجّل خروجه من كل الأجهزة.`
                : `${userName}${userEmail ? ` (${userEmail})` : ""} gets the new password and is signed out everywhere.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "تأكيد التغيير" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
