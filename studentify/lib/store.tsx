"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ---------------- types ---------------- */

export type Profile = {
  name: string;
  email: string;
  grade: string;
  board: string;
  subjects: string[];
  school?: string;
  createdAt: number;
};

export type Note = {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  body: string;
  updatedAt: number;
};

export type Card = {
  id: string;
  front: string;
  back: string;
  due: number; // timestamp
  interval: number; // days
  reps: number;
  lapses: number;
};

export type Deck = {
  id: string;
  name: string;
  subject: string;
  createdAt: number;
  cards: Card[];
};

export type QuizResult = {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  total: number;
  correct: number;
  date: number;
  missedTopics: string[];
};

export type ChatMsg = { role: "user" | "ai"; text: string; offer?: boolean };

export type ChatSession = {
  id: string;
  mode: string;
  title: string;
  messages: ChatMsg[];
  updatedAt: number;
};

export type Exam = { id: string; subject: string; name: string; date: string };

export type PlanBlock = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  subject: string;
  topic: string;
  kind: "learn" | "practice" | "revision" | "quiz" | "exam";
  done: boolean;
};

export type Settings = {
  theme: "dark" | "light";
  language: string;
  responseLength: "balanced" | "short" | "detailed";
  hintsFirst: boolean;
  memoryOn: boolean;
  remindersStudy: boolean;
  remindersRevision: boolean;
  dailyMotivation: boolean;
  mistralKey: string;
};

export type AppState = {
  profile: Profile | null;
  notes: Note[];
  decks: Deck[];
  quizzes: QuizResult[];
  chats: ChatSession[];
  exams: Exam[];
  plan: PlanBlock[];
  weeklyHours: number;
  activity: Record<string, { minutes: number; xp: number; reviews: number }>;
  xp: number;
  settings: Settings;
  memory: string[]; // things the AI has learned
  badgesSeen: string[];
};

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  language: "English",
  responseLength: "balanced",
  hintsFirst: true,
  memoryOn: true,
  remindersStudy: true,
  remindersRevision: true,
  dailyMotivation: false,
  mistralKey: "",
};

const EMPTY: AppState = {
  profile: null,
  notes: [],
  decks: [],
  quizzes: [],
  chats: [],
  exams: [],
  plan: [],
  weeklyHours: 2,
  activity: {},
  xp: 0,
  settings: DEFAULT_SETTINGS,
  memory: [],
  badgesSeen: [],
};

const KEY = "studentify:v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const DAY_MS = 86400000;

/* ---------------- derived helpers ---------------- */

export function levelFromXp(xp: number) {
  const level = Math.floor(xp / 1000) + 1;
  return { level, progress: (xp % 1000) / 1000, toNext: 1000 - (xp % 1000) };
}

export function computeStreak(activity: AppState["activity"]) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 3650; i++) {
    const k = dayKey(new Date(today.getTime() - i * DAY_MS));
    const a = activity[k];
    if (a && (a.minutes > 0 || a.xp > 0)) streak++;
    else if (i === 0) continue; // today not studied yet doesn't break streak
    else break;
  }
  return streak;
}

export function weekActivity(activity: AppState["activity"]) {
  const out: { day: string; date: string; minutes: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const k = dayKey(d);
    out.push({
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      date: k,
      minutes: activity[k]?.minutes ?? 0,
    });
  }
  return out;
}

export function subjectAccuracy(quizzes: QuizResult[]) {
  const by: Record<string, { c: number; t: number }> = {};
  for (const q of quizzes) {
    by[q.subject] ??= { c: 0, t: 0 };
    by[q.subject].c += q.correct;
    by[q.subject].t += q.total;
  }
  return Object.entries(by).map(([subject, v]) => ({
    subject,
    pct: Math.round((v.c / Math.max(1, v.t)) * 100),
  }));
}

export function dueCards(deck: Deck, now = Date.now()) {
  return deck.cards.filter((c) => c.due <= now);
}

/** SM-2-lite spaced repetition */
export function rateCard(card: Card, rating: "hard" | "good" | "easy"): Card {
  let interval = card.interval;
  let lapses = card.lapses;
  if (rating === "hard") {
    interval = 1;
    lapses += 1;
  } else if (rating === "good") {
    interval = interval <= 1 ? 3 : Math.round(interval * 2.2);
  } else {
    interval = interval <= 1 ? 7 : Math.round(interval * 3.2);
  }
  return {
    ...card,
    interval,
    lapses,
    reps: card.reps + 1,
    due: Date.now() + interval * DAY_MS,
  };
}

