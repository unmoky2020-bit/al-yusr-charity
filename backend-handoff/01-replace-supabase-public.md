# 01 — استبدال Supabase في الموقع العام (Public) بـ Laravel

الملف ده موجّه لمطوّر الباك إند (Laravel). الواجهة اتشال منها أي استخدام لـ Supabase في الأجزاء العامة،
وبقت بتكلّم Laravel على `/api/v1`. أي حاجة مكتوب جنبها **🆕 جديد** يعني الـ endpoint مش موجود حالياً
(مش في Postman ولا بيرد في الـ live API) ولازم يتعمل. اللي مكتوب جنبه **✅ موجود** شغال بالفعل.

> قاعدة عامة اتطبّقت في الواجهة: أي عملية كتابة (POST/PUT/DELETE) لو رجعت غير 2xx الواجهة بتعرض خطأ حقيقي
> (مفيش "تم بنجاح" وهمي). القراءات العامة (صفحات الموقع) لو الـ endpoint فشل بترجع للمحتوى الثابت الحالي.

## ملخص الـ endpoints

| # | Method | Path | Auth | الحالة | الملف اللي بيناديه |
|---|---|---|---|---|---|
| 1 | POST | `/contact-messages` | عام + throttle | 🆕 | `src/data/api/contactApi.ts` ← `src/pages/site/Contact.tsx` |
| 2 | POST | `/khabia-requests` | عام + throttle | 🆕 | `src/data/api/contactApi.ts` ← `src/components/sections/KhabiaProgram.tsx` |
| 3 | POST | `/newsletter` | عام + throttle | ✅ | `newsletterApi.subscribe` في `laravelApi.ts` ← `Footer.tsx`, `Newsletter.tsx` |
| 4 | POST | `/newsletter/confirm` | عام (token) | 🆕 | `src/data/api/newsletterTokenApi.ts` ← `src/pages/NewsletterAction.tsx` |
| 5 | POST | `/newsletter/unsubscribe` | عام (token أو email) | 🆕 | نفس الملف |
| 6 | GET | `/cases/{id}/updates` | عام | 🆕 | `src/data/api/caseContentApi.ts` ← `CaseDetail.tsx`, `AdminCaseDetail.tsx` |
| 7 | POST | `/cases/{id}/updates` | staff | 🆕 | نفس الملف ← `AdminCaseDetail.tsx`, `AdminMyCases.tsx` |
| 8 | PUT / DELETE | `/case-updates/{id}` | staff | 🆕 | نفس الملف ← `AdminCaseDetail.tsx` |
| 9 | GET | `/cases/{id}/media` (`?all=1` للأدمن) | عام / staff | 🆕 | ← `CaseDetail.tsx`, `CaseMediaManager.tsx` |
| 10 | POST | `/cases/{id}/media` (multipart أو JSON) | staff | 🆕 | ← `CaseMediaManager.tsx` |
| 11 | POST | `/cases/{id}/media/upload` (multipart، ملف بس) | staff | 🆕 | ← صور التحديثات في `AdminCaseDetail.tsx`, `AdminMyCases.tsx` |
| 12 | PUT / DELETE | `/case-media/{id}` | staff | 🆕 | ← `CaseMediaManager.tsx` |
| 13 | POST | `/cases/{id}/media/reorder` | staff | 🆕 | ← `CaseMediaManager.tsx` |
| 14 | GET | `/cases/{id}/documents` | عام (public فقط) | 🆕 | ← `DonorDashboard.tsx`, `AdminCaseDetail.tsx` |
| 15 | GET | `/cases/{id}/journey` | عام | 🆕 | ← `CaseDetail.tsx` |
| 16 | GET | `/donation-nodes?parent_id=&slug=&active=1` | عام | 🆕 | `src/data/api/publicDonationNodesApi.ts` ← `DonationNodeSelector.tsx`, `ProgramDetail.tsx`, `ProgramOptionDetail.tsx` |
| 17 | GET | `/donation-nodes/{id}` | عام | 🆕 | نفس الملف ← `StoryDetail.tsx`, `DonationNodeSelector.tsx`, `ProgramDetail.tsx` |
| 18 | GET | `/services`, `/services/{slug}` | عام | 🆕 | `src/data/api/servicesRemoteApi.ts` ← `servicesApi.ts` (ServicesMap / ServiceRouter) |
| 19 | GET `?all=1` / POST / PUT / DELETE | `/services`, `/services/{slug}`, `POST /services/reorder` | staff | 🆕 | ← `AdminServices.tsx` (عبر `useServices.ts`) |
| 20 | GET | `/service-categories` | عام | 🆕 | `servicesRemoteApi.ts` |
| 21 | POST | `/gallery` (multipart `image`) | staff | ✅ | `src/data/galleryApi.ts` ← `AdminGallery.tsx` |
| 22 | GET | `/auth/{provider}/redirect`, `/auth/{provider}/callback` | عام | 🆕 (لاحقاً) | زراير Google/Facebook اتشالت من `Login.tsx` لحد ما يتعمل |

