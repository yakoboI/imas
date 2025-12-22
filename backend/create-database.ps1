# PowerShell script to create PostgreSQL database (with SSL disabled for local connections)

Write-Host "🗄️  Creating PostgreSQL Database..." -ForegroundColor Cyan
Write-Host ""

# Prompt for PostgreSQL password
$password = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variables
$env:PGPASSWORD = $plainPassword
$env:PGSSLMODE = "disable"

Write-Host ""
Write-Host "Creating database 'inventory_system'..." -ForegroundColor Yellow

# Try to find psql
$psqlPath = $null
$pgVersions = @(18, 17, 16, 15, 14, 13, 12)

# Search in Program Files
foreach ($version in $pgVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path $testPath) {
        $psqlPath = $testPath
        Write-Host "Found PostgreSQL at: $testPath" -ForegroundColor Green
        break
    }
}

# Search in Program Files (x86)
if (-not $psqlPath) {
    foreach ($version in $pgVersions) {
        $testPath = "C:\Program Files (x86)\PostgreSQL\$version\bin\psql.exe"
        if (Test-Path $testPath) {
            $psqlPath = $testPath
            Write-Host "Found PostgreSQL at: $testPath" -ForegroundColor Green
            break
        }
    }
}

# Search in user's AppData (for portable/standalone installs)
if (-not $psqlPath) {
    $userPgPath = "$env:USERPROFILE\AppData\Local\Programs\PostgreSQL"
    if (Test-Path $userPgPath) {
        $foundDirs = Get-ChildItem $userPgPath -Directory | Sort-Object Name -Descending
        foreach ($dir in $foundDirs) {
            $testPath = Join-Path $dir.FullName "bin\psql.exe"
            if (Test-Path $testPath) {
                $psqlPath = $testPath
                Write-Host "Found PostgreSQL at: $testPath" -ForegroundColor Green
                break
            }
        }
    }
}

# Try using psql from PATH as last resort
if (-not $psqlPath) {
    $psqlPath = "psql"
    Write-Host "⚠️  PostgreSQL not found in common locations. Trying 'psql' from PATH..." -ForegroundColor Yellow
    Write-Host "   If this fails, you'll need to provide the full path to psql.exe" -ForegroundColor Yellow
}

try {
    # Create database
    & $psqlPath -U postgres -h localhost -c "CREATE DATABASE inventory_system;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database 'inventory_system' created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run migrations: psql -U postgres -h localhost -d inventory_system --set=sslmode=disable -f backend\src\database\migrations\001_create_tables.sql"
        Write-Host "  2. Create .env file in backend directory"
        Write-Host "  3. Run: npm run seed (to create SuperAdmin user)"
    } else {
        # Check if database already exists
        $dbExists = & $psqlPath -U postgres -h localhost -lqt 2>&1 | Select-String "inventory_system"
        if ($dbExists) {
            Write-Host ""
            Write-Host "⚠️  Database 'inventory_system' already exists!" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "❌ Failed to create database. Please check your PostgreSQL password and connection." -ForegroundColor Red
        }
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure PostgreSQL is installed and the path is correct." -ForegroundColor Yellow
}

# Clear password from environment
$env:PGPASSWORD = $null

