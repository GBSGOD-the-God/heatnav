# HeatNav ☀️

**A personal heat-navigation platform.** Weather apps tell everyone *"it's 43°C."*
HeatNav answers the question that actually keeps people safe: **"Is MY plan safe?"**

Built for the *Smart World – Innovate for the Future* competition.

## What it does

| Feature | In one line |
|---|---|
| **Personal heat profile** | 90-second onboarding: exact location (GPS, worldwide search, or quick-pick city), age, occupation, outdoor hours, health factors (device-only), home cooling situation. |
| **Today dashboard** | Personalized risk band (green→red), feels-like hero, 24-h chart, high-risk-hours strip, tailored tips, community alerts, emergency button. |
| **Plan My Day** ⭐ | Enter "cricket, 2–4 PM" → verdict for *you*, the *why*, a safer departure window, and a reasoned preparation checklist. |
| **Why this rating?** ⭐ | Every verdict expands into the exact factors that produced it, each with its scientific source. No black boxes, no invented percentages. |
| **Heat routes** | Fastest vs coolest vs most-shaded comparison (pilot-city demo dataset; live providers plug in behind the same interface). |
| **Community intelligence** | Structured reports (water station, power cut, shade, extreme heat…) with expiry, votes and verification — deliberately not a social feed. |
| **Map** | Layered city map of hazards and cool resources (keyless OpenStreetMap tiles). |
| **Heat calendar** | 7-day outlook: worst band per day, avoid-window, best outdoor hour. |
| **Recovery check-in** | "How do you feel?" after exposure → WHO/Red Cross-based advice; feeds a personal heat timeline with honest achievements. |
| **Emergency** | Heat-stroke recognition, first-aid steps, one-tap ambulance call, location sharing. |
| **Offline-first** | Cached forecast + local storage: the whole app works in airplane mode after one load. |

## The science (and the honesty rule)

*If we can't cite it, we don't compute it.*

- Heat index: **US NWS Rothfusz regression** with the official adjustments.
- Risk bands: **NWS heat-index categories**; UV thresholds from **WHO**; AQI bands from **US EPA**.
- Personal factors (age, pregnancy, cardiovascular conditions, outdoor occupation,
  no home cooling) from **WHO/CDC heat-health guidance** — each can raise the band
  one step and is always named in the "Why this rating?" panel.
- Where real data doesn't exist yet (route shade %, seeded community reports), the UI
  says **"sample / demo dataset"** instead of pretending. The sample community feed is
  randomized (description, distance, age, votes) from a seed tied to date + location, so
  it looks alive and differs city to city instead of reading like a fixed demo script.

## Tech

Flutter · Material 3 · Riverpod · GoRouter · flutter_map (OSM) · fl_chart ·
Open-Meteo (keyless weather + air quality) · local-first storage.

Feature-first clean architecture: `lib/core` (theme, router, risk engine, shared
widgets) + `lib/features/<feature>/{data,domain,presentation}`. Swappable seams for
Firestore sync, Google Maps tiles and live route intelligence are documented in
[docs/PRODUCT_BLUEPRINT.md](docs/PRODUCT_BLUEPRINT.md).

## Run it

```bash
flutter pub get
flutter run -d chrome   # easiest: runs in the browser, no phone/emulator needed
flutter run             # or any Android/iOS device or emulator — no API keys needed
flutter test            # risk-engine science tests + app smoke tests
```

## Repository guide

- `docs/PRODUCT_BLUEPRINT.md` — the product team's working document: critique of the
  original idea, judge-criticism pre-mortem, personas, journeys, screen specs, and
  every architecture decision with its rationale.
- `lib/core/domain/risk/` — the transparent risk engine (start here to audit the science).
- `test/risk_engine_test.dart` — the engine's behavioural contract.
