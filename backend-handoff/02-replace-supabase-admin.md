# 02 — استبدال Supabase في لوحة التحكم بـ Laravel (شاشات الأدمن)

> الملف ده للمطوّر Laravel. كل شاشة في لوحة التحكم كانت بتكلّم Supabase (اللي بقى stub فاضي بيرجّع "نجاح" وهمي) اتحوّلت دلوقتي إنها تكلّم Laravel على `/api/v1`.
> لو الـ endpoint مش موجود، الواجهة بتعرض: **«هذه الميزة تحتاج تفعيل من الباك إند»** (عند 404/405) أو رسالة السيرفر الحقيقية — مفيش نجاح وهمي ولا حفظ في localStorage.
>
> الاصطلاحات:
> - **موجود (Postman)** = موجود في `_postman_endpoints.txt`.
> - **مستخدم ومش في Postman — محتاج تأكيد** = الواجهة بتعتمد عليه؛ لو موجود في الكود عندك أكّد إنه شغّال بنفس الشكل، لو مش موجود ضيفه.
> - **جديد** = لازم يتعمل.
> - الأدوار: الواجهة بتستخدم `admin`, `editor`, `caseworker` (= `case_manager` في الداتابيز), `volunteer`, `delegate`. كل الـ endpoints تحت `auth:sanctum` إلا لو مكتوب «عام».
> - شكل الرد المتوقع في كل مكان: `{ "data": {...} }` للعنصر و `{ "data": [...], "current_page", "last_page", "total" }` للقوائم (الواجهة بتقبل كمان مصفوفة مباشرة).
> - أخطاء الفاليديشن: الشكل القياسي بتاع Laravel `422 { "message": "...", "errors": { "field": ["..."] } }` — الواجهة بتعرض أول رسالة.

---

## 0) ملخص سريع

| # | المورد | الحالة | الملف في الواجهة |
|---|--------|--------|------------------|
| 1 | `donation-nodes` (شجرة برامج التبرع) | جديد | `src/data/api/donationNodesApi.ts` ← `AdminDonationNodes.tsx`, `AdminStoryEdit.tsx` |
| 2 | `khabia-requests` + رفع الإثبات | جديد | `src/data/api/khabiaRequestsApi.ts` ← `AdminDelegates.tsx`, `AdminMyCases.tsx` |
| 3 | أعمدة المندوب على `cases` + `POST /cases/{id}/updates` + `GET /users?role=delegate` | جديد | نفس الملف |
| 4 | `volunteer-applications` (مهامي + طلبات الحملات) | جديد / مستخدم ومش في Postman | `src/data/api/volunteerApplicationsApi.ts`, `src/data/campaignsApi.ts` |
| 5 | `PUT/GET /volunteer-campaigns/{id}` + أعمدة | مستخدم ومش في Postman | `src/data/campaignsApi.ts` ← `AdminCampaignDetail.tsx` |
| 6 | `newsletter-campaigns` + إرسال | جديد | `src/data/api/newsletterCampaignsApi.ts` ← `AdminNewsletterCampaigns.tsx` |
| 7 | `payment-transactions` | جديد | `src/data/api/paymentTransactionsApi.ts` ← `AdminPaymentTransactions.tsx` |
| 8 | `POST /notifications` (إرسال إشعار لمتطوع) | جديد | `src/data/api/adminNotificationsApi.ts` ← `AdminCampaignDetail.tsx` |
| 9 | `GET/PUT/DELETE /stories/{id}` + أعمدة | مستخدم ومش في Postman + أعمدة جديدة | `src/data/storiesApi.ts` ← `AdminStories.tsx`, `AdminStoryEdit.tsx` |
| 10 | `PATCH/DELETE /content/{id}` + أعمدة المدونة | مستخدم ومش في Postman + أعمدة جديدة | `src/data/blogApi.ts`, `src/data/contentStore.ts` ← `AdminBlogPostEdit.tsx`, `AdminBlogSeo.tsx`, `AdminContent.tsx` |
| 11 | `PUT/DELETE /faqs/{id}` | مستخدم ومش في Postman | `src/data/faqsApi.ts` ← `AdminFaqs.tsx`, `AdminContent.tsx` |
| 12 | `PUT /home-numbers/{id}`, `PUT /achievements/{id}` | مستخدم ومش في Postman | `AdminSiteStats.tsx` |
| 13 | `PUT /profile` | جديد | `src/data/api/profileApi.ts` ← `AuthContext.updateProfile` |
| 14 | `PUT /volunteers/{id}` + أعمدة `program_slug`, `permissions` | مستخدم ومش في Postman + أعمدة | `src/data/api/profileApi.ts` ← `AdminVolunteers.tsx` |
| 15 | `GET/PATCH /notifications…` | موجود (Postman) | `src/hooks/useNotifications.ts` |

