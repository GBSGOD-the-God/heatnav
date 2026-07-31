// One fictional class — 38 children, grades 5–7, ability spread across seven
// levels (C4). Always presented as labelled sample data (§12).
import { BANK } from './bank';
import { kvGet, kvSet, replaceRoster, saveCheck } from './db';
import type { AggregateRow, CheckRecord, Student } from './types';

const NAMES: Array<[string, string]> = [
  ['आरव', 'Aarav'], ['दिव्या', 'Divya'], ['कबीर', 'Kabir'], ['मीरा', 'Meera'],
  ['रोहन', 'Rohan'], ['सान्या', 'Sanya'], ['अर्जुन', 'Arjun'], ['पूजा', 'Pooja'],
  ['विवेक', 'Vivek'], ['अनन्या', 'Ananya'], ['राहुल', 'Rahul'], ['स्नेहा', 'Sneha'],
  ['आदित्य', 'Aditya'], ['काजल', 'Kajal'], ['निखिल', 'Nikhil'], ['प्रिया', 'Priya'],
  ['समीर', 'Sameer'], ['ज्योति', 'Jyoti'], ['करण', 'Karan'], ['नेहा', 'Neha'],
  ['विशाल', 'Vishal'], ['आँचल', 'Aanchal'], ['दीपक', 'Deepak'], ['सपना', 'Sapna'],
  ['मोहित', 'Mohit'], ['रानी', 'Rani'], ['सुरेश', 'Suresh'], ['गीता', 'Geeta'],
  ['अमित', 'Amit'], ['लक्ष्मी', 'Lakshmi'], ['राजू', 'Raju'], ['सीमा', 'Seema'],
  ['विक्रम', 'Vikram'], ['आशा', 'Asha'], ['गोपाल', 'Gopal'], ['कविता', 'Kavita'],
  ['हरीश', 'Harish'], ['सुनीता', 'Sunita'],
];

// Seven ability levels in one room (C4): 3+5+7+8+7+5+3 = 38.
const LEVEL_SPREAD = [3, 5, 7, 8, 7, 5, 3];

export function buildRoster(names: Array<[string, string]> = NAMES): Student[] {
  const levels: number[] = [];
  LEVEL_SPREAD.forEach((count, i) => {
    for (let k = 0; k < count; k++) levels.push(i + 1);
  });
  // Deterministic shuffle so levels are not seated in order.
  let s = 42;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = levels.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [levels[i], levels[j]] = [levels[j], levels[i]];
  }
  return names.map(([hi, en], i) => ({
    id: 's' + (i + 1),
    name: { hi, en },
    grade: 5 + (i % 3),
    level: levels[i % levels.length] ?? 4,
    seat: { row: Math.floor(i / 6), col: i % 6 },
  }));
}

/** Historical sample checks so Insight has something honest to aggregate. */
function sampleChecks(students: Student[]): CheckRecord[] {
  const ids = students.map((st) => st.id);
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  // [topicKey, qIndex, notUnderstoodCount, dominantWrong, daysAgo, durationSec]
  const rows: Array<[string, number, number, 'B' | 'C' | 'D' | null, number, number]> = [
    ['sub-borrow', 0, 18, 'C', 1, 24],
    ['sub-borrow', 1, 15, 'C', 1, 21],
    ['fractions', 0, 22, 'B', 3, 28],
    ['fractions', 1, 17, 'B', 3, 19],
    ['place-value', 1, 20, 'B', 5, 26],
    ['place-value', 2, 9, 'B', 5, 17],
    ['photosynthesis', 0, 24, 'B', 7, 31],
    ['photosynthesis', 1, 19, 'B', 7, 23],
    ['tenses', 0, 14, 'C', 9, 22],
    ['tenses', 2, 21, 'B', 12, 27],
  ];
  return rows.map(([topicKey, qIndex, notCount, wrong, daysAgo, dur], i) => {
    const topic = BANK.find((b) => b.key === topicKey)!;
    const q = topic.questions[qIndex];
    // Rotate through the roster so the same children are not always "behind".
    const start = (i * 7) % ids.length;
    const rotated = [...ids.slice(start), ...ids.slice(0, start)];
    const notUnderstoodIds = rotated.slice(0, notCount);
    const understoodIds = rotated.slice(notCount);
    return {
      id: 'sample-c' + i,
      lessonId: null,
      topicKey,
      topicLabel: topic.label,
      qIndex,
      questionText: q.text,
      understoodIds,
      notUnderstoodIds,
      dominantWrong: wrong,
      misconception: wrong ? q.options[wrong].mis ?? null : null,
      durationSec: dur,
      ts: now - daysAgo * day - (i % 3) * 3600 * 1000,
      sample: true,
    };
  });
}

