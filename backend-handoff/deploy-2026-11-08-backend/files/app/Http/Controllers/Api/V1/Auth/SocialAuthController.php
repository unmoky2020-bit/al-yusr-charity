<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Notifications\NewUserNotification;
use App\Support\NotifyAdmins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Sign in / sign up with Google or Facebook (donor accounts).
 *   GET  /auth/providers              → which buttons the site may show (ids only, never secrets)
 *   POST /auth/google   {credential}  → Google Identity Services ID token, checked with Google
 *   POST /auth/facebook {access_token}→ Facebook Login token, checked with the app secret
 * The same email = the same account. Staff accounts (any role other than donor / volunteer) keep
 * signing in with their password, so a social account can never open the dashboard.
 * Keys come from .env (config/social.php): GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET.
 */
class SocialAuthController extends Controller
{
    private const PUBLIC_ROLES = ['donor', 'volunteer'];
    private const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    public function providers()
    {
        $google = config('social.google.client_id');
        $facebook = config('social.facebook.app_id');

        return response()->json([
            'google' => $google ? ['client_id' => $google] : null,
            'facebook' => $facebook && config('social.facebook.app_secret') ? ['app_id' => $facebook] : null,
        ]);
    }

    public function google(Request $request)
    {
        $clientId = config('social.google.client_id');
        if (! $clientId) {
            return $this->notConfigured('Google');
        }
        $data = $request->validate(['credential' => ['required', 'string', 'max:4096']]);

        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $data['credential']]);
        $claims = $response->ok() ? $response->json() : null;
        $valid = is_array($claims)
            && hash_equals((string) $clientId, (string) ($claims['aud'] ?? ''))
            && in_array($claims['iss'] ?? '', self::GOOGLE_ISSUERS, true)
            && (int) ($claims['exp'] ?? 0) > time()
            && in_array($claims['email_verified'] ?? false, [true, 'true'], true)
            && filter_var($claims['email'] ?? '', FILTER_VALIDATE_EMAIL);

        if (! $valid) {
            return response()->json(['message' => 'تعذّر التحقق من حساب جوجل. حاول مرة أخرى.'], 422);
        }

        return $this->signIn((string) $claims['email'], (string) ($claims['name'] ?? ''));
    }

    public function facebook(Request $request)
    {
        $appId = config('social.facebook.app_id');
        $secret = config('social.facebook.app_secret');
        if (! $appId || ! $secret) {
            return $this->notConfigured('Facebook');
        }
        $data = $request->validate(['access_token' => ['required', 'string', 'max:4096']]);

        $debug = Http::timeout(10)->get('https://graph.facebook.com/debug_token', [
            'input_token' => $data['access_token'],
            'access_token' => $appId . '|' . $secret,
        ])->json('data');
        if (! is_array($debug) || empty($debug['is_valid']) || (string) ($debug['app_id'] ?? '') !== (string) $appId) {
            return response()->json(['message' => 'تعذّر التحقق من حساب فيسبوك. حاول مرة أخرى.'], 422);
        }

        $me = Http::timeout(10)->get('https://graph.facebook.com/v19.0/me', [
            'fields' => 'id,name,email',
            'access_token' => $data['access_token'],
        ])->json();
        if (! is_array($me) || ! filter_var($me['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'حساب فيسبوك ده مش مربوط بإيميل. سجّل بالإيميل وكلمة المرور.'], 422);
        }

        return $this->signIn((string) $me['email'], (string) ($me['name'] ?? ''));
    }

    private function signIn(string $email, string $name)
    {
        $email = mb_strtolower(trim($email));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        $created = false;

        if ($user) {
            $roles = $user->roles()->pluck('slug')->all();
            if (array_diff($roles, self::PUBLIC_ROLES)) {
                return response()->json(['message' => 'حسابات فريق العمل بتدخل بالإيميل وكلمة المرور.'], 403);
            }
            if ($user->status !== 'active') {
                return response()->json(['message' => __('messages.account_inactive')], 403);
            }
        } else {
            $role = Role::where('slug', 'donor')->first();
            if (! $role) {
                return response()->json(['message' => 'Registration role is not configured.'], 500);
            }
            $user = DB::transaction(function () use ($email, $name, $role) {
                $user = User::create([
                    'name' => trim($name) !== '' ? Str::limit(trim($name), 120, '') : Str::before($email, '@'),
                    'email' => $email,
                    'password' => Hash::make(Str::random(48)),
                    'status' => 'active',
                ]);
                $user->roles()->sync([$role->id]);

                return $user;
            });
            $created = true;
            NotifyAdmins::send(new NewUserNotification($user->id, $user->name));
        }

        // Google / Facebook already confirmed this address.
        if (empty($user->email_verified_at) && Schema::hasColumn($user->getTable(), 'email_verified_at')) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => $created ? 'تم إنشاء حسابك. أهلًا بيك في اليسر.' : 'أهلًا بعودتك.',
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user->load('roles'),
            'created' => $created,
        ], $created ? 201 : 200);
    }

    private function notConfigured(string $provider)
    {
        return response()->json(['message' => "الدخول بـ {$provider} مش مفعّل على السيرفر."], 503);
    }
}
