<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Notifications\NewUserNotification;
use App\Notifications\WelcomeNotification;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => __('messages.invalid_credentials'),
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => __('messages.account_inactive'),
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'message' => __('messages.login_success'),
            'token' => $token,
            'user' => $user->load('roles'),
        ]);
    }

    public function register(RegisterRequest $request)
    {
        /*
         * Public registration can NEVER choose an administrative role.
         * Only low-privilege public roles are allowed.
         *
         * If role is omitted, the account is a donor.
         */
        $requestedRole = strtolower((string) $request->input('role', 'donor'));

        if (!in_array($requestedRole, ['donor', 'volunteer'], true)) {
            return response()->json([
                'message' => 'Invalid registration role.',
            ], 422);
        }

        $role = Role::where('slug', $requestedRole)->first();

        if (!$role) {
            return response()->json([
                'message' => 'Registration role is not configured.',
            ], 500);
        }

        $user = DB::transaction(function () use ($request, $role) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $user->roles()->sync([$role->id]);

            return $user;
        });

        try {
            $admins = User::whereHas('roles', function ($query) {
                $query->where('slug', 'super-admin');
            })->get();

            foreach ($admins as $admin) {
                try {
                    $admin->notify(new NewUserNotification($user->id, $user->name));
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            $user->notify(new WelcomeNotification($user->name));
        } catch (\Throwable $e) {
            report($e);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => __('messages.register_success'),
            'token' => $token,
            'user' => $user->load('roles'),
        ], 201);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'message' => __('messages.profile'),
            'user' => $request->user()->load('roles'),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => __('messages.logout_success'),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => __('messages.change_password_incorrect'),
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => __('messages.change_password_success'),
        ]);
    }
}
