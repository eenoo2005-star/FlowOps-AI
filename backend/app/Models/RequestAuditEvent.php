<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

final class RequestAuditEvent extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'company_id',
        'internal_request_id',
        'actor_user_id',
        'actor_employee_id',
        'actor_name',
        'event_type',
        'summary',
        'metadata',
        'ip_address',
        'user_agent',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);

        self::updating(
            static function (): never {
                throw new LogicException(
                    'Audit events are immutable.'
                );
            }
        );

        self::deleting(
            static function (): never {
                throw new LogicException(
                    'Audit events cannot be deleted.'
                );
            }
        );
    }

    public function internalRequest(): BelongsTo
    {
        return $this->belongsTo(InternalRequest::class);
    }

    public function actorUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'actor_user_id'
        );
    }

    public function actorEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'actor_employee_id'
        );
    }
}
