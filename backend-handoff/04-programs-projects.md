# 04 — البرامج والمشاريع: تعديل كل الحقول من لوحة التحكم

الملف ده موجّه لمطوّر الباك إند (Laravel). بيوضح:

1. إيه الحقول اللي بقت تتعدّل من اللوحة في البرامج والمشاريع، وبتتبعت لأنهي endpoint.
2. الـ endpoints **الموجودة** اللي الواجهة بتستخدمها (من Postman والـ GET الحي) + ملاحظات تحقق لازم تتظبط.
3. الـ endpoints **الجديدة** المقترحة لباقات التبرع (تعديل / حذف / ترتيب) للبرامج والمشاريع.
4. الأعمدة **الجديدة** المقترحة لجدول `projects` علشان يبقى زي البرامج (محتوى + SEO + GEO + AI + الظهور).
5. شكل `content_ar / content_en / settings` لكل `section_key` في أقسام صفحة البرنامج، وشكل `top_section`.

> الاصطلاح: **[موجود]** = موجود في Postman أو بيرجع في GET الحي. **[جديد]** = مطلوب تنفيذه.
>
> كل المسارات تحت `/api/v1` ومحمية بـ `auth:sanctum` + صلاحية أدمن/محرر (نفس حماية `PUT /programs/{id}` الحالية)، ما عدا الـ GET العامة.

---

## 1) ملفات الواجهة اللي بتنادي الـ API

| الملف | الدور |
|---|---|
| `src/data/api/programsAdminApi.ts` | كل استدعاءات البرامج والمشاريع والباقات والأقسام (wrapper جديد، بيرمي الخطأ الحقيقي ومفيش نجاح وهمي) |
| `src/pages/admin/AdminProgramDetail.tsx` | محرر البرنامج الكامل (10 تبويبات) |
| `src/pages/admin/AdminPrograms.tsx` | قائمة البرامج + تفعيل/تعطيل + حذف + نافذة الباقات |
| `src/pages/admin/AdminProjectDetail.tsx` | محرر المشروع الكامل |
| `src/pages/admin/AdminProjects.tsx` | قائمة المشاريع + تفعيل/تعطيل + حذف + نافذة الباقات |
| `src/components/admin/programs/PackagesEditor.tsx` | إضافة/تعديل/حذف/ترتيب الباقات (مشترك بين البرامج والمشاريع) |
| `src/components/admin/programs/PageSectionsEditor.tsx` | محرر أقسام صفحة البرنامج |
| `src/components/admin/programs/sectionSchemas.ts` | أشكال محتوى كل `section_key` |

### طريقة الحفظ في الواجهة (مهم للباك إند)

- **التعديل بيبعت الحقول اللي اتغيّرت بس** (partial update) بـ `PUT /programs/{id}` أو `PUT /projects/{id}` كـ **JSON**. لو الأدمن مسح حقل كان له قيمة، بيتبعت `null`. يعني قواعد التحقق لازم تكون `sometimes|nullable|...` مش `required` في الـ update.
- **الصور بتترفع في طلب منفصل** بعد حفظ البيانات: `POST /programs/{id}` (multipart) فيه `_method=PUT` + الملف في `image` أو `hero_image`، و`POST /projects/{id}` فيه `_method=PUT` + `cover_image`. ده علشان المصفوفات والكائنات (benefits, ai_faq) توصل JSON سليم.
- **بعد الحفظ الواجهة بتقارن الرد**: أي حقل اتبعت ومش موجود في الـ record الراجع بيظهر للأدمن تحذير «الخادم تجاهل الحقول: …». لذلك **لازم `PUT` يرجّع الـ record كامل** (`{ "data": { ...كل الأعمدة } }`) زي `GET /programs/{id}`.

---

## 2) البرامج — الحقول اللي بقت تتعدّل

كل الأعمدة دي **[موجودة]** في رد `GET /programs/{id}` (اتأكدنا من البرنامج 35):

