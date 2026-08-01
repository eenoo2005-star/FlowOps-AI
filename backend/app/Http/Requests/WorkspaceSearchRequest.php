<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class WorkspaceSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'q' => trim((string) $this->input('q')),
        ]);
    }

    public function rules(): array
    {
        return [
            'q' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],
            'limit' => [
                'sometimes',
                'integer',
                'min:1',
                'max:8',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'q.min' => 'Enter at least two characters to search the workspace.',
        ];
    }
}
