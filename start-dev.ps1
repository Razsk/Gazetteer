# Start-DevServer.ps1 - Gazetteer Development Server Launcher
[CmdletBinding()]
param (
    [int]$Port = 3000,
    [switch]$NoBrowser
)

Set-Location -Path $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       Gazetteer - Starting Development Server    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verify node / npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Error: npm was not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[!] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Dependency installation failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

$url = "http://localhost:$Port"
Write-Host "[+] Target URL: $url" -ForegroundColor Green

if (-not $NoBrowser) {
    Write-Host "[+] Browser will open at $url..." -ForegroundColor Gray
    Start-Job -ScriptBlock {
        param($targetUrl)
        Start-Sleep -Seconds 2
        Start-Process $targetUrl
    } -ArgumentList $url | Out-Null
}

Write-Host "[+] Starting Next.js dev server on port $Port..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

if ($Port -eq 3000) {
    npm run dev
} else {
    npx next dev -p $Port
}