/** School/district content-level rows — labelled sample data. No people. */
export const SAMPLE_AGGREGATES: AggregateRow[] = [
  { scope: 'school', topicLabel: { hi: 'भिन्न की तुलना', en: 'Comparing fractions' }, subject: { hi: 'गणित', en: 'Maths' }, grade: '5–6', checks: 14, confusedPct: 61, topMisconception: { hi: 'नीचे की संख्या बड़ी तो भिन्न बड़ा — यह उल्टा समझा', en: 'thinks a bigger denominator means a bigger fraction' } },
  { scope: 'school', topicLabel: { hi: 'प्रकाश संश्लेषण', en: 'Photosynthesis' }, subject: { hi: 'विज्ञान', en: 'Science' }, grade: '6–7', checks: 11, confusedPct: 57, topMisconception: { hi: 'मानता है कि मिट्टी से बना-बनाया भोजन आता है', en: 'believes food comes ready-made from the soil' } },
  { scope: 'school', topicLabel: { hi: 'हासिल वाला घटाव', en: 'Subtraction with borrowing' }, subject: { hi: 'गणित', en: 'Maths' }, grade: '4–5', checks: 19, confusedPct: 48, topMisconception: { hi: 'हासिल लिया पर दहाई घटाना भूले', en: 'borrowed but did not decrement the tens' } },
  { scope: 'school', topicLabel: { hi: 'काल (टेंस)', en: 'Tenses' }, subject: { hi: 'अंग्रेज़ी', en: 'English' }, grade: '6–7', checks: 8, confusedPct: 44, topMisconception: { hi: '“yesterday” का बीता-समय संकेत पकड़ा नहीं', en: 'misses the past-time signal in “yesterday”' } },
  { scope: 'district', topicLabel: { hi: 'भिन्न की तुलना', en: 'Comparing fractions' }, subject: { hi: 'गणित', en: 'Maths' }, grade: '5–6', checks: 412, confusedPct: 64, topMisconception: { hi: 'नीचे की संख्या बड़ी तो भिन्न बड़ा — यह उल्टा समझा', en: 'thinks a bigger denominator means a bigger fraction' } },
  { scope: 'district', topicLabel: { hi: 'हासिल वाला घटाव', en: 'Subtraction with borrowing' }, subject: { hi: 'गणित', en: 'Maths' }, grade: '4–5', checks: 663, confusedPct: 52, topMisconception: { hi: 'हर जगह बड़े अंक में से छोटा घटाया', en: 'subtracted smaller from larger digit-wise' } },
  { scope: 'district', topicLabel: { hi: 'प्रकाश संश्लेषण', en: 'Photosynthesis' }, subject: { hi: 'विज्ञान', en: 'Science' }, grade: '6–7', checks: 288, confusedPct: 51, topMisconception: { hi: 'पौधे और जानवर की साँस उलट दी', en: 'reverses plant and animal breathing' } },
  { scope: 'district', topicLabel: { hi: 'स्थानीय मान', en: 'Place value' }, subject: { hi: 'गणित', en: 'Maths' }, grade: '4–5', checks: 501, confusedPct: 47, topMisconception: { hi: 'बोले हुए हर हिस्से को अलग-अलग लिख दिया (400 फिर 3)', en: 'writes each spoken part separately (400 then 3)' } },
];

export async function ensureSeeded(): Promise<void> {
  if (await kvGet<boolean>('seeded')) return;
  const roster = buildRoster();
  await replaceRoster(roster);
  for (const c of sampleChecks(roster)) await saveCheck(c);
  await kvSet('seeded', true);
}
