// ============================================================
// MAIN APPLICATION CONTROLLER (LITTLE CHAMPIONS: PLAY & LEARN)
// Play & Learn (छोटे उस्ताद) - Complete JavaScript Engine
// ============================================================

class App {
  constructor() {
    // Player Profile State
    this.player = {
      name: "",
      grade: "Class 2",
      avatar: "🦁",
      stars: 0,
      voicePref: "auto"
    };

    // Navigation & Screen State
    this.currentScreen = "screenHome";
    this.classFilter = "all";

    // Traditional Tables State (1 to 20)
    this.currentTable = 2;
    this.tableLang = "en"; // "en" or "hi"
    this.tableReciteTimer = null;
    this.tableReciting = false;

    // Alphabet & Varnamala State
    this.alphaIdx = 0;
    this.hindiType = "swar";
    this.hindiIdx = 0;
    this.hindiPronounceIdx = 0;
    this.hindiPronounceTarget = null;
    this.balloonMode = "en"; // "en", "hi", "math"

    // Counting State
    this.countIdx = 0;
    this.countMode = "1to100";
    this.tensIdx = 0;

    // Colors & Shapes State
    this.colorTab = "colors";

    // Nursery Magic Painting & Coloring Studio State
    this.paintColor = "#ef4444";
    this.brushSize = 8;
    this.brushTool = "pencil"; // "pencil", "brush", "marker", "rainbow", "neon", "eraser"
    this.paintTemplate = "blank";
    this.paintHistory = [];
    this.isPainting = false;
    this.lastPaintPos = { x: 0, y: 0 };
    this.activeSticker = null;
    this.rainbowHue = 0;

    // Dictation Studio State
    this.dictationGrade = "Class 1";
    this.dictationIdx = 0;
    this.dictationLang = "en"; // "en" or "hi"

    // GK & Riddles State
    this.gkTab = "gk";
    this.gkIdx = 0;
    this.riddleIdx = 0;

    // Math Arena State
    this.mathArenaMode = "division";
    this.divIdx = 0;
    this.multIdx = 0;
    this.addSubIdx = 0;
    this.findXIdx = 0;
    this.fractionIdx = 0;
    this.lcmIdx = 0;
    this.hcfIdx = 0;

    // 1000+ Brain Sharp Arcade State (Class 1 to 5)
    this.brainClass = "Class 1";
    this.brainCat = "math";
    this.brainIdx = 0;
    this.brainStreak = 0;
    this.brainScore = 0;
    this.currentBrainQ = null;
    this.brainAnswered = false;

    // Worksheets State
    this.worksheetIdx = 0;

    // Confetti Engine
    this.confettiRunning = false;
    this.particles = [];

    // Next Action Callback after celebration
    this.onNextCelebrationAction = null;

    // Custom Content & Admin Studio State
    this.customCourses = [];
    this.customPoems = [];
    this.activeCourse = null;
    this.activeCourseCardIdx = 0;
    this.adminTab = "voice";
    this.tempCourseCards = [];

    this.init();
  }

  init() {
    this.loadProfile();
    this.initConfettiCanvas();
    this.bindEvents();
    this.applyClassFilter("all");

    // Apply voice settings to SoundEngine
    audio.setKidProfile(this.player.name, this.player.voicePref);
    this.updateVoiceHeaderUI();

    // Load custom poems & courses from storage / server
    this.loadCustomContent();

    // Show profile modal on first visit if no name saved
    if (!this.player.name) {
      this.showProfileModal();
    } else {
      this.updateHeaderProfile();
    }
  }

  // ----------------------------------------------------------
  // 1. PROFILE & VOICE PREFERENCE MANAGEMENT
  // ----------------------------------------------------------
  loadProfile() {
    try {
      const saved = localStorage.getItem("little_champions_kid_profile");
      if (saved) {
        this.player = Object.assign(this.player, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
  }

  saveProfile() {
    try {
      localStorage.setItem("little_champions_kid_profile", JSON.stringify(this.player));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    this.updateHeaderProfile();
  }

  showProfileModal() {
    const modal = document.getElementById("profileModal");
    if (!modal) return;
    modal.classList.add("active");
    const nameIn = document.getElementById("inputKidName");
    if (nameIn) nameIn.value = this.player.name || "";
    const classSel = document.getElementById("selectKidClass");
    if (classSel) classSel.value = this.player.grade || "Class 2";
    const voiceSel = document.getElementById("selectVoicePref");
    if (voiceSel) voiceSel.value = this.player.voicePref || "auto";

    document.querySelectorAll(".avatar-option").forEach(el => {
      el.classList.toggle("selected", el.dataset.avatar === this.player.avatar);
    });
  }

  hideProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
  }

  updateHeaderProfile() {
    const avatarEl = document.getElementById("headerKidAvatar");
    if (avatarEl) avatarEl.textContent = this.player.avatar || "🦁";

    const nameEl = document.getElementById("headerKidName");
    if (nameEl) nameEl.textContent = this.player.name || "Champion";

    const classTag = document.getElementById("headerKidClassTag");
    if (classTag) classTag.textContent = this.player.grade || "Class 2";

    const starsEl = document.getElementById("headerKidStars");
    if (starsEl) starsEl.textContent = this.player.stars || 0;

    const heroName = document.getElementById("heroKidName");
    if (heroName) heroName.textContent = this.player.name || "Little Champion";
  }

  toggleVoiceGender() {
    const current = audio.getActiveGender();
    const next = current === "female" ? "male" : "female";
    this.player.voicePref = next;
    audio.setKidProfile(this.player.name, next);
    this.saveProfile();
    this.updateVoiceHeaderUI();
    audio.playClick();
    audio.speak(`Voice changed to ${next === "female" ? "Female teacher voice" : "Male mentor voice"}!`);
  }

  updateVoiceHeaderUI() {
    const gender = audio.getActiveGender();
    const icon = document.getElementById("headerVoiceIcon");
    const text = document.getElementById("headerVoiceText");
    if (icon) icon.textContent = gender === "female" ? "👧" : "👦";
    if (text) text.textContent = gender === "female" ? "Voice: Female" : "Voice: Male";
  }

  addStars(count = 10) {
    this.player.stars += count;
    this.saveProfile();
    audio.playStar();
  }

  // ----------------------------------------------------------
  // 2. NAVIGATION & CLASS FILTERING
  // ----------------------------------------------------------
  showScreen(screenId) {
    this.stopTableRecite();
    if (audio.stopSpeech) audio.stopSpeech();

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
      this.currentScreen = screenId;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (screenId === "screenHome") {
      this.renderHomeCustomCourses();
    }
  }

  applyClassFilter(filter) {
    this.classFilter = filter;
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.filter === filter);
    });

    const cards = document.querySelectorAll("#mainHubCardsGrid .hub-card");
    cards.forEach(card => {
      const tier = card.dataset.tier;
      if (filter === "all" || tier === "all" || tier === filter) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  // ----------------------------------------------------------
  // 3. CELEBRATION MODAL & CONFETTI ENGINE
  // ----------------------------------------------------------
  celebrateSuccess(customMsg, onNextCallback) {
    this.addStars(10);
    this.onNextCelebrationAction = onNextCallback;

    const kidName = this.player.name || "Little Champion";
    const nameEl = document.getElementById("celebrationKidName");
    if (nameEl) nameEl.textContent = kidName;

    const classEl = document.getElementById("celebrationKidClass");
    if (classEl) classEl.textContent = `${this.player.grade} Superstar!`;

    const msgEl = document.getElementById("celebrationMsg");
    if (msgEl) msgEl.textContent = customMsg || "You solved the challenge correctly! Brilliant!";

    const starsEl = document.getElementById("celebrationTotalStars");
    if (starsEl) starsEl.textContent = this.player.stars;

    const overlay = document.getElementById("celebrationOverlay");
    if (overlay) overlay.classList.add("active");

    audio.playCorrect();
    setTimeout(() => {
      audio.playFanfare();
      audio.speak(`Awesome job, ${kidName}! You are a superstar!`);
    }, 350);

    this.startConfetti();
  }

  closeCelebration() {
    const overlay = document.getElementById("celebrationOverlay");
    if (overlay) overlay.classList.remove("active");
    this.stopConfetti();

    if (this.onNextCelebrationAction) {
      const cb = this.onNextCelebrationAction;
      this.onNextCelebrationAction = null;
      cb();
    }
  }

  triggerSadEffect(element, customMsg) {
    audio.playWrong();
    const kidName = this.player.name || "Champion";
    audio.speak(`Oopsie! Don't worry, ${kidName}! Let's try once more!`);

    if (element) {
      element.classList.remove("sad-red-effect");
      void element.offsetWidth; // Force reflow
      element.classList.add("sad-red-effect");
      setTimeout(() => element.classList.remove("sad-red-effect"), 800);
    }

    const sadBanner = document.querySelector(".screen.active .sad-feedback-banner");
    if (sadBanner) {
      sadBanner.innerHTML = `<span>🥺</span> <span>Oops! Don't worry ${kidName}, try again! 💪</span>`;
      sadBanner.classList.add("active");
      setTimeout(() => sadBanner.classList.remove("active"), 2600);
    }
  }

  initConfettiCanvas() {
    this.confettiCanvas = document.getElementById("confettiCanvas");
    if (this.confettiCanvas) {
      this.confettiCtx = this.confettiCanvas.getContext("2d");
      window.addEventListener("resize", () => this.resizeConfetti());
      this.resizeConfetti();
    }
  }

  resizeConfetti() {
    if (this.confettiCanvas) {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    }
  }

  startConfetti() {
    this.resizeConfetti();
    this.confettiRunning = true;
    this.particles = [];
    const colors = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#2dd4bf", "#38bdf8", "#818cf8", "#c084fc", "#f472b6"];

    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 140,
        y: window.innerHeight * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.38,
        life: 140
      });
    }

    const animate = () => {
      if (!this.confettiRunning || !this.confettiCtx) return;
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

      let alive = false;
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.life--;

        if (p.life > 0 && p.y < window.innerHeight + 20) {
          alive = true;
          this.confettiCtx.save();
          this.confettiCtx.translate(p.x, p.y);
          this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
          this.confettiCtx.fillStyle = p.color;
          this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          this.confettiCtx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        this.confettiRunning = false;
      }
    };
    requestAnimationFrame(animate);
  }

  stopConfetti() {
    this.confettiRunning = false;
    if (this.confettiCtx && this.confettiCanvas) {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
  }

  // ----------------------------------------------------------
  // 4. TRADITIONAL MULTIPLICATION TABLES (1 TO 20)
  // ----------------------------------------------------------
  openTablesExplorer() {
    this.showScreen("screenTablesExplorer");
    this.initTablesBar();
    this.renderTableRows();
  }

  initTablesBar() {
    const bar = document.getElementById("tableSelectorBar");
    if (!bar) return;
    bar.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
      const btn = document.createElement("button");
      btn.className = `btn-tab-num ${i === this.currentTable ? "active" : ""}`;
      btn.textContent = i;
      btn.type = "button";
      btn.onclick = () => {
        this.currentTable = i;
        document.querySelectorAll(".btn-tab-num").forEach((b, idx) => {
          b.classList.toggle("active", idx + 1 === i);
        });
        audio.playClick();
        this.renderTableRows();
      };
      bar.appendChild(btn);
    }
  }

  switchTableLang(lang) {
    this.tableLang = lang;
    const btnEn = document.getElementById("btnTableLangEn");
    const btnHi = document.getElementById("btnTableLangHi");
    if (btnEn) btnEn.classList.toggle("active", lang === "en");
    if (btnHi) btnHi.classList.toggle("active", lang === "hi");
    audio.playClick();
    this.renderTableRows();
  }

  renderTableRows() {
    this.stopTableRecite();
    const container = document.getElementById("tableRowsContainer");
    if (!container) return;
    container.innerHTML = "";

    for (let step = 1; step <= 10; step++) {
      const prod = this.currentTable * step;
      const row = document.createElement("div");
      row.className = "table-row-item";
      row.dataset.step = step;

      const phrase = this.tableLang === "hi"
        ? SoundEngine.getHindiTablePhrase(this.currentTable, step)
        : SoundEngine.getEnglishTablePhrase(this.currentTable, step);

      row.innerHTML = `
        <span>${this.currentTable} × ${step}</span>
        <span style="color:#64748b">=</span>
        <span style="color:#2563eb; font-weight:900;">${prod}</span>
        <span style="font-size:0.85rem; color:#64748b;">🔊</span>
      `;

      row.onclick = () => {
        document.querySelectorAll(".table-row-item").forEach(r => r.classList.remove("speaking"));
        row.classList.add("speaking");
        audio.playClick();
        audio.speakTableStep(this.currentTable, step, this.tableLang);
      };

      container.appendChild(row);
    }

    const trick = TABLE_TIPS[this.currentTable] || "Practice every day to build lightning speed!";
    const trickEl = document.getElementById("tableTrickText");
    if (trickEl) trickEl.innerHTML = `💡 <strong>Table ${this.currentTable} Memory Trick:</strong> ${trick}`;
  }

  reciteWholeTable() {
    this.stopTableRecite();
    this.tableReciting = true;
    audio.playClick();

    const stopBtn = document.getElementById("btnStopTableRecite");
    if (stopBtn) stopBtn.style.display = "inline-block";

    const rows = document.querySelectorAll(".table-row-item");
    let step = 1;

    const speakStep = () => {
      if (!this.tableReciting || step > 10 || this.currentScreen !== "screenTablesExplorer") {
        this.stopTableRecite();
        return;
      }

      rows.forEach(r => r.classList.remove("speaking"));
      if (rows[step - 1]) rows[step - 1].classList.add("speaking");

      audio.speakTableStep(this.currentTable, step, this.tableLang);

      step++;
      this.tableReciteTimer = setTimeout(speakStep, 2400);
    };

    speakStep();
  }

