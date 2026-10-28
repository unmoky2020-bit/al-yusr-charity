# متطلبات الباك إند — محتوى صفحات الحملات (Campaign Landing Page Content)

> **الهدف:** نقل محتوى صفحات الهبوط الخاصة بالحملات (`/setr`, `/dhill`, `/athar`, `/ramadan`, `/markoun`, `/arboun`) من التخزين المؤقت الحالي إلى حقول حقيقية على جدول `donation_campaigns`، بحيث تُعدَّل من شاشة **إدارة الحملات والمبادرات** في لوحة التحكم (تبويبات: محتوى الصفحة، السيو والـ Meta، الأسئلة الشائعة).
>
> **الوضع الحالي (مؤقت، يعمل الآن بدون أي تعديل في الباك):** الفرونت يحفظ المحتوى كعنصر في `/api/v1/content` بنوع `page` وslug `campaign-page-{slug}` والـ JSON داخل `content_ar`. بمجرد توفر الحقول أدناه، يتم تحويل الفرونت لها بتعديل ملف واحد (`src/data/campaignPages/api.ts`) ولن تتأثر لوحة التحكم.

---

## 1. الحقول المطلوبة على `donation_campaigns`

| العمود | النوع | الوصف |
|---|---|---|
| `page_content` | `JSON` nullable | محتوى صفحة الهبوط: hero, hadith, prices, stats, sections, cta (الشكل بالأسفل) |
| `seo` | `JSON` nullable | السيو: meta title/description/keywords (ar/en)، canonical، noindex، nofollow |
| `faqs` | `JSON` nullable | مصفوفة أسئلة شائعة `[{question_ar, answer_ar, question_en, answer_en}]` |

> الفرونت **يرسل بالفعل** المفاتيح التالية في `PUT /admin/donation-campaigns/{id}` والباك يتجاهلها حالياً: `meta_title_ar/en`, `meta_description_ar/en`, `focus_keywords_ar/en`, `canonical_url`, `noindex`, `nofollow`, `faqs`. يمكن قبولها كما هي وتجميع السيو في عمود `seo`، أو قبول كائن `seo` مباشرة (الاثنان موضحان في القسم 4).

### Migration

```php
Schema::table('donation_campaigns', function (Blueprint $table) {
    $table->json('page_content')->nullable()->after('benefits');
    $table->json('seo')->nullable()->after('page_content');
    $table->json('faqs')->nullable()->after('seo');
});
```

### Model

```php
protected $fillable = [/* الموجود */ 'page_content', 'seo', 'faqs'];
protected $casts = [/* الموجود */ 'page_content' => 'array', 'seo' => 'array', 'faqs' => 'array', 'benefits' => 'array'];
```

---

## 2. شكل `page_content` (JSON)

كل نص ثنائي اللغة بالشكل `{"ar": "...", "en": "..."}`. المعرّفات (`id`) ثابتة من الكود ولا يُسمح بتغييرها من اللوحة (تُستخدم لربط السعر بالكارت/الحاسبة).

```json
{
  "hero":   { "eyebrow": {"ar":"","en":""}, "title": {"ar":"","en":""}, "title2": {"ar":"","en":""}, "lead": {"ar":"","en":""}, "donateLabel": {"ar":"","en":""} },
  "hadith": { "text": {"ar":"","en":""}, "source": {"ar":"","en":""} },
  "stats":  [ { "id": "boxes", "label": {"ar":"كرتونة رمضان","en":"Ramadan boxes"}, "value": 1400, "unit": {"ar":"كرتونة","en":"boxes"}, "note": {"ar":"","en":""} } ],
  "sections": {
    "layers": { "title": {"ar":"","en":""}, "lead": {"ar":"","en":""},
                "items": [ { "id": "roof", "title": {"ar":"","en":""}, "desc": {"ar":"","en":""}, "extra": {"ar":"","en":""} } ] }
  },
  "cta":    { "title": {"ar":"","en":""}, "sub": {"ar":"","en":""} }
}
```

- `stats[].value` قد يكون `null` (يُعرض كعلامة ✓ بدل الرقم).
- `prices[].amount` عدد صحيح ≥ 0 بالجنيه.
- المرجع الكامل للأنواع: `src/data/campaignPages/types.ts`. القيم الافتراضية لكل حملة: `src/data/campaignPages/{setr,dhill,athar,ramadan,markoun,arboun}.ts`.

### الأسعار = باقات التبرع (لا تُخزَّن في `page_content`)
صفحة الهبوط تقرأ أسعار بنودها (الحاسبات والكروت) من `donation_packages` الخاصة بالحملة، بالمطابقة على **اسم الباقة**. المطلوب لتثبيت الربط:
- إضافة عمود `key` (string, nullable, unique per campaign) على `donation_packages` بقيم ثابتة مثل `blanket`, `clothes`, `window`, `door`, `bed`, `roof_bitumen`, `roof_wood`, `full`, `share` (المعرّفات في `src/data/campaignPages/<slug>.ts` → `prices[].id`).
- إظهاره في الـ Resource وقبوله في إنشاء/تعديل الباقة. بعدها يتحول الفرونت للمطابقة بالـ `key` بدل الاسم (سطر واحد في `src/hooks/useCampaignPage.ts`).
- أي بند بلا باقة مطابقة يعرض السعر الافتراضي من الكود.

