@echo off
setlocal enabledelayedexpansion
title Shafqat Tyres POS - Release Builder
color 0A

echo.
echo ==========================================
echo   Shafqat Tyres POS - Release Builder
echo ==========================================
echo.

if not exist "package.json" (
    echo ERROR: Run this from inside the shafqat-tyres folder!
    pause
    exit /b 1
)

for /f "tokens=2 delims=:, " %%a in ('findstr "\"version\"" package.json') do (
    set CURRENT_VERSION=%%~a
    goto :got_version
)
:got_version
echo Current version: %CURRENT_VERSION%
echo.

set /p NEW_VERSION=Enter new version (e.g. 1.0.1) or press Enter to keep %CURRENT_VERSION%: 
if "%NEW_VERSION%"=="" set NEW_VERSION=%CURRENT_VERSION%

echo.
echo Building version: %NEW_VERSION%
echo.

powershell -Command "(Get-Content package.json) -replace '\"version\": \"%CURRENT_VERSION%\"', '\"version\": \"%NEW_VERSION%\"' | Set-Content package.json"
echo [1/5] Version updated to %NEW_VERSION%

echo [2/5] Cleaning old build...
if exist "dist" rmdir /s /q dist
if exist "release" rmdir /s /q release

echo [3/5] Installing dependencies...
call npm install --silent

echo [4/5] Building exe (5-10 mins)...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo [5/5] Pushing to GitHub...
git add .
git commit -m "Release v%NEW_VERSION%"
git push

echo.
echo ==========================================
echo   DONE! v%NEW_VERSION% built successfully.
echo   Upload the .exe from 'release' folder to:
echo   github.com/annmateo3-ux/shafqat-tyres-pos/releases/new
echo   Tag: v%NEW_VERSION%
echo ==========================================
echo.
pause