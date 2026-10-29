# 05 — حملات التبرع، المواسم، وقسم الحملات في الرئيسية

> **لمين الملف ده:** مطوّر Laravel. كل حاجة هنا الفرونت **بيستدعيها فعلاً** دلوقتي. لو الـ endpoint مش موجود، لوحة التحكم بتعرض للأدمن رسالة **«يحتاج تفعيل من الباك إند»** ومبتعملش نجاح وهمي.
>
> **الرموز:** ✅ موجود حالياً (من Postman أو GET حي على `/api/v1`) — 🆕 جديد مطلوب.
>
> **قاعدة الصلاحيات:** كل الكتابة (POST/PUT/PATCH/DELETE) لـ `admin` و `editor` بـ Bearer token (Sanctum) زي باقي اللوحة. كل القراءة المذكورة "عامة" لازم تشتغل **بدون توكن**.

---

## 0. ملخص سريع

| # | المطلوب | الحالة | الفرونت اللي بيستدعيه |
|---|---|---|---|
| 1 | عمود `key` على `donation_packages` | 🆕 | `src/components/admin/campaigns/CampaignPackagesManager.tsx` |
| 2 | `PUT /donation-campaigns/{id}/donation-packages/{packageId}` | 🆕 | نفس الملف ↑ (عبر `src/data/api/donationCampaignsAdminApi.ts`) |
| 3 | `DELETE /donation-campaigns/{id}/donation-packages/{packageId}` | 🆕 | ↑ |
| 4 | `POST /donation-campaigns/{id}/donation-packages/reorder` | 🆕 | ↑ |
| 5 | أعمدة `page_content`, `seo`, `faqs` على `donation_campaigns` + رجوعها في الـ Resource | 🆕 | `src/pages/admin/AdminDonationCampaignDetail.tsx`، والقراءة العامة `src/data/campaignPages/api.ts` |
| 6 | رجوع `subtitle_ar/en`, `category_id` (+`category`), `image` في الـ Resource | 🆕 (بتتبعت ✅ وبتتجاهل) | `AdminDonationCampaignDetail.tsx`, `AdminDonationCampaigns.tsx` |
| 7 | `GET /donation-campaigns/by-slug/{slug}` (عام) | 🆕 | `src/data/campaignPages/api.ts` |
| 8 | `PUT /donation-campaign-categories/{id}` | 🆕 | `src/pages/admin/AdminDonationCampaigns.tsx` |
| 9 | `GET /seasons` عام + إصلاح الـ 500 | 🆕/إصلاح | `src/data/seasons.ts`, `src/pages/admin/AdminSeasons.tsx` (عبر `src/data/api/seasonsApi.ts`) |
| 10 | `PUT /seasons/{id}` و `DELETE /seasons/{id}` + أعمدة `slug` وغيرها | 🆕 | `src/pages/admin/AdminSeasons.tsx` |
| 11 | `GET` و `PUT /homepage/campaigns-section` | 🆕 | `src/data/campaignsSettings.ts`, `src/pages/admin/AdminCampaignsSection.tsx` (عبر `src/data/api/campaignsSectionApi.ts`) |
| 12 | `PUT /admin/homepage/carousel/items/{id}` (تعديل بطاقة) | 🆕 (الكود القديم بيستدعيه ومش في Postman) | `src/data/campaignsSettings.ts` |

الموجود ✅ ومستخدم كما هو:
`GET/POST /donation-campaigns`، `GET/PUT/DELETE /donation-campaigns/{id}` (Postman كاتب `PUT /donation-campaigns` بدون id، الفرونت بيبعت **`PUT /donation-campaigns/{id}`** — ومع صورة: `POST /donation-campaigns/{id}` + `_method=PUT`)، `GET/POST /donation-campaigns/{id}/donation-packages`، `GET/POST /donation-campaign-categories`، `DELETE /donation-campaign-categories/{id}`، `GET/POST /seasons`، `PATCH /seasons/{id}`، `GET /homepage/carousel`، `GET /admin/homepage/carousel`، `PUT /admin/homepage/carousel/settings`، `POST /admin/homepage/carousel/items`، `PATCH /admin/homepage/carousel/items/{id}/toggle`، `DELETE /admin/homepage/carousel/items/{id}`، `POST /admin/homepage/carousel/reorder`.

---

## 1. باقات التبرع للحملات (`donation_packages`)

**الهدف:** صاحب المؤسسة يغيّر سعر «كرتونة الغذاء» (وأي باقة) من اللوحة. الأسعار في صفحات الهبوط (`/food-box`, `/setr`, …) بتتقري من باقات الحملة.

### 1.1 Migration 🆕

```php
Schema::table('donation_packages', function (Blueprint $table) {
    $table->string('key', 64)->nullable()->after('name_en');
    // فريد داخل نفس الحملة فقط (نفس الجدول بيخدم programs/projects كمان)
    $table->unique(['donation_campaign_id', 'key']);
});
```

