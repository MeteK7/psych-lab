# Runs every level-A local check. Exit code 0 only if all pass.
#   powershell -File scripts/check.ps1

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
# Never let uv download a Python interpreter implicitly.
$env:UV_PYTHON_DOWNLOADS = 'never'

$results = @()

function Invoke-Check([string]$name, [string]$dir, [scriptblock]$command) {
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    Push-Location $dir
    try {
        & $command
        $ok = ($LASTEXITCODE -eq 0)
    } catch {
        Write-Host $_ -ForegroundColor Red
        $ok = $false
    } finally {
        Pop-Location
    }
    $script:results += [pscustomobject]@{ Check = $name; Result = $(if ($ok) { 'PASS' } else { 'FAIL' }) }
}

Invoke-Check 'api: ruff lint'   "$root\api" { uv run ruff check . }
Invoke-Check 'api: ruff format' "$root\api" { uv run ruff format --check . }
Invoke-Check 'api: pytest'      "$root\api" { uv run pytest }
Invoke-Check 'analysis: ruff lint'   "$root\analysis" { uv run ruff check . }
Invoke-Check 'analysis: ruff format' "$root\analysis" { uv run ruff format --check . }
Invoke-Check 'analysis: pytest'      "$root\analysis" { uv run pytest }
Invoke-Check 'web: unit tests'  "$root\web" { npx ng test --watch=false }
Invoke-Check 'web: build'       "$root\web" { npx ng build }

Write-Host ''
$results | Format-Table -AutoSize
if ($results.Result -contains 'FAIL') { exit 1 } else { exit 0 }
