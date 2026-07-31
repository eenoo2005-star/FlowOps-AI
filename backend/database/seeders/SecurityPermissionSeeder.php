<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class SecurityPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissionRegistrar = app(
            PermissionRegistrar::class
        );

        $permissionRegistrar->forgetCachedPermissions();

        $guardName = 'web';

        $viewSecurityDashboard = Permission::findOrCreate(
            'view security dashboard',
            $guardName
        );

        $viewAllSecurityData = Permission::findOrCreate(
            'view all security data',
            $guardName
        );

        /*
         * findOrCreate makes this seeder safe when it is:
         * - called independently;
         * - called after RefreshDatabase;
         * - called from RolePermissionSeeder.
         */
        $systemAdmin = Role::findOrCreate(
            'system admin',
            $guardName
        );

        $companyAdmin = Role::findOrCreate(
            'company admin',
            $guardName
        );

        $systemAdmin->givePermissionTo([
            $viewSecurityDashboard,
            $viewAllSecurityData,
        ]);

        $companyAdmin->givePermissionTo(
            $viewSecurityDashboard
        );

        $permissionRegistrar->forgetCachedPermissions();
    }
}
