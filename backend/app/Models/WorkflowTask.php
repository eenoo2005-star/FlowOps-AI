<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use App\Services\AppNotificationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class WorkflowTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'workflow_instance_id',
        'workflow_step_id',
        'assigned_employee_id',
        'assigned_role',
        'status',
        'due_at',
        'reminder_sent_at',
        'overdue_notified_at',
        'escalation_level',
        'escalated_at',
        'acted_at',
        'acted_by_employee_id',
        'decision_note',
    ];

    protected function casts(): array
    {
        return [
            'workflow_instance_id' => 'integer',
            'workflow_step_id' => 'integer',
            'assigned_employee_id' => 'integer',
            'due_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'overdue_notified_at' => 'datetime',
            'escalation_level' => 'integer',
            'escalated_at' => 'datetime',
            'acted_at' => 'datetime',
            'acted_by_employee_id' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);

        self::created(
            static function (
                self $workflowTask
            ): void {
                app(AppNotificationService::class)
                    ->notifyTaskAssigned(
                        $workflowTask
                    );
            }
        );
    }

    public function workflowInstance(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowInstance::class
        );
    }

    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowStep::class
        );
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'assigned_employee_id'
        );
    }

    public function actedByEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'acted_by_employee_id'
        );
    }

    public function decisions(): HasMany
    {
        return $this
            ->hasMany(WorkflowTaskDecision::class)
            ->orderBy('acted_at');
    }
}
