/**
 * PATA AI proxy.
 *
 * The whole point of this file: the Mistral key lives HERE, in your Cloudflare
 * account, and never inside the app. An APK is a zip — anything shipped in it
 * can be read with one `unzip`. So the app calls this Worker, and this Worker
 * adds the key.
 *
 * It also has to survive being public. The URL will be visible in the app, so
 * assume strangers will find it: everything below is about making an abused
 * endpoint boring rather than expensive.
 *
 * Deploy:  see server/README.md  (about five minutes, free tier)
 */

// ---------------------------------------------------------------- config

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

// Model IDs are env-overridable because providers rename them. Check the
// current list at https://docs.mistral.ai/getting-started/models/ and set
// TEXT_MODEL / VISION_MODEL in wrangler.toml if these have moved on.
const DEFAULT_TEXT_MODEL = 'mistral-small-latest';
const DEFAULT_VISION_MODEL = 'pixtral-12b-2409';

// Abuse limits. Generous for a school, ruinous for a scraper.
const LIMITS = {
  perDeviceHour: 60,      // requests per device per hour
  perIpHour: 300,         // requests per IP per hour (a school shares one IP)
  maxBodyBytes: 6_000_000, // ~4MB of base64 image plus slack
  upstreamTimeoutMs: 45_000,
};

const CORS = {
  'Access-Control-Allow-Origin': '*', // the app has no origin inside a WebView
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pata-Device',
  'Access-Control-Max-Age': '86400',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Never cache. A stale /health showing the old ai:false after you have
      // just fixed the key sends you debugging a problem you already solved.
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...CORS,
    },
  });

// ---------------------------------------------------------------- rate limit

/**
 * Counter kept in the Cloudflare Cache API rather than KV: cache writes are
 * unmetered on the free tier, whereas KV allows only ~1k writes/day, which a
 * rate limiter would exhaust before lunch.
 *
 * Cache is per-colo, so a determined attacker spread across regions gets a
 * higher effective ceiling. That is an accepted trade for staying free — the
 * limiter exists to stop casual abuse and runaway loops, and the real
 * backstop is the spend cap you set on the Mistral account.
 */
async function bump(key, limit, ctx) {
  const cache = caches.default;
  const window = Math.floor(Date.now() / 3_600_000); // hourly bucket
  const url = `https://pata.invalid/rl/${encodeURIComponent(key)}/${window}`;
  const req = new Request(url);

  let count = 0;
  const hit = await cache.match(req);
  if (hit) count = Number(await hit.text()) || 0;
  if (count >= limit) return false;

  ctx.waitUntil(
    cache.put(
      req,
      new Response(String(count + 1), {
        headers: { 'Cache-Control': 'max-age=3600' },
      })
    )
  );
  return true;
}

// ---------------------------------------------------------------- prompts

const LESSON_SYSTEM = `You prepare lessons for a rural Indian government-school teacher with a multigrade classroom (grades 4-8).
Return ONLY a JSON object, no prose, shaped exactly:
{"topicLabel":{"hi":"","en":""},"subject":{"hi":"","en":""},"gradeBand":"","material":{"hi":["",""],"en":["",""]},
 "questions":[{"text":{"hi":"","en":""},"options":{"A":{"text":{"hi":"","en":""},"correct":true,"mis":null},
 "B":{"text":{"hi":"","en":""},"correct":false,"mis":{"hi":"","en":""}},"C":{...},"D":{...}}}]}
Rules: material is 3-4 short practical paragraphs for the blackboard, centred on the misconceptions children
actually hold. EXACTLY 3 questions. Each question has exactly one correct option. Every wrong option must encode
ONE specific named misconception in "mis" (plain language, what the child did wrong); "mis" is null only on the
correct option. Vary which letter is correct. Every string in BOTH Hindi (Devanagari) and English. Keep question
text short enough to read aloud across a classroom.`;

