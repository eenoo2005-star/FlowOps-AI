param(
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

Push-Location $ProjectRoot

try {
    docker compose --env-file .env.docker down
} finally {
    Pop-Location
}

Write-Host "FlowOps AI containers stopped. Persistent volumes were preserved." -ForegroundColor Green
