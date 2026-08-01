<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexWorkflowDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('workflows.view') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => [
                'sometimes',
                'string',
                'max:100',
            ],

            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'all',
                    'active',
                    'inactive',
                ]),
            ],

            'sort' => [
                'sometimes',
                'string',
                Rule::in([
                    'newest',
                    'oldest',
                    'name_asc',
                    'name_desc',
                    'code_asc',
                    'code_desc',
                ]),
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:5',
                'max:100',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('search')) {
            $this->merge([
                'search' => trim((string) $this->input('search')),
            ]);
        }
    }
}