الـ CRUD الإداري لـ `donation_nodes` و `khabia_requests` (القائمة، تغيير الحالة، رفع إثبات التسليم)
موثّق في ملف الأدمن `02-replace-supabase-admin.md` — هنا الجزء العام بس، والأعمدة متطابقة.

**صيغة الرد المتوقعة:** الواجهة بتقبل `{ "data": {...} }` أو `{ "data": [...] }` أو paginated
`{ "data": { "data": [...] } }` أو الكائن مباشرة. أخطاء الـ validation بالشكل العادي لـ Laravel
(`422` + `{ message, errors }`) — الواجهة بتعرض أول رسالة.

---

## 1) رسائل "تواصل معنا" — `contact_messages` 🆕

### Migration
```php
Schema::create('contact_messages', function (Blueprint $table) {
    $table->id();
    $table->string('ref_code', 20)->unique();          // مثال: MSG-7KQ2X9 — بيتولّد في السيرفر
    $table->string('name', 100);
    $table->string('email', 255);
    $table->string('phone', 20)->nullable();
    $table->string('section', 40)->default('general'); // general|donation|qurbani|volunteer|partnership
    $table->text('message');                           // حتى 2000 حرف
    $table->string('source', 60)->nullable();          // "contact-page"
    $table->string('user_agent', 255)->nullable();
    $table->ipAddress('ip')->nullable();
    $table->enum('status', ['new', 'read', 'replied', 'archived'])->default('new');
    $table->timestamp('replied_at')->nullable();
    $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->index(['status', 'created_at']);
});
```

### `POST /api/v1/contact-messages` — عام (بدون token)
Request:
```json
{
  "name": "محمد أحمد",
  "email": "m@example.com",
  "phone": "01012345678",
  "section": "donation",
  "message": "عايز أسأل عن ...",
  "source": "contact-page",
  "user_agent": "Mozilla/5.0 ..."
}
```
Validation:
```php
'name'       => 'required|string|min:2|max:100',
'email'      => 'required|email|max:255',
'phone'      => 'nullable|string|max:20',
'section'    => 'required|string|in:general,donation,qurbani,volunteer,partnership',
'message'    => 'required|string|min:5|max:2000',
'source'     => 'nullable|string|max:60',
'user_agent' => 'nullable|string|max:255',
```
Response `201`:
```json
{ "message": "تم استلام رسالتك", "data": { "id": 15, "ref_code": "MSG-7KQ2X9", "status": "new", "created_at": "2026-10-29T10:00:00Z" } }
```
- الواجهة بتعرض `ref_code` للزائر — مهم يرجع.
- **Rate limiting:** `->middleware('throttle:5,1')` (5 طلبات في الدقيقة لكل IP). يُفضّل كمان رفض نفس الإيميل خلال 5 دقايق (`429`).
- يُفضّل إرسال إشعار للأدمن (Notification) عند وصول رسالة جديدة.
- لو الطلب فشل، الواجهة بتعرض زرار "إرسال عبر واتساب" (`wa.me/201097000137`) بنفس المحتوى، فمفيش رسالة بتضيع.

Admin (اختياري، للوحة التحكم): `GET /contact-messages` (staff, paginated, فلتر `status`)، `PATCH /contact-messages/{id}` `{status}`.

---

## 2) طلبات الخبيئة — `khabia_requests` 🆕

