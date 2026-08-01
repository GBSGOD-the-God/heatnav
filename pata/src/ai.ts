// AI, via a proxy you control (see server/).
//
// No API key ever lives in this app. A teacher is never asked for one, and
// nothing here would work if a key were shipped anyway — an APK is a zip, and
// a key inside it can be extracted with one command. So the app calls a small
// Worker that holds the key server-side.
//
// Every function here is optional. If the proxy is unset, unreachable, rate
// limited or broken, callers fall back to the on-device path — OCR, the
// offline summariser and the built-in question bank — and the app keeps
// working with no network at all.
import { kvGet, kvSet, uid } from './db';
import type { Lesson, Question } from './types';

/** Baked in at build time (.env: VITE_PATA_AI_URL); overridable in Settings
 *  so a district can point at its own deployment without a rebuild. */
const BUILT_IN_URL = (import.meta.env?.VITE_PATA_AI_URL ?? '').trim();

export async function getProxyUrl(): Promise<string> {
  const override = (await kvGet<string>('aiProxyUrl')) ?? '';
  return (override || BUILT_IN_URL).replace(/\/+$/, '');
}
export async function setProxyUrl(url: string): Promise<void> {
  await kvSet('aiProxyUrl', url.trim().replace(/\/+$/, ''));
}
export function hasBuiltInUrl(): boolean {
  return BUILT_IN_URL !== '';
}

/** Stable per-install id, so one broken device can be rate limited without
 *  identifying anyone. Random — not derived from the phone or the child. */
async function deviceId(): Promise<string> {
  let id = await kvGet<string>('deviceId');
  if (!id) {
    id = uid() + uid();
    await kvSet('deviceId', id);
  }
  return id;
}

export async function aiAvailable(): Promise<boolean> {
  return navigator.onLine && (await getProxyUrl()) !== '';
}

/** Ask the proxy whether it is actually configured. Used by Settings only. */
export async function aiHealth(): Promise<'ok' | 'nokey' | 'unreachable' | 'unset'> {
  const base = await getProxyUrl();
  if (!base) return 'unset';
  try {
    const res = await fetch(base + '/health', { method: 'GET' });
    if (!res.ok) return 'unreachable';
    const body = await res.json();
    return body?.ai ? 'ok' : 'nokey';
  } catch {
    return 'unreachable';
  }
}

class AiError extends Error {}

async function call<T>(path: string, payload: unknown, timeoutMs = 60_000): Promise<T> {
  const base = await getProxyUrl();
  if (!base) throw new AiError('unset');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pata-Device': await deviceId() },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.status === 429) throw new AiError('ratelimit');
    if (!res.ok) throw new AiError('upstream');
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError((e as Error).name === 'AbortError' ? 'timeout' : 'offline');
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- lessons

interface RawLesson {
  topicLabel: { hi: string; en: string };
  subject: { hi: string; en: string };
  gradeBand: string;
  material: { hi: string[]; en: string[] };
  questions: Question[];
}

/** §7.1 — lesson material + 3 diagnostic questions, each distractor carrying
 *  a named misconception (§4). */
export async function aiGenerateLesson(topic: string): Promise<Lesson> {
  const raw = await call<RawLesson>('/lesson', { topic });
  if (!Array.isArray(raw.questions) || raw.questions.length < 3) throw new AiError('badoutput');

  const questions = raw.questions.slice(0, 3).map((q) => {
    for (const k of ['A', 'B', 'C', 'D'] as const) {
      const o = q.options?.[k] as (Question['options']['A'] & { mis?: unknown }) | undefined;
      if (!o) throw new AiError('badoutput');
      if (o.correct) delete o.mis;
      else if (!o.mis) o.mis = { hi: 'गलतफ़हमी', en: 'misconception' };
    }
    // A question with no correct answer is worse than no question.
    const correct = (['A', 'B', 'C', 'D'] as const).filter((k) => q.options[k].correct);
    if (correct.length !== 1) throw new AiError('badoutput');
    return q;
  });

  return {
    id: uid(),
    topicKey: 'ai-' + topic.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
    topicLabel: raw.topicLabel,
    subject: raw.subject,
    gradeBand: raw.gradeBand || '—',
    material: raw.material,
    questions,
    source: 'ai',
    createdAt: Date.now(),
  };
}

// ---------------------------------------------------------------- pages

export interface AiPage {
  title: string;
  bookLine: string;
  pageLines: string[];
  explanation: string;
  concepts: Array<{ label: string; keywords: string[]; wrong: boolean }>;
}

/** §7.2 — explain a photographed page in the student's language. */
export function aiExplainPage(imageBase64: string, languageName: string): Promise<AiPage> {
  return call<AiPage>('/page', { image: imageBase64, language: languageName }, 90_000);
}

// ---------------------------------------------------------------- judging

/** §7.3 — semantic, tolerant explain-it-back judging. */
export function aiJudgeExplanation(
  pageSummary: string,
  concepts: string[],
  transcript: string,
  languageName: string
): Promise<{ verdict: 'good' | 'partial' | 'missing'; feedback: string }> {
  return call('/judge', {
    page: pageSummary,
    concepts,
    said: transcript,
    language: languageName,
  }, 30_000);
}

/** For a child who missed a question: explain the idea and say what to do
 *  about it, addressed to them, in their language. */
export async function aiExplainConcept(
  topic: string,
  question: string,
  misconception: string,
  languageName: string
): Promise<string> {
  const r = await call<{ advice: string }>('/advise', {
    topic,
    question,
    misconception,
    language: languageName,
  }, 45_000);
  return r.advice;
}

/** Map a failure to a short i18n key. Everything here is non-fatal. */
export function aiErrorKey(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (m === 'ratelimit') return 'aiErrRate';
  if (m === 'offline' || m === 'unset') return 'aiErrOffline';
  if (m === 'timeout') return 'aiErrTimeout';
  return 'aiErrGeneric';
}
