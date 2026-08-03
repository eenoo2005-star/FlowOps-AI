param(
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

Push-Location $ProjectRoot

try {
    docker compose --env-file .env.docker ps

    $Health = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get

    if ($Health.data.status -ne "healthy") {
        throw "Application health endpoint reported: $($Health.data.status)"
    }

    Write-Host "Application health: healthy" -ForegroundColor Green

    docker compose --env-file .env.docker exec -T app php artisan migrate:status
    docker compose --env-file .env.docker exec -T app php artisan schedule:list
    docker compose --env-file .env.docker exec -T app php artisan queue:failed
} finally {
    Pop-Location
}
