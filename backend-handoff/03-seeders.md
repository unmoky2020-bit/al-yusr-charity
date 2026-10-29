# 03 — Seeders: نقل المحتوى الثابت من الفرونت إلى قاعدة البيانات

> **الهدف:** كل المحتوى المكتوب حالياً داخل كود الفرونت (البرامج، الحملات وصفحات هبوطها، الباقات، الخدمات، المواسم، المدونة، الأسئلة الشائعة، المعرض، القصص، صفحات الجغرافيا...) اتصدّر كملفات JSON **بأسماء أعمدة الباك الحقيقية**، ومعاها Seeders جاهزة للـ Laravel. بعد التشغيل مرة واحدة، الفرونت يقدر يقرأ نفس المحتوى من الـ API ويظهر بنفس الشكل بالظبط.
>
> **قاعدة الأمان:** الـ Seeder **لا يكتب فوق أي محتوى عدّله الأدمن**. الصف الموجود بيتملّى فيه **الأعمدة الفاضية بس** (`NULL` / `''` / `[]` / `{}`). الصف الناقص بيتضاف. تقدر تشغّله أكتر من مرة بأمان.

---

## 1. الملفات

| المسار (في ريبو الفرونت) | الوصف |
|---|---|
| `scripts/export-seed-data.ts` | سكربت التصدير. يعيد توليد كل ملفات JSON من الكود. |
| `backend-handoff/seeders/data/*.json` | ملف لكل جدول (الأعداد في `_manifest.json`). |
| `backend-handoff/seeders/data/_images_to_upload.json` | كل ملفات الصور المستخدمة + الجداول اللي بتستخدمها. |
| `backend-handoff/seeders/data/donation_entities_map.json` | مرجع فقط (لا يُزرع): ربط كل عنصر في فورم التبرع بسجل في الباك. |
| `backend-handoff/seeders/laravel/*.php` | الـ Seeders (namespace `Database\Seeders`). |

إعادة توليد الـ JSON (من جذر ريبو الفرونت):

```bash
npx vite-node scripts/export-seed-data.ts
```

## 2. طريقة التشغيل في الباك

```bash
# 1) انسخ الملفات
cp frontend/backend-handoff/seeders/laravel/*.php   database/seeders/
mkdir -p database/seeders/data database/seeders/assets
cp frontend/backend-handoff/seeders/data/*.json     database/seeders/data/

# 2) (اختياري) الصور: انسخ كل ملفات src/assets (بما فيها src/assets/field/*) في مجلد واحد مسطّح
find frontend/src/assets -type f -exec cp {} database/seeders/assets/ \;
php artisan storage:link

# 3) نفّذ الـ migrations الخاصة بالأعمدة/الجداول الجديدة (القسم 4) — اختياري، الـ seeder يشتغل من غيرها
php artisan migrate

# 4) التشغيل
php artisan db:seed --class=ContentSeeder
# أو جدول واحد
php artisan db:seed --class=ProgramsSeeder
```

**سلوك الـ Seeders (في `ContentSeederBase.php`):**
- المطابقة بمفتاح طبيعي (`slug` غالباً) — نفس فكرة `updateOrCreate` لكن **التحديث يملأ الفاضي فقط**.
- أي عمود مش موجود في الجدول يُتجاهل بهدوء → تقدر تشغّل قبل الـ migrations وبعدها. لما تضيف عمود جديد بنفس الاسم الموجود تحت `extra` في الـ JSON، الـ seeder هيملاه تلقائياً في التشغيل الجاي. لو أضفت عمود `extra` (JSON) على الجدول، كل الحقول الإضافية هتتخزن فيه كما هي.
- جدول مش موجود → يتخطّاه مع تحذير (الجداول الجديدة في القسم 4).
- الصور: قيمة الصورة في الـ JSON هي **مسار الملف في الفرونت** (مثال `src/assets/poster-meat.png`). لو الملف موجود في `database/seeders/assets/` يتنسخ على الـ disk `public` تحت `<folder>/<filename>` ويتخزن المسار ده (نفس شكل `programs/xxx` اللي الـ API بيرجّعه كـ `https://api.elyusr.org/storage/programs/xxx`). لو مش موجود → عمود الصورة يفضل زي ما هو.
- `created_by` / `author_id`: لو العمود موجود ومطلوب، بياخد `SEED_USER_ID` من `.env` أو أصغر `users.id`.
- الأبناء بيشيروا للأب بالـ slug (`program_slug`, `project_slug`, `donation_campaign_slug`, `faq_category_slug`) والـ seeder يحوّله لـ id (يدور في `slug` ثم `landing_slug` ثم `aliases` لو الأعمدة دي موجودة).
- **الباقات والأقسام:** برنامج/حملة/مشروع **عنده باقات قبل التشغيل لا تُضاف له باقات جديدة** (يتطبع تحذير بالباقات اللي اتخطّت) — بس الباقة اللي اسمها العربي مطابق بيتملّى فيها `key` لو فاضي. نفس الشيء في أقسام صفحة البرنامج: برنامج عنده أقسام بالفعل لا تُضاف له أقسام جديدة.

