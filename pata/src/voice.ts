// Reading aloud, well.
//
// The phone's own engine is what Android hands you by default, and for an
// essay-length passage it is genuinely hard to listen to: the compact voices
// that ship preinstalled are flat, clip their phrasing, and mangle Indian
// language prosody. That is a limit of the engine, not of how we call it — no
// amount of voice-picking fixes it, so there is a second path.
//
// When the district's server has a voice key, audio comes from Sarvam's
// Bulbul, which is trained on Indian languages specifically. When it does not,
// or the network is down, or the language is Assamese (no Bulbul voice), the
// phone reads it exactly as before. Nothing here is required for the app to
// work; it only ever makes the sound better.
//
// Three things make it usable on a 2G connection and a cheap phone:
//   - the text is split into chunks and the FIRST one starts playing while
//     the rest are still being fetched, so it begins in about a second
//     instead of after the whole essay has synthesised;
//   - every chunk is cached in IndexedDB by its own text, so replaying an
//     essay, or re-reading a paragraph you already heard, costs nothing and
//     works with the network off afterwards;
//   - any failure at all falls through to the device voice mid-sentence
//     rather than stopping.
import { getProxyUrl } from './ai';
import { kvGet, kvSet } from './db';
import { speakDevice, stopDevice } from './speech';
import type { Lang } from './types';

/** Sarvam has no Assamese voice. Everything else is covered. */
const SERVER_VOICE_LANGS: Lang[] = ['hi', 'en', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'pa', 'or'];

/** Well under the 2500-char API limit, and short enough that the first chunk
 *  arrives quickly. Long enough that we are not paying per sentence. */
const CHUNK_CHARS = 900;

/**
 * Split for speech: never mid-sentence, and never mid-word if a single
 * "sentence" runs past the limit (which happens with dictated text that has
 * no punctuation at all).
 */
export function chunkForSpeech(text: string, max = CHUNK_CHARS): string[] {
  const sentences = text
    .split(/(?<=[.!?।॥])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buf = '';
  const flush = () => { if (buf.trim()) out.push(buf.trim()); buf = ''; };

  for (const sentence of sentences) {
    if (sentence.length > max) {
      flush();
      let rest = sentence;
      while (rest.length > max) {
        const cut = rest.lastIndexOf(' ', max);
        out.push(rest.slice(0, cut > max * 0.5 ? cut : max).trim());
        rest = rest.slice(cut > max * 0.5 ? cut : max).trim();
      }
      buf = rest;
      continue;
    }
    if ((buf + ' ' + sentence).trim().length > max) flush();
    buf = buf ? `${buf} ${sentence}` : sentence;
  }
  flush();
  return out;
}

/** Cache key. Short, stable, and derived only from what was said — no ids. */
function cacheKey(text: string, lang: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + text.charCodeAt(i) + i, 2246822519) >>> 0;
  }
  return `tts:${lang}:${text.length}:${h1.toString(36)}${h2.toString(36)}`;
}

async function fetchChunk(text: string, lang: Lang): Promise<string | null> {
  const key = cacheKey(text, lang);
  const cached = await kvGet<string>(key);
  if (cached) return cached;

  const base = await getProxyUrl();
  if (!base) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(base + '/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    });
    if (!res.ok) return null; // 501 = no voice key set; anything else, same answer
    const { audio } = (await res.json()) as { audio?: string };
    if (!audio) return null;
    await kvSet(key, audio);
    return audio;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** True when the server can speak this language right now. Cheap: no request. */
export async function serverVoiceUsable(lang: Lang): Promise<boolean> {
  if (!SERVER_VOICE_LANGS.includes(lang)) return false;
  if (!navigator.onLine && !(await hasAnyCached())) return false;
  return (await getProxyUrl()) !== '';
}

async function hasAnyCached(): Promise<boolean> {
  return Boolean(await kvGet<string>('tts:seen'));
}

// --- playback ---------------------------------------------------------
let audioEl: HTMLAudioElement | null = null;
let token = 0;
let playing = false;

function play(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    const el = new Audio(url);
    audioEl = el;
    const done = (fn: () => void) => () => { URL.revokeObjectURL(url); fn(); };
    el.onended = done(resolve);
    el.onerror = done(() => reject(new Error('play')));
    el.play().catch(done(() => reject(new Error('play'))));
  });
}

/**
 * Read text aloud in the best voice available. Resolves when it has finished
 * or been stopped. Never throws — if everything fails the caller still had
 * their text read by the phone.
 */
export async function readAloud(text: string, lang: Lang, speechLocale: string): Promise<void> {
  await stopReading();
  const mine = ++token;
  playing = true;

  const chunks = chunkForSpeech(text);
  if (!chunks.length) { playing = false; return; }

  if (!(await serverVoiceUsable(lang))) {
    try { await speakDevice(text, speechLocale); } finally { if (mine === token) playing = false; }
    return;
  }

  // Fetch the first chunk, then keep one request in flight ahead of playback.
  let next = fetchChunk(chunks[0], lang);
  for (let i = 0; i < chunks.length; i++) {
    if (mine !== token) return; // stopped
    const audio = await next;
    next = i + 1 < chunks.length ? fetchChunk(chunks[i + 1], lang) : Promise.resolve(null);
    if (mine !== token) return;

    if (!audio) {
      // Server voice unavailable part-way through: finish the rest on the
      // phone rather than cutting the child off mid-essay.
      try { await speakDevice(chunks.slice(i).join(' '), speechLocale); } catch { /* nothing left to try */ }
      break;
    }
    await kvSet('tts:seen', '1');
    try {
      await play(audio);
    } catch {
      try { await speakDevice(chunks[i], speechLocale); } catch { /* ignore */ }
    }
  }
  if (mine === token) playing = false;
}

export async function stopReading(): Promise<void> {
  token++;
  playing = false;
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  await stopDevice();
}

export function isReading(): boolean {
  return playing || Boolean(audioEl && !audioEl.paused);
}
