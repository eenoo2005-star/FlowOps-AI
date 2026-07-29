<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_belongs_to_company_and_department(): void
    {
        $company = Company::factory()->create();

        $department = Department::factory()->create([
            'company_id' => $company->id,
        ]);

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => $department->id,
        ]);

        $this->assertTrue($employee->company->is($company));
        $this->assertTrue($employee->department->is($department));
        $this->assertTrue($company->employees->contains($employee));
        $this->assertTrue($department->employees->contains($employee));
    }

    public function test_employee_can_be_linked_to_user_account(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'user_id' => $user->id,
        ]);

        $this->assertTrue($employee->user->is($user));
        $this->assertTrue($user->employee->is($employee));
    }

    public function test_employee_can_have_a_manager(): void
    {
        $company = Company::factory()->create();

        $manager = Employee::factory()->create([
            'company_id' => $company->id,
        ]);

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'manager_id' => $manager->id,
        ]);

        $this->assertTrue($employee->manager->is($manager));
    }

    public function test_employee_number_must_be_unique_within_company(): void
    {
        $company = Company::factory()->create();

        Employee::factory()->create([
            'company_id' => $company->id,
            'employee_number' => 'EMP-1001',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Employee::factory()->create([
            'company_id' => $company->id,
            'employee_number' => 'EMP-1001',
        ]);
    }

    public function test_two_companies_can_use_same_employee_number(): void
    {
        $firstCompany = Company::factory()->create();
        $secondCompany = Company::factory()->create();

        Employee::factory()->create([
            'company_id' => $firstCompany->id,
            'employee_number' => 'EMP-1001',
        ]);

        Employee::factory()->create([
            'company_id' => $secondCompany->id,
            'employee_number' => 'EMP-1001',
        ]);

        $this->assertDatabaseCount('employees', 2);
    }
}