**ترتيب التنفيذ في `ContentSeeder`:** `FaqCategories → Faqs → Programs → Projects → DonationCampaigns → ProgramPageSections → DonationPackages → Seasons → ServiceCategories → Services → ServicesMapAxes → BlogCategories → BlogAuthors → BlogPosts → Gallery → Stories → HomepageCampaignsSection → GeoPages → DakahliaCities`.

> **أسماء الجداول:** مكتوبة كـ `const TABLE` في أول كل seeder. راجعها مع الـ schema عندك، خصوصاً: `blog_seo` (الجدول وراء `/blog-seo`)، `program_page_sections`، `donation_packages` (لو الباقات في 3 جداول منفصلة عدّل `DonationPackagesSeeder::TABLES`)، `gallery`.

---

## 3. الجداول — المصدر، العدد، ربط الحقول

الرمز ✅ = عمود موجود في الـ API الحالي. 🆕 = **عمود جديد مطلوب** (القيمة حالياً تحت `extra` في الـ JSON، أو top-level لو هي مفتاح).

### 3.1 `programs` — 20 سجل — `ProgramsSeeder`
**المصدر:** `src/data/programs.ts` (13 برنامج) + برامج فورم التبرع فقط من `src/data/donationEntities.ts` (7: `general-donation`, `inqadh`, `monthly-sponsorship`, `mosques`, `monthly-meat`, `quran`, `takrim`).

| الفرونت | العمود |
|---|---|
| `slug` | `slug` ✅ (`general` → `general-donation`) |
| `ar.name` / `en.name` | `name_ar`, `name_en`, `title_ar`, `title_en`, (`name` = name_ar) ✅ |
| `ar.tagline` / `en.tagline` | `tagline_ar`, `tagline_en` ✅ |
| `ar.desc` / `en.desc` | `description_ar`, `description_en`, `meta_description_*` ✅ |
| `ar.longContent[]` | `content_ar` / `content_en` ✅ (فقرات مفصولة بـ `\n\n` زي السجل 35 الحالي) |
| `ar.benefits[]` | `benefits_ar`, `benefits_en` ✅ |
| `season` | `period_ar`, `period_en` ✅ |
| `image` | `image` ✅ (مجلد `programs`) |
| `priceFrom` | `minimum_amount` ✅ + `top_section.minimum_amount` |
| — | `top_section` ✅ (نفس شكل السجل 35: badge/title/subtitle/description/buttons/currency) |
| عنوان الـ SEO المحسوب في `ProgramDetail.tsx` | `meta_title_ar/en` ✅ = `«الاسم» — مؤسسة اليسر الخيرية \| المنصورة - الدقهلية` |
| — | `status=published`, `is_active=true`, `donation_available=true`, `sort_order` ✅ |
| `gallery[]` | 🆕 `gallery` JSON |
| `aliases` (slug الفرونت لو مختلف) | 🆕 `aliases` JSON |
| من `donationEntities`: `categoryAr/En`, `color`, `donationType`, `isSeasonal`, `isMarkoun` | 🆕 `category_ar`, `category_en`, `color`, `donation_type`, `is_seasonal`, `is_markoun` |

