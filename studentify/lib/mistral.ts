import type { ChatMsg, Profile } from "@/lib/store";

/** Direct browser → Mistral call (static hosting has no server to proxy through).
 *  The key is the user's own, stored locally, and goes only to api.mistral.ai. */

const MODE_PROMPTS: Record<string, string> = {
  homework:
    "Homework Mode: guide, don't solve. Offer a hint first; give the full solution only when asked, always step by step.",
  exam: "Exam Mode: concise, marks-oriented answers with definitions, formulas and the exact points an examiner awards marks for.",
  doubt: "Quick Doubt: answer fast and directly, then one line of intuition.",
  teach:
    "Teach Me: build the concept from zero with an everyday analogy, then the formal idea, one worked example, and finish by asking the student to explain it back.",
  revision:
    "Revision: rapid recap — core idea in one sentence, the key formulas, the classic trap — then ask a recall question.",
  challenge:
    "Challenge Me: pose or answer questions one level above the student's grade. Be encouraging but do not dumb it down.",
};

export async function askMistral(opts: {
  key: string;
  messages: ChatMsg[];
  mode: string;
  profile: Profile | null;
  memory: string[];
  length: string;
}): Promise<string | null> {
  const { key, messages, mode, profile, memory, length } = opts;
  const lengthRule =
    length === "short"
      ? "Keep answers under 120 words."
      : length === "detailed"
      ? "Be thorough — full derivations and extra examples are welcome."
      : "Keep answers focused; expand only where it aids understanding.";

  const system = [
    "You are Studentify, a warm, encouraging AI tutor for school students. Learning comes before answers: prefer guiding over telling. Use simple language, concrete examples and analogies. Use light structure (numbered steps, short paragraphs). Never be condescending.",
    profile?.grade
      ? `Student: ${profile.name}, ${profile.grade}, ${profile.board}. Adapt depth and vocabulary to this level. Subjects: ${profile.subjects.join(", ")}.`
      : "",
    MODE_PROMPTS[mode] ?? MODE_PROMPTS.homework,
    memory.length ? `What you remember about this student: ${memory.join("; ")}.` : "",
    lengthRule,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.6,
        max_tokens: length === "detailed" ? 1400 : 700,
        messages: [
          { role: "system", content: system },
          ...messages.slice(-16).map((m) => ({
            role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
            content: m.text,
          })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
