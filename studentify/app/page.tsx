import Link from "next/link";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";

const features = [
  {
    emoji: "💬",
    title: "AI Tutor",
    desc: "A patient tutor that explains, gives hints before answers, adapts to your grade and remembers how you learn best.",
  },
  {
    emoji: "🃏",
    title: "Smart Flashcards",
    desc: "Auto-generated from your notes and PDFs, scheduled with spaced repetition so revision happens exactly when you'd start forgetting.",
  },
  {
    emoji: "🧪",
    title: "Quiz Generator",
    desc: "Turn any chapter, note or PDF into a timed quiz — easy to hard — with instant scoring and AI explanations for every question.",
  },
  {
    emoji: "📄",
    title: "PDF Learning",
    desc: "Upload your textbook or notes. Studentify summarises, highlights key points and answers questions only from your document.",
  },
  {
    emoji: "🗓️",
    title: "Study Planner",
    desc: "Enter exam dates and free hours — get a daily plan that reprioritises itself and recovers missed tasks automatically.",
  },
  {
    emoji: "📈",
    title: "Progress & Streaks",
    desc: "Study hours, quiz accuracy, weak areas and achievement badges — see yourself getting better, week after week.",
  },
];

const modes = [
  ["📝", "Homework Mode"],
  ["🎯", "Exam Mode"],
  ["⚡", "Quick Doubt"],
  ["🧑‍🏫", "Teach Me"],
  ["🔁", "Revision"],
  ["🔥", "Challenge Me"],
];

const testimonials = [
  {
    quote:
      "It never just gives me the answer — it asks if I want a hint first. My maths actually improved because I finally understand the steps.",
    name: "Ananya S.",
    role: "Class 10, CBSE",
  },
  {
    quote:
      "I uploaded my physics notes the night before a test and got a summary, 30 flashcards and a quiz in under a minute. Unreal.",
    name: "Rohan M.",
    role: "Class 12, ISC",
  },
  {
    quote:
      "The streak and XP keep my son revising daily without me nagging. The planner rebuilt itself when he missed two days. Worth it.",
    name: "Priya K.",
    role: "Parent of Class 8 student",
  },
];