لم يُملأ: `axis_id`, `keywords_*`, `ai_*`, `canonical_url`, `hero_h1_*` (لا يوجد لها مصدر ثابت). لو `axis_id` NOT NULL عندك اعمله nullable أو حدّده يدوياً.

### 3.2 `program_page_sections` — 104 سجل (8 أقسام × 13 برنامج) — `ProgramPageSectionsSeeder`
**المصدر:** تخطيط `src/pages/ProgramDetail.tsx` (روابط الأقسام، خطوات "كيف يعمل"، "٤ مراحل"، الأسئلة العامة) + `benefits` و`longContent` لكل برنامج من `programs.ts`. نفس `section_key` ونفس شكل `content_ar` الموجود في `/programs/35/page-sections`:
`top_section` (settings.top_section = روابط) · `benefits` (`[{text, icon}]`) · `how_it_works` و`impact` (`[{title, description, icon, step}]`) · `details` (`[{text}]`) · `donor_testimonials` · `faq` (`[{question, answer}]` — شكل مقترح، القسم فاضي حالياً في الباك) · `related_programs`.
الأعمدة كلها ✅. البرامج الـ 7 القادمة من فورم التبرع ليس لها صفحة تفاصيل في الفرونت فلا أقسام لها.

### 3.3 `donation_packages` — `DonationPackagesSeeder`
| ملف | العدد | الأب | المصدر |
|---|---|---|---|
| `program_donation_packages.json` | 38 | `program_id` | `shares` في `donationEntities.ts` للبرامج (10 برامج) |
| `project_donation_packages.json` | 8 | `project_id` | `shares` للمشروعين `waqf`, `medical` |
| `donation_campaign_packages.json` | 44 | `donation_campaign_id` | `prices[]` في `src/data/campaignPages/*.ts` (7 حملات) |

`name_ar`, `name_en`, `amount`, `sort_order`, `is_active` ✅. 🆕 `key` (string, nullable, unique مع الأب) = `share.id` (مثال `gen-100`) أو `price.id` في صفحة الحملة (مثال `blanket`, `roof_wood`, `full`) — مطابق لـ `CAMPAIGN_PAGES_BACKEND_REQUIREMENTS.md`. 🆕 `is_popular` (bool)، `description_ar/en`، `note` (JSON `{ar,en}` لملاحظة السعر في صفحة الحملة).

> **قرار:** باقات الحملات = أسعار صفحة الهبوط (هي اللي الحاسبات والكروت بتقرأها). الـ `shares` بتاعة الحملات في `donationEntities.ts` **لم تُزرع** (مذكورة في `donation_entities_map.json`) لتفادي تكرار الباقات.

### 3.4 `projects` — 2 سجل — `ProjectsSeeder`
**المصدر:** `donationEntities.ts` (`waqf` المزرعة الوقفية، `medical` المركز الطبي).
`name`←`ar`، `name_en`←`en`، `description`/`short_description`←`taglineAr`، `short_description_en`←`taglineEn`، `starting_price`←`priceFrom`، `cover_image` (مجلد `projects`)، `display_order`، `is_active` ✅. 🆕 `description_en`، `category_*`، `color`، `donation_type`.

### 3.5 `donation_campaigns` — 7 سجلات — `DonationCampaignsSeeder`
**المصدر:** `src/data/campaignPages/{setr,dhill,athar,ramadan,markoun,arboun,food}.ts` + `index.ts` (الاسم) + `donationEntities.ts` (الوصف والصورة) + `src/data/campaignSeoStore.ts` (SEO الرسمي).

