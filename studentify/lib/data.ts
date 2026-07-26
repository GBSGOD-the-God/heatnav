export const student = {
  name: "Aarav",
  grade: "Class 10",
  board: "CBSE",
  streak: 12,
  xp: 4380,
  level: 9,
  levelProgress: 0.68,
};

export const weeklyHours = [
  { day: "Mon", hours: 1.5 },
  { day: "Tue", hours: 2.2 },
  { day: "Wed", hours: 1.0 },
  { day: "Thu", hours: 2.8 },
  { day: "Fri", hours: 1.8 },
  { day: "Sat", hours: 3.4 },
  { day: "Sun", hours: 2.1 },
];

export const quizAccuracy = [
  { subject: "Maths", pct: 84 },
  { subject: "Physics", pct: 71 },
  { subject: "Chemistry", pct: 78 },
  { subject: "Biology", pct: 91 },
  { subject: "English", pct: 88 },
];

export const recentSessions = [
  { title: "Quadratic Equations — roots & discriminant", subject: "Maths", mode: "Teach Me", when: "2h ago", progress: 0.8 },
  { title: "Light: Reflection and Refraction", subject: "Physics", mode: "Revision", when: "Yesterday", progress: 0.55 },
  { title: "Carbon and its Compounds", subject: "Chemistry", mode: "Quick Doubt", when: "2 days ago", progress: 1 },
];

export const upcomingTasks = [
  { title: "Revise Trigonometry flashcards", due: "Today, 6:00 PM", subject: "Maths", type: "Flashcards" },
  { title: "Physics quiz — Electricity (20 Qs)", due: "Today, 8:00 PM", subject: "Physics", type: "Quiz" },
  { title: "Summarise Ch. 6 notes — Life Processes", due: "Tomorrow", subject: "Biology", type: "Notes" },
  { title: "Mock test — Sample Paper 3", due: "Sat, 10:00 AM", subject: "All", type: "Exam prep" },
];

export type Mode = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  greeting: string;
};

export const aiModes: Mode[] = [
  { id: "homework", name: "Homework Mode", emoji: "📝", desc: "Guided help — hints before answers", greeting: "Homework Mode on. Paste your question — I'll guide you step by step, hints first." },
  { id: "exam", name: "Exam Mode", emoji: "🎯", desc: "Concise, exam-style answers", greeting: "Exam Mode on. I'll keep answers crisp, marks-oriented and to the point." },
  { id: "doubt", name: "Quick Doubt", emoji: "⚡", desc: "Fast, direct clarification", greeting: "Quick Doubt mode. Ask anything — I'll clear it up fast." },
  { id: "teach", name: "Teach Me", emoji: "🧑‍🏫", desc: "Full concept, from zero", greeting: "Teach Me mode. Name a topic and I'll build it up from the basics with examples." },
  { id: "revision", name: "Revision", emoji: "🔁", desc: "Rapid recap + recall checks", greeting: "Revision mode. Tell me the chapter — I'll recap key points and quiz your recall." },
  { id: "challenge", name: "Challenge Me", emoji: "🔥", desc: "Harder questions, no mercy", greeting: "Challenge Me mode. Ready for questions a level above your grade? Let's go." },
];

export type Deck = {
  id: string;
  name: string;
  subject: string;
  due: number;
  total: number;
  color: string;
  cards: { front: string; back: string }[];
};

export const decks: Deck[] = [
  {
    id: "trig",
    name: "Trigonometry Essentials",
    subject: "Maths",
    due: 8,
    total: 24,
    color: "from-blue-500/25 to-indigo-500/10",
    cards: [
      { front: "What is sin θ in a right triangle?", back: "Opposite side ÷ Hypotenuse" },
      { front: "Value of tan 45°?", back: "1" },
      { front: "sin²θ + cos²θ = ?", back: "1 — the fundamental Pythagorean identity" },
      { front: "What is sec θ?", back: "1 / cos θ (Hypotenuse ÷ Adjacent)" },
      { front: "Value of cos 60°?", back: "1/2" },
    ],
  },
  {
    id: "light",
    name: "Light — Reflection & Refraction",
    subject: "Physics",
    due: 5,
    total: 18,
    color: "from-purple-500/25 to-fuchsia-500/10",
    cards: [
      { front: "State the laws of reflection.", back: "1) Angle of incidence = angle of reflection. 2) Incident ray, reflected ray and normal lie in the same plane." },
      { front: "What is the power of a lens?", back: "P = 1/f (focal length in metres). Unit: dioptre (D)." },
      { front: "Refractive index formula?", back: "n = speed of light in vacuum ÷ speed of light in medium (c/v)" },
    ],
  },
  {
    id: "carbon",
    name: "Carbon & its Compounds",
    subject: "Chemistry",
    due: 11,
    total: 30,
    color: "from-emerald-500/25 to-teal-500/10",
    cards: [
      { front: "What is catenation?", back: "The ability of carbon atoms to form long chains and rings by bonding with other carbon atoms." },
      { front: "General formula of alkanes?", back: "CnH2n+2" },
      { front: "What is a functional group?", back: "An atom or group of atoms that gives a compound its characteristic chemical properties (e.g. –OH, –COOH)." },
    ],
  },
];

