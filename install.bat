@echo off
setlocal
title TESSERACTZ - Installation
color 0A

echo.
echo  ========================================================
echo           TESSERACTZ - Installation Script
echo       IR Colorization and Enhancement Mission Hub
echo  ========================================================
echo.

:: --- Check Python ---
echo [1/6] Checking Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Python is not installed or not on PATH.
    echo   Please install Python 3.10+ from https://python.org
    echo   Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
echo   [OK] Python found.

:: --- Check Node.js ---
echo.
echo [2/6] Checking Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Node.js is not installed or not on PATH.
    echo   Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo   [OK] Node.js found.

echo.
echo   Checking npm...
call npm --version
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] npm is not found. Reinstall Node.js.
    pause
    exit /b 1
)
echo   [OK] npm found.

:: --- Create Python Virtual Environment ---
echo.
echo [3/6] Setting up Python virtual environment...
if exist ".venv" (
    echo   [INFO] .venv already exists. Skipping creation.
) else (
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo   [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo   [OK] Virtual environment created.
)

:: --- Install Python Dependencies ---
echo.
echo [4/6] Select your hardware configuration to optimize PyTorch installation:
echo       [1] NVIDIA GPU (CUDA)
echo       [2] AMD GPU (DirectML)
echo       [3] Apple Silicon (MPS - instruction only, for macOS)
echo       [4] CPU Only (No GPU acceleration)
echo.
set /p GPU_CHOICE="Enter selection [1, 2, 3, or 4]: "

call .venv\Scripts\activate.bat
echo.
echo   Upgrading pip...
python -m pip install --upgrade pip

if "%GPU_CHOICE%"=="1" (
    echo.
    echo   Installing PyTorch with NVIDIA CUDA support...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
) else if "%GPU_CHOICE%"=="2" (
    echo.
    echo   Installing PyTorch with AMD DirectML support...
    pip install torch torchvision
    pip install torch-directml
) else if "%GPU_CHOICE%"=="3" (
    echo.
    echo   [INFO] Apple Silicon MPS requires running on macOS.
    echo   Windows batch scripts cannot run on macOS.
    echo   To install on Apple Silicon manually:
    echo     1. Create and activate venv: python -m venv .venv and source .venv/bin/activate
    echo     2. Install requirements: pip install -r requirements.txt
    echo.
    echo   We will install the default CPU PyTorch package for Windows in this venv.
    pip install torch torchvision
) else if "%GPU_CHOICE%"=="4" (
    echo.
    echo   Installing CPU-only PyTorch...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
) else (
    echo.
    echo   [WARNING] Invalid choice. Installing default CPU PyTorch...
    pip install torch torchvision
)

echo.
echo   Installing remaining dependencies from requirements.txt...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Some Python packages may have failed to install.
    echo   Check the output above for errors.
) else (
    echo   [OK] Python dependencies installed.
)

:: --- Clean Node Modules ---
echo.
echo [5/6] Cleaning old node_modules...
if exist "node_modules" (
    echo   Removing node_modules... (this may take a moment)
    rmdir /s /q node_modules
    echo   [OK] Old node_modules removed.
)
if exist "package-lock.json" (
    del /q package-lock.json
    echo   [OK] Old package-lock.json removed.
)

:: --- Install Node Dependencies ---
echo.
echo [6/6] Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] npm install failed. Check the output above.
    pause
    exit /b 1
)
echo   [OK] Node.js dependencies installed.

:: --- Done ---
echo.
echo  ========================================================
echo                  Installation Complete!
echo.
echo   Next steps:
echo     1. Run  start.bat  to launch the system
echo     2. Open  http://localhost:3000  in your browser
echo  ========================================================
echo.
pause
