# Railway Postgres Migration Script
# This script runs the database migration on Railway Postgres

Write-Host "🚀 Running Railway Postgres Migration..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectDir = "C:\Users\Admin\Desktop\imas"
Set-Location $projectDir

# Railway Connection Details (UPDATE THESE WITH YOUR VALUES)
$dbHost = "yamabiko.proxy.rlwy.net"
$dbPort = "42342"
$dbName = "railway"
$dbUser = "postgres"
# ⚠️ REPLACE THIS WITH YOUR ACTUAL PASSWORD FROM RAILWAY
# Click "show" in Railway Connect tab to reveal your password
$dbPassword = "YOUR_PASSWORD_HERE"

# Check if password is set
if ($dbPassword -eq "YOUR_PASSWORD_HERE") {
    Write-Host "❌ ERROR: Please update the password in this script!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your password:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway → Your Postgres Service → Connect tab" -ForegroundColor Yellow
    Write-Host "2. Click 'show' next to 'Connection URL'" -ForegroundColor Yellow
    Write-Host "3. Copy the password and update the `$dbPassword variable in this script" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run this command manually (replace YOUR_PASSWORD):" -ForegroundColor Yellow
    Write-Host "psql `"postgresql://postgres:YOUR_PASSWORD@yamabiko.proxy.rlwy.net:42342/railway?sslmode=require`" -f backend\src\database\migrations\001_create_tables.sql" -ForegroundColor White
    exit 1
}

# Check if migration file exists
$migrationFile = "backend\src\database\migrations\001_create_tables.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found at: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""

# Build connection URL
$connectionUrl = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require"

Write-Host "🔗 Connecting to Railway Postgres..." -ForegroundColor Cyan
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   Port: $dbPort" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host ""

# Run migration
Write-Host "📦 Running migration..." -ForegroundColor Cyan
try {
    psql $connectionUrl -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to Railway → Your Postgres Service → Data tab" -ForegroundColor White
        Write-Host "2. You should now see 17 tables (tenants, users, products, orders, etc.)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed. Check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to run migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Make sure psql is installed and in your PATH" -ForegroundColor White
    Write-Host "- Verify your password is correct" -ForegroundColor White
    Write-Host "- Check your internet connection" -ForegroundColor White
    exit 1
}

