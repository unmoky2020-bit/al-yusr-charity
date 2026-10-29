# 06 — قراءة المحتوى العام للموقع من الـ API (مفتاح `VITE_CONTENT_SOURCE`)

## الفكرة باختصار

الموقع العام (مش لوحة التحكم) لسه بيقرا البرامج، فورم التبرع، صفحات الخدمات، خريطة الخدمات، المدونة، المعرض والمشاريع
من ملفات TypeScript جوه الفرونت. جهّزنا الفرونت إنه يقرا نفس المحتوى من Laravel **بنفس الشكل النهائي بالظبط**، والتحويل
بمفتاح واحد:

```env
# .env.production
VITE_CONTENT_SOURCE=static   # الافتراضي — نفس سلوك النهارده بالظبط، مفيش أي request جديد
VITE_CONTENT_SOURCE=api      # اقرا من الـ API، ولو عنصر مش موجود/مش منشور في الـ API يتعرض نسخته الثابتة
VITE_CONTENT_SOURCE=auto     # نفس api
```

- الكود: `src/lib/contentSource.ts` (المفتاح) و `src/data/sources/*.ts` (لكل مجموعة بيانات: دالة `mapApiXxx` بتحوّل سجل الـ API
  لنفس الـ type الثابت، و hook `useXxx()`).
- قاعدة الدمج في وضع `api`: ترتيب العناصر الثابتة بيفضل زي ما هو، العنصر اللي له سجل **منشور** في الـ API بيتبدّل بنسخة الـ API،
  أي حقل ناقص في السجل بياخد قيمته من النسخة الثابتة، العناصر الجديدة اللي في الـ API بس بتتضاف في الآخر،
  ولو الـ request فشل أو رجع فاضي يتعرض كل المحتوى الثابت. يعني الموقع عمره ما يطلع فاضي.
- السجل "منشور" لو: `is_active != false` و `is_public != false` و `status`/`workflow_status` = `published` (أو مش موجود)
  و (للقوائم العامة فقط) `hide_from_audience != true`. فورم التبرع **مش** بيحترم `hide_from_audience` (زي `general-donation`
  المخفي من القوائم لكنه متاح للتبرع).
- سياسة السجل المخفي: الثابت `HIDDEN_RECORDS_FALL_BACK_TO_STATIC = true` في `src/data/sources/_shared.ts` معناه إن السجل
  الموجود لكن غير المنشور يرجع لنسخته الثابتة (أمان أثناء ملء الداتابيز). بعد مقارنة الصفحات ومراجعتها نخليه `false`
  عشان "إخفاء" الأدمن يشيل العنصر من الموقع فعلاً.
- كل الصور بتمر على `formatServerImageUrl`؛ مسار نسبي زي `programs/xxx.jpg` بيتحوّل لـ `https://api.elyusr.org/storage/programs/xxx.jpg`.
- كل الـ GET دي **لازم تكون عامة (بدون توكن)**؛ الفرونت بيبعت `per_page=100` لكل قائمة.

الرموز: ✅ موجود حالياً (من `_live_api_field_shapes.md` أو GET حي يوم 2026-10-29) — 🆕 مطلوب/مقترح.

---

## 1) البرامج — `src/data/sources/programs.ts`

**بيستخدمها:** `/programs` (`src/pages/site/Projects.tsx`)، `/geo/:gov/:program` (`GeoProgram.tsx`)، `/dakahlia/:city/:program`
(`CityProgram.tsx`)، روابط البرامج المرتبطة (`RelatedContentLinks.tsx`). (صفحة التفاصيل `ProgramDetail.tsx` جاهزة للربط بسطرين.)

| Endpoint | الحالة |
|---|---|
| `GET /programs?per_page=100` | ✅ موجود ورجّع 200 بدون توكن (لكن الكومنت في `laravelApi.ts` بيقول إنه محتاج auth — **لازم يفضل عام**) |
| `GET /programs/by-slug/{slug}` | 🆕 مقترح (الصفحات بتتعنون بالـ slug؛ حالياً الفرونت بيجيب القائمة ويدوّر فيها) |

