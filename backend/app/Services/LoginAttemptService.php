<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LoginAttemptService
{
    public function record(
        Request $request,
        string $email,
        ?User $user,
        bool $wasSuccessful,
        ?string $failureReason = null
    ): LoginAttempt {
        $normalizedEmail = Str::lower(trim($email));
        $userAgent = $request->userAgent();

        return LoginAttempt::create([
            'company_id' => $user?->company_id,
            'user_id' => $user?->id,

            'email_hash' => hash(
                'sha256',
                $normalizedEmail
            ),

            'email_masked' => $this->maskEmail(
                $normalizedEmail
            ),

            'ip_address' => (string) (
                $request->ip() ?? 'unknown'
            ),

            'user_agent' => is_string($userAgent)
                ? mb_substr($userAgent, 0, 2000)
                : null,

            'was_successful' => $wasSuccessful,
            'failure_reason' => $failureReason,

            'risk_score' => $this->calculateRiskScore(
                $wasSuccessful,
                $failureReason
            ),

            'attempted_at' => now(),
        ]);
    }

    private function maskEmail(string $email): string
    {
        if (! str_contains($email, '@')) {
            return '***';
        }

        [$localPart, $domain] = explode('@', $email, 2);

        $firstCharacter = mb_substr($localPart, 0, 1);

        return $firstCharacter.'***@'.$domain;
    }

    private function calculateRiskScore(
        bool $wasSuccessful,
        ?string $failureReason
    ): int {
        if ($wasSuccessful) {
            return 0;
        }

        return match ($failureReason) {
            'company_inactive' => 50,
            'invalid_credentials' => 25,
            default => 20,
        };
    }
}