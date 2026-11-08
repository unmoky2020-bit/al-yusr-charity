/** The server's rule for every new password (reset, change, set by the super admin). */
export const MIN_PASSWORD = 8;

/** Length of the codes sent by email (password reset, email confirmation). */
export const CODE_LENGTH = 6;

type Lang = "ar" | "en";

/**
 * Why a new password can't be sent yet, in the page language; null when it is fine.
 * `current` (optional) rejects reusing the password being replaced.
 */
export function newPasswordProblem(password: string, confirm: string, lang: Lang, current?: string): string | null {
  const ar = lang === "ar";
  if (password.length < MIN_PASSWORD) return ar ? `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل` : `Use at least ${MIN_PASSWORD} characters`;
  if (password.trim() !== password) return ar ? "شيل المسافات من أول وآخر كلمة المرور" : "Remove the spaces at the start or end";
  if (password !== confirm) return ar ? "كلمتا المرور غير متطابقتين" : "The two passwords don't match";
  if (current !== undefined && current === password) return ar ? "اختر كلمة مرور مختلفة عن الحالية" : "Choose a password different from the current one";
  return null;
}
