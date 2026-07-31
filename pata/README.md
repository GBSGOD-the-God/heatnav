# पता · PATA

> Forty children nod when the teacher asks if they understood. In twenty seconds
> she can find out which of them meant it — and what the rest got wrong.

A single-page, offline-first PWA. One phone — the teacher's own. No student
devices in class, no cameras pointed at children, no biometrics, no backend,
no accounts.

## Run it

```bash
npm install
npm run dev        # develop
npm run build      # production build → dist/ (~29 KB gzipped)
npm run preview    # serve dist/ locally
```

Serve `dist/` from any static server (or a laptop, for the recorded demo).
After one load, the service worker makes every classroom function work with
the network permanently off — including a cold reload.

## The loop

1. **Prep** (`#/prep`) — she types or speaks tomorrow's topic; the app drafts
   teaching material and **3 diagnostic check questions**. Every distractor
   encodes one *named* misconception (see `src/bank.ts`). Questions are
   editable; options are shuffled so the right answer isn't always in the
   same slot.
2. **Check** (`#/check`) — the question big enough to read across a room,
   the seating grid below. Children answer A/B/C/D by hand; she taps the
   smaller group, confirms, and optionally taps which wrong answer dominated.
   **A visible timer measures her effort** — the target is under 60 seconds.
3. **Result** (`#/result`) — "33 understood, 5 didn't", the 5 named, the
   dominant misconception in plain words (never the letter), and three
   one-tap actions: **pair / send home / reteach**. Whichever she picks is
   logged (spec §9) and surfaces in Insight.
4. **Home** (`#/home`) — the student side, on the family phone, voluntary.
   A photographed page → explanation in the chosen language, audio *and*
   text — then "explain it back", judged tolerantly against the page's key
   concepts, with a tap fallback on every voice moment.
5. **Report** (`#/report`) — she speaks her daily numbers; the form drafts
   itself; **she reviews and submits — never auto-submitted**. Counts only.
6. **Insight** (`#/insight`) — topics ranked by confusion rate, class →
   school → district. **Content only, never people**: grep this codebase —
   there is no teacher-identifying field in anything that aggregates.

Roster setup: `☷` in the header — one name per line, 38 names in about three
minutes.

## Honesty notes (kept on screen, not just here)

- The class is **labelled sample data** everywhere (badge in the header).
- Where speech recognition is unavailable and a sample sentence is used
  instead, the screen **says so in small type**.
- Page recognition (OCR) is pre-prepared for the demo's sample pages, and
  the screen says so.
- Diagnostic questioning with misconception-mapped distractors is an
  established formative-assessment technique (Dylan Wiliam and others);
  PATA operationalises it, it did not invent it.

## Constraints this build respects

No student device in class (C1) · no new hardware (C2) · core loop works with
zero peer cooperation (C3) · always per-child, never a class average (C4) ·
under 60 seconds per check, measured (C5) · no teacher-identifying data
anywhere in aggregation (C6) · 12 languages listed, hi/en complete in demo
(C7) · aggregate-before-it-leaves-the-building data model, no cloud (C8) ·
no biometrics, no cameras on children (C9).

Stack: Vanilla TypeScript + Vite, `idb` (IndexedDB — no localStorage),
Web Speech API with tap fallbacks, hand-rolled service worker with fixed
asset names for deterministic precaching.
