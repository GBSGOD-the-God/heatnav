// Getting a child's result onto their teacher's phone.
//
// On one shared device this file does nothing: the child's quiz and the
// teacher's inbox are already the same database. It exists for the real case,
// where the child practises on a family phone at home and the teacher opens
// hers the next morning.
//
// Three rules it follows:
//
//   1. NO CHILD'S NAME LEAVES THE DEVICE (C8). What is sent is the opaque
//      roster id. The teacher's phone already holds the register, so it turns
//      that back into a name locally. A row on the server reads "s7 scored 2
//      of 5 on borrowing" and cannot be tied to a person without the register.
//   2. Nothing waits on it. Every result is saved locally first and pushed
//      afterwards; a push that fails is retried on the next opportunity, and
//      the app behaves identically with the network off forever.
//   3. It is optional. With no server configured, or no KV attached to it,
//      every call here returns quietly and the app is exactly as it was.
import { getProxyUrl } from './ai';
import { allResults, kvGet, kvSet, saveResult } from './db';
import type { QuizResult } from './types';

/**
 * Which class's results these are. Derived from the school name both devices
 * already know — the child types it at login, the teacher's roster carries it
 * — so there is nothing to set up and no code to pass around.
 *
 * This is a ROUTING key, not a password. Someone who knows the school name
 * could read scores against anonymous roster ids. For a pilot that is a better
 * trade than making teachers manage credentials; a district rollout should put
 * a real shared secret in front of it, and this function is where it goes.
 */
export function roomFor(school: string): string {
  const norm = school.toLowerCase().replace(/\s+/g, ' ').trim();
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < norm.length; i++) {
    h1 = Math.imul(h1 ^ norm.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + norm.charCodeAt(i) + i, 2246822519) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const base = await getProxyUrl();
  if (!base || !navigator.onLine) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null; // 501 = no KV attached; treat like offline
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip to what the teacher needs. Everything identifying stays behind. */
function forWire(r: QuizResult) {
  return {
    id: r.id,
    studentId: r.studentId,
    topicKey: r.topicKey,
    topicLabel: r.topicLabel,
    correct: r.correct,
    total: r.total,
    peakLevel: r.peakLevel,
    answers: r.answers,
    ts: r.ts,
  };
}

/** Results this device has produced but not yet handed over. */
const PENDING = 'sync:pending';

export async function queueForSync(r: QuizResult): Promise<void> {
  const pending = (await kvGet<string[]>(PENDING)) ?? [];
  await kvSet(PENDING, [...new Set([...pending, r.id])]);
}

/**
 * Hand over anything outstanding. Safe to call whenever — it is a no-op with
 * nothing queued, no server, or no network.
 */
export async function pushPending(school: string): Promise<number> {
  const pending = (await kvGet<string[]>(PENDING)) ?? [];
  if (!pending.length) return 0;
  const mine = (await allResults()).filter((r) => pending.includes(r.id));
  if (!mine.length) {
    await kvSet(PENDING, []);
    return 0;
  }
  const ok = await post<{ ok: boolean }>('/sync/push', {
    room: roomFor(school),
    items: mine.map(forWire),
  });
  if (!ok) return 0; // stays queued for next time
  await kvSet(PENDING, []);
  return mine.length;
}

/**
 * Collect what the children have sent. Returns how many were new, so the
 * caller can redraw only when there is something to redraw.
 */
export async function pullResults(school: string): Promise<number> {
  const since = (await kvGet<number>('sync:since')) ?? 0;
  const data = await post<{ items: Array<ReturnType<typeof forWire>> }>('/sync/pull', {
    room: roomFor(school),
    since,
  });
  if (!data?.items?.length) return 0;

  const existing = new Set((await allResults()).map((r) => r.id));
  let added = 0;
  let newest = since;
  for (const item of data.items) {
    newest = Math.max(newest, item.ts);
    if (existing.has(item.id)) continue;
    await saveResult({
      ...item,
      assignmentId: null,
      // Resolved from the register on THIS device — the name was never sent.
      studentName: { hi: '', en: '' },
      seen: false,
    } as QuizResult);
    added++;
  }
  await kvSet('sync:since', newest);
  return added;
}

/** Is carrying results between phones actually available right now? */
export async function syncAvailable(): Promise<boolean> {
  const base = await getProxyUrl();
  if (!base || !navigator.onLine) return false;
  try {
    const res = await fetch(base + '/health');
    return res.ok && Boolean((await res.json())?.sync);
  } catch {
    return false;
  }
}
