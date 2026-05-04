# GitHub Secrets Setup — Step-by-Step Guide

Your code has been successfully pushed to GitHub! Now you need to configure the secrets for automated Android builds.

## Quick Links

- **Your Repository**: https://github.com/omairahm3d-del/Alsalikodoo
- **GitHub Secrets Page**: https://github.com/omairahm3d-del/Alsalikodoo/settings/secrets/actions

## Prerequisites

Before setting up secrets, you need:

1. **Android Keystore File** (`odoo-pos.keystore`)
   - If you don't have one yet, create it:
   ```bash
   keytool -genkey -v -keystore odoo-pos.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias odoo-pos-key
   ```

2. **Keystore Credentials**
   - Keystore password
   - Key alias (usually `odoo-pos-key`)
   - Key password

## Step 1: Convert Keystore to Base64

The keystore file needs to be encoded as base64 to be stored as a GitHub secret.

### macOS/Linux

```bash
# Copy to clipboard
base64 odoo-pos.keystore | pbcopy

# Or save to file
base64 odoo-pos.keystore > keystore.b64
cat keystore.b64
```

### Windows (PowerShell)

```powershell
# Copy to clipboard
[Convert]::ToBase64String([IO.File]::ReadAllBytes("odoo-pos.keystore")) | Set-Clipboard

# Or display in terminal
[Convert]::ToBase64String([IO.File]::ReadAllBytes("odoo-pos.keystore"))
```

## Step 2: Add Secrets to GitHub

1. Go to: https://github.com/omairahm3d-del/Alsalikodoo/settings/secrets/actions

2. Click **"New repository secret"** for each of the following:

### Secret 1: KEYSTORE_BASE64

- **Name**: `KEYSTORE_BASE64`
- **Value**: (paste the base64 string from Step 1)

Click "Add secret"

### Secret 2: KEYSTORE_PASSWORD

- **Name**: `KEYSTORE_PASSWORD`
- **Value**: (your keystore password)

Click "Add secret"

### Secret 3: KEY_ALIAS

- **Name**: `KEY_ALIAS`
- **Value**: `odoo-pos-key` (or your key alias)

Click "Add secret"

### Secret 4: KEY_PASSWORD

- **Name**: `KEY_PASSWORD`
- **Value**: (your key password)

Click "Add secret"

## Step 3: Verify Secrets Are Set

Go to: https://github.com/omairahm3d-del/Alsalikodoo/settings/secrets/actions

You should see all 4 secrets listed:
- ✓ KEYSTORE_BASE64
- ✓ KEYSTORE_PASSWORD
- ✓ KEY_ALIAS
- ✓ KEY_PASSWORD

## Step 4: Test the Workflow

### Option A: Trigger via Pull Request (Recommended for Testing)

1. Create a test branch:
   ```bash
   git checkout -b test-workflow
   ```

2. Make a small change (e.g., update README):
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: trigger workflow"
   git push origin test-workflow
   ```

3. Go to GitHub and create a pull request
4. Watch the "Checks" tab for workflow status
5. Once complete, download the debug APK from Artifacts

### Option B: Trigger Manually

1. Go to: https://github.com/omairahm3d-del/Alsalikodoo/actions
2. Click "Android APK Build" workflow
3. Click "Run workflow"
4. Choose "debug" or "release"
5. Click "Run workflow"

### Option C: Trigger via Push to Main

1. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. Go to Actions tab to watch the build

## Step 5: Download Build Artifacts

### From Pull Request

1. Go to your PR: https://github.com/omairahm3d-del/Alsalikodoo/pulls
2. Click on your PR
3. Scroll to "Checks" section
4. Click "Details" on the Android APK Build check
5. Scroll to "Artifacts" section
6. Download "app-debug"

### From Actions Tab

1. Go to Actions: https://github.com/omairahm3d-del/Alsalikodoo/actions
2. Click the workflow run
3. Scroll to "Artifacts" section
4. Download the APK

## Workflow Behavior

### Pull Requests
- Builds **debug APK** automatically
- No secrets required
- Available in Artifacts for 30 days
- Comments on PR with build status

### Push to Main Branch
- Builds **release APK** and **app bundle**
- Requires all secrets
- Available in Artifacts for 90 days
- Can be uploaded to Google Play Store

### Manual Trigger
- Choose between debug and release
- Go to Actions → Android APK Build → Run workflow

## Troubleshooting

### Build Fails: "Keystore not found"

**Solution**: Verify `KEYSTORE_BASE64` secret:
1. Go to Secrets settings
2. Click the pencil icon next to `KEYSTORE_BASE64`
3. Verify the value is complete (no truncation)
4. Re-encode if needed

### Build Fails: "Invalid keystore password"

**Solution**: Verify credentials:
1. Check `KEYSTORE_PASSWORD` is correct
2. Check `KEY_ALIAS` matches your keystore
3. Check `KEY_PASSWORD` is correct
4. Re-create secrets if needed

### Build Fails: "Gradle wrapper not found"

**Solution**: Ensure gradlew is executable:
```bash
chmod +x android/gradlew
git add android/gradlew
git commit -m "Make gradlew executable"
git push origin main
```

### Artifacts Not Showing

**Solution**: Check workflow status:
1. Go to Actions tab
2. Click the workflow run
3. Check for errors in the logs
4. Verify all steps completed successfully

## Monitoring Builds

### GitHub Actions Dashboard

- **URL**: https://github.com/omairahm3d-del/Alsalikodoo/actions
- Shows all workflow runs
- Click a run to see details
- Click a job to see logs

### Email Notifications

GitHub sends emails for:
- Workflow failures
- Workflow successes (if enabled)

Configure in: Settings → Notifications

## Optional: Slack Notifications

To get Slack notifications for build status:

1. Create a Slack webhook:
   - Go to your Slack workspace
   - Settings → Apps & integrations → Incoming Webhooks
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #builds)
   - Copy webhook URL

2. Add to GitHub Secrets:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: (paste webhook URL)

3. Uncomment Slack step in `.github/workflows/android-build.yml` (already included)

## Next Steps

1. ✓ Code pushed to GitHub
2. → Add secrets (this guide)
3. → Test first build
4. → Download and test APK
5. → Upload to Google Play Store (optional)

## File Locations

| File | Purpose |
|------|---------|
| `.github/workflows/android-build.yml` | Main build workflow |
| `.github/workflows/test.yml` | Testing workflow |
| `GITHUB_SETUP.md` | Full GitHub setup guide |
| `ANDROID_BUILD_GUIDE.md` | Local build instructions |
| `APK_QUICK_START.md` | Quick reference |

## Security Best Practices

✓ **Never commit secrets** to Git
✓ **Keystore file** is in `.gitignore`
✓ **Secrets are encrypted** by GitHub
✓ **Only visible to** repository maintainers
✓ **Rotated regularly** for security

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **GitHub Secrets Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Gradle Documentation**: https://gradle.org/

## Checklist

- [ ] Keystore file created
- [ ] Keystore converted to base64
- [ ] KEYSTORE_BASE64 secret added
- [ ] KEYSTORE_PASSWORD secret added
- [ ] KEY_ALIAS secret added
- [ ] KEY_PASSWORD secret added
- [ ] First build triggered
- [ ] APK downloaded and tested
- [ ] Ready for production releases

---

**Questions?** Check the troubleshooting section or refer to the full documentation in `GITHUB_SETUP.md`.
