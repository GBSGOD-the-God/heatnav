# HeatNav — Product Blueprint

**Theme:** Smart World – Innovate for the Future
**One-liner:** A personal heat-navigation platform that answers the question no weather app answers: *"Is MY plan safe?"*

This document is the product team's working blueprint: critical analysis, product decisions,
personas, journeys, screen specifications, and the architecture rationale. Everything in the
implementation traces back to a decision recorded here.

---

## 1. Critical analysis — where the original idea is weak

An honest teardown before we write a line of code:

1. **Scope is a startup's 3-year roadmap, not a competition build.** Ten flagship features
   built shallowly lose to four features built beautifully. Judges probe depth: the first
   "this button does nothing" destroys credibility. → We ship a **tiered scope** (§3).

2. **"Community Intelligence" has a cold-start lie built in.** A live demo with zero community
   reports looks dead; fabricating live-looking data violates our own philosophy. → We ship a
   clearly-labelled **demo dataset** (seeded, timestamped, marked "sample data" in the UI) and
   design the report lifecycle honestly: expiry, votes, verification thresholds.

3. **"Coolest route" cannot be computed honestly without shade data we don't have.** Tree-cover
   raster data + segment-level solar exposure is a research project. Pretending Google Maps
   gives us this is exactly the fake-science trap the brief warns against. → Heat Routes ships
   as **route comparison over a pluggable intelligence layer**: real geometry, real weather,
   and shade/water overlays sourced from community reports + curated POI data, with the data
   provenance shown to the user. The architecture documents where satellite/LiDAR shade data
   plugs in later.

4. **Google Maps API + Firebase are demo-day landmines.** Both need keys, billing accounts,
   and network. Judges' venue Wi-Fi is unreliable. A blank grey Google Map tile has killed more
   student demos than any bug. → **flutter_map + OpenStreetMap** (keyless, cacheable) behind a
   provider abstraction so Google Maps can be swapped in; **local-first storage** with a
   repository seam where Firestore sync plugs in. The app must demo end-to-end in airplane mode.

5. **Weather API choice was unspecified — most require keys.** → **Open-Meteo**: free, no key,
   hourly temperature / apparent temperature / humidity / UV / weather codes, plus a separate
   air-quality endpoint (US AQI). Responses are cached so the app degrades to "last known +
   timestamp" offline, never to a spinner.

6. **Risk personalization can slide into pseudo-science.** "Your dehydration risk is 73%" is
   exactly what judges (and the brief) will crucify. → The risk engine (§6) uses only
   published, citable science and expresses personalization as **named, explainable factors**
   that shift a categorical band — never invented percentages.

7. **Notifications, geofencing, FCM** cannot be honestly demonstrated in a judged demo and eat
   days of platform plumbing. → Designed in the architecture (a `NotificationPolicy` domain
   object that decides *whether* to notify — the hard, interesting part), delivery layer stubbed
   and documented.

## 2. What judges will criticize — and our answers

| Likely criticism | Our answer |
|---|---|
| "How is this not AccuWeather with extra steps?" | Weather apps report conditions; HeatNav evaluates **plans**. The demo leads with Plan My Day, not the temperature. |
| "Where do the risk numbers come from?" | Every risk card has a **"Why this rating?"** expander listing the exact factors (NWS heat-index band, UV, AQI, profile factors) with sources. Nothing is a black box. |
| "Community data will be empty/abused." | Honest cold-start answer: seeded demo data labelled as such; report expiry, vote-based verification, and reputation designed into the model now, not hand-waved. |
| "Does it work offline / without your accounts?" | Yes — local-first, keyless tiles, cached weather. Airplane-mode demo is a rehearsed part of the pitch. |
| "Who is this for, really?" | Outdoor-livelihood workers in heat-stressed cities — people whose income depends on going out at 2 PM. Personas (§4) are specific, not "everyone". |
| "What's the science?" | NWS/Rothfusz heat index, WHO/CDC heat-illness guidance, EPA AQI bands. Cited in code and in the UI. |

## 3. Scope tiers (what we build, in order)

- **Tier 1 — the demo spine (must be flawless):** Onboarding → Home dashboard → Plan My Day
  (create + analysis + checklist) → Risk engine with explainability → Emergency sheet.
- **Tier 2 — the differentiators:** Heat Routes comparison, Community reports (submit, vote,
  expire), Map with layers, Heat Calendar (7-day planning), Recovery check-in.
- **Tier 3 — designed, stubbed, documented:** push delivery, geofencing, Firestore sync,
  reputation ledger, achievements backend.

**Unforgettable moments we engineer deliberately:**
1. Judge types "cricket, 2 hours, 2 PM" → app answers like a knowledgeable friend: risk band,
   *why*, a better departure time, and a checklist — in under 10 seconds of interaction.
2. The **"Why this rating?"** expander — transparency as a feature. No competitor does this.
3. Airplane mode ON, app still fully works — "climate tools must work when infrastructure fails."
4. The recovery check-in: the app cares about you *after* the trip. Nobody expects that.

## 4. Personas

1. **Ravi, 34 — delivery rider (Nagpur).** 9 hours/day on a motorbike, income per parcel.
   Can't skip heat; can re-order stops, find water, and time breaks. Needs: hourly risk windows,
   water points on route, recovery guidance. Success = ends the day without a headache.
2. **Meena, 28 — site engineer (construction).** Responsible for a 40-person crew. Needs the
   heat calendar to schedule concrete pours before 11 AM, and government advisories in one place.
3. **Arjun, 16 — student & cricketer.** Practice 4–6 PM. Doesn't read weather apps. Needs one
   glance: "today 4 PM = orange, shift to 5:30 PM". His grandmother (68, hypertension, 2nd-floor
   tin roof, frequent power cuts) is the household's real risk — Arjun is her caregiver proxy.