| التبويب في اللوحة | الحقول | الـ endpoint |
|---|---|---|
| البيانات الأساسية | `name_ar, name_en, title_ar, title_en, tagline_ar/en, period_ar/en, slug, sort_order, image` (+ `name` و`description` القديمة بتتزامن تلقائياً مع العربي) | `PUT /programs/{id}` (+ رفع `image`) |
| الهيرو | `hero_h1_ar, hero_h1_en, hero_h3_ar, hero_h3_en, hero_image` | `PUT /programs/{id}` (+ رفع `hero_image` لو ملف) |
| القسم العلوي | `top_section {...}` | `PUT /programs/{id}/top-section` |
| أقسام الصفحة | `page_sections[]` | `/programs/{id}/page-sections…` |
| المحتوى والمزايا | `description_ar/en, content_ar/en, benefits_ar[], benefits_en[]` | `PUT /programs/{id}` |
| التبرع والباقات | `target_amount, minimum_amount, donation_available` + الباقات | `PUT /programs/{id}` + مسارات الباقات |
| SEO والمشاركة | `meta_title_ar/en, meta_description_ar/en, keywords_ar/en, canonical_url, schema_type, twitter_card, noindex, nofollow` | `PUT /programs/{id}` |
| الموقع الجغرافي | `geo_region, geo_placename, geo_position, geo_position_label` | `PUT /programs/{id}` |
| ملخص وأسئلة AI | `ai_summary_ar/en, ai_faq_ar[], ai_faq_en[]` | `PUT /programs/{id}` |
| الظهور والتصنيف | `status, is_active, hide_from_audience, donation_available, sort_order, axis_id, season_ids[]` | `PUT /programs/{id}` |

### ملاحظات تحقق مطلوبة على `PUT /programs/{id}` [موجود — يحتاج مراجعة]