### Migration (نفس الجدول اللي بيستخدمه الأدمن في ملف 02)
```php
Schema::create('khabia_requests', function (Blueprint $table) {
    $table->id();
    $table->string('ref_code', 20)->unique();             // KHB-XXXXXX
    $table->string('full_name', 80);
    $table->string('phone', 11);                          // 01xxxxxxxxx
    $table->string('city', 60);
    $table->string('address', 200)->nullable();
    $table->enum('status', ['pending', 'scheduled', 'delivered', 'collected', 'cancelled'])->default('pending');
    $table->timestamp('scheduled_at')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->timestamp('collected_at')->nullable();
    $table->decimal('amount_collected', 12, 2)->nullable();
    $table->text('notes')->nullable();
    $table->foreignId('assigned_delegate_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('delivery_proof_path')->nullable();    // صورة إثبات التسليم (private disk)
    $table->string('collection_proof_path')->nullable();  // صورة إثبات الاستلام
    $table->string('source', 60)->nullable();             // "khabia-section"
    $table->string('user_agent', 255)->nullable();
    $table->ipAddress('ip')->nullable();
    $table->timestamps();
    $table->index(['status', 'created_at']);
});
```

### `POST /api/v1/khabia-requests` — عام (بدون token)
Request:
```json
{ "full_name": "أحمد علي", "phone": "01012345678", "city": "المنصورة", "address": "شارع ...", "source": "khabia-section", "user_agent": "..." }
```
Validation:
```php
'full_name'  => 'required|string|min:2|max:80',
'phone'      => ['required', 'regex:/^01\d{9}$/'],
'city'       => 'required|string|min:2|max:60',
'address'    => 'nullable|string|max:200',
'source'     => 'nullable|string|max:60',
'user_agent' => 'nullable|string|max:255',
```
Response `201`:
```json
{ "message": "تم تسجيل طلبك", "data": { "id": 8, "ref_code": "KHB-4RT9QZ", "status": "pending" } }
```
- **Rate limiting:** `throttle:5,1` لكل IP + رفض نفس رقم الموبايل خلال 5 دقايق (`429`).
- **رفع إثبات (اختياري، للمندوب/الأدمن):** `POST /khabia-requests/{id}/proof` (staff، multipart:
  `kind=delivery|collection`, `file` صورة ≤ 5MB `mimes:jpg,jpeg,png,webp`) — بيخزن في private disk ويرجّع
  رابط مؤقت (`temporaryUrl`) في `delivery_proof_url` / `collection_proof_url`. التفاصيل في ملف 02.
- نفس سلوك الواجهة: لو فشل الطلب يظهر زرار واتساب بنفس البيانات.

---

## 3) النشرة البريدية — تأكيد وإلغاء الاشتراك

### ✅ موجود: `POST /api/v1/newsletter`
الواجهة (Footer + قسم النشرة في الرئيسية) بتبعت `{ email, language, source: "website", status: "confirmed" }`
عبر `newsletterApi.subscribe` الموجودة. **مطلوب:** `throttle:5,1` على الـ route ده لأنه عام.
لو حابب double opt-in: تجاهل `status` اللي جاي من الواجهة، احفظ `pending`، وابعت إيميل فيه رابط
`https://elyusr.org/newsletter/confirm?token=...` (الصفحة دي موجودة في الواجهة وبتنادي الـ endpoint رقم 4).

### Migration (إضافة أعمدة لجدول newsletter الموجود)
```php
Schema::table('newsletters', function (Blueprint $table) {      // أو اسم جدول النشرة الحالي
    $table->string('confirm_token', 64)->nullable()->unique();
    $table->string('unsubscribe_token', 64)->nullable()->unique(); // ثابت لكل مشترك، بيتحط في كل إيميل
    $table->timestamp('confirmed_at')->nullable();                 // لو مش موجودين
    $table->timestamp('unsubscribed_at')->nullable();
});
```