ربط الحقول (السجل ← `ProgramContent`):

| الفرونت | الـ API |
|---|---|
| `slug` | `slug` ✅ — أو أول قيمة في `aliases` 🆕 تطابق slug ثابت (مثال `general-donation` ← `aliases: ["general"]`). slug محفوظ كرابط كامل (`https://elyusr.org/food-box`) بيتقص لآخر جزء. |
| `ar/en.name` | `name_ar/en` ✅ ← `title_ar/en` ← `top_section.title_*` |
| `ar/en.tagline` | `tagline_ar/en` ✅ ← `top_section.subtitle_*` |
| `ar/en.desc` | `description_ar/en` ✅ |
| `ar/en.benefits[]` | `benefits_ar/en` ✅ (array) |
| `ar/en.longContent[]` | `content_ar/en` ✅ (فقرات مفصولة بسطر فاضي `\n\n`) |
| `image` | `image` ✅ ← `hero_image` ← `top_section.image` |
| `priceFrom` | `minimum_amount` ✅ ← `top_section.minimum_amount` ← أقل `donation_packages[].amount` |
| `season` (شارة الكارت) | `period_ar/en` ✅ |
| `gallery[]` | `gallery` 🆕 (JSON array من مسارات صور أو `{image}`) |

**ملحوظة مهمة للبيانات الحية:** السجلات `box` و`odhya` حالياً `draft`/`is_active=false`/`hide_from_audience=true`،
و`zakat` `is_active=false`. بعد تشغيل الـ seeders لازم يبقوا منشورين وإلا هيفضلوا جايين من النسخة الثابتة.
البرامج الـ 7 اللي بتتزرع من فورم التبرع فقط (`general-donation`, `inqadh`, `monthly-sponsorship`, `mosques`, `monthly-meat`,
`quran`, `takrim`) **لازم** تتزرع بـ `hide_from_audience=true`، وإلا هتظهر ككروت جديدة في صفحة `/programs` (مالهاش صفحة تفاصيل).

## 2) عناصر فورم التبرع — `src/data/sources/donationEntities.ts`

**بيستخدمها:** شريط البرامج في `/donate` (`SimpleDonateHero.tsx`)، اختيار البرنامج في الفورم (`DonationEntityItem.tsx`)،
صفحة المشاريع (`ProjectsPage.tsx`). (`DonatePage.tsx` جاهزة للربط بسطر واحد.)

| Endpoint | الحالة |
|---|---|
| `GET /programs?per_page=100` | ✅ |
| `GET /projects?per_page=100` | ✅ (200 بدون توكن) |
| `GET /donation-campaigns?per_page=100` | ✅ (موجود في قائمة الـ public في الفرونت) |
| `GET /donation-entities` | 🆕 اختياري — endpoint واحد يرجّع الثلاثة بنفس الشكل بدل 3 requests |

id العنصر = أول تطابق مع id ثابت من: `donation_entity_id` 🆕 (أو `extra.donation_entity_id`) ← `slug` ← `landing_slug` 🆕 ← `aliases[]` 🆕،
وإلا جدول ثابت (`general-donation→general`, `zell→dhill`, `sitr→shelter`, `markoon→markoun`)، وإلا الـ slug.
لو نفس الـ id موجود في أكتر من مورد (مثلاً برنامج `shelter` وحملة `sitr`) بيتاخد المورد اللي نوعه يطابق النوع الثابت (حملة).