```php
// app/Http/Requests/UpdateProgramRequest.php  (rules)
return [
    'slug'                 => ['sometimes','nullable','string','max:190', Rule::unique('programs','slug')->ignore($this->route('program'))],
    'name_ar'              => ['sometimes','required','string','max:255'],
    'name_en'              => ['sometimes','nullable','string','max:255'],
    'name'                 => ['sometimes','nullable','string','max:255'],
    'title_ar'             => ['sometimes','nullable','string','max:255'],
    'title_en'             => ['sometimes','nullable','string','max:255'],
    'hero_h1_ar'           => ['sometimes','nullable','string','max:255'],
    'hero_h1_en'           => ['sometimes','nullable','string','max:255'],
    'hero_h3_ar'           => ['sometimes','nullable','string','max:500'],
    'hero_h3_en'           => ['sometimes','nullable','string','max:500'],
    // hero_image: يقبل ملف (multipart) أو نص (رابط من مكتبة الوسائط / storage path)
    'hero_image'           => ['sometimes','nullable', function ($attr, $value, $fail) {
        if ($value instanceof \Illuminate\Http\UploadedFile) {
            if (! in_array($value->getMimeType(), ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])) $fail('صيغة الصورة غير مدعومة');
        } elseif (! is_string($value)) { $fail('hero_image يجب أن يكون ملف صورة أو رابط'); }
    }],
    'image'                => ['sometimes','nullable','image','max:5120'],
    'tagline_ar'           => ['sometimes','nullable','string','max:255'],
    'tagline_en'           => ['sometimes','nullable','string','max:255'],
    'period_ar'            => ['sometimes','nullable','string','max:255'],
    'period_en'            => ['sometimes','nullable','string','max:255'],
    'description'          => ['sometimes','nullable','string'],
    'description_ar'       => ['sometimes','nullable','string'],
    'description_en'       => ['sometimes','nullable','string'],
    'content_ar'           => ['sometimes','nullable','string'],
    'content_en'           => ['sometimes','nullable','string'],
    'benefits_ar'          => ['sometimes','nullable','array'],
    'benefits_ar.*'        => ['string','max:500'],
    'benefits_en'          => ['sometimes','nullable','array'],
    'benefits_en.*'        => ['string','max:500'],
    'axis_id'              => ['sometimes','nullable','exists:axes,id'],
    'season_ids'           => ['sometimes','array'],
    'season_ids.*'         => ['integer','exists:seasons,id'],
    'target_amount'        => ['sometimes','nullable','numeric','min:0'],
    'minimum_amount'       => ['sometimes','nullable','numeric','min:0'],
    'donation_available'   => ['sometimes','boolean'],
    'status'               => ['sometimes', Rule::in(['published','draft'])],
    'is_active'            => ['sometimes','boolean'],
    'hide_from_audience'   => ['sometimes','boolean'],
    'sort_order'           => ['sometimes','nullable','integer'],
    'meta_title_ar'        => ['sometimes','nullable','string','max:255'],
    'meta_title_en'        => ['sometimes','nullable','string','max:255'],
    'meta_description_ar'  => ['sometimes','nullable','string','max:500'],
    'meta_description_en'  => ['sometimes','nullable','string','max:500'],
    'keywords_ar'          => ['sometimes','nullable','string','max:500'],
    'keywords_en'          => ['sometimes','nullable','string','max:500'],
    'canonical_url'        => ['sometimes','nullable','url','max:500'],
    'schema_type'          => ['sometimes','nullable', Rule::in(['Service','Product','DonateAction','Event'])],
    'twitter_card'         => ['sometimes','nullable', Rule::in(['summary','summary_large_image'])],
    'noindex'              => ['sometimes','boolean'],
    'nofollow'             => ['sometimes','boolean'],
    'geo_region'           => ['sometimes','nullable','regex:/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/'],
    'geo_placename'        => ['sometimes','nullable','string','max:255'],
    'geo_position'         => ['sometimes','nullable','regex:/^-?\d{1,2}(\.\d+)?;-?\d{1,3}(\.\d+)?$/'],
    'geo_position_label'   => ['sometimes','nullable','string','max:255'],
    'ai_summary_ar'        => ['sometimes','nullable','string','max:1000'],
    'ai_summary_en'        => ['sometimes','nullable','string','max:1000'],
    'ai_faq_ar'            => ['sometimes','nullable','array'],
    'ai_faq_ar.*.question' => ['required_with:ai_faq_ar','string','max:500'],
    'ai_faq_ar.*.answer'   => ['nullable','string','max:3000'],
    'ai_faq_en'            => ['sometimes','nullable','array'],
    'ai_faq_en.*.question' => ['required_with:ai_faq_en','string','max:500'],
    'ai_faq_en.*.answer'   => ['nullable','string','max:3000'],
];
```

- **`ai_faq_ar` / `ai_faq_en`**: الواجهة بتبعتها **مصفوفة** `[{ "question": "...", "answer": "..." }]`. لازم العمود يكون `json` (أو `text`) ومعمول له cast في الموديل:

```php
// app/Models/Program.php
protected $casts = [
    'benefits_ar' => 'array',
    'benefits_en' => 'array',
    'ai_faq_ar'   => 'array',
    'ai_faq_en'   => 'array',
    'top_section' => 'array',
    'noindex' => 'boolean', 'nofollow' => 'boolean',
    'is_active' => 'boolean', 'hide_from_audience' => 'boolean', 'donation_available' => 'boolean',
];
```

  لو مفيش cast، حفظ مصفوفة هيدّي خطأ 500 (Array to string conversion) والواجهة هتعرض الخطأ ده للأدمن كما هو.
- **`season_ids`**: لما تتبعت لازم تعمل `sync` على علاقة المواسم (`$program->seasons()->sync($ids)`). الواجهة بتقرأ المواسم من `seasons[]` في الرد.
- **الرد**: `{"data": ProgramResource}` بكل الأعمدة اللي فوق (نفس `GET /programs/{id}`).

### `PUT /programs/{id}/top-section` [موجود]

Request:

```json
{
  "top_section": {
    "badge_ar": "برنامج معتمد",
    "breadcrumb": { "home_ar": "الرئيسية", "programs_ar": "البرامج", "current_ar": "صك الأضحية" },
    "title_ar": "صك الأضحية",
    "title_en": "Qurbani Voucher",
    "subtitle_ar": "...", "subtitle_en": "...",
    "description_ar": "...", "description_en": "...",
    "image": "https://api.elyusr.org/storage/gallery/xyz.jpg",
    "primary_button_ar": "تبرع لهذا البرنامج",
    "whatsapp_button_ar": "WhatsApp",
    "minimum_amount": 1400,
    "currency_ar": "ج",
    "donation_available": true
  }
}
```

