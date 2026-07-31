// Topic → lesson material + 3 diagnostic questions (spec §7.1).
// Bank topics get the curated set; anything else gets an honest, clearly
// labelled draft skeleton the teacher edits — every question still carries a
// full distractor→misconception map (§11).
import { findBankTopic } from './bank';
import { uid } from './db';
import type { Bi, Lesson, Question } from './types';

function draftQuestions(topic: string): Question[] {
  const tp: Bi = { hi: topic, en: topic };
  const opts = (
    correctHi: string,
    correctEn: string,
    wrong: Array<[string, string, string, string]> // [textHi, textEn, misHi, misEn]
  ): Question['options'] => ({
    A: { text: { hi: correctHi, en: correctEn }, correct: true },
    B: { text: { hi: wrong[0][0], en: wrong[0][1] }, mis: { hi: wrong[0][2], en: wrong[0][3] } },
    C: { text: { hi: wrong[1][0], en: wrong[1][1] }, mis: { hi: wrong[1][2], en: wrong[1][3] } },
    D: { text: { hi: wrong[2][0], en: wrong[2][1] }, mis: { hi: wrong[2][2], en: wrong[2][3] } },
  });
  return [
    {
      text: {
        hi: `“${tp.hi}” का सबसे ज़रूरी विचार कौन-सा है? (मसौदा — बदलें)`,
        en: `What is the key idea of “${tp.en}”? (draft — edit)`,
      },
      options: opts('सही उत्तर यहाँ लिखें', 'Write the correct answer here', [
        ['मिलता-जुलता पर गलत तथ्य', 'A related but wrong fact', 'पास की बात को ही मुख्य विचार मान लेता है', 'mistakes a nearby fact for the key idea'],
        ['उल्टा रिश्ता', 'The relationship reversed', 'रिश्ते को उल्टा समझता है', 'reverses the relationship'],
        ['पिछले पाठ का उत्तर', 'Last lesson’s answer', 'पिछले पाठ से उलझन', 'confuses it with the previous lesson'],
      ]),
    },
    {
      text: {
        hi: `“${tp.hi}” का एक उदाहरण हल कराएँ (मसौदा — बदलें)`,
        en: `Work one example of “${tp.en}” (draft — edit)`,
      },
      options: opts('सही हल', 'The correct answer', [
        ['एक कदम छूटा', 'One step skipped', 'तरीक़े का एक कदम छोड़ देता है', 'skips one step of the method'],
        ['उल्टी क्रिया', 'The opposite operation', 'उल्टी क्रिया लगा देता है', 'applies the opposite operation'],
        ['नियम आधा याद', 'A half-remembered rule', 'नियम आधा याद है', 'applies a half-remembered rule'],
      ]),
    },
    {
      text: {
        hi: `“${tp.hi}” कहाँ काम आता है? (मसौदा — बदलें)`,
        en: `Where is “${tp.en}” used? (draft — edit)`,
      },
      options: opts('सही उपयोग', 'The correct use', [
        ['शब्द मिलता है, बात नहीं', 'Similar word, different thing', 'मिलते-जुलते शब्द से उलझन', 'confuses a similar-sounding term'],
        ['बहुत ही संकरा उदाहरण', 'Only one narrow case', 'विचार को एक ही उदाहरण तक सीमित समझता है', 'thinks the idea only applies to one case'],
        ['कहीं नहीं', 'Nowhere', 'विचार को केवल किताबी मानता है', 'sees the idea as book-only'],
      ]),
    },
  ];
}

export function generateLesson(topicInput: string): Lesson {
  const bank = findBankTopic(topicInput);
  if (bank) {
    return {
      id: uid(),
      topicKey: bank.key,
      topicLabel: bank.label,
      subject: bank.subject,
      gradeBand: bank.gradeBand,
      material: bank.material,
      // deep copy so the teacher's edits never mutate the bank
      questions: JSON.parse(JSON.stringify(bank.questions)),
      source: 'bank',
      createdAt: Date.now(),
    };
  }
  const topic = topicInput.trim();
  return {
    id: uid(),
    topicKey: 'draft-' + topic.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
    topicLabel: { hi: topic, en: topic },
    subject: { hi: 'विषय', en: 'Subject' },
    gradeBand: '—',
    material: {
      hi: [
        `“${topic}” के लिए मसौदा: पाठ को एक सवाल से खोलें जिसका जवाब बच्चे गलत देंगे — वही आज की गलतफ़हमी है।`,
        'एक उदाहरण बोर्ड पर सही कराएँ, फिर वही उदाहरण जान-बूझकर गलत करके पूछें: गलती कहाँ है?',
        'नीचे के तीनों प्रश्नों में सही उत्तर और गलत विकल्प अपने पाठ के अनुसार भरें — हर गलत विकल्प एक खास गलतफ़हमी पकड़े।',
      ],
      en: [
        `Draft for “${topic}”: open with a question the children will answer wrongly — that is today's misconception.`,
        'Work one example correctly on the board, then do it deliberately wrong and ask: where is the mistake?',
        'Fill the three questions below for your lesson — make each wrong option catch one specific misconception.',
      ],
    },
    questions: draftQuestions(topic),
    source: 'draft',
    createdAt: Date.now(),
  };
}
