/**
 * The API answers in English (APP_LOCALE=en) and sometimes with untranslated keys
 * ("messages.invalid_credentials"). Visitors and the team read Arabic, so every error message
 * that reaches the screen goes through arabicServerMessage() first.
 */

const FIELD_AR: Record<string, string> = {
  name: "الاسم",
  email: "البريد الإلكتروني",
  phone: "رقم الموبايل",
  password: "كلمة المرور",
  password_confirmation: "تأكيد كلمة المرور",
  current_password: "كلمة المرور الحالية",
  code: "الرمز",
  role: "نوع الحساب",
  title: "العنوان",
  title_ar: "العنوان بالعربي",
  title_en: "العنوان بالإنجليزي",
  name_ar: "الاسم بالعربي",
  name_en: "الاسم بالإنجليزي",
  slug: "الرابط (slug)",
  amount: "المبلغ",
  message: "الرسالة",
  category: "التصنيف",
  category_id: "التصنيف",
  image: "الصورة",
  city: "المدينة",
  governorate: "المحافظة",
  description: "الوصف",
  content: "المحتوى",
  status: "الحالة",
};

const KEYS_AR: Record<string, string> = {
  "messages.invalid_credentials": "البريد أو كلمة المرور غلط.",
  "messages.account_inactive": "الحساب ده مش مفعّل. لو سجلت كمحرر، بيتفعّل بعد موافقة الإدارة.",
  "messages.register_success": "اتعمل الحساب.",
  "messages.login_success": "اتسجل الدخول.",
  "messages.logout_success": "اتسجل الخروج.",
  "messages.unauthorized": "مش عندك صلاحية للخطوة دي.",
  "Unauthenticated.": "سجّل الدخول الأول.",
  "This action is unauthorized.": "مش عندك صلاحية للخطوة دي.",
  "Too Many Attempts.": "محاولات كتير. استنى دقيقة وجرّب تاني.",
  "Server Error": "حصل خطأ في السيرفر. جرّب تاني بعد شوية.",
  "Registration role is not configured.": "نوع الحساب ده مش متاح للتسجيل.",
  "Your editor registration is awaiting admin approval.": "طلبك كمحرر وصل للإدارة، والحساب هيتفعّل بعد الموافقة.",
  "Your change has been submitted for Admin approval.": "التعديل اتبعت للإدارة، وهيتنفذ بعد الموافقة.",
  "This request has already been reviewed.": "الطلب ده اتراجع قبل كده.",
  "The approved operation could not be executed.": "الموافقة اتسجلت لكن التعديل نفسه ما اتنفذش (البيانات مش مقبولة).",
};

const field = (raw: string) => {
  const k = raw.trim().replace(/\s+/g, "_").toLowerCase();
  return FIELD_AR[k] ?? raw.trim();
};

const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^The (.+?) field is required\.?$/i, (m) => `خانة «${field(m[1])}» مطلوبة.`],
  [/^The (.+?) has already been taken\.?$/i, (m) => `${field(m[1])} ده مسجل قبل كده.`],
  [/^The (.+?) field must be a valid email address\.?$/i, () => "البريد الإلكتروني مش مكتوب صح."],
  [/^The (.+?) (?:field )?confirmation does not match\.?$/i, (m) => `تأكيد ${field(m[1])} مش مطابق.`],
  [/^The (.+?) field must be at least (\d+) characters\.?$/i, (m) => `${field(m[1])} لازم يكون ${m[2]} حروف على الأقل.`],
  [/^The (.+?) field must not be greater than (\d+) characters\.?$/i, (m) => `${field(m[1])} أطول من ${m[2]} حرف.`],
  [/^The (.+?) field must be (\d+) digits\.?$/i, (m) => `${field(m[1])} لازم يكون ${m[2]} أرقام.`],
  [/^The selected (.+?) is invalid\.?$/i, (m) => `قيمة «${field(m[1])}» مش مقبولة.`],
  [/^The (.+?) field must be a number\.?$/i, (m) => `${field(m[1])} لازم يكون رقم.`],
  [/^The (.+?) field must be an integer\.?$/i, (m) => `${field(m[1])} لازم يكون رقم صحيح.`],
  [/^The (.+?) field must be at least (\d+)\.?$/i, (m) => `${field(m[1])} لازم يكون ${m[2]} أو أكتر.`],
  [/^The (.+?) field must be an image\.?$/i, (m) => `${field(m[1])} لازم تكون صورة.`],
  [/^The (.+?) field format is invalid\.?$/i, (m) => `${field(m[1])} مكتوب بشكل مش صحيح.`],
  [/^The (.+?) field must be a valid URL\.?$/i, (m) => `${field(m[1])} لازم يكون رابط صحيح.`],
];

/** One message in Arabic (unknown English text is returned unchanged). */
export function arabicLine(msg: string): string {
  const t = (msg ?? "").trim();
  if (!t) return t;
  if (KEYS_AR[t]) return KEYS_AR[t];
  const noCount = t.replace(/\s*\(and \d+ more errors?\)\s*$/i, "");
  if (KEYS_AR[noCount]) return KEYS_AR[noCount];
  for (const [re, fn] of RULES) {
    const m = noCount.match(re);
    if (m) return fn(m);
  }
  return t;
}

/**
 * The message to show for an API error: every field error in Arabic (up to 3 lines), or the
 * translated top-level message when there are no field errors.
 */
export function arabicServerMessage(message: string | undefined, errors?: Record<string, string[]>): string {
  const lines: string[] = [];
  if (errors && typeof errors === "object") {
    for (const list of Object.values(errors)) {
      for (const e of Array.isArray(list) ? list : [list]) {
        const a = arabicLine(String(e));
        if (a && !lines.includes(a)) lines.push(a);
      }
    }
  }
  if (lines.length) return lines.slice(0, 3).join(" ");
  return arabicLine(message ?? "");
}
