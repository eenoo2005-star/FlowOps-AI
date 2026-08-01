<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreWorkflowStepRequest extends FormRequest
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
        $companyId = $this->user()->company_id;

        $workflowDefinition = $this->route(
            'workflowDefinition'
        );

        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:80',

                Rule::unique(
                    'workflow_steps',
                    'code'
                )->where(
                    'workflow_definition_id',
                    $workflowDefinition->id
                ),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'step_order' => [
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
                ),
            ],

            'approver_type' => [
                'required',
                Rule::in([
                    'role',
                    'employee',
                    'requester_manager',
                    'department_manager',
                ]),
            ],

            'approver_role' => [
                Rule::requiredIf(
                    fn (): bool => $this->input(
                        'approver_type'
                    ) === 'role'
                ),
                'nullable',
                'string',
                'max:100',
            ],

            'approver_employee_id' => [
                Rule::requiredIf(
                    fn (): bool => $this->input(
                        'approver_type'
                    ) === 'employee'
                ),
                'nullable',
                'integer',

                Rule::exists('employees', 'id')
                    ->where('company_id', $companyId),
            ],

            'approval_mode' => [
                'required',
                Rule::in([
                    'any',
                    'all',
                ]),
            ],

            'required_approvals' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],

            'sla_hours' => [
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
