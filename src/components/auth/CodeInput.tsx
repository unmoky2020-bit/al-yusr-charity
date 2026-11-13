import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLang } from "@/i18n/LangContext";
import { digitsOf } from "@/lib/digits";
import { CODE_LENGTH } from "@/lib/passwordRules";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (code: string) => void;
  /** Called once all digits are in (e.g. to submit right away). */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
};

/**
 * The 6-digit code boxes (password reset, email confirmation). Always left-to-right, accepts
 * Arabic-Indic digits and pasted codes, and offers the SMS/email one-time-code autofill.
 */
export function CodeInput({ value, onChange, onComplete, disabled, invalid, autoFocus }: Props) {
  const { lang } = useLang();
  return (
    <div dir="ltr" className="flex justify-center">
      <InputOTP
        maxLength={CODE_LENGTH}
        value={value}
        onChange={(v) => onChange(digitsOf(v).slice(0, CODE_LENGTH))}
        // input-otp hands onComplete the raw typed value: Arabic-Indic digits must become 0-9 here too,
        // or the server rejects the code ("digits:6").
        onComplete={onComplete ? (v) => onComplete(digitsOf(v).slice(0, CODE_LENGTH)) : undefined}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={lang === "ar" ? "رمز التأكيد" : "Verification code"}
        containerClassName="gap-2"
      >
        <InputOTPGroup className="gap-1.5 sm:gap-2">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className={cn(
                "h-12 w-10 rounded-xl border border-input bg-background text-xl font-black text-primary first:rounded-xl first:border last:rounded-xl sm:h-14 sm:w-12 sm:text-2xl",
                invalid && "border-destructive",
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