const pageSystem = (language) => `A schoolchild (age 9-13) photographed a textbook page and needs it explained in ${language}.
Return ONLY a JSON object, no prose, shaped exactly:
{"title":"","bookLine":"","pageLines":["",""],"explanation":"","concepts":[{"label":"","keywords":["",""],"wrong":false}]}
ALL text in ${language}. pageLines = the page's key content as 3-6 short lines. bookLine = subject/class/page if
visible else a short description. explanation = a warm, simple spoken-style explanation, 5-8 sentences, using an
everyday analogy, written to be read aloud. concepts = 2 key ideas the child should be able to say back
(wrong:false, each with 4-8 lowercase keywords a child might use) plus EXACTLY 1 plausible-but-wrong idea
(wrong:true, keywords []). If the image is not a book or notebook page, or contains a person, say so briefly in
explanation and return empty pageLines and concepts.`;

const adviseSystem = (language) => `A schoolchild (age 9-13) got a question wrong in class today. You are speaking directly TO THE CHILD in ${language}, warmly, never scolding.
Return ONLY a JSON object: {"advice":""}
advice = 4-7 short sentences in ${language}: name what went wrong in plain words a child understands, explain the idea correctly using one everyday analogy (rupees, rotis, buckets — things in an Indian village home), then give ONE concrete thing to try right now. Written to be read aloud. No headings, no lists, no jargon.`;

const judgeSystem = (language) => `A child is explaining back a textbook page they just studied.
Return ONLY a JSON object: {"verdict":"good"|"partial"|"missing","feedback":""}
Judge SEMANTICALLY and TOLERANTLY: did the key concepts appear in any words, any mix of languages, however clumsy?
Never penalise grammar or speech-recognition artefacts. "good" = key ideas present; "partial" = a real start but
one key idea missing; "missing" = ideas absent or a misconception stated.
feedback = ONE warm, encouraging sentence to the child in ${language}; if partial, name the missing idea simply.
Never scold.`;

// ---------------------------------------------------------------- upstream

