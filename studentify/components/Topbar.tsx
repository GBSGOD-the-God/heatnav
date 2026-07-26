"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computeStreak, useApp } from "@/lib/store";

const PAGES = [
  { title: "Dashboard", href: "/dashboard", emoji: "🏠" },
  { title: "AI Tutor", href: "/tutor", emoji: "💬" },
  { title: "Notes", href: "/notes", emoji: "📓" },
  { title: "Flashcards", href: "/flashcards", emoji: "🃏" },
  { title: "Quiz", href: "/quiz", emoji: "🧪" },
  { title: "Planner", href: "/planner", emoji: "🗓️" },
  { title: "Progress", href: "/progress", emoji: "📈" },
  { title: "Settings", href: "/settings", emoji: "⚙️" },
];

function CommandK({ onClose }: { onClose: () => void }) {
  const { state } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (s: string) => s.toLowerCase().includes(needle);
    const out: { group: string; title: string; sub: string; emoji: string; href: string }[] = [];
    for (const p of PAGES)
      if (!needle || match(p.title))
        out.push({ group: "Pages", title: p.title, sub: "Go to page", emoji: p.emoji, href: p.href });
    if (needle) {
      for (const n of state.notes)
        if (match(n.title) || match(n.body))
          out.push({ group: "Notes", title: n.title, sub: n.folder, emoji: "📓", href: "/notes" });
      for (const d of state.decks)
        if (match(d.name) || d.cards.some((c) => match(c.front) || match(c.back)))
          out.push({ group: "Flashcards", title: d.name, sub: `${d.cards.length} cards`, emoji: "🃏", href: "/flashcards" });
      for (const c of state.chats)
        if (match(c.title) || c.messages.some((m) => match(m.text)))
          out.push({ group: "Chats", title: c.title, sub: c.mode, emoji: "💬", href: "/tutor" });
      for (const qz of state.quizzes)
        if (match(qz.topic) || match(qz.subject))
          out.push({ group: "Quizzes", title: `${qz.topic} — ${qz.correct}/${qz.total}`, sub: qz.subject, emoji: "🧪", href: "/quiz" });
    }
    return out.slice(0, 12);
  }, [q, state]);

  useEffect(() => setSel(0), [q]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-100 bg-ink/70 backdrop-blur-sm animate-fade-in p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-xl glass rounded-2xl overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-faint">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && results[sel]) go(results[sel].href);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search notes, decks, chats, quizzes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
          />
          <kbd className="rounded-md border border-edge bg-card px-1.5 py-0.5 text-[10px] text-faint">esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-faint">
              Nothing found for “{q}”.
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.group + r.title + i}
              onClick={() => go(r.href)}
              onMouseEnter={() => setSel(i)}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                i === sel ? "bg-accent/15 border border-accent/30" : "border border-transparent"
              }`}
            >
              <span className="text-base">{r.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate font-medium">{r.title}</span>
                <span className="block text-[11px] text-faint">{r.group} · {r.sub}</span>
              </span>
              {i === sel && <span className="text-[10px] text-faint">↵</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Topbar() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const streak = computeStreak(state.activity);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 glass border-b border-edge/60">
      <div className="flex items-center gap-4 px-4 sm:px-8 h-16">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 max-w-md flex items-center gap-2.5 rounded-xl border border-edge bg-ink/50 px-3.5 py-2 text-sm text-faint hover:border-edge2 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left truncate">Search everything…</span>
          <kbd className="hidden sm:block rounded-md border border-edge bg-card px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div
            className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              streak > 0
                ? "border-amber/30 bg-amber/10 text-amber"
                : "border-edge bg-card text-faint"
            }`}
            title={streak > 0 ? `${streak}-day streak — keep it alive!` : "Study today to start a streak"}
          >
            🔥 {streak}
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-xl border border-edge bg-card pl-1.5 pr-3 py-1.5 hover:border-edge2 transition-colors"
          >
            <span className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-bold text-white">
              {(state.profile?.name ?? "S")[0]}
            </span>
            <span className="hidden sm:block text-sm font-medium">
              {state.profile?.name ?? "Student"}
            </span>
          </Link>
        </div>
      </div>
      {open && <CommandK onClose={() => setOpen(false)} />}
    </header>
  );
}