  stopTableRecite() {
    this.tableReciting = false;
    if (this.tableReciteTimer) {
      clearTimeout(this.tableReciteTimer);
      this.tableReciteTimer = null;
    }
    const stopBtn = document.getElementById("btnStopTableRecite");
    if (stopBtn) stopBtn.style.display = "none";
    document.querySelectorAll(".table-row-item").forEach(r => r.classList.remove("speaking"));
  }

  startTableQuiz() {
    this.mathArenaMode = "mult";
    this.showScreen("screenMathArena");
    this.renderMathArena();
  }

  // ----------------------------------------------------------
  // 5. ENGLISH ALPHABET & BALLOON POP
  // ----------------------------------------------------------
  renderAlphabetCard() {
    const d = ALPHABET_DATA[this.alphaIdx];
    const display = document.getElementById("alphabetFlashcard");
    if (display) {
      display.style.background = `linear-gradient(135deg, ${d.color} 0%, #3b82f6 100%)`;
    }
    const giant = document.getElementById("alphaGiant");
    if (giant) giant.textContent = `${d.letter} ${d.small}`;
    const emoji = document.getElementById("alphaEmoji");
    if (emoji) emoji.textContent = d.emoji;
    const word = document.getElementById("alphaWord");
    if (word) word.textContent = d.word;
    const sentence = document.getElementById("alphaSentence");
    if (sentence) sentence.textContent = d.sentence;

    audio.speak(`${d.letter}! ${d.phonics}. ${d.sentence}`);
  }

  nextAlphabet() {
    audio.playClick();
    this.alphaIdx = (this.alphaIdx + 1) % ALPHABET_DATA.length;
    this.renderAlphabetCard();
  }

  prevAlphabet() {
    audio.playClick();
    this.alphaIdx = (this.alphaIdx - 1 + ALPHABET_DATA.length) % ALPHABET_DATA.length;
    this.renderAlphabetCard();
  }

  speakCurrentAlphabet() {
    audio.playClick();
    const d = ALPHABET_DATA[this.alphaIdx];
    audio.speak(`${d.letter} for ${d.word}! ${d.sentence}`);
  }



  // ----------------------------------------------------------
  // 6. HINDI VARNAMALA & PRONUNCIATION GAME (स्वर, व्यंजन व उच्चारण खेल)
  // ----------------------------------------------------------
  switchHindiType(type) {
    audio.playClick();
    this.hindiType = type;
    const btnSwar = document.getElementById("btnHindiSwar");
    const btnVyanjan = document.getElementById("btnHindiVyanjan");
    const btnGame = document.getElementById("btnHindiPronounceGameTab");
    const viewFlash = document.getElementById("viewHindiFlashcards");
    const viewGame = document.getElementById("viewHindiPronounceGame");

    if (btnSwar) btnSwar.classList.toggle("active", type === "swar");
    if (btnVyanjan) btnVyanjan.classList.toggle("active", type === "vyanjan");
    if (btnGame) btnGame.classList.toggle("active", type === "pronounce");

    if (type === "pronounce") {
      if (viewFlash) viewFlash.style.display = "none";
      if (viewGame) viewGame.style.display = "block";
      this.initHindiPronounceGame();
    } else {
      if (viewFlash) viewFlash.style.display = "block";
      if (viewGame) viewGame.style.display = "none";
      this.hindiIdx = 0;
      this.renderHindiCard();
    }
  }

  renderHindiCard() {
    const list = this.hindiType === "swar" ? HINDI_SWAR : HINDI_VYANJAN;
    const d = list[this.hindiIdx % list.length];
    const display = document.getElementById("hindiFlashcard");
    if (display) {
      display.style.background = `linear-gradient(135deg, ${d.color} 0%, #a855f7 100%)`;
    }
    const letterEl = document.getElementById("hindiGiantLetter");
    if (letterEl) letterEl.textContent = d.letter;
    const emojiEl = document.getElementById("hindiEmoji");
    if (emojiEl) emojiEl.textContent = d.emoji;
    const wordEl = document.getElementById("hindiWord");
    if (wordEl) wordEl.textContent = d.title || `${d.letter} से ${d.word}`;
    const phonicsEl = document.getElementById("hindiPhonics");
    if (phonicsEl) phonicsEl.textContent = d.phonics;

    audio.speakHindi(d.spoken, d.roman);
  }

  nextHindi() {
    audio.playClick();
    const list = this.hindiType === "swar" ? HINDI_SWAR : HINDI_VYANJAN;
    this.hindiIdx = (this.hindiIdx + 1) % list.length;
    this.renderHindiCard();
  }

  prevHindi() {
    audio.playClick();
    const list = this.hindiType === "swar" ? HINDI_SWAR : HINDI_VYANJAN;
    this.hindiIdx = (this.hindiIdx - 1 + list.length) % list.length;
    this.renderHindiCard();
  }

  speakCurrentHindi() {
    audio.playClick();
    const list = this.hindiType === "swar" ? HINDI_SWAR : HINDI_VYANJAN;
    const d = list[this.hindiIdx % list.length];
    audio.speakHindi(d.spoken, d.roman);
  }

