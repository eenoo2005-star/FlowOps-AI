<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateInternalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'payload' => [
                'sometimes',
                'nullable',
                'array',
            ],

            'priority' => [
                'sometimes',
                'required',

                Rule::in([
                    'low',
                    'normal',
                    'high',
                    'urgent',
                ]),
            ],
        ];
    }
}
