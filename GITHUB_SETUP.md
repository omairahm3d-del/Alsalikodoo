# GitHub Setup & CI/CD Configuration

## Overview

This guide explains how to set up your GitHub repository with automated Android APK builds using GitHub Actions.

## Prerequisites

- GitHub account
- GitHub personal access token (PAT) with `repo` and `workflow` scopes
- Signing keystore file for release builds

## Step 1: Create GitHub Repository

### Option A: Create New Repository

1. Go to https://github.com/new
2. Repository name: `odoo-pos-mobile`
3. Description: `Odoo 19 POS Mobile App`
4. Visibility: **Private** (recommended for business apps)
5. Click "Create repository"

### Option B: Use Existing Repository

If you already have a repository, skip to Step 2.

## Step 2: Initialize Git Locally

```bash
cd /path/to/odoo-pos-mockup

# Initialize Git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Odoo POS mobile app"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/odoo-pos-mobile.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Configure GitHub Secrets

GitHub Secrets are encrypted environment variables used by CI/CD workflows.

### For Debug Builds (No Secrets Needed)

Debug builds work automatically on pull requests.

### For Release Builds (Requires Secrets)

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

Add the following secrets:

#### 1. KEYSTORE_BASE64

Convert your keystore file to base64:

```bash
# macOS/Linux
base64 -i odoo-pos.keystore | pbcopy

# Or save to file
base64 odoo-pos.keystore > keystore.b64

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("odoo-pos.keystore")) | Set-Clipboard
```

Create secret:
- Name: `KEYSTORE_BASE64`
- Value: (paste the base64 string)

#### 2. KEYSTORE_PASSWORD

Create secret:
- Name: `KEYSTORE_PASSWORD`
- Value: (your keystore password)

#### 3. KEY_ALIAS

Create secret:
- Name: `KEY_ALIAS`
- Value: `odoo-pos-key` (or your key alias)

#### 4. KEY_PASSWORD

Create secret:
- Name: `KEY_PASSWORD`
- Value: (your key password)

#### 5. SLACK_WEBHOOK_URL (Optional)

For Slack notifications:
- Name: `SLACK_WEBHOOK_URL`
- Value: (your Slack webhook URL)

## Step 4: Configure Gradle for Signing

The workflow will use environment variables to sign the APK. The `build.gradle` file needs to be configured to read these variables.

Edit `android/app/build.gradle`:

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

## Step 5: Understand the Workflows

### android-build.yml

Triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger (workflow_dispatch)

**Behavior:**
- **Pull Requests**: Builds debug APK
- **Push to main**: Builds release APK and app bundle
- **Manual Trigger**: Can choose debug or release

**Outputs:**
- Debug APK: Available in Artifacts for 30 days
- Release APK: Available in Artifacts for 90 days
- App Bundle: Available in Artifacts for 90 days

### test.yml

Triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Checks:**
- TypeScript compilation
- Code formatting
- Web app build

## Step 6: Create Keystore (If Not Done Yet)

```bash
keytool -genkey -v -keystore odoo-pos.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias odoo-pos-key

# You'll be prompted for:
# - Keystore password
# - Key password
# - Your name
# - Organization
# - City
# - State
# - Country code
```

**Important:** Do NOT commit the keystore file to Git!

Add to `.gitignore`:
```
odoo-pos.keystore
*.keystore
```

## Step 7: Test the Workflow

### Test Debug Build

1. Create a new branch:
   ```bash
   git checkout -b test-build
   ```

2. Make a small change (e.g., update README)

3. Push and create a pull request:
   ```bash
   git push origin test-build
   ```

4. Go to GitHub → Pull Requests → Your PR
5. Check the "Checks" tab for workflow status
6. Once passed, download the debug APK from Artifacts

### Test Release Build

1. Push to main branch:
   ```bash
   git push origin main
   ```

2. Go to GitHub → Actions
3. Watch the build progress
4. Once complete, download the release APK and app bundle

## Step 8: Download Builds

### From Pull Request

1. Go to your PR
2. Click "Checks" tab
3. Scroll to "Artifacts" section
4. Click download icon next to "app-debug"

### From Actions Tab

1. Go to GitHub → Actions
2. Click the workflow run
3. Scroll to "Artifacts" section
4. Click download icon

## Step 9: Automate Google Play Upload (Optional)

To automatically upload releases to Google Play Store, add this step to `android-build.yml`:

```yaml
- name: Upload to Google Play
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  uses: r0adkll/upload-google-play@v1
  with:
    serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
    packageName: com.alsalik.odoopos
    releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
    track: internal
    status: draft