---

## 1) شجرة برامج التبرع — `donation_nodes` (جديد)

شجرة: برنامج ← مشروع ← حملة ← خيار (سعر). الأدمن بيفعّل/يعطّل ويضيف عناصر. (وكيل تاني بيوثّق القراءة العامة لنفس المورد في ملفه؛ هنا جزء الأدمن.)

```php
Schema::create('donation_nodes', function (Blueprint $t) {
    $t->id();
    $t->foreignId('parent_id')->nullable()->constrained('donation_nodes')->cascadeOnDelete();
    $t->enum('type', ['program', 'project', 'campaign', 'option']);
    $t->string('slug');
    $t->string('title_ar');
    $t->string('title_en')->nullable();
    $t->decimal('amount', 12, 2)->nullable();
    $t->boolean('active')->default(true);
    $t->boolean('direct_checkout')->default(false);
    $t->unsignedInteger('sort_order')->default(0);
    $t->json('metadata')->nullable();
    $t->timestamps();
    $t->unique(['parent_id', 'slug']);
});
```

| Method | Path | Auth | ملاحظات |
|---|---|---|---|
| GET | `/donation-nodes?parent_id=null` أو `?parent_id=12` أو `?type=program` | عام للقراءة (أو admin) | `parent_id=null` (نص) = العناصر الجذرية. ترتيب بـ `sort_order` |
| POST | `/donation-nodes` | admin | |
| PUT | `/donation-nodes/{id}` | admin | تعديل جزئي مقبول (مثلاً `{ "active": false }` فقط) |
| DELETE | `/donation-nodes/{id}` | admin | يحذف الأبناء (cascade) |

Request (POST):
```json
{ "parent_id": null, "type": "program", "slug": "odhya", "title_ar": "صك الأضحية", "title_en": "Qurbani",
  "amount": null, "active": true, "direct_checkout": false, "sort_order": 0 }
```
Validation: `type` in enum، `slug` required|alpha_dash|max:120 و unique داخل نفس الأب، `title_ar` required|max:255، `amount` nullable|numeric|min:0، `parent_id` nullable|exists:donation_nodes,id.
Response: `{ "data": { id, parent_id, type, slug, title_ar, title_en, amount, active, direct_checkout, sort_order } }`.

---

## 2) طلبات الخبيئة — `khabia_requests` (جديد)

```php
Schema::create('khabia_requests', function (Blueprint $t) {
    $t->id();
    $t->string('ref_code')->unique();               // مثال KH-2026-0001
    $t->string('full_name');
    $t->string('phone', 30);
    $t->string('city');
    $t->string('address')->nullable();
    $t->enum('status', ['pending','scheduled','delivered','collected','cancelled'])->default('pending');
    $t->timestamp('scheduled_at')->nullable();
    $t->timestamp('delivered_at')->nullable();
    $t->timestamp('collected_at')->nullable();
    $t->decimal('amount_collected', 12, 2)->nullable();
    $t->text('notes')->nullable();
    $t->foreignId('assigned_delegate_id')->nullable()->constrained('users')->nullOnDelete();
    $t->string('delivery_proof_path')->nullable();   // على disk خاص (private)
    $t->string('collection_proof_path')->nullable();
    $t->timestamps();
});
```

