// Curated diagnostic bank. Every distractor encodes one specific, named
// misconception (spec §4) — the result screen reports the misconception,
// never the letter. Runs fully offline; no model call needed for the demo.
import { localiseBi, localiseList } from './content-i18n';
import type { Bi, BiList, Question } from './types';

export interface BankTopic {
  key: string;
  match: string[];
  label: Bi;
  subject: Bi;
  gradeBand: string;
  material: BiList;
  questions: Question[];
}

const BANK_HI_EN: BankTopic[] = [
  {
    key: 'sub-borrow',
    match: ['घटा', 'हासिल', 'subtract', 'borrow', 'minus', 'उधार'],
    label: { hi: 'हासिल वाला घटाव', en: 'Subtraction with borrowing' },
    subject: { hi: 'गणित', en: 'Maths' },
    gradeBand: '4–5',
    material: {
      hi: [
        'बोर्ड पर 42 − 17 लिखें। पूछें: “इकाई में 2 में से 7 जा सकता है?” — यही पूरे पाठ की कुंजी है।',
        'हासिल दिखाएँ: दहाई से 1 लेकर 2 को 12 बनाएँ, और दहाई का 4 अब 3 है। यह “अब 3 है” ही बच्चे भूलते हैं।',
        'आम जाल: कई बच्चे बड़े अंक में से छोटा घटा देते हैं (7−2), चाहे वह ऊपर हो या नीचे। इसे बोर्ड पर गलत करके दिखाएँ और पूछें — गलती कहाँ है?',
        'अभ्यास: 60−28 और 305−127 — शून्य वाली दहाई पर हासिल विशेष रूप से कराएँ।',
      ],
      en: [
        'Write 42 − 17 on the board. Ask: “Can we take 7 from 2 in the ones place?” — this question is the key to the whole lesson.',
        'Show borrowing: take 1 ten to make the 2 into 12, and the 4 tens becomes 3. That “it is now 3” is exactly what children forget.',
        'Common trap: many children subtract the smaller digit from the larger, whichever is on top. Do it wrong on the board and ask — where is the mistake?',
        'Practice: 60−28 and 305−127 — drill borrowing across the zero especially.',
      ],
    },
    questions: [
      {
        text: { hi: '42 − 17 = ?', en: '42 − 17 = ?' },
        options: {
          A: { text: { hi: '25', en: '25' }, correct: true },
          B: { text: { hi: '35', en: '35' }, mis: { hi: 'हर जगह बड़े अंक में से छोटा घटाया', en: 'subtracted smaller from larger digit-wise' } },
          C: { text: { hi: '29', en: '29' }, mis: { hi: 'हासिल लिया पर दहाई घटाना भूले', en: 'borrowed but did not decrement the tens' } },
          D: { text: { hi: '59', en: '59' }, mis: { hi: 'घटाने की जगह जोड़ दिया', en: 'added instead of subtracted' } },
        },
      },
      {
        text: { hi: '60 − 28 = ?', en: '60 − 28 = ?' },
        options: {
          A: { text: { hi: '32', en: '32' }, correct: true },
          B: { text: { hi: '48', en: '48' }, mis: { hi: 'हर जगह बड़े अंक में से छोटा घटाया', en: 'subtracted smaller from larger digit-wise' } },
          C: { text: { hi: '42', en: '42' }, mis: { hi: 'हासिल लिया पर दहाई घटाना भूले', en: 'borrowed but did not decrement the tens' } },
          D: { text: { hi: '88', en: '88' }, mis: { hi: 'घटाने की जगह जोड़ दिया', en: 'added instead of subtracted' } },
        },
      },
      {
        text: { hi: '305 − 127 = ?', en: '305 − 127 = ?' },
        options: {
          A: { text: { hi: '178', en: '178' }, correct: true },
          B: { text: { hi: '222', en: '222' }, mis: { hi: 'हर जगह बड़े अंक में से छोटा घटाया', en: 'subtracted smaller from larger digit-wise' } },
          C: { text: { hi: '288', en: '288' }, mis: { hi: 'शून्य के आर-पार हासिल में दहाई/सैकड़ा घटाना भूले', en: 'borrowed across the zero without decrementing' } },
          D: { text: { hi: '432', en: '432' }, mis: { hi: 'घटाने की जगह जोड़ दिया', en: 'added instead of subtracted' } },
        },
      },
    ],
  },
  {
    key: 'fractions',
    match: ['भिन्न', 'fraction', 'आधा', 'हिस्सा', 'numerator', 'अंश'],
    label: { hi: 'भिन्न की तुलना', en: 'Comparing fractions' },
    subject: { hi: 'गणित', en: 'Maths' },
    gradeBand: '5–6',
    material: {
      hi: [
        'एक रोटी को 3 हिस्सों में, दूसरी को 5 हिस्सों में बाँटकर दिखाएँ — किसका हिस्सा बड़ा? यही 1/3 बनाम 1/5 है।',
        'आम जाल: “5 बड़ा है इसलिए 1/5 बड़ा” — नीचे की संख्या बड़ी यानी हिस्से छोटे। इसे चित्र से ही तोड़ें, नियम रटाकर नहीं।',
        'बराबर भिन्न: 2/4 और 1/2 को एक ही रोटी पर रंगकर दिखाएँ।',
        'जोड़ का नियम: 3/8 + 2/8 में नीचे की संख्या नहीं जुड़ती — हिस्से का आकार वही रहता है, गिनती बढ़ती है।',
      ],
      en: [
        'Split one roti into 3 parts and another into 5 — whose piece is bigger? That is 1/3 vs 1/5.',
        'Common trap: “5 is bigger so 1/5 is bigger” — a bigger bottom number means smaller pieces. Break this with the picture, not a memorised rule.',
        'Equal fractions: shade 2/4 and 1/2 on the same roti.',
        'Addition rule: in 3/8 + 2/8 the bottom number does not add — the size of the piece stays, the count grows.',
      ],
    },
    questions: [
      {
        text: { hi: 'कौन बड़ा है — 1/3 या 1/5?', en: 'Which is bigger — 1/3 or 1/5?' },
        options: {
          A: { text: { hi: '1/3', en: '1/3' }, correct: true },
          B: { text: { hi: '1/5', en: '1/5' }, mis: { hi: 'नीचे की संख्या बड़ी तो भिन्न बड़ा — यह उल्टा समझा', en: 'thinks a bigger denominator means a bigger fraction' } },
          C: { text: { hi: 'दोनों बराबर', en: 'Both equal' }, mis: { hi: 'ऊपर 1 समान है इसलिए बराबर मान लिया', en: 'judges only by the equal numerators' } },
          D: { text: { hi: 'तुलना नहीं हो सकती', en: 'Cannot compare' }, mis: { hi: 'अलग हर वाली भिन्नों की तुलना असंभव मानता है', en: 'believes unlike denominators cannot be compared' } },
        },
      },
      {
        text: { hi: '2/4 और 1/2 में कौन बड़ा है?', en: 'Which is bigger — 2/4 or 1/2?' },
        options: {
          A: { text: { hi: 'दोनों बराबर', en: 'They are equal' }, correct: true },
          B: { text: { hi: '2/4', en: '2/4' }, mis: { hi: 'ऊपर की संख्या बड़ी तो भिन्न बड़ा मान लिया', en: 'judges by the bigger numerator alone' } },
          C: { text: { hi: '1/2', en: '1/2' }, mis: { hi: 'नीचे की संख्या छोटी तो भिन्न बड़ा — नियम आधा याद है', en: 'half-remembered rule: smaller denominator always bigger' } },
          D: { text: { hi: 'बता नहीं सकते', en: 'Cannot say' }, mis: { hi: 'तुल्य भिन्न की पहचान नहीं', en: 'does not recognise equivalent fractions' } },
        },
      },
      {
        text: { hi: '3/8 + 2/8 = ?', en: '3/8 + 2/8 = ?' },
        options: {
          A: { text: { hi: '5/8', en: '5/8' }, correct: true },
          B: { text: { hi: '5/16', en: '5/16' }, mis: { hi: 'नीचे की संख्याएँ भी जोड़ दीं', en: 'added the denominators as well' } },
          C: { text: { hi: '6/16', en: '6/16' }, mis: { hi: 'ऊपर गुणा, नीचे जोड़ — जोड़ और गुणा गड्डमड्ड', en: 'mixed up the addition and multiplication rules' } },
          D: { text: { hi: '8/5', en: '8/5' }, mis: { hi: 'अंश और हर उलट दिए', en: 'flipped numerator and denominator' } },
        },
      },
    ],
  },
  {
    key: 'place-value',
    match: ['स्थानीय मान', 'place value', 'इकाई दहाई', 'सैकड़ा', 'अंक'],
    label: { hi: 'स्थानीय मान', en: 'Place value' },
    subject: { hi: 'गणित', en: 'Maths' },
    gradeBand: '4–5',
    material: {
      hi: [
        '507 बोर्ड पर लिखें। पूछें: यह 5, “पाँच” है या “पाँच सौ”? — अंक और उसका मान अलग चीज़ें हैं।',
        'शून्य की जगह: “चार सौ तीन” लिखवाएँ। जो बच्चे 4003 लिखते हैं, वे बोले हुए हर हिस्से को अलग-अलग लिख रहे हैं — यह सबसे आम गलती है।',
        'दस-दस की छलाँग: 395 से 405 — दहाई बदलने पर सैकड़ा भी बदल सकता है, इसे गिनकर पार कराएँ।',
      ],
      en: [
        'Write 507 on the board. Ask: is this 5 “five” or “five hundred”? — a digit and its value are different things.',
        'The zero place: dictate “four hundred three”. Children who write 4003 are writing each spoken part separately — the single most common error.',
        'Jumps of ten: 395 to 405 — crossing a hundred while adding ten; count it out.',
      ],
    },
    questions: [
      {
        text: { hi: '507 में 5 का मान क्या है?', en: 'In 507, what is the value of the 5?' },
        options: {
          A: { text: { hi: '500', en: '500' }, correct: true },
          B: { text: { hi: '5', en: '5' }, mis: { hi: 'अंक का चेहरा पढ़ा, स्थान का मान नहीं', en: 'reads the digit’s face value, not its place value' } },
          C: { text: { hi: '50', en: '50' }, mis: { hi: 'एक स्थान नीचे खिसक गए', en: 'shifted one place down' } },
          D: { text: { hi: '5000', en: '5000' }, mis: { hi: 'एक स्थान ऊपर खिसक गए', en: 'shifted one place up' } },
        },
      },
      {
        text: { hi: '“चार सौ तीन” को अंकों में लिखें', en: 'Write “four hundred three” in figures' },
        options: {
          A: { text: { hi: '403', en: '403' }, correct: true },
          B: { text: { hi: '4003', en: '4003' }, mis: { hi: 'बोले हुए हर हिस्से को अलग-अलग लिख दिया (400 फिर 3)', en: 'writes each spoken part separately (400 then 3)' } },
          C: { text: { hi: '430', en: '430' }, mis: { hi: '3 को दहाई में रख दिया — शून्य की जगह पक्की नहीं', en: 'puts the 3 in the tens — unsure where the zero goes' } },
          D: { text: { hi: '43', en: '43' }, mis: { hi: 'खाली स्थान का शून्य ही छोड़ दिया', en: 'drops the zero of the empty place entirely' } },
        },
      },
      {
        text: { hi: '395 से 10 ज़्यादा क्या है?', en: 'What is 10 more than 395?' },
        options: {
          A: { text: { hi: '405', en: '405' }, correct: true },
          B: { text: { hi: '396', en: '396' }, mis: { hi: '10 की जगह 1 जोड़ा', en: 'added 1 instead of 10' } },
          C: { text: { hi: '3105', en: '3105' }, mis: { hi: 'जोड़ने की जगह अंक चिपका दिए', en: 'appended digits instead of adding' } },
          D: { text: { hi: '495', en: '495' }, mis: { hi: '10 की जगह 100 जोड़ा', en: 'added 100 instead of 10' } },
        },
      },
    ],
  },
  {
    key: 'photosynthesis',
    match: ['प्रकाश संश्लेषण', 'photosynthesis', 'पौध', 'plant', 'पत्ती', 'leaf'],
    label: { hi: 'प्रकाश संश्लेषण', en: 'Photosynthesis' },
    subject: { hi: 'विज्ञान', en: 'Science' },
    gradeBand: '6–7',
    material: {
      hi: [
        'शुरुआत इस सवाल से: “पौधा खाना कहाँ से लाता है?” — ज़्यादातर बच्चे कहेंगे “मिट्टी से”। यही वह गलतफ़हमी है जिसे आज तोड़ना है।',
        'पत्ती रसोई है: धूप + हवा की CO₂ + जड़ों का पानी → पत्ती में भोजन बनता है। मिट्टी से खनिज आते हैं, बना-बनाया खाना नहीं।',
        'उल्टा साँस लेने वाला भ्रम: पौधे दिन में CO₂ लेते हैं — बच्चों का “पौधे ऑक्सीजन लेते हैं” अक्सर जानवरों से उलझन है।',
        'प्रयोग/चर्चा: गमले के पौधे की एक पत्ती को काग़ज़ से ढककर हफ़्ते भर बाद देखें — बिना धूप, भोजन नहीं।',
      ],
      en: [
        'Start with: “Where does a plant get its food?” — most children will say “from the soil”. That is the misconception to break today.',
        'The leaf is the kitchen: sunlight + CO₂ from air + water from roots → food is made in the leaf. Soil gives minerals, not ready-made food.',
        'The reversed-breathing confusion: plants take in CO₂ by day — children’s “plants take oxygen” usually comes from mixing plants up with animals.',
        'Try/discuss: cover one leaf of a potted plant with paper for a week — no sunlight, no food.',
      ],
    },
    questions: [
      {
        text: { hi: 'पौधा अपना भोजन मुख्यतः कहाँ बनाता है?', en: 'Where does a plant mainly make its food?' },
        options: {
          A: { text: { hi: 'पत्तियों में', en: 'In the leaves' }, correct: true },
          B: { text: { hi: 'जड़ों में', en: 'In the roots' }, mis: { hi: 'मानता है कि मिट्टी से बना-बनाया भोजन आता है', en: 'believes food comes ready-made from the soil' } },
          C: { text: { hi: 'फूलों में', en: 'In the flowers' }, mis: { hi: 'प्रजनन और पोषण गड्डमड्ड', en: 'confuses reproduction with nutrition' } },
          D: { text: { hi: 'तने में', en: 'In the stem' }, mis: { hi: 'जो ढोता है वही बनाता है — ऐसा मान लिया', en: 'assumes the carrier must be the maker' } },
        },
      },
      {
        text: { hi: 'भोजन बनाने के लिए पौधा हवा से कौन-सी गैस लेता है?', en: 'Which gas does a plant take from the air to make food?' },
        options: {
          A: { text: { hi: 'कार्बन डाइऑक्साइड', en: 'Carbon dioxide' }, correct: true },
          B: { text: { hi: 'ऑक्सीजन', en: 'Oxygen' }, mis: { hi: 'पौधे और जानवर की साँस उलट दी', en: 'reverses plant and animal breathing' } },
          C: { text: { hi: 'नाइट्रोजन', en: 'Nitrogen' }, mis: { hi: 'खाद वाले पोषक से उलझन', en: 'confuses it with the fertiliser nutrient' } },
          D: { text: { hi: 'भाप (जलवाष्प)', en: 'Water vapour' }, mis: { hi: 'पानी लेना और गैस लेना गड्डमड्ड', en: 'mixes up water intake with gas exchange' } },
        },
      },
      {
        text: { hi: 'अगर पौधे को धूप बिल्कुल न मिले तो?', en: 'What if a plant gets no sunlight at all?' },
        options: {
          A: { text: { hi: 'वह भोजन नहीं बना पाएगा', en: 'It cannot make food' }, correct: true },
          B: { text: { hi: 'मिट्टी से खाकर वैसा ही बढ़ेगा', en: 'It grows the same, eating from soil' }, mis: { hi: 'मिट्टी-ही-भोजन वाली गलतफ़हमी', en: 'the soil-is-food misconception again' } },
          C: { text: { hi: 'वह रात में भोजन बना लेगा', en: 'It will make food at night instead' }, mis: { hi: 'प्रकाश को समय-सारणी समझा, शर्त नहीं', en: 'treats light as a timetable, not a requirement' } },
          D: { text: { hi: 'वह तुरंत सूख जाएगा', en: 'It dries up immediately' }, mis: { hi: 'धूप और पानी की भूमिका गड्डमड्ड', en: 'confuses the roles of light and water' } },
        },
      },
    ],
  },
  {
    key: 'tenses',
    match: ['काल', 'tense', 'भूतकाल', 'वर्तमान', 'past', 'present', 'grammar', 'व्याकरण'],
    label: { hi: 'काल (टेंस)', en: 'Tenses' },
    subject: { hi: 'अंग्रेज़ी', en: 'English' },
    gradeBand: '6–7',
    material: {
      hi: [
        'समय-रेखा बोर्ड पर खींचें: बीता कल — अभी — आने वाला कल। हर वाक्य को पहले रेखा पर रखवाएँ, फिर क्रिया चुनवाएँ।',
        'संकेत-शब्द सिखाएँ: yesterday/last → बीता समय; now → अभी; tomorrow/will → आगे। बच्चे क्रिया से नहीं, संकेत-शब्द से शुरू करें।',
        'आम जाल: “I have did” — have/has के बाद क्रिया का तीसरा रूप आता है। बोलकर गलत-सही दोनों सुनवाएँ।',
      ],
      en: [
        'Draw a timeline on the board: yesterday — now — tomorrow. Place each sentence on the line first, then choose the verb.',
        'Teach signal words: yesterday/last → past; now → present; tomorrow/will → future. Start from the signal word, not the verb.',
        'Common trap: “I have did” — after have/has comes the third form. Say both wrong and right aloud.',
      ],
    },
    questions: [
      {
        text: { hi: 'She ____ to school yesterday.', en: 'She ____ to school yesterday.' },
        options: {
          A: { text: { hi: 'went', en: 'went' }, correct: true },
          B: { text: { hi: 'goes', en: 'goes' }, mis: { hi: '“yesterday” का बीता-समय संकेत पकड़ा नहीं', en: 'misses the past-time signal in “yesterday”' } },
          C: { text: { hi: 'will go', en: 'will go' }, mis: { hi: '“कल” को आने वाला कल समझ लिया', en: 'reads “yesterday/kal” as the coming day' } },
          D: { text: { hi: 'going', en: 'going' }, mis: { hi: 'सहायक क्रिया (is/was) छोड़ दी', en: 'drops the helping verb entirely' } },
        },
      },
      {
        text: { hi: 'They ____ playing now.', en: 'They ____ playing now.' },
        options: {
          A: { text: { hi: 'are', en: 'are' }, correct: true },
          B: { text: { hi: 'is', en: 'is' }, mis: { hi: 'हर कर्ता के लिए एक ही सहायक क्रिया', en: 'uses one helper for every subject' } },
          C: { text: { hi: 'was', en: 'was' }, mis: { hi: '“now” के बावजूद बीते समय में चला गया', en: 'slips into past despite “now”' } },
          D: { text: { hi: 'be', en: 'be' }, mis: { hi: 'क्रिया का मूल रूप हर जगह लगाया', en: 'uses the base form everywhere' } },
        },
      },
      {
        text: { hi: 'I have ____ my homework.', en: 'I have ____ my homework.' },
        options: {
          A: { text: { hi: 'done', en: 'done' }, correct: true },
          B: { text: { hi: 'did', en: 'did' }, mis: { hi: 'have के बाद भी दूसरा रूप लगाया', en: 'uses the simple past form after “have”' } },
          C: { text: { hi: 'do', en: 'do' }, mis: { hi: 'have को अनदेखा कर मूल रूप लगाया', en: 'ignores “have” and uses the base form' } },
          D: { text: { hi: 'doing', en: 'doing' }, mis: { hi: 'have और am की बनावट गड्डमड्ड', en: 'mixes the “have” and “am …ing” patterns' } },
        },
      },
    ],
  },
];

