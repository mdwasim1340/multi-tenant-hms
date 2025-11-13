@echo off
echo ========================================
echo  Subdomain Hosts File Setup
echo ========================================
echo.
echo This script will add subdomain entries to your hosts file.
echo You will be prompted for Administrator privileges.
echo.
pause

powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0setup-hosts-windows.ps1\"' -Verb RunAs"

echo.
echo Done! Check the PowerShell window for results.
pause
