<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class WorkspaceSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        foreach ([
            'employees.view',
            'departments.view',
            'workflows.view',
            'request-types.view',
            'requests.view',
            'requests.view_all',
            'workflow-tasks.view',
            'workflow-tasks.view_all',
        ] as $permission) {
            Permission::findOrCreate(
                $permission,
                'web'
            );
        }
    }

    public function test_guest_cannot_search_workspace(): void
    {
        $this
            ->getJson(
                '/api/workspace-search?q=operations'
            )
            ->assertUnauthorized();
    }

    public function test_search_query_requires_two_characters(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/workspace-search?q=a')
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'q',
            ]);
    }

    public function test_search_is_tenant_scoped_and_permission_aware(): void
    {
        $company = Company::factory()->create();
        $otherCompany = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'employees.view'
        );

        $ownEmployee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'first_name' => 'Needle',
            'last_name' => 'Engineer',
            'employee_number' => 'EMP-NEEDLE',
        ]);

        Employee::factory()->create([
            'company_id' => $otherCompany->id,
            'department_id' => null,
            'first_name' => 'Needle',
            'last_name' => 'Outsider',
            'employee_number' => 'EMP-OUTSIDE',
        ]);

        Department::factory()->create([
            'company_id' => $company->id,
            'name' => 'Needle Department',
            'code' => 'NEEDLE',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this
            ->getJson(
                '/api/workspace-search?q=needle'
            )
            ->assertOk()
            ->assertJsonPath(
                'data.query',
                'needle'
            );

        $results = collect(
            $response->json('data.results')
        );

        $this->assertCount(1, $results);
        $this->assertSame(
            'employee',
            $results->first()['kind']
        );
        $this->assertSame(
            $ownEmployee->id,
            $results->first()['id']
        );
        $this->assertFalse(
            $results->contains(
                fn (array $result): bool => $result['kind']
                    === 'department'
            )
        );
    }

    public function test_request_results_respect_own_request_visibility(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $ownEmployee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $user->id,
        ]);

        $otherEmployee =
            Employee::factory()->create([
                'company_id' => $company->id,
                'department_id' => null,
            ]);

        $workflow =
            WorkflowDefinition::factory()->create([
                'company_id' => $company->id,
            ]);

        $requestType =
            RequestType::factory()->create([
                'company_id' => $company->id,
                'workflow_definition_id' => $workflow->id,
            ]);

        $ownRequest =
            InternalRequest::factory()->create([
                'company_id' => $company->id,
                'request_type_id' => $requestType->id,
                'workflow_definition_id' => $workflow->id,
                'requester_employee_id' => $ownEmployee->id,
                'title' => 'Needle budget request',
            ]);

        InternalRequest::factory()->create([
            'company_id' => $company->id,
            'request_type_id' => $requestType->id,
            'workflow_definition_id' => $workflow->id,
            'requester_employee_id' => $otherEmployee->id,
            'title' => 'Needle budget request',
        ]);

        $user->givePermissionTo(
            'requests.view'
        );

        Sanctum::actingAs($user, ['*']);

        $response = $this
            ->getJson(
                '/api/workspace-search?q=needle'
            )
            ->assertOk();

        $requestResults = collect(
            $response->json('data.results')
        )->where('kind', 'request');

        $this->assertCount(1, $requestResults);
        $this->assertSame(
            $ownRequest->id,
            $requestResults->first()['id']
        );

        $user->givePermissionTo(
            'requests.view_all'
        );

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $response = $this
            ->getJson(
                '/api/workspace-search?q=needle'
            )
            ->assertOk();

        $this->assertCount(
            2,
            collect(
                $response->json(
                    'data.results'
                )
            )->where('kind', 'request')
        );
    }
}
