# تقرير فجوات الـ API وما يحتاجه الباك إند — مشروع اليسر

> **الغرض:** ملف مرجعي شامل لمطور Laravel لتنفيذ ما ينقص النظام.
> **السيرفر المستهدف:** `https://api.elyusr.org`
> **آخر تحديث:** 2026-10-03

---

## 🔴 المشاكل الحالية والمطلوب من الباك إند

### 1. راوت جلسة كاشير مفقود `404 Not Found`

```
POST /api/v1/payment/kashier/session → 404
"The route api/v1/payment/kashier/session could not be found."
```

**السبب:** الراوت غير مُضاف في `routes/api.php` بعد.
**الأثر:** الفرونت إند يضطر للـ Fallback بحساب الـ Hash محلياً، وكاشير يرد بـ `403 Forbidden` لأن الـ Order لم يُنشأ server-side.

---

### مطلوب من مطور لارفيل — الكود الجاهز للنسخ

#### أ) `routes/api.php` — إضافة المجموعة:

```php
use App\Http\Controllers\Api\KashierPaymentController;

Route::prefix('v1/payment/kashier')->group(function () {
    Route::post('session',  [KashierPaymentController::class, 'createSession']);
    Route::post('webhook',  [KashierPaymentController::class, 'webhook']);
    Route::get('callback',  [KashierPaymentController::class, 'callback']);
});
```

#### ب) إنشاء الكنترولر:

```bash
php artisan make:controller Api/KashierPaymentController
```

#### ج) محتوى الكنترولر:

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
     * POST /api/v1/payment/kashier/session
     */
    public function createSession(Request $request): JsonResponse
    {
        $v = $request->validate([
            'amount'       => 'required|numeric|min:1',
            'order_id'     => 'required|string|max:64',
            'currency'     => 'nullable|string|size:3',
            'donor_name'   => 'nullable|string|max:191',
            'donor_email'  => 'nullable|email|max:191',
            'donor_phone'  => 'nullable|string|max:30',
            'display_lang' => 'nullable|in:ar,en',
        ]);

        $mid         = config('services.kashier.merchant_id');
        $secret      = config('services.kashier.secret_key');
        $mode        = config('services.kashier.mode', 'test');
        $currency    = strtoupper($v['currency'] ?? 'EGP');
        $amount      = number_format((float) $v['amount'], 2, '.', '');
        $orderId     = $v['order_id'];
        $lang        = $v['display_lang'] ?? 'ar';
        $frontendUrl = config('app.frontend_url', 'https://elyusr.org');

        if (!$mid || !$secret) {
            return response()->json(['status' => 'error', 'message' => 'Kashier not configured.'], 500);
        }

        $path = "/?payment={$mid}.{$orderId}.{$amount}.{$currency}";
        $hash = hash_hmac('sha256', $path, $secret);

        $sessionUrl = 'https://payments.kashier.io/?' . http_build_query([
            'merchantId'       => $mid,
            'orderId'          => $orderId,
            'order'            => $orderId,
            'amount'           => $amount,
            'currency'         => $currency,
            'hash'             => $hash,
            'mode'             => $mode,
            'paymentType'      => 'iframe',
            'display'          => $lang,
            'merchantRedirect' => "{$frontendUrl}/donate/status/{$orderId}",
            'allowedMethods'   => 'card,wallet',
            'brandColor'       => '#059669',
        ]);

        PaymentTransaction::updateOrCreate(
            ['order_id' => $orderId],
            [
                'gateway'         => 'kashier',
                'amount'          => $amount,
                'currency'        => $currency,
                'status'          => 'pending',
                'donor_name'      => $v['donor_name'] ?? null,
                'donor_email'     => $v['donor_email'] ?? null,
                'donor_phone'     => $v['donor_phone'] ?? null,
                'request_payload' => $v,
            ]
        );

        return response()->json([
            'status' => 'success',
            'data'   => ['session_url' => $sessionUrl, 'order_id' => $orderId, 'hash' => $hash, 'mode' => $mode],
        ]);
    }

    /**
     * POST /api/v1/payment/kashier/webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Kashier Webhook:', $payload);

        $data    = $payload['data'] ?? $payload;
        $orderId = $data['merchantOrderId'] ?? $data['orderId'] ?? $data['order'] ?? null;
        $status  = strtolower($data['status'] ?? $data['paymentStatus'] ?? '');

        if (!$orderId) {
            return response()->json(['message' => 'Order reference missing'], 400);
        }

        // Verify signature if present
        $sig    = $request->header('x-kashier-signature') ?? ($data['signature'] ?? null);
        $secret = config('services.kashier.secret_key');
        if ($sig && $secret && isset($data['signatureKeys']) && is_array($data['signatureKeys'])) {
            $keys = $data['signatureKeys'];
            ksort($keys);
            if (!hash_equals(hash_hmac('sha256', http_build_query($keys), $secret), $sig)) {
                Log::error('Kashier Webhook: Invalid signature');
                return response()->json(['message' => 'Invalid signature'], 403);
            }
        }

        $success = in_array($status, ['success', 'captured', 'paid']);

        DB::transaction(function () use ($orderId, $data, $success) {
            $tx = PaymentTransaction::where('order_id', $orderId)->first();
            if (!$tx) return;
            $tx->update([
                'status'            => $success ? 'completed' : 'failed',
                'gateway_reference' => $data['kashierOrderHash'] ?? ($data['transactionId'] ?? null),
                'response_payload'  => $data,
                'paid_at'           => $success ? now() : null,
            ]);
            if ($tx->donation_id) {
                Donation::where('id', $tx->donation_id)
                    ->update(['payment_status' => $success ? 'completed' : 'failed']);
            }
        });

        return response()->json(['status' => 'received']);
    }

    /**
     * GET /api/v1/payment/kashier/callback
     */
    public function callback(Request $request)
    {
        $orderId = $request->query('order') ?? $request->query('orderId');
        $status  = strtolower($request->query('paymentStatus') ?? '');
        return redirect()->away(config('app.frontend_url', 'https://elyusr.org') . "/donate/status/{$orderId}?status={$status}");
    }
}
```

---

### 2. قاعدة البيانات — `payment_transactions` مفقودة

```bash
php artisan make:migration create_payment_transactions_table
php artisan migrate
```

```php
Schema::create('payment_transactions', function (Blueprint $table) {
    $table->id();
    $table->string('order_id')->unique()->index();
    $table->string('gateway')->default('kashier')->index();
    $table->string('gateway_reference')->nullable()->index();
    $table->decimal('amount', 12, 2);
    $table->string('currency', 3)->default('EGP');
    $table->string('status')->default('pending')->index();
    $table->foreignId('donor_id')->nullable()->constrained('donors')->nullOnDelete();
    $table->foreignId('donation_id')->nullable()->constrained('donations')->nullOnDelete();
    $table->string('donor_name')->nullable();
    $table->string('donor_email')->nullable();
    $table->string('donor_phone')->nullable();
    $table->json('request_payload')->nullable();
    $table->json('response_payload')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
});
```

---

### 3. `config/services.php`

```php
'kashier' => [
    'merchant_id' => env('KASHIER_MERCHANT_ID'),
    'secret_key'  => env('KASHIER_SECRET_KEY'),
    'mode'        => env('KASHIER_MODE', 'test'),
],
```

---

### 4. `.env` على سيرفر Laravel (api.elyusr.org)

```env
APP_URL=https://api.elyusr.org
FRONTEND_URL=https://elyusr.org

