# Studentify AI

> **Learn Smarter. Not Harder.**

Studentify is an AI-powered learning platform for school students (ages ~11–18) — a
personal tutor available 24/7, built around **understanding before answers**. Instead of
juggling five apps, students get one place to ask doubts, upload notes, generate
flashcards and quizzes, plan revision and track progress.

## Running locally

```bash
cd studentify
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all routes prerender statically)
```

## What's implemented

| Route | Feature |
| --- | --- |
| `/` | Landing page — hero with animated background, live product mock, features, AI-modes showcase, dashboard preview, testimonials, pricing, FAQ, CTA, footer |
| `/signup`, `/login`, `/forgot-password` | Auth UI (Google + email/password, reset flow) |
| `/onboarding` | 3-step profile setup — class, board, subjects |
| `/dashboard` | Greeting, streak, weekly activity chart, upcoming tasks, continue-learning, quick AI chat |
| `/tutor` | AI Tutor chat with **six modes** (Homework, Exam, Quick Doubt, Teach Me, Revision, Challenge Me), typing indicator, and the signature *"hint first, solution second"* flow |
| `/notes` | Folders, tags, search, markdown editing with live preview, auto-save indicator, AI actions (summarise / flashcards / quiz) |
| `/flashcards` | Decks, daily-goal progress ring, 3D flip study view, Hard/Good/Easy spaced-repetition ratings, XP rewards |
| `/quiz` | Quiz generator (source + difficulty), per-question 45s timer, instant scoring, AI explanation after every question, animated results ring |
| `/planner` | Weekly schedule built from exam dates & study hours, block types, missed-task recovery |
| `/progress` | Study-hours line chart, quiz accuracy by subject, weak areas, level ring, streaks, achievement badges |
| `/settings` | Theme, language, AI response length, AI memory (view/reset), notifications, export data, delete account |

Design system: dark-first, near-black background, deep blue → purple gradients,
glassmorphism panels, rounded corners, scroll-reveal and 60fps CSS animations,
`prefers-reduced-motion` support, fully responsive (desktop sidebar → mobile bottom nav).

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom `@theme` design-token system (no other runtime deps —
  charts are hand-rolled SVG, animations are pure CSS)
- Deploys anywhere Next.js runs; **Vercel** is the intended target

## Wiring up the backend (next steps)

The UI is complete and runs on realistic demo data from `lib/data.ts`. To make it live,
per the product spec:

1. **Supabase** — Auth (Google + email/password with verification), Postgres for
   profiles, notes, decks, quiz history and planner tasks, Storage for PDF uploads.
   Swap the demo data module for Supabase queries in server components.
2. **Mistral API** — back the `/tutor` chat (`aiReply()` in `app/(app)/tutor/page.tsx`
   is the single seam to replace with a streaming route handler), plus PDF
   summarisation, flashcard and quiz generation.
3. **AI memory** — persist learning style / weak areas per user and inject into the
   system prompt; the Settings page already exposes view/reset controls.
