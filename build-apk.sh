#!/bin/bash

# Odoo POS — Android APK Build Script
# This script automates the process of building a release APK

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Download from: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        echo "Install JDK 17: https://www.oracle.com/java/technologies/downloads/"
        exit 1
    fi
    print_success "Java $(java -version 2>&1 | head -n 1)"
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        print_error "ANDROID_HOME environment variable is not set"
        echo "Set it to your Android SDK location"
        exit 1
    fi
    print_success "ANDROID_HOME: $ANDROID_HOME"
    
    # Check adb
    if ! command -v adb &> /dev/null; then
        print_error "adb is not found"
        echo "Make sure Android SDK is properly installed"
        exit 1
    fi
    print_success "adb is available"
    
    echo ""
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
    
    echo ""
}

# Build web app
build_web_app() {
    print_header "Building Web App"
    
    print_info "Building React app for production..."
    npm run build
    
    if [ -d "dist" ]; then
        print_success "Web app built successfully"
        print_info "Output: dist/"
    else
        print_error "Build failed - dist folder not found"
        exit 1
    fi
    
    echo ""
}

# Sync with Android
sync_android() {
    print_header "Syncing with Android"
    
    print_info "Syncing web app to Android project..."
    npx cap sync android
    
    print_success "Android project synced"
    
    echo ""
}

# Build APK
build_apk() {
    print_header "Building APK"
    
    # Check if keystore exists
    if [ ! -f "odoo-pos.keystore" ]; then
        print_warning "Keystore file not found"
        print_info "Building debug APK instead"
        
        cd android
        ./gradlew assembleDebug
        cd ..
        
        APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
        print_success "Debug APK built successfully"
    else
        print_info "Building release APK..."
        
        # Check for environment variables
        if [ -z "$KEYSTORE_PASSWORD" ]; then
            read -sp "Enter keystore password: " KEYSTORE_PASSWORD
            echo ""
        fi
        
        if [ -z "$KEY_ALIAS" ]; then
            read -p "Enter key alias (default: odoo-pos-key): " KEY_ALIAS
            KEY_ALIAS=${KEY_ALIAS:-odoo-pos-key}
        fi
        
        if [ -z "$KEY_PASSWORD" ]; then
            read -sp "Enter key password: " KEY_PASSWORD
            echo ""
        fi
        
        export KEYSTORE_PASSWORD
        export KEY_ALIAS
        export KEY_PASSWORD
        
        cd android
        ./gradlew assembleRelease
        cd ..
        
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
        print_success "Release APK built successfully"
    fi
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        print_info "APK size: $APK_SIZE"
        print_info "APK location: $APK_PATH"
    else
        print_error "APK file not found at $APK_PATH"
        exit 1
    fi
    
    echo ""
}

# Install on device
install_apk() {
    print_header "Installing APK"
    
    # Check for connected devices
    DEVICES=$(adb devices | grep -v "List of attached devices" | grep -v "^$")
    
    if [ -z "$DEVICES" ]; then
        print_warning "No devices connected"
        print_info "Connect a device or start an emulator"
        return
    fi
    
    print_info "Connected devices:"
    adb devices
    
    read -p "Install APK on device? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing APK..."
        adb install -r "$APK_PATH"
        print_success "APK installed"
        
        print_info "Launching app..."
        adb shell am start -n com.alsalik.odoopos/.MainActivity
    fi
    
    echo ""
}

# Build app bundle
build_bundle() {
    print_header "Building App Bundle (AAB)"
    
    read -p "Build app bundle for Google Play? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building app bundle..."
        
        cd android
        ./gradlew bundleRelease
        cd ..
        
        BUNDLE_PATH="android/app/build/outputs/bundle/release/app-release.aab"
        
        if [ -f "$BUNDLE_PATH" ]; then
            BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
            print_success "App bundle built successfully"
            print_info "Bundle size: $BUNDLE_SIZE"
            print_info "Bundle location: $BUNDLE_PATH"
        else
            print_error "Bundle file not found"
        fi
    fi
    
    echo ""
}

# Summary
print_summary() {
    print_header "Build Summary"
    
    print_info "Build completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Test the APK on a device or emulator"
    echo "  2. Review the app for any issues"
    echo "  3. Upload to Google Play Console"
    echo ""
    print_info "Documentation: ANDROID_BUILD_GUIDE.md"
    echo ""
}

# Main script
main() {
    print_header "Odoo POS — Android APK Builder"
    
    check_prerequisites
    install_dependencies
    build_web_app
    sync_android
    build_apk
    install_apk
    build_bundle
    print_summary
}

# Run main function
main