| الفرونت | العمود |
|---|---|
| `CAMPAIGN_PAGES[].name` | `name_ar`, `name_en` ✅ |
| `taglineAr/En` (أو `hero.lead` لو مفيش entity) | `description_ar`, `description_en` ✅ |
| صورة الـ entity | `image` ✅ (مجلد `donation-campaigns`؛ `arboun` و`food` بدون صورة ثابتة) |
| أقل سعر في `prices` | `minimum_amount` ✅ |
| `hero, hadith, stats, sections, cta` | `page_content` (JSON) — مطلوب في `CAMPAIGN_PAGES_BACKEND_REQUIREMENTS.md` (🆕 لو لسه مش متنفّذ) |
| `seo` في الصفحة أو `OFFICIAL_CAMPAIGN_SEO_PRESETS` | `seo` (JSON `{title, description, keywords, canonical, noindex, nofollow}`) 🆕 |
| `faq[]` | `faqs` (JSON `[{question_ar, answer_ar, question_en, answer_en}]`) 🆕 |
| `prices[]` | → `donation_packages` (القسم 3.3) وليس داخل `page_content` |
| slug صفحة الهبوط | 🆕 `landing_slug` (string, unique, nullable) |
| كل الـ slugs البديلة | 🆕 `aliases` (JSON) |
| `impact_regions_*`, `impact_stats_*`, `suggested_articles` | 🆕 داخل `seo` أو عمود `extra` |

`target_amount` غير موجود في الكود الثابت → لا يُملأ.

### 3.6 `seasons` — 6 سجلات — `SeasonsSeeder`
**المصدر:** `src/data/seasons.ts`. `titleAr/En`→`name_*`، `monthsAr/En`→`period_*`، `taglineAr/En`→`tagline_*`، `descriptionAr/En`→`description_*`، `defaultEnabled`→`is_active` و`donation_available`، `sort_order` ✅.
🆕 `slug` (`ster`, `thill`, `ramadan`, `ashr`, `qurbani`, `school`) — **مطلوب** كمفتاح؛ بدونه المطابقة بـ `name_ar`. 🆕 `icon`, `badge_ar/en`, `current_months` (JSON)، `donate_url`, `items` (JSON)، `pricing` (JSON)، `meta_title_*`, `meta_description_*`, `keywords_*` (JSON).
⚠️ `GET /api/v1/seasons` بيرجّع **500 Server Error** حالياً — محتاج إصلاح.

### 3.7 الخدمات — جداول جديدة 🆕 (لا يوجد endpoint حالياً)
| الجدول | العدد | المصدر | الأعمدة |
|---|---|---|---|
| `services` | 10 | `src/data/servicePagesConfig.ts` (صفحات `/services/:slug`) | `slug`, `program_slug`, `sector`, `hero_image`, `badge_ar/en`, `title_ar/en`, `intro_ar/en`, `meta_title_ar/en`, `meta_description_ar/en`, `bullets_ar/en` (JSON), `stats` (JSON), `features` (JSON، الأيقونة كاسم lucide)، `tiers` (JSON)، `related` (JSON)، `faqs` (JSON)، `is_active`, `sort_order` |
| `service_categories` | 8 | `DONATE_SECTORS` في `src/data/servicesMap.ts` | `slug`, `donate_key`, `title_ar/en`, `summary_ar/en`, `intro_ar/en`, `programs` (JSON)، `is_active`, `sort_order` |
| `services_map_axes` | 5 | `SERVICES_AXES_AR` + `RESOURCES_AR` (صفحة `/services-map`، عربي فقط) | `slug`, `title_ar`, `subtitle_ar`, `is_resources`, `groups` (JSON)، `sort_order` |

### 3.8 المدونة
| الجدول | العدد | المصدر | ملاحظات |
|---|---|---|---|
| `blog_seo` (`/blog-seo`) | 50 | `src/data/blog.ts` | `slug`, `title_*`, `summary_*`←excerpt, `content_*`←body (فقرات `\n\n`)، `cover_image` (مجلد `blog`)، `category_ar/en`, `tags_ar/en`, `primary_keyword`←كلمة المحور، `schema_type=Article`, `workflow_status=published` ✅. 🆕 `published_at` (تاريخ المقال الأصلي — مهم للترتيب)، `category_slug`, `author_slug`, `reading_minutes_*`. |
| `blog_categories` 🆕 | 13 | `axes` في `src/data/blogTaxonomy.ts` | `slug`, `name_*`, `description_*`, `keyword_*`, `sort_order`, `is_active` |
| `blog_authors` 🆕 | 2 | `authors` في `blogTaxonomy.ts` | `slug`, `name_*`, `role_*`, `bio_*`, `avatar`, `twitter`, `linkedin` |