| Method | Path | Auth | ملاحظات |
|---|---|---|---|
| GET | `/khabia-requests` | admin, case_manager: الكل — delegate: المعيّن له فقط | فلتر `assigned_delegate_id` = رقم مستخدم أو `me` (= المستخدم الحالي). `per_page` حتى 500 |
| POST | `/khabia-requests` | عام (فورم الموقع) أو admin | `{ full_name, phone, city, address?, notes? }` → السيرفر يولّد `ref_code` |
| PUT | `/khabia-requests/{id}` | admin, case_manager: أي حقل — delegate: طلباته فقط وحقول `status, scheduled_at, delivered_at, collected_at, amount_collected, notes` | تعديل جزئي |
| POST | `/khabia-requests/{id}/proof` | admin, case_manager, delegate (طلبه فقط) | multipart: `kind` = `delivery`\|`collection`، `file` = صورة |

Response لكل عنصر (لاحظ: الواجهة **لا** تتعامل مع Storage؛ رجّع رابط جاهز للعرض — يفضّل `Storage::temporaryUrl` أو signed route لمدة ساعة):
```json
{ "data": { "id": 5, "ref_code": "KH-2026-0005", "full_name": "...", "phone": "...", "city": "...", "address": null,
  "status": "delivered", "scheduled_at": "...", "delivered_at": "...", "collected_at": null,
  "amount_collected": null, "notes": null, "assigned_delegate_id": 12,
  "delivery_proof_url": "https://api.elyusr.org/....(signed)", "collection_proof_url": null, "created_at": "..." } }
```
منطق `/proof`: يخزن الملف، يحدّث `<kind>_proof_path`، ولو `kind=delivery` يخلّي `status=delivered` و `delivered_at=now()` لو فاضيين. يرجّع السجل كامل.
Validation: `file` required|image|max:8192، `kind` required|in:delivery,collection، `status` in enum، `amount_collected` nullable|numeric|min:0، `assigned_delegate_id` nullable|exists:users,id (ويكون عنده دور delegate).

---

## 3) مهام المندوب على الحالات (جديد)

### 3.1 أعمدة جديدة على `cases`
```php
Schema::table('cases', function (Blueprint $t) {
    $t->foreignId('assigned_delegate_id')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamp('scheduled_visit_at')->nullable();
    $t->text('delegate_notes')->nullable();
    $t->string('area')->nullable();
});
```
- `GET /cases?assigned_delegate_id=me` (delegate: حالاته) و `?assigned_delegate_id=any` (admin/case_manager: كل الحالات اللي ليها مندوب) و `?assigned_delegate_id=12`.
- أضف الحقول الأربعة في `CaseResource` وفي فاليديشن `PUT /cases/{id}`.

### 3.2 تسجيل تسليم المساعدة — `POST /cases/{id}/updates` (جديد)
```php
Schema::create('case_updates', function (Blueprint $t) {
    $t->id();
    $t->foreignId('case_id')->constrained()->cascadeOnDelete();
    $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $t->text('body');
    $t->string('image_path')->nullable();
    $t->timestamps();
});
```
multipart: `body` (required|string|max:2000)، `image` (nullable|image|max:8192). Auth: admin, case_manager، أو delegate المعيّن على الحالة. Response `{ data: { id, case_id, body, image_url, created_at } }`.

### 3.3 قائمة المندوبين — `GET /users?role=delegate`
`GET /users` موجود في Postman؛ المطلوب فلتر `role` (slug الدور) ورجوع `roles` في كل مستخدم. حقول مستخدمة: `id, name, phone, city`.
Auth: admin, case_manager.

---

## 4) طلبات التطوع — `volunteer_applications`

