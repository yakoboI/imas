# PowerShell script to kill process using a specific port
# Usage: .\kill-port.ps1 5000

param(
    [int]$Port = 5000
)

Write-Host "Checking for process using port $Port..."

# Get process using the port
$process = netstat -ano | findstr ":$Port" | Select-String "LISTENING"

if ($process) {
    $pid = ($process -split '\s+')[-1]
    Write-Host "Found process with PID: $pid"
    
    try {
        taskkill /PID $pid /F
        Write-Host "✅ Successfully killed process $pid"
        Start-Sleep -Seconds 2
        Write-Host "Port $Port is now available"
    } catch {
        Write-Host "❌ Error killing process: $_"
        exit 1
    }
} else {
    Write-Host "No process found using port $Port"
}