### 3.9 الأسئلة الشائعة
| الجدول | العدد | المصدر |
|---|---|---|
| `faq_categories` | 18 | `FAQ_PAGE_CATEGORIES` في `src/data/faqsApi.ts` (15) + 3 تصنيفات مستخدمة في الأسئلة وغير معرّفة (`volunteer`, `services`, `general` — `extra.synthesized=true`) |
| `faqs` | 112 | `DEFAULT_STATIC_FAQS` (94) + `src/data/qurbaniFaq.ts` (18، تصنيف `qurbani`) |

الأعمدة ✅. المفتاح: (`faq_category_id`, `question_ar`) — الأسئلة الـ 95 الموجودة حالياً في الباك من نفس الداتا فمش هتتكرر. 🆕 لـ `faq_categories`: `description_ar/en`, `icon`.
أسئلة صفحات الهبوط للحملات (`faq` في `campaignPages`) راحت في `donation_campaigns.faqs` وليس هنا.

### 3.10 `gallery` — 44 سجل — `GallerySeeder`
**المصدر:** `GALLERY_STATIC_IMAGES` في `src/data/galleryImages.ts`. `src`→`image` (مجلد `gallery`)، `altAr`→`alt_ar` و`title_ar`، `alt`→`alt_en` و`title_en`، `category`→`program`، `donateProgram`→`donation_program`، `city`، `sort_order`، `is_public=true` ✅. المفتاح: `alt_ar` (الجدول بدون slug). 🆕 `static_id` (اختياري).

### 3.11 `stories` — 8 سجلات — `StoriesSeeder`
**المصدر:** `STATIC_STORIES` في `src/data/storiesApi.ts`. `role_*`→`category_*`، `body_*`→`description_*`، `image_url`→`cover_image` (مجلد `stories`)، `is_published`→`status`، `beneficiary_name` (مشتق من العنوان قبل « — » لو مش موجود)، `location_*`, `is_featured`, `sort_order` ✅. 🆕 `quote_ar`, `quote_en` (الاقتباس المعروض في الكارت)، `pillar_slug`.

### 3.12 `homepage_campaigns_sections` 🆕 — سجل واحد — `HomepageCampaignsSectionSeeder`
**المصدر:** `DEFAULT_CAMPAIGNS_SETTINGS` في `src/data/campaignsSettings.ts` (شريط "حملات تصنع الأثر" في الرئيسية). `is_active`, `scroll_speed` (decimal)، `show_final_cta`, `enable_scroll_trigger`, `show_skip_button`, `title_ar/en`, `subtitle_ar/en`, `enabled_slugs` (JSON)، `disabled_slugs` (JSON)، `cards` (JSON: الكروت الافتراضية = كل برامج `programs.ts` بالترتيب، 13 كارت). ممكن بدلاً من جدول جديد تضيف الأعمدة دي على جدول إعدادات الـ carousel الحالي.

### 3.13 صفحات SEO المحلية 🆕
| الجدول | العدد | المصدر | الأعمدة |
|---|---|---|---|
| `geo_pages` | 72 (6 محافظات × 12 برنامج) | `src/data/geoPages.ts` (`/geo/:governorate/:program`) | `governorate_slug`, `program_slug` (unique معاً)، `governorate_ar/en`, `region_ar`, `lat`, `lon`, `headline_*`, `intro_*`, `why_here_*`, `coverage_*`, `faqs` (JSON)، `is_active` |
| `dakahlia_cities` | 14 | `src/data/dakahliaCities.ts` (`/qurbani/:city` + الخريطة) | `slug`, `name_*`, `lat`, `lon`, `families_count`, `programs` (JSON)، `highlight_*`, `intro_*`, `local_note_*`, `coverage_*`, `districts` (JSON من `DISTRICTS_BY_CITY`)، `sort_order`, `is_active` |

---

## 4. ملخص: أعمدة وجداول جديدة مطلوبة (Migration مقترح)

