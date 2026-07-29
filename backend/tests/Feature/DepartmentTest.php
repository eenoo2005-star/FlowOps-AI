<?php

namespace Tests\Feature;


use App\Models\Company;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_department_belongs_to_a_company(): void
    {
        $company = Company::factory()->create();

        $department = Department::factory()->create([
            'company_id' => $company->id,
        ]);

        $this->assertTrue($department->company->is($company));
        $this->assertTrue($company->departments->contains($department));
    }

    public function test_two_companies_can_use_the_same_department_code(): void
    {
        $firstCompany = Company::factory()->create();
        $secondCompany = Company::factory()->create();

        Department::factory()->create([
            'company_id' => $firstCompany->id,
            'code' => 'HR',
        ]);

        Department::factory()->create([
            'company_id' => $secondCompany->id,
            'code' => 'HR',
        ]);

        $this->assertDatabaseCount('departments', 2);
    }

    public function test_same_company_cannot_use_duplicate_department_codes(): void
    {
        $company = Company::factory()->create();

        Department::factory()->create([
            'company_id' => $company->id,
            'code' => 'IT',
        ]);

        $this->expectException(QueryException::class);

        Department::factory()->create([
            'company_id' => $company->id,
            'code' => 'IT',
        ]);
    }

    public function test_deleting_company_deletes_its_departments(): void
    {
        $company = Company::factory()->create();

        Department::factory()->count(3)->create([
            'company_id' => $company->id,
        ]);

        $company->delete();

        $this->assertDatabaseCount('departments', 0);
    }

    public function test_user_only_sees_departments_from_their_company(): void
{
    $firstCompany = Company::factory()->create();
    $secondCompany = Company::factory()->create();

    $user = User::factory()->create([
        'company_id' => $firstCompany->id,
    ]);

    Permission::create([
    'name' => 'departments.view',
    'guard_name' => 'web',
]);

$user->givePermissionTo('departments.view');

    Department::factory()->count(2)->create([
        'company_id' => $firstCompany->id,
    ]);

    Department::factory()->count(3)->create([
        'company_id' => $secondCompany->id,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/departments');

    $response
        ->assertOk()
        ->assertJsonCount(2, 'data');

    foreach ($response->json('data') as $department) {
        $this->assertSame(
            $firstCompany->id,
            $department['company_id']
        );
    }
}

public function test_user_cannot_access_department_from_another_company(): void
{
    $firstCompany = Company::factory()->create();
    $secondCompany = Company::factory()->create();

    $user = User::factory()->create([
        'company_id' => $firstCompany->id,
    ]);

    $otherDepartment = Department::factory()->create([
        'company_id' => $secondCompany->id,
    ]);

    Sanctum::actingAs($user);

    $this->getJson("/api/departments/{$otherDepartment->id}")
        ->assertNotFound();
}

public function test_user_without_permission_cannot_list_departments(): void
{
    $company = Company::factory()->create();

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    Sanctum::actingAs($user);

    $this->getJson('/api/departments')
        ->assertForbidden();
}

public function test_authorized_user_can_list_only_their_company_departments(): void
{
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();

    Permission::create([
        'name' => 'departments.view',
        'guard_name' => 'web',
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $user->givePermissionTo('departments.view');

    Department::factory()->count(2)->create([
        'company_id' => $company->id,
    ]);

    Department::factory()->count(3)->create([
        'company_id' => $otherCompany->id,
    ]);

    Sanctum::actingAs($user);

    $this->getJson('/api/departments')
        ->assertOk()
        ->assertJsonCount(2, 'data');
}

public function test_department_is_always_created_for_authenticated_users_company(): void
{
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();

    Permission::create([
        'name' => 'departments.create',
        'guard_name' => 'web',
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
    ]);

    $user->givePermissionTo('departments.create');

    Sanctum::actingAs($user);

    $this->postJson('/api/departments', [
        'company_id' => $otherCompany->id,
        'name' => 'Information Technology',
        'code' => 'IT',
    ])->assertSuccessful();

    $this->assertDatabaseHas('departments', [
        'company_id' => $company->id,
        'code' => 'IT',
    ]);

    $this->assertDatabaseMissing('departments', [
        'company_id' => $otherCompany->id,
        'code' => 'IT',
    ]);
}
}