<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestAuditEvent;
use App\Models\RequestType;
use App\Models\Scopes\TenantScope;
use App\Models\WorkflowTask;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class DashboardAnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function build(
        int $companyId,
        int $days
    ): array {
        $now = CarbonImmutable::now();
        $start = $now
            ->subDays($days - 1)
            ->startOfDay();
        $end = $now->endOfDay();

        $periodRequests = InternalRequest::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->whereBetween(
                'created_at',
                [$start, $end]
            )
            ->get([
                'id',
                'request_type_id',
                'requester_employee_id',
                'status',
                'submitted_at',
                'completed_at',
                'created_at',
            ]);

        $completedPeriodRequests =
            InternalRequest::query()
                ->withoutGlobalScope(
                    TenantScope::class
                )
                ->where('company_id', $companyId)
                ->whereIn(
                    'status',
                    [
                        'approved',
                        'rejected',
                    ]
                )
                ->whereBetween(
                    'completed_at',
                    [$start, $end]
                )
                ->get([
                    'id',
                    'status',
                    'submitted_at',
                    'completed_at',
                ]);

        $statusCounts = $periodRequests
            ->countBy('status');

        $approvedCompleted =
            $completedPeriodRequests
                ->where('status', 'approved')
                ->count();

        $rejectedCompleted =
            $completedPeriodRequests
                ->where('status', 'rejected')
                ->count();

        $decisionTotal =
            $approvedCompleted +
            $rejectedCompleted;

        $pendingRequests =
            InternalRequest::query()
                ->withoutGlobalScope(
                    TenantScope::class
                )
                ->where('company_id', $companyId)
                ->where('status', 'in_review')
                ->count();

        $pendingTaskQuery = WorkflowTask::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->where('status', 'pending');

        $pendingTasks =
            (clone $pendingTaskQuery)->count();

        $overdueTasks =
            (clone $pendingTaskQuery)
                ->whereNotNull('due_at')
                ->where('due_at', '<', $now)
                ->count();

        $dueSoonTasks =
            (clone $pendingTaskQuery)
                ->whereNotNull('due_at')
                ->whereBetween(
                    'due_at',
                    [
                        $now,
                        $now->addDay(),
                    ]
                )
                ->count();

        $actedTasks = WorkflowTask::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->whereIn(
                'status',
                [
                    'approved',
                    'rejected',
                ]
            )
            ->whereBetween(
                'acted_at',
                [$start, $end]
            )
            ->get([
                'id',
                'status',
                'created_at',
                'due_at',
                'acted_at',
            ]);

        $tasksWithDeadlines = $actedTasks
            ->filter(
                fn (WorkflowTask $task): bool => $task->due_at !== null
                    && $task->acted_at !== null
            );

        $completedWithinSla =
            $tasksWithDeadlines
                ->filter(
                    fn (WorkflowTask $task): bool => $task->acted_at
                        ->lessThanOrEqualTo(
                            $task->due_at
                        )
                )
                ->count();

        $completedLate =
            $tasksWithDeadlines->count()
            - $completedWithinSla;

        return [
            'period' => [
                'days' => $days,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],

            'metrics' => [
                'requests_created' => $periodRequests->count(),

                'requests_completed' => $completedPeriodRequests
                    ->count(),

                'pending_requests' => $pendingRequests,

                'approval_rate' => $this->percentage(
                    $approvedCompleted,
                    $decisionTotal
                ),

                'average_completion_hours' => $this->averageRequestHours(
                    $completedPeriodRequests
                ),

                'pending_tasks' => $pendingTasks,

                'overdue_tasks' => $overdueTasks,

                'due_soon_tasks' => $dueSoonTasks,

                'sla_compliance_rate' => $this->percentage(
                    $completedWithinSla,
                    $tasksWithDeadlines
                        ->count()
                ),

                'average_task_action_hours' => $this->averageTaskHours(
                    $actedTasks
                ),
            ],

            'request_statuses' => collect([
                'draft',
                'in_review',
                'approved',
                'rejected',
                'cancelled',
            ])->map(
                fn (string $status): array => [
                    'status' => $status,
                    'count' => (int) (
                        $statusCounts[$status]
                        ?? 0
                    ),
                ]
            )->all(),

            'request_trend' => $this->requestTrend(
                $companyId,
                $start,
                $end,
                $days
            ),

            'request_types' => $this->requestTypePerformance(
                $companyId,
                $periodRequests
            ),

            'departments' => $this->departmentPerformance(
                $companyId,
                $periodRequests
            ),

            'sla' => [
            'pending' => $pendingTasks,
            'overdue' => $overdueTasks,
            'due_soon' => $dueSoonTasks,
            'completed_within_sla' => $completedWithinSla,
            'completed_late' => $completedLate,
            'completed_without_deadline' => $actedTasks->count()
                - $tasksWithDeadlines
                    ->count(),
            ],

            'recent_activity' => $this->recentActivity(
                $companyId,
                $start,
                $end
            ),

            'generated_at' => $now->toISOString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function empty(int $days): array
    {
        $now = CarbonImmutable::now();
        $start = $now
            ->subDays($days - 1)
            ->startOfDay();

        return [
            'period' => [
                'days' => $days,
                'start_date' => $start->toDateString(),
                'end_date' => $now->toDateString(),
            ],

            'metrics' => [
                'requests_created' => 0,
                'requests_completed' => 0,
                'pending_requests' => 0,
                'approval_rate' => 0.0,
                'average_completion_hours' => null,
                'pending_tasks' => 0,
                'overdue_tasks' => 0,
                'due_soon_tasks' => 0,
                'sla_compliance_rate' => 0.0,
                'average_task_action_hours' => null,
            ],

            'request_statuses' => collect([
                'draft',
                'in_review',
                'approved',
                'rejected',
                'cancelled',
            ])->map(
                fn (string $status): array => [
                    'status' => $status,
                    'count' => 0,
                ]
            )->all(),

            'request_trend' => collect(
                range(0, $days - 1)
            )->map(
                fn (int $offset): array => [
                    'date' => $start
                        ->addDays($offset)
                        ->toDateString(),
                    'created' => 0,
                    'completed' => 0,
                ]
            )->all(),

            'request_types' => [],
            'departments' => [],

            'sla' => [
                'pending' => 0,
                'overdue' => 0,
                'due_soon' => 0,
                'completed_within_sla' => 0,
                'completed_late' => 0,
                'completed_without_deadline' => 0,
            ],

            'recent_activity' => [],

            'generated_at' => $now->toISOString(),
        ];
    }

    /**
     * @return array<int, array{
     *     date: string,
     *     created: int,
     *     completed: int
     * }>
     */
    private function requestTrend(
        int $companyId,
        CarbonImmutable $start,
        CarbonImmutable $end,
        int $days
    ): array {
        $trend = [];

        for (
            $offset = 0;
            $offset < $days;
            $offset++
        ) {
            $date = $start
                ->addDays($offset)
                ->toDateString();

            $trend[$date] = [
                'date' => $date,
                'created' => 0,
                'completed' => 0,
            ];
        }

        $rows = InternalRequest::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->where(
                function ($query) use (
                    $start,
                    $end
                ): void {
                    $query
                        ->whereBetween(
                            'created_at',
                            [$start, $end]
                        )
                        ->orWhereBetween(
                            'completed_at',
                            [$start, $end]
                        );
                }
            )
            ->get([
                'created_at',
                'completed_at',
            ]);

        foreach ($rows as $row) {
            if (
                $row->created_at !== null
                && $row->created_at->gte($start)
                && $row->created_at->lte($end)
            ) {
                $date = $row->created_at
                    ->toDateString();

                if (isset($trend[$date])) {
                    $trend[$date]['created']++;
                }
            }

            if (
                $row->completed_at !== null
                && $row->completed_at->gte($start)
                && $row->completed_at->lte($end)
            ) {
                $date = $row->completed_at
                    ->toDateString();

                if (isset($trend[$date])) {
                    $trend[$date]['completed']++;
                }
            }
        }

        return array_values($trend);
    }

    /**
     * @param  Collection<int, InternalRequest>  $requests
     * @return array<int, array<string, mixed>>
     */
    private function requestTypePerformance(
        int $companyId,
        Collection $requests
    ): array {
        $typeIds = $requests
            ->pluck('request_type_id')
            ->unique()
            ->filter()
            ->values();

        if ($typeIds->isEmpty()) {
            return [];
        }

        $types = RequestType::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->whereIn('id', $typeIds)
            ->get([
                'id',
                'name',
                'code',
            ])
            ->keyBy('id');

        return $requests
            ->groupBy('request_type_id')
            ->map(
                function (
                    Collection $group,
                    int|string $typeId
                ) use ($types): ?array {
                    $type = $types->get(
                        (int) $typeId
                    );

                    if ($type === null) {
                        return null;
                    }

                    return $this
                        ->performanceItem(
                            $type->id,
                            $type->name,
                            $type->code,
                            $group
                        );
                }
            )
            ->filter()
            ->sortByDesc('total')
            ->take(6)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, InternalRequest>  $requests
     * @return array<int, array<string, mixed>>
     */
    private function departmentPerformance(
        int $companyId,
        Collection $requests
    ): array {
        $employeeIds = $requests
            ->pluck('requester_employee_id')
            ->unique()
            ->filter()
            ->values();

        if ($employeeIds->isEmpty()) {
            return [];
        }

        $employeeDepartments =
            Employee::query()
                ->withoutGlobalScope(
                    TenantScope::class
                )
                ->where('company_id', $companyId)
                ->whereIn('id', $employeeIds)
                ->pluck(
                    'department_id',
                    'id'
                );

        $departmentIds =
            $employeeDepartments
                ->filter()
                ->unique()
                ->values();

        if ($departmentIds->isEmpty()) {
            return [];
        }

        $departments = Department::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->whereIn('id', $departmentIds)
            ->get([
                'id',
                'name',
                'code',
            ])
            ->keyBy('id');

        return $requests
            ->groupBy(
                fn (
                    InternalRequest $request
                ): int|string => $employeeDepartments->get(
                    $request
                        ->requester_employee_id,
                    'unassigned'
                )
            )
            ->map(
                function (
                    Collection $group,
                    int|string $departmentId
                ) use ($departments): ?array {
                    if (
                        $departmentId
                        === 'unassigned'
                    ) {
                        return null;
                    }

                    $department =
                        $departments->get(
                            (int) $departmentId
                        );

                    if ($department === null) {
                        return null;
                    }

                    return $this
                        ->performanceItem(
                            $department->id,
                            $department->name,
                            $department->code,
                            $group
                        );
                }
            )
            ->filter()
            ->sortByDesc('total')
            ->take(6)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, InternalRequest>  $requests
     * @return array<string, mixed>
     */
    private function performanceItem(
        int $id,
        string $name,
        string $code,
        Collection $requests
    ): array {
        return [
            'id' => $id,
            'name' => $name,
            'code' => $code,
            'total' => $requests->count(),
            'approved' => $requests
                ->where(
                    'status',
                    'approved'
                )
                ->count(),
            'rejected' => $requests
                ->where(
                    'status',
                    'rejected'
                )
                ->count(),
            'pending' => $requests
                ->where(
                    'status',
                    'in_review'
                )
                ->count(),
            'average_completion_hours' => $this->averageRequestHours(
                $requests
            ),
        ];
    }

    /**
     * @param  Collection<int, InternalRequest>  $requests
     */
    private function averageRequestHours(
        Collection $requests
    ): ?float {
        $durations = $requests
            ->filter(
                fn (
                    InternalRequest $request
                ): bool => $request->submitted_at
                        !== null
                    && $request->completed_at
                        !== null
            )
            ->map(
                fn (
                    InternalRequest $request
                ): float => $request->submitted_at
                    ->diffInMinutes(
                        $request->completed_at,
                        true
                    )
                    / 60
            );

        if ($durations->isEmpty()) {
            return null;
        }

        return round(
            (float) $durations->average(),
            2
        );
    }

    /**
     * @param  Collection<int, WorkflowTask>  $tasks
     */
    private function averageTaskHours(
        Collection $tasks
    ): ?float {
        $durations = $tasks
            ->filter(
                fn (WorkflowTask $task): bool => $task->acted_at !== null
            )
            ->map(
                fn (WorkflowTask $task): float => $task->created_at
                    ->diffInMinutes(
                        $task->acted_at,
                        true
                    )
                    / 60
            );

        if ($durations->isEmpty()) {
            return null;
        }

        return round(
            (float) $durations->average(),
            2
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentActivity(
        int $companyId,
        CarbonImmutable $start,
        CarbonImmutable $end
    ): array {
        return RequestAuditEvent::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('company_id', $companyId)
            ->whereBetween(
                'occurred_at',
                [$start, $end]
            )
            ->latest('occurred_at')
            ->limit(8)
            ->get([
                'id',
                'event_type',
                'summary',
                'actor_name',
                'internal_request_id',
                'occurred_at',
            ])
            ->map(
                fn (
                    RequestAuditEvent $event
                ): array => [
                    'id' => $event->id,
                    'event_type' => $event->event_type,
                    'summary' => $event->summary,
                    'actor_name' => $event->actor_name,
                    'internal_request_id' => $event
                        ->internal_request_id,
                    'occurred_at' => $event->occurred_at
                        ?->toISOString(),
                ]
            )
            ->values()
            ->all();
    }

    private function percentage(
        int $part,
        int $total
    ): float {
        if ($total <= 0) {
            return 0.0;
        }

        return round(
            ($part / $total) * 100,
            2
        );
    }
}
