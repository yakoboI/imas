# PowerShell Script to Install pg_dump (PostgreSQL Client Tools)
# Multitenant Inventory System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installing pg_dump (PostgreSQL Client Tools)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is already available
$pgDumpCheck = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($pgDumpCheck) {
    Write-Host "SUCCESS: pg_dump is already installed!" -ForegroundColor Green
    Write-Host "Location: $($pgDumpCheck.Source)" -ForegroundColor Green
    & pg_dump --version
    Write-Host ""
    Write-Host "pg_dump is ready to use!" -ForegroundColor Green
    exit 0
}

Write-Host "pg_dump is not found. Installing PostgreSQL client tools..." -ForegroundColor Yellow
Write-Host ""

# Check for common package managers
$useWinget = $false
$useChoco = $false

# Check for winget (Windows Package Manager)
$wingetCheck = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetCheck) {
    Write-Host "Found winget (Windows Package Manager)" -ForegroundColor Green
    $useWinget = $true
}

# Check for Chocolatey
$chocoCheck = Get-Command choco -ErrorAction SilentlyContinue
if ($chocoCheck) {
    Write-Host "Found Chocolatey package manager" -ForegroundColor Green
    $useChoco = $true
}

# Installation methods
$installMethod = $null

if ($useWinget) {
    Write-Host ""
    Write-Host "Method 1: Install using winget (Recommended)" -ForegroundColor Cyan
    Write-Host "This will install PostgreSQL client tools automatically." -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Install using winget? (Y/n)"
    if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
        $installMethod = "winget"
    }
}

if (-not $installMethod -and $useChoco) {
    Write-Host ""
    Write-Host "Method 2: Install using Chocolatey" -ForegroundColor Cyan
    Write-Host "This will install PostgreSQL client tools automatically." -ForegroundColor Gray
    Write-Host ""
    $response = Read-Host "Install using Chocolatey? (Y/n)"
    if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
        $installMethod = "choco"
    }
}

# Try automatic installation
if ($installMethod -eq "winget") {
    Write-Host ""
    Write-Host "Installing PostgreSQL client tools using winget..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Install PostgreSQL client tools (command-line tools only)
        winget install --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
        
        Write-Host ""
        Write-Host "Installation completed!" -ForegroundColor Green
        Write-Host "Refreshing PATH..." -ForegroundColor Cyan
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Wait a moment for PATH to update
        Start-Sleep -Seconds 2
        
        # Check common PostgreSQL locations
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
        
        $foundBin = $null
        foreach ($location in $commonLocations) {
            if (Test-Path "$location\pg_dump.exe") {
                $foundBin = $location
                Write-Host "Found pg_dump at: $location" -ForegroundColor Green
                break
            }
        }
        
        if ($foundBin) {
            $env:PATH = "$foundBin;$env:PATH"
            Write-Host ""
            Write-Host "Testing pg_dump..." -ForegroundColor Cyan
            & "$foundBin\pg_dump.exe" --version
            Write-Host ""
            Write-Host "SUCCESS! pg_dump is now available." -ForegroundColor Green
            Write-Host ""
            Write-Host "To make this permanent, add to PATH:" -ForegroundColor Yellow
            Write-Host "$foundBin" -ForegroundColor Cyan
        } else {
            Write-Host "Installation completed, but pg_dump location not found automatically." -ForegroundColor Yellow
            Write-Host "You may need to restart your terminal or add PostgreSQL bin to PATH manually." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "Error installing with winget: $_" -ForegroundColor Red
        Write-Host "Falling back to manual installation instructions..." -ForegroundColor Yellow
        $installMethod = $null
    }
}

if ($installMethod -eq "choco") {
    Write-Host ""
    Write-Host "Installing PostgreSQL client tools using Chocolatey..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Install PostgreSQL (includes client tools)
        choco install postgresql --params '/Password:postgres' -y
        
        Write-Host ""
        Write-Host "Installation completed!" -ForegroundColor Green
        Write-Host "Refreshing PATH..." -ForegroundColor Cyan
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Wait a moment for PATH to update
        Start-Sleep -Seconds 2
        
        # Check for pg_dump
        $pgDumpCheck = Get-Command pg_dump -ErrorAction SilentlyContinue
        if ($pgDumpCheck) {
            Write-Host ""
            Write-Host "SUCCESS! pg_dump is now available." -ForegroundColor Green
            & pg_dump --version
        } else {
            Write-Host "Installation completed, but pg_dump not found in PATH." -ForegroundColor Yellow
            Write-Host "You may need to restart your terminal." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "Error installing with Chocolatey: $_" -ForegroundColor Red
        Write-Host "Falling back to manual installation instructions..." -ForegroundColor Yellow
        $installMethod = $null
    }
}

# Manual installation instructions
if (-not $installMethod) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Manual Installation Instructions" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Download PostgreSQL (Full Installation)" -ForegroundColor Cyan
    Write-Host "1. Visit: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Download the PostgreSQL installer" -ForegroundColor White
    Write-Host "3. During installation, make sure to install 'Command Line Tools'" -ForegroundColor White
    Write-Host "4. After installation, run: .\setup-postgresql-path.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Install using winget (if available)" -ForegroundColor Cyan
    Write-Host "Run this command in PowerShell:" -ForegroundColor White
    Write-Host "  winget install --id PostgreSQL.PostgreSQL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 3: Install using Chocolatey (if available)" -ForegroundColor Cyan
    Write-Host "Run this command in PowerShell (as Administrator):" -ForegroundColor White
    Write-Host "  choco install postgresql" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, run this script again to verify:" -ForegroundColor Cyan
    Write-Host "  .\install-pg-dump.ps1" -ForegroundColor Yellow
    Write-Host ""
}

# Final check
Write-Host ""
Write-Host "Checking if pg_dump is now available..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

$pgDumpCheck = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($pgDumpCheck) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS! pg_dump is installed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Location: $($pgDumpCheck.Source)" -ForegroundColor Green
    & pg_dump --version
    Write-Host ""
    Write-Host "pg_dump is ready to use for database backups!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "pg_dump is not yet available in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you just installed PostgreSQL:" -ForegroundColor Cyan
    Write-Host "1. Close and reopen this terminal" -ForegroundColor White
    Write-Host "2. Or run: .\setup-postgresql-path.ps1" -ForegroundColor White
    Write-Host "3. Or manually add PostgreSQL bin folder to your PATH" -ForegroundColor White
    Write-Host ""
}

