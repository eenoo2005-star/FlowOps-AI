<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class InternalRequestPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $allPermissionNames = [
            'request-types.view',
            'request-types.create',
            'request-types.update',
            'request-types.delete',
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.update',
            'requests.submit',
            'requests.delete',
        ];

        $permissions = collect(
            $allPermissionNames
        )->map(
            fn (string $permission): Permission => Permission::findOrCreate(
                $permission,
                'web'
            )
        );

        Role::findOrCreate(
            'system admin',
            'web'
        )->givePermissionTo($permissions);

        Role::findOrCreate(
            'company admin',
            'web'
        )->givePermissionTo($permissions);

        Role::findOrCreate(
            'manager',
            'web'
        )->givePermissionTo(
            $permissions->whereIn(
                'name',
                [
                    'request-types.view',
                    'requests.view',
                    'requests.view_all',
                    'requests.create',
                    'requests.create_for_others',
                    'requests.update',
                    'requests.submit',
                    'requests.delete',
                ]
            )
        );

        Role::findOrCreate(
            'employee',
            'web'
        )->givePermissionTo(
            $permissions->whereIn(
                'name',
                [
                    'request-types.view',
                    'requests.view',
                    'requests.create',
                    'requests.update',
                    'requests.submit',
                    'requests.delete',
                ]
            )
        );

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
