@echo off
title Little Champions: Phone & Web Launcher
cd /d "%~dp0"
echo ===================================================
echo Starting Little Champions Kids Learning Game...
echo ===================================================
python server.py
if errorlevel 1 (
    echo.
    echo Something went wrong.
    pause
)