async function askMistral(env, { model, system, user, maxTokens }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.upstreamTimeoutMs);
  try {
    const res = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      // 401 means YOUR key is wrong — never leak that phrasing to the child's
      // screen, but do make it findable in `wrangler tail`.
      console.error('mistral', res.status, detail);
      return { error: res.status === 429 ? 'busy' : 'upstream', status: res.status };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return { error: 'empty' };
    try {
      return { data: JSON.parse(text) };
    } catch {
      return { error: 'badjson' };
    }
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- handlers

async function handleLesson(env, body) {
  const topic = String(body.topic ?? '').slice(0, 300).trim();
  if (!topic) return json({ error: 'notopic' }, 400);
  const out = await askMistral(env, {
    model: env.TEXT_MODEL || DEFAULT_TEXT_MODEL,
    system: LESSON_SYSTEM,
    user: `Topic the teacher typed: "${topic}"`,
    maxTokens: 4000,
  });
  return out.error ? json({ error: out.error }, 502) : json(out.data);
}

async function handlePage(env, body) {
  const image = String(body.image ?? '');
  const language = String(body.language ?? 'Hindi').slice(0, 40);
  if (!image || image.length > LIMITS.maxBodyBytes) return json({ error: 'noimage' }, 400);
  const out = await askMistral(env, {
    model: env.VISION_MODEL || DEFAULT_VISION_MODEL,
    system: pageSystem(language),
    user: [
      { type: 'text', text: `Explain this page in ${language}.` },
      { type: 'image_url', image_url: `data:image/jpeg;base64,${image}` },
    ],
    maxTokens: 3000,
  });
  return out.error ? json({ error: out.error }, 502) : json(out.data);
}

async function handleAdvise(env, body) {
  const topic = String(body.topic ?? '').slice(0, 200);
  const question = String(body.question ?? '').slice(0, 500);
  const misconception = String(body.misconception ?? '').slice(0, 300);
  const language = String(body.language ?? 'Hindi').slice(0, 40);
  if (!topic && !question) return json({ error: 'notopic' }, 400);
  const out = await askMistral(env, {
    model: env.TEXT_MODEL || DEFAULT_TEXT_MODEL,
    system: adviseSystem(language),
    user: `Topic: ${topic}\nQuestion they got wrong: ${question}\nTheir mistake: ${misconception || 'not recorded'}`,
    maxTokens: 900,
  });
  return out.error ? json({ error: out.error }, 502) : json(out.data);
}

async function handleJudge(env, body) {
  const page = String(body.page ?? '').slice(0, 2000);
  const concepts = Array.isArray(body.concepts)
    ? body.concepts.slice(0, 6).map((c) => String(c).slice(0, 300))
    : [];
  const said = String(body.said ?? '').slice(0, 2000);
  const language = String(body.language ?? 'Hindi').slice(0, 40);
  if (!said) return json({ error: 'nothingsaid' }, 400);
  const out = await askMistral(env, {
    model: env.TEXT_MODEL || DEFAULT_TEXT_MODEL,
    system: judgeSystem(language),
    user: `Page: ${page}\nKey concepts expected: ${concepts.join(' | ')}\nChild said (speech-recognised): "${said}"`,
    maxTokens: 500,
  });
  return out.error ? json({ error: out.error }, 502) : json(out.data);
}

// ---------------------------------------------------------------- entry


// ----------------------------------------------------------------- /speak
//
// Android's built-in engine is usually the compact voice that ships with the
// phone: flat, clipped, and genuinely hard to follow over an essay-length
// passage. Sarvam's Bulbul is trained on Indian languages specifically and is
// a different class of thing to listen to.
//
// This is OPTIONAL and separately keyed. If SARVAM_API_KEY is unset the route
// answers 501 and the app reads aloud with the phone's own voice exactly as
// before — nothing breaks, it just sounds worse.
//
// Docs: https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/rest-api.md

/** Our twelve → Sarvam's eleven. Assamese has no Bulbul voice, so it is
 *  absent here and the app keeps using the device voice for it. */
const VOICE_LANGS = {
  hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN',
  ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN',
};

/** The published docs disagree about Odia — the model page says od-IN, the
 *  REST page says or-IN. Try ours, then the other, rather than guessing. */
const LANG_ALIASES = { 'or-IN': 'od-IN' };

const VOICE_MAX_CHARS = 2000; // Sarvam's REST limit is 2500; leave headroom.

async function handleSpeak(env, body) {
  const key = env.SARVAM_API_KEY;
  if (!key) return json({ error: 'novoice' }, 501);

  const text = String(body?.text ?? '').trim().slice(0, VOICE_MAX_CHARS);
  if (!text) return json({ error: 'badrequest' }, 400);

  const code = VOICE_LANGS[String(body?.lang ?? 'hi')];
  if (!code) return json({ error: 'nolang' }, 501);

  // Model and speaker are plain config (wrangler.toml [vars]) so a district
  // can change the voice without touching code. These defaults are the pair
  // shown in Sarvam's own REST example.
  const speaker = env.VOICE_SPEAKER || 'shubh';
  const model = env.VOICE_MODEL || 'bulbul:v3';

  const ask = (language_code) =>
    fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language_code,
        speaker,
        model,
        pace: 0.9, // a shade slow: this is being read to a child following along
        speech_sample_rate: 22050, // enough for speech, a third the bytes of 48k
      }),
    });

  let res = await ask(code);
  if (!res.ok && LANG_ALIASES[code]) res = await ask(LANG_ALIASES[code]);

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return json({ error: 'upstream', status: res.status, detail }, 502);
  }

  const data = await res.json();
  const audio = data?.audios?.[0];
  if (!audio) return json({ error: 'noaudio' }, 502);

  // Base64 WAV, handed straight to the app. Caching is the app's job: it keys
  // on the text so a child replaying their own essay costs nothing.
  return json({ audio, format: 'wav' });
}