| الفرونت (`DonationEntity`) | الـ API |
|---|---|
| `ar` / `en` | `donation_name_ar/en` 🆕 (اسم الفورم لو مختلف عن اسم صفحة البرنامج، مثال "كفالة الأيتام" مقابل "كفالة يتيم") ← `name_ar/en` ✅ ← `title_*` ← `name` |
| `taglineAr/En` | `donation_tagline_ar/en` 🆕 ← `tagline_*` ✅ ← `subtitle_*` ← `short_description(_en)` ✅ (مشاريع) |
| `image` | `donation_image` 🆕 ← `image` ✅ ← `cover_image` ✅ (مشاريع) |
| `entityType` | النوع الثابت لو موجود، وإلا مصدر السجل (program/project/campaign) |
| `donationType` | `donation_type` 🆕 (`cash`/`in_kind`/`both`) |
| `categoryAr/En` | `category_ar/en` 🆕 ← `category.name_*` (حملات) ← `axis.name_*` ✅ (برامج) |
| `priceFrom` | `price_from` 🆕 ← `starting_price` ✅ (مشاريع) ← أقل باقة نشطة ← `minimum_amount` ✅ |
| `color`, `isSeasonal`, `isMarkoun` | `color`, `is_seasonal`, `is_markoun` 🆕 |
| `shares[]` | `donation_packages[]` ✅ النشطة مرتبة بـ `sort_order`: `id`←`key` 🆕 (وإلا id الثابت لو `name_ar` متطابق، وإلا `pkg-{id}`)، `nameAr/En`←`name_ar/en`، `price`←`amount`، `popular`←`is_popular` 🆕، `descAr/En`←`description_ar/en` 🆕 |
| `cases[]` | `cases[]` ✅: `refCode`←`code`، `titleAr`←`title`، `beneficiaryName`، `governorate`، `city`، `neededAmount`←`target_amount`، `raisedAmount`←`collected_amount` 🆕 (مش راجع في الـ nested case حالياً)، `urgent`←`priority in (high,urgent)` |

أي حقل من دول ممكن يرجع جوه عمود `extra` (JSON) بدل عمود مستقل — الفرونت بيقراه من الاتنين.
**فرق معروف بعد الـ seed:** باقات الحملات اتزرعت من أسعار صفحات الهبوط (قرار `03-seeders.md`) فمش هتطابق `shares` القديمة للحملات في فورم التبرع.

## 3) صفحات الخدمات — `src/data/sources/services.ts`

**بيستخدمها:** `/services/:slug` (`ServiceRouter.tsx`) وكروت `/services-map` (`ServicesMap.tsx`).

| Endpoint | الحالة |
|---|---|
| `GET /services?per_page=100` | 🆕 **غير موجود** (رجّع 404) — عام |
| `GET /services/{slug}` | 🆕 عام، بالـ slug |

```php
Schema::create('services', function (Blueprint $t) {
    $t->id();
    $t->string('slug')->unique();            // mosques, wells, farm, housing, ster, markoun, treatment, orphans, marriage, food-box
    $t->string('program_slug')->nullable();  // برنامج التبرع
    $t->string('sector')->nullable();
    $t->string('hero_image')->nullable();
    $t->string('badge_ar')->nullable();  $t->string('badge_en')->nullable();
    $t->string('title_ar');              $t->string('title_en')->nullable();
    $t->text('intro_ar')->nullable();    $t->text('intro_en')->nullable();
    $t->string('meta_title_ar')->nullable();       $t->string('meta_title_en')->nullable();
    $t->text('meta_description_ar')->nullable();   $t->text('meta_description_en')->nullable();
    $t->json('bullets_ar')->nullable();  $t->json('bullets_en')->nullable();
    $t->json('stats')->nullable();     // [{value_ar,value_en,label_ar,label_en}]
    $t->json('features')->nullable();  // [{icon (اسم أيقونة lucide), title_ar,title_en, description_ar,description_en}]
    $t->json('tiers')->nullable();     // [{amount, unit_ar,unit_en, desc_ar,desc_en, highlight}]
    $t->json('related')->nullable();   // [{to, ar, en}]
    $t->json('faqs')->nullable();      // [{question_ar,answer_ar,question_en,answer_en}]
    $t->boolean('is_active')->default(true);
    $t->unsignedInteger('sort_order')->default(0);
    $t->timestamps();
});
```

