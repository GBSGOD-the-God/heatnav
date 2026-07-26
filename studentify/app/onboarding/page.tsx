"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";

const classes = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const boards = ["CBSE", "ICSE / ISC", "State Board", "IGCSE", "IB"];
const subjects = [
  "Maths", "Physics", "Chemistry", "Biology", "Science", "English",
  "Hindi", "Social Science", "Computer Science", "Economics",
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "border-accent/70 bg-accent/20 text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]"
          : "border-edge bg-card2 text-sub hover:border-edge2 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<string | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [subs, setSubs] = useState<string[]>([]);

  const steps = [
    {
      title: "Which class are you in?",
      done: grade !== null,
      body: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {classes.map((c) => (
            <Chip key={c} label={c} active={grade === c} onClick={() => setGrade(c)} />
          ))}
        </div>
      ),
    },
    {
      title: "Which board do you study under?",
      done: board !== null,
      body: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {boards.map((b) => (
            <Chip key={b} label={b} active={board === b} onClick={() => setBoard(b)} />
          ))}
        </div>
      ),
    },
    {
      title: "Pick your subjects",
      done: subs.length > 0,
      body: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {subjects.map((s) => (
            <Chip
              key={s}
              label={s}
              active={subs.includes(s)}
              onClick={() =>
                setSubs((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                )
              }
            />
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <AuthShell
      wide
      title="Set up your learning profile"
      subtitle="Studentify adapts every explanation to your class, board and subjects."
    >
      {/* progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? "bg-gradient-to-r from-primary to-accent" : "bg-edge"
            }`}
          />
        ))}
      </div>

      <h2 className="text-lg font-semibold text-center">{current.title}</h2>
      <div className="mt-6 min-h-32">{current.body}</div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`text-sm text-sub hover:text-white transition-colors ${step === 0 ? "invisible" : ""}`}
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={!current.done}
          onClick={() => (last ? router.push("/dashboard") : setStep((s) => s + 1))}
          className="btn-glow rounded-xl px-7 py-3 text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none"
        >
          {last ? "Enter Studentify →" : "Continue"}
        </button>
      </div>
    </AuthShell>
  );
}
