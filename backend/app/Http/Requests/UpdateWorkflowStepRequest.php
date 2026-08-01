<?php

namespace App\Http\Requests;

use App\Models\WorkflowStep;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateWorkflowStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var WorkflowStep $workflowStep */
        $workflowStep = $this->route('workflowStep');

        $companyId = $this->user()->company_id;

        $workflowDefinition = $this->route(
            'workflowDefinition'
        );

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:80',

                Rule::unique(
                    'workflow_steps',
                    'code'
                )->where(
                    'workflow_definition_id',
                    $workflowDefinition->id
                )->ignore($workflowStep),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'step_order' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                'max:1000',

                Rule::unique(
                    'workflow_steps',
                    'step_order'
                )->where(
                    'workflow_definition_id',
                    $workflowDefinition->id
                )->ignore($workflowStep),
            ],

            'approver_type' => [
                'sometimes',
                'required',

                Rule::in([
                    'role',
                    'employee',
                    'requester_manager',
                    'department_manager',
                ]),
            ],

            'approver_role' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'approver_employee_id' => [
                'sometimes',
                'nullable',
                'integer',

                Rule::exists('employees', 'id')
                    ->where('company_id', $companyId),
            ],

            'approval_mode' => [
                'sometimes',
                'required',

                Rule::in([
                    'any',
                    'all',
                ]),
            ],

            'required_approvals' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                'max:100',
            ],

            'sla_hours' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'max:8760',
            ],

            'can_reject' => [
                'sometimes',
                'boolean',
            ],

            'is_final' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}
