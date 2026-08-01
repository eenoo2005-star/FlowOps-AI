<?php

namespace App\Models;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AppNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'type',
        'title',
        'message',
        'action_url',
        'data',
        'dedupe_key',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new TenantScope);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        if ($this->read_at !== null) {
            return;
        }

        $this->forceFill([
            'read_at' => now(),
        ])->save();
    }
}
