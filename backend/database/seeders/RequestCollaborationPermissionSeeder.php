<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class RequestCollaborationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $permissions = collect([
            'request-collaboration.view',
            'request-comments.create',
            'request-comments.delete_own',
            'request-comments.manage',
            'request-attachments.upload',
            'request-attachments.download',
            'request-attachments.delete_own',
            'request-attachments.manage',
            'request-audit.view',
        ])->map(
            fn (string $permission): Permission => Permission::findOrCreate(
                $permission,
                'web'
            )
        );

        foreach ([
            'system admin',
            'system_admin',
            'company admin',
            'company_admin',
        ] as $roleName) {
            Role::findOrCreate(
                $roleName,
                'web'
            )->givePermissionTo($permissions);
        }

        $collaboratorPermissions =
            $permissions->whereIn(
                'name',
                [
                    'request-collaboration.view',
                    'request-comments.create',
                    'request-comments.delete_own',
                    'request-attachments.upload',
                    'request-attachments.download',
                    'request-attachments.delete_own',
                    'request-audit.view',
                ]
            );

        foreach ([
            'manager',
            'employee',
        ] as $roleName) {
            Role::findOrCreate(
                $roleName,
                'web'
            )->givePermissionTo(
                $collaboratorPermissions
            );
        }

        foreach ([
            'auditor',
            'executive',
        ] as $roleName) {
            Role::findOrCreate(
                $roleName,
                'web'
            )->givePermissionTo(
                $permissions->whereIn(
                    'name',
                    [
                        'request-collaboration.view',
                        'request-attachments.download',
                        'request-audit.view',
                    ]
                )
            );
        }

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
