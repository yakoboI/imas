# Simple script to setup local database
# This script will prompt you for your PostgreSQL password

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Setting Up Local Database" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for PostgreSQL password
Write-Host "Enter your PostgreSQL password (for user 'postgres'):" -ForegroundColor Yellow
$passwordSecure = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
$POSTGRES_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Add PostgreSQL to PATH
$env:PATH = "C:\Program Files\PostgreSQL\18\bin;$env:PATH"
$env:PGPASSWORD = $POSTGRES_PASSWORD
$env:PGSSLMODE = "disable"

Write-Host ""
Write-Host "Step 1: Creating database 'inventory_system'..." -ForegroundColor Yellow
psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Database created successfully" -ForegroundColor Green
} else {
    $dbExists = psql -U postgres -h localhost -lqt 2>&1 | Select-String "inventory_system"
    if ($dbExists) {
        Write-Host "WARNING: Database already exists (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Failed to create database. Check your password." -ForegroundColor Red
        $env:PGPASSWORD = $null
        exit 1
    }
}

Write-Host ""
Write-Host "Step 2: Running migrations..." -ForegroundColor Yellow
psql -U postgres -h localhost -d inventory_system -f backend\src\database\migrations\001_create_tables.sql 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Migrations completed" -ForegroundColor Green
} else {
    Write-Host "WARNING: Some migrations may have failed (OK if tables already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Seeding initial data..." -ForegroundColor Yellow
Set-Location backend
node src\database\seeds\run.js
Set-Location ..

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Update Your .env File" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open backend\.env and change:" -ForegroundColor White
Write-Host ""
Write-Host "  DB_HOST=localhost" -ForegroundColor Green
Write-Host "  DB_PORT=5432" -ForegroundColor Green
Write-Host "  DB_NAME=inventory_system" -ForegroundColor Green
Write-Host "  DB_USER=postgres" -ForegroundColor Green
Write-Host "  DB_PASSWORD=$POSTGRES_PASSWORD" -ForegroundColor Green
Write-Host "  DB_SSL=false" -ForegroundColor Green
Write-Host ""
Write-Host "Then restart your backend: cd backend && npm run dev" -ForegroundColor Cyan
Write-Host ""

# Clear password
$env:PGPASSWORD = $null
