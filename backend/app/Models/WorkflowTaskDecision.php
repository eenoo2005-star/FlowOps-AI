<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use App\Services\RequestAuditService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class WorkflowTaskDecision extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'workflow_task_id',
        'acted_by_user_id',
        'acted_by_employee_id',
        'decision',
        'note',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'workflow_task_id' => 'integer',
            'acted_by_user_id' => 'integer',
            'acted_by_employee_id' => 'integer',
            'acted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);

        self::created(
            static function (
                self $decision
            ): void {
                $decision->loadMissing([
                    'actedByUser',
                    'workflowTask.workflowInstance.internalRequest',
                ]);

                $internalRequest = $decision
                    ->workflowTask
                    ?->workflowInstance
                    ?->internalRequest;

                if ($internalRequest === null) {
                    return;
                }

                $approved =
                    $decision->decision === 'approved';

                app(RequestAuditService::class)->record(
                    $internalRequest,
                    $approved
                        ? 'approval.approved'
                        : 'approval.rejected',
                    $approved
                        ? 'Approval task approved.'
                        : 'Approval task rejected.',
                    [
                        'workflow_task_id' => $decision->workflow_task_id,
                        'workflow_step_id' => $decision->workflowTask
                            ?->workflow_step_id,
                        'note' => $decision->note,
                    ],
                    $decision->actedByUser
                );
            }
        );
    }

    public function workflowTask(): BelongsTo
    {
        return $this->belongsTo(WorkflowTask::class);
    }

    public function actedByUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'acted_by_user_id'
        );
    }

    public function actedByEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'acted_by_employee_id'
        );
    }
}