// ------------------------------------------------------------ /sync
//
// Carrying quiz results from a child's phone to their teacher's.
//
// On one shared phone this is unnecessary — the results are already in the
// same database. On two phones there is nowhere for them to meet, and this is
// the smallest thing that fixes that: a JSON array per class in KV, pushed to
// and polled from. No accounts, no sessions, no realtime.
//
// What crosses the network is deliberately thin. NO CHILD'S NAME EVER LEAVES
// THE DEVICE (C8): the payload carries the opaque roster id, and the teacher's
// phone — which already holds the register — turns that back into a name
// locally. What travels is a roster id, a topic, a score and a misconception.
//
// The room key is derived from the school name both devices already know, so
// there is nothing for anyone to set up or type. It is a routing key, NOT
// authentication: someone who knows the school name could read scores against
// anonymous ids. For a pilot that is the right trade against making teachers
// manage credentials; a district rollout should put a real shared secret in
// front of it, and the room key is the place to add one.

const SYNC_LIMIT = 300;      // per class, oldest dropped
const SYNC_MAX_ITEMS = 50;   // per push

async function handleSyncPush(env, body) {
  if (!env.PATA_SYNC) return json({ error: 'nosync' }, 501);
  const room = String(body?.room ?? '').slice(0, 64);
  const items = Array.isArray(body?.items) ? body.items.slice(0, SYNC_MAX_ITEMS) : null;
  if (!room || !items) return json({ error: 'badrequest' }, 400);

  const key = `room:${room}`;
  const existing = (await env.PATA_SYNC.get(key, 'json')) ?? [];
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const item of items) {
    if (!item?.id) continue;
    // Strip anything we did not ask for rather than storing what we are sent.
    byId.set(item.id, {
      id: String(item.id).slice(0, 64),
      studentId: String(item.studentId ?? '').slice(0, 64),
      topicKey: String(item.topicKey ?? '').slice(0, 64),
      topicLabel: item.topicLabel ?? null,
      correct: Number(item.correct) || 0,
      total: Number(item.total) || 0,
      peakLevel: Number(item.peakLevel) || 0,
      answers: Array.isArray(item.answers) ? item.answers.slice(0, 10) : [],
      ts: Number(item.ts) || Date.now(),
    });
  }
  const merged = [...byId.values()].sort((a, b) => a.ts - b.ts).slice(-SYNC_LIMIT);
  await env.PATA_SYNC.put(key, JSON.stringify(merged), {
    // A term is long enough. Nothing here needs keeping beyond that.
    expirationTtl: 60 * 60 * 24 * 180,
  });
  return json({ ok: true, stored: merged.length });
}

/**
 * The other direction: the practice the teacher assigned, going out to the
 * children's phones. Without this the sync is one-way and the child's device
 * has nothing to practise — it holds no record of a check that happened on
 * her phone.
 */
async function handleAssignPush(env, body) {
  if (!env.PATA_SYNC) return json({ error: 'nosync' }, 501);
  const room = String(body?.room ?? '').slice(0, 64);
  const items = Array.isArray(body?.items) ? body.items.slice(0, SYNC_MAX_ITEMS) : null;
  if (!room || !items) return json({ error: 'badrequest' }, 400);

  const key = `assign:${room}`;
  const existing = (await env.PATA_SYNC.get(key, 'json')) ?? [];
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const item of items) {
    if (!item?.id) continue;
    byId.set(item.id, {
      id: String(item.id).slice(0, 64),
      checkId: String(item.checkId ?? '').slice(0, 64),
      studentIds: Array.isArray(item.studentIds) ? item.studentIds.slice(0, 200).map(String) : [],
      topicKey: String(item.topicKey ?? '').slice(0, 64),
      topicLabel: item.topicLabel ?? null,
      questionText: item.questionText ?? null,
      misconception: item.misconception ?? null,
      createdAt: Number(item.createdAt) || Date.now(),
    });
  }
  const merged = [...byId.values()].sort((a, b) => a.createdAt - b.createdAt).slice(-SYNC_LIMIT);
  await env.PATA_SYNC.put(key, JSON.stringify(merged), { expirationTtl: 60 * 60 * 24 * 180 });
  return json({ ok: true, stored: merged.length });
}

async function handleAssignPull(env, body) {
  if (!env.PATA_SYNC) return json({ error: 'nosync' }, 501);
  const room = String(body?.room ?? '').slice(0, 64);
  if (!room) return json({ error: 'badrequest' }, 400);
  const since = Number(body?.since) || 0;
  const all = (await env.PATA_SYNC.get(`assign:${room}`, 'json')) ?? [];
  return json({ items: all.filter((r) => r.createdAt > since) });
}