الواجهة بتستخدم بالفعل (في `campaignsApi.ts`) مسارات **مش موجودة في Postman** — محتاج تأكيد أو إضافة:
`GET /volunteer-campaigns/{id}/applications`، `POST /volunteer-campaigns/{id}/apply` (عام)، `PATCH /volunteer-applications/{id}`، `DELETE /volunteer-applications/{id}`.
والجديد: `GET /volunteer-applications?mine=1` لشاشة «مهامي».

```php
Schema::create('volunteer_applications', function (Blueprint $t) {
    $t->id();
    $t->foreignId('volunteer_campaign_id')->constrained()->cascadeOnDelete();
    $t->foreignId('volunteer_id')->nullable()->constrained('users')->nullOnDelete(); // لو المتطوع له حساب
    $t->string('full_name');
    $t->string('email')->nullable();
    $t->string('phone', 30);
    $t->string('city')->nullable();
    $t->json('skills')->nullable();
    $t->enum('status', ['pending','approved','rejected','attended','noshow','cancelled'])->default('pending');
    $t->string('assigned_role')->nullable();
    $t->string('shift')->nullable();
    $t->text('notes')->nullable();
    $t->timestamp('reviewed_at')->nullable();
    $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamps();
});
```

| Method | Path | Auth | ملاحظات |
|---|---|---|---|
| GET | `/volunteer-applications?mine=1` | أي مستخدم مسجّل | طلبات المستخدم الحالي (`volunteer_id = auth()->id()` **أو** `email = auth()->user()->email`)، مع `campaign` مضمّن (`with('campaign')`): `id, slug?, title_ar, title_en, description_ar, description_en, event_date, event_time, location, governorate, required_skills` |
| DELETE | `/volunteer-applications/{id}` | صاحب الطلب لو `pending`، أو admin | |
| PATCH | `/volunteer-applications/{id}` | admin, case_manager, editor | `{ status, reviewed_at?, assigned_role?, shift? }` |
| GET | `/volunteer-campaigns/{id}/applications` | admin, case_manager, editor, volunteer-manager | قائمة الطلبات (نفس الحقول + `volunteer_id`) |
| POST | `/volunteer-campaigns/{id}/apply` | عام | `{ full_name, phone, email?, city?, skills[], notes?, status? }` — لو المستخدم مسجّل اربط `volunteer_id` |

Validation (`PATCH`): `status` in:pending,approved,rejected,attended,noshow,cancelled (الواجهة القديمة كانت بتبعت كمان `accepted`/`waitlisted` من شاشة `AdminCampaigns` — يا ريت تقبلها كـ alias لـ `approved`/`pending`).

---

## 5) حملات التطوع — `volunteer_campaigns` (مستخدم ومش في Postman)

- `GET /volunteer-campaigns/{id}` و `PUT /volunteer-campaigns/{id}` (تعديل جزئي، مثلاً `{ "status": "closed" }`).
- الحالات اللي الواجهة بتبعتها: `draft, open, closed, completed, cancelled` → زوّد `completed` لو مش موجودة.
- أعمدة جديدة:
```php
Schema::table('volunteer_campaigns', function (Blueprint $t) {
    $t->string('slug')->nullable()->unique();
    $t->string('cover_image_url', 2048)->nullable(); // رابط صورة مرفوعة عبر /gallery
});
```
Body اللي بيتبعت في POST/PUT: `title_ar, title_en, description_ar, description_en, event_date, event_time, governorate, city, location, required_volunteers, required_skills[], status, slug?, cover_image_url?`.

---

## 6) حملات النشرة البريدية — `newsletter_campaigns` (جديد)

