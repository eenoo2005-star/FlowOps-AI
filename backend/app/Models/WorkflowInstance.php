<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class WorkflowInstance extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'internal_request_id',
        'workflow_definition_id',
        'current_workflow_step_id',
        'status',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'internal_request_id' => 'integer',
            'workflow_definition_id' => 'integer',
            'current_workflow_step_id' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);
    }

    public function internalRequest(): BelongsTo
    {
        return $this->belongsTo(InternalRequest::class);
    }

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowDefinition::class
        );
    }

    public function currentWorkflowStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowStep::class,
            'current_workflow_step_id'
        );
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(WorkflowTask::class);
    }
}
