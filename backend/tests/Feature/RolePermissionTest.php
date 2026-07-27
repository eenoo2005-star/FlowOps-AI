<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_be_assigned_a_role(): void
    {
        $this->seed();

        $user = User::factory()->create();

        $user->assignRole('employee');

        $this->assertTrue($user->hasRole('employee'));
    }

    public function test_system_admin_has_all_permissions(): void
    {
        $this->seed();

        $user = User::factory()->create();

        $user->assignRole('system_admin');

        $this->assertTrue(
            $user->can('users.create')
        );

        $this->assertTrue(
            $user->can('companies.delete')
        );
    }
}