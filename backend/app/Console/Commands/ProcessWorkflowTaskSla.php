<?php

namespace App\Console\Commands;

use App\Models\WorkflowTask;
use App\Services\AppNotificationService;
use App\Services\RequestAuditService;
use Illuminate\Console\Command;

final class ProcessWorkflowTaskSla extends Command
{
    protected $signature =
        'workflow:process-sla
        {--company= : Limit processing to one company ID}
        {--reminder-minutes=60 : Reminder window before deadline}';

    protected $description =
        'Send workflow task deadline reminders and overdue escalations.';

    public function handle(
        AppNotificationService $notifications,
        RequestAuditService $audit
    ): int {
        $companyId = $this->option('company');

        $reminderMinutes = max(
            1,
            (int) $this->option(
                'reminder-minutes'
            )
        );

        $now = now();
        $reminderDeadline = $now
            ->copy()
            ->addMinutes($reminderMinutes);

        $baseQuery = WorkflowTask::withoutGlobalScopes()
            ->with([
                'workflowStep',
                'workflowInstance.internalRequest.requesterEmployee',
            ])
            ->where('status', 'pending')
            ->whereNotNull('due_at');

        if (
            $companyId !== null
            && $companyId !== ''
        ) {
            $baseQuery->where(
                'company_id',
                (int) $companyId
            );
        }

        $reminded = 0;
        $overdue = 0;

        (clone $baseQuery)
            ->whereNull('reminder_sent_at')
            ->where('due_at', '>', $now)
            ->where(
                'due_at',
                '<=',
                $reminderDeadline
            )
            ->orderBy('id')
            ->chunkById(
                100,
                function ($tasks) use (
                    $notifications,
                    $now,
                    &$reminded
                ): void {
                    foreach ($tasks as $task) {
                        $notifications
                            ->notifyTaskReminder($task);

                        $task->forceFill([
                            'reminder_sent_at' => $now,
                        ])->saveQuietly();

                        $reminded++;
                    }
                }
            );

        (clone $baseQuery)
            ->whereNull('overdue_notified_at')
            ->where('due_at', '<=', $now)
            ->orderBy('id')
            ->chunkById(
                100,
                function ($tasks) use (
                    $notifications,
                    $audit,
                    $now,
                    &$overdue
                ): void {
                    foreach ($tasks as $task) {
                        $task->forceFill([
                            'overdue_notified_at' => $now,
                            'escalation_level' => max(
                                1,
                                $task
                                    ->escalation_level
                                    + 1
                            ),
                            'escalated_at' => $now,
                        ])->saveQuietly();

                        $notifications
                            ->notifyTaskOverdue($task);

                        $internalRequest = $task
                            ->workflowInstance
                            ?->internalRequest;

                        if ($internalRequest !== null) {
                            $audit->record(
                                $internalRequest,
                                'workflow.task.overdue',
                                'Approval task exceeded its SLA deadline.',
                                [
                                    'workflow_task_id' => $task->id,
                                    'due_at' => $task->due_at
                                        ?->toISOString(),
                                    'escalation_level' => $task
                                        ->escalation_level,
                                ]
                            );
                        }

                        $overdue++;
                    }
                }
            );

        $this->components->info(
            "SLA processing complete: {$reminded} reminders, {$overdue} overdue escalations."
        );

        return self::SUCCESS;
    }
}