> لو `program_id` و `project_id` في نفس الجدول، الـ unique على `donation_campaign_id + key` كافي لأن `NULL` مش بيتعارض في MySQL.

Model: أضف `key` لـ `$fillable`، وفي `DonationPackageResource` رجّع `key`.

### 1.2 الشكل المرجّع لكل باقة (Resource)

```json
{ "id": 77, "donation_campaign_id": 23, "key": "carton", "name_ar": "كرتونة غذاء ١٤ كيلو", "name_en": "14 kg food carton",
  "amount": "700.00", "sort_order": 3, "is_active": true }
```

### 1.3 Endpoints

| Method | Path | الحالة | Body | Response |
|---|---|---|---|---|
| GET | `/donation-campaigns/{id}/donation-packages` | ✅ | — | `{ "data": [Package] }` |
| POST | `/donation-campaigns/{id}/donation-packages` | ✅ (+ `key` 🆕) | `{name_ar, name_en, amount, sort_order, is_active, key}` | `201 { "success": true, "data": Package }` |
| PUT | `/donation-campaigns/{id}/donation-packages/{packageId}` | 🆕 | نفس POST (كل الحقول؛ اقبلها `sometimes`) | `200 { "success": true, "data": Package }` |
| DELETE | `/donation-campaigns/{id}/donation-packages/{packageId}` | 🆕 | — | `200 { "success": true, "message": "..." }` |
| POST | `/donation-campaigns/{id}/donation-packages/reorder` | 🆕 | `{ "items": [ {"id": 77, "sort_order": 1}, ... ] }` | `200 { "success": true, "data": [Package] }` |

- لازم تتأكد إن `packageId` تابع لنفس الحملة `{id}` وإلا `404`.
- التبديل (تفعيل/إخفاء) من اللوحة بيتبعت كـ `PUT` بالقيم الكاملة + `is_active` الجديد.
- عند إنشاء حملة جديدة من اللوحة، الفرونت بيعمل `POST` للحملة ثم `POST` لكل باقة افتراضية على الـ id الجديد.

**Validation:**

```php
// Store + Update (في Update استخدم 'sometimes' قبل كل قاعدة)
'name_ar'    => ['required', 'string', 'max:190'],
'name_en'    => ['nullable', 'string', 'max:190'],
'amount'     => ['required', 'numeric', 'min:1'],
'sort_order' => ['nullable', 'integer', 'min:0'],
'is_active'  => ['boolean'],
'key'        => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/',
                 Rule::unique('donation_packages', 'key')
                     ->where('donation_campaign_id', $campaign->id)
                     ->ignore($package?->id)],
// Reorder
'items'              => ['required', 'array', 'min:1'],
'items.*.id'         => ['required', 'integer', Rule::exists('donation_packages', 'id')->where('donation_campaign_id', $campaign->id)],
'items.*.sort_order' => ['required', 'integer', 'min:0'],
```

### 1.4 قيم `key` لكل حملة (من `prices[].id` في `src/data/campaignPages/<slug>.ts`)

العمود الأخير: الباقة الموجودة حالياً في الداتابيز اللي اسمها العربي مطابق للبند (اقتراح لتعبئة `key` عليها مباشرة). الشرطة `—` = مفيش باقة مطابقة بالاسم؛ اختار الأنسب يدوياً أو اتركها والصفحة هتعرض السعر الافتراضي.

**سِتر — حملة id 18 (`sitr`)**

| key | البند في الصفحة | السعر الافتراضي | باقة مطابقة |
|---|---|---|---|
| `share` | سهم حملة سِتر | 500 | — |
| `blanket` | لحاف فايبر حراري | 450 | — |
| `clothes` | كسوة شتاء لطفل | 700 | — |
| `window` | شباك | 750 | — |
| `door` | باب | 2200 | — |
| `bed` | سرير ومرتبة | 3200 | — |
| `roof_bitumen` | بيتومين | 6500 | — |
| `roof_wood` | خشب | 17000 | — |
| `full` | الكفالة الشتوية الشاملة لأسرة | 10000 | — |

**ظِلّ — حملة id 17 (`zell`)**

