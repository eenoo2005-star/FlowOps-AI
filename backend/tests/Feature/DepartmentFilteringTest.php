<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class DepartmentFilteringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Permission::findOrCreate(
            'departments.view',
            'web'
        );
    }

    public function test_department_index_supports_filters_and_sorting(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('departments.view');

        Department::factory()->create([
            'company_id' => $company->id,
            'name' => 'Human Resources',
            'code' => 'HR',
            'description' => 'People operations',
            'is_active' => true,
        ]);

        Department::factory()->create([
            'company_id' => $company->id,
            'name' => 'Finance',
            'code' => 'FIN',
            'description' => 'Financial operations',
            'is_active' => false,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/departments'
                .'?search=human'
                .'&status=active'
                .'&sort=name_asc'
                .'&per_page=5'
            )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.code',
                'HR'
            )
            ->assertJsonPath(
                'meta.total',
                1
            );
    }

    public function test_invalid_department_filters_are_rejected(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('departments.view');

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/departments'
                .'?status=deleted'
                .'&sort=unsupported'
                .'&per_page=101'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'status',
                'sort',
                'per_page',
            ]);
    }
}
