#!/bin/bash
set -euo pipefail

# Generate Chrome extension icons from a single source using macOS `sips`.
# Usage: ./scripts/generate-icons.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICONS_DIR="$ROOT_DIR/icons"

cd "$ICONS_DIR"

if [ ! -f "icon.png" ]; then
  echo "Error: icons/icon.png not found. Copy your source icon to $ICONS_DIR/icon.png" >&2
  exit 1
fi

echo "Generating icons..."

sips -z 16 16 icon.png --out icon16.png >/dev/null
sips -z 48 48 icon.png --out icon48.png >/dev/null
sips -z 128 128 icon.png --out icon128.png >/dev/null

echo "Icons generated successfully!"
ls -1 icon16.png icon48.png icon128.png
