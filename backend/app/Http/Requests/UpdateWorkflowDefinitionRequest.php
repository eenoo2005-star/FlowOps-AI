<?php

namespace App\Http\Requests;

use App\Models\WorkflowDefinition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateWorkflowDefinitionRequest extends FormRequest
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
        /** @var WorkflowDefinition $workflowDefinition */
        $workflowDefinition = $this->route(
            'workflowDefinition'
        );

        $companyId = $this->user()->company_id;

        $version = (int) $this->input(
            'version',
            $workflowDefinition->version
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
                    'workflow_definitions',
                    'code'
                )->where(
                    fn ($query) => $query
                        ->where('company_id', $companyId)
                        ->where('version', $version)
                )->ignore($workflowDefinition),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'version' => [
                'sometimes',
                'integer',
                'min:1',
                'max:9999',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}
