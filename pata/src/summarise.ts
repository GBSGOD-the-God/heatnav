// Offline summariser.
//
// Reading a page back to someone who can already read is worthless — the
// useful thing is making a long page short. This does extractive
// summarisation entirely on the phone, in any of the 12 languages, with no
// network and no API key: split into sentences, score each one by how much of
// the page's own vocabulary it carries, keep the best few in their original
// order.
//
// Extractive, not generative: every sentence in the summary is a real
// sentence from the page. It cannot invent a fact that was not there, which
// matters when a child is studying from the result.

/** Sentence terminators: Latin, plus the Devanagari/Bengali/Gurmukhi/Odia
 *  danda and double danda used across Indic scripts. */
const SENTENCE_END = /(?<=[.!?।॥])\s+/u;

/** Common function words carry no topic signal. Small lists beat none. */
const STOP: Record<string, string> = {
  hi: 'का की के को में से है हैं था थे थी और या पर यह वह ये वे एक हो होता होती जो कि तो भी नहीं इस उस अपने लिए साथ जब तक कुछ सभी बहुत करने कर दिया गया रहा एवं तथा हुई हुए',
  en: 'the a an is are was were be been being of in on at to for and or but with as by from this that these those it its if then than so such can could will would has have had do does did not no we you they he she',
  mr: 'आहे आहेत होता होते ची चे च्या ला ने मध्ये आणि किंवा पण हा ही हे तो ती ते एक साठी वर पासून जो की तर नाही असे काही सर्व खूप करून',
  bn: 'এই সেই একটি এবং বা কিন্তু হয় হল ছিল করে থেকে জন্য সঙ্গে উপর মধ্যে না তার এর যে যা ও কে কি সব খুব করা হয়েছে',
  ta: 'அது இது ஒரு மற்றும் அல்லது ஆனால் இருந்து உள்ள என்று போன்ற மேலும் அந்த இந்த ஆகும் இருக்கும் என்ற ஒரே மிக எல்லா செய்ய',
  te: 'ఈ ఆ ఒక మరియు లేదా కానీ నుండి వరకు కోసం తో లో పై అని ఉంది ఉన్న అయిన కూడా చాలా అన్ని చేయు ఇది అది',
  kn: 'ಈ ಆ ಒಂದು ಮತ್ತು ಅಥವಾ ಆದರೆ ಇಂದ ವರೆಗೆ ಗಾಗಿ ಜೊತೆ ಒಳಗೆ ಮೇಲೆ ಎಂದು ಇದೆ ಇರುವ ಆಗಿ ಬಹಳ ಎಲ್ಲಾ ಇದು ಅದು',
  ml: 'ഈ ആ ഒരു ഒപ്പം അല്ലെങ്കിൽ എന്നാൽ നിന്ന് വരെ വേണ്ടി കൂടെ ഉള്ളിൽ മുകളിൽ എന്ന് ആണ് ഉള്ള ആയി വളരെ എല്ലാ ഇത് അത്',
  gu: 'આ તે એક અને અથવા પણ થી સુધી માટે સાથે માં પર છે હતું હતા જે કે નહીં કેટલાક બધા ખૂબ કરવા',
  or: 'ଏହି ସେହି ଗୋଟିଏ ଏବଂ କିମ୍ବା କିନ୍ତୁ ଠାରୁ ପର୍ଯ୍ୟନ୍ତ ପାଇଁ ସହିତ ଭିତରେ ଉପରେ ଅଟେ ଥିଲା ଯେ କି ନାହିଁ ସବୁ ବହୁତ କରିବା',
  pa: 'ਇਹ ਉਹ ਇੱਕ ਅਤੇ ਜਾਂ ਪਰ ਤੋਂ ਤੱਕ ਲਈ ਨਾਲ ਵਿੱਚ ਉੱਤੇ ਹੈ ਹਨ ਸੀ ਦਾ ਦੀ ਦੇ ਨੂੰ ਜੋ ਕਿ ਨਹੀਂ ਸਾਰੇ ਬਹੁਤ ਕਰਨ',
  as: 'এই সেই এটা আৰু বা কিন্তু পৰা লৈ বাবে সৈতে ভিতৰত ওপৰত হয় আছে আছিল যে কি নহয় সকলো বহুত কৰা',
};

function stopSet(lang: string): Set<string> {
  return new Set((STOP[lang] ?? STOP.en).split(/\s+/));
}

/** Unicode-aware word split — works for Devanagari, Tamil, Latin alike.
 *  \p{M} is essential, not optional: in every Indic script the vowel signs
 *  (ा ि ी ੁ ো …) are combining marks, not letters. Leave them out and अपना
 *  becomes अपन — which silently breaks both keywords and stopword matching. */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu) ?? []).filter((w) => w.length > 1);
}

function sentences(text: string): string[] {
  return text
    .split(SENTENCE_END)
    .map((s) => s.trim())
    .filter((s) => words(s).length >= 3);
}

export interface Summary {
  /** The chosen sentences, in the order they appear on the page. */
  sentences: string[];
  /** The page's most distinctive words — what it is "about". */
  keywords: string[];
  originalWords: number;
  summaryWords: number;
}

/**
 * Summarise page text offline.
 * @param text     the whole page
 * @param lang     app language code, for the stopword list
 * @param maxLines cap on sentences kept (default 3)
 */
export function summarise(text: string, lang: string, maxLines = 3): Summary {
  const stop = stopSet(lang);
  const sents = sentences(text);
  const allWords = words(text);

  if (sents.length === 0) {
    return { sentences: [], keywords: [], originalWords: allWords.length, summaryWords: 0 };
  }

  // How often each content word occurs — the page's own vocabulary.
  const freq = new Map<string, number>();
  for (const w of allWords) {
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const peak = Math.max(1, ...freq.values());

  const scored = sents.map((sentence, i) => {
    const ws = words(sentence).filter((w) => !stop.has(w));
    if (!ws.length) return { sentence, i, score: 0 };
    // Sum of normalised term weights, divided by sqrt(length) so a long
    // rambling sentence doesn't out-score a dense one.
    const weight = ws.reduce((sum, w) => sum + (freq.get(w) ?? 0) / peak, 0);
    let score = weight / Math.sqrt(ws.length);
    // A textbook page states its point early; the opening line usually is it.
    if (i === 0) score *= 1.6;
    else if (i === 1) score *= 1.2;
    // Sentences carrying a number are usually the worked example.
    if (/[\p{N}]/u.test(sentence)) score *= 1.15;
    return { sentence, i, score };
  });

  const keep = Math.max(1, Math.min(maxLines, Math.ceil(sents.length / 3)));
  const chosen = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, keep)
    .sort((a, b) => a.i - b.i); // back into reading order

  const keywords = [...freq.entries()]
    .filter(([w]) => w.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);

  const summaryWords = chosen.reduce((n, c) => n + words(c.sentence).length, 0);
  return {
    sentences: chosen.map((c) => c.sentence),
    keywords,
    originalWords: allWords.length,
    summaryWords,
  };
}
