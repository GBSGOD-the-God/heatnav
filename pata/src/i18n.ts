// UI strings — Hindi default, English toggle. Student-side content carries its
// own language handling; this table is the teacher-facing shell.
import type { Bi, Lang } from './types';

let current: Lang = 'hi';
export function setLang(l: Lang): void {
  current = l;
  document.documentElement.lang = l;
}
export function getLang(): Lang {
  return current;
}
export function bi(b: Bi): string {
  return b[current];
}

const S: Record<string, Bi> = {
  appName: { hi: 'पता', en: 'PATA' },
  tagline: {
    hi: '20 सेकंड में पता — किसे समझ आया, और बाकियों ने क्या गलत समझा।',
    en: '20 seconds to know who understood — and what the rest got wrong.',
  },
  sampleBadge: { hi: 'नमूना कक्षा — काल्पनिक डेटा', en: 'Sample class — fictional data' },

  navPrep: { hi: 'तैयारी', en: 'Prep' },
  navCheck: { hi: 'जाँच', en: 'Check' },
  navInsight: { hi: 'झलक', en: 'Insight' },
  navReport: { hi: 'रिपोर्ट', en: 'Report' },
  navHome: { hi: 'घर', en: 'Home' },

  // Prep
  prepTitle: { hi: 'कल का पाठ', en: "Tomorrow's lesson" },
  prepHint: { hi: 'विषय लिखें या बोलें — सामग्री और 3 जाँच-प्रश्न तैयार मिलेंगे', en: 'Type or speak the topic — get material and 3 check questions' },
  prepPlaceholder: { hi: 'जैसे: हासिल वाला घटाव', en: 'e.g. subtraction with borrowing' },
  prepGenerate: { hi: 'तैयार करें', en: 'Draft it' },
  prepSpeak: { hi: 'बोलें', en: 'Speak' },
  prepListening: { hi: 'सुन रहा है… या नीचे लिखें', en: 'Listening… or type below' },
  prepQuickPick: { hi: 'या एक विषय चुनें', en: 'Or pick a topic' },
  prepMaterial: { hi: 'पढ़ाने की सामग्री', en: 'Teaching material' },
  prepQuestions: { hi: 'जाँच-प्रश्न (3)', en: 'Check questions (3)' },
  prepEditHint: { hi: 'किसी भी प्रश्न को छूकर बदलें', en: 'Tap any question to edit it' },
  prepDraftNote: {
    hi: 'यह एक मसौदा है — अपने पाठ के अनुसार प्रश्न बदलें।',
    en: 'This is a draft — edit the questions to fit your lesson.',
  },
  prepStartCheck: { hi: 'कक्षा में जाँच शुरू करें', en: 'Start the check in class' },
  prepSaved: { hi: 'पाठ सहेजा गया', en: 'Lesson saved' },
  prepRecent: { hi: 'पिछले पाठ', en: 'Recent lessons' },
  misLabel: { hi: 'गलतफ़हमी', en: 'Misconception' },
  correctLabel: { hi: 'सही', en: 'Correct' },

  // Check
  checkTitle: { hi: 'जाँच', en: 'Check' },
  checkNoLesson: { hi: 'पहले “तैयारी” में एक पाठ बनाएँ', en: 'First draft a lesson in Prep' },
  checkPickQuestion: { hi: 'प्रश्न चुनें', en: 'Pick a question' },
  checkReadAloud: { hi: 'प्रश्न पढ़कर सुनाएँ — बच्चे हाथ से A/B/C/D दिखाएँ', en: 'Read the question aloud — children answer A/B/C/D by hand' },
  checkTapSmaller: { hi: 'छोटे समूह को छूएँ', en: 'Tap the smaller group' },
  checkMarkingUnderstood: { hi: 'छू रहे हैं: जिन्हें समझ आया', en: 'Tapping: those who understood' },
  checkMarkingNot: { hi: 'छू रहे हैं: जिन्हें नहीं समझ आया', en: 'Tapping: those who did not' },
  checkFlip: { hi: 'उल्टा चिह्नित करें', en: 'Mark the other group' },
  checkConfirm: { hi: 'पक्का करें', en: 'Confirm' },
  checkWrongPick: { hi: 'गलत उत्तरों में सबसे ज़्यादा कौन-सा चला?', en: 'Which wrong answer was most common?' },
  checkSkip: { hi: 'छोड़ें', en: 'Skip' },
  checkSeconds: { hi: 'सेकंड', en: 'sec' },
  understoodShort: { hi: 'समझे', en: 'got it' },
  notUnderstoodShort: { hi: 'नहीं समझे', en: "didn't" },

  // Result
  resultTitle: { hi: 'नतीजा', en: 'Result' },
  resultUnderstood: { hi: 'समझ गए', en: 'understood' },
  resultNot: { hi: 'नहीं समझे', en: 'did not' },
  resultMisIntro: { hi: 'ज़्यादातर की गलती:', en: 'Most of them:' },
  resultNoMis: { hi: 'गलत विकल्प दर्ज नहीं किया गया', en: 'Wrong option not captured' },
  resultWho: { hi: 'जिन्हें नहीं समझ आया', en: 'Who did not get it' },
  resultCaptured: { hi: 'जाँच में लगा समय', en: 'Check took' },
  actPair: { hi: 'जोड़ी बनाएँ', en: 'Pair them' },
  actPairSub: { hi: 'समझने वाले सिखाएँ — बिना किसी डिवाइस के', en: 'The ones who got it teach — no devices' },
  actHome: { hi: 'घर भेजें', en: 'Send home' },
  actHomeSub: { hi: 'यही पन्ना, उनकी भाषा में, इन्हीं बच्चों के लिए', en: 'This page, their language, these children' },
  actReteach: { hi: 'फिर पढ़ाएँ', en: 'Reteach' },
  actReteachSub: { hi: 'कल के लिए चिह्नित, गलतफ़हमी के नाम के साथ', en: 'Flagged for tomorrow, misconception named' },
  actDone: { hi: 'दर्ज हो गया', en: 'Logged' },
  pairTitle: { hi: 'जोड़ियाँ', en: 'Pairs' },
  pairTeaches: { hi: 'सिखाएगा/सिखाएगी', en: 'teaches' },
  homeQueued: { hi: 'पन्ना इन बच्चों के परिवार-फ़ोन के लिए कतार में है (नमूना)', en: 'Page queued for these children’s family phones (sample)' },
  reteachQueued: { hi: 'कल की तैयारी में सबसे ऊपर दिखेगा', en: 'Will appear on top of tomorrow’s prep' },

  // Home (student side)
  homeTitle: { hi: 'घर पर', en: 'At home' },
  homeIntro: { hi: 'पन्ने की फोटो लें — समझाया जाएगा, आपकी भाषा में', en: 'Photograph the page — it will be explained, in your language' },
  homePhoto: { hi: 'पन्ने की फोटो लें', en: 'Photograph a page' },
  homeSamplePages: { hi: 'या नमूना पन्ना चुनें', en: 'Or pick a sample page' },
  homeSimNote: {
    hi: 'डेमो: पन्ना-पहचान (OCR) नमूना पन्नों पर पहले से तैयार है।',
    en: 'Demo: page recognition (OCR) is pre-prepared for the sample pages.',
  },
  homeLangLabel: { hi: 'भाषा', en: 'Language' },
  homeListen: { hi: 'सुनें', en: 'Listen' },
  homeStop: { hi: 'रोकें', en: 'Stop' },
  homeExplainBack: { hi: 'अब आप समझाइए', en: 'Now you explain it back' },
  homeExplainHint: { hi: 'बोलकर समझाएँ, या नीचे छूकर बताएँ', en: 'Explain by speaking, or answer by tapping below' },
  homeSpeakBtn: { hi: 'बोलकर समझाएँ', en: 'Explain by voice' },
  homeTapBtn: { hi: 'छूकर बताएँ', en: 'Answer by tapping' },
  homeTapQ: { hi: 'आपकी समझ में इनमें से क्या-क्या आया? सब सही छूएँ।', en: 'Which of these did you understand? Tap all that are right.' },
  homeJudgeGood: { hi: 'बहुत बढ़िया — मुख्य बातें आ गईं!', en: 'Well done — the key ideas are there!' },
  homeJudgePartial: { hi: 'अच्छी शुरुआत — एक बात छूट गई:', en: 'Good start — one thing is missing:' },
  homeJudgeFlag: { hi: 'कोई बात नहीं — शिक्षिका को बता दिया गया है', en: 'No problem — your teacher has been told' },
  homeFlagBtn: { hi: 'शिक्षिका के लिए चिह्नित करें', en: 'Flag for the teacher' },
  homeVoiceUnavailable: { hi: 'आवाज़ उपलब्ध नहीं — छूकर बताएँ', en: 'Voice unavailable — answer by tapping' },
  homeCheckAnswers: { hi: 'जाँचें', en: 'Check' },
  homeLangDemoNote: {
    hi: 'डेमो में पूरी सामग्री हिन्दी और अंग्रेज़ी में है; बाकी 10 भाषाएँ सूचीबद्ध हैं।',
    en: 'Demo content is complete in Hindi and English; the other 10 languages are listed.',
  },

  // Report
  reportTitle: { hi: 'आज की रिपोर्ट', en: "Today's report" },
  reportHint: { hi: 'बोलिए — फ़ॉर्म खुद भर जाएगा। जमा आप ही करेंगी।', en: 'Speak — the form drafts itself. You review and submit.' },
  reportFreeTitle: { hi: 'और कोई रिपोर्ट लिखनी है?', en: 'Need to write another report?' },
  reportFreeHint: {
    hi: 'ऊपर वाला फ़ॉर्म रोज़ के आँकड़ों के लिए है। इसके अलावा कुछ भी — घटना, माँग, BRC को पत्र — यहाँ लिखकर PDF बनाकर भेजें।',
    en: 'The form above is for the daily counts. Anything else — an incident, a request, a letter to the BRC — write it here and send it as a PDF.',
  },
  reportFreeOpen: { hi: 'खुली रिपोर्ट लिखें', en: 'Write a free report' },
  reportSpeakAll: { hi: 'पूरा वाक्य बोलें', en: 'Speak the whole sentence' },
  reportFieldMicHint: {
    hi: 'सबसे आसान: किसी खाने के 🎤 को छूकर सिर्फ़ वही संख्या बोलें — जैसे “चौंतीस”। पूरा वाक्य बोलना ज़रूरी नहीं।',
    en: 'Easiest: tap the 🎤 next to a box and say just that number — like “thirty four”. You do not have to speak a whole sentence.',
  },
  reportNoNumber: {
    hi: 'कोई संख्या नहीं पकड़ी गई — फिर बोलें या हाथ से भरें',
    en: 'No number caught — say it again or type it',
  },
  reportSpeak: { hi: 'बोलकर भरें', en: 'Fill by voice' },
  reportDemoFill: { hi: 'नमूना वाक्य से भरें', en: 'Fill from a sample sentence' },
  reportSimNote: { hi: 'डेमो: आवाज़ न मिलने पर नमूना वाक्य से भरा जाता है — यह सिमुलेशन है।', en: 'Demo: without voice input a sample sentence is used — this is simulated.' },
  reportHeard: { hi: 'सुना गया:', en: 'Heard:' },
  reportPresent: { hi: 'आज उपस्थित (संख्या)', en: 'Present today (count)' },
  reportMeals: { hi: 'भोजन परोसे गए', en: 'Meals served' },
  reportChecks: { hi: 'जाँचें पूरी हुईं', en: 'Checks completed' },
  reportTopics: { hi: 'आज के विषय', en: 'Topics taught' },
  reportNotes: { hi: 'टिप्पणी', en: 'Notes' },
  reportSubmit: { hi: 'जाँचकर जमा करें', en: 'Review & submit' },
  reportSubmitted: { hi: 'रिपोर्ट जमा हो गई', en: 'Report submitted' },
  reportPast: { hi: 'पिछली रिपोर्टें', en: 'Past reports' },
  reportNeverAuto: { hi: 'कभी अपने-आप जमा नहीं होती', en: 'Never auto-submitted' },

  // Insight
  insightTitle: { hi: 'झलक', en: 'Insight' },
  insightSub: { hi: 'क्या चीज़ बच्चों को उलझा रही है — विषयवार', en: 'What is actually confusing children — by topic' },
  insightClass: { hi: 'कक्षा', en: 'Class' },
  insightSchool: { hi: 'विद्यालय', en: 'School' },
  insightDistrict: { hi: 'ज़िला', en: 'District' },
  insightConfused: { hi: 'उलझे', en: 'confused' },
  insightChecks: { hi: 'जाँचें', en: 'checks' },
  insightTopMis: { hi: 'सबसे आम गलतफ़हमी', en: 'Most common misconception' },
  insightNoData: { hi: 'अभी कोई जाँच नहीं — पहली जाँच के बाद यहाँ झलक दिखेगी', en: 'No checks yet — insight appears after your first check' },
  insightPrivacy: {
    hi: 'यह रिपोर्ट विषयों के बारे में है, लोगों के बारे में नहीं। इसमें किसी शिक्षक का नाम या पहचान नहीं है।',
    en: 'This report is about content, not people. It contains no teacher name or identity.',
  },
  insightAggNote: { hi: 'विद्यालय/ज़िला स्तर: नमूना डेटा', en: 'School/district level: sample data' },
  insightActions: { hi: 'नतीजे के बाद क्या चुना गया (§9 लॉग)', en: 'What was chosen after results (§9 log)' },

  // Roster / settings
  rosterTitle: { hi: 'कक्षा-पंजी', en: 'Class register' },
  rosterHint: { hi: 'एक पंक्ति में एक नाम — 38 नाम ≈ 3 मिनट', en: 'One name per line — 38 names ≈ 3 minutes' },
  rosterSave: { hi: 'पंजी सहेजें', en: 'Save register' },
  rosterSaved: { hi: 'पंजी सहेजी गई', en: 'Register saved' },
  rosterCount: { hi: 'बच्चे', en: 'children' },
  settingsLang: { hi: 'भाषा / Language', en: 'Language / भाषा' },
  grade: { hi: 'कक्षा', en: 'Grade' },
  back: { hi: 'वापस', en: 'Back' },

  // AI settings & states
  settingsTitle: { hi: 'सेटिंग', en: 'Settings' },
  aiTitle: { hi: 'AI (Claude)', en: 'AI (Claude)' },
  aiIntro: {
    hi: 'यह हिस्सा ज़िला या संस्था के लिए है, शिक्षिका के लिए नहीं। यहाँ कोई कुंजी नहीं डाली जाती — सिर्फ उस सर्वर का पता, जिस पर कुंजी रखी है (देखें server/)। सर्वर जुड़ा हो तो किसी भी विषय पर सामग्री और बेहतर व्याख्या मिलती है। बिना सर्वर के भी ऐप का हर काम पूरा चलता है।',
    en: 'This section is for a district or organisation, not for the teacher. No key is entered here — only the address of the server that holds one (see server/). With a server connected you get material for any topic and richer explanations. Everything in the app works fully without one.',
  },
  setServerLabel: { hi: 'AI सर्वर का पता', en: 'AI server address' },
  setServerEmpty: { hi: 'खाली — ज़रूरी नहीं', en: 'Empty — not required' },
  setServerHint: {
    hi: 'जैसे https://pata-ai.आपका-नाम.workers.dev — कुंजी कभी इस फ़ोन पर नहीं आती',
    en: 'e.g. https://pata-ai.your-name.workers.dev — the key never reaches this phone',
  },
  setTest: { hi: 'जाँचें', en: 'Test' },
  setChecking: { hi: 'जाँच रहे हैं…', en: 'Checking…' },
  setAiOk: { hi: '● सर्वर जुड़ा है', en: '● Server connected' },
  setAiNoKey: { hi: '● सर्वर मिला, पर उस पर कुंजी नहीं लगी', en: '● Server reached, but it has no key set' },
  setAiUnreachable: { hi: '● सर्वर तक नहीं पहुँच सके', en: '● Could not reach the server' },
  setAiUnset: { hi: '● कोई सर्वर नहीं — ऐप फ़ोन पर ही चल रहा है', en: '● No server — the app is running on the phone alone' },
  setNoAccountTitle: { hi: 'कुछ भी सेट करने की ज़रूरत नहीं', en: 'Nothing to set up' },
  setNoAccount: {
    hi: 'PATA को न खाता चाहिए, न पासवर्ड, न इंटरनेट। पन्ना पढ़ना, छोटा करके बताना, जाँच, बोलना-सुनना और रिपोर्ट — सब इसी फ़ोन पर, बिना नेटवर्क के चलता है।',
    en: 'PATA needs no account, no password and no internet. Reading a page, summarising it, checks, voice and reports all run on this phone with the network off.',
  },
  setVoiceTitle: { hi: 'आवाज़ काम नहीं कर रही?', en: 'Voice not working?' },
  setVoiceHelp: {
    hi: 'बोलना-सुनना फ़ोन की अपनी भाषा-आवाज़ों से चलता है। फ़ोन की सेटिंग → भाषा → टेक्स्ट-टू-स्पीच में अपनी भाषा डाउनलोड करें; एक बार डाउनलोड होने पर यह बिना इंटरनेट के भी चलेगा। न चले तो हर जगह छूकर जवाब देने का रास्ता खुला रहता है।',
    en: 'Voice uses the phone\'s own language packs. In the phone\'s Settings → Language → Text-to-speech, download your language; once downloaded it works without internet. If it still fails, every voice step has a tap alternative.',
  },
  setAdvanced: { hi: 'उन्नत (वैकल्पिक)', en: 'Advanced (optional)' },
  aiErrTimeout: { hi: 'AI से जवाब आने में बहुत देर लगी', en: 'The AI took too long to answer' },
  aiOn: { hi: 'AI चालू है (वैकल्पिक)', en: 'AI is on (optional)' },
  aiOff: { hi: 'ऐप के भीतर के प्रश्न-बैंक से चल रहा है', en: 'Running on the built-in question bank' },
  aiSaved: { hi: 'कुंजी सहेजी गई', en: 'Key saved' },
  aiGenerating: { hi: 'AI तैयार कर रहा है…', en: 'AI is drafting…' },
  aiReading: { hi: 'AI पन्ना पढ़ रहा है…', en: 'AI is reading the page…' },
  aiJudging: { hi: 'AI सुन रहा है…', en: 'AI is listening…' },
  aiSourceTag: { hi: 'AI से बना', en: 'AI-generated' },
  bankSourceTag: { hi: 'ऑफ़लाइन बैंक से', en: 'From offline bank' },
  aiErrBadKey: { hi: 'API कुंजी गलत है — सेटिंग में जाँचें', en: 'API key is invalid — check Settings' },
  aiErrRate: { hi: 'अभी बहुत अनुरोध हैं — थोड़ी देर में फिर कोशिश करें', en: 'Too many requests — try again shortly' },
  aiErrOffline: { hi: 'इंटरनेट नहीं मिला — ऑफ़लाइन बैंक से काम जारी', en: 'No internet — continuing from the offline bank' },
  aiErrRefused: { hi: 'AI ने यह अनुरोध अस्वीकार किया', en: 'The AI declined this request' },
  aiErrGeneric: { hi: 'AI से जवाब नहीं मिला — फिर कोशिश करें', en: 'No answer from the AI — try again' },
  ttsVoiceNote: {
    hi: 'आवाज़ में सुनना फ़ोन में उपलब्ध भाषा-आवाज़ों पर निर्भर है (सेटिंग → टेक्स्ट-टू-स्पीच)।',
    en: 'Audio depends on the voices installed on the phone (Settings → Text-to-speech).',
  },
  reportShare: { hi: 'भेजें (WhatsApp/SMS)', en: 'Share (WhatsApp/SMS)' },
  reportShareHint: { hi: 'रिपोर्ट प्रधानाध्यापक/CRC को किसी भी ऐप से भेजें', en: 'Send the report to the head teacher/CRC via any app' },
  close: { hi: 'बंद करें', en: 'Close' },
  save: { hi: 'सहेजें', en: 'Save' },
  cancel: { hi: 'रद्द करें', en: 'Cancel' },
  voiceFallbackNote: { hi: 'आवाज़ न चले तो लिखना हमेशा चलेगा', en: 'If voice fails, typing always works' },
};

export function t(key: string): string {
  const row = S[key];
  if (!row) return key;
  return row[current];
}
