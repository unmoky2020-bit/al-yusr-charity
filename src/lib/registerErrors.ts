/**
 * Turns a failed sign-up into the right message. Before, every failure that mentioned "taken"
 * (including a phone number used on another account, or a short password on the volunteer form)
 * said "this email is already registered".
 */
export function registerProblem(error: string | undefined, isAr: boolean): { title: string; description?: string } {
  const e = (error ?? "").trim();
  const taken = /taken|registered|exists|مسجل|مستخدم/i.test(e);
  const phone = /phone|موبايل|الهاتف|التليفون|الجوال/i.test(e);
  const email = /email|البريد|الإيميل/i.test(e);
  if (taken && phone && !email) {
    return isAr
      ? { title: "رقم الموبايل ده مسجل على حساب تاني", description: "لو ده حسابك، سجّل دخول بالبريد بتاعه أو استعد كلمة المرور. أو اكتب رقم تاني." }
      : { title: "This phone number is on another account", description: "Sign in to that account, reset its password, or use another number." };
  }
  if (taken) {
    return isAr
      ? { title: "البريد ده مسجل بالفعل", description: "سجّل الدخول، أو استعد كلمة المرور لو نسيتها." }
      : { title: "This email is already registered", description: "Sign in, or reset your password if you forgot it." };
  }
  return { title: isAr ? "تعذّر إنشاء الحساب" : "Could not create the account", description: e || undefined };
}
