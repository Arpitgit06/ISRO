@echo off
setlocal
title TESSERACTZ - System Launcher
color 0B

echo.
echo  ========================================================
echo              TESSERACTZ - System Launcher
echo       IR Colorization and Enhancement Mission Hub
echo  ========================================================
echo.

:: --- Verify Installation ---
if not exist ".venv\Scripts\activate.bat" (
    echo   [ERROR] Python venv not found. Run install.bat first.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo   [ERROR] node_modules not found. Run install.bat first.
    pause
    exit /b 1
)

:: --- Start Backend ---
echo [1/2] Starting backend (FastAPI on port 8000)...
start "TESSERACTZ Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude .venv --reload-exclude node_modules --reload-exclude __pycache__ --reload-exclude .git"
echo   [OK] Backend starting in a new window.

:: --- Wait for backend to init ---
echo   Waiting for backend to warm up...
timeout /t 5 /nobreak >nul

:: --- Start Frontend ---
echo [2/2] Starting frontend (React on port 3000)...
start "TESSERACTZ Frontend" cmd /k "call npm start"
echo   [OK] Frontend starting in a new window.

:: --- Info ---
echo.
echo  ========================================================
echo                  Both servers started!
echo.
echo   Backend:   http://localhost:8000
echo   Frontend:  http://localhost:3000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Close the server windows to stop the services.
echo  ========================================================
echo.
pause
