@echo off
title Push Little Champions to GitHub
cls
echo ============================================================
echo       PUSH LITTLE CHAMPIONS GAME TO GITHUB (FOR VERCEL)
echo ============================================================
echo.
echo Git binary: C:\Users\Dell\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe
echo Project:   %~dp0
echo.
echo STEP 1: Go to https://github.com/new and create a new repository
echo         (e.g., named 'kids-learning-game', set to Public or Private,
echo          do NOT check README / .gitignore).
echo.
set /p REPO_URL="STEP 2: Paste your GitHub repository URL here: "

if "%REPO_URL%"=="" (
    echo.
    echo [!] No URL entered. Opening GitHub Desktop instead...
    start "" "C:\Users\Dell\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
    pause
    exit /b
)

echo.
echo Linking to %REPO_URL%...
"C:\Users\Dell\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe" remote remove origin 2>nul
"C:\Users\Dell\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe" remote add origin %REPO_URL%
"C:\Users\Dell\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe" branch -M main

echo.
echo Pushing to GitHub...
"C:\Users\Dell\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo [SUCCESS] Your code is successfully uploaded to GitHub!
    echo ============================================================
    echo.
    echo NOW TO GO LIVE ON VERCEL:
    echo 1. Open https://vercel.com
    echo 2. Click "Add New..." -> "Project"
    echo 3. Click "Import" next to your GitHub repository
    echo 4. Click "Deploy"
    echo.
    echo In 15 seconds your website will be live worldwide!
    echo ============================================================
) else (
    echo.
    echo [Note] If push failed due to login, you can open GitHub Desktop:
    echo        File -> Add Local Repository -> choose this folder -> Publish repository!
)

echo.
pause
