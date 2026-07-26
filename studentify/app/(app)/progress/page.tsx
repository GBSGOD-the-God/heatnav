import type { Metadata } from "next";
import { badges, quizAccuracy, student, weeklyHours } from "@/lib/data";

export const metadata: Metadata = { title: "Progress" };

function LineChart() {
  // four weeks of study hours
  const points = [8.5, 11, 9.5, 14.8];
  const max = 16;
  const w = 300;
  const h = 110;
  const coords = points.map((p, i) => [
    (i / (points.length - 1)) * (w - 20) + 10,
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
            Week {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Progress() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-sub mt-1.5">
          Watch yourself getting better — hours, accuracy, weak areas and badges.
        </p>
      </div>

      {/* top row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Study hours</h2>
            <span className="text-xs text-mint font-semibold">▲ 56% vs last month</span>
          </div>
          <div className="mt-5">
            <LineChart />
          </div>
        </div>

        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <div className="relative size-36">
            <svg viewBox="0 0 100 100" className="size-36 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#23233a" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="url(#gr)" strokeWidth="9"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - student.levelProgress)}
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
                <div className="text-2xl font-bold">Lv {student.level}</div>
                <div className="text-[10px] text-faint">{student.xp.toLocaleString()} XP</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm font-semibold">🔥 {student.streak}-day streak</div>
          <div className="mt-1 text-xs text-sub">Longest: 21 days</div>
        </div>
      </div>

      {/* accuracy + weak areas */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Quiz accuracy by subject</h2>
          <div className="mt-5 space-y-4">
            {quizAccuracy.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">{s.subject}</span>
                  <span className={s.pct < 75 ? "text-amber font-semibold" : "text-sub"}>{s.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-edge overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
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
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Weak areas</h2>
          <p className="text-xs text-sub mt-1">Recommended for revision this week</p>
          <div className="mt-4 space-y-2.5">
            {[
              ["Physics", "Ray diagrams — concave mirrors"],
              ["Maths", "Word problems on quadratics"],
              ["Chemistry", "IUPAC naming"],
            ].map(([sub, topic]) => (
              <div key={topic} className="rounded-xl border border-amber/25 bg-amber/5 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber">{sub}</div>
                <div className="mt-1 text-sm font-medium leading-snug">{topic}</div>
                <button className="mt-2.5 text-xs text-accent2 font-semibold hover:underline">
                  Revise with AI →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* badges */}
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
              key={b.name}
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
