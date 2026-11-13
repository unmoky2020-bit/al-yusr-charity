/**
 * Words for «مراجعة المحتوى»: what part of the site a change request touches, what it does,
 * the Arabic name of each field, and where to open the record in the dashboard.
 */

const SECTION_AR: Record<string, string> = {
  programs: "برنامج",
  projects: "مشروع",
  "donation-campaigns": "حملة تبرع",
  donation_campaigns: "حملة تبرع",
  "volunteer-campaigns": "حملة تطوع",
  volunteer_campaigns: "حملة تطوع",
  cases: "حالة",
  content: "مقال / صفحة",
  contents: "مقال / صفحة",
  "blog-seo": "سيو مقال",
  blog_seo: "سيو مقال",
  stories: "قصة",
  gallery: "معرض الصور",
  media: "مكتبة الوسائط",
  faqs: "سؤال شائع",
  settings: "إعدادات",
  donors: "متبرع",
  users: "مستخدم",
  axes: "محور",
  seasons: "موسم",
  services: "خدمة",
  "program-donation-packages": "باقة تبرع",
  program_donation_packages: "باقة تبرع",
  "package-images": "صورة باقة",
  "site-blocks": "بيانات الموقع",
  "editor-registration": "طلب انضمام محرر",
  "homepage-content": "محتوى الرئيسية",
};

const ADMIN_PATH: Record<string, (id: string) => string> = {
  programs: (id) => `/admin/programs/${id}`,
  projects: (id) => `/admin/projects/${id}`,
  donation_campaigns: (id) => `/admin/donation-campaigns/${id}`,
  "donation-campaigns": (id) => `/admin/donation-campaigns/${id}`,
  cases: (id) => `/admin/cases/${id}`,
  stories: (id) => `/admin/stories/${id}`,
  donors: (id) => `/admin/donors/${id}`,
  users: (id) => `/admin/users/${id}`,
  axes: (id) => `/admin/axes/${id}`,
  "editor-registration": (id) => `/admin/users/${id}`,
};

export const FIELD_LABEL_AR: Record<string, string> = {
  name: "الاسم",
  name_ar: "الاسم بالعربي",
  name_en: "الاسم بالإنجليزي",
  title: "العنوان",
  title_ar: "العنوان بالعربي",
  title_en: "العنوان بالإنجليزي",
  slug: "الرابط (slug)",
  email: "البريد",
  phone: "الموبايل",
  role: "نوع الحساب",
  status: "الحالة",
  is_active: "مفعّل",
  hide_from_audience: "مخفي عن الزوار",
  donation_available: "التبرع متاح",
  sort_order: "الترتيب",
  axis_id: "المحور",
  season_ids: "المواسم",
  project_id: "المشروع",
  program_id: "البرنامج",
  category_id: "التصنيف",
  tagline_ar: "الشعار بالعربي",
  tagline_en: "الشعار بالإنجليزي",
  period_ar: "المدة بالعربي",
  period_en: "المدة بالإنجليزي",
  description: "الوصف",
  description_ar: "الوصف بالعربي",
  description_en: "الوصف بالإنجليزي",
  short_description_ar: "الوصف المختصر بالعربي",
  content_ar: "المحتوى بالعربي",
  content_en: "المحتوى بالإنجليزي",
  excerpt_ar: "المقتطف بالعربي",
  image: "الصورة",
  cover_image: "صورة الغلاف",
  image_url: "الصورة",
  meta_title_ar: "عنوان جوجل بالعربي",
  meta_title_en: "عنوان جوجل بالإنجليزي",
  meta_description_ar: "وصف جوجل بالعربي",
  meta_description_en: "وصف جوجل بالإنجليزي",
  focus_keyword: "الكلمة المستهدفة",
  schema_type: "نوع الـ Schema",
  twitter_card: "كارت تويتر",
  noindex: "منع الأرشفة",
  nofollow: "منع تتبع الروابط",
  target_amount: "المبلغ المستهدف",
  goal_amount: "المبلغ المستهدف",
  amount: "المبلغ",
  price: "السعر",
  type: "النوع",
  key: "المفتاح",
  value: "القيمة",
  group: "المجموعة",
  beneficiary_name: "اسم المستفيد",
  governorate: "المحافظة",
  city: "المدينة",
  story: "القصة",
  published_at: "تاريخ النشر",
};

export const fieldLabel = (k: string) => FIELD_LABEL_AR[k] ?? k;

/** "api/v1/programs/60" → "programs" */
export function sectionKey(routeUri: string | undefined, module?: string): string {
  if (module && module !== "v1" && module !== "unknown") return module;
  const seg = (routeUri ?? "").replace(/^\/+/, "").split("/");
  const i = seg[0] === "api" ? 2 : seg[0] === "v1" ? 1 : 0;
  return seg[i] ?? module ?? "";
}

export const sectionLabel = (key: string) => SECTION_AR[key] ?? key;

export function actionLabel(method: string | undefined, action?: string): string {
  const m = (method ?? "").toUpperCase();
  if (m === "REGISTER" || action === "register") return "تسجيل حساب";
  if (m === "POST") return "إضافة";
  if (m === "PUT" || m === "PATCH") return "تعديل";
  if (m === "DELETE") return "حذف";
  return action ?? m;
}

export function adminLink(table: string | null | undefined, id: string | number | null | undefined): string | null {
  if (!table || id === null || id === undefined || id === "") return null;
  const f = ADMIN_PATH[table];
  return f ? f(String(id)) : null;
}

/** Shows a stored value the way a person reads it. */
export function readableValue(v: string | null): string {
  if (v === null || v === undefined) return "—";
  if (v === "true" || v === "1") return "نعم";
  if (v === "false" || v === "0") return "لا";
  if (v === "") return "(فاضي)";
  return v;
}
