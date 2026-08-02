# PATA (पता) — what was built

A diagnostic-check app for Indian government school teachers. Android APK,
24 MB, runs with the network permanently off.

**The one-line version:** a teacher finds out in 20 seconds which children did
not understand today's lesson *and what specifically they got wrong* — then
sends those children adaptive practice at home and gets back not a score but
the name of the misconception.

---

## 1. The core loop

1. **Prep** — type or speak a topic; get teaching material and 3 diagnostic
   questions where every wrong option encodes a *named misconception*, not a
   random plausible answer.
2. **Check** — read a question aloud, children answer A/B/C/D by hand, teacher
   taps the smaller group on a seating grid. Timer runs; effort is *measured*,
   not estimated. Typically ~20 seconds.
3. **Result** — per-child, never a class average. Names the misconception in
   plain words, never "option C". Three one-tap actions: pair them / send home
   / reteach.
4. **Send home** — creates adaptive practice for exactly the children who
   missed it.
5. **The child** opens their own app, sees what they got wrong, gets it
   explained in their language, then takes a 5-question adaptive quiz.
6. **The teacher** gets an unread count and, per child: score, the hardest
   level they reached, and the misconception they kept choosing.

---

## 2. Teacher side

- **Lesson prep** from typed or spoken input. Curated bank offline; live AI
  generation for any topic when a server is connected.
- **Editable questions** — every generated question can be corrected before use.
- **20-second check** — 38-seat grid, tap-the-smaller-group with a flip toggle,
  live tally, visible timer.
- **Dominant wrong answer** captured in one extra tap, which is what turns a
  score into a diagnosis.
- **Per-child results** with the misconception named. Pairing suggestions
  (strongest helper with the child furthest behind), send-home, reteach — each
  choice logged.
- **Insight** — what is actually confusing children, by topic, at class /
  school / district level. Contains no teacher name or identity anywhere.
- **Daily report** — attendance, meals, checks, topics. Fillable by voice
  (whole sentence, or one field at a time), read back aloud before submitting,
  never auto-submitted, shareable to WhatsApp/SMS.
- **Free-form reports** — anything the fixed form does not cover (an incident,
  a request, a letter to the BRC), exported as a PDF.
- **Class register** — 38 names in about 3 minutes, one per line.
- **Page reader** — photograph a textbook page, OCR it on-device, summarise it.
- **Inbox** — practice results coming back from the children, with an unread
  badge that clears itself.

## 3. Student side

- **Minimal login** — no password, no email, nothing to forget. A child gives
  class, roll number and name; matched against the register already on the
  device. Name matching is deliberately loose (case, spacing, first name alone).
- **Today's lesson** in their own language.
- **What you missed** — only their own, never a classmate's.
- **"Explain this to me"** — the AI addresses the child directly in their
  language; offline it falls back to the bundled explanation for that topic.
- **"Understood? Try five questions"** — the adaptive quiz.
- **Writing → PDF** — essays, answers, stories. Dictate by voice (appends, so a
  long piece builds a few sentences at a time), read it back aloud, export as
  PDF and send by WhatsApp/SMS.
- **Page reader and summariser**, same as the teacher's.
- A child cannot reach any teacher screen, even by typing the URL.

## 4. The adaptive quiz (the flagship)

- **5 multiple-choice questions.** Right answer → next one is harder. Wrong →
  next one is easier. Starts at level 2 of 5.
- **Questions are generated, not stored.** The maths topics build theirs from
  scratch, which means they never repeat and difficulty is a parameter.
- **Every wrong option is computed by actually making the misconception.** The
  distractor for "subtracted smaller from larger digit-wise" is what you
  genuinely get doing that to those numbers — so when a child picks it, the app
  knows *which* error they made and names it, to them and to the teacher.
- Topics that are not procedural (photosynthesis, English tenses) draw on
  material that is already in all twelve languages.
- Verified by sweep: **3,600 generated questions** across 5 topics × 5 levels ×
  12 languages — every one with exactly one correct answer, no duplicate
  options, a named misconception on every wrong option, and every subtraction
  genuinely requiring a borrow.
- The correct answer is always revealed before moving on.
- The teacher receives **peak level**, not just score: 3 of 5 at level 4 is a
  different child from 3 of 5 at level 1.

## 5. Twelve languages, everywhere

Hindi, English, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati,
Odia, Punjabi, Assamese.

- **One language, chosen before login** — you cannot read a login form in a
  script you do not read. Changeable at any time from any screen.
