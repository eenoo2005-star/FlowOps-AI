<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class RequestType extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'workflow_definition_id',
        'name',
        'code',
        'description',
        'instructions',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'workflow_definition_id' => 'integer',
            'is_active' => 'boolean',
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

    public function workflowDefinition(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowDefinition::class
        );
    }

    public function internalRequests(): HasMany
    {
        return $this->hasMany(InternalRequest::class);
    }
}
