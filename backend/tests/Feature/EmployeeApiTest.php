<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class EmployeeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_employee_api(): void
    {
        $this->getJson('/api/employees')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_list_employees(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/employees')
            ->assertForbidden();
    }

    public function test_authorized_user_only_sees_their_company_employees(): void
    {
        $company = Company::factory()->create();
        $otherCompany = Company::factory()->create();

        Permission::create([
            'name' => 'employees.view',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.view');

        Employee::factory()->count(2)->create([
            'company_id' => $company->id,
        ]);

        Employee::factory()->count(3)->create([
            'company_id' => $otherCompany->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/employees')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_authorized_user_can_create_employee_for_their_company(): void
    {
        $company = Company::factory()->create();

        Permission::create([
            'name' => 'employees.create',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.create');

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/employees', [
            'employee_number' => 'EMP-9001',
            'first_name' => 'Shaheen',
            'last_name' => 'Idris',
            'job_title' => 'Software Engineer',
            'work_email' => 'shaheen@flowops.test',
            'employment_type' => 'full_time',
            'status' => 'active',
        ]);

        $response
            ->assertSuccessful()
            ->assertJsonPath('data.employee_number', 'EMP-9001')
            ->assertJsonPath('data.company_id', $company->id);

        $this->assertDatabaseHas('employees', [
            'company_id' => $company->id,
            'employee_number' => 'EMP-9001',
        ]);
    }

    public function test_user_cannot_view_employee_from_another_company(): void
    {
        $company = Company::factory()->create();
        $otherCompany = Company::factory()->create();

        Permission::create([
            'name' => 'employees.view',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.view');

        $otherEmployee = Employee::factory()->create([
            'company_id' => $otherCompany->id,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/employees/{$otherEmployee->id}")
            ->assertNotFound();
    }

    public function test_authorized_user_can_update_employee(): void
    {
        $company = Company::factory()->create();

        Permission::create([
            'name' => 'employees.update',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.update');

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'job_title' => 'Junior Developer',
        ]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/employees/{$employee->id}", [
            'job_title' => 'Senior Developer',
        ])
            ->assertOk()
            ->assertJsonPath('data.job_title', 'Senior Developer');

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'job_title' => 'Senior Developer',
        ]);
    }

    public function test_authorized_user_can_delete_employee(): void
    {
        $company = Company::factory()->create();

        Permission::create([
            'name' => 'employees.delete',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('employees.delete');

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/employees/{$employee->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('employees', [
            'id' => $employee->id,
        ]);
    }
}