# Script to start PostgreSQL server
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

Write-Host "Starting PostgreSQL Server..." -ForegroundColor Cyan
Write-Host ""

# Method 1: Try to start via service
$serviceNames = @(
    "postgresql-x64-18",
    "postgresql-18", 
    "PostgreSQL-18",
    "postgresql-x64-18 - PostgreSQL Server 18"
)

$started = $false
foreach ($serviceName in $serviceNames) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Found service: $serviceName" -ForegroundColor Green
        if ($service.Status -eq 'Running') {
            Write-Host "PostgreSQL is already running!" -ForegroundColor Green
            $started = $true
            break
        } else {
            try {
                Start-Service -Name $serviceName
                Write-Host "PostgreSQL service started successfully!" -ForegroundColor Green
                $started = $true
                break
            } catch {
                Write-Host "Could not start service: $_" -ForegroundColor Yellow
            }
        }
    }
}

if (-not $started) {
    Write-Host ""
    Write-Host "Could not start PostgreSQL service automatically." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please try one of these methods:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Method 1: Start via Services (Recommended)" -ForegroundColor Yellow
    Write-Host "1. Press Win+R, type: services.msc" -ForegroundColor Cyan
    Write-Host "2. Find 'PostgreSQL' service" -ForegroundColor Cyan
    Write-Host "3. Right-click and select 'Start'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Method 2: Start via Command (Run as Administrator)" -ForegroundColor Yellow
    Write-Host "net start postgresql-x64-18" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Method 3: Check if PostgreSQL is installed as a server" -ForegroundColor Yellow
    Write-Host "You may have only installed client tools. Install full PostgreSQL server if needed." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    $result = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! PostgreSQL is running and accessible." -ForegroundColor Green
    } else {
        Write-Host "Connection failed. Make sure PostgreSQL service is running." -ForegroundColor Red
    }
} catch {
    Write-Host "Could not connect to PostgreSQL." -ForegroundColor Red
}

