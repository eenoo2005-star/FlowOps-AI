<?php

namespace App\Services;

use App\Models\InternalRequest;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTask;
use App\Models\WorkflowTaskDecision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

final class ApprovalActionService
{
    public function __construct(
        private readonly WorkflowAssignmentResolver $resolver,
        private readonly ApprovalEligibilityService $eligibility,
        private readonly WorkflowTaskService $taskService
    ) {}

    public function approve(WorkflowTask $workflowTask, User $actor, ?string $note): WorkflowTask
    {
        return DB::transaction(function () use ($workflowTask, $actor, $note): WorkflowTask {
            [$task, $instance, $request, $step] = $this->lockRuntime($workflowTask);
            $this->ensurePendingRuntime($task, $instance, $request);
            $this->recordDecision($task, $actor, 'approved', $note);

            $approvalCount = WorkflowTaskDecision::query()
                ->where('workflow_task_id', $task->id)
                ->where('decision', 'approved')
                ->count();

            if ($approvalCount < $this->requiredApprovals($task, $step)) {
                return $this->taskService->loadForDisplay($task->fresh());
            }

            $now = now();

            $task->update([
                'status' => 'approved',
                'acted_at' => $now,
                'acted_by_employee_id' => $actor->employee?->id,
                'decision_note' => $note,
            ]);

            $nextStep = WorkflowStep::query()
                ->where('workflow_definition_id', $instance->workflow_definition_id)
                ->where('step_order', '>', $step->step_order)
                ->orderBy('step_order')
                ->first();

            if ($step->is_final || $nextStep === null) {
                $instance->update(['status' => 'completed', 'completed_at' => $now]);
                $request->update(['status' => 'approved', 'completed_at' => $now]);

                return $this->taskService->loadForDisplay($task->fresh());
            }

            $request->load('requesterEmployee');
            $assignment = $this->resolver->resolve($nextStep, $request->requesterEmployee);

            $nextTask = WorkflowTask::withoutEvents(
                fn (): WorkflowTask => WorkflowTask::query()->create([
                    'company_id' => $request->company_id,
                    'workflow_instance_id' => $instance->id,
                    'workflow_step_id' => $nextStep->id,
                    'assigned_employee_id' => $assignment['assigned_employee_id'],
                    'assigned_role' => $assignment['assigned_role'],
                    'status' => 'pending',
                    'due_at' => $nextStep->sla_hours
                        ? $now->copy()->addHours($nextStep->sla_hours)
                        : null,
                ])
            );

            $this->notifyTaskAssignedSafely($nextTask);

            $instance->update(['current_workflow_step_id' => $nextStep->id]);
            $request->update(['current_workflow_step_id' => $nextStep->id]);

            return $this->taskService->loadForDisplay($task->fresh());
        });
    }

    public function reject(WorkflowTask $workflowTask, User $actor, string $note): WorkflowTask
    {
        return DB::transaction(function () use ($workflowTask, $actor, $note): WorkflowTask {
            [$task, $instance, $request, $step] = $this->lockRuntime($workflowTask);
            $this->ensurePendingRuntime($task, $instance, $request);

            if (! $step->can_reject) {
                throw ValidationException::withMessages([
                    'decision' => ['This workflow step does not allow rejection.'],
                ]);
            }

            $this->recordDecision($task, $actor, 'rejected', $note);
            $now = now();

            $task->update([
                'status' => 'rejected',
                'acted_at' => $now,
                'acted_by_employee_id' => $actor->employee?->id,
                'decision_note' => $note,
            ]);

            $instance->update(['status' => 'rejected', 'completed_at' => $now]);
            $request->update(['status' => 'rejected', 'completed_at' => $now]);

            return $this->taskService->loadForDisplay($task->fresh());
        });
    }

    private function lockRuntime(WorkflowTask $workflowTask): array
    {
        $task = WorkflowTask::query()->whereKey($workflowTask->id)->lockForUpdate()->firstOrFail();
        $instance = WorkflowInstance::query()->whereKey($task->workflow_instance_id)->lockForUpdate()->firstOrFail();
        $request = InternalRequest::query()->whereKey($instance->internal_request_id)->lockForUpdate()->firstOrFail();
        $step = WorkflowStep::query()->findOrFail($task->workflow_step_id);

        return [$task, $instance, $request, $step];
    }

    private function ensurePendingRuntime(
        WorkflowTask $task,
        WorkflowInstance $instance,
        InternalRequest $request
    ): void {
        if ($task->status !== 'pending' || $instance->status !== 'active' || $request->status !== 'in_review') {
            throw ValidationException::withMessages([
                'status' => ['This approval task is no longer pending.'],
            ]);
        }
    }

    private function recordDecision(
        WorkflowTask $task,
        User $actor,
        string $decision,
        ?string $note
    ): void {
        $alreadyActed = WorkflowTaskDecision::query()
            ->where('workflow_task_id', $task->id)
            ->where('acted_by_user_id', $actor->id)
            ->exists();

        if ($alreadyActed) {
            throw ValidationException::withMessages([
                'decision' => ['You have already acted on this approval task.'],
            ]);
        }

        $workflowTaskDecision = WorkflowTaskDecision::withoutEvents(
            fn (): WorkflowTaskDecision => WorkflowTaskDecision::query()->create([
                'company_id' => $task->company_id,
                'workflow_task_id' => $task->id,
                'acted_by_user_id' => $actor->id,
                'acted_by_employee_id' => $actor->employee?->id,
                'decision' => $decision,
                'note' => $note,
                'acted_at' => now(),
            ])
        );

        $this->recordDecisionSideEffectsSafely($workflowTaskDecision);
    }

    private function requiredApprovals(WorkflowTask $task, WorkflowStep $step): int
    {
        $eligible = $this->eligibility->eligibleUserCount($task);

        if ($step->approval_mode === 'all') {
            return max(1, $eligible);
        }

        $configured = max(1, $step->required_approvals);

        return $eligible <= 0 ? $configured : min($configured, $eligible);
    }

    private function recordDecisionSideEffectsSafely(WorkflowTaskDecision $decision): void
    {
        try {
            $decision->loadMissing([
                'actedByUser',
                'workflowTask.workflowInstance.internalRequest',
            ]);

            $internalRequest = $decision
                ->workflowTask
                ?->workflowInstance
                ?->internalRequest;

            if ($internalRequest !== null) {
                $approved = $decision->decision === 'approved';

                app(RequestAuditService::class)->record(
                    $internalRequest,
                    $approved ? 'approval.approved' : 'approval.rejected',
                    $approved ? 'Approval task approved.' : 'Approval task rejected.',
                    [
                        'workflow_task_id' => $decision->workflow_task_id,
                        'workflow_step_id' => $decision->workflowTask?->workflow_step_id,
                        'note' => $decision->note,
                    ],
                    $decision->actedByUser
                );
            }
        } catch (Throwable $exception) {
            Log::warning('FlowOps approval audit side effect failed.', [
                'workflow_task_decision_id' => $decision->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }

        try {
            app(AppNotificationService::class)->notifyRequesterDecision($decision);
        } catch (Throwable $exception) {
            Log::warning('FlowOps approval requester notification failed.', [
                'workflow_task_decision_id' => $decision->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function notifyTaskAssignedSafely(WorkflowTask $workflowTask): void
    {
        try {
            app(AppNotificationService::class)->notifyTaskAssigned($workflowTask);
        } catch (Throwable $exception) {
            Log::warning('FlowOps next approval task notification failed.', [
                'workflow_task_id' => $workflowTask->id,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