```php
// أعمدة على جداول موجودة
Schema::table('programs', function (Blueprint $t) {
    $t->json('gallery')->nullable();
    $t->json('aliases')->nullable();
    $t->string('category_ar')->nullable(); $t->string('category_en')->nullable();
    $t->string('color', 16)->nullable();
    $t->string('donation_type', 16)->nullable();        // cash | in_kind | both
    $t->boolean('is_seasonal')->default(false);
    $t->boolean('is_markoun')->default(false);
});
Schema::table('projects', function (Blueprint $t) {
    $t->text('description_en')->nullable();
    $t->string('category_ar')->nullable(); $t->string('category_en')->nullable();
    $t->string('color', 16)->nullable();
});
Schema::table('donation_campaigns', function (Blueprint $t) {
    // page_content / seo / faqs: انظر CAMPAIGN_PAGES_BACKEND_REQUIREMENTS.md
    $t->string('landing_slug')->nullable()->unique();
    $t->json('aliases')->nullable();
});
Schema::table('donation_packages', function (Blueprint $t) {
    $t->string('key', 64)->nullable();                  // unique مع الأب (program_id / project_id / donation_campaign_id)
    $t->boolean('is_popular')->default(false);
    $t->string('description_ar')->nullable(); $t->string('description_en')->nullable();
    $t->json('note')->nullable();
});
Schema::table('seasons', function (Blueprint $t) {
    $t->string('slug')->nullable()->unique();
    $t->string('icon', 64)->nullable();
    $t->string('badge_ar')->nullable(); $t->string('badge_en')->nullable();
    $t->json('current_months')->nullable();
    $t->string('donate_url')->nullable();
    $t->json('items')->nullable(); $t->json('pricing')->nullable();
    $t->string('meta_title_ar')->nullable(); $t->string('meta_title_en')->nullable();
    $t->text('meta_description_ar')->nullable(); $t->text('meta_description_en')->nullable();
    $t->json('keywords_ar')->nullable(); $t->json('keywords_en')->nullable();
});
Schema::table('blog_seo', fn (Blueprint $t) => [
    $t->date('published_at')->nullable(), $t->string('category_slug')->nullable(), $t->string('author_slug')->nullable(),
]);
Schema::table('faq_categories', fn (Blueprint $t) => [
    $t->string('description_ar')->nullable(), $t->string('description_en')->nullable(), $t->string('icon', 64)->nullable(),
]);
Schema::table('stories', fn (Blueprint $t) => [
    $t->text('quote_ar')->nullable(), $t->text('quote_en')->nullable(), $t->string('pillar_slug')->nullable(),
]);
// اختياري على أي جدول: $t->json('extra')->nullable();  ← يحفظ كل الحقول الإضافية كما هي
```

**جداول جديدة:** `services`, `service_categories`, `services_map_axes`, `blog_categories`, `blog_authors`, `homepage_campaigns_sections`, `geo_pages`, `dakahlia_cities` (الأعمدة في القسم 3). كلها تحتاج `GET` عام (`/services`, `/services/{slug}`, `/service-categories`, `/services-map`, `/blog-categories`, `/blog-authors`, `/homepage/campaigns-section`, `/geo-pages/{governorate}/{program}`, `/dakahlia-cities`) و CRUD تحت `admin`.

---

## 5. الصور المطلوب رفعها (58 ملف)

القائمة الكاملة مع الجداول اللي بتستخدم كل ملف: `seeders/data/_images_to_upload.json` (كل الملفات موجودة في `src/assets/`؛ `field/*` في `src/assets/field/`). أهمها:
- **البرامج/الكروت:** `poster-odhya.png`, `program-zakat-new.jpg`, `program-water-new.jpg`, `program-food-new.jpg`, `poster-education.png`, `poster-bride.png`, `brand-poster-frame.jpg`, `program-orphans.jpg`, `program-health.png`, `Prosthetics.jpg`, `program-food.jpg`, `markoun-puzzle.jpg`, `takrim-van.jpg`
- **الحملات:** `brand-poster-frame.jpg` (ستر)، `program-water-new.jpg` (ظل)، `poster-education.png` (أثر)، `yusr-ramadan-box.png`، `markoun-furniture.jpg`
- **المشاريع:** `farm-hero.jpg`, `Prosthetics.jpg` — **الخدمات:** `about-hero.jpg`, `yusr-water.png`, `poster-water.png`, `farm-hero.jpg`
- **المعرض (44):** ملفات `field/convoy-2026-*`, `field/qurbani-2024-*`, `field/qurbani-2025-*` + البوسترات
- **المدونة (50 مقال):** 22 صورة مختلفة؛ **القصص:** `family-hope.jpg`, `yusr-bride.png`, `program-education.jpg`, `program-health.jpg`, `program-orphans.jpg`, `hands-sprout.jpg`, `program-food.jpg`, `hero-child.jpg`

