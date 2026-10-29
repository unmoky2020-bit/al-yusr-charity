<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

/**
 * Permissions for the public inboxes: contact messages and khabia requests.
 * Editors manage both; volunteers (delegates) see and update only khabia requests assigned to them.
 */
class InboxPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $defs = [
            'contact_messages' => ['view', 'update', 'delete'],
            'khabia_requests' => ['view', 'create', 'update', 'delete', 'manage'],
        ];

        foreach ($defs as $module => $actions) {
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => "$module.$action"],
                    [
                        'name' => ucfirst($action) . ' ' . ucwords(str_replace('_', ' ', $module)),
                        'module' => $module,
                        'description' => "$action $module",
                    ]
                );
            }
        }

        if ($editor = Role::where('slug', 'editor')->first()) {
            $editor->permissions()->syncWithoutDetaching(
                Permission::whereIn('module', array_keys($defs))->pluck('id')->all()
            );
        }

        if ($volunteer = Role::where('slug', 'volunteer')->first()) {
            $volunteer->permissions()->syncWithoutDetaching(
                Permission::whereIn('slug', ['khabia_requests.view', 'khabia_requests.update'])->pluck('id')->all()
            );
        }
    }
}
