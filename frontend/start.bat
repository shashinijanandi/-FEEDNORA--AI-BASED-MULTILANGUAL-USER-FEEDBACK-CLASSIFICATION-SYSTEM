@echo off
REM Quick start script for Frontend Server

echo.
echo ========================================
echo Feedback Sentiment Analysis Frontend
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Checking model files...
if not exist "..\data\sentiment_model.pkl" (
    echo ERROR: sentiment_model.pkl not found in data\ folder
    echo Please train the model first using: python scripts\train_model.py
    pause
    exit /b 1
)

if not exist "..\data\vectorizer.pkl" (
    echo ERROR: vectorizer.pkl not found in data\ folder
    echo Please train the model first using: python scripts\train_model.py
    pause
    exit /b 1
)

echo Model files found!
echo.
echo [3/3] Starting Flask API server...
echo.
echo ========================================
echo Server starting on http://localhost:5000
echo Frontend: Open index.html in your browser
echo ========================================
echo.

python api.py

pause