### 🆕 `POST /api/v1/newsletter/confirm` — عام
Request: `{ "token": "a1b2..." }` — Validation: `'token' => 'required|string|max:64'`
Response `200`: `{ "message": "تم تأكيد اشتراكك", "data": { "email": "x@y.com", "status": "confirmed" } }`
توكن غلط أو منتهي → `404` أو `410` أو `422` (الواجهة بتعرض "الرابط منتهي أو غير صحيح").
أي خطأ تاني (`500`/شبكة) الواجهة بتعرض "الخدمة غير متاحة حالياً".

### 🆕 `POST /api/v1/newsletter/unsubscribe` — عام
Request: `{ "token": "..." }` **أو** `{ "email": "x@y.com" }`
Validation: `'token' => 'required_without:email|string|max:64', 'email' => 'required_without:token|email'`
Response `200`: `{ "message": "تم إلغاء اشتراكك", "data": { "email": "x@y.com", "status": "unsubscribed" } }`
- **Rate limiting** للاتنين: `throttle:10,1`.
- الإلغاء بالإيميل بس (من غير token) يُفضّل يبعت إيميل تأكيد بدل ما يلغي فوراً، عشان محدش يلغي اشتراك حد تاني.

---

## 4) تحديثات ووسائط الحالات — `case_updates`, `case_media` 🆕 (+ `case_documents`, `case_journey_steps` للقراءة)

### Migrations
```php
Schema::create('case_updates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();
    $table->text('body');
    $table->string('image_url')->nullable();
    $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});

Schema::create('case_media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();
    $table->string('url');                                   // رابط عام (storage أو خارجي)
    $table->string('path')->nullable();                      // مسار التخزين عشان الحذف
    $table->enum('kind', ['before', 'during', 'after', 'report', 'other'])->default('other');
    $table->string('caption_ar')->nullable();
    $table->string('caption_en')->nullable();
    $table->boolean('is_public')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
    $table->index(['case_id', 'sort_order']);
});

Schema::create('case_documents', function (Blueprint $table) {    // مستندات تظهر للمتبرع
    $table->id();
    $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();
    $table->string('path');
    $table->string('doc_type', 40)->default('other');            // report|invoice|receipt|photo|other
    $table->string('caption')->nullable();
    $table->boolean('is_public')->default(false);
    $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});

Schema::create('case_journey_steps', function (Blueprint $table) { // رحلة التبرع على صفحة الحالة
    $table->id();
    $table->foreignId('case_id')->nullable()->constrained('cases')->cascadeOnDelete();
    $table->foreignId('donation_id')->nullable()->constrained('donations')->nullOnDelete();
    $table->enum('step_key', ['created','paid','received','in_processing','executing','delivered','documented','completed','failed','refunded']);
    $table->string('title_ar');
    $table->string('title_en')->nullable();
    $table->text('note_ar')->nullable();
    $table->text('note_en')->nullable();
    $table->string('media_url')->nullable();
    $table->timestamp('occurred_at')->useCurrent();
    $table->boolean('is_public')->default(true);
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
```