const faqs = [
  {
    q: "How is Studentify different from ChatGPT?",
    a: "Studentify is built around learning, not conversation. It offers hints before full solutions, adapts to your grade and board, remembers your weak areas, and connects everything — notes, flashcards, quizzes and planning — into one loop designed for long-term retention.",
  },
  {
    q: "Which classes and boards are supported?",
    a: "Studentify supports students roughly aged 11–18 (Classes 6–12) across CBSE, ICSE/ISC, State Boards, IGCSE and IB. You pick your class and board at sign-up and the AI adapts its language and depth accordingly.",
  },
  {
    q: "Will it just do my homework for me?",
    a: "No — and that's the point. In Homework Mode the tutor first asks whether you'd like a hint or the complete solution, and always shows the reasoning. Learning comes before answers.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your notes, chats and uploads belong to you. AI memory can be viewed and reset at any time, and you can export or delete your data from Settings.",
  },
  {
    q: "Does it work on my phone?",
    a: "Studentify is fully responsive and works beautifully on phones, tablets and laptops. Native mobile apps are on the roadmap.",
  },
];

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-1">
      <path d="M20 6 9 17l-5-5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroMock() {
  return (
    <div className="glass rounded-2xl p-3 sm:p-4 shadow-[0_40px_120px_-30px_rgba(59,108,246,0.45)]">
      <div className="flex gap-3">
        {/* mini sidebar */}
        <div className="hidden sm:flex flex-col gap-2 w-36 shrink-0">
          <div className="card rounded-xl p-3 text-xs text-sub">
            <div className="flex items-center gap-2 text-white font-medium mb-2">
              <span className="size-5 rounded-md bg-gradient-to-br from-primary to-accent" />
              Studentify
            </div>
            {["Dashboard", "AI Tutor", "Flashcards", "Quiz", "Planner"].map((x, i) => (
              <div
                key={x}
                className={`rounded-lg px-2 py-1.5 mt-0.5 ${i === 1 ? "bg-primary/20 text-white" : ""}`}
              >
                {x}
              </div>
            ))}
          </div>
          <div className="card rounded-xl p-3">
            <div className="text-[10px] text-sub">Streak</div>
            <div className="text-lg font-bold">🔥 12 days</div>
          </div>
        </div>
        {/* chat */}
        <div className="card rounded-xl p-4 flex-1 text-left">
          <div className="text-[10px] uppercase tracking-widest text-faint mb-3">
            AI Tutor · Homework Mode
          </div>
          <div className="space-y-3 text-sm">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary/25 border border-primary/30 px-3.5 py-2.5 w-fit">
              Solve: x² − 5x + 6 = 0
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-card2 border border-edge px-3.5 py-2.5">
              Nice one — this factorises cleanly. Before I solve it…
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs text-accent2">
                  💡 Give me a hint
                </span>
                <span className="rounded-full bg-white/5 border border-edge px-3 py-1 text-xs text-sub">
                  Show complete solution
                </span>
              </div>
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-card2 border border-edge px-3.5 py-2.5">
              <span className="text-accent2 font-medium">Hint:</span> find two numbers that
              multiply to <span className="font-mono">+6</span> and add to{" "}
              <span className="font-mono">−5</span>…
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink/60 border border-edge px-3 py-2.5 text-xs text-faint">
            Ask anything…
            <span className="ml-auto size-6 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 14-7-4 14-3.5-5.5L5 12Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-x-clip">
      {/* ambient orbs */}
      <div className="orb w-130 h-130 -top-40 -left-40 bg-primary/25 animate-float-slow" />
      <div className="orb w-110 h-110 top-40 -right-40 bg-accent/20 animate-float" />
      <div className="orb w-96 h-96 top-[120vh] -left-32 bg-accent/10" />

      {/* nav */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <nav className="glass rounded-2xl px-4 sm:px-6 h-15 flex items-center justify-between">
            <Link href="/" aria-label="Studentify home">
              <Logo />
            </Link>
            <div className="hidden md:flex items-center gap-7 text-sm text-sub">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#preview" className="hover:text-white transition-colors">Preview</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="hidden sm:block text-sm text-sub hover:text-white transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-glow rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Get started free
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-4">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-edge bg-card/60 px-4 py-1.5 text-xs text-sub mb-7">
            <span className="size-1.5 rounded-full bg-mint animate-pulse-glow" />
            Your personal AI tutor — available 24/7
          </div>
          <h1
            className="animate-fade-up text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] text-gradient"
            style={{ animationDelay: "80ms" }}
          >
            Learn Smarter.
            <br />
            Not Harder.
          </h1>
          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-sub leading-relaxed"
            style={{ animationDelay: "160ms" }}
          >
            Studentify turns doubts into understanding. Ask questions, upload notes,
            generate flashcards and quizzes, plan revision and track progress — one
            beautiful place, built for school students.
          </p>
          <div
            className="animate-fade-up mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/signup"
              className="btn-glow rounded-2xl px-7 py-3.5 font-semibold w-full sm:w-auto"
            >
              Start learning free →
            </Link>
            <a
              href="#preview"
              className="rounded-2xl px-7 py-3.5 font-semibold border border-edge bg-card/60 hover:bg-card2 hover:border-edge2 transition-colors w-full sm:w-auto"
            >
              See it in action
            </a>
          </div>
          <p className="animate-fade-up mt-4 text-xs text-faint" style={{ animationDelay: "300ms" }}>
            Free forever plan · No credit card required
          </p>
        </div>

        <Reveal className="relative mx-auto mt-16 max-w-3xl px-1">
          <HeroMock />
        </Reveal>

        {/* stats strip */}
        <Reveal className="mx-auto mt-14 max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["50K+", "students learning"],
              ["1.2M", "doubts solved"],
              ["4.9★", "average rating"],
              ["93%", "improved grades"],
            ].map(([n, l]) => (
              <div key={l} className="card rounded-xl px-4 py-5 text-center">
                <div className="text-2xl font-bold text-gradient-brand">{n}</div>
                <div className="mt-1 text-xs text-sub">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* features */}
      <section id="features" className="relative py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-accent2 font-semibold">Everything, one place</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              Stop juggling five apps
            </h2>
            <p className="mt-4 text-sub">
              Doubts, notes, flashcards, quizzes, planning and progress — every feature
              feeds the next, so studying becomes one smooth loop.
            </p>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="card card-hover h-full p-7">
                  <div className="size-12 grid place-items-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/25 border border-edge text-2xl">
                    {f.emoji}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2.5 text-sm text-sub leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI modes */}
      <section className="relative py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="card p-8 sm:p-10 overflow-hidden relative">
              <div className="orb w-72 h-72 -top-24 -right-24 bg-accent/15" />
              <div className="sm:flex items-end justify-between gap-8">
                <div className="max-w-md">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Six AI modes.
                    <br />
                    <span className="text-gradient-brand">One tutor that adapts.</span>
                  </h3>
                  <p className="mt-3 text-sm text-sub leading-relaxed">
                    Homework night or exam morning — switch the mode and the tutor changes
                    how it teaches: hints-first, marks-oriented, rapid recall, or a level
                    above your grade.
                  </p>
                </div>
                <div className="mt-8 sm:mt-0 grid grid-cols-2 gap-2.5 min-w-fit">
                  {modes.map(([e, n]) => (
                    <div
                      key={n}
                      className="flex items-center gap-2.5 rounded-xl border border-edge bg-card2 px-4 py-2.5 text-sm hover:border-accent/50 hover:-translate-y-0.5 transition-all"
                    >
                      <span>{e}</span>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* dashboard preview */}
      <section id="preview" className="relative py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-accent2 font-semibold">Your command centre</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              A dashboard that pulls you back
            </h2>
            <p className="mt-4 text-sub">
              Streaks, XP, weak areas and today's plan — everything you need to start
              studying in one glance.
            </p>
          </Reveal>
          <Reveal className="mt-12" delay={120}>
            <div className="glass rounded-3xl p-4 sm:p-6 shadow-[0_50px_140px_-40px_rgba(139,92,246,0.4)]">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="card rounded-2xl p-5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-faint">Good evening 👋</div>
                      <div className="text-xl font-bold mt-0.5">Ready to continue, Aarav?</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">🔥 12</div>
                      <div className="text-[10px] text-sub">day streak</div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-7 gap-1.5 items-end h-24">
                    {[45, 66, 30, 84, 54, 100, 63].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-md bg-gradient-to-t from-primary to-accent opacity-90"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[9px] text-faint">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-sm font-semibold">Today's plan</div>
                  {[
                    ["🃏", "Trigonometry flashcards", "6:00 PM"],
                    ["🧪", "Physics quiz — 20 Qs", "8:00 PM"],
                  ].map(([e, t, w]) => (
                    <div key={t} className="mt-3 flex items-center gap-3 rounded-xl bg-card2 border border-edge px-3 py-2.5">
                      <span>{e}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{t}</div>
                        <div className="text-[10px] text-faint">{w}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-accent/30 px-3 py-2.5 text-xs text-accent2 text-center font-medium">
                    Level 9 · 620 XP to Level 10
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* testimonials */}
      <section className="relative py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Loved by students <span className="text-gradient-brand">and their parents</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="card card-hover h-full p-7">
                  <div className="text-amber text-sm tracking-widest">★★★★★</div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-white/90">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="size-9 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-xs font-bold">
                      {t.name[0]}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs text-faint">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="relative py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center max-w-xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-accent2 font-semibold">Pricing</div>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              Start free, upgrade when ready
            </h2>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-5 items-stretch">
            {/* Free */}
            <Reveal>
              <div className="card h-full p-7 flex flex-col">
                <h3 className="font-semibold">Free</h3>
                <div className="mt-3 text-4xl font-bold">₹0</div>
                <div className="text-xs text-faint mt-1">forever</div>
                <ul className="mt-6 space-y-3 text-sm text-sub flex-1">
                  {["20 AI tutor messages / day", "3 PDF uploads / month", "Flashcards & quizzes", "Basic study planner"].map((x) => (
                    <li key={x} className="flex gap-2.5"><CheckIcon />{x}</li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-7 rounded-xl border border-edge bg-card2 py-3 text-center text-sm font-semibold hover:border-edge2 transition-colors">
                  Get started
                </Link>
              </div>
            </Reveal>
            {/* Pro */}
            <Reveal delay={90}>
              <div className="relative h-full rounded-[1.3rem] p-px bg-gradient-to-b from-primary via-accent to-primary/30">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Most popular
                </div>
                <div className="h-full rounded-[1.25rem] bg-card p-7 flex flex-col">
                  <h3 className="font-semibold">Pro</h3>
                  <div className="mt-3 text-4xl font-bold">₹299<span className="text-base font-medium text-sub">/mo</span></div>
                  <div className="text-xs text-faint mt-1">or ₹2,499/year — save 30%</div>
                  <ul className="mt-6 space-y-3 text-sm text-sub flex-1">
                    {["Unlimited AI tutor", "Unlimited PDFs & summaries", "All six AI modes", "Smart planner with recovery", "Progress analytics & weak areas", "AI memory & personalisation"].map((x) => (
                      <li key={x} className="flex gap-2.5"><CheckIcon />{x}</li>
                    ))}
                  </ul>
                  <Link href="/signup" className="btn-glow mt-7 rounded-xl py-3 text-center text-sm font-semibold">
                    Start 7-day free trial
                  </Link>
                </div>
              </div>
            </Reveal>
            {/* Family */}
            <Reveal delay={180}>
              <div className="card h-full p-7 flex flex-col">
                <h3 className="font-semibold">Family</h3>
                <div className="mt-3 text-4xl font-bold">₹499<span className="text-base font-medium text-sub">/mo</span></div>
                <div className="text-xs text-faint mt-1">up to 3 students</div>
                <ul className="mt-6 space-y-3 text-sm text-sub flex-1">
                  {["Everything in Pro", "3 student profiles", "Parent progress digest", "Priority support"].map((x) => (
                    <li key={x} className="flex gap-2.5"><CheckIcon />{x}</li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-7 rounded-xl border border-edge bg-card2 py-3 text-center text-sm font-semibold hover:border-edge2 transition-colors">
                  Choose Family
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Questions, answered</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details className="faq card px-6 py-4 group">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold list-none">
                    {f.q}
                    <svg className="faq-chev shrink-0 text-sub" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-sub leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4">
        <Reveal className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-primary/20 via-card to-accent/20 p-10 sm:p-16 text-center">
            <div className="orb w-80 h-80 -top-40 left-1/2 -translate-x-1/2 bg-accent/25" />
            <h2 className="relative text-3xl sm:text-5xl font-bold tracking-tight text-gradient">
              Your grades will thank you.
            </h2>
            <p className="relative mt-4 text-sub max-w-md mx-auto">
              Join thousands of students who stopped cramming and started understanding.
            </p>
            <Link
              href="/signup"
              className="btn-glow relative mt-8 inline-block rounded-2xl px-8 py-4 font-semibold"
            >
              Get started — it's free →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* footer */}
      <footer className="border-t border-edge/60 px-4 py-14">
        <div className="mx-auto max-w-6xl grid sm:grid-cols-4 gap-10">
          <div className="sm:col-span-1">
            <Logo />
            <p className="mt-4 text-xs text-faint leading-relaxed max-w-[220px]">
              The AI-powered learning platform for school students. Learn Smarter. Not Harder.
            </p>
          </div>
          {[
            ["Product", ["Features", "Pricing", "AI Tutor", "Flashcards", "Quiz Generator"]],
            ["Company", ["About", "Blog", "Careers", "Contact"]],
            ["Legal", ["Privacy", "Terms", "Data & Safety", "For Schools"]],
          ].map(([h, links]) => (
            <div key={h as string}>
              <div className="text-sm font-semibold mb-4">{h}</div>
              <ul className="space-y-2.5 text-sm text-faint">
                {(links as string[]).map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-6xl mt-12 pt-6 border-t border-edge/40 text-xs text-faint flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Studentify AI. All rights reserved.</span>
          <span>Made with 💜 for students everywhere</span>
        </div>
      </footer>
    </div>
  );
}
