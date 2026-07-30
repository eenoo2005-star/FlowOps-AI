<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAttempt extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'email_hash',
        'email_masked',
        'ip_address',
        'user_agent',
        'was_successful',
        'failure_reason',
        'country_code',
        'country',
        'region',
        'city',
        'risk_score',
        'attempted_at',
    ];

    protected function casts(): array
    {
        return [
            'was_successful' => 'boolean',
            'risk_score' => 'integer',
            'attempted_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}