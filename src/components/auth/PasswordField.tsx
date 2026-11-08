import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LangContext";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "type"> & {
  /** Lock icon at the reading start (default on). */
  withIcon?: boolean;
};

/** Every password input of the site: lock icon, show/hide button on the reading end. */
export const PasswordField = forwardRef<HTMLInputElement, Props>(({ withIcon = true, className, ...props }, ref) => {
  const { lang } = useLang();
  const [show, setShow] = useState(false);
  const label = show ? (lang === "ar" ? "إخفاء كلمة المرور" : "Hide password") : lang === "ar" ? "إظهار كلمة المرور" : "Show password";

  return (
    <div className="relative">
      {withIcon && <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />}
      <Input ref={ref} {...props} type={show ? "text" : "password"} className={cn("h-12 pe-10", withIcon && "ps-9", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={label}
        aria-pressed={show}
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
});
PasswordField.displayName = "PasswordField";
