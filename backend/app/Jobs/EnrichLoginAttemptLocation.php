<?php

namespace App\Jobs;

use App\Contracts\IpGeolocationService;
use App\Models\LoginAttempt;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class EnrichLoginAttemptLocation implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 10;

    public bool $failOnTimeout = true;

    public function __construct(
        public readonly int $loginAttemptId
    ) {
    }

    public function handle(
        IpGeolocationService $geolocationService
    ): void {
        if (! (bool) config('ip_geolocation.enabled')) {
            return;
        }

        $loginAttempt = LoginAttempt::query()->find(
            $this->loginAttemptId
        );

        if ($loginAttempt === null) {
            return;
        }

        /*
         * The job is idempotent: it does not overwrite an already enriched
         * login attempt if it is retried or dispatched more than once.
         */
        if (
            $loginAttempt->country_code !== null
            || $loginAttempt->country !== null
            || $loginAttempt->region !== null
            || $loginAttempt->city !== null
        ) {
            return;
        }

        $ipAddress = trim((string) $loginAttempt->ip_address);

        if (! $this->isPublicIpAddress($ipAddress)) {
            return;
        }

        $location = $geolocationService->lookup($ipAddress);

        if ($location === null || $location->isEmpty()) {
            return;
        }

        $loginAttempt->forceFill([
            'country_code' => $location->countryCode,
            'country' => $location->country,
            'region' => $location->region,
            'city' => $location->city,
        ])->save();
    }

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function failed(?Throwable $exception): void
    {
        Log::warning(
            'Login attempt IP geolocation enrichment failed.',
            [
                'login_attempt_id' => $this->loginAttemptId,
                'exception_class' => $exception?->getMessage() !== null
                    ? $exception::class
                    : null,
            ]
        );
    }

    private function isPublicIpAddress(string $ipAddress): bool
    {
        if ($ipAddress === '') {
            return false;
        }

        return filter_var(
            $ipAddress,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }
}