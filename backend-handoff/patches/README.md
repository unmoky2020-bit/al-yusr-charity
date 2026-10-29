# تعديلات الباك إند — 29 أكتوبر 2026

**للمطور:** الكود على السيرفر بيتعدل مباشرة، ونسخة git اللي عليه قديمة. لو هترفع من نسختك، ادمج الملفات دي الأول، وإلا التعديلات هتتمسح.
قبل كل نشر اتاخدت نسخة احتياطية في `~/backups/<التاريخ-الاسم>/` على السيرفر.

## `2026-10-29-media-library/` — متنشر ✅
مكتبة الوسائط (`/media` و `/upload`)، وصورة غلاف المقال بقت تتقبل ملف أو رابط، وإيميل الكاتب مخفي عن العامة، وتصليح ترتيب قائمة المقالات. التفاصيل في الـ README جوه الفولدر.

## `2026-10-29-live/` — متنشر ✅ (آخر نسخة من كل ملف اتعدّل)

| التعديل | الملفات |
|---|---|
| الحالات: الزائر بيشوف `approved` و`completed` بس، والاسم مختصر ("محمد أ. خ.")، ومن غير السن والمدينة. الأدمن بيشوف كل حاجة | `Support/Viewer.php`, `CaseModelController`, `CaseResource` |
| المواسم: `GET /seasons` و `/seasons/{id}` متاحين للعامة. الزائر بيشوف النشط والبرامج المنشورة اللي مش مخفية | `SeasonController`, `routes` |
| حد لعدد الطلبات: login 10/دقيقة، register 5، donations/submit 20، donations/track 30 | `routes` |
| أي طلب من غير تسجيل دخول بيرجع JSON 401 بدل خطأ 500 (`Route [login] not defined`)، ورسالة 404 مبقتش بتكشف اسم الموديل | `bootstrap/app.php` |
| ترتيب الباقات: `POST /{programs\|projects\|donation-campaigns}/{id}/donation-packages/reorder` | `DonationPackageReorderController` |
| `GET /donation-campaigns/by-slug/{slug}` | `DonationCampaignController@showBySlug` |
| التقديم على حملات التطوع: `POST /volunteer-campaigns/{id}/apply`، و`GET/PATCH/DELETE /volunteer-applications` | `VolunteerApplicationController` (على الجداول الموجودة) |
| النشرة البريدية: `POST /newsletter/confirm` و `/newsletter/unsubscribe` بالـ token بس | `NewsletterTokenController` |
| قسم الحملات في الرئيسية: `GET/PUT /homepage/campaigns-section`، متخزن كصف JSON في `settings` | `HomepageCampaignsSectionController` |

## `2026-10-29-inbox-needs-migration/` — جاهز ومستني النشر ⏳
رسائل "تواصل معنا" وطلبات "الخبيئة": جدولين جداد، وصلاحيات، ومسارات عامة (عليها حد لعدد الطلبات) ومسارات إدارة.
الملفات مرفوعة على السيرفر في `~/stage-inbox` وعدّت `php -l`. `routes-api.full.php` فيه المسارات كلها، لكن الأسهل تاخد البلوكين من الملف وتحطهم في `routes/api.php` الحالي.

```bash
cd ~/stage-inbox && cp -r --parents app database ~/domains/api.elyusr.org/public_html/
cd ~/domains/api.elyusr.org/public_html
php artisan migrate --force          # بيعمل contact_messages و khabia_requests
php artisan db:seed --class=InboxPermissionSeeder --force
# بعدها ضيف بلوك المسارات العام وبلوك "Inbox" من routes-api.full.php، وشغّل: php artisan optimize:clear
```

## لسه محتاج migration (ما اتعملش)
- **الخدمات:** جدول `services` ناقصه أعمدة الصفحة (intro، stats، features، tiers، related، faqs، صور الهيرو)، وموديل `App\Models\Service` مش موجود رغم إن الكنترولر بيستخدمه.
- **حملات النشرة البريدية** (`newsletter_campaigns`)، و**شجرة التبرع** (`donation_nodes`)، و**تحديثات ووسائط الحالات** (`case_updates`, `case_media`).
- **حالات حضور المتطوع:** `attended` و`noshow` في enum الحالة بجدول `volunteer_campaign_applications`.
- **عمود `key`** على الباقات، و**`page_content` و`seo` و`faqs`** على الحملات.

## إضافات 29 أكتوبر (بعد الظهر) — متنشرة ✅ في `2026-10-29-live/`

| التعديل | الملفات |
|---|---|
| صور البرامج والمشاريع والحالات: `image` و`hero_image` و`cover_image` بقت تتقبل ملف **أو** رابط. الحذف بيمسح الملفات اللي العنصر نفسه رفعها بس (`programs/` و`projects/` و`cases/`)، ومش بيلمس صور مكتبة الوسائط | `Program*`, `Project*`, `Case*` (Requests و Controllers و Resources) |
| تصنيفات الحالات: باراميتر المسار `{caseCategory}` ما كانش مطابق لاسم المتغير `$case_category` في الكنترولر، فالتعديل والحذف ما كانوش بيشتغلوا خالص | `CaseCategoryController` |
| الحالة: `code` بقى اختياري، والسيرفر بيولّد `CASE-xxxxx`. `GET /cases/{id أو code}`. فلاتر `urgent=1` و`category_slug`. والـ resource فيه `is_urgent` و slug البرنامج والمشروع | `CaseModelController`, `CaseResource`, `StoreCaseModelRequest` |
| كاروسيل "حالات عاجلة": `GET/PUT /homepage/urgent-cases`، متخزن في `settings` (وضع تلقائي = `priority=high`، أو يدوي = أرقام حالات بترتيب) | `HomepageUrgentCasesController`, `routes` |
| مكتبة الوسائط: فولدر `cases` | `MediaController` |

**البيانات:** اتحذفت 8 حالات تجريبية و3 تصنيفات غلط، واتعملت 9 تصنيفات جديدة. نسخة كاملة من المحذوف في `backend-handoff/deleted-cases-backup-2026-10-29.json`.

## إضافات 29 أكتوبر (المساء) — متنشرة ✅ في `2026-10-29-live/`

قبل الـ migrations اتاخدت نسخة احتياطية كاملة من قاعدة البيانات: `~/backups/db/elyusr-20261029-063155.sql.gz` (57 جدول).
للرجوع: `zcat الملف | mysql -u USER -p DB`.

| التعديل | الملفات |
|---|---|
| **الإشعارات:** كلاس أساسي `AppNotification` بشكل موحّد `{type, title, message, url, severity}`. إشعار الترحيب كان بيتبعت مع **كل تسجيل دخول** (206 إشعار لـ 5 مستخدمين)، بقى بيتبعت مرة واحدة بس عند التسجيل، والمكرر اتمسح | `app/Notifications/*`, `AuthController` |
| `NotificationController`: فلاتر `unread` و`type`، و`unread-count` بيرجع `latest` عشان المتابعة تبقى خفيفة، و`DELETE /notifications/{id}` و`DELETE /notifications/read` | `NotificationController`, `routes` |
| **تواصل معنا والخبيئة:** الجداول اتعملت (migrate)، والصلاحيات اتعملت (seed)، والمسارات اشتغلت. وكل رسالة أو طلب جديد بيبعت إشعار للأدمن عن طريق `NotifyAdmins` | `Inbox/*`, `ContactMessage`, `KhabiaRequest`, `NotifyAdmins`, `New*Notification` |
