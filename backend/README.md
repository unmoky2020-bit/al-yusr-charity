# اليسر — Portable Backend (MySQL / MongoDB / PHP / Node / Laravel)

واجهة الـ Frontend (React) تتكلم مع الباك إند عبر **REST API** موحّد، بصرف النظر عن التخزين تحته:

| Provider     | Stack          | الملف                              |
|--------------|----------------|-----------------------------------|
| `supabase`   | Lovable Cloud  | `src/integrations/supabase/*`     |
| `rest`       | Node/PHP/Laravel + MySQL أو MongoDB | `backend/node` أو `backend/php`   |

## التبديل بين المزوّدين
ضع في ملف `.env` عند الـ Frontend:
```
VITE_DATA_PROVIDER=rest          # أو supabase (الافتراضي)
VITE_API_BASE_URL=https://api.elyusr.org
```

## ENV للـ Backend (موحّد لكل المزوّدين)
```
# عام
APP_ENV=production
APP_PORT=8080
APP_CORS_ORIGIN=https://elyusr.org
JWT_SECRET=replace-with-strong-secret

# قاعدة البيانات — اختر واحد
DB_DRIVER=mysql                  # mysql | mongo

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=alyusr
MYSQL_USER=alyusr
MYSQL_PASSWORD=changeme

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=alyusr

# تخزين الملفات (اختياري)
STORAGE_DRIVER=local             # local | s3
STORAGE_PATH=./storage
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## التشغيل بأمر واحد
```bash
bash backend/setup.sh
```
الـ script:
1. ينشئ DB ويشغل الـ migrations.
2. يحقن البيانات الأوّلية (11 فئة + admin).
3. يشغّل Node API على `:8080`.

## الـ Endpoints
| Method | Path                              | الوصف                          |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/categories`                 | قائمة فئات الحالات             |
| GET    | `/api/cases`                      | حالات عامة (approved/funded)   |
| GET    | `/api/cases/:ref`                 | تفاصيل حالة + التحديثات        |
| POST   | `/api/cases`                      | إنشاء حالة (Auth)              |
| PATCH  | `/api/cases/:id/status`           | تغيير الحالة (Admin/CaseMgr)   |
| DELETE | `/api/cases/:id`                  | حذف (Admin)                    |
| GET    | `/api/cases/:id/updates`          | تحديثات الأثر                   |
| POST   | `/api/cases/:id/updates`          | نشر تحديث (Auth)               |
| GET    | `/api/donations/me`               | تبرعاتي                         |
| POST   | `/api/donations`                  | تسجيل تبرع                      |
| POST   | `/api/auth/login`                 | تسجيل الدخول                   |
| POST   | `/api/auth/register`              | تسجيل (donor/volunteer)        |

الـ Response دائمًا JSON بنفس شكل `casesApi.ts` فالـ Frontend مش بيفرّق.

## Laravel
ادخل `backend/php` واتبع `LARAVEL.md` — نفس الـ schema (`backend/sql/schema.sql`) ونفس المسارات.