```

Then add the secret:
- Name: `PLAY_STORE_SERVICE_ACCOUNT`
- Value: (your Google Play service account JSON)

## Workflow Triggers

### Push to Main
- Builds release APK and app bundle
- Requires all secrets to be set
- Artifacts retained for 90 days

### Pull Request
- Builds debug APK
- No secrets required
- Artifacts retained for 30 days
- Comments on PR with build status

### Manual Trigger
- Go to GitHub → Actions → Android APK Build
- Click "Run workflow"
- Choose build type (debug or release)
- Click "Run workflow"

## Monitoring Builds

### GitHub Actions Dashboard

1. Go to your repository
2. Click "Actions" tab
3. See all workflow runs
4. Click a run to see details
5. Click a job to see logs

### Email Notifications

GitHub sends emails for:
- Workflow failures
- Workflow successes (if enabled)

Configure in Settings → Notifications

### Slack Notifications (Optional)

If you set up `SLACK_WEBHOOK_URL` secret, you'll get Slack notifications for build status.

## Troubleshooting

### Build Fails: "Keystore not found"

The keystore is decoded from the base64 secret. Make sure:
1. `KEYSTORE_BASE64` secret is set correctly
2. Base64 encoding is valid
3. Secret value doesn't have extra whitespace

### Build Fails: "Invalid keystore password"

Make sure:
1. `KEYSTORE_PASSWORD` is correct
2. No extra whitespace in secret
3. Password matches the one used to create keystore

### Build Fails: "Gradle wrapper not found"

Make sure `android/gradlew` file exists and is executable:
```bash
ls -la android/gradlew
chmod +x android/gradlew
git add android/gradlew
git commit -m "Make gradlew executable"
git push
```

### Artifacts Not Available

Artifacts are automatically deleted after retention period:
- Debug: 30 days
- Release: 90 days

To keep longer, download before expiration or adjust retention in workflow.

## Best Practices

1. **Use branches for features**
   ```bash
   git checkout -b feature/new-feature
   # ... make changes ...
   git push origin feature/new-feature
   # Create pull request
   ```

2. **Never commit secrets**
   ```bash
   echo "odoo-pos.keystore" >> .gitignore
   git add .gitignore
   git commit -m "Add keystore to gitignore"
   ```

3. **Use semantic versioning**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Write meaningful commit messages**
   ```bash
   git commit -m "feat: add barcode scanner support"
   git commit -m "fix: resolve payment calculation bug"
   ```

5. **Review before merging**
   - Always create pull requests
   - Wait for CI checks to pass
   - Request code review
   - Merge only when approved

## File Structure

```
.github/
├── workflows/
│   ├── android-build.yml    # Main APK build workflow
│   └── test.yml             # Testing workflow

android/
├── app/
│   ├── build.gradle         # App-level Gradle config
│   └── src/
└── build.gradle             # Project-level Gradle config

.gitignore                    # Git ignore rules
```

## Next Steps

1. Create GitHub repository
2. Add secrets to GitHub
3. Push code to repository
4. Monitor first build in Actions tab
5. Download and test APK
6. Set up Google Play upload (optional)

## Support

- GitHub Actions Docs: https://docs.github.com/en/actions
- Gradle Documentation: https://gradle.org/
- Android Studio Docs: https://developer.android.com/studio

## Security Checklist

- [ ] Keystore file is in `.gitignore`
- [ ] All secrets are set in GitHub
- [ ] Repository is private (if business app)
- [ ] Branch protection rules enabled
- [ ] Code review required before merge
- [ ] Signed commits enabled (optional)
- [ ] Two-factor authentication enabled on GitHub
