@echo off
title Friday HR Platform Runner
echo ===================================================
echo             Friday HR Platform Launcher            
echo ===================================================
echo.

:: Get the directory of the batch file
set "PROJECT_DIR=%~dp0"

:: Start Backend
echo [1/2] Starting Backend Server (Uvicorn on port 56060)...
start "Friday HR Backend" /D "%PROJECT_DIR%backend" cmd /k "python main.py"

:: Start Frontend
echo [2/2] Starting Frontend Dev Server (Vite on port 5173)...
start "Friday HR Frontend" /D "%PROJECT_DIR%frontend" cmd /k "npm.cmd run dev"

echo.
echo ===================================================
echo Project is launching!
echo.
echo Frontend Web App: http://localhost:5173
echo Backend API URL:   http://127.0.0.1:56060
echo API Docs:          http://127.0.0.1:56060/docs
echo ===================================================
echo.

:: Wait for servers to spin up and open default browser to login page
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause


