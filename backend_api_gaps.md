# 📘 دليل وتقرير فجوات الـ API لمطور الباك إند — مشروع جمعية اليسر

> **تاريخ التحديث:** سبتمبر 2026  
> **الفئة المستهدفة:** مطور الباك إند (Laravel Framework)  
> **الهدف:** توضيح الأجزاء المربوطة بنجاح، وشرح كل الـ Endpoints المتبقية بأسلوب مبسّط وواضح جداً (مع كود Migrations و Controllers ونماذج JSON للفرونت إند) لتسهيل التنفيذ دون أي تعقيد.

---

## 🌟 رسالة ترحيبية وفهرس الإنجاز
عاش يا بطل! الشغل اللي اتعمل في الـ API ممتاز جداً، والفرونت إند حالياً مربوط بنسبة تتجاوز **80%** مع Laravel API وبيانات حقيقية وشغالة بسلاسة.

هذا التقرير اتكتب مخصوص عشانك: بأسلوب مباشر، وأمثلة جاهزة للنسخ واللصق، عشان تخلص الـ 20% الباقية بأقل مجهود وبدون أي لبس.

---

## 📑 فهرس المحتويات
1. [الـ Endpoints الشغالة 100% (لا تعدل عليها)](#1-endpoints-شغالة-100)
2. [جدول الأولويات المتبقية (خطة الـ 5 أيام)](#2-جدول-الأولويات)
3. [الموديول 1: وثائق وتحديثات الحالات (Case Updates & Documents)](#3-موديول-تحديثات-ووثائق-الحالات) 🔴
4. [الموديول 2: حملات النشرة البريدية (Newsletter Campaigns)](#4-موديول-حملات-النشرة-البريدية) 🔴
5. [الموديول 3: سجل المعاملات المالية (Payment Transactions)](#5-موديول-المعاملات-المالية) 🟡
6. [الموديول 4: طلبات المندوبين والخبيئة (Delegates & Khabia)](#6-موديول-المندوبين-والخبيئة) 🟡
7. [الموديول 5: محاور الرسالة والعمل (Work Axes)](#7-موديول-محاور-الرسالة) 🟢
8. [الموديول 6: الحملات الإعلانية وصلاحيات المستخدمين](#8-موديول-الحملات-الإعلانية-والصلاحيات) 🟢
9. [تعديلات سريعة وتنبيهات مهمة (Easy Fixes)](#9-تعديلات-سريعة-وتنبيهات)
10. [الشكل القياسي الموحد لاستجابة الـ API](#10-الشكل-القياسي-للاستجابة)

---

## 1. ✅ Endpoints شغالة 100% (يرجى الحفاظ عليها)

هذه الـ Endpoints تم اختبارها وربطها بالكامل في الفرونت إند وتعمل بكفاءة ممتازة:

| الموديول / الصفحة | المسار (Endpoint) | العمليات الشغالة والمتوافقة |
|---|---|---|
| **المتبرعون (Donors)** | `/api/v1/donors` | عرض، إضافة، تعديل، حذف، بحث (CRUD) |
| **التبرعات (Donations)** | `/api/v1/donations` + `/submit` + `/track/{ref}` | جلب القائمة، إنشاء، سداد Paymob، وتتبع فوري بالمرجع |
| **باقات التبرع (Packages)** | `/api/v1/programs/{id}/donation-packages` | جلب باقات التبرع الخاصة بالبرنامج وإنشاء باقة جديدة |
| **الحالات الإنسانية (Cases)** | `/api/v1/cases` + `/case-categories` + `/statistics` | CRUD كامل، رفع الصور، تصنيفات الحالات، إحصائيات الحالات |
| **قصص الأثر (Stories)** | `/api/v1/stories` + `/statistics` | CRUD كامل، تبديل النشر، حفظ التوثيقات، تصفية وإحصائيات |
| **معرض الصور (Gallery)** | `/api/v1/gallery` + `/statistics` | رفع الصور، جلب المعرض، الحذف، التصفية بالمدينة والبرنامج |
| **المشاريع (Projects)** | `/api/v1/projects` | CRUD كامل مع نسب الإنجاز والمستهدفات |
| **البرامج الرئيسية (Programs)** | `/api/v1/programs` | جلب البرامج وتفاصيلها وتعديلها وربطها بالمواسم |
| **المواسم (Seasons)** | `/api/v1/seasons` | قائمة المواسم وإضافتها وربطها بالبرامج |
| **الخدمات (Services)** | `/api/v1/services` + `/service-categories` | تصنيفات الخدمات، إنشاء خدمة، خيارات التبرع |
| **المتطوعون (Volunteers)** | `/api/v1/volunteers` + `/statistics` | جلب القائمة، إنشاء متطوع، إحصائيات المتطوعين |
| **حملات التطوع (Campaigns)** | `/api/v1/volunteer-campaigns` + `/statistics` | جلب الحملات، إنشاء حملة، إحصائيات، الحذف |
| **مشتركو النشرة (Newsletter)** | `/api/v1/newsletter` + `/statistics` | جلب المشتركين، تأكيد الاشتراك، إلغاء، حذف، إحصائيات |
| **محتوى من نحن (عام للزوار)** | `/api/v1/about-us` + الأقسام الـ 8 | جلب بيانات الصفحة لعامة الزوار بدون توكن لكل قسم |
| **محتوى من نحن (لوحة التحكم)** | `/api/v1/admin/about-us/{section}` | تعديل كافة الأقسام الـ 8 (Hero, Stats, Programs, Trust, WhyUs, Values, Story, Vision 2030) |
| **محتوى الرئيسية (Hero CMS)** | `/api/v1/homepage/hero` + `/content` | العناوين، البادجات، الكولاج |
| **إحصائيات الموقع (Stats)** | `/api/v1/home-numbers` + `/achievements` | إجمالي المستفيدين، الأرقام الرئيسية، الإنجازات |
| **سيو المدونة (Blog SEO)** | `/api/v1/blog-seo` + `/statistics` | جلب المقالات، تحليل السيو، إضافة مقال، تعديل، حذف |
| **إدارة المحتوى (Content)** | `/api/v1/content` + `/statistics` | مقالات ومدونة، تصفية بالنوع والحالة والبحث |
| **مراجعة التعديلات (Approvals)** | `/api/v1/content-change-requests` | عرض طلبات التعديل، اعتمادها وتنفيذها (Approve)، رفضها |
| **طرق الدفع (Payment Methods)** | `/api/v1/payment-methods` + `/active` | جلب وتفعيل وتعطيل وإضافة وتعديل البوابات |
| **المحاور (Axes)** | `/api/v1/axes` + `/api/v1/admin/axes` | جلب المحاور، إضافة محور جديد، الحذف |
| **الأسئلة الشائعة (FAQs)** | `/api/v1/faqs` + `/faq-categories` | تصنيفات الأسئلة، إضافة سؤال، التصفية بالتصنيف |
| **المستخدمون (Users)** | `/api/v1/users` | إضافة وتعديل المستخدمين وحفظ الأدوار (CRUD) |
| **الأدوار (Roles)** | `/api/v1/roles` | عرض الأدوار وتعديل صلاحيات الدور (`permission_ids`) |
| **الصلاحيات (Permissions)** | `/api/v1/permissions` | جلب الصلاحيات مقسمة حسب الموديول |
| **لوحة المعلومات (Dashboard)** | `/api/v1/dashboard` | إحصائيات لوحة التحكم الشاملة |
| **الإعدادات العامة (Settings)** | `/api/v1/settings` | حفظ وقراءة إعدادات الموقع العامة |

---

## 2. 🚦 جدول الأولويات المتبقية

| الأولوية | الموديول | الأهمية | الوقت المقترح |
|---|---|---|---|
| 🔴 **عالية جداً** | Case Updates & Documents | إدارة وثائق الحالات الإنسانية وتحديثات الشفاء والمساعدات | يوم 1 |
| 🔴 **عالية جداً** | Newsletter Campaigns | تمكين الإدارة من إرسال حملات البريد الإلكتروني للمشتركين | يوم 2 |
| 🟡 **متوسطة** | Payment Transactions | استعراض ومراجعة عمليات الدفع الإلكتروني مع بوابات الدفع | يوم 3 |
| 🟡 **متوسطة** | Delegates & Khabia | إدارة المندوبين الميدانيين وطلبات جمع حصالات الخبيئة | يوم 4 |
| 🟢 **منخفضة** | Work Axes CRUD | توفير التعديل الكامل لمحاور الرسالة الثلاثة (الغذاء، الصحة، التعليم) | نصف يوم |
| 🟢 **منخفضة** | Ad Campaigns & Permissions | تتبع إعلانات السوشيال ميديا وصلاحيات الموديولات | نصف يوم |

---

## 3. 🔴 موديول تحديثات ووثائق الحالات (Case Updates & Documents)

### 📖 الشرح ببساطة:
كل حالة إنسانية (مثلاً: طفل محتاج عملية قلب) بعد ما بتتعمل، المشرف الميداني بيحتاج:
1. يضيف **تحديث إخباري** (مثال: "تم إجراء العملية بنجاح والطفل في العناية المركزة").
2. يرفع **وثائق ومستندات** (تقارير طبية، فواتير مستشفى، صورة بطاقة).

### 🛠️ المايجريشن المقترح (Database Tables):

```php
// 1. جدول التحديثات: case_updates
Schema::create('case_updates', function (Blueprint $table) {
    $table->id();
    $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
    $table->string('title_ar');
    $table->string('title_en')->nullable();
    $table->text('content_ar');
    $table->text('content_en')->nullable();
    $table->date('update_date')->default(now());
    $table->boolean('is_public')->default(true); // يظهر للمتبرع في صفحة الحالة
    $table->timestamps();
});

// 2. جدول الوثائق: case_documents
Schema::create('case_documents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
    $table->string('title'); // مثال: تقرير طبي، فحص معمل
    $table->string('file_path'); // رابط أو مسار الملف
    $table->string('file_type')->nullable(); // pdf, image
    $table->integer('file_size')->nullable(); // بالكيلوبايت
    $table->timestamps();
});
```

### 🌐 الـ Endpoints المطلوبة:

```php
// في ملف routes/api.php داخل الـ middleware: auth:sanctum
Route::prefix('cases/{caseId}')->group(function () {
    // التحديثات
    Route::get('updates', [CaseUpdateController::class, 'index']);
    Route::post('updates', [CaseUpdateController::class, 'store']);
    Route::put('updates/{id}', [CaseUpdateController::class, 'update']);
    Route::delete('updates/{id}', [CaseUpdateController::class, 'destroy']);

    // الوثائق
    Route::get('documents', [CaseDocumentController::class, 'index']);
    Route::post('documents', [CaseDocumentController::class, 'store']); // multipart/form-data
    Route::delete('documents/{id}', [CaseDocumentController::class, 'destroy']);
});
```

### 📤 مثال الـ Request اللي الفرونت هيبعته لإضافة تحديث:
`POST /api/v1/cases/5/updates`
```json
{
  "title_ar": "تم إجراء الفحوصات الطبية الأولية",
  "title_en": "Initial medical tests completed",
  "content_ar": "تم حجز موعد العملية الجراحية يوم الأربعاء القادم بمستشفى المنصورة الجامعي.",
  "content_en": "Surgery scheduled for next Wednesday at Mansoura University Hospital.",
  "update_date": "2026-09-15",
  "is_public": true
}
```

### 📥 مثال الـ Response المتوقع:
```json
{
  "status": "success",
  "message": "تمت إضافة التحديث بنجاح",
  "data": {
    "id": 12,
    "case_id": 5,
    "title_ar": "تم إجراء الفحوصات الطبية الأولية",
    "content_ar": "تم حجز موعد العملية...",
    "update_date": "2026-09-15",
    "is_public": true,
    "created_at": "2026-09-13T14:30:00.000000Z"
  }
}
```

---

## 4. 🔴 موديول حملات النشرة البريدية (Newsletter Campaigns)

### 📖 الشرح ببساطة:
الموقع بيجمع إيميلات الناس في النشرة البريدية (`newsletter_subscribers`). المسؤول في لوحة التحكم يحتاج يكتب رسالة أو حملة (مثلاً: "تقرير إنجازات رمضان") ويبعتها لكل المشتركين المؤكدين أو يرسل إيميل تجريبي لنفسه قبل الإرسال العام.

### 🛠️ المايجريشن المقترح:

```php
Schema::create('newsletter_campaigns', function (Blueprint $table) {
    $table->id();
    $table->string('subject'); // عنوان الإيميل
    $table->text('content'); // نص أو HTML الرسالة
    $table->string('target_audience')->default('all'); // all, active, donors
    $table->string('status')->default('draft'); // draft, sending, sent, failed
    $table->integer('recipients_count')->default(0);
    $table->integer('sent_count')->default(0);
    $table->timestamp('sent_at')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->timestamps();
});
```

### 🌐 الـ Endpoints المطلوبة:

```php
Route::apiResource('newsletter-campaigns', NewsletterCampaignController::class);
Route::post('newsletter-campaigns/{id}/send', [NewsletterCampaignController::class, 'send']);
Route::post('newsletter-campaigns/{id}/send-test', [NewsletterCampaignController::class, 'sendTest']);
```

### 📤 إرسال إيميل تجريبي (Send Test):
`POST /api/v1/newsletter-campaigns/3/send-test`
```json
{
  "test_email": "admin@alyusr.org"
}
```

### 📥 الاستجابة المتوقعة:
```json
{
  "status": "success",
  "message": "تم إرسال البريد التجريبي بنجاح"
}
```

---

## 5. 🟡 موديول سجل المعاملات المالية (Payment Transactions)

### 📖 الشرح ببساطة:
صفحة `/admin/transactions` بتعرض كل العمليات اللي تمت أونلاين عبر بوابات الدفع (فودافون كاش، فوري، فيزا/ماستركارد، InstaPay) علشان المحاسب يراجع رقم العملية المرجعي ويطابق الحساب البنكي.

### 🛠️ المايجريشن المقترح:

```php
Schema::create('payment_transactions', function (Blueprint $table) {
    $table->id();
    $table->string('transaction_number')->unique(); // رقم العملية مثلاً TXN-2026-001
    $table->foreignId('donation_id')->nullable()->constrained('donations');
    $table->foreignId('donor_id')->nullable()->constrained('donors');
    $table->decimal('amount', 12, 2);
    $table->string('currency', 3)->default('EGP');
    $table->string('gateway'); // paymob, fawry, vodafone_cash, instapay, bank_transfer
    $table->string('gateway_reference')->nullable(); // الرقم المرجعي من فوري أو باي موب
    $table->string('status')->default('pending'); // pending, completed, failed, refunded
    $table->json('gateway_response')->nullable(); // الـ Webhook payload للتسجيل
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### 🌐 الـ Endpoints المطلوبة:

```php
Route::get('payment-transactions', [PaymentTransactionController::class, 'index']); // يدعم query params: ?status=completed&search=...
Route::get('payment-transactions/{id}', [PaymentTransactionController::class, 'show']);
Route::put('payment-transactions/{id}', [PaymentTransactionController::class, 'update']); // لتحديث الحالة والملاحظات يدوياً
```

---

## 6. 🟡 موديول طلبات المندوبين والخبيئة (Delegates & Khabia)

### 📖 الشرح ببساطة:
"الخبيئة" هي حصالة التوفير المنزلية التي توزعها جمعية اليسر على البيوت والمحلات. عندما تمتلئ الحصالة، يطلب المتبرع زيارة مندوب لاستلامها أو تفريغها وإعطائه إيصالاً رسمياً.

### 🛠️ المايجريشن المقترح:

```php
Schema::create('khabia_requests', function (Blueprint $table) {
    $table->id();
    $table->string('request_number')->unique(); // KHB-1001
    $table->string('donor_name');
    $table->string('donor_phone');
    $table->string('governorate')->default('الدقهلية');
    $table->string('city');
    $table->text('address_details');
    $table->foreignId('assigned_delegate_id')->nullable()->constrained('users'); // المندوب المكلف
    $table->string('status')->default('pending'); // pending, scheduled, collected, cancelled
    $table->decimal('collected_amount', 10, 2)->nullable(); // المبلغ اللي اتجمع في الحصالة
    $table->string('receipt_number')->nullable(); // رقم إيصال الاستلام الورقي
    $table->date('preferred_date')->nullable();
    $table->timestamp('collected_at')->nullable();
    $table->timestamps();
});
```

### 🌐 الـ Endpoints المطلوبة:

```php
Route::get('khabia-requests', [KhabiaRequestController::class, 'index']);
Route::get('khabia-requests/{id}', [KhabiaRequestController::class, 'show']);
Route::put('khabia-requests/{id}', [KhabiaRequestController::class, 'update']);
Route::post('khabia-requests/{id}/assign', [KhabiaRequestController::class, 'assignDelegate']); // تكليف مندوب
Route::get('delegates', [UserController::class, 'delegatesList']); // قائمة المستخدمين اللي دورهم delegate
```

---

## 7. 🟢 موديول محاور الرسالة والعمل (Work Axes)

### 📖 الشرح والوضع الحالي:
الفرونت إند جهز صفحة إدارة كاملة ممتازة اسمها `/admin/axes` للتحكم في ركائز الخير الثلاثة:
1. **الغذاء** (`food`)
2. **الصحة** (`health`)
3. **التعليم** (`education`)

### 🔍 ما لاحظناه في السيرفر حالياً:
- `GET /api/v1/axes` شغال ويرجع 200 وفيه حالياً محور التعليم فقط.
- `GET /api/v1/admin/axes` بيرجع 401 عند عدم تمرير توكن الأدمن، أو غير مسجل في راوت الأدمن.

### 🛠️ المطلوب من الباك إند:
التأكد من تسجيل راوت الأدمن كالتالي في `routes/api.php`:
```php
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('axes', [AxisController::class, 'adminList']); // أو index
    Route::post('axes', [AxisController::class, 'store']);
    Route::put('axes/{id}', [AxisController::class, 'update']);
    Route::delete('axes/{id}', [AxisController::class, 'destroy']);
});
```

وتسجيل الحقول في جدول `axes`:
- `id`, `slug`, `name_ar`, `name_en`, `badge_ar`, `badge_en`, `description_ar`, `description_en`, `features_ar` (JSON أو Array), `features_en` (JSON أو Array), `image`, `sort_order`, `is_active`.

---

## 8. 🟢 موديول الحملات الإعلانية وصلاحيات المستخدمين

### أ) الحملات الإعلانية (`/admin/ad-campaigns`):
لتسجيل إعلانات فيسبوك / جوجل ومعرفة الصرف والعائد:
- `GET /api/v1/ad-campaigns`
- `POST /api/v1/ad-campaigns`
- `PUT /api/v1/ad-campaigns/{id}`
- `DELETE /api/v1/ad-campaigns/{id}`

### ب) صلاحيات الموديولات التفصيلية (`/admin-module-scopes`):
لكل مستخدم غير الأدمن، تحديد الموديولات المسموح له برؤيتها:
- `GET /api/v1/admin-module-scopes`
- `POST /api/v1/admin-module-scopes` (Upsert بناءً على `user_id` و `module_name`)

---

## 9. ⚡ تعديلات سريعة وتنبيهات مهمة للمطور (Easy Fixes)

يرجى مراعاة هذه النقاط المحددة في الكود:
1. **حفظ العنوان المميز (`POST /homepage/content`):**
   - حقول `section2_title_accent_ar` و `section2_title_accent_en` أصبحت موجودة في الـ response ولكن قيمتها تُحفظ كـ `null`. يرجى التأكد من إضافتها لمصفوفة `$fillable` في الموديل ولقواعد التحقق `$request->validate()` في `HomepageContentController` ليتم حفظها في جدول قاعدة البيانات.
2. **تعديل الإنجازات (`PUT /achievements/{id}`):**
   - عند محاولة تعديل إنجاز، السيرفر يرجع `500 Internal Server Error`. يرجى مراجعة ميثود `update` في `AchievementController` للتأكد من استقبال الحقول دون أخطاء.
3. **من نحن (About Us) — تم الربط والتوافق 100% بنجاح ✅:**
   - تم ربط الـ Endpoint العام `GET /api/v1/about-us` للموقع الخارجي (يعمل بدون توكن).
   - تم ربط راوت الإدارة `GET /api/v1/admin/about-us` وتحديث الأقسام `PUT /api/v1/admin/about-us/{section}` للوحة التحكم.
   - **تنبيه هيكلي مهم:** ميثود التحديث في Laravel تتطلب تغليف البيانات داخل كائن باسم `content` كالتالي: `{ "content": { ... } }`، وإلا يفشل التحقق بـ `The content field is required`. تم ضبط وتوافق الفرونت إند بالكامل ليقوم بهذا التغليف تلقائياً لكل الأقسام (Hero, Stats, Programs, Trust, Why Us, Values, Story, Vision 2030).
4. **المستخدمون والصلاحيات (RBAC) — تم الربط بنجاح ✅:**
   - تم ربط الـ 88 صلاحية من `/api/v1/permissions` والأدوار من `/api/v1/roles` والمستخدمين من `/api/v1/users` وأصبح النظام يعمل بنسبة 100% بدون أي اعتماد على Supabase!

---

## 10. 📐 الشكل القياسي الموحد للاستجابة (Standard JSON Format)

حتى يتوافق الفرونت إند تلقائياً وبأعلى سرعة، يفضل دائماً إرجاع الاستجابات بهذا الشكل:

### في حالة النجاح (Success - 200 OK أو 201 Created):
```json
{
  "status": "success",
  "message": "تم تنفيذ العملية بنجاح",
  "data": { ... } // أو [ ... ] في حالة القوائم
}
```

### في حالة أخطاء التحقق (Validation Error - 422 Unprocessable Entity):
```json
{
  "message": "بيانات غير صالحة",
  "errors": {
    "title_ar": ["حقل العنوان باللغة العربية مطلوب."],
    "amount": ["يجب أن يكون المبلغ رقماً أكبر من صفر."]
  }
}
```

---

> 💡 **نصيحة للمطور:** الفرونت إند مجهز بحماية وتخزين احتياطي (Fallback Cache)، مما يعني أنه حتى أثناء قيامك بتطوير وتجربة هذه الـ Endpoints على السيرفر، لن ينهار الموقع أبداً. خذ وقتك وطبق خطة الأولويات خطوة بخطوة وستكون النتيجة عملاً برمجياً متكاملاً وفائق الجودة! 🚀