الفرونت بيقبل كمان: `seo_title_*`/`seo_desc_*` بدل `meta_*`، `ar/en/arL/enL` في `stats`، `t_ar/d_ar` في `features`،
`url/label_ar` في `related`. أيقونة مش معروفة ← `Heart`.

## 4) خريطة الخدمات (القطاعات) — `src/data/sources/servicesMap.ts`

**بيستخدمها:** `/services-map` (`ServicesMap.tsx`: عدد القطاعات والبرامج + JSON-LD).

| Endpoint | الحالة |
|---|---|
| `GET /service-categories` | 🆕 غير موجود (404) — الأساسي، متزرع من `DONATE_SECTORS` |
| `GET /axes` | ✅ عام — بديل لو الأول مش موجود/فاضي (`slug` = id القطاع: `food`, `health`, `education`) |

الحقول: `slug`→`id`، `donate_key`→`donate` (وإلا `sector-{slug}`)، `title_ar/en` (أو `name_*`)، `summary_ar/en`،
`intro_ar/en` (أو `description_*`)، `programs[]`: `{slug, title_ar, title_en, description_ar, description_en, href}`.
**مطلوب في `/axes`:** البرامج المتداخلة بترجع `{id, name, description, is_active}` بس — لازم يتضاف `slug` (و`name_en`,
`description_en`) وإلا قائمة برامج القطاع تفضل من الثابت.

## 5) المدونة — `src/data/sources/blog.ts`

**بيستخدمها:** `/blog` (`Blog.tsx`) و `/blog/:slug` (`BlogPost.tsx`).

| Endpoint | الحالة |
|---|---|
| `GET /blog-seo?per_page=100` | ✅ عام |
| `GET /content?type=article&per_page=100` | ✅ عام (ملحوظة: الفرونت بيقراه حتى في وضع static — ده السلوك الحالي واتساب زي ما هو) |
| `GET /blog-seo/by-slug/{slug}` | 🆕 مقترح (حالياً `GET /blog-seo/{id}` بالرقم بس) |

`slug` ✅، `title_ar/en` ✅، `summary_*`→excerpt ✅، `content_*`→body (فقرات `\n\n`) ✅، `cover_image` ✅ ← `og_image_url`،
`category_ar/en` ✅، `tags_ar/en` ✅، التاريخ ← `published_at` 🆕 ← `scheduled_at` ← `created_at`.
المنشور فقط: `workflow_status=published` (blog-seo) أو `status=published` (content). سجل `/blog-seo` بيكسب سجل `/content` بنفس الـ slug.
**مطلوب:** `published_at` عمود حقيقي (الترتيب بالتاريخ)، و`cover_image` يرجع رابط كامل.

## 6) المعرض — `src/data/sources/gallery.ts`

**بيستخدمها:** `/gallery` (`Gallery.tsx`). في وضع static الصفحة بتقرا `/gallery` زي النهارده بالظبط (نفس الكود القديم اتنقل).

| Endpoint | الحالة |
|---|---|
| `GET /gallery?per_page=100` | ✅ عام (`is_public`) |

`id` ← `static_id` 🆕 (أو `extra.static_id`/`key`) ← رقم السجل؛ `src` ← `external_url` ← `image` ✅؛ `alt`/`altAr` ← `alt_en/ar` ✅
(وإلا "العنوان — البرنامج — المدينة")؛ `category` ← `category` 🆕 ← `program` لو قيمته فئة (`families|qurbani|education|health|water|campaigns`
— ده اللي الـ seeder بيحطه) ← استنتاج من البرنامج؛ `programSlug` ← `program_slug` 🆕؛ `donateProgram` ← أول قيمة في `donation_program` ✅
(القيمة الحالية "odhya, box, water" بتتقرا "odhya")؛ `city` ✅.

