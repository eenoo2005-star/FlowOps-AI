<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Department;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

final class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Permission::findOrCreate(
            'reports.view',
            'web'
        );
    }

    public function test_guest_cannot_access_analytics(): void
    {
        $this
            ->getJson('/api/dashboard/analytics')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_access_analytics(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/dashboard/analytics')
            ->assertForbidden();
    }

    public function test_analytics_are_tenant_scoped_and_calculated(): void
    {
        $company = Company::factory()->create();
        $otherCompany =
            Company::factory()->create();

        $engineering =
            Department::factory()->create([
                'company_id' => $company->id,
                'name' => 'Engineering',
                'code' => 'ENG',
            ]);

        $otherDepartment =
            Department::factory()->create([
                'company_id' => $otherCompany->id,
            ]);

        $requester =
            Employee::factory()->create([
                'company_id' => $company->id,
                'department_id' => $engineering->id,
            ]);

        $otherRequester =
            Employee::factory()->create([
                'company_id' => $otherCompany->id,
                'department_id' => $otherDepartment->id,
            ]);

        $workflow =
            WorkflowDefinition::factory()->create([
                'company_id' => $company->id,
            ]);

        $otherWorkflow =
            WorkflowDefinition::factory()->create([
                'company_id' => $otherCompany->id,
            ]);

        $step = WorkflowStep::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'step_order' => 1,
            'is_final' => true,
        ]);

        $otherStep =
            WorkflowStep::factory()->create([
                'company_id' => $otherCompany->id,
                'workflow_definition_id' => $otherWorkflow->id,
                'step_order' => 1,
                'is_final' => true,
            ]);

        $requestType =
            RequestType::factory()->create([
                'company_id' => $company->id,
                'workflow_definition_id' => $workflow->id,
                'name' => 'Leave Request',
                'code' => 'LEAVE',
            ]);

        $otherRequestType =
            RequestType::factory()->create([
                'company_id' => $otherCompany->id,
                'workflow_definition_id' => $otherWorkflow->id,
            ]);

        $this->createRequest(
            companyId: $company->id,
            requestTypeId: $requestType->id,
            workflowId: $workflow->id,
            requesterId: $requester->id,
            status: 'approved',
            submittedAt: now()->subHours(12),
            completedAt: now(),
        );

        $this->createRequest(
            companyId: $company->id,
            requestTypeId: $requestType->id,
            workflowId: $workflow->id,
            requesterId: $requester->id,
            status: 'rejected',
            submittedAt: now()->subHours(24),
            completedAt: now(),
        );

        $inReview = $this->createRequest(
            companyId: $company->id,
            requestTypeId: $requestType->id,
            workflowId: $workflow->id,
            requesterId: $requester->id,
            status: 'in_review',
            submittedAt: now()->subHours(2),
            completedAt: null,
        );

        $this->createRequest(
            companyId: $company->id,
            requestTypeId: $requestType->id,
            workflowId: $workflow->id,
            requesterId: $requester->id,
            status: 'draft',
            submittedAt: null,
            completedAt: null,
        );

        $otherRequest = $this->createRequest(
            companyId: $otherCompany->id,
            requestTypeId: $otherRequestType->id,
            workflowId: $otherWorkflow->id,
            requesterId: $otherRequester->id,
            status: 'approved',
            submittedAt: now()->subHour(),
            completedAt: now(),
        );

        $instance =
            WorkflowInstance::query()->create([
                'company_id' => $company->id,
                'internal_request_id' => $inReview->id,
                'workflow_definition_id' => $workflow->id,
                'current_workflow_step_id' => $step->id,
                'status' => 'active',
                'started_at' => now()->subDay(),
            ]);

        WorkflowTask::query()->create([
            'company_id' => $company->id,
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'status' => 'pending',
            'due_at' => now()->subHour(),
        ]);

        WorkflowTask::query()->create([
            'company_id' => $company->id,
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'status' => 'pending',
            'due_at' => now()->addHours(3),
        ]);

        WorkflowTask::query()->create([
            'company_id' => $company->id,
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'status' => 'approved',
            'due_at' => now()->addHours(2),
            'acted_at' => now(),
        ]);

        WorkflowTask::query()->create([
            'company_id' => $company->id,
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'status' => 'rejected',
            'due_at' => now()->subHours(2),
            'acted_at' => now(),
        ]);

        $otherInstance =
            WorkflowInstance::query()->create([
                'company_id' => $otherCompany->id,
                'internal_request_id' => $otherRequest->id,
                'workflow_definition_id' => $otherWorkflow->id,
                'current_workflow_step_id' => $otherStep->id,
                'status' => 'active',
                'started_at' => now(),
            ]);

        WorkflowTask::query()->create([
            'company_id' => $otherCompany->id,
            'workflow_instance_id' => $otherInstance->id,
            'workflow_step_id' => $otherStep->id,
            'status' => 'pending',
            'due_at' => now()->subDay(),
        ]);

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'reports.view'
        );

        Sanctum::actingAs($user, ['*']);

        $response = $this
            ->getJson(
                '/api/dashboard/analytics?days=30'
            )
            ->assertOk()
            ->assertJsonPath(
                'data.period.days',
                30
            )
            ->assertJsonPath(
                'data.metrics.requests_created',
                4
            )
            ->assertJsonPath(
                'data.metrics.requests_completed',
                2
            )
            ->assertJsonPath(
                'data.metrics.pending_requests',
                1
            )
            ->assertJsonPath(
                'data.metrics.approval_rate',
                fn (mixed $value): bool => (float) $value === 50.0
            )
            ->assertJsonPath(
                'data.metrics.pending_tasks',
                2
            )
            ->assertJsonPath(
                'data.metrics.overdue_tasks',
                1
            )
            ->assertJsonPath(
                'data.metrics.due_soon_tasks',
                1
            )
            ->assertJsonPath(
                'data.metrics.sla_compliance_rate',
                fn (mixed $value): bool => (float) $value === 50.0
            )
            ->assertJsonPath(
                'data.request_types.0.code',
                'LEAVE'
            )
            ->assertJsonPath(
                'data.request_types.0.total',
                4
            )
            ->assertJsonPath(
                'data.departments.0.code',
                'ENG'
            )
            ->assertJsonPath(
                'data.departments.0.total',
                4
            );

        $this->assertSame(
            4,
            collect(
                $response->json(
                    'data.request_statuses'
                )
            )->sum('count')
        );
    }

    public function test_invalid_period_is_rejected(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'reports.view'
        );

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson(
                '/api/dashboard/analytics?days=45'
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'days',
            ]);
    }

    private function createRequest(
        int $companyId,
        int $requestTypeId,
        int $workflowId,
        int $requesterId,
        string $status,
        mixed $submittedAt,
        mixed $completedAt
    ): InternalRequest {
        return InternalRequest::factory()->create([
            'company_id' => $companyId,
            'request_type_id' => $requestTypeId,
            'workflow_definition_id' => $workflowId,
            'requester_employee_id' => $requesterId,
            'on_behalf_of_reason' => 'Automated test fixture: administrator creates this request on behalf of the requester.',
            'status' => $status,
            'submitted_at' => $submittedAt,
            'completed_at' => $completedAt,
            'created_at' => now()->subDay(),
        ]);
    }
}

