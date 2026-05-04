# Android APK — Quick Start Guide

## TL;DR (5 Minutes)

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Java JDK 17 installed
- [ ] Android Studio installed
- [ ] `ANDROID_HOME` environment variable set
- [ ] Android SDK with API 33 installed

### Build in 4 Steps

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Build APK
cd android
./gradlew assembleDebug  # For testing
# OR
./gradlew assembleRelease  # For release (requires keystore)
cd ..
```

**APK Location:**
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

---

## Automated Build (Recommended)

### macOS/Linux
```bash
chmod +x build-apk.sh
./build-apk.sh
```

### Windows
```bash
build-apk.bat
```

The script will:
1. ✓ Check all prerequisites
2. ✓ Install dependencies
3. ✓ Build web app
4. ✓ Sync to Android
5. ✓ Build APK
6. ✓ Install on device (optional)
7. ✓ Build app bundle (optional)

---

## Manual Build Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Web App

```bash
npm run build
```

Output: `dist/` folder

### Step 3: Sync to Android

```bash
npx cap sync android
```

This copies the web app to the Android project.

### Step 4: Open in Android Studio

```bash
npx cap open android
```

Or manually:
1. Open Android Studio
2. File → Open
3. Select `android/` folder
4. Click Open

### Step 5: Build APK

**In Android Studio:**
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Select "debug" or "release"
3. Wait for build to complete

**Via Command Line:**

Debug:
```bash
cd android
./gradlew assembleDebug
cd ..
```

Release (requires keystore):
```bash
cd android
./gradlew assembleRelease
cd ..
```

### Step 6: Test APK

**Install on device:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Or drag-drop APK onto Android Studio emulator**

---

## Create Release Keystore (One-Time)

```bash
keytool -genkey -v -keystore odoo-pos.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias odoo-pos-key
```

You'll be prompted for:
- Keystore password
- Key password
- Your name
- Organization
- City
- State
- Country code (AE for UAE)

**Keep this file safe!** Back it up in a secure location.

---

## Environment Variables (For Release Build)

Set before building release APK:

```bash
export KEYSTORE_PASSWORD="your-password"
export KEY_ALIAS="odoo-pos-key"
export KEY_PASSWORD="your-key-password"
```

Or use the build script which will prompt for these.

---

## Troubleshooting

### "SDK location not found"
```bash
cd android
echo "sdk.dir=$ANDROID_HOME" > local.properties
cd ..
```

### "Gradle version not compatible"
```bash
cd android
./gradlew wrapper --gradle-version 8.0
cd ..
```

### "INSTALL_FAILED_VERSION_DOWNGRADE"
```bash
adb uninstall com.alsalik.odoopos
adb install app-release.apk
```

### "No devices connected"
1. Connect Android device via USB
2. Enable USB debugging on device
3. Or start Android emulator

---

## Build Outputs

| File | Purpose | Location |
|------|---------|----------|
| app-debug.apk | Testing | `android/app/build/outputs/apk/debug/` |
| app-release.apk | Google Play | `android/app/build/outputs/apk/release/` |
| app-release.aab | Google Play Store | `android/app/build/outputs/bundle/release/` |

---

## Upload to Google Play

1. Go to https://play.google.com/console
2. Create new app
3. Upload `app-release.aab`
4. Fill in store listing
5. Submit for review

---

## App Details

| Property | Value |
|----------|-------|
| App ID | com.alsalik.odoopos |
| App Name | Odoo POS |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 33 (Android 13) |
| Build Tools | 33.0.0 |

---

## Full Documentation

See `ANDROID_BUILD_GUIDE.md` for complete instructions.

---

## Need Help?

1. Check `ANDROID_BUILD_GUIDE.md` troubleshooting section
2. Review Android Studio build output for errors
3. Check `logcat` in Android Studio for runtime errors
4. Verify all prerequisites are installed correctly
