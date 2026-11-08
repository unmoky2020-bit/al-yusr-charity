<?php

namespace App\Http\Controllers\Api\V1\UserManagement;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * PUT /users/{user}/password — the super admin sets a new password for any account (someone locked
 * out, a shared password to replace). That account is signed out everywhere unless sign_out=false.
 * The password itself is never logged.
 */
class UserPasswordController extends Controller
{
    public function update(Request $request, User $user)
    {
        $actor = $request->user();
        if (! $actor || ! $actor->roles()->where('slug', 'super-admin')->exists()) {
            return response()->json(['message' => 'تعيين كلمة مرور لمستخدم آخر للسوبر أدمن فقط.'], 403);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'sign_out' => ['sometimes', 'boolean'],
        ]);

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        if ($data['sign_out'] ?? true) {
            $user->tokens()->delete();
        }

        try {
            app(ActivityLogService::class)->custom(
                'user_password_set',
                $user,
                'تعيين كلمة مرور جديدة للمستخدم: ' . $user->name,
                ['by_user_id' => $actor->id, 'signed_out' => (bool) ($data['sign_out'] ?? true)]
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'تم تعيين كلمة المرور الجديدة.']);
    }
}
