<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * GET /me/access — what the signed-in account may do: its role slugs and the permission slugs of
 * all its roles together. The dashboard builds its menu from this, so a role edited under
 * «المستخدمون والأدوار» changes what that person sees right away. The checks on every route stay
 * on the server (permission:… middleware); this only decides what the menu shows.
 */
class AccessController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('roles.permissions');
        $roles = $user->roles->pluck('slug')->filter()->values();
        $permissions = $user->roles
            ->flatMap(fn ($role) => $role->permissions->map(fn ($p) => $p->slug ?: $p->name))
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions,
            'super_admin' => $roles->contains('super-admin'),
        ]);
    }
}