  initHindiPronounceGame() {
    const list = HINDI_PRONUNCIATION_GAME_DATA;
    this.hindiPronounceTarget = list[this.hindiPronounceIdx % list.length];
    const q = this.hindiPronounceTarget;

    const promptEl = document.getElementById("hindiPronouncePrompt");
    if (promptEl) {
      promptEl.textContent = `${q.emoji} ${q.promptText} (${q.romanPrompt})`;
    }

    const box = document.getElementById("hindiPronounceOptionsBox");
    if (box) {
      box.innerHTML = "";
      q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.style.fontSize = "2.2rem";
        btn.style.padding = "16px";
        btn.style.fontWeight = "900";
        btn.textContent = opt;
        btn.type = "button";
        btn.onclick = () => this.checkHindiPronounceAnswer(opt, btn);
        box.appendChild(btn);
      });
    }

    this.speakHindiPronouncePrompt();
  }

  speakHindiPronouncePrompt() {
    if (this.hindiPronounceTarget) {
      const q = this.hindiPronounceTarget;
      audio.speakHindi(q.promptText, q.romanPrompt);
    }
  }

  checkHindiPronounceAnswer(selected, btnEl) {
    const q = this.hindiPronounceTarget;
    if (selected === q.targetLetter) {
      audio.playCorrect();
      this.celebrateSuccess(
        `शाबाश! आपने सही अक्षर पहचाना: "${q.targetLetter}" से ${q.word} ${q.emoji}! 🌟`,
        () => {
          this.hindiPronounceIdx = (this.hindiPronounceIdx + 1) % HINDI_PRONUNCIATION_GAME_DATA.length;
          this.initHindiPronounceGame();
        }
      );
      audio.speakHindi(`शाबाश! बहुत बढ़िया! ${q.targetLetter} से ${q.word}!`, `Shaabaash! Bahut badhiya! ${q.targetLetter} se ${q.word}!`);
    } else {
      audio.playWrong();
      this.triggerSadEffect(btnEl, `गलत अक्षर! यह '${selected}' है, '${q.targetLetter}' नहीं!`);
      audio.speakHindi("फिर से कोशिश करो!", "Phir se koshish karo!");
    }
  }

  // ----------------------------------------------------------
  // 7. COUNTING SAFARI (1 TO 100 & TENS TO 1000)
  // ----------------------------------------------------------
  renderCountingSafari() {
    if (this.countMode === "1to100") {
      const d = COUNTING_DATA[this.countIdx];
      const giant = document.getElementById("countNumberGiant");
      if (giant) giant.textContent = d.num;
      const words = document.getElementById("countWords");
      if (words) words.textContent = `${d.en} • ${d.hi}`;

      const shelf = document.getElementById("countingItemsShelf");
      if (shelf) {
        shelf.innerHTML = "";
        const maxDisplay = Math.min(d.num, 30);
        for (let i = 1; i <= maxDisplay; i++) {
          const item = document.createElement("span");
          item.className = "item-badge";
          item.textContent = d.emoji;
          item.onclick = () => {
            audio.playPop();
            audio.speak(`${i}`);
          };
          shelf.appendChild(item);
        }
      }

      audio.speak(`${d.num}! ${d.en}!`);
    } else {
      const d = TENS_TO_1000_DATA[this.tensIdx];
      const giant = document.getElementById("countNumberGiant");
      if (giant) giant.textContent = d.num;
      const words = document.getElementById("countWords");
      if (words) words.textContent = `${d.en} • ${d.hi}`;

      const shelf = document.getElementById("countingItemsShelf");
      if (shelf) {
        shelf.innerHTML = "";
        const item = document.createElement("span");
        item.className = "item-badge";
        item.style.fontSize = "3.5rem";
        item.textContent = d.emoji;
        item.onclick = () => {
          audio.playPop();
          audio.speak(`${d.en}`);
        };
        shelf.appendChild(item);
      }

      audio.speak(`${d.num}! ${d.en}! ${d.hi}!`);
    }
  }

  switchCountMode(mode) {
    this.countMode = mode;
    const btn1to100 = document.getElementById("btnCountMode1to100");
    const btnTens = document.getElementById("btnCountModeTens");
    if (btn1to100) btn1to100.classList.toggle("active", mode === "1to100");
    if (btnTens) btnTens.classList.toggle("active", mode === "tens");
    audio.playClick();
    this.renderCountingSafari();
  }

  nextCounting() {
    audio.playClick();
    if (this.countMode === "1to100") {
      this.countIdx = (this.countIdx + 1) % COUNTING_DATA.length;
    } else {
      this.tensIdx = (this.tensIdx + 1) % TENS_TO_1000_DATA.length;
    }
    this.renderCountingSafari();
  }

  prevCounting() {
    audio.playClick();
    if (this.countMode === "1to100") {
      this.countIdx = (this.countIdx - 1 + COUNTING_DATA.length) % COUNTING_DATA.length;
    } else {
      this.tensIdx = (this.tensIdx - 1 + TENS_TO_1000_DATA.length) % TENS_TO_1000_DATA.length;
    }
    this.renderCountingSafari();
  }

  speakCurrentCounting() {
    audio.playClick();
    if (this.countMode === "1to100") {
      const d = COUNTING_DATA[this.countIdx];
      audio.speak(`${d.num}! ${d.en}! In Hindi, ${d.hi}!`);
    } else {
      const d = TENS_TO_1000_DATA[this.tensIdx];
      audio.speak(`${d.num}! ${d.en}! In Hindi, ${d.hi}!`);
    }
  }

  // ----------------------------------------------------------
  // 8. COLOURS & SHAPES RECOGNITION
  // ----------------------------------------------------------
  openColorsShapes() {
    this.showScreen("screenColorsShapes");
    this.renderColorsGrid();
    this.renderShapesGrid();
  }

  switchColorShapeTab(tab) {
    this.colorTab = tab;
    const btnC = document.getElementById("btnTabColors");
    const btnS = document.getElementById("btnTabShapes");
    if (btnC) btnC.classList.toggle("active", tab === "colors");
    if (btnS) btnS.classList.toggle("active", tab === "shapes");

    const viewC = document.getElementById("viewColorsContainer");
    const viewS = document.getElementById("viewShapesContainer");
    if (viewC) viewC.style.display = tab === "colors" ? "block" : "none";
    if (viewS) viewS.style.display = tab === "shapes" ? "block" : "none";
    audio.playClick();
  }

  renderColorsGrid() {
    const grid = document.getElementById("colorPaletteGrid");
    if (!grid) return;
    grid.innerHTML = "";

    COLORS_DATA.forEach(c => {
      const card = document.createElement("div");
      card.className = "color-card-item";
      card.style.background = c.hex;
      card.style.color = (c.name === "White" || c.name === "Yellow") ? "#1e293b" : "#ffffff";
      card.innerHTML = `
        <div style="font-size:3rem; margin-bottom:8px;">${c.emoji}</div>
        <h3 style="font-size:1.4rem; font-weight:900;">${c.name}</h3>
        <p style="font-size:1rem; font-weight:800;">${c.hi}</p>
        <p style="font-size:0.85rem; margin-top:6px; opacity:0.9;">${c.example}</p>
      `;

      card.onclick = () => {
        audio.playClick();
        audio.speak(`${c.name}! In Hindi, ${c.hi}! ${c.example}`);
        card.style.transform = "scale(1.1)";
        setTimeout(() => card.style.transform = "", 300);
      };

      grid.appendChild(card);
    });
  }

  renderShapesGrid() {
    const grid = document.getElementById("shapesCardsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    SHAPES_DATA.forEach(s => {
      const card = document.createElement("div");
      card.className = "shape-card-item";
      card.innerHTML = `
        <div style="font-size:3.5rem; margin-bottom:6px;">${s.emoji}</div>
        <h3 style="font-size:1.35rem; font-weight:900; color:#1e293b;">${s.name}</h3>
        <p style="font-size:1rem; font-weight:800; color:#7c3aed;">${s.hi}</p>
        <p style="font-size:0.9rem; color:#475569; margin:8px 0;">${s.sides}</p>
        <span style="font-size:0.8rem; background:#eff6ff; color:#2563eb; padding:3px 10px; border-radius:999px;">
          e.g. ${s.example}
        </span>
      `;

      card.onclick = () => {
        audio.playClick();
        audio.speak(`${s.name}! ${s.hi}! ${s.sides}`);
        card.style.transform = "scale(1.08)";
        setTimeout(() => card.style.transform = "", 300);
      };

      grid.appendChild(card);
    });
  }

  // ----------------------------------------------------------
  // 9. NURSERY MAGIC PAINTING & COLORING STUDIO ENGINE
  // ----------------------------------------------------------
  openPaintingStudio() {
    this.showScreen("screenPaintingStudio");
    this.initPaintingCanvas();
    this.renderPaintingTemplatesBar();
    this.renderPaintingPalette();
    this.renderPaintingStickers();
    audio.speak("Welcome to Magic Painting and Coloring Studio! Pick a cute outline or draw freely with bright colours!");
  }

  initPaintingCanvas() {
    this.paintCanvas = document.getElementById("paintCanvas");
    if (!this.paintCanvas) return;
    this.paintCtx = this.paintCanvas.getContext("2d");

    // Initialize blank white canvas if first time
    if (!this.paintCanvasInitialized) {
      this.paintCanvasInitialized = true;
      this.paintHistory = [];
      this.clearPaintCanvas(false);
      this.bindPaintingEvents();
    }
  }

  bindPaintingEvents() {
    if (!this.paintCanvas) return;

    const getPos = (e) => {
      const rect = this.paintCanvas.getBoundingClientRect();
      const scaleX = this.paintCanvas.width / rect.width;
      const scaleY = this.paintCanvas.height / rect.height;
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.saveCanvasState();

      if (this.activeSticker) {
        this.stampStickerOnCanvas(this.activeSticker, pos.x, pos.y);
        return;
      }

      this.isPainting = true;
      this.lastPaintPos = pos;
      this.drawPaintStroke(pos.x, pos.y, false);
    };

    const moveDraw = (e) => {
      if (!this.isPainting) return;
      e.preventDefault();
      const pos = getPos(e);
      this.drawPaintStroke(pos.x, pos.y, true);
      this.lastPaintPos = pos;
    };

    const endDraw = (e) => {
      if (this.isPainting) {
        this.isPainting = false;
      }
    };

    this.paintCanvas.addEventListener("pointerdown", startDraw);
    this.paintCanvas.addEventListener("pointermove", moveDraw);
    window.addEventListener("pointerup", endDraw);

    // Touch events fallback for mobile
    this.paintCanvas.addEventListener("touchstart", startDraw, { passive: false });
    this.paintCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    window.addEventListener("touchend", endDraw);
  }

  drawPaintStroke(x, y, isLine = true) {
    if (!this.paintCtx) return;
    const ctx = this.paintCtx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.brushTool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = this.brushSize * 2.2;
      ctx.shadowBlur = 0;
    } else if (this.brushTool === "neon") {
      ctx.strokeStyle = this.paintColor;
      ctx.shadowColor = this.paintColor;
      ctx.shadowBlur = 14;
      ctx.lineWidth = this.brushSize;
    } else if (this.brushTool === "rainbow") {
      this.rainbowHue = (this.rainbowHue + 4) % 360;
      ctx.strokeStyle = `hsl(${this.rainbowHue}, 95%, 55%)`;
      ctx.shadowBlur = 0;
      ctx.lineWidth = this.brushSize;
    } else {
      ctx.strokeStyle = this.paintColor;
      ctx.shadowBlur = 0;
      ctx.lineWidth = this.brushSize;
    }

    ctx.beginPath();
    if (isLine) {
      ctx.moveTo(this.lastPaintPos.x, this.lastPaintPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }

  saveCanvasState() {
    if (!this.paintCanvas || !this.paintCtx) return;
    if (this.paintHistory.length >= 15) {
      this.paintHistory.shift();
    }
    this.paintHistory.push(this.paintCanvas.toDataURL());
  }

  undoPaint() {
    if (!this.paintHistory || this.paintHistory.length === 0) return;
    audio.playClick();
    const lastState = this.paintHistory.pop();
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      this.paintCtx.clearRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);
      this.paintCtx.drawImage(img, 0, 0);
    };
  }

  clearPaintCanvas(withSound = true) {
    if (!this.paintCanvas || !this.paintCtx) return;
    if (withSound) {
      this.saveCanvasState();
      audio.playPop();
    }
    this.paintCtx.fillStyle = "#ffffff";
    this.paintCtx.fillRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);

    if (this.paintTemplate && this.paintTemplate !== "blank") {
      this.drawTemplateOutline(this.paintTemplate);
    }
  }

  renderPaintingTemplatesBar() {
    const bar = document.getElementById("paintingTemplatesBar");
    if (!bar) return;
    bar.innerHTML = "";

    PAINTING_TEMPLATES.forEach((tpl) => {
      const btn = document.createElement("button");
      btn.className = `btn-outline-chip ${this.paintTemplate === tpl.id ? "active" : ""}`;
      btn.type = "button";
      btn.innerHTML = `<span>${tpl.icon}</span> <span>${tpl.name}</span>`;
      btn.onclick = () => {
        audio.playClick();
        this.selectPaintTemplate(tpl.id, btn);
      };
      bar.appendChild(btn);
    });
  }

  selectPaintTemplate(templateId, btnEl) {
    this.paintTemplate = templateId;
    document.querySelectorAll("#paintingTemplatesBar .btn-outline-chip").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");

    this.saveCanvasState();
    this.clearPaintCanvas(false);

    const tpl = PAINTING_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      audio.speak(`Here is an outline of ${tpl.name}! Let's paint it!`);
    }
  }

  drawTemplateOutline(templateId) {
    if (!this.paintCtx || !this.paintCanvas) return;
    const ctx = this.paintCtx;
    const w = this.paintCanvas.width;
    const h = this.paintCanvas.height;

    ctx.save();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const cx = w / 2;
    const cy = h / 2;

    if (templateId === "apple") {
      // Big Apple outline
      ctx.beginPath();
      ctx.moveTo(cx, cy - 80);
      ctx.bezierCurveTo(cx + 120, cy - 140, cx + 180, cy + 40, cx + 100, cy + 130);
      ctx.bezierCurveTo(cx + 40, cy + 170, cx, cy + 140, cx, cy + 140);
      ctx.bezierCurveTo(cx, cy + 140, cx - 40, cy + 170, cx - 100, cy + 130);
      ctx.bezierCurveTo(cx - 180, cy + 40, cx - 120, cy - 140, cx, cy - 80);
      ctx.stroke();

      // Stem & Leaf
      ctx.beginPath();
      ctx.moveTo(cx, cy - 80);
      ctx.quadraticCurveTo(cx + 15, cy - 140, cx + 30, cy - 150);
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx + 50, cy - 130, 26, 12, Math.PI / 4, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (templateId === "car") {
      // Car Body
      ctx.beginPath();
      ctx.roundRect(cx - 190, cy + 10, 380, 80, 20);
      ctx.stroke();

      // Car Cabin
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy + 10);
      ctx.lineTo(cx - 80, cy - 70);
      ctx.lineTo(cx + 90, cy - 70);
      ctx.lineTo(cx + 140, cy + 10);
      ctx.closePath();
      ctx.stroke();

      // Windows
      ctx.beginPath();
      ctx.rect(cx - 70, cy - 60, 65, 60);
      ctx.rect(cx + 10, cy - 60, 65, 60);
      ctx.stroke();

      // Wheels
      ctx.beginPath();
      ctx.arc(cx - 100, cy + 90, 36, 0, Math.PI * 2);
      ctx.arc(cx + 100, cy + 90, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 100, cy + 90, 16, 0, Math.PI * 2);
      ctx.arc(cx + 100, cy + 90, 16, 0, Math.PI * 2);
      ctx.stroke();

    } else if (templateId === "star") {
      // 5-Pointed Star
      const spikes = 5;
      const outerR = 140;
      const innerR = 65;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerR;
        let y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.stroke();

      // Cute Smile in center
      ctx.beginPath();
      ctx.arc(cx - 30, cy - 15, 8, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 15, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy + 10, 24, 0, Math.PI);
      ctx.lineWidth = 4;
      ctx.stroke();

    } else if (templateId === "cat") {
      // Kitty Head
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 120, 100, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Ears
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy - 50);
      ctx.lineTo(cx - 120, cy - 150);
      ctx.lineTo(cx - 30, cy - 80);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 90, cy - 50);
      ctx.lineTo(cx + 120, cy - 150);
      ctx.lineTo(cx + 30, cy - 80);
      ctx.stroke();

      // Eyes & Nose
      ctx.beginPath();
      ctx.arc(cx - 45, cy - 10, 12, 0, Math.PI * 2);
      ctx.arc(cx + 45, cy - 10, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 20);
      ctx.lineTo(cx + 10, cy + 20);
      ctx.lineTo(cx, cy + 30);
      ctx.closePath();
      ctx.fill();

      // Whiskers
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy + 25); ctx.lineTo(cx - 130, cy + 15);
      ctx.moveTo(cx - 50, cy + 35); ctx.lineTo(cx - 130, cy + 45);
      ctx.moveTo(cx + 50, cy + 25); ctx.lineTo(cx + 130, cy + 15);
      ctx.moveTo(cx + 50, cy + 35); ctx.lineTo(cx + 130, cy + 45);
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (templateId === "butterfly") {
      // Butterfly Body
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 90, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Wings Top
      ctx.beginPath();
      ctx.ellipse(cx - 90, cy - 40, 80, 60, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + 90, cy - 40, 80, 60, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Wings Bottom
      ctx.beginPath();
      ctx.ellipse(cx - 75, cy + 50, 55, 45, 0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + 75, cy + 50, 55, 45, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Antennae
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 80);
      ctx.quadraticCurveTo(cx - 30, cy - 130, cx - 40, cy - 120);
      ctx.moveTo(cx + 5, cy - 80);
      ctx.quadraticCurveTo(cx + 30, cy - 130, cx + 40, cy - 120);
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (templateId === "rocket") {
      // Rocket Body
      ctx.beginPath();
      ctx.moveTo(cx, cy - 150);
      ctx.bezierCurveTo(cx + 60, cy - 70, cx + 60, cy + 70, cx + 40, cy + 110);
      ctx.lineTo(cx - 40, cy + 110);
      ctx.bezierCurveTo(cx - 60, cy + 70, cx - 60, cy - 70, cx, cy - 150);
      ctx.stroke();

      // Porthole Window
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Fins
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy + 50);
      ctx.lineTo(cx - 100, cy + 120);
      ctx.lineTo(cx - 40, cy + 105);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 50, cy + 50);
      ctx.lineTo(cx + 100, cy + 120);
      ctx.lineTo(cx + 40, cy + 105);
      ctx.stroke();

    } else if (templateId === "icecream") {
      // Cone
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy + 10);
      ctx.lineTo(cx + 55, cy + 10);
      ctx.lineTo(cx, cy + 150);
      ctx.closePath();
      ctx.stroke();

      // Ice cream scoops
      ctx.beginPath();
      ctx.arc(cx, cy - 15, 65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy - 85, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Cherry on top
      ctx.beginPath();
      ctx.arc(cx, cy - 145, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  renderPaintingPalette() {
    const paletteBox = document.getElementById("paintColorPalette");
    if (!paletteBox) return;
    paletteBox.innerHTML = "";

    PAINTING_PALETTE.forEach((col, idx) => {
      const swatch = document.createElement("div");
      swatch.className = `color-swatch ${col.hex === this.paintColor ? "selected" : ""}`;
      swatch.style.background = col.hex;
      swatch.title = `${col.name} (${col.hi})`;

      swatch.onclick = () => {
        this.selectPaintColor(col.hex, swatch);
      };

      paletteBox.appendChild(swatch);
    });

    // Wire Brush Size Buttons
    document.querySelectorAll(".btn-brush-size").forEach(btn => {
      btn.onclick = () => {
        const size = parseInt(btn.dataset.size) || 8;
        this.selectBrushSize(size, btn);
      };
    });

    // Wire Special Pen Buttons
    const rainbowBtn = document.getElementById("btnRainbowPen");
    if (rainbowBtn) rainbowBtn.onclick = () => this.selectBrushTool("rainbow", rainbowBtn);

    const neonBtn = document.getElementById("btnNeonPen");
    if (neonBtn) neonBtn.onclick = () => this.selectBrushTool("neon", neonBtn);

    const eraserBtn = document.getElementById("btnEraserTool");
    if (eraserBtn) eraserBtn.onclick = () => this.selectBrushTool("eraser", eraserBtn);

    const undoBtn = document.getElementById("btnUndoPaint");
    if (undoBtn) undoBtn.onclick = () => this.undoPaint();

    const clearBtn = document.getElementById("btnClearCanvas");
    if (clearBtn) clearBtn.onclick = () => this.clearPaintCanvas(true);

    const downloadBtn = document.getElementById("btnDownloadArt");
    if (downloadBtn) downloadBtn.onclick = () => this.downloadPaintArt();
  }

  selectPaintColor(hex, swatchEl) {
    audio.playClick();
    this.paintColor = hex;
    this.brushTool = "pencil";
    this.activeSticker = null;

    document.querySelectorAll("#paintColorPalette .color-swatch").forEach(s => s.classList.remove("selected"));
    if (swatchEl) swatchEl.classList.add("selected");
    document.querySelectorAll(".btn-special-tool").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".sticker-chip").forEach(s => s.classList.remove("selected"));

    const col = PAINTING_PALETTE.find(c => c.hex === hex);
    if (col) {
      audio.speak(`${col.name}! ${col.hi}!`);
    }
  }

  selectBrushSize(size, btnEl) {
    audio.playClick();
    this.brushSize = size;
    document.querySelectorAll(".btn-brush-size").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
  }

  selectBrushTool(tool, btnEl) {
    audio.playClick();
    this.brushTool = tool;
    this.activeSticker = null;

    document.querySelectorAll(".btn-special-tool").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".sticker-chip").forEach(s => s.classList.remove("selected"));
    if (btnEl) btnEl.classList.add("active");

    if (tool === "rainbow") {
      audio.speak("Rainbow Magic Pen activated!");
    } else if (tool === "neon") {
      audio.speak("Neon Glow Pen ready!");
    } else if (tool === "eraser") {
      audio.speak("Eraser ready to clean!");
    }
  }

  renderPaintingStickers() {
    const bar = document.getElementById("paintStampsBar");
    if (!bar) return;
    bar.innerHTML = "";

    PAINTING_STICKERS.forEach((stk) => {
      const chip = document.createElement("button");
      chip.className = "sticker-chip";
      chip.type = "button";
      chip.textContent = stk.emoji;
      chip.title = stk.name;

      chip.onclick = () => {
        audio.playClick();
        this.selectSticker(stk.emoji, chip);
      };

      bar.appendChild(chip);
    });
  }

  selectSticker(emoji, chipEl) {
    this.activeSticker = emoji;
    document.querySelectorAll(".sticker-chip").forEach(c => c.classList.remove("selected"));
    if (chipEl) chipEl.classList.add("selected");
    audio.speak(`Tap on canvas to stamp ${emoji}!`);
  }

  stampStickerOnCanvas(emoji, x, y) {
    if (!this.paintCtx) return;
    audio.playPop();
    const ctx = this.paintCtx;
    ctx.save();
    ctx.font = "54px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.fillText(emoji, x, y);
    ctx.restore();
  }

  downloadPaintArt() {
    if (!this.paintCanvas) return;
    audio.playClick();
    const kidName = (this.player.name || "Little_Champion").replace(/\s+/g, "_");
    const link = document.createElement("a");
    link.download = `${kidName}_artwork_${Date.now()}.png`;
    link.href = this.paintCanvas.toDataURL("image/png");
    link.click();
    this.celebrateSuccess("Your artwork is downloaded! Show it to your parents and teacher! 🎨🖼️", () => {});
  }

  cheerArtwork() {
    audio.playClick();
    this.addStars(5);
    const kidName = this.player.name || "Little Artist";
    const cheers = [
      `Magnificent artwork, ${kidName}! You have such a creative imagination!`,
      `Incredible colors and lines, ${kidName}! A true master artist in the making!`,
      `Wow! That looks so colorful and happy! Outstanding masterpiece, ${kidName}!`
    ];
    const cheer = cheers[Math.floor(Math.random() * cheers.length)];
    this.celebrateSuccess(cheer, () => {});
  }

  // ----------------------------------------------------------
  // 10. OPEN DICTATION & SPELLING STUDIO (ENGLISH & HINDI)
  // ----------------------------------------------------------
  openDictationStudio() {
    this.showScreen("screenDictation");
    this.renderDictationCard();
  }

  setDictationLanguage(lang) {
    this.dictationLang = lang;
    this.dictationIdx = 0;
    const btnEn = document.getElementById("btnDictLangEn");
    const btnHi = document.getElementById("btnDictLangHi");
    if (btnEn) btnEn.classList.toggle("active", lang === "en");
    if (btnHi) btnHi.classList.toggle("active", lang === "hi");
    audio.playClick();
    this.renderDictationCard();
  }

  setDictationGrade(grade) {
    this.dictationGrade = grade;
    this.dictationIdx = 0;
    document.querySelectorAll("#dictationClassBar .btn-pill-toggle").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.grade === grade);
    });
    audio.playClick();
    this.renderDictationCard();
  }

  getDictationList() {
    if (this.dictationLang === "hi") {
      return DICTATION_HINDI_DATA[this.dictationGrade] || DICTATION_HINDI_DATA["Class 1"];
    }
    return DICTATION_ENGLISH_DATA[this.dictationGrade] || DICTATION_ENGLISH_DATA["Class 1"];
  }

  renderDictationCard() {
    const isHi = this.dictationLang === "hi";
    const list = this.getDictationList();
    const d = list[this.dictationIdx % list.length];

    const sentenceEl = document.getElementById("dictationSentence");
    if (sentenceEl) sentenceEl.textContent = `"${d.sentence}"`;

    const input = document.getElementById("inputDictationWord");
    if (input) {
      input.value = "";
      input.placeholder = isHi ? "यहाँ शब्द टाइप करें (उदा: कमल / kamal)..." : "Type the spelling here...";
      input.focus();
    }

    const tipEl = document.getElementById("dictationTipText");
    if (tipEl) {
      if (isHi) {
        tipEl.textContent = `अर्थ: ${d.meaning} • उच्चारण: "${d.pronunciation}" • संकेत: ${d.tip}`;
      } else {
        tipEl.textContent = `Hint: Pronounced "${d.pronunciation}". ${d.tip}`;
      }
    }

    this.speakDictationWord();
  }

  speakDictationWord() {
    const isHi = this.dictationLang === "hi";
    const list = this.getDictationList();
    const d = list[this.dictationIdx % list.length];
    if (isHi) {
      audio.speakHindi(d.audio || d.word, d.roman || d.pronunciation);
    } else {
      audio.speak(d.word);
    }
  }

  checkDictationSpelling() {
    const isHi = this.dictationLang === "hi";
    const list = this.getDictationList();
    const d = list[this.dictationIdx % list.length];
    const input = document.getElementById("inputDictationWord");
    const val = (input ? input.value : "").trim().toLowerCase();
    const target = d.word.trim().toLowerCase();
    const romanTarget = (d.roman || d.pronunciation || "").trim().toLowerCase();

    const isMatch = isHi ? (val === target || val === romanTarget) : (val === target);

    if (isMatch) {
      const celebrationMsg = isHi
        ? `शाबाश! आपने सही शब्द लिखा: "${d.word}" (${d.pronunciation})! 🌟`
        : `Superb spelling! "${d.word}" is 100% correct! Superstar! 🌟`;

      this.celebrateSuccess(celebrationMsg, () => {
        this.dictationIdx = (this.dictationIdx + 1) % list.length;
        this.renderDictationCard();
      });

      if (isHi) {
        audio.speakHindi(`शाबाश! बहुत बढ़िया! सही शब्द है ${d.word}!`, `Shaabaash! Sahi shabd hai ${d.pronunciation}!`);
      }
    } else {
      const failMsg = isHi ? `गलत! सही शब्द था: ${d.word} (${d.pronunciation})` : `Oops! Target was ${d.word}`;
      this.triggerSadEffect(input, failMsg);
      if (isHi) {
        audio.speakHindi("फिर से कोशिश करो!", "Phir se koshish karo!");
      }
    }
  }

  nextDictation() {
    audio.playClick();
    const list = this.getDictationList();
    this.dictationIdx = (this.dictationIdx + 1) % list.length;
    this.renderDictationCard();
  }

  prevDictation() {
    audio.playClick();
    const list = this.getDictationList();
    this.dictationIdx = (this.dictationIdx - 1 + list.length) % list.length;
    this.renderDictationCard();
  }

  // ----------------------------------------------------------
  // 11. GENERAL KNOWLEDGE & BRAIN PUZZLES
  // ----------------------------------------------------------
  openGkPuzzles() {
    this.showScreen("screenGkPuzzles");
    this.renderGkQuestion();
    this.renderRiddleQuestion();
  }

  switchGkTab(tab) {
    this.gkTab = tab;
    const btnGk = document.getElementById("btnTabGk");
    const btnR = document.getElementById("btnTabRiddles");
    if (btnGk) btnGk.classList.toggle("active", tab === "gk");
    if (btnR) btnR.classList.toggle("active", tab === "riddles");

    const viewGk = document.getElementById("viewGkContainer");
    const viewR = document.getElementById("viewRiddlesContainer");
    if (viewGk) viewGk.style.display = tab === "gk" ? "block" : "none";
    if (viewR) viewR.style.display = tab === "riddles" ? "block" : "none";
    audio.playClick();
  }

  renderGkQuestion() {
    const q = GK_PUZZLES_DATA[this.gkIdx % GK_PUZZLES_DATA.length];
    const iconEl = document.getElementById("gkIcon");
    if (iconEl) iconEl.textContent = q.icon;

    const qEl = document.getElementById("gkQuestionText");
    if (qEl) qEl.textContent = q.q;

    const subEl = document.getElementById("gkSubText");
    if (subEl) subEl.textContent = q.hi_q;

    const grid = document.getElementById("gkOptionsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.textContent = opt;
      btn.type = "button";
      btn.onclick = () => {
        if (opt === q.ans) {
          this.celebrateSuccess(
            `Correct! ${q.ans}! 🌟 Fun Fact: ${q.fact}`,
            () => {
              this.gkIdx = (this.gkIdx + 1) % GK_PUZZLES_DATA.length;
              this.renderGkQuestion();
            }
          );
        } else {
          this.triggerSadEffect(btn);
        }
      };
      grid.appendChild(btn);
    });

    audio.speak(`${q.q}`);
  }

  renderRiddleQuestion() {
    const r = BRAIN_RIDDLES_DATA[this.riddleIdx % BRAIN_RIDDLES_DATA.length];
    const qEl = document.getElementById("riddleQuestionText");
    if (qEl) qEl.textContent = r.riddle;

    const subEl = document.getElementById("riddleSubText");
    if (subEl) subEl.textContent = r.hi_riddle;

    const grid = document.getElementById("riddleOptionsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    r.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.textContent = opt;
      btn.type = "button";
      btn.onclick = () => {
        if (opt === r.ans) {
          this.celebrateSuccess(
            `You solved the riddle! ${r.ans}! Sharp brain! 🧠`,
            () => {
              this.riddleIdx = (this.riddleIdx + 1) % BRAIN_RIDDLES_DATA.length;
              this.renderRiddleQuestion();
            }
          );
        } else {
          this.triggerSadEffect(btn);
        }
      };
      grid.appendChild(btn);
    });

    audio.speak(`${r.riddle}`);
  }

  // ----------------------------------------------------------
  // 12. MATHEMATICS ARENA (DIV, MULT, ADD/SUB, X, FRACTIONS, LCM/HCF)
  // ----------------------------------------------------------
  openMathArena(mode = "division") {
    this.mathArenaMode = mode;
    this.showScreen("screenMathArena");
    this.renderMathArena();
  }

  switchMathMode(mode) {
    this.mathArenaMode = mode;
    document.querySelectorAll(".math-mode-pill").forEach(pill => {
      pill.classList.remove("active");
    });
    audio.playClick();
    this.renderMathArena();
  }

  renderMathArena() {
    const eqEl = document.getElementById("mathArenaEquation");
    const subEl = document.getElementById("mathArenaSubprompt");
    const shelf = document.getElementById("mathArenaShelf");
    const tipEl = document.getElementById("mathArenaTip");
    const grid = document.getElementById("mathArenaOptionsGrid");
    if (!grid) return;

    if (shelf) shelf.innerHTML = "";
    grid.innerHTML = "";
    if (tipEl) tipEl.style.display = "none";

    // Mode 1: Division Safari
    if (this.mathArenaMode === "division") {
      const p = DIVISION_PUZZLES[this.divIdx % DIVISION_PUZZLES.length];
      eqEl.textContent = p.question;
      subEl.textContent = p.story;
      for (let i = 0; i < p.dividend; i++) {
        const sp = document.createElement("span");
        sp.className = "item-badge";
        sp.textContent = p.item;
        shelf.appendChild(sp);
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = String(opt);
        btn.type = "button";
        btn.onclick = () => {
          if (Number(opt) === Number(p.quotient)) {
            this.celebrateSuccess(
              `Superb! Each friend gets ${opt} ${p.item}! 🎉`,
              () => {
                this.divIdx = (this.divIdx + 1) % DIVISION_PUZZLES.length;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`${p.question}. ${p.story}`);
    }

    // Mode 2: Multiplication Detective
    else if (this.mathArenaMode === "mult") {
      const p = MULTIPLICATION_PUZZLES[this.multIdx % MULTIPLICATION_PUZZLES.length];
      eqEl.textContent = p.q;
      subEl.textContent = "Find the missing factor or solve the product!";
      if (tipEl) {
        tipEl.style.display = "block";
        tipEl.textContent = `💡 Hint: ${p.hint}`;
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = String(opt);
        btn.type = "button";
        btn.onclick = () => {
          if (Number(opt) === Number(p.ans)) {
            this.celebrateSuccess(
              `Brilliant! ${opt} is correct! Math champion! 🌟`,
              () => {
                this.multIdx = (this.multIdx + 1) % MULTIPLICATION_PUZZLES.length;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`${p.q}`);
    }

    // Mode 3: Addition & Subtraction
    else if (this.mathArenaMode === "addsub") {
      const p = ADD_SUB_PUZZLES[this.addSubIdx % ADD_SUB_PUZZLES.length];
      eqEl.textContent = p.q;
      subEl.textContent = "Calculate the correct total or difference!";
      if (tipEl) {
        tipEl.style.display = "block";
        tipEl.textContent = `💡 Hint: ${p.hint}`;
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = String(opt);
        btn.type = "button";
        btn.onclick = () => {
          if (Number(opt) === Number(p.ans)) {
            this.celebrateSuccess(
              `Awesome! ${opt} is correct! ➕➖`,
              () => {
                this.addSubIdx = (this.addSubIdx + 1) % ADD_SUB_PUZZLES.length;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`${p.q}`);
    }

    // Mode 4: Find the Value of X
    else if (this.mathArenaMode === "findx") {
      const p = FIND_X_PUZZLES[this.findXIdx % FIND_X_PUZZLES.length];
      eqEl.textContent = p.equation;
      subEl.textContent = p.question;
      if (tipEl) {
        tipEl.style.display = "block";
        tipEl.textContent = `💡 Hint: ${p.hint}`;
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = `x = ${opt}`;
        btn.type = "button";
        btn.onclick = () => {
          if (Number(opt) === Number(p.ans)) {
            this.celebrateSuccess(
              `Master algebra! x = ${opt} is the exact solution! 📐`,
              () => {
                this.findXIdx = (this.findXIdx + 1) % FIND_X_PUZZLES.length;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`Find the value of x in ${p.equation}`);
    }

    // Mode 5: Fractions & Decimals
    else if (this.mathArenaMode === "fractions") {
      const p = FRACTIONS_DECIMALS_PUZZLES[this.fractionIdx % FRACTIONS_DECIMALS_PUZZLES.length];
      eqEl.textContent = p.visual;
      subEl.textContent = p.q;
      if (tipEl) {
        tipEl.style.display = "block";
        tipEl.textContent = `💡 Hint: ${p.hint}`;
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = String(opt);
        btn.type = "button";
        btn.onclick = () => {
          if (String(opt).trim() === String(p.ans).trim()) {
            this.celebrateSuccess(
              `Brilliant! ${opt} is correct! 🍕`,
              () => {
                this.fractionIdx = (this.fractionIdx + 1) % FRACTIONS_DECIMALS_PUZZLES.length;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`${p.q}`);
    }

    // Mode 6: LCM & HCF
    else if (this.mathArenaMode === "lcmhcf") {
      const isHcf = (this.lcmIdx % 2 === 1);
      const p = isHcf
        ? HCF_PUZZLES[Math.floor(this.lcmIdx / 2) % HCF_PUZZLES.length]
        : LCM_PUZZLES[Math.floor(this.lcmIdx / 2) % LCM_PUZZLES.length];

      eqEl.textContent = p.title;
      subEl.textContent = p.explanation;
      if (tipEl) {
        tipEl.style.display = "block";
        tipEl.textContent = isHcf
          ? `💡 Highest Common Factor of ${p.num1} & ${p.num2}`
          : `💡 Lowest Common Multiple of ${p.num1} & ${p.num2}`;
      }
      p.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option";
        btn.textContent = String(opt);
        btn.type = "button";
        btn.onclick = () => {
          if (Number(opt) === Number(p.answer)) {
            const kind = isHcf ? "HCF" : "LCM";
            this.celebrateSuccess(
              `Outstanding! ${kind} is ${opt}! Brilliant math reasoning! 🌟`,
              () => {
                this.lcmIdx++;
                this.renderMathArena();
              }
            );
          } else {
            this.triggerSadEffect(btn);
          }
        };
        grid.appendChild(btn);
      });
      audio.speak(`Find the ${isHcf ? "HCF" : "LCM"} of ${p.num1} and ${p.num2}!`);
    }
  }

  // ----------------------------------------------------------
  // 13. 1000+ BRAIN SHARP ARCADE (CLASS 1 TO 5)
  // ----------------------------------------------------------
  openBrainSharpArcade() {
    if (this.player.grade && this.player.grade.startsWith("Class")) {
      this.brainClass = this.player.grade;
    } else {
      this.brainClass = "Class 1";
    }

    this.showScreen("screenBrainSharp");
    this.bindBrainSharpEvents();
    this.renderBrainQuestion();
    audio.speak("Welcome to 1000+ Brain Sharp Arcade! Select your class and sharpen your memory and logical thinking!");
  }

  bindBrainSharpEvents() {
    if (this.brainEventsBound) return;
    this.brainEventsBound = true;

    // Class Tabs
    document.querySelectorAll("#brainClassTabs .btn-pill-toggle").forEach(btn => {
      btn.onclick = () => {
        const cls = btn.dataset.class;
        this.setBrainClass(cls);
      };
    });

    // Category Chips
    document.querySelectorAll("#brainCategoryBar .btn-cat-chip").forEach(btn => {
      btn.onclick = () => {
        const cat = btn.dataset.cat;
        this.setBrainCategory(cat);
      };
    });

    // Speak Button
    const speakBtn = document.getElementById("btnSpeakBrainQuestion");
    if (speakBtn) {
      speakBtn.onclick = () => {
        audio.playClick();
        this.speakBrainQuestion();
      };
    }

    // Hint Button
    const hintBtn = document.getElementById("btnToggleBrainHint");
    if (hintBtn) {
      hintBtn.onclick = () => this.toggleBrainHint();
    }

    // Next Question Button
    const nextBtn = document.getElementById("btnNextBrainQuestion");
    if (nextBtn) {
      nextBtn.onclick = () => this.nextBrainQuestion();
    }
  }

  setBrainClass(cls) {
    audio.playClick();
    this.brainClass = cls;
    this.brainIdx = 0;
    this.brainAnswered = false;

    document.querySelectorAll("#brainClassTabs .btn-pill-toggle").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.class === cls);
    });

    this.renderBrainQuestion();
  }

  setBrainCategory(cat) {
    audio.playClick();
    this.brainCat = cat;
    this.brainIdx = 0;
    this.brainAnswered = false;

    document.querySelectorAll("#brainCategoryBar .btn-cat-chip").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.cat === cat);
    });

    this.renderBrainQuestion();
  }

  renderBrainQuestion() {
    this.brainAnswered = false;
    const q = getBrainSharpQuestion(this.brainClass, this.brainCat, this.brainIdx);
    this.currentBrainQ = q;

    // Update Counter & Scorecard
    const countEl = document.getElementById("brainQuestionCounter");
    if (countEl) countEl.textContent = `${this.brainIdx + 1} / 1000+`;

    this.updateBrainMeterUI();

    // Category Badge
    const catBadge = document.getElementById("brainCatBadge");
    const catLabels = {
      math: "⚡ Math Prodigy",
      logic: "🧩 Logic & Puzzles",
      science: "🔬 Science & Nature",
      words: "📚 Word Power",
      gk: "🌍 India & World GK"
    };
    if (catBadge) {
      catBadge.textContent = catLabels[q.category] || "🧠 Brain Sharp";
    }

    // Question Prompt & Subprompt
    const promptEl = document.getElementById("brainQuestionPrompt");
    if (promptEl) promptEl.textContent = q.q;

    const subEl = document.getElementById("brainQuestionSubprompt");
    if (subEl) subEl.textContent = q.hi_q || q.spoken || "";

    // Visual Shelf
    const shelf = document.getElementById("brainVisualShelf");
    if (shelf) {
      shelf.innerHTML = "";
      if (q.category === "math" && q.ans && typeof q.ans === "number" && q.ans <= 20) {
        for (let i = 0; i < Math.min(q.ans, 12); i++) {
          const item = document.createElement("span");
          item.className = "item-badge";
          item.textContent = "⭐";
          shelf.appendChild(item);
        }
      }
    }

    // Hint Box reset
    const hintBox = document.getElementById("brainHintBox");
    if (hintBox) {
      hintBox.style.display = "none";
      hintBox.textContent = `💡 Hint: ${q.hint || "Think step-by-step!"}`;
    }

    // Feedback Card reset
    const feedbackCard = document.getElementById("brainFeedbackCard");
    if (feedbackCard) feedbackCard.style.display = "none";

    // Options Grid
    const grid = document.getElementById("brainOptionsGrid");
    if (grid) {
      grid.innerHTML = "";
      q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-option brain-option-btn";
        btn.type = "button";
        btn.textContent = String(opt);
        btn.onclick = () => this.selectBrainAnswer(opt, btn);
        grid.appendChild(btn);
      });
    }

    // Voice announcement
    audio.speak(q.spoken || q.q);
  }

  updateBrainMeterUI() {
    const streakEl = document.getElementById("brainStreakCount");
    if (streakEl) streakEl.textContent = this.brainStreak;

    const scoreEl = document.getElementById("brainScoreTotal");
    if (scoreEl) scoreEl.textContent = this.brainScore;

    const rankEl = document.getElementById("brainRankTitle");
    if (rankEl) {
      if (this.brainScore >= 150) rankEl.textContent = "Grandmaster 👑";
      else if (this.brainScore >= 100) rankEl.textContent = "Super Scholar 🏆";
      else if (this.brainScore >= 50) rankEl.textContent = "Junior Genius 🌟";
      else if (this.brainScore >= 20) rankEl.textContent = "Sharp Mind 💡";
      else rankEl.textContent = "Curious Thinker 🚀";
    }
  }

  selectBrainAnswer(selectedOpt, btnEl) {
    if (this.brainAnswered) return;
    const q = this.currentBrainQ;
    if (!q) return;

    const isMatch = String(selectedOpt).trim().toLowerCase() === String(q.ans).trim().toLowerCase();

    if (isMatch) {
      this.brainAnswered = true;
      this.brainStreak++;
      this.brainScore += 10;
      this.addStars(10);
      this.updateBrainMeterUI();

      btnEl.style.background = "#22c55e";
      btnEl.style.color = "#ffffff";
      btnEl.style.borderColor = "#16a34a";

      const feedbackCard = document.getElementById("brainFeedbackCard");
      const statusEl = document.getElementById("brainFeedbackStatus");
      const explEl = document.getElementById("brainFeedbackExplanation");

      if (statusEl) statusEl.innerHTML = `<span>🎉</span> <strong>Correct! Outstanding Thinking!</strong>`;
      if (explEl) explEl.textContent = q.fact || `Correct answer is ${q.ans}! Brilliant work!`;
      if (feedbackCard) feedbackCard.style.display = "block";

      audio.playCorrect();
      setTimeout(() => {
        audio.speak(`Brilliant answer! ${q.fact || "You got it right!"}`);
      }, 350);

    } else {
      this.brainStreak = 0;
      this.updateBrainMeterUI();
      this.triggerSadEffect(btnEl, "Oops! That's not quite right. Try again!");
    }
  }

  nextBrainQuestion() {
    audio.playClick();
    this.brainAnswered = false;
    this.brainIdx++;
    this.renderBrainQuestion();
  }

  toggleBrainHint() {
    audio.playClick();
    const box = document.getElementById("brainHintBox");
    if (!box) return;
    const isShown = box.style.display === "block";
    box.style.display = isShown ? "none" : "block";
    if (!isShown && this.currentBrainQ) {
      audio.speak(`Hint: ${this.currentBrainQ.hint || "Take your time and think carefully!"}`);
    }
  }

  speakBrainQuestion() {
    if (this.currentBrainQ) {
      audio.speak(this.currentBrainQ.spoken || this.currentBrainQ.q);
    }
  }

  // ----------------------------------------------------------
  // 14. PRINTABLE WORKSHEETS CENTER
  // ----------------------------------------------------------
  openWorksheetsCenter() {
    this.showScreen("screenWorksheets");
    this.renderWorksheetsSelector();
    this.renderWorksheetPreview();
  }

  renderWorksheetsSelector() {
    const grid = document.getElementById("worksheetsSelectorGrid");
    if (!grid) return;
    grid.innerHTML = "";

    WORKSHEET_TEMPLATES.forEach((ws, idx) => {
      const card = document.createElement("div");
      card.className = `ws-selector-card ${idx === this.worksheetIdx ? "active" : ""}`;
      card.innerHTML = `
        <div style="font-size:0.8rem; text-transform:uppercase; color:#6366f1;">${ws.subject} • ${ws.grade}</div>
        <div style="font-size:1.05rem; margin-top:4px;">${ws.title}</div>
      `;
      card.onclick = () => {
        this.worksheetIdx = idx;
        document.querySelectorAll(".ws-selector-card").forEach((c, i) => c.classList.toggle("active", i === idx));
        audio.playClick();
        this.renderWorksheetPreview();
      };
      grid.appendChild(card);
    });
  }

  renderWorksheetPreview() {
    const ws = WORKSHEET_TEMPLATES[this.worksheetIdx % WORKSHEET_TEMPLATES.length];

    const studentEl = document.getElementById("wsStudentName");
    if (studentEl) studentEl.textContent = this.player.name || "Little Champion";

    const gradeEl = document.getElementById("wsStudentGrade");
    if (gradeEl) gradeEl.textContent = this.player.grade || "Class 2";

    const titleEl = document.getElementById("wsSheetTitle");
    if (titleEl) titleEl.textContent = `${ws.subject}: ${ws.title}`;

    const listEl = document.getElementById("wsQuestionsList");
    if (listEl) {
      listEl.innerHTML = "";
      ws.questions.forEach(q => {
        const div = document.createElement("div");
        div.style.padding = "6px 0";
        div.textContent = q;
        listEl.appendChild(div);
      });
    }
  }

  // ----------------------------------------------------------
  // 15. GLOBAL EVENT BINDINGS
  // ----------------------------------------------------------
  bindEvents() {
    // Brand and Home button
    const brand = document.getElementById("btnHomeBrand");
    if (brand) brand.onclick = () => { audio.playClick(); this.showScreen("screenHome"); };

    const btnHome = document.getElementById("btnHome");
    if (btnHome) btnHome.onclick = () => { audio.playClick(); this.showScreen("screenHome"); };

    // Voice Toggle Pill
    const voiceToggle = document.getElementById("btnVoiceToggle");
    if (voiceToggle) voiceToggle.onclick = () => this.toggleVoiceGender();

    // Sound Mute Toggle
    const soundToggle = document.getElementById("btnSoundToggle");
    if (soundToggle) {
      soundToggle.onclick = () => {
        const isMuted = audio.toggleMute();
        soundToggle.textContent = isMuted ? "🔇" : "🔊";
        if (!isMuted) audio.playClick();
      };
    }

    // Admin Studio Button
    const adminBtn = document.getElementById("btnAdminStudio");
    if (adminBtn) {
      adminBtn.onclick = () => {
        audio.playClick();
        this.openAdminStudio();
      };
    }

    // Phone Connect Modal
    const phoneBtn = document.getElementById("btnPhoneConnect");
    if (phoneBtn) {
      phoneBtn.onclick = () => {
        audio.playClick();
        const pModal = document.getElementById("phoneModal");
        const urlText = document.getElementById("phoneUrlText");
        const qrImg = document.getElementById("phoneQrImg");
        if (urlText && window.location.origin) {
          if (!window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1") && !window.location.origin.startsWith("file:")) {
            urlText.textContent = window.location.origin;
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}`;
          } else {
            urlText.textContent = "http://192.168.1.110:8000";
            if (qrImg) qrImg.src = "phone_qr.png";
          }
        }
        if (pModal) pModal.classList.add("active");
      };
    }

    const phoneClose = document.getElementById("btnClosePhoneModal");
    if (phoneClose) phoneClose.onclick = () => document.getElementById("phoneModal").classList.remove("active");

    const phoneGotIt = document.getElementById("btnPhoneModalGotIt");
    if (phoneGotIt) phoneGotIt.onclick = () => document.getElementById("phoneModal").classList.remove("active");

    // Profile Modal
    const profilePill = document.getElementById("headerProfilePill");
    if (profilePill) profilePill.onclick = () => { audio.playClick(); this.showProfileModal(); };

    const profileClose = document.getElementById("btnCloseProfileModal");
    if (profileClose) profileClose.onclick = () => this.hideProfileModal();

    // Avatar Selection in Modal
    document.querySelectorAll(".avatar-option").forEach(el => {
      el.onclick = () => {
        audio.playClick();
        document.querySelectorAll(".avatar-option").forEach(a => a.classList.remove("selected"));
        el.classList.add("selected");
        this.player.avatar = el.dataset.avatar;
      };
    });

    // Profile Form Submit
    const profileForm = document.getElementById("formProfile");
    if (profileForm) {
      profileForm.onsubmit = (e) => {
        e.preventDefault();
        audio.playClick();

        const nameIn = document.getElementById("inputKidName");
        const classIn = document.getElementById("selectKidClass");
        const voiceIn = document.getElementById("selectVoicePref");

        this.player.name = (nameIn ? nameIn.value.trim() : "") || "Champion";
        this.player.grade = classIn ? classIn.value : "Class 2";
        this.player.voicePref = voiceIn ? voiceIn.value : "auto";

        audio.setKidProfile(this.player.name, this.player.voicePref);
        this.saveProfile();
        this.updateVoiceHeaderUI();
        this.hideProfileModal();

        audio.speak(`Welcome ${this.player.name} from ${this.player.grade}! Let's play and learn!`);
      };
    }

    // Class Filter Quick Tabs
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.onclick = () => {
        audio.playClick();
        this.applyClassFilter(tab.dataset.filter);
      };
    });

    // Home Hub Cards Navigation
    const bindHubCard = (cardId, action) => {
      const card = document.getElementById(cardId);
      if (card) {
        card.onclick = () => { audio.playClick(); action(); };
      }
    };

    bindHubCard("cardTablesHub", () => this.openTablesExplorer());
    bindHubCard("cardAlphabetHub", () => { this.showScreen("screenAlphabetFlashcards"); this.renderAlphabetCard(); });
    bindHubCard("cardHindiHub", () => { this.showScreen("screenHindiVarnamala"); this.renderHindiCard(); });
    bindHubCard("cardCountingHub", () => { this.showScreen("screenCountingSafari"); this.renderCountingSafari(); });
    bindHubCard("cardColorsShapesHub", () => this.openColorsShapes());
    bindHubCard("cardPaintingHub", () => this.openPaintingStudio());
    bindHubCard("cardDictationHub", () => this.openDictationStudio());
    bindHubCard("cardMathHub", () => this.openMathArena("division"));
    bindHubCard("cardGkHub", () => this.openGkPuzzles());
    bindHubCard("cardBrainSharpHub", () => this.openBrainSharpArcade());
    bindHubCard("cardWorksheetHub", () => this.openWorksheetsCenter());

    // Tables Explorer Controls
    const btnTableLangEn = document.getElementById("btnTableLangEn");
    if (btnTableLangEn) btnTableLangEn.onclick = () => this.switchTableLang("en");

    const btnTableLangHi = document.getElementById("btnTableLangHi");
    if (btnTableLangHi) btnTableLangHi.onclick = () => this.switchTableLang("hi");

    const btnReciteTable = document.getElementById("btnReciteWholeTable");
    if (btnReciteTable) btnReciteTable.onclick = () => this.reciteWholeTable();

    const btnStopTable = document.getElementById("btnStopTableRecite");
    if (btnStopTable) btnStopTable.onclick = () => this.stopTableRecite();

    const btnTableQuiz = document.getElementById("btnTableQuizMode");
    if (btnTableQuiz) btnTableQuiz.onclick = () => this.startTableQuiz();

    // Alphabet Nav
    const btnAlphaPrev = document.getElementById("btnAlphaPrev");
    if (btnAlphaPrev) btnAlphaPrev.onclick = () => this.prevAlphabet();

    const btnAlphaNext = document.getElementById("btnAlphaNext");
    if (btnAlphaNext) btnAlphaNext.onclick = () => this.nextAlphabet();

    const btnAlphaSpeak = document.getElementById("btnAlphaSpeak");
    if (btnAlphaSpeak) btnAlphaSpeak.onclick = () => this.speakCurrentAlphabet();

    // Hindi Varnamala Nav & Pronunciation Game
    const btnHindiSwar = document.getElementById("btnHindiSwar");
    if (btnHindiSwar) btnHindiSwar.onclick = () => this.switchHindiType("swar");

    const btnHindiVyanjan = document.getElementById("btnHindiVyanjan");
    if (btnHindiVyanjan) btnHindiVyanjan.onclick = () => this.switchHindiType("vyanjan");

    const btnHindiGameTab = document.getElementById("btnHindiPronounceGameTab");
    if (btnHindiGameTab) btnHindiGameTab.onclick = () => this.switchHindiType("pronounce");

    const btnHindiListen = document.getElementById("btnHindiPronounceListen");
    if (btnHindiListen) btnHindiListen.onclick = () => { audio.playClick(); this.speakHindiPronouncePrompt(); };

    const btnHindiPrev = document.getElementById("btnHindiPrev");
    if (btnHindiPrev) btnHindiPrev.onclick = () => this.prevHindi();

    const btnHindiNext = document.getElementById("btnHindiNext");
    if (btnHindiNext) btnHindiNext.onclick = () => this.nextHindi();

    const btnHindiSpeak = document.getElementById("btnHindiSpeak");
    if (btnHindiSpeak) btnHindiSpeak.onclick = () => this.speakCurrentHindi();

    // Counting Safari Nav
    const btnCount1to100 = document.getElementById("btnCountMode1to100");
    if (btnCount1to100) btnCount1to100.onclick = () => this.switchCountMode("1to100");

    const btnCountTens = document.getElementById("btnCountModeTens");
    if (btnCountTens) btnCountTens.onclick = () => this.switchCountMode("tens");

    const btnCountPrev = document.getElementById("btnCountPrev");
    if (btnCountPrev) btnCountPrev.onclick = () => this.prevCounting();

    const btnCountNext = document.getElementById("btnCountNext");
    if (btnCountNext) btnCountNext.onclick = () => this.nextCounting();

    const btnCountSpeak = document.getElementById("btnCountSpeak");
    if (btnCountSpeak) btnCountSpeak.onclick = () => this.speakCurrentCounting();

    // Colors & Shapes Tabs
    const btnTabColors = document.getElementById("btnTabColors");
    if (btnTabColors) btnTabColors.onclick = () => this.switchColorShapeTab("colors");

    const btnTabShapes = document.getElementById("btnTabShapes");
    if (btnTabShapes) btnTabShapes.onclick = () => this.switchColorShapeTab("shapes");

    // Dictation Studio Language & Grade Buttons
    const btnDictEn = document.getElementById("btnDictLangEn");
    if (btnDictEn) btnDictEn.onclick = () => this.setDictationLanguage("en");

    const btnDictHi = document.getElementById("btnDictLangHi");
    if (btnDictHi) btnDictHi.onclick = () => this.setDictationLanguage("hi");

    document.querySelectorAll("#dictationClassBar .btn-pill-toggle").forEach(btn => {
      btn.onclick = () => this.setDictationGrade(btn.dataset.grade);
    });

    const btnDictListen = document.getElementById("btnDictationListen");
    if (btnDictListen) btnDictListen.onclick = () => { audio.playClick(); this.speakDictationWord(); };

    const btnCheckDict = document.getElementById("btnCheckDictation");
    if (btnCheckDict) btnCheckDict.onclick = () => this.checkDictationSpelling();

    const inputDict = document.getElementById("inputDictationWord");
    if (inputDict) {
      inputDict.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.checkDictationSpelling();
      });
    }

    const btnDictPrev = document.getElementById("btnDictationPrev");
    if (btnDictPrev) btnDictPrev.onclick = () => this.prevDictation();

    const btnDictNext = document.getElementById("btnDictationNext");
    if (btnDictNext) btnDictNext.onclick = () => this.nextDictation();

    // GK & Brain Riddles Tabs
    const btnTabGk = document.getElementById("btnTabGk");
    if (btnTabGk) btnTabGk.onclick = () => this.switchGkTab("gk");

    const btnTabRiddles = document.getElementById("btnTabRiddles");
    if (btnTabRiddles) btnTabRiddles.onclick = () => this.switchGkTab("riddles");

    // Math Arena Mode Pills
    const bindMathPill = (id, mode) => {
      const pill = document.getElementById(id);
      if (pill) {
        pill.onclick = () => {
          this.mathArenaMode = mode;
          document.querySelectorAll(".math-mode-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          audio.playClick();
          this.renderMathArena();
        };
      }
    };

    bindMathPill("pillMathDivision", "division");
    bindMathPill("pillMathMult", "mult");
    bindMathPill("pillMathAddSub", "addsub");
    bindMathPill("pillMathFindX", "findx");
    bindMathPill("pillMathFractions", "fractions");
    bindMathPill("pillMathLcmHcf", "lcmhcf");

    // Celebration Modal Next Button & Overlay Dismiss
    const btnCelebNext = document.getElementById("btnCelebrationNext");
    if (btnCelebNext) btnCelebNext.onclick = () => this.closeCelebration();

    const celebOverlay = document.getElementById("celebrationOverlay");
    if (celebOverlay) {
      celebOverlay.onclick = (e) => {
        if (e.target === celebOverlay) this.closeCelebration();
      };
    }
  }

  // ============================================================
  // 16. ADMIN STUDIO, CUSTOM POEMS & COURSES MANAGEMENT
  // ============================================================

  loadCustomContent() {
    let loadedPoems = getCustomPoems();
    let loadedCourses = getCustomCourses();

    if (loadedPoems.length > 0 || loadedCourses.length > 0) {
      this.customPoems = loadedPoems;
      this.customCourses = loadedCourses;
      syncRhymesData();
      this.renderHomeCustomCourses();
      return;
    }

    fetch("custom_content.json")
      .then(res => {
        if (!res.ok) throw new Error("No custom_content.json found");
        return res.json();
      })
      .then(data => {
        if (data.poems && Array.isArray(data.poems)) {
          this.customPoems = data.poems;
          localStorage.setItem(LC_STORAGE_POEMS, JSON.stringify(data.poems));
        }
        if (data.courses && Array.isArray(data.courses)) {
          this.customCourses = data.courses;
          localStorage.setItem(LC_STORAGE_COURSES, JSON.stringify(data.courses));
        }
        if (data.voiceSettings) {
          audio.saveVoiceSettings(data.voiceSettings);
        }
        syncRhymesData();
        this.renderHomeCustomCourses();
      })
      .catch(err => {
        syncRhymesData();
        this.renderHomeCustomCourses();
      });
  }

  syncToServer() {
    const payload = {
      poems: this.customPoems,
      courses: this.customCourses,
      voiceSettings: {
        engine: audio.voiceEngine,
        persona: audio.voicePersona,
        pitch: audio.voicePitch,
        rate: audio.voiceRate,
        elevenLabsApiKey: audio.elevenLabsConfig.apiKey,
        elevenLabsVoiceId: audio.elevenLabsConfig.voiceId,
        elevenLabsModelId: audio.elevenLabsConfig.modelId
      }
    };

    fetch("/api/save_content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  renderHomeCustomCourses() {
    const grid = document.getElementById("customCoursesGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!this.customCourses || this.customCourses.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.style.gridColumn = "1 / -1";
      emptyDiv.style.background = "#f8fafc";
      emptyDiv.style.padding = "24px";
      emptyDiv.style.borderRadius = "16px";
      emptyDiv.style.textAlign = "center";
      emptyDiv.style.border = "2px dashed #cbd5e1";
      emptyDiv.innerHTML = `
        <span style="font-size:2.4rem;">🪐 📚 🌿</span>
        <h4 style="margin:8px 0; color:#1e293b;">No extra topics created yet!</h4>
        <p style="font-size:0.9rem; color:#64748b; margin-bottom:14px;">Want to teach Solar System, Body Parts, Animals, Good Manners, or Math Tricks? Create your own custom topic in seconds!</p>
        <button type="button" class="btn-step-go" style="background:#8b5cf6;" onclick="app.openAdminStudio('tabCourses')">➕ Open Admin Studio to Add Topic</button>
      `;
      grid.appendChild(emptyDiv);
      return;
    }

    this.customCourses.forEach((c) => {
      const card = document.createElement("div");
      card.className = "custom-course-card";
      card.onclick = () => this.openCourseViewer(c.id);

      const subjectColors = {
        science: "#2563eb",
        morals: "#10b981",
        english: "#f59e0b",
        hindi: "#ea580c",
        maths: "#8b5cf6",
        gk: "#06b6d4"
      };
      const badgeBg = subjectColors[c.subject] || "#6366f1";

      card.innerHTML = `
        <span class="custom-course-badge" style="background:${badgeBg};">${(c.subject || "Topic").toUpperCase()}</span>
        <div class="custom-course-icon">${c.icon || "📚"}</div>
        <div class="custom-course-title">${c.title}</div>
        <div class="custom-course-hi">${c.hi_title || ""}</div>
        <div class="custom-course-desc">${c.description || ""}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; border-top:1px solid #e2e8f0;">
          <span style="font-size:0.8rem; font-weight:800; color:#64748b;">${c.cards ? c.cards.length : 0} Flashcards</span>
          <button type="button" class="btn-step-go" style="padding:6px 14px; font-size:0.8rem;">Play Topic ▶</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  openAdminStudio(tab = "voice") {
    audio.playClick();
    this.showScreen("screenAdmin");
    this.switchAdminTab(tab);
    this.populateVoiceSettingsUI();
    this.renderAdminPoemsList();
    this.renderAdminCoursesList();
  }

  switchAdminTab(tab) {
    this.adminTab = tab;
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

    const tabMap = {
      voice: { btn: "tabBtnAdminVoice", content: "adminContentVoice" },
      poems: { btn: "tabBtnAdminPoems", content: "adminContentPoems" },
      courses: { btn: "tabBtnAdminCourses", content: "adminContentCourses" },
      backup: { btn: "tabBtnAdminBackup", content: "adminContentBackup" }
    };

    const target = tabMap[tab] || tabMap.voice;
    const btnEl = document.getElementById(target.btn);
    const contentEl = document.getElementById(target.content);
    if (btnEl) btnEl.classList.add("active");
    if (contentEl) contentEl.classList.add("active");

    if (tab === "poems") this.renderAdminPoemsList();
    if (tab === "courses") this.renderAdminCoursesList();
  }

  populateVoiceSettingsUI() {
    const isEleven = audio.voiceEngine === "elevenlabs";
    const radioEleven = document.getElementById("radioEngineElevenLabs");
    const radioNatural = document.getElementById("radioEngineNatural");
    if (radioEleven) radioEleven.checked = isEleven;
    if (radioNatural) radioNatural.checked = !isEleven;

    const inputKey = document.getElementById("inputElevenKey");
    if (inputKey) inputKey.value = audio.elevenLabsConfig.apiKey || "";

    const selectVoice = document.getElementById("selectElevenVoice");
    const groupCustom = document.getElementById("groupCustomVoiceId");
    const inputCustom = document.getElementById("inputCustomVoiceId");

    const knownVoices = ["EXAVITQu4vr4xnSDxMaL", "21m00Tcm4TlvDq8ikWAM", "pNInz6obpgDQGcFmaJgB", "jsCqWAovK2LkecY7zXl4", "IKne3meq5aSn9X80BHx2"];
    if (selectVoice) {
      if (knownVoices.includes(audio.elevenLabsConfig.voiceId)) {
        selectVoice.value = audio.elevenLabsConfig.voiceId;
        if (groupCustom) groupCustom.style.display = "none";
      } else {
        selectVoice.value = "custom";
        if (groupCustom) groupCustom.style.display = "block";
        if (inputCustom) inputCustom.value = audio.elevenLabsConfig.voiceId || "";
      }
      selectVoice.onchange = () => {
        if (groupCustom) groupCustom.style.display = selectVoice.value === "custom" ? "block" : "none";
      };
    }

    const selectModel = document.getElementById("selectElevenModel");
    if (selectModel) selectModel.value = audio.elevenLabsConfig.modelId || "eleven_multilingual_v2";

    const selectPersona = document.getElementById("selectVoicePersona");
    if (selectPersona) selectPersona.value = audio.voicePersona || "sweet";

    const sliderPitch = document.getElementById("sliderVoicePitch");
    const labelPitch = document.getElementById("labelPitchVal");
    if (sliderPitch) {
      sliderPitch.value = audio.voicePitch || 1.12;
      if (labelPitch) labelPitch.textContent = sliderPitch.value;
    }

    const sliderRate = document.getElementById("sliderVoiceRate");
    const labelRate = document.getElementById("labelRateVal");
    if (sliderRate) {
      sliderRate.value = audio.voiceRate || 0.88;
      if (labelRate) labelRate.textContent = sliderRate.value;
    }

    this.onVoiceEngineChange();
  }

  onVoiceEngineChange() {
    const radioEleven = document.getElementById("radioEngineElevenLabs");
    const isEleven = radioEleven && radioEleven.checked;
    const elevenBox = document.getElementById("elevenLabsSettingsBox");
    if (elevenBox) {
      elevenBox.style.opacity = isEleven ? "1" : "0.5";
      elevenBox.style.pointerEvents = isEleven ? "auto" : "none";
    }
  }

  onPersonaChange() {
    const persona = document.getElementById("selectVoicePersona").value;
    const sliderPitch = document.getElementById("sliderVoicePitch");
    const sliderRate = document.getElementById("sliderVoiceRate");
    const labelPitch = document.getElementById("labelPitchVal");
    const labelRate = document.getElementById("labelRateVal");

    const presets = {
      sweet: { pitch: 1.14, rate: 0.88 },
      friendly: { pitch: 1.05, rate: 0.90 },
      cartoon: { pitch: 1.28, rate: 0.95 },
      gentle: { pitch: 0.96, rate: 0.84 }
    };

    const p = presets[persona] || presets.sweet;
    if (sliderPitch) { sliderPitch.value = p.pitch; if (labelPitch) labelPitch.textContent = p.pitch; }
    if (sliderRate) { sliderRate.value = p.rate; if (labelRate) labelRate.textContent = p.rate; }
  }

  toggleApiKeyVisibility() {
    const inputKey = document.getElementById("inputElevenKey");
    if (inputKey) {
      inputKey.type = inputKey.type === "password" ? "text" : "password";
    }
  }

  testVoiceNarration() {
    const phrase = document.getElementById("inputTestPhrase").value || "Hello Little Champion! Today we are learning something super exciting!";
    audio.playClick();
    audio.testVoice(phrase);
  }

  saveVoiceConfig() {
    const radioEleven = document.getElementById("radioEngineElevenLabs");
    const isEleven = radioEleven && radioEleven.checked;
    const apiKey = document.getElementById("inputElevenKey").value.trim();
    const selectVoice = document.getElementById("selectElevenVoice").value;
    const customVoiceId = document.getElementById("inputCustomVoiceId").value.trim();
    const finalVoiceId = selectVoice === "custom" ? (customVoiceId || "EXAVITQu4vr4xnSDxMaL") : selectVoice;
    const modelId = document.getElementById("selectElevenModel").value;
    const persona = document.getElementById("selectVoicePersona").value;
    const pitch = parseFloat(document.getElementById("sliderVoicePitch").value);
    const rate = parseFloat(document.getElementById("sliderVoiceRate").value);

    audio.saveVoiceSettings({
      engine: isEleven ? "elevenlabs" : "natural",
      persona,
      pitch,
      rate,
      elevenLabsApiKey: apiKey,
      elevenLabsVoiceId: finalVoiceId,
      elevenLabsModelId: modelId
    });

    this.syncToServer();
    audio.playClick();
    alert("🎉 Voice Settings Saved Successfully!\nSpeech will now use your selected narration style.");
  }

  renderAdminPoemsList() {
    const list = document.getElementById("adminPoemsList");
    const countEl = document.getElementById("adminPoemCount");
    if (!list) return;
    list.innerHTML = "";

    const allRhymes = syncRhymesData();
    if (countEl) countEl.textContent = allRhymes.length;

    allRhymes.forEach((p, idx) => {
      const isCustom = p.id && p.id.startsWith("poem_custom");
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.innerHTML = `
        <div class="admin-item-top">
          <div class="admin-item-icon">${p.icon || "⭐"}</div>
          <div class="admin-item-info">
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
              <span class="hub-badge" style="background:${isCustom ? '#10b981' : '#64748b'}; font-size:0.7rem; padding:2px 8px;">
                ${isCustom ? "🌟 Custom" : "Built-in"}
              </span>
              <span style="font-size:0.75rem; color:#64748b;">${p.category || "Rhyme"}</span>
            </div>
            <h4>${p.title}</h4>
            <p>${p.hi_title || ""} • ${p.lines ? p.lines.length : 0} lines</p>
          </div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-action-small" style="background:#eff6ff; color:#2563eb;" onclick="app.previewPoem(${idx})">
            ▶️ Listen
          </button>
          ${isCustom ? `
            <button type="button" class="btn-action-small" style="background:#fef3c7; color:#b45309;" onclick="app.openPoemForm('${p.id}')">
              ✏️ Edit
            </button>
            <button type="button" class="btn-action-small" style="background:#fef2f2; color:#dc2626;" onclick="app.deletePoem('${p.id}')">
              🗑️ Delete
            </button>
          ` : `
            <span style="font-size:0.75rem; color:#94a3b8; margin-left:auto; align-self:center;">Protected Default</span>
          `}
        </div>
      `;
      list.appendChild(card);
    });
  }

  previewPoem(idx) {
    audio.playClick();
    const allRhymes = syncRhymesData();
    const p = allRhymes[idx];
    if (p && p.lines && p.lines.length > 0) {
      audio.speak(`${p.title}. ${p.lines[0]}`);
    }
  }

  openPoemForm(editPoemId = null) {
    const panel = document.getElementById("adminPoemFormPanel");
    if (!panel) return;
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });

    const titleEl = document.getElementById("poemFormTitle");
    const editIdEl = document.getElementById("poemEditId");

    if (editPoemId) {
      const p = this.customPoems.find(x => x.id === editPoemId);
      if (p) {
        titleEl.textContent = "✏️ Edit Custom Poem";
        editIdEl.value = p.id;
        document.getElementById("poemInputTitle").value = p.title || "";
        document.getElementById("poemInputHiTitle").value = p.hi_title || "";
        document.getElementById("poemSelectLang").value = p.lang || "en";
        document.getElementById("poemInputCategory").value = p.category || "English Rhyme";
        document.getElementById("poemInputIcon").value = p.icon || "⭐";
        document.getElementById("poemSelectBg").value = p.bg || "linear-gradient(135deg, #0f172a, #1e3a8a)";
        document.getElementById("poemInputLines").value = p.lines ? p.lines.join("\n") : "";
        return;
      }
    }

    titleEl.textContent = "➕ Add New Poem";
    editIdEl.value = "";
    document.getElementById("poemInputTitle").value = "";
    document.getElementById("poemInputHiTitle").value = "";
    document.getElementById("poemSelectLang").value = "en";
    document.getElementById("poemInputCategory").value = "English Rhyme";
    document.getElementById("poemInputIcon").value = "⭐";
    document.getElementById("poemSelectBg").value = "linear-gradient(135deg, #0f172a, #1e3a8a)";
    document.getElementById("poemInputLines").value = "";
  }

  closePoemForm() {
    const panel = document.getElementById("adminPoemFormPanel");
    if (panel) panel.style.display = "none";
  }

  savePoem() {
    const title = document.getElementById("poemInputTitle").value.trim();
    const hiTitle = document.getElementById("poemInputHiTitle").value.trim();
    const lang = document.getElementById("poemSelectLang").value;
    const category = document.getElementById("poemInputCategory").value.trim() || "Rhyme";
    const icon = document.getElementById("poemInputIcon").value.trim() || "⭐";
    const bg = document.getElementById("poemSelectBg").value;
    const linesRaw = document.getElementById("poemInputLines").value;
    const editId = document.getElementById("poemEditId").value;

    if (!title) {
      alert("Please enter a Poem Title!");
      return;
    }

    const lines = linesRaw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      alert("Please enter at least 1 line for the poem!");
      return;
    }

    if (editId) {
      const idx = this.customPoems.findIndex(x => x.id === editId);
      if (idx !== -1) {
        this.customPoems[idx] = {
          id: editId,
          title,
          hi_title: hiTitle,
          lang,
          category,
          icon,
          bg,
          tuneMood: "happy",
          lines
        };
      }
    } else {
      const newPoem = {
        id: `poem_custom_${Date.now()}`,
        title,
        hi_title: hiTitle,
        lang,
        category,
        icon,
        bg,
        tuneMood: "happy",
        lines
      };
      this.customPoems.push(newPoem);
    }

    localStorage.setItem(LC_STORAGE_POEMS, JSON.stringify(this.customPoems));
    syncRhymesData();
    this.syncToServer();
    this.closePoemForm();
    this.renderAdminPoemsList();
    audio.playClick();
    alert("🎉 Poem saved successfully! It is now active in the Poems & Rhymes Stage.");
  }

  deletePoem(id) {
    if (!confirm("Are you sure you want to delete this custom poem?")) return;
    this.customPoems = this.customPoems.filter(x => x.id !== id);
    localStorage.setItem(LC_STORAGE_POEMS, JSON.stringify(this.customPoems));
    syncRhymesData();
    this.syncToServer();
    this.renderAdminPoemsList();
    audio.playClick();
  }

  renderAdminCoursesList() {
    const list = document.getElementById("adminCoursesList");
    const countEl = document.getElementById("adminCourseCount");
    if (!list) return;
    list.innerHTML = "";

    const courses = this.customCourses || [];
    if (countEl) countEl.textContent = courses.length;

    if (courses.length === 0) {
      list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#64748b;">No custom courses yet. Click '+ Create New Course' above!</div>`;
      return;
    }

    courses.forEach(c => {
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.innerHTML = `
        <div class="admin-item-top">
          <div class="admin-item-icon">${c.icon || "📚"}</div>
          <div class="admin-item-info">
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
              <span class="hub-badge" style="background:#8b5cf6; font-size:0.7rem; padding:2px 8px;">
                ${(c.subject || "Topic").toUpperCase()}
              </span>
              <span style="font-size:0.75rem; color:#64748b;">${c.grade === "all" ? "All Classes" : c.grade}</span>
            </div>
            <h4>${c.title}</h4>
            <p>${c.hi_title || ""} • ${c.cards ? c.cards.length : 0} flashcards</p>
          </div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-action-small" style="background:#eff6ff; color:#2563eb;" onclick="app.openCourseViewer('${c.id}')">
            ▶️ Open
          </button>
          <button type="button" class="btn-action-small" style="background:#fef3c7; color:#b45309;" onclick="app.openCourseForm('${c.id}')">
            ✏️ Edit
          </button>
          <button type="button" class="btn-action-small" style="background:#fef2f2; color:#dc2626;" onclick="app.deleteCourse('${c.id}')">
            🗑️ Delete
          </button>
        </div>
      `;
      list.appendChild(card);
    });
  }

  openCourseForm(editCourseId = null) {
    const panel = document.getElementById("adminCourseFormPanel");
    if (!panel) return;
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth" });

    const titleEl = document.getElementById("courseFormTitle");
    const editIdEl = document.getElementById("courseEditId");

    if (editCourseId) {
      const c = this.customCourses.find(x => x.id === editCourseId);
      if (c) {
        titleEl.textContent = "✏️ Edit Course / Topic";
        editIdEl.value = c.id;
        document.getElementById("courseInputTitle").value = c.title || "";
        document.getElementById("courseInputHiTitle").value = c.hi_title || "";
        document.getElementById("courseSelectSubject").value = c.subject || "science";
        document.getElementById("courseSelectGrade").value = c.grade || "all";
        document.getElementById("courseInputIcon").value = c.icon || "📚";
        document.getElementById("courseInputDesc").value = c.description || "";
        this.tempCourseCards = c.cards ? JSON.parse(JSON.stringify(c.cards)) : [];
        this.renderCourseCardsBuilder();
        return;
      }
    }

    titleEl.textContent = "➕ Create New Course / Topic";
    editIdEl.value = "";
    document.getElementById("courseInputTitle").value = "";
    document.getElementById("courseInputHiTitle").value = "";
    document.getElementById("courseSelectSubject").value = "science";
    document.getElementById("courseSelectGrade").value = "all";
    document.getElementById("courseInputIcon").value = "📚";
    document.getElementById("courseInputDesc").value = "";
    this.tempCourseCards = [
      { word: "Example Topic 1", subtitle: "Key Concept", emoji: "⭐", sentence: "This is a wonderful concept to learn!", spoken: "This is a wonderful concept to learn!" }
    ];
    this.renderCourseCardsBuilder();
  }

  closeCourseForm() {
    const panel = document.getElementById("adminCourseFormPanel");
    if (panel) panel.style.display = "none";
  }

  renderCourseCardsBuilder() {
    const list = document.getElementById("courseCardsBuilderList");
    const countEl = document.getElementById("courseCardCount");
    if (!list) return;
    list.innerHTML = "";
    if (countEl) countEl.textContent = this.tempCourseCards.length;

    this.tempCourseCards.forEach((card, idx) => {
      const row = document.createElement("div");
      row.style.background = "#ffffff";
      row.style.padding = "14px";
      row.style.borderRadius = "12px";
      row.style.border = "2px solid #e2e8f0";
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="color:#2563eb; font-size:0.9rem;">Card ${idx + 1}</strong>
          <button type="button" class="btn-action-small" style="background:#fee2e2; color:#ef4444;" onclick="app.removeCardFromBuilder(${idx})">✕ Remove</button>
        </div>
        <div style="display:grid; grid-template-columns:80px 1fr 1fr; gap:8px;">
          <div>
            <label style="font-size:0.75rem; color:#64748b;">Emoji:</label>
            <input type="text" class="form-input card-field-emoji" value="${card.emoji || "⭐"}" style="text-align:center;">
          </div>
          <div>
            <label style="font-size:0.75rem; color:#64748b;">Word / Title:</label>
            <input type="text" class="form-input card-field-word" value="${card.word || ""}" placeholder="e.g. Earth">
          </div>
          <div>
            <label style="font-size:0.75rem; color:#64748b;">Subtitle / Phonics:</label>
            <input type="text" class="form-input card-field-sub" value="${card.subtitle || ""}" placeholder="e.g. Blue Planet">
          </div>
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:0.75rem; color:#64748b;">Explanation Sentence:</label>
          <input type="text" class="form-input card-field-sentence" value="${card.sentence || ""}" placeholder="e.g. Earth has vast blue oceans and fresh air!">
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:0.75rem; color:#64748b;">Spoken Audio Narration:</label>
          <input type="text" class="form-input card-field-spoken" value="${card.spoken || ""}" placeholder="e.g. Earth is our home planet!">
        </div>
      `;
      list.appendChild(row);
    });
  }

  addEmptyCardToBuilder() {
    this.snapshotCurrentCardsFromBuilder();
    this.tempCourseCards.push({
      word: "",
      subtitle: "",
      emoji: "⭐",
      sentence: "",
      spoken: ""
    });
    this.renderCourseCardsBuilder();
  }

  removeCardFromBuilder(idx) {
    this.snapshotCurrentCardsFromBuilder();
    this.tempCourseCards.splice(idx, 1);
    this.renderCourseCardsBuilder();
  }

  snapshotCurrentCardsFromBuilder() {
    const list = document.getElementById("courseCardsBuilderList");
    if (!list) return;
    const rows = list.children;
    const cards = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      cards.push({
        emoji: r.querySelector(".card-field-emoji")?.value || "⭐",
        word: r.querySelector(".card-field-word")?.value || "",
        subtitle: r.querySelector(".card-field-sub")?.value || "",
        sentence: r.querySelector(".card-field-sentence")?.value || "",
        spoken: r.querySelector(".card-field-spoken")?.value || ""
      });
    }
    this.tempCourseCards = cards;
  }

  saveCourse() {
    this.snapshotCurrentCardsFromBuilder();

    const title = document.getElementById("courseInputTitle").value.trim();
    const hiTitle = document.getElementById("courseInputHiTitle").value.trim();
    const subject = document.getElementById("courseSelectSubject").value;
    const grade = document.getElementById("courseSelectGrade").value;
    const icon = document.getElementById("courseInputIcon").value.trim() || "📚";
    const description = document.getElementById("courseInputDesc").value.trim();
    const editId = document.getElementById("courseEditId").value;

    if (!title) {
      alert("Please enter a Course Title!");
      return;
    }

    if (this.tempCourseCards.length === 0) {
      alert("Please add at least 1 flashcard for this course!");
      return;
    }

    if (editId) {
      const idx = this.customCourses.findIndex(x => x.id === editId);
      if (idx !== -1) {
        this.customCourses[idx] = {
          id: editId,
          title,
          hi_title: hiTitle,
          subject,
          grade,
          icon,
          description,
          cards: this.tempCourseCards
        };
      }
    } else {
      const newCourse = {
        id: `course_custom_${Date.now()}`,
        title,
        hi_title: hiTitle,
        subject,
        grade,
        icon,
        description,
        cards: this.tempCourseCards
      };
      this.customCourses.push(newCourse);
    }

    localStorage.setItem(LC_STORAGE_COURSES, JSON.stringify(this.customCourses));
    this.syncToServer();
    this.closeCourseForm();
    this.renderAdminCoursesList();
    this.renderHomeCustomCourses();
    audio.playClick();
    alert("🎉 Course saved successfully! It is now live on the Home screen.");
  }

  deleteCourse(id) {
    if (!confirm("Are you sure you want to delete this custom course?")) return;
    this.customCourses = this.customCourses.filter(x => x.id !== id);
    localStorage.setItem(LC_STORAGE_COURSES, JSON.stringify(this.customCourses));
    this.syncToServer();
    this.renderAdminCoursesList();
    this.renderHomeCustomCourses();
    audio.playClick();
  }

  openCourseViewer(courseId) {
    const course = this.customCourses.find(c => c.id === courseId);
    if (!course || !course.cards || course.cards.length === 0) {
      alert("This course has no flashcards yet!");
      return;
    }

    audio.playClick();
    this.activeCourse = course;
    this.activeCourseCardIdx = 0;
    this.showScreen("screenCustomCourseViewer");

    document.getElementById("courseViewerTitle").textContent = `${course.icon || "🌟"} ${course.title}`;
    document.getElementById("courseViewerSubjectBadge").textContent = (course.subject || "Topic").toUpperCase();

    this.renderCurrentCourseCard();
  }

  renderCurrentCourseCard() {
    if (!this.activeCourse) return;
    const cards = this.activeCourse.cards;
    const card = cards[this.activeCourseCardIdx];
    if (!card) return;

    document.getElementById("courseViewerStepIndicator").textContent = `Card ${this.activeCourseCardIdx + 1} of ${cards.length}`;
    document.getElementById("courseCardEmoji").textContent = card.emoji || "⭐";
    document.getElementById("courseCardWord").textContent = card.word || "";
    document.getElementById("courseCardSub").textContent = card.subtitle || "";
    document.getElementById("courseCardSentence").textContent = card.sentence || "";

    const btnPrev = document.getElementById("btnCoursePrev");
    if (btnPrev) btnPrev.style.visibility = this.activeCourseCardIdx > 0 ? "visible" : "hidden";

    const btnNext = document.getElementById("btnCourseNext");
    if (btnNext) {
      btnNext.textContent = this.activeCourseCardIdx === cards.length - 1 ? "Finish Course 🎉" : "Next Card ▶";
    }

    setTimeout(() => {
      this.speakCurrentCourseCard();
    }, 150);
  }

  speakCurrentCourseCard() {
    if (!this.activeCourse) return;
    const card = this.activeCourse.cards[this.activeCourseCardIdx];
    if (!card) return;
    audio.playClick();
    const narration = card.spoken || card.sentence || card.word;
    audio.speak(narration);
  }

  rewardCourseCard() {
    audio.playClick();
    this.player.stars += 2;
    this.updateHeaderProfile();
    this.saveProfile();
    this.triggerCelebrationConfetti();
    alert("⭐ Awesome! +2 Stars earned for mastering this concept!");
  }

  nextCourseCard() {
    audio.playClick();
    if (!this.activeCourse) return;
    if (this.activeCourseCardIdx < this.activeCourse.cards.length - 1) {
      this.activeCourseCardIdx++;
      this.renderCurrentCourseCard();
    } else {
      this.openCelebrationModal(
        `Course Completed: ${this.activeCourse.title}!`,
        `Super job, Champion! You have completed all lessons in ${this.activeCourse.title} and mastered new concepts!`,
        5
      );
      this.onNextCelebrationAction = () => this.showScreen("screenHome");
    }
  }

  prevCourseCard() {
    audio.playClick();
    if (!this.activeCourse) return;
    if (this.activeCourseCardIdx > 0) {
      this.activeCourseCardIdx--;
      this.renderCurrentCourseCard();
    }
  }

  exportContentJson() {
    audio.playClick();
    const payload = {
      exportDate: new Date().toISOString(),
      voiceSettings: {
        engine: audio.voiceEngine,
        persona: audio.voicePersona,
        pitch: audio.voicePitch,
        rate: audio.voiceRate,
        elevenLabsApiKey: audio.elevenLabsConfig.apiKey,
        elevenLabsVoiceId: audio.elevenLabsConfig.voiceId,
        elevenLabsModelId: audio.elevenLabsConfig.modelId
      },
      poems: this.customPoems,
      courses: this.customCourses
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `little_champions_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importContentJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.poems && Array.isArray(parsed.poems)) {
          this.customPoems = parsed.poems;
          localStorage.setItem(LC_STORAGE_POEMS, JSON.stringify(parsed.poems));
        }
        if (parsed.courses && Array.isArray(parsed.courses)) {
          this.customCourses = parsed.courses;
          localStorage.setItem(LC_STORAGE_COURSES, JSON.stringify(parsed.courses));
        }
        if (parsed.voiceSettings) {
          audio.saveVoiceSettings(parsed.voiceSettings);
        }
        syncRhymesData();
        this.syncToServer();
        this.renderAdminPoemsList();
        this.renderAdminCoursesList();
        this.renderHomeCustomCourses();
        audio.playClick();
        alert("🎉 Backup file imported successfully! All custom courses & poems are restored.");
      } catch (err) {
        alert("Failed to parse JSON backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetCustomContent() {
    if (!confirm("Are you sure you want to reset custom courses and poems to defaults?")) return;
    localStorage.removeItem(LC_STORAGE_POEMS);
    localStorage.removeItem(LC_STORAGE_COURSES);
    this.customPoems = [];
    this.customCourses = [];
    syncRhymesData();
    this.loadCustomContent();
    audio.playClick();
    alert("Content reset to defaults successfully!");
  }
}

// Start application when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
