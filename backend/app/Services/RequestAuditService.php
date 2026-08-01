<?php

namespace App\Services;

use App\Models\InternalRequest;
use App\Models\RequestAuditEvent;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

final class RequestAuditService
{
    public function record(
        InternalRequest $internalRequest,
        string $eventType,
        string $summary,
        array $metadata = [],
        ?User $actor = null
    ): RequestAuditEvent {
        $actor ??= Auth::user();

        $httpRequest = app()->bound('request')
            ? request()
            : null;

        return RequestAuditEvent::query()->create([
            'company_id' => $internalRequest->company_id,
            'internal_request_id' => $internalRequest->id,
            'actor_user_id' => $actor?->id,
            'actor_employee_id' => $actor?->employee?->id,
            'actor_name' => $actor?->name,
            'event_type' => $eventType,
            'summary' => $summary,
            'metadata' => $metadata === []
                ? null
                : $metadata,
            'ip_address' => $httpRequest?->ip(),
            'user_agent' => $httpRequest?->userAgent(),
            'occurred_at' => now(),
        ]);
    }
}
