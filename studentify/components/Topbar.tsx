"use client";

import Link from "next/link";
import { student } from "@/lib/data";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 glass border-b border-edge/60">
      <div className="flex items-center gap-4 px-4 sm:px-8 h-16">
        {/* global search */}
        <div className="flex-1 max-w-md">
          <label className="flex items-center gap-2.5 rounded-xl border border-edge bg-ink/50 px-3.5 py-2 text-sm text-faint focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15 transition">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search notes, chats, PDFs, flashcards…"
              className="w-full bg-transparent outline-none placeholder:text-faint text-white"
            />
            <kbd className="hidden sm:block rounded-md border border-edge bg-card px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">
            🔥 {student.streak}
          </div>
          <button
            aria-label="Notifications"
            className="relative size-9 grid place-items-center rounded-xl border border-edge bg-card hover:border-edge2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke="#9aa0b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-rose border-2 border-panel" />
          </button>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-xl border border-edge bg-card pl-1.5 pr-3 py-1.5 hover:border-edge2 transition-colors"
          >
            <span className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-bold">
              {student.name[0]}
            </span>
            <span className="hidden sm:block text-sm font-medium">{student.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
