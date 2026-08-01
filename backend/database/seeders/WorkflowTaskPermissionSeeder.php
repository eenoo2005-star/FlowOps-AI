<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class WorkflowTaskPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect([
            'workflow-tasks.view',
            'workflow-tasks.view_all',
            'workflow-tasks.approve',
            'workflow-tasks.reject',
            'workflow-tasks.act_all',
        ])->map(
            fn (string $permission): Permission => Permission::findOrCreate($permission, 'web')
        );

        Role::findOrCreate('system admin', 'web')->givePermissionTo($permissions);
        Role::findOrCreate('company admin', 'web')->givePermissionTo($permissions);

        foreach (['manager', 'employee'] as $roleName) {
            Role::findOrCreate($roleName, 'web')->givePermissionTo(
                $permissions->whereIn('name', [
                    'workflow-tasks.view',
                    'workflow-tasks.approve',
                    'workflow-tasks.reject',
                ])
            );
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
