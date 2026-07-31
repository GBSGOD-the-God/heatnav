// Real AI (§7): lesson + diagnostic-question generation, photographed-page
// explanation in any of the 12 languages, and tolerant explain-it-back judging.
// Calls the Claude API directly from the phone with the teacher's own API key
// (stored only in IndexedDB on the device — no backend, no accounts).
// Offline or without a key, the app falls back to the on-device bank and says so.
import Anthropic from '@anthropic-ai/sdk';
import { kvGet, kvSet, uid } from './db';
import type { Lesson, Question } from './types';

const MODEL = 'claude-opus-5';

export async function getApiKey(): Promise<string> {
  return (await kvGet<string>('anthropicApiKey')) ?? '';
}
export async function setApiKey(key: string): Promise<void> {
  await kvSet('anthropicApiKey', key.trim());
}
export async function aiAvailable(): Promise<boolean> {
  return navigator.onLine && (await getApiKey()) !== '';
}

async function client(): Promise<Anthropic> {
  const apiKey = await getApiKey();
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

const BI = {
  type: 'object',
  properties: { hi: { type: 'string' }, en: { type: 'string' } },
  required: ['hi', 'en'],
  additionalProperties: false,
} as const;

const OPTION = {
  type: 'object',
  properties: {
    text: BI,
    correct: { type: 'boolean' },
    mis: { anyOf: [BI, { type: 'null' }] },
  },
  required: ['text', 'correct', 'mis'],
  additionalProperties: false,
} as const;

const LESSON_SCHEMA = {
  type: 'object',
  properties: {
    topicLabel: BI,
    subject: BI,
    gradeBand: { type: 'string' },
    material: {
      type: 'object',
      properties: {
        hi: { type: 'array', items: { type: 'string' } },
        en: { type: 'array', items: { type: 'string' } },
      },
      required: ['hi', 'en'],
      additionalProperties: false,
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: BI,
          options: {
            type: 'object',
            properties: { A: OPTION, B: OPTION, C: OPTION, D: OPTION },
            required: ['A', 'B', 'C', 'D'],
            additionalProperties: false,
          },
        },
        required: ['text', 'options'],
        additionalProperties: false,
      },
    },
  },
  required: ['topicLabel', 'subject', 'gradeBand', 'material', 'questions'],
  additionalProperties: false,
} as const;

function firstText(content: Array<{ type: string; text?: string }>): string {
  const block = content.find((b) => b.type === 'text');
  if (!block?.text) throw new Error('empty');
  return block.text;
}

/** §7.1 — generate lesson material + 3 diagnostic questions with a named
 *  misconception behind every distractor (§4). */
export async function aiGenerateLesson(topic: string): Promise<Lesson> {
  const c = await client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { format: { type: 'json_schema', schema: LESSON_SCHEMA }, effort: 'medium' },
    system:
      'You prepare lessons for a rural Indian government-school teacher with a multigrade classroom (grades 4–8). ' +
      'Produce: (1) 3–4 short paragraphs of practical teaching material she can use at the blackboard, centred on the ' +
      'misconceptions children actually hold about the topic; (2) EXACTLY 3 diagnostic multiple-choice check questions. ' +
      'CRITICAL: each question has exactly one correct option; every wrong option must encode ONE specific, plainly-named ' +
      'misconception (set "mis" to a short plain-language description of the child\'s error; set "mis" to null on the correct ' +
      'option and "correct" true only there). Distribute the correct answer across different letters. ' +
      'Provide every string in BOTH Hindi (Devanagari) and English. Keep question text short enough to read aloud across a classroom.',
    messages: [{ role: 'user', content: `Topic the teacher typed: "${topic}"` }],
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  const parsed = JSON.parse(firstText(response.content as never));
  const questions: Question[] = parsed.questions.slice(0, 3).map((q: Question) => {
    for (const k of ['A', 'B', 'C', 'D'] as const) {
      const o = q.options[k] as Question['options']['A'] & { mis: unknown };
      if (!o.correct && !o.mis) o.mis = { hi: 'गलतफ़हमी', en: 'misconception' };
      if (o.correct) delete (o as { mis?: unknown }).mis;
      if (o.mis === null) delete (o as { mis?: unknown }).mis;
    }
    return q;
  });
  if (questions.length < 3) throw new Error('badoutput');
  return {
    id: uid(),
    topicKey: 'ai-' + topic.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
    topicLabel: parsed.topicLabel,
    subject: parsed.subject,
    gradeBand: parsed.gradeBand,
    material: parsed.material,
    questions,
    source: 'ai',
    createdAt: Date.now(),
  };
}