## 3. شكل `seo` و `faqs`

```json
"seo": {
  "title": {"ar":"","en":""}, "description": {"ar":"","en":""}, "keywords": {"ar":"","en":""},
  "canonical": "https://elyusr.org/setr", "noindex": false, "nofollow": false
}
"faqs": [ { "question_ar": "", "answer_ar": "", "question_en": "", "answer_en": "" } ]
```

---

## 4. الـ Endpoints

### قراءة (عامة، بدون توكن)
- `GET /api/v1/donation-campaigns` و `GET /api/v1/donation-campaigns/{id}`: إضافة الحقول الثلاثة للـ Resource كما هي (JSON).
- **مطلوب جديد:** `GET /api/v1/donation-campaigns/by-slug/{slug}` (أو دعم `?slug=` في القائمة) لأن صفحة الهبوط تعرف الـ slug فقط.

### كتابة (admin / editor)
- `PUT /api/v1/admin/donation-campaigns/{id}` (ومع صورة: `POST` + `_method=PUT` طبقاً لقاعدة المشروع): قبول `page_content`, `seo`, `faqs`.
  - **توافق خلفي:** إن وصلت مفاتيح السيو المسطّحة (`meta_title_ar` … `nofollow`) تُجمَّع في `seo` تلقائياً.
- `DELETE`/إعادة ضبط: يكفي إرسال `page_content: null` (الفرونت يعرض الافتراضي من الكود عندما يكون `null`).

### Validation (مقترح)
```php
'page_content' => ['nullable', 'array'],
'page_content.hero' => ['nullable', 'array'],
'page_content.prices' => ['nullable', 'array'],
'page_content.prices.*.id' => ['required_with:page_content.prices', 'string', 'max:64'],
'page_content.prices.*.amount' => ['required_with:page_content.prices', 'integer', 'min:0'],
'page_content.stats.*.value' => ['nullable', 'integer', 'min:0'],
'page_content.sections' => ['nullable', 'array'],
'page_content.faq' => ['prohibited'], // الأسئلة في faqs وليس داخل page_content
'seo' => ['nullable', 'array'],
'seo.title.ar' => ['nullable', 'string', 'max:120'], 'seo.title.en' => ['nullable', 'string', 'max:120'],
'seo.description.ar' => ['nullable', 'string', 'max:320'], 'seo.description.en' => ['nullable', 'string', 'max:320'],
'seo.canonical' => ['nullable', 'url'], 'seo.noindex' => ['boolean'], 'seo.nofollow' => ['boolean'],
'faqs' => ['nullable', 'array', 'max:40'],
'faqs.*.question_ar' => ['required', 'string', 'max:300'], 'faqs.*.answer_ar' => ['required', 'string', 'max:2000'],
'faqs.*.question_en' => ['nullable', 'string', 'max:300'], 'faqs.*.answer_en' => ['nullable', 'string', 'max:2000'],
```

### الصلاحيات
- `admin`: حفظ مباشر.
- `editor`: إن كان نظام `content-change-requests` مطبقاً على الحملات، تمرّ هذه الحقول عبره بنفس الآلية (لا يحتاج الفرونت أي تغيير).

---

## 5. توحيد الـ slugs (مهم)

| الحملة | slug في الباك حالياً | slug صفحة الهبوط |
|---|---|---|
| سِتر | `sitr` | `setr` |
| ظِلّ | `zell` | `dhill` |
| مَرْكون | `markoon` | `markoun` |
| عربون خير | `arboun-kheir` | `arboun` |
| أَثَر | `athar` | `athar` ✓ |
| موسم الخير | `ramadan` | `ramadan` ✓ |

الفرونت يتعامل مع الاختلاف حالياً بجدول مطابقة (`src/data/campaignPages/index.ts` → `apiSlugs`). **الأفضل** توحيد الـ slugs في الباك على أسماء صفحات الهبوط (العمود الثالث) مع إبقاء الروابط القديمة تعمل.

---

## 6. ما الذي سيتغير في الفرونت بعد التنفيذ

ملف واحد: `src/data/campaignPages/api.ts`
- `load(slug)` → `GET /donation-campaigns/by-slug/{slug}` وقراءة `page_content` + `seo` + `faqs` (بدلاً من `/content`).
- `save(slug, content)` → `PUT /admin/donation-campaigns/{id}` بالحقول الثلاثة.
- `reset(slug)` → `PUT` بـ `page_content: null, seo: null, faqs: null`.

لا يتغير أي شيء آخر في لوحة التحكم أو الصفحات العامة.

---

## 7. ترحيل البيانات المؤقتة (اختياري)
عناصر `/content` بنوع `page` وslug يبدأ بـ `campaign-page-` تحتوي JSON بنفس الشكل أعلاه في `content_ar` (مع `faq` و`seo` داخله). يمكن ترحيلها بأمر Artisan بسيط ثم حذفها.
