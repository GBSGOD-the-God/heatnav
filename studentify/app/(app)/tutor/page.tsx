"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { aiModes, type Mode } from "@/lib/data";
import { api } from "@/lib/api";
import { localReply } from "@/lib/engine";
import { askMistral } from "@/lib/mistral";
import { uid, useApp, type ChatMsg } from "@/lib/store";

function TutorInner() {
  const { state, update, addXp, token } = useApp();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(aiModes[0]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "ai", text: aiModes[0].greeting }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [usedMistral, setUsedMistral] = useState<boolean | null>(null);
  const pendingRef = useRef<{ hint?: string; solution?: string }>({});
  const endRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  const key = state.settings.mistralKey;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  // deep-link: /tutor?q=...
  useEffect(() => {
    const q = params.get("q");
    if (q && !bootRef.current) {
      bootRef.current = true;
      setTimeout(() => send(q), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function persist(msgs: ChatMsg[], firstUserText?: string) {
    update((s) => {
      const chats = [...s.chats];
      let id = sessionId;
      if (!id) {
        id = uid();
        chats.push({
          id,
          mode: mode.name,
          title: (firstUserText ?? "New session").slice(0, 60),
          messages: msgs,
          updatedAt: Date.now(),
        });
        setSessionId(id);
      } else {
        const i = chats.findIndex((c) => c.id === id);
        if (i >= 0) chats[i] = { ...chats[i], messages: msgs, updatedAt: Date.now() };
      }
      return { ...s, chats };
    });
  }

  function switchMode(m: Mode) {
    setMode(m);
    setSessionId(null);
    setMessages([{ role: "ai", text: m.greeting }]);
    pendingRef.current = {};
  }

  function remember(fact: string) {
    if (!state.settings.memoryOn) return;
    update((s) =>
      s.memory.includes(fact) ? s : { ...s, memory: [...s.memory.slice(-19), fact] }
    );
  }

  async function getAiResponse(history: ChatMsg[], userText: string): Promise<ChatMsg> {
    const payload = {
      messages: history,
      mode: mode.id,
      profile: state.profile,
      memory: state.settings.memoryOn ? state.memory : [],
      length: state.settings.responseLength,
    };

    // 1) Site AI — the owner's server-side key, free for every student.
    const server = await api.tutor(payload, token);
    if (server.ok && server.data.text) {
      setUsedMistral(true);
      return { role: "ai", text: server.data.text };
    }
    if (!server.ok && server.error === "rate-limited") {
      setUsedMistral(false);
      return { role: "ai", text: `⏳ ${server.message}` };
    }

    // 2) Personal key from Settings (works even where the site AI isn't set up).
    if (key) {
      const text = await askMistral({ key, ...payload });
      if (text) {
        setUsedMistral(true);
        return { role: "ai", text };
      }
    }

    // 3) Built-in offline engine.
    setUsedMistral(false);
    const r = localReply(mode.id, userText, state.profile, state.settings.hintsFirst);
    pendingRef.current = { hint: r.hint, solution: r.solution };
    return r.msg;
  }

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || typing) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", text: value };
    const history = [...messages, userMsg];
    setMessages(history);
    setTyping(true);
    addXp(5, 2);
    remember(`asked about: ${value.slice(0, 50)}`);

    const aiMsg = await getAiResponse(history, value);
    // small delay keeps the typing indicator from flickering on fast local replies
    await new Promise((r) => setTimeout(r, 350));
    setTyping(false);
    const finalMsgs = [...history, aiMsg];
    setMessages(finalMsgs);
    persist(finalMsgs, history.find((m) => m.role === "user")?.text);
  }

  function chooseOffer(kind: "hint" | "solution") {
    const text =
      kind === "hint"
        ? pendingRef.current.hint ?? "💡 Hint: break the problem into given → required → connecting formula."
        : pendingRef.current.solution ?? "Here's the complete reasoning, step by step.";
    const cleared = messages.map((m) => ({ ...m, offer: false }));
    setMessages(cleared);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const finalMsgs: ChatMsg[] = [...cleared, { role: "ai", text }];
      setMessages(finalMsgs);
      persist(finalMsgs);
      if (kind === "hint") addXp(10, 1); // learning the hard way pays more
    }, 600);
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-7.5rem)]">
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        {aiModes.map((m) => (
          <button
            key={m.id}
            onClick={() => switchMode(m)}
            title={m.desc}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
              mode.id === m.id
                ? "border-accent/60 bg-accent/20 text-white shadow-[0_0_18px_-4px_rgba(139,92,246,0.6)]"
                : "border-edge bg-card text-sub hover:text-white hover:border-edge2"
            }`}
          >
            <span>{m.emoji}</span>
            {m.name}
          </button>
        ))}
      </div>

      <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-edge px-5 py-3 text-xs text-faint">
          <span className="size-2 rounded-full bg-mint animate-pulse-glow" />
          {mode.name} · {state.profile?.grade} {state.profile?.board}
          <span className="ml-auto flex items-center gap-2">
            {usedMistral === true && (
              <span className="rounded-full border border-mint/40 bg-mint/10 px-2 py-0.5 text-[10px] text-mint">Studentify AI</span>
            )}
            {usedMistral === false && (
              <span className="rounded-full border border-edge px-2 py-0.5 text-[10px]">Local engine</span>
            )}
            <span className="hidden sm:inline">Memory: {state.settings.memoryOn ? "on" : "off"}</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`animate-fade-up ${m.role === "user" ? "flex justify-end" : ""}`}>
              <div
                className={`max-w-[88%] sm:max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-primary/25 border border-primary/35"
                    : "rounded-bl-md bg-card2 border border-edge"
                }`}
              >
                {m.text}
                {m.offer && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => chooseOffer("hint")}
                      className="rounded-full bg-accent/20 border border-accent/50 px-4 py-1.5 text-xs font-medium text-accent2 hover:bg-accent/30 transition-colors"
                    >
                      💡 Give me a hint (+10 XP)
                    </button>
                    <button
                      onClick={() => chooseOffer("solution")}
                      className="rounded-full bg-white/5 border border-edge px-4 py-1.5 text-xs font-medium text-sub hover:text-white hover:border-edge2 transition-colors"
                    >
                      Show complete solution
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="animate-fade-in">
              <div className="w-fit rounded-2xl rounded-bl-md bg-card2 border border-edge px-4 py-3 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-sub animate-pulse-glow"
                    style={{ animationDelay: `${i * 200}ms`, animationDuration: "1s" }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-edge p-3 sm:p-4">
          <div className="flex gap-2 mb-2.5 overflow-x-auto">
            {["Solve: x² − 5x + 6 = 0", "What is 23 × 47?", "Give me a challenge question"].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="shrink-0 rounded-full border border-edge bg-card2 px-3.5 py-1.5 text-[11px] text-sub hover:text-white hover:border-accent/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Ask in ${mode.name}…`}
              className="flex-1 resize-none rounded-xl border border-edge bg-ink/60 px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
            />
            <button type="submit" aria-label="Send" className="btn-glow size-11 shrink-0 grid place-items-center rounded-xl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 14-7-4 14-3.5-5.5L5 12Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-faint">
            {usedMistral === false && !key
              ? "Built-in engine active (solves equations & arithmetic offline). Full AI answers arrive when the site AI is enabled."
              : "Answers adapt to your class, mode and memory. Hints come before solutions."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tutor() {
  return (
    <Suspense>
      <TutorInner />
    </Suspense>
  );
}