## 7) المشاريع — `src/data/sources/projects.ts`

`ProjectsPage.tsx` بيعرض عناصر فورم التبرع من نوع `project` (القسم 2) — المصدر `GET /projects` ✅.
الحقول: `name`→`ar`، `name_en`→`en`، `short_description(_en)`→tagline، `cover_image`، `starting_price`→`priceFrom`،
`display_order`، `donation_packages`، `cases`. **مطلوب:** `slug` ثابت بدون رقم عشوائي (الحالي `water-station-dakahlia-39280`)،
و`description_en`، و`collected_amount` داخل الـ cases.

---

## 8) متطلبات القراءة العامة (بدون توكن) — ملخص للباك

| Endpoint | الحالي | المطلوب |
|---|---|---|
| `GET /programs`, `/programs/{id}` | 200 بدون توكن | يفضل عام + 🆕 `/programs/by-slug/{slug}` |
| `GET /projects` | 200 | عام + slug نظيف |
| `GET /donation-campaigns` | 200 | عام + 🆕 `landing_slug`, `aliases` |
| `GET /gallery`, `/blog-seo`, `/content`, `/axes` | 200 | عامة |
| `GET /seasons` | **500 Server Error** (وكان محتاج توكن) | **يتصلح ويبقى عام** (بتستخدمه صفحات المواسم والرئيسية) |
| `GET /services`, `/services/{slug}` | **404** | 🆕 جديد وعام |
| `GET /service-categories` | **404** | 🆕 جديد وعام |
| `GET /blog-seo/by-slug/{slug}` | غير موجود | 🆕 مقترح |

كل الـ GET العامة ترجع المنشور بس للزائر المجهول (`is_active=true` و`status=published`)، ونفس شكل الـ pagination الحالي
(`{data:[...], links, meta}`) — الفرونت بيقبل كمان `{data:{data:[...]}}` أو array مباشرة.

## 9) خطوات التحويل (Switch procedure)

1. شغّل الـ seeders (ملف `03-seeders.md` + `seeders/laravel/*.php`) على نسخة staging، وتأكد إن البرامج الـ 13 الأساسية
   `status=published`, `is_active=true`، والبرامج الـ 7 الخاصة بالفورم `hide_from_audience=true`.
2. نفّذ الـ endpoints العامة الناقصة في القسم 8 (`/services`, `/service-categories`, إصلاح `/seasons`).
3. في الفرونت: `VITE_CONTENT_SOURCE=auto` في `.env.production` (أو staging) ثم `npm run build`.
4. قارن الصفحات دي في النسختين (static و auto) جنب بعض: `/programs`، `/programs/orphans`، `/geo/dakahlia/box`،
   `/dakahlia/mansoura/box`، `/donate` (الشريط + اختيار البرنامج + الباقات)، `/projects`، `/services-map`، `/services/wells`،
   `/blog`، `/blog/<slug>`، `/gallery`. أي فرق = حقل ناقص في الداتابيز (القيمة الثابتة هي المرجع).
5. لما المقارنة تتعدّى: اعمل deploy بـ `auto`. بعدها (اختياري) خلّي `HIDDEN_RECORDS_FALL_BACK_TO_STATIC = false`.
6. للرجوع في أي لحظة: `VITE_CONTENT_SOURCE=static` + rebuild — مفيش أي تغيير في الداتابيز مطلوب.

## 10) ملفات الفرونت

- `src/lib/contentSource.ts` — المفتاح.
- `src/data/sources/_shared.ts` — الدمج، الـ unwrap، سياسة الإخفاء، `withExtra`، hook عام `useSourced`.
- `src/data/sources/{programs,donationEntities,projects,services,servicesMap,blog,gallery}.ts` — المحوّلات والـ hooks.
- `src/data/sources/*.test.ts(x)` — اختبارات بعينات حقيقية من الـ API الحي + أشكال سجلات الـ seeders.
