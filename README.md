# مؤسسة اليسر الخيرية — Al-Yusr Charity Platform

> **الحالة الراهنة:** فرونت-إند كامل (React/Vite) متصل بـ Supabase.
> **الهدف المقبل:** الهجرة إلى Laravel REST API مع الحفاظ على الفرونت بأقل تعديل ممكن.

---

## جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [مكدس التقنيات](#2-مكدس-التقنيات)
3. [متغيرات البيئة .env](#3-متغيرات-البيئة-env)
4. [هيكل المشروع](#4-هيكل-المشروع)
5. [الصفحات والمسارات Routes](#5-الصفحات-والمسارات-routes)
6. [طبقة البيانات Data Layer](#6-طبقة-البيانات-data-layer)
7. [المصادقة والصلاحيات Auth and Roles](#7-المصادقة-والصلاحيات-auth-and-roles)
8. [قاعدة البيانات Supabase Schema](#8-قاعدة-البيانات-supabase-schema)
9. [Edge Functions](#9-edge-functions)
10. [نظام التصميم](#10-نظام-التصميم)
11. [الترجمة i18n](#11-الترجمة-i18n)
12. [التشغيل المحلي والبناء](#12-التشغيل-المحلي-والبناء)
13. [خريطة الهجرة إلى Laravel](#13-خريطة-الهجرة-إلى-laravel)

---

## 1. نظرة عامة

**Al-Yusr** هو موقع مؤسسة اليسر الخيرية بالمنصورة (الدقهلية، مصر). يوفر:

- **واجهة عامة** للتبرع، وعرض الحالات والمشاريع والبرامج، وصكوك الأضحية، والمزارع الوقفية، والمدونة.
- **لوحة تحكم Admin** كاملة لإدارة التبرعات، الحالات، المتطوعين، المحتوى، التقارير، والإعدادات.
- **دعم ثنائي اللغة** عربي/إنجليزي مع دعم RTL/LTR تلقائي.
- **SEO متقدم** عبر `react-helmet-async` وبيانات JSON-LD هيكلية.

الموقع الحي: **https://elyusr.pyramedx.com/**

---

## 2. مكدس التقنيات

| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| **UI Framework** | React | 18.3 |
| **Build Tool** | Vite | 5.4 |
| **Language** | TypeScript | 5.8 |
| **Styling** | Tailwind CSS | 3.4 |
| **Component Lib** | shadcn/ui (Radix UI primitives) | - |
| **Routing** | react-router-dom | 6.30 |
| **Server State** | @tanstack/react-query | 5.83 |
| **Forms** | react-hook-form + zod | 7.61 / 3.25 |
| **Animations** | GSAP + ScrollTrigger | 3.15 |
| **Smooth Scroll** | Lenis | 1.3 |
| **Maps** | Leaflet + react-leaflet | 1.9 / 4.2 |
| **Charts** | Recharts | 2.15 |
| **PDF Export** | jsPDF | 4.2 |
| **SEO** | react-helmet-async | 3.0 |
| **Backend (حالي)** | Supabase (PostgreSQL + Auth + Storage) | - |
| **Backend (هدف)** | Laravel 11 + Sanctum | - |
| **Testing** | Vitest + @testing-library/react | 3.2 / 16.0 |

---

## 3. متغيرات البيئة .env

```env
# Supabase (الحالي)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...

# Laravel REST API (المستقبل)
VITE_API_BASE_URL=http://localhost:8000
VITE_DATA_PROVIDER=supabase   # او "rest" للتبديل للـ Laravel
```

**مفتاح التبديل:** `VITE_DATA_PROVIDER`
- `supabase` (الافتراضي) → الفرونت يتكلم مع Supabase مباشرة.
- `rest` → الفرونت يتكلم مع `VITE_API_BASE_URL` (Laravel) عبر `src/data/restApi.ts`.

---

## 4. هيكل المشروع

```
Al-Yusr/
├── .env                          # متغيرات البيئة (لا يُرفع للـ Git)
├── index.html                    # Shell HTML + preloads
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── components.json               # shadcn/ui config
│
├── src/
│   ├── main.tsx                  # نقطة الدخول
│   ├── App.tsx                   # كل الـ Routes + Providers
│   ├── index.css                 # Design tokens (HSL) + utility classes
│   │
│   ├── auth/                     # طبقة المصادقة
│   │   ├── AuthContext.tsx        # Provider الرئيسي (Supabase Auth حالياً)
│   │   ├── RequireAuth.tsx        # Route Guard -- يحمي صفحات الـ admin
│   │   ├── permissions.ts         # تعريف الـ Permission types + inferPermissions()
│   │   └── authUtils.ts           # buildUserFromSession() helper
│   │
│   ├── integrations/supabase/    # عميل Supabase (مولَّد تلقائياً)
│   │   ├── client.ts             # createClient() مع env vars
│   │   └── types.ts              # Database types (مولَّدة من schema)
│   │
│   ├── data/                     # طبقة البيانات
│   │   ├── restApi.ts            # REST adapter للـ Laravel (جاهز للتبديل)
│   │   ├── casesApi.ts           # CRUD الحالات -- يدعم Supabase + REST
│   │   ├── blogApi.ts            # Blog posts API
│   │   ├── storiesApi.ts         # Success stories API
│   │   ├── galleryApi.ts         # Gallery API
│   │   ├── servicesApi.ts        # Services API
│   │   ├── campaignsApi.ts       # Campaigns API
│   │   ├── usersApi.ts           # Users API
│   │   ├── paymentMethodsApi.ts  # Payment methods
│   │   ├── donationsStore.ts     # Donations local state (mock)
│   │   ├── contentStore.ts       # CMS content local state
│   │   ├── programs.ts           # بيانات البرامج (static data)
│   │   ├── blog.ts               # بيانات المدونة الكاملة (170KB static)
│   │   ├── blogTaxonomy.ts       # تصنيفات المدونة
│   │   ├── seasons.ts            # بيانات المواسم (رمضان، عيد...)
│   │   ├── servicePagesConfig.ts # تكوين صفحات الخدمات (47KB)
│   │   ├── servicesMap.ts        # بيانات خريطة الخدمات
│   │   ├── geoPages.ts           # بيانات الصفحات الجغرافية
│   │   ├── dakahliaCities.ts     # مدن الدقهلية + إحداثيات
│   │   ├── qurbaniFaq.ts         # FAQ صكوك الأضحية
│   │   ├── campaignsSettings.ts  # إعدادات الحملات
│   │   ├── internalLinks.ts      # روابط داخلية للـ SEO
│   │   ├── admin-mock.ts         # mock data للـ admin (قديم)
│   │   └── useBlogPosts.ts       # Hook للمدونة
│   │
│   ├── components/
│   │   ├── common/               # SEOHelmet, Breadcrumbs, SmoothScroll...
│   │   ├── layout/               # Navbar, Footer, PageLayout, AdminLayout
│   │   ├── sections/             # أقسام الصفحة الرئيسية (37 component)
│   │   ├── donate/               # مكونات تدفق التبرع
│   │   ├── services/             # مكونات صفحات الخدمات
│   │   ├── admin/                # مكونات لوحة الـ admin
│   │   └── ui/                   # shadcn/ui primitives
│   │
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   │
│   ├── i18n/
│   │   ├── LangContext.tsx       # Context + Provider اللغة
│   │   └── translations.ts       # كل النصوص عربي/إنجليزي
│   │
│   ├── lib/
│   │   ├── utils.ts              # cn() helper
│   │   ├── prefetch.ts           # prefetch on hover/focus
│   │   └── track.ts              # تتبع الأحداث (GA/Facebook Pixel)
│   │
│   └── pages/
│       ├── Index.tsx             # الصفحة الرئيسية
│       ├── auth/                 # صفحات المصادقة (5 صفحات)
│       ├── admin/                # لوحة التحكم (43 صفحة)
│       ├── site/                 # الصفحات التعريفية (20 صفحة)
│       ├── landings/             # Landing pages إعلانية (6 صفحات)
│       └── ...                   # باقي الصفحات (23 ملف)
│
├── supabase/
│   ├── config.toml
│   ├── functions/                # Edge Functions
│   │   ├── payments-webhook/
│   │   ├── upload-case-media/
│   │   └── seed-demo-users/
│   └── migrations/               # 56 ملف migration
│
├── backend/                      # Laravel Backend (منفصل)
├── public/                       # Static assets + sitemap
└── scripts/
    └── generate-sitemap.ts       # يُشغَّل قبل dev/build
```

---

## 5. الصفحات والمسارات Routes

### 5.1 الصفحات العامة (Public)

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/` | `pages/Index.tsx` | الصفحة الرئيسية |
| `/programs` | `pages/site/Projects.tsx` | قائمة البرامج والمشاريع |
| `/programs/:slug` | `pages/ProgramDetail.tsx` | تفاصيل برنامج |
| `/programs/:slug/:option` | `pages/ProgramOptionDetail.tsx` | خيار داخل برنامج |
| `/geo/:governorate/:program` | `pages/GeoProgram.tsx` | برنامج حسب المحافظة |
| `/dakahlia/:city/:program` | `pages/CityProgram.tsx` | برنامج حسب المدينة |
| `/donate` | `pages/DonatePage.tsx` | تدفق التبرع متعدد الخطوات (64KB) |
| `/donate/:city` | `pages/site/DonateCity.tsx` | تبرع مخصص لمدينة |
| `/donate/track` | `pages/DonationTracking.tsx` | تتبع التبرع |
| `/donate/track/:ref` | `pages/DonationTracking.tsx` | تتبع بمرجع محدد |
| `/donate/status/:ref` | `pages/DonationStatus.tsx` | حالة عملية الدفع |
| `/qurbani` | `pages/QurbaniLanding.tsx` | Landing صكوك الأضحية |
| `/qurbani/:city` | `pages/QurbaniCity.tsx` | أضحية حسب المدينة |
| `/qurbani/confirm` | `pages/QurbaniConfirm.tsx` | تأكيد طلب الأضحية |
| `/cases` | `pages/site/Cases.tsx` | قائمة الحالات الإنسانية |
| `/cases/:ref` | `pages/site/CaseDetail.tsx` | تفاصيل حالة |
| `/projects` | `pages/site/Projects.tsx` | المشاريع |
| `/zakat` | `pages/site/Zakat.tsx` | حاسبة الزكاة |
| `/about` | `pages/site/About.tsx` | عن المؤسسة |
| `/contact` | `pages/site/Contact.tsx` | التواصل |
| `/stories` | `pages/site/Stories.tsx` | قصص النجاح |
| `/stories/:slug` | `pages/site/StoryDetail.tsx` | قصة نجاح |
| `/farm` | `pages/site/Farm.tsx` | المزارع الوقفية |
| `/trust` | `pages/site/Trust.tsx` | الشفافية والمصداقية |
| `/volunteer` | `pages/site/Volunteer.tsx` | التطوع |
| `/campaigns` | `pages/site/Campaigns.tsx` | حملات التبرع |
| `/campaigns/:slug` | `pages/site/CampaignDetail.tsx` | تفاصيل حملة |
| `/seasons/:slug` | `pages/site/SeasonDetail.tsx` | موسم (رمضان، عيد...) |
| `/blog` | `pages/Blog.tsx` | المدونة |
| `/blog/:slug` | `pages/BlogPost.tsx` | مقال |
| `/blog/category/:slug` | `pages/BlogCategory.tsx` | تصنيف |
| `/blog/author/:slug` | `pages/BlogAuthor.tsx` | مؤلف |
| `/services-map` | `pages/site/ServicesMap.tsx` | خريطة الخدمات |
| `/services/:slug` | `pages/site/services/ServiceRouter.tsx` | صفحة خدمة ديناميكية |
| `/axes/:slug` | `pages/site/AxisDetail.tsx` | محور عمل |
| `/gallery` | `pages/site/Gallery.tsx` | معرض الصور |
| `/privacy` | `pages/site/Privacy.tsx` | سياسة الخصوصية |
| `/terms` | `pages/site/Terms.tsx` | الشروط والأحكام |
| `/dashboard` | `pages/DonorDashboard.tsx` | لوحة تحكم المتبرع |
| `/newsletter/confirm` | `pages/NewsletterAction.tsx` | تأكيد الاشتراك |
| `/newsletter/unsubscribe` | `pages/NewsletterAction.tsx` | إلغاء الاشتراك |

### 5.2 Landing Pages إعلانية

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/c/:slug` | `pages/AdLanding.tsx` | Landing إعلانية ديناميكية |
| `/markoun` | `landings/MarkounLanding.tsx` | حملة مركون |
| `/charity-mansoura` | `landings/CharityMansouraLanding.tsx` | خيرية المنصورة |
| `/food-box` | `landings/FoodBoxLanding.tsx` | صندوق الغذاء |
| `/qurbani-guarantee` | `landings/QurbaniGuaranteeLanding.tsx` | ضمان الأضحية |
| `/khabia` | `landings/KhabiaLanding.tsx` | برنامج الخبية |
| `/dhill` | `landings/DhillLanding.tsx` | برنامج الظل |

### 5.3 صفحات المصادقة

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/login` | `pages/auth/Login.tsx` | تسجيل الدخول |
| `/register` | `pages/auth/Register.tsx` | تسجيل عام |
| `/register/donor` | `pages/auth/RegisterDonor.tsx` | تسجيل متبرع |
| `/register/volunteer` | `pages/auth/RegisterVolunteer.tsx` | تسجيل متطوع |
| `/register/editor` | `pages/auth/Register.tsx` | طلب صلاحية محرر (يحتاج موافقة admin) |
| `/profile` | `pages/auth/Profile.tsx` | الملف الشخصي |

> **ملاحظة:** في `App.tsx` توجد Routes مكررة (السطور 217-222) هي dead code — React Router يأخذ أول تطابق.

### 5.4 لوحة التحكم Admin -- محمية بـ RequireAuth

| المسار | الصلاحية المطلوبة | الوصف |
|--------|-------------------|-------|
| `/admin` | admin, editor, caseworker, volunteer | Dashboard الرئيسي |
| `/admin/analytics` | admin, caseworker | التحليلات |
| `/admin/donations` | admin, caseworker | التبرعات |
| `/admin/donations/audit` | admin فقط | مراجعة التبرعات |
| `/admin/donations/:id` | admin, caseworker | تفاصيل تبرع |
| `/admin/cases` | admin, caseworker, volunteer | الحالات |
| `/admin/cases/:id` | admin, caseworker, volunteer | تفاصيل حالة |
| `/admin/projects` | admin, caseworker | المشاريع |
| `/admin/projects/:id` | admin, caseworker | تفاصيل مشروع |
| `/admin/programs` | admin, editor, caseworker | البرامج |
| `/admin/content` | admin, editor | إدارة المحتوى |
| `/admin/content-editor` | admin, editor | محرر المحتوى |
| `/admin/campaigns-section` | admin, editor | قسم الحملات |
| `/admin/review` | admin, editor | مراجعة المحتوى |
| `/admin/my-tasks` | جميع الأدوار | مهامي |
| `/admin/my-cases` | مفتوح! (ثغرة) | حالاتي |
| `/admin/delegates` | مفتوح! (ثغرة) | المندوبون |
| `/admin/reports` | admin, caseworker | التقارير |
| `/admin/volunteers` | admin, caseworker | المتطوعون |
| `/admin/campaigns` | جميع الأدوار | الحملات |
| `/admin/campaigns/:id` | جميع الأدوار | تفاصيل حملة |
| `/admin/donors` | admin, caseworker | المتبرعون |
| `/admin/donors/:id` | admin فقط | تفاصيل متبرع |
| `/admin/users` | admin فقط | المستخدمون |
| `/admin/payment-methods` | admin فقط | وسائل الدفع |
| `/admin/payment-methods/:id` | admin فقط | تفاصيل وسيلة دفع |
| `/admin/permissions` | admin فقط | الصلاحيات |
| `/admin/activity` | admin فقط | سجل النشاط |
| `/admin/blog-seo` | admin, editor | SEO المدونة |
| `/admin/seo-audit` | admin, editor | تدقيق SEO |
| `/admin/blog-seo/:slug` | admin, editor | تعديل مقال |
| `/admin/stories` | admin, editor | قصص النجاح |
| `/admin/stories/new` | admin, editor | قصة جديدة |
| `/admin/stories/:id` | admin, editor | تعديل قصة |
| `/admin/services` | admin, editor | الخدمات |
| `/admin/services/:slug` | admin, editor | تعديل خدمة |
| `/admin/newsletter` | admin فقط | النشرة البريدية |
| `/admin/newsletter/campaigns` | admin فقط | حملات النشرة |
| `/admin/donation-nodes` | admin فقط | نقاط التبرع |
| `/admin/transactions` | admin, caseworker | المعاملات المالية |
| `/admin/ad-campaigns` | admin, editor | الحملات الإعلانية |
| `/admin/campaign-results` | admin, editor | نتائج الحملات |
| `/admin/site-stats` | admin, editor | إحصائيات الموقع |
| `/admin/gallery` | admin فقط | المعرض |
| `/admin/seasons` | admin, editor | المواسم |
| `/admin/profile` | جميع الأدوار | الملف الشخصي |

---

## 6. طبقة البيانات Data Layer

### 6.1 نظام ثنائي (Dual Provider)

الفرونت مبني بنظام ثنائي المزود -- يمكن التبديل بمتغير واحد:

```
VITE_DATA_PROVIDER=supabase  →  يستخدم @supabase/supabase-js مباشرة
VITE_DATA_PROVIDER=rest      →  يستخدم src/data/restApi.ts (fetch API)
```

**`src/data/restApi.ts`** -- REST Adapter جاهز للـ Laravel:
- يقرأ التوكن من `localStorage` (key: `alyusr_token`)
- يرسل `Authorization: Bearer <token>` مع كل طلب
- يتحدث مع `VITE_API_BASE_URL` (افتراضي: `http://localhost:8080`)
- Endpoints المعرَّفة حالياً: auth/login، auth/register، cases، donations/me

### 6.2 البيانات الثابتة (Static Data)

جزء كبير من الفرونت يعمل ببيانات ثابتة محلية في `src/data/`:

| الملف | الحجم | الوصف |
|-------|-------|-------|
| `blog.ts` | 170KB | بيانات المدونة كاملة |
| `servicePagesConfig.ts` | 47KB | تكوين صفحات الخدمات |
| `programs.ts` | 33KB | تعريفات البرامج |
| `servicesMap.ts` | 27KB | خريطة الخدمات |
| `seasons.ts` | 23KB | بيانات المواسم |
| `casesApi.ts` | 20KB | الحالات (يدعم Supabase + REST) |
| `storiesApi.ts` | 17KB | قصص النجاح |
| `geoPages.ts` | 14KB | الصفحات الجغرافية |
| `galleryImages.ts` | 13KB | صور المعرض |
| `dakahliaCities.ts` | 9KB | مدن الدقهلية |

> **ملاحظة للهجرة:** هذه البيانات يجب تحويلها لـ API endpoints في Laravel.

---

## 7. المصادقة والصلاحيات Auth and Roles

### 7.1 النظام الحالي (Supabase)

```
AuthContext.tsx
  supabase.auth.signInWithPassword()   →  Session
  supabase.from("profiles").select()   →  profile data
  supabase.from("user_roles").select() →  roles[]

  الحالة تُخزَّن في: React Context
  التوكن يُخزَّن في: localStorage (تلقائياً بـ Supabase)
```

### 7.2 الأدوار (Roles)

| Role (Frontend) | Role (DB) | الصلاحيات |
|-----------------|-----------|-----------|
| `admin` | `admin` | كل شيء |
| `editor` | `editor` | المحتوى، البرامج، الحملات، SEO |
| `caseworker` | `case_manager` | الحالات، التبرعات، المتطوعون |
| `volunteer` | `volunteer` | حالاته ومهامه فقط |
| `delegate` | `delegate` | مندوب توزيع |
| `donor` | `donor` | لوحة تبرعاته وملفه الشخصي |

> **alias:** `caseworker` في الفرونت = `case_manager` في DB (يُحوَّل تلقائياً في `toDbRole()`).

### 7.3 الصلاحيات الدقيقة (Permissions) -- للمتطوعين

| Permission | الوصف |
|-----------|-------|
| `content.write` | كتابة/تعديل المقالات والمحتوى |
| `content.publish` | نشر (بدونه يبقى مسودة) |
| `distribution.manage` | إدارة قوائم التوزيع |
| `cases.manage` | إنشاء/تعديل الحالات |
| `media.upload` | رفع الصور والفيديو |
| `field.coordinate` | تنسيق الفرق الميدانية |
| `donations.verify` | اعتماد إيصالات التحويل |

تُستنتج تلقائياً من مهارات المتطوع عبر `inferPermissions()` في `permissions.ts`.

### 7.4 Route Guard

```tsx
// src/auth/RequireAuth.tsx
<RequireAuth roles={["admin", "editor"]}>
  <AdminContent />
</RequireAuth>
// غير مسجل  → redirect /login
// دور غير مسموح → redirect /
```

### 7.5 حسابات الديمو

| البريد | كلمة المرور | الدور |
|--------|------------|-------|
| `admin@elyusr.org` | `admin123` | admin |
| `editor@elyusr.org` | `editor123` | case_manager |
| `ahmed.v@example.com` | `vol123` | volunteer |
| `mahmoud@example.com` | `donor123` | donor |

لإعادة إنشائها:
```
POST /functions/v1/seed-demo-users
```

---

## 8. قاعدة البيانات Supabase Schema

### 8.1 الجداول الأساسية

```sql
-- المستخدمون (يُنشأ تلقائياً عبر trigger handle_new_user)
profiles (
  id UUID FK→auth.users,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills JSONB,
  preferred_program TEXT,
  volunteer_status TEXT,  -- pending/approved/rejected/suspended
  created_at TIMESTAMPTZ
)

-- الأدوار (منفصلة عن profiles لمنع تصعيد الصلاحيات)
user_roles (
  id UUID PK,
  user_id UUID FK→auth.users,
  role app_role  -- ENUM: admin/editor/case_manager/volunteer/delegate/donor
)

-- الحالات الإنسانية
cases (
  id UUID PK,
  ref TEXT UNIQUE,
  title TEXT,
  description TEXT,
  category_id UUID FK→case_categories,
  target_amount NUMERIC,
  collected_amount NUMERIC,
  status TEXT,  -- active/completed/suspended
  beneficiary_name TEXT,
  city TEXT,
  created_by UUID FK→auth.users,
  created_at TIMESTAMPTZ
)

case_categories (id, name_ar, name_en, slug, icon)
case_documents (id, case_id, url, type, created_at)
case_updates (id, case_id, body, image_url, created_by, created_at)

-- التبرعات
donations (
  id UUID PK,
  ref TEXT UNIQUE,
  donor_id UUID FK→auth.users,  -- nullable للتبرع بدون حساب
  case_id UUID,
  program TEXT,
  amount NUMERIC,
  currency TEXT,
  payment_method TEXT,
  status TEXT,  -- pending/confirmed/failed/refunded
  created_at TIMESTAMPTZ
)

-- المتبرعون (منفصلون عن auth.users -- متبرع ممكن بدون حساب)
donors (
  id UUID PK,
  name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  total_donated NUMERIC,
  donations_count INT
)
```

56 ملف migration في `supabase/migrations/` تتتبع كل التغييرات.

### 8.2 Security (RLS)

- كل جدول عليه **Row Level Security** مفعّل.
- التحقق من الأدوار عبر دالة `public.has_role(uid, role)`.
- المتبرع يرى تبرعاته فقط، الـ admin يرى الكل.

---

## 9. Edge Functions

| الدالة | المسار | الوصف |
|--------|--------|-------|
| `payments-webhook` | `/functions/v1/payments-webhook` | Webhook لبوابات الدفع |
| `upload-case-media` | `/functions/v1/upload-case-media` | رفع وسائط الحالات |
| `seed-demo-users` | `/functions/v1/seed-demo-users` | إعادة ضبط حسابات الديمو |

---

## 10. نظام التصميم

### 10.1 نظام الألوان (HSL Tokens) -- في `src/index.css`

```css
:root {
  --primary: 25 95% 50%;      /* برتقالي */
  --secondary: 45 90% 55%;    /* ذهبي */
  --accent: 160 60% 40%;      /* أخضر */
  --whatsapp: 142 70% 45%;
  --background: 0 0% 100%;
  --foreground: 220 15% 15%;
  --muted: 220 15% 96%;
  --card: 0 0% 100%;
}
```

**قاعدة:** لا تكتب `text-white` او `bg-black` مباشرة -- استخدم `text-primary`، `bg-background` إلخ.

### 10.2 Utility Classes المخصصة

```css
.bg-orange-grad       /* تدرج برتقالي */
.pattern-hero-luxe    /* نمط خلفية Hero */
.shadow-cta           /* ظل CTA buttons */
.shadow-card          /* ظل البطاقات */
```

### 10.3 المكتبات المرئية

- **shadcn/ui** -- primitives: Button, Card, Dialog, Sheet, Table, Tabs, Select, Badge, Avatar...
- **GSAP + ScrollTrigger** -- animations عند الـ scroll
- **Lenis** -- smooth scrolling
- **Lucide React** -- icons

---

## 11. الترجمة i18n

```tsx
// src/i18n/LangContext.tsx
const { t, lang, setLang } = useLang();

// src/i18n/translations.ts
const translations = {
  ar: { donate_now: "تبرع الآن", ... },
  en: { donate_now: "Donate Now", ... },
};
```

- اللغة الافتراضية: **العربية** (RTL).
- عند التبديل للإنجليزية: `document.dir = "ltr"` يتغير تلقائياً.
- جميع النصوص في `translations.ts` -- لا نصوص hard-coded في الـ components.

---

## 12. التشغيل المحلي والبناء

```bash
npm install

npm run dev        # http://localhost:8080 (يولد sitemap أولاً)
npm run build      # بناء للإنتاج
npm run build:dev  # بناء بـ dev mode
npm run preview    # معاينة الـ build
npm run lint       # فحص الكود
npm test           # vitest run (one-shot)
npm run test:watch # vitest watch
```

### ملف `.env` للتطوير المحلي مع Supabase

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUz...
```

### ملف `.env` للتطوير مع Laravel

```env
VITE_DATA_PROVIDER=rest
VITE_API_BASE_URL=http://localhost:8000
```

---

## 13. توثيق وربط Laravel Backend (Charity API v1)

تم ربط الواجهة الأمامية بالكامل بخادم **Laravel API v1** الحي عبر عميل مخصص ونظام مصادقة Sanctum.

- **Base URL:** `https://elyusr-api.pyramedx.com/api/v1`
- **متغير البيئة:** `VITE_API_BASE_URL` (يمكن تغييره من `.env`)
- **المصادقة:** **Laravel Sanctum Bearer Token** مخزن في `localStorage['alyusr_api_token']`
- **ملف العميل الموحد:** [`src/data/laravelApi.ts`](file:///d:/desk/Al-Yusr_%20Compassionate%20Journeys%20(1)/src/data/laravelApi.ts)
- **لوحة الفحص والمراقبة المباشرة:** [`/admin/api-integration`](http://localhost:8080/admin/api-integration)

### 13.1 بيانات الدخول المعتمدة
| الحساب | البريد الإلكتروني | كلمة المرور | الدور في Laravel |
|---|---|---|---|
| **المدير العام** | `admin@alyusr.com` | (محفوظة في مدير كلمات المرور، لا تُكتب هنا) | `Super Admin` |

> [!NOTE]
> الحساب القديم `admin@elyusr.org / admin123` غير موجود على خادم Laravel ويعطي `401 Unauthorized`.

---

### 13.2 معمارية الربط (Integration Architecture)

```
React UI Components / Pages
        │
        ▼
AuthContext.tsx ──(Token State)──► localStorage['alyusr_api_token']
        │
        ▼
src/data/laravelApi.ts (Bearer Token + JSON + Multi-language)
        │
        ▼
Laravel Charity API (https://elyusr-api.pyramedx.com/api/v1)
```

- كل طلب يرسل تلقائياً: `Accept: application/json`، `Accept-Language: ar|en` حسب لغة واجهة الموقع الحالية، و`Authorization: Bearer <token>`.
- عند استقبال كود **401** يتم تصفية التوكن وإعادة توجيه المستخدم لصفحة تسجيل الدخول بأمان.
- معالجة الأخطاء مغلفة في كائن `ApiError` لاستخراج رسائل تحقق Laravel (`validation errors`).

---

### 13.3 حالة الموارد ونقاط النهاية (Endpoint Live Status)

| المسار | الحالة المباشرة | الوظيفة وحالة الربط |
|---|:---:|---|
| `POST /login` | **200 OK** | تسجيل دخول المدير / المستخدمين (مربوط في `AuthContext`) |
| `POST /register` | **200 OK** | تسجيل متبرع / متطوع جديد |
| `GET /profile` | **200 OK** | استعادة بيانات الجلسة والمستخدم الحالي |
| `POST /logout` | **200 OK** | إنهاء الجلسة وإبطال التوكن |
| `POST /change-password` | **200 OK** | تغيير كلمة المرور للمستخدم المسجل |
| `GET /dashboard` | **200 OK** | إحصائيات لوحة التحكم والتحليلات الرئيسية |
| `GET /reports` | **200 OK** | التقارير المالية والإجماليات |
| `GET/POST/PUT /users` | **200 OK** | إدارة المستخدمين وتعيين الأدوار (`/admin/users`) |
| `GET /roles`, `/permissions` | **200 OK** | جلب مصفوفة الأدوار والصلاحيات من Laravel |
| `GET /homepage-content` | **200 OK** | بيانات ونصوص الصفحة الرئيسية الديناميكية |
| `GET/POST /programs` | **200 OK** | عميل CRUD جاهز (`programsApiV1`) |
| `GET/POST /projects` | **200 OK** | عميل CRUD جاهز (`projectsApiV1`) |
| `GET/POST /cases` | **200 OK** | عميل CRUD جاهز (`casesApiV1`) |
| `GET/POST /articles` | **200 OK** | مقالات المدونة ثنائية اللغة (`articlesApi`) |
| `GET/POST /faqs` | **200 OK** | الأسئلة الشائعة (`faqsApi`) |
| `GET /home-statistics`, `/achievements` | **200 OK** | أرقام وإنجازات المؤسسة المعروضة في الرئيسية |
| `GET /settings` | **500 Error** | قيد المعالجة من قبل فريق تطوير الباك-إند |

---

### 13.4 ما تم ربطه وتفعيله بالكامل في الواجهة

1. **دورة المصادقة والأمان:** (`AuthContext.tsx`) تسجيل دخول، استعادة جلسة، تسجيل خروج، تغيير كلمة مرور عبر Sanctum.
2. **إدارة المستخدمين والأدوار:** صفحة [`/admin/users`](http://localhost:8080/admin/users) متصلة مباشرة مع Laravel API لجلب المستخدمين وتحديث أدوارهم وصلاحياتهم.
3. **شاشة فحص وتكامل الـ API:** صفحة [`/admin/api-integration`](http://localhost:8080/admin/api-integration) لمراقبة سرعة استجابة السيرفر وتفاصيل التوكن وفحص كل نقطة نهاية مباشرة.
4. **بيانات الصفحة الرئيسية:** ربط البانر والإحصائيات ببيانات `/homepage-content` و`/home-statistics`.
5. **عميل برمجي شامل (Full SDK):** جميع الموارد لها دوال CRUD مكتوبة وجاهزة في `src/data/laravelApi.ts` للاستخدام المباشر.

---

## ملاحظات مهمة لكل مطور

1. **التعامل مع الـ API:** اعتمد على الدوال المعرفة في [`src/data/laravelApi.ts`](file:///d:/desk/Al-Yusr_%20Compassionate%20Journeys%20(1)/src/data/laravelApi.ts) بدلاً من استدعاء `fetch` بشكل مباشر.
2. **نظام الألوان:** لا تكتب أكواد ألوان صريحة (`hex/rgb`) — استخدم CSS design tokens المعرفة في `index.css`.
3. **الترجمة واللغات:** كل نص يظهر للمستخدم يجب أن يكون ثنائي اللغة ومدعوماً في `src/i18n/LangContext.tsx` أو مسترجعاً من الـ API بحقول `_ar` و`_en`.
4. **حماية الصفحات:** أي مسار إداري جديد يجب تغليفه بمكون `<RequireAuth>` مع تحديد الصلاحيات المطلوبة.

