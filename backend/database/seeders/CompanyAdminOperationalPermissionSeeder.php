<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class CompanyAdminOperationalPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = [
            'request-types.view',
            'request-types.create',
            'request-types.update',
            'request-types.delete',
            'requests.view_all',
            'requests.create_for_others',
            'requests.update',
            'requests.submit',
            'requests.delete',
            'workflow-tasks.view',
            'workflow-tasks.view_all',
            'view security dashboard',
        ];

        $permissions = collect($permissionNames)
            ->map(
                fn (string $permissionName): Permission => Permission::findOrCreate($permissionName, 'web')
            );

        Role::findOrCreate('company_admin', 'web')
            ->givePermissionTo($permissions);

        Role::findOrCreate('system_admin', 'web')
            ->syncPermissions(
                Permission::query()
                    ->where('guard_name', 'web')
                    ->get()
            );

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