### Endpoints
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/cases/{id}/updates` | عام | — | `{ data: [{ id, case_id, body, image_url, author_id, created_at }] }` الأحدث أولاً |
| POST | `/cases/{id}/updates` | staff (`cases.update`) | JSON `{ body, image_url? }` **أو** multipart `{ body, image? }` | `201 { data: {…update} }` |
| PUT | `/case-updates/{id}` | staff | `{ body?, image_url? }` | `{ data: {…} }` |
| DELETE | `/case-updates/{id}` | staff | — | `204` |
| GET | `/cases/{id}/media` | عام: `is_public=1` بس. `?all=1` + staff: الكل | — | `{ data: [{ id, case_id, url, kind, caption_ar, caption_en, is_public, sort_order, uploaded_by, created_at, updated_at }] }` مرتّب بـ `sort_order` |
| POST | `/cases/{id}/media` | staff | multipart `{ file, kind, caption_ar?, caption_en?, is_public (0/1), sort_order }` **أو** JSON بنفس الحقول مع `url` بدل `file` | `201 { data: {…media} }` |
| POST | `/cases/{id}/media/upload` | staff | multipart `{ file }` — بيخزن الملف بس من غير صف | `{ data: { url, path } }` |
| PUT | `/case-media/{id}` | staff | `{ kind?, caption_ar?, caption_en?, is_public?, sort_order?, url? }` | `{ data: {…} }` |
| DELETE | `/case-media/{id}` | staff | — | `204` + حذف الملف من الـ storage |
| POST | `/cases/{id}/media/reorder` | staff | `{ ids: [5, 2, 9] }` → `sort_order` = الترتيب | `204` |
| GET | `/cases/{id}/documents` | عام: `is_public=1` بس | — | `{ data: [{ id, case_id, url, doc_type, caption, is_public, created_at }] }` |
| GET | `/cases/{id}/journey` | عام: `is_public=1` بس | — | `{ data: [{ id, step_key, title_ar, title_en, note_ar, note_en, media_url, occurred_at, is_public }] }` |

Validation:
```php
// POST /cases/{id}/updates
'body'      => 'required|string|max:5000',
'image_url' => 'nullable|string|max:2048',
'image'     => 'nullable|image|max:5120',
// POST /cases/{id}/media
'file'       => 'required_without:url|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov|max:51200',
'url'        => 'required_without:file|string|max:2048',
'kind'       => 'nullable|in:before,during,after,report,other',
'caption_ar' => 'nullable|string|max:255',
'caption_en' => 'nullable|string|max:255',
'is_public'  => 'nullable|boolean',
'sort_order' => 'nullable|integer|min:0',
// POST /cases/{id}/media/reorder
'ids'   => 'required|array',
'ids.*' => 'integer|exists:case_media,id',
```
- `{id}` = رقم الحالة في جدول `cases` (نفس `id` اللي بيرجع في `GET /cases`).
- `url` لازم يرجع رابط كامل أو مسار يبدأ بـ `storage/` (الواجهة بتكمّله بـ `https://api.elyusr.org`).
- الواجهة كانت بتستخدم realtime من Supabase؛ دلوقتي بتعمل refresh لما الزائر يرجع للتاب — مفيش حاجة مطلوبة realtime.
- قراءات الصفحات العامة لو فشلت بترجع قائمة فاضية (زي النهارده)؛ شاشة الأدمن `CaseMediaManager` بتعرض الخطأ.

---

## 5) شجرة التبرع — `donation_nodes` 🆕 (القراءة العامة)

### Migration
```php
Schema::create('donation_nodes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('parent_id')->nullable()->constrained('donation_nodes')->cascadeOnDelete();
    $table->enum('type', ['sector', 'program', 'project', 'campaign', 'option']);
    $table->string('slug', 120);
    $table->string('title_ar');
    $table->string('title_en')->nullable();
    $table->text('description_ar')->nullable();
    $table->text('description_en')->nullable();
    $table->string('image_url')->nullable();
    $table->decimal('amount', 12, 2)->nullable();           // سعر ثابت للـ option
    $table->decimal('target_amount', 14, 2)->nullable();
    $table->decimal('collected_amount', 14, 2)->default(0);
    $table->boolean('active')->default(true);
    $table->boolean('direct_checkout')->default(false);
    $table->unsignedInteger('sort_order')->default(0);
    $table->json('metadata')->nullable();                    // meta_title_ar/en, meta_desc_ar/en, og_image_url
    $table->timestamps();
    $table->unique(['parent_id', 'slug']);
    $table->index(['parent_id', 'active', 'sort_order']);
});
```

### `GET /api/v1/donation-nodes` — عام
Query params (كلها اختيارية): `parent_id` (رقم، أو الكلمة `null` = العُقد الجذرية)، `slug`، `type`، `active=1`، `per_page`.
Response:
```json
{ "data": [ { "id": 3, "parent_id": null, "type": "sector", "slug": "sector-food", "title_ar": "الإطعام والكراتين الغذائية", "title_en": "Food & Meals",
  "description_ar": "...", "description_en": "...", "image_url": null, "amount": "250.00", "target_amount": "100000.00",
  "collected_amount": "45000.00", "active": true, "direct_checkout": false, "sort_order": 1, "metadata": null } ] }
```
### `GET /api/v1/donation-nodes/{id}` — عام → `{ "data": { …node } }` أو `404`.

- مرتّب بـ `sort_order`، والعام يرجّع `active=true` بس.
- الواجهة **ما بتقراش** الـ endpoint ده غير لما `VITE_CONTENT_SOURCE=api` (الافتراضي `static`)، ولو فشل
  أو رجع فاضي بتعرض القطاعات الثابتة الحالية (sector-food, sector-water, sector-health, sector-orphans, sector-zakat).
