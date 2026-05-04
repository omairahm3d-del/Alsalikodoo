# Android APK Build Guide — Odoo POS Mobile App

## Overview

This guide provides step-by-step instructions to build a production-ready Android APK for the Odoo POS mobile app using Capacitor and Android Studio.

## Prerequisites

### System Requirements
- **macOS**: 10.15 or later
- **Windows**: 10 or later (with WSL2 recommended)
- **Linux**: Ubuntu 18.04 or later

### Required Software

#### 1. Node.js and npm
```bash
# Download from https://nodejs.org/
# Verify installation
node --version  # v18.0.0 or later
npm --version   # v8.0.0 or later
```

#### 2. Java Development Kit (JDK)
```bash
# macOS (using Homebrew)
brew install openjdk@17

# Windows (using Chocolatey)
choco install openjdk17

# Linux (Ubuntu/Debian)
sudo apt-get install openjdk-17-jdk

# Verify installation
java -version
```

#### 3. Android Studio
- Download from: https://developer.android.com/studio
- Install to default location
- During setup, install:
  - Android SDK
  - Android SDK Platform-Tools
  - Android Emulator
  - Android SDK Build-Tools 33.0.0

#### 4. Android SDK Setup

After installing Android Studio, set up environment variables:

**macOS/Linux:**
```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:USERPROFILE\AppData\Local\Android\Sdk", "User")
$env:Path += ";$env:ANDROID_HOME\emulator"
$env:Path += ";$env:ANDROID_HOME\tools"
$env:Path += ";$env:ANDROID_HOME\tools\bin"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
```

Verify setup:
```bash
echo $ANDROID_HOME
adb --version
```

## Step 1: Clone/Download Project

```bash
# If using Git
git clone <your-repo-url>
cd odoo-pos-mockup

# Or download and extract the project folder
cd odoo-pos-mockup
```

## Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install
# or
pnpm install
```

## Step 3: Build Web App

```bash
# Build the React app for production
npm run build

# Output will be in the dist/ directory
ls dist/
```

## Step 4: Sync with Android

```bash
# Install Capacitor CLI globally (optional but recommended)
npm install -g @capacitor/cli

# Sync the web app to the Android project
npx cap sync android

# This will:
# - Copy the dist/ files to android/app/src/main/assets/public
# - Update Android configuration
# - Install required dependencies
```

## Step 5: Open in Android Studio

```bash
# Open the Android project in Android Studio
npx cap open android

