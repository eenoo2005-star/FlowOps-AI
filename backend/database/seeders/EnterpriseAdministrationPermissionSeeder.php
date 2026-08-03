<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class EnterpriseAdministrationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guardName = 'web';

        $permissionNames = [
            'administration.view',
            'permissions.view',
            'roles.view',
            'roles.manage',
            'audit.view',
            'settings.view',
            'settings.manage',
        ];

        $permissions = collect($permissionNames)
            ->map(fn (string $permission): Permission => Permission::findOrCreate(
                $permission,
                $guardName
            ));

        foreach (['system_admin', 'system admin'] as $roleName) {
            Role::findOrCreate($roleName, $guardName)
                ->givePermissionTo(
                    Permission::query()
                        ->where('guard_name', $guardName)
                        ->get()
                );
        }

        foreach (['company_admin', 'company admin'] as $roleName) {
            Role::findOrCreate($roleName, $guardName)
                ->givePermissionTo($permissions);
        }

        Role::findOrCreate('auditor', $guardName)
            ->givePermissionTo(
                $permissions->whereIn('name', [
                    'administration.view',
                    'permissions.view',
                    'roles.view',
                    'audit.view',
                    'settings.view',
                ])
            );

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
