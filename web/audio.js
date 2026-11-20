// ============================================================
// AUDIO & SPEECH SYNTHESIS ENGINE (WEB AUDIO API + WEB SPEECH)
// With Dual-Mode Hindi Speech (Native Voice + Phonetic Fallback)
// ============================================================

window.__activeUtterances = [];

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
    this.synth = window.speechSynthesis;

    // Voice preferences
    this.voiceGender = "auto"; // "auto", "female", "male"
    this.detectedGender = "female";

    this.voices = {
      enFemale: null,
      enMale: null,
      hiFemale: null,
      hiMale: null,
      hasNativeHindi: false
    };

    // Background Poem Tune State
    this.poemMusicTimer = null;
    this.poemMusicStep = 0;
    this.poemMusicActive = false;
    this.poemMusicMood = "playful";

    // Audio & Voice Engine Configuration
    this.voiceEngine = localStorage.getItem("lc_voice_engine") || "natural"; // "natural" (Browser) or "elevenlabs"
    this.voicePersona = localStorage.getItem("lc_voice_persona") || "sweet"; // "sweet", "friendly", "cartoon", "gentle"
    this.voicePitch = parseFloat(localStorage.getItem("lc_voice_pitch") || "1.12");
    this.voiceRate = parseFloat(localStorage.getItem("lc_voice_rate") || "0.88");

    // ElevenLabs AI Voice Configuration
    this.elevenLabsConfig = {
      apiKey: localStorage.getItem("lc_eleven_key") || "",
      voiceId: localStorage.getItem("lc_eleven_voice") || "EXAVITQu4vr4xnSDxMaL", // Default: Bella (cheerful kid-friendly)
      modelId: localStorage.getItem("lc_eleven_model") || "eleven_multilingual_v2"
    };

    // Audio cache to prevent repeated API calls
    this.audioBlobCache = new Map();
    this.currentAudioEl = null;

    this.initAudioContext();
    this.initVoices();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  ensureAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  detectGenderFromName(name) {
    if (!name) return "female";
    const clean = name.trim().toLowerCase();

    const femaleNames = [
      "preeti", "priti", "priya", "ananya", "aarti", "arti", "pooja", "puja", "neha", "riya", "sneha",
      "kavya", "aditi", "diya", "deeya", "shruti", "ishita", "tanya", "simran", "radha", "sita", "seeta",
      "meera", "mira", "divya", "shreya", "anita", "sunita", "geeta", "gita", "anjali", "khushi", "aarohi",
      "avani", "avni", "sakshi", "swati", "komal", "pallavi", "shweta", "monika", "priyanka", "deepika",
      "roshni", "sheetal", "payal", "sonam", "jyoti", "nisha", "sapna", "rekha", "parvati", "laxmi", "lakshmi",
      "rhea", "tara", "maya", "sara", "sarah", "emma", "olivia", "sophia", "mia", "isabella", "charlotte"
    ];

    if (femaleNames.includes(clean)) return "female";

    const maleNames = [
      "harsh", "aarav", "arav", "rohan", "aryan", "kabir", "rahul", "amit", "raj", "vikram", "aditya",
      "ayush", "varun", "karan", "rohit", "shivam", "aman", "vivek", "abhishek", "gaurav", "manish",
      "sachin", "virat", "dhruv", "reyansh", "vihaan", "advik", "atharv", "arjun", "krishna", "ram",
      "shiva", "ganesh", "ayaan", "ali", "samir", "sameer", "deepak", "anil", "sunil", "vijay", "ajay",
      "leo", "liam", "noah", "ethan", "lucas", "oliver", "mason", "logan", "alex", "john", "david"
    ];

    if (maleNames.includes(clean)) return "male";

    if (clean.endsWith("i") || clean.endsWith("ee") || clean.endsWith("a") || clean.endsWith("ka") || clean.endsWith("ya")) {
      return "female";
    }
    return "male";
  }

  setKidProfile(name, preferredGender = "auto") {
    this.detectedGender = this.detectGenderFromName(name);
    this.voiceGender = preferredGender;
  }

  getActiveGender() {
    if (this.voiceGender === "female" || this.voiceGender === "male") {
      return this.voiceGender;
    }
    return this.detectedGender || "female";
  }

  initVoices() {
    if (!this.synth) return;
    const load = () => {
      const allVoices = this.synth.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const enVoices = allVoices.filter(v => v.lang.startsWith("en"));
      // Must be true Hindi voice (NOT English-India / en-IN like Microsoft Heera)
      const hiVoices = allVoices.filter(v => {
        const lang = (v.lang || "").toLowerCase();
        const name = (v.name || "").toLowerCase();
        return lang.startsWith("hi") || (name.includes("hindi") && !name.includes("english") && !lang.startsWith("en"));
      });

      this.voices.hasNativeHindi = hiVoices.length > 0;

      // Helper to find highest quality Natural / Neural / Online voices first
      const findBest = (voicesList, pattern, fallbackVoices, isFemale = true) => {
        if (!voicesList || voicesList.length === 0) return fallbackVoices[0] || null;
        // Priority 1: High fidelity Online / Natural / Neural voices
        const natural = voicesList.find(v => pattern.test(v.name) && /natural|online|neural|google|premium/i.test(v.name));
        if (natural) return natural;
        // Priority 2: Standard matching pattern
        const standard = voicesList.find(v => pattern.test(v.name));
        if (standard) return standard;
        // Priority 3: Any voice fitting gender without anti-pattern
        const anti = isFemale ? /male|david|george|mark|guy/i : /female|zira|susan|jenny|aria/i;
        const candidate = voicesList.find(v => !anti.test(v.name));
        return candidate || voicesList[0] || fallbackVoices[0] || null;
      };

      // English Female Voice
      this.voices.enFemale = findBest(
        enVoices,
        /female|zira|samantha|karen|victoria|moira|fiona|susan|jenny|aria|ava|emma|google.*female/i,
        allVoices,
        true
      );

      // English Male Voice
      this.voices.enMale = findBest(
        enVoices,
        /male|david|george|mark|richard|james|ravi|daniel|alex|guy|christopher|google.*male/i,
        allVoices,
        false
      );

      // Hindi Voices
      if (hiVoices.length > 0) {
        this.voices.hiFemale = findBest(
          hiVoices,
          /female|kalpana|swara|veena|aditi|google/i,
          hiVoices,
          true
        );

        this.voices.hiMale = findBest(
          hiVoices,
          /male|madhav|hemant|ravi|madhur/i,
          hiVoices,
          false
        );
      } else {
        // Fallback: use English voice with phonetic romanization
        this.voices.hiFemale = this.voices.enFemale;
        this.voices.hiMale = this.voices.enMale;
      }
    };

    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.synth) {
      this.synth.cancel();
    }
    return this.muted;
  }

  // ----------------------------------------------------------
  // HINDI PHONETIC TRANSLITERATOR
  // Guarantees Hindi speech even when OS lacks Hindi voice pack!
  // ----------------------------------------------------------
  static transliterateHindiToRoman(devanagariText) {
    if (!devanagariText) return "";

    const wordDictionary = {
      // Complete Famous Poems Lines & Vocabulary for Crystal Clear Speech
      "तितली उड़ी, बस पर चढ़ी": "Titli udee, bus par chadhee",
      "तितली उड़ी": "Titli udee", "बस पर चढ़ी": "bus par chadhee",
      "सीट ना मिली, तो रोने लगी": "Seat na milee, to rone lagee",
      "ड्राइवर ने बोला, आजा मेरे पास": "Driver ne bolaa, aaja mere paas",
      "ड्राइवर ने बोला": "Driver ne bolaa", "आजा मेरे पास": "aaja mere paas",
      "तितली बोली, ना बाबा ना": "Titli bolee, naa baba naa",
      "तितली बोली": "Titli bolee", "ना बाबा ना": "naa baba naa",
      "मेरा घर है पास": "Meraa ghar hai paas",

      "चंदा मामा दूर के, पुए पकाएं बूर के": "Chanda mama door ke, pooye pakaayein boor ke",
      "चंदा मामा दूर के": "Chanda mama door ke", "पुए पकाएं बूर के": "pooye pakaayein boor ke",
      "आप खाएं थाली में, मुन्ने को दें प्याली में": "Aap khaayein thaalee mein, munne ko dein pyaalee mein",
      "आप खाएं थाली में": "Aap khaayein thaalee mein", "मुन्ने को दें प्याली में": "munne ko dein pyaalee mein",
      "प्याली गई टूट, मुन्ना गया रूठ": "Pyaalee gayee toot, munna gaya rooth",
      "प्याली गई टूट": "Pyaalee gayee toot", "मुन्ना गया रूठ": "munna gaya rooth",
      "लाएंगे नई प्यालियां, बजा बजा के तालियां": "Laayenge nayee pyaaliyaan, baja baja ke taaliyaan",
      "लाएंगे नई प्यालियां": "Laayenge nayee pyaaliyaan", "बजा बजा के तालियां": "baja baja ke taaliyaan",
      "मुन्ने को मनाएंगे, हम दूध मलाई खाएंगे": "Munne ko manaayenge, hum doodh malaai khaayenge",
      "मुन्ने को मनाएंगे": "Munne ko manaayenge", "हम दूध मलाई खाएंगे": "hum doodh malaai khaayenge",

      "मछली जल की रानी है, जीवन उसका पानी है": "Machhlee jal kee raanee hai, jeevan uskaa paanee hai",
      "मछली जल की रानी है": "Machhlee jal kee raanee hai", "जीवन उसका पानी है": "jeevan uskaa paanee hai",
      "हाथ लगाओ तो डर जाएगी, बाहर निकालो तो मर जाएगी": "Haath lagaao to dur jaayegee, baahar nikaalo to mur jaayegee",
      "हाथ लगाओ तो डर जाएगी": "Haath lagaao to dur jaayegee", "बाहर निकालो तो मर जाएगी": "baahar nikaalo to mur jaayegee",
      "पानी में डालो तो तैर जाएगी, सारा पानी पी जाएगी": "Paanee mein daalo to tair jaayegee, saaraa paanee pee jaayegee",
      "पानी में डालो तो तैर जाएगी": "Paanee mein daalo to tair jaayegee", "सारा पानी पी जाएगी": "saaraa paanee pee jaayegee",

      "लाला जी ने केला खाया, केला खाकर मुंह पिचकाया": "Laalaa jee ne kelaa khaayaa, kelaa khaakar munh pichkaayaa",
      "लाला जी ने केला खाया": "Laalaa jee ne kelaa khaayaa", "केला खाकर मुंह पिचकाया": "kelaa khaakar munh pichkaayaa",
      "मुंह पिचका कर तोंद फुलाई, कदम बढ़ाया आगे": "Munh pichkaa kar tond phulaayee, kadam badhaayaa aage",
      "मुंह पिचका कर तोंद फुलाई": "Munh pichkaa kar tond phulaayee", "कदम बढ़ाया आगे": "kadam badhaayaa aage",
      "पैर के नीचे छिलका आया, लाला जी गिर पड़े धड़ाम": "Pair ke neeche chhilkaa aayaa, laalaa jee gir pade dhadaam",
      "पैर के नीचे छिलका आया": "Pair ke neeche chhilkaa aayaa", "लाला जी गिर पड़े धड़ाम": "laalaa jee gir pade dhadaam",
      "मुंह से निकला हाय राम, हाय राम": "Munh se niklaa haay raam, haay raam",
      "मुंह से निकला हाय राम": "Munh se niklaa haay raam",

      "हाथी राजा बहुत बड़े, सूंड हिलाकर कहाँ चले": "Haathee raajaa bahut bade, soond hilaakar kahaan chale",
      "हाथी राजा बहुत बड़े": "Haathee raajaa bahut bade", "सूंड हिलाकर कहाँ चले": "soond hilaakar kahaan chale",
      "मेरे घर भी आओ ना, हलवा पूरी खाओ ना": "Mere ghar bhee aao naa, halwaa pooree khaao naa",
      "मेरे घर भी आओ ना": "Mere ghar bhee aao naa", "हलवा पूरी खाओ ना": "halwaa pooree khaao naa",
      "आओ बैठो कुर्सी पर, कुर्सी बोली चटर पटर": "Aao baitho kursee par, kursee bolee chatar patar",
      "आओ बैठो कुर्सी पर": "Aao baitho kursee par", "कुर्सी बोली चटर पटर": "kursee bolee chatar patar",

      "आलू कचालू बेटा कहाँ गए थे": "Aaloo kachaaloo betaa kahaan gaye the",
      "बैंगन की टोकरी में सो रहे थे": "Baingan kee tokaree mein so rahe the",
      "बैंगन ने लात मारी रो रहे थे": "Baingan ne laat maaree ro rahe the",
      "मम्मी ने प्यार किया हंस रहे थे": "Mummee ne pyaar kiyaa hans rahe the",
      "पापा ने पैसे दिए नाच रहे थे": "Paapaa ne paise diye naach rahe the",

      // Swar: Natural classroom recitation (Chhota Aa, Badaa Aa, etc.)
      "छोटा अ से अनार": "Chhotaa aa say uh-naar", "अ से अनार": "Chhotaa aa say uh-naar",
      "बड़ा आ से आम": "Badaa aa say aam", "आ से आम": "Badaa aa say aam",
      "छोटी इ से इमली": "Chhoti ee say imlee", "इ से इमली": "Chhoti ee say imlee",
      "बड़ी ई से ईख": "Badi ee say eekh", "ई से ईख": "Badi ee say eekh",
      "छोटा उ से उल्लू": "Chhotaa oo say ool-loo", "उ से उल्लू": "Chhotaa oo say ool-loo",
      "बड़ा ऊ से ऊन": "Badaa oo say oon", "ऊ से ऊन": "Badaa oo say oon",
      "ऋ से ऋषि": "Ri say rishee",
      "छोटा ए से एड़ी": "Chhotaa ay say ay-dee", "छोटा ए से एड़ी": "Chhotaa ay say ay-dee", "ए से एड़ी": "Chhotaa ay say ay-dee", "ए से एड़ी": "Chhotaa ay say ay-dee",
      "बड़ा ऐ से ऐनक": "Badaa eye say eye-nuck", "ऐ से ऐनक": "Badaa eye say eye-nuck",
      "छोटा ओ से ओखली": "Chhotaa oh say oakh-lee", "ओ से ओखली": "Chhotaa oh say oakh-lee",
      "बड़ा औ से औरत": "Badaa aww say aw-rut", "औ से औरत": "Badaa aww say aw-rut",
      "अं से अंगूर": "Ung say ungoor",
      "अः खाली, बच्चों बजाओ ताली!": "Aha khaalee, bachho bajao taalee!", "अः खाली": "Aha khaalee, bajao taalee!",

      // Vyanjan: Natural phonetic recitation with 'say' for 'से'
      "क से कबूतर": "Kuh say kabootar", "ख से खरगोश": "Khuh say khargosh", "ग से गमला": "Guh say gumlaa",
      "घ से घड़ी": "Ghuh say ghadee", "ङ खाली": "Ung-a khaalee", "च से चम्मच": "Chuh say chummuch",
      "छ से छाता": "Chhuh say chhaataa", "ज से जहाज": "Juh say jahaaz", "झ से झंडा": "Jhuh say jhundaa",
      "ञ खाली": "Nya khaalee", "ट से टमाटर": "Tuh say tamaatur", "ठ से ठठेरा": "Thuh say thathayraa",
      "ड से डमरू": "Duh say dumroo", "ढ से ढोलक": "Dhuh say dholuk", "ण खाली": "Ana khaalee",
      "त से तोता": "Tuh say tota", "त से तरबूज": "Tuh say tarbooj", "थ से थाली": "Thuh say thaalee",
      "द से दवात": "Duh say duwaat", "ध से धनुष": "Dhuh say dhunush", "न से नल": "Nuh say nul",
      "प से पतंग": "Puh say putung", "फ से फल": "Fuh say ful", "ब से बत्तख": "Buh say but-tukh",
      "ब से बकरी": "Buh say bukree", "भ से भालू": "Bhuh say bhaaloo", "म से मछली": "Muh say muchhlee",
      "य से यज्ञ": "Yuh say yugya", "र से रथ": "Ruh say ruth", "ल से लट्टू": "Luh say lut-too",
      "व से वक": "Vuh say vuk", "व से वक़": "Vuh say vuk", "श से शलजम": "Shuh say shuljum",
      "ष से षटकोण": "Shuh say shut-kon", "स से सेब": "Suh say sayb", "ह से हाथी": "Huh say haathee",
      "क्ष से क्षत्रिय": "Kshuh say kshutreeya", "त्र से त्रिशूल": "Truh say trishool", "ज्ञ से ज्ञानी": "Gyuh say gyaanee",

      // Pahade (Tables)
      "दो एकम दो": "Do ekam do", "दो दूनी चार": "Do doonee chaar", "दो तिया छह": "Do tiya chhah",
      "दो चौके आठ": "Do chauke aath", "दो पंजे दस": "Do panje das", "दो छक्के बारह": "Do chhakke baarah",
      "दो सत्ते चौदह": "Do satte chaudah", "दो अठे सोलह": "Do atthe solah", "दो निम्मे अठारह": "Do nimme athaarah",
      "दो धाम बीस": "Do dhaam bees"
    };

    let result = devanagariText;
    for (const [k, v] of Object.entries(wordDictionary)) {
      if (result.includes(k)) {
        result = result.replace(new RegExp(k, 'g'), v);
      }
    }

    // Direct Character mapping for isolated letters
    const charMap = {
      'अ': 'Aa', 'आ': 'Aaa', 'इ': 'Eee', 'ई': 'Eekh', 'उ': 'Oo', 'ऊ': 'Oon', 'ऋ': 'Ri',
      'ए': 'Aey', 'ऐ': 'Ainak', 'ओ': 'Oh', 'औ': 'Aurat', 'अं': 'Ang', 'अः': 'Aha',
      'क': 'Ka', 'ख': 'Kha', 'ग': 'Ga', 'घ': 'Gha', 'ङ': 'Nga',
      'च': 'Cha', 'छ': 'Chha', 'ज': 'Ja', 'झ': 'Jha', 'ञ': 'Nya',
      'ट': 'Ta', 'ठ': 'Tha', 'ड': 'Da', 'ढ': 'Dha', 'ण': 'Na',
      'त': 'Ta', 'थ': 'Tha', 'द': 'Da', 'ध': 'Dha', 'न': 'Na',
      'प': 'Pa', 'फ': 'Fa', 'ब': 'Ba', 'भ': 'Bha', 'म': 'Ma',
      'य': 'Ya', 'र': 'Ra', 'ल': 'La', 'व': 'Va', 'श': 'Sha',
      'ष': 'Sha', 'स': 'Sa', 'ह': 'Ha', 'क्ष': 'Kshatra', 'त्र': 'Tra', 'ज्ञ': 'Gyaani'
    };

    for (const [c, r] of Object.entries(charMap)) {
      result = result.replace(new RegExp(c, 'g'), r);
    }

    return result;
  }

  
  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // YOUTUBE-STYLE RICH POLYPHONIC NURSERY RHYTHM & MUSIC
  // Includes Marimba Melody + Accordion/Flute Harmony + Rhythmic Bass
  // ----------------------------------------------------------
  startPoemMusic(mood = "playful") {
    if (this.muted) return;
    this.stopPoemMusic();
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    this.poemMusicActive = true;
    this.poemMusicMood = mood;
    this.poemMusicStep = 0;

    // Rich YouTube-style melodic progressions (Lead, Chord, Bass)
    // Twinkle / Rhyme scales: C major & F major
    const tunePatterns = {
      twinkle: {
        lead: [523.25, 523.25, 783.99, 783.99, 880.00, 880.00, 783.99, 0, 698.46, 698.46, 659.25, 659.25, 587.33, 587.33, 523.25, 0],
        bass: [261.63, 0, 392.00, 0, 440.00, 0, 392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0, 261.63, 0]
      },
      chanda: {
        lead: [440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 392.00, 0, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0],
        bass: [220.00, 0, 261.63, 0, 329.63, 0, 196.00, 0, 261.63, 0, 293.66, 0, 329.63, 0, 261.63, 0]
      },
      water: {
        lead: [523.25, 587.33, 659.25, 783.99, 659.25, 523.25, 440.00, 0, 392.00, 440.00, 523.25, 587.33, 523.25, 392.00, 523.25, 0],
        bass: [261.63, 0, 329.63, 0, 349.23, 0, 392.00, 0, 196.00, 0, 220.00, 0, 261.63, 0, 261.63, 0]
      },
      happy: {
        lead: [523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 698.46, 659.25, 587.33, 659.25, 698.46, 783.99, 523.25, 783.99, 1046.50, 0],
        bass: [261.63, 0, 329.63, 0, 349.23, 0, 392.00, 0, 293.66, 0, 329.63, 0, 261.63, 0, 261.63, 0]
      },
      playful: {
        lead: [659.25, 698.46, 783.99, 1046.50, 880.00, 783.99, 698.46, 659.25, 783.99, 698.46, 659.25, 587.33, 523.25, 659.25, 783.99, 0],
        bass: [329.63, 0, 349.23, 0, 440.00, 0, 392.00, 0, 349.23, 0, 329.63, 0, 261.63, 0, 261.63, 0]
      }
    };

    const pattern = tunePatterns[mood] || tunePatterns.playful;

    const playNextBeat = () => {
      if (!this.poemMusicActive || this.muted || !this.audioCtx) return;

      const idx = this.poemMusicStep % pattern.lead.length;
      const leadFreq = pattern.lead[idx];
      const bassFreq = pattern.bass[idx];
      const now = this.audioCtx.currentTime;

      // 1. Play Lead Glockenspiel / Marimba Note
      if (leadFreq > 0) {
        try {
          const oscLead = this.audioCtx.createOscillator();
          const gainLead = this.audioCtx.createGain();

          oscLead.type = "sine";
          oscLead.frequency.setValueAtTime(leadFreq, now);

          // Warm harmonic chime
          gainLead.gain.setValueAtTime(0.048, now);
          gainLead.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

          oscLead.connect(gainLead);
          gainLead.connect(this.audioCtx.destination);

          oscLead.start(now);
          oscLead.stop(now + 0.34);
        } catch (e) {}
      }

      // 2. Play Gentle Nursery Rhythm Bass (Pizzicato Pluck)
      if (bassFreq > 0) {
        try {
          const oscBass = this.audioCtx.createOscillator();
          const gainBass = this.audioCtx.createGain();

          oscBass.type = "triangle";
          oscBass.frequency.setValueAtTime(bassFreq, now);

          gainBass.gain.setValueAtTime(0.038, now);
          gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

          oscBass.connect(gainBass);
          gainBass.connect(this.audioCtx.destination);

          oscBass.start(now);
          oscBass.stop(now + 0.30);
        } catch (e) {}
      }

      this.poemMusicStep++;
      // Cheerful rhythmic nursery tempo
      this.poemMusicTimer = setTimeout(playNextBeat, 270);
    };

    playNextBeat();
  }

  stopPoemMusic() {
    this.poemMusicActive = false;
    if (this.poemMusicTimer) {
      clearTimeout(this.poemMusicTimer);
      this.poemMusicTimer = null;
    }
  }

  stopSpeech() {
    if (this.currentAudioEl) {
      try {
        this.currentAudioEl.pause();
        this.currentAudioEl.currentTime = 0;
      } catch (e) {}
      this.currentAudioEl = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    window.__activeUtterances = [];
  }

  saveVoiceSettings(settings = {}) {
    if (settings.engine !== undefined) {
      this.voiceEngine = settings.engine;
      localStorage.setItem("lc_voice_engine", settings.engine);
    }
    if (settings.persona !== undefined) {
      this.voicePersona = settings.persona;
      localStorage.setItem("lc_voice_persona", settings.persona);
    }
    if (settings.pitch !== undefined) {
      this.voicePitch = parseFloat(settings.pitch);
      localStorage.setItem("lc_voice_pitch", String(settings.pitch));
    }
    if (settings.rate !== undefined) {
      this.voiceRate = parseFloat(settings.rate);
      localStorage.setItem("lc_voice_rate", String(settings.rate));
    }
    if (settings.elevenLabsApiKey !== undefined) {
      this.elevenLabsConfig.apiKey = settings.elevenLabsApiKey;
      localStorage.setItem("lc_eleven_key", settings.elevenLabsApiKey);
    }
    if (settings.elevenLabsVoiceId !== undefined) {
      this.elevenLabsConfig.voiceId = settings.elevenLabsVoiceId;
      localStorage.setItem("lc_eleven_voice", settings.elevenLabsVoiceId);
    }
    if (settings.elevenLabsModelId !== undefined) {
      this.elevenLabsConfig.modelId = settings.elevenLabsModelId;
      localStorage.setItem("lc_eleven_model", settings.elevenLabsModelId);
    }
  }

  speak(text, lang = "en", fallbackRoman = "", onComplete = null, options = {}) {
    if (this.muted || !text) {
      if (typeof onComplete === "function") setTimeout(onComplete, 100);
      return;
    }

    const clean = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    if (!clean) {
      if (typeof onComplete === "function") setTimeout(onComplete, 100);
      return;
    }

    this.stopSpeech();

    // Check if ElevenLabs is active and configured
    if (this.voiceEngine === "elevenlabs" && this.elevenLabsConfig.apiKey && this.elevenLabsConfig.apiKey.trim()) {
      this.speakElevenLabs(clean, onComplete, { ...options, lang, fallbackRoman });
    } else {
      this.speakBrowser(clean, lang, fallbackRoman, onComplete, options);
    }
  }

  speakElevenLabs(text, onComplete = null, options = {}) {
    const voiceId = this.elevenLabsConfig.voiceId || "EXAVITQu4vr4xnSDxMaL";
    const modelId = this.elevenLabsConfig.modelId || "eleven_multilingual_v2";
    const cacheKey = `${voiceId}_${text}`;

    const playBlobUrl = (url) => {
      try {
        const audio = new Audio(url);
        this.currentAudioEl = audio;
        let ended = false;
        const done = () => {
          if (ended) return;
          ended = true;
          this.currentAudioEl = null;
          if (typeof onComplete === "function") onComplete();
        };
        audio.onended = done;
        audio.onerror = () => {
          console.warn("Audio playback error, falling back to browser voice");
          this.speakBrowser(text, options.lang || "en", options.fallbackRoman || "", onComplete, options);
        };
        audio.play().catch(err => {
          console.warn("Autoplay blocked or play failed:", err);
          this.speakBrowser(text, options.lang || "en", options.fallbackRoman || "", onComplete, options);
        });
      } catch (e) {
        this.speakBrowser(text, options.lang || "en", options.fallbackRoman || "", onComplete, options);
      }
    };

    // Instant zero-latency replay from cache
    if (this.audioBlobCache.has(cacheKey)) {
      playBlobUrl(this.audioBlobCache.get(cacheKey));
      return;
    }

    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.elevenLabsConfig.apiKey.trim()
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75
        }
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`ElevenLabs API HTTP Error ${res.status}`);
      }
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      this.audioBlobCache.set(cacheKey, url);
      playBlobUrl(url);
    })
    .catch(err => {
      console.warn("ElevenLabs TTS request failed, fallback to enhanced browser voice:", err);
      this.speakBrowser(text, options.lang || "en", options.fallbackRoman || "", onComplete, options);
    });
  }

  speakBrowser(clean, lang = "en", fallbackRoman = "", onComplete = null, options = {}) {
    if (!this.synth) {
      if (typeof onComplete === "function") setTimeout(onComplete, 100);
      return;
    }

    setTimeout(() => {
      if (this.muted) {
        if (typeof onComplete === "function") onComplete();
        return;
      }
      const gender = this.getActiveGender();

      let finalText = clean;
      let targetLang = "en-US";
      let targetVoice = gender === "male" ? this.voices.enMale : this.voices.enFemale;

      if (lang === "hi") {
        if (this.voices.hasNativeHindi) {
          finalText = clean;
          targetLang = "hi-IN";
          targetVoice = gender === "male" ? this.voices.hiMale : this.voices.hiFemale;
        } else {
          finalText = fallbackRoman || SoundEngine.transliterateHindiToRoman(clean);
          targetLang = "en-US";
          targetVoice = gender === "male" ? this.voices.enMale : this.voices.enFemale;
        }
      }

      const utter = new SpeechSynthesisUtterance(finalText);
      utter.lang = targetLang;
      if (targetVoice) utter.voice = targetVoice;

      // Persona Pitch & Pace tuning
      let personaPitch = 1.12;
      let personaRate = 0.88;

      if (this.voicePersona === "sweet") {
        personaPitch = gender === "female" ? 1.14 : 1.04;
        personaRate = 0.88;
      } else if (this.voicePersona === "friendly") {
        personaPitch = gender === "female" ? 1.06 : 0.98;
        personaRate = 0.90;
      } else if (this.voicePersona === "cartoon") {
        personaPitch = gender === "female" ? 1.28 : 1.18;
        personaRate = 0.95;
      } else if (this.voicePersona === "gentle") {
        personaPitch = gender === "female" ? 0.98 : 0.90;
        personaRate = 0.84;
      }

      utter.pitch = options.pitch || this.voicePitch || personaPitch;
      utter.rate = options.rate || this.voiceRate || personaRate;

      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        window.__activeUtterances = window.__activeUtterances.filter(u => u !== utter);
        if (typeof onComplete === "function") {
          onComplete();
        }
      };

      window.__activeUtterances.push(utter);
      utter.onend = finish;
      utter.onerror = finish;

      const estDuration = Math.max(2200, (finalText.length * 95));
      setTimeout(() => {
        if (!completed) finish();
      }, estDuration + 800);

      try {
        this.synth.speak(utter);
      } catch (err) {
        console.warn("Speech error:", err);
        finish();
      }
    }, 25);
  }

  testVoice(text = "Hello Little Champion! Let's learn and play together!", onComplete = null) {
    this.speak(text, "en", "", onComplete);
  }

  speakHindi(text, fallbackRoman = "", onComplete = null, options = {}) {
    this.speak(text, "hi", fallbackRoman, onComplete, options);
  }

  // ----------------------------------------------------------
  // TRADITIONAL TABLE RECITATIONS
  // ----------------------------------------------------------
  static getEnglishTablePhrase(table, step) {
    const numWords = {
      1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five",
      6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
      11: "Eleven", 12: "Twelve", 13: "Thirteen", 14: "Fourteen", 15: "Fifteen",
      16: "Sixteen", 17: "Seventeen", 18: "Eighteen", 19: "Nineteen", 20: "Twenty"
    };

    const multiplierWords = {
      1: "ones are", 2: "twos are", 3: "threes are", 4: "fours are",
      5: "fives are", 6: "sixes are", 7: "sevens are", 8: "eights are",
      9: "nines are", 10: "tens are"
    };

    const prod = table * step;
    const tWord = numWords[table] || `${table}`;
    const mWord = multiplierWords[step] || `times ${step} is`;
    return `${tWord} ${mWord} ${prod}.`;
  }

  static getHindiTablePhrase(table, step) {
    const hindiTableNames = {
      1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पाँच",
      6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस",
      11: "ग्यारह", 12: "बारह", 13: "तेरह", 14: "चौदह", 15: "पंद्रह",
      16: "सोलह", 17: "सत्रह", 18: "अठारह", 19: "उन्नीस", 20: "बीस"
    };

    const hindiMultipliers = {
      1: "एकम", 2: "दूनी", 3: "तिया", 4: "चौके", 5: "पंजे",
      6: "छक्के", 7: "सत्ते", 8: "अठे", 9: "निम्मे", 10: "धाम"
    };

    const prod = table * step;
    const tName = hindiTableNames[table] || `${table}`;
    const mName = hindiMultipliers[step] || `${step}`;
    return `${tName} ${mName} ${prod}.`;
  }

  static getHindiTableRomanPhrase(table, step) {
    const romanTableNames = {
      1: "Ek", 2: "Do", 3: "Teen", 4: "Chaar", 5: "Paanch",
      6: "Chhah", 7: "Saat", 8: "Aath", 9: "Nau", 10: "Das",
      11: "Gyaarah", 12: "Baarah", 13: "Terah", 14: "Chaudah", 15: "Pandrah",
      16: "Solah", 17: "Satrah", 18: "Athaarah", 19: "Unnees", 20: "Bees"
    };

    const romanMultipliers = {
      1: "ekam", 2: "doonee", 3: "tiya", 4: "chauke", 5: "panje",
      6: "chhakke", 7: "satte", 8: "atthe", 9: "nimme", 10: "dhaam"
    };

    const prod = table * step;
    const tName = romanTableNames[table] || `${table}`;
    const mName = romanMultipliers[step] || `${step}`;
    return `${tName} ${mName} ${prod}.`;
  }

  speakTableStep(table, step, lang = "en") {
    if (lang === "hi") {
      const phrase = SoundEngine.getHindiTablePhrase(table, step);
      const romanPhrase = SoundEngine.getHindiTableRomanPhrase(table, step);
      this.speakHindi(phrase, romanPhrase);
    } else {
      const phrase = SoundEngine.getEnglishTablePhrase(table, step);
      this.speak(phrase);
    }
  }

  // ----------------------------------------------------------
  // SYNTHETIC CHIMES (WEB AUDIO API)
  // ----------------------------------------------------------
  playClick() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  playPop() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playCorrect() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch (e) {}
  }

  playWrong() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.15);
      osc.frequency.linearRampToValueAtTime(190, now + 0.35);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playStar() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [784, 988, 1175, 1568];

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const startTime = now + idx * 0.05;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    } catch (e) {}
  }

  playFanfare() {
    if (this.muted) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12, t: 0.00 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.14, t: 0.24 },
        { f: 1046.50, d: 0.35, t: 0.38 },
        { f: 880.00, d: 0.14, t: 0.75 },
        { f: 1046.50, d: 0.50, t: 0.90 }
      ];

      notes.forEach(n => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const startTime = now + n.t;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.d);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + n.d + 0.05);
      });
    } catch (e) {}
  }
}

// Global Sound Instance
const audio = new SoundEngine();