ملاحظات: `image` هنا **نص** (رابط من مكتبة الوسائط)، مش ملف. الواجهة بتحافظ على أي مفاتيح زيادة موجودة في `top_section` وبترجعها زي ما هي، فياريت التحقق يكون `top_section => required|array` من غير ما يمسح المفاتيح غير المعروفة.

---

## 3) أقسام صفحة البرنامج `page_sections` [كل المسارات موجودة]

| Method | Path | Body |
|---|---|---|
| GET | `/programs/{id}/page-sections` | — |
| POST | `/programs/{id}/page-sections` | `{section_key, title_ar, title_en, content_ar, content_en, settings, is_enabled, sort_order}` |
| PUT | `/programs/{id}/page-sections/{sectionId}` | `{section_key, title_ar, title_en, subtitle_ar, subtitle_en, content_ar, content_en, settings, is_enabled, sort_order}` |
| PATCH | `/programs/{id}/page-sections/{sectionId}/toggle` | `{is_enabled}` |
| DELETE | `/programs/{id}/page-sections/{sectionId}` | — |

- **الترتيب**: الواجهة بتعيد ترقيم `sort_order` (0، 1، 2 …) وتبعت `PUT` لكل قسم اتغيّر ترتيبه بالـ body الكامل بتاعه. (لو حابب تعمل `POST /programs/{id}/page-sections/reorder` بـ `{sections:[{id, sort_order}]}` يبقى أفضل، بس مش مطلوب دلوقتي.)
- `settings` بترجع حالياً `[]` لما تكون فاضية (PHP empty array). الواجهة بتبعت `{}` في الحالة دي. ياريت الـ cast يكون `array` والرد يرجّع `{}` بدل `[]`.
- **ملاحظة مهمة في Postman**: مسار الـ PUT مكتوب `/api/v1/programs/35/page-sections/58` — الواجهة بتنادي `/programs/{id}/page-sections/{sid}` لأن الـ base URL فيه `/api/v1` أصلاً.

### شكل `content_ar` / `content_en` / `settings` لكل `section_key`

المصدر: سجلات البرنامج 35 الحية، وأمثلة Postman، والأقسام اللي بتعرضها الصفحة العامة `src/pages/ProgramDetail.tsx`. الأيقونات بأسماء lucide بصيغة kebab-case (مثلاً `hand-heart`, `check-circle`).

| section_key | content_ar / content_en (مصفوفة عناصر) | settings | الحالة |
|---|---|---|---|
| `top_section` | — (فاضي) | `{ "top_section": [ {key, title_ar, title_en, url, is_enabled, sort_order} ] }` = روابط التنقل أعلى الصفحة | [موجود — سجل 58] |
| `benefits` | `[{ "text": "...", "icon": "check-circle" }]` | `{}` | [موجود — سجل 1] |
| `how_it_works` | `[{ "step": 1, "title": "...", "description": "...", "icon": "hand-heart" }]` | `{}` | [موجود — سجل 2] |
| `details` | `[{ "text": "فقرة ..." }]` | `{}` | [موجود — سجل 3] |
| `impact` | `[{ "step": 1, "title": "...", "description": "...", "icon": "search" }]` | `{}` | [موجود — سجل 4] |
| `donor_testimonials` | `[{ "name": "...", "location": "...", "text": "..." }]` | `{}` | **[جديد — شكل مقترح]** السجل الحي فاضي |
| `faq` | `[{ "question": "...", "answer": "..." }]` | `{}` | **[جديد — شكل مقترح]** السجل الحي فاضي |
| `related_programs` | — (فاضي) | `{ "program_slugs": ["box", "water"] }` اختياري؛ لو فاضي الصفحة تختار برامج تلقائياً | **[جديد — شكل مقترح]** |

