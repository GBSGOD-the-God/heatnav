"use client";

import { useState } from "react";
import { generatePlan, uid, useApp } from "@/lib/store";

const kindStyles: Record<string, string> = {
  learn: "border-primary/40 bg-primary/15 text-blue-300",
  practice: "border-mint/40 bg-mint/10 text-mint",
  revision: "border-accent/40 bg-accent/15 text-accent2",
  quiz: "border-amber/40 bg-amber/10 text-amber",
  exam: "border-rose/40 bg-rose/10 text-rose",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Planner() {
  const { state, update, addXp } = useApp();
  const [examSubject, setExamSubject] = useState(state.profile?.subjects[0] ?? "");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400000);
    return { date: d.toISOString().slice(0, 10), label: DAY_NAMES[d.getDay()] };
  });

  function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examSubject || !examName || !examDate) return;
    update((s) => ({
      ...s,
      exams: [...s.exams, { id: uid(), subject: examSubject, name: examName, date: examDate }],
    }));
    setExamName("");
    setExamDate("");
  }

  function rebuild() {
    update((s) => ({ ...s, plan: generatePlan(s) }));
    addXp(15, 2);
  }

  function toggleBlock(id: string) {
    const block = state.plan.find((b) => b.id === id);
    update((s) => ({
      ...s,
      plan: s.plan.map((b) => (b.id === id ? { ...b, done: !b.done } : b)),
    }));
    if (block && !block.done) addXp(30, 45); // completing a study block logs ~45 min
  }

  const upcomingExams = [...state.exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Study Planner</h1>
          <p className="text-sm text-sub mt-1.5">
            Add your exams and hours — Studentify builds the week, prioritising weak subjects.
          </p>
        </div>
        <button onClick={rebuild} className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit">
          ✨ {state.plan.length ? "Rebuild my plan" : "Build my plan"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <form onSubmit={addExam} className="card p-5 space-y-3">
          <div className="text-sm font-semibold">📅 Add an exam</div>
          <select
            value={examSubject}
            onChange={(e) => setExamSubject(e.target.value)}
            className="w-full rounded-xl border border-edge bg-card2 px-3.5 py-2.5 text-sm outline-none focus:border-accent/50"
          >
            {(state.profile?.subjects ?? ["General"]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="e.g. Unit Test 2"
            className="w-full rounded-xl border border-edge bg-ink/60 px-3.5 py-2.5 text-sm outline-none placeholder:text-faint focus:border-accent/60"
          />
          <input
            type="date"
            value={examDate}
            min={days[0].date}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-xl border border-edge bg-ink/60 px-3.5 py-2.5 text-sm outline-none focus:border-accent/60 [color-scheme:dark]"
          />
          <button type="submit" className="w-full rounded-xl border border-accent/40 bg-accent/15 py-2.5 text-sm font-semibold text-accent2 hover:bg-accent/25 transition-colors">
            Add exam
          </button>
        </form>

        <div className="card p-5">
          <div className="text-sm font-semibold">⏱️ Daily study hours</div>
          <div className="mt-4 flex items-center gap-4">
            <input
              type="range" min={1} max={6} step={0.5}
              value={state.weeklyHours}
              onChange={(e) => update((s) => ({ ...s, weeklyHours: parseFloat(e.target.value) }))}
              className="flex-1 accent-[#8b5cf6]"
            />
            <span className="text-lg font-bold w-16 text-right">{state.weeklyHours}h</span>
          </div>
          <p className="mt-3 text-xs text-sub leading-relaxed">
            Weekdays get {state.weeklyHours}h; weekends stretch to{" "}
            {Math.round(state.weeklyHours * 1.5 * 10) / 10}h. Rebuild the plan after changing.
          </p>
        </div>

        <div className="card p-5">
          <div className="text-sm font-semibold">🎯 Upcoming exams</div>
          <div className="mt-3 space-y-2 max-h-36 overflow-y-auto">
            {upcomingExams.map((e) => {
              const dte = Math.ceil((new Date(e.date).getTime() - Date.now()) / 86400000);
              return (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-edge bg-card2 px-3.5 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.name}</div>
                    <div className="text-[11px] text-faint">{e.subject} · {dte <= 0 ? "today!" : `in ${dte} days`}</div>
                  </div>
                  <button
                    onClick={() => update((s) => ({ ...s, exams: s.exams.filter((x) => x.id !== e.id) }))}
                    className="text-faint hover:text-rose text-xs ml-2"
                    aria-label="Remove exam"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {upcomingExams.length === 0 && (
              <p className="text-xs text-faint py-3">No exams added yet — add one and rebuild the plan to see revision ramp up before it.</p>
            )}
          </div>
        </div>
      </div>

      {state.plan.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-7 gap-4">
          {days.map((d, i) => {
            const blocks = state.plan.filter((b) => b.date === d.date);
            return (
              <div
                key={d.date}
                className={`card p-4 ${i === 0 ? "border-accent/40 shadow-[0_10px_40px_-16px_rgba(139,92,246,0.45)]" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">{d.label.slice(0, 3)}</div>
                  {i === 0 && (
                    <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[9px] font-bold text-accent2 uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2.5">
                  {blocks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => toggleBlock(b.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${
                        b.done ? "border-mint/30 bg-mint/5 opacity-60" : "border-edge bg-card2 hover:border-edge2"
                      }`}
                    >
                      <div className="text-[10px] text-faint flex items-center justify-between">
                        {b.time}
                        <span className={b.done ? "text-mint" : "text-faint"}>{b.done ? "✓ done" : "mark done"}</span>
                      </div>
                      <div className={`mt-1 text-xs font-semibold leading-snug ${b.done ? "line-through" : ""}`}>
                        {b.topic}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${kindStyles[b.kind]}`}>
                          {b.kind}
                        </span>
                        <span className="text-[9px] text-faint">{b.subject}</span>
                      </div>
                    </button>
                  ))}
                  {blocks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-edge2 p-3 text-center text-[10px] text-faint">
                      Rest day 🌿
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl">🗓️</div>
          <h2 className="mt-4 font-bold text-lg">No plan yet</h2>
          <p className="mt-2 text-sm text-sub max-w-md mx-auto leading-relaxed">
            Set your daily hours, add any upcoming exams, then hit{" "}
            <b className="text-white">Build my plan</b>. The schedule prioritises weak
            subjects from your quiz results and ramps up revision as exams approach.
            Completing a block earns 30 XP and logs your study time.
          </p>
        </div>
      )}

      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(kindStyles).map(([k, cls]) => (
            <span key={k} className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${cls}`}>
              {k}
            </span>
          ))}
        </div>
        <div className="text-xs text-sub">
          Ticked blocks log 45 minutes of study time toward your streak and charts.
        </div>
      </div>
    </div>
  );
}
