# Script to Fix Local .env File - Point to Local Database Instead of Production
# This prevents local changes from affecting production

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  Fixing Local .env File" -ForegroundColor Green
Write-Host "  Switching from Production to Local Database" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ ERROR: .env file not found at:" -ForegroundColor Red
    Write-Host "   $envPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Please create .env file first using create-env.ps1" -ForegroundColor Yellow
    exit 1
}

# Read current .env file
$envContent = Get-Content $envPath -Raw

# Check if already pointing to localhost or production
$isProduction = $envContent -match "DB_HOST=.*\.proxy\.rlwy\.net"
$isLocal = $envContent -match "DB_HOST=localhost"
$continue = "N"

if ($isLocal -and -not $isProduction) {
    Write-Host "✅ .env file already points to localhost!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current database configuration:" -ForegroundColor Cyan
    $envContent | Select-String -Pattern "DB_HOST|DB_PORT|DB_NAME|DB_SSL" | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
    Write-Host ""
    $continue = Read-Host "Do you want to update it anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit
    }
}

# Get PostgreSQL password (only if converting from production or updating)
if ($isProduction -or $continue -eq "y" -or $continue -eq "Y") {
    Write-Host ""
    Write-Host "Enter your LOCAL PostgreSQL password:" -ForegroundColor Cyan
    Write-Host "(This is the password for your local PostgreSQL installation)" -ForegroundColor Gray
    $dbPassword = Read-Host -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
}

# Backup original .env file
$backupPath = "$envPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $envPath $backupPath
Write-Host ""
Write-Host "✅ Backup created: $(Split-Path $backupPath -Leaf)" -ForegroundColor Green

# Replace production database config with local config
# Only replace if currently pointing to Railway (production)
if ($isProduction) {
    # Replace production Railway host with localhost
    $envContent = $envContent -replace "DB_HOST=.*\.proxy\.rlwy\.net", "DB_HOST=localhost"
    $envContent = $envContent -replace "DB_PORT=42342", "DB_PORT=5432"
    $envContent = $envContent -replace "DB_NAME=railway", "DB_NAME=inventory_system"
    # Replace any existing DB_PASSWORD value with local password (no hardcoded password!)
    if ($envContent -match "DB_PASSWORD=") {
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$dbPasswordPlain"
    } else {
        $envContent = $envContent + "`nDB_PASSWORD=$dbPasswordPlain"
    }
    $envContent = $envContent -replace "DB_SSL=true", "DB_SSL=false"
} elseif ($isLocal -and $shouldUpdate) {
    # If already local and user wants to update, just update the password
    if ($envContent -match "DB_PASSWORD=") {
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$dbPasswordPlain"
    }
}

# Ensure NODE_ENV is development
$envContent = $envContent -replace "NODE_ENV=production", "NODE_ENV=development"
if ($envContent -notmatch "NODE_ENV=") {
    # Add NODE_ENV if not present
    $envContent = "NODE_ENV=development`n" + $envContent
}

# Write updated content
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "New database configuration:" -ForegroundColor Cyan
Write-Host "   DB_HOST=localhost" -ForegroundColor White
Write-Host "   DB_PORT=5432" -ForegroundColor White
Write-Host "   DB_NAME=inventory_system" -ForegroundColor White
Write-Host "   DB_SSL=false" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   1. Make sure PostgreSQL is running locally" -ForegroundColor White
Write-Host "   2. Make sure database 'inventory_system' exists" -ForegroundColor White
Write-Host "   3. Restart your server after this change" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify local database exists:" -ForegroundColor White
Write-Host "      psql -U postgres -l | Select-String 'inventory_system'" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. If database doesn't exist, create it:" -ForegroundColor White
Write-Host "      psql -U postgres -c 'CREATE DATABASE inventory_system;'" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Run migrations:" -ForegroundColor White
Write-Host "      psql -U postgres -d inventory_system -f src\database\migrations\001_create_tables.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Restart your server:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""



