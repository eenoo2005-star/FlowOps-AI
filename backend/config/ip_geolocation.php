<?php

return [
    /*
    |--------------------------------------------------------------------------
    | IP Geolocation
    |--------------------------------------------------------------------------
    |
    | Disabled by default because enabling an external provider means that
    | public IP addresses will be sent to that provider.
    |
    */

    'enabled' => filter_var(
        env('IP_GEOLOCATION_ENABLED', false),
        FILTER_VALIDATE_BOOL
    ),

    'provider' => env('IP_GEOLOCATION_PROVIDER', 'ipwhois'),

    'queue' => env('IP_GEOLOCATION_QUEUE', 'security'),

    'cache_store' => env('IP_GEOLOCATION_CACHE_STORE', 'file'),

    'cache_ttl_seconds' => (int) env(
        'IP_GEOLOCATION_CACHE_TTL_SECONDS',
        604800
    ),

    'negative_cache_ttl_seconds' => (int) env(
        'IP_GEOLOCATION_NEGATIVE_CACHE_TTL_SECONDS',
        3600
    ),

    'http' => [
        'base_url' => env(
            'IP_GEOLOCATION_BASE_URL',
            'https://ipwho.is'
        ),

        'timeout_seconds' => (int) env(
            'IP_GEOLOCATION_TIMEOUT_SECONDS',
            4
        ),

        'connect_timeout_seconds' => (int) env(
            'IP_GEOLOCATION_CONNECT_TIMEOUT_SECONDS',
            2
        ),
    ],
];