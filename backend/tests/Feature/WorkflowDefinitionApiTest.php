<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowDefinition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class WorkflowDefinitionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        foreach ([
            'workflows.view',
            'workflows.create',
            'workflows.update',
            'workflows.delete',
        ] as $permission) {
            Permission::findOrCreate(
                $permission,
                'web'
            );
        }
    }

    public function test_guest_cannot_access_workflows(): void
    {
        $this
            ->getJson('/api/workflow-definitions')
            ->assertUnauthorized();
    }

    public function test_authorized_user_only_sees_company_workflows(): void
    {
        $company = Company::factory()->create();
        $otherCompany = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('workflows.view');

        WorkflowDefinition::factory()->count(2)->create([
            'company_id' => $company->id,
        ]);

        WorkflowDefinition::factory()->count(3)->create([
            'company_id' => $otherCompany->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/workflow-definitions')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_authorized_user_can_create_workflow_and_steps(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo([
            'workflows.view',
            'workflows.create',
            'workflows.update',
        ]);

        Sanctum::actingAs($user, ['*']);

        $workflowResponse = $this
            ->postJson('/api/workflow-definitions', [
                'name' => 'Leave Request',
                'code' => 'LEAVE',
                'description' => 'Employee leave approval process.',
                'version' => 1,
                'is_active' => true,
            ])
            ->assertSuccessful()
            ->assertJsonPath('data.code', 'LEAVE')
            ->assertJsonPath('data.version', 1);

        $workflowId = (int) $workflowResponse->json(
            'data.id'
        );

        $manager = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
        ]);

        $this
            ->postJson(
                "/api/workflow-definitions/{$workflowId}/steps",
                [
                    'name' => 'Manager approval',
                    'code' => 'MANAGER_APPROVAL',
                    'step_order' => 1,
                    'approver_type' => 'employee',
                    'approver_employee_id' => $manager->id,
                    'approval_mode' => 'any',
                    'required_approvals' => 1,
                    'sla_hours' => 24,
                    'can_reject' => true,
                    'is_final' => true,
                ]
            )
            ->assertSuccessful()
            ->assertJsonPath(
                'data.workflow_definition_id',
                $workflowId
            )
            ->assertJsonPath('data.step_order', 1);

        $this
            ->getJson(
                "/api/workflow-definitions/{$workflowId}"
            )
            ->assertOk()
            ->assertJsonCount(1, 'data.steps')
            ->assertJsonPath(
                'data.steps.0.code',
                'MANAGER_APPROVAL'
            );
    }

    public function test_step_order_must_be_unique_inside_workflow(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo([
            'workflows.view',
            'workflows.update',
        ]);

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $payload = [
            'name' => 'First approval',
            'code' => 'FIRST',
            'step_order' => 1,
            'approver_type' => 'requester_manager',
            'approval_mode' => 'any',
            'required_approvals' => 1,
            'can_reject' => true,
            'is_final' => false,
        ];

        $this
            ->postJson(
                "/api/workflow-definitions/{$workflow->id}/steps",
                $payload
            )
            ->assertSuccessful();

        $this
            ->postJson(
                "/api/workflow-definitions/{$workflow->id}/steps",
                [
                    ...$payload,
                    'name' => 'Duplicate order',
                    'code' => 'SECOND',
                ]
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'step_order',
            ]);
    }

    public function test_user_cannot_access_other_company_workflow(): void
    {
        $company = Company::factory()->create();
        $otherCompany = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo('workflows.view');

        $workflow = WorkflowDefinition::factory()->create([
            'company_id' => $otherCompany->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                "/api/workflow-definitions/{$workflow->id}"
            )
            ->assertNotFound();
    }
}
