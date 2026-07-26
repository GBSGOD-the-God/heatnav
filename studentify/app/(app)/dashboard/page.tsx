import Link from "next/link";
import type { Metadata } from "next";
import { recentSessions, student, upcomingTasks, weeklyHours } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

const maxHours = Math.max(...weeklyHours.map((d) => d.hours));

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* greeting row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm text-faint">Good evening 👋</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Ready to continue, {student.name}?
          </h1>
          <div className="text-sm text-sub mt-1.5">
            {student.grade} · {student.board} · Level {student.level}
          </div>
        </div>
        <Link href="/tutor" className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit">
          Ask the AI Tutor →
        </Link>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["🔥", `${student.streak} days`, "Current streak", "text-amber"],
          ["⏱️", "14.8 h", "Studied this week", "text-mint"],
          ["🎯", "82%", "Avg quiz accuracy", "text-accent2"],
          ["⭐", `${student.xp.toLocaleString()} XP`, `Level ${student.level}`, "text-white"],
        ].map(([e, v, l, c]) => (
          <div key={l} className="card card-hover p-5">
            <div className="text-xl">{e}</div>
            <div className={`mt-2 text-xl sm:text-2xl font-bold ${c}`}>{v}</div>
            <div className="text-xs text-sub mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* study activity */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Study activity</h2>
            <span className="text-xs text-faint">This week</span>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3 items-end h-40">
            {weeklyHours.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-faint opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.hours}h
                </div>
                <div
                  className="w-full max-w-9 rounded-lg bg-gradient-to-t from-primary to-accent opacity-85 group-hover:opacity-100 transition-all group-hover:shadow-[0_0_18px_-2px_rgba(139,92,246,0.6)]"
                  style={{ height: `${(d.hours / maxHours) * 100}%` }}
                />
                <span className="text-[10px] text-faint">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* upcoming tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming</h2>
            <Link href="/planner" className="text-xs text-accent2 hover:underline">
              Planner →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {upcomingTasks.map((t) => (
              <div
                key={t.title}
                className="flex items-start gap-3 rounded-xl border border-edge bg-card2 px-3.5 py-3 hover:border-edge2 transition-colors"
              >
                <span className="mt-0.5 size-2 shrink-0 rounded-full bg-gradient-to-r from-primary to-accent" />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{t.title}</div>
                  <div className="text-[11px] text-faint mt-0.5">
                    {t.due} · {t.subject}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* continue learning */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Continue learning</h2>
          <div className="mt-4 space-y-3">
            {recentSessions.map((s) => (
              <Link
                key={s.title}
                href="/tutor"
                className="flex items-center gap-4 rounded-xl border border-edge bg-card2 px-4 py-3.5 hover:border-accent/40 hover:-translate-y-0.5 transition-all group"
              >
                <div className="size-10 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 border border-edge text-lg">
                  {s.subject === "Maths" ? "📐" : s.subject === "Physics" ? "🔭" : "⚗️"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-[11px] text-faint mt-0.5">
                    {s.subject} · {s.mode} · {s.when}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-edge overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${s.progress * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-faint group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* quick chat */}
        <div className="card p-6 flex flex-col">
          <h2 className="font-semibold">Quick doubt?</h2>
          <p className="mt-2 text-sm text-sub flex-1">
            Ask anything — the tutor picks up your class and subjects automatically.
          </p>
          <div className="mt-4 space-y-2">
            {["Explain the discriminant simply", "Why does ice float on water?", "Summarise Ch. 6 in 5 points"].map((q) => (
              <Link
                key={q}
                href="/tutor"
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
