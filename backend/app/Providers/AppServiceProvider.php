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

            return [
                // يمنع التكرار على نفس الحساب من نفس المصدر.
                Limit::perMinute(5)
                    ->by('login-email-ip:'.$email.'|'.$request->ip()),

                // يمنع عنوان IP من تجربة حسابات كثيرة.
                Limit::perMinute(20)
                    ->by('login-ip-minute:'.$request->ip()),

                // يمنع الهجوم البطيء المستمر.
                Limit::perHour(100)
                    ->by('login-ip-hour:'.$request->ip()),
            ];
        });
    }
}