<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RequestAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'internal_request_id',
        'uploaded_by_user_id',
        'uploaded_by_employee_id',
        'uploaded_by_name',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'sha256',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
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

    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'uploaded_by_user_id'
        );
    }

    public function uploadedByEmployee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'uploaded_by_employee_id'
        );
    }
}
