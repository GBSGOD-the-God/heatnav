"use client";

import { useState } from "react";
import Confetti from "@/components/Confetti";
import {
  dueCards,
  rateCard,
  uid,
  useApp,
  type Card,
  type Deck,
} from "@/lib/store";

const DECK_COLORS = [
  "from-blue-500/25 to-indigo-500/10",
  "from-purple-500/25 to-fuchsia-500/10",
  "from-emerald-500/25 to-teal-500/10",
  "from-amber-500/25 to-orange-500/10",
];

function StudyView({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const { update, addXp } = useApp();
  const [queue] = useState<Card[]>(() => {
    const due = dueCards(deck);
    return due.length ? due : deck.cards;
  });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [easyCount, setEasyCount] = useState(0);
  const done = idx >= queue.length;
  const card = queue[Math.min(idx, queue.length - 1)];

  function rate(rating: "hard" | "good" | "easy") {
    const updated = rateCard(card, rating);
    update((s) => ({
      ...s,
      decks: s.decks.map((d) =>
        d.id === deck.id
          ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? updated : c)) }
          : d
      ),
    }));
    addXp(5, 1, 1);
    if (rating === "easy") setEasyCount((n) => n + 1);
    setFlipped(false);
    setTimeout(() => setIdx((i) => i + 1), 250);
  }

  if (queue.length === 0) return null;

  if (done) {
    return (
      <div className="mx-auto max-w-lg text-center animate-fade-up">
        <Confetti />
        <div className="card p-10">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-4 text-2xl font-bold">Session complete!</h2>
          <p className="mt-2 text-sm text-sub">
            {queue.length} cards reviewed · {easyCount} marked easy. Cards you found hard
            are scheduled to return tomorrow — that's spaced repetition doing its job.
          </p>
          <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 px-4 py-3 text-sm text-accent2 font-medium">
            +{queue.length * 5} XP earned
          </div>
          <button onClick={onExit} className="btn-glow mt-6 rounded-xl px-6 py-3 text-sm font-semibold">
            Back to decks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onExit} className="text-sm text-sub hover:text-white transition-colors">
          ← All decks
        </button>
        <div className="text-xs text-faint">
          Card {idx + 1} of {queue.length} · {deck.name}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-edge overflow-hidden mb-8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${(idx / queue.length) * 100}%` }}
        />
      </div>

      <div className="flip-scene">
        <button
          onClick={() => setFlipped((f) => !f)}
          className={`flip-card relative w-full h-72 sm:h-80 text-left ${flipped ? "is-flipped" : ""}`}
          aria-label={flipped ? "Show question" : "Show answer"}
        >
          <div className="flip-face absolute inset-0 card rounded-3xl p-8 sm:p-10 flex flex-col shadow-[0_30px_80px_-30px_rgba(59,108,246,0.4)]">
            <div className="text-[10px] uppercase tracking-widest text-faint">Question</div>
            <div className="flex-1 grid place-items-center text-center text-xl sm:text-2xl font-semibold leading-snug px-2">
              {card.front}
            </div>
            <div className="text-center text-xs text-faint">Tap to reveal answer</div>
          </div>
          <div className="flip-face flip-back absolute inset-0 rounded-3xl p-8 sm:p-10 flex flex-col bg-gradient-to-br from-primary/25 via-card to-accent/25 border border-accent/40">
            <div className="text-[10px] uppercase tracking-widest text-accent2">Answer</div>
            <div className="flex-1 grid place-items-center text-center text-lg sm:text-xl font-medium leading-relaxed px-2">
              {card.back}
            </div>
            <div className="text-center text-xs text-faint">How did you do?</div>
          </div>
        </button>
      </div>

      <div
        className={`mt-7 grid grid-cols-3 gap-3 transition-all duration-300 ${
          flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {(
          [
            ["😅 Hard", "hard", "border-rose/40 hover:bg-rose/15 text-rose"],
            ["🙂 Good", "good", "border-amber/40 hover:bg-amber/15 text-amber"],
            ["😎 Easy", "easy", "border-mint/40 hover:bg-mint/15 text-mint"],
          ] as const
        ).map(([label, key, cls]) => (
          <button
            key={key}
            onClick={() => rate(key)}
            className={`rounded-xl border bg-card py-3.5 text-sm font-semibold transition-colors ${cls}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center text-[11px] text-faint">
        Hard → tomorrow · Good → in {card.interval <= 1 ? 3 : Math.round(card.interval * 2.2)} days · Easy → in {card.interval <= 1 ? 7 : Math.round(card.interval * 3.2)} days
      </div>
    </div>
  );
}

function NewDeckModal({ onClose }: { onClose: () => void }) {
  const { state, update, addXp } = useApp();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState(state.profile?.subjects[0] ?? "General");
  const [rows, setRows] = useState<{ front: string; back: string }[]>([
    { front: "", back: "" },
    { front: "", back: "" },
  ]);
  const [fromNote, setFromNote] = useState("");

  function generateFromNote(noteId: string) {
    setFromNote(noteId);
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;
    // heuristic generator: headings become questions, their content becomes answers
    const out: { front: string; back: string }[] = [];
    const sections = note.body.split(/^## /m).filter(Boolean);
    for (const sec of sections) {
      const [head, ...rest] = sec.split("\n");
      const body = rest.join(" ").replace(/[-•]\s*/g, "").trim();
      if (head && body)
        out.push({ front: `${note.folder}: what do you know about “${head.trim()}”?`, back: body.slice(0, 220) });
    }
    if (out.length === 0)
      out.push({ front: `Summarise: ${note.title}`, back: note.body.slice(0, 220) });
    setName(`${note.title} — flashcards`);
    setSubject(note.folder);
    setRows(out);
  }

  function save() {
    const cards: Card[] = rows
      .filter((r) => r.front.trim() && r.back.trim())
      .map((r) => ({
        id: uid(), front: r.front.trim(), back: r.back.trim(),
        due: Date.now(), interval: 1, reps: 0, lapses: 0,
      }));
    if (!name.trim() || cards.length === 0) return;
    update((s) => ({
      ...s,
      decks: [
        ...s.decks,
        { id: uid(), name: name.trim(), subject, createdAt: Date.now(), cards },
      ],
    }));
    addXp(20, 3);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-100 bg-ink/70 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="mx-auto mt-[6vh] max-w-2xl glass rounded-3xl p-7 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">New flashcard deck</h2>

        {state.notes.length > 0 && (
          <div className="mt-4">
            <span className="text-xs font-medium text-sub">✨ Auto-generate from a note</span>
            <select
              value={fromNote}
              onChange={(e) => generateFromNote(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-edge bg-card2 px-3.5 py-2.5 text-sm outline-none focus:border-accent/50"
            >
              <option value="">Choose a note (optional)…</option>
              {state.notes.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-sub">Deck name</span>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trigonometry Essentials"
              className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-sub">Subject</span>
            <input
              value={subject} onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2.5">
              <input
                value={r.front}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, front: e.target.value } : x)))}
                placeholder={`Question ${i + 1}`}
                className="rounded-xl border border-edge bg-ink/60 px-3.5 py-2.5 text-sm outline-none focus:border-accent/60"
              />
              <input
                value={r.back}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, back: e.target.value } : x)))}
                placeholder="Answer"
                className="rounded-xl border border-edge bg-ink/60 px-3.5 py-2.5 text-sm outline-none focus:border-accent/60"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => setRows((rs) => [...rs, { front: "", back: "" }])}
          className="mt-3 text-xs text-accent2 font-semibold hover:underline"
        >
          + Add another card
        </button>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-edge bg-card2 px-5 py-2.5 text-sm font-semibold text-sub hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} className="btn-glow rounded-xl px-6 py-2.5 text-sm font-semibold">
            Create deck (+20 XP)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Flashcards() {
  const { state, update } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const active = state.decks.find((d) => d.id === activeId);
  if (active) return <StudyView deck={active} onExit={() => setActiveId(null)} />;

  const totalDue = state.decks.reduce((a, d) => a + dueCards(d).length, 0);
  const today = new Date().toISOString().slice(0, 10);
  const reviewedToday = state.activity[today]?.reviews ?? 0;
  const goal = 20;
  const goalPct = Math.min(1, reviewedToday / goal);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-sm text-sub mt-1.5">
            {totalDue > 0 ? `${totalDue} cards due — clear them before they fade` : "All caught up — nothing due right now 🎉"}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit"
        >
          + New deck
        </button>
      </div>

      <div className="card p-5 flex items-center gap-5">
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#23233a" strokeWidth="7" />
            <circle
              cx="32" cy="32" r="27" fill="none" stroke="url(#g1)" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 27}
              strokeDashoffset={2 * Math.PI * 27 * (1 - goalPct)}
              className="animate-ring-in"
            />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b6cf6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center text-xs font-bold">
            {Math.round(goalPct * 100)}%
          </span>
        </div>
        <div>
          <div className="font-semibold text-sm">Daily revision goal</div>
          <div className="text-xs text-sub mt-1">
            {reviewedToday} of {goal} cards reviewed today.
            {reviewedToday < goal ? " Every review earns 5 XP and feeds your streak." : " Goal smashed — legend. 🏆"}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.decks.map((d, i) => {
          const due = dueCards(d).length;
          return (
            <div
              key={d.id}
              className={`card card-hover p-6 text-left bg-gradient-to-br ${DECK_COLORS[i % DECK_COLORS.length]} relative group`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-edge bg-ink/40 px-3 py-1 text-[10px] font-medium text-sub">
                  {d.subject}
                </span>
                {due > 0 ? (
                  <span className="rounded-full bg-rose/20 border border-rose/40 px-2.5 py-1 text-[10px] font-bold text-rose">
                    {due} due
                  </span>
                ) : (
                  <span className="rounded-full bg-mint/15 border border-mint/30 px-2.5 py-1 text-[10px] font-bold text-mint">
                    ✓ done
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold leading-snug">{d.name}</h3>
              <div className="mt-3 text-xs text-faint">{d.cards.length} cards</div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setActiveId(d.id)}
                  className="text-sm font-semibold text-accent2 hover:underline"
                >
                  {due > 0 ? "Study due →" : "Practice all →"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete deck “${d.name}”?`))
                      update((s) => ({ ...s, decks: s.decks.filter((x) => x.id !== d.id) }));
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[11px] text-faint hover:text-rose transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setCreating(true)}
          className="rounded-[1.25rem] border-2 border-dashed border-edge2 p-6 grid place-items-center text-center hover:border-accent/50 transition-colors min-h-44"
        >
          <div>
            <div className="text-2xl">✨</div>
            <div className="mt-2 text-sm font-semibold">Create a deck</div>
            <p className="mt-1.5 text-xs text-sub">
              Write cards yourself or auto-generate them from any of your notes.
            </p>
          </div>
        </button>
      </div>

      {creating && <NewDeckModal onClose={() => setCreating(false)} />}
    </div>
  );
}
