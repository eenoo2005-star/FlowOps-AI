<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use App\Models\WorkflowTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class ApprovalActionsEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.submit',
            'workflow-tasks.view',
            'workflow-tasks.approve',
            'workflow-tasks.reject',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }

    public function test_manager_approval_completes_final_request(): void
    {
        [$company, $managerUser, $managerEmployee, $requester, $workflow, $step, $requestType]
            = $this->runtime();

        $admin = User::factory()->create(['company_id' => $company->id]);
        $admin->givePermissionTo([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.submit',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $draft = $this->postJson('/api/internal-requests', [
            'request_type_id' => $requestType->id,
            'requester_employee_id' => $requester->id,
            'on_behalf_of_reason' => 'Automated test fixture: administrator creates this request on behalf of the requester.',
            'title' => 'Annual leave request',
            'priority' => 'normal',
        ])->assertSuccessful();

        $requestId = (int) $draft->json('data.id');

        $this->postJson("/api/internal-requests/{$requestId}/submit")->assertOk();

        $task = WorkflowTask::query()
            ->where('workflow_step_id', $step->id)
            ->firstOrFail();

        Sanctum::actingAs($managerUser, ['*']);

        $this->postJson("/api/workflow-tasks/{$task->id}/approve", [
            'note' => 'Approved.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('internal_requests', [
            'id' => $requestId,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('workflow_instances', [
            'internal_request_id' => $requestId,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('workflow_task_decisions', [
            'workflow_task_id' => $task->id,
            'acted_by_user_id' => $managerUser->id,
            'decision' => 'approved',
        ]);
    }

    public function test_rejection_terminates_request(): void
    {
        [$company, $managerUser, $managerEmployee, $requester, $workflow, $step, $requestType]
            = $this->runtime();

        $admin = User::factory()->create(['company_id' => $company->id]);
        $admin->givePermissionTo([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.submit',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $draft = $this->postJson('/api/internal-requests', [
            'request_type_id' => $requestType->id,
            'requester_employee_id' => $requester->id,
            'on_behalf_of_reason' => 'Automated test fixture: administrator creates this request on behalf of the requester.',
            'title' => 'Request to reject',
            'priority' => 'normal',
        ])->assertSuccessful();

        $requestId = (int) $draft->json('data.id');
        $this->postJson("/api/internal-requests/{$requestId}/submit")->assertOk();

        $task = WorkflowTask::query()
            ->where('workflow_step_id', $step->id)
            ->firstOrFail();

        Sanctum::actingAs($managerUser, ['*']);

        $this->postJson("/api/workflow-tasks/{$task->id}/reject", [
            'note' => 'Insufficient justification.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('internal_requests', [
            'id' => $requestId,
            'status' => 'rejected',
        ]);
    }

    public function test_unassigned_user_cannot_approve(): void
    {
        [$company, $managerUser, $managerEmployee, $requester, $workflow, $step, $requestType]
            = $this->runtime();

        $admin = User::factory()->create(['company_id' => $company->id]);
        $admin->givePermissionTo([
            'requests.view',
            'requests.view_all',
            'requests.create',
            'requests.create_for_others',
            'requests.submit',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $draft = $this->postJson('/api/internal-requests', [
            'request_type_id' => $requestType->id,
            'requester_employee_id' => $requester->id,
            'on_behalf_of_reason' => 'Automated test fixture: administrator creates this request on behalf of the requester.',
            'title' => 'Protected request',
            'priority' => 'normal',
        ])->assertSuccessful();

        $requestId = (int) $draft->json('data.id');
        $this->postJson("/api/internal-requests/{$requestId}/submit")->assertOk();

        $task = WorkflowTask::query()
            ->where('workflow_step_id', $step->id)
            ->firstOrFail();

        $otherUser = User::factory()->create(['company_id' => $company->id]);
        $otherUser->givePermissionTo([
            'workflow-tasks.view',
            'workflow-tasks.approve',
        ]);

        Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $otherUser->id,
        ]);

        Sanctum::actingAs($otherUser, ['*']);

        $this->postJson("/api/workflow-tasks/{$task->id}/approve")
            ->assertForbidden();
    }

    private function runtime(): array
    {
        $company = Company::factory()->create();

        $managerUser = User::factory()->create(['company_id' => $company->id]);
        $managerUser->givePermissionTo([
            'workflow-tasks.view',
            'workflow-tasks.approve',
            'workflow-tasks.reject',
        ]);

        $managerEmployee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $managerUser->id,
        ]);

        $requester = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'manager_id' => $managerEmployee->id,
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
            'approval_mode' => 'any',
            'required_approvals' => 1,
            'can_reject' => true,
            'is_final' => true,
        ]);

        $requestType = RequestType::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'is_active' => true,
        ]);

        return [
            $company,
            $managerUser,
            $managerEmployee,
            $requester,
            $workflow,
            $step,
            $requestType,
        ];
    }
}

