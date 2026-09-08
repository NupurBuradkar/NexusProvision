@echo off
title NexusProvision Launcher
echo ========================================================
echo          Starting NexusProvision Platform...
echo ========================================================

start "NexusProvision Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
start "NexusProvision Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo NexusProvision launched successfully!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo.
pause
