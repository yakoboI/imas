# Icon Generation Scripts

This directory contains scripts to automatically generate all required PWA icons from SVG source files.

## Quick Start

### Using Node.js (Recommended)

```bash
# From project root
npm run generate-icons
```

**Requirements:**
- Node.js installed
- Sharp package: `cd frontend/web-app && npm install sharp`

### Using ImageMagick

```bash
# From project root
bash scripts/generate-icons.sh
```

**Requirements:**
- ImageMagick installed
- Linux/Mac: `sudo apt-get install imagemagick` or `brew install imagemagick`
- Windows: Use Git Bash or WSL

## What It Does

1. Reads `favicon.svg` from each app's `public` folder
2. Generates all required icon sizes (72x72, 96x96, 192x192, 512x512, etc.)
3. Creates `apple-touch-icon.png` for iOS
4. Creates `badge-72x72.png` for notifications
5. Creates `favicon.ico` for browser tabs

## Output

- **Web App**: `frontend/web-app/public/*.png`
- **Admin Portal**: `frontend/superadmin-portal/public/*.png`

## Customization

Edit the SVG files to change the icon design:
- `frontend/web-app/public/favicon.svg`
- `frontend/superadmin-portal/public/favicon.svg`

Then run the generator again to update all icons.

