<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RequestAuditEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'summary' => $this->summary,
            'metadata' => $this->metadata,
            'actor_name' => $this->actor_name,
            'ip_address' => $this->ip_address,
            'occurred_at' => $this->occurred_at?->toISOString(),
        ];
    }
}
