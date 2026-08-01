#!/usr/bin/env bash
# Fetch the on-device OCR assets that make the photographed-page feature work
# offline. They are ~28MB and deliberately not committed.
#
#   ./scripts/fetch-ocr-assets.sh     (run once, from the pata/ directory)
set -euo pipefail
cd "$(dirname "$0")/.."

# tessdata_fast, not the standard models: roughly half the size and quicker to
# run, which is what matters on a 2GB phone. Slightly lower accuracy on hard
# pages, which the preprocessing in src/ocr.ts more than makes up for.
#
# Stored UNCOMPRESSED on purpose: the Android build decompresses any .gz under
# assets/ and strips the extension, so a .gz would 404 inside the APK while
# working fine in a browser.
echo "→ language models (12 languages, tessdata_fast)"
mkdir -p public/tessdata
for L in hin ben tam tel kan mal guj ori pan asm mar eng; do
  if [ -s "public/tessdata/$L.traineddata" ]; then continue; fi
  curl -sSL -o "public/tessdata/$L.traineddata" \
    "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/$L.traineddata"
  echo "  $L"
done

echo "→ OCR worker + WASM cores"
mkdir -p public/tesseract
cp node_modules/tesseract.js/dist/worker.min.js public/tesseract/
# All three cores ship so any device works offline, whatever SIMD it supports.
for V in tesseract-core-lstm tesseract-core-simd-lstm tesseract-core-relaxedsimd-lstm; do
  cp "node_modules/tesseract.js-core/$V.wasm.js" public/tesseract/
done

echo "✓ done — $(du -sh public/tessdata public/tesseract | awk '{print $1}' | paste -sd+)"
