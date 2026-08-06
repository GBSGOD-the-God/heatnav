// All state lives in IndexedDB via `idb` — no localStorage (spec §8), no
// backend, no cloud accounts. Offline-first: every classroom function works
// with the network permanently off.
import { deleteDB, openDB, type IDBPDatabase } from 'idb';
import type {
  ActionLog, CheckRecord, DailyReport, Lesson, QuizAssignment, QuizResult, Settings, Student,
} from './types';

const DB_NAME = 'pata';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      // Runs for a fresh install AND for an upgrade from v1, so every store is
      // created only if it is missing. A teacher who already has a term of
      // checks on her phone must not lose them to a version bump.
      upgrade(d) {
        for (const name of ['students', 'lessons', 'checks', 'actions', 'reports', 'assignments', 'results']) {
          if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath: 'id' });
        }
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      },
    });
  }
  return dbPromise;
}

/**
 * Bump this to make the next launch a cold start.
 *
 * Installing an APK over the top keeps the app's data, which is right for a
 * teacher and wrong for a demo — you want the language picker, an empty
 * inbox and a class that has never been checked. Changing this token wipes
 * the database and the cached shell exactly once, then records the new token
 * so it never happens again on that build.
 *
 * It is not a routine upgrade step. Real data is real; only change this when
 * a fresh start is what you actually want.
 */
const BUILD_TOKEN = 'cold-start-1';

export async function ensureFreshBuild(): Promise<boolean> {
  let seen: string | undefined;
  try {
    seen = await kvGet<string>('buildToken');
  } catch {
    seen = undefined; // unreadable database — wiping is the right answer anyway
  }
  if (seen === BUILD_TOKEN) return false;

  try {
    (await db()).close();
  } catch { /* nothing open */ }
  dbPromise = null;
  await deleteDB(DB_NAME);

  // The service worker's copy of the shell too, or a recording opens on the
  // previous build's screens.
  try {
    if (typeof caches !== 'undefined') {
      for (const key of await caches.keys()) await caches.delete(key);
    }
  } catch { /* no cache storage here */ }

  await kvSet('buildToken', BUILD_TOKEN);
  return true;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- kv ---
export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await db()).get('kv', key);
}
export async function kvSet(key: string, value: unknown): Promise<void> {
  await (await db()).put('kv', value, key);
}

// --- settings ---
const DEFAULT_SETTINGS: Settings = { lang: 'hi' };

/**
 * Installs made before the two language settings were merged stored the real
 * choice in homeLang and a Hindi-or-English stand-in in lang. Carry the real
 * one forward, or an existing user who had picked Malayalam would silently
 * find themselves back in Hindi after updating.
 */
export async function getSettings(): Promise<Settings> {
  const stored = await kvGet<Settings>('settings');
  if (!stored) return { ...DEFAULT_SETTINGS };
  if (stored.homeLang && stored.homeLang !== stored.lang) {
    const migrated: Settings = { ...stored, lang: stored.homeLang as Settings['lang'] };
    delete migrated.homeLang;
    await kvSet('settings', migrated);
    return migrated;
  }
  return stored;
}
export async function saveSettings(s: Settings): Promise<void> {
  await kvSet('settings', s);
}

// --- students ---
export async function allStudents(): Promise<Student[]> {
  const rows: Student[] = await (await db()).getAll('students');
  return rows.sort((a, b) => a.seat.row - b.seat.row || a.seat.col - b.seat.col);
}
export async function replaceRoster(students: Student[]): Promise<void> {
  const d = await db();
  const tx = d.transaction('students', 'readwrite');
  await tx.store.clear();
  for (const s of students) await tx.store.put(s);
  await tx.done;
}

// --- lessons ---
export async function saveLesson(l: Lesson): Promise<void> {
  await (await db()).put('lessons', l);
}
export async function getLesson(id: string): Promise<Lesson | undefined> {
  return (await db()).get('lessons', id);
}
export async function allLessons(): Promise<Lesson[]> {
  const rows: Lesson[] = await (await db()).getAll('lessons');
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

// --- checks ---
export async function saveCheck(c: CheckRecord): Promise<void> {
  await (await db()).put('checks', c);
}
export async function getCheck(id: string): Promise<CheckRecord | undefined> {
  return (await db()).get('checks', id);
}
export async function allChecks(): Promise<CheckRecord[]> {
  const rows: CheckRecord[] = await (await db()).getAll('checks');
  return rows.sort((a, b) => b.ts - a.ts);
}

// --- action log (§9: learn what she actually does with the result) ---
export async function logAction(a: ActionLog): Promise<void> {
  await (await db()).put('actions', a);
}
export async function allActions(): Promise<ActionLog[]> {
  return (await db()).getAll('actions');
}

// --- reports ---
export async function saveReport(r: DailyReport): Promise<void> {
  await (await db()).put('reports', r);
}
export async function allReports(): Promise<DailyReport[]> {
  const rows: DailyReport[] = await (await db()).getAll('reports');
  return rows.sort((a, b) => b.ts - a.ts);
}

// --- practice sent home ---
export async function saveAssignment(a: QuizAssignment): Promise<void> {
  await (await db()).put('assignments', a);
}
export async function allAssignments(): Promise<QuizAssignment[]> {
  const rows: QuizAssignment[] = await (await db()).getAll('assignments');
  return rows.sort((x, y) => y.createdAt - x.createdAt);
}
/** Only this child's. The store holds the whole class; the child's screen must
 *  never be handed anyone else's row to filter client-side. */
export async function assignmentsFor(studentId: string): Promise<QuizAssignment[]> {
  return (await allAssignments()).filter((a) => a.studentIds.includes(studentId));
}

export async function getAssignment(id: string): Promise<QuizAssignment | undefined> {
  return (await db()).get('assignments', id);
}

export async function saveResult(r: QuizResult): Promise<void> {
  await (await db()).put('results', r);
}
export async function allResults(): Promise<QuizResult[]> {
  const rows: QuizResult[] = await (await db()).getAll('results');
  return rows.sort((x, y) => y.ts - x.ts);
}
export async function resultsFor(studentId: string): Promise<QuizResult[]> {
  return (await allResults()).filter((r) => r.studentId === studentId);
}
/** Returns how many were actually marked, so a caller can avoid announcing a
 *  change that did not happen — announcing unconditionally re-rendered the
 *  screen that had just called this, which called it again, forever. */
export async function markResultsSeen(): Promise<number> {
  const d = await db();
  const tx = d.transaction('results', 'readwrite');
  const rows: QuizResult[] = await tx.store.getAll();
  const fresh = rows.filter((r) => !r.seen);
  await Promise.all(fresh.map((r) => tx.store.put({ ...r, seen: true })));
  await tx.done;
  return fresh.length;
}
export async function unseenResultCount(): Promise<number> {
  return (await allResults()).filter((r) => !r.seen).length;
}
