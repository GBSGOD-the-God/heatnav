"use client";

import { useState } from "react";
import { decks, type Deck } from "@/lib/data";

function StudyView({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState<string[]>([]);
  const done = idx >= deck.cards.length;
  const card = deck.cards[Math.min(idx, deck.cards.length - 1)];

  function rate(r: string) {
    setRated((prev) => [...prev, r]);
    setFlipped(false);
    setTimeout(() => setIdx((i) => i + 1), 250);
  }

  if (done) {
    const easy = rated.filter((r) => r === "easy").length;
    return (
      <div className="mx-auto max-w-lg text-center animate-fade-up">
        <div className="card p-10">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-4 text-2xl font-bold">Session complete!</h2>
          <p className="mt-2 text-sm text-sub">
            {deck.cards.length} cards reviewed · {easy} marked easy. Cards you found hard
            will come back sooner — that's spaced repetition working.
          </p>
          <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 px-4 py-3 text-sm text-accent2 font-medium">
            +{deck.cards.length * 10} XP earned
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
          Card {idx + 1} of {deck.cards.length} · {deck.name}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-edge overflow-hidden mb-8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${(idx / deck.cards.length) * 100}%` }}
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
        {[
          ["😅 Hard", "hard", "border-rose/40 hover:bg-rose/15 text-rose"],
          ["🙂 Good", "good", "border-amber/40 hover:bg-amber/15 text-amber"],
          ["😎 Easy", "easy", "border-mint/40 hover:bg-mint/15 text-mint"],
        ].map(([label, key, cls]) => (
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
        Hard → again tomorrow · Good → in 3 days · Easy → in a week
      </div>
    </div>
  );
}

export default function Flashcards() {
  const [active, setActive] = useState<Deck | null>(null);

  if (active) return <StudyView deck={active} onExit={() => setActive(null)} />;

  const totalDue = decks.reduce((a, d) => a + d.due, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-sm text-sub mt-1.5">
            {totalDue} cards due today · spaced repetition keeps memory fresh
          </p>
        </div>
        <button className="rounded-xl border border-edge bg-card px-5 py-3 text-sm font-semibold hover:border-edge2 transition-colors w-fit">
          + New deck
        </button>
      </div>

      {/* daily goal */}
      <div className="card p-5 flex items-center gap-5">
        <div className="relative size-16 shrink-0">
          <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#23233a" strokeWidth="7" />
            <circle
              cx="32" cy="32" r="27" fill="none" stroke="url(#g1)" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 27}
              strokeDashoffset={2 * Math.PI * 27 * 0.35}
              className="animate-ring-in"
            />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b6cf6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center text-xs font-bold">65%</span>
        </div>
        <div>
          <div className="font-semibold text-sm">Daily revision goal</div>
          <div className="text-xs text-sub mt-1">
            13 of 20 cards reviewed today. Finish the rest to keep your 🔥 12-day streak.
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {decks.map((d) => (
          <button
            key={d.id}
            onClick={() => setActive(d)}
            className={`card card-hover p-6 text-left bg-gradient-to-br ${d.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-edge bg-ink/40 px-3 py-1 text-[10px] font-medium text-sub">
                {d.subject}
              </span>
              {d.due > 0 && (
                <span className="rounded-full bg-rose/20 border border-rose/40 px-2.5 py-1 text-[10px] font-bold text-rose">
                  {d.due} due
                </span>
              )}
            </div>
            <h3 className="mt-4 font-semibold leading-snug">{d.name}</h3>
            <div className="mt-3 text-xs text-faint">{d.total} cards</div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent2">
              Study now
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>
        ))}

        {/* auto-generate card */}
        <div className="rounded-[1.25rem] border-2 border-dashed border-edge2 p-6 grid place-items-center text-center hover:border-accent/50 transition-colors">
          <div>
            <div className="text-2xl">✨</div>
            <div className="mt-2 text-sm font-semibold">Auto-generate from a PDF</div>
            <p className="mt-1.5 text-xs text-sub">
              Upload notes or a chapter — Studentify writes the cards for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
