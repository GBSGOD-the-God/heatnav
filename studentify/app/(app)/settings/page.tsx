"use client";

import { useState } from "react";
import { student } from "@/lib/data";

function Toggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={`relative h-6.5 w-12 rounded-full transition-colors ${
        on ? "bg-gradient-to-r from-primary to-accent" : "bg-edge"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all ${
          on ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-edge/60 last:border-0">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-sub mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Select({ options }: { options: string[] }) {
  return (
    <select className="rounded-xl border border-edge bg-card2 px-3.5 py-2 text-sm outline-none focus:border-accent/50 transition">
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

export default function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-sub mt-1.5">Make Studentify yours.</p>
      </div>

      {/* profile */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <span className="size-16 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-2xl font-bold">
            {student.name[0]}
          </span>
          <div className="flex-1">
            <div className="font-bold">{student.name} Sharma</div>
            <div className="text-xs text-sub mt-0.5">
              {student.grade} · {student.board} · Springfield Public School
            </div>
          </div>
          <button className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors">
            Edit profile
          </button>
        </div>
      </div>

      {/* appearance & AI */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">
          Appearance & AI
        </div>
        <Row title="Theme" desc="Dark mode is the Studentify default.">
          <Select options={["Dark", "Light", "System"]} />
        </Row>
        <Row title="Language" desc="Interface and AI explanations.">
          <Select options={["English", "हिन्दी", "Hinglish"]} />
        </Row>
        <Row title="AI response length" desc="How detailed the tutor's answers should be.">
          <Select options={["Balanced", "Short & crisp", "Detailed"]} />
        </Row>
        <Row title="Hints before answers" desc="The tutor offers a hint before full solutions.">
          <Toggle />
        </Row>
      </div>

      {/* memory */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">
          AI memory
        </div>
        <Row
          title="Personalised memory"
          desc="Remembers your learning style, strong and weak subjects, and pace."
        >
          <Toggle />
        </Row>
        <Row title="Reset memory" desc="Clear everything the AI has learned about you.">
          <button className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-xs font-semibold text-amber hover:bg-amber/20 transition-colors">
            Reset
          </button>
        </Row>
      </div>

      {/* notifications */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">
          Notifications
        </div>
        <Row title="Study reminders" desc="Nudges before each planned study block.">
          <Toggle />
        </Row>
        <Row title="Revision reminders" desc="When flashcards become due.">
          <Toggle />
        </Row>
        <Row title="Daily motivation" desc="A small push to keep the streak alive.">
          <Toggle defaultOn={false} />
        </Row>
      </div>

      {/* privacy */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">
          Privacy & data
        </div>
        <Row title="Export my data" desc="Download notes, chats, decks and progress as a ZIP.">
          <button className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors">
            Export
          </button>
        </Row>
        <Row title="Delete account" desc="Permanently removes your account and all data.">
          <button className="rounded-xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs font-semibold text-rose hover:bg-rose/20 transition-colors">
            Delete
          </button>
        </Row>
      </div>
    </div>
  );
}
