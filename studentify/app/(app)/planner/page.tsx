import type { Metadata } from "next";
import { plannerSchedule } from "@/lib/data";

export const metadata: Metadata = { title: "Study Planner" };

const kindStyles: Record<string, string> = {
  learn: "border-primary/40 bg-primary/15 text-blue-300",
  practice: "border-mint/40 bg-mint/10 text-mint",
  revision: "border-accent/40 bg-accent/15 text-accent2",
  quiz: "border-amber/40 bg-amber/10 text-amber",
  exam: "border-rose/40 bg-rose/10 text-rose",
};

export default function Planner() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-sm text-sub mt-1.5">
            Built around your exams and free hours — reprioritises itself when life happens.
          </p>
        </div>
        <button className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit">
          ✨ Rebuild my plan
        </button>
      </div>

      {/* plan inputs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-faint">Next exam</div>
          <div className="mt-1.5 font-semibold">Maths — Unit Test</div>
          <div className="text-xs text-sub mt-0.5">in 9 days · Sat, 10 AM</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-faint">Daily study window</div>
          <div className="mt-1.5 font-semibold">2.0 hours / weekday</div>
          <div className="text-xs text-sub mt-0.5">3.5 hours / weekend</div>
        </div>
        <div className="card p-5 border-amber/30">
          <div className="text-xs text-amber font-semibold">⚠️ Missed task recovered</div>
          <div className="mt-1.5 text-sm text-sub leading-snug">
            Wednesday's Chemistry block was missed — it's been rescheduled to Sunday
            automatically.
          </div>
        </div>
      </div>

      {/* week grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-7 gap-4">
        {plannerSchedule.map((d, i) => (
          <div
            key={d.day}
            className={`card p-4 ${i === 0 ? "border-accent/40 shadow-[0_10px_40px_-16px_rgba(139,92,246,0.45)]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">{d.day.slice(0, 3)}</div>
              {i === 0 && (
                <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[9px] font-bold text-accent2 uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2.5">
              {d.blocks.map((b) => (
                <div key={b.topic} className="rounded-xl border border-edge bg-card2 p-3">
                  <div className="text-[10px] text-faint">{b.time}</div>
                  <div className="mt-1 text-xs font-semibold leading-snug">{b.topic}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${kindStyles[b.kind]}`}>
                      {b.kind}
                    </span>
                    <span className="text-[9px] text-faint">{b.subject}</span>
                  </div>
                </div>
              ))}
              {d.blocks.length === 0 && (
                <div className="rounded-xl border border-dashed border-edge2 p-3 text-center text-[10px] text-faint">
                  Rest day 🌿
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* legend + reminders */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(kindStyles).map(([k, cls]) => (
            <span key={k} className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${cls}`}>
              {k}
            </span>
          ))}
        </div>
        <div className="text-xs text-sub">
          🔔 Revision reminders: <span className="text-white font-medium">30 min before each block</span>
        </div>
      </div>
    </div>
  );
}
