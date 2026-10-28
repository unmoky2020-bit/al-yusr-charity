# 🎠 متطلبات الباك إند — كاروسيل الرئيسية (Campaigns Carousel CMS)

> **الصفحة في لوحة التحكم:** `/admin/campaigns-section`  
> **آخر تحديث:** أكتوبر 2026  
> **الحالة:** الفرونت إند جاهز 100% ✅ — ينتظر فقط إضافة الـ Endpoints في الباك إند

---

## 📌 الوضع الراهن بعد آخر تحديث

| الجانب | الحالة |
|---|---|
| localStorage | 🗑️ **محذوف تماماً** — لا توجد أي قراءة أو كتابة في localStorage |
| إعدادات الجلسة الحالية | ✅ In-memory فقط (تعمل داخل نفس تحميل الصفحة) |
| قراءة من الباك إند | ⏳ الفرونت إند جاهز — ينتظر الـ endpoint |
| حفظ إلى الباك إند | ⏳ زر "حفظ في السيرفر" ظاهر في الـ UI — ينتظر الـ endpoint |
| TypeScript | ✅ 0 errors |

### ماذا يحصل الآن دون الباك إند؟
- تعديلات الأدمن تعمل وتُطبَّق مباشرةً على الكاروسيل في نفس الجلسة.
- **لكن** عند إعادة تحميل الصفحة تعود الإعدادات للقيم الافتراضية.
- بعد إضافة الـ endpoints → ستُحفظ وتُطبَّق على جميع الزوار فوراً.

---

## 🔢 القيم الافتراضية (Defaults) — ما يُعرض للزوار الآن

```typescript
// الملف: src/data/campaignsSettings.ts
export const DEFAULT_CAMPAIGNS_SETTINGS = {
  enabled: true,             // قسم الكاروسيل ظاهر
  scrollSpeed: 2.6,          // سرعة التمرير (1.0x → 4.0x)
  enabledSlugs: [],          // ترتيب البطاقات — فارغ = الترتيب الافتراضي من programs.ts
  disabledSlugs: ["volunteer"], // التطوع مخفي (له صفحته المنفصلة)
  showFinalCta: true,        // بطاقة "تبرعك يصنع الفرق" الذهبية ظاهرة
  enableScrollTrigger: true, // تثبيت ScrollTrigger التفاعلي مفعّل
  showSkipButton: true,      // زر التخطي الفسفوري ظاهر
  title: {
    ar: "حملات تصنع الأثر",
    en: "Campaigns that make impact"
  },
  subtitle: {
    ar: "مرّر بهدوء، كل بطاقة قصة أثر حقيقية",
    en: "Scroll gently; every card is a real story of impact"
  }
};
```

---

## 🛠️ الـ Endpoints المطلوبة

### Endpoint 1 — قراءة عامة (Public)

```
GET /api/v1/homepage/campaigns-section
```

| الخاصية | القيمة |
|---|---|
| Auth | ❌ بدون توكن (Public) |
| Cache | يُنصح بـ 60 ثانية |

**الاستجابة المتوقعة (200 OK):**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "show_final_cta": true,
    "enable_scroll_trigger": true,
    "show_skip_button": true,
    "scroll_speed": 2.6,
    "title_ar": "حملات تصنع الأثر",
    "title_en": "Campaigns that make impact",
    "subtitle_ar": "مرّر بهدوء، كل بطاقة قصة أثر حقيقية",
    "subtitle_en": "Scroll gently; every card is a real story of impact",
    "ordered_slugs": [],
    "disabled_slugs": ["volunteer"]
  }
}
```

---

### Endpoint 2 — حفظ من لوحة التحكم (Admin)

```
PUT /api/v1/admin/homepage/campaigns-section
```

| الخاصية | القيمة |
|---|---|
| Auth | ✅ `Authorization: Bearer {token}` (auth:sanctum) |

**الـ Body المُرسَل من الفرونت إند:**
```json
{
  "enabled": true,
  "show_final_cta": true,
  "enable_scroll_trigger": true,
  "show_skip_button": true,
  "scroll_speed": 2.6,
  "title_ar": "حملات تصنع الأثر",
  "title_en": "Campaigns that make impact",
  "subtitle_ar": "مرّر بهدوء، كل بطاقة قصة أثر حقيقية",
  "subtitle_en": "Scroll gently; every card is a real story of impact",
  "ordered_slugs": ["water-project", "food-boxes", "sponsorship"],
  "disabled_slugs": ["volunteer"]
}
```

**الاستجابة (200 OK):**
```json
{ "success": true, "message": "تم الحفظ بنجاح.", "data": { ... } }
```

---

## 💻 كود Laravel الجاهز للاستخدام

### 1) Migration

```bash
php artisan make:migration create_homepage_campaigns_settings_table
```

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('homepage_campaigns_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(true);
            $table->boolean('show_final_cta')->default(true);
            $table->boolean('enable_scroll_trigger')->default(true);
            $table->boolean('show_skip_button')->default(true);
            $table->decimal('scroll_speed', 3, 1)->default(2.6);
            $table->string('title_ar')->nullable()->default('حملات تصنع الأثر');
            $table->string('title_en')->nullable()->default('Campaigns that make impact');
            $table->string('subtitle_ar')->nullable()->default('مرّر بهدوء، كل بطاقة قصة أثر حقيقية');
            $table->string('subtitle_en')->nullable()->default('Scroll gently; every card is a real story of impact');
            $table->json('ordered_slugs')->nullable();
            $table->json('disabled_slugs')->nullable();
            $table->timestamps();
        });

        DB::table('homepage_campaigns_settings')->insert([
            'enabled' => true,
            'show_final_cta' => true,
            'enable_scroll_trigger' => true,
            'show_skip_button' => true,
            'scroll_speed' => 2.6,
            'title_ar' => 'حملات تصنع الأثر',
            'title_en' => 'Campaigns that make impact',
            'subtitle_ar' => 'مرّر بهدوء، كل بطاقة قصة أثر حقيقية',
            'subtitle_en' => 'Scroll gently; every card is a real story of impact',
            'ordered_slugs' => json_encode([]),
            'disabled_slugs' => json_encode(['volunteer']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('homepage_campaigns_settings');
    }
};
```

