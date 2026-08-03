<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class RepairApprovalRoles extends Command
{
    protected $signature = 'flowops:repair-approval-roles';

    protected $description = 'Repair role records required by approval tasks and demo administration.';

    public function handle(): int
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = collect([
            'workflow-tasks.view',
            'workflow-tasks.view_all',
            'workflow-tasks.approve',
            'workflow-tasks.reject',
            'workflow-tasks.act_all',
            'requests.view',
            'requests.create',
            'requests.approve',
            'requests.reject',
            'roles.view',
            'roles.manage',
            'audit.view',
        ])->unique()->values();

        $permissions = $permissionNames->mapWithKeys(
            fn (string $name): array => [
                $name => Permission::findOrCreate($name, 'web'),
            ]
        );

        $roleNames = collect([
            'system_admin',
            'system admin',
            'company_admin',
            'company admin',
            'manager',
            'department_manager',
            'employee',
            'executive',
            'auditor',
        ]);

        if (DB::getSchemaBuilder()->hasTable('workflow_tasks')) {
            $roleNames = $roleNames->merge(
                DB::table('workflow_tasks')
                    ->whereNotNull('assigned_role')
                    ->where('assigned_role', '!=', '')
                    ->distinct()
                    ->pluck('assigned_role')
                    ->all()
            );
        }

        if (DB::getSchemaBuilder()->hasTable('workflow_steps')) {
            $roleNames = $roleNames->merge(
                DB::table('workflow_steps')
                    ->whereNotNull('approver_role')
                    ->where('approver_role', '!=', '')
                    ->distinct()
                    ->pluck('approver_role')
                    ->all()
            );
        }

        $roleNames = $roleNames
            ->filter(fn ($name): bool => is_string($name) && trim($name) !== '')
            ->map(fn (string $name): string => trim($name))
            ->unique()
            ->values();

        $this->info('Repairing roles: '.$roleNames->implode(', '));

        foreach ($roleNames as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');

            if (str_contains($roleName, 'admin')) {
                $role->givePermissionTo(Permission::query()->where('guard_name', 'web')->get());
                continue;
            }

            if (
                $roleName === 'manager'
                || $roleName === 'department_manager'
                || str_contains($roleName, 'manager')
            ) {
                $role->givePermissionTo([
                    $permissions['workflow-tasks.view'],
                    $permissions['workflow-tasks.approve'],
                    $permissions['workflow-tasks.reject'],
                    $permissions['requests.view'],
                    $permissions['requests.approve'],
                    $permissions['requests.reject'],
                ]);
                continue;
            }

            if ($roleName === 'employee') {
                $role->givePermissionTo([
                    $permissions['workflow-tasks.view'],
                    $permissions['requests.view'],
                    $permissions['requests.create'],
                ]);
            }
        }

        $admin = User::query()
            ->where('email', 'admin@lifeco.test')
            ->orWhere('id', 1)
            ->orderBy('id')
            ->first();

        if ($admin !== null) {
            foreach ([
                'system_admin',
                'system admin',
                'company_admin',
                'company admin',
                'manager',
                'department_manager',
            ] as $roleName) {
                if (
                    Role::query()
                        ->where('name', $roleName)
                        ->where('guard_name', 'web')
                        ->exists()
                    && ! $admin->hasRole($roleName)
                ) {
                    $admin->assignRole($roleName);
                }
            }

            $this->info('Admin role assignments repaired for: '.$admin->email);
        } else {
            $this->warn('No admin user found. Roles were created, but no admin assignments were changed.');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->table(
            ['Role', 'Users'],
            Role::query()
                ->whereIn('name', $roleNames->all())
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role): array => [
                    $role->name,
                    DB::table(config('permission.table_names.model_has_roles'))
                        ->where('role_id', $role->id)
                        ->count(),
                ])
                ->all()
        );

        $this->info('Approval role repair completed.');

        return self::SUCCESS;
    }
}