KASHIER_MERCHANT_ID=MID-51693-929
KASHIER_SECRET_KEY=<المفتاح السري من لوحة تحكم كاشير — لا يُكتب في أي ملف يُرفع على Git>
KASHIER_MODE=test
```

> **تنبيه:** `KASHIER_SECRET_KEY` هو المفتاح الطويل لتوقيع الـ HMAC-SHA256.
> مفتاح Payment API Key (بصيغة UUID) للاستدعاءات من Dashboard فقط وليس للتوقيع.

---

### 5. استثناء الـ Webhook من CSRF

**Laravel 11** (`bootstrap/app.php`):
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->validateCsrfTokens(except: ['api/v1/payment/kashier/webhook']);
})
```

**Laravel 10** (`app/Http/Middleware/VerifyCsrfToken.php`):
```php
protected $except = ['api/v1/payment/kashier/webhook'];
```

---

### 6. مشكلة `donation_target` — `POST /donations/submit` يرجع 422

**الخطأ:**
```json
"يجب اختيار برنامج أو مشروع أو حملة تبرع واحدة فقط."
errors: { "donation_target": [...] }
```

**الخيار المُفضّل — اجعل الـ target اختيارياً للتبرع العام:**
في ملف الـ Request Validation، احذف أي `required_without_all` على `donation_target`:
```php
'case_id'              => 'nullable|exists:cases,id',
'program_id'           => 'nullable|exists:programs,id',
'project_id'           => 'nullable|exists:projects,id',
'donation_campaign_id' => 'nullable|exists:donation_campaigns,id',
```

---

### 7. Webhook في لوحة كاشير

1. ادخل `portal.kashier.io`
2. **Developers → Integrations**
3. **Webhook URL:**
   ```
   https://api.elyusr.org/api/v1/payment/kashier/webhook
   ```
4. فعّل: `payment.success` و `payment.failed`

---

## ✅ قائمة الفحص

| البند | الحالة |
|---|---|
| `routes/api.php` — مجموعة `payment/kashier` | ⬜ مطلوب |
| `KashierPaymentController.php` — إنشاء | ⬜ مطلوب |
| `payment_transactions` — Migration | ⬜ مطلوب |
| `config/services.php` — قسم `kashier` | ⬜ مطلوب |
| `.env` على السيرفر — `KASHIER_*` و `FRONTEND_URL` | ⬜ مطلوب |
| CSRF exemption للـ Webhook | ⬜ مطلوب |
| `donation_target` validation — اختياري | ⬜ مطلوب |
| Webhook URL في لوحة كاشير | ⬜ مطلوب |
| `KASHIER_MODE=live` عند الإطلاق | ⬜ لاحقاً |
