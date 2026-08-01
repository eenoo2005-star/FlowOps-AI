<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class WorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'workflow_definition_id',
        'name',
        'code',
        'description',
        'step_order',
        'approver_type',
        'approver_role',
        'approver_employee_id',
        'approval_mode',
        'required_approvals',
        'sla_hours',
        'can_reject',
        'is_final',
    ];

    protected function casts(): array
    {
        return [
            'step_order' => 'integer',
            'approver_employee_id' => 'integer',
            'required_approvals' => 'integer',
            'sla_hours' => 'integer',
            'can_reject' => 'boolean',
            'is_final' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);
    }

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function approverEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'approver_employee_id'
        );
    }
}
