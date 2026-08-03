<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class SystemAdminPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Role::findOrCreate('system_admin', 'web')
            ->syncPermissions(
                Permission::query()
                    ->where('guard_name', 'web')
                    ->get()
            );

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
