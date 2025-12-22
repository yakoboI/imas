# PowerShell Script to Install All Dependencies
# Multitenant Inventory System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing All Dependencies" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install Root Dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
Set-Location $scriptPath
if (Test-Path "package.json") {
    npm install
    Write-Host "✓ Root dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠ No root package.json found" -ForegroundColor Yellow
}

Write-Host ""

# Install Backend Dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location "$scriptPath\backend"
if (Test-Path "package.json") {
    npm install
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Backend package.json not found!" -ForegroundColor Red
}

Write-Host ""

# Install Web App Dependencies
Write-Host "Installing web app dependencies..." -ForegroundColor Cyan
Set-Location "$scriptPath\frontend\web-app"
if (Test-Path "package.json") {
    npm install
    Write-Host "✓ Web app dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Web app package.json not found!" -ForegroundColor Red
}

Write-Host ""

# Install SuperAdmin Portal Dependencies
Write-Host "Installing SuperAdmin portal dependencies..." -ForegroundColor Cyan
Set-Location "$scriptPath\frontend\superadmin-portal"
if (Test-Path "package.json") {
    npm install
    Write-Host "✓ SuperAdmin portal dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ SuperAdmin portal package.json not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Set up database (see WINDOWS_SETUP.md)" -ForegroundColor Yellow
Write-Host "2. Configure .env file in backend directory" -ForegroundColor Yellow
Write-Host "3. Run: .\start-all.ps1" -ForegroundColor Yellow
Write-Host ""