---

## 6. تحذيرات مهمة

1. **اختلاف الـ slugs (الحملات):** الـ seeder بيستخدم **slugs الباك** ويحط slug صفحة الهبوط في `landing_slug` والباقي في `aliases`:

   | صفحة الهبوط | slug الباك | aliases |
   |---|---|---|
   | `setr` | `sitr` | `setr`, `ster`, `shelter` |
   | `dhill` | `zell` | `dhill`, `zel` |
   | `markoun` | `markoon` | `markoun`, `markon` |
   | `arboun` | `arboun-kheir` | `arboun`, `arboon` |
   | `ramadan` | `ramadan` | `ramadan-season` |
   | `athar`, `food` | نفسه | — |

   **مقترح:** endpoint `GET /donation-campaigns/by-slug/{slug}` يدور في `slug` ثم `landing_slug` ثم `aliases`. نفس الشيء للبرامج (`general` ↔ `general-donation`).
2. **slug مكسور في الباك:** البرنامج id 42 (البروتين الشهري) الـ slug بتاعه `https://elyusr.org/food-box` — لازم يتصلح يدوياً (مقترح `monthly-protein`). الـ seeder مش هيلمسه.
3. **برامج غير موجودة في الباك** وهتتضاف: `shelter`, `treatment`, `prosthetics`, `kitchen`, `markoun`, `arboun` (من `programs.ts`) + `inqadh`, `monthly-sponsorship`, `mosques`, `monthly-meat`, `quran`, `takrim` (من فورم التبرع). `markoun` و`arboun` موجودين **كبرنامج وكحملة** في الفرونت (`/programs/markoun` و`/markoun`) — قرّر لو عايز البرنامج يكون `is_active=false`.
4. **`odhya`:** في الفرونت `entityType=campaign`، في الباك برنامج (id 35، حالياً `draft` و`is_active=false`) — الـ seeder يعامله كبرنامج ولا يغيّر حالته. البرنامج عنده 3 باقات بالفعل، فالـ 3 shares من الفرونت **لن تُضاف** (تحذير فقط).
5. **باقات الحملات:** الحملة `zell` (وغيرها) عندها باقات بالفعل؛ بنود الصفحة اللي اسمها العربي مطابق هياخد `key`، والباقي **لن يُضاف** (`DonationPackagesSeeder::ONLY_ADD_TO_EMPTY_PARENTS`). راجع التحذيرات بعد التشغيل وأضف الناقص يدوياً أو غيّر الثابت لـ `false`.
6. **`GET /seasons` يرجّع 500**، و `/services` و `/service-categories` غير موجودين (404).
7. **الحالات التجريبية:** `cases[]` داخل `donationEntities.ts` (40 حالة بأكواد `CAS-*`) **لم تُصدّر** — بيانات عرض وليست حالات حقيقية. عددها لكل عنصر في `donation_entities_map.json → demo_cases_count`.
8. **لم يُصدّر:** `src/data/admin-mock.ts` (بيانات وهمية)، `src/data/blog/*.md` و`blog.json` (غير مستخدمين في الكود)، نصوص الواجهة الثابتة داخل مكونات React غير المذكورة (مثل About/Hero — لها endpoints خاصة بالفعل).
9. **أيقونات lucide** مُصدّرة بالاسم (`Snowflake`, `Building2`, ...). الفرونت هيحوّل الاسم لمكوّن.
10. **الأسعار:** الـ JSON بيحط المبالغ كنص بعشريتين (`"500.00"`) زي ما الـ API بيرجّعها؛ `page_content` و`tiers` و`pricing` أرقام صحيحة.
