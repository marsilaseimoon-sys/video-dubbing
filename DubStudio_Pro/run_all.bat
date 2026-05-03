@echo off
title DubStudio Pro - Auto Launcher
color 0A
echo.
echo ============================================
echo   DubStudio Pro - Starting All Services
echo ============================================
echo.
echo [1/4] Starting Backend...
start "DubStudio Backend" cmd /k "cd /d E:\Downloads\DubStudio_Pro\backend && python App.py"
timeout /t 5 /nobreak >nul
echo [2/4] Starting Frontend...
start "DubStudio Frontend" cmd /k "cd /d E:\Downloads\DubStudio_Pro\frontend\react_app && npm install && npm run dev"
timeout /t 6 /nobreak >nul
echo [3/4] Starting Public Sharing...
start "DubStudio Sharing" cmd /k "cd /d E:\Downloads\DubStudio_Pro\backend && python share_free.py"
timeout /t 7 /nobreak >nul
echo [4/4] Opening Browser...
start "" "http://localhost:5173"
echo.
echo ============================================
echo   All services started!
echo   Browser open ho gaya!
echo ============================================
pause
