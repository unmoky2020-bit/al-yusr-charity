<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class MediaPermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['view', 'upload', 'delete'] as $action) {
            Permission::updateOrCreate(
                ['slug' => "media.$action"],
                [
                    'name' => ucfirst($action) . ' Media',
                    'module' => 'media',
                    'description' => "$action media library files",
                ]
            );
        }

        if ($editor = Role::where('slug', 'editor')->first()) {
            $editor->permissions()->syncWithoutDetaching(
                Permission::where('module', 'media')->pluck('id')->all()
            );
        }
    }
}
