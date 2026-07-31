<?php

namespace App\Http\Resources\Security;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class LoginAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'company' => $this->whenLoaded(
                'company',
                fn (): ?array => $this->company === null
                    ? null
                    : [
                        'id' => $this->company->id,
                        'name' => $this->company->name,
                        'code' => $this->company->code,
                    ]
            ),

            'user' => $this->whenLoaded(
                'user',
                fn (): ?array => $this->user === null
                    ? null
                    : [
                        'id' => $this->user->id,
                        'name' => $this->user->name,
                        'email' => $this->user->email,
                    ]
            ),

            'email_masked' => $this->email_masked,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,

            'was_successful' => (bool) $this->was_successful,
            'failure_reason' => $this->failure_reason,
            'risk_score' => (int) $this->risk_score,

            'location' => [
                'country_code' => $this->country_code,
                'country' => $this->country,
                'region' => $this->region,
                'city' => $this->city,
            ],

            'attempted_at' => $this->attempted_at
                ?->toIso8601String(),

            'created_at' => $this->created_at
                ?->toIso8601String(),
        ];
    }
}
