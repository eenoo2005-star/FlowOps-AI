# Production Readiness

This stage packages FlowOps AI as a containerized application and adds automated quality gates.

## Services

- `web`: Nginx serving the React production build and forwarding `/api/*` to PHP-FPM.
- `app`: Laravel PHP-FPM runtime.
- `worker`: database queue worker processing `security` before `default`.
- `scheduler`: Laravel scheduler process.
- `migrate`: one-shot migration service.
- `database`: PostgreSQL 18.
- `redis`: cache and session storage.

## First Run on Windows

```bat
cd /d C:\Projects\FlowOps-AI
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\initialize.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\up.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\verify.ps1
```

Open `http://localhost:8080`.

## Environment

`.env.docker` is generated locally and ignored by Git. Never commit it. The committed `.env.docker.example` contains placeholders only.

For a real HTTPS domain, update at minimum:

- `APP_URL`
- `SANCTUM_STATEFUL_DOMAINS`
- `SESSION_DOMAIN`
- `SESSION_SECURE_COOKIE=true`
- `DB_SSLMODE`
- mail settings

## Operations

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\up.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\verify.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production\down.ps1
```

Inspect logs:

```bat
docker compose --env-file .env.docker logs -f web app worker scheduler
```

Run Artisan:

```bat
docker compose --env-file .env.docker exec app php artisan about
```

The named database and storage volumes are preserved by `down`. Do not use `down -v` unless intentionally deleting all container data.

## CI

The GitHub Actions workflow runs:

1. Composer validation, Pint, and the SQLite test suite.
2. The full backend suite against PostgreSQL.
3. Frontend ESLint and production build.
4. Secret scanning.
5. Production Docker image builds.
