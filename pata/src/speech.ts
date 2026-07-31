// Web Speech helpers. Rule 7: recognition failure never blocks anyone — every
// caller of listen() must offer a visible tap/typing fallback, and this module
// makes failure explicit (rejects) rather than hanging.

// Minimal local typings — SpeechRecognition is not in TS's DOM lib.
interface SRResultEvent { results: { [i: number]: { [j: number]: { transcript: string } } } }
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

const SR: (new () => SRInstance) | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function canListen(): boolean {
  return !!SR && navigator.onLine !== false; // most engines need the network
}

export function listen(lang: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('unavailable'));
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
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
      finish(() => resolve(e.results[0][0].transcript));
    rec.onerror = () => finish(() => reject(new Error('error')));
    rec.onend = () => finish(() => reject(new Error('nospeech')));
    try {
      rec.start();
    } catch {
      finish(() => reject(new Error('error')));
    }
  });
}

export function speak(text: string, lang: string): void {
  if (!('speechSynthesis' in window)) return;
  stopSpeak();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  const voices = speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
  if (match) u.voice = match;
  speechSynthesis.speak(u);
}

export function stopSpeak(): void {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && speechSynthesis.speaking;
}
