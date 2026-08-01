<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexWorkflowTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('workflow-tasks.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:100'],
            'status' => ['sometimes', 'string', Rule::in(['all', 'pending', 'approved', 'rejected'])],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('search')) {
            $this->merge(['search' => trim((string) $this->input('search'))]);
        }
    }
}
