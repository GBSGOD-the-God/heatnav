/// Hindi (हिन्दी) translations, keyed by the English source string.
///
/// Only non-English values live here; any English string without an entry
/// falls back to itself (see [AppLocalizations]). Medical and emergency
/// wording is translated to preserve the original clinical meaning.
const Map<String, String> hindiStrings = {
  // --- App-wide / navigation -------------------------------------------
  'Today': 'आज',
  'Plans': 'योजनाएँ',
  'Map': 'नक्शा',
  'Community': 'समुदाय',
  'Profile': 'प्रोफ़ाइल',
  'Continue': 'आगे बढ़ें',
  'Back': 'वापस',
  'Cancel': 'रद्द करें',
  'Delete': 'हटाएँ',
  'Reset': 'रीसेट',
  'Save': 'सहेजें',
  'Skip for now': 'अभी छोड़ें',

  // --- Language step ----------------------------------------------------
  'Choose your language': 'अपनी भाषा चुनें',
  'You can change this anytime from your profile.':
      'आप इसे कभी भी अपनी प्रोफ़ाइल से बदल सकते हैं।',
  'Get started': 'शुरू करें',

  // --- Onboarding: welcome ---------------------------------------------
  'Heat is the deadliest\nweather there is.':
      'गर्मी सबसे घातक\nमौसम है।',
  'Weather apps report conditions': 'मौसम ऐप हालात बताते हैं',
  '"It\'s 43°C" tells everyone the same thing.':
      '"43°C है" सबको एक ही बात बताता है।',
  'Every answer is explainable': 'हर सलाह की वजह बताई जाती है',
  'A few quick questions build your personal heat profile. '
          'Health answers are optional and never leave this device.':
      'कुछ छोटे सवाल आपकी निजी हीट प्रोफ़ाइल बनाते हैं। स्वास्थ्य से जुड़े '
          'जवाब वैकल्पिक हैं और कभी इस डिवाइस से बाहर नहीं जाते।',

  // --- Onboarding: location --------------------------------------------
  'Where do you live?': 'आप कहाँ रहते हैं?',
  'Use my current location': 'मेरी मौजूदा लोकेशन इस्तेमाल करें',
  'Locating…': 'लोकेशन ढूँढ़ रहे हैं…',
  'Search any city, area or address':
      'कोई भी शहर, इलाका या पता खोजें',
  'Quick picks': 'त्वरित विकल्प',
  'Set location': 'लोकेशन सेट करें',

  // --- Onboarding: about you -------------------------------------------
  'About you': 'आपके बारे में',
  'Your name (optional)': 'आपका नाम (वैकल्पिक)',
  'Age group': 'आयु वर्ग',
  'Occupation': 'व्यवसाय',
  'Hours outdoors on a typical day': 'आम दिन में बाहर बिताए घंटे',
  'How do you usually get around?': 'आप आमतौर पर कैसे आते-जाते हैं?',

  // --- Onboarding: health ----------------------------------------------
  'Health factors': 'स्वास्थ्य कारक',
  'Stored only on this device. Never uploaded, never shared.':
      'सिर्फ़ इस डिवाइस पर सहेजा जाता है। कभी अपलोड या साझा नहीं होता।',

  // --- Onboarding: home ------------------------------------------------
  'Your home': 'आपका घर',
  'Home type': 'घर का प्रकार',
  'Cooling available': 'उपलब्ध ठंडक',
  'Power cuts in your area': 'आपके इलाके में बिजली कटौती',
  'Build my heat profile': 'मेरी हीट प्रोफ़ाइल बनाएँ',

  // --- Enum: age group -------------------------------------------------
  'Under 13': '13 से कम',
  '65+': '65+',

  // --- Enum: occupation ------------------------------------------------
  'Student': 'विद्यार्थी',
  'Office worker': 'ऑफ़िस कर्मचारी',
  'Delivery rider': 'डिलीवरी राइडर',
  'Construction worker': 'निर्माण मज़दूर',
  'Farmer': 'किसान',
  'Traffic police': 'ट्रैफ़िक पुलिस',
  'Street vendor': 'फेरीवाला',
  'Homemaker': 'गृहिणी',
  'Retired': 'सेवानिवृत्त',
  'Other': 'अन्य',

  // --- Enum: outdoor hours ---------------------------------------------
  'Under 1 hour': '1 घंटे से कम',
  '1–3 hours': '1–3 घंटे',
  '3–6 hours': '3–6 घंटे',
  '6+ hours': '6+ घंटे',

  // --- Enum: transport -------------------------------------------------
  'Walking': 'पैदल',
  'Bicycle': 'साइकिल',
  'Motorbike': 'मोटरसाइकिल',
  'Car': 'कार',
  'Public transport': 'सार्वजनिक परिवहन',

  // --- Enum: health ----------------------------------------------------
  'Asthma': 'दमा',
  'Heart disease': 'हृदय रोग',
  'Diabetes': 'मधुमेह',
  'Hypertension': 'उच्च रक्तचाप',
  'Kidney disease': 'गुर्दा रोग',
  'Pregnancy': 'गर्भावस्था',

  // --- Enum: home / cooling / power ------------------------------------
  'Apartment': 'अपार्टमेंट',
  'Independent house': 'स्वतंत्र मकान',
  'Tin-roof house': 'टिन की छत वाला मकान',
  'Concrete-roof house': 'पक्की छत वाला मकान',
  'No cooling': 'कोई ठंडक नहीं',
  'Fan': 'पंखा',
  'Air cooler': 'एयर कूलर',
  'Air conditioner': 'एयर कंडीशनर',
  'Frequent': 'बार-बार',
  'Occasional': 'कभी-कभी',
  'Rare / never': 'कभी-कभार / कभी नहीं',

  // --- Risk levels -----------------------------------------------------
  'Low risk': 'कम जोखिम',
  'Caution': 'सावधानी',
  'High risk': 'ज़्यादा जोखिम',
  'Danger': 'खतरा',
  'Conditions look safe': 'हालात सुरक्षित लग रहे हैं',
  'Take basic precautions': 'बुनियादी सावधानी बरतें',
  'Limit time outdoors': 'बाहर कम समय बिताएँ',
  'Avoid outdoor exposure': 'बाहर निकलने से बचें',
  'Why this rating?': 'यह रेटिंग क्यों?',

  // --- Home dashboard --------------------------------------------------
  'Hi, {name}': 'नमस्ते, {name}',
  'Humidity': 'नमी',
  'UV index': 'यूवी इंडेक्स',
  'Air (AQI)': 'हवा (AQI)',
  'Wind': 'हवा की गति',
  'Next 24 hours': 'अगले 24 घंटे',
  'Today\'s plans': 'आज की योजनाएँ',
  'All plans': 'सभी योजनाएँ',
  'Nothing planned yet': 'अभी कुछ तय नहीं है',
  'Add a plan and get a verdict before you go.':
      'एक योजना जोड़ें और निकलने से पहले सुरक्षा राय पाएँ।',
  'Community alerts': 'समुदाय चेतावनियाँ',
  'For you today': 'आज आपके लिए',
  'High-risk hours ahead': 'आगे ज़्यादा जोखिम वाले घंटे',
  'No high-risk hours left today': 'आज कोई ज़्यादा जोखिम वाला घंटा नहीं बचा',
  'Open': 'खोलें',

  // --- Plans -----------------------------------------------------------
  'Plan my day': 'अपना दिन प्लान करें',
  'Upcoming': 'आने वाली',
  'Past': 'पिछली',
  'No plans yet': 'अभी कोई योजना नहीं',
  'Create your first plan': 'अपनी पहली योजना बनाएँ',
  'What are you doing?': 'आप क्या करने वाले हैं?',
  'Activity': 'गतिविधि',
  'Where?': 'कहाँ?',
  'When?': 'कब?',
  'Day': 'दिन',
  'Leaving at': 'निकलने का समय',
  'Back by': 'वापसी का समय',
  'Getting there by': 'वहाँ कैसे पहुँचेंगे',
  'Analyze my plan': 'मेरी योजना जाँचें',
  'Preparation checklist': 'तैयारी सूची',
  'Delete this plan?': 'यह योजना हटाएँ?',
  'Outdoors': 'बाहर',
  'Indoors': 'अंदर',

  // --- Activity types --------------------------------------------------
  'Sport / exercise': 'खेल / व्यायाम',
  'School / college': 'स्कूल / कॉलेज',
  'Office work': 'ऑफ़िस का काम',
  'Construction / site work': 'निर्माण / साइट का काम',
  'Delivery round': 'डिलीवरी राउंड',
  'Farm work': 'खेत का काम',
  'Market / shopping': 'बाज़ार / खरीदारी',
  'Hospital / clinic visit': 'अस्पताल / क्लिनिक जाना',
  'Outdoor event': 'बाहरी आयोजन',
  'Something else': 'कुछ और',

  // --- Community -------------------------------------------------------
  'Report': 'रिपोर्ट',
  'All': 'सभी',
  'Today\'s question': 'आज का सवाल',
  'Report something': 'कुछ रिपोर्ट करें',
  'Publish report': 'रिपोर्ट प्रकाशित करें',
  'Sample': 'नमूना',
  'Extreme heat': 'अत्यधिक गर्मी',
  'Power cut': 'बिजली कटौती',
  'Water station': 'पानी केंद्र',
  'Cooling centre': 'ठंडक केंद्र',
  'Good shade': 'अच्छी छाया',
  'No shade': 'छाया नहीं',
  'Road closed': 'सड़क बंद',
  'Medical emergency': 'चिकित्सा आपातकाल',
  'Broken water supply': 'पानी आपूर्ति ठप',

  // --- Calendar --------------------------------------------------------
  'Heat calendar': 'हीट कैलेंडर',
  'Good for outdoor activity all day': 'पूरे दिन बाहरी गतिविधि के लिए अच्छा',

  // --- Recovery --------------------------------------------------------
  'How do you feel?': 'आप कैसा महसूस कर रहे हैं?',
  'Back from the heat?': 'गर्मी से लौटे हैं?',
  'What to do now': 'अब क्या करें',
  'Normal': 'सामान्य',
  'Tired / drained': 'थका हुआ / निढाल',
  'Headache': 'सिरदर्द',
  'Dizzy / faint': 'चक्कर / बेहोशी जैसा',
  'Muscle cramps': 'मांसपेशियों में ऐंठन',

  // --- Emergency -------------------------------------------------------
  'Emergency': 'आपातकाल',
  'Heat stroke is a medical emergency':
      'लू लगना एक चिकित्सा आपातकाल है',
  'While help arrives': 'मदद आने तक',
  'Share my location': 'मेरी लोकेशन साझा करें',

  // --- Profile ---------------------------------------------------------
  'Your heat profile': 'आपकी हीट प्रोफ़ाइल',
  'Home location': 'घर की लोकेशन',
  'Hours outdoors daily': 'रोज़ बाहर के घंटे',
  'Usual transport': 'सामान्य परिवहन',
  'Home & cooling': 'घर और ठंडक',
  'Appearance': 'रूप-रंग',
  'Light': 'हल्का',
  'Auto': 'स्वतः',
  'Dark': 'गहरा',
  'Language': 'भाषा',
  'Smart notifications': 'स्मार्ट सूचनाएँ',
  'About': 'ऐप के बारे में',
  'Privacy': 'निजता',
  'Reset profile & start over': 'प्रोफ़ाइल रीसेट करें और नए सिरे से शुरू करें',
  'Reset everything?': 'सब कुछ रीसेट करें?',
  'None listed': 'कोई नहीं',

  // --- History ---------------------------------------------------------
  'Heat history': 'हीट इतिहास',
  'Achievements': 'उपलब्धियाँ',
  'Timeline': 'समयरेखा',
};
