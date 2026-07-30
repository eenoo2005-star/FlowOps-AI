<?php

namespace App\Observers;

use App\Jobs\EnrichLoginAttemptLocation;
use App\Models\LoginAttempt;

final class LoginAttemptObserver
{
    public function created(LoginAttempt $loginAttempt): void
    {
        if (! (bool) config('ip_geolocation.enabled')) {
            return;
        }

        EnrichLoginAttemptLocation::dispatch(
            $loginAttempt->getKey()
        )->onQueue(
            (string) config('ip_geolocation.queue', 'security')
        );
    }
}