| key | البند | السعر | باقة مطابقة |
|---|---|---|---|
| `roof_share` | سهم في سقف | 500 | — (أقرب: #48 «سهم سقف خشبي») |
| `roof_full` | سقف منزل متكامل | 16000 | — (أقرب: #51) |
| `water_share` | سهم في وصلة مياه | 500 | — (أقرب: #49) |
| `water_full` | وصلة مياه كاملة | 7500 | — (أقرب: #50) |
| `fan` | مروحة سقف أو حائط | 950 | — |

**أَثَر — حملة id 21 (`athar`)**

| key | البند | السعر | باقة مطابقة |
|---|---|---|---|
| `bag` | حقيبة مدرسية وأدوات متكاملة | 450 | — (أقرب: #67) |
| `uniform` | زي مدرسي وحذاء جديد | 550 | — (أقرب: #68) |
| `tuition` | سداد المصروفات الدراسية للعام | 850 | — (أقرب: #69) |
| `full` | كفالة تعليمية شاملة لطالب | 1850 | — (أقرب: #70) |
| `nursery_share` | سهم في دور التحفيظ والحضانات | 500 | — |
| `classroom` | كفالة فصل دراسي كامل | 18000 | — |
| `dedicate_student` | كفالة طالب للعام | 1850 | — |
| `dedicate_nursery` | سهم في دار تحفيظ | 500 | — |

**موسم الخير (رمضان) — حملة id 20 (`ramadan`)**

| key | البند | السعر | باقة مطابقة |
|---|---|---|---|
| `iftar` | وجبة إفطار صائم ساخنة | 95 | #61 (75) |
| `fitr` | زكاة الفطر عن فرد | 75 | #60 (40) |
| `meat` | سهم لحوم بلدي (1 كجم) | 420 | — |
| `eid_clothes` | كسوة عيد لطفل يتيم وعلبة كعك | 650 | — (أقرب: #64) |
| `box` | كرتونة رمضان الكبرى (25 كجم) | 950 | — (أقرب: #62) |
| `bride` | سهم تيسير زواج عروسة يتيمة | 1500 | — (أقرب: #65) |

**عربون خير — حملة id 22 (`arboun-kheir`)**

| key | البند | السعر | باقة مطابقة |
|---|---|---|---|
| `share_starter` | عربون خير سهم بسيط (مشروع صغير) | 150 | — |
| `share_standard` | عربون خير (مشروع متوسط 1%) | 450 | — |
| `share_orphan_education` | سهم كفالة يتيم ودعم تعليم | 750 | — |
| `share_bride` | سهم تيسير زواج عروسة يتيمة | 1500 | — |
| `share_jariyah` | سهم صدقة جارية (سقف / مياه) | 2500 | — (أقرب: #73) |
| `share_custom` | أي نسبة أو قيمة تختارها | 100 | — |

**الغذاء الشهري — حملة id 23 (`food`)** — كلها مطابقة:

| key | البند | السعر | باقة مطابقة |
|---|---|---|---|
| `meat_share` | سهم لحوم الذبائح الشهرية | 350 | #75 |
| `meat_kg` | كيلو لحمة بلدي لأسرة | 450 | #76 |
| `carton` | كرتونة غذاء ١٤ كيلو | 700 | #77 |
| `full` | سُفرة الشهر: كرتونة + لحمة | 1100 | #78 |
| `full_3` | كفالة سُفرة ٣ شهور | 3300 | #79 |
| `full_year` | كفالة سُفرة سنة كاملة | 13200 | #80 |
| `meal` | وجبة إطعام مطبوخة | 75 | #81 |
| `kaffara_yameen` | كفارة يمين: إطعام عشرة مساكين | 750 | #82 |
| `kaffara_siyam` | كفارة صيام: إطعام ستين مسكيناً | 4500 | #83 |
| `fidya` | فدية صيام عن يوم | 75 | #84 |

**مَرْكون — حملة id 19 (`markoon`)**: الصفحة ملهاش بنود أسعار (`prices: []`)، فمفيش `key`.

> بعد إضافة `key` الفرونت هيتحول للمطابقة بالـ `key` بدل الاسم في `src/hooks/useCampaignPage.ts` (سطر واحد) — اللوحة بتبعته وبتعرضه من دلوقتي.

---

## 2. محتوى صفحة الهبوط على الحملة (`page_content`, `seo`, `faqs`)

### 2.1 Migration 🆕

```php
Schema::table('donation_campaigns', function (Blueprint $table) {
    $table->json('page_content')->nullable()->after('benefits');
    $table->json('seo')->nullable()->after('page_content');
    $table->json('faqs')->nullable()->after('seo');
    // لو مش موجودين فعلاً (اللوحة بتبعتهم والـ Resource مش بيرجعهم):
    // $table->string('subtitle_ar')->nullable(); $table->string('subtitle_en')->nullable();
    // $table->foreignId('category_id')->nullable()->constrained('donation_campaign_categories')->nullOnDelete();
});
```

Model:

```php
protected $fillable = [/* الموجود */ 'subtitle_ar', 'subtitle_en', 'category_id', 'image', 'page_content', 'seo', 'faqs'];
protected $casts    = [/* الموجود */ 'benefits' => 'array', 'page_content' => 'array', 'seo' => 'array', 'faqs' => 'array'];
```

### 2.2 الـ Resource (GET القائمة و GET {id}) — لازم يرجّع

```json
{
  "id": 23, "slug": "food", "name_ar": "...", "name_en": "...",
  "subtitle_ar": "...", "subtitle_en": "...",
  "category_id": 2, "category": { "id": 2, "name_ar": "...", "name_en": "...", "slug": "..." },
  "image": "https://api.elyusr.org/storage/donation-campaigns/xxx.jpg",
  "description_ar": "...", "description_en": "...",
  "target_amount": "300000.00", "collected_amount": "0.00", "remaining_amount": "300000.00",
  "completion_percentage": 0, "is_completed": false, "minimum_amount": "75.00",
  "donation_available": true, "is_active": true, "sort_order": 7, "benefits": [],
  "page_content": { ... } | null,
  "seo": { ... } | null,
  "faqs": [ ... ] | null,
  "donation_packages": [ Package + key ], "cases": []
}
```

> **مهم:** المفاتيح `page_content`, `seo`, `faqs` لازم تكون موجودة في الـ JSON **حتى لو قيمتها `null`**. اللوحة بعد كل حفظ بتعمل GET، ولو المفتاح مش موجود بتعرض للأدمن «الباك إند تجاهل الحقل». نفس الكلام لـ `subtitle_*`, `category_id`, `image`.

### 2.3 الكتابة

`PUT /donation-campaigns/{id}` ✅ (و `POST /donation-campaigns` ✅ عند الإنشاء) — اقبل الحقول الجديدة:

- **JSON body (بدون صورة):** `page_content` و `seo` كـ object، و `faqs` كـ array.
- **multipart/form-data (مع صورة جديدة، `POST` + `_method=PUT`):** الفرونت بيبعت `page_content` و `seo` و `faqs` كـ **نص JSON** (string). فكّه قبل الـ validation:

```php
protected function prepareForValidation(): void
{
    foreach (['page_content', 'seo', 'faqs'] as $k) {
        if (is_string($this->input($k))) {
            $this->merge([$k => json_decode($this->input($k), true)]);
        }
    }
}
```

- **إرجاع للافتراضي:** الفرونت بيبعت `page_content: null, seo: null, faqs: null` → خزّنها `NULL` (الصفحة بتعرض الافتراضي من الكود).
- المفتاح اللي **مش مبعوت** متغيروش (مثلاً `seo` مش بيتبعت لو الأدمن ما عدّلش السيو).
- الفرونت **مابقاش بيبعت** مفاتيح السيو المسطّحة (`meta_title_ar` …)؛ السيو كله في `seo`.

### 2.4 شكل `page_content`

كل نص ثنائي اللغة = `{"ar": "...", "en": "..."}`. المرجع: `src/data/campaignPages/types.ts`. الأسعار **مش** جوه `page_content` (هي الباقات)، والأسئلة في `faqs`، والسيو في `seo`.

```json
{
  "hero":   { "eyebrow": {"ar":"","en":""}, "title": {"ar":"","en":""}, "title2": {"ar":"","en":""},
              "lead": {"ar":"","en":""}, "donateLabel": {"ar":"","en":""} },
  "hadith": { "text": {"ar":"","en":""}, "source": {"ar":"","en":""} },
  "stats":  [ { "id": "boxes", "label": {"ar":"","en":""}, "value": 1400, "unit": {"ar":"","en":""}, "note": {"ar":"","en":""} } ],
  "sections": {
    "tracks": {
      "title": {"ar":"","en":""}, "lead": {"ar":"","en":""},
      "items": [ { "id": "roof", "title": {"ar":"","en":""}, "desc": {"ar":"","en":""}, "extra": {"ar":"","en":""} } ]
    },
    "carton_contents": {
      "dynamic": true,
      "extraLabel": {"ar":"الكمية","en":"Quantity"},
      "title": {"ar":"","en":""},
      "items": [ { "id": "rice-1730000000", "title": {"ar":"أرز","en":"Rice"}, "desc": {"ar":"","en":""}, "extra": {"ar":"2 كجم","en":"2 kg"} } ]
    }
  },
  "cta": { "title": {"ar":"","en":""}, "sub": {"ar":"","en":""} }
}
```

**قواعد:**
- `stats[].value` رقم صحيح ≥ 0 أو `null` (يُعرض ✓).
- الأقسام العادية: الـ `id` ثابت من الكود؛ الباك يخزّن كما هو.
- **الأقسام الديناميكية (`"dynamic": true`)، زي مكوّنات الكرتونة:** مصفوفة `items` **تُخزَّن كما هي بالظبط** (ترتيبها، والعناصر المضافة بـ id جديد، والمحذوفة). ممنوع الدمج مع قيم قديمة أو إعادة ترتيب أو حذف عناصر بـ id غير معروف. مصفوفة فاضية `[]` = القسم فاضي فعلاً.
- مفاتيح غير معروفة داخل `page_content` تتخزّن كما هي (الفرونت بيتجاهل اللي مش فاهمه).

### 2.5 شكل `seo` و `faqs`

```json
"seo": {
  "title": {"ar":"","en":""}, "description": {"ar":"","en":""}, "keywords": {"ar":"","en":""},
  "canonical": "https://elyusr.org/food-box", "noindex": false, "nofollow": false
},
"faqs": [ { "question_ar": "", "answer_ar": "", "question_en": null, "answer_en": null } ]
```

### 2.6 Validation

```php
'page_content'                     => ['nullable', 'array'],
'page_content.hero'                => ['nullable', 'array'],
'page_content.hadith'              => ['nullable', 'array'],
'page_content.stats'               => ['nullable', 'array', 'max:30'],
'page_content.stats.*.id'          => ['required', 'string', 'max:64'],
'page_content.stats.*.value'       => ['nullable', 'integer', 'min:0'],
'page_content.sections'            => ['nullable', 'array'],
'page_content.sections.*.items'    => ['nullable', 'array', 'max:100'],
'page_content.sections.*.items.*.id' => ['required', 'string', 'max:80'],
'page_content.cta'                 => ['nullable', 'array'],
'page_content.prices'              => ['prohibited'],   // الأسعار = donation_packages
'page_content.faq'                 => ['prohibited'],   // الأسئلة في faqs
'seo'                              => ['nullable', 'array'],
'seo.title.ar' => ['nullable', 'string', 'max:160'], 'seo.title.en' => ['nullable', 'string', 'max:160'],
'seo.description.ar' => ['nullable', 'string', 'max:400'], 'seo.description.en' => ['nullable', 'string', 'max:400'],
'seo.keywords.ar' => ['nullable', 'string', 'max:500'], 'seo.keywords.en' => ['nullable', 'string', 'max:500'],
'seo.canonical' => ['nullable', 'url', 'max:255'], 'seo.noindex' => ['boolean'], 'seo.nofollow' => ['boolean'],
'faqs'                 => ['nullable', 'array', 'max:60'],
'faqs.*.question_ar'   => ['required', 'string', 'max:300'],
'faqs.*.answer_ar'     => ['required', 'string', 'max:3000'],
'faqs.*.question_en'   => ['nullable', 'string', 'max:300'],
'faqs.*.answer_en'     => ['nullable', 'string', 'max:3000'],
'subtitle_ar' => ['nullable', 'string', 'max:255'], 'subtitle_en' => ['nullable', 'string', 'max:255'],
'category_id' => ['nullable', 'integer', 'exists:donation_campaign_categories,id'],
'collected_amount' => ['nullable', 'numeric', 'min:0'],
'image' => ['nullable', 'image', 'max:4096'],
```

### 2.7 القراءة العامة + البيانات القديمة

- الصفحة العامة بتقرا `GET /donation-campaigns/{id}` ✅ (نفس الطلب اللي بتجيب منه الباقات) وتاخد `page_content/seo/faqs`.
- 🆕 `GET /donation-campaigns/by-slug/{slug}` (عام، `404` لو مش موجود، نفس الـ Resource). اقبل الـ slug الحالي **وأي alias** من جدول التوحيد (القسم 7).
- **البيانات القديمة:** قبل الأعمدة دي، المحتوى كان بيتحفظ كعنصر في `/content` بنوع `page` و slug `campaign-page-{slug}` (JSON في `content_ar`، فيه `faq` و `seo` جوّاه). الفرونت لسه **بيقرأه بس** لو الحملة مالهاش `page_content/seo/faqs`، ومابقاش بيكتب فيه (إلا مسحه عند «إرجاع للافتراضي»). مطلوب أمر Artisan يرحّله مرة واحدة:

```php
// php artisan campaigns:migrate-page-content
$map = ['setr' => 18, 'dhill' => 17, 'athar' => 21, 'ramadan' => 20, 'markoun' => 19, 'arboun' => 22, 'food' => 23];
foreach ($map as $page => $campaignId) {
    $item = Content::where('type', 'page')->where('slug', "campaign-page-$page")->first();
    $json = $item ? json_decode($item->content_ar ?: '{}', true) : null;
    if (!$json) continue;
    $c = DonationCampaign::find($campaignId);
    if (!$c || $c->page_content) continue;               // لا تكتب فوق بيانات جديدة
    $faqs = collect($json['faq'] ?? [])->map(fn ($f) => [
        'question_ar' => $f['q']['ar'] ?? '', 'answer_ar' => $f['a']['ar'] ?? '',
        'question_en' => $f['q']['en'] ?? null, 'answer_en' => $f['a']['en'] ?? null,
    ])->values()->all();
    $seo = $json['seo'] ?? null;
    unset($json['faq'], $json['seo'], $json['prices']);
    $c->update(['page_content' => $json, 'seo' => $seo, 'faqs' => $faqs ?: null]);
}
```

---

## 3. تصنيفات الحملات

| Method | Path | الحالة |
|---|---|---|
| GET | `/donation-campaign-categories` | ✅ (حالياً فاضي `[]`) |
| POST | `/donation-campaign-categories` | ✅ `{name_ar, name_en, slug, is_active, sort_order}` |
| PUT | `/donation-campaign-categories/{id}` | 🆕 نفس الحقول، `200 { "data": Category }` |
| DELETE | `/donation-campaign-categories/{id}` | ✅ |

```php
'name_ar' => ['required', 'string', 'max:120'], 'name_en' => ['nullable', 'string', 'max:120'],
'slug' => ['required', 'string', 'max:120', Rule::unique('donation_campaign_categories', 'slug')->ignore($category?->id)],
'is_active' => ['boolean'], 'sort_order' => ['nullable', 'integer', 'min:0'],
```

> اللوحة كانت بتعرض 5 تصنيفات وهمية (ids 1..5) لما الجدول فاضي — اتشالت. لازم تُضاف تصنيفات حقيقية من اللوحة أو seeder.

---

## 4. المواسم (`seasons`)

### 4.1 الموجود ✅
- `GET /seasons` (بتوكن) — **بيرجّع 500 حالياً، محتاج إصلاح.** شكل الرد من Postman: `{ "data": [ {id, name_ar, name_en, period_ar, period_en, tagline_ar, tagline_en, description_ar, description_en, is_active, donation_available, sort_order, programs: [...] } ] }`.
- `POST /seasons` `{name_ar, name_en, period_ar, period_en, tagline_ar, tagline_en, description_ar, description_en, is_active, donation_available, sort_order}`.
- `PATCH /seasons/{id}` `{is_active, donation_available}` — زرار التفعيل في اللوحة بيستخدمه.

### 4.2 الجديد 🆕

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/seasons` | **عام** (بدون توكن) | — | `{ "data": [Season] }` مرتبة بـ `sort_order` |
| PUT | `/seasons/{id}` | admin/editor | كل الحقول (sometimes) | `200 { "success": true, "data": Season }` |
| DELETE | `/seasons/{id}` | admin/editor | — | `200 { "success": true }` |

### 4.3 Migration 🆕 (أعمدة بتتبعت من اللوحة)

```php
Schema::table('seasons', function (Blueprint $table) {
    $table->string('slug', 40)->nullable()->unique();   // ster | thill | ramadan | ashr | qurbani | school
    $table->string('badge_ar')->nullable();  $table->string('badge_en')->nullable();
    $table->string('donate_url')->nullable();
    $table->json('items')->nullable();       // [{ar, en, desc_ar, desc_en}]
    $table->json('pricing')->nullable();     // [{label_ar, label_en, amount, tag_ar, tag_en}]
    $table->string('meta_title_ar')->nullable();  $table->string('meta_title_en')->nullable();
    $table->text('meta_description_ar')->nullable(); $table->text('meta_description_en')->nullable();
});
```

`$casts`: `items`, `pricing` → `array`؛ `is_active`, `donation_available` → `boolean`.

> **`slug` مهم:** الموقع بيطابق سجل الباك مع الموسم الثابت بالـ slug. لو مفيش slug بيطابق بالاسم العربي (مثلاً «موسم الشتاء»)، وده هش. الـ seeder في `03-seeders.md` بيملا الـ slugs الستة.

### 4.4 Validation

```php
'slug' => ['nullable', 'string', 'max:40', 'regex:/^[a-z0-9-]+$/', Rule::unique('seasons', 'slug')->ignore($season?->id)],
'name_ar' => ['required', 'string', 'max:190'], 'name_en' => ['nullable', 'string', 'max:190'],
'period_ar' => ['nullable', 'string', 'max:190'], 'period_en' => ['nullable', 'string', 'max:190'],
'tagline_ar' => ['nullable', 'string', 'max:300'], 'tagline_en' => ['nullable', 'string', 'max:300'],
'description_ar' => ['nullable', 'string'], 'description_en' => ['nullable', 'string'],
'is_active' => ['boolean'], 'donation_available' => ['boolean'], 'sort_order' => ['nullable', 'integer', 'min:0'],
'badge_ar' => ['nullable', 'string', 'max:120'], 'badge_en' => ['nullable', 'string', 'max:120'],
'donate_url' => ['nullable', 'string', 'max:255'],
'items' => ['nullable', 'array', 'max:30'], 'items.*.ar' => ['required', 'string', 'max:255'],
'items.*.en' => ['nullable', 'string', 'max:255'], 'items.*.desc_ar' => ['nullable', 'string', 'max:500'], 'items.*.desc_en' => ['nullable', 'string', 'max:500'],
'pricing' => ['nullable', 'array', 'max:20'], 'pricing.*.label_ar' => ['required', 'string', 'max:190'],
'pricing.*.label_en' => ['nullable', 'string', 'max:190'], 'pricing.*.amount' => ['required', 'numeric', 'min:0'],
'pricing.*.tag_ar' => ['nullable', 'string', 'max:60'], 'pricing.*.tag_en' => ['nullable', 'string', 'max:60'],
'meta_title_ar' => ['nullable', 'string', 'max:160'], 'meta_title_en' => ['nullable', 'string', 'max:160'],
'meta_description_ar' => ['nullable', 'string', 'max:400'], 'meta_description_en' => ['nullable', 'string', 'max:400'],
```

**الرد:** نفس الحقول كلها (حتى لو `null`) — اللوحة بتنبّه الأدمن لو حقل مقترح اتبعت ومارجعش.

**المعنى على الموقع:** الموسم «متاح للتبرع» = `is_active && donation_available`.

---

## 5. قسم «حملات تصنع الأثر» في الرئيسية

### 5.1 الجدول 🆕 (سجل واحد)

```php
Schema::create('homepage_campaigns_sections', function (Blueprint $table) {
    $table->id();
    $table->boolean('is_active')->default(true);
    $table->decimal('scroll_speed', 3, 1)->default(2.6);
    $table->boolean('show_final_cta')->default(true);
    $table->boolean('enable_scroll_trigger')->default(true);
    $table->boolean('show_skip_button')->default(true);
    $table->string('title_ar')->nullable();    $table->string('title_en')->nullable();
    $table->string('subtitle_ar')->nullable(); $table->string('subtitle_en')->nullable();
    $table->json('enabled_slugs')->nullable();
    $table->json('disabled_slugs')->nullable();
    $table->json('cards')->nullable();
    $table->timestamps();
});
```

### 5.2 Endpoints 🆕

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/homepage/campaigns-section` | **عام** | `{ "data": Section }` (لو مفيش سجل رجّع القيم الافتراضية تحت، مش 404) |
| PUT | `/homepage/campaigns-section` | admin/editor | `{ "success": true, "data": Section }` (upsert للسجل الوحيد) |

> المسار `/homepage/campaigns-section` متسجّل في الفرونت كمسار عام (`PUBLIC_ENDPOINT_PREFIXES`). الـ PUT بيتبعت بالتوكن.

```json
{
  "is_active": true, "scroll_speed": 2.6, "show_final_cta": true, "enable_scroll_trigger": true, "show_skip_button": true,
  "title_ar": "حملات تصنع الأثر", "title_en": "Campaigns that make impact",
  "subtitle_ar": "مرّر بهدوء، كل بطاقة قصة أثر حقيقية", "subtitle_en": "Scroll gently; every card is a real story of impact",
  "enabled_slugs": [], "disabled_slugs": ["volunteer"],
  "cards": [
    { "carousel_item_id": 19, "source_type": "program", "source_id": "12", "slug": "orphans",
      "name_ar": "كفالة يتيم", "name_en": "Orphan Sponsorship", "tagline_ar": "...", "tagline_en": "...",
      "image": "https://api.elyusr.org/storage/programs/xxx.webp", "price_from": 500,
      "details_url": "/programs/orphans", "donate_url": "/donate?program=orphans&amount=500",
      "is_active": true, "sort_order": 1 }
  ]
}
```

**قواعد:**
- `cards[].carousel_item_id` = id صف `/admin/homepage/carousel/items` المقابل. العنوان/الوصف/الصورة/الرابط/التفعيل/الترتيب بيتحفظوا في الكاروسيل ✅ كمان؛ `cards` بتضيف اللي جدول الكاروسيل مش شايله: `price_from`, `donate_url`, `details_url`, `source_type`, `source_id`.
- **لو `cards` مش موجودة في الـ body: متلمسش الكروت المتخزنة** (الفرونت بيشيلها لما يفشل في قراءة الكاروسيل).
- `cards` تتخزن كما هي بالترتيب.

```php
'is_active' => ['boolean'], 'scroll_speed' => ['numeric', 'min:0.5', 'max:5'],
'show_final_cta' => ['boolean'], 'enable_scroll_trigger' => ['boolean'], 'show_skip_button' => ['boolean'],
'title_ar' => ['nullable', 'string', 'max:160'], 'title_en' => ['nullable', 'string', 'max:160'],
'subtitle_ar' => ['nullable', 'string', 'max:300'], 'subtitle_en' => ['nullable', 'string', 'max:300'],
'enabled_slugs' => ['nullable', 'array'], 'enabled_slugs.*' => ['string', 'max:80'],
'disabled_slugs' => ['nullable', 'array'], 'disabled_slugs.*' => ['string', 'max:80'],
'cards' => ['sometimes', 'nullable', 'array', 'max:40'],
'cards.*.carousel_item_id' => ['nullable', 'integer'],
'cards.*.source_type' => ['required', Rule::in(['program', 'campaign', 'project', 'custom'])],
'cards.*.source_id' => ['nullable', 'string', 'max:80'],
'cards.*.slug' => ['required', 'string', 'max:120'],
'cards.*.name_ar' => ['required', 'string', 'max:190'], 'cards.*.name_en' => ['nullable', 'string', 'max:190'],
'cards.*.tagline_ar' => ['nullable', 'string', 'max:500'], 'cards.*.tagline_en' => ['nullable', 'string', 'max:500'],
'cards.*.image' => ['nullable', 'string', 'max:500'],
'cards.*.price_from' => ['required', 'numeric', 'min:0'],
'cards.*.details_url' => ['nullable', 'string', 'max:255'], 'cards.*.donate_url' => ['nullable', 'string', 'max:255'],
'cards.*.is_active' => ['boolean'], 'cards.*.sort_order' => ['integer', 'min:0'],
```

### 5.3 الكاروسيل — ناقص واحد 🆕
`PUT /admin/homepage/carousel/items/{id}` `{title_ar, title_en, description_ar, description_en, image, link_url, is_active}` → `{ "data": Item }`. اللوحة بتستدعيه عند تعديل بطاقة وهو مش في Postman.

> **السرعة:** اللوحة بتكتب `autoplay_speed = scroll_speed × 1000` في إعدادات الكاروسيل ✅ (السلوك القديم) **و** `scroll_speed` في القسم الجديد. الموقع بيفضّل قيمة القسم لما تكون موجودة.

---

## 6. ترتيب التنفيذ المقترح
1. إصلاح `GET /seasons` (500) وجعله عام. 2. `key` + PUT/DELETE/reorder للباقات (ده اللي محتاجه صاحب المؤسسة لتغيير سعر الكرتونة). 3. أعمدة `page_content/seo/faqs` ورجوع `subtitle/category/image` + أمر الترحيل. 4. PUT/DELETE للمواسم + الأعمدة. 5. `homepage_campaigns_sections`. 6. by-slug + PUT التصنيفات + PUT عنصر الكاروسيل.

---

## 7. توحيد الـ slugs (الحملات)

| الحملة | id | slug في الباك حالياً | slug صفحة الهبوط | مسار الصفحة |
|---|---|---|---|---|
| سِتر | 18 | `sitr` | `setr` | `/setr` |
| ظِلّ | 17 | `zell` | `dhill` | `/dhill` |
| مَرْكون | 19 | `markoon` | `markoun` | `/markoun` |
| عربون خير | 22 | `arboun-kheir` | `arboun` | `/arboun` |
| أَثَر | 21 | `athar` | `athar` ✓ | `/athar` |
| موسم الخير | 20 | `ramadan` | `ramadan` ✓ | `/ramadan` |
| الغذاء الشهري | 23 | `food` | `food` ✓ | `/food-box` |

الفرونت بيتعامل مع الفرق بجدول (`src/data/campaignPages/index.ts` → `apiSlugs` و `apiIds`). المقترح: **متغيّرش الـ slug الحالي** (روابط التبرع `/donate?campaign=sitr` شغالة بيه)، وخلي `by-slug` يقبل الاتنين (عمود `aliases` JSON أو `landing_slug` زي ما في `03-seeders.md`).

**المواسم:** `ster` ≈ سِتر الشتاء، `thill` ≈ ظِلّ الصيف (الموسم غير الحملة؛ كل واحد له جدوله).

---

## 8. الملفات في الفرونت (للمراجعة)

| الملف | بيستدعي |
|---|---|
| `src/data/api/donationCampaignsAdminApi.ts` | GET `/donation-campaigns/{id}`، by-slug، كل endpoints الباقات، PUT التصنيف |
| `src/components/admin/campaigns/CampaignPackagesManager.tsx` + `packageHelpers.ts` | إدارة الباقات (إضافة/تعديل/حذف/ترتيب/key) |
| `src/pages/admin/AdminDonationCampaignDetail.tsx` | POST/PUT الحملة بـ `page_content/seo/faqs`، ثم GET للتحقق، وPOST الباقات الافتراضية للحملة الجديدة |
| `src/pages/admin/AdminDonationCampaigns.tsx` | القائمة، الحفظ السريع + التحقق، التصنيفات، نافذة الباقات |
| `src/data/campaignPages/api.ts` | القراءة العامة لمحتوى صفحة الهبوط (الحملة أولاً ثم `/content` القديم للقراءة فقط) |
| `src/data/api/seasonsApi.ts`, `src/pages/admin/AdminSeasons.tsx`, `src/data/seasons.ts` | `/seasons` بكل عملياته |
| `src/data/api/campaignsSectionApi.ts`, `src/data/campaignsSettings.ts`, `src/pages/admin/AdminCampaignsSection.tsx` | `/homepage/campaigns-section` + الكاروسيل |