/* ---------------- badges ---------------- */

export function computeBadges(s: AppState) {
  const streak = computeStreak(s.activity);
  const reviews = Object.values(s.activity).reduce((a, v) => a + v.reviews, 0);
  const bestQuiz = s.quizzes.reduce(
    (m, q) => Math.max(m, q.total ? q.correct / q.total : 0),
    0
  );
  const { level } = levelFromXp(s.xp);
  return [
    { id: "streak7", emoji: "🔥", name: "7-day streak", got: streak >= 7 },
    { id: "cards100", emoji: "🧠", name: "100 cards reviewed", got: reviews >= 100 },
    { id: "quiz90", emoji: "🎯", name: "90%+ on a quiz", got: bestQuiz >= 0.9 },
    { id: "notes10", emoji: "📓", name: "10 notes written", got: s.notes.length >= 10 },
    { id: "night", emoji: "🌙", name: "First study session", got: s.xp > 0 },
    { id: "level5", emoji: "🏆", name: "Reach Level 5", got: level >= 5 },
  ];
}

/* ---------------- planner generator ---------------- */

export function generatePlan(s: AppState): PlanBlock[] {
  const subjects = s.profile?.subjects?.length ? s.profile.subjects : ["General"];
  const weak = subjectAccuracy(s.quizzes)
    .filter((a) => a.pct < 75)
    .map((a) => a.subject);
  const exams = [...s.exams].sort((a, b) => a.date.localeCompare(b.date));
  const blocks: PlanBlock[] = [];
  const kinds: PlanBlock["kind"][] = ["learn", "practice", "revision"];
  const today = new Date();

  // priority queue: weak subjects first, then exam subjects, then the rest
  const ordered = [
    ...weak,
    ...exams.map((e) => e.subject),
    ...subjects,
  ].filter((v, i, arr) => arr.indexOf(v) === i && subjects.includes(v));
  const rotation = ordered.length ? ordered : subjects;

  let r = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * DAY_MS);
    const date = dayKey(d);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const slots = Math.max(1, Math.round(s.weeklyHours * (isWeekend ? 1.5 : 1)));

    const exam = exams.find((e) => e.date === date);
    if (exam) {
      blocks.push({
        id: uid(), date, time: "9:00 AM", subject: exam.subject,
        topic: `${exam.name} — exam day! 🍀`, kind: "exam", done: false,
      });
      continue;
    }

    for (let sIdx = 0; sIdx < Math.min(slots, 3); sIdx++) {
      const subject = rotation[r % rotation.length];
      const upcoming = exams.find((e) => e.subject === subject);
      const daysToExam = upcoming
        ? Math.ceil((new Date(upcoming.date).getTime() - d.getTime()) / DAY_MS)
        : 99;
      const kind: PlanBlock["kind"] =
        daysToExam <= 2 ? "revision" : daysToExam <= 5 ? "practice" : kinds[(i + sIdx) % 3];
      const topic =
        kind === "revision"
          ? `${subject} — rapid revision${upcoming ? ` for ${upcoming.name}` : ""}`
          : kind === "practice"
          ? `${subject} — practice problems`
          : `${subject} — learn the next topic`;
      blocks.push({
        id: uid(), date,
        time: sIdx === 0 ? "5:00 PM" : sIdx === 1 ? "6:30 PM" : "8:00 PM",
        subject, topic, kind, done: false,
      });
      r++;
    }
    // flashcard revision slot if cards exist
    if (s.decks.some((dk) => dk.cards.length)) {
      blocks.push({
        id: uid(), date, time: "9:00 PM", subject: "All",
        topic: "Flashcards — clear today's due cards", kind: "quiz", done: false,
      });
    }
  }
  return blocks;
}

/* ---------------- context ---------------- */

