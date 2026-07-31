// Voice. In the APK, Android's WebView has NO Web Speech API — that is why
// voice never worked there. On native we use the platform engines via
// Capacitor plugins (Google speech recognition + system TTS, which cover the
// Indian languages the phone has voices for); in a browser we use the Web
// Speech API. Rule 7 still stands: recognition failure never blocks anyone —
// every caller offers a visible tap/typing fallback, and this module fails
// fast (rejects) rather than hanging.
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSR } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();

// --- Web Speech typings (not in TS's DOM lib) ---
interface SRAlternatives {
  readonly length: number;
  [j: number]: { transcript: string };
}
interface SRResultEvent { results: { [i: number]: SRAlternatives } }
interface SRInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SRResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
const WebSR: (new () => SRInstance) | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function canListen(): boolean {
  if (isNative) return true; // availability/permission resolved in listen()
  return !!WebSR && navigator.onLine !== false;
}

async function listenNative(lang: string): Promise<string[]> {
  const { available } = await NativeSR.available();
  if (!available) throw new Error('unavailable');
  const perm = await NativeSR.requestPermissions();
  if (perm.speechRecognition !== 'granted') throw new Error('denied');
  const result = await NativeSR.start({
    language: lang,
    // Ask for several guesses, not one. The recogniser's top pick is often
    // wrong on numbers and names while a lower-ranked guess is right; the
    // caller can try to parse each. Keeping only the first was throwing away
    // most of the accuracy the engine actually had.
    maxResults: 5,
    partialResults: false,
    popup: true, // the familiar Google mic dialog — robust in a noisy room
  });
  const matches = (result.matches ?? []).map((m) => m.trim()).filter(Boolean);
  if (!matches.length) throw new Error('nospeech');
  return matches;
}

function listenWeb(lang: string, timeoutMs: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!WebSR) return reject(new Error('unavailable'));
    const rec = new WebSR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { rec.stop(); } catch { /* already stopped */ }
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('timeout'))), timeoutMs);
    rec.onresult = (e: SRResultEvent) =>
      finish(() => {
        const alts = e.results[0];
        const out: string[] = [];
        for (let i = 0; i < (alts.length ?? 1); i++) {
          const t = alts[i]?.transcript?.trim();
          if (t) out.push(t);
        }
        out.length ? resolve(out) : reject(new Error('nospeech'));
      });
    rec.onerror = () => finish(() => reject(new Error('error')));
    rec.onend = () => finish(() => reject(new Error('nospeech')));
    try {
      rec.start();
    } catch {
      finish(() => reject(new Error('error')));
    }
  });
}

/** All the recogniser's guesses, best first. Callers that can validate the
 *  content (a number, a known topic) should try each. */
export function listenAll(lang: string, timeoutMs = 10000): Promise<string[]> {
  return isNative ? listenNative(lang) : listenWeb(lang, timeoutMs);
}

/** Just the best guess, for free text where there is nothing to validate against. */
export async function listen(lang: string, timeoutMs = 10000): Promise<string> {
  return (await listenAll(lang, timeoutMs))[0];
}

// --- Text to speech ---
let speaking = false;

export async function speak(text: string, lang: string): Promise<void> {
  await stopSpeak();
  speaking = true;
  if (isNative) {
    try {
      await TextToSpeech.speak({ text, lang, rate: 0.95 });
    } finally {
      speaking = false;
    }
    return;
  }
  if (!('speechSynthesis' in window)) {
    speaking = false;
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
  if (match) u.voice = match;
  u.onend = () => (speaking = false);
  u.onerror = () => (speaking = false);
  speechSynthesis.speak(u);
}

export async function stopSpeak(): Promise<void> {
  speaking = false;
  if (isNative) {
    try { await TextToSpeech.stop(); } catch { /* not speaking */ }
    return;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  if (isNative) return speaking;
  return ('speechSynthesis' in window && speechSynthesis.speaking) || speaking;
}
