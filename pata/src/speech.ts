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
//
// Android hands you whatever voice its default engine happens to have for a
// locale, and the default is often the low-footprint one that ships with the
// phone — flat, clipped, and hard to follow for a child who is already
// struggling with the words. Three things make it markedly better, none of
// which need a network or a paid service:
//
//   1. Pick the voice deliberately. A locale like ta-IN can have several
//      installed voices of very different quality; the engine's first match is
//      not the best one. Prefer an exact language+country match, then a
//      non-default network voice, which on Android means the higher-quality
//      downloaded one rather than the compact fallback.
//   2. Speak sentence by sentence. Long strings get truncated by some engines
//      and lose their intonation on nearly all of them; a sentence at a time
//      keeps the phrasing and lets stop() actually stop.
//   3. Slow down a little. 0.9 is noticeably easier to follow than 1.0 for a
//      reader who is decoding as they listen, without sounding sluggish.
let speaking = false;
let cachedVoices: SpeechSynthesisVoice[] = [];

/** Split on sentence ends across all twelve scripts — Devanagari/Bengali/Odia
 *  danda included, since none of these end sentences with a full stop. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।॥])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Android's own list, best first. */
async function bestNativeVoice(lang: string): Promise<number | undefined> {
  try {
    const { voices } = await TextToSpeech.getSupportedVoices();
    const want = lang.toLowerCase();
    const base = want.slice(0, 2);
    const score = (v: { lang?: string; name?: string; networkConnectionRequired?: boolean }) => {
      const vl = (v.lang ?? '').toLowerCase().replace('_', '-');
      if (vl !== want && !vl.startsWith(base)) return -1;
      let n = vl === want ? 2 : 1;
      // Compact voices are the small preinstalled ones; anything else on the
      // device was downloaded deliberately and sounds better.
      if (!/#?compact|-local\b/i.test(v.name ?? '')) n += 2;
      if (v.networkConnectionRequired) n += 1;
      return n;
    };
    let best = -1;
    let at: number | undefined;
    voices.forEach((v, i) => {
      const n = score(v);
      if (n > best) { best = n; at = i; }
    });
    return best > 0 ? at : undefined;
  } catch {
    return undefined; // older plugin, or an engine that will not enumerate
  }
}

export async function speak(text: string, lang: string): Promise<void> {
  await stopSpeak();
  speaking = true;
  const parts = sentences(text);

  if (isNative) {
    const voice = await bestNativeVoice(lang);
    try {
      for (const part of parts) {
        if (!speaking) return; // stopSpeak() ran while the last sentence played
        await TextToSpeech.speak({ text: part, lang, rate: 0.9, ...(voice != null ? { voice } : {}) });
      }
    } finally {
      speaking = false;
    }
    return;
  }

  if (!('speechSynthesis' in window)) {
    speaking = false;
    return;
  }
  // getVoices() is empty until the engine has loaded; keep the last good list.
  const voices = speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  const want = lang.toLowerCase();
  const base = want.slice(0, 2);
  const match =
    cachedVoices.find((v) => v.lang.toLowerCase().replace('_', '-') === want && !v.localService) ??
    cachedVoices.find((v) => v.lang.toLowerCase().replace('_', '-') === want) ??
    cachedVoices.find((v) => v.lang.toLowerCase().startsWith(base));

  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = lang;
    u.rate = 0.9;
    if (match) u.voice = match;
    if (i === parts.length - 1) {
      u.onend = () => (speaking = false);
      u.onerror = () => (speaking = false);
    }
    speechSynthesis.speak(u);
  });
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
