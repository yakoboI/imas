# Setup Local Database for Development
# This script will help you switch from production database to local database

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 Setting Up Local Database for Development" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Add PostgreSQL to PATH
Write-Host "Step 1: Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgVersions = @(18, 17, 16, 15, 14, 13, 12)
$psqlPath = $null

foreach ($version in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $psqlPath = $testPath
        $env:PATH = "C:\Program Files\PostgreSQL\$version\bin;$env:PATH"
        Write-Host "✅ Found PostgreSQL $version" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Step 2: Get PostgreSQL password
Write-Host ""
Write-Host "Step 2: Database Setup" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
$password = Read-Host "Enter your PostgreSQL password (for user 'postgres')" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $plainPassword
$env:PGSSLMODE = "disable"

# Step 3: Check if database exists
Write-Host ""
Write-Host "Step 3: Checking if database exists..." -ForegroundColor Yellow
$dbExists = psql -U postgres -h localhost -lqt 2>&1 | Select-String "inventory_system"

if ($dbExists) {
    Write-Host "✅ Database 'inventory_system' already exists" -ForegroundColor Green
    $createDb = Read-Host "Do you want to recreate it? (WARNING: This will delete all data) [y/N]"
    if ($createDb -eq "y" -or $createDb -eq "Y") {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        psql -U postgres -h localhost -c "DROP DATABASE inventory_system;" 2>&1 | Out-Null
        Write-Host "Creating new database..." -ForegroundColor Yellow
        psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;" 2>&1 | Out-Null
        Write-Host "✅ Database recreated" -ForegroundColor Green
    }
} else {
    Write-Host "Creating database 'inventory_system'..." -ForegroundColor Yellow
    psql -U postgres -h localhost -c "CREATE DATABASE inventory_system;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database. Check your password." -ForegroundColor Red
        $env:PGPASSWORD = $null
        exit 1
    }
}

# Step 4: Run migrations
Write-Host ""
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow
$migrationFile = "backend\src\database\migrations\001_create_tables.sql"
if (Test-Path $migrationFile) {
    psql -U postgres -h localhost -d inventory_system -f $migrationFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some migrations may have failed (this is OK if tables already exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Migration file not found: $migrationFile" -ForegroundColor Yellow
}

# Step 5: Seed initial data
Write-Host ""
Write-Host "Step 5: Seeding initial data (SuperAdmin)..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "src\database\seeds\run.js") {
    node src\database\seeds\run.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Initial data seeded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Seed file not found" -ForegroundColor Yellow
}
Set-Location ..

# Step 6: Update .env file instructions
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📝 IMPORTANT: Update Your .env File" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to manually update backend\.env file:" -ForegroundColor White
Write-Host ""
Write-Host "Change these lines:" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "FROM:" -ForegroundColor Red
Write-Host "  DB_HOST=yamabiko.proxy.rlwy.net" -ForegroundColor Red
Write-Host "  DB_PORT=42342" -ForegroundColor Red
Write-Host "  DB_NAME=railway" -ForegroundColor Red
Write-Host "  DB_SSL=true" -ForegroundColor Red
Write-Host ""
Write-Host "TO:" -ForegroundColor Green
Write-Host "  DB_HOST=localhost" -ForegroundColor Green
Write-Host "  DB_PORT=5432" -ForegroundColor Green
Write-Host "  DB_NAME=inventory_system" -ForegroundColor Green
Write-Host "  DB_USER=postgres" -ForegroundColor Green
Write-Host "  DB_PASSWORD=$plainPassword" -ForegroundColor Green
Write-Host "  DB_SSL=false" -ForegroundColor Green
Write-Host ""
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "After updating .env, restart your backend server:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""

# Clear password
$env:PGPASSWORD = $null

Write-Host "✅ Setup complete! Don't forget to update your .env file." -ForegroundColor Green

