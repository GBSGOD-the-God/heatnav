// Spoken numbers → digits.
//
// Android's speech recogniser returns Hindi numbers as WORDS: say "चौंतीस
// बच्चे उपस्थित" and you get exactly that back, not "34 बच्चे". A parser that
// only looks for /\d+/ therefore finds nothing and the form stays empty —
// which is why filling a report by voice used to take many attempts.
//
// Hindi 0–100 is irregular (every number has its own name, not a compound),
// so the table below is the only honest way to do it. Attendance, meals and
// check counts are all well under 100.

const HI: Record<string, number> = {
  'शून्य': 0, 'सिफ़र': 0, 'सिफर': 0,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5, 'छह': 6, 'छः': 6, 'छे': 6,
  'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15, 'पन्द्रह': 15, 'सोलह': 16,
  'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'बाइस': 22, 'तेईस': 23, 'तेइस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'छब्बीस': 26, 'सत्ताईस': 27, 'सताईस': 27, 'अट्ठाईस': 28, 'अठाईस': 28, 'उनतीस': 29, 'तीस': 30,
  'इकतीस': 31, 'इक्तीस': 31, 'बत्तीस': 32, 'तैंतीस': 33, 'तेंतीस': 33, 'चौंतीस': 34, 'चौतीस': 34,
  'पैंतीस': 35, 'पेंतीस': 35, 'छत्तीस': 36, 'सैंतीस': 37, 'सेंतीस': 37, 'अड़तीस': 38, 'अडतीस': 38,
  'उनतालीस': 39, 'चालीस': 40,
  'इकतालीस': 41, 'बयालीस': 42, 'बियालीस': 42, 'तैंतालीस': 43, 'तेंतालीस': 43, 'चवालीस': 44,
  'चौवालीस': 44, 'पैंतालीस': 45, 'पेंतालीस': 45, 'छियालीस': 46, 'सैंतालीस': 47, 'अड़तालीस': 48,
  'अडतालीस': 48, 'उनचास': 49, 'पचास': 50,
  'इक्यावन': 51, 'बावन': 52, 'तिरपन': 53, 'तिरेपन': 53, 'चौवन': 54, 'चउवन': 54, 'पचपन': 55,
  'छप्पन': 56, 'सत्तावन': 57, 'अट्ठावन': 58, 'अठावन': 58, 'उनसठ': 59, 'साठ': 60,
  'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'तिरेसठ': 63, 'चौंसठ': 64, 'चौसठ': 64, 'पैंसठ': 65,
  'पेंसठ': 65, 'छियासठ': 66, 'सड़सठ': 67, 'सडसठ': 67, 'अड़सठ': 68, 'अडसठ': 68, 'उनहत्तर': 69,
  'सत्तर': 70,
  'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73, 'चौहत्तर': 74, 'पचहत्तर': 75, 'छिहत्तर': 76,
  'सतहत्तर': 77, 'अठहत्तर': 78, 'उन्यासी': 79, 'उन्नासी': 79, 'अस्सी': 80,
  'इक्यासी': 81, 'बयासी': 82, 'तिरासी': 83, 'चौरासी': 84, 'पचासी': 85, 'छियासी': 86,
  'सत्तासी': 87, 'अट्ठासी': 88, 'अठासी': 88, 'नवासी': 89, 'नब्बे': 90, 'नब्बै': 90,
  'इक्यानवे': 91, 'बानवे': 92, 'तिरानवे': 93, 'चौरानवे': 94, 'पंचानवे': 95, 'पचानवे': 95,
  'छियानवे': 96, 'सत्तानवे': 97, 'अट्ठानवे': 98, 'अठानवे': 98, 'निन्यानवे': 99, 'सौ': 100,
};

const EN_UNITS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Devanagari digits → ASCII. Recognisers mix scripts freely. */
export function normaliseDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
}

export interface FoundNumber {
  value: number;
  /** Character offset in the normalised text, for "which word was this near". */
  at: number;
}

/**
 * Every number in the text, whether written as digits ("34"), as a Hindi word
 * ("चौंतीस"), or as English words ("thirty four" → 34, one number not two).
 */
export function findNumbers(raw: string): FoundNumber[] {
  const text = normaliseDigits(raw);
  const out: FoundNumber[] = [];

  for (const m of text.matchAll(/\d+/g)) {
    out.push({ value: parseInt(m[0], 10), at: m.index! });
  }

  // Word positions, so proximity matching still works on spoken numbers.
  const tokens: Array<{ word: string; at: number }> = [];
  for (const m of text.matchAll(/[\p{L}\p{M}]+/gu)) {
    tokens.push({ word: m[0].toLowerCase(), at: m.index! });
  }

  for (let i = 0; i < tokens.length; i++) {
    const { word, at } = tokens[i];

    if (HI[word] !== undefined) {
      out.push({ value: HI[word], at });
      continue;
    }
    if (EN_TENS[word] !== undefined) {
      // "thirty four" is one number; "thirty" alone is thirty.
      const next = tokens[i + 1]?.word ?? '';
      const unit = EN_UNITS[next];
      if (unit !== undefined && unit >= 1 && unit <= 9) {
        out.push({ value: EN_TENS[word] + unit, at });
        i++;
      } else {
        out.push({ value: EN_TENS[word], at });
      }
      continue;
    }
    if (EN_UNITS[word] !== undefined) {
      out.push({ value: EN_UNITS[word], at });
    }
  }

  return out.sort((a, b) => a.at - b.at);
}

/** The single number in a short utterance — for a per-field mic, where the
 *  teacher says just "चौंतीस" or "34". */
export function parseSingleNumber(raw: string): number | null {
  const found = findNumbers(raw);
  return found.length ? found[0].value : null;
}