```php
Schema::create('newsletter_campaigns', function (Blueprint $t) {
    $t->id();
    $t->string('subject');
    $t->string('preheader')->nullable();
    $t->longText('html');
    $t->longText('text_body')->nullable();
    $t->string('from_name')->default('مؤسسة اليسر');
    $t->string('from_email')->nullable();
    $t->string('reply_to')->nullable();
    $t->enum('status', ['draft','scheduled','sending','sent','failed'])->default('draft');
    $t->timestamp('scheduled_at')->nullable();
    $t->timestamp('sent_at')->nullable();
    $t->unsignedInteger('recipients_count')->default(0);
    $t->unsignedInteger('sent_count')->default(0);
    $t->unsignedInteger('failed_count')->default(0);
    $t->unsignedInteger('opened_count')->default(0);
    $t->unsignedInteger('clicked_count')->default(0);
    $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $t->timestamps();
});
```

| Method | Path | Auth | Body / Response |
|---|---|---|---|
| GET | `/newsletter-campaigns` | admin | قائمة (الأحدث أولاً) |
| GET | `/newsletter-campaigns/{id}` | admin | عنصر |
| POST | `/newsletter-campaigns` | admin | `{ subject, preheader, html, text_body, from_name, from_email, reply_to, status, scheduled_at }` → العنصر |
| PUT | `/newsletter-campaigns/{id}` | admin | نفس الحقول |
| DELETE | `/newsletter-campaigns/{id}` | admin | |
| POST | `/newsletter-campaigns/{id}/send` | admin | يرسل لكل مشترك `status=confirmed` في جدول `newsletter` (يفضّل Queue). Response: `{ "data": { "sent": 120, "failed": 2 }, "message": "..." }` ويحدّث العدّادات و `status=sent`, `sent_at` |
| POST | `/newsletter-campaigns/{id}/send-test` | admin | `{ "email": "x@y.com" }` → يرسل نسخة واحدة. Response `{ "data": { "sent": 1, "failed": 0 } }` |

Validation: `subject` required|max:200، `html` required_unless:status,draft، `from_email`/`reply_to` nullable|email، `email` (send-test) required|email.
عدد المشتركين المؤكَّدين بيتقري من الموجود: `GET /newsletter/statistics` → `confirmed`.

---

## 7) معاملات الدفع — `payment_transactions` (جديد)

كل محاولة دفع عبر Paymob/Kashier (اتشال استدعاء edge function `paymob-create-payment` من الواجهة).
```php
Schema::create('payment_transactions', function (Blueprint $t) {
    $t->id();
    $t->foreignId('donation_id')->nullable()->constrained()->nullOnDelete();
    $t->string('ref_code')->index();              // نفس كود تتبع التبرع
    $t->string('provider');                        // paymob | kashier
    $t->string('method')->nullable();              // card | wallet | instapay | bank
    $t->enum('status', ['pending','processing','paid','failed','refunded'])->default('pending');
    $t->decimal('amount', 12, 2);
    $t->string('currency', 3)->default('EGP');
    $t->string('donor_name')->nullable();
    $t->string('donor_email')->nullable();
    $t->string('donor_phone', 30)->nullable();
    $t->string('redirect_url', 2048)->nullable();
    $t->string('gateway_reference')->nullable();
    $t->text('internal_notes')->nullable();
    $t->unsignedInteger('retry_count')->default(0);
    $t->text('last_error')->nullable();
    $t->json('payload')->nullable();               // رد البوابة / callback
    $t->timestamps();
});
```

| Method | Path | Auth | ملاحظات |
|---|---|---|---|
| GET | `/payment-transactions?status=&method=&search=` | admin, case_manager | `search` على `ref_code`, `donor_phone`, `donor_email`. الأحدث أولاً، `per_page` حتى 200 |
| PATCH | `/payment-transactions/{id}` | admin, case_manager | `{ "internal_notes": "..." }` فقط |
| POST | `/payment-transactions/{id}/retry` | admin, case_manager | السيرفر ينشئ دفع جديد عند البوابة لنفس التبرع ويزوّد `retry_count`. Response: `{ "data": { "redirect_url": "https://..." } }` |

يتملأ الجدول من `POST /donations/submit` و callbacks (`/paymob/callback`, kashier).

