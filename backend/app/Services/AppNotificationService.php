<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTask;
use App\Models\WorkflowTaskDecision;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

final class AppNotificationService
{
    public function notifyRequestCreatedOnBehalf(\App\Models\InternalRequest $request): void
    {
        $request->loadMissing(['requesterEmployee.user', 'creator']);
        $user = $request->requesterEmployee?->user;
        if ($user === null || $request->created_by_user_id === $user->id) return;
        $creator = $request->creator?->name ?? 'An authorized user';
        $this->createForUsers(collect([$user]), (int) $request->company_id, 'request.created_on_behalf', 'Request created on your behalf', "{$creator} created {$request->reference_number} on your behalf.", "/requests/{$request->id}/collaboration", ['internal_request_id' => $request->id, 'created_by_user_id' => $request->created_by_user_id], "request:{$request->id}:created-on-behalf");
    }

    public function notifyTaskAssigned(
        WorkflowTask $workflowTask
    ): void {
        $workflowTask->loadMissing([
            'workflowStep',
            'workflowInstance.internalRequest',
        ]);

        $internalRequest = $workflowTask
            ->workflowInstance
            ?->internalRequest;

        $reference = $internalRequest
            ?->reference_number
            ?? "TASK-{$workflowTask->id}";

        $stepName = $workflowTask
            ->workflowStep
            ?->name
            ?? 'Approval step';

        $this->createForUsers(
            $this->taskRecipients($workflowTask),
            $workflowTask->company_id,
            'workflow.task.assigned',
            'New approval task',
            "{$reference} is waiting for {$stepName}.",
            '/approvals',
            [
                'workflow_task_id' => $workflowTask->id,
                'internal_request_id' => $internalRequest?->id,
            ],
            "task:{$workflowTask->id}:assigned"
        );
    }

    public function notifyTaskReminder(
        WorkflowTask $workflowTask
    ): void {
        $workflowTask->loadMissing([
            'workflowStep',
            'workflowInstance.internalRequest',
        ]);

        $internalRequest = $workflowTask
            ->workflowInstance
            ?->internalRequest;

        $reference = $internalRequest
            ?->reference_number
            ?? "TASK-{$workflowTask->id}";

        $this->createForUsers(
            $this->taskRecipients($workflowTask),
            $workflowTask->company_id,
            'workflow.task.due_soon',
            'Approval deadline approaching',
            "{$reference} is approaching its approval deadline.",
            '/approvals',
            [
                'workflow_task_id' => $workflowTask->id,
                'due_at' => $workflowTask->due_at?->toISOString(),
            ],
            "task:{$workflowTask->id}:due-soon"
        );
    }

    public function notifyTaskOverdue(
        WorkflowTask $workflowTask
    ): void {
        $workflowTask->loadMissing([
            'workflowStep',
            'workflowInstance.internalRequest',
        ]);

        $internalRequest = $workflowTask
            ->workflowInstance
            ?->internalRequest;

        $reference = $internalRequest
            ?->reference_number
            ?? "TASK-{$workflowTask->id}";

        $recipients = $this
            ->taskRecipients($workflowTask)
            ->merge(
                $this->escalationRecipients(
                    $workflowTask->company_id
                )
            )
            ->unique('id')
            ->values();

        $this->createForUsers(
            $recipients,
            $workflowTask->company_id,
            'workflow.task.overdue',
            'Approval task overdue',
            "{$reference} has passed its approval deadline.",
            '/approvals',
            [
                'workflow_task_id' => $workflowTask->id,
                'due_at' => $workflowTask->due_at?->toISOString(),
                'escalation_level' => $workflowTask->escalation_level,
            ],
            "task:{$workflowTask->id}:overdue"
        );
    }

    public function notifyRequesterDecision(
        WorkflowTaskDecision $decision
    ): void {
        $decision->loadMissing([
            'workflowTask.workflowStep',
            'workflowTask.workflowInstance.internalRequest.requesterEmployee',
        ]);

        $workflowTask = $decision->workflowTask;

        $internalRequest = $workflowTask
            ?->workflowInstance
            ?->internalRequest;

        $requesterUserId = $internalRequest
            ?->requesterEmployee
            ?->user_id;

        if (
            $workflowTask === null
            || $internalRequest === null
            || $requesterUserId === null
        ) {
            return;
        }

        $user = User::query()
            ->whereKey($requesterUserId)
            ->where(
                'company_id',
                $workflowTask->company_id
            )
            ->first();

        if ($user === null) {
            return;
        }

        $approved =
            $decision->decision === 'approved';

        $this->createForUsers(
            collect([$user]),
            $workflowTask->company_id,
            $approved
                ? 'request.approval.approved'
                : 'request.approval.rejected',
            $approved
                ? 'Request step approved'
                : 'Request rejected',
            $approved
                ? "{$internalRequest->reference_number} received an approval."
                : "{$internalRequest->reference_number} was rejected.",
            "/requests/{$internalRequest->id}/collaboration",
            [
                'workflow_task_id' => $workflowTask->id,
                'internal_request_id' => $internalRequest->id,
                'decision' => $decision->decision,
            ],
            "decision:{$decision->id}:requester"
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function taskRecipients(
        WorkflowTask $workflowTask
    ): Collection {
        $users = collect();

        if (
            $workflowTask->assigned_employee_id
            !== null
        ) {
            $employee = Employee::query()
                ->whereKey(
                    $workflowTask
                        ->assigned_employee_id
                )
                ->where(
                    'company_id',
                    $workflowTask->company_id
                )
                ->first();

            if ($employee?->user_id !== null) {
                $user = User::query()
                    ->whereKey($employee->user_id)
                    ->where(
                        'company_id',
                        $workflowTask->company_id
                    )
                    ->first();

                if ($user !== null) {
                    $users->push($user);
                }
            }
        }

        $roleName = $workflowTask->assigned_role;

        if (
            $roleName !== null
            && Role::query()
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->exists()
        ) {
            $users = $users->merge(
                User::query()
                    ->where(
                        'company_id',
                        $workflowTask->company_id
                    )
                    ->role($roleName)
                    ->get()
            );
        }

        return $users
            ->unique('id')
            ->values();
    }

    /**
     * @return Collection<int, User>
     */
    private function escalationRecipients(
        int $companyId
    ): Collection {
        $users = collect();

        foreach ([
            'company admin',
            'company_admin',
            'system admin',
            'system_admin',
        ] as $roleName) {
            if (
                ! Role::query()
                    ->where('name', $roleName)
                    ->where('guard_name', 'web')
                    ->exists()
            ) {
                continue;
            }

            $users = $users->merge(
                User::query()
                    ->where(
                        'company_id',
                        $companyId
                    )
                    ->role($roleName)
                    ->get()
            );
        }

        return $users
            ->unique('id')
            ->values();
    }

    /**
     * @param  Collection<int, User>  $users
     */
    private function createForUsers(
        Collection $users,
        int $companyId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl,
        array $data,
        string $dedupePrefix
    ): void {
        foreach ($users as $user) {
            AppNotification::withoutGlobalScopes()
                ->firstOrCreate(
                    [
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'dedupe_key' => "{$dedupePrefix}:user:{$user->id}",
                    ],
                    [
                        'type' => $type,
                        'title' => $title,
                        'message' => $message,
                        'action_url' => $actionUrl,
                        'data' => $data,
                    ]
                );
        }
    }
}
