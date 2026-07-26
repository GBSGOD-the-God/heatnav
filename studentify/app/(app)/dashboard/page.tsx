"use client";

import Link from "next/link";
import {
  computeStreak,
  dueCards,
  levelFromXp,
  subjectAccuracy,
  useApp,
  weekActivity,
} from "@/lib/store";

export default function Dashboard() {
  const { state, loadSample } = useApp();
  const p = state.profile!;
  const streak = computeStreak(state.activity);
  const week = weekActivity(state.activity);
  const weekTotal = week.reduce((a, d) => a + d.minutes, 0);
  const maxMin = Math.max(1, ...week.map((d) => d.minutes));
  const { level } = levelFromXp(state.xp);
  const acc = subjectAccuracy(state.quizzes);
  const avgAcc = acc.length
    ? Math.round(acc.reduce((a, s) => a + s.pct, 0) / acc.length)
    : null;
  const due = state.decks.reduce((a, d) => a + dueCards(d).length, 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayBlocks = state.plan.filter((b) => b.date === today && !b.done);
  const recentChats = [...state.chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isEmpty =
    state.notes.length === 0 && state.decks.length === 0 && state.quizzes.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm text-faint">{greet} 👋</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Ready to continue, {p.name}?
          </h1>
          <div className="text-sm text-sub mt-1.5">
            {p.grade} · {p.board} · Level {level}
          </div>
        </div>
        <Link href="/tutor" className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit">
          Ask the AI Tutor →
        </Link>
      </div>

      {isEmpty && (
        <div className="shimmer-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="text-4xl">🚀</div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Welcome to Studentify!</h2>
            <p className="text-sm text-sub mt-1 leading-relaxed">
              Everything here is real — notes you write, cards you review and quizzes you
              take all feed your streak, XP and progress. Start by asking the tutor a
              doubt, or load sample content to explore first.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={loadSample}
              className="rounded-xl border border-edge bg-card2 px-4 py-2.5 text-xs font-semibold hover:border-edge2 transition-colors"
            >
              Load sample content
            </button>
            <Link href="/tutor" className="btn-glow rounded-xl px-4 py-2.5 text-xs font-semibold">
              Ask first doubt
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["🔥", streak > 0 ? `${streak} day${streak > 1 ? "s" : ""}` : "—", "Current streak", "text-amber"],
          ["⏱️", weekTotal >= 60 ? `${(weekTotal / 60).toFixed(1)} h` : `${weekTotal} min`, "Studied this week", "text-mint"],
          ["🎯", avgAcc !== null ? `${avgAcc}%` : "—", "Avg quiz accuracy", "text-accent2"],
          ["⭐", `${state.xp.toLocaleString()} XP`, `Level ${level}`, "text-white"],
        ].map(([e, v, l, c]) => (
          <div key={l as string} className="card card-hover p-5">
            <div className="text-xl">{e}</div>
            <div className={`mt-2 text-xl sm:text-2xl font-bold ${c}`}>{v}</div>
            <div className="text-xs text-sub mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Study activity</h2>
            <span className="text-xs text-faint">Last 7 days</span>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3 items-end h-40">
            {week.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-faint opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.minutes}m
                </div>
                <div
                  className={`w-full max-w-9 rounded-lg transition-all ${
                    d.minutes > 0
                      ? "bg-gradient-to-t from-primary to-accent opacity-85 group-hover:opacity-100 group-hover:shadow-[0_0_18px_-2px_rgba(139,92,246,0.6)]"
                      : "bg-edge"
                  }`}
                  style={{ height: `${Math.max(4, (d.minutes / maxMin) * 100)}%` }}
                />
                <span className="text-[10px] text-faint">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Today</h2>
            <Link href="/planner" className="text-xs text-accent2 hover:underline">
              Planner →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {due > 0 && (
              <Link
                href="/flashcards"
                className="flex items-start gap-3 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-3 hover:border-rose/50 transition-colors"
              >
                <span className="text-base">🃏</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{due} flashcards due</span>
                  <span className="block text-[11px] text-faint mt-0.5">Clear them to keep memory fresh</span>
                </span>
              </Link>
            )}
            {todayBlocks.slice(0, 3).map((t) => (
              <Link
                key={t.id}
                href="/planner"
                className="flex items-start gap-3 rounded-xl border border-edge bg-card2 px-3.5 py-3 hover:border-edge2 transition-colors"
              >
                <span className="mt-0.5 size-2 shrink-0 rounded-full bg-gradient-to-r from-primary to-accent" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug">{t.topic}</span>
                  <span className="block text-[11px] text-faint mt-0.5">{t.time} · {t.subject}</span>
                </span>
              </Link>
            ))}
            {due === 0 && todayBlocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-edge2 px-4 py-6 text-center text-xs text-faint leading-relaxed">
                Nothing scheduled yet.
                <br />
                <Link href="/planner" className="text-accent2 font-semibold hover:underline">
                  Build your study plan →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Continue learning</h2>
          <div className="mt-4 space-y-3">
            {recentChats.map((c) => (
              <Link
                key={c.id}
                href="/tutor"
                className="flex items-center gap-4 rounded-xl border border-edge bg-card2 px-4 py-3.5 hover:border-accent/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="size-10 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 border border-edge text-lg">
                  💬
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-[11px] text-faint mt-0.5">
                    {c.mode} · {c.messages.length} messages
                  </div>
                </div>
                <span className="text-faint group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            ))}
            {recentChats.length === 0 && (
              <div className="rounded-xl border border-dashed border-edge2 px-4 py-8 text-center text-sm text-faint">
                Your tutor sessions will appear here.{" "}
                <Link href="/tutor" className="text-accent2 font-semibold hover:underline">
                  Start one →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h2 className="font-semibold">Quick doubt?</h2>
          <p className="mt-2 text-sm text-sub flex-1">
            Ask anything — the tutor adapts to {p.grade} {p.board}.
          </p>
          <div className="mt-4 space-y-2">
            {["Solve: x² − 5x + 6 = 0", "Explain refraction with an analogy", "Give me a challenge question"].map((q) => (
              <Link
                key={q}
                href={`/tutor?q=${encodeURIComponent(q)}`}
                className="block rounded-xl border border-edge bg-card2 px-3.5 py-2.5 text-xs text-sub hover:text-white hover:border-accent/40 transition-colors"
              >
                💭 {q}
              </Link>
            ))}
          </div>
          <Link href="/tutor" className="btn-glow mt-4 rounded-xl py-2.5 text-center text-sm font-semibold">
            Open AI Tutor
          </Link>
        </div>
      </div>
    </div>
  );
}