---

## 8) إرسال إشعار داخلي — `POST /notifications` (جديد)

`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` **موجودة في Postman** وبقت الواجهة بتستخدمها (`useNotifications.ts`، تحديث كل دقيقة).
الجديد: الأدمن يبعت إشعار لمتطوع/متطوعين من شاشة الحملة.

Request:
```json
{ "user_ids": [12, 15], "type": "info",
  "title_ar": "حملة: ...", "title_en": "Campaign: ...",
  "message_ar": "...", "message_en": "...",
  "link": "/admin/my-tasks", "entity_type": "application", "entity_id": 44 }
```
Auth: admin, case_manager, editor. Validation: `user_ids` required|array|min:1، `user_ids.*` exists:users,id، `title_ar`/`message_ar` required|max:255/2000، `type` in:info,success,warning,error.
التنفيذ: `Notification::send($users, new AdminMessage($data))` على قناة `database`، و `toArray()` يرجّع نفس المفاتيح (`type, title_ar, title_en, message_ar, message_en, link, entity_type, entity_id`) — `GET /notifications` لازم يرجّعها جوّه `data`. Response: `{ "data": { "count": 2 } }`.

---

## 9) القصص — `/stories`

**مستخدم ومش في Postman — محتاج تأكيد:** `GET /stories/{id}`, `PUT /stories/{id}` (تعديل جزئي مقبول، مثلاً `{ "status": "published" }` أو `{ "is_featured": true }`), `DELETE /stories/{id}`.
للأدمن: `GET /stories?status=all&per_page=200` لازم يرجّع المسودات كمان لما الطلب فيه توكن أدمن/محرر.

أعمدة جديدة (الأدمن بقى بيبعتها):
```php
Schema::table('stories', function (Blueprint $t) {
    $t->text('quote_ar')->nullable();
    $t->text('quote_en')->nullable();
    $t->string('cover_image_url', 2048)->nullable();   // رابط نصي (الملف يترفع عبر /gallery)
    $t->foreignId('program_node_id')->nullable()->constrained('donation_nodes')->nullOnDelete();
    $t->string('pillar_slug')->nullable();             // food | health | education
    $t->foreignId('case_id')->nullable()->constrained('cases')->nullOnDelete();
    $t->boolean('pending_review')->default(false);
    $t->json('seo')->nullable();                       // meta_title_ar/en, meta_desc_ar/en, og_image_url ...
});
```
Body الكامل: `slug, title_ar, title_en, category_ar, category_en, quote_ar, quote_en, description_ar, description_en, beneficiary_name, location_ar, location_en, cover_image_url, program_node_id, pillar_slug, case_id, status (published|draft), is_featured, pending_review, sort_order, seo`.
Validation: `slug` required|unique:stories,slug,{id}، `title_ar` required، `status` in:published,draft، `cover_image_url` nullable|url|max:2048، `seo` nullable|array. الـ Resource يرجّع كل الأعمدة دي.
Auth: admin, editor.

---

## 10) المحتوى والمدونة — `/content`

**مستخدم ومش في Postman — محتاج تأكيد:** `PATCH /content/{id}` (و/أو `PUT`، تعديل جزئي)، `DELETE /content/{id}`، فلاتر `GET /content?type=article&slug=...&per_page=200`.

