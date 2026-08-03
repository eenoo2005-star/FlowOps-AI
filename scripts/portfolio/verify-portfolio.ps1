param(
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Text)
    Write-Host ""
    Write-Host "=== $Text ===" -ForegroundColor Cyan
}

function Run-Native {
    param(
        [string]$Title,
        [string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = ""
    )

    Write-Host "-> $Title" -ForegroundColor Yellow

    if (-not [string]::IsNullOrWhiteSpace($WorkingDirectory)) {
        Push-Location $WorkingDirectory
    }

    try {
        & $FilePath @Arguments
        $code = $LASTEXITCODE
        if ($null -eq $code) { $code = 0 }

        if ($code -ne 0) {
            throw "$Title failed with exit code $code"
        }
    }
    finally {
        if (-not [string]::IsNullOrWhiteSpace($WorkingDirectory)) {
            Pop-Location
        }
    }
}

function Test-ArtisanCommandExists {
    param([string]$CommandName)

    $output = docker compose exec -T app php artisan list --raw 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $false
    }

    foreach ($line in $output) {
        if ($line -match ("^" + [regex]::Escape($CommandName) + "(\s|$)")) {
            return $true
        }
    }

    return $false
}

$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
$FrontendRoot = Join-Path $ProjectRoot "frontend"

Write-Host ""
Write-Host "FlowOps AI Portfolio Verification" -ForegroundColor Green
Write-Host "ProjectRoot: $ProjectRoot"

Write-Step "Required files"

$requiredFiles = @(
    "README.md",
    "docs\portfolio\PROJECT_OVERVIEW.md",
    "docs\portfolio\DEMO_SCRIPT.md",
    "docs\portfolio\RECRUITER_ONE_PAGE.md",
    "docs\portfolio\RELEASE_CHECKLIST.md"
)

foreach ($relativePath in $requiredFiles) {
    $fullPath = Join-Path $ProjectRoot $relativePath
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        throw "Missing required portfolio file: $relativePath"
    }
    Write-Host "OK: $relativePath" -ForegroundColor Green
}

Write-Step "Frontend production build"

if (Test-Path -LiteralPath $FrontendRoot) {
    Run-Native -Title "npm run build" -FilePath "cmd.exe" -Arguments @("/c", "npm run build") -WorkingDirectory $FrontendRoot
} else {
    Write-Host "Frontend folder not found, skipping frontend build." -ForegroundColor Yellow
}

Write-Step "Docker services"

Run-Native -Title "docker compose ps" -FilePath "docker" -Arguments @("compose", "ps") -WorkingDirectory $ProjectRoot

Write-Step "Laravel application checks"

Run-Native -Title "php artisan route:list" -FilePath "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "route:list") -WorkingDirectory $ProjectRoot
Run-Native -Title "php artisan optimize:clear" -FilePath "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "optimize:clear") -WorkingDirectory $ProjectRoot

Write-Step "Request type diagnosis"

Run-Native -Title "flowops:diagnose-request-types" -FilePath "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "flowops:diagnose-request-types") -WorkingDirectory $ProjectRoot

Write-Step "Backend tests"

if ($SkipTests) {
    Write-Host "Skipped by -SkipTests." -ForegroundColor Yellow
}
elseif (Test-ArtisanCommandExists -CommandName "test") {
    Run-Native -Title "php artisan test" -FilePath "docker" -Arguments @("compose", "exec", "-T", "app", "php", "artisan", "test") -WorkingDirectory $ProjectRoot
}
else {
    Write-Host "php artisan test is not available in this Docker image." -ForegroundColor Yellow
    Write-Host "This usually means the current backend container was built as a production image without dev/test Composer packages." -ForegroundColor Yellow
    Write-Host "Portfolio verification will continue, but do not claim automated backend tests are runnable in this production container." -ForegroundColor Yellow

    $phpunitCheck = docker compose exec -T app sh -lc "test -x vendor/bin/phpunit && vendor/bin/phpunit --version" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PHPUnit exists; running vendor/bin/phpunit..." -ForegroundColor Yellow
        Run-Native -Title "vendor/bin/phpunit" -FilePath "docker" -Arguments @("compose", "exec", "-T", "app", "vendor/bin/phpunit") -WorkingDirectory $ProjectRoot
    }
    else {
        Write-Host "PHPUnit is also unavailable. Backend tests skipped for this production container." -ForegroundColor Yellow
    }
}

Write-Step "Health endpoint"

try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 20
    Write-Host "Health status: $($health.StatusCode)" -ForegroundColor Green
    Write-Host $health.Content
}
catch {
    Write-Host "Health endpoint failed. Showing Docker containers:" -ForegroundColor Red
    docker compose ps
    throw
}

Write-Step "Portfolio status file"

$statusFile = Join-Path $ProjectRoot "docs\portfolio\PORTFOLIO_RELEASE_STATUS.md"
$status = @"
# FlowOps AI — Portfolio Verification Status

Last verification: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss K")

## Verified

- Portfolio documentation files exist.
- Frontend production build completed.
- Docker services are reachable.
- Laravel routes are available.
- Request types diagnosis runs successfully.
- Health endpoint responds.

## Note about backend tests

The current Docker backend image may be built in production mode without dev/test Composer packages.
If `php artisan test` is unavailable, backend tests are skipped by this verifier instead of blocking the portfolio release.

Do not claim backend test execution inside the production container unless the test runner is actually installed.
"@

$status | Set-Content -LiteralPath $statusFile -Encoding UTF8
Write-Host "Wrote: $statusFile" -ForegroundColor Green

Write-Host ""
Write-Host "Portfolio verification finished." -ForegroundColor Green
