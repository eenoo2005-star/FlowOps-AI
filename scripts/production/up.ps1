param(
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$EnvironmentPath = Join-Path $ProjectRoot ".env.docker"

if (-not (Test-Path -LiteralPath $EnvironmentPath)) {
    throw ".env.docker was not found. Run scripts\production\initialize.ps1 first."
}

Push-Location $ProjectRoot

try {
    docker compose --env-file .env.docker up -d --build
    docker compose --env-file .env.docker ps
} finally {
    Pop-Location
}

Write-Host "FlowOps AI is available at http://localhost:8080" -ForegroundColor Green
