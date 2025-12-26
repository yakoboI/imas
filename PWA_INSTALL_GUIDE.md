# PWA Install Guide

## ✅ PWA Features Implemented

### Web App (`app.inventora.store`)
- ✅ Manifest.json configured
- ✅ Service Worker registered
- ✅ Install prompt component
- ✅ Install button in navbar
- ✅ Offline caching support

### SuperAdmin Portal (`admin.inventora.store`)
- ✅ Manifest.json configured
- ✅ Service Worker registered
- ✅ Install prompt component

## 📱 How Users Can Install

### Desktop (Chrome, Edge, Firefox)
1. **Automatic Prompt**: A banner appears at the bottom of the screen
2. **Manual Install**: Click the install icon (📥) in the browser address bar
3. **Navbar Button**: Click the install button in the top navbar (when available)

### Mobile (Android - Chrome)
1. **Automatic Prompt**: A banner appears at the bottom
2. **Menu Option**: Tap the menu (⋮) → "Install App" or "Add to Home Screen"
3. **Browser Prompt**: Chrome may show a popup asking to install

### Mobile (iOS - Safari)
1. **Share Button**: Tap the share button (□↑)
2. **Add to Home Screen**: Select "Add to Home Screen"
3. **Customize**: Edit the name if desired, then tap "Add"

## 🎨 Required Icon Files

You need to create and add these icon files to the `public` folder:

### Web App Icons (`frontend/web-app/public/`)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (required)
- `icon-384x384.png`
- `icon-512x512.png` (required)
- `apple-touch-icon.png` (180x180 for iOS)
- `badge-72x72.png` (for notifications)

### SuperAdmin Portal Icons (`frontend/superadmin-portal/public/`)
- `icon-192x192.png` (required)
- `icon-512x512.png` (required)

## 🔧 Features

### Install Prompt
- **Smart Display**: Only shows when:
  - App is not already installed
  - Browser supports PWA installation
  - User hasn't dismissed it in the last 7 days
- **Dismissible**: Users can dismiss and it won't show again for 7 days
- **Auto-hide**: Automatically hides after installation

### Service Worker
- **Offline Support**: Caches static assets for offline access
- **Push Notifications**: Supports push notifications
- **Background Sync**: Ready for background data sync

### Manifest
- **App Name**: "IMAS - Inventory Management System"
- **Short Name**: "IMAS"
- **Theme Color**: Matches your brand (#1976d2 for web app, #9c27b0 for admin)
- **Display Mode**: Standalone (looks like a native app)
- **Shortcuts**: Quick access to Dashboard, Products, Inventory

## 📝 Testing

### Test Installation
1. Open the app in a supported browser (Chrome, Edge, Firefox)
2. Look for the install prompt at the bottom
3. Or check the browser menu for "Install App" option
4. After installation, the app should open in a standalone window

### Test Offline
1. Install the app
2. Open DevTools → Network tab
3. Enable "Offline" mode
4. Refresh - the app should still load (cached assets)

## 🚀 Benefits

- **Faster Access**: No need to type URL
- **Offline Support**: Works even without internet (cached pages)
- **App-like Experience**: Standalone window, no browser UI
- **Home Screen Icon**: Quick access from device home screen
- **Better Performance**: Cached assets load faster
- **Push Notifications**: Receive notifications even when app is closed

## ⚠️ Important Notes

1. **HTTPS Required**: PWA features only work on HTTPS (or localhost)
2. **Icons Required**: App won't be installable without proper icon files
3. **Service Worker**: Must be served from root domain (not subdirectory)
4. **Browser Support**: 
   - ✅ Chrome/Edge (Desktop & Android)
   - ✅ Firefox (Desktop)
   - ✅ Safari (iOS 11.3+)
   - ⚠️ Safari (Desktop) - Limited support

## 🎯 Next Steps

1. **Create Icons**: Generate all required icon sizes
2. **Test Installation**: Test on different devices/browsers
3. **Customize**: Update manifest.json with your branding
4. **Monitor**: Track installation rates via analytics

