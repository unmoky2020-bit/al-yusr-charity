<?php

namespace App\Services;

use App\Models\Donation;
use App\Models\PaymentGatewaySetting;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class KashierService
{
    protected array $settings = [];

    public function __construct()
    {
        $setting = PaymentGatewaySetting::where('gateway', 'kashier')
            ->where('is_active', true)
            ->first();

        $this->settings = is_array($setting?->credentials)
            ? $setting->credentials
            : [];
    }

    public function createPaymentSession(
        Donation $donation
    ): array {
        $donation->loadMissing('donor');

        /*
        |--------------------------------------------------------------------------
        | Validate donation
        |--------------------------------------------------------------------------
        */

        if (!$donation->transaction_reference) {
            throw new RuntimeException(
                'Donation transaction reference is missing.'
            );
        }

        if ((float) $donation->amount <= 0) {
            throw new RuntimeException(
                'Donation amount must be greater than zero.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Order & Amount
        |--------------------------------------------------------------------------
        */

        $orderReference = (string) $donation->transaction_reference;

        $amount = number_format(
            (float) $donation->amount,
            2,
            '.',
            ''
        );

        if ((float) $amount <= 0) {
            throw new RuntimeException(
                'Donation amount must be greater than zero.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Resolve configuration
        |--------------------------------------------------------------------------
        */

        $baseUrl = rtrim(
            (string) $this->setting(
                'base_url',
                'services.kashier.base_url'
            ),
            '/'
        );

        $secretKey = $this->setting(
            'secret_key',
            'services.kashier.secret_key'
        );

        $apiKey = $this->setting(
            'api_key',
            'services.kashier.api_key'
        );

        $merchantId = $this->setting(
            'merchant_id',
            'services.kashier.merchant_id'
        );

        $currency = strtoupper(
            (string) $this->setting(
                'currency',
                'services.kashier.currency',
                'EGP'
            )
        );

        $redirectUrl = $this->setting(
            'redirect_url',
            'services.kashier.redirect_url'
        );

        $webhookUrl = $this->setting(
            'webhook_url',
            'services.kashier.webhook_url'
        );

        $allowedMethods = $this->setting(
            'allowed_methods',
            'services.kashier.allowed_methods',
            'card,wallet'
        );

        // Look of Kashier's hosted page inside the site's checkout dialog (gateway settings → kashier).
        $brandColor = $this->setting(
            'brand_color',
            'services.kashier.brand_color',
            '#0E3B2E'
        );

        $iframeBackgroundColor = $this->setting(
            'iframe_background_color',
            'services.kashier.iframe_background_color',
            '#FFFFFF'
        );

        /*
        |--------------------------------------------------------------------------
        | Validate configuration
        |--------------------------------------------------------------------------
        */

        if ($baseUrl === '') {
            throw new RuntimeException(
                'Kashier base URL is not configured.'
            );
        }

        if (!filter_var($baseUrl, FILTER_VALIDATE_URL)) {
            throw new RuntimeException(
                'Kashier base URL is invalid.'
            );
        }

        if (
            !is_string($secretKey) ||
            trim($secretKey) === ''
        ) {
            throw new RuntimeException(
                'Kashier secret key is not configured.'
            );
        }

        if (
            !is_string($apiKey) ||
            trim($apiKey) === ''
        ) {
            throw new RuntimeException(
                'Kashier API key is not configured.'
            );
        }

        if (
            !is_string($merchantId) &&
            !is_numeric($merchantId)
        ) {
            throw new RuntimeException(
                'Kashier merchant ID is not configured.'
            );
        }

        if (trim((string) $merchantId) === '') {
            throw new RuntimeException(
                'Kashier merchant ID is not configured.'
            );
        }

        if ($currency !== 'EGP') {
            throw new RuntimeException(
                'Kashier currency must be EGP.'
            );
        }

        if (
            !is_string($redirectUrl) ||
            !filter_var($redirectUrl, FILTER_VALIDATE_URL)
        ) {
            throw new RuntimeException(
                'Kashier redirect URL is not configured or invalid.'
            );
        }

        if (
            !is_string($webhookUrl) ||
            !filter_var($webhookUrl, FILTER_VALIDATE_URL)
        ) {
            throw new RuntimeException(
                'Kashier webhook URL is not configured or invalid.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Customer data
        |--------------------------------------------------------------------------
        */

        $donor = $donation->donor;

        $customer = [
            'reference' => (string) $donation->id,
        ];

        if (
            is_string($donor?->email) &&
            filter_var($donor->email, FILTER_VALIDATE_EMAIL)
        ) {
            $customer['email'] = $donor->email;
        }

        if (
            is_string($donor?->phone) &&
            trim($donor->phone) !== ''
        ) {
            $customer['phone'] = trim($donor->phone);
        }

        /*
        |--------------------------------------------------------------------------
        | Kashier session settings
        |--------------------------------------------------------------------------
        */

        $expireAt = now()
            ->addMinutes(30)
            ->toIso8601String();

        $maxFailureAttempts = 3;

        /*
        |--------------------------------------------------------------------------
        | Create Kashier payment session
        |--------------------------------------------------------------------------
        */

        $payload = [
            'expireAt' => $expireAt,

            'maxFailureAttempts' => $maxFailureAttempts,

            'amount' => $amount,

            'currency' => $currency,

            'order' => $orderReference,

            'merchantId' => (string) $merchantId,

            'merchantRedirect' => $redirectUrl,

            'serverWebhook' => $webhookUrl,

            'type' => 'one-time',

            'display' => 'ar',

            'brandColor' => $brandColor,

            'iframeBackgroundColor' => $iframeBackgroundColor,

            'allowedMethods' => $allowedMethods,

            'customer' => $customer,

            'description' => 'Donation to Al Yusr',

            'interactionSource' => 'ECOMMERCE',

            'enable3DS' => true,
        ];

        try {
            $response = Http::timeout(30)
                ->connectTimeout(10)
                ->withHeaders([
                    'Authorization' => trim($secretKey),
                    'api-key' => trim($apiKey),
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->asJson()
                ->post(
                    $baseUrl . '/v3/payment/sessions',
                    $payload
                );
        } catch (\Throwable $e) {
            report($e);

            throw new RuntimeException(
                'Unable to connect to Kashier.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Handle Kashier response
        |--------------------------------------------------------------------------
        */

        if ($response->failed()) {
            report(new RuntimeException(
                'Kashier payment session failed with HTTP ' .
                $response->status() .
                ': ' .
                $response->body()
            ));

            throw new RuntimeException(
                'Kashier payment session failed.'
            );
        }

        $result = $response->json();

        if (!is_array($result)) {
            throw new RuntimeException(
                'Invalid response received from Kashier.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Resolve session URL
        |--------------------------------------------------------------------------
        */

        $sessionUrl =
            $result['sessionUrl']
            ?? $result['session_url']
            ?? null;

        if (
            !is_string($sessionUrl) ||
            trim($sessionUrl) === ''
        ) {
            throw new RuntimeException(
                'Kashier did not return a payment session URL.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize response
        |--------------------------------------------------------------------------
        */

        $result['sessionUrl'] = trim($sessionUrl);

        return $result;
    }

    protected function setting(
        string $key,
        string $configKey,
        mixed $default = null
    ): mixed {
        $value = $this->settings[$key] ?? null;

        if ($value !== null && $value !== '') {
            return $value;
        }

        return config($configKey, $default);
    }
}
