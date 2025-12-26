#!/usr/bin/env node

/**
 * Icon Generator Script
 * Generates all required PWA icons from an SVG source
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp package is required');
  console.log('📦 Install it with: npm install sharp');
  console.log('   Or: cd frontend/web-app && npm install sharp');
  process.exit(1);
}

// Icon sizes required for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Additional icons
const additionalIcons = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 72, name: 'badge-72x72.png' },
];

// Generate icons for a specific app
async function generateIcons(appName, appPath) {
  const svgPath = path.join(appPath, 'public', 'favicon.svg');
  const publicPath = path.join(appPath, 'public');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.log(`⚠️  SVG not found: ${svgPath}`);
    console.log(`   Skipping ${appName}...`);
    return;
  }

  console.log(`\n🎨 Generating icons for ${appName}...`);
  console.log(`   Source: ${svgPath}`);
  console.log(`   Output: ${publicPath}\n`);

  // Generate all icon sizes
  for (const icon of [...iconSizes, ...additionalIcons]) {
    try {
      const outputPath = path.join(publicPath, icon.name);
      
      await sharp(svgPath)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`   ✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`   ❌ Error generating ${icon.name}:`, error.message);
    }
  }

  // Generate favicon.ico (multi-size ICO file)
  try {
    const faviconSizes = [16, 32, 48];
    const faviconImages = await Promise.all(
      faviconSizes.map(size =>
        sharp(svgPath)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    // Note: sharp doesn't support ICO format directly
    // We'll create a 32x32 PNG as favicon.ico alternative
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicPath, 'favicon.ico'));

    console.log(`   ✅ Generated: favicon.ico (32x32)`);
  } catch (error) {
    console.error(`   ❌ Error generating favicon.ico:`, error.message);
  }

  console.log(`\n✨ ${appName} icons generated successfully!`);
}

// Main function
async function main() {
  console.log('🚀 PWA Icon Generator');
  console.log('====================\n');

  const rootDir = path.resolve(__dirname, '..');
  const webAppPath = path.join(rootDir, 'frontend', 'web-app');
  const adminPath = path.join(rootDir, 'frontend', 'superadmin-portal');

  // Generate icons for web app
  if (fs.existsSync(webAppPath)) {
    await generateIcons('Web App', webAppPath);
  } else {
    console.log('⚠️  Web app directory not found');
  }

  // Generate icons for admin portal
  if (fs.existsSync(adminPath)) {
    await generateIcons('SuperAdmin Portal', adminPath);
  } else {
    console.log('⚠️  SuperAdmin portal directory not found');
  }

  console.log('\n🎉 All icons generated!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify icons in the public folders');
  console.log('   2. Test PWA installation in browsers');
  console.log('   3. Update manifest.json if needed');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

