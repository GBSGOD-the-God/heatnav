"use client";

import { useMemo, useState } from "react";
import { notesData } from "@/lib/data";

const folders = ["All", ...Array.from(new Set(notesData.map((n) => n.folder)))];

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
  const [folder, setFolder] = useState("All");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(notesData[0].id);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const filtered = useMemo(
    () =>
      notesData.filter(
        (n) =>
          (folder === "All" || n.folder === folder) &&
          (query === "" ||
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            n.body.toLowerCase().includes(query.toLowerCase()))
      ),
    [folder, query]
  );

  const active = notesData.find((n) => n.id === activeId) ?? notesData[0];
  const body = drafts[active.id] ?? active.body;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-sub mt-1.5">
            Markdown, equations, tables and code — auto-saved as you type.
          </p>
        </div>
        <button className="btn-glow rounded-xl px-5 py-3 text-sm font-semibold w-fit">+ New note</button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* list panel */}
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
          <div className="space-y-2.5">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setActiveId(n.id);
                  setEditing(false);
                }}
                className={`w-full card p-4 text-left transition-all ${
                  n.id === active.id
                    ? "border-accent/50 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.5)]"
                    : "card-hover"
                }`}
              >
                <div className="text-sm font-semibold leading-snug">{n.title}</div>
                <div className="mt-1.5 text-[11px] text-faint">
                  {n.folder} · {n.updated}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.tags.map((t) => (
                    <span key={t} className="rounded-full bg-white/5 border border-edge px-2 py-0.5 text-[10px] text-sub">
                      #{t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="card p-6 text-center text-sm text-faint">No notes match your search.</div>
            )}
          </div>
        </div>

        {/* editor panel */}
        <div className="card p-6 sm:p-8 min-h-[60vh] flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold leading-snug">{active.title}</h2>
              <div className="mt-1.5 text-xs text-faint flex items-center gap-2">
                {active.folder} · edited {active.updated}
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
              <button className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors">
                ✨ Summarise
              </button>
            </div>
          </div>

          <div className="my-5 h-px bg-edge" />

          {editing ? (
            <textarea
              value={body}
              onChange={(e) => setDrafts((d) => ({ ...d, [active.id]: e.target.value }))}
              className="flex-1 min-h-72 w-full resize-none rounded-xl border border-edge bg-ink/50 p-4 font-mono text-sm leading-relaxed outline-none focus:border-accent/50 transition"
            />
          ) : (
            <MdPreview body={body} />
          )}

          <div className="mt-6 pt-5 border-t border-edge flex flex-wrap gap-2">
            {["🃏 Make flashcards", "🧪 Quiz me on this", "💬 Explain a section"].map((a) => (
              <button
                key={a}
                className="rounded-full border border-edge bg-card2 px-4 py-2 text-xs font-medium text-sub hover:text-white hover:border-accent/40 transition-colors"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
