import type { ChatMsg, Profile } from "@/lib/store";

/** Local tutor engine — real math solving + teaching templates.
 *  Used when no Mistral key is configured, so the app works fully offline. */

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

/** Parse "ax² + bx + c = 0" style input (also accepts x^2). */
function parseQuadratic(input: string): { a: number; b: number; c: number } | null {
  let t = input
    .toLowerCase()
    .replace(/x²/g, "x^2")
    .replace(/\s+/g, "")
    .replace(/−/g, "-");
  const eq = t.match(/(.+)=(.+)/);
  if (eq) {
    if (eq[2] !== "0") return null;
    t = eq[1];
  }
  if (!t.includes("x^2")) return null;
  let a = 0, b = 0, c = 0;
  const terms = t.replace(/-/g, "+-").split("+").filter(Boolean);
  for (const term of terms) {
    if (term.endsWith("x^2")) {
      const coef = term.slice(0, -3);
      a += coef === "" ? 1 : coef === "-" ? -1 : parseFloat(coef);
    } else if (term.endsWith("x")) {
      const coef = term.slice(0, -1);
      b += coef === "" ? 1 : coef === "-" ? -1 : parseFloat(coef);
    } else {
      const v = parseFloat(term);
      if (!Number.isNaN(v)) c += v;
    }
  }
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || a === 0) return null;
  return { a, b, c };
}

export function solveQuadratic(input: string): { hint: string; solution: string } | null {
  const q = parseQuadratic(input);
  if (!q) return null;
  const { a, b, c } = q;
  const D = b * b - 4 * a * c;
  const hint = `💡 Hint: For ${fmt(a)}x² ${b >= 0 ? "+" : "−"} ${fmt(Math.abs(b))}x ${c >= 0 ? "+" : "−"} ${fmt(Math.abs(c))} = 0, start with the discriminant: D = b² − 4ac. Compute it with a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)} — its sign tells you how many real roots to expect. Tell me what you get!`;
  let solution: string;
  if (D > 0) {
    const r1 = (-b + Math.sqrt(D)) / (2 * a);
    const r2 = (-b - Math.sqrt(D)) / (2 * a);
    solution = `Step-by-step solution:\n\n1) Identify a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.\n2) Discriminant: D = b² − 4ac = ${fmt(b * b)} − ${fmt(4 * a * c)} = ${fmt(D)}.\n3) D > 0 → two distinct real roots.\n4) x = (−b ± √D) / 2a = (${fmt(-b)} ± ${fmt(Math.sqrt(D))}) / ${fmt(2 * a)}\n\n✅ Roots: x = ${fmt(r1)} and x = ${fmt(r2)}\n\nQuick check: substitute back — both should give 0. Want 3 similar practice questions?`;
  } else if (D === 0) {
    const r = -b / (2 * a);
    solution = `Step-by-step solution:\n\n1) a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.\n2) D = b² − 4ac = ${fmt(D)}.\n3) D = 0 → one repeated real root.\n4) x = −b / 2a\n\n✅ Root: x = ${fmt(r)} (repeated)`;
  } else {
    solution = `Step-by-step solution:\n\n1) a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.\n2) D = b² − 4ac = ${fmt(D)}.\n3) D < 0 → no real roots (the parabola never crosses the x-axis).\n\n✅ Answer: no real solutions. At your level that's the complete answer — complex roots come later!`;
  }
  return { hint, solution };
}

/** Safe arithmetic evaluator for "what is 23*47" type questions. */
export function solveArithmetic(input: string): string | null {
  const m = input.replace(/×/g, "*").replace(/÷/g, "/").match(/(-?\d+(?:\.\d+)?(?:\s*[+\-*/^]\s*-?\d+(?:\.\d+)?)+)/);
  if (!m) return null;
  const expr = m[1].replace(/\^/g, "**").replace(/\s+/g, "");
  if (!/^[-\d+*/.()% ]+$|\*\*/.test(expr.replace(/\*\*/g, ""))) return null;
  if (!/^[\d+\-*/.()\s*]+$/.test(expr)) return null;
  try {
    const val = Function(`"use strict"; return (${expr});`)();
    if (typeof val !== "number" || !Number.isFinite(val)) return null;
    return `${m[1].trim()} = ${fmt(val)}\n\nWant me to show the working, or give you a trick to do this mentally?`;
  } catch {
    return null;
  }
}

const HINT_FALLBACK =
  "💡 Hint: break the problem into what you're given and what you need. Write both down, then ask: which formula or idea connects them? Try that first step and tell me what you get — we'll finish it together.";

