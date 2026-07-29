# Studentify AI

> **Learn Smarter. Not Harder.**

An AI-powered learning platform for school students (~11–18) — a personal tutor built
around **understanding before answers**. This is a **fully working app**: everything you
do (notes, flashcard reviews, quizzes, planner blocks, tutor chats) is real, persisted,
and feeds your streak, XP, weak areas and progress charts.

## Running locally

```bash
cd studentify
npm install
npm run dev        # http://localhost:3000
```

No configuration needed — it's local-first and works completely offline (cold start:
sign up → onboarding → empty workspace, or load sample content from the dashboard).

### Optional: full AI answers via Mistral

Two ways, either works:

- Paste a key in **Settings → AI → Mistral API key** (stored only in the browser), or
- Set `MISTRAL_API_KEY` as an environment variable on the server/Vercel.

With a key, `/api/tutor` proxies to Mistral (`mistral-small-latest`) with a system
prompt built from the student's grade, board, subjects, AI memory, chosen mode and
response-length setting. Without one, the built-in **local engine** takes over — it
genuinely solves quadratic equations and arithmetic step-by-step, and runs structured
coaching for all six modes.

## What's real

- **Accounts & onboarding** — profile (name, class, board, subjects) stored locally;
  app routes are guarded and redirect to signup when no profile exists.
- **AI Tutor** — six modes (Homework, Exam, Quick Doubt, Teach Me, Revision,
  Challenge Me), hint-before-solution flow (taking the hint earns bonus XP), persisted
  chat sessions, AI memory (viewable/resettable in Settings), Mistral or local engine.
- **Notes** — create/edit/delete with markdown preview, auto-save, folders, tags,
  search, and `.txt`/`.md` import.
- **Flashcards** — create decks by hand or **auto-generate from any note**; SM-2-lite
  spaced repetition (Hard → 1 day, Good → ~2.2×, Easy → ~3.2×) with real due dates;
  daily review goal ring; confetti on completion.
- **Quiz** — generated from a subject-tagged question bank **or from your own
  flashcards** (distractors sampled from other cards); difficulty sets the per-question
  timer (60/45/30s); instant scoring with explanations; every result recorded and
  missed topics tracked as weak areas.
- **Planner** — add exams and daily study hours; the generator builds a 7-day schedule
  that prioritises weak subjects (from your quiz history) and ramps revision as exams
  approach; ticking a block logs study time and XP.
- **Progress** — study-hours chart (4 weeks), per-subject quiz accuracy, weak areas
  with one-click "revise with AI", level ring, streak, achievement badges — all
  computed from the activity log.
- **Gamification** — XP for every learning action, levels (1000 XP each), daily
  streaks, badges with real unlock conditions.
- **Global search (⌘K)** — command palette over pages, notes, decks, chats and quizzes.
- **Settings** — light/dark theme (applies instantly, persisted, no flash on load),
  language, AI response length, hints toggle, memory view/reset, notification prefs,
  **JSON data export**, delete account.

## Design

Dark-first with a full light theme, self-hosted Inter variable font (no external
requests), blue→purple gradient system, glassmorphism, scroll reveals, page
transitions, mouse-follow hero spotlight, animated counters, marquee, confetti — all
pure CSS/SVG at 60fps, `prefers-reduced-motion` respected, responsive from phone to
desktop (sidebar ⇄ bottom nav).

## Stack & architecture

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**
- Zero runtime deps beyond React/Next — charts are hand-rolled SVG
- `lib/store.tsx` — local-first state (React context + `localStorage`), including the
  SRS scheduler, streak/level math, badge conditions and the planner generator
- `lib/engine.ts` — offline tutor engine (equation parser/solver + mode coaching)
- `app/api/tutor/route.ts` — Mistral chat proxy (server env key or per-user key)

## Real backend (PHP + MySQL, e.g. Hostinger web hosting)

`public/api/` contains a self-contained PHP backend that ships inside the same static
upload. It provides real registration (server-side email validation **with a DNS check
that the domain can receive mail**), email verification links, hashed-password login,
Google sign-in (server-verified ID tokens), cross-device data sync, logout and account
deletion. Tables are created automatically on first use.

Setup on the server (one time):

1. Create a MySQL database + user in your hosting panel.
2. In `public_html/api/`, create `config.local.php` (template documented at the top of
   `api/config.php`) with those credentials — this file is never overwritten by
   re-uploads.
3. Optional: add a Google OAuth client ID to `config.local.php` to enable the Google
   button (it stays hidden until configured).

The app remains local-first: with no backend reachable it still works fully on-device,
and a logged-in user's Mistral key is never synced to the server.
