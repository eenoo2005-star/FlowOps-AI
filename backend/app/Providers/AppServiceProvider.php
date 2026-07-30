<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use App\Contracts\IpGeolocationService;
use App\Models\LoginAttempt;
use App\Observers\LoginAttemptObserver;
use App\Services\IpGeolocation\CachedIpGeolocationService;
use App\Services\IpGeolocation\IpWhoIsGeolocationService;
use App\Services\IpGeolocation\NullIpGeolocationService;
use Illuminate\Cache\CacheManager;
use Illuminate\Contracts\Foundation\Application;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
{
    $this->app->bind(
        IpGeolocationService::class,
        function (Application $app): IpGeolocationService {
            if (! (bool) config('ip_geolocation.enabled')) {
                return new NullIpGeolocationService();
            }

            $providerName = (string) config(
                'ip_geolocation.provider',
                'ipwhois'
            );

            $provider = match ($providerName) {
                'ipwhois' => new IpWhoIsGeolocationService(
                    baseUrl: (string) config(
                        'ip_geolocation.http.base_url'
                    ),

                    timeoutSeconds: (int) config(
                        'ip_geolocation.http.timeout_seconds',
                        4
                    ),

                    connectTimeoutSeconds: (int) config(
                        'ip_geolocation.http.connect_timeout_seconds',
                        2
                    ),
                ),

                default => throw new \InvalidArgumentException(
                    "Unsupported IP geolocation provider: {$providerName}"
                ),
            };

            $configuredCacheStore = config(
                'ip_geolocation.cache_store'
            );

            $cacheStore = is_string($configuredCacheStore)
                && $configuredCacheStore !== ''
                    ? $configuredCacheStore
                    : null;

            $cache = $app
                ->make(CacheManager::class)
                ->store($cacheStore);

            return new CachedIpGeolocationService(
                innerService: $provider,
                cache: $cache,

                cacheTtlSeconds: (int) config(
                    'ip_geolocation.cache_ttl_seconds',
                    604800
                ),

                negativeCacheTtlSeconds: (int) config(
                    'ip_geolocation.negative_cache_ttl_seconds',
                    3600
                ),
            );
        }
    );
}

    public function boot(): void
    {
        LoginAttempt::observe(LoginAttemptObserver::class);
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