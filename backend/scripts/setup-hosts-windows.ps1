# PowerShell script to automatically add localhost subdomain entries
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup-hosts-windows.ps1

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsEntries = @(
    "127.0.0.1 aajminpolyclinic.localhost",
    "127.0.0.1 autoid.localhost",
    "127.0.0.1 testsubdomain.localhost",
    "127.0.0.1 completetesthospital.localhost",
    "127.0.0.1 inactivetest.localhost",
    "127.0.0.1 mdwasimakram.localhost",
    "127.0.0.1 testhospitalapi.localhost"
)

Write-Host "Checking hosts file at: $hostsPath" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Read current hosts file
$hostsContent = Get-Content $hostsPath -Raw

# Add entries if they don't exist
$modified = $false
foreach ($entry in $hostsEntries) {
    if ($hostsContent -notmatch [regex]::Escape($entry)) {
        Write-Host "Adding entry: $entry" -ForegroundColor Green
        Add-Content -Path $hostsPath -Value $entry
        $modified = $true
    } else {
        Write-Host "Entry already exists: $entry" -ForegroundColor Yellow
    }
}

if ($modified) {
    Write-Host "`nHosts file updated successfully!" -ForegroundColor Green
    Write-Host "Flushing DNS cache..." -ForegroundColor Cyan
    ipconfig /flushdns | Out-Null
    Write-Host "DNS cache flushed!" -ForegroundColor Green
} else {
    Write-Host "`nAll entries already exist. No changes needed." -ForegroundColor Yellow
}

Write-Host "`nCurrent localhost subdomain entries:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String "\.localhost"

Write-Host "`nYou can now access:" -ForegroundColor Green
Write-Host "  - http://aajminpolyclinic.localhost:3001" -ForegroundColor White
Write-Host "  - http://autoid.localhost:3001" -ForegroundColor White
Write-Host "  - http://testsubdomain.localhost:3001" -ForegroundColor White
Write-Host "  - http://completetesthospital.localhost:3001" -ForegroundColor White
Write-Host "  - http://inactivetest.localhost:3001" -ForegroundColor White
Write-Host "  - http://mdwasimakram.localhost:3001" -ForegroundColor White
Write-Host "  - http://testhospitalapi.localhost:3001" -ForegroundColor White
