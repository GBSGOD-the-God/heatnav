"use client";

import { useEffect, useMemo, useState } from "react";
import Confetti from "@/components/Confetti";
import { quizBank, type QuizQ } from "@/lib/data";
import { uid, useApp } from "@/lib/store";

type Stage = "setup" | "running" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const { state, update, addXp } = useApp();
  const [stage, setStage] = useState<Stage>("setup");
  const [source, setSource] = useState<"Topic bank" | "My flashcards">("Topic bank");
  const [subject, setSubject] = useState("All subjects");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ ok: boolean; topic: string }[]>([]);
  const [time, setTime] = useState(45);
  const perQuestion = difficulty === "Easy" ? 60 : difficulty === "Medium" ? 45 : 30;

  const subjects = useMemo(() => {
    const fromBank = quizBank.map((q) => q.subject ?? "General");
    return ["All subjects", ...Array.from(new Set(fromBank))];
  }, []);

  const totalCards = state.decks.reduce((a, d) => a + d.cards.length, 0);
  const q = questions[qIdx];

  useEffect(() => {
    if (stage !== "running" || picked !== null) return;
    if (time <= 0) {
      setPicked(-1);
      setAnswers((a) => [...a, { ok: false, topic: q?.topic ?? "general" }]);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, time, picked, q]);

  function buildQuestions(): QuizQ[] {
    if (source === "My flashcards" && totalCards >= 4) {
      const all = state.decks.flatMap((d) =>
        d.cards.map((c) => ({ ...c, subject: d.subject, deck: d.name }))
      );
      return shuffle(all)
        .slice(0, Math.min(8, all.length))
        .map((card) => {
          const distractors = shuffle(all.filter((c) => c.id !== card.id))
            .slice(0, 3)
            .map((c) => c.back);
          const options = shuffle([card.back, ...distractors]);
          return {
            q: card.front,
            options,
            answer: options.indexOf(card.back),
            explain: `From your deck “${card.deck}”. The correct answer is: ${card.back}`,
            subject: card.subject,
            topic: card.deck.toLowerCase(),
          };
        });
    }
    const pool = quizBank.filter(
      (x) => subject === "All subjects" || x.subject === subject
    );
    return shuffle(pool).slice(0, Math.min(8, pool.length));
  }

  function start() {
    const qs = buildQuestions();
    if (qs.length === 0) return;
    setQuestions(qs);
    setStage("running");
    setQIdx(0);
    setPicked(null);
    setAnswers([]);
    setTime(perQuestion);
  }

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setAnswers((a) => [...a, { ok: i === q.answer, topic: q.topic ?? "general" }]);
  }

  function finishQuiz(finalAnswers: { ok: boolean; topic: string }[]) {
    const correct = finalAnswers.filter((a) => a.ok).length;
    const missed = Array.from(new Set(finalAnswers.filter((a) => !a.ok).map((a) => a.topic)));
    update((s) => ({
      ...s,
      quizzes: [
        ...s.quizzes,
        {
          id: uid(),
          topic: source === "My flashcards" ? "From my flashcards" : subject,
          subject: subject === "All subjects" ? "Mixed" : subject,
          difficulty,
          total: finalAnswers.length,
          correct,
          date: Date.now(),
          missedTopics: missed,
        },
      ],
    }));
    addXp(correct * 20, Math.round((finalAnswers.length * perQuestion) / 60) + 1);
    setStage("done");
  }

  function next() {
    if (qIdx + 1 >= questions.length) finishQuiz(answers);
    else {
      setQIdx((i) => i + 1);
      setPicked(null);
      setTime(perQuestion);
    }
  }

  /* ---------- setup ---------- */
  if (stage === "setup") {
    const recent = [...state.quizzes].sort((a, b) => b.date - a.date).slice(0, 3);
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quiz Generator</h1>
          <p className="text-sm text-sub mt-1.5">
            Instant scoring, AI explanations, and every result feeds your weak-area tracking.
          </p>
        </div>

        <div className="card p-7 space-y-7">
          <div>
            <div className="text-sm font-semibold mb-3">Generate from</div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["📚", "Topic bank", "Curated questions by subject"],
                  ["🃏", "My flashcards", totalCards >= 4 ? `${totalCards} cards → MCQs` : "Needs ≥ 4 cards"],
                ] as const
              ).map(([e, s, hint]) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  disabled={s === "My flashcards" && totalCards < 4}
                  className={`rounded-xl border px-3 py-3.5 text-sm font-medium transition-all disabled:opacity-40 ${
                    source === s
                      ? "border-accent/60 bg-accent/20"
                      : "border-edge bg-card2 text-sub hover:text-white hover:border-edge2"
                  }`}
                >
                  <div className="text-lg mb-1">{e}</div>
                  {s}
                  <div className="mt-1 text-[10px] text-faint font-normal">{hint}</div>
                </button>
              ))}
            </div>
          </div>

          {source === "Topic bank" && (
            <div>
              <div className="text-sm font-semibold mb-3">Subject</div>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      subject === s
                        ? "border-accent/60 bg-accent/20 text-white"
                        : "border-edge bg-card2 text-sub hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  <div className="text-[10px] text-faint font-normal mt-0.5">
                    {d === "Easy" ? "60" : d === "Medium" ? "45" : "30"}s / question
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={start} className="btn-glow w-full rounded-xl py-3.5 font-semibold">
            Generate quiz →
          </button>
        </div>

        {recent.length > 0 && (
          <div className="card p-6">
            <h2 className="text-sm font-semibold">Recent results</h2>
            <div className="mt-3 space-y-2">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-edge bg-card2 px-4 py-2.5 text-sm">
                  <span className="truncate">{r.topic}</span>
                  <span className={`ml-3 font-bold ${r.correct / r.total >= 0.7 ? "text-mint" : "text-amber"}`}>
                    {r.correct}/{r.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- results ---------- */
  if (stage === "done") {
    const score = answers.filter((a) => a.ok).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="mx-auto max-w-lg text-center animate-fade-up">
        {pct >= 70 && <Confetti />}
        <div className="card p-10">
          <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📖"}</div>
          <h2 className="mt-4 text-2xl font-bold">
            {score} / {questions.length} correct
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
              ? "Excellent — this topic is nearly mastered."
              : "The topics you missed are now tracked in your weak areas on the Progress page."}
          </p>
          <div className="mt-5 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 px-4 py-3 text-sm text-accent2 font-medium">
            +{score * 20} XP earned
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={start} className="flex-1 rounded-xl border border-edge bg-card2 py-3 text-sm font-semibold hover:border-edge2 transition-colors">
              Retry
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
  const timePct = (time / perQuestion) * 100;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-4 text-xs text-faint">
        <span>
          Question {qIdx + 1} of {questions.length} · {difficulty}
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
                key={opt + i}
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
            {picked === -1 && <p className="mt-2 text-xs text-rose">Time ran out on this one.</p>}
            <button onClick={next} className="btn-glow mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold">
              {qIdx + 1 >= questions.length ? "See results →" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
