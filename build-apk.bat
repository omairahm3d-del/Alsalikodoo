@echo off
REM Odoo POS — Android APK Build Script (Windows)
REM This script automates the process of building a release APK

setlocal enabledelayedexpansion

REM Colors (using ANSI escape codes)
set "RESET=[0m"
set "BLUE=[0;34m"
set "GREEN=[0;32m"
set "RED=[0;31m"
set "YELLOW=[1;33m"

REM Functions
:print_header
echo.
echo %BLUE%=====================================================%RESET%
echo %BLUE%%~1%RESET%
echo %BLUE%=====================================================%RESET%
exit /b

:print_success
echo %GREEN%[OK] %~1%RESET%
exit /b

:print_error
echo %RED%[ERROR] %~1%RESET%
exit /b

:print_warning
echo %YELLOW%[WARNING] %~1%RESET%
exit /b

:print_info
echo %BLUE%[INFO] %~1%RESET%
exit /b

REM Check prerequisites
:check_prerequisites
call :print_header "Checking Prerequisites"

where node >nul 2>nul
if errorlevel 1 (
    call :print_error "Node.js is not installed"
    echo Download from: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :print_success "Node.js %NODE_VERSION%"

where java >nul 2>nul
if errorlevel 1 (
    call :print_error "Java is not installed"
    echo Install JDK 17: https://www.oracle.com/java/technologies/downloads/
    exit /b 1
)
call :print_success "Java is installed"

if not defined ANDROID_HOME (
    call :print_error "ANDROID_HOME environment variable is not set"
    echo Set it to your Android SDK location
    exit /b 1
)
call :print_success "ANDROID_HOME: %ANDROID_HOME%"

where adb >nul 2>nul
if errorlevel 1 (
    call :print_error "adb is not found"
    echo Make sure Android SDK is properly installed
    exit /b 1
)
call :print_success "adb is available"

echo.
exit /b 0

REM Install dependencies
:install_dependencies
call :print_header "Installing Dependencies"

if not exist "node_modules" (
    call :print_info "Installing Node.js dependencies..."
    call npm install
    if errorlevel 1 (
        call :print_error "Failed to install dependencies"
        exit /b 1
    )
    call :print_success "Dependencies installed"
) else (
    call :print_success "Dependencies already installed"
)

echo.
exit /b 0

REM Build web app
:build_web_app
call :print_header "Building Web App"

call :print_info "Building React app for production..."
call npm run build
if errorlevel 1 (
    call :print_error "Build failed"
    exit /b 1
)

if exist "dist" (
    call :print_success "Web app built successfully"
    call :print_info "Output: dist\"
) else (
    call :print_error "Build failed - dist folder not found"
    exit /b 1
)

echo.
exit /b 0

REM Sync with Android
:sync_android
call :print_header "Syncing with Android"

call :print_info "Syncing web app to Android project..."
call npx cap sync android
if errorlevel 1 (
    call :print_error "Sync failed"
    exit /b 1
)

call :print_success "Android project synced"

echo.
exit /b 0

REM Build APK
:build_apk
call :print_header "Building APK"

if not exist "odoo-pos.keystore" (
    call :print_warning "Keystore file not found"
    call :print_info "Building debug APK instead"
    
    cd android
    call gradlew.bat assembleDebug
    cd ..
    
    if errorlevel 1 (
        call :print_error "Build failed"
        exit /b 1
    )
    
    set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
    call :print_success "Debug APK built successfully"
) else (
    call :print_info "Building release APK..."
    
    if not defined KEYSTORE_PASSWORD (
        set /p KEYSTORE_PASSWORD="Enter keystore password: "
    )
    
    if not defined KEY_ALIAS (
        set /p KEY_ALIAS="Enter key alias (default: odoo-pos-key): "
        if "!KEY_ALIAS!"=="" set "KEY_ALIAS=odoo-pos-key"
    )
    
    if not defined KEY_PASSWORD (
        set /p KEY_PASSWORD="Enter key password: "
    )
    
    cd android
    call gradlew.bat assembleRelease
    cd ..
    
    if errorlevel 1 (
        call :print_error "Build failed"
        exit /b 1
    )
    
    set "APK_PATH=android\app\build\outputs\apk\release\app-release.apk"
    call :print_success "Release APK built successfully"
)

if exist "%APK_PATH%" (
    call :print_info "APK location: %APK_PATH%"
) else (
    call :print_error "APK file not found at %APK_PATH%"
    exit /b 1
)

echo.
exit /b 0

REM Install on device
:install_apk
call :print_header "Installing APK"

for /f "tokens=*" %%i in ('adb devices ^| find /v "List" ^| find /v "^$"') do (
    if not "%%i"=="" (
        call :print_info "Connected devices:"
        call adb devices
        
        set /p INSTALL_CHOICE="Install APK on device? (y/n) "
        if /i "!INSTALL_CHOICE!"=="y" (
            call :print_info "Installing APK..."
            call adb install -r "%APK_PATH%"
            if errorlevel 1 (
                call :print_error "Installation failed"
                exit /b 1
            )
            call :print_success "APK installed"
            
            call :print_info "Launching app..."
            call adb shell am start -n com.alsalik.odoopos/.MainActivity
        )
        exit /b 0
    )
)

call :print_warning "No devices connected"
call :print_info "Connect a device or start an emulator"

echo.
exit /b 0

REM Build app bundle
:build_bundle
call :print_header "Building App Bundle (AAB)"

set /p BUNDLE_CHOICE="Build app bundle for Google Play? (y/n) "
if /i "!BUNDLE_CHOICE!"=="y" (
    call :print_info "Building app bundle..."
    
    cd android
    call gradlew.bat bundleRelease
    cd ..
    
    if errorlevel 1 (
        call :print_error "Build failed"
        exit /b 1
    )
    
    set "BUNDLE_PATH=android\app\build\outputs\bundle\release\app-release.aab"
    
    if exist "%BUNDLE_PATH%" (
        call :print_success "App bundle built successfully"
        call :print_info "Bundle location: %BUNDLE_PATH%"
    ) else (
        call :print_error "Bundle file not found"
    )
)

echo.
exit /b 0

REM Print summary
:print_summary
call :print_header "Build Summary"

call :print_info "Build completed successfully!"
echo.
call :print_info "Next steps:"
echo   1. Test the APK on a device or emulator
echo   2. Review the app for any issues
echo   3. Upload to Google Play Console
echo.
call :print_info "Documentation: ANDROID_BUILD_GUIDE.md"
echo.
exit /b 0

REM Main execution
call :check_prerequisites
if errorlevel 1 exit /b 1

call :install_dependencies
if errorlevel 1 exit /b 1

call :build_web_app
if errorlevel 1 exit /b 1

call :sync_android
if errorlevel 1 exit /b 1

call :build_apk
if errorlevel 1 exit /b 1

call :install_apk
if errorlevel 1 exit /b 1

call :build_bundle
if errorlevel 1 exit /b 1

call :print_summary

echo Done!
pause
