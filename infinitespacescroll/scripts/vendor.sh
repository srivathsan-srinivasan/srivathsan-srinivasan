#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/assets/vendor"

mkdir -p "$VENDOR_DIR"

echo "Downloading three.js r128…"
curl -fsSL \
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" \
  -o "$VENDOR_DIR/three.min.js"

echo "Downloading anime.js 3.2.1…"
curl -fsSL \
  "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js" \
  -o "$VENDOR_DIR/anime.min.js"

echo "Done: $VENDOR_DIR"

