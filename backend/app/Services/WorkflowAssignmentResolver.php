<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\WorkflowStep;
use Illuminate\Validation\ValidationException;

final class WorkflowAssignmentResolver
{
    /**
     * @return array{
     *     assigned_employee_id: int|null,
     *     assigned_role: string|null
     * }
     */
    public function resolve(
        WorkflowStep $workflowStep,
        Employee $requester
    ): array {
        return match ($workflowStep->approver_type) {
            'employee' => [
                'assigned_employee_id' => $workflowStep->approver_employee_id,
                'assigned_role' => null,
            ],

            'requester_manager' => $this->requesterManagerAssignment(
                $requester
            ),

            'role' => [
                'assigned_employee_id' => null,
                'assigned_role' => $workflowStep->approver_role,
            ],

            'department_manager' => [
                'assigned_employee_id' => null,
                'assigned_role' => 'department_manager',
            ],

            default => throw ValidationException::withMessages([
                'workflow' => [
                    'The workflow step has an unsupported approver type.',
                ],
            ]),
        };
    }

    private function requesterManagerAssignment(
        Employee $requester
    ): array {
        if ($requester->manager_id === null) {
            throw ValidationException::withMessages([
                'requester_employee_id' => [
                    'The requester does not have a manager assigned.',
                ],
            ]);
        }

        return [
            'assigned_employee_id' => $requester->manager_id,
            'assigned_role' => null,
        ];
    }
}