export function localReply(
  modeId: string,
  userText: string,
  profile: Profile | null,
  hintsFirst: boolean
): { msg: ChatMsg; hint?: string; solution?: string } {
  const grade = profile?.grade ?? "your class";
  const quad = solveQuadratic(userText);
  if (quad) {
    if (hintsFirst && modeId !== "doubt" && modeId !== "exam") {
      return {
        msg: {
          role: "ai",
          text: "Good one — this is a quadratic, and it's very solvable with what you know. Before I hand over the answer:",
          offer: true,
        },
        hint: quad.hint,
        solution: quad.solution,
      };
    }
    return { msg: { role: "ai", text: quad.solution } };
  }

  const arith = solveArithmetic(userText);
  if (arith) return { msg: { role: "ai", text: arith } };

  const t = userText.trim().replace(/\s+/g, " ");
  switch (modeId) {
    case "exam":
      return {
        msg: {
          role: "ai",
          text: `Exam-style answer plan for “${t}” (${grade}):\n\n1. One-line definition — precise wording earns the first mark.\n2. Key formula or law, with every symbol defined.\n3. A labelled example, diagram or worked case.\n4. Units / conditions — the detail examiners cut marks for.\n\nWrite your answer using that skeleton and paste it here — I'll mark it like an examiner would.`,
        },
      };
    case "revision":
      return {
        msg: {
          role: "ai",
          text: `Rapid revision — “${t}”:\n\n① Core idea: say it in ONE sentence (if you can't, that's the gap).\n② The 2–3 formulas or facts everything else hangs on.\n③ The classic trap: the mistake most students make here.\n\nNow the recall check: without looking anything up, tell me ① in your own words. I'll tell you if it's solid.`,
        },
      };
    case "challenge":
      return {
        msg: {
          role: "ai",
          text: `🔥 Challenge accepted. Here's one a level above ${grade}:\n\nQ: A two-digit number is 4 times the sum of its digits and twice the product of its digits. Find the number.\n\nNo rush. Would you like a hint, or will you attempt it first?`,
          offer: hintsFirst,
        },
        hint: "💡 Hint: call the digits t (tens) and u (units), so the number is 10t + u. Turn each sentence into an equation: 10t + u = 4(t + u), and 10t + u = 2tu. Simplify the first one — it gives you a beautiful relation between t and u.",
        solution: "Solution:\n\n1) Let the number be 10t + u.\n2) “4 times the sum of digits”: 10t + u = 4(t + u) → 6t = 3u → u = 2t.\n3) “Twice the product”: 10t + u = 2tu. Substitute u = 2t: 12t = 4t² → t = 3.\n4) So u = 6.\n\n✅ The number is 36. Check: 3+6=9, 4×9=36 ✓ and 3×6=18, 2×18=36 ✓",
      };
    case "teach":
      return {
        msg: {
          role: "ai",
          text: `Let's build “${t}” from zero, ${profile?.name ?? "friend"}. 🧑‍🏫\n\nStep 1 — the hook: imagine explaining this to a younger sibling. What everyday thing does it resemble? (Seriously — take a guess, any analogy.)\n\nStep 2 — I'll give you the precise definition and one worked example.\n\nStep 3 — you teach it back to me. That last step is where it actually sticks.\n\nStart with step 1: what does “${t}” remind you of from daily life?`,
        },
      };
    case "doubt":
      return {
        msg: {
          role: "ai",
          text: `Quick take on “${t}”:\n\nThe fastest way to nail this is to identify what type of problem it is, then apply the standard method for that type. Paste the exact question (or a photo of your working) and I'll pinpoint precisely where it breaks.\n\n⚡ Tip: for full AI answers on any topic, add a free Mistral API key in Settings → AI — the tutor becomes fully unlimited.`,
        },
      };
    default:
      return {
        msg: {
          role: "ai",
          text: `Great question about “${t}”! Let's do it the Studentify way — understanding first.\n\nAt ${grade} level, the key is to connect it to something you already know, then layer the new idea on top. Would you like a hint towards the answer, or a full explanation?`,
          offer: hintsFirst,
        },
        hint: HINT_FALLBACK,
        solution: `Full explanation of “${t}”:\n\nThe local engine can fully solve equations (try “solve 2x² − 3x − 2 = 0”) and arithmetic, and it structures answers for every mode. For complete AI explanations of *any* topic, add a free Mistral API key in Settings → AI — then the tutor answers everything, adapted to ${grade}.`,
      };
  }
}
