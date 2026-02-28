#!/bin/bash
set -euo pipefail

OUT_NAME="extension.zip"

# Create a zip suitable for uploading/sharing, excluding dev-only files.
rm -f "$OUT_NAME"

zip -r "$OUT_NAME" \
  manifest.json \
  background.bundle.js \
  popup.html popup.js \
  options.html options.js \
  contentScript.js \
  icons \
  styles/output.css \
  -x "**/.DS_Store" "node_modules/**" "styles/input.css" "package-lock.json" "tailwind.config.js" "postcss.config.js" "scripts/**" "background.js" "esbuild.config.js"

echo "Wrote $OUT_NAME"
