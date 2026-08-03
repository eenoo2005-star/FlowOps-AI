<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use App\Services\RequestAuditService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class InternalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'request_type_id',
        'workflow_definition_id',
        'requester_employee_id',
        'created_by_user_id',
        'on_behalf_of_reason',
        'current_workflow_step_id',
        'reference_number',
        'title',
        'description',
        'payload',
        'priority',
        'status',
        'submitted_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'request_type_id' => 'integer',
            'workflow_definition_id' => 'integer',
            'requester_employee_id' => 'integer',
            'created_by_user_id' => 'integer',
            'current_workflow_step_id' => 'integer',
            'payload' => 'array',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);

        self::created(
            static function (
                self $internalRequest
            ): void {
                app(RequestAuditService::class)->record(
                    $internalRequest,
                    'request.created',
                    'Request draft created.',
                    [
                        'reference_number' => $internalRequest
                            ->reference_number,
                        'created_by_user_id' => $internalRequest->created_by_user_id,
                        'requester_employee_id' => $internalRequest->requester_employee_id,
                        'on_behalf_of_reason' => $internalRequest->on_behalf_of_reason,
                    ]
                );
            }
        );

        self::updated(
            static function (
                self $internalRequest
            ): void {
                $changedFields = collect(
                    array_keys(
                        $internalRequest->getChanges()
                    )
                )
                    ->reject(
                        fn (string $field): bool => $field === 'updated_at'
                    )
                    ->values()
                    ->all();

                if ($changedFields === []) {
                    return;
                }

                $eventType = 'request.updated';
                $summary = 'Request details updated.';

                if (
                    $internalRequest->wasChanged('status')
                ) {
                    [$eventType, $summary] = match (
                        $internalRequest->status
                    ) {
                        'in_review' => [
                            'request.submitted',
                            'Request submitted for approval.',
                        ],
                        'approved' => [
                            'request.approved',
                            'Request completed as approved.',
                        ],
                        'rejected' => [
                            'request.rejected',
                            'Request completed as rejected.',
                        ],
                        'cancelled' => [
                            'request.cancelled',
                            'Request cancelled.',
                        ],
                        default => [
                            'request.status_changed',
                            'Request status changed.',
                        ],
                    };
                }

                app(RequestAuditService::class)->record(
                    $internalRequest,
                    $eventType,
                    $summary,
                    [
                        'changed_fields' => $changedFields,
                        'status' => $internalRequest->status,
                    ]
                );
            }
        );

        self::deleting(
            static function (
                self $internalRequest
            ): void {
                app(RequestAuditService::class)->record(
                    $internalRequest,
                    'request.deleted',
                    'Request draft deleted.'
                );
            }
        );
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowDefinition::class
        );
    }

    public function requesterEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'requester_employee_id'
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function currentWorkflowStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowStep::class,
            'current_workflow_step_id'
        );
    }

    public function workflowInstance(): HasOne
    {
        return $this->hasOne(WorkflowInstance::class);
    }

    public function comments(): HasMany
    {
        return $this
            ->hasMany(RequestComment::class)
            ->latest();
    }

    public function attachments(): HasMany
    {
        return $this
            ->hasMany(RequestAttachment::class)
            ->latest();
    }

    public function auditEvents(): HasMany
    {
        return $this
            ->hasMany(RequestAuditEvent::class)
            ->latest('occurred_at');
    }
}
