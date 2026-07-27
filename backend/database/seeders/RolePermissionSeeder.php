<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'companies.view',
            'companies.create',
            'companies.update',
            'companies.delete',

            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            'roles.view',
            'roles.manage',

            'workflows.view',
            'workflows.create',
            'workflows.update',
            'workflows.delete',

            'requests.view',
            'requests.create',
            'requests.approve',
            'requests.reject',

            'reports.view',
            'audit.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $roles = [
            'system_admin',
            'company_admin',
            'manager',
            'employee',
            'executive',
            'auditor',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
        }

        Role::findByName('system_admin')->givePermissionTo(Permission::all());

        Role::findByName('company_admin')->givePermissionTo([
            'companies.view',
            'companies.update',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'roles.view',
            'roles.manage',
            'workflows.view',
            'workflows.create',
            'workflows.update',
            'workflows.delete',
            'requests.view',
            'requests.create',
            'requests.approve',
            'requests.reject',
            'reports.view',
            'audit.view',
        ]);

        Role::findByName('manager')->givePermissionTo([
            'users.view',
            'workflows.view',
            'requests.view',
            'requests.create',
            'requests.approve',
            'requests.reject',
            'reports.view',
        ]);

        Role::findByName('employee')->givePermissionTo([
            'workflows.view',
            'requests.view',
            'requests.create',
        ]);

        Role::findByName('executive')->givePermissionTo([
            'companies.view',
            'users.view',
            'workflows.view',
            'requests.view',
            'reports.view',
            'audit.view',
        ]);

        Role::findByName('auditor')->givePermissionTo([
            'companies.view',
            'users.view',
            'workflows.view',
            'requests.view',
            'reports.view',
            'audit.view',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}