مثال Postman لقسم بـ `settings` إضافية: `{"background": "#ffffff"}` — الواجهة بتسمح بأي JSON object في `settings` (حقل JSON مع تحقق من الصيغة).

ملاحظة: البرامج 36–42 فيها 7 أقسام فاضية (`content_ar: []`)، والبرنامج 35 بس اللي فيه محتوى. الواجهة بتسمح بتعبئتها كلها من اللوحة.

قواعد تحقق مقترحة للـ PUT/POST:

```php
'section_key' => ['required','string','max:60','regex:/^[a-z0-9_]+$/'],
'title_ar'    => ['nullable','string','max:255'],
'title_en'    => ['nullable','string','max:255'],
'subtitle_ar' => ['nullable','string','max:500'],
'subtitle_en' => ['nullable','string','max:500'],
'content_ar'  => ['nullable','array'],
'content_en'  => ['nullable','array'],
'settings'    => ['nullable','array'],
'is_enabled'  => ['boolean'],
'sort_order'  => ['integer','min:0'],
```

---

## 4) باقات التبرع — المسارات الجديدة المقترحة [جديد]

حالياً موجود **GET** و**POST** بس:

- `GET /programs/{id}/donation-packages` [موجود]
- `POST /programs/{id}/donation-packages` [موجود] `{name_ar, name_en, amount, sort_order, is_active}`
- `GET /projects/{id}/donation-packages` [موجود]
- `POST /projects/{id}/donation-packages` [موجود] `{name_ar, amount}` (الواجهة بتبعت كمان `name_en, sort_order, is_active`)

المطلوب إضافته (نفس الشكل للبرامج والمشاريع). الواجهة **بتناديهم فعلاً**، ولو رجعوا 404/405 بتعرض للأدمن «يحتاج تفعيل من الباك إند» ومش بتعرض أي نجاح:

### 4.1 تعديل باقة

```
PUT /programs/{program}/donation-packages/{package}
PUT /projects/{project}/donation-packages/{package}
Auth: sanctum + admin
```

Request:

```json
{ "name_ar": "خروف كامل", "name_en": "Lamb Share", "amount": 1400, "is_active": true, "sort_order": 1 }
```

Validation:

```php
'name_ar'    => ['sometimes','required','string','max:255'],
'name_en'    => ['sometimes','nullable','string','max:255'],
'amount'     => ['sometimes','required','numeric','min:1'],
'is_active'  => ['sometimes','boolean'],
'sort_order' => ['sometimes','integer','min:0'],
```

Response `200`:

```json
{ "data": { "id": 22, "program_id": 35, "name_ar": "خروف كامل", "name_en": "Lamb Share", "amount": "1400.00", "sort_order": 1, "is_active": true } }
```

لازم تتأكد إن الباقة تابعة لنفس البرنامج/المشروع (scoped binding) وإلا `404`.

### 4.2 حذف باقة

```
DELETE /programs/{program}/donation-packages/{package}
DELETE /projects/{project}/donation-packages/{package}
```

Response `200` `{ "message": "deleted" }` أو `204`. لو الباقة عليها تبرعات مسجلة، الأفضل soft delete أو `is_active=false` بدل الحذف الفعلي، ويرجع `409` برسالة عربي واضحة لو الحذف ممنوع (الواجهة بتعرض الرسالة زي ما هي).

### 4.3 ترتيب الباقات

```
POST /programs/{program}/donation-packages/reorder
POST /projects/{project}/donation-packages/reorder
```

Request:

```json
{ "packages": [ { "id": 23, "sort_order": 1 }, { "id": 22, "sort_order": 2 }, { "id": 24, "sort_order": 3 } ] }
```

Validation:

```php
'packages'              => ['required','array','min:1'],
'packages.*.id'         => ['required','integer', Rule::exists('donation_packages','id')->where('program_id', $program->id)], // أو project_id
'packages.*.sort_order' => ['required','integer','min:0'],
```

Response `200`: `{ "data": [ ...الباقات بعد الترتيب ] }`.

### 4.4 Routes + Controller (مثال)

