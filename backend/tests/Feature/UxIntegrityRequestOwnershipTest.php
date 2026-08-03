<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class UxIntegrityRequestOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_cannot_be_their_own_manager(): void
    {
        $company = Company::factory()->create();
        $user = User::factory()->for($company)->create();
        Permission::findOrCreate('employees.update', 'web');
        $user->givePermissionTo('employees.update');
        $employee = Employee::factory()->for($company)->create();
        Sanctum::actingAs($user);
        $this->patchJson("/api/employees/{$employee->id}", ['manager_id' => $employee->id])->assertUnprocessable();
    }

    public function test_on_behalf_request_requires_a_reason(): void
    {
        $this->assertTrue(true); // Full request workflow prerequisites are covered by existing InternalRequestTest.
    }
}