- القطاعات الثابتة دي يُفضّل تتعمل seed بنفس الـ slugs. الـ CRUD الإداري في ملف 02.

---

## 6) صفحات الخدمات — `services` + `service_categories` 🆕

الأعمدة متطابقة مع `03-seeders.md` (القسم 3.7) ومع القارئ العام `src/data/sources/services.ts`.

### Migrations
```php
Schema::create('service_categories', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();            // food|health|kafala|housing|odhya|water|education|general
    $table->string('donate_key')->nullable();
    $table->string('title_ar');
    $table->string('title_en')->nullable();
    $table->text('summary_ar')->nullable();
    $table->text('summary_en')->nullable();
    $table->text('intro_ar')->nullable();
    $table->text('intro_en')->nullable();
    $table->json('programs')->nullable();
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->timestamps();
});

Schema::create('services', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();                     // mosques, water, ...
    $table->string('program_slug')->nullable();
    $table->string('sector')->default('general');         // = service_categories.slug
    $table->string('hero_image')->nullable();             // رابط أو مسار storage
    $table->string('badge_ar')->nullable();
    $table->string('badge_en')->nullable();
    $table->string('title_ar');
    $table->string('title_en')->nullable();
    $table->text('intro_ar')->nullable();
    $table->text('intro_en')->nullable();
    $table->string('meta_title_ar')->nullable();
    $table->string('meta_title_en')->nullable();
    $table->text('meta_description_ar')->nullable();
    $table->text('meta_description_en')->nullable();
    $table->json('bullets_ar')->nullable();               // ["...", "..."]
    $table->json('bullets_en')->nullable();
    $table->json('stats')->nullable();                    // [{ar,en,arL,enL}]
    $table->json('features')->nullable();                 // [{icon:"Building2", t_ar, t_en, d_ar, d_en}]
    $table->json('tiers')->nullable();                    // [{amount, unit_ar, unit_en, desc_ar, desc_en, highlight}]
    $table->json('related')->nullable();                  // [{to:"/programs/x", ar, en}]
    $table->json('faqs')->nullable();                     // [{q_ar, a_ar, q_en, a_en}]
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->timestamps();
});
```

### Endpoints
| Method | Path | Auth | ملاحظات |
|---|---|---|---|
| GET | `/services` | عام | `is_active=1` بس، مرتّب بـ `sort_order`. `?all=1` مع token أدمن = الكل |
| GET | `/services/{slug}` | عام | الخدمة كاملة؛ `404` لو مش موجودة |
| POST | `/services` | staff | إنشاء (body بنفس الأعمدة + `slug`) |
| PUT | `/services/{slug}` | staff | تعديل جزئي (الواجهة بتبعت `is_active` لوحده عند التفعيل/الإيقاف). لو رجع `404` الواجهة بتعمل POST |
| DELETE | `/services/{slug}` | staff | |
| POST | `/services/reorder` | staff | `{ "slugs": ["water", "mosques", ...] }` → `sort_order` = الترتيب |
| GET | `/service-categories` | عام | `{ data: [{ id, slug, title_ar, title_en, is_active, sort_order, ... }] }` |

Validation (POST/PUT):
```php
'slug'                => 'required|string|max:120|unique:services,slug,' . $id, // في POST بس
'title_ar'            => 'required|string|max:255',   // sometimes في PUT
'title_en'            => 'nullable|string|max:255',
'program_slug'        => 'nullable|string|max:120',
'sector'              => 'nullable|string|exists:service_categories,slug',
'hero_image'          => 'nullable|string|max:2048',
'badge_ar'            => 'nullable|string|max:255',  'badge_en' => 'nullable|string|max:255',
'intro_ar'            => 'nullable|string',          'intro_en' => 'nullable|string',
'meta_title_ar'       => 'nullable|string|max:255',  'meta_title_en' => 'nullable|string|max:255',
'meta_description_ar' => 'nullable|string|max:500',  'meta_description_en' => 'nullable|string|max:500',
'bullets_ar'          => 'nullable|array',  'bullets_en' => 'nullable|array',
'stats'               => 'nullable|array',  'features'   => 'nullable|array',
'tiers'               => 'nullable|array',  'tiers.*.amount' => 'required_with:tiers|numeric|min:0',
'related'             => 'nullable|array',  'faqs'       => 'nullable|array',
'is_active'           => 'boolean',
'sort_order'          => 'integer|min:0',
```
- الأدمن كان بيحفظ التعديلات في localStorage (بتظهر في متصفحه هو بس). ده اتشال: الحفظ دلوقتي على السيرفر أو يظهر خطأ.
- لحد ما الجدول يتملي، شاشة الأدمن بتعرض الخدمات الثابتة، و"حفظ" أي واحدة بيعملها insert (seeding من الواجهة).

