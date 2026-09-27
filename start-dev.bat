@echo off
title Gazetteer Dev Server
cd /d "%~dp0"

echo ==================================================
echo        Gazetteer - Starting Development Server
echo ==================================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Error: npm is not installed or not in PATH.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [!] node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [!] npm install failed.
        pause
        exit /b 1
    )
)

echo [+] Launching browser at http://localhost:3000...
start "" "http://localhost:3000"

echo [+] Starting Next.js development server...
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
pause
