// On-device OCR — the offline half of "photograph a page and it tells you
// what's on it" (§7.2). Tesseract runs entirely inside the app: the worker,
// the WASM core and the language models are all bundled, so a photographed
// page is really read with the network off. No image ever leaves the phone
// on this path.
//
// The image is a PAGE, never a person (C9) — same rule as everywhere else.
import { createWorker, type Worker } from 'tesseract.js';

/** Tesseract language code per app language. Marathi and Hindi share Devanagari
 *  but have separate models; Assamese and Bengali likewise. */
const TESS_LANG: Record<string, string> = {
  hi: 'hin', en: 'eng', mr: 'mar', bn: 'ben', ta: 'tam', te: 'tel',
  kn: 'kan', ml: 'mal', gu: 'guj', or: 'ori', pa: 'pan', as: 'asm',
};

const BASE = new URL('./', location.href).href;
let worker: Worker | null = null;
let workerLang = '';

async function getWorker(lang: string, onProgress?: (pct: number) => void): Promise<Worker> {
  if (worker && workerLang === lang) return worker;
  if (worker) {
    await worker.terminate();
    worker = null;
  }
  worker = await createWorker(lang, 1, {
    workerPath: BASE + 'tesseract/worker.min.js',
    corePath: BASE + 'tesseract/',
    langPath: BASE + 'tessdata',
    // The models are bundled; caching a second copy in IndexedDB wastes
    // scarce storage on a ₹6,000 phone.
    cacheMethod: 'none',
    // Models ship uncompressed on purpose: the Android build decompresses any
    // .gz in assets/ and strips the extension, so a .gz here would 404 inside
    // the APK while working fine in a browser.
    gzip: false,
    logger: onProgress
      ? (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
        }
      : undefined,
  });
  workerLang = lang;
  return worker;
}

/**
 * Clean the photo before OCR. A phone snap of a book is a bad OCR input:
 * uneven room light, page curl, camera shadow, JPEG noise. Tesseract wants
 * flat black text on flat white paper, so we give it that.
 *
 * Adaptive (local-mean) thresholding rather than one global cut-off, because
 * a global threshold turns the shadowed half of a curled page into a black
 * block and loses every word in it.
 */
export function preprocess(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  // 1. Greyscale, perceptually weighted, into a plain array.
  const grey = new Float32Array(w * h);
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    grey[p] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  }

  // 2. Integral image, so the local mean below is O(1) per pixel instead of
  //    O(window²) — the difference between instant and unusable on a 2GB phone.
  const sum = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += grey[y * w + x];
      sum[(y + 1) * (w + 1) + (x + 1)] = sum[y * (w + 1) + (x + 1)] + row;
    }
  }
  const meanOf = (x0: number, y0: number, x1: number, y1: number) => {
    const area = (x1 - x0) * (y1 - y0);
    return (
      (sum[y1 * (w + 1) + x1] - sum[y0 * (w + 1) + x1] -
       sum[y1 * (w + 1) + x0] + sum[y0 * (w + 1) + x0]) / area
    );
  };

  // Window ~1/16 of the short edge: wide enough to span a character, narrow
  // enough to track a shadow gradient across the page.
  const radius = Math.max(8, Math.floor(Math.min(w, h) / 32));
  // Text must be this much darker than its surroundings to count as ink;
  // keeps faint paper texture and print show-through from becoming speckle.
  const BIAS = 8;

  for (let y = 0, p = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius), y1 = Math.min(h, y + radius + 1);
    for (let x = 0; x < w; x++, p++) {
      const x0 = Math.max(0, x - radius), x1 = Math.min(w, x + radius + 1);
      const ink = grey[p] < meanOf(x0, y0, x1, y1) - BIAS ? 0 : 255;
      const i = p * 4;
      px[i] = px[i + 1] = px[i + 2] = ink;
      px[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

export interface OcrResult {
  /** Lines of text actually found on the page. */
  lines: string[];
  /** Mean recognition confidence, 0–100. */
  confidence: number;
}

/** Load a data URL into a canvas we can work on. */
async function toCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  const res = await fetch(dataUrl);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

/** Read a photographed page offline. `langCode` is an app language code (hi, ta…). */
export async function readPage(
  imageDataUrl: string,
  langCode: string,
  onProgress?: (pct: number) => void
): Promise<OcrResult> {
  const tess = TESS_LANG[langCode] ?? 'eng';
  const w = await getWorker(tess, onProgress);
  // Clean the photo first — this is worth more accuracy than any Tesseract
  // parameter, because the input is a room-lit phone snap, not a scan.
  const cleaned = preprocess(await toCanvas(imageDataUrl));
  const { data } = await w.recognize(cleaned);
  const lines = data.text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    // Drop lines that are mostly OCR noise rather than words.
    .filter((l) => l.length > 2 && /[\p{L}\p{N}]{2,}/u.test(l));
  return { lines, confidence: Math.round(data.confidence) };
}

/** Free the worker — a 2GB phone should not hold the WASM heap open. */
export async function releaseOcr(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    workerLang = '';
  }
}
