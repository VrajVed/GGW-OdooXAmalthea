@echo off
REM ============================================================================
REM Google Calendar Database Setup Script for Windows
REM ============================================================================

echo.
echo ========================================
echo Google Calendar Database Setup
echo ========================================
echo.

REM Set database credentials from .env file
set DB_USER=postgres
set DB_NAME=user_management_db

echo Setting up Google Calendar tokens table...
echo.

REM Run the SQL migration
psql -U %DB_USER% -d %DB_NAME% -f database\add-google-calendar-tokens.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ Success! Calendar table created
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Set up Google Cloud Project
    echo 2. Get OAuth credentials
    echo 3. Update .env file with credentials
    echo 4. Start the server: npm run dev
    echo.
    echo See CALENDAR_SETUP_GUIDE.md for details
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ Error creating calendar table
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database exists: %DB_NAME%
    echo 3. User has permissions: %DB_USER%
    echo.
)

pause
