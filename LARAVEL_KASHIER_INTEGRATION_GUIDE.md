# 🛡️ الدليل القياسي الشامل لربط كاشير (Kashier) مع لارافيل (Laravel) — مشروع اليسر

هذا الدليل مخصص لمطور الباك إند (Laravel Backend Developer) لربط بوابة **كاشير (Kashier Payment Gateway)** بالنظام وفق أفضل الممارسات الأمنية القياسية (Standard Secure Architecture)، دون أي تكرار أو كود تجريبي في الفرونت إند.

---

## 🏗️ 1. المخطط المعماري للربط (Architecture Flow)

```
[ متصفح المتبرع / Frontend ]
          │
          │ 1. POST /api/v1/payment/kashier/session (amount, order_id, donor info)
          ▼
[ سيرفر Laravel Backend ] ──(يوقع بالـ Secret Key ويحفظ العملية pending)──┐
          │                                                                 │
          │ 2. يرجع session_url يحتوي على التوقيع الأمني Hash                │
          ▼                                                                 ▼
[ يفتح الـ iframe بـ session_url ]                                  [ قاعدة بيانات Laravel ]
          │                                                                 │
          │ 3. المتبرع يدخل الفيزا على سيرفر كاشير                          │
          ▼                                                                 │
[ بوابة Kashier ] ── 4. Webhook Server-to-Server (POST) ────────────────────┤
                                                                            ▼
                                                                (تحديث الحالة إلى completed)
```

> [!IMPORTANT]
> **قاعدة أمنية ذهبية:** المفتاح السري (`Secret Key`) لا يوضع إطلاقاً في الفرونت إند ولا في ملفات الـ JavaScript. التوقيع والتحقق يتمان حصراً داخل سيرفر Laravel.

---

## 🔑 2. إعداد متغيرات البيئة (`.env` في Laravel)

أضف المتغيرات التالية في ملف `.env` الخاص بمشروع Laravel:

```env
# ─── Kashier Configuration ──────────────────────────────────────
# معرف التاجر الخاص بجمعية اليسر في كاشير (يظهر في أعلى لوحة التحكم)
KASHIER_MERCHANT_ID=MID-51693-929

# مفتاح توليد توقيع الهاش (HMAC-SHA256 Secret)
# ملاحظة هامة: هذا هو المفتاح الطويل المخصص للتوقيع الرقمي
KASHIER_SECRET_KEY=<KASHIER_SECRET_KEY من لوحة تحكم كاشير — لا تكتبه في أي ملف يُرفع على Git>
KASHIER_MODE=test

# روابط التطبيق والواجهة
# في مرحلة التطوير الحالية:
APP_URL=https://elyusr-api.pyramedx.com
FRONTEND_URL=http://localhost:8080

# عند النقل إلى الدومين الرسمي المباشر لليسر:
# APP_URL=https://api.elyusr.org
# FRONTEND_URL=https://elyusr.org
```

> [!TIP]
> **البيانات المعتمدة لحساب جمعية اليسر:**
> - **Merchant ID (MID):** `MID-51693-929`
> - **Hash Signing Secret:** `<KASHIER_SECRET_KEY>` (المفتاح الطويل لتوقيع العمليات والـ Webhook)

---

## ⚙️ 3. ملف الإعدادات (`config/services.php`)

أضف تعريف كاشير داخل مصفوفة الإعدادات في `config/services.php`:

```php
'kashier' => [
    'merchant_id' => env('KASHIER_MERCHANT_ID'),
    'secret_key'  => env('KASHIER_SECRET_KEY'),
    'mode'        => env('KASHIER_MODE', 'test'),
    'checkout_url'=> 'https://payments.kashier.io',
    'api_url'     => env('KASHIER_MODE') === 'live' 
        ? 'https://api.kashier.io' 
        : 'https://test-api.kashier.io',
],
```

---

## 🗄️ 4. تهيئة قاعدة البيانات (Migrations)

### أنشئ ملف مايجريشن لجدول العمليات:
```bash
php artisan make:migration create_payment_transactions_table
```

محتوى المايجريشن (`database/migrations/xxxx_create_payment_transactions_table.php`):

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('order_id')->unique()->index();          // مثل: YSR-MURJ27ZK
            $table->string('gateway')->default('kashier')->index();  // kashier, paymob
            $table->string('gateway_reference')->nullable()->index();// الرقم المرجعي من كاشير
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('EGP');
            $table->string('status')->default('pending')->index();   // pending, completed, failed
            
            // بيانات المتبرع
            $table->foreignId('donor_id')->nullable()->constrained('donors')->nullOnDelete();
            $table->foreignId('donation_id')->nullable()->constrained('donations')->nullOnDelete();
            $table->string('donor_name')->nullable();
            $table->string('donor_email')->nullable();
            $table->string('donor_phone')->nullable();
            
            // بيانات الاستجابة من كاشير
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
```

ثم نفذ المايجريشن:
```bash
php artisan migrate
```

---

## 📦 5. الموديل (`app/Models/PaymentTransaction.php`)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'order_id',
        'gateway',
        'gateway_reference',
        'amount',
        'currency',
        'status',
        'donor_id',
        'donation_id',
        'donor_name',
        'donor_email',
        'donor_phone',
        'request_payload',
        'response_payload',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'request_payload' => 'array',
        'response_payload' => 'array',
        'paid_at' => 'datetime',
    ];

    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }
}
```

