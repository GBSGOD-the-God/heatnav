import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

export async function POST(req: NextRequest) {
  let body: {
    messages?: { role: string; text: string }[];
    mode?: string;
    profile?: { name?: string; grade?: string; board?: string; subjects?: string[] };
    memory?: string[];
    length?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const key = process.env.MISTRAL_API_KEY || req.headers.get("x-mistral-key") || "";
  if (!key) {
    return NextResponse.json({ error: "no-key" }, { status: 503 });
  }

  const { messages = [], mode = "homework", profile, memory = [], length = "balanced" } = body;
  const lengthRule =
    length === "short"
      ? "Keep answers under 120 words."
      : length === "detailed"
      ? "Be thorough — full derivations and extra examples are welcome."
      : "Keep answers focused; expand only where it aids understanding.";

  const system = [
    "You are Studentify, a warm, encouraging AI tutor for school students. Learning comes before answers: prefer guiding over telling. Use simple language, concrete examples and analogies. Use light structure (numbered steps, short paragraphs). Never be condescending.",
    profile?.grade
      ? `Student: ${profile.name ?? "a student"}, ${profile.grade}, ${profile.board ?? ""}. Adapt depth and vocabulary to this level. Subjects: ${(profile.subjects ?? []).join(", ")}.`
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
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: "mistral-error", detail: detail.slice(0, 300) },
        { status: 502 }
      );
    }
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}