export type QuizQ = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  subject?: string;
  topic?: string;
};

export const quizBank: QuizQ[] = [
  {
    q: "The value of the discriminant for x² + 4x + 4 = 0 is:",
    options: ["16", "0", "8", "−16"],
    answer: 1,
    explain: "D = b² − 4ac = 16 − 16 = 0, so the equation has two equal real roots (x = −2).",
    subject: "Maths", topic: "quadratics",
  },
  {
    q: "sin 30° + cos 60° equals:",
    options: ["1", "1/2", "√3/2", "2"],
    answer: 0,
    explain: "sin 30° = 1/2 and cos 60° = 1/2, so the sum is 1.",
    subject: "Maths", topic: "trigonometry",
  },
  {
    q: "The SI unit of electric current is the:",
    options: ["Volt", "Ohm", "Ampere", "Coulomb"],
    answer: 2,
    explain: "Current is measured in amperes (A). Volts measure potential difference, ohms resistance, coulombs charge.",
    subject: "Physics", topic: "electricity",
  },
  {
    q: "Which mirror is used as a rear-view mirror in vehicles?",
    options: ["Plane", "Concave", "Convex", "Parabolic"],
    answer: 2,
    explain: "Convex mirrors always form erect, diminished images and give a wide field of view — ideal for rear-view mirrors.",
    subject: "Physics", topic: "optics",
  },
  {
    q: "The pH of a neutral solution at 25°C is:",
    options: ["0", "7", "14", "1"],
    answer: 1,
    explain: "Pure water at 25°C has equal H⁺ and OH⁻ concentrations, giving pH 7 — the neutral point of the scale.",
    subject: "Chemistry", topic: "acids and bases",
  },
  {
    q: "Which of these is a saturated hydrocarbon?",
    options: ["Ethene", "Ethyne", "Ethane", "Benzene"],
    answer: 2,
    explain: "Ethane (C₂H₆) has only single C–C bonds → saturated (an alkane). Ethene and ethyne have double/triple bonds.",
    subject: "Chemistry", topic: "carbon compounds",
  },
  {
    q: "The powerhouse of the cell is the:",
    options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi body"],
    answer: 2,
    explain: "Mitochondria carry out cellular respiration, releasing energy stored in glucose as ATP.",
    subject: "Biology", topic: "cell biology",
  },
  {
    q: "In photosynthesis, oxygen is released from the splitting of:",
    options: ["Carbon dioxide", "Glucose", "Water", "Chlorophyll"],
    answer: 2,
    explain: "The light reaction splits water (photolysis): 2H₂O → 4H⁺ + 4e⁻ + O₂. The O₂ we breathe comes from water, not CO₂.",
    subject: "Biology", topic: "photosynthesis",
  },
  {
    q: "The roots of x² − 5x + 6 = 0 are:",
    options: ["2 and 3", "−2 and −3", "1 and 6", "−1 and −6"],
    answer: 0,
    explain: "Factorise: x² − 5x + 6 = (x − 2)(x − 3). Setting each factor to zero gives x = 2 and x = 3.",
    subject: "Maths", topic: "quadratics",
  },
  {
    q: "A concave mirror always forms a virtual image when the object is placed:",
    options: ["At the centre of curvature", "Beyond C", "Between the pole and focus", "At the focus"],
    answer: 2,
    explain: "Between P and F the reflected rays diverge, so they appear to meet behind the mirror — a virtual, erect, magnified image.",
    subject: "Physics", topic: "optics",
  },
  {
    q: "Which of these is the functional group of carboxylic acids?",
    options: ["–OH", "–CHO", "–COOH", "–CO–"],
    answer: 2,
    explain: "–COOH (carboxyl) defines carboxylic acids, e.g. ethanoic acid CH₃COOH. –OH is alcohols, –CHO aldehydes, –CO– ketones.",
    subject: "Chemistry", topic: "carbon compounds",
  },
  {
    q: "If sin θ = 3/5, then cos θ equals:",
    options: ["4/5", "3/4", "5/4", "5/3"],
    answer: 0,
    explain: "Using sin²θ + cos²θ = 1: cos²θ = 1 − 9/25 = 16/25, so cos θ = 4/5 (taking θ acute).",
    subject: "Maths", topic: "trigonometry",
  },
  {
    q: "Ohm's law states that V equals:",
    options: ["I/R", "I × R", "R/I", "I² × R"],
    answer: 1,
    explain: "V = IR — potential difference is directly proportional to current, with resistance R as the constant of proportionality.",
    subject: "Physics", topic: "electricity",
  },
];