# Or manually open:
# 1. Launch Android Studio
# 2. File → Open
# 3. Navigate to: odoo-pos-mockup/android
# 4. Click Open
```

## Step 6: Configure Signing (For Release Build)

### Create Keystore File

```bash
# Generate a keystore file (do this ONCE and keep it safe)
keytool -genkey -v -keystore odoo-pos.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias odoo-pos-key

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (remember this!)
# - Your name
# - Organization
# - City
# - State
# - Country code (e.g., AE for UAE)
```

### Configure Gradle for Signing

Create or edit `android/app/build.gradle`:

```gradle
android {
    // ... other config ...

    signingConfigs {
        release {
            storeFile file('../../odoo-pos.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 7: Build APK

### Option A: Debug APK (For Testing)

```bash
# In Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Wait for build to complete
# 3. APK will be at: android/app/build/outputs/apk/debug/app-debug.apk

# Or via command line:
cd android
./gradlew assembleDebug
cd ..

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Release APK (For Google Play)

```bash
# Set environment variables
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_ALIAS="odoo-pos-key"
export KEY_PASSWORD="your-key-password"

# Build via command line
cd android
./gradlew assembleRelease
cd ..

# APK location: android/app/build/outputs/apk/release/app-release.apk

# Or in Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Select "Release" variant
# 3. Click Build
```

### Option C: App Bundle (For Google Play Store)

```bash
# Recommended for Google Play Store
cd android
./gradlew bundleRelease
cd ..

# Bundle location: android/app/build/outputs/bundle/release/app-release.aab
```

## Step 8: Test APK

### Install on Device/Emulator

```bash
# Debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or drag-drop APK onto Android Studio emulator
```

### Create Virtual Device (Emulator)

```bash
# List available devices
emulator -list-avds

# Create new device
avdmanager create avd -n "Pixel_4_API_30" -k "system-images;android-30;google_apis;x86_64"

# Start emulator
emulator -avd Pixel_4_API_30
```

## Step 9: Upload to Google Play Store

### Prepare for Release

1. **Update Version Code and Name**
   - Edit `android/app/build.gradle`
   - Update `versionCode` and `versionName`

2. **Update App Metadata**
   - App name: `android/app/src/main/AndroidManifest.xml`
   - Icon: `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - Strings: `android/app/src/main/res/values/strings.xml`

3. **Create Screenshots**
   - 2-8 screenshots (1080 x 1920 px recommended)
   - Show key app features

4. **Write Description**
   - Short description (80 chars)
   - Full description (4000 chars)
   - Release notes

### Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create new app or select existing
3. Fill in app details:
   - App name
   - Default language
   - App category
   - Content rating
4. Upload App Bundle (AAB file)
5. Fill in store listing details
6. Review and publish

## Troubleshooting

### Build Fails: "SDK location not found"

```bash
# Create local.properties
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties
cd ..
```

### Build Fails: "Gradle version not compatible"

```bash
# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.0
cd ..
```

### APK Won't Install: "INSTALL_FAILED_VERSION_DOWNGRADE"

```bash
# Uninstall existing app first
adb uninstall com.alsalik.odoopos

# Then install new APK
adb install app-release.apk
```

### Emulator Won't Start

```bash
# Reset emulator
emulator -avd Pixel_4_API_30 -wipe-data

# Or delete and recreate
rm -rf ~/.android/avd/Pixel_4_API_30.avd
avdmanager create avd -n "Pixel_4_API_30" -k "system-images;android-30;google_apis;x86_64"
```

### App Crashes on Startup

1. Check logcat in Android Studio
2. Verify `capacitor.config.ts` has correct `appId`
3. Ensure `dist/` folder is built correctly
4. Check `AndroidManifest.xml` permissions

## File Locations Reference

| File | Location |
|------|----------|
| Main app code | `client/src/` |
| Web build output | `dist/` |
| Android project | `android/` |
| App manifest | `android/app/src/main/AndroidManifest.xml` |
| App icon | `android/app/src/main/res/mipmap-*/ic_launcher.png` |
| Build config | `android/app/build.gradle` |
| Gradle wrapper | `android/gradlew` |
| Keystore file | `odoo-pos.keystore` (in project root) |
| Release APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Release Bundle | `android/app/build/outputs/bundle/release/app-release.aab` |

## Build Configuration

### Current Settings

```
App ID: com.alsalik.odoopos
App Name: Odoo POS
Min SDK: 22 (Android 5.1)
Target SDK: 33 (Android 13)
Build Tools: 33.0.0
```

### Modify Settings

Edit `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.alsalik.odoopos',
  appName: 'Odoo POS',
  webDir: 'dist',
  // ... other config
};
```

Edit `android/app/build.gradle`:
```gradle
android {
    compileSdk 33
    
    defaultConfig {
        applicationId "com.alsalik.odoopos"
        minSdk 22
        targetSdk 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

## Continuous Integration (Optional)

### GitHub Actions Workflow

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'adopt'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build web app
        run: npm run build
      
      - name: Sync to Android
        run: npx cap sync android
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleRelease
          cd ..
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

## Security Best Practices

1. **Never commit keystore file** to version control
2. **Store passwords securely** (use environment variables)
3. **Keep keystore file backed up** in secure location
4. **Use different keys** for debug and release builds
5. **Enable ProGuard/R8** for release builds
6. **Regularly update dependencies** for security patches
7. **Test on multiple devices** before release
8. **Monitor crash reports** after release

## Performance Optimization

### Reduce APK Size

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Enable Multidex (if needed)

```gradle
android {
    defaultConfig {
        multiDexEnabled true
    }
    
    dependencies {
        implementation 'androidx.multidex:multidex:2.0.1'
    }
}
```

## Release Checklist

- [ ] Update version code and name
- [ ] Update app icon
- [ ] Update app name and description
- [ ] Create screenshots
- [ ] Write release notes
- [ ] Test on multiple devices
- [ ] Test all features
- [ ] Check permissions in manifest
- [ ] Verify keystore file is secure
- [ ] Build release APK/AAB
- [ ] Sign APK/AAB
- [ ] Test signed APK/AAB
- [ ] Upload to Google Play Console
- [ ] Fill in store listing
- [ ] Set pricing and distribution
- [ ] Submit for review

## Support & Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Studio Docs**: https://developer.android.com/studio/intro
- **Google Play Console**: https://play.google.com/console
- **Android Developer Docs**: https://developer.android.com/docs
- **Gradle Documentation**: https://gradle.org/

## Next Steps

1. Follow the prerequisites section to install required tools
2. Clone/download the project
3. Follow steps 2-7 to build the APK
4. Test on device or emulator
5. Upload to Google Play Store

For questions or issues, refer to the troubleshooting section or consult the official documentation.