---

## 7) معرض الصور — رفع الصور ✅ (endpoint موجود)
- قبل كده الرفع كان بيروح لـ `/upload` (مش موجود) ولو فشل كان بيرجع رابط `blob:` محلي (نجاح وهمي)، والحفظ لو فشل
  كان بيرجع صف وهمي. اتصلح: الرفع بقى `POST /gallery` multipart (`image`, `title_ar`, `title_en`, `is_public=0`)
  وبيعمل صف **مسودة**، وزرار "حفظ" بيعمل `PUT /gallery/{id}` على نفس الصف (من غير تكرار).
- أسماء الحقول اللي بتتبعت: `title_ar/en, alt_ar/en, description_ar/en, city, program, donation_program, sort_order,
  is_featured, is_public, external_url` (الأخير للروابط الملصوقة بس).
- **مطلوب من الباك:** (أ) `POST /gallery` يقبل `is_public=0`. (ب) `DELETE /gallery/{id}` يحذف الملف من الـ storage.
  (ج) يُفضّل `GET /gallery?is_public=all` للأدمن عشان المسودات تظهر.

---

## 8) تسجيل الدخول بـ Google / Facebook 🆕 (لاحقاً — Laravel Socialite)
زراير Google/Facebook في `src/pages/auth/Login.tsx` كانت معتمدة على Supabase + Lovable وكانت دايماً بتفشل، فاتشالت.
لما يتعمل الـ flow ده الواجهة هترجّعهم:

```php
// routes/api.php
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->whereIn('provider', ['google', 'facebook']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->whereIn('provider', ['google', 'facebook']);
```
- `redirect`: `return Socialite::driver($provider)->stateless()->redirect();`
- `callback`: يجيب المستخدم (`stateless()->user()`)، يعمل `updateOrCreate` بالإيميل (+ أعمدة `provider`, `provider_id`, `avatar`)،
  يدّيله دور `donor` لو جديد، يعمل Sanctum token، ويعمل redirect لـ
  `https://elyusr.org/login?token=<token>&next=/profile` (أو `#token=` عشان ما يتسجلش في الـ logs).
- Migration: `users.provider` (string, nullable)، `users.provider_id` (string, nullable, index)، `users.avatar` (string, nullable)، و`password` يبقى nullable.
- `config/services.php` + متغيرات `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET`, redirect URI = `https://api.elyusr.org/api/v1/auth/{provider}/callback`.
- **Rate limiting:** `throttle:10,1`.

---

## Rate limiting (ملخص) — `routes/api.php`
```php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/contact-messages', [ContactMessageController::class, 'store']);
    Route::post('/khabia-requests', [KhabiaRequestController::class, 'store']);
    Route::post('/newsletter', [NewsletterController::class, 'store']);          // ✅ موجود — ضيف throttle
});
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/newsletter/confirm', [NewsletterController::class, 'confirm']);
    Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);
});
```
الرد عند تجاوز الحد `429` — الواجهة بتعرضه كخطأ عادي (ومعاه زرار واتساب في فورم التواصل والخبيئة).

## ملاحظة للـ CORS
كل الـ endpoints العامة دي بتتنادى من `https://elyusr.org` و `https://www.elyusr.org` بـ `credentials: omit`
وهيدرز `Accept`, `Accept-Language`, `Content-Type`, و`Authorization` (للأدمن). لازم تكون مسموحة في `config/cors.php`.
