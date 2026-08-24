@echo off
echo Starting Railist backend...
start "Railist Backend" cmd /k "cd /d %~dp0backend && npm install && npm run dev"
timeout /t 2 >nul
echo Starting Railist frontend...
start "Railist Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"
echo.
echo Two terminals have been opened.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
pause
