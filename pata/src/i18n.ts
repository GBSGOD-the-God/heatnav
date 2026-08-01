// One current language, one lookup.
//
// There used to be two of each: a "shell" language that only existed in Hindi
// and English, and a separate student language that had all twelve. Choosing
// Malayalam set the second and forced the first to Hindi, so the choice held
// on whichever screen happened to read the student language and evaporated on
// every other one. That is now a single value.
//
//   t(key)        — a word the APP says. All twelve, always.
//   translate(b)  — a piece of stored CONTENT (a lesson, a question, a name).
//                   Falls back through the languages that share a script or a
//                   reader before landing on English.
import { S as STUDENT } from './packs';
import { ALIASES, UI } from './ui-strings';
import type { Bi, BiList, Lang } from './types';

export const LANG_CODES: Lang[] = [
  'hi', 'en', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'or', 'pa', 'as',
];

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANG_CODES as string[]).includes(v);
}

let current: Lang = 'hi';

export function setLang(l: Lang): void {
  current = isLang(l) ? l : 'hi';
  document.documentElement.lang = current;
}

export function getLang(): Lang {
  return current;
}

/** A word the app says, in the current language. */
export function t(key: string): string {
  return s(key, current);
}

/** The same, in a language you name — for the few places that need to render
 *  a language other than the current one (the picker itself). */
export function s(key: string, lang: Lang): string {
  const k = ALIASES[key] ?? key;
  const row = UI[k] ?? UI[key] ?? STUDENT[k] ?? STUDENT[key];
  if (!row) return key;
  return (row as Record<string, string>)[lang] || row.en || key;
}

/**
 * Stored content — a lesson a teacher typed, a question from the bank, a
 * child's name. Unlike UI text this may genuinely not exist in the reader's
 * language, so the fallback order matters:
 *
 *   1. their own language, if we have it;
 *   2. Hindi for the other Devanagari readers, since the script is the same;
 *   3. English, which is taught in every state and is far likelier to be
 *      legible to a Tamil or Malayalam reader than Devanagari is.
 */
const DEVANAGARI: Lang[] = ['hi', 'mr'];

export function translate(b: Bi | null | undefined, lang: Lang = current): string {
  if (!b) return '';
  const own = b[lang];
  if (own) return own;
  if (DEVANAGARI.includes(lang) && b.hi) return b.hi;
  return b.en || b.hi || '';
}

/** The list form, for lesson material. */
export function translateList(b: BiList | null | undefined, lang: Lang = current): string[] {
  if (!b) return [];
  const own = b[lang];
  if (own?.length) return own;
  if (DEVANAGARI.includes(lang) && b.hi?.length) return b.hi;
  return b.en?.length ? b.en : b.hi ?? [];
}

/** True when this content had to fall back to a language the reader did not
 *  choose — the screens say so rather than pretending it was meant for them. */
export function isFallback(b: Bi | BiList | null | undefined, lang: Lang = current): boolean {
  if (!b) return false;
  const own = (b as Record<string, unknown>)[lang];
  return !(Array.isArray(own) ? own.length : own);
}

/** Legacy name kept so screens read the same. */
export const bi = translate;
