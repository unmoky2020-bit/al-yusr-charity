# توثيق الربط مع Laravel Charity API v1

آخر تحديث: 2026-08-26

- Base URL: `https://elyusr-api.pyramedx.com/api/v1`
- يمكن تغييره بمتغير البيئة `VITE_API_BASE_URL`
- المصادقة: **Laravel Sanctum** — التوكن يُحفظ في `localStorage` تحت المفتاح `alyusr_api_token`
- ملف العميل: `src/data/laravelApi.ts`
- لوحة الفحص الحيّة داخل الموقع: **`/admin/api-integration`**

## 1) الحساب الصحيح

| البريد | كلمة المرور | الدور |
|---|---|---|
| `admin@alyusr.com` | (محفوظة في مدير كلمات المرور، لا تُكتب هنا) | Super Admin |

الحساب القديم `admin@elyusr.org / admin123` **غير موجود** على هذا الـ API ويعطي 401.

## 2) كيف يعمل الربط

```
UI (React) → src/data/laravelApi.ts (fetch + Bearer token) → Laravel API
                     ↑
        src/auth/AuthContext.tsx (login / profile / logout)
```

- كل طلب يرسل: `Accept: application/json`، `Accept-Language: ar|en` حسب لغة الواجهة، و`Authorization: Bearer <token>` إن وُجد.
- عند رجوع **401** يُمسح التوكن تلقائيًا وتنتهي الجلسة.
- الأخطاء تُغلَّف في `ApiError` مع `status` و`errors` (أخطاء التحقق من Laravel).
- `resource()` factory يوفر لكل مورد: `list` / `listAll` (كل الصفحات) / `get` / `create` / `update` / `remove`.

## 3) ما هو **موجود فعليًا** على Laravel (تم فحصه مباشرة)

| المسار | الحالة | ملاحظات |
|---|---|---|
| `POST /login`, `POST /register`, `GET /profile`, `POST /logout`, `POST /change-password` | 200 | المصادقة كاملة |
| `GET /dashboard` | 200 | users, donors, donations, projects, programs, volunteers, total_donations, active_projects, active_programs |
| `GET /reports` | 200 | إجماليات |
| `/users` | 200 | مع الأدوار المضمّنة |
| `/roles`, `/permissions` | 200 | Super Admin / Editor / … + صلاحيات modules |
| `/donors` | 200 | فارغ حاليًا |
| `/donations` | 200 | فارغ حاليًا |
| `/programs` | 200 | حقول: `name`, `description`, `is_active` |
| `/projects` | 200 | حقول: `name`, `target_amount`, `collected_amount`, `is_active` |
| `/cases` | 200 | حقول: code, title, category, beneficiary_name, governorate, target_amount, priority, status |
| `/articles` | 200 | ثنائي اللغة: `title_ar/title_en`, `content_ar/content_en`, `status` |
| `/faqs` | 200 | `question_ar/en`, `answer_ar/en`, `sort_order`, `is_active` |
| `/pages` | 200 | فارغ حاليًا |
| `/home-statistics`, `/achievements` | 200 | (+ `move-up` / `move-down`) |
| `/homepage-content` | **200** | تم تهيئته وربطه بنجاح |
| `/settings` | **500** | خطأ من السيرفر — يحتاج إصلاح من فريق Laravel |

**غير موجودة (404)** ولذلك ما زالت تعمل على الباك-إند السحابي:
`volunteers`, `beneficiaries`, `campaigns`, `stories`, `gallery`, `newsletter/subscribers`,
`contact-messages`, `payment-methods`, `donation-nodes`, `site-stats`, `activity-log`,
`categories`, `media`, `notifications`, `seasons`, `partners`, `testimonials`.

## 4) ما تم ربطه بالكامل الآن

| الجزء في الموقع | المصدر |
|---|---|
| تسجيل الدخول / الخروج / الجلسة / تغيير كلمة المرور | Laravel `/login`, `/profile`, `/logout`, `/change-password` |
| التسجيل (متبرع / متطوع / محرر) | Laravel `/register` |
| صفحة `/admin/users` (قائمة + تعديل الأدوار) | Laravel `/users` + `/roles` |
| صفحة `/admin/donors` | Laravel `/users` (المفلترة بدور donor) |
| صفحة `/admin/api-integration` | فحص حيّ لكل نقاط النهاية |
| عميل CRUD جاهز لكل الموارد أعلاه | `src/data/laravelApi.ts` |

## 5) ما هو **جاهز في العميل** وينتظر ربط الواجهة

`donorsApi`, `donationsApiV1`, `programsApiV1`, `projectsApiV1`, `casesApiV1`,
`articlesApi`, `faqsApi`, `pagesApi`, `statsApi`, `achievementsApi`.

سبب عدم تحويل الشاشات الآن: جداول Laravel المقابلة **فارغة** وشاشات
(`/admin/donations`, `/admin/programs`, `/admin/projects`, `/admin/cases`)
تعتمد حاليًا على حقول أغنى (صور، ترجمات، مراحل حالة، مرفقات) غير موجودة في مخطط Laravel.
التحويل يتم شاشة بشاشة بعد إضافة الحقول الناقصة على السيرفر.

مثال الاستخدام:

```ts
import { projectsApiV1 } from "@/data/laravelApi";

const all = await projectsApiV1.listAll();                 // كل الصفحات
await projectsApiV1.create({ name: "مشروع", target_amount: 5000 });
await projectsApiV1.update(1, { is_active: false });
await projectsApiV1.remove(1);
```

## 6) الخطوات التالية المطلوبة من فريق Laravel

1. إصلاح 500 في `/homepage-content` و`/settings`.
2. إضافة موارد: `campaigns`, `stories`, `gallery`, `newsletter`, `contact-messages`,
   `payment-methods`, `volunteers`, `notifications`, `activity-log`.
3. إضافة حقول ثنائية اللغة + الصور للمشاريع/البرامج/الحالات (`title_ar/en`, `image`, `slug`).
4. تفعيل CORS لنطاق `https://elyusr.org` ونطاق المعاينة.
5. رفع `per_page` المسموح أو دعم `?per_page=100` (مدعوم حاليًا).
