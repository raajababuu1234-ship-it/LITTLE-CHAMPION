@echo off
title Little Champions: Play & Learn Launcher
cd /d "%~dp0"
cls
echo ======================================================================
echo    🌟  LITTLE CHAMPIONS: PLAY & LEARN (छोटे उस्ताद)  🌟
echo ======================================================================
echo.
echo  Choose how you would like to play:
echo.
echo    [1] Play in Web Browser & Phone (RECOMMENDED - Use on Phone & PC!)
echo    [2] Play Desktop Windows App (Tkinter GUI)
echo.
echo ======================================================================
set /p choice="Enter your choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    echo Starting Desktop Windows Game...
    python main.py
) else (
    echo.
    echo Starting Web & Phone Server...
    python server.py
)

if errorlevel 1 (
    echo.
    echo Something went wrong while launching.
    pause
)
