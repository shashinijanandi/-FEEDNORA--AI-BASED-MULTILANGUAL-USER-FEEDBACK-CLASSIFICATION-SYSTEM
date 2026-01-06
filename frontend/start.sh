#!/bin/bash

# Quick start script for Frontend Server (Linux/Mac)

echo ""
echo "========================================"
echo "Feedback Sentiment Analysis Frontend"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

echo "[1/3] Installing dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[2/3] Checking model files..."
if [ ! -f "../data/sentiment_model.pkl" ]; then
    echo "ERROR: sentiment_model.pkl not found in data/ folder"
    echo "Please train the model first using: python3 scripts/train_model.py"
    exit 1
fi

if [ ! -f "../data/vectorizer.pkl" ]; then
    echo "ERROR: vectorizer.pkl not found in data/ folder"
    echo "Please train the model first using: python3 scripts/train_model.py"
    exit 1
fi

echo "Model files found!"
echo ""
echo "[3/3] Starting Flask API server..."
echo ""
echo "========================================"
echo "Server starting on http://localhost:5000"
echo "Frontend: Open index.html in your browser"
echo "========================================"
echo ""

python3 api.py
