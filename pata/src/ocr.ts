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

export interface OcrResult {
  /** Lines of text actually found on the page. */
  lines: string[];
  /** Mean recognition confidence, 0–100. */
  confidence: number;
}

/** Read a photographed page offline. `langCode` is an app language code (hi, ta…). */
export async function readPage(
  imageDataUrl: string,
  langCode: string,
  onProgress?: (pct: number) => void
): Promise<OcrResult> {
  const tess = TESS_LANG[langCode] ?? 'eng';
  const w = await getWorker(tess, onProgress);
  const { data } = await w.recognize(imageDataUrl);
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
