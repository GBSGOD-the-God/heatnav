// Practice questions, built rather than stored.
//
// The obvious way to do this is a bank of quiz questions per topic per
// difficulty per language. Five topics × five levels × twelve languages is
// thousands of strings that no one will ever maintain, and it still runs out
// after a child has done it twice.
//
// So the maths topics GENERATE their questions. Two things fall out of that
// which a stored bank could not give:
//
//   1. The wrong answers are COMPUTED BY APPLYING THE MISCONCEPTION (§4). The
//      distractor for "subtracted smaller from larger digit-wise" is what you
//      actually get when you do that to these particular numbers — not a
//      plausible-looking number someone typed. So when a child picks it, we
//      know exactly which error they made, and can tell the teacher.
//   2. Difficulty is a parameter, so the quiz can adapt, and it never repeats.
//
// And they need almost no translation: "42 − 17 = ?" reads the same in every
// script. Only a handful of question stems are words at all.
//
// For the topics that are not procedural — photosynthesis, English tenses —
// questions come from material that is ALREADY in twelve languages: the
// concept packs' true/false ideas, and the bank's own questions.
import { BANK } from './bank';
import { CONTENT } from './content-i18n';
import { translate } from './i18n';
import { CONCEPTS } from './packs';
import type { Bi, Lang } from './types';

export const QUIZ_LENGTH = 5;
export const MAX_LEVEL = 5;

export interface QuizOption {
  text: string;
  correct: boolean;
  /** Named misconception this wrong answer encodes, if it encodes one. */
  misconception: Bi | null;
}

export interface QuizQuestion {
  stem: string;
  options: QuizOption[];
  level: number;
}

/** Deterministic per quiz, so a child who reloads gets the same question back
 *  rather than a fresh one they can shop around for. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0x100000000;
  };
}
const pick = <T>(arr: T[], rnd: () => number): T => arr[Math.floor(rnd() * arr.length)];
const int = (lo: number, hi: number, rnd: () => number) => lo + Math.floor(rnd() * (hi - lo + 1));

/** A phrase we already hold in twelve languages, keyed by its English. */
function known(en: string, lang: Lang): string {
  return CONTENT[en]?.[lang] ?? en;
}
/** A misconception as a Bi, so the result record can name it in any language. */
function mis(en: string, hi: string): Bi {
  return { en, hi, ...CONTENT[en] };
}

// ------------------------------------------------------------ subtraction
//
// Every distractor here is the answer you get by actually making that mistake.

function digitsOf(n: number): number[] {
  return String(n).split('').map(Number);
}

/** Column-wise |top − bottom|: the child who "takes the smaller from the
 *  bigger" in each column regardless of which is on top. */
function digitwise(a: number, b: number): number {
  const A = digitsOf(a);
  const B = digitsOf(b);
  while (B.length < A.length) B.unshift(0);
  return Number(A.map((d, i) => Math.abs(d - B[i])).join(''));
}

/** Borrowed to make the subtraction possible, but never decremented the
 *  column lent from — the single most common borrowing error. */
function borrowedNoDecrement(a: number, b: number): number {
  const A = digitsOf(a);
  const B = digitsOf(b);
  while (B.length < A.length) B.unshift(0);
  return Number(A.map((d, i) => (d < B[i] ? d + 10 - B[i] : d - B[i])).join(''));
}

/** True when working right-to-left actually forces a borrow somewhere. The
 *  topic is subtraction WITH borrowing, so a question that does not need one
 *  is not practice for it — and the misconception distractors collapse onto
 *  the right answer, which is worse than useless. */
function needsBorrow(a: number, b: number): boolean {
  const A = digitsOf(a).reverse();
  const B = digitsOf(b).reverse();
  for (let i = 0; i < A.length; i++) if (A[i] < (B[i] ?? 0)) return true;
  return false;
}

