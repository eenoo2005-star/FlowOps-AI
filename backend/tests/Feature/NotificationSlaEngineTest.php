<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Company;
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

final class NotificationSlaEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        Permission::findOrCreate(
            'notifications.view',
            'web'
        );
    }

    public function test_task_assignment_creates_notification_for_assignee(): void
    {
        [$user, $task] = $this->createTask(
            now()->addHours(2)
        );

        $this->assertDatabaseHas(
            'app_notifications',
            [
                'company_id' => $task->company_id,
                'user_id' => $user->id,
                'type' => 'workflow.task.assigned',
            ]
        );
    }

    public function test_sla_command_sends_reminder_and_overdue_escalation_once(): void
    {
        [$reminderUser, $reminderTask] =
            $this->createTask(
                now()->addMinutes(30)
            );

        [$overdueUser, $overdueTask] =
            $this->createTask(
                now()->subMinutes(10)
            );

        $this
            ->artisan('workflow:process-sla')
            ->assertSuccessful();

        $this->assertDatabaseHas(
            'app_notifications',
            [
                'user_id' => $reminderUser->id,
                'type' => 'workflow.task.due_soon',
            ]
        );

        $this->assertDatabaseHas(
            'app_notifications',
            [
                'user_id' => $overdueUser->id,
                'type' => 'workflow.task.overdue',
            ]
        );

        $this->assertDatabaseHas(
            'workflow_tasks',
            [
                'id' => $reminderTask->id,
            ]
        );

        $this->assertDatabaseHas(
            'workflow_tasks',
            [
                'id' => $overdueTask->id,
                'escalation_level' => 1,
            ]
        );

        $this
            ->artisan('workflow:process-sla')
            ->assertSuccessful();

        $this->assertSame(
            1,
            AppNotification::withoutGlobalScopes()
                ->where(
                    'user_id',
                    $reminderUser->id
                )
                ->where(
                    'type',
                    'workflow.task.due_soon'
                )
                ->count()
        );

        $this->assertSame(
            1,
            AppNotification::withoutGlobalScopes()
                ->where(
                    'user_id',
                    $overdueUser->id
                )
                ->where(
                    'type',
                    'workflow.task.overdue'
                )
                ->count()
        );
    }

    public function test_user_only_reads_and_updates_own_notifications(): void
    {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $otherUser = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $user->givePermissionTo(
            'notifications.view'
        );

        $own = AppNotification::query()->create([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Own notification',
            'message' => 'Visible notification',
            'dedupe_key' => 'own-notification',
        ]);

        $other = AppNotification::query()->create([
            'company_id' => $company->id,
            'user_id' => $otherUser->id,
            'type' => 'test',
            'title' => 'Other notification',
            'message' => 'Hidden notification',
            'dedupe_key' => 'other-notification',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $own->id
            );

        $this
            ->postJson(
                "/api/notifications/{$own->id}/read"
            )
            ->assertOk()
            ->assertJsonPath(
                'data.is_read',
                true
            );

        $this
            ->postJson(
                "/api/notifications/{$other->id}/read"
            )
            ->assertNotFound();
    }

    /**
     * @return array{0: User, 1: WorkflowTask}
     */
    private function createTask(
        mixed $dueAt
    ): array {
        $company = Company::factory()->create();

        $user = User::factory()->create([
            'company_id' => $company->id,
        ]);

        $assignee = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
            'user_id' => $user->id,
        ]);

        $requester = Employee::factory()->create([
            'company_id' => $company->id,
            'department_id' => null,
        ]);

        $workflow =
            WorkflowDefinition::factory()->create([
                'company_id' => $company->id,
                'is_active' => true,
            ]);

        $step = WorkflowStep::factory()->create([
            'company_id' => $company->id,
            'workflow_definition_id' => $workflow->id,
            'step_order' => 1,
            'approver_type' => 'employee',
            'approver_employee_id' => $assignee->id,
            'sla_hours' => 1,
            'is_final' => true,
        ]);

        $requestType =
            RequestType::factory()->create([
                'company_id' => $company->id,
                'workflow_definition_id' => $workflow->id,
            ]);

        $internalRequest =
            InternalRequest::factory()->create([
                'company_id' => $company->id,
                'request_type_id' => $requestType->id,
                'workflow_definition_id' => $workflow->id,
                'requester_employee_id' => $requester->id,
                'on_behalf_of_reason' => 'Automated test fixture: administrator creates this request on behalf of the requester.',
                'current_workflow_step_id' => $step->id,
                'status' => 'in_review',
                'submitted_at' => now(),
            ]);

        $instance =
            WorkflowInstance::query()->create([
                'company_id' => $company->id,
                'internal_request_id' => $internalRequest->id,
                'workflow_definition_id' => $workflow->id,
                'current_workflow_step_id' => $step->id,
                'status' => 'active',
                'started_at' => now(),
            ]);

        $task = WorkflowTask::query()->create([
            'company_id' => $company->id,
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'assigned_employee_id' => $assignee->id,
            'status' => 'pending',
            'due_at' => $dueAt,
        ]);

        return [$user, $task];
    }
}

