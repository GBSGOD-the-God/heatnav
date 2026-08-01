// Who is holding the phone.
//
// This is NOT an account system. There is no password, no server, no sign-up
// and nothing to forget: logging in matches what the person already knows —
// their name and roll number, or their teacher id — against the roster that is
// already on this device. That keeps it usable by someone who has never made
// an account in their life, and it keeps a register of minors' details off the
// network entirely (C8).
//
// The split matters for a second reason. The teacher's screens and the child's
// screens are different jobs (§5), and a child should never be looking at the
// class's marks. Role decides which app you get.
import { allStudents, kvGet, kvSet } from './db';
import type { Session, Student } from './types';

/** Teachers registered on this device. In a real rollout the school enters
 *  these once; for the demo there is one. */
export interface TeacherRecord {
  teacherId: string;
  name: string;
  school: string;
}

export const DEMO_TEACHERS: TeacherRecord[] = [
  { teacherId: '123', name: 'Suryansh Sinha', school: 'Govt. Primary School, Rampur' },
];

export const DEMO_SCHOOL = 'Govt. Primary School, Rampur';

export async function getSession(): Promise<Session | null> {
  return (await kvGet<Session>('session')) ?? null;
}

export async function setSession(s: Session): Promise<void> {
  await kvSet('session', s);
}

export async function signOut(): Promise<void> {
  await kvSet('session', undefined);
}

/** Loose comparison — a child typing their own name should not fail on a
 *  capital letter, a trailing space, or a middle name the register omits. */
function looseMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/\s+/g, ' ').trim();
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // First name alone is enough — registers and households disagree constantly
  // about surnames, and this is not a security boundary.
  return x.split(' ')[0] === y.split(' ')[0];
}

export interface StudentLogin {
  name: string;
  school: string;
  grade: number;
  roll: number;
}

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'noroll' | 'name' | 'school' };

/** Match a child against the roster on this device. */
export async function loginStudent(input: StudentLogin): Promise<LoginResult> {
  const roster = await allStudents();

  const byRoll = roster.filter(
    (s: Student) => s.roll === input.roll && s.grade === input.grade
  );
  if (!byRoll.length) return { ok: false, reason: 'noroll' };

  const school = byRoll.find((s) => looseMatch(s.school, input.school));
  if (!school) return { ok: false, reason: 'school' };

  const match = byRoll.find(
    (s) => looseMatch(s.name.hi, input.name) || looseMatch(s.name.en, input.name)
  );
  if (!match) return { ok: false, reason: 'name' };

  const session: Session = {
    role: 'student',
    studentId: match.id,
    name: match.name.hi,
    school: match.school,
    grade: match.grade,
    roll: match.roll,
    since: Date.now(),
  };
  await setSession(session);
  return { ok: true, session };
}

export async function loginTeacher(
  name: string,
  teacherId: string
): Promise<LoginResult> {
  const record = DEMO_TEACHERS.find(
    (t) => t.teacherId === teacherId.trim() && looseMatch(t.name, name)
  );
  if (!record) return { ok: false, reason: 'name' };
  const session: Session = {
    role: 'teacher',
    name: record.name,
    teacherId: record.teacherId,
    school: record.school,
    since: Date.now(),
  };
  await setSession(session);
  return { ok: true, session };
}

/** The signed-in child's roster row, for the student screens. */
export async function currentStudent(): Promise<Student | null> {
  const s = await getSession();
  if (s?.role !== 'student' || !s.studentId) return null;
  return (await allStudents()).find((r) => r.id === s.studentId) ?? null;
}