function subtraction(level: number, rnd: () => number): QuizQuestion | null {
  let a: number;
  let b: number;
  if (level <= 1) {
    // Two digits minus one. The ones digit of a is capped at 8 so there is
    // always a larger single digit available to subtract from it.
    a = int(2, 9, rnd) * 10 + int(1, 8, rnd);
    b = int((a % 10) + 1, 9, rnd);
  } else if (level === 2) {
    a = int(3, 9, rnd) * 10 + int(1, 8, rnd);
    b = int(1, Math.floor(a / 10) - 2, rnd) * 10 + int((a % 10) + 1, 9, rnd);
  } else if (level === 3) {
    a = int(3, 9, rnd) * 10; // zero in the ones place
    b = int(1, Math.floor(a / 10) - 1, rnd) * 10 + int(1, 9, rnd);
  } else if (level === 4) {
    a = int(2, 9, rnd) * 100 + int(0, 9, rnd) * 10 + int(1, 8, rnd);
    b = int(1, Math.floor(a / 100) - 1, rnd) * 100 + int(0, 9, rnd) * 10 + int((a % 10) + 1, 9, rnd);
  } else {
    // Zero in the middle: borrowing across it, the hardest case there is.
    a = int(3, 9, rnd) * 100 + int(1, 8, rnd);
    b = int(1, Math.floor(a / 100) - 1, rnd) * 100 + int(1, 9, rnd) * 10 + int((a % 10) + 1, 9, rnd);
  }
  if (b >= a || b < 1 || !needsBorrow(a, b)) return null;

  const answer = a - b;
  // More candidates than slots. Applying two different misconceptions to the
  // same pair of numbers sometimes lands on the same value (33 − 5 gives 38
  // both by adding and by failing to decrement), and dropping the duplicate
  // would leave a three-option question. The extras are real errors too, not
  // padding: they are what a child who over- or under-applies the borrow gets.
  const wrong: Array<[number, Bi]> = [
    [digitwise(a, b), mis('subtracted smaller from larger digit-wise', 'हर जगह बड़े अंक में से छोटा घटाया')],
    [borrowedNoDecrement(a, b), mis('borrowed but did not decrement the tens', 'हासिल लिया पर दहाई घटाना भूले')],
    [a + b, mis('added instead of subtracted', 'घटाने की जगह जोड़ दिया')],
    [answer + 10, mis('counted the borrowed ten twice', 'हासिल का दस दो बार गिन लिया')],
    [answer - 10, mis('took the borrowed ten away as well', 'हासिल का दस घटा भी दिया')],
  ];
  return assemble(`${a} − ${b} = ?`, String(answer), wrong.map(([v, m]) => [String(v), m]), level);
}

// ------------------------------------------------------------ place value

function placeValue(level: number, lang: Lang, rnd: () => number): QuizQuestion | null {
  const width = Math.min(3 + Math.floor((level - 1) / 2), 5); // 3..5 digits
  const digits: number[] = [int(1, 9, rnd)];
  for (let i = 1; i < width; i++) digits.push(level >= 3 && rnd() < 0.35 ? 0 : int(0, 9, rnd));
  // Never the ones column: there the place value IS the face value, so the
  // question has no answer that distinguishes the two and the whole point of
  // the topic disappears.
  const at = int(0, width - 2, rnd);
  if (digits[at] === 0) digits[at] = int(1, 9, rnd);

  const n = Number(digits.join(''));
  const d = digits[at];
  const power = width - 1 - at;
  const answer = d * 10 ** power;

  // The face value and "one place down" coincide when the digit is already in
  // the ones column, so there are spare candidates to fall back on: reading
  // the column next door, which is the other thing children actually do. The
  // neighbour has to differ from the digit itself or it is not a distractor.
  const neighbour =
    [digits[at + 1], digits[at - 1], ...digits].find((x) => x != null && x !== d && x !== 0) ?? (d % 9) + 1;
  const wrong: Array<[string, Bi]> = [
    [String(d), mis('reads the digit’s face value, not its place value', 'अंक की दर्शनी कीमत पढ़ी, स्थानीय मान नहीं')],
    [String(d * 10 ** Math.max(0, power - 1)), mis('shifted one place down', 'एक स्थान नीचे खिसका दिया')],
    [String(d * 10 ** (power + 1)), mis('shifted one place up', 'एक स्थान ऊपर खिसका दिया')],
    [String(neighbour * 10 ** power), mis('read the digit in the next column', 'बगल वाले खाने का अंक पढ़ लिया')],
    [String(neighbour * 10 ** Math.max(0, power - 1)), mis('read the next column and its place too', 'बगल वाला खाना और उसका मान दोनों पढ़ लिए')],
  ];
  const stem = known('In 507, what is the value of the 5?', lang)
    .replace('507', String(n))
    .replace(/\b5\b(?![0-9])/, String(d));
  return assemble(stem, String(answer), wrong, level);
}

