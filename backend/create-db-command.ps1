# Quick command to create database with PostgreSQL 18
# Usage: Run this script or copy the commands below

Write-Host "🗄️  Creating PostgreSQL Database (v18)..." -ForegroundColor Cyan
Write-Host ""

# Set PostgreSQL path
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Prompt for password
$password = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variables
$env:PGPASSWORD = $plainPassword
$env:PGSSLMODE = "disable"

Write-Host ""
Write-Host "Creating database 'inventory_system'..." -ForegroundColor Yellow

# Create database
& $psqlPath -U postgres -h localhost -c "CREATE DATABASE inventory_system;"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database 'inventory_system' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run migrations (see command below)" -ForegroundColor White
    Write-Host "  2. Create .env file in backend directory" -ForegroundColor White
    Write-Host "  3. Run: npm run seed" -ForegroundColor White
} else {
    # Check if database already exists
    $output = & $psqlPath -U postgres -h localhost -lqt 2>&1 | Select-String "inventory_system"
    if ($output) {
        Write-Host ""
        Write-Host "⚠️  Database 'inventory_system' already exists!" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Failed to create database. Please check your password." -ForegroundColor Red
    }
}

# Clear password
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "To run migrations, use:" -ForegroundColor Cyan
Write-Host "  & `"$psqlPath`" -U postgres -h localhost -d inventory_system --set=sslmode=disable -f backend\src\database\migrations\001_create_tables.sql" -ForegroundColor White

