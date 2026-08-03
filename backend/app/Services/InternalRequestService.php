<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\RequestType;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowTask;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class InternalRequestService
{
    public function __construct(
        private readonly WorkflowAssignmentResolver $resolver
    ) {}

    public function paginate(
        array $filters,
        User $user
    ): LengthAwarePaginator {
        $query = InternalRequest::query()
            ->with([
                'requestType:id,name,code',
                'requesterEmployee:id,first_name,last_name,employee_number,user_id',
                'creator:id,name,email',
                'workflowDefinition:id,name,code,version',
                'currentWorkflowStep:id,name,code,step_order',
            ]);

        if (! $user->can('requests.view_all')) {
            $query->whereHas(
                'requesterEmployee',
                fn (Builder $employeeQuery) => $employeeQuery->where(
                    'user_id',
                    $user->id
                )
            );
        }

        $search = mb_strtolower(
            trim((string) ($filters['search'] ?? ''))
        );

        if ($search !== '') {
            $likeSearch = "%{$search}%";

            $query->where(
                function (Builder $searchQuery) use ($likeSearch): void {
                    $searchQuery
                        ->whereRaw(
                            'LOWER(reference_number) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            'LOWER(title) LIKE ?',
                            [$likeSearch]
                        )
                        ->orWhereRaw(
                            "LOWER(COALESCE(description, '')) LIKE ?",
                            [$likeSearch]
                        );
                }
            );
        }

        $status = (string) ($filters['status'] ?? 'all');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $priority = (string) (
            $filters['priority'] ?? 'all'
        );

        if ($priority !== 'all') {
            $query->where('priority', $priority);
        }

        if (! empty($filters['request_type_id'])) {
            $query->where(
                'request_type_id',
                (int) $filters['request_type_id']
            );
        }

        return $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(
                min(
                    max(
                        (int) ($filters['per_page'] ?? 15),
                        5
                    ),
                    100
                )
            )
            ->appends($filters);
    }

    public function createDraft(
        array $data,
        User $user
    ): InternalRequest {
        $requester = $this->resolveRequester(
            $data['requester_employee_id'] ?? null,
            $user
        );

        $requestType = RequestType::query()
            ->with('workflowDefinition')
            ->findOrFail($data['request_type_id']);

        if (! $requestType->is_active) {
            throw ValidationException::withMessages([
                'request_type_id' => [
                    'The selected request type is inactive.',
                ],
            ]);
        }

        if (! $requestType->workflowDefinition->is_active) {
            throw ValidationException::withMessages([
                'request_type_id' => [
                    'The selected request type uses an inactive workflow.',
                ],
            ]);
        }

        $isOnBehalf = $user->employee?->id !== $requester->id;
        if ($isOnBehalf && trim((string) ($data['on_behalf_of_reason'] ?? '')) === '') {
            throw ValidationException::withMessages(['on_behalf_of_reason' => ['A reason is required when creating a request for another employee.']]);
        }
        $reason = $isOnBehalf ? trim((string) $data['on_behalf_of_reason']) : null;
        unset($data['requester_employee_id'], $data['on_behalf_of_reason']);

        $request = InternalRequest::query()
            ->create([
                ...$data,
                'company_id' => (int) $user->company_id,
                'request_type_id' => $requestType->id,
                'workflow_definition_id' => $requestType->workflow_definition_id,
                'requester_employee_id' => $requester->id,
                'created_by_user_id' => $user->id,
                'on_behalf_of_reason' => $reason,
                'reference_number' => $this->generateReferenceNumber(
                    (int) $user->company_id
                ),
                'status' => 'draft',
            ])
            ->load([
                'requestType:id,name,code',
                'requesterEmployee:id,first_name,last_name,employee_number,user_id',
                'creator:id,name,email',
                'workflowDefinition:id,name,code,version',
                'currentWorkflowStep:id,name,code,step_order',
            ]);

        app(AppNotificationService::class)->notifyRequestCreatedOnBehalf($request);

        return $request;
    }

    public function updateDraft(
        InternalRequest $internalRequest,
        array $data
    ): InternalRequest {
        if ($internalRequest->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => [
                    'Only draft requests can be updated.',
                ],
            ]);
        }

        $internalRequest->update($data);

        return $internalRequest
            ->fresh()
            ->load([
                'requestType:id,name,code',
                'requesterEmployee:id,first_name,last_name,employee_number,user_id',
                'creator:id,name,email',
                'workflowDefinition:id,name,code,version',
                'currentWorkflowStep:id,name,code,step_order',
            ]);
    }

    public function submit(
        InternalRequest $internalRequest
    ): InternalRequest {
        return DB::transaction(
            function () use ($internalRequest): InternalRequest {
                $lockedRequest = InternalRequest::query()
                    ->whereKey($internalRequest->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedRequest->status !== 'draft') {
                    throw ValidationException::withMessages([
                        'status' => [
                            'Only draft requests can be submitted.',
                        ],
                    ]);
                }

                $lockedRequest->load([
                    'requesterEmployee',
                    'workflowDefinition.steps',
                ]);

                $workflowDefinition =
                    $lockedRequest->workflowDefinition;

                if (! $workflowDefinition->is_active) {
                    throw ValidationException::withMessages([
                        'workflow' => [
                            'The workflow is inactive.',
                        ],
                    ]);
                }

                $firstStep = $workflowDefinition
                    ->steps
                    ->sortBy('step_order')
                    ->first();

                if ($firstStep === null) {
                    throw ValidationException::withMessages([
                        'workflow' => [
                            'The workflow does not contain approval steps.',
                        ],
                    ]);
                }

                $assignment = $this->resolver->resolve(
                    $firstStep,
                    $lockedRequest->requesterEmployee
                );

                $now = now();

                $workflowInstance =
                    WorkflowInstance::query()->create([
                        'company_id' => $lockedRequest->company_id,
                        'internal_request_id' => $lockedRequest->id,
                        'workflow_definition_id' => $workflowDefinition->id,
                        'current_workflow_step_id' => $firstStep->id,
                        'status' => 'active',
                        'started_at' => $now,
                    ]);

                WorkflowTask::query()->create([
                    'company_id' => $lockedRequest->company_id,
                    'workflow_instance_id' => $workflowInstance->id,
                    'workflow_step_id' => $firstStep->id,
                    'assigned_employee_id' => $assignment[
                            'assigned_employee_id'
                        ],
                    'assigned_role' => $assignment['assigned_role'],
                    'status' => 'pending',
                    'due_at' => $firstStep->sla_hours
                        ? $now->copy()->addHours(
                            $firstStep->sla_hours
                        )
                        : null,
                ]);

                $lockedRequest->update([
                    'status' => 'in_review',
                    'current_workflow_step_id' => $firstStep->id,
                    'submitted_at' => $now,
                ]);

                return $lockedRequest
                    ->fresh()
                    ->load([
                        'requestType:id,name,code',
                        'requesterEmployee:id,first_name,last_name,employee_number,user_id',
                'creator:id,name,email',
                        'workflowDefinition:id,name,code,version',
                        'currentWorkflowStep:id,name,code,step_order',

                        'workflowInstance.tasks.workflowStep:id,name,code,step_order',

                        'workflowInstance.tasks.assignedEmployee:id,first_name,last_name,employee_number',
                    ]);
            }
        );
    }

    public function deleteDraft(
        InternalRequest $internalRequest
    ): void {
        if ($internalRequest->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => [
                    'Only draft requests can be deleted.',
                ],
            ]);
        }

        $internalRequest->delete();
    }

    private function resolveRequester(
        ?int $requestedEmployeeId,
        User $user
    ): Employee {
        if ($requestedEmployeeId !== null) {
            $requester = Employee::query()
                ->findOrFail($requestedEmployeeId);

            $isOwnEmployee =
                $user->employee?->id === $requester->id;

            if (
                ! $isOwnEmployee
                && ! $user->can(
                    'requests.create_for_others'
                )
            ) {
                throw new AuthorizationException;
            }

            return $requester;
        }

        $requester = $user->employee;

        if ($requester === null) {
            throw ValidationException::withMessages([
                'requester_employee_id' => [
                    'This user is not linked to an employee record.',
                ],
            ]);
        }

        return $requester;
    }

    private function generateReferenceNumber(
        int $companyId
    ): string {
        do {
            $reference = sprintf(
                'REQ-%s-%s',
                now()->format('Ymd'),
                Str::upper(Str::random(8))
            );
        } while (
            InternalRequest::query()
                ->where('company_id', $companyId)
                ->where(
                    'reference_number',
                    $reference
                )
                ->exists()
        );

        return $reference;
    }
}
