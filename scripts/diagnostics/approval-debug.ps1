param(
    [string]$ProjectRoot = "C:\Projects\FlowOps-AI"
)

$ErrorActionPreference = "Continue"
Set-StrictMode -Version Latest

if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
    throw "Project folder not found: $ProjectRoot"
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
Push-Location $ProjectRoot
try {
    Write-Host "=== Approval diagnosis ===" -ForegroundColor Cyan
    docker compose exec -T app php artisan flowops:diagnose-approval-task

    Write-Host ""
    Write-Host "=== Recent Laravel errors ===" -ForegroundColor Cyan
    docker compose exec -T app sh -lc "if [ -f storage/logs/laravel.log ]; then tail -n 180 storage/logs/laravel.log; else echo 'No laravel.log file found'; fi"

    Write-Host ""
    Write-Host "=== App container logs ===" -ForegroundColor Cyan
    docker compose logs --tail=120 app
}
finally {
    Pop-Location
}
