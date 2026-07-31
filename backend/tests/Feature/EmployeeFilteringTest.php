<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class EmployeeFilteringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Permission::findOrCreate(
            'employees.view',
            'web'
        );
    }

    public function test_employee_index_supports_filters_and_sorting(): void
    {
        $company = Company::factory()->create();

        $engineering = Department::factory()->create([
            'company_id' => $company->id,
            'name' => 'Engineering',
            'code' => 'ENG',
        ]);

        $finance = Department::factory()->create([
            'company_id' => $company->id,
            'name' => 'Finance',
            'code' => 'FIN',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.view');

        Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => $engineering->id,
            'employee_number' => 'EMP-1001',
            'first_name' => 'Shaheen',
            'last_name' => 'Idris',
            'job_title' => 'Software Engineer',
            'employment_type' => 'full_time',
            'status' => 'active',
        ]);

        Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => $finance->id,
            'employee_number' => 'EMP-1002',
            'first_name' => 'Test',
            'last_name' => 'Employee',
            'job_title' => 'Accountant',
            'employment_type' => 'contract',
            'status' => 'inactive',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/employees'
                .'?search=software'
                .'&status=active'
                .'&employment_type=full_time'
                ."&department_id={$engineering->id}"
                .'&sort=name_asc'
                .'&per_page=5'
            )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.employee_number',
                'EMP-1001'
            )
            ->assertJsonPath(
                'meta.total',
                1
            );
    }

    public function test_invalid_employee_filters_are_rejected(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.view');

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/employees'
                .'?status=terminated'
                .'&employment_type=temporary'
                .'&sort=unsupported'
                .'&per_page=101'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'status',
                'employment_type',
                'sort',
                'per_page',
            ]);
    }
}