/**
 * The bank is written in Hindi and English, because that is the pair the data
 * model guarantees everywhere. The other ten come from content-i18n.ts and are
 * folded in here, once, at load — so every reader of BANK (prep, check, the
 * child's screen, the seed) gets all twelve without knowing this happened.
 */
export const BANK: BankTopic[] = BANK_HI_EN.map((topic) => ({
  ...topic,
  label: localiseBi(topic.label),
  subject: localiseBi(topic.subject),
  material: localiseList(topic.material) as BiList,
  questions: topic.questions.map((q) => ({
    text: localiseBi(q.text),
    options: Object.fromEntries(
      (['A', 'B', 'C', 'D'] as const).map((k) => [
        k,
        {
          ...q.options[k],
          text: localiseBi(q.options[k].text),
          ...(q.options[k].mis ? { mis: localiseBi(q.options[k].mis!) } : {}),
        },
      ])
    ) as Question['options'],
  })),
}));

export function findBankTopic(input: string): BankTopic | null {
  const q = input.toLowerCase().trim();
  if (!q) return null;
  for (const topic of BANK) {
    if (topic.match.some((m) => q.includes(m.toLowerCase()))) return topic;
    if (q.includes(topic.label.hi.toLowerCase()) || q.includes(topic.label.en.toLowerCase())) return topic;
  }
  return null;
}