// ------------------------------------------------------------ fractions

function fractions(level: number, lang: Lang, rnd: () => number): QuizQuestion | null {
  if (level <= 2) {
    // Unit fractions: the bigger bottom number is the SMALLER piece.
    const a = int(2, 5, rnd);
    const b = int(a + 1, a + 5, rnd);
    const stem = known('Which is bigger — 1/3 or 1/5?', lang)
      .replace('1/3', `1/${a}`)
      .replace('1/5', `1/${b}`);
    return assemble(stem, `1/${a}`, [
      [`1/${b}`, mis('thinks a bigger denominator means a bigger fraction', 'नीचे की संख्या बड़ी तो भिन्न बड़ा — यह उल्टा समझा')],
      [known('Both equal', lang), mis('judges only by the equal numerators', 'सिर्फ ऊपर की बराबर संख्या से तय किया')],
      [known('Cannot compare', lang), mis('believes unlike denominators cannot be compared', 'मानता है कि अलग हर वाली भिन्नों की तुलना नहीं हो सकती')],
    ], level);
  }
  if (level === 3) {
    // Equivalence: 2/4 and 1/2 are the same amount of roti.
    const k = int(2, 4, rnd);
    const stem = known('Which is bigger — 2/4 or 1/2?', lang)
      .replace('2/4', `${k}/${k * 2}`)
      .replace('1/2', '1/2');
    return assemble(stem, known('They are equal', lang), [
      [`${k}/${k * 2}`, mis('judges by the bigger numerator alone', 'सिर्फ बड़े अंश से तय किया')],
      ['1/2', mis('half-remembered rule: smaller denominator always bigger', 'आधा-याद नियम: छोटा हर हमेशा बड़ा')],
      [known('Cannot say', lang), mis('does not recognise equivalent fractions', 'बराबर भिन्नों को पहचान नहीं पाया')],
    ], level);
  }
  // Adding like fractions: the denominator does NOT add.
  const c = int(5, 12, rnd);
  const a = int(1, c - 2, rnd);
  const b = int(1, c - a - 1, rnd);
  return assemble(`${a}/${c} + ${b}/${c} = ?`, `${a + b}/${c}`, [
    [`${a + b}/${c * 2}`, mis('added the denominators as well', 'नीचे की संख्याएँ भी जोड़ दीं')],
    [`${a * b}/${c}`, mis('mixed up the addition and multiplication rules', 'जोड़ और गुणा के नियम गड्डमड्ड किए')],
    [`${c}/${a + b}`, mis('flipped numerator and denominator', 'ऊपर और नीचे की संख्या उलट दी')],
  ], level);
}

// --------------------------------------------- topics that are not procedural

/**
 * Built from the concept packs' true/false ideas, which already exist in all
 * twelve languages and already carry one planted misconception each.
 */
function fromConcept(topicKey: string, level: number, lang: Lang, rnd: () => number): QuizQuestion | null {
  const concept = CONCEPTS.find((c) => c.key === topicKey);
  if (!concept) return null;
  const right = concept.ideas.filter((i) => !i.wrong);
  const wrong = concept.ideas.filter((i) => i.wrong);
  if (!right.length || !wrong.length) return null;

  const answer = pick(right, rnd);
  const others = [...wrong, ...right.filter((i) => i !== answer)].slice(0, 3);
  return assemble(
    WHICH_TRUE[lang] ?? WHICH_TRUE.en,
    answer.label[lang] ?? answer.label.en,
    // The idea's own label IS the misconception when the idea is the wrong
    // one, so it is carried through in every language the pack has.
    others.map((o) => [o.label[lang] ?? o.label.en, o.label as Bi] as [string, Bi]),
    level
  );
}

