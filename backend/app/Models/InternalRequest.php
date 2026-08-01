<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class InternalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'request_type_id',
        'workflow_definition_id',
        'requester_employee_id',
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
}
