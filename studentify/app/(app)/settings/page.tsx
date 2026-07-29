"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useApp, type Settings as S } from "@/lib/store";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
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

export default function SettingsPage() {
  const { state, update, resetAll, token, logout } = useApp();
  const router = useRouter();
  const s = state.settings;
  const p = state.profile!;
  const [showMemory, setShowMemory] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  function set<K extends keyof S>(key: K, value: S[K]) {
    update((st) => ({ ...st, settings: { ...st.settings, [key]: value } }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studentify-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    const scope = token ? "on this device AND on the server" : "on this device";
    if (!confirm(`Delete your account and ALL data ${scope}? This cannot be undone.`)) return;
    if (token) await api.deleteAccount(token);
    resetAll();
    router.push("/");
  }

  async function handleLogout() {
    if (!confirm("Log out? Local data on this device will be cleared (it stays safe in your account on the server).")) return;
    await logout();
    router.push("/");
  }

  const selectCls =
    "rounded-xl border border-edge bg-card2 px-3.5 py-2 text-sm outline-none focus:border-accent/50 transition";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-sub mt-1.5">Make Studentify yours.</p>
      </div>

      {/* profile */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <span className="size-16 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center text-2xl font-bold text-white">
            {p.name[0]}
          </span>
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <input
                value={p.name}
                onChange={(e) =>
                  update((st) => ({ ...st, profile: { ...p, name: e.target.value } }))
                }
                className="w-full max-w-52 rounded-lg border border-edge bg-ink/60 px-3 py-1.5 text-sm font-bold outline-none focus:border-accent/60"
              />
            ) : (
              <div className="font-bold truncate">{p.name}</div>
            )}
            <div className="text-xs text-sub mt-0.5">
              {p.grade} · {p.board}
              {p.email ? ` · ${p.email}` : ""}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.subjects.map((sub) => (
                <span key={sub} className="rounded-full bg-white/5 border border-edge px-2 py-0.5 text-[10px] text-sub">
                  {sub}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setEditingProfile((e) => !e)}
            className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors"
          >
            {editingProfile ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* AI connection */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">AI</div>
        <div className="py-4 border-b border-edge/60">
          <div className="text-sm font-semibold">Mistral API key</div>
          <div className="text-xs text-sub mt-0.5 leading-relaxed">
            Optional — unlocks full AI answers on any topic. Get a free key at{" "}
            <span className="text-accent2">console.mistral.ai</span>. Stored only on this
            device and sent straight to Mistral.
          </div>
          <input
            type="password"
            value={s.mistralKey}
            onChange={(e) => set("mistralKey", e.target.value.trim())}
            placeholder="Paste your API key…"
            className="mt-3 w-full rounded-xl border border-edge bg-ink/60 px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-accent/60 font-mono"
          />
          <div className={`mt-2 text-[11px] ${s.mistralKey ? "text-mint" : "text-faint"}`}>
            {s.mistralKey ? "✓ Key set — the tutor will use Mistral" : "No key — the built-in offline engine handles maths & structured coaching"}
          </div>
        </div>
        <Row title="AI response length" desc="How detailed the tutor's answers should be.">
          <select
            value={s.responseLength}
            onChange={(e) => set("responseLength", e.target.value as S["responseLength"])}
            className={selectCls}
          >
            <option value="balanced">Balanced</option>
            <option value="short">Short & crisp</option>
            <option value="detailed">Detailed</option>
          </select>
        </Row>
        <Row title="Hints before answers" desc="The tutor offers a hint before full solutions.">
          <Toggle on={s.hintsFirst} onChange={(v) => set("hintsFirst", v)} />
        </Row>
      </div>

      {/* appearance */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">Appearance</div>
        <Row title="Theme" desc="Dark is the Studentify default — light is there for daytime.">
          <div className="flex rounded-xl border border-edge bg-card2 p-1">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set("theme", t)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                  s.theme === t ? "bg-gradient-to-r from-primary to-accent text-white" : "text-sub"
                }`}
              >
                {t === "dark" ? "🌙" : "☀️"} {t}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Language" desc="Interface and AI explanations.">
          <select value={s.language} onChange={(e) => set("language", e.target.value)} className={selectCls}>
            <option>English</option>
            <option>हिन्दी</option>
            <option>Hinglish</option>
          </select>
        </Row>
      </div>

      {/* memory */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">AI memory</div>
        <Row title="Personalised memory" desc="Remembers what you ask about to personalise coaching.">
          <Toggle on={s.memoryOn} onChange={(v) => set("memoryOn", v)} />
        </Row>
        <Row title="View memory" desc={`${state.memory.length} things remembered.`}>
          <button
            onClick={() => setShowMemory((v) => !v)}
            className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white transition-colors"
          >
            {showMemory ? "Hide" : "View"}
          </button>
        </Row>
        {showMemory && (
          <div className="mb-4 rounded-xl border border-edge bg-ink/40 p-4 text-xs text-sub space-y-1.5 max-h-40 overflow-y-auto">
            {state.memory.length === 0 && <div className="text-faint">Nothing remembered yet.</div>}
            {state.memory.map((m, i) => (
              <div key={i}>• {m}</div>
            ))}
          </div>
        )}
        <Row title="Reset memory" desc="Clear everything the AI has learned about you.">
          <button
            onClick={() => update((st) => ({ ...st, memory: [] }))}
            className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-xs font-semibold text-amber hover:bg-amber/20 transition-colors"
          >
            Reset
          </button>
        </Row>
      </div>

      {/* notifications */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">Notifications</div>
        <Row title="Study reminders" desc="Nudges before each planned study block.">
          <Toggle on={s.remindersStudy} onChange={(v) => set("remindersStudy", v)} />
        </Row>
        <Row title="Revision reminders" desc="When flashcards become due.">
          <Toggle on={s.remindersRevision} onChange={(v) => set("remindersRevision", v)} />
        </Row>
        <Row title="Daily motivation" desc="A small push to keep the streak alive.">
          <Toggle on={s.dailyMotivation} onChange={(v) => set("dailyMotivation", v)} />
        </Row>
      </div>

      {/* account & sync */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">Account & sync</div>
        <Row
          title="Sync status"
          desc={
            token
              ? "Logged in — your data auto-saves to your account and follows you across devices."
              : "Device-only mode — data lives in this browser. Log in to sync it to the server."
          }
        >
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              token ? "border-mint/40 bg-mint/10 text-mint" : "border-edge bg-card2 text-faint"
            }`}
          >
            {token ? "● Synced" : "○ Local only"}
          </span>
        </Row>
        {token && (
          <Row title="Log out" desc="Sign out on this device. Your account and data stay on the server.">
            <button
              onClick={handleLogout}
              className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors"
            >
              Log out
            </button>
          </Row>
        )}
      </div>

      {/* privacy */}
      <div className="card px-6 py-2">
        <div className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-faint">Privacy & data</div>
        <Row title="Export my data" desc="Download everything — notes, decks, chats, progress — as JSON.">
          <button
            onClick={exportData}
            className="rounded-xl border border-edge bg-card2 px-4 py-2 text-xs font-semibold text-sub hover:text-white hover:border-edge2 transition-colors"
          >
            Export
          </button>
        </Row>
        <Row title="Delete account" desc="Permanently removes your account and all data — from this device and from the server.">
          <button
            onClick={deleteAccount}
            className="rounded-xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs font-semibold text-rose hover:bg-rose/20 transition-colors"
          >
            Delete
          </button>
        </Row>
      </div>
    </div>
  );
}