---

## 🎮 6. الكنترولر الكامل (`app/Http/Controllers/Api/KashierPaymentController.php`)

أنشئ الكنترولر:
```bash
php artisan make:controller Api/KashierPaymentController
```

ضع الكود القياسي التالي:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KashierPaymentController extends Controller
{
    /**
     * 1. إنشاء جلسة الدفع وتوليد الـ HMAC-SHA256 Hash
     * POST /api/v1/payment/kashier/session
     */
    public function createSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'       => 'required|numeric|min:1',
            'order_id'     => 'required|string|max:64',
            'currency'     => 'nullable|string|size:3',
            'donor_name'   => 'nullable|string|max:191',
            'donor_email'  => 'nullable|email|max:191',
            'donor_phone'  => 'nullable|string|max:30',
            'display_lang' => 'nullable|in:ar,en',
        ]);

        $merchantId = config('services.kashier.merchant_id');
        $secretKey  = config('services.kashier.secret_key');
        $mode       = config('services.kashier.mode', 'test');
        $currency   = strtoupper($validated['currency'] ?? 'EGP');
        $amountStr  = number_format((float) $validated['amount'], 2, '.', '');
        $orderId    = $validated['order_id'];
        $lang       = $validated['display_lang'] ?? 'ar';

        if (!$merchantId || !$secretKey) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات كاشير غير مكتملة في الخادم (Kashier credentials not configured).',
            ], 500);
        }

        // 1. حساب توقيع الـ HMAC-SHA256 القياسي الخاص بكاشير
        // المسار المطلوب تشفيره: /?payment={merchantId}.{orderId}.{amount}.{currency}
        $path = "/?payment={$merchantId}.{$orderId}.{$amountStr}.{$currency}";
        $hash = hash_hmac('sha256', $path, $secretKey);

        // رابط إعادة توجيه المتبرع بعد إتمام العملية
        $redirectUrl = config('app.frontend_url', url('/')) . "/donate/status/{$orderId}";

        // 2. بناء رابط الـ Hosted/iFrame المباشر
        $queryParams = http_build_query([
            'merchantId'       => $merchantId,
            'orderId'          => $orderId,
            'order'            => $orderId,
            'amount'           => $amountStr,
            'currency'         => $currency,
            'hash'             => $hash,
            'mode'             => $mode,
            'paymentType'      => 'iframe',
            'display'          => $lang,
            'merchantRedirect' => $redirectUrl,
            'allowedMethods'   => 'card,wallet',
            'brandColor'       => '#059669',
        ]);

        $sessionUrl = "https://payments.kashier.io/?{$queryParams}";

        // 3. حفظ سجل العملية المبدئية في جدول العمليات
        PaymentTransaction::updateOrCreate(
            ['order_id' => $orderId],
            [
                'gateway'         => 'kashier',
                'amount'          => $amountStr,
                'currency'        => $currency,
                'status'          => 'pending',
                'donor_name'      => $validated['donor_name'] ?? null,
                'donor_email'     => $validated['donor_email'] ?? null,
                'donor_phone'     => $validated['donor_phone'] ?? null,
                'request_payload' => $validated,
            ]
        );

        return response()->json([
            'status' => 'success',
            'data'   => [
                'session_url' => $sessionUrl,
                'order_id'    => $orderId,
                'hash'        => $hash,
                'mode'        => $mode,
            ],
        ]);
    }

    /**
     * 2. استقبال إشعار كاشير السحابي المباشر (Webhook)
     * POST /api/v1/payment/kashier/webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Kashier Webhook Received:', $payload);

        $data = $payload['data'] ?? $payload;
        $orderId = $data['merchantOrderId'] ?? $data['orderId'] ?? $data['order'] ?? null;
        $status  = strtolower($data['status'] ?? $data['paymentStatus'] ?? '');

        if (!$orderId) {
            Log::warning('Kashier Webhook: missing order identifier', $payload);
            return response()->json(['message' => 'Order reference missing'], 400);
        }

        // التحقق من صحة التوقيع الوارد مع الـ Webhook (إن وُجد)
        $signature = $request->header('x-kashier-signature') ?? ($data['signature'] ?? null);
        $secretKey = config('services.kashier.secret_key');

        if ($signature && $secretKey) {
            // التحقق من صحة الطلب
            $queryString = $data['signatureKeys'] ?? null;
            if ($queryString && is_array($queryString)) {
                ksort($queryString);
                $signatureData = http_build_query($queryString);
                $expectedSignature = hash_hmac('sha256', $signatureData, $secretKey);
                if (!hash_equals($expectedSignature, $signature)) {
                    Log::error('Kashier Webhook: Invalid signature', ['received' => $signature, 'expected' => $expectedSignature]);
                    return response()->json(['message' => 'Invalid signature'], 403);
                }
            }
        }

        // معالجة نجاح الدفع
        DB::transaction(function () use ($orderId, $status, $data) {
            $transaction = PaymentTransaction::where('order_id', $orderId)->first();

            $isSuccess = in_array($status, ['success', 'captured', 'paid']);

            if ($transaction) {
                $transaction->update([
                    'status'            => $isSuccess ? 'completed' : 'failed',
                    'gateway_reference' => $data['kashierOrderHash'] ?? ($data['transactionId'] ?? null),
                    'response_payload'  => $data,
                    'paid_at'           => $isSuccess ? now() : null,
                ]);

                // تحديث سجل التبرع المرتبط في جدول donations إن وجد
                if ($transaction->donation_id) {
                    Donation::where('id', $transaction->donation_id)->update([
                        'payment_status' => $isSuccess ? 'completed' : 'failed',
                        'updated_at'     => now(),
                    ]);
                }
            }
        });

        return response()->json(['status' => 'received']);
    }

    /**
     * 3. معالجة رجوع المتبرع إلى الخادم
     * GET /api/v1/payment/kashier/callback
     */
    public function callback(Request $request)
    {
        $orderId = $request->query('order') ?? $request->query('orderId');
        $status  = strtolower($request->query('paymentStatus') ?? '');

        Log::info("Kashier Callback for order: {$orderId}, status: {$status}");

        $frontendUrl = config('app.frontend_url', url('/'));
        $targetUrl = "{$frontendUrl}/donate/status/{$orderId}?status={$status}";

        return redirect()->away($targetUrl);
    }
}
```

---

## 🛣️ 7. مسارات الـ API في (`routes/api.php`)

أضف المسارات التالية داخل `routes/api.php`:

```php
use App\Http\Controllers\Api\KashierPaymentController;

