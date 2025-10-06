# Auto-Update Configuration Guide

## Overview
Your Electron Markdown Reader now has automatic update functionality built-in using `electron-updater`.

## How Auto-Updates Work

### For Users:
1. **Automatic Checks**: App checks for updates on startup and periodically
2. **Background Download**: Updates download automatically in the background  
3. **User Notification**: Users are notified when an update is ready
4. **Easy Installation**: One-click restart to apply updates

### For Developers:

## Configuration
The auto-updater is configured in `package.json`:

```json
"publish": [
  {
    "provider": "github",
    "owner": "urlund", 
    "repo": "markdown-reader"
  }
]
```

## Publishing Updates

### 1. Update Version
```bash
npm version patch  # or minor/major
```

### 2. Build and Publish to GitHub
```bash
npm run publish          # All platforms
npm run publish:mac      # macOS only
npm run publish:win      # Windows only  
npm run publish:linux    # Linux only
```

### 3. GitHub Release
The `--publish=always` flag will:
- Build your app for all platforms
- Upload artifacts to GitHub Releases
- Create release metadata for auto-updater

## Manual Update Checking (for Advanced Users)

The app exposes these APIs to the renderer:

```javascript
// Check for updates manually
const updateInfo = await window.api.checkForUpdates();

// Download update manually  
const result = await window.api.downloadUpdate();

// Get current app version
const version = await window.api.getAppVersion();

// Install downloaded update
await window.api.quitAndInstall();
```

## Alternative Publish Providers

### Amazon S3
```json
"publish": [
  {
    "provider": "s3",
    "bucket": "your-bucket-name",
    "region": "us-east-1"
  }
]
```

### Generic Server
```json
"publish": [
  {
    "provider": "generic", 
    "url": "https://your-server.com/updates/"
  }
]
```

## Development vs Production

- **Development**: Auto-updater is disabled (logged message shown)
- **Production**: Auto-updater checks for updates automatically

## Update Process Flow

1. **Startup Check**: App checks for updates 5 seconds after launch
2. **Background Download**: If update available, downloads silently  
3. **User Notification**: Shows dialog when download complete
4. **Installation**: User can choose to restart now or later
5. **Next Launch**: If "later" chosen, update applies on next app start

## Security Features

✅ **Code Signature Verification**: Updates verified against signatures  
✅ **HTTPS Only**: All downloads use secure connections  
✅ **Integrity Checks**: Files verified before installation  
✅ **Rollback Support**: Can revert to previous version if needed  

## Troubleshooting

### Common Issues:
- **"No updates available"**: Check GitHub releases are properly tagged
- **Download failures**: Verify internet connection and GitHub access
- **Signature errors**: Ensure releases are properly signed

### Logs:
Auto-updater logs are shown in the console during development.

## Before Publishing:

1. **Update package.json**: Set correct GitHub owner/repo
2. **Test locally**: Build and test app functionality  
3. **Run tests**: `npm test` to ensure all tests pass
4. **Version bump**: `npm version patch/minor/major`
5. **Publish**: `npm run publish`

Your users will now receive automatic updates seamlessly! 🚀
