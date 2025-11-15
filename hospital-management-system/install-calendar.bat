@echo off
REM Team Alpha - Install Calendar Dependencies (Windows)
REM Run this script to install FullCalendar packages

echo.
echo ========================================
echo Installing FullCalendar packages...
echo ========================================
echo.

call npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Calendar packages installed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Run: npm run dev
    echo 2. Navigate to: http://localhost:3001/appointments/calendar
    echo.
) else (
    echo.
    echo ========================================
    echo Installation failed! Please check the error above.
    echo ========================================
    echo.
)

pause