4. **Fatima, 61 — retired teacher, no AC.** Walks to the market at fixed times. Needs the
   coolest walking window, shaded route, and a big obvious emergency button.

## 5. User journeys (abridged)

- **First run:** Welcome (why heat kills, 3 swipes, no walls of text) → location (GPS or map
  pick) → profile (age band, occupation, outdoor hours, transport) → health factors (optional,
  skippable, stored locally) → home & cooling situation → "Your heat profile is ready" with an
  immediate personalized today-card. *Under 90 seconds, everything editable later.*
- **Daily loop:** Morning glance at Home (risk hero + high-risk hours strip) → add/adjust plans
  → leave (checklist) → return → recovery check-in → one community question. The loop is
  self-reinforcing: check-ins and answers feed community intelligence.
- **Crisis:** Emergency button → heat-illness triage (symptoms → first-aid steps from WHO/Red
  Cross guidance) → call ambulance / share location → nearest hospital & cooling centre from map data.

## 6. The risk engine (the scientific core)

Categorical bands, never percentages: **Green / Yellow / Orange / Red**.

1. **Base band** = NWS heat-index category computed with the Rothfusz regression
   (the published NWS formula) from temperature + relative humidity.
2. **Environmental modifiers**: UV index ≥ 8 (WHO "very high"), US AQI band ≥ 151, and
   government alerts can each raise the band one step for outdoor plans.
3. **Personal factors** (WHO/CDC-documented risk groups): age 65+ or child, pregnancy,
   cardio/respiratory/diabetic conditions, outdoor occupation, no home cooling + power cuts.
   Factors **elevate the band** (max +1 aggregate from profile) and are always listed by name.
4. **Plan factors**: duration outdoors, exertion level, time-of-day overlap with peak heat hours.
5. **Output** = band + ordered list of `RiskFactor{name, contribution, source}` — this list *is*
   the "Why this rating?" UI. If we can't explain it, we don't show it.

## 7. Screens & navigation

**Navigation:** GoRouter, `StatefulShellRoute` with 5 tabs — **Home · Plan · Map · Community ·
Profile**. Calendar, History, Recovery, Emergency, Report-submit, Plan-wizard are pushed routes.
Onboarding is a pre-shell flow guarded by a redirect on profile existence.

| Screen | Key content / notes |
|---|---|
| Onboarding (5 steps) | Story-driven welcome, location, personal profile, health (optional), home & cooling. Progress dots, large touch targets. |
| Home | Risk hero card (band, temp, feels-like), metric tiles (humidity/UV/AQI/heat index), 24-h temperature chart with risk shading, high-risk-hours strip, today's plans w/ risk chips, tips, community alerts, emergency FAB. |
| Plan wizard | 3 steps: what & where → when & how → review. Presets (cricket, work, market…) to reduce typing. |
| Plan analysis | Band verdict, "Why this rating?" expander, better-time suggestion with comparison, preparation checklist (checkable), things-to-carry, nearby water/shade. |
| Heat Routes | Origin→destination, compare Fastest / Coolest / Most-shaded cards: duration, shade %, water stops, est. temperature delta, map preview. Data provenance labelled. |
| Map | flutter_map, layer filter chips (heat reports, water, shade, hospitals, cooling centres), report pins with detail sheets. |
| Community | Feed of structured reports (category icon, distance, age, votes, verification badge), filter chips, submit flow (category → location → description/photo), daily community question card. |
| Calendar | 7-day outlook cards: band per day, avoid-window, best-outdoor-window, one-line guidance. |
| History | Timeline of plans, check-ins, reports + streak/achievement chips. |
| Recovery check-in | "How do you feel?" → symptom-mapped, evidence-based advice; feeds history. |
| Emergency | Full-screen sheet: symptom triage, first-aid steps, call/share actions, nearest help. |
| Profile | Editable profile sections, app settings (units, theme), data & privacy, about/science page. |

## 8. Design language

Material 3 as the system; personality via: deep near-black surfaces in dark mode (Nothing-OS
restraint), oversized display numerals for temperature (Apple Weather), a strict **risk palette**
(green/amber/orange/red) reserved exclusively for risk semantics, 24-px rounded cards, soft
elevation, skeleton loaders, and micro-animations (animated risk band transitions, staggered list
entrances). Both themes ship day one. Type: Inter-like geometric sans via system fonts.

## 9. Architecture

Feature-first clean architecture. `core/` holds theme, router, risk-engine domain, shared
widgets, services. Each `features/<name>/` has `data/` (models, repositories, sources),
`domain/` where logic warrants it, and `presentation/` (controllers as Riverpod
`Notifier`/`AsyncNotifier`, screens, widgets).

Key seams (interfaces with swappable implementations):
- `WeatherRepository` → Open-Meteo impl + cache decorator (offline).
- `CommunityRepository` → local impl seeded with demo data; Firestore impl slot documented.
- `RouteIntelligenceRepository` → curated demo impl; real-provider slot documented.
- `MapTileProvider` → OSM now, Google later.
- Storage: `shared_preferences`-backed JSON stores (demo scale), behind repository interfaces.

**Stack:** Flutter · Material 3 · Riverpod · GoRouter · flutter_map · fl_chart ·
flutter_animate · http · shared_preferences · intl. Tests cover the risk engine (the part
where being wrong is dangerous).

## 10. Naming

"HeatNav" is serviceable but generic. Candidates to A/B with mentors: **Chhaya** (छाया, "shade" —
memorable, local, poetic), **Suraksha**, **CoolPath**. The codebase stays `heatnav`; the display
name is a single constant.