/** The topic's own diagnostic questions — already twelve languages, already
 *  carrying named misconceptions. The last resort, and a good one. */
function fromBank(topicKey: string, level: number, lang: Lang, rnd: () => number): QuizQuestion | null {
  const topic = BANK.find((b) => b.key === topicKey);
  if (!topic?.questions.length) return null;
  const q = topic.questions[Math.min(topic.questions.length - 1, Math.floor((level - 1) / 2))]
    ?? pick(topic.questions, rnd);
  const keys = ['A', 'B', 'C', 'D'] as const;
  const right = keys.find((k) => q.options[k].correct);
  if (!right) return null;
  return assemble(
    translate(q.text, lang),
    translate(q.options[right].text, lang),
    keys.filter((k) => k !== right).map((k) => [
      translate(q.options[k].text, lang),
      (q.options[k].mis ?? null) as Bi,
    ] as [string, Bi]),
    level
  );
}

const WHICH_TRUE: Record<Lang, string> = {
  hi: 'इनमें से कौन-सा सही है?', en: 'Which of these is true?', mr: 'यांपैकी कोणते बरोबर आहे?',
  bn: 'এর মধ্যে কোনটি সঠিক?', ta: 'இவற்றில் எது சரி?', te: 'వీటిలో ఏది సరైనది?',
  kn: 'ಇವುಗಳಲ್ಲಿ ಯಾವುದು ಸರಿ?', ml: 'ഇവയിൽ ഏതാണ് ശരി?', gu: 'આમાંથી કયું સાચું છે?',
  or: 'ଏଥିମଧ୍ୟରୁ କେଉଁଟି ଠିକ୍?', pa: 'ਇਹਨਾਂ ਵਿੱਚੋਂ ਕਿਹੜਾ ਸਹੀ ਹੈ?', as: 'ইয়াৰ ভিতৰত কোনটো শুদ্ধ?',
};

// ------------------------------------------------------------ assembly

/** Drop distractors that collide with the answer or each other — applying two
 *  different misconceptions to the same numbers sometimes lands on the same
 *  value, and two identical options make the question unanswerable. */
function assemble(
  stem: string,
  answer: string,
  wrong: Array<[string, Bi]>,
  level: number
): QuizQuestion | null {
  const seen = new Set([answer]);
  const options: QuizOption[] = [{ text: answer, correct: true, misconception: null }];
  for (const [text, misconception] of wrong) {
    if (options.length >= 4) break;
    if (!text || text === '0' || text.startsWith('-') || seen.has(text)) continue;
    seen.add(text);
    options.push({ text, correct: false, misconception });
  }
  if (options.length < 3) return null; // not enough to be a fair question
  return { stem, options, level };
}

/** Shuffle so the answer is not always first. Deterministic per question. */
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * One question on this topic at this difficulty. Tries the procedural
 * generator, then material that is already multilingual, and gives up rather
 * than producing something in the wrong language.
 */
export function makeQuestion(
  topicKey: string,
  level: number,
  lang: Lang,
  rnd: () => number
): QuizQuestion | null {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  let q: QuizQuestion | null = null;
  for (let attempt = 0; attempt < 6 && !q; attempt++) {
    if (topicKey === 'sub-borrow') q = subtraction(lv, rnd);
    else if (topicKey === 'place-value') q = placeValue(lv, lang, rnd);
    else if (topicKey === 'fractions') q = fractions(lv, lang, rnd);
    else q = fromConcept(topicKey, lv, lang, rnd) ?? fromBank(topicKey, lv, lang, rnd);
  }
  if (!q) q = fromBank(topicKey, lv, lang, rnd);
  return q ? { ...q, options: shuffle(q.options, rnd) } : null;
}

/**
 * The adaptive rule, kept deliberately simple so a child can feel it working:
 * get it right and the next one is harder, get it wrong and the next one is
 * easier. Starting at 2 rather than 1 means a child who does know it is not
 * made to sit through five trivial questions.
 */
export function nextLevel(level: number, correct: boolean): number {
  return Math.max(1, Math.min(MAX_LEVEL, level + (correct ? 1 : -1)));
}

export const START_LEVEL = 2;
