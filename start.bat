@echo off
title SocialOS Dev Launcher
echo.
echo  ================================
echo   SocialOS - Starting dev servers
echo  ================================
echo.

echo [1/2] Starting FastAPI backend on :8000...
start "SocialOS Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 4 /nobreak >nul

echo [2/2] Starting Next.js frontend on :3000...
start "SocialOS Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules/next/dist/bin/next dev"

echo.
echo  Done! Opening in a few seconds...
echo.
echo  Backend:   http://127.0.0.1:8000
echo  Frontend:  http://localhost:3000
echo  API docs:  http://127.0.0.1:8000/docs
echo.
timeout /t 6 /nobreak >nul
start http://localhost:3000

echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
