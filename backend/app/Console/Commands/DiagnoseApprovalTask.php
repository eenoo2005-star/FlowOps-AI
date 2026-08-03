<?php

namespace App\Console\Commands;

use App\Models\InternalRequest;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTask;
use App\Models\WorkflowTaskDecision;
use App\Services\ApprovalEligibilityService;
use Illuminate\Console\Command;

final class DiagnoseApprovalTask extends Command
{
    protected $signature = 'flowops:diagnose-approval-task {task_id? : Workflow task ID. If omitted, the latest pending task is used.}';

    protected $description = 'Diagnose FlowOps AI approval task readiness and runtime state.';

    public function handle(ApprovalEligibilityService $eligibility): int
    {
        $taskId = $this->argument('task_id');

        $taskQuery = WorkflowTask::withoutGlobalScopes()
            ->with([
                'workflowStep',
                'assignedEmployee:id,first_name,last_name,employee_number,user_id,manager_id,company_id',
                'workflowInstance.internalRequest.requesterEmployee:id,first_name,last_name,employee_number,user_id,manager_id,company_id',
                'workflowInstance.internalRequest.requestType:id,name,code',
            ]);

        $task = $taskId
            ? $taskQuery->whereKey((int) $taskId)->first()
            : $taskQuery->where('status', 'pending')->latest('id')->first();

        if ($task === null) {
            $this->error('No approval task was found.');
            return self::FAILURE;
        }

        $instance = $task->workflowInstance;
        $request = $instance?->internalRequest;
        $step = $task->workflowStep;

        $this->info('FlowOps AI approval task diagnosis');
        $this->table(
            ['Field', 'Value'],
            [
                ['Task ID', (string) $task->id],
                ['Task company', (string) $task->company_id],
                ['Task status', (string) $task->status],
                ['Assigned employee ID', (string) ($task->assigned_employee_id ?? 'none')],
                ['Assigned role', (string) ($task->assigned_role ?? 'none')],
                ['Step ID', (string) ($step?->id ?? 'missing')],
                ['Step name', (string) ($step?->name ?? 'missing')],
                ['Step order', (string) ($step?->step_order ?? 'missing')],
                ['Step final', $step?->is_final ? 'yes' : 'no'],
                ['Step approval mode', (string) ($step?->approval_mode ?? 'missing')],
                ['Required approvals', (string) ($step?->required_approvals ?? 'missing')],
                ['Workflow instance ID', (string) ($instance?->id ?? 'missing')],
                ['Workflow instance status', (string) ($instance?->status ?? 'missing')],
                ['Internal request ID', (string) ($request?->id ?? 'missing')],
                ['Internal request reference', (string) ($request?->reference_number ?? 'missing')],
                ['Internal request status', (string) ($request?->status ?? 'missing')],
                ['Requester employee', (string) ($request?->requesterEmployee?->employee_number ?? 'missing')],
                ['Decision count', (string) WorkflowTaskDecision::withoutGlobalScopes()->where('workflow_task_id', $task->id)->count()],
            ]
        );

        if ($step !== null && $instance !== null) {
            $nextStep = WorkflowStep::withoutGlobalScopes()
                ->where('workflow_definition_id', $instance->workflow_definition_id)
                ->where('step_order', '>', $step->step_order)
                ->orderBy('step_order')
                ->first();

            if ($nextStep === null || $step->is_final) {
                $this->info('Next action: approving this task should complete the request.');
            } else {
                $this->warn('Next action: approving this task should create the next approval task.');
                $this->table(
                    ['Next step field', 'Value'],
                    [
                        ['Next step ID', (string) $nextStep->id],
                        ['Next step name', (string) $nextStep->name],
                        ['Approver type', (string) $nextStep->approver_type],
                        ['Approver employee ID', (string) ($nextStep->approver_employee_id ?? 'none')],
                        ['Approver role', (string) ($nextStep->approver_role ?? 'none')],
                        ['SLA hours', (string) ($nextStep->sla_hours ?? 'none')],
                    ]
                );
            }
        }

        if ($task->status !== 'pending') {
            $this->warn('This task is not pending, so it cannot be approved again.');
        }

        if ($instance?->status !== 'active') {
            $this->warn('The workflow instance is not active.');
        }

        if ($request?->status !== 'in_review') {
            $this->warn('The internal request is not in_review.');
        }

        $this->info('Diagnosis completed.');
        return self::SUCCESS;
    }
}