```php
// routes/api.php  (داخل group v1 + auth:sanctum + admin)
Route::scopeBindings()->group(function () {
    Route::put('programs/{program}/donation-packages/{donationPackage}',    [ProgramDonationPackageController::class, 'update']);
    Route::delete('programs/{program}/donation-packages/{donationPackage}', [ProgramDonationPackageController::class, 'destroy']);
    Route::post('programs/{program}/donation-packages/reorder',             [ProgramDonationPackageController::class, 'reorder']);

    Route::put('projects/{project}/donation-packages/{donationPackage}',    [ProjectDonationPackageController::class, 'update']);
    Route::delete('projects/{project}/donation-packages/{donationPackage}', [ProjectDonationPackageController::class, 'destroy']);
    Route::post('projects/{project}/donation-packages/reorder',             [ProjectDonationPackageController::class, 'reorder']);
});
```

```php
class ProgramDonationPackageController extends Controller
{
    public function update(UpdateDonationPackageRequest $request, Program $program, DonationPackage $donationPackage)
    {
        $donationPackage->update($request->validated());
        return new DonationPackageResource($donationPackage->fresh());
    }

    public function destroy(Program $program, DonationPackage $donationPackage)
    {
        $donationPackage->delete();
        return response()->json(['message' => 'deleted']);
    }

    public function reorder(Request $request, Program $program)
    {
        $data = $request->validate([
            'packages' => ['required','array','min:1'],
            'packages.*.id' => ['required','integer', Rule::exists('donation_packages','id')->where('program_id', $program->id)],
            'packages.*.sort_order' => ['required','integer','min:0'],
        ]);
        DB::transaction(function () use ($data, $program) {
            foreach ($data['packages'] as $row) {
                $program->donationPackages()->whereKey($row['id'])->update(['sort_order' => $row['sort_order']]);
            }
        });
        return DonationPackageResource::collection($program->donationPackages()->orderBy('sort_order')->get());
    }
}
```

(`ProjectDonationPackageController` نفس الكود مع `Project` و`project_id`.)

---

## 5) المشاريع — الحقول

### 5.1 الأعمدة [الموجودة] في `GET /projects/{id}`

`id, name, name_en, slug, description, short_description, short_description_en, target_amount, collected_amount, starting_price, display_order, cover_image, is_active, donation_packages[], cases[]`

ملاحظة: مفيش `name_ar` في المشاريع — `name` هو الاسم العربي. الواجهة دلوقتي بتبعت `name` (مش `name_ar`)، و`starting_price` و`display_order` و`short_description(_en)` (قبل كده كانوا مش بيتبعتوا خالص، والواجهة كانت بتبعت `sort_order` اللي مش موجود).

### 5.2 الأعمدة [الجديدة] المقترحة لجدول `projects`

قارنّا مفاتيح المشروع بمفاتيح البرنامج. اللوحة بتعرض الحقول دي وبتبعتها، وطالما مش موجودة في الجدول بتظهر عليها شارة «يحتاج تفعيل من الباك إند»، وبعد الحفظ بيظهر تحذير بالحقول اللي الخادم تجاهلها (مفيش «تم الحفظ» وهمي):

```php
// database/migrations/2026_10_29_000004_add_content_seo_columns_to_projects_table.php
Schema::table('projects', function (Blueprint $table) {
    // المحتوى
    $table->text('description_en')->nullable()->after('description');
    $table->longText('content_ar')->nullable();
    $table->longText('content_en')->nullable();
    $table->json('benefits_ar')->nullable();
    $table->json('benefits_en')->nullable();

    // الظهور والتبرع
    $table->boolean('donation_available')->default(true);   // «تبرع مباشر بدون اختيار باقة»
    $table->boolean('hide_from_audience')->default(false);

    // SEO والمشاركة
    $table->string('meta_title_ar')->nullable();
    $table->string('meta_title_en')->nullable();
    $table->string('meta_description_ar', 500)->nullable();
    $table->string('meta_description_en', 500)->nullable();
    $table->string('keywords_ar', 500)->nullable();
    $table->string('keywords_en', 500)->nullable();
    $table->string('canonical_url', 500)->nullable();
    $table->string('schema_type', 40)->nullable();          // Service | Product | DonateAction | Event
    $table->string('twitter_card', 40)->nullable();         // summary | summary_large_image
    $table->boolean('noindex')->default(false);
    $table->boolean('nofollow')->default(false);

    // GEO
    $table->string('geo_region', 10)->nullable();           // EG-DK
    $table->string('geo_placename')->nullable();
    $table->string('geo_position', 50)->nullable();         // 31.0409;31.3785
    $table->string('geo_position_label')->nullable();

    // AI
    $table->text('ai_summary_ar')->nullable();
    $table->text('ai_summary_en')->nullable();
    $table->json('ai_faq_ar')->nullable();                  // [{question, answer}]
    $table->json('ai_faq_en')->nullable();
});
```

