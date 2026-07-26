"use client";

import { useEffect, useState } from "react";
import { quizBank } from "@/lib/data";

type Stage = "setup" | "running" | "done";

const QUESTION_TIME = 45;

export default function Quiz() {
  const [stage, setStage] = useState<Stage>("setup");
  const [source, setSource] = useState("Topic");
  const [difficulty, setDifficulty] = useState("Medium");
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [time, setTime] = useState(QUESTION_TIME);

  const q = quizBank[qIdx];

  useEffect(() => {
    if (stage !== "running" || picked !== null) return;
    if (time <= 0) {
      setPicked(-1);
      setAnswers((a) => [...a, false]);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, time, picked]);

  function start() {
    setStage("running");
    setQIdx(0);
    setPicked(null);
    setAnswers([]);
    setTime(QUESTION_TIME);
  }

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setAnswers((a) => [...a, i === q.answer]);
  }

  function next() {
    if (qIdx + 1 >= quizBank.length) {
      setStage("done");
    } else {
      setQIdx((i) => i + 1);
      setPicked(null);
      setTime(QUESTION_TIME);
    }
  }

  /* ---------- setup ---------- */
  if (stage === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quiz Generator</h1>
          <p className="text-sm text-sub mt-1.5">
            Turn any chapter, note or PDF into a timed quiz with instant AI explanations.
          </p>
        </div>

        <div className="card p-7 space-y-7">
          <div>
            <div className="text-sm font-semibold mb-3">Generate from</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[["📚", "Topic"], ["📓", "My notes"], ["📄", "A PDF"], ["🗂️", "Subject"]].map(([e, s]) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`rounded-xl border px-3 py-3.5 text-sm font-medium transition-all ${
                    source === s
                      ? "border-accent/60 bg-accent/20"
                      : "border-edge bg-card2 text-sub hover:text-white hover:border-edge2"
                  }`}
                >
                  <div className="text-lg mb-1">{e}</div>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Difficulty</div>
            <div className="grid grid-cols-3 gap-2.5">
              {["Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                    difficulty === d
                      ? "border-accent/60 bg-accent/20"
                      : "border-edge bg-card2 text-sub hover:text-white hover:border-edge2"
                  }`}
                >
                  {d === "Easy" ? "🌱" : d === "Medium" ? "⚡" : "🔥"} {d}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold">Topic</span>
            <input
              defaultValue="Class 10 mixed revision — Maths, Physics, Chemistry"
              className="mt-2.5 w-full rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-edge bg-card2 px-4 py-3.5 text-sm">
            <span className="text-sub">⏱️ Timer per question</span>
            <span className="font-semibold">{QUESTION_TIME} seconds</span>
          </div>

          <button onClick={start} className="btn-glow w-full rounded-xl py-3.5 font-semibold">
            Generate quiz · {quizBank.length} questions →
          </button>
        </div>
      </div>
    );
  }

  /* ---------- results ---------- */
  if (stage === "done") {
    const score = answers.filter(Boolean).length;
    const pct = Math.round((score / quizBank.length) * 100);
    return (
      <div className="mx-auto max-w-lg text-center animate-fade-up">
        <div className="card p-10">
          <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📖"}</div>
          <h2 className="mt-4 text-2xl font-bold">
            {score} / {quizBank.length} correct
          </h2>
          <div className="mt-5 relative size-32 mx-auto">
            <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#23233a" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="url(#gq)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - pct / 100)}
                className="animate-ring-in"
              />
              <defs>
                <linearGradient id="gq" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b6cf6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 grid place-items-center text-2xl font-bold">{pct}%</span>
          </div>
          <p className="mt-5 text-sm text-sub">
            {pct >= 80
              ? "Excellent — this topic is nearly mastered. It'll appear less often in revision."
              : "Good effort. The questions you missed have been added to your weak areas for revision."}
          </p>
          <div className="mt-5 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 px-4 py-3 text-sm text-accent2 font-medium">
            +{score * 20} XP earned
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={start} className="flex-1 rounded-xl border border-edge bg-card2 py-3 text-sm font-semibold hover:border-edge2 transition-colors">
              Retry quiz
            </button>
            <button onClick={() => setStage("setup")} className="btn-glow flex-1 rounded-xl py-3 text-sm font-semibold">
              New quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- running ---------- */
  const timePct = (time / QUESTION_TIME) * 100;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-4 text-xs text-faint">
        <span>
          Question {qIdx + 1} of {quizBank.length} · {difficulty}
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold ${
            time <= 10 ? "border-rose/50 text-rose" : "border-edge text-sub"
          }`}
        >
          ⏱️ {time}s
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-edge overflow-hidden mb-8">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            time <= 10 ? "bg-rose" : "bg-gradient-to-r from-primary to-accent"
          }`}
          style={{ width: `${timePct}%` }}
        />
      </div>

      <div className="card p-7 animate-fade-up" key={qIdx}>
        <h2 className="text-lg font-semibold leading-relaxed">{q.q}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            let cls = "border-edge bg-card2 hover:border-accent/50 hover:-translate-y-0.5";
            if (picked !== null) {
              if (isAnswer) cls = "border-mint/60 bg-mint/15";
              else if (isPicked) cls = "border-rose/60 bg-rose/15";
              else cls = "border-edge bg-card2 opacity-50";
            }
            return (
              <button
                key={opt}
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={`w-full flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${cls}`}
              >
                <span className="size-7 shrink-0 grid place-items-center rounded-lg border border-edge bg-ink/50 text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {picked !== null && isAnswer && <span className="ml-auto text-mint">✓</span>}
                {picked !== null && isPicked && !isAnswer && <span className="ml-auto text-rose">✗</span>}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-6 animate-fade-up rounded-xl border border-accent/30 bg-accent/10 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-accent2 mb-1.5">
              ✨ AI explanation
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{q.explain}</p>
            {picked === -1 && (
              <p className="mt-2 text-xs text-rose">Time ran out on this one.</p>
            )}
            <button onClick={next} className="btn-glow mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold">
              {qIdx + 1 >= quizBank.length ? "See results →" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
