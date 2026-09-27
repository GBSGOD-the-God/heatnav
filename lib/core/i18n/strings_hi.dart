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

  // --- HeatNav Signal: card ----------------------------------------------
  'HeatNav Signal': 'HeatNav सिग्नल',
  'Sync': 'सिंक करें',
  'Sync again': 'फिर से सिंक करें',
  'Measures the heat right where you are.': 'ठीक आपकी जगह पर गर्मी मापता है।',
  'Looking for a Signal nearby…': 'पास में सिग्नल खोज रहे हैं…',
  'measured just now': 'अभी मापा गया',
  'measured {n} min ago': '{n} मिनट पहले मापा गया',
  'may be out of date — sync again': 'पुराना हो सकता है — फिर से सिंक करें',
  'Last reading is over an hour old — kept in history, not used for ratings.':
      'आखिरी रीडिंग एक घंटे से ज़्यादा पुरानी है — इतिहास में रखी गई है, '
          'रेटिंग में इस्तेमाल नहीं होती।',
  'Globe {g} · Wet bulb {w} · Air {a}': 'ग्लोब {g} · वेट बल्ब {w} · हवा {a}',
  'Heavy work limits · US Army TB MED 507':
      'भारी काम की सीमाएँ · US Army TB MED 507',
  'Measured here': 'यहीं मापा गया',

  // --- HeatNav Signal: bands and work/rest rules (TB MED 507) ------------
  'Green': 'हरा',
  'Yellow': 'पीला',
  'Orange': 'नारंगी',
  'Red': 'लाल',
  'Flashing red': 'चमकता लाल',
  'Work normally': 'सामान्य रूप से काम करें',
  '40 min work / 20 rest': '40 मिनट काम / 20 मिनट आराम',
  '30 min work / 30 rest': '30 मिनट काम / 30 मिनट आराम',
  '20 min work / 40 rest': '20 मिनट काम / 40 मिनट आराम',
  'Stop heavy work': 'भारी काम बंद करें',
  'Drink water hourly': 'हर घंटे पानी पिएँ',
  '~0.7 L per hour': 'लगभग 0.7 लीटर प्रति घंटा',
  '~1 L per hour': 'लगभग 1 लीटर प्रति घंटा',

  // --- HeatNav Signal: sync errors ---------------------------------------
  'Bluetooth is off. Turn it on and tap Sync again.':
      'ब्लूटूथ बंद है। इसे चालू करें और फिर से सिंक दबाएँ।',
  'HeatNav needs the Nearby devices permission to read the Signal. '
          'Allow it in your phone settings, then tap Sync again.':
      'सिग्नल पढ़ने के लिए HeatNav को "आस-पास के डिवाइस" की अनुमति चाहिए। '
          'फ़ोन की सेटिंग में अनुमति दें, फिर से सिंक दबाएँ।',
  'Turn on Location, then tap Sync again. This phone needs it to scan '
          'for Bluetooth devices.':
      'लोकेशन चालू करें, फिर से सिंक दबाएँ। इस फ़ोन को ब्लूटूथ डिवाइस खोजने '
          'के लिए इसकी ज़रूरत है।',
  'No HeatNav Signal found nearby. Move closer to the Signal pole and '
          'tap Sync again.':
      'पास में कोई HeatNav सिग्नल नहीं मिला। सिग्नल वाले खंभे के पास जाएँ और '
          'फिर से सिंक दबाएँ।',
  'A Signal was found, but its data could not be read. Wait a few '
          'seconds and tap Sync again.':
      'सिग्नल मिला, लेकिन उसका डेटा पढ़ा नहीं जा सका। कुछ सेकंड रुकें और '
          'फिर से सिंक दबाएँ।',
  'This device can\'t scan for Bluetooth signals. Use HeatNav on an '
          'Android phone or iPhone to sync.':
      'यह डिवाइस ब्लूटूथ सिग्नल स्कैन नहीं कर सकता। सिंक करने के लिए Android '
          'फ़ोन या iPhone पर HeatNav इस्तेमाल करें।',

  // --- HeatNav Signal: "Why this rating?" rows ---------------------------
  'Source: {source}': 'स्रोत: {source}',
  'Measured on site': 'मौके पर मापा गया',
  'WBGT = 0.7 × wet bulb + 0.2 × globe + 0.1 × air':
      'WBGT = 0.7 × वेट बल्ब + 0.2 × ग्लोब + 0.1 × हवा',
  'Work/rest limits': 'काम/आराम की सीमाएँ',
  'City forecast not used': 'शहर का पूर्वानुमान इस्तेमाल नहीं हुआ',
  'This rating comes from the on-site measurement, not the city forecast.':
      'यह रेटिंग मौके पर हुई माप से है, शहर के पूर्वानुमान से नहीं।',

  // --- HeatNav Signal: history -------------------------------------------
  'HeatNav Signal — today': 'HeatNav सिग्नल — आज',
  'No Signal readings today.': 'आज कोई सिग्नल रीडिंग नहीं।',
  '{d} in {band}': '{band} में {d}',
  '{h} h {m} m': '{h} घं {m} मि',
  '{m} m': '{m} मि',
  'Each reading counts until the next one, for up to 30 minutes.':
      'हर रीडिंग अगली रीडिंग तक गिनी जाती है, ज़्यादा से ज़्यादा 30 मिनट तक।',
  'Export CSV': 'CSV निर्यात करें',
  'Stored only on this phone. It leaves only when you export and share it.':
      'सिर्फ़ इसी फ़ोन पर सहेजा गया। यह तभी बाहर जाता है जब आप इसे निर्यात '
          'करके साझा करें।',

  // --- HeatNav Signal: rehearsal (debug builds only) ---------------------
  'Developer': 'डेवलपर',
  'Simulate a Signal': 'सिग्नल का अभ्यास (नकली रीडिंग)',
  'Debug builds only, for rehearsal. Each Sync returns a hotter fake '
          'reading, tagged SIMULATED. Turning this off deletes the fake '
          'readings.':
      'सिर्फ़ डीबग बिल्ड में, अभ्यास के लिए। हर सिंक पहले से गर्म नकली रीडिंग '
          'देता है, जिस पर SIMULATED लिखा होता है। इसे बंद करने पर नकली '
          'रीडिंग मिट जाती हैं।',
};
