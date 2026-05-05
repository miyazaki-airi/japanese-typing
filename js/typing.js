const TypingEngine = {
  target: "",
  input: "",
  currentIndex: 0,
  isComplete: false,
  onInput: null,
  onComplete: null,

  init(targetRomaji, callbacks) {
    this.target = targetRomaji.toLowerCase();
    this.input = "";
    this.currentIndex = 0;
    this.isComplete = false;
    this.onInput = callbacks.onInput;
    this.onComplete = callbacks.onComplete;
    this.renderDisplay();
  },

  handleInput(value) {
    if (this.isComplete) return;

    this.input = value.toLowerCase();
    this.currentIndex = this.input.length;

    if (this.input === this.target) {
      this.isComplete = true;
      if (this.onComplete) this.onComplete(true);
    } else if (this.input.length >= this.target.length) {
      this.isComplete = true;
      if (this.onComplete) this.onComplete(false);
    }

    if (this.onInput) this.onInput(this.getCharStates());
    this.renderDisplay();
  },

  getCharStates() {
    const states = [];
    for (let i = 0; i < this.target.length; i++) {
      if (i < this.input.length) {
        states.push({
          char: this.target[i],
          correct: this.input[i] === this.target[i]
        });
      } else {
        states.push({ char: this.target[i], correct: null });
      }
    }
    return states;
  },

  renderDisplay() {
    const display = document.getElementById("typing-display");
    if (!display) return;

    const states = this.getCharStates();
    display.innerHTML = states.map(s => {
      if (s.correct === null) {
        return `<span class="char-pending">${s.char}</span>`;
      }
      return s.correct
        ? `<span class="char-correct">${s.char}</span>`
        : `<span class="char-wrong">${s.char}</span>`;
    }).join("");

    const input = document.getElementById("typing-input");
    if (input) {
      input.classList.remove("correct", "wrong");
      if (this.isComplete && this.input === this.target) {
        input.classList.add("correct");
      } else if (this.isComplete) {
        input.classList.add("wrong");
      }
    }
  },

  reset() {
    this.input = "";
    this.currentIndex = 0;
    this.isComplete = false;
    const input = document.getElementById("typing-input");
    if (input) {
      input.value = "";
      input.classList.remove("correct", "wrong");
      input.focus();
    }
    this.renderDisplay();
  }
};

const PracticeSession = {
  words: [],
  currentIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  results: [],
  jlpt: 5,
  onWordChange: null,
  onSessionComplete: null,

  init(jlpt, wordCount) {
    this.jlpt = jlpt;
    const allWords = getWordsByJlpt(jlpt);
    this.words = getRandomWords(allWords, wordCount || 10);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.results = [];
    return this.words.length > 0;
  },

  currentWord() {
    return this.words[this.currentIndex] || null;
  },

  nextWord() {
    this.currentIndex++;
    if (this.currentIndex >= this.words.length) {
      if (this.onSessionComplete) this.onSessionComplete(this.getStats());
      return null;
    }
    return this.currentWord();
  },

  recordResult(wordId, correct) {
    this.results.push({ wordId, correct });
    if (correct) this.correctCount++;
    else this.wrongCount++;
  },

  getStats() {
    const total = this.correctCount + this.wrongCount;
    return {
      correct: this.correctCount,
      wrong: this.wrongCount,
      total,
      accuracy: total > 0 ? Math.round((this.correctCount / total) * 100) : 0
    };
  },

  progress() {
    return {
      current: this.currentIndex + 1,
      total: this.words.length,
      percent: this.words.length > 0
        ? Math.round(((this.currentIndex + 1) / this.words.length) * 100)
        : 0
    };
  }
};
