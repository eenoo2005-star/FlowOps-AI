<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class NotificationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $permission = Permission::findOrCreate(
            'notifications.view',
            'web'
        );

        foreach ([
            'system admin',
            'system_admin',
            'company admin',
            'company_admin',
            'manager',
            'employee',
            'auditor',
            'executive',
        ] as $roleName) {
            Role::findOrCreate(
                $roleName,
                'web'
            )->givePermissionTo($permission);
        }

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
