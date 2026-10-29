<?php

namespace App\Http\Controllers\Api\V1\UserManagement;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\UserResource;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Services\ActivityLogService;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')->latest()->paginate(\App\Support\PerPage::from(request(), 10));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request)
    {
        $actor = $request->user();

        $requestedRoleIds = array_map('intval', $request->role_ids ?? []);
        $requestedHasSuperAdmin = Role::whereIn('id', $requestedRoleIds)
            ->where('slug', 'super-admin')
            ->exists();

        if ($requestedHasSuperAdmin && !$this->isSuperAdmin($actor)) {
            return response()->json([
                'message' => 'Only Super Admin can assign Super Admin role.',
            ], 403);
        }

        // Only Super Admin may create another Super Admin.
        if ($requestedHasSuperAdmin && $requestedRoleIds !== array_unique($requestedRoleIds)) {
            return response()->json([
                'message' => 'Invalid role assignment.',
            ], 422);
        }

        $user = DB::transaction(function () use ($request, $requestedRoleIds) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => $request->status,
            ]);

            $user->roles()->sync($requestedRoleIds);

            return $user->load('roles');
        });

        app(ActivityLogService::class)->created(
            $user,
            'إنشاء مستخدم جديد: ' . $user->name,
            [
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'role_ids' => $requestedRoleIds,
            ]
        );

        return new UserResource($user);
    }

    public function show(User $user)
    {
        return new UserResource($user->load('roles'));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $actor = $request->user();
        $actorIsSuperAdmin = $this->isSuperAdmin($actor);
        $targetIsSuperAdmin = $this->isSuperAdmin($user);

        // A non-Super Admin cannot modify a Super Admin at all.
        if ($targetIsSuperAdmin && !$actorIsSuperAdmin) {
            return response()->json([
                'message' => 'Only Super Admin can modify a Super Admin.',
            ], 403);
        }

        if ($request->status !== $user->status && !$actorIsSuperAdmin) {
            return response()->json([
                'message' => 'Only Super Admin can activate, deactivate or suspend users.',
            ], 403);
        }

        $newRoleIds = $request->has('role_ids')
            ? array_map('intval', $request->role_ids)
            : $user->roles()->pluck('roles.id')->values()->all();

        $newHasSuperAdmin = Role::whereIn('id', $newRoleIds)
            ->where('slug', 'super-admin')
            ->exists();

        // Only Super Admin can grant or remove the Super Admin role.
        if (!$actorIsSuperAdmin) {
            $currentHasSuperAdmin = $targetIsSuperAdmin;

            if ($newHasSuperAdmin || $currentHasSuperAdmin) {
                return response()->json([
                    'message' => 'Only Super Admin can change Super Admin roles.',
                ], 403);
            }
        }

        // A Super Admin cannot remove the last Super Admin account.
        if ($targetIsSuperAdmin && !$newHasSuperAdmin) {
            $superAdminCount = User::whereHas('roles', function ($query) {
                $query->where('slug', 'super-admin');
            })->count();

            if ($superAdminCount <= 1) {
                return response()->json([
                    'message' => 'The last Super Admin cannot lose the Super Admin role.',
                ], 422);
            }
        }

        $oldData = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role_ids' => $user->roles()->pluck('roles.id')->values()->all(),
        ];

        DB::transaction(function () use ($request, $user, $newRoleIds) {
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'status' => $request->status,
            ]);

            if ($request->has('role_ids')) {
                $user->roles()->sync($newRoleIds);
            }
        });

        $user->refresh()->load('roles');

        app(ActivityLogService::class)->updated(
            $user,
            'تعديل بيانات المستخدم: ' . $user->name,
            [
                'old' => $oldData,
                'new' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'role_ids' => $user->roles->pluck('id')->values()->all(),
                ],
            ]
        );

        return new UserResource($user);
    }

    public function createSuperAdmin(Request $request)
    {
        if (!$this->isSuperAdmin($request->user())) {
            return response()->json([
                'message' => 'Forbidden',
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|min:8|confirmed',
        ]);

        $role = Role::where('slug', 'super-admin')->first();

        if (!$role) {
            return response()->json([
                'message' => 'Super Admin role not found',
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

            return $user->load('roles');
        });

        app(ActivityLogService::class)->custom(
            'create',
            $user,
            'إنشاء Super Admin: ' . $user->name,
            [
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'role' => 'super-admin',
            ]
        );

        return response()->json([
            'message' => 'Super Admin created successfully',
            'user' => $user,
        ], 201);
    }

    public function destroy(Request $request, User $user)
    {
        $actor = $request->user();
        $actorIsSuperAdmin = $this->isSuperAdmin($actor);
        $targetIsSuperAdmin = $this->isSuperAdmin($user);

        // Never allow deleting yourself through the user-management endpoint.
        if ((int) $actor->id === (int) $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account from user management.',
            ], 403);
        }

        if ($targetIsSuperAdmin && !$actorIsSuperAdmin) {
            return response()->json([
                'message' => 'Only Super Admin can delete a Super Admin.',
            ], 403);
        }

        if ($targetIsSuperAdmin) {
            $superAdminCount = User::whereHas('roles', function ($query) {
                $query->where('slug', 'super-admin');
            })->count();

            if ($superAdminCount <= 1) {
                return response()->json([
                    'message' => 'The last Super Admin cannot be deleted.',
                ], 422);
            }
        }

        $userName = $user->name;
        $userId = $user->id;
        $userEmail = $user->email;

        app(ActivityLogService::class)->custom(
            'delete',
            $user,
            'حذف المستخدم: ' . $userName,
            [
                'deleted_user_id' => $userId,
                'deleted_user_name' => $userName,
                'deleted_user_email' => $userEmail,
            ]
        );

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->roles()
            ->where('slug', 'super-admin')
            ->exists();
    }
}