Route::prefix('v1/payment/kashier')->group(function () {
    // 1. إنشاء الجلسة (عام للمتبرعين)
    Route::post('session', [KashierPaymentController::class, 'createSession']);
    
    // 2. استقبال Webhook من كاشير
    Route::post('webhook', [KashierPaymentController::class, 'webhook']);
    
    // 3. إعادة توجيه المتبرع بعد الدفع
    Route::get('callback', [KashierPaymentController::class, 'callback']);
});
```

---

## 🛡️ 8. استثناء الـ Webhook من حماية CSRF

في **Laravel 11**: في ملف `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: [
        'api/v1/kashier/webhook',   // ✅ الرابط الصحيح الفعلي
    ]);
})
```

في **Laravel 10 وما قبله**: في `app/Http/Middleware/VerifyCsrfToken.php`:
```php
protected $except = [
    'api/v1/kashier/webhook',   // ✅ الرابط الصحيح الفعلي
];
```

---

## 📋 9. قائمة الفحص قبل التشغيل الحي (Checklist)

| البند | التحقق |
|---|---|
| **صيغة Merchant ID** | التأكد أنه يبدأ بـ `MID-` في وضع التجربة (`KASHIER_MODE=test`) |
| **رابط الـ Webhook في لوحة كاشير** | 🔴 **يجب أن يكون:** `https://api.elyusr.org/api/v1/kashier/webhook` — الرابط الحالي الخاطئ `api/webhooks/kashier` يعطي 404! |
| **اختبار الكارت التجريبي** | رقم: `4111 1111 1111 1111`، تاريخ: أي تاريخ مستقبلي، CVV: `123`، OTP: `123456` |
| **الإنتاج (Production)** | تغيير `KASHIER_MODE=live` وإدخال مفاتيح الحساب المعتمد (Live Keys) |
| **مسار الـ by-ref في الباك** | يحتاج الفرونت `GET /api/v1/donations/by-ref/{ref}` لعمل polling بعد 3DS |

---

## 🌐 10. خطة نقل الـ API من سيرفر التطوير (Pyramedx) إلى الدومين المباشر (Elyusr)

النظام مهيأ بالكامل ليعمل بسلاسة تامة دون تغيير أي سطر كود، فقط بتعديل متغيرات البيئة `.env`:

### أ) في جانب الفرونت إند (React/Vite):
في ملف `.env`:
```env
# أثناء التطوير:
VITE_BACKEND_URL="https://elyusr-api.pyramedx.com"

# عند الانتقال للبث المباشر (Production):
# VITE_BACKEND_URL="https://api.elyusr.org"
```
*الـ Proxy في `vite.config.ts` و عميل الـ API في `laravelApi.ts` سيعملان تلقائياً على الرابط الجديد فور تغييره.*

### ب) في جانب الباك إند (Laravel):
في ملف `.env` على السيرفر:
```env
APP_URL=https://api.elyusr.org
FRONTEND_URL=https://elyusr.org
```

---

## 🔔 11. إعداد الـ Webhook في لوحة تحكم كاشير (Kashier Dashboard)

> [!CAUTION]
> **المشكلة الحالية المؤكدة:** لوحة كاشير مضبوطة على رابط خاطئ!
> - ❌ **الرابط الخاطئ الحالي (يعطي 404):** `https://api.elyusr.org/api/webhooks/kashier`
> - ✅ **الرابط الصحيح الفعلي (يعطي 200):** `https://api.elyusr.org/api/v1/kashier/webhook`

1. ادخل على لوحة تحكم كاشير: `portal.kashier.io`
2. اذهب إلى **Developers > Integrations** أو **Settings > Webhooks**
3. في حقل **Webhook URL**، ضع الرابط الصحيح:
   ```
   https://api.elyusr.org/api/v1/kashier/webhook
   ```
4. فعّل إشعارات: `payment.success` و `payment.failed`.
5. احفظ الإعدادات.

---

## 📋 12. حالة نقاط الباك إند مع الفرونت إند (Backend Endpoints Status)

| المسار | الطريقة | الحالة في السيرفر | الوصف |
|---|---|---|---|
| `GET /api/v1/donations/track/{ref}` | GET | ✅ **شغال 100% ومربوط** | يستعلم عن حالة التبرع ويرجع `status: "paid"` أو `"pending"` |
| `POST /api/v1/kashier/webhook` | POST | ✅ **شغال 200** | يستقبل إشعار الدفع من كاشير ويحدث التبرع في قاعدة البيانات |
| `GET /api/v1/donations/by-ref/{ref}` | GET | ⚪ غير ضروري (تم التحويل لـ `/track`) | كان مساراً بديلاً والفرونت الآن يعتمد كلياً على `/track/{ref}` الشغال |
| `GET /api/v1/kashier/redirect` | GET | 🔴 **يعطي 500 خطأ خادم حالياً** | رابط إعادة التوجيه الذي يفتحه كاشير بعد الدفع مباشرة |

> 💡 **ملاحظة هامة:** نقطة النهاية `GET /api/v1/donations/track/{ref}` تم فحصها حياً على السيرفر بمرجع `YSR-ZGZ17NIB-9018` ورجعت بنجاح `status: "paid"`. الفرونت إند يقوم الآن بالفحص التلقائي عبر هذا المسار مباشرة بعد الدفع لتأكيد العملية وإغلاق نافذة كاشير فوراً.

---

## 🚨 13. حل خطأ 500 Server Error في مسار `/api/v1/kashier/redirect`

### سبب المشكلة:
عند إتمام الدفع بنجاح، يقوم كاشير بتوجيه المتصفح إلى الرابط المحدد له كـ `merchantRedirect`:
```
https://api.elyusr.org/api/v1/kashier/redirect?paymentStatus=SUCCESS&merchantOrderId=YSR-XXXXX...
```
لكن هذا المسار على خادم Laravel يعطي حالياً: **500 | SERVER ERROR**.

### الحل المطلوب من مطور الباك إند (خياران - اختر الأسهل):

#### الخيار الأول (الموصى به - كود مباشر في routes/api.php):
ضع هذا الكود في `routes/api.php` لتوجيه المتبرع مباشرة إلى واجهة الفرونت إند:

```php
use Illuminate\Http\Request;

Route::get('/kashier/redirect', function (Request $request) {
    $orderId = $request->query('merchantOrderId') ?? $request->query('orderId');
    $status = $request->query('paymentStatus', 'SUCCESS');
    
    // رابط الفرونت إند
    $frontendUrl = env('FRONTEND_URL', 'https://elyusr.org');
    
    return redirect("{$frontendUrl}/donate/status/{$orderId}?paymentStatus={$status}");
});
```

#### الخيار الثاني (الأفضل معمارياً):
عند إنشاء جلسة الدفع لكاشير في `KashierController`، اجعل `merchantRedirect` يشير مباشرة إلى الفرونت إند دون المرور بالباك إند:
```php
'merchantRedirect' => env('FRONTEND_URL', 'https://elyusr.org') . "/donate/status/{$orderId}",
```
بهذا يتوجه كاشير مباشرة لصفحة تأكيد التبرع في الموقع دون أي أخطاء 500.
