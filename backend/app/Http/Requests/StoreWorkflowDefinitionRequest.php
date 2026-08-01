<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreWorkflowDefinitionRequest extends FormRequest
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
        $version = (int) $this->input('version', 1);

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
                    'workflow_definitions',
                    'code'
                )->where(
                    fn ($query) => $query
                        ->where('company_id', $companyId)
                        ->where('version', $version)
                ),
            ],

            'description' => [
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
