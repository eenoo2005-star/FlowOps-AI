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

            $blockedResponse = static function (
                Request $request,
                array $headers
            ) {
                return response()->json([
                    'message' => 'Too many login attempts. Sign-in has been temporarily suspended.',
                ], 429);
            };

            return [
                // يحمي الحساب من هجوم موزع من عدة عناوين IP.
                Limit::perMinute(5)
                    ->by('login-account-minute:'.$emailHash)
                    ->response($blockedResponse),

                // يمنع عنوان IP واحدًا من تجربة حسابات كثيرة.
                Limit::perMinute(20)
                    ->by('login-ip-minute:'.$ipAddress)
                    ->response($blockedResponse),

                // يمنع الهجمات البطيئة المستمرة.
                Limit::perHour(100)
                    ->by('login-ip-hour:'.$ipAddress)
                    ->response($blockedResponse),
            ];
        });
    }
}