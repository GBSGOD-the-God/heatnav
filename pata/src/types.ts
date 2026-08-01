// PATA data model.
// Hard rule (spec §6.4): no teacher-identifying field exists anywhere in this
// model. Checks, actions, reports and aggregates describe CONTENT — topics,
// misconceptions, counts — never the adult in the room.

export type Lang = 'hi' | 'en';

export interface Bi {
  hi: string;
  en: string;
}

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuestionOption {
  text: Bi;
  correct?: boolean;
  /** Named misconception this distractor encodes (spec §4). */
  mis?: Bi;
}

export interface Question {
  text: Bi;
  options: Record<OptionKey, QuestionOption>;
}

export interface Lesson {
  id: string;
  topicKey: string;
  topicLabel: Bi;
  subject: Bi;
  gradeBand: string;
  material: { hi: string[]; en: string[] };
  questions: Question[];
  /** 'ai' = generated live by Claude; 'bank' = curated offline set; 'draft' = skeleton the teacher edits. */
  source: 'ai' | 'bank' | 'draft';
  createdAt: number;
}

export interface Student {
  id: string;
  name: Bi;
  grade: number; // 5–7 (multigrade classroom, C4)
  /** Ability level 1–7 — one classroom spans seven grade-levels (C4). */
  level: number;
  seat: { row: number; col: number };
  /** Roll number — how a child is actually identified in an Indian school
   *  register, and what they log in with at home. */
  roll: number;
  /** School the roster belongs to. Kept on the device; never transmitted. */
  school: string;
}

export interface CheckRecord {
  id: string;
  lessonId: string | null;
  topicKey: string;
  topicLabel: Bi;
  qIndex: number;
  questionText: Bi;
  understoodIds: string[];
  notUnderstoodIds: string[];
  /** Most common wrong option, if the teacher captured it (one extra tap). */
  dominantWrong: OptionKey | null;
  /** The named misconception behind dominantWrong. */
  misconception: Bi | null;
  /** Measured teacher effort in seconds (C5 — measured, not estimated). */
  durationSec: number;
  ts: number;
  /** true = fictional seed data, always labelled on screen (§12). */
  sample?: boolean;
}

/** §9 — log which of the three actions she actually picks. */
export interface ActionLog {
  id: string;
  checkId: string;
  action: 'pair' | 'home' | 'reteach' | 'none';
  ts: number;
}

/** Daily paperwork drafted from speech, reviewed and submitted by hand (§7.4). Counts only. */
export interface DailyReport {
  id: string;
  date: string;
  presentCount: number | null;
  mealsCount: number | null;
  checksDone: number | null;
  topicsTaught: string;
  notes: string;
  ts: number;
}

/** Content-level aggregate rows for school/district scope (labelled sample data). */
export interface AggregateRow {
  scope: 'school' | 'district';
  topicLabel: Bi;
  subject: Bi;
  grade: string;
  checks: number;
  confusedPct: number;
  topMisconception: Bi;
}

export interface Settings {
  lang: Lang;
  /** Student-side explanation language for the Home screen. */
  homeLang: string;
  /** Set once the language has been chosen, so onboarding is not shown again. */
  languageChosen?: boolean;
}

/** Who is using the phone right now.
 *
 *  Deliberately not an account: no password, no server, no sign-up. Logging in
 *  only matches what the child or teacher already knows against the roster
 *  already on this device. Nothing identifying is transmitted, which is what
 *  keeps a register of minors' details out of the aggregation model (C6, C8).
 */
export interface Session {
  role: 'teacher' | 'student';
  /** Student id from the roster, when role is student. */
  studentId?: string;
  /** Display name for whoever is signed in. */
  name: string;
  /** Teacher id as printed on their service record, when role is teacher. */
  teacherId?: string;
  school: string;
  grade?: number;
  roll?: number;
  since: number;
}
