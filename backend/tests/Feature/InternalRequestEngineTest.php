<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class InternalRequestEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        foreach ([
            'request-types.view',
            'request-types.create',
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.update',
            'requests.submit',
            'requests.delete',
        ] as $permission) {
            Permission::findOrCreate(
                $permission,
                'web'
            );
        }
    }

    public function test_company_admin_can_create_request_type(): void
    {
        $company = Company::factory()->create();

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo([
            'request-types.view',
            'request-types.create',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->postJson('/api/request-types', [
                'workflow_definition_id' => $workflow->id,
                'name' => 'Leave Request',
                'code' => 'LEAVE',
                'description' => 'Employee leave request.',
                'is_active' => true,
            ])
            ->assertSuccessful()
            ->assertJsonPath('data.code', 'LEAVE')
            ->assertJsonPath(
                'data.workflow_definition_id',
                $workflow->id
            );
    }

    public function test_admin_can_create_and_submit_request_for_employee(): void
    {
        $company = Company::factory()->create();

        $manager = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
        ]);

        $requester = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'manager_id' => $manager->id,
        ]);

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        $step = WorkflowStep::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'name' => 'Manager approval',
            'code' => 'MANAGER_APPROVAL',
            'step_order' => 1,
            'approver_type' => 'requester_manager',
            'sla_hours' => 24,
            'is_final' => true,
        ]);

        $requestType = RequestType::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.update',
            'requests.submit',
            'requests.delete',
        ]);

        Sanctum::actingAs($user, ['*']);

        $draftResponse = $this
            ->postJson('/api/internal-requests', [
                'request_type_id' => $requestType->id,
                'requester_employee_id' => $requester->id,
                'title' => 'Annual leave for three days',
                'description' => 'Personal leave request.',
                'priority' => 'normal',
            ])
            ->assertSuccessful()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath(
                'data.requester_employee_id',
                $requester->id
            );

        $requestId = (int) $draftResponse->json(
            'data.id'
        );

        $this
            ->postJson(
                "/api/internal-requests/{$requestId}/submit"
            )
            ->assertOk()
            ->assertJsonPath(
                'data.status',
                'in_review'
            )
            ->assertJsonPath(
                'data.current_workflow_step_id',
                $step->id
            )
            ->assertJsonPath(
                'data.workflow_instance.tasks.0.assigned_employee_id',
                $manager->id
            )
            ->assertJsonPath(
                'data.workflow_instance.tasks.0.status',
                'pending'
            );

        $this->assertDatabaseHas(
            'workflow_instances',
            [
                'internal_request_id' => $requestId,
                'current_workflow_step_id' => $step->id,
                'status' => 'active',
            ]
        );

        $this->assertDatabaseHas(
            'workflow_tasks',
            [
                'workflow_step_id' => $step->id,
                'assigned_employee_id' => $manager->id,
                'status' => 'pending',
            ]
        );
    }

    public function test_employee_only_sees_own_requests(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $employee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $user->id,
        ]);

        $otherEmployee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
        ]);

        $user->givePermissionTo('requests.view');

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $company->id,
        ]);

        $requestType = RequestType::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
        ]);

        InternalRequest::factory()->create([
            'company_id' => $company->id,
            'request_type_id' => $requestType->id,
            'workflow_definition_id' => $workflow->id,
            'requester_employee_id' => $employee->id,
        ]);

        InternalRequest::factory()->create([
            'company_id' => $company->id,
            'request_type_id' => $requestType->id,
            'workflow_definition_id' => $workflow->id,
            'requester_employee_id' => $otherEmployee->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/internal-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.requester_employee_id',
                $employee->id
            );
    }

    public function test_request_cannot_be_submitted_without_steps(): void
    {
        $company = Company::factory()->create();

        $requester = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
        ]);

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        $requestType = RequestType::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.submit',
        ]);

        Sanctum::actingAs($user, ['*']);

        $draft = $this
            ->postJson('/api/internal-requests', [
                'request_type_id' => $requestType->id,
                'requester_employee_id' => $requester->id,
                'title' => 'Test request',
                'priority' => 'normal',
            ])
            ->assertSuccessful();

        $this
            ->postJson(
                '/api/internal-requests/'
                .$draft->json('data.id')
                .'/submit'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'workflow',
            ]);
    }
}