```php
// app/Models/Project.php
protected $fillable = [ /* الموجود + */ 'description_en','content_ar','content_en','benefits_ar','benefits_en',
    'donation_available','hide_from_audience','meta_title_ar','meta_title_en','meta_description_ar','meta_description_en',
    'keywords_ar','keywords_en','canonical_url','schema_type','twitter_card','noindex','nofollow',
    'geo_region','geo_placename','geo_position','geo_position_label','ai_summary_ar','ai_summary_en','ai_faq_ar','ai_faq_en'];

protected $casts = [
    'benefits_ar' => 'array', 'benefits_en' => 'array', 'ai_faq_ar' => 'array', 'ai_faq_en' => 'array',
    'donation_available' => 'boolean', 'hide_from_audience' => 'boolean', 'noindex' => 'boolean', 'nofollow' => 'boolean',
    'is_active' => 'boolean',
];
```

- **ProjectResource** لازم يرجّع كل الأعمدة الجديدة (حتى لو `null`)، لأن الواجهة بتحدد «الحقل مدعوم» بوجود المفتاح في الرد.
- **التحقق على `PUT /projects/{id}`**: نفس قواعد البرامج للحقول المشتركة (القسم 2) + الموجود:

```php
'name'                 => ['sometimes','required','string','max:255'],
'name_en'              => ['sometimes','nullable','string','max:255'],
'slug'                 => ['sometimes','nullable','string','max:190', Rule::unique('projects','slug')->ignore($this->route('project'))],
'short_description'    => ['sometimes','nullable','string','max:500'],
'short_description_en' => ['sometimes','nullable','string','max:500'],
'description'          => ['sometimes','nullable','string'],
'target_amount'        => ['sometimes','nullable','numeric','min:0'],
'starting_price'       => ['sometimes','nullable','numeric','min:0'],
'display_order'        => ['sometimes','nullable','integer'],
'is_active'            => ['sometimes','boolean'],
'cover_image'          => ['sometimes','nullable','image','max:5120'],
```

- `PUT /projects/{id}` لازم يرجّع `{ "data": ProjectResource }` كامل (مش `{message}` بس).

### 5.2.1 عمود `page_content` لصفحات المشاريع [جديد — 1 نوفمبر 2026]

بعض المشاريع ليها صفحة هبوط خاصة في الموقع، وأولها مشروع `waqf` وصفحته `/farm`. نصوص الصفحة دي (الهيرو، والأرقام، والأقسام، والحديث، والختام) بقت بتتعدّل من لوحة التحكم:
**المشاريع ← المزرعة الوقفية ← تبويب «محتوى صفحة المزرعة الوقفية»**.

الواجهة بتبعت النصوص في `PUT /projects/{id}` كحقل اسمه `page_content`، وده **نفس شكل** `donation_campaigns.page_content` بالظبط (موجود ومتنفّذ على الحملات). يعني نفس الـ cast ونفس الـ validation.

| العمود | النوع | ملاحظات |
|---|---|---|
| `page_content` | `json nullable` | `$casts = ['page_content' => 'array']`، و`fillable`، ويرجع في `ProjectResource` (العام والأدمن). `null` معناه «استخدم النصوص الافتراضية اللي في الكود» |

