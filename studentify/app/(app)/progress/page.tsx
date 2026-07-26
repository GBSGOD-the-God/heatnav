"use client";

import Link from "next/link";
import {
  computeBadges,
  computeStreak,
  levelFromXp,
  subjectAccuracy,
  useApp,
  weekActivity,
  dayKey,
} from "@/lib/store";

function LineChart({ weeks }: { weeks: number[] }) {
  const max = Math.max(1, ...weeks);
  const w = 300;
  const h = 110;
  const coords = weeks.map((p, i) => [
    (i / Math.max(1, weeks.length - 1)) * (w - 20) + 10,
    h - 10 - (p / max) * (h - 25),
  ]);
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1][0]},${h} L${coords[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 14}`} className="w-full">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b6cf6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="la" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#la)" />
      <path d={path} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="#0c0c14" stroke="#8b5cf6" strokeWidth="2.5" />
          <text x={x} y={h + 10} textAnchor="middle" fontSize="8.5" fill="#626880">
            {i === weeks.length - 1 ? "This wk" : `Wk −${weeks.length - 1 - i}`}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Progress() {
  const { state } = useApp();
  const streak = computeStreak(state.activity);
  const { level, progress } = levelFromXp(state.xp);
  const acc = subjectAccuracy(state.quizzes);
  const badges = computeBadges(state);
  const week = weekActivity(state.activity);

  // 4 weekly totals (hours) from the activity log
  const weeks: number[] = [0, 0, 0, 0];
  const now = Date.now();
  for (let i = 0; i < 28; i++) {
    const k = dayKey(new Date(now - i * 86400000));
    const idx = 3 - Math.floor(i / 7);
    weeks[idx] += (state.activity[k]?.minutes ?? 0) / 60;
  }
  const roundedWeeks = weeks.map((v) => Math.round(v * 10) / 10);
  const thisWeek = roundedWeeks[3];
  const lastWeek = roundedWeeks[2];
  const delta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  const weakTopics = Array.from(
    new Set(state.quizzes.flatMap((q) => q.missedTopics.map((t) => ({ s: q.subject, t }))).map((x) => JSON.stringify(x)))
  )
    .map((x) => JSON.parse(x) as { s: string; t: string })
    .slice(-4)
    .reverse();

  const todayMin = week[6]?.minutes ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-sub mt-1.5">
          Everything on this page is computed from what you've actually done.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Study hours</h2>
            {delta !== null && (
              <span className={`text-xs font-semibold ${delta >= 0 ? "text-mint" : "text-amber"}`}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last week
              </span>
            )}
          </div>
          {state.xp > 0 ? (
            <div className="mt-5">
              <LineChart weeks={roundedWeeks} />
              <div className="mt-2 text-center text-xs text-faint">
                {thisWeek}h this week · {todayMin} min today
              </div>
            </div>
          ) : (
            <div className="mt-5 py-10 text-center text-sm text-faint">
              Study anything — chat, cards, quizzes — and your hours will chart here.
            </div>
          )}
        </div>

        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <div className="relative size-36">
            <svg viewBox="0 0 100 100" className="size-36 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#23233a" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="url(#gr)" strokeWidth="9"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progress)}
                className="animate-ring-in"
              />
              <defs>
                <linearGradient id="gr" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b6cf6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="text-2xl font-bold">Lv {level}</div>
                <div className="text-[10px] text-faint">{state.xp.toLocaleString()} XP</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm font-semibold">
            {streak > 0 ? `🔥 ${streak}-day streak` : "Start a streak today"}
          </div>
          <div className="mt-1 text-xs text-sub">Every study action counts</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Quiz accuracy by subject</h2>
          {acc.length > 0 ? (
            <div className="mt-5 space-y-4">
              {acc.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{s.subject}</span>
                    <span className={s.pct < 75 ? "text-amber font-semibold" : "text-sub"}>{s.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-edge overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        s.pct < 75
                          ? "bg-gradient-to-r from-amber to-rose"
                          : "bg-gradient-to-r from-primary to-accent"
                      }`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 py-8 text-center text-sm text-faint">
              Take a <Link href="/quiz" className="text-accent2 font-semibold hover:underline">quiz</Link> and
              your per-subject accuracy will appear here.
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Weak areas</h2>
          <p className="text-xs text-sub mt-1">From questions you've missed</p>
          <div className="mt-4 space-y-2.5">
            {weakTopics.map(({ s, t }) => (
              <div key={s + t} className="rounded-xl border border-amber/25 bg-amber/5 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber">{s}</div>
                <div className="mt-1 text-sm font-medium leading-snug capitalize">{t}</div>
                <Link
                  href={`/tutor?q=${encodeURIComponent(`Help me revise ${t} (${s})`)}`}
                  className="mt-2.5 inline-block text-xs text-accent2 font-semibold hover:underline"
                >
                  Revise with AI →
                </Link>
              </div>
            ))}
            {weakTopics.length === 0 && (
              <p className="text-xs text-faint py-3">
                No weak areas detected yet — missed quiz questions will surface topics to
                revise.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Achievements</h2>
          <span className="text-xs text-faint">
            {badges.filter((b) => b.got).length} of {badges.length} unlocked
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 text-center transition-all ${
                b.got
                  ? "border-accent/40 bg-gradient-to-b from-accent/15 to-transparent hover:-translate-y-1"
                  : "border-edge bg-card2 opacity-40 grayscale"
              }`}
            >
              <div className="text-2xl">{b.emoji}</div>
              <div className="mt-2 text-[10px] font-semibold leading-tight">{b.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
