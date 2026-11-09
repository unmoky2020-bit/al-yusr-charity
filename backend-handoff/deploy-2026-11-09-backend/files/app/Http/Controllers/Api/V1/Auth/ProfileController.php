<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * The signed-in person's own account (9 Nov 2026):
 *   PUT    /profile          name, email, phone, bio, city, governorate, job_title, preferences
 *   POST   /profile/avatar   multipart "avatar" (jpg / png / webp, at most 4 MB)
 *   DELETE /profile/avatar
 * Every reply is { message, data: user } with the roles and an absolute avatar_url.
 * Fields whose column the database does not have yet are ignored, never an error.
 */
class ProfileController extends Controller
{
    private const AVATAR_DIR = 'avatars';
    private const TEXT_FIELDS = ['name', 'email', 'phone', 'bio', 'city', 'governorate', 'job_title'];
    private const PREFERENCE_KEYS = ['whatsapp_updates', 'email_updates', 'preferred_contact', 'anonymous_by_default'];

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s\-()]{5,29}$/'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'governorate' => ['sometimes', 'nullable', 'string', 'max:120'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'preferences' => ['sometimes', 'nullable', 'array'],
            'preferences.whatsapp_updates' => ['sometimes', 'boolean'],
            'preferences.email_updates' => ['sometimes', 'boolean'],
            'preferences.preferred_contact' => ['sometimes', Rule::in(['whatsapp', 'phone', 'email'])],
            'preferences.anonymous_by_default' => ['sometimes', 'boolean'],
        ], [
            'name.required' => 'اكتب اسمك.',
            'name.min' => 'الاسم لازم يكون حرفين على الأقل.',
            'email.required' => 'اكتب بريدك الإلكتروني.',
            'email.email' => 'البريد الإلكتروني مش مظبوط.',
            'email.unique' => 'البريد ده مستخدم في حساب تاني.',
            'phone.regex' => 'رقم الموبايل مش مظبوط.',
            'bio.max' => 'النبذة أطول من 500 حرف.',
        ]);

        $columns = array_flip(Schema::getColumnListing($user->getTable()));
        $changes = [];
        foreach (self::TEXT_FIELDS as $field) {
            if (! array_key_exists($field, $data) || ! isset($columns[$field])) {
                continue;
            }
            $value = is_string($data[$field]) ? trim(preg_replace('/\s+/u', ' ', $data[$field])) : $data[$field];
            if ($field === 'bio' && is_string($data[$field])) {
                $value = trim($data[$field]);
            }
            $changes[$field] = ($value === '' ? null : $value);
        }
        if (isset($changes['email'])) {
            $changes['email'] = mb_strtolower($changes['email']);
        }
        if (array_key_exists('preferences', $data) && isset($columns['preferences'])) {
            $saved = $this->preferencesOf($user);
            $incoming = array_intersect_key((array) ($data['preferences'] ?? []), array_flip(self::PREFERENCE_KEYS));
            $changes['preferences'] = json_encode(array_merge($saved, $incoming), JSON_UNESCAPED_UNICODE);
        }

        $emailChanged = isset($changes['email']) && strcasecmp($changes['email'], (string) $user->email) !== 0;
        if ($emailChanged && isset($columns['email_verified_at'])) {
            $changes['email_verified_at'] = null; // the new address is confirmed with a code
        }

        if ($changes) {
            $user->forceFill($changes)->save();
        }

        return $this->reply($user, 'اتحفظت بياناتك.');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=48,min_height=48,max_width=8000,max_height=8000'],
        ], [
            'avatar.required' => 'اختار صورة.',
            'avatar.image' => 'الملف لازم يكون صورة.',
            'avatar.mimes' => 'الصورة لازم تكون JPG أو PNG أو WebP.',
            'avatar.max' => 'الصورة أكبر من 4 ميجا.',
            'avatar.dimensions' => 'مقاس الصورة مش مناسب.',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $ext = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension() ?: 'jpg');
        $ext = $ext === 'jpeg' ? 'jpg' : $ext;
        $path = $file->storeAs(self::AVATAR_DIR, 'u' . $user->id . '-' . Str::lower(Str::random(12)) . '.' . $ext, 'public');

        $previous = $user->avatar;
        $user->forceFill(['avatar' => $path])->save();
        $this->deleteOwnAvatar($previous, (int) $user->id);

        return $this->reply($user, 'اتحدثت صورتك.');
    }

    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $previous = $user->avatar;
        $user->forceFill(['avatar' => null])->save();
        $this->deleteOwnAvatar($previous, (int) $user->id);

        return $this->reply($user, 'اتشالت الصورة.');
    }

    /** Only a file this endpoint stored for this account is deleted (never a shared media file). */
    private function deleteOwnAvatar(?string $path, int $userId): void
    {
        $path = ltrim(preg_replace('#^/?storage/#', '', (string) $path), '/');
        if ($path !== '' && str_starts_with($path, self::AVATAR_DIR . '/u' . $userId . '-')) {
            Storage::disk('public')->delete($path);
        }
    }

    /** @return array<string, mixed> */
    private function preferencesOf(User $user): array
    {
        $raw = $user->getAttributes()['preferences'] ?? null;
        if (is_array($raw)) {
            return $raw;
        }
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($decoded) ? $decoded : [];
    }

    private function avatarUrl(?string $avatar): ?string
    {
        $avatar = trim((string) $avatar);
        if ($avatar === '') {
            return null;
        }
        if (preg_match('#^https?://#i', $avatar)) {
            return $avatar;
        }

        return Storage::disk('public')->url(ltrim(preg_replace('#^/?storage/#', '', $avatar), '/'));
    }

    private function reply(User $user, string $message): JsonResponse
    {
        $user->refresh()->load('roles');
        $data = $user->toArray();
        $data['avatar_url'] = $this->avatarUrl($user->avatar);
        if (array_key_exists('preferences', $data)) {
            $data['preferences'] = $this->preferencesOf($user) ?: null;
        }

        return response()->json(['message' => $message, 'data' => $data]);
    }
}
