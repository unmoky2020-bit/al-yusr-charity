<?php

namespace App\Http\Controllers\Api\V1\UserManagement;

use App\Models\Permission;
use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;

class PermissionController extends Controller
{
    public function index()
    {
        return PermissionResource::collection(
            Permission::latest()->paginate(\App\Support\PerPage::from(request(), 10))
        );
    }

    public function store(StorePermissionRequest $request)
    {
        $permission = Permission::create($request->validated());

        return new PermissionResource($permission);
    }

    public function show(Permission $permission)
    {
        return new PermissionResource($permission);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $permission->update($request->validated());

        return new PermissionResource($permission);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return response()->json([
            'message' => 'Permission deleted successfully'
        ]);
    }
}
