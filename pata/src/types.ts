// PATA data model.
// Hard rule (spec §6.4): no teacher-identifying field exists anywhere in this
// model. Checks, actions, reports and aggregates describe CONTENT — topics,
// misconceptions, counts — never the adult in the room.

/** The twelve languages the app speaks (C7). There is exactly one of these in
 *  play at a time — there used to be two, a "shell" language that only had
 *  Hindi and English and a separate student language, which is why choosing
 *  Malayalam used to survive one screen and then evaporate. */
export type Lang =
  | 'hi' | 'en' | 'mr' | 'bn' | 'ta' | 'te'
  | 'kn' | 'ml' | 'gu' | 'or' | 'pa' | 'as';

/**
 * A piece of text in as many of the twelve as we have it.
 *
 * Hindi and English are required because every path can fall back to them; the
 * other ten are optional so a lesson typed by a teacher, or generated live,
 * is still valid data. Read it through translate() in i18n.ts, never by
 * indexing a language directly — that is what stranded English text under
 * Malayalam headings.
 */
export type Bi = { hi: string; en: string } & Partial<Record<Lang, string>>;

/** The same, for a list of paragraphs. */
export type BiList = { hi: string[]; en: string[] } & Partial<Record<Lang, string[]>>;

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
  material: BiList;
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

/**
 * Practice sent home after a check (§9, the "send home" action).
 *
 * The teacher does not write these questions. She marks who did not get it and
 * taps once; the quiz is generated from the topic and the NAMED misconception
 * behind the wrong answer, so what the child practises is the specific thing
 * they got wrong rather than the subject in general.
 */
export interface QuizAssignment {
  id: string;
  checkId: string;
  /** Only the children who missed it. A child never gets someone else's. */
  studentIds: string[];
  topicKey: string;
  topicLabel: Bi;
  /** The question they missed, so the child's card can show it on a device
   *  that never saw the check itself. */
  questionText: Bi | null;
  misconception: Bi | null;
  createdAt: number;
}

/** One answered question, kept so the teacher sees WHAT went wrong, not just
 *  how much (§4 — misconceptions, never a bare score). */
export interface QuizAnswer {
  level: number;
  correct: boolean;
  /** The misconception the chosen wrong answer encodes, when it encodes one. */
  misconception: Bi | null;
}

/**
 * What comes back. Per-child and only ever per-child (C4): there is no class
 * average anywhere in this record and none is computed from it.
 */
export interface QuizResult {
  id: string;
  assignmentId: string | null;
  studentId: string;
  studentName: Bi;
  topicKey: string;
  topicLabel: Bi;
  correct: number;
  total: number;
  /** The hardest level they answered correctly. More use to a teacher than the
   *  score: 3 of 5 at level 4 is a different child from 3 of 5 at level 1. */
  peakLevel: number;
  answers: QuizAnswer[];
  /** Has the teacher opened it yet — drives the badge, nothing else. */
  seen: boolean;
  ts: number;
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
  /** The one language everything is shown in. */
  lang: Lang;
  /** Retired: there is no separate student-side language any more. Kept only
   *  so an install made before the merge can be migrated on first load. */
  homeLang?: string;
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
