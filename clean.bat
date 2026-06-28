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
echo    - yolov8x-worldv2.pt and yolov8x.pt  (YOLO model weights)
echo.

set /p CONFIRM=Are you sure? (Y/N): 
if /i not "%CONFIRM%"=="Y" (
    echo   Cancelled. Nothing was deleted.
    pause
    exit /b 0
)

echo.

:: --- Remove node_modules ---
echo [1/6] Removing node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo   [OK] node_modules removed.
) else (
    echo   [SKIP] node_modules not found.
)

:: --- Remove package-lock.json ---
echo [2/6] Removing package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo   [OK] package-lock.json removed.
) else (
    echo   [SKIP] package-lock.json not found.
)

:: --- Remove Python venv ---
echo [3/6] Removing .venv...
if exist ".venv" (
    rmdir /s /q .venv
    echo   [OK] .venv removed.
) else (
    echo   [SKIP] .venv not found.
)

:: --- Remove __pycache__ directories ---
echo [4/6] Removing __pycache__ directories...
for /d /r %%d in (__pycache__) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
    )
)
echo   [OK] __pycache__ directories cleaned.

:: --- Remove checkpoints ---
echo [5/6] Removing checkpoints...
if exist "checkpoints" (
    rmdir /s /q checkpoints
    echo   [OK] checkpoints removed.
) else (
    echo   [SKIP] checkpoints not found.
)

:: --- Remove YOLO model weights ---
echo [6/6] Removing YOLO model weights...
if exist "yolov8x-worldv2.pt" (
    del /q yolov8x-worldv2.pt
    echo   [OK] yolov8x-worldv2.pt removed.
) else (
    echo   [SKIP] yolov8x-worldv2.pt not found.
)
if exist "yolov8x.pt" (
    del /q yolov8x.pt
    echo   [OK] yolov8x.pt removed.
) else (
    echo   [SKIP] yolov8x.pt not found.
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

