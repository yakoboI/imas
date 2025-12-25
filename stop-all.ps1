# PowerShell Script to Stop All Services
# Multitenant Inventory System

Write-Host "Stopping Multitenant Inventory System services..." -ForegroundColor Yellow
Write-Host ""

# Stop Node processes (be careful - this stops ALL node processes)
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Cyan
    
    $nodeProcesses | ForEach-Object {
        Write-Host "Stopping process: $($_.Id) - $($_.ProcessName)" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Host "All Node.js processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found running." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Note: This stops ALL Node.js processes." -ForegroundColor Yellow
Write-Host "If you have other Node.js apps running, they will also stop." -ForegroundColor Yellow
Write-Host ""
Write-Host "Alternatively, close the terminal windows manually." -ForegroundColor Gray

