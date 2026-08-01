<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RequestComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'internal_request_id',
        'user_id',
        'employee_id',
        'author_name',
        'body',
    ];

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);
    }

    public function internalRequest(): BelongsTo
    {
        return $this->belongsTo(InternalRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
