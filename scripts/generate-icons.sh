#!/bin/bash

# Icon Generator Script (Alternative - using ImageMagick)
# Generates all required PWA icons from an SVG source
# 
# Requirements:
# - ImageMagick: sudo apt-get install imagemagick (Linux) or brew install imagemagick (Mac)
# 
# Usage:
#   bash scripts/generate-icons.sh

set -e

echo "🚀 PWA Icon Generator (ImageMagick)"
echo "===================================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ Error: ImageMagick is required"
    echo "📦 Install it with:"
    echo "   Linux: sudo apt-get install imagemagick"
    echo "   Mac: brew install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Icon sizes
declare -a sizes=(72 96 128 144 152 192 384 512)
declare -a additional=(180)

# Function to generate icons
generate_icons() {
    local app_name=$1
    local svg_path=$2
    local output_dir=$3

    if [ ! -f "$svg_path" ]; then
        echo "⚠️  SVG not found: $svg_path"
        echo "   Skipping $app_name..."
        return
    fi

    echo ""
    echo "🎨 Generating icons for $app_name..."
    echo "   Source: $svg_path"
    echo "   Output: $output_dir"
    echo ""

    # Generate standard icons
    for size in "${sizes[@]}"; do
        output_file="$output_dir/icon-${size}x${size}.png"
        convert "$svg_path" -resize "${size}x${size}" -background none "$output_file"
        echo "   ✅ Generated: icon-${size}x${size}.png"
    done

    # Generate Apple touch icon
    convert "$svg_path" -resize "180x180" -background none "$output_dir/apple-touch-icon.png"
    echo "   ✅ Generated: apple-touch-icon.png"

    # Generate badge
    convert "$svg_path" -resize "72x72" -background none "$output_dir/badge-72x72.png"
    echo "   ✅ Generated: badge-72x72.png"

    # Generate favicon (32x32)
    convert "$svg_path" -resize "32x32" -background none "$output_dir/favicon.ico"
    echo "   ✅ Generated: favicon.ico"

    echo ""
    echo "✨ $app_name icons generated successfully!"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Generate icons for web app
WEB_APP_SVG="$ROOT_DIR/frontend/web-app/public/favicon.svg"
WEB_APP_OUTPUT="$ROOT_DIR/frontend/web-app/public"
if [ -d "$(dirname "$WEB_APP_SVG")" ]; then
    generate_icons "Web App" "$WEB_APP_SVG" "$WEB_APP_OUTPUT"
fi

# Generate icons for admin portal
ADMIN_SVG="$ROOT_DIR/frontend/superadmin-portal/public/favicon.svg"
ADMIN_OUTPUT="$ROOT_DIR/frontend/superadmin-portal/public"
if [ -d "$(dirname "$ADMIN_SVG")" ]; then
    generate_icons "SuperAdmin Portal" "$ADMIN_SVG" "$ADMIN_OUTPUT"
fi

echo ""
echo "🎉 All icons generated!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify icons in the public folders"
echo "   2. Test PWA installation in browsers"
echo "   3. Update manifest.json if needed"

