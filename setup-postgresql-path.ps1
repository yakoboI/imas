# Simple script to add PostgreSQL to PATH
# Run this script and provide your PostgreSQL bin path when prompted

Write-Host "PostgreSQL PATH Setup" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is already available
$psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlCheck) {
    Write-Host "SUCCESS: psql is already in your PATH!" -ForegroundColor Green
    Write-Host "Location: $($psqlCheck.Source)" -ForegroundColor Green
    psql --version
    exit 0
}

Write-Host "psql is not in your PATH. Let's fix that!" -ForegroundColor Yellow
Write-Host ""

# Common locations to check
$commonLocations = @(
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files\PostgreSQL\13\bin",
    "C:\Program Files (x86)\PostgreSQL\18\bin",
    "C:\Program Files (x86)\PostgreSQL\17\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin",
    "C:\Program Files (x86)\PostgreSQL\15\bin"
)

Write-Host "Checking common PostgreSQL locations..." -ForegroundColor Cyan
$foundBin = $null

foreach ($location in $commonLocations) {
    if (Test-Path "$location\psql.exe") {
        $foundBin = $location
        Write-Host "Found PostgreSQL at: $location" -ForegroundColor Green
        break
    }
}

if (-not $foundBin) {
    Write-Host ""
    Write-Host "PostgreSQL bin directory not found automatically." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide the full path to your PostgreSQL 'bin' folder." -ForegroundColor Yellow
    Write-Host "Example: C:\Program Files\PostgreSQL\18\bin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "If PostgreSQL is not installed, download it from:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    
    # Try to find it manually
    $manualPath = Read-Host "Enter PostgreSQL bin path (or press Enter to skip)"
    
    if ($manualPath -and (Test-Path "$manualPath\psql.exe")) {
        $foundBin = $manualPath
    } else {
        Write-Host ""
        Write-Host "Cannot proceed without PostgreSQL bin path." -ForegroundColor Red
        Write-Host "Please install PostgreSQL or provide the correct path." -ForegroundColor Yellow
        exit 1
    }
}

# Add to PATH for current session
Write-Host ""
Write-Host "Adding to PATH for current session..." -ForegroundColor Cyan
$env:PATH = "$foundBin;$env:PATH"

# Test it
Write-Host "Testing psql command..." -ForegroundColor Cyan
try {
    $version = & "$foundBin\psql.exe" --version
    Write-Host ""
    Write-Host "SUCCESS! PostgreSQL is now available." -ForegroundColor Green
    Write-Host "Version: $version" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now use 'psql' commands in this PowerShell session." -ForegroundColor Green
    Write-Host ""
    Write-Host "To make this permanent:" -ForegroundColor Yellow
    Write-Host "1. Open System Properties > Environment Variables" -ForegroundColor Cyan
    Write-Host "2. Edit the 'Path' variable under User variables" -ForegroundColor Cyan
    Write-Host "3. Add this path: $foundBin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or run this command as Administrator:" -ForegroundColor Yellow
    Write-Host "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';$foundBin', 'User')" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Could not run psql. Please verify your PostgreSQL installation." -ForegroundColor Red
}