async function handleSyncPull(env, body) {
  if (!env.PATA_SYNC) return json({ error: 'nosync' }, 501);
  const room = String(body?.room ?? '').slice(0, 64);
  if (!room) return json({ error: 'badrequest' }, 400);
  const since = Number(body?.since) || 0;
  const all = (await env.PATA_SYNC.get(`room:${room}`, 'json')) ?? [];
  return json({ items: all.filter((r) => r.ts > since) });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const path = new URL(request.url).pathname.replace(/\/+$/, '');

    // Lets the app decide whether AI is on without spending a token.
    if (path === '/health') {
      const key = env.MISTRAL_API_KEY;
      return json({
        ok: true,
        ai: Boolean(key),
        // Diagnostics for whoever is deploying. NAMES ONLY — no secret value
        // is ever returned, and the key is reported solely as a length.
        // Without this, "ai": false looks identical whether the secret is
        // missing, misspelled, or saved as an empty string.
        worker: 'pata-ai',
        keyLength: typeof key === 'string' ? key.length : 0,
        // A second, entirely optional key. Without it the app reads aloud with
        // the phone's own voice, which still works — it just sounds worse.
        voice: Boolean(env.SARVAM_API_KEY),
        // Carries results between a child's phone and their teacher's.
        sync: Boolean(env.PATA_SYNC),
        bindings: Object.keys(env).sort(),
      });
    }

    // A human who pastes the bare URL into a browser lands here. Answer them
    // in words rather than with {"error":"method"}, which reads like a broken
    // deployment when in fact the Worker is fine.
    if (path === '' && request.method === 'GET') {
      const keySet = Boolean(env.MISTRAL_API_KEY);
      return json({
        service: 'PATA AI proxy',
        status: keySet ? 'ready' : 'no API key set',
        voice: env.SARVAM_API_KEY
          ? 'natural voices on'
          : 'optional: npx wrangler secret put SARVAM_API_KEY for natural Indian-language voices',
        next: keySet
          ? 'Working. Paste this URL into the app: Settings -> Advanced.'
          : 'Run: npx wrangler secret put MISTRAL_API_KEY, then npx wrangler deploy',
        note: 'The app POSTs to /lesson, /page and /judge. Visiting those in a browser is a GET, so they answer 405 — that is correct, not a fault.',
        health: new URL(request.url).origin + '/health',
      });
    }

    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    // /speak uses a different key, so it must not be gated on this one.
    // These use different bindings, so the AI key must not gate them.
    const keyless = ['/speak', '/sync/push', '/sync/pull', '/sync/assign', '/sync/assigned'];
    if (!keyless.includes(path) && !env.MISTRAL_API_KEY) return json({ error: 'unconfigured' }, 503);

    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > LIMITS.maxBodyBytes) return json({ error: 'toobig' }, 413);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    // Device id is app-generated and spoofable; it is here to stop one broken
    // install looping, not to stop an attacker. The IP limit does that.
    const device = (request.headers.get('X-Pata-Device') ?? 'nodevice').slice(0, 64);

    if (!(await bump(`ip:${ip}`, LIMITS.perIpHour, ctx))) return json({ error: 'ratelimit' }, 429);
    if (!(await bump(`dev:${device}`, LIMITS.perDeviceHour, ctx))) return json({ error: 'ratelimit' }, 429);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'badrequest' }, 400);
    }

    switch (path) {
      case '/lesson': return handleLesson(env, body);
      case '/page':   return handlePage(env, body);
      case '/advise': return handleAdvise(env, body);
      case '/judge':  return handleJudge(env, body);
      case '/speak':  return handleSpeak(env, body);
      case '/sync/push': return handleSyncPush(env, body);
      case '/sync/pull': return handleSyncPull(env, body);
      case '/sync/assign': return handleAssignPush(env, body);
      case '/sync/assigned': return handleAssignPull(env, body);
      default:        return json({ error: 'notfound' }, 404);
    }
  },
};
