@echo off
title Little Champions: Package Web Assets for APK
cd /d "%~dp0"
cls
echo ======================================================================
echo    📦 PACKAGING LITTLE CHAMPIONS FOR ANDROID APK GENERATION
echo ======================================================================
echo.
echo Creating LittleChampions_Web_for_APK.zip...

powershell -Command "Compress-Archive -Path '.\web\*' -DestinationPath '.\LittleChampions_Web_for_APK.zip' -Force"

if exist "LittleChampions_Web_for_APK.zip" (
    echo.
    echo ======================================================================
    echo    SUCCESS! Package created: LittleChampions_Web_for_APK.zip
    echo ======================================================================
    echo.
    echo  You can now upload this ZIP to any free online APK generator:
    echo    1. Open https://www.webintoapp.com/
    echo    2. Select 'HTML / CSS / JS' and upload 'LittleChampions_Web_for_APK.zip'
    echo    3. App Name: Little Champions
    echo    4. Click 'Make App' to download your standalone .apk installer!
    echo.
) else (
    echo Failed to create ZIP archive.
)

pause
