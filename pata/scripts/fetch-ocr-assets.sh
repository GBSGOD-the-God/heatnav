#!/usr/bin/env bash
# Fetch the on-device OCR assets that make the photographed-page feature work
# offline. They are ~33MB and deliberately not committed.
#
#   ./scripts/fetch-ocr-assets.sh     (run once, from the pata/ directory)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ language models (12 languages)"
mkdir -p public/tessdata
for L in hin ben tam tel kan mal guj ori pan asm mar; do
  [ -s "public/tessdata/$L.traineddata" ] && continue
  curl -sSL -o "public/tessdata/$L.traineddata.gz" \
    "https://cdn.jsdelivr.net/npm/@tesseract.js-data/$L@1.0.0/4.0.0/$L.traineddata.gz"
  gunzip -f "public/tessdata/$L.traineddata.gz"
  echo "  $L"
done
# English: the "fast" model, a fifth the size of the default one.
[ -s public/tessdata/eng.traineddata ] || curl -sSL -o public/tessdata/eng.traineddata \
  "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata"

# Models are stored UNCOMPRESSED on purpose: the Android build decompresses any
# .gz under assets/ and strips the extension, so a .gz would 404 in the APK.

echo "→ OCR worker + WASM cores"
mkdir -p public/tesseract
cp node_modules/tesseract.js/dist/worker.min.js public/tesseract/
for V in tesseract-core-lstm tesseract-core-simd-lstm tesseract-core-relaxedsimd-lstm; do
  cp "node_modules/tesseract.js-core/$V.wasm.js" public/tesseract/
done
# All three cores ship so any device works offline, whatever SIMD it supports.

echo "✓ done — $(du -sh public/tessdata public/tesseract | awk '{print $1}' | paste -sd+ )"
