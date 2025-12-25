# Script to find and add PostgreSQL to PATH
Write-Host "Searching for PostgreSQL installation..." -ForegroundColor Cyan

# Common PostgreSQL installation paths
$possiblePaths = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:LOCALAPPDATA\PostgreSQL",
    "$env:ProgramFiles\PostgreSQL"
)

$foundPath = $null
$psqlPath = $null

# Search for PostgreSQL installation
foreach ($basePath in $possiblePaths) {
    if (Test-Path $basePath) {
        Write-Host "Found PostgreSQL directory: $basePath" -ForegroundColor Green
        
        # Look for version directories (e.g., 15, 16, 17)
        $versionDirs = Get-ChildItem $basePath -Directory -ErrorAction SilentlyContinue | 
            Where-Object { $_.Name -match '^\d+$' } | 
            Sort-Object Name -Descending
        
        if ($versionDirs) {
            $latestVersion = $versionDirs[0].Name
            $binPath = Join-Path $basePath $latestVersion "bin"
            
            if (Test-Path (Join-Path $binPath "psql.exe")) {
                $foundPath = $binPath
                $psqlPath = Join-Path $binPath "psql.exe"
                Write-Host "Found psql.exe at: $psqlPath" -ForegroundColor Green
                break
            }
        }
    }
}

if (-not $foundPath) {
    Write-Host "PostgreSQL not found in common locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose an option:" -ForegroundColor Yellow
    Write-Host "1. If PostgreSQL is installed, provide the full path to the 'bin' folder"
    Write-Host "2. If PostgreSQL is NOT installed, download it from:" -ForegroundColor Cyan
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    
    $userPath = Read-Host "Enter PostgreSQL bin path (or press Enter to exit)"
    if ($userPath -and (Test-Path (Join-Path $userPath "psql.exe"))) {
        $foundPath = $userPath
        $psqlPath = Join-Path $userPath "psql.exe"
    } else {
        Write-Host "Invalid path or psql.exe not found." -ForegroundColor Red
        exit 1
    }
}

# Add to PATH for current session
Write-Host ""
Write-Host "Adding PostgreSQL to PATH for current session..." -ForegroundColor Cyan
$env:PATH = "$foundPath;$env:PATH"

# Verify it works
Write-Host ""
Write-Host "Testing psql command..." -ForegroundColor Cyan
$versionOutput = & $psqlPath --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! PostgreSQL version: $versionOutput" -ForegroundColor Green
    Write-Host ""
    Write-Host "PostgreSQL is now available in this PowerShell session." -ForegroundColor Green
    Write-Host ""
    Write-Host "To make this permanent, run this command as Administrator:" -ForegroundColor Yellow
    Write-Host '[Environment]::SetEnvironmentVariable("Path", $env:PATH, "User")' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or manually add this to your PATH:" -ForegroundColor Yellow
    Write-Host "$foundPath" -ForegroundColor Cyan
} else {
    Write-Host "Error running psql. Please check your PostgreSQL installation." -ForegroundColor Red
}
