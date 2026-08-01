<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowTask;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

final class WorkspaceSearchService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(
        User $user,
        string $term,
        int $limit
    ): array {
        if ($user->company_id === null) {
            return [];
        }

        $companyId = (int) $user->company_id;

        $normalized = mb_strtolower(
            trim($term)
        );

        $like = "%{$normalized}%";
        $results = collect();

        if ($user->can('employees.view')) {
            $results->push(
                ...$this->employees(
                    $companyId,
                    $like,
                    $limit
                )
            );
        }

        if ($user->can('departments.view')) {
            $results->push(
                ...$this->departments(
                    $companyId,
                    $like,
                    $limit
                )
            );
        }

        if ($user->can('workflows.view')) {
            $results->push(
                ...$this->workflows(
                    $companyId,
                    $like,
                    $limit
                )
            );
        }

        if ($user->can('request-types.view')) {
            $results->push(
                ...$this->requestTypes(
                    $companyId,
                    $like,
                    $limit
                )
            );
        }

        if ($user->can('requests.view')) {
            $results->push(
                ...$this->requests(
                    $companyId,
                    $user,
                    $like,
                    $limit
                )
            );
        }

        if ($user->can('workflow-tasks.view')) {
            $results->push(
                ...$this->approvalTasks(
                    $companyId,
                    $user,
                    $like,
                    $limit
                )
            );
        }

        return $results
            ->sortBy([
                ['rank', 'asc'],
                ['title', 'asc'],
            ])
            ->values()
            ->take(36)
            ->map(
                function (array $result): array {
                    unset($result['rank']);

                    return $result;
                }
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function employees(
        int $companyId,
        string $like,
        int $limit
    ): array {
        return Employee::query()
            ->where('company_id', $companyId)
            ->with('department:id,name,code')
            ->where(
                function (
                    Builder $query
                ) use ($like): void {
                    $query
                        ->whereRaw(
                            'LOWER(employee_number) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(first_name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(last_name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(first_name || ' ' || last_name) LIKE ?",
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(job_title, '')) LIKE ?",
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(work_email, '')) LIKE ?",
                            [$like]
                        );
                }
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit($limit)
            ->get()
            ->map(
                fn (Employee $employee): array => $this->result(
                    kind: 'employee',
                    group: 'People',
                    id: $employee->id,
                    title: trim(
                        "{$employee->first_name} {$employee->last_name}"
                    ),
                    subtitle: $this->subtitle([
                        $employee->employee_number,
                        $employee->job_title,
                        $employee->department?->name,
                    ]),
                    status: $employee->status,
                    url: '/employees',
                    rank: 20,
                )
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departments(
        int $companyId,
        string $like,
        int $limit
    ): array {
        return Department::query()
            ->where('company_id', $companyId)
            ->where(
                function (
                    Builder $query
                ) use ($like): void {
                    $query
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(code) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$like]
                        );
                }
            )
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(
                fn (Department $department): array => $this->result(
                    kind: 'department',
                    group: 'Organization',
                    id: $department->id,
                    title: $department->name,
                    subtitle: $this->subtitle([
                        $department->code,
                        Str::limit(
                            (string) $department
                                ->description,
                            80
                        ),
                    ]),
                    status: $department->is_active
                        ? 'active'
                        : 'inactive',
                    url: '/departments',
                    rank: 30,
                )
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function workflows(
        int $companyId,
        string $like,
        int $limit
    ): array {
        return WorkflowDefinition::query()
            ->where('company_id', $companyId)
            ->where(
                function (
                    Builder $query
                ) use ($like): void {
                    $query
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(code) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$like]
                        );
                }
            )
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(
                fn (
                    WorkflowDefinition $workflow
                ): array => $this->result(
                    kind: 'workflow',
                    group: 'Automation',
                    id: $workflow->id,
                    title: $workflow->name,
                    subtitle: $this->subtitle([
                        $workflow->code,
                        "Version {$workflow->version}",
                    ]),
                    status: $workflow->is_active
                        ? 'active'
                        : 'inactive',
                    url: '/workflows',
                    rank: 40,
                )
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function requestTypes(
        int $companyId,
        string $like,
        int $limit
    ): array {
        return RequestType::query()
            ->where('company_id', $companyId)
            ->with(
                'workflowDefinition:id,name,code'
            )
            ->where(
                function (
                    Builder $query
                ) use ($like): void {
                    $query
                        ->whereRaw(
                            'LOWER(name) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(code) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$like]
                        );
                }
            )
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(
                fn (
                    RequestType $requestType
                ): array => $this->result(
                    kind: 'request_type',
                    group: 'Requests',
                    id: $requestType->id,
                    title: $requestType->name,
                    subtitle: $this->subtitle([
                        $requestType->code,
                        $requestType
                            ->workflowDefinition
                            ?->name,
                    ]),
                    status: $requestType->is_active
                        ? 'active'
                        : 'inactive',
                    url: '/request-types',
                    rank: 50,
                )
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function requests(
        int $companyId,
        User $user,
        string $like,
        int $limit
    ): array {
        $query = InternalRequest::query()
            ->where('company_id', $companyId)
            ->with([
                'requestType:id,name,code',
                'requesterEmployee:id,first_name,last_name,employee_number,user_id',
            ]);

        if (! $user->can('requests.view_all')) {
            $query->whereHas(
                'requesterEmployee',
                fn (
                    Builder $employeeQuery
                ) => $employeeQuery->where(
                    'user_id',
                    $user->id
                )
            );
        }

        return $query
            ->where(
                function (
                    Builder $searchQuery
                ) use ($like): void {
                    $searchQuery
                        ->whereRaw(
                            'LOWER(reference_number) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            'LOWER(title) LIKE ?',
                            [$like]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$like]
                        );
                }
            )
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(
                function (
                    InternalRequest $request
                ): array {
                    $requester = $request
                        ->requesterEmployee;

                    return $this->result(
                        kind: 'request',
                        group: 'Requests',
                        id: $request->id,
                        title: $request->title,
                        subtitle: $this->subtitle([
                            $request->reference_number,
                            $request->requestType?->name,
                            $requester
                                ? trim(
                                    "{$requester->first_name} {$requester->last_name}"
                                )
                                : null,
                        ]),
                        status: $request->status,
                        url: "/requests/{$request->id}/collaboration",
                        rank: 10,
                    );
                }
            )
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function approvalTasks(
        int $companyId,
        User $user,
        string $like,
        int $limit
    ): array {
        $query = WorkflowTask::query()
            ->where('company_id', $companyId)
            ->with([
                'workflowStep:id,name,code',
                'workflowInstance.internalRequest:id,reference_number,title',
            ]);

        if (
            ! $user->can(
                'workflow-tasks.view_all'
            )
        ) {
            $employeeId = $user->employee?->id;
            $roles = $user
                ->getRoleNames()
                ->values()
                ->all();

            $query->where(
                function (
                    Builder $assignmentQuery
                ) use (
                    $employeeId,
                    $roles
                ): void {
                    $hasAssignment = false;

                    if ($employeeId !== null) {
                        $assignmentQuery->where(
                            'assigned_employee_id',
                            $employeeId
                        );

                        $hasAssignment = true;
                    }

                    if ($roles !== []) {
                        $method = $hasAssignment
                            ? 'orWhereIn'
                            : 'whereIn';

                        $assignmentQuery->{$method}(
                            'assigned_role',
                            $roles
                        );

                        $hasAssignment = true;
                    }

                    if (! $hasAssignment) {
                        $assignmentQuery->whereRaw(
                            '1 = 0'
                        );
                    }
                }
            );
        }

        return $query
            ->where(
                function (
                    Builder $searchQuery
                ) use ($like): void {
                    $searchQuery
                        ->whereHas(
                            'workflowStep',
                            fn (
                                Builder $stepQuery
                            ) => $stepQuery
                                ->whereRaw(
                                    'LOWER(name) LIKE ?',
                                    [$like]
                                )
                                ->orWhereRaw(
                                    'LOWER(code) LIKE ?',
                                    [$like]
                                )
                        )
                        ->orWhereHas(
                            'workflowInstance.internalRequest',
                            fn (
                                Builder $requestQuery
                            ) => $requestQuery
                                ->whereRaw(
                                    'LOWER(reference_number) LIKE ?',
                                    [$like]
                                )
                                ->orWhereRaw(
                                    'LOWER(title) LIKE ?',
                                    [$like]
                                )
                        );
                }
            )
            ->orderByRaw(
                "CASE WHEN status = 'pending' THEN 0 ELSE 1 END"
            )
            ->orderBy('due_at')
            ->limit($limit)
            ->get()
            ->map(
                function (
                    WorkflowTask $task
                ): array {
                    $request = $task
                        ->workflowInstance
                        ?->internalRequest;

                    return $this->result(
                        kind: 'approval_task',
                        group: 'Approvals',
                        id: $task->id,
                        title: $request?->title
                            ?? $task
                                ->workflowStep
                                ?->name
                            ?? 'Approval task',
                        subtitle: $this->subtitle([
                            $request?->reference_number,
                            $task->workflowStep?->name,
                            $task->due_at
                                ? 'Due '.$task
                                    ->due_at
                                    ->format('d M Y H:i')
                                : null,
                        ]),
                        status: $task->status,
                        url: '/approvals',
                        rank: 15,
                    );
                }
            )
            ->all();
    }

    /**
     * @param  array<int, string|null>  $parts
     */
    private function subtitle(
        array $parts
    ): string {
        return collect($parts)
            ->filter(
                fn (
                    mixed $part
                ): bool => is_string($part)
                    && trim($part) !== ''
            )
            ->map(
                fn (
                    string $part
                ): string => trim($part)
            )
            ->join(' · ');
    }

    /**
     * @return array<string, mixed>
     */
    private function result(
        string $kind,
        string $group,
        int $id,
        string $title,
        string $subtitle,
        string $status,
        string $url,
        int $rank
    ): array {
        return [
            'kind' => $kind,
            'group' => $group,
            'id' => $id,
            'title' => $title,
            'subtitle' => $subtitle,
            'status' => $status,
            'url' => $url,
            'rank' => $rank,
        ];
    }
}
