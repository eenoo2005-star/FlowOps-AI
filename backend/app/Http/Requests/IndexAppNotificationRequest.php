<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexAppNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'notifications.view'
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'all',
                    'unread',
                    'read',
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
}
