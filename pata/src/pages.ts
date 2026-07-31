// Sample "photographed pages" for the Home screen (§7.2). In the demo, OCR is
// pre-prepared for these pages and that is said on screen (§12). The page
// image never contains a person — it is a page of a book.
import type { Bi } from './types';

export interface Concept {
  id: string;
  label: Bi;
  /** Keywords (lowercased) for the tolerant explain-it-back judge (§7.3). */
  keywords: string[];
  /** One distractor concept shown in the tap-fallback that is NOT on the page. */
  wrong?: boolean;
}

export interface SamplePage {
  id: string;
  title: Bi;
  bookLine: Bi;
  /** Lines rendered to look like the photographed page. */
  pageLines: Bi[];
  /** The simplified explanation, always shown as text AND read as audio. */
  explanation: Bi;
  concepts: Concept[];
}

export const SAMPLE_PAGES: SamplePage[] = [
  {
    id: 'page-sub',
    title: { hi: 'घटाव — हासिल लेना', en: 'Subtraction — borrowing' },
    bookLine: { hi: 'गणित, कक्षा 5 · पृष्ठ 34', en: 'Maths, Class 5 · page 34' },
    pageLines: [
      { hi: '42 − 17 को हल कीजिए।', en: 'Solve 42 − 17.' },
      { hi: 'इकाई के स्तंभ में 2 में से 7 नहीं घट सकता।', en: 'In the ones column, 7 cannot be taken from 2.' },
      { hi: 'दहाई से 1 हासिल लेकर 2 को 12 बनाइए।', en: 'Borrow 1 ten to make the 2 into 12.' },
      { hi: 'अब दहाई में 4 के स्थान पर 3 रह जाता है।', en: 'The 4 in the tens is now 3.' },
      { hi: '12 − 7 = 5 और 3 − 1 = 2, अतः उत्तर 25।', en: '12 − 7 = 5 and 3 − 1 = 2, so the answer is 25.' },
    ],
    explanation: {
      hi: 'सोचो तुम्हारे पास 4 गड्डियाँ हैं दस-दस रुपये की, और 2 रुपये खुले। किसी को 7 रुपये देने हैं, पर खुले सिर्फ 2 हैं। तो एक गड्डी खोल लो — अब खुले 12 रुपये हो गए, और गड्डियाँ 3 रह गईं। यही “हासिल लेना” है। 12 में से 7 गए तो 5 बचे, 3 गड्डियों में से 1 गई तो 2 बचीं। जवाब: 25। सबसे ज़रूरी बात — गड्डी खोली है तो गिनती में 4 नहीं, 3 गड्डियाँ ही बचती हैं। यही बात बच्चे सबसे ज़्यादा भूलते हैं।',
      en: 'Imagine you have 4 bundles of ten rupees and 2 loose rupees. You must give 7 rupees, but you only have 2 loose. So open one bundle — now you have 12 loose rupees, and only 3 bundles left. That is “borrowing”. 12 minus 7 leaves 5, and 3 bundles minus 1 leaves 2. Answer: 25. The most important part — once you open a bundle, you count 3 bundles, not 4. That is exactly what children forget most.',
    },
    concepts: [
      { id: 'c1', label: { hi: 'इकाई में छोटे अंक से बड़ा नहीं घटता, इसलिए हासिल लेते हैं', en: 'When the top digit is smaller, we borrow' }, keywords: ['हासिल', 'borrow', 'उधार', 'गड्डी', 'bundle', 'ten'] },
      { id: 'c2', label: { hi: 'हासिल लेने पर दहाई एक कम हो जाती है', en: 'After borrowing, the tens digit goes down by one' }, keywords: ['कम', 'घट', '3', 'तीन', 'decrement', 'one less', 'less'] },
      { id: 'c3', label: { hi: 'हासिल लेने पर हमेशा जोड़ते हैं 10', en: 'Borrowing means adding 10 to the answer' }, keywords: [], wrong: true },
    ],
  },
  {
    id: 'page-photo',
    title: { hi: 'पौधे भोजन कैसे बनाते हैं', en: 'How plants make food' },
    bookLine: { hi: 'विज्ञान, कक्षा 7 · पृष्ठ 12', en: 'Science, Class 7 · page 12' },
    pageLines: [
      { hi: 'हरे पौधे अपना भोजन स्वयं बनाते हैं।', en: 'Green plants make their own food.' },
      { hi: 'यह क्रिया पत्तियों में होती है और प्रकाश संश्लेषण कहलाती है।', en: 'This happens in the leaves and is called photosynthesis.' },
      { hi: 'इसके लिए सूर्य का प्रकाश, हवा की कार्बन डाइऑक्साइड और जड़ों से आया पानी चाहिए।', en: 'It needs sunlight, carbon dioxide from the air, and water from the roots.' },
      { hi: 'मिट्टी से पौधे को खनिज मिलते हैं, बना-बनाया भोजन नहीं।', en: 'Soil gives the plant minerals, not ready-made food.' },
    ],
    explanation: {
      hi: 'पत्ती पौधे की रसोई है। रसोई में तीन चीज़ें आती हैं — ऊपर से धूप, हवा से कार्बन डाइऑक्साइड नाम की गैस, और जड़ों से पानी। इन तीनों से पत्ती खाना बनाती है। ध्यान रखो — मिट्टी से खाना नहीं आता! मिट्टी से सिर्फ पानी और नमक जैसे खनिज आते हैं, जैसे रसोई में मसाले आते हैं। खाना तो पत्ती ही बनाती है, और बिना धूप के रसोई बंद।',
      en: 'The leaf is the plant’s kitchen. Three things come into this kitchen — sunlight from above, a gas called carbon dioxide from the air, and water from the roots. From these three, the leaf cooks the food. Remember — food does not come from the soil! Soil only sends water and minerals, like spices to a kitchen. The leaf does the cooking, and without sunlight the kitchen is closed.',
    },
    concepts: [
      { id: 'c1', label: { hi: 'भोजन पत्ती में बनता है, धूप से', en: 'Food is made in the leaf, using sunlight' }, keywords: ['पत्ती', 'leaf', 'धूप', 'sunlight', 'सूरज', 'रसोई', 'kitchen', 'sun'] },
      { id: 'c2', label: { hi: 'मिट्टी से खनिज आते हैं, बना-बनाया खाना नहीं', en: 'Soil gives minerals, not ready-made food' }, keywords: ['मिट्टी', 'soil', 'खनिज', 'mineral', 'नमक', 'मसाले', 'spices'] },
      { id: 'c3', label: { hi: 'पौधा रात में मिट्टी से खाना खाता है', en: 'The plant eats soil food at night' }, keywords: [], wrong: true },
    ],
  },
];
