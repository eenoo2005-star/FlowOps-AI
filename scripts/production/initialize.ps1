param(
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

$ExamplePath = Join-Path $ProjectRoot ".env.docker.example"
$EnvironmentPath = Join-Path $ProjectRoot ".env.docker"

if (-not (Test-Path -LiteralPath $ExamplePath)) {
    throw "Docker environment example was not found: $ExamplePath"
}

function New-RandomBytes {
    param([int]$Count)

    $Bytes = New-Object byte[] $Count
    $Generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $Generator.GetBytes($Bytes)
    } finally {
        $Generator.Dispose()
    }

    return $Bytes
}

if (-not (Test-Path -LiteralPath $EnvironmentPath)) {
    Copy-Item -LiteralPath $ExamplePath -Destination $EnvironmentPath

    $Content = [System.IO.File]::ReadAllText($EnvironmentPath)
    $AppKey = "base64:" + [Convert]::ToBase64String((New-RandomBytes -Count 32))
    $DatabasePassword = ([System.BitConverter]::ToString((New-RandomBytes -Count 24))).Replace("-", "").ToLowerInvariant()

    $Content = [regex]::Replace($Content, "(?m)^APP_KEY=.*$", "APP_KEY=" + $AppKey)
    $Content = [regex]::Replace($Content, "(?m)^DB_PASSWORD=.*$", "DB_PASSWORD=" + $DatabasePassword)
    $Content = [regex]::Replace($Content, "(?m)^POSTGRES_PASSWORD=.*$", "POSTGRES_PASSWORD=" + $DatabasePassword)

    $Encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($EnvironmentPath, $Content, $Encoding)

    Write-Host "Created .env.docker with generated application and database secrets." -ForegroundColor Green
} else {
    Write-Host ".env.docker already exists and was not modified." -ForegroundColor Yellow
}

Push-Location $ProjectRoot

try {
    docker info | Out-Null
    docker compose --env-file .env.docker config --quiet
} finally {
    Pop-Location
}

Write-Host "Docker configuration is valid." -ForegroundColor Green
Write-Host "Run scripts\production\up.ps1 to build and start FlowOps AI." -ForegroundColor Cyan