القواعد:
- `'page_content' => ['sometimes', 'nullable', 'array']`.
- الحقل **لازم يرجع في `GET /projects`** (القائمة العامة)، لأن صفحة `/farm` بتقراه من نفس القائمة اللي بتقرا منها `/projects`. لو حجمه تقيل على القائمة، يرجع مع `?include=content` زي الحملات، وقولولنا علشان نضيف الباراميتر.
- الأسعار مش جوه `page_content`. الصفحة بتعرض **باقات المشروع** (`donation_packages`)، والأسئلة الشائعة من **تصنيف الأسئلة المربوط** (`faq_category_id`)، والصورة الرئيسية = `cover_image`.

لحد ما العمود يتعمل: الحفظ بيكمّل عادي لباقي الحقول، والشاشة بتظهر «الخادم تجاهل: page_content»، والصفحة بتعرض النصوص الافتراضية. مفيش حاجة بتبوظ.

ملفات الواجهة: `src/data/projectPages/` (الشكل والنصوص الافتراضية)، `src/hooks/useProjectPage.ts` (القراءة)، `src/pages/admin/AdminProjectDetail.tsx` (التعديل).

### 5.3 الأخطاء اللي اتصلحت في شاشة المشاريع

| المشكلة القديمة | الحل |
|---|---|
| زرار «تبرع مباشر» كان بيبعت `is_active` بالغلط | بيبعت `donation_available` (عمود جديد مقترح). لو الرد مفيهوش المفتاح، الزرار بيرجع لحالته وبيظهر «يحتاج تفعيل من الباك إند» |
| «إخفاء عن الجمهور» كان بيعرض «تم الحفظ» من غير ما ينادي الـ API | بينادي `PUT /projects/{id}` بـ `hide_from_audience` ويتأكد من الرد |
| السيو والأسئلة والمحتوى مكانوش بيتبعتوا | بيتبعتوا (أعمدة مقترحة أعلاه) مع تحذير صريح بالحقول المتجاهلة |
| `starting_price`, `display_order`, `short_description(_en)` مكانتش بتتعدّل | بقت تتعدّل وتتبعت |
| الشاشة كانت بتحمّل برنامج لو المشروع مش موجود وتعدّله من شاشة المشاريع | لو الرقم برنامج، بيتم التحويل لمحرر البرامج `/admin/programs/{id}` |

---

## 6) حقول اتشالت من الواجهة (مش موجودة في الباك إند ومش مطلوبة)

محرر المشاريع القديم كان فيه `og_title_ar/en, og_desc_ar/en, og_image_url, service_cities, canonical_slug` ومكانتش بتتبعت لأي endpoint. اتشالت لأن البرامج مفيهاش الأعمدة دي، وبطاقة المشاركة بتستخدم `meta_title / meta_description` + الصورة الرئيسية. لو حابين نضيفها لاحقاً تبقى أعمدة `string nullable` بنفس الأسماء على الجدولين.

---

## 7) ملخص المطلوب من الباك إند (Checklist)

- [ ] `PUT /programs/{id}`: قواعد `sometimes|nullable` لكل الحقول، cast `ai_faq_*` و`top_section` و`benefits_*` كـ array، `sync` للمواسم، والرد يرجّع الـ record كامل.
- [ ] `hero_image`: يقبل ملف أو نص رابط.
- [ ] `PUT/DELETE /programs/{id}/donation-packages/{pid}` + `POST /programs/{id}/donation-packages/reorder`.
- [ ] نفس الثلاثة للمشاريع `/projects/{id}/donation-packages/...`.
- [ ] Migration أعمدة المشاريع الجديدة (القسم 5.2) + fillable + casts + Resource.
- [ ] `PUT /projects/{id}` يرجّع الـ record كامل.
- [ ] عمود `projects.page_content` (json) زي الحملات، ويرجع في `GET /projects` (القسم 5.2.1).
- [ ] أقسام الصفحة: `settings` ترجع `{}` بدل `[]`، واعتماد أشكال `donor_testimonials` و`faq` و`related_programs` المقترحة.
