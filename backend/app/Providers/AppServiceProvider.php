<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request): array {
            $email = Str::lower(
                trim((string) $request->input('email'))
            );

            $emailHash = hash('sha256', $email);
            $ipAddress = (string) $request->ip();

            $tooManyAttemptsResponse = static function (
                Request $request,
                array $headers
            ) {
                return response()->json(
                    [
                        'message' => 'Too many login attempts. Please try again later.',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ],
                    429,
                    $headers
                );
            };

            return [
                Limit::perMinute(5)
                    ->by(
                        'login-email-ip-minute:'
                        .$emailHash
                        .'|'
                        .$ipAddress
                    )
                    ->response($tooManyAttemptsResponse),

                Limit::perMinute(20)
                    ->by('login-ip-minute:'.$ipAddress)
                    ->response($tooManyAttemptsResponse),

                Limit::perHour(100)
                    ->by('login-ip-hour:'.$ipAddress)
                    ->response($tooManyAttemptsResponse),
            ];
        });
    }
}