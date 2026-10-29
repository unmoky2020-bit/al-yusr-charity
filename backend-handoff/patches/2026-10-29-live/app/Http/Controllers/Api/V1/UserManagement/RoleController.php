<?php

namespace App\Http\Controllers\Api\V1\UserManagement;

use App\Models\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;

class RoleController extends Controller
{
    public function index()
    {
        return RoleResource::collection(
            Role::with('permissions')->paginate(\App\Support\PerPage::from(request(), 10))
        );
    }

    public function store(StoreRoleRequest $request)
    {
        $role = Role::create($request->only([
            'name',
            'slug',
            'description'
        ]));

        $role->permissions()->sync($request->permission_ids ?? []);

        return new RoleResource($role->load('permissions'));
    }

    public function show(Role $role)
    {
        return new RoleResource($role->load('permissions'));
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $role->update($request->only([
            'name',
            'slug',
            'description'
        ]));

        if ($request->has('permission_ids')) {
            $role->permissions()->sync($request->permission_ids);
        }

        return new RoleResource($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully'
        ]);
    }
}
