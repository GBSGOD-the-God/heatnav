"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { uid, useApp } from "@/lib/store";

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function MdPreview({ body }: { body: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {body.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return (
            <div key={i} className="pt-3 first:pt-0 text-[11px] font-bold uppercase tracking-widest text-accent2">
              {line.slice(3)}
            </div>
          );
        if (/^[-•]\s/.test(line))
          return (
            <div key={i} className="flex gap-2.5 text-white/85">
              <span className="text-accent2 mt-px">•</span>
              {line.replace(/^[-•]\s/, "")}
            </div>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <div key={i} className="flex gap-2.5 text-white/85">
              <span className="text-accent2 font-semibold">{line.match(/^\d+/)?.[0]}.</span>
              {line.replace(/^\d+\.\s/, "")}
            </div>
          );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-white/85">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function Notes() {
  const { state, update, addXp } = useApp();
  const [folder, setFolder] = useState("All");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(
    () => ["All", ...Array.from(new Set(state.notes.map((n) => n.folder)))],
    [state.notes]
  );

  const filtered = useMemo(
    () =>
      state.notes
        .filter(
          (n) =>
            (folder === "All" || n.folder === folder) &&
            (query === "" ||
              n.title.toLowerCase().includes(query.toLowerCase()) ||
              n.body.toLowerCase().includes(query.toLowerCase()))
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [state.notes, folder, query]
  );

  const active = state.notes.find((n) => n.id === activeId) ?? filtered[0] ?? null;

  function createNote() {
    const id = uid();
    update((s) => ({
      ...s,
      notes: [
        {
          id,
          title: "Untitled note",
          folder: folder === "All" ? state.profile?.subjects[0] ?? "General" : folder,
          tags: [],
          body: "## New note\nStart typing…",
          updatedAt: Date.now(),
        },
        ...s.notes,
      ],
    }));
    addXp(20, 2);
    setActiveId(id);
    setEditing(true);
  }

  function patchActive(patch: Partial<{ title: string; body: string; folder: string }>) {
    if (!active) return;
    update((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n
      ),
    }));
  }

  function deleteActive() {
    if (!active) return;
    if (!confirm(`Delete “${active.title}”?`)) return;
    update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== active.id) }));
    setActiveId(null);
    setEditing(false);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const id = uid();
    update((s) => ({
      ...s,
      notes: [
        {
          id,
          title: file.name.replace(/\.(txt|md|markdown)$/i, ""),
          folder: folder === "All" ? "Imported" : folder,
          tags: ["imported"],
          body: text.slice(0, 20000),
          updatedAt: Date.now(),
        },
        ...s.notes,
      ],
    }));
    addXp(25, 3);
    setActiveId(id);
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-sub mt-1.5">
            Markdown-friendly, auto-saved, searchable — and convertible into flashcards.
          </p>
        </div>
        <div className="flex gap-2.5">
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown" className="hidden" onChange={onUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-edge bg-card px-4 py-3 text-sm font-semibold text-sub hover:text-white hover:border-edge2 transition-colors"
          >
            ⬆ Import .txt/.md
          </button>
          <button onClick={createNote} className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold">
            + New note
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-xl border border-edge bg-ink/50 px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-accent/50 transition"
          />
          <div className="flex flex-wrap gap-2">
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  folder === f
                    ? "border-accent/60 bg-accent/20 text-white"
                    : "border-edge bg-card text-sub hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setActiveId(n.id);
                  setEditing(false);
                }}
                className={`w-full card p-4 text-left transition-all ${
                  active && n.id === active.id
                    ? "border-accent/50 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.5)]"
                    : "card-hover"
                }`}
              >
                <div className="text-sm font-semibold leading-snug">{n.title}</div>
                <div className="mt-1.5 text-[11px] text-faint">
                  {n.folder} · {timeAgo(n.updatedAt)}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="card p-6 text-center text-sm text-faint">
                {state.notes.length === 0 ? "No notes yet — create your first one!" : "No notes match your search."}
              </div>
            )}
          </div>
        </div>

        {active ? (
          <div className="card p-6 sm:p-8 min-h-[60vh] flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    value={active.title}
                    onChange={(e) => patchActive({ title: e.target.value })}
                    className="w-full bg-transparent text-xl font-bold outline-none border-b border-edge focus:border-accent/50 pb-1"
                  />
                ) : (
                  <h2 className="text-xl font-bold leading-snug">{active.title}</h2>
                )}
                <div className="mt-1.5 text-xs text-faint flex items-center gap-2">
                  {active.folder} · edited {timeAgo(active.updatedAt)}
                  <span className="flex items-center gap-1 text-mint">
                    <span className="size-1.5 rounded-full bg-mint animate-pulse-glow" /> auto-saved
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditing((e) => !e)}
                  className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
                    editing
                      ? "border-accent/60 bg-accent/20"
                      : "border-edge bg-card2 text-sub hover:text-white hover:border-edge2"
                  }`}
                >
                  {editing ? "Preview" : "✏️ Edit"}
                </button>
                <button
                  onClick={deleteActive}
                  className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-rose hover:border-rose/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="my-5 h-px bg-edge" />

            {editing ? (
              <textarea
                value={active.body}
                onChange={(e) => patchActive({ body: e.target.value })}
                className="flex-1 min-h-72 w-full resize-none rounded-xl border border-edge bg-ink/50 p-4 font-mono text-sm leading-relaxed outline-none focus:border-accent/50 transition"
              />
            ) : (
              <MdPreview body={active.body} />
            )}

            <div className="mt-6 pt-5 border-t border-edge flex flex-wrap gap-2">
              <Link
                href="/flashcards"
                className="rounded-full border border-edge bg-card2 px-4 py-2 text-xs font-medium text-sub hover:text-white hover:border-accent/40 transition-colors"
              >
                🃏 Make flashcards from this note
              </Link>
              <Link
                href={`/tutor?q=${encodeURIComponent(`Explain this to me: ${active.title}`)}`}
                className="rounded-full border border-edge bg-card2 px-4 py-2 text-xs font-medium text-sub hover:text-white hover:border-accent/40 transition-colors"
              >
                💬 Explain with AI Tutor
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-10 min-h-[60vh] grid place-items-center text-center">
            <div>
              <div className="text-4xl">📓</div>
              <h2 className="mt-4 font-bold">Your second brain starts here</h2>
              <p className="mt-2 text-sm text-sub max-w-xs">
                Write notes, import your existing ones, then turn them into flashcards and
                quizzes with one click.
              </p>
              <button onClick={createNote} className="btn-glow mt-6 rounded-xl px-6 py-3 text-sm font-semibold">
                Create first note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
