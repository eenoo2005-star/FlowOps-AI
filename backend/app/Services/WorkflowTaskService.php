<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkflowTask;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class WorkflowTaskService
{
    public function paginate(array $filters, User $user): LengthAwarePaginator
    {
        $query = WorkflowTask::query()->with($this->relations());

        if (! $user->can('workflow-tasks.view_all')) {
            $employeeId = $user->employee?->id;
            $roles = $user->getRoleNames()->values()->all();

            $query->where(function (Builder $assignmentQuery) use ($employeeId, $roles): void {
                $hasAssignment = false;

                if ($employeeId !== null) {
                    $assignmentQuery->where('assigned_employee_id', $employeeId);
                    $hasAssignment = true;
                }

                if ($roles !== []) {
                    $method = $hasAssignment ? 'orWhereIn' : 'whereIn';
                    $assignmentQuery->{$method}('assigned_role', $roles);
                    $hasAssignment = true;
                }

                if (! $hasAssignment) {
                    $assignmentQuery->whereRaw('1 = 0');
                }
            });
        }

        $search = mb_strtolower(trim((string) ($filters['search'] ?? '')));

        if ($search !== '') {
            $like = "%{$search}%";

            $query->where(function (Builder $searchQuery) use ($like): void {
                $searchQuery
                    ->whereHas('workflowStep', fn (Builder $stepQuery) => $stepQuery
                        ->whereRaw('LOWER(name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(code) LIKE ?', [$like]))
                    ->orWhereHas('workflowInstance.internalRequest', fn (Builder $requestQuery) => $requestQuery
                        ->whereRaw('LOWER(reference_number) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(title) LIKE ?', [$like]));
            });
        }

        $status = (string) ($filters['status'] ?? 'pending');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return $query
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('due_at')
            ->orderByDesc('created_at')
            ->paginate(min(max((int) ($filters['per_page'] ?? 15), 5), 100))
            ->appends($filters);
    }

    public function loadForDisplay(WorkflowTask $workflowTask): WorkflowTask
    {
        return $workflowTask->load($this->relations());
    }

    private function relations(): array
    {
        return [
            'workflowStep',
            'assignedEmployee:id,first_name,last_name,employee_number',
            'workflowInstance.internalRequest.requestType:id,name,code',
            'workflowInstance.internalRequest.requesterEmployee:id,first_name,last_name,employee_number',
            'decisions.actedByUser:id,name,email',
            'decisions.actedByEmployee:id,first_name,last_name,employee_number',
        ];
    }
}
