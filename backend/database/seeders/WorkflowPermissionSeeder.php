<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class WorkflowPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $permissions = collect([
            'workflows.view',
            'workflows.create',
            'workflows.update',
            'workflows.delete',
        ])->map(
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
            $permissions->where(
                'name',
                'workflows.view'
            )
        );

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