export const notesData = [
  { id: 1, folder: "Maths", title: "Quadratic Equations — full summary", tags: ["formulas", "important"], updated: "2h ago", body: "## Standard form\nax² + bx + c = 0, where a ≠ 0\n\n## Discriminant\nD = b² − 4ac\n- D > 0 → two distinct real roots\n- D = 0 → two equal real roots\n- D < 0 → no real roots\n\n## Quadratic formula\nx = (−b ± √D) / 2a\n\n## Sum & product of roots\n- α + β = −b/a\n- αβ = c/a" },
  { id: 2, folder: "Physics", title: "Electricity — key formulas", tags: ["formulas"], updated: "Yesterday", body: "## Core relations\n- V = IR (Ohm's law)\n- P = VI = I²R = V²/R\n- H = I²Rt (Joule heating)\n\n## Series vs parallel\n- Series: R = R1 + R2 + …\n- Parallel: 1/R = 1/R1 + 1/R2 + …" },
  { id: 3, folder: "Biology", title: "Life Processes — nutrition notes", tags: ["diagram", "revision"], updated: "3 days ago", body: "## Autotrophic nutrition\nPhotosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (sunlight + chlorophyll)\n\n## Steps\n1. Absorption of light by chlorophyll\n2. Conversion of light energy → chemical energy, splitting of water\n3. Reduction of CO₂ to carbohydrates" },
  { id: 4, folder: "English", title: "Letter writing — formal format", tags: ["exam"], updated: "Last week", body: "1. Sender's address\n2. Date\n3. Receiver's designation & address\n4. Subject line\n5. Salutation\n6. Body (3 paras: intro → detail → action)\n7. Complimentary close" },
];

export const badges = [
  { emoji: "🔥", name: "12-day streak", got: true },
  { emoji: "🧠", name: "100 flashcards", got: true },
  { emoji: "🎯", name: "90%+ quiz", got: true },
  { emoji: "📚", name: "10 PDFs learned", got: false },
  { emoji: "🌙", name: "Night owl", got: true },
  { emoji: "🏆", name: "Level 10", got: false },
];

export const plannerSchedule = [
  { day: "Monday", blocks: [{ time: "5:00 – 6:00 PM", subject: "Maths", topic: "Quadratic equations practice set", kind: "practice" }, { time: "7:30 – 8:00 PM", subject: "Physics", topic: "Flashcards — Light", kind: "revision" }] },
  { day: "Tuesday", blocks: [{ time: "5:00 – 6:00 PM", subject: "Chemistry", topic: "Carbon compounds — nomenclature", kind: "learn" }, { time: "8:00 – 8:30 PM", subject: "Maths", topic: "Quick quiz — Trigonometry", kind: "quiz" }] },
  { day: "Wednesday", blocks: [{ time: "5:00 – 6:30 PM", subject: "Physics", topic: "Electricity — numericals", kind: "practice" }] },
  { day: "Thursday", blocks: [{ time: "5:00 – 6:00 PM", subject: "Biology", topic: "Life Processes — respiration", kind: "learn" }, { time: "7:30 – 8:00 PM", subject: "English", topic: "Grammar drills", kind: "practice" }] },
  { day: "Friday", blocks: [{ time: "5:00 – 6:00 PM", subject: "Maths", topic: "Weak-area review: word problems", kind: "revision" }] },
  { day: "Saturday", blocks: [{ time: "10:00 – 11:30 AM", subject: "All", topic: "Mock test — Sample Paper 3", kind: "exam" }, { time: "5:00 – 5:30 PM", subject: "All", topic: "Mistake analysis with AI Tutor", kind: "revision" }] },
  { day: "Sunday", blocks: [{ time: "11:00 – 11:45 AM", subject: "Chemistry", topic: "Spaced-repetition flashcards", kind: "revision" }] },
];
