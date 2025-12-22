# PowerShell Script to Start All Services
# Multitenant Inventory System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Multitenant Inventory System" -ForegroundColor Green
Write-Host "  Starting All Services..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is accessible
try {
    $pgVersion = psql --version 2>&1
    Write-Host "✓ PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "⚠ PostgreSQL not found in PATH (may still work)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "1. Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; Write-Host 'Backend Server' -ForegroundColor Green; Write-Host 'Port: 5000' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Wait for backend to initialize
Start-Sleep -Seconds 5

# Start Web App
Write-Host "2. Starting Web App (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend\web-app'; Write-Host 'Web Application' -ForegroundColor Green; Write-Host 'Port: 3000' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start SuperAdmin Portal
Write-Host "3. Starting SuperAdmin Portal (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend\superadmin-portal'; Write-Host 'SuperAdmin Portal' -ForegroundColor Green; Write-Host 'Port: 3001' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services will open in separate windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access Points:" -ForegroundColor White
Write-Host "  Backend API:    http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Web App:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  SuperAdmin:     http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Health Check:   http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default SuperAdmin Credentials:" -ForegroundColor White
Write-Host "  Email:    admin@inventorysystem.com" -ForegroundColor Yellow
Write-Host "  Password: ChangeThisPassword123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