export interface AiPage {
  title: string;
  bookLine: string;
  pageLines: string[];
  explanation: string;
  concepts: Array<{ label: string; keywords: string[]; wrong: boolean }>;
}

const PAGE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    bookLine: { type: 'string' },
    pageLines: { type: 'array', items: { type: 'string' } },
    explanation: { type: 'string' },
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          wrong: { type: 'boolean' },
        },
        required: ['label', 'keywords', 'wrong'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'bookLine', 'pageLines', 'explanation', 'concepts'],
  additionalProperties: false,
} as const;

/** §7.2 — read a photographed textbook page and explain it simply, in the
 *  student's language, for text + audio together. */
export async function aiExplainPage(
  imageBase64: string,
  mediaType: string,
  languageName: string
): Promise<AiPage> {
  const c = await client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 6000,
    output_config: { format: { type: 'json_schema', schema: PAGE_SCHEMA }, effort: 'medium' },
    system:
      `A schoolchild (age 9–13) photographed a textbook page and needs it explained in ${languageName}. ` +
      `Read the page. Return, ALL in ${languageName}: "pageLines" = the page's key content as 3–6 short lines; ` +
      '"bookLine" = subject/class/page if visible, else a short description; "title" = the topic; ' +
      '"explanation" = a warm, simple spoken-style explanation (5–8 sentences) using an everyday analogy, ' +
      'written to be read aloud by text-to-speech; ' +
      '"concepts" = 2 key ideas the child should be able to say back (wrong=false, with 4–8 lowercase keywords a child might use, ' +
      `in ${languageName} and Latin transliteration) plus exactly 1 plausible-but-wrong idea (wrong=true, empty keywords). ` +
      'If the image is not a book/notebook page, or contains a person, say so briefly in "explanation" and return empty pageLines and concepts.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg',
              data: imageBase64,
            },
          },
          { type: 'text', text: `Explain this page in ${languageName}.` },
        ],
      },
    ],
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  return JSON.parse(firstText(response.content as never));
}

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['good', 'partial', 'missing'] },
    feedback: { type: 'string' },
  },
  required: ['verdict', 'feedback'],
  additionalProperties: false,
} as const;

/** §7.3 — semantic, tolerant explain-it-back judge: did the right concepts
 *  appear? Decoded against the known page as a strong prior. */
export async function aiJudgeExplanation(
  pageSummary: string,
  concepts: string[],
  transcript: string,
  languageName: string
): Promise<{ verdict: 'good' | 'partial' | 'missing'; feedback: string }> {
  const c = await client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 1000,
    output_config: { format: { type: 'json_schema', schema: JUDGE_SCHEMA }, effort: 'low' },
    system:
      'A child is explaining back a textbook page they just studied. Judge SEMANTICALLY and TOLERANTLY: did the key concepts ' +
      'appear in any words, any mix of languages, however clumsy? Never penalise grammar or pronunciation artifacts from speech ' +
      'recognition. verdict: "good" = the key ideas are there; "partial" = a real start but one key idea missing; ' +
      '"missing" = the ideas are not there or a misconception was stated. ' +
      `"feedback" = ONE warm, encouraging sentence to the child in ${languageName}; if partial, name the missing idea simply; ` +
      'never scold.',
    messages: [
      {
        role: 'user',
        content:
          `Page: ${pageSummary}\nKey concepts expected: ${concepts.join(' | ')}\n` +
          `Child said (speech-recognised): "${transcript}"`,
      },
    ],
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  return JSON.parse(firstText(response.content as never));
}

/** Map SDK errors to a short i18n key for the UI. */
export function aiErrorKey(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'aiErrBadKey';
  if (e instanceof Anthropic.RateLimitError) return 'aiErrRate';
  if (e instanceof Anthropic.APIConnectionError) return 'aiErrOffline';
  if (e instanceof Error && e.message === 'refused') return 'aiErrRefused';
  return 'aiErrGeneric';
}