type Ctx = {
  state: AppState;
  ready: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  addXp: (amount: number, minutes?: number, reviews?: number) => void;
  resetAll: () => void;
  loadSample: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...EMPTY, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } });
      }
    } catch {
      /* corrupted storage — start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full/unavailable */
    }
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state, ready]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => fn(s));
  }, []);

  const addXp = useCallback((amount: number, minutes = 0, reviews = 0) => {
    setState((s) => {
      const k = dayKey();
      const a = s.activity[k] ?? { minutes: 0, xp: 0, reviews: 0 };
      return {
        ...s,
        xp: s.xp + amount,
        activity: {
          ...s.activity,
          [k]: { minutes: a.minutes + minutes, xp: a.xp + amount, reviews: a.reviews + reviews },
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(EMPTY);
  }, []);

  const loadSample = useCallback(() => {
    setState((s) => sampleState(s));
  }, []);

  return (
    <AppCtx.Provider value={{ state, ready, update, addXp, resetAll, loadSample }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

/* ---------------- sample content (opt-in, for exploring) ---------------- */

function sampleState(s: AppState): AppState {
  const now = Date.now();
  const mkCards = (arr: [string, string][]): Card[] =>
    arr.map(([front, back]) => ({
      id: uid(), front, back, due: now, interval: 1, reps: 0, lapses: 0,
    }));
  const activity: AppState["activity"] = { ...s.activity };
  for (let i = 1; i <= 11; i++) {
    const k = dayKey(new Date(now - i * DAY_MS));
    activity[k] = { minutes: 40 + ((i * 37) % 80), xp: 120, reviews: 8 };
  }
  return {
    ...s,
    notes: s.notes.length ? s.notes : [
      {
        id: uid(), title: "Quadratic Equations — full summary", folder: "Maths",
        tags: ["formulas", "important"], updatedAt: now,
        body: "## Standard form\nax² + bx + c = 0, where a ≠ 0\n\n## Discriminant\nD = b² − 4ac\n- D > 0 → two distinct real roots\n- D = 0 → two equal real roots\n- D < 0 → no real roots\n\n## Quadratic formula\nx = (−b ± √D) / 2a\n\n## Sum & product of roots\n- α + β = −b/a\n- αβ = c/a",
      },
      {
        id: uid(), title: "Electricity — key formulas", folder: "Physics",
        tags: ["formulas"], updatedAt: now - DAY_MS,
        body: "## Core relations\n- V = IR (Ohm's law)\n- P = VI = I²R = V²/R\n- H = I²Rt (Joule heating)\n\n## Series vs parallel\n- Series: R = R1 + R2 + …\n- Parallel: 1/R = 1/R1 + 1/R2 + …",
      },
      {
        id: uid(), title: "Life Processes — nutrition", folder: "Biology",
        tags: ["revision"], updatedAt: now - 3 * DAY_MS,
        body: "## Autotrophic nutrition\nPhotosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\n\n## Steps\n1. Absorption of light by chlorophyll\n2. Light energy → chemical energy, splitting of water\n3. Reduction of CO₂ to carbohydrates",
      },
    ],
    decks: s.decks.length ? s.decks : [
      {
        id: uid(), name: "Trigonometry Essentials", subject: "Maths", createdAt: now,
        cards: mkCards([
          ["What is sin θ in a right triangle?", "Opposite ÷ Hypotenuse"],
          ["Value of tan 45°?", "1"],
          ["sin²θ + cos²θ = ?", "1 — the Pythagorean identity"],
          ["What is sec θ?", "1 / cos θ"],
          ["Value of cos 60°?", "1/2"],
        ]),
      },
      {
        id: uid(), name: "Light — Reflection & Refraction", subject: "Physics", createdAt: now,
        cards: mkCards([
          ["State the laws of reflection.", "∠incidence = ∠reflection; incident ray, reflected ray and normal are coplanar."],
          ["Power of a lens?", "P = 1/f (f in metres), unit: dioptre (D)"],
          ["Refractive index formula?", "n = c / v"],
        ]),
      },
    ],
    quizzes: s.quizzes.length ? s.quizzes : [
      { id: uid(), topic: "Quadratics", subject: "Maths", difficulty: "Medium", total: 10, correct: 8, date: now - 2 * DAY_MS, missedTopics: ["word problems"] },
      { id: uid(), topic: "Optics", subject: "Physics", difficulty: "Medium", total: 10, correct: 6, date: now - DAY_MS, missedTopics: ["ray diagrams"] },
      { id: uid(), topic: "Carbon", subject: "Chemistry", difficulty: "Easy", total: 8, correct: 7, date: now - 4 * DAY_MS, missedTopics: [] },
    ],
    activity,
    xp: Math.max(s.xp, 3380),
  };
}
