import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/PasswordField";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LangContext";
import { MIN_PASSWORD, newPasswordProblem } from "@/lib/passwordRules";
import { toast } from "@/lib/notify";

type Props = {
  /** Field height: the public profile uses the tall fields, the dashboard the compact ones. */
  size?: "default" | "compact";
};

/** Change your own password (current + new + repeat), the same form on the profile and the dashboard. */
export function ChangePasswordForm({ size = "default" }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const h = size === "compact" ? "h-11" : "h-12";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = newPasswordProblem(next, confirm, lang, current);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    const res = await changePassword(user?.id ?? "", current, next);
    setBusy(false);
    if (!res.ok) {
      toast.error(ar ? "لم يتم تغيير كلمة المرور" : "Password not changed", { description: res.error });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success(ar ? "تم تغيير كلمة المرور" : "Password changed");
  };

  return (
    <form method="post" onSubmit={submit} className="space-y-3">
      <PasswordField
        required
        autoComplete="current-password"
        className={h}
        placeholder={ar ? "كلمة المرور الحالية" : "Current password"}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <PasswordField
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          className={h}
          placeholder={ar ? `الجديدة (${MIN_PASSWORD} أحرف أو أكثر)` : `New (${MIN_PASSWORD}+ characters)`}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <PasswordField
          required
          autoComplete="new-password"
          className={h}
          placeholder={ar ? "أعد كتابة الجديدة" : "Repeat the new one"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/forgot-password" state={{ email: user?.email }} className="text-xs font-extrabold text-primary/80 hover:text-primary hover:underline">
          {ar ? "نسيت كلمة المرور الحالية؟" : "Forgot the current password?"}
        </Link>
        <Button type="submit" disabled={busy} className={`${h} min-w-36 bg-primary font-extrabold text-primary-foreground hover:opacity-95`}>
          {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "تغيير كلمة المرور" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
