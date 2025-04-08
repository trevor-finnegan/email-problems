# Get script directory
$SCRIPT_DIR = $PSScriptRoot

# Detect OS and run appropriate script
if ($env:OS -eq 'Windows_NT') {
    Write-Host "Running Windows database setup..." -ForegroundColor Cyan
    Set-Location $SCRIPT_DIR
    .\setup-db.ps1
} else {
    Write-Host "Detected Unix-like system - please run setup-db.sh instead" -ForegroundColor Yellow
    exit 1
}