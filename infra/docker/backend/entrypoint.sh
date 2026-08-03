#!/bin/sh
set -eu

APP_USER="www-data"

run_as_app_user() {
    if [ "$(id -u)" = "0" ]; then
        gosu "$APP_USER" "$@"
    else
        "$@"
    fi
}

mkdir -p \
    /var/www/html/storage/app/private \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

if [ "$(id -u)" = "0" ]; then
    chown -R "$APP_USER:$APP_USER" \
        /var/www/html/storage \
        /var/www/html/bootstrap/cache
fi

run_as_app_user php artisan config:cache --no-interaction
run_as_app_user php artisan event:cache --no-interaction

if run_as_app_user php artisan route:cache --no-interaction; then
    echo "Laravel routes cached successfully."
else
    echo "Route caching was skipped because at least one route is not cacheable." >&2
    run_as_app_user php artisan route:clear --no-interaction
fi

run_as_app_user php artisan view:cache --no-interaction

case "${1:-}" in
    php-fpm|php-fpm8.3)
        exec "$@"
        ;;
    *)
        if [ "$(id -u)" = "0" ]; then
            exec gosu "$APP_USER" "$@"
        fi

        exec "$@"
        ;;
esac