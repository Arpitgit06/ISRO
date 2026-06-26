@echo off
setlocal
title TESSERACTZ - Cleanup
color 0C

echo.
echo  ========================================================
echo              TESSERACTZ - Cleanup Script
echo   Removes installed packages, venv, and cached files
echo  ========================================================
echo.
echo  WARNING: This will remove:
echo    - node_modules/
echo    - package-lock.json
echo    - .venv/  (Python virtual environment)
echo    - __pycache__/  (all Python cache dirs)
echo    - checkpoints/  (downloaded model weights)
echo.

set /p CONFIRM=Are you sure? (Y/N): 
if /i not "%CONFIRM%"=="Y" (
    echo   Cancelled. Nothing was deleted.
    pause
    exit /b 0
)

echo.

:: --- Remove node_modules ---
echo [1/5] Removing node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo   [OK] node_modules removed.
) else (
    echo   [SKIP] node_modules not found.
)

:: --- Remove package-lock.json ---
echo [2/5] Removing package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo   [OK] package-lock.json removed.
) else (
    echo   [SKIP] package-lock.json not found.
)

:: --- Remove Python venv ---
echo [3/5] Removing .venv...
if exist ".venv" (
    rmdir /s /q .venv
    echo   [OK] .venv removed.
) else (
    echo   [SKIP] .venv not found.
)

:: --- Remove __pycache__ directories ---
echo [4/5] Removing __pycache__ directories...
for /d /r %%d in (__pycache__) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
    )
)
echo   [OK] __pycache__ directories cleaned.

:: --- Remove checkpoints ---
echo [5/5] Removing checkpoints...
if exist "checkpoints" (
    rmdir /s /q checkpoints
    echo   [OK] checkpoints removed.
) else (
    echo   [SKIP] checkpoints not found.
)

:: --- Done ---
echo.
echo  ========================================================
echo                    Cleanup Complete!
echo.
echo   To reinstall everything, run:  install.bat
echo  ========================================================
echo.
pause