- 156 interface strings + 63 student-side strings + 97 content entries, all
  twelve.
- **The lesson content itself** is translated, not just the labels — topic
  names, teaching material, questions, options and every misconception.
- On-device OCR in all twelve scripts (12 bundled language models).
- Honest fallback: text a teacher typed on the spot exists only in the language
  she typed it in. The app falls back their language → Hindi for Devanagari
  readers → English, and says on screen when it had to.

## 6. Voice

- **Speech to text** for lesson topics, report fields, and essay dictation —
  native Android recogniser, taking all its guesses rather than only the top
  one, which is what makes spoken numbers work.
- **Spoken number words** parsed, not just digits — Android returns "चौंतीस",
  not "34". Numerals read in all nine Indic digit blocks.
- **Text to speech** — best installed voice picked deliberately, sentence by
  sentence, slightly slowed.
- **Optional natural voice** — a `/speak` route backed by Sarvam's Bulbul,
  trained on Indian languages specifically. Chunked so playback starts in about
  a second, cached so replaying is free and works offline afterwards.
- Every voice step has a tap or typing alternative. Voice failure never blocks
  anyone.

## 7. AI — optional, never required

A Cloudflare Worker holds the API key; **no key ever reaches the phone**, and
teachers are never asked for one. Nine routes: lesson generation, page
explanation, explain-it-back judging, per-child advice, natural voice, and four
sync routes.

Everything works without it: the question bank, OCR, the summariser, the quiz
generator, reports, PDFs and all twelve languages are on-device.

## 8. Offline

Full cold start with the network off. OCR, summarising, quizzes, reports, PDF
generation, voice and every language work with no connection, permanently.
Service worker precaches the shell; the APK ships every asset on disk.

## 9. Two devices

When the child practises on a family phone and the teacher opens hers the next
morning, results and assignments cross via the same Worker plus a KV store.

**No child's name ever leaves the device.** What crosses is the opaque roster
id; the teacher's phone turns that back into a name from the register it
already holds. A row on the server reads "s7 scored 2 of 5 on borrowing" and
cannot be tied to a person without that register.

Nothing waits on the network — saved locally first, pushed after, retried later.

## 10. Privacy and compliance

- No account, no password, no sign-up.
- No teacher-identifying field exists anywhere in the data model. Insight
  reports describe content, never the adult in the room.
- No biometrics, no cameras on children — the camera photographs textbook
  pages only.
- No per-child attendance tracking. The daily report is counts only.
- Sample data is always labelled as fictional.
- School owns the data; it stays in IndexedDB on the device.

## 11. Technical

- Vite + vanilla TypeScript, no framework. ~8,500 lines, 13 screens.
- IndexedDB for all state; no localStorage, no backend required.
- Capacitor for the Android build. 24 MB APK.
- Tesseract.js OCR with adaptive local-mean thresholding (a shadowed page
  misclassifies 29.3% of pixels with a global threshold, 0% with adaptive).
- Extractive summariser, on-device, in every script.
- Dependency-free PDF generation via canvas rasterisation — a correctly-shaped
  Devanagari or Tamil font is hundreds of kilobytes, times twelve.
- Cloudflare Worker proxy with per-device and per-IP rate limiting.
- **105 automated checks** across six suites, run at 360 px.

---

## 12. Deliberately NOT built

Named in the spec's "do not build" list, and left out on purpose: chatbots,
gamification (points, streaks, leaderboards), teacher rankings, attendance
tracking, anything requiring a device in a child's hands during a lesson, and
anything requiring new hardware.

## 13. Honest limits — say these before someone finds them

- **Debug build.** Installs fine, not Play Store signed. Default app icon.
- **Assamese has no natural voice** — Sarvam's Bulbul covers eleven of the
  twelve, so Assamese uses the phone's own voice.
- **The English-grammar questions stay in English** — they *are* the exercise.
  Only the misconceptions behind them are translated.
- **A lesson a teacher drafts on the spot** exists only in the language she
  typed it in. No offline app can translate that; the AI server does when
  connected.
- **Handwriting is beyond on-device OCR.** Printed pages read at 91–94%
  confidence in 0.8–1.4 s; handwriting needs the server.
- **The two-device class key is routing, not authentication.** Someone who knew
  the school name could read scores against anonymous roster ids. A deliberate
  trade for a pilot against making teachers manage credentials; the code marks
  exactly where a district adds a shared secret.
- **Not tested on real hardware** — mic, camera, real textbook pages and a
  2 GB phone are untested by me.