أعمدة جديدة لمقالات المدونة (كانت بتضيع قبل كده):
```php
Schema::table('contents', function (Blueprint $t) {   // اسم الجدول حسب الموجود عندك
    $t->string('category_ar')->nullable();
    $t->string('category_en')->nullable();
    $t->json('tags_ar')->nullable();
    $t->json('tags_en')->nullable();
    $t->string('focus_keyword')->nullable();
    $t->string('og_image_url', 2048)->nullable();
    $t->unsignedTinyInteger('seo_score')->nullable();
    $t->timestamp('published_at')->nullable();
    $t->timestamp('scheduled_at')->nullable();
});
```
- `status` لازم يقبل: `draft, pending_review, scheduled, published, archived`.
- `cover_image`: الواجهة بتبعت **رابط نصي** (الصورة بتترفع أولاً عبر `/gallery`). يا ريت `cover_image` يقبل `nullable|string|max:2048` **أو** ملف — حالياً لو الفاليديشن `image` هيرجع 422 والواجهة هتعرض الخطأ.
- `tags` (الموجود) بيتبعت = `tags_ar` للتوافق.
- الحذف: `DELETE /content/{id}` (زر «حذف المقال» في محرر المدونة، وزر الحذف في «إدارة المحتوى»).
Auth: admin, editor.

---

## 11) الأسئلة الشائعة — `/faqs`

**مستخدم ومش في Postman — محتاج تأكيد:** `PUT /faqs/{id}` (تعديل جزئي مثلاً `{ "is_active": false }`)، `DELETE /faqs/{id}`، `GET /faqs?per_page=500` و `GET /faq-categories?per_page=200`.
`POST /faqs` موجود. `faq_category_id` بيتبعت `null` لو مفيش تصنيف مطابق → خلّيه `nullable|exists:faq_categories,id`.
Auth (كتابة): admin, editor.

---

## 12) الأرقام والإنجازات

**مستخدم ومش في Postman — محتاج تأكيد:** `PUT /home-numbers/{id}` (`{ "is_visible": true }` أو `{ "sort_order": 3 }` جزئي)، `PUT /achievements/{id}` (`{ "is_active": false }` جزئي)، `DELETE /achievements/{id}`.
زر الإظهار/الإخفاء في `AdminSiteStats.tsx` لو فشل بيرجّع السويتش لحالته ويعرض الخطأ (كان قبل كده بيكتب في Supabase ويقول «تم»).

---

## 13) تعديل الملف الشخصي — `PUT /profile` (جديد)

Request: `{ "name": "...", "email": "...", "phone": "...", "bio": "...", "city": "..." }` (كلها اختيارية).
Validation: `name` sometimes|string|max:255، `email` sometimes|email|unique:users,email,{auth id}، `phone` nullable|max:30، `bio` nullable|max:1000، `city` nullable|max:120.
Response: `{ "data": { ...user نفس شكل GET /profile } }`. Auth: أي مستخدم مسجّل.

---

## 14) المتطوعين — `PUT /volunteers/{id}` (مستخدم ومش في Postman) + أعمدة

```php
Schema::table('volunteers', function (Blueprint $t) {
    $t->string('program_slug')->nullable();   // البرنامج المعيّن (slug من قائمة برامج الموقع)
    $t->json('permissions')->nullable();      // صلاحيات المتطوع الدقيقة
});
```
Request أمثلة: `{ "status": "approved" }`، `{ "status": "approved", "program_slug": "food" }`، `{ "permissions": ["cases.view","media.upload"] }`.
Validation: `status` in:pending,approved,rejected,suspended (زوّد `suspended`)، `program_slug` nullable|string|max:120، `permissions` nullable|array، `permissions.*` string.
`GET /volunteers` لازم يرجّع `program_slug` و `permissions`. Auth: admin, case_manager.

---

## 15) ملاحظة للفرونت (مش للباك إند) — التوكن على `/stories`

`src/data/laravelApi.ts` بيعتبر `/stories` endpoint عام وبيشيل التوكن من أي GET عليه، حتى لو الطالب أدمن. علشان الأدمن يشوف المسودات لازم السطر ده يتعدّل (مسؤولية الـ lead):
```ts
// قبل
const token = isPublicGet ? null : (explicitToken !== undefined ? explicitToken : getApiToken());
// بعد
const token = explicitToken !== undefined ? explicitToken : (isPublicGet ? null : getApiToken());
```
(دوال الأدمن في `src/data/api/adminApiHelpers.ts` بتبعت `token` صريح بالفعل.)