---

### 2) Model: `app/Models/HomepageCampaignSetting.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageCampaignSetting extends Model
{
    protected $table = 'homepage_campaigns_settings';

    protected $fillable = [
        'enabled', 'show_final_cta', 'enable_scroll_trigger',
        'show_skip_button', 'scroll_speed',
        'title_ar', 'title_en', 'subtitle_ar', 'subtitle_en',
        'ordered_slugs', 'disabled_slugs',
    ];

    protected $casts = [
        'enabled'             => 'boolean',
        'show_final_cta'      => 'boolean',
        'enable_scroll_trigger' => 'boolean',
        'show_skip_button'    => 'boolean',
        'scroll_speed'        => 'float',
        'ordered_slugs'       => 'array',
        'disabled_slugs'      => 'array',
    ];
}
```

---

### 3) Controller: `app/Http/Controllers/Api/V1/HomepageCampaignsController.php`

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HomepageCampaignSetting;
use Illuminate\Http\Request;

class HomepageCampaignsController extends Controller
{
    /**
     * GET /api/v1/homepage/campaigns-section
     * Public — no auth required.
     */
    public function show()
    {
        $settings = HomepageCampaignSetting::first()
            ?? HomepageCampaignSetting::create([
                'enabled'              => true,
                'show_final_cta'       => true,
                'enable_scroll_trigger' => true,
                'show_skip_button'     => true,
                'scroll_speed'         => 2.6,
                'title_ar'             => 'حملات تصنع الأثر',
                'title_en'             => 'Campaigns that make impact',
                'subtitle_ar'          => 'مرّر بهدوء، كل بطاقة قصة أثر حقيقية',
                'subtitle_en'          => 'Scroll gently; every card is a real story of impact',
                'ordered_slugs'        => [],
                'disabled_slugs'       => ['volunteer'],
            ]);

        return response()->json(['success' => true, 'data' => $settings]);
    }

    /**
     * PUT /api/v1/admin/homepage/campaigns-section
     * Admin auth required (auth:sanctum).
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled'              => 'nullable|boolean',
            'show_final_cta'       => 'nullable|boolean',
            'enable_scroll_trigger' => 'nullable|boolean',
            'show_skip_button'     => 'nullable|boolean',
            'scroll_speed'         => 'nullable|numeric|min:1|max:5',
            'title_ar'             => 'nullable|string|max:255',
            'title_en'             => 'nullable|string|max:255',
            'subtitle_ar'          => 'nullable|string|max:500',
            'subtitle_en'          => 'nullable|string|max:500',
            'ordered_slugs'        => 'nullable|array',
            'disabled_slugs'       => 'nullable|array',
        ]);

        $settings = HomepageCampaignSetting::firstOrNew([]);
        $settings->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ إعدادات الكاروسيل بنجاح.',
            'data'    => $settings,
        ]);
    }
}
```

---

### 4) Routes — `routes/api.php`

```php
use App\Http\Controllers\Api\V1\HomepageCampaignsController;

// ✅ Public: no auth
Route::prefix('v1')->group(function () {
    Route::get('/homepage/campaigns-section', [HomepageCampaignsController::class, 'show']);
});

// 🔒 Admin only
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    Route::put('/admin/homepage/campaigns-section', [HomepageCampaignsController::class, 'update']);
});
```

> **⚠️ تأكد دائماً** أن `GET /homepage/campaigns-section` خارج أي `auth middleware` حتى لا يُعيد 401 للزوار.

---

## 🗂️ جدول مقارنة — قبل وبعد الربط بالباك إند

| السلوك | قبل الربط (الحالة الآن) | بعد الربط |
|---|---|---|
| إعدادات الزوار | ثابتة من الكود (defaults) | ديناميكية من قاعدة البيانات |
| تعديل الأدمن | يُطبَّق في الجلسة الحالية فقط | يُطبَّق فوراً على جميع الزوار |
| إعادة تحميل الصفحة | يرجع للـ defaults | يقرأ من الباك إند |
| badge في لوحة التحكم | 🟡 "endpoint غير جاهز بعد" | 🟢 "متصل بالسيرفر" |
