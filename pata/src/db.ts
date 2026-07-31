// All state lives in IndexedDB via `idb` — no localStorage (spec §8), no
// backend, no cloud accounts. Offline-first: every classroom function works
// with the network permanently off.
import { openDB, type IDBPDatabase } from 'idb';
import type { ActionLog, CheckRecord, DailyReport, Lesson, Settings, Student } from './types';

const DB_NAME = 'pata';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        d.createObjectStore('students', { keyPath: 'id' });
        d.createObjectStore('lessons', { keyPath: 'id' });
        d.createObjectStore('checks', { keyPath: 'id' });
        d.createObjectStore('actions', { keyPath: 'id' });
        d.createObjectStore('reports', { keyPath: 'id' });
        d.createObjectStore('kv');
      },
    });
  }
  return dbPromise;
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
const DEFAULT_SETTINGS: Settings = { lang: 'hi', homeLang: 'hi' };
export async function getSettings(): Promise<Settings> {
  return (await kvGet<Settings>('settings')) ?? { ...DEFAULT_SETTINGS